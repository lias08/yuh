package app.elixirtracker

import android.graphics.Bitmap
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
 * Erkennt automatisch:
 *  - ob gerade ein Match läuft (deine lila Elixier-Leiste unten ist sichtbar)
 *  - welche Karte der Gegner spielt (Template-Matching mit den mitgelieferten Kartenbildern)
 *
 * Die Größe, in der Karten-Symbole auf deinem Bildschirm erscheinen, ist vorher unbekannt.
 * Deshalb werden mehrere Größen durchprobiert; nach dem ersten sicheren Treffer wird die
 * Größe festgehalten ("kalibriert") und gespeichert.
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
        val SCALES = doubleArrayOf(0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.125, 0.14, 0.16, 0.18)

        // Innerer Bildausschnitt der Karte (ohne Rahmen)
        private const val CROP_X0 = 0.14
        private const val CROP_X1 = 0.86
        private const val CROP_Y0 = 0.11
        private const val CROP_Y1 = 0.80
    }

    data class Result(
        val detections: List<String>,
        val bestName: String?,
        val bestScore: Double,
        val battleVisible: Boolean,
        val lockedScale: Int,
    )

    private class Card(val name: String, val gray: Mat) {
        val perScale = HashMap<Int, Mat?>()
    }

    private class Tpl(val name: String, val mat: Mat)

    private data class Hit(val name: String, val score: Double, val x: Int, val y: Int, val w: Int, val h: Int)

    private val cards: List<Card> = bundled.mapNotNull { (name, bmp) -> cropGray(bmp)?.let { Card(name, it) } }
    private val exact: List<Tpl> = userTemplates.mapNotNull { loadExact(it) }

    val cardCount: Int get() = cards.size + exact.size

    @Volatile var threshold = 0.78
    @Volatile var roiTop = 0.08
    @Volatile var roiBottom = 0.55
    @Volatile var restrictTo: Set<String>? = null
    /** Bereiche in echten Bildschirm-Pixeln, die ignoriert werden (unser Overlay). */
    @Volatile var masks: List<Rect> = emptyList()
    /** -1 = noch nicht kalibriert */
    @Volatile var lockedScale: Int = lockedScale
        private set

    private var roundRobin = 0
    private val cooldownMs = 3000L
    private val lastSeen = HashMap<String, Long>()
    private val result = Mat()
    private val gray = Mat()
    private val pinkMask = Mat()

    @Synchronized
    fun resetCooldowns() = lastSeen.clear()

    @Synchronized
    fun resetCalibration() {
        lockedScale = -1
    }

    // ------------------------------------------------------------------ Vorlagen

    private fun cropGray(bmp: Bitmap): Mat? {
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
        rgba.release()
        return g
    }

    /** Vorlage einer Karte in Größe [scaleIdx] (lazy erzeugt). */
    private fun templateFor(c: Card, scaleIdx: Int): Mat? = c.perScale.getOrPut(scaleIdx) {
        // Breite des ganzen Karten-Symbols im Frame -> Breite des inneren Ausschnitts
        val w = (frameWidth * SCALES[scaleIdx] * (CROP_X1 - CROP_X0)).toInt()
        val h = (w * c.gray.rows().toDouble() / c.gray.cols()).toInt()
        if (w < 8 || h < 8) return@getOrPut null
        Mat().also {
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
        if (!battle) return Result(emptyList(), null, 0.0, false, lockedScale)

        Imgproc.cvtColor(rgba, gray, Imgproc.COLOR_RGBA2GRAY)
        val y0 = (gray.rows() * roiTop).toInt().coerceIn(0, gray.rows() - 1)
        val y1 = (gray.rows() * roiBottom).toInt().coerceIn(y0 + 1, gray.rows())
        val roi = gray.submat(y0, y1, 0, gray.cols())

        val restrict = restrictTo
        val hits = mutableListOf<Hit>()
        var bestName: String? = null
        var bestScore = 0.0
        var bestScaleIdx = -1

        fun test(name: String, t: Mat, scaleIdx: Int) {
            if (t.rows() > roi.rows() || t.cols() > roi.cols()) return
            Imgproc.matchTemplate(roi, t, result, Imgproc.TM_CCOEFF_NORMED)
            val mm = Core.minMaxLoc(result)
            if (mm.maxVal > bestScore) {
                bestScore = mm.maxVal; bestName = name; bestScaleIdx = scaleIdx
            }
            if (mm.maxVal >= threshold) {
                hits += Hit(name, mm.maxVal, mm.maxLoc.x.toInt(), mm.maxLoc.y.toInt(), t.cols(), t.rows())
            }
        }

        // Noch nicht kalibriert: pro Frame eine andere Größe testen (spart Rechenzeit)
        val scaleIdx = if (lockedScale >= 0) lockedScale else (roundRobin++ % SCALES.size)
        for (c in cards) {
            if (restrict != null && c.name !in restrict) continue
            templateFor(c, scaleIdx)?.let { test(c.name, it, scaleIdx) }
        }
        for (t in exact) {
            if (restrict != null && t.name !in restrict) continue
            test(t.name, t.mat, -1)
        }
        roi.release()

        // Erster sehr sicherer Treffer -> Größe festhalten
        if (lockedScale < 0 && bestScaleIdx >= 0 && bestScore >= max(0.86, threshold + 0.06)) {
            lockedScale = bestScaleIdx
        }

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
        return Result(detections, bestName, bestScore, true, lockedScale)
    }

    /**
     * Im Match ist unten deine lila/pinke Elixier-Leiste zu sehen.
     * Wir zählen den Anteil kräftig pinker Pixel im unteren Bildschirmstreifen.
     */
    private fun battleUiVisible(rgba: Mat): Boolean {
        val y0 = (rgba.rows() * 0.86).toInt()
        val y1 = (rgba.rows() * 0.99).toInt()
        if (y1 <= y0) return false
        val strip = rgba.submat(y0, y1, 0, rgba.cols())
        // RGBA: viel Rot, viel Blau, wenig Grün
        Core.inRange(strip, Scalar(150.0, 0.0, 150.0, 0.0), Scalar(255.0, 110.0, 255.0, 255.0), pinkMask)
        val ratio = Core.countNonZero(pinkMask).toDouble() / (strip.rows() * strip.cols())
        strip.release()
        return ratio > 0.012
    }

    private fun overlaps(a: Hit, b: Hit): Boolean {
        val ix = min(a.x + a.w, b.x + b.w) - max(a.x, b.x)
        val iy = min(a.y + a.h, b.y + b.h) - max(a.y, b.y)
        return ix > 0 && iy > 0 && ix * iy > 0.3 * min(a.w * a.h, b.w * b.h)
    }

    @Synchronized
    fun release() {
        cards.forEach { c -> c.gray.release(); c.perScale.values.forEach { it?.release() } }
        exact.forEach { it.mat.release() }
        result.release(); gray.release(); pinkMask.release()
    }
}
