package app.elixirtracker.logic

import kotlin.math.max
import kotlin.math.min

/**
 * Schätzt das Elixier des Gegners anhand der Zeit.
 *
 * - Start: 5 Elixier, Maximum 10
 * - 1 Elixier alle 2,8 s (x1)
 * - ab 2:00 Spielzeit doppelt (x2, letzte Minute der regulären Zeit)
 * - ab 4:00 Spielzeit dreifach (x3, Verlängerung)
 * - manuell überschreibbar
 */
class ElixirEngine(
    val secondsPerElixir: Double = 2.8,
    val maxElixir: Double = 10.0,
    val startElixir: Double = 5.0,
    val doubleElixirAfterSec: Double = 120.0,
    val tripleElixirAfterSec: Double = 240.0,
) {
    var elixir: Double = startElixir
        private set
    var running: Boolean = false
        private set
    /** null = automatisch (x1 bzw. x2 ab Minute 2) */
    var manualMultiplier: Int? = null
        private set

    private var lastMs = 0L
    private var startMs = 0L

    fun start(nowMs: Long) {
        elixir = startElixir
        running = true
        manualMultiplier = null
        lastMs = nowMs
        startMs = nowMs
    }

    fun stop() {
        running = false
    }

    fun elapsedSec(nowMs: Long): Double = if (running) (nowMs - startMs) / 1000.0 else 0.0

    fun multiplier(nowMs: Long): Int = manualMultiplier ?: autoMultiplier(elapsedSec(nowMs))

    private fun autoMultiplier(elapsed: Double): Int = when {
        elapsed >= tripleElixirAfterSec -> 3
        elapsed >= doubleElixirAfterSec -> 2
        else -> 1
    }

    /** Bringt die Schätzung auf den Zeitpunkt [nowMs] und gibt sie zurück. */
    fun update(nowMs: Long): Double {
        if (!running || nowMs <= lastMs) return elixir
        var t = lastMs
        if (manualMultiplier == null) {
            // Phasenwechsel innerhalb des Intervalls exakt berücksichtigen
            for (sec in listOf(doubleElixirAfterSec, tripleElixirAfterSec)) {
                val at = startMs + (sec * 1000).toLong()
                if (t < at && nowMs > at) {
                    gain(at - t, autoMultiplier((t - startMs) / 1000.0))
                    t = at
                }
            }
            gain(nowMs - t, autoMultiplier((t - startMs) / 1000.0))
        } else {
            gain(nowMs - t, manualMultiplier!!)
        }
        lastMs = nowMs
        return elixir
    }


    private fun gain(ms: Long, mult: Int) {
        elixir = min(maxElixir, elixir + ms / 1000.0 / secondsPerElixir * mult)
    }

    /** Zieht Kosten ab und gibt zurück, wie viel tatsächlich abgezogen wurde. */
    fun spend(cost: Int, nowMs: Long): Double {
        update(nowMs)
        val before = elixir
        elixir = max(0.0, elixir - cost)
        return before - elixir
    }

    fun adjust(delta: Double, nowMs: Long) {
        update(nowMs)
        elixir = (elixir + delta).coerceIn(0.0, maxElixir)
    }

    /** x1 -> x2 -> x3 -> x1 (manuell) */
    fun cycleMultiplier(nowMs: Long) {
        update(nowMs)
        manualMultiplier = when (multiplier(nowMs)) {
            1 -> 2
            2 -> 3
            else -> 1
        }
    }

    fun resetMultiplierToAuto(nowMs: Long) {
        update(nowMs)
        manualMultiplier = null
    }
}
