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

    companion object {
        const val KEY_ROI_TOP = "roi_top"
        const val KEY_ROI_BOTTOM = "roi_bottom"
        const val KEY_THRESHOLD = "threshold"
        const val KEY_INTERVAL = "interval"
        const val KEY_DEBUG = "debug"
    }
}
