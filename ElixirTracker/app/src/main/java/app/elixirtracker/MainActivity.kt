package app.elixirtracker

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.graphics.Typeface
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {

    private companion object {
        const val REQ_CAPTURE = 1
        const val REQ_IMPORT = 2
        const val REQ_NOTIF = 3
    }

    private lateinit var prefs: Prefs
    private lateinit var store: TemplateStore
    private lateinit var overlayStatus: TextView
    private lateinit var templateList: LinearLayout
    private lateinit var templateHeader: TextView

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)
        store = TemplateStore(this)
        setContentView(buildUi())
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQ_NOTIF)
        }
    }

    override fun onResume() {
        super.onResume()
        refreshOverlayStatus()
        refreshTemplates()
    }

    // ------------------------------------------------------------------ UI

    private fun buildUi(): View {
        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(20), dp(16), dp(32))
        }
        col.addView(TextView(this).apply {
            text = "Elixir Tracker"
            textSize = 26f
            setTypeface(typeface, Typeface.BOLD)
        })
        col.addView(text(
            "Schätzt das Elixier des Gegners und zeigt seine Hand-Karten an. " +
                "Hinweis: Hilfs-Tools während eines Matches können gegen die Nutzungsbedingungen von Supercell " +
                "verstoßen. Nutzung auf eigenes Risiko.",
            small = true,
        ))

        col.addView(heading("1. Berechtigung"))
        overlayStatus = text("")
        col.addView(overlayStatus)
        col.addView(button("Overlay-Berechtigung öffnen") {
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
        })

        col.addView(heading("2. Tracker"))
        col.addView(button("▶ Starten mit Bildschirm-Scan") { startWithScan() })
        col.addView(button("▶ Starten (nur manuell)") { startService(null, 0) })
        col.addView(button("■ Tracker beenden") {
            startService(Intent(this, TrackerService::class.java).setAction(TrackerService.ACTION_STOP))
        })

        col.addView(heading("3. Karten-Vorlagen"))
        col.addView(text(
            "Für die automatische Erkennung braucht die App ein Bild jeder Karte, so wie es erscheint, " +
                "wenn der GEGNER sie ausspielt. Mach im Match einen Screenshot, schneide das Karten-Symbol in der " +
                "Galerie aus und benenne die Datei nach der Karte, z.B. „Hog Rider.png“, „Schweinereiter.png“ " +
                "oder mit Kosten „Meine Karte_4.png“. Wichtig: Screenshots von DIESEM Handy verwenden.",
            small = true,
        ))
        col.addView(button("Bilder importieren …") {
            val i = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "image/*"
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            }
            startActivityForResult(i, REQ_IMPORT)
        })
        templateHeader = text("")
        col.addView(templateHeader)
        templateList = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        col.addView(templateList)

        col.addView(heading("4. Overlay: Größe & Position"))
        col.addView(text(
            "Wird sofort übernommen, wenn der Tracker läuft. Feinjustieren: Kopfzeile im Overlay mit dem Finger ziehen.",
            small = true,
        ))
        col.addView(slider("Größe", 50, 200, prefs.overlayScale, "%") { prefs.overlayScale = it })
        col.addView(slider("Deckkraft", 30, 100, prefs.overlayOpacity, "%") { prefs.overlayOpacity = it })
        col.addView(text("Position auf dem Bildschirm:"))
        positionButtons = OverlayController.Anchor.entries.map { a ->
            button(a.label) {
                prefs.setOverlayPosition(a.name, -1, -1) // -1 = Standard-Abstand für diese Ecke
                refreshPositionButtons()
            }
        }
        // Raster wie der Bildschirm: oben / mitte / unten
        val grid = listOf(
            listOf("TOP_LEFT", "TOP_CENTER", "TOP_RIGHT"),
            listOf("MID_LEFT", "", "MID_RIGHT"),
            listOf("BOTTOM_LEFT", "", "BOTTOM_RIGHT"),
        )
        for (row in grid) {
            val r = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            for (name in row) {
                val idx = OverlayController.Anchor.entries.indexOfFirst { it.name == name }
                val v: View = if (idx >= 0) positionButtons[idx] else View(this)
                r.addView(v, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            }
            col.addView(r)
        }
        refreshPositionButtons()

        col.addView(heading("5. Erkennung einstellen"))
        col.addView(slider("Scan-Bereich oben", 0, 60, prefs.roiTop, "%") { prefs.roiTop = it })
        col.addView(slider("Scan-Bereich unten", 30, 100, prefs.roiBottom, "%") { prefs.roiBottom = it })
        col.addView(slider("Erkennungs-Schwelle", 50, 99, prefs.threshold, "%") { prefs.threshold = it })
        col.addView(slider("Scan-Intervall", 100, 1000, prefs.intervalMs, " ms") { prefs.intervalMs = it })
        col.addView(CheckBox(this).apply {
            text = "Besten Treffer im Overlay anzeigen (zum Einstellen der Schwelle)"
            isChecked = prefs.showDebug
            setOnCheckedChangeListener { _, c -> prefs.showDebug = c }
        })

        col.addView(heading("Bedienung im Overlay"))
        col.addView(text(
            "• ▶ Start sofort drücken, wenn das Match beginnt (Gegner hat dann 5 Elixier).\n" +
                "• x1/x2/x3: Elixier-Phase. Ab 2:00 automatisch x2. Tippen = manuell wechseln, " +
                "lange drücken = zurück auf automatisch.\n" +
                "• −1 / +1: Schätzung korrigieren.\n" +
                "• Hand-Karte antippen = Gegner hat sie gespielt (manuell).\n" +
                "• ＋Karte: Karte aus Liste wählen (wenn nicht erkannt).\n" +
                "• ↶: letzte Karte rückgängig (bei Fehl-Erkennung).\n" +
                "• Kopfzeile ziehen = Fenster verschieben, antippen = ein-/ausklappen.\n\n" +
                "Hand-Logik: Die letzten 4 gespielten Karten sind nicht auf der Hand. Die älteste davon ist die " +
                "nächste Karte (→). Sobald alle 8 Karten gesehen wurden, ist die Hand komplett bekannt.\n\n" +
                "Nicht berücksichtigt: Elixiersammler, Elixir-Golem-Bonus und Spezialfälle wie Heldenfähigkeiten. " +
                "Dafür −1/+1 nutzen.",
            small = true,
        ))

        return ScrollView(this).apply { addView(col) }
    }

    private fun heading(t: String) = TextView(this).apply {
        text = t
        textSize = 18f
        setTypeface(typeface, Typeface.BOLD)
        setPadding(0, dp(20), 0, dp(6))
    }

    private fun text(t: String, small: Boolean = false) = TextView(this).apply {
        text = t
        textSize = if (small) 13f else 15f
        setPadding(0, dp(2), 0, dp(6))
    }

    private fun button(t: String, onClick: () -> Unit) = Button(this).apply {
        text = t
        isAllCaps = false
        setOnClickListener { onClick() }
    }

    private fun slider(label: String, min: Int, max: Int, value: Int, unit: String, onChange: (Int) -> Unit): View {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val lbl = text("$label: $value$unit")
        val sb = SeekBar(this).apply {
            this.max = max - min
            progress = value - min
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(s: SeekBar?, p: Int, fromUser: Boolean) {
                    lbl.text = "$label: ${p + min}$unit"
                    if (fromUser) onChange(p + min)
                }
                override fun onStartTrackingTouch(s: SeekBar?) {}
                override fun onStopTrackingTouch(s: SeekBar?) {}
            })
        }
        box.addView(lbl)
        box.addView(sb)
        return box
    }

    private var positionButtons: List<Button> = emptyList()

    private fun refreshPositionButtons() {
        val current = prefs.overlayAnchor
        OverlayController.Anchor.entries.forEachIndexed { i, a ->
            val b = positionButtons.getOrNull(i) ?: return@forEachIndexed
            b.text = if (a.name == current) "● ${a.label}" else a.label
        }
    }

    private fun refreshOverlayStatus() {
        val ok = Settings.canDrawOverlays(this)
        overlayStatus.text = if (ok) "✓ Overlay erlaubt" else "✗ Overlay nicht erlaubt – bitte erlauben"
    }

    private fun refreshTemplates() {
        val all = store.all()
        templateHeader.text = "${all.size} Vorlagen gespeichert" +
            if (TrackerService.isRunning) " (Tracker neu starten, damit Änderungen greifen)" else ""
        templateList.removeAllViews()
        for (t in all) {
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, dp(4), 0, dp(4))
            }
            val img = ImageView(this).apply {
                setImageBitmap(BitmapFactory.decodeFile(t.file.path))
                adjustViewBounds = true
            }
            row.addView(img, LinearLayout.LayoutParams(dp(40), dp(48)))
            row.addView(text("  ${t.name} (${t.cost})"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            row.addView(button("Löschen") {
                AlertDialog.Builder(this)
                    .setMessage("Vorlage „${t.name}“ löschen?")
                    .setPositiveButton("Löschen") { _, _ -> store.delete(t); refreshTemplates() }
                    .setNegativeButton("Abbrechen", null)
                    .show()
            })
            templateList.addView(row)
        }
    }

    // ------------------------------------------------------------------ Start

    private fun ensureOverlay(): Boolean {
        if (Settings.canDrawOverlays(this)) return true
        Toast.makeText(this, "Bitte zuerst die Overlay-Berechtigung erteilen", Toast.LENGTH_LONG).show()
        startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
        return false
    }

    private fun startWithScan() {
        if (!ensureOverlay()) return
        val mpm = getSystemService(MediaProjectionManager::class.java)
        startActivityForResult(mpm.createScreenCaptureIntent(), REQ_CAPTURE)
    }

    private fun startService(data: Intent?, resultCode: Int) {
        if (!ensureOverlay()) return
        val i = Intent(this, TrackerService::class.java)
        if (data != null) {
            i.putExtra(TrackerService.EXTRA_DATA, data)
            i.putExtra(TrackerService.EXTRA_RESULT_CODE, resultCode)
        }
        startForegroundService(i)
        moveTaskToBack(true)
    }

    @Deprecated("Activity API")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            REQ_CAPTURE -> {
                if (resultCode == RESULT_OK && data != null) {
                    startService(data, resultCode)
                } else {
                    Toast.makeText(this, "Bildschirmaufnahme abgelehnt", Toast.LENGTH_SHORT).show()
                }
            }
            REQ_IMPORT -> {
                if (resultCode != RESULT_OK || data == null) return
                val uris = mutableListOf<Uri>()
                data.clipData?.let { clip -> for (k in 0 until clip.itemCount) uris += clip.getItemAt(k).uri }
                data.data?.let { if (it !in uris) uris += it }
                val ok = mutableListOf<String>()
                val failed = mutableListOf<String>()
                for (u in uris) {
                    store.import(contentResolver, u)
                        .onSuccess { ok += it.name }
                        .onFailure { failed += (it.message ?: "Fehler") }
                }
                refreshTemplates()
                val msg = buildString {
                    if (ok.isNotEmpty()) append("Importiert: ${ok.joinToString()}")
                    if (failed.isNotEmpty()) {
                        if (isNotEmpty()) append("\n\n")
                        append("Fehler:\n• ${failed.joinToString("\n• ")}")
                    }
                }
                AlertDialog.Builder(this).setMessage(msg.ifEmpty { "Nichts importiert" })
                    .setPositiveButton("OK", null).show()
            }
        }
    }
}
