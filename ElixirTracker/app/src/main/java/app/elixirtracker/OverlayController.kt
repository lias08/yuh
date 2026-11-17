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
    private val look: Look = Look(),
) {
    /** Aussehen/Position aus den Einstellungen. */
    data class Look(
        val scale: Float = 1f,
        val opacity: Float = 0.9f,
        val anchor: String = Anchor.TOP_LEFT.name,
        val x: Int = 0,
        val y: Int = 0,
    )

    enum class Anchor(val label: String, val gravity: Int) {
        TOP_LEFT("Oben links", Gravity.TOP or Gravity.LEFT),
        TOP_CENTER("Oben Mitte", Gravity.TOP or Gravity.CENTER_HORIZONTAL),
        TOP_RIGHT("Oben rechts", Gravity.TOP or Gravity.RIGHT),
        MID_LEFT("Mitte links", Gravity.CENTER_VERTICAL or Gravity.LEFT),
        MID_RIGHT("Mitte rechts", Gravity.CENTER_VERTICAL or Gravity.RIGHT),
        BOTTOM_LEFT("Unten links", Gravity.BOTTOM or Gravity.LEFT),
        BOTTOM_RIGHT("Unten rechts", Gravity.BOTTOM or Gravity.RIGHT);

        companion object {
            fun of(name: String) = entries.firstOrNull { it.name == name } ?: TOP_LEFT
        }
    }

    companion object {
        /** Standard-Abstand vom Rand für eine Ecke (px). */
        fun defaultOffset(anchor: Anchor, density: Float): Pair<Int, Int> {
            val x = if (anchor == Anchor.TOP_CENTER) 0 else (6 * density).toInt()
            val y = when (anchor.gravity and Gravity.VERTICAL_GRAVITY_MASK) {
                Gravity.TOP -> (70 * density).toInt()      // unter Statusleiste/Gegnername
                Gravity.BOTTOM -> (190 * density).toInt()  // über deiner Kartenleiste
                else -> 0
            }
            return x to y
        }
    }

    private val anchor = Anchor.of(look.anchor)
    private val scale = look.scale
    /** Beim Ziehen: rechts/unten verankerte Fenster zählen x/y vom rechten/unteren Rand. */
    private val signX = if ((anchor.gravity and Gravity.HORIZONTAL_GRAVITY_MASK) == Gravity.RIGHT) -1 else 1
    private val signY = if ((anchor.gravity and Gravity.VERTICAL_GRAVITY_MASK) == Gravity.BOTTOM) -1 else 1

    interface Listener {
        fun onCloseOverlay()
        fun onOverlayBoundsChanged()
        fun onOverlayMoved(x: Int, y: Int)
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
    private fun dp(v: Int) = (v * density * scale).toInt()

    private val root = LinearLayout(ctx)
    private val details = LinearLayout(ctx)
    private val elixirText = TextView(ctx)
    private val timerText = TextView(ctx)
    private val phaseBtn = button("x1") {}.apply { isClickable = false }
    private val minimizeBtn = button("–") { toggleMinimized() }
    private val bar = ElixirBarView(ctx)
    private val handSlots = List(4) { SlotView() }
    private val nextSlot = SlotView()
    private val lastText = TextView(ctx)
    private val statusText = TextView(ctx)
    private var minimized = false


    private val params = WindowManager.LayoutParams(
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
        PixelFormat.TRANSLUCENT,
    ).apply {
        gravity = anchor.gravity
        x = look.x
        y = look.y
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
        textSize = 13f * scale
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
        root.alpha = look.opacity
        root.setPadding(dp(8), dp(6), dp(8), dp(8))

        // Kopfzeile (zum Verschieben anfassen)
        val header = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        elixirText.apply {
            textSize = 26f * scale
            setTextColor(0xFFE68CFF.toInt())
            text = "5.0"
            minWidth = dp(52)
        }
        timerText.apply {
            textSize = 13f * scale
            setTextColor(0xFFCCCCCC.toInt())
            text = "--:--"
        }
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
                        params.x = px + signX * (e.rawX - sx).toInt()
                        params.y = py + signY * (e.rawY - sy).toInt()
                        wm.updateViewLayout(root, params)
                    }
                    MotionEvent.ACTION_UP -> {
                        if (abs(e.rawX - sx) < dp(4) && abs(e.rawY - sy) < dp(4)) toggleMinimized()
                        listener.onOverlayMoved(params.x, params.y)
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

        lastText.apply { textSize = 11f * scale; setTextColor(0xFFDDDDDD.toInt()) }
        details.addView(lastText, lp().apply { topMargin = dp(4) })


        statusText.apply { textSize = 10f * scale; setTextColor(0xFF999999.toInt()) }
        details.addView(statusText, lp().apply { topMargin = dp(4) })

        root.addView(details)
        root.viewTreeObserver.addOnGlobalLayoutListener { listener.onOverlayBoundsChanged() }
    }


    private fun label(t: String) = TextView(ctx).apply {
        text = t; textSize = 11f * scale; setTextColor(0xFFAAAAAA.toInt())
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
            textSize = 9f * scale
            setTextColor(0xFFFFFFFF.toInt())
            gravity = Gravity.CENTER
            maxLines = 2
            width = dp(46)
        }
        private var bound: String? = "<init>"

        init {
            view.addView(img, LinearLayout.LayoutParams(dp(34), dp(40)))
            view.addView(txt)
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
        phaseBtn.text = "x${ui.multiplier}"
        phaseBtn.setTextColor(
            when (ui.multiplier) {
                1 -> 0xFFFFFFFF.toInt(); 2 -> 0xFFFFC94D.toInt(); else -> 0xFFFF6B6B.toInt()
            },
        )
        timerText.text = if (!ui.running) "warte auf Match" else formatTime(ui.elapsedSec)
        ui.hand.forEachIndexed { i, c -> handSlots[i].bind(c) }
        nextSlot.bind(ui.next)
        lastText.text = ui.last
        statusText.text = ui.scanStatus + (ui.debug?.let { " · $it" } ?: "")
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
        for (v in listOf(root)) {
            if (!v.isAttachedToWindow || v.width == 0) continue
            val loc = IntArray(2)
            v.getLocationOnScreen(loc)
            list += Rect(loc[0], loc[1], loc[0] + v.width, loc[1] + v.height)
        }
        return list
    }
}
