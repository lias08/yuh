package app.elixirtracker.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LogicTest {
    private val eps = 1e-6

    @Test fun regenSingleElixir() {
        val e = ElixirEngine()
        e.start(0)
        assertEquals(5.0, e.update(0), eps)
        assertEquals(6.0, e.update(2800), eps)
        assertEquals(10.0, e.update(60_000), eps) // gedeckelt
    }

    @Test fun doubleElixirAfterTwoMinutes() {
        val e = ElixirEngine()
        e.start(0)
        e.spend(10, 119_000)            // bei 1:59 alles ausgegeben -> 0
        assertEquals(0.0, e.elixir, eps)
        // 1 s mit x1, danach 1,8 s mit x2 -> 1/2.8 + 1.8*2/2.8
        assertEquals(1.0 / 2.8 + 3.6 / 2.8, e.update(121_800), eps)
        assertEquals(2, e.multiplier(121_800))
    }

    @Test fun manualMultiplierCycles() {
        val e = ElixirEngine()
        e.start(0)
        e.cycleMultiplier(0); assertEquals(2, e.multiplier(0))
        e.cycleMultiplier(0); assertEquals(3, e.multiplier(0))
        e.spend(5, 0)
        assertEquals(3.0, e.update(2800), eps)
        e.resetMultiplierToAuto(2800); assertEquals(1, e.multiplier(2800))
    }

    @Test fun spendClampsAtZero() {
        val e = ElixirEngine()
        e.start(0)
        assertEquals(5.0, e.spend(7, 0), eps)
        assertEquals(0.0, e.elixir, eps)
    }

    @Test fun cycleHandAndNext() {
        val c = CycleTracker()
        val deck = listOf("A", "B", "C", "D", "E", "F", "G", "H")
        deck.forEach { c.play(it) }
        assertTrue(c.deckComplete)
        assertEquals(listOf("A", "B", "C", "D"), c.hand())
        assertEquals("E", c.next())
        c.play("B")
        assertEquals(listOf("A", "C", "D", "E"), c.hand())
        assertEquals("F", c.next())
    }

    @Test fun cycleWithUnknowns() {
        val c = CycleTracker()
        c.play("Hog Rider")
        assertEquals(listOf<String?>(null, null, null, null), c.hand())
        assertNull(c.next())
        listOf("Zap", "Musketeer", "Cannon", "Ice Spirit").forEach { c.play(it) }
        assertEquals(listOf("Hog Rider", null, null, null), c.hand())
        assertEquals("Zap", c.next())
    }

    @Test fun matchStateMirrorAndUndo() {
        val m = MatchState(CardDatabase::costOf)
        m.start(0)
        m.cardPlayed("Hog Rider", 0)          // 5 - 4 = 1
        assertEquals(1.0, m.engine.elixir, eps)
        m.engine.adjust(5.0, 0)               // 6
        val p = m.cardPlayed("Mirror", 0)     // Spiegel Schweinereiter = 5
        assertEquals(5, p.cost)
        assertEquals(1.0, m.engine.elixir, eps)
        m.undo(0)
        assertEquals(6.0, m.engine.elixir, eps)
        assertEquals(listOf("Hog Rider"), m.cycle.plays)
    }

    @Test fun databaseLookup() {
        assertEquals(4, CardDatabase.costOf("hog_rider"))
        assertEquals(4, CardDatabase.costOf("Schweinereiter"))
        assertEquals(7, CardDatabase.costOf("pekka"))
        assertTrue(CardDatabase.isMirror("Spiegel"))
    }
}
