package app.elixirtracker

import android.graphics.BitmapFactory
import android.graphics.Rect
import org.opencv.android.Utils
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc
import kotlin.math.max
import kotlin.math.min

/**
 * Sucht per Template-Matching (OpenCV) nach Karten-Icons, die erscheinen,
 * wenn der Gegner eine Karte ausspielt.
 *
 * @param scale Verhältnis Aufnahmebreite / echte Bildschirmbreite
 */
class ScreenAnalyzer(templates: List<CardTemplate>, private val scale: Double) {

    private class Tpl(val name: String, val mat: Mat)

    data class Result(val detections: List<String>, val bestName: String?, val bestScore: Double)

    private data class Hit(val name: String, val score: Double, val x: Int, val y: Int, val w: Int, val h: Int)

    private val templates: List<Tpl> = templates.mapNotNull { load(it) }
    val templateCount: Int get() = templates.size

    @Volatile var threshold = 0.78
    @Volatile var roiTop = 0.08
    @Volatile var roiBottom = 0.60
    /** Wenn gesetzt, wird nur nach diesen Karten gesucht (sobald das Deck bekannt ist). */
    @Volatile var restrictTo: Set<String>? = null
    /** Bereiche in echten Bildschirm-Pixeln, die ignoriert werden (unser eigenes Overlay). */
    @Volatile var masks: List<Rect> = emptyList()

    private val cooldownMs = 3000L
    private val lastSeen = HashMap<String, Long>()
    private val result = Mat()

    @Synchronized
    fun resetCooldowns() = lastSeen.clear()

    private fun load(t: CardTemplate): Tpl? {
        val bmp = BitmapFactory.decodeFile(t.file.path) ?: return null
        val rgba = Mat()
        Utils.bitmapToMat(bmp, rgba)
        val gray = Mat()
        Imgproc.cvtColor(rgba, gray, Imgproc.COLOR_RGBA2GRAY)
        rgba.release()
        val w = (gray.cols() * scale).toInt()
        val h = (gray.rows() * scale).toInt()
        if (w < 8 || h < 8) {
            gray.release(); return null
        }
        val scaled = Mat()
        Imgproc.resize(gray, scaled, Size(w.toDouble(), h.toDouble()), 0.0, 0.0, Imgproc.INTER_AREA)
        gray.release()
        return Tpl(t.name, scaled)
    }

    /** @param gray Graustufen-Frame in Aufnahme-Auflösung (wird verändert: Masken werden geschwärzt). */
    @Synchronized
    fun analyze(gray: Mat, nowMs: Long): Result {
        for (r in masks) {
            Imgproc.rectangle(
                gray,
                Point(r.left * scale, r.top * scale),
                Point(r.right * scale, r.bottom * scale),
                Scalar(0.0), -1,
            )
        }
        val y0 = (gray.rows() * roiTop).toInt().coerceIn(0, gray.rows() - 1)
        val y1 = (gray.rows() * roiBottom).toInt().coerceIn(y0 + 1, gray.rows())
        val roi = gray.submat(y0, y1, 0, gray.cols())

        val restrict = restrictTo
        val hits = mutableListOf<Hit>()
        var bestName: String? = null
        var bestScore = 0.0
        for (t in templates) {
            if (restrict != null && t.name !in restrict) continue
            if (t.mat.rows() > roi.rows() || t.mat.cols() > roi.cols()) continue
            Imgproc.matchTemplate(roi, t.mat, result, Imgproc.TM_CCOEFF_NORMED)
            val mm = Core.minMaxLoc(result)
            if (mm.maxVal > bestScore) {
                bestScore = mm.maxVal; bestName = t.name
            }
            if (mm.maxVal >= threshold) {
                hits += Hit(t.name, mm.maxVal, mm.maxLoc.x.toInt(), mm.maxLoc.y.toInt(), t.mat.cols(), t.mat.rows())
            }
        }
        roi.release()

        // Überlappende Treffer (ähnliche Karten) -> nur den besten behalten
        val accepted = mutableListOf<Hit>()
        for (h in hits.sortedByDescending { it.score }) {
            if (accepted.none { overlaps(it, h) }) accepted += h
        }
        val detections = mutableListOf<String>()
        for (h in accepted) {
            val prev = lastSeen[h.name]
            lastSeen[h.name] = nowMs
            if (prev == null || nowMs - prev > cooldownMs) detections += h.name
        }
        return Result(detections, bestName, bestScore)
    }

    private fun overlaps(a: Hit, b: Hit): Boolean {
        val ix = min(a.x + a.w, b.x + b.w) - max(a.x, b.x)
        val iy = min(a.y + a.h, b.y + b.h) - max(a.y, b.y)
        return ix > 0 && iy > 0 && ix * iy > 0.3 * min(a.w * a.h, b.w * b.h)
    }

    fun release() {
        templates.forEach { it.mat.release() }
        result.release()
    }
}
