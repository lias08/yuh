package app.elixirtracker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.WindowManager
import android.widget.Toast
import app.elixirtracker.logic.CardDatabase
import app.elixirtracker.logic.MatchState
import org.opencv.android.OpenCVLoader
import org.opencv.core.CvType
import org.opencv.core.Mat
import java.util.Locale

class TrackerService : Service(), OverlayController.Listener {

    companion object {
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_DATA = "data"
        const val ACTION_STOP = "app.elixirtracker.STOP"
        private const val CHANNEL = "tracker"
        private const val NOTIF_ID = 1
        private const val TAG = "ElixirTracker"

        @Volatile var isRunning = false
            private set
    }

    private val main = Handler(Looper.getMainLooper())
    private lateinit var wm: WindowManager
    private lateinit var prefs: Prefs
    private lateinit var overlay: OverlayController
    private lateinit var state: MatchState
    private var templateCosts: Map<String, Int> = emptyMap()

    private var projection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var worker: HandlerThread? = null
    @Volatile private var analyzer: ScreenAnalyzer? = null

    private var lastFrameMs = 0L
    private var frameBytes: ByteArray? = null
    private var rgba: Mat? = null

    private var bundled: List<BundledCard> = emptyList()
    private var bundledCosts: Map<String, Int> = emptyMap()

    // Automatische Match-Erkennung
    private var battleFirstSeen = 0L
    private var battleLastSeen = 0L
    private var autoRunning = false
    private val endGapMs = 6000L

    private var lastText = "Noch keine Karte erkannt"
    private var debugText: String? = null
    private var screenW = 0
    private var screenH = 0

    private val prefListener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        if (key in Prefs.OVERLAY_REBUILD_KEYS) rebuildOverlay() else applyPrefs()
    }
    private var thumbnailCache: Map<String, android.graphics.Bitmap> = emptyMap()

    private val ticker = object : Runnable {
        override fun run() {
            checkBattleEnd(now())
            renderUi()
            main.postDelayed(this, 100)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        wm = getSystemService(WindowManager::class.java)
        prefs = Prefs(this)
        val store = TemplateStore(this)
        templateCosts = store.all().associate { it.name to it.cost }
        bundled = BundledCards.load(this)
        bundledCosts = bundled.associate { it.name to it.elixir }
        state = MatchState(::costOf)

        val thumbH = (40 * resources.displayMetrics.density).toInt()
        val thumbs = HashMap<String, android.graphics.Bitmap>()
        for (c in bundled) {
            val b = BundledCards.bitmap(this, c.key) ?: continue
            val w = (b.width * thumbH.toFloat() / b.height).toInt().coerceAtLeast(1)
            thumbs[c.name] = android.graphics.Bitmap.createScaledBitmap(b, w, thumbH, true)
            if (b != thumbs[c.name]) b.recycle()
        }
        thumbs.putAll(store.thumbnails(thumbH)) // eigene Vorlagen haben Vorrang
        thumbnailCache = thumbs
        overlay = createOverlay()
        overlay.show()

        prefs.sp.registerOnSharedPreferenceChangeListener(prefListener)
        main.post(ticker)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        val data: Intent? = if (Build.VERSION.SDK_INT >= 33) {
            intent?.getParcelableExtra(EXTRA_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION") intent?.getParcelableExtra(EXTRA_DATA)
        }
        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0

        // Muss VOR getMediaProjection() passieren (Android 14+)
        goForeground(withProjection = data != null)

        if (data != null) {
            stopCapture() // evtl. alte Aufnahme beenden
            try {
                startCapture(resultCode, data)
            } catch (e: Exception) {
                Log.e(TAG, "Capture start failed", e)
                toast("Bildschirm-Scan konnte nicht starten: ${e.message}")
            }
        }
        return START_NOT_STICKY
    }

    private fun goForeground(withProjection: Boolean) {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "Elixir Tracker", NotificationManager.IMPORTANCE_LOW))
        val stopIntent = PendingIntent.getService(
            this, 0, Intent(this, TrackerService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE,
        )
        val openIntent = PendingIntent.getActivity(
            this, 1, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE,
        )
        val notif = Notification.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle("Elixir Tracker läuft")
            .setContentText(if (withProjection) "Bildschirm-Scan aktiv" else "Startet …")
            .setContentIntent(openIntent)
            .addAction(Notification.Action.Builder(null, "Beenden", stopIntent).build())
            .setOngoing(true)
            .build()
        when {
            Build.VERSION.SDK_INT >= 34 -> startForeground(
                NOTIF_ID, notif,
                if (withProjection) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
                else ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
            )
            Build.VERSION.SDK_INT >= 29 && withProjection -> startForeground(
                NOTIF_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
            )
            else -> startForeground(NOTIF_ID, notif)
        }
    }

    private fun createOverlay(): OverlayController {
        val anchor = OverlayController.Anchor.of(prefs.overlayAnchor)
        val (dx, dy) = OverlayController.defaultOffset(anchor, resources.displayMetrics.density)
        val look = OverlayController.Look(
            scale = prefs.overlayScale / 100f,
            opacity = prefs.overlayOpacity / 100f,
            anchor = anchor.name,
            x = prefs.overlayX.takeIf { it >= 0 } ?: dx,
            y = prefs.overlayY.takeIf { it >= 0 } ?: dy,
        )
        return OverlayController(this, wm, this, look).also { o ->
            o.thumbnails = thumbnailCache
            o.costOf = ::costOf
        }
    }

    /** Größe/Position/Transparenz geändert -> Fenster neu aufbauen (Match-Daten bleiben). */
    private fun rebuildOverlay() {
        overlay.hide()
        overlay = createOverlay()
        overlay.show()
        updateRestriction()
        renderUi()
    }

    // ------------------------------------------------------------------ Bildschirmaufnahme

    private fun startCapture(resultCode: Int, data: Intent) {
        if (!OpenCVLoader.initLocal()) {
            toast("OpenCV konnte nicht geladen werden – Erkennung nicht möglich")
            return
        }
        val templates = TemplateStore(this).all()

        val mpm = getSystemService(MediaProjectionManager::class.java)
        val mp = mpm.getMediaProjection(resultCode, data) ?: run {
            toast("Keine Aufnahme-Erlaubnis"); return
        }
        projection = mp
        mp.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                main.post { stopCapture() }
            }
        }, main)

        val (sw, sh) = realScreenSize()
        screenW = sw; screenH = sh
        val capW = minOf(360, sw)
        val capH = (sh.toLong() * capW / sw).toInt()
        val scale = capW.toDouble() / sw

        val thread = HandlerThread("analyzer").also { it.start() }
        worker = thread
        val handler = Handler(thread.looper)

        // Kartenbilder im Hintergrund laden und vorbereiten
        val cardList = bundled
        handler.post {
            val bitmaps = cardList.mapNotNull { c -> BundledCards.bitmap(this, c.key)?.let { c.name to it } }
            val a = ScreenAnalyzer(bitmaps, templates, capW, scale, prefs.lockedScale)
            bitmaps.forEach { it.second.recycle() }
            main.post {
                if (worker === thread) {
                    analyzer = a
                    applyPrefs()
                    onOverlayBoundsChanged()
                    toast("Scan aktiv – ${a.cardCount} Karten geladen. Match wird automatisch erkannt.")
                } else {
                    handler.post { a.release() }
                }
            }
        }

        val reader = ImageReader.newInstance(capW, capH, PixelFormat.RGBA_8888, 2)
        imageReader = reader
        reader.setOnImageAvailableListener({ r ->
            val img = try { r.acquireLatestImage() } catch (e: Exception) { null } ?: return@setOnImageAvailableListener
            try {
                val now = SystemClock.elapsedRealtime()
                if (now - lastFrameMs >= prefs.intervalMs) {
                    lastFrameMs = now
                    processFrame(img, now)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Frame error", e)
            } finally {
                img.close()
            }
        }, handler)

        virtualDisplay = mp.createVirtualDisplay(
            "ElixirTracker", capW, capH, resources.displayMetrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader.surface, null, null,
        )
    }

    private fun realScreenSize(): Pair<Int, Int> =
        if (Build.VERSION.SDK_INT >= 30) {
            val b = wm.maximumWindowMetrics.bounds
            b.width() to b.height()
        } else {
            val dm = android.util.DisplayMetrics()
            @Suppress("DEPRECATION") wm.defaultDisplay.getRealMetrics(dm)
            dm.widthPixels to dm.heightPixels
        }

    /** Läuft im Analyse-Thread. */
    private fun processFrame(img: android.media.Image, now: Long) {
        val a = analyzer ?: return
        val w = img.width
        val h = img.height
        val plane = img.planes[0]
        val buf = plane.buffer
        val rowStride = plane.rowStride
        val rowBytes = w * 4
        val bytes = frameBytes?.takeIf { it.size == rowBytes * h } ?: ByteArray(rowBytes * h).also { frameBytes = it }
        for (y in 0 until h) {
            buf.position(y * rowStride)
            buf.get(bytes, y * rowBytes, rowBytes)
        }
        val m = rgba?.takeIf { it.rows() == h && it.cols() == w } ?: Mat(h, w, CvType.CV_8UC4).also { rgba?.release(); rgba = it }
        m.put(0, 0, bytes)

        val res = a.analyze(m, now)
        if (res.interesting && prefs.saveDiagnostics) saveDiagnostic(m, res, now)
        main.post {
            onBattleState(res.battleVisible, now)
            if (res.lockedScale != prefs.lockedScale) prefs.lockedScale = res.lockedScale
            for (name in res.detections) onDetected(name)
            debugText = if (prefs.showDebug && res.bestName != null) {
                String.format(Locale.US, "bester Treffer: %s %.0f%%", res.bestName, res.bestScore * 100)
            } else null
        }
    }

    private var lastDiagMs = 0L
    private var diagCount = 0

    /** Speichert das (bereits maskierte) Bild nach Bilder/ElixirTracker – max. 40 pro Sitzung. Analyse-Thread. */
    private fun saveDiagnostic(frame: Mat, res: ScreenAnalyzer.Result, now: Long) {
        if (diagCount >= 40 || now - lastDiagMs < 2000) return
        lastDiagMs = now
        diagCount++
        try {
            val bmp = android.graphics.Bitmap.createBitmap(frame.cols(), frame.rows(), android.graphics.Bitmap.Config.ARGB_8888)
            org.opencv.android.Utils.matToBitmap(frame, bmp)
            val name = String.format(
                Locale.US, "et_%d_%s_%02.0f.png",
                System.currentTimeMillis(), (res.bestName ?: "none").replace(Regex("[^A-Za-z0-9]"), ""), res.bestScore * 100,
            )
            if (Build.VERSION.SDK_INT >= 29) {
                val values = android.content.ContentValues().apply {
                    put(android.provider.MediaStore.Images.Media.DISPLAY_NAME, name)
                    put(android.provider.MediaStore.Images.Media.MIME_TYPE, "image/png")
                    put(android.provider.MediaStore.Images.Media.RELATIVE_PATH, "Pictures/ElixirTracker")
                }
                val uri = contentResolver.insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return
                contentResolver.openOutputStream(uri)?.use { bmp.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
            } else {
                val dir = java.io.File(getExternalFilesDir(null), "diagnose").apply { mkdirs() }
                java.io.File(dir, name).outputStream().use { bmp.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
            }
            bmp.recycle()
        } catch (e: Exception) {
            Log.w(TAG, "Diagnose-Bild fehlgeschlagen", e)
        }
    }

    private fun stopCapture() {
        virtualDisplay?.release(); virtualDisplay = null
        imageReader?.setOnImageAvailableListener(null, null)
        imageReader?.close(); imageReader = null
        projection?.let { p -> projection = null; runCatching { p.stop() } }
        val w = worker
        worker = null
        val a = analyzer
        analyzer = null
        if (w != null) {
            // Analyzer im eigenen Thread freigeben, damit kein Frame mehr darauf zugreift
            Handler(w.looper).post { a?.release(); w.quitSafely() }
        } else {
            a?.release()
        }
    }

    private fun costOf(name: String): Int? =
        templateCosts[name] ?: bundledCosts[name] ?: CardDatabase.costOf(name)

    /** Läuft im Main-Thread nach jedem analysierten Frame. */
    private fun onBattleState(visible: Boolean, now: Long) {
        if (!visible) return
        if (now - battleLastSeen > endGapMs) battleFirstSeen = now // Match-Ansicht neu erschienen
        battleLastSeen = now
        if (!state.engine.running && !autoRunning && now - battleFirstSeen >= 1000) {
            autoRunning = true
            state.start(battleFirstSeen)
            state.engine.update(now)
            analyzer?.resetCooldowns()
            lastText = "Match erkannt – Gegner startet mit 5 Elixier"
            updateRestriction()
        }
    }

    /** Läuft im Ticker: Match vorbei, wenn die Match-Ansicht eine Weile fehlt. */
    private fun checkBattleEnd(now: Long) {
        if (autoRunning && analyzer != null && now - battleLastSeen > endGapMs) {
            autoRunning = false
            state.engine.stop()
            lastText = "Match beendet – warte auf nächstes Match"
        }
    }

    private fun applyPrefs() {
        analyzer?.apply {
            if (prefs.lockedScale < 0 && lockedScale >= 0) resetCalibration()
            roiTop = prefs.roiTop / 100.0
            roiBottom = prefs.roiBottom / 100.0
            threshold = prefs.threshold / 100.0
        }
    }

    // ------------------------------------------------------------------ Spiel-Logik

    private fun now() = SystemClock.elapsedRealtime()

    private fun onDetected(name: String) {
        val p = state.cardPlayed(name, now())
        lastText = "Zuletzt: ${p.card} (${p.cost})"
        updateRestriction()
        renderUi()
    }

    private fun updateRestriction() {
        val deck = state.cycle.deck
        analyzer?.restrictTo = if (state.cycle.deckComplete) deck.toSet() else null
    }

    private fun renderUi() {
        val now = now()
        val e = state.engine
        e.update(now)
        overlay.render(
            OverlayController.Ui(
                elixir = e.elixir,
                running = e.running,
                multiplier = e.multiplier(now),
                manualMultiplier = e.manualMultiplier != null,
                elapsedSec = e.elapsedSec(now),
                hand = state.cycle.hand(),
                next = state.cycle.next(),
                last = lastText,
                scanStatus = when {
                    analyzer != null -> "Scan an" +
                        (if ((analyzer?.lockedScale ?: -1) < 0) " · kalibriert noch" else "") +
                        " · Deck ${state.cycle.deck.size}/8"
                    else -> "Scan startet …"
                },
                debug = debugText,
            ),
        )
    }

    override fun onCloseOverlay() {
        stopSelf()
    }

    override fun onOverlayMoved(x: Int, y: Int) {
        prefs.saveDraggedPosition(x, y)
    }

    override fun onOverlayBoundsChanged() {
        analyzer?.masks = overlay.screenRects()
    }

    private fun toast(msg: String) {
        main.post { Toast.makeText(this, msg, Toast.LENGTH_LONG).show() }
    }

    override fun onDestroy() {
        isRunning = false
        main.removeCallbacks(ticker)
        prefs.sp.unregisterOnSharedPreferenceChangeListener(prefListener)
        stopCapture()
        overlay.hide()
        super.onDestroy()
    }
}
