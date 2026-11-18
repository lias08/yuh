# Roster: 91 weitere, eigenständige Brawler + Skin-Themen, die das Aussehen wirklich verändern
# (Frisur/Helm, Gesicht, Waffe, Accessoires – nicht nur Farben).
# Jeder Brawler = eine Zeile: Name, Titel, Seltenheit, Klasse, Element, Frisur, Gesicht, Waffe,
# Robe, Akzent, Haar, Accessoires, Größe, (optional) Hautfarbe.
# Klasse bestimmt Angriff/Super/Gadget, Element färbt und verändert die Effekte (Verlangsamen, Betäuben …).
class_name Roster

const ROWS := [
	# ---------------- Selten
	["Zunder", "Kleiner Brandstifter", "Selten", "schuetze", "feuer", "mohawk", "angry", "pistol", "b33a2a", "f2c12e", "ff8a1f", "scarf", 1.0],
	["Quirl", "Der Wirbelwind", "Selten", "assassine", "wind", "ponytail", "happy", "daggers", "3aa88a", "e8f6ef", "d9fff2", "", 0.95],
	["Klotz", "Mauer aus Muskeln", "Selten", "panzer", "erde", "bald", "angry", "fists", "7a5a3a", "c9a46a", "4a3020", "pauldrons", 1.2],
	["Pippa", "Pfiffige Bastlerin", "Selten", "werfer", "blitz", "beanie", "goggles", "bomb", "e0a020", "3a6ad0", "b0602a", "backpack", 0.95],
	["Moosbart", "Waldläufer", "Selten", "heiler", "natur", "long", "happy", "staff", "3d7a35", "c9b26a", "6b4a2a", "beard", 1.0],
	["Rostig", "Schrottroboter", "Selten", "schrot", "metall", "robot", "robot", "shotgun", "8a8f99", "d9772b", "555555", "antenna", 1.1],
	["Flitz", "Eiliger Paketbote", "Selten", "schuetze", "wind", "cap", "happy", "blaster", "2d6fd6", "ffd23a", "6b3a1a", "backpack", 1.0],
	["Kiesel", "Steinwerfer", "Selten", "werfer", "erde", "topknot", "happy", "boomerang", "9a7a4a", "6a4a2a", "2a2a2a", "", 1.0],
	["Brise", "Windtänzerin", "Selten", "kontrolle", "wind", "long", "happy", "fan", "9ad0e8", "ffffff", "e8e0ff", "flower", 0.95],
	["Knall", "Feuerwerker", "Selten", "werfer", "feuer", "helmet", "goggles", "bomb", "d84a2a", "ffd23a", "303030", "", 1.0],
	["Hagel", "Eisschütze", "Selten", "sniper", "eis", "beanie", "shades", "bow", "6aa8e0", "ffffff", "e0f0ff", "scarf", 1.0],
	["Tobi", "Raufbold", "Selten", "krieger", "erde", "spiky", "angry", "axe", "8a4a2a", "e0c080", "3a2010", "", 1.05],
	["Mira", "Mondsängerin", "Selten", "magier", "kosmos", "long", "sleepy", "wand", "4a3a9a", "ffd86a", "c0b0ff", "flower", 0.95],
	["Ruß", "Schornsteinfeger", "Selten", "schrot", "schatten", "tophat", "angry", "shotgun", "2a2a33", "aa3333", "222222", "", 1.0],
	["Sumpfi", "Sumpfwesen", "Selten", "heiler", "gift", "bald", "cyclops", "staff", "4a8a3a", "a0d060", "2a5a2a", "", 1.05, "7ab060"],
	["Blinker", "Leuchtturmwärter", "Selten", "kontrolle", "licht", "cap", "happy", "blaster", "2a4a8a", "ffd23a", "dddddd", "mustache", 1.0],
	["Bolzen", "Armbrustjäger", "Selten", "sniper", "metall", "cowboy", "eyepatch", "bow", "6a4a2a", "c0c0c0", "3a2a1a", "", 1.0],
	["Fauchi", "Wildkatze", "Selten", "assassine", "natur", "cat", "fangs", "claws", "d08a3a", "fff0d0", "e09a40", "tail", 0.95],
	["Krabbler", "Strandwächter", "Selten", "panzer", "wasser", "helmet", "angry", "trident", "2a7ab0", "f0d070", "1a4a7a", "", 1.15],
	["Dudel", "Straßenmusiker", "Selten", "magier", "klang", "afro", "shades", "guitar", "a03aa0", "ffd23a", "3a2010", "", 1.0],
	["Pfiff", "Schiedsrichterin", "Selten", "schuetze", "blitz", "ponytail", "happy", "pistol", "222222", "ffffff", "d0402a", "medal", 1.0],
	["Brummer", "Hummel-Pilot", "Selten", "kanone", "wind", "astro", "goggles", "cannon", "f0c020", "222222", "333333", "wings", 1.0],
	["Koko", "Kokosnuss-Krieger", "Selten", "werfer", "natur", "topknot", "happy", "boomerang", "6a4a2a", "3aa040", "2a1a10", "", 1.0],
	["Schnapp", "Fallensteller", "Selten", "kontrolle", "erde", "beanie", "angry", "blaster", "5a6a3a", "b08040", "6a4020", "backpack", 1.0],
	["Wuschel", "Kuschelmonster", "Selten", "berserker", "kosmos", "afro", "cyclops", "fists", "9a5ad0", "ffb0e0", "b070ff", "", 1.15, "c090f0"],
	# ---------------- Super Selten
	["Glutherz", "Schmiedemeister", "Super Selten", "panzer", "feuer", "bald", "angry", "hammer", "6a3020", "ff8a1f", "2a1a10", "beard,pauldrons", 1.2],
	["Raureif", "Gletscherläuferin", "Super Selten", "assassine", "eis", "hood", "ninja", "daggers", "a0d0f0", "ffffff", "e0f8ff", "scarf", 0.95],
	["Zappel", "Strom-Akrobat", "Super Selten", "krieger", "blitz", "mohawk", "happy", "spear", "3a3a8a", "ffe040", "40e0ff", "", 1.0],
	["Morla", "Moorhexe", "Super Selten", "magier", "gift", "wizard", "sleepy", "book", "2a5a3a", "b0e060", "6a3a8a", "", 1.0],
	["Kanonenkäthe", "Hafenkanonierin", "Super Selten", "kanone", "wasser", "pirate", "eyepatch", "cannon", "2a3a6a", "e0c060", "aa3020", "", 1.05],
	["Säbelzahn", "Eiszeitjäger", "Super Selten", "berserker", "eis", "bald", "fangs", "axe", "8a9aaa", "e0f0ff", "ffffff", "horns", 1.15],
	["Schattenfuchs", "Nachtstreuner", "Super Selten", "assassine", "schatten", "cat", "ninja", "claws", "3a2a4a", "aa50ff", "e06a2a", "tail", 0.95],
	["Felsenfaust", "Bergwächter", "Super Selten", "panzer", "erde", "viking", "angry", "fists", "6a6a6a", "c0a060", "a05a2a", "beard", 1.25],
	["Nova", "Sternenpilotin", "Super Selten", "schuetze", "kosmos", "astro", "shades", "blaster", "e0e0f0", "8a40ff", "ffffff", "jetpack", 1.0],
	["Wellenreiter", "Surfprofi", "Super Selten", "kontrolle", "wasser", "long", "shades", "trident", "20a0c0", "ffe040", "f0d060", "", 1.0],
	["Dornröschen", "Rosengärtnerin", "Super Selten", "heiler", "natur", "ponytail", "happy", "wand", "d04a7a", "3a9a40", "a02040", "flower", 0.95],
	["Donnerkeil", "Sturmwerfer", "Super Selten", "werfer", "blitz", "spiky", "angry", "boomerang", "2a3a6a", "ffe040", "e0e0ff", "", 1.0],
	["Pilzkopf", "Sporenmagier", "Super Selten", "magier", "gift", "mushroom", "sleepy", "staff", "e04040", "ffffff", "8a5a3a", "", 0.95],
	["Ritter Rost", "Klappriger Ritter", "Super Selten", "krieger", "metall", "knight", "visor", "great", "8a8a9a", "c0a040", "c03030", "pauldrons", 1.05],
	["Tiefseeted", "Tiefseetaucher", "Super Selten", "schrot", "wasser", "astro", "goggles", "shotgun", "e06a4a", "ffd060", "aaaaaa", "backpack", 1.05],
	["Kobold", "Glücksbringer", "Super Selten", "werfer", "licht", "topknot", "happy", "bomb", "3a9a40", "ffd23a", "e06a20", "", 0.9],
	["Lavalurch", "Vulkanechse", "Super Selten", "berserker", "feuer", "bald", "fangs", "claws", "c04020", "ffa020", "400000", "tail,spikes", 1.1, "d0603a"],
	["Spuk", "Hausgeist", "Super Selten", "kontrolle", "schatten", "hood", "cyclops", "wand", "e8e8ff", "9a70ff", "ffffff", "", 1.0, "e8e8ff"],
	["Kaktus Karl", "Wüstenwächter", "Super Selten", "panzer", "natur", "cowboy", "angry", "fists", "3a8a3a", "e0c060", "2a6a2a", "spikes", 1.15, "5aaa50"],
	["Schallwelle", "DJ der Arena", "Super Selten", "kanone", "klang", "cap", "shades", "cannon", "2a2a2a", "ff40c0", "40e0ff", "", 1.0],
	["Eulalia", "Weise Eule", "Super Selten", "sniper", "licht", "wizard", "happy", "bow", "8a6a4a", "ffd86a", "e0d0b0", "wings", 1.0],
	["Tornado", "Wirbelsturm", "Super Selten", "berserker", "wind", "mohawk", "angry", "scythe", "5a9a9a", "ffffff", "c0f0ff", "", 1.05],
	["Funkelfee", "Glitzerzauberin", "Super Selten", "heiler", "kosmos", "long", "happy", "wand", "ff9ad0", "ffffff", "ffe0f0", "wings", 0.9],
	["Panzerknacker", "Tresorknacker", "Super Selten", "schrot", "metall", "beanie", "eyepatch", "shotgun", "3a3a3a", "e0c040", "222222", "mustache", 1.05],
	["Mammut", "Urzeitriese", "Super Selten", "panzer", "eis", "afro", "angry", "hammer", "8a5a3a", "e0f0ff", "6a3a1a", "horns", 1.3],
	# ---------------- Episch
	["Phönixa", "Feuervogel", "Episch", "magier", "feuer", "flame", "happy", "staff", "e04020", "ffd040", "ff8020", "wings", 1.0],
	["Frostbiss", "Eiszahn", "Episch", "sniper", "eis", "hood", "fangs", "bow", "4a7ab0", "e0f8ff", "ffffff", "", 1.0],
	["Volt-Otto", "Blitzingenieur", "Episch", "kontrolle", "blitz", "robot", "robot", "blaster", "3a4a6a", "ffe040", "aaaaaa", "antenna,backpack", 1.05],
	["Nachtschatten", "Klingentänzerin", "Episch", "assassine", "schatten", "ponytail", "ninja", "katana", "2a1a3a", "c050ff", "e0e0ff", "scarf", 0.95],
	["Kraken-Kai", "Herr der Tiefe", "Episch", "berserker", "wasser", "pirate", "fangs", "trident", "1a5a7a", "e0c060", "2a2a2a", "beard", 1.1],
	["Sternenstaub", "Kometenjägerin", "Episch", "schuetze", "kosmos", "long", "shades", "blaster", "2a1a5a", "ff80ff", "ffffff", "jetpack", 1.0],
	["Gaia", "Hüterin des Waldes", "Episch", "heiler", "natur", "long", "sleepy", "staff", "3a7a3a", "e0d080", "6ac050", "flower,halo", 1.0],
	["Golem", "Uralter Wächter", "Episch", "panzer", "erde", "robot", "cyclops", "fists", "7a6a5a", "40e0a0", "555555", "", 1.35, "8a7a6a"],
	["Arietta", "Opernstar", "Episch", "kontrolle", "klang", "wizard", "happy", "fan", "a02a6a", "ffd23a", "3a1a2a", "", 1.0],
	["Sturmkrähe", "Himmelsspäherin", "Episch", "sniper", "wind", "hood", "eyepatch", "bow", "2a2a3a", "c0e0ff", "111111", "wings", 1.0],
	["Vulkan", "Lebender Berg", "Episch", "kanone", "feuer", "bald", "angry", "cannon", "4a2a2a", "ff6020", "ff8020", "spikes", 1.25, "8a5a4a"],
	["Giftzahn", "Schlangenbeschwörer", "Episch", "magier", "gift", "samurai", "fangs", "wand", "2a5a2a", "c0ff40", "111111", "scarf", 1.0],
	["Blitzklinge", "Donnerritterin", "Episch", "krieger", "blitz", "knight", "visor", "katana", "e0e0f0", "ffe040", "ffe040", "pauldrons,wings", 1.0],
	["Mumie Mo", "Wächter der Pyramide", "Episch", "berserker", "schatten", "hood", "cyclops", "claws", "e0d8b0", "c0a040", "e0d8b0", "", 1.05, "d8cfa8"],
	["Bärbel", "Eisbärenkriegerin", "Episch", "panzer", "eis", "viking", "angry", "axe", "f0f0f8", "6ab0e0", "f0f0ff", "", 1.2],
	["Kürbiskönig", "Herr der Felder", "Episch", "werfer", "feuer", "pumpkin", "happy", "bomb", "3a2a4a", "ff8020", "ff8020", "", 1.05],
	["Seiltänzer", "Zirkusakrobat", "Episch", "assassine", "klang", "tophat", "happy", "daggers", "c02040", "ffd23a", "222222", "bowtie", 1.0],
	["Neptuna", "Meereskönigin", "Episch", "magier", "wasser", "long", "happy", "trident", "2080c0", "ffd060", "40e0d0", "crown", 1.0],
	["Schrotti", "Schrottplatzkönig", "Episch", "schrot", "metall", "robot", "shades", "shotgun", "6a6a5a", "d07020", "444444", "jetpack", 1.1],
	["Lichtbringer", "Paladin", "Episch", "krieger", "licht", "knight", "angry", "great", "f0f0f0", "ffd040", "ffe080", "halo,pauldrons", 1.05],
	# ---------------- Mythisch
	["Chronos", "Zeitwächter", "Mythisch", "kontrolle", "kosmos", "wizard", "sleepy", "book", "2a2a6a", "ffd040", "e0e0ff", "halo,beard", 1.0],
	["Seelensammler", "Hüter der Schatten", "Mythisch", "berserker", "schatten", "hood", "cyclops", "scythe", "1a1a22", "8a50ff", "111111", "", 1.1, "b0a0d0"],
	["Drachenherz", "Drachenreiterin", "Mythisch", "kanone", "feuer", "ponytail", "angry", "cannon", "a02020", "ffc040", "e04020", "wings,horns", 1.0],
	["Ylva", "Herrscherin des Nordens", "Mythisch", "magier", "eis", "long", "happy", "wand", "80c0f0", "ffffff", "e8f8ff", "crown", 1.0],
	["Donnerfaust", "Gewittergott", "Mythisch", "panzer", "blitz", "spiky", "angry", "hammer", "3a3a8a", "ffe040", "ffffff", "beard,pauldrons", 1.2],
	["Taku", "Herrenloser Krieger", "Mythisch", "krieger", "wind", "samurai", "angry", "katana", "6a1a1a", "e0c060", "111111", "", 1.0],
	["Grimbold", "Dunkler Alchemist", "Mythisch", "werfer", "gift", "wizard", "eyepatch", "bomb", "3a2a5a", "80ff40", "aaaaaa", "beard", 1.0],
	["Tiefseeauge", "Ungeheuer der Tiefe", "Mythisch", "sniper", "wasser", "bald", "cyclops", "blaster", "1a4a6a", "40ffe0", "1a4a6a", "tail", 1.1, "4a8aa0"],
	["Waldgeist", "Uralter Hain", "Mythisch", "heiler", "natur", "hood", "cyclops", "staff", "2a5a2a", "a0ff60", "4a8a3a", "horns", 1.05, "6a9a5a"],
	["Stahlkoloss", "Kriegsmaschine", "Mythisch", "schrot", "metall", "knight", "robot", "shotgun", "5a5a6a", "ff4020", "444444", "pauldrons,spikes", 1.3],
	["Mondwolf", "Heuler der Nacht", "Mythisch", "assassine", "kosmos", "cat", "fangs", "claws", "3a3a5a", "c0c0ff", "a0a0c0", "tail", 1.0],
	["Glockenspiel", "Klangmagierin", "Mythisch", "heiler", "klang", "ponytail", "happy", "lollipop", "ff70b0", "ffe060", "ffb0d0", "bowtie", 0.95],
	["Erdbeben-Kalle", "Bergbauer", "Mythisch", "kanone", "erde", "cap", "angry", "cannon", "8a6a3a", "c0c0c0", "6a4a2a", "backpack,beard", 1.15],
	# ---------------- Legendär
	["Aurelia", "Sonnenkriegerin", "Legendär", "krieger", "licht", "long", "happy", "great", "fff0d0", "ffc020", "ffe080", "crown,wings", 1.0],
	["Kaiser Frost", "Ewiger Winter", "Legendär", "panzer", "eis", "knight", "visor", "axe", "a0d0ff", "ffffff", "e0f8ff", "crown,pauldrons", 1.2],
	["Zephyra", "Herrin der Stürme", "Legendär", "kontrolle", "wind", "long", "sleepy", "fan", "c0f0e0", "ffffff", "e0fff8", "wings,halo", 1.0],
	["Infernus", "Höllenschmied", "Legendär", "berserker", "feuer", "flame", "fangs", "scythe", "3a1010", "ff6020", "ff4010", "horns,spikes", 1.1],
	["Leviathan", "Urzeit-Seeschlange", "Legendär", "kanone", "wasser", "bald", "fangs", "cannon", "1a5a8a", "40e0ff", "1a5a8a", "tail,spikes", 1.25, "3a8ab0"],
	["Astra", "Sternenkaiserin", "Legendär", "magier", "kosmos", "long", "happy", "wand", "2a1a5a", "ffd040", "ffffff", "crown,halo", 1.0],
	["Echo", "Phantomklinge", "Legendär", "assassine", "klang", "hood", "visor", "katana", "1a1a2a", "ff40c0", "111111", "scarf", 1.0],
	["Titania", "Feenkönigin", "Legendär", "heiler", "licht", "long", "happy", "wand", "ffd0f0", "ffd040", "fff0a0", "wings,crown", 0.95],
]

const SKIN_TONES := ["f5c7a3", "e8b48e", "d29a72", "a8714e", "7a4e33", "f7d9c4"]

const ELEMENTS := {
	"feuer": {"pre": "Glut", "color": Color(1.0, 0.45, 0.15)},
	"eis": {"pre": "Frost", "color": Color(0.6, 0.9, 1.0)},
	"blitz": {"pre": "Blitz", "color": Color(1.0, 0.95, 0.35)},
	"gift": {"pre": "Gift", "color": Color(0.55, 1.0, 0.3)},
	"schatten": {"pre": "Schatten", "color": Color(0.68, 0.38, 1.0)},
	"erde": {"pre": "Fels", "color": Color(0.85, 0.65, 0.38)},
	"wind": {"pre": "Wind", "color": Color(0.75, 1.0, 0.9)},
	"licht": {"pre": "Licht", "color": Color(1.0, 0.9, 0.45)},
	"wasser": {"pre": "Wellen", "color": Color(0.3, 0.65, 1.0)},
	"natur": {"pre": "Ranken", "color": Color(0.45, 0.9, 0.35)},
	"metall": {"pre": "Stahl", "color": Color(0.8, 0.82, 0.9)},
	"kosmos": {"pre": "Sternen", "color": Color(0.9, 0.5, 1.0)},
	"klang": {"pre": "Klang", "color": Color(1.0, 0.45, 0.8)},
}

## Klassen: Grundwerte, Angriff, Super, Gadget. Werte werden pro Brawler leicht variiert.
const CLASSES := {
	"schuetze": {"role": "Schütze", "hp": 3600.0, "speed": 4.6, "reload": 1.3, "wclass": "gun",
		"atk": "schuss", "sup": "salve", "gad": "reload",
		"desc": "Schneller Fernkämpfer mit präzisen Doppelschüssen."},
	"schrot": {"role": "Nahkampf-Schütze", "hp": 5200.0, "speed": 4.4, "reload": 1.5, "wclass": "gun",
		"atk": "hagel", "sup": "ansturm", "gad": "speed",
		"desc": "Feuert breite Ladungen – vernichtend aus der Nähe."},
	"sniper": {"role": "Scharfschütze", "hp": 2900.0, "speed": 4.3, "reload": 1.8, "wclass": "gun",
		"atk": "pfeil", "sup": "durchschlag", "gad": "blink",
		"desc": "Trifft aus riesiger Entfernung mit gewaltigem Schaden."},
	"werfer": {"role": "Werfer", "hp": 3100.0, "speed": 4.3, "reload": 1.7, "wclass": "throw",
		"atk": "bombe", "sup": "megabombe", "gad": "stun_pulse",
		"desc": "Wirft Geschosse über Wände und sprengt Kisten."},
	"magier": {"role": "Magier", "hp": 3300.0, "speed": 4.4, "reload": 1.5, "wclass": "magic",
		"atk": "kugel", "sup": "nova", "gad": "blink",
		"desc": "Zauberkugeln fliegen durch alle Gegner hindurch."},
	"krieger": {"role": "Nahkämpfer", "hp": 4800.0, "speed": 4.6, "reload": 1.3, "wclass": "melee",
		"atk": "hieb", "sup": "welle", "gad": "speed",
		"desc": "Doppelhiebe aus nächster Nähe und eine weitreichende Welle."},
	"panzer": {"role": "Panzer", "hp": 7000.0, "speed": 4.1, "reload": 1.6, "wclass": "melee",
		"atk": "faust", "sup": "ansturm", "gad": "shield",
		"desc": "Steckt enorm viel ein und schleudert Gegner weg."},
	"assassine": {"role": "Assassine", "hp": 3500.0, "speed": 4.9, "reload": 1.1, "wclass": "melee",
		"atk": "stich", "sup": "sprint", "gad": "blink",
		"desc": "Blitzschnelle Stichkombos und ein betäubender Sprint."},
	"berserker": {"role": "Berserker", "hp": 5000.0, "speed": 4.5, "reload": 1.35, "wclass": "melee",
		"atk": "wirbel", "sup": "beben", "gad": "heal",
		"desc": "Wilde Dreifach-Kombos und eine explodierende Welle."},
	"kontrolle": {"role": "Kontrolle", "hp": 3700.0, "speed": 4.5, "reload": 1.4, "wclass": "gun",
		"atk": "netz", "sup": "falle", "gad": "stun_pulse",
		"desc": "Verlangsamt Gegner und betäubt ganze Gruppen."},
	"heiler": {"role": "Unterstützer", "hp": 3600.0, "speed": 4.5, "reload": 1.4, "wclass": "magic",
		"atk": "funke", "sup": "regen", "gad": "heal",
		"desc": "Hält sich mit Heilung im Kampf und verlangsamt Gegner."},
	"kanone": {"role": "Artillerie", "hp": 4200.0, "speed": 4.0, "reload": 2.0, "wclass": "gun",
		"atk": "kugel", "sup": "einschlag", "gad": "shield",
		"desc": "Schwere Geschosse mit Rückstoß und ein verheerender Einschlag."},
}

const GADGET_WORDS := {"blink": "sprung", "reload": "ladung", "speed": "rausch", "stun_pulse": "schock", "heal": "quelle", "shield": "panzer"}

static func _h(text: String) -> int:
	return abs(hash(text))

static func _var(name: String, salt: String, amount: float) -> float:
	# deterministische Variation in [1-amount, 1+amount]
	return 1.0 + ((_h(name + salt) % 1000) / 1000.0 * 2.0 - 1.0) * amount

static func make_id(name: String) -> String:
	var id := name.to_lower()
	for pair in [["ä", "ae"], ["ö", "oe"], ["ü", "ue"], ["ß", "ss"], [" ", "_"], ["-", "_"]]:
		id = id.replace(pair[0], pair[1])
	return id

static func all() -> Array:
	var list := []
	for row in ROWS:
		list.append(build(row))
	return list

static func build(row: Array) -> Dictionary:
	var name: String = row[0]
	var id := make_id(name)
	var rarity: String = row[2]
	var cls: Dictionary = CLASSES[row[3]]
	var el: Dictionary = ELEMENTS[row[4]]
	var elem: String = row[4]
	var col: Color = el.color
	var pre: String = el.pre
	var skin_hex: String = row[13] if row.size() > 13 else SKIN_TONES[_h(name) % SKIN_TONES.size()]
	var acc: Array = []
	for a in String(row[11]).split(",", false):
		acc.append(a)
	var look := {"robe": Color.html(row[8]), "trim": Color.html(row[9]), "skin": Color.html(skin_hex), "hair": Color.html(row[10]),
		"hair_style": row[5], "face": row[6], "weapon": row[7], "cape": rarity in ["Mythisch", "Legendär"] and not ("wings" in acc),
		"eye": col.darkened(0.35), "blade": col.lerp(Color.WHITE, 0.35), "size": row[12], "acc": acc,
		"hat": Color.html(row[8]).darkened(0.2), "mark": col}
	# Seltenere Brawler sind etwas stärker
	var rar_mul: float = {"Selten": 1.0, "Super Selten": 1.04, "Episch": 1.08, "Mythisch": 1.12, "Legendär": 1.16}[rarity]
	var hp: float = round(cls.hp * _var(name, "hp", 0.08) * rar_mul / 50.0) * 50.0
	var speed: float = snapped(cls.speed * _var(name, "sp", 0.04), 0.05)
	var dm: float = _var(name, "dmg", 0.08) * rar_mul
	var fx := {}  # Element-Effekte für Angriff
	var sfx := {}  # Element-Effekte für Super
	match elem:
		"feuer": dm *= 1.08
		"eis": fx["slow"] = 0.8; sfx["slow"] = 1.5
		"blitz": sfx["stun"] = 0.6
		"gift": fx["slow"] = 0.5; dm *= 1.04
		"schatten": speed += 0.2
		"erde": fx["knock"] = 0.8; sfx["break"] = true; hp *= 1.08
		"wind": fx["knock"] = 0.5; speed += 0.25
		"licht": sfx["stun"] = 0.3
		"wasser": fx["knock"] = 0.5; fx["slow"] = 0.4
		"natur": hp *= 1.08
		"metall": hp *= 1.15; speed -= 0.15
		"kosmos": dm *= 1.03
		"klang": sfx["stun"] = 0.4
	hp = round(hp / 50.0) * 50.0
	var atk := _attack(row[3], col, dm, fx)
	var sup := _super(row[3], col, dm, sfx)
	var atk_name: String = pre + atk.word
	var sup_name: String = pre + sup.word
	var form := {"name": name, "look": look, "hp_mul": 1.0, "speed_mul": 1.0, "reload_mul": 1.0,
		"aura": Color(0, 0, 0, 0), "stance": 0.2, "combo_name": atk_name, "combo_desc": atk.desc}
	sup.spec["name"] = sup_name
	sup.spec["desc"] = sup.desc
	form["super"] = sup.spec
	if atk.spec.get("type", "") == "melee":
		form["combo"] = atk.spec.combo
	else:
		form["attack"] = atk.spec
	var gtype: String = cls.gad
	if elem in ["natur", "licht"]:
		gtype = "heal"
	var b := {"id": id, "name": name, "title": row[1], "rarity": rarity, "rarity_color": _rarity_color(rarity),
		"role": cls.role, "desc": "%s %s" % [cls.desc, _elem_desc(elem)], "default_unlocked": false,
		"hp": hp, "speed": speed, "ammo": 3, "reload": snapped(cls.reload * _var(name, "rl", 0.06), 0.05),
		"cooldown": 0.38, "charge_hits": 4.0, "forms": [form], "wclass": cls.wclass,
		"gadget": _gadget(gtype, pre, col)}
	b["skins"] = theme_skins(b, 3)
	return b

static func _rarity_color(r: String) -> Color:
	match r:
		"Selten": return Color(0.35, 0.85, 0.35)
		"Super Selten": return Color(0.25, 0.6, 1.0)
		"Episch": return Color(0.75, 0.35, 1.0)
		"Mythisch": return Color(1.0, 0.3, 0.4)
		"Legendär": return Color(1.0, 0.85, 0.15)
	return Color(0.6, 0.8, 1.0)

static func _elem_desc(e: String) -> String:
	match e:
		"feuer": return "Feuer: mehr Schaden."
		"eis": return "Eis: verlangsamt Getroffene."
		"blitz": return "Blitz: Super betäubt."
		"gift": return "Gift: verlangsamt und schwächt."
		"schatten": return "Schatten: besonders schnell."
		"erde": return "Erde: Rückstoß, Super zerstört Kisten."
		"wind": return "Wind: Rückstoß und hohes Tempo."
		"licht": return "Licht: Heil-Gadget, Super betäubt kurz."
		"wasser": return "Wasser: Rückstoß und Verlangsamung."
		"natur": return "Natur: zäh, mit Heil-Gadget."
		"metall": return "Metall: extrem robust."
		"kosmos": return "Kosmos: kosmische Kraft."
		"klang": return "Klang: Super betäubt."
	return ""

static func _merge(d: Dictionary, extra: Dictionary) -> Dictionary:
	for k in extra:
		d[k] = extra[k]
	return d

static func _attack(cls: String, c: Color, dm: float, fx: Dictionary) -> Dictionary:
	match cls:
		"schuetze":
			return {"word": "schuss", "desc": "1 Munition = 2 schnelle Schüsse mit großer Reichweite.",
				"spec": _merge({"type": "shot", "dmg": round(440.0 * dm), "range": 8.5, "speed": 20.0, "count": 1, "spread": 0.0, "burst": 2, "interval": 0.1, "width": 0.25, "color": c, "visual": "bullet"}, fx)}
		"schrot":
			return {"word": "hagel", "desc": "1 Munition = 5 Geschosse im Fächer.",
				"spec": _merge({"type": "shot", "dmg": round(320.0 * dm), "range": 5.0, "speed": 16.0, "count": 5, "spread": 40.0, "burst": 1, "interval": 0.1, "width": 0.25, "color": c, "visual": "bullet"}, fx)}
		"sniper":
			return {"word": "pfeil", "desc": "1 Munition = ein extrem weiter, harter Schuss.",
				"spec": _merge({"type": "shot", "dmg": round(1150.0 * dm), "range": 11.0, "speed": 28.0, "count": 1, "spread": 0.0, "burst": 1, "interval": 0.1, "width": 0.22, "color": c, "visual": "bullet"}, fx)}
		"werfer":
			return {"word": "bombe", "desc": "1 Munition = ein Wurf im Bogen über Hindernisse.",
				"spec": _merge({"type": "lob", "dmg": round(900.0 * dm), "range": 7.5, "radius": 1.4, "color": c}, fx)}
		"magier":
			return {"word": "kugel", "desc": "1 Munition = eine Zauberkugel, die durch alle Gegner fliegt.",
				"spec": _merge({"type": "shot", "dmg": round(640.0 * dm), "range": 8.5, "speed": 13.0, "count": 1, "spread": 0.0, "burst": 1, "interval": 0.1, "width": 0.4, "color": c, "visual": "orb", "pierce": true}, fx)}
		"kontrolle":
			return {"word": "netz", "desc": "1 Munition = 3 Ladungen im Fächer, die verlangsamen.",
				"spec": _merge({"type": "shot", "dmg": round(380.0 * dm), "range": 7.5, "speed": 18.0, "count": 3, "spread": 16.0, "burst": 1, "interval": 0.1, "width": 0.28, "color": c, "visual": "orb", "slow": 0.8}, fx)}
		"heiler":
			return {"word": "funke", "desc": "1 Munition = eine leuchtende Energiekugel.",
				"spec": _merge({"type": "shot", "dmg": round(560.0 * dm), "range": 8.0, "speed": 14.0, "count": 1, "spread": 0.0, "burst": 1, "interval": 0.1, "width": 0.35, "color": c, "visual": "orb"}, fx)}
		"kanone":
			return {"word": "kugel", "desc": "1 Munition = eine schwere Kugel mit Rückstoß.",
				"spec": _merge({"type": "shot", "dmg": round(1250.0 * dm), "range": 8.5, "speed": 11.0, "count": 1, "spread": 0.0, "burst": 1, "interval": 0.1, "width": 0.55, "color": c, "visual": "orb", "knock": 1.2}, fx)}
		"krieger":
			return {"word": "hieb", "desc": "1 Munition = 2 Hiebe hin und zurück.",
				"spec": {"type": "melee", "combo": [
					_merge({"t": 0.0, "dir": "ltr", "dmg": round(620.0 * dm), "range": 2.8, "arc": 130.0, "color": c}, fx),
					_merge({"t": 0.14, "dir": "rtl", "dmg": round(620.0 * dm), "range": 2.8, "arc": 130.0, "color": c}, fx)]}}
		"panzer":
			return {"word": "faust", "desc": "1 Munition = ein wuchtiger Schlag mit starkem Rückstoß.",
				"spec": {"type": "melee", "combo": [
					_merge({"t": 0.0, "dir": "over", "dmg": round(1250.0 * dm), "range": 2.5, "arc": 120.0, "color": c, "knock": 1.5}, fx)]}}
		"assassine":
			return {"word": "stich", "desc": "1 Munition = 3 blitzschnelle Stiche.",
				"spec": {"type": "melee", "combo": [
					_merge({"t": 0.0, "dir": "thrust", "dmg": round(400.0 * dm), "range": 2.3, "arc": 70.0, "color": c}, fx),
					_merge({"t": 0.08, "dir": "ltr", "dmg": round(400.0 * dm), "range": 2.3, "arc": 110.0, "color": c}, fx),
					_merge({"t": 0.16, "dir": "rtl", "dmg": round(450.0 * dm), "range": 2.3, "arc": 110.0, "color": c}, fx)]}}
		_:  # berserker
			return {"word": "wirbel", "desc": "1 Munition = 3 wilde Schläge, der letzte von oben.",
				"spec": {"type": "melee", "combo": [
					_merge({"t": 0.0, "dir": "ltr", "dmg": round(450.0 * dm), "range": 2.7, "arc": 140.0, "color": c}, fx),
					_merge({"t": 0.12, "dir": "rtl", "dmg": round(450.0 * dm), "range": 2.7, "arc": 140.0, "color": c}, fx),
					_merge({"t": 0.26, "dir": "over", "dmg": round(600.0 * dm), "range": 2.9, "arc": 110.0, "color": c, "knock": 0.8}, fx)]}}

static func _super(cls: String, c: Color, dm: float, sfx: Dictionary) -> Dictionary:
	match cls:
		"schuetze":
			return {"word": "salve", "desc": "Ein Fächer aus 7 Schüssen, zweimal hintereinander.",
				"spec": _merge({"type": "shot", "dmg": round(360.0 * dm), "range": 9.0, "speed": 20.0, "count": 7, "spread": 30.0, "burst": 2, "interval": 0.15, "width": 0.25, "color": c, "visual": "bullet"}, sfx)}
		"schrot", "panzer":
			return {"word": "ansturm", "desc": "Stürmt nach vorne, schleudert Gegner weg und zerstört Kisten.",
				"spec": _merge({"type": "dash", "dmg": round(1450.0 * dm), "range": 7.0, "speed": 16.0, "color": c, "knock": 2.5, "break": true}, sfx)}
		"sniper":
			return {"word": "durchschlag", "desc": "Ein gewaltiger Schuss, der durch alle Gegner fliegt.",
				"spec": _merge({"type": "shot", "dmg": round(2300.0 * dm), "range": 13.0, "speed": 34.0, "count": 1, "spread": 0.0, "burst": 1, "interval": 0.1, "width": 0.4, "color": c, "visual": "orb", "pierce": true}, sfx)}
		"werfer":
			return {"word": "megabombe", "desc": "Riesiger Wurf, der Kisten zerstört.",
				"spec": _merge({"type": "lob", "dmg": round(2100.0 * dm), "range": 8.5, "radius": 3.0, "color": c, "break": true, "knock": 1.2}, sfx)}
		"magier", "heiler":
			return {"word": "regen" if cls == "heiler" else "nova", "desc": "Geschosse in alle Richtungen, zwei Wellen.",
				"spec": _merge({"type": "nova", "dmg": round((420.0 if cls == "heiler" else 480.0) * dm), "range": 6.5, "speed": 11.0, "count": 14, "burst": 2, "width": 0.35, "color": c, "slow": 1.2}, sfx)}
		"kontrolle":
			return {"word": "falle", "desc": "Betäubt alle Gegner im großen Radius.",
				"spec": _merge({"type": "lob", "dmg": round(1500.0 * dm), "range": 8.0, "radius": 2.5, "color": c, "stun": 1.3, "break": true}, sfx)}
		"kanone":
			return {"word": "einschlag", "desc": "Ein riesiger Einschlag: betäubt kurz und sprengt Kisten.",
				"spec": _merge({"type": "lob", "dmg": round(2500.0 * dm), "range": 9.5, "radius": 3.2, "color": c, "break": true, "stun": 0.5, "knock": 1.5}, sfx)}
		"krieger":
			return {"word": "welle", "desc": "Eine weitreichende Klingenwelle durch alle Gegner.",
				"spec": _merge({"type": "wave", "dmg": round(1600.0 * dm), "range": 9.0, "width": 0.8, "speed": 14.0, "color": c, "pierce": true, "charge": 0.0, "explode": 0.0}, sfx)}
		"assassine":
			return {"word": "sprint", "desc": "Blitzschneller Sprint durch Gegner – betäubt alle Getroffenen.",
				"spec": _merge({"type": "dash", "dmg": round(1200.0 * dm), "range": 7.5, "speed": 24.0, "color": c, "stun": 1.0}, sfx)}
		_:  # berserker
			return {"word": "beben", "desc": "Eine Welle, die beim Aufprall explodiert und Kisten sprengt.",
				"spec": _merge({"type": "wave", "dmg": round(1700.0 * dm), "range": 7.0, "width": 1.0, "speed": 12.0, "color": c, "pierce": false, "charge": 0.0, "explode": 2.2, "break": true}, sfx)}

static func _gadget(t: String, pre: String, c: Color) -> Dictionary:
	var name: String = pre + GADGET_WORDS[t]
	match t:
		"blink": return {"name": name, "desc": "Teleportiert dich ein Stück nach vorne.", "type": "blink", "range": 4.5, "cooldown": 5.0, "color": c}
		"reload": return {"name": name, "desc": "Füllt sofort alle Munition auf.", "type": "reload", "cooldown": 6.0, "color": c}
		"speed": return {"name": name, "desc": "3 Sekunden 40 % schneller.", "type": "speed", "duration": 3.0, "cooldown": 7.0, "color": c}
		"stun_pulse": return {"name": name, "desc": "Betäubt Gegner in der Nähe.", "type": "stun_pulse", "range": 3.8, "stun": 1.2, "dmg": 400.0, "cooldown": 7.0, "color": c}
		"heal": return {"name": name, "desc": "Heilt dich um 35 %.", "type": "heal", "amount": 0.35, "cooldown": 7.0, "color": c}
	return {"name": name, "desc": "3 Sekunden 65 % weniger Schaden.", "type": "shield", "duration": 3.0, "cooldown": 8.0, "color": c}

# ------------------------------------------------------------------ Skin-Themen
# Jedes Thema verändert Kopfbedeckung/Frisur, Gesicht, Waffe (passend zur Waffenklasse),
# Accessoires und Farben. Preis in Edelsteinen.
const THEMES := {
	"pirat": {"name": "Piraten-%s", "price": 80, "look": {"hair_style": "pirate", "face": "eyepatch", "robe": Color(0.55, 0.12, 0.15), "trim": Color(0.95, 0.78, 0.3), "hat": Color(0.15, 0.12, 0.15), "acc": ["medal"]},
		"weapon": {"melee": "katana", "gun": "pistol", "throw": "bomb", "magic": "book"}},
	"robo": {"name": "Robo-%s", "price": 100, "look": {"hair_style": "robot", "face": "robot", "robe": Color(0.55, 0.6, 0.68), "trim": Color(0.2, 0.85, 1.0), "eye": Color(0.2, 0.85, 1.0), "acc": ["jetpack"]},
		"weapon": {"melee": "claws", "gun": "blaster", "throw": "bomb", "magic": "wand"}},
	"astro": {"name": "Astro-%s", "price": 100, "look": {"hair_style": "astro", "face": "shades", "robe": Color(0.95, 0.95, 0.97), "trim": Color(1.0, 0.5, 0.15), "acc": ["jetpack"]},
		"weapon": {"melee": "spear", "gun": "blaster", "throw": "bomb", "magic": "wand"}},
	"ritter": {"name": "Ritter %s", "price": 80, "look": {"hair_style": "knight", "face": "visor", "robe": Color(0.25, 0.35, 0.75), "trim": Color(0.95, 0.8, 0.3), "hair": Color(0.9, 0.2, 0.2), "acc": ["pauldrons"]},
		"weapon": {"melee": "great", "gun": "bow", "throw": "boomerang", "magic": "book"}},
	"vampir": {"name": "Vampir-%s", "price": 100, "look": {"hair_style": "tophat", "face": "fangs", "robe": Color(0.12, 0.1, 0.14), "trim": Color(0.8, 0.1, 0.2), "hat": Color(0.1, 0.08, 0.12), "skin": Color(0.88, 0.86, 0.92), "acc": ["bat_wings", "bowtie"], "scarf_color": Color(0.8, 0.1, 0.2)},
		"weapon": {"melee": "scythe", "gun": "pistol", "throw": "bomb", "magic": "wand"}},
	"kuerbis": {"name": "Kürbis-%s", "price": 80, "look": {"hair_style": "pumpkin", "robe": Color(0.35, 0.18, 0.45), "trim": Color(1.0, 0.55, 0.12), "acc": ["scarf"], "scarf_color": Color(0.2, 0.6, 0.25)},
		"weapon": {"melee": "scythe", "gun": "cannon", "throw": "bomb", "magic": "staff"}},
	"engel": {"name": "Engel %s", "price": 120, "look": {"hair_style": "long", "face": "happy", "robe": Color(0.98, 0.97, 0.95), "trim": Color(1.0, 0.82, 0.3), "hair": Color(1.0, 0.9, 0.55), "acc": ["halo", "wings"]},
		"weapon": {"melee": "spear", "gun": "bow", "throw": "boomerang", "magic": "wand"}},
	"wikinger": {"name": "Wikinger-%s", "price": 80, "look": {"hair_style": "viking", "face": "angry", "robe": Color(0.45, 0.32, 0.22), "trim": Color(0.75, 0.75, 0.8), "hair": Color(0.85, 0.5, 0.2), "acc": ["beard", "pauldrons"]},
		"weapon": {"melee": "axe", "gun": "bow", "throw": "boomerang", "magic": "staff"}},
	"samurai": {"name": "Samurai-%s", "price": 100, "look": {"hair_style": "samurai", "face": "angry", "robe": Color(0.6, 0.1, 0.12), "trim": Color(0.95, 0.78, 0.3), "acc": ["pauldrons"], "armor_color": Color(0.2, 0.18, 0.22)},
		"weapon": {"melee": "katana", "gun": "bow", "throw": "boomerang", "magic": "fan"}},
	"dschungel": {"name": "Dschungel-%s", "price": 60, "look": {"hair_style": "cat", "face": "fangs", "robe": Color(0.4, 0.55, 0.2), "trim": Color(0.9, 0.7, 0.3), "hair": Color(0.9, 0.6, 0.2), "acc": ["tail"]},
		"weapon": {"melee": "claws", "gun": "bow", "throw": "boomerang", "magic": "staff"}},
	"zirkus": {"name": "Zirkus-%s", "price": 60, "look": {"hair_style": "tophat", "face": "happy", "robe": Color(0.85, 0.15, 0.2), "trim": Color(1.0, 0.85, 0.2), "hat": Color(0.85, 0.15, 0.2), "acc": ["bowtie", "mustache"], "scarf_color": Color(1.0, 0.85, 0.2)},
		"weapon": {"melee": "lollipop", "gun": "cannon", "throw": "bomb", "magic": "lollipop"}},
	"gold": {"name": "Gold-%s", "price": 150, "look": {"robe": Color(1.0, 0.78, 0.2), "trim": Color(1.0, 1.0, 0.95), "hat": Color(1.0, 0.78, 0.2), "blade": Color(1.0, 0.85, 0.35), "hair": Color(1.0, 0.85, 0.4), "acc": ["crown"]}, "weapon": {}},
	"rocker": {"name": "Rocker-%s", "price": 80, "look": {"hair_style": "mohawk", "face": "shades", "robe": Color(0.12, 0.12, 0.15), "trim": Color(0.85, 0.85, 0.9), "hair": Color(1.0, 0.25, 0.6), "acc": ["spikes"]},
		"weapon": {"melee": "guitar", "gun": "guitar", "throw": "bomb", "magic": "guitar"}},
}

## Erzeugt `count` thematische Skins (deterministisch pro Brawler).
static func theme_skins(b: Dictionary, count: int) -> Array:
	var keys: Array = THEMES.keys()
	var base_style: String = b.forms[0].look.get("hair_style", "")
	var out := []
	var start := _h(b.id) % keys.size()
	var i := 0
	while out.size() < count and i < keys.size():
		var key: String = keys[(start + i * 5) % keys.size()]
		i += 1
		var th: Dictionary = THEMES[key]
		if th.look.get("hair_style", "") == base_style and base_style != "":
			continue
		if out.any(func(s): return s.theme == key):
			continue
		out.append(theme_skin(b, key))
	return out

static func theme_skin(b: Dictionary, key: String) -> Dictionary:
	var th: Dictionary = THEMES[key]
	var lk: Dictionary = th.look.duplicate(true)
	var wc: String = b.get("wclass", "")
	if wc != "" and th.weapon.has(wc) and b.forms.size() == 1:
		lk["weapon"] = th.weapon[wc]
	return {"id": "%s_%s" % [b.id, key], "name": th.name % b.name, "price": th.price, "theme": key, "look": lk}
