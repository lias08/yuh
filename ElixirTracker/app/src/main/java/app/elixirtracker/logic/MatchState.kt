package app.elixirtracker.logic

/** Kombiniert Elixier-Schätzung und Kartenzyklus für ein Match. */
class MatchState(private val costOf: (String) -> Int?) {
    data class Play(val card: String, val cost: Int, val deducted: Double, val timeMs: Long)

    val engine = ElixirEngine()
    val cycle = CycleTracker()

    private val _plays = mutableListOf<Play>()
    val plays: List<Play> get() = _plays

    fun start(nowMs: Long) {
        engine.start(nowMs)
        cycle.reset()
        _plays.clear()
    }

    fun costFor(card: String): Int =
        if (CardDatabase.isMirror(card)) {
            // Spiegel kostet die zuletzt gespielte Karte + 1
            (_plays.lastOrNull { !CardDatabase.isMirror(it.card) }?.cost ?: 1) + 1
        } else {
            costOf(card) ?: 0
        }

    fun cardPlayed(card: String, nowMs: Long): Play {
        val cost = costFor(card)
        val deducted = if (engine.running) engine.spend(cost, nowMs) else 0.0
        cycle.play(card)
        val p = Play(card, cost, deducted, nowMs)
        _plays.add(p)
        return p
    }

    fun undo(nowMs: Long): Play? {
        val p = _plays.removeLastOrNull() ?: return null
        if (engine.running) engine.adjust(p.deducted, nowMs)
        cycle.undo()
        return p
    }
}
