package app.elixirtracker

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Rect
import org.opencv.android.Utils
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import kotlin.math.max
import kotlin.math.min

/**
 * Erkennt automatisch:
 *  - ob gerade ein Match läuft (deine lila Elixier-Leiste unten ist sichtbar)
 *  - welche Karte der Gegner spielt
 *
 * Ablauf pro Bild (schnell genug für ~6 Bilder/s):
 *  1. Unterschied zum vorherigen Bild -> Stellen, an denen gerade etwas Neues erscheint
 *  2. Nur dort alle Kartenbilder (parallel auf allen Kernen) vergleichen
 *
 * Die Größe der Karten-Symbole auf deinem Bildschirm wird beim ersten sicheren Treffer
 * gefunden und gespeichert ("Kalibrierung").
 */
class ScreenAnalyzer(
    bundled: List<Pair<String, Bitmap>>,
    userTemplates: List<CardTemplate>,
    /** Breite des analysierten Frames (Aufnahme-Auflösung). */
    private val frameWidth: Int,
    /** Verhältnis Aufnahmebreite / echte Bildschirmbreite. */
    private val scale: Double,
    lockedScale: Int,
) {
    companion object {
        /** Mögliche Breiten des Karten-Symbols als Anteil der Bildschirmbreite. */
        val SCALES = doubleArrayOf(0.08, 0.09, 0.10, 0.11, 0.125, 0.14, 0.16, 0.18)

        // Innerer Bildausschnitt der Karte (ohne Rahmen)
        private const val CROP_X0 = 0.14
        private const val CROP_X1 = 0.86
        private const val CROP_Y0 = 0.11
        private const val CROP_Y1 = 0.80

        private const val MAX_CANDIDATES = 3

        // Gegen Fehl-Erkennungen (getestet an echtem Screenshot):
        /** Beste Karte muss so viel besser sein als die zweitbeste andere Karte. */
        private const val MIN_MARGIN = 0.05
        /** Farbvergleich (HSV-Histogramm) Bildausschnitt vs. Karte. */
        private const val MIN_COLOR = 0.25
        /** Karte muss in 2 Bildern hintereinander an derselben Stelle gefunden werden. */
        private const val CONFIRM_WINDOW_MS = 700L
    }

    data class Result(
        val detections: List<String>,
        val bestName: String?,
        val bestScore: Double,
        val battleVisible: Boolean,
        val lockedScale: Int,
        /** Für Diagnose-Bilder: Frame enthielt einen unsicheren oder sicheren Treffer. */
        val interesting: Boolean,
    )

    private class Card(val name: String, val gray: Mat, val color: Mat) {
        val perScale = arrayOfNulls<Mat>(SCALES.size)
        val histPerScale = arrayOfNulls<Mat>(SCALES.size)
    }

    private class Tpl(val name: String, val mat: Mat)

    private data class Hit(val name: String, val score: Double, val scaleIdx: Int, val x: Int, val y: Int, val w: Int, val h: Int)

    private val cards: List<Card> = bundled.mapNotNull { (name, bmp) -> cropCard(bmp)?.let { (g, c) -> Card(name, g, c) } }
    private val exact: List<Tpl> = userTemplates.mapNotNull { loadExact(it) }

    val cardCount: Int get() = cards.size + exact.size

    @Volatile var threshold = 0.78
    @Volatile var roiTop = 0.08
    @Volatile var roiBottom = 0.62
    /** Bereiche in echten Bildschirm-Pixeln, die ignoriert werden (unser Overlay). */
    @Volatile var masks: List<Rect> = emptyList()
    /** -1 = noch nicht kalibriert */
    @Volatile var lockedScale: Int = lockedScale
        private set

    private val threads = max(1, Runtime.getRuntime().availableProcessors() - 1)
    private val pool = Executors.newFixedThreadPool(threads)

    private val cooldownMs = 2500L
    private val lastSeen = HashMap<String, Long>()
    private val gray = Mat()
    private val prevGray = Mat()
    private val diff = Mat()
    private val hsv = Mat()
    private val pinkMask = Mat()
    private val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(5.0, 5.0))

    private val hsvPatch = Mat()
    private val rgbPatch = Mat()
    /** Unbestätigte Treffer: Name -> (Zeit, x, y) */
    private val pending = HashMap<String, Triple<Long, Int, Int>>()

    init {
        // Alle Größen vorab erzeugen, damit das erste Match nicht ruckelt
        for (c in cards) for (i in SCALES.indices) {
            c.perScale[i] = makeScaled(c, i)
            c.histPerScale[i] = c.perScale[i]?.let { g ->
                val col = Mat()
                Imgproc.resize(c.color, col, g.size(), 0.0, 0.0, Imgproc.INTER_AREA)
                hist(col).also { col.release() }
            }
        }
    }

    /** HSV-Histogramm (Farbton x Sättigung) eines RGB-Bildes. */
    private fun hist(rgb: Mat): Mat {
        val hsv = Mat()
        Imgproc.cvtColor(rgb, hsv, Imgproc.COLOR_RGB2HSV)
        val h = Mat()
        Imgproc.calcHist(
            listOf(hsv), org.opencv.core.MatOfInt(0, 1), Mat(), h,
            org.opencv.core.MatOfInt(16, 8), org.opencv.core.MatOfFloat(0f, 180f, 0f, 256f),
        )
        Core.normalize(h, h)
        hsv.release()
        return h
    }

    @Synchronized
    fun resetCooldowns() = lastSeen.clear()

    @Synchronized
    fun resetCalibration() {
        lockedScale = -1
    }

    // ------------------------------------------------------------------ Vorlagen

    /** Innerer Ausschnitt der Karte als (Graustufen, RGB). */
    private fun cropCard(bmp: Bitmap): Pair<Mat, Mat>? {
        val x0 = (bmp.width * CROP_X0).toInt()
        val y0 = (bmp.height * CROP_Y0).toInt()
        val w = (bmp.width * (CROP_X1 - CROP_X0)).toInt()
        val h = (bmp.height * (CROP_Y1 - CROP_Y0)).toInt()
        if (w < 8 || h < 8) return null
        val cropped = Bitmap.createBitmap(bmp, x0, y0, w, h)
        val rgba = Mat()
        Utils.bitmapToMat(cropped, rgba)
        val g = Mat()
        Imgproc.cvtColor(rgba, g, Imgproc.COLOR_RGBA2GRAY)
        val c = Mat()
        Imgproc.cvtColor(rgba, c, Imgproc.COLOR_RGBA2RGB)
        rgba.release()
        return g to c
    }

    private fun makeScaled(c: Card, scaleIdx: Int): Mat? {
        val w = (frameWidth * SCALES[scaleIdx] * (CROP_X1 - CROP_X0)).toInt()
        val h = (w * c.gray.rows().toDouble() / c.gray.cols()).toInt()
        if (w < 8 || h < 8) return null
        return Mat().also {
            Imgproc.resize(c.gray, it, Size(w.toDouble(), h.toDouble()), 0.0, 0.0, Imgproc.INTER_AREA)
        }
    }

    /** Eigene Vorlagen (Screenshot-Ausschnitte) haben schon die richtige Größe. */
    private fun loadExact(t: CardTemplate): Tpl? {
        val bmp = BitmapFactory.decodeFile(t.file.path) ?: return null
        val rgba = Mat()
        Utils.bitmapToMat(bmp, rgba)
        val g = Mat()
        Imgproc.cvtColor(rgba, g, Imgproc.COLOR_RGBA2GRAY)
        rgba.release()
        val w = (g.cols() * scale).toInt()
        val h = (g.rows() * scale).toInt()
        if (w < 8 || h < 8) {
            g.release(); return null
        }
        val s = Mat()
        Imgproc.resize(g, s, Size(w.toDouble(), h.toDouble()), 0.0, 0.0, Imgproc.INTER_AREA)
        g.release()
        return Tpl(t.name, s)
    }

    // ------------------------------------------------------------------ Analyse

    /** @param rgba Frame in Aufnahme-Auflösung (wird verändert: Overlay-Bereiche werden geschwärzt). */
    @Synchronized
    fun analyze(rgba: Mat, nowMs: Long): Result {
        for (r in masks) {
            Imgproc.rectangle(
                rgba,
                Point(r.left * scale, r.top * scale),
                Point(r.right * scale, r.bottom * scale),
                Scalar(0.0, 0.0, 0.0, 255.0), -1,
            )
        }
        val battle = battleUiVisible(rgba)
        Imgproc.cvtColor(rgba, gray, Imgproc.COLOR_RGBA2GRAY)
        if (!battle || prevGray.size() != gray.size()) {
            gray.copyTo(prevGray)
            return Result(emptyList(), null, 0.0, battle, lockedScale, false)
        }

        val y0 = (gray.rows() * roiTop).toInt().coerceIn(0, gray.rows() - 1)
        val y1 = (gray.rows() * roiBottom).toInt().coerceIn(y0 + 1, gray.rows())

        // 1. Wo erscheint gerade etwas Neues?
        val candidates = changedRegions(y0, y1)
        gray.copyTo(prevGray)

        // 2. Dort Kartenbilder vergleichen
        val scales: List<Int> =
            if (lockedScale >= 0) listOf(lockedScale - 1, lockedScale, lockedScale + 1).filter { it in SCALES.indices }
            else SCALES.indices.toList()
        val hits = mutableListOf<Hit>()
        var best: Hit? = null
        for (r in candidates) {
            val (h, second) = classify(r, scales) ?: continue
            if (best == null || h.score > best.score) best = h
            if (h.score >= threshold && h.score - second >= MIN_MARGIN && colorMatches(rgba, h)) hits += h
        }

        val b = best

        val accepted = mutableListOf<Hit>()
        for (h in hits.sortedByDescending { it.score }) {
            if (accepted.none { overlaps(it, h) }) accepted += h
        }
        val detections = mutableListOf<String>()
        pending.entries.removeAll { nowMs - it.value.first > CONFIRM_WINDOW_MS }
        for (h in accepted) {
            // Bestätigung: gleiche Karte kurz vorher an fast derselben Stelle?
            val p = pending[h.name]
            val confirmed = p != null && kotlin.math.abs(p.second - h.x) <= h.w / 2 && kotlin.math.abs(p.third - h.y) <= h.h / 2
            pending[h.name] = Triple(nowMs, h.x, h.y)
            if (!confirmed) continue
            val prev = lastSeen[h.name]
            lastSeen[h.name] = nowMs
            if (prev == null || nowMs - prev > cooldownMs) detections += h.name
            // Erste bestätigte Karte -> Symbol-Größe festhalten (Kalibrierung)
            if (lockedScale < 0 && h.scaleIdx >= 0) lockedScale = h.scaleIdx
        }
        val interesting = b != null && b.score >= 0.5
        return Result(detections, b?.name, b?.score ?: 0.0, true, lockedScale, interesting)
    }

    /** Rechtecke (Frame-Koordinaten), in denen sich seit dem letzten Bild viel geändert hat. */
    private fun changedRegions(y0: Int, y1: Int): List<org.opencv.core.Rect> {
        val cur = gray.submat(y0, y1, 0, gray.cols())
        val prev = prevGray.submat(y0, y1, 0, gray.cols())
        Core.absdiff(cur, prev, diff)
        cur.release(); prev.release()
        Imgproc.threshold(diff, diff, 40.0, 255.0, Imgproc.THRESH_BINARY)
        Imgproc.morphologyEx(diff, diff, Imgproc.MORPH_CLOSE, kernel)
        val contours = ArrayList<MatOfPoint>()
        val hier = Mat()
        Imgproc.findContours(diff, contours, hier, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE)
        hier.release()

        val minSide = frameWidth * SCALES.first() * 0.5
        val maxSide = frameWidth * SCALES.last() * 2.5
        val rects = contours.map { c -> Imgproc.boundingRect(c).also { c.release() } }
            .filter { it.width >= minSide && it.height >= minSide && it.width <= maxSide && it.height <= maxSide }
            .sortedByDescending { it.area() }
            .take(MAX_CANDIDATES)
        return rects.map { org.opencv.core.Rect(it.x, it.y + y0, it.width, it.height) }
    }

    /** Vergleicht alle (bzw. erlaubten) Karten in einem Fenster um [r]. Parallel. */
    private fun classify(r: org.opencv.core.Rect, scales: List<Int>): Pair<Hit, Double>? {
        val maxTplW = (frameWidth * SCALES[scales.last()] * (CROP_X1 - CROP_X0)).toInt()
        val margin = max(8, maxTplW / 3)
        val x0 = max(0, r.x - margin)
        val y0 = max(0, r.y - margin)
        val x1 = min(gray.cols(), r.x + r.width + margin)
        val y1 = min(gray.rows(), r.y + r.height + margin)
        if (x1 - x0 < 10 || y1 - y0 < 10) return null
        val window = gray.submat(y0, y1, x0, x1).clone()

        val jobs = ArrayList<Pair<String, Pair<Mat, Int>>>()
        for (c in cards) {
            for (s in scales) c.perScale[s]?.let { jobs += c.name to (it to s) }
        }
        for (t in exact) jobs += t.name to (t.mat to -1)
        if (jobs.isEmpty()) {
            window.release(); return null
        }

        val chunks = jobs.chunked(max(1, (jobs.size + threads - 1) / threads))
        val futures = chunks.map { chunk ->
            pool.submit(Callable {
                val res = Mat()
                // bester Treffer je Karte
                val perName = HashMap<String, Hit>()
                for ((name, p) in chunk) {
                    val (t, s) = p
                    if (t.rows() > window.rows() || t.cols() > window.cols()) continue
                    Imgproc.matchTemplate(window, t, res, Imgproc.TM_CCOEFF_NORMED)
                    val mm = Core.minMaxLoc(res)
                    val old = perName[name]
                    if (old == null || mm.maxVal > old.score) {
                        perName[name] = Hit(
                            name, mm.maxVal, s,
                            x0 + mm.maxLoc.x.toInt(), y0 + mm.maxLoc.y.toInt(), t.cols(), t.rows(),
                        )
                    }
                }
                res.release()
                perName
            })
        }
        val merged = HashMap<String, Hit>()
        for (f in futures) for ((n, h) in f.get()) {
            val old = merged[n]
            if (old == null || h.score > old.score) merged[n] = h
        }
        window.release()
        val sorted = merged.values.sortedByDescending { it.score }
        val best = sorted.firstOrNull() ?: return null
        val second = sorted.getOrNull(1)?.score ?: 0.0
        return best to second
    }

    /** Farbcheck: Bildausschnitt am Trefferort vs. Karte in gleicher Größe. */
    private fun colorMatches(rgba: Mat, h: Hit): Boolean {
        if (h.scaleIdx < 0) return true // eigene Vorlage
        val c = cards.firstOrNull { it.name == h.name } ?: return false
        val th = c.histPerScale[h.scaleIdx] ?: return false
        val x1 = min(rgba.cols(), h.x + h.w)
        val y1 = min(rgba.rows(), h.y + h.h)
        if (x1 - h.x < 4 || y1 - h.y < 4) return false
        val patch = rgba.submat(h.y, y1, h.x, x1)
        Imgproc.cvtColor(patch, rgbPatch, Imgproc.COLOR_RGBA2RGB)
        patch.release()
        val ph = hist(rgbPatch)
        val corr = Imgproc.compareHist(ph, th, Imgproc.HISTCMP_CORREL)
        ph.release()
        return corr >= MIN_COLOR
    }

    /**
     * Im Match ist unten deine lila/pinke Elixier-Leiste zu sehen.
     * Anteil kräftig magenta/lila Pixel (Farbton) im unteren Bildschirmstreifen.
     */
    private fun battleUiVisible(rgba: Mat): Boolean {
        val y0 = (rgba.rows() * 0.85).toInt()
        val y1 = (rgba.rows() * 0.995).toInt()
        if (y1 <= y0) return false
        val strip = rgba.submat(y0, y1, 0, rgba.cols())
        val rgb = Mat()
        Imgproc.cvtColor(strip, rgb, Imgproc.COLOR_RGBA2RGB)
        Imgproc.cvtColor(rgb, hsv, Imgproc.COLOR_RGB2HSV)
        rgb.release()
        // OpenCV-Farbton 0..180: lila/magenta ≈ 130..170
        Core.inRange(hsv, Scalar(130.0, 90.0, 110.0), Scalar(170.0, 255.0, 255.0), pinkMask)
        val ratio = Core.countNonZero(pinkMask).toDouble() / (strip.rows() * strip.cols())
        strip.release()
        return ratio > 0.008
    }

    private fun overlaps(a: Hit, b: Hit): Boolean {
        val ix = min(a.x + a.w, b.x + b.w) - max(a.x, b.x)
        val iy = min(a.y + a.h, b.y + b.h) - max(a.y, b.y)
        return ix > 0 && iy > 0 && ix * iy > 0.3 * min(a.w * a.h, b.w * b.h)
    }

    @Synchronized
    fun release() {
        pool.shutdownNow()
        cards.forEach { c ->
            c.gray.release(); c.color.release()
            c.perScale.forEach { it?.release() }; c.histPerScale.forEach { it?.release() }
        }
        hsvPatch.release(); rgbPatch.release()
        exact.forEach { it.mat.release() }
        listOf(gray, prevGray, diff, hsv, pinkMask, kernel).forEach { it.release() }
    }
}
