package app.elixirtracker

import android.content.Context
import android.content.SharedPreferences

class Prefs(ctx: Context) {
    val sp: SharedPreferences = ctx.getSharedPreferences("settings", Context.MODE_PRIVATE)

    /** Scan-Bereich in Prozent der Bildschirmhöhe (oben = Gegnerseite). */
    var roiTop: Int
        get() = sp.getInt(KEY_ROI_TOP, 8)
        set(v) = sp.edit().putInt(KEY_ROI_TOP, v).apply()
    var roiBottom: Int
        get() = sp.getInt(KEY_ROI_BOTTOM, 60)
        set(v) = sp.edit().putInt(KEY_ROI_BOTTOM, v).apply()
    /** Erkennungs-Schwelle 50..99 (%). */
    var threshold: Int
        get() = sp.getInt(KEY_THRESHOLD, 78)
        set(v) = sp.edit().putInt(KEY_THRESHOLD, v).apply()
    var intervalMs: Int
        get() = sp.getInt(KEY_INTERVAL, 250)
        set(v) = sp.edit().putInt(KEY_INTERVAL, v).apply()
    var showDebug: Boolean
        get() = sp.getBoolean(KEY_DEBUG, true)
        set(v) = sp.edit().putBoolean(KEY_DEBUG, v).apply()

    /** Overlay-Größe in Prozent (50..200). */
    var overlayScale: Int
        get() = sp.getInt(KEY_SCALE, 100)
        set(v) = sp.edit().putInt(KEY_SCALE, v).apply()
    /** Deckkraft in Prozent (30..100). */
    var overlayOpacity: Int
        get() = sp.getInt(KEY_OPACITY, 90)
        set(v) = sp.edit().putInt(KEY_OPACITY, v).apply()
    val overlayAnchor: String get() = sp.getString(KEY_ANCHOR, "TOP_LEFT") ?: "TOP_LEFT"
    val overlayX: Int get() = sp.getInt(KEY_X, -1)
    val overlayY: Int get() = sp.getInt(KEY_Y, -1)

    /** Neue Position wählen (Ecke + Abstand in px) – baut das Overlay neu auf. */
    fun setOverlayPosition(anchor: String, x: Int, y: Int) {
        sp.edit().putString(KEY_ANCHOR, anchor).putInt(KEY_X, x).putInt(KEY_Y, y)
            .putInt(KEY_REV, sp.getInt(KEY_REV, 0) + 1).apply()
    }

    /** Beim Ziehen speichern (ohne Neuaufbau). */
    fun saveDraggedPosition(x: Int, y: Int) {
        sp.edit().putInt(KEY_X, x).putInt(KEY_Y, y).apply()
    }

    companion object {
        const val KEY_SCALE = "overlay_scale"
        const val KEY_OPACITY = "overlay_opacity"
        const val KEY_ANCHOR = "overlay_anchor"
        const val KEY_X = "overlay_x"
        const val KEY_Y = "overlay_y"
        const val KEY_REV = "overlay_rev"
        /** Änderungen an diesen Schlüsseln bauen das Overlay neu auf. */
        val OVERLAY_REBUILD_KEYS = setOf(KEY_SCALE, KEY_OPACITY, KEY_REV)

        const val KEY_ROI_TOP = "roi_top"
        const val KEY_ROI_BOTTOM = "roi_bottom"
        const val KEY_THRESHOLD = "threshold"
        const val KEY_INTERVAL = "interval"
        const val KEY_DEBUG = "debug"
    }
}
