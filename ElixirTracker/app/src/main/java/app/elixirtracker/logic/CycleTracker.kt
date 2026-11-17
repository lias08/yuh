package app.elixirtracker.logic

/**
 * Verfolgt den Kartenzyklus des Gegners.
 *
 * Clash Royale: 8 Karten im Deck, 4 auf der Hand, 4 in der Warteschlange.
 * Eine gespielte Karte geht ans Ende der Warteschlange, die vorderste kommt auf die Hand.
 * Daraus folgt: Die letzten 4 gespielten Karten sind NICHT auf der Hand,
 * und die älteste davon ist die nächste Karte, die nachgezogen wird.
 */
class CycleTracker(val deckSize: Int = 8, val handSize: Int = 4) {
    private val history = mutableListOf<String>()

    val plays: List<String> get() = history

    /** Bisher gesehene Deck-Karten in der Reihenfolge ihres ersten Auftretens. */
    val deck: List<String> get() = history.distinct().take(deckSize)

    val deckComplete: Boolean get() = deck.size >= deckSize

    fun play(card: String) {
        history.add(card)
    }

    fun undo(): String? = history.removeLastOrNull()

    fun reset() = history.clear()

    /** Die zuletzt gespielten (verschiedenen) Karten, neueste zuerst, max. [handSize]. */
    fun queue(): List<String> {
        val result = mutableListOf<String>()
        for (i in history.indices.reversed()) {
            val c = history[i]
            if (c !in result) result.add(c)
            if (result.size == handSize) break
        }
        return result
    }

    /** Hand des Gegners: bekannte Karten + null für unbekannte Plätze. */
    fun hand(): List<String?> {
        val q = queue()
        val known = deck.filter { it !in q }.take(handSize)
        return known + List(handSize - known.size) { null }
    }

    /** Die Karte, die als nächstes auf die Hand kommt (wenn bekannt). */
    fun next(): String? {
        val q = queue()
        return if (q.size >= handSize) q.last() else null
    }
}
