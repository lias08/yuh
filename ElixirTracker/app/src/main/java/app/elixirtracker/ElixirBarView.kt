package app.elixirtracker

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.view.View

/** 10 Segmente, gefüllt nach Elixierstand. */
class ElixirBarView(ctx: Context) : View(ctx) {
    var value: Double = 0.0
        set(v) {
            if (field != v) {
                field = v; invalidate()
            }
        }

    private val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFF2A1F33.toInt() }
    private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFD63AF9.toInt() }
    private val partial = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x99D63AF9.toInt() }
    private val rect = RectF()

    override fun onDraw(canvas: Canvas) {
        val n = 10
        val gap = height * 0.25f
        val segW = (width - gap * (n - 1)) / n
        val r = height / 3f
        for (i in 0 until n) {
            val left = i * (segW + gap)
            rect.set(left, 0f, left + segW, height.toFloat())
            canvas.drawRoundRect(rect, r, r, bg)
            val f = (value - i).coerceIn(0.0, 1.0).toFloat()
            if (f > 0f) {
                rect.set(left, 0f, left + segW * f, height.toFloat())
                canvas.drawRoundRect(rect, r, r, if (f >= 1f) fill else partial)
            }
        }
    }
}
