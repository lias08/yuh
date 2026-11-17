package app.elixirtracker

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import app.elixirtracker.logic.CardDatabase
import java.util.Locale
import kotlin.math.abs

/** Baut und aktualisiert das schwebende Fenster über dem Spiel. */
class OverlayController(
    private val ctx: Context,
    private val wm: WindowManager,
    private val listener: Listener,
) {
    interface Listener {
        fun onStartPressed()
        fun onPhasePressed()
        fun onPhaseLongPressed()
        fun onAdjust(delta: Double)
        fun onUndo()
        fun onCardChosen(name: String)
        fun onCloseOverlay()
        fun onOverlayBoundsChanged()
    }

    data class Ui(
        val elixir: Double,
        val running: Boolean,
        val multiplier: Int,
        val manualMultiplier: Boolean,
        val elapsedSec: Double,
        val hand: List<String?>,
        val next: String?,
        val last: String,
        val scanStatus: String,
        val debug: String?,
    )

    var thumbnails: Map<String, Bitmap> = emptyMap()
    var costOf: (String) -> Int? = { CardDatabase.costOf(it) }

    private val density = ctx.resources.displayMetrics.density
    private fun dp(v: Int) = (v * density).toInt()

    private val root = LinearLayout(ctx)
    private val details = LinearLayout(ctx)
    private val elixirText = TextView(ctx)
    private val timerText = TextView(ctx)
    private val phaseBtn = button("x1") { listener.onPhasePressed() }
    private val startBtn = button("▶ Start") { listener.onStartPressed() }
    private val minimizeBtn = button("–") { toggleMinimized() }
    private val bar = ElixirBarView(ctx)
    private val handSlots = List(4) { SlotView() }
    private val nextSlot = SlotView()
    private val lastText = TextView(ctx)
    private val statusText = TextView(ctx)
    private var minimized = false

    private var picker: View? = null

    private val params = WindowManager.LayoutParams(
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
        PixelFormat.TRANSLUCENT,
    ).apply {
        gravity = Gravity.TOP or Gravity.START
        x = dp(6)
        y = dp(90)
    }

    init {
        buildUi()
    }

    // ---------------------------------------------------------------- UI-Aufbau

    private fun panelBg() = GradientDrawable().apply {
        setColor(0xD9101018.toInt())
        cornerRadius = dp(14).toFloat()
        setStroke(dp(1), 0x66D63AF9)
    }

    private fun button(text: String, onClick: () -> Unit): TextView = TextView(ctx).apply {
        this.text = text
        setTextColor(0xFFFFFFFF.toInt())
        textSize = 13f
        gravity = Gravity.CENTER
        setPadding(dp(8), dp(4), dp(8), dp(4))
        background = GradientDrawable().apply {
            setColor(0xFF3A2A48.toInt()); cornerRadius = dp(8).toFloat()
        }
        setOnClickListener { onClick() }
    }

    private fun lp(w: Int = ViewGroup.LayoutParams.WRAP_CONTENT, h: Int = ViewGroup.LayoutParams.WRAP_CONTENT, ml: Int = 0) =
        LinearLayout.LayoutParams(w, h).apply { leftMargin = ml }

    @SuppressLint("ClickableViewAccessibility")
    private fun buildUi() {
        root.orientation = LinearLayout.VERTICAL
        root.background = panelBg()
        root.setPadding(dp(8), dp(6), dp(8), dp(8))

        // Kopfzeile (zum Verschieben anfassen)
        val header = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        elixirText.apply {
            textSize = 26f
            setTextColor(0xFFE68CFF.toInt())
            text = "5.0"
            minWidth = dp(52)
        }
        timerText.apply {
            textSize = 13f
            setTextColor(0xFFCCCCCC.toInt())
            text = "--:--"
        }
        phaseBtn.setOnLongClickListener { listener.onPhaseLongPressed(); true }
        header.addView(elixirText)
        header.addView(phaseBtn, lp(ml = dp(6)))
        header.addView(timerText, lp(ml = dp(8)))
        header.addView(View(ctx), LinearLayout.LayoutParams(0, 1, 1f))
        header.addView(minimizeBtn, lp(ml = dp(6)))
        header.addView(button("✕") { listener.onCloseOverlay() }, lp(ml = dp(4)))
        root.addView(header, lp(w = dp(300)))

        header.setOnTouchListener(object : View.OnTouchListener {
            var sx = 0f; var sy = 0f; var px = 0; var py = 0
            override fun onTouch(v: View, e: MotionEvent): Boolean {
                when (e.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        sx = e.rawX; sy = e.rawY; px = params.x; py = params.y
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = px + (e.rawX - sx).toInt()
                        params.y = py + (e.rawY - sy).toInt()
                        wm.updateViewLayout(root, params)
                    }
                    MotionEvent.ACTION_UP -> {
                        if (abs(e.rawX - sx) < dp(4) && abs(e.rawY - sy) < dp(4)) toggleMinimized()
                        listener.onOverlayBoundsChanged()
                    }
                }
                return true
            }
        })

        // Details
        details.orientation = LinearLayout.VERTICAL
        details.addView(bar, lp(w = dp(300), h = dp(10)).apply { topMargin = dp(4) })

        val handRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        handRow.addView(label("Hand"))
        handSlots.forEach { handRow.addView(it.view, lp(ml = dp(4))) }
        handRow.addView(label("→"), lp(ml = dp(4)))
        handRow.addView(nextSlot.view, lp(ml = dp(2)))
        nextSlot.view.alpha = 0.7f
        details.addView(handRow, lp().apply { topMargin = dp(6) })

        lastText.apply { textSize = 11f; setTextColor(0xFFDDDDDD.toInt()) }
        details.addView(lastText, lp().apply { topMargin = dp(4) })

        val controls = LinearLayout(ctx).apply { orientation = LinearLayout.HORIZONTAL }
        controls.addView(startBtn)
        controls.addView(button("−1") { listener.onAdjust(-1.0) }, lp(ml = dp(4)))
        controls.addView(button("+1") { listener.onAdjust(1.0) }, lp(ml = dp(4)))
        controls.addView(button("↶") { listener.onUndo() }, lp(ml = dp(4)))
        controls.addView(button("＋Karte") { openPicker() }, lp(ml = dp(4)))
        details.addView(controls, lp().apply { topMargin = dp(6) })

        statusText.apply { textSize = 10f; setTextColor(0xFF999999.toInt()) }
        details.addView(statusText, lp().apply { topMargin = dp(4) })

        root.addView(details)
        root.viewTreeObserver.addOnGlobalLayoutListener { listener.onOverlayBoundsChanged() }
    }

    private var currentDeck: List<String> = emptyList()

    private fun label(t: String) = TextView(ctx).apply {
        text = t; textSize = 11f; setTextColor(0xFFAAAAAA.toInt())
    }

    private inner class SlotView {
        val view = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GradientDrawable().apply {
                setColor(0xFF221A2A.toInt()); cornerRadius = dp(6).toFloat()
            }
            setPadding(dp(2), dp(2), dp(2), dp(2))
            minimumWidth = dp(46)
        }
        private val img = ImageView(ctx)
        private val txt = TextView(ctx).apply {
            textSize = 9f
            setTextColor(0xFFFFFFFF.toInt())
            gravity = Gravity.CENTER
            maxLines = 2
            width = dp(46)
        }
        private var bound: String? = "<init>"

        init {
            view.addView(img, LinearLayout.LayoutParams(dp(34), dp(40)))
            view.addView(txt)
            view.setOnClickListener { bound?.let { listener.onCardChosen(it) } }
        }

        fun bind(name: String?) {
            if (name == bound) return
            bound = name
            val thumb = name?.let { thumbnails[it] }
            if (thumb != null) {
                img.setImageBitmap(thumb); img.visibility = View.VISIBLE
            } else {
                img.setImageDrawable(null); img.visibility = if (name == null) View.VISIBLE else View.GONE
            }
            txt.text = when (name) {
                null -> "?"
                else -> "$name\n(${costOf(name) ?: "?"})"
            }
        }
    }

    // ---------------------------------------------------------------- öffentlich

    fun show() {
        wm.addView(root, params)
    }

    fun hide() {
        closePicker()
        runCatching { wm.removeView(root) }
    }

    private fun toggleMinimized() {
        minimized = !minimized
        details.visibility = if (minimized) View.GONE else View.VISIBLE
        minimizeBtn.text = if (minimized) "+" else "–"
    }

    fun render(ui: Ui) {
        elixirText.text = String.format(Locale.US, "%.1f", ui.elixir)
        bar.value = ui.elixir
        phaseBtn.text = "x${ui.multiplier}" + if (ui.manualMultiplier) "*" else ""
        phaseBtn.setTextColor(
            when (ui.multiplier) {
                1 -> 0xFFFFFFFF.toInt(); 2 -> 0xFFFFC94D.toInt(); else -> 0xFFFF6B6B.toInt()
            },
        )
        timerText.text = if (!ui.running) "bereit" else formatTime(ui.elapsedSec)
        startBtn.text = if (ui.running) "↺ Neu" else "▶ Start"
        ui.hand.forEachIndexed { i, c -> handSlots[i].bind(c) }
        nextSlot.bind(ui.next)
        lastText.text = ui.last
        statusText.text = ui.scanStatus + (ui.debug?.let { " · $it" } ?: "")
    }

    fun setDeck(deck: List<String>) {
        currentDeck = deck
    }

    private fun formatTime(elapsed: Double): String {
        val e = elapsed.toInt()
        return if (e < 180) {
            val left = 180 - e
            "%d:%02d".format(left / 60, left % 60)
        } else {
            val ot = e - 180
            "VL +%d:%02d".format(ot / 60, ot % 60)
        }
    }

    /** Bildschirmbereiche unserer Fenster (werden beim Scannen ausgeblendet). */
    fun screenRects(): List<Rect> {
        val list = mutableListOf<Rect>()
        for (v in listOfNotNull(root, picker)) {
            if (!v.isAttachedToWindow || v.width == 0) continue
            val loc = IntArray(2)
            v.getLocationOnScreen(loc)
            list += Rect(loc[0], loc[1], loc[0] + v.width, loc[1] + v.height)
        }
        return list
    }

    // ---------------------------------------------------------------- Karten-Auswahl

    private fun openPicker() {
        if (picker != null) {
            closePicker(); return
        }
        val dm = ctx.resources.displayMetrics
        val panel = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            background = panelBg()
            setPadding(dp(10), dp(8), dp(10), dp(8))
        }
        val head = LinearLayout(ctx).apply { gravity = Gravity.CENTER_VERTICAL }
        head.addView(TextView(ctx).apply {
            text = "Welche Karte hat der Gegner gespielt?"
            setTextColor(0xFFFFFFFF.toInt()); textSize = 14f
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        head.addView(button("✕") { closePicker() })
        panel.addView(head)

        val list = LinearLayout(ctx).apply { orientation = LinearLayout.VERTICAL }
        fun section(title: String, names: List<String>) {
            if (names.isEmpty()) return
            list.addView(TextView(ctx).apply {
                text = title; setTextColor(0xFFE68CFF.toInt()); textSize = 12f
                setPadding(0, dp(8), 0, dp(2))
            })
            names.chunked(3).forEach { row ->
                val r = LinearLayout(ctx).apply { orientation = LinearLayout.HORIZONTAL }
                row.forEach { n ->
                    val cost = costOf(n)
                    val label = if (cost == null || cost < 0) n else "$n ($cost)"
                    r.addView(
                        button(label) { listener.onCardChosen(n); closePicker() }.apply { textSize = 11f },
                        LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                            setMargins(dp(2), dp(2), dp(2), dp(2))
                        },
                    )
                }
                repeat(3 - row.size) { r.addView(View(ctx), LinearLayout.LayoutParams(0, 1, 1f)) }
                list.addView(r)
            }
        }
        section("Bekanntes Deck", currentDeck)
        val withTemplates = thumbnails.keys.filter { it !in currentDeck }.sorted()
        section("Mit Vorlage", withTemplates)
        val rest = CardDatabase.cards
            .filter { it.name !in currentDeck && it.name !in withTemplates }
            .sortedWith(compareBy({ if (it.cost < 0) 99 else it.cost }, { it.name }))
            .map { it.name }
        section("Alle Karten", rest)

        val scroll = ScrollView(ctx).apply { addView(list) }
        panel.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        val p = WindowManager.LayoutParams(
            (dm.widthPixels * 0.94).toInt(),
            (dm.heightPixels * 0.6).toInt(),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT,
        ).apply { gravity = Gravity.CENTER }
        wm.addView(panel, p)
        picker = panel
        listener.onOverlayBoundsChanged()
    }

    private fun closePicker() {
        picker?.let { runCatching { wm.removeView(it) } }
        picker = null
        listener.onOverlayBoundsChanged()
    }
}
