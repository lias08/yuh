package app.elixirtracker.logic

data class Card(val name: String, val cost: Int)

/**
 * Kartennamen und Elixierkosten.
 * Supercell ändert gelegentlich Kosten – falls etwas nicht stimmt, hier anpassen
 * oder beim Import die Kosten in den Dateinamen schreiben (z.B. "Hog Rider_4.png").
 * Kosten -1 = Spiegel (kostet letzte Karte + 1).
 */
object CardDatabase {
    const val MIRROR = "Mirror"

    val cards: List<Card> = listOf(
        // Truppen
        Card("Skeletons", 1), Card("Ice Spirit", 1), Card("Fire Spirit", 1), Card("Electro Spirit", 1),
        Card("Heal Spirit", 1),
        Card("Goblins", 2), Card("Spear Goblins", 2), Card("Bomber", 2), Card("Bats", 2),
        Card("Ice Golem", 2), Card("Wall Breakers", 2), Card("Berserker", 2), Card("Suspicious Bush", 2),
        Card("Knight", 3), Card("Archers", 3), Card("Minions", 3), Card("Skeleton Army", 3),
        Card("Ice Wizard", 3), Card("Guards", 3), Card("Princess", 3), Card("Miner", 3),
        Card("Mega Minion", 3), Card("Dart Goblin", 3), Card("Goblin Gang", 3), Card("Bandit", 3),
        Card("Royal Ghost", 3), Card("Skeleton Barrel", 3), Card("Fisherman", 3), Card("Firecracker", 3),
        Card("Elixir Golem", 3), Card("Little Prince", 3),
        Card("Valkyrie", 4), Card("Musketeer", 4), Card("Baby Dragon", 4), Card("Mini P.E.K.K.A", 4),
        Card("Hog Rider", 4), Card("Dark Prince", 4), Card("Lumberjack", 4), Card("Battle Ram", 4),
        Card("Inferno Dragon", 4), Card("Electro Wizard", 4), Card("Hunter", 4), Card("Night Witch", 4),
        Card("Zappies", 4), Card("Flying Machine", 4), Card("Magic Archer", 4), Card("Mighty Miner", 4),
        Card("Battle Healer", 4), Card("Skeleton King", 4), Card("Golden Knight", 4),
        Card("Skeleton Dragons", 4), Card("Mother Witch", 4), Card("Phoenix", 4),
        Card("Goblin Demolisher", 4), Card("Rune Giant", 4),
        Card("Giant", 5), Card("Balloon", 5), Card("Witch", 5), Card("Barbarians", 5), Card("Prince", 5),
        Card("Wizard", 5), Card("Minion Horde", 5), Card("Bowler", 5), Card("Executioner", 5),
        Card("Ram Rider", 5), Card("Rascals", 5), Card("Cannon Cart", 5), Card("Royal Hogs", 5),
        Card("Electro Dragon", 5), Card("Archer Queen", 5), Card("Monk", 5), Card("Goblin Machine", 5),
        Card("Goblinstein", 5),
        Card("Giant Skeleton", 6), Card("Royal Giant", 6), Card("Sparky", 6), Card("Elite Barbarians", 6),
        Card("Goblin Giant", 6), Card("Boss Bandit", 6),
        Card("P.E.K.K.A", 7), Card("Lava Hound", 7), Card("Royal Recruits", 7), Card("Mega Knight", 7),
        Card("Electro Giant", 7),
        Card("Golem", 8),
        Card("Three Musketeers", 9),
        // Gebäude
        Card("Cannon", 3), Card("Tombstone", 3),
        Card("Mortar", 4), Card("Bomb Tower", 4), Card("Tesla", 4), Card("Furnace", 4),
        Card("Goblin Cage", 4), Card("Goblin Drill", 4),
        Card("Goblin Hut", 5), Card("Inferno Tower", 5),
        Card("Barbarian Hut", 6), Card("Elixir Collector", 6), Card("X-Bow", 6),
        // Zauber
        Card("Zap", 2), Card("Rage", 2), Card("The Log", 2), Card("Barbarian Barrel", 2),
        Card("Giant Snowball", 2), Card("Goblin Curse", 2),
        Card("Arrows", 3), Card("Clone", 3), Card("Tornado", 3), Card("Earthquake", 3),
        Card("Royal Delivery", 3), Card("Goblin Barrel", 3), Card("Void", 3),
        Card("Fireball", 4), Card("Poison", 4), Card("Freeze", 4),
        Card("Graveyard", 5),
        Card("Rocket", 6), Card("Lightning", 6),
        Card(MIRROR, -1),
    )

    /** Deutsche Namen -> englischer Name (für den Import per Dateiname). */
    private val germanAliases: Map<String, String> = mapOf(
        "Skelette" to "Skeletons", "Eisgeist" to "Ice Spirit", "Feuergeist" to "Fire Spirit",
        "Elektrogeist" to "Electro Spirit", "Heilgeist" to "Heal Spirit",
        "Kobolde" to "Goblins", "Speerkobolde" to "Spear Goblins", "Fledermäuse" to "Bats",
        "Eisgolem" to "Ice Golem", "Mauerbrecher" to "Wall Breakers",
        "Ritter" to "Knight", "Bogenschützen" to "Archers", "Lakaien" to "Minions",
        "Skelettarmee" to "Skeleton Army", "Eismagier" to "Ice Wizard", "Wächter" to "Guards",
        "Prinzessin" to "Princess", "Megalakai" to "Mega Minion", "Koboldbande" to "Goblin Gang",
        "Banditin" to "Bandit", "Fischer" to "Fisherman", "Elixirgolem" to "Elixir Golem",
        "Walküre" to "Valkyrie", "Musketierin" to "Musketeer", "Babydrache" to "Baby Dragon",
        "Schweinereiter" to "Hog Rider", "Dunkler Prinz" to "Dark Prince", "Holzfäller" to "Lumberjack",
        "Rammbock" to "Battle Ram", "Infernodrache" to "Inferno Dragon", "Elektromagier" to "Electro Wizard",
        "Jäger" to "Hunter", "Nachthexe" to "Night Witch", "Flugmaschine" to "Flying Machine",
        "Magischer Bogenschütze" to "Magic Archer", "Skelettkönig" to "Skeleton King",
        "Goldener Ritter" to "Golden Knight", "Skelettdrachen" to "Skeleton Dragons",
        "Mutterhexe" to "Mother Witch", "Phönix" to "Phoenix",
        "Riese" to "Giant", "Ballon" to "Balloon", "Hexe" to "Witch", "Barbaren" to "Barbarians",
        "Prinz" to "Prince", "Magier" to "Wizard", "Lakaienhorde" to "Minion Horde",
        "Henker" to "Executioner", "Widderreiterin" to "Ram Rider", "Rabauken" to "Rascals",
        "Kanonenkarren" to "Cannon Cart", "Königsschweine" to "Royal Hogs", "Elektrodrache" to "Electro Dragon",
        "Bogenschützenkönigin" to "Archer Queen", "Mönch" to "Monk",
        "Riesenskelett" to "Giant Skeleton", "Königlicher Riese" to "Royal Giant",
        "Elitebarbaren" to "Elite Barbarians", "Koboldriese" to "Goblin Giant",
        "Lavahund" to "Lava Hound", "Königliche Rekruten" to "Royal Recruits", "Megaritter" to "Mega Knight",
        "Elektroriese" to "Electro Giant", "Drei Musketiere" to "Three Musketeers",
        "Kanone" to "Cannon", "Grabstein" to "Tombstone", "Mörser" to "Mortar", "Bombenturm" to "Bomb Tower",
        "Ofen" to "Furnace", "Koboldkäfig" to "Goblin Cage", "Koboldbohrer" to "Goblin Drill",
        "Koboldhütte" to "Goblin Hut", "Infernoturm" to "Inferno Tower", "Barbarenhütte" to "Barbarian Hut",
        "Elixirsammler" to "Elixir Collector", "Wut" to "Rage", "Barbarenfass" to "Barbarian Barrel",
        "Riesenschneeball" to "Giant Snowball", "Pfeile" to "Arrows", "Klon" to "Clone",
        "Erdbeben" to "Earthquake", "Königliche Lieferung" to "Royal Delivery", "Koboldfass" to "Goblin Barrel",
        "Feuerball" to "Fireball", "Gift" to "Poison", "Frost" to "Freeze", "Friedhof" to "Graveyard",
        "Rakete" to "Rocket", "Blitz" to "Lightning", "Spiegel" to MIRROR,
    )

    fun normalize(s: String): String = s.lowercase().filter { it.isLetterOrDigit() }

    private val byKey: Map<String, Card> = buildMap {
        cards.forEach { put(normalize(it.name), it) }
        germanAliases.forEach { (de, en) -> cards.find { it.name == en }?.let { put(normalize(de), it) } }
    }

    fun find(name: String): Card? = byKey[normalize(name)]

    fun costOf(name: String): Int? = find(name)?.cost

    fun isMirror(name: String): Boolean = find(name)?.name == MIRROR
}
