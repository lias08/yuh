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
	# ---------------- Hyperlegendär: Geist-Nutzer (eigene Figuren)
	["Aurion", "Hüter des Ursprungs", "Hyperlegendär", "magier", "licht", "long", "happy", "staff", "f4efe2", "e0b040", "f0d070", "halo,medal", 1.05],
	["Kalamis", "Bote des Unheils", "Hyperlegendär", "kontrolle", "schatten", "hood", "sleepy", "book", "2a2440", "70d0ff", "e8e8f0", "scarf", 1.0],
	# ---------------- Legendär: Anime-Kämpfer (eigene Figuren)
	["Kairo", "Kampfmönch der Sonne", "Legendär", "krieger", "licht", "topknot", "happy", "fists", "f2f2f2", "ffb020", "8a3a20", "medal", 1.0],
	["Nyxara", "Weberin des Sternenraums", "Legendär", "kontrolle", "kosmos", "ponytail", "sleepy", "book", "1c1a40", "c070ff", "e070c0", "halo,flower", 1.0],
	["Grimmzahn", "Dämon der Schattenklinge", "Legendär", "berserker", "schatten", "flame", "fangs", "great", "1a0a10", "e02040", "8a1020", "horns,bat_wings", 1.1],
	["Zirr", "Sturmläufer", "Legendär", "assassine", "blitz", "mohawk", "angry", "daggers", "2a5a3a", "ffe040", "30c0a0", "scarf", 0.95],
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
		"hat": Color.html(row[8]).darkened(0.2), "mark": col, "body": _body_type(row[3], name)}
	# Seltenere Brawler sind etwas stärker
	var rar_mul: float = {"Selten": 1.0, "Super Selten": 1.04, "Episch": 1.08, "Mythisch": 1.12, "Legendär": 1.16, "Hyperlegendär": 1.6}[rarity]
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
	var kit: Array = KITS()[name].duplicate()
	var base_kit: Array = kit.duplicate()
	var anime: Dictionary = ANIME_SUPERS()
	if anime.has(name):
		kit[3] = anime[name][0]
		kit[4] = anime[name][1]
		kit[5] = anime[name][2]
	var atk_spec: Dictionary = _prep(kit[2].duplicate(true), col, dm)
	var sup_spec: Dictionary = _prep(kit[5].duplicate(true), col, dm)
	var form := {"name": name, "look": look, "hp_mul": 1.0, "speed_mul": 1.0, "reload_mul": 1.0,
		"aura": Color(0, 0, 0, 0), "stance": 0.2, "combo_name": kit[0], "combo_desc": kit[1]}
	sup_spec["name"] = kit[3]
	sup_spec["desc"] = kit[4]
	form["super"] = sup_spec
	if atk_spec.get("type", "") == "melee":
		form["combo"] = atk_spec.combo
	else:
		if not atk_spec.has("range"):
			atk_spec["range"] = atk_spec.get("radius", 3.0)
		form["attack"] = atk_spec
	var forms := [form]
	var stand_spirit := {}
	if sup_spec.type == "awaken":
		forms.append(_awakened_form(form, sup_spec, col, dm))
	elif sup_spec.type == "spirit":
		# Geist-Nutzer: Gadget fährt den Geist ein/aus -> zwei Movesets
		stand_spirit = sup_spec.duplicate(true)
		stand_spirit["interval"] = sup_spec.get("interval", 0.14) * 1.8  # passiv etwas langsamer
		var base_sup: Dictionary
		if base_kit[5].is_empty():
			base_sup = {"type": "slam", "radius": 3.0, "dmg": 1200.0, "color": col}
			base_sup["name"] = "Schockwelle"
			base_sup["desc"] = "Eine Druckwelle um ihn herum."
		else:
			base_sup = _prep(base_kit[5].duplicate(true), col, dm)
			base_sup["name"] = base_kit[3]
			base_sup["desc"] = base_kit[4]
		form["super"] = base_sup
		var f2: Dictionary = form.duplicate(true)
		f2.name = "Mit Geist: " + kit[3].replace("Geistwächter: ", "")
		f2["aura"] = Color(sup_spec.color.r, sup_spec.color.g, sup_spec.color.b, 0.5)
		f2["combo_name"] = "Geisthagel"
		f2["combo_desc"] = "1 Munition = der Geist schlägt 4-mal blitzschnell zu (große Reichweite)."
		f2.erase("attack")
		f2["combo"] = []
		for k in 4:
			f2.combo.append({"t": k * 0.06, "dir": ["ltr", "rtl", "thrust", "over"][k], "dmg": round(330.0 * dm), "range": 3.1, "arc": 90.0, "color": col, "stun": 0.06 if k == 3 else 0.0})
		var ult: Dictionary = sup_spec.get("stand_ult", {"type": "dash", "dmg": 1900.0, "range": 7.0, "speed": 20.0, "knock": 3.0, "stun": 0.6})
		ult = _prep(ult.duplicate(true), col, dm)
		ult["name"] = sup_spec.get("stand_ult_name", "Finaler Schlaghagel")
		ult["desc"] = sup_spec.get("stand_ult_desc", "Der Geist stürmt mit seinem Herrn nach vorne und schleudert alles weg.")
		f2["super"] = ult
		forms.append(f2)
	var gtype: String = cls.gad
	if elem in ["natur", "licht"]:
		gtype = "heal"
	var b := {"id": id, "name": name, "title": row[1], "rarity": rarity, "rarity_color": _rarity_color(rarity),
		"role": cls.role, "desc": "%s – %s mit der Kraft des Elements %s." % [row[1], cls.role, elem.capitalize()], "default_unlocked": false,
		"hp": hp, "speed": speed, "ammo": 3, "reload": snapped(cls.reload * _var(name, "rl", 0.06), 0.05),
		"cooldown": 0.38, "charge_hits": 4.0, "forms": forms, "wclass": cls.wclass, "no_evolve": true,
		"gadget": _gadget(gtype, pre, col)}
	if not stand_spirit.is_empty():
		b["stand_spirit"] = stand_spirit
		b["gadget"] = {"name": "Geist rufen", "desc": "Fährt den Geist aus oder ein – wechselt zwischen zwei Movesets. Unbegrenzt, 1,5 s Abklingzeit.",
			"type": "stand_toggle", "cooldown": 1.5, "unlimited": true, "color": stand_spirit.color}
	b["skins"] = theme_skins(b, 3)
	return b

## Farbe setzen und Schaden skalieren (auch in verschachtelten Teilen wie Zonen und Wellen).
static func _prep(d: Dictionary, col: Color, dm: float) -> Dictionary:
	if not d.has("color"):
		d["color"] = col
	for k in ["dmg", "dps"]:
		if d.has(k):
			d[k] = round(float(d[k]) * dm)
	for k in ["zone", "wave", "buff_after"]:
		if d.has(k):
			d[k] = _prep(d[k], col, dm)
	if d.has("combo"):
		var steps: Array = []
		for st in d.combo:
			steps.append(_prep(st, col, dm))
		d["combo"] = steps
	return d

static func _rarity_color(r: String) -> Color:
	match r:
		"Selten": return Color(0.35, 0.85, 0.35)
		"Super Selten": return Color(0.25, 0.6, 1.0)
		"Episch": return Color(0.75, 0.35, 1.0)
		"Mythisch": return Color(1.0, 0.3, 0.4)
		"Legendär": return Color(1.0, 0.85, 0.15)
		"Hyperlegendär": return Color(1.0, 0.25, 0.75)
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


## Körperbau je Klasse (mit Variation pro Brawler) – damit sich Silhouetten unterscheiden.
static func _body_type(cls: String, name: String) -> String:
	var opts: Array = {"panzer": ["buff", "round"], "assassine": ["slim", "slim", "tiny"], "magier": ["tall", "slim"],
		"kanone": ["round", "buff"], "schuetze": ["normal", "slim"], "heiler": ["tiny", "normal"], "berserker": ["buff", "buff", "round"],
		"sniper": ["tall", "slim"], "werfer": ["tiny", "round"], "krieger": ["normal", "buff"], "kontrolle": ["normal", "tall"],
		"schrot": ["round", "buff"]}.get(cls, ["normal"])
	return opts[_h(name + "body") % opts.size()]

# ------------------------------------------------------------------ Individuelle Skins
# Jeder Skin = eigene Farbpalette + (manchmal) neue Kopfbedeckung + eigene Accessoire-Kombination
# + (manchmal) neue Waffe. Alles deterministisch pro Brawler, dadurch sieht jeder Skin anders aus.
const PALETTES := {
	"neon": ["Neon", 60, Color(0.1, 0.1, 0.16), Color(1.0, 0.2, 0.75), Color(0.2, 1.0, 0.9)],
	"lava": ["Lava", 80, Color(0.25, 0.08, 0.06), Color(1.0, 0.45, 0.1), Color(1.0, 0.3, 0.1)],
	"arktis": ["Arktis", 60, Color(0.88, 0.94, 1.0), Color(0.35, 0.65, 1.0), Color(0.95, 0.97, 1.0)],
	"sakura": ["Sakura", 80, Color(1.0, 0.78, 0.86), Color(0.85, 0.3, 0.5), Color(1.0, 0.6, 0.75)],
	"mitternacht": ["Mitternachts", 80, Color(0.1, 0.1, 0.25), Color(0.6, 0.65, 1.0), Color(0.2, 0.2, 0.4)],
	"dschungel": ["Dschungel", 60, Color(0.25, 0.45, 0.18), Color(0.85, 0.65, 0.25), Color(0.4, 0.25, 0.1)],
	"wuesten": ["Wüsten", 60, Color(0.9, 0.75, 0.5), Color(0.65, 0.35, 0.15), Color(0.55, 0.35, 0.2)],
	"cyber": ["Cyber", 100, Color(0.18, 0.2, 0.25), Color(0.2, 1.0, 0.4), Color(0.85, 0.85, 0.9)],
	"koenig": ["Königs", 150, Color(0.45, 0.1, 0.55), Color(1.0, 0.8, 0.2), Color(1.0, 0.85, 0.4)],
	"geister": ["Geister", 100, Color(0.85, 0.9, 1.0), Color(0.5, 1.0, 0.85), Color(0.9, 1.0, 1.0)],
	"pirat": ["Piraten", 80, Color(0.55, 0.12, 0.15), Color(0.95, 0.78, 0.3), Color(0.2, 0.15, 0.1)],
	"bonbon": ["Bonbon", 60, Color(1.0, 0.55, 0.75), Color(0.55, 0.9, 1.0), Color(1.0, 0.9, 0.4)],
	"kristall": ["Kristall", 120, Color(0.6, 0.45, 1.0), Color(0.85, 0.95, 1.0), Color(0.75, 0.6, 1.0)],
	"gold": ["Gold", 150, Color(1.0, 0.78, 0.2), Color(1.0, 1.0, 0.95), Color(1.0, 0.85, 0.4)],
	"schatten": ["Schatten", 100, Color(0.08, 0.06, 0.1), Color(0.6, 0.15, 0.3), Color(0.15, 0.1, 0.2)],
	"ozean": ["Ozean", 60, Color(0.1, 0.45, 0.65), Color(0.95, 0.9, 0.6), Color(0.3, 0.85, 0.85)],
	"retro": ["Retro", 60, Color(0.95, 0.55, 0.15), Color(0.15, 0.6, 0.6), Color(0.45, 0.25, 0.1)],
	"himmel": ["Himmels", 120, Color(0.98, 0.97, 0.95), Color(1.0, 0.82, 0.3), Color(1.0, 0.9, 0.55)],
}
const HEADGEAR := ["cowboy", "pirate", "tophat", "knight", "viking", "samurai", "astro", "robot", "pumpkin", "beanie",
	"cap", "mohawk", "afro", "flame", "bunny", "cat", "wizard", "helmet", "mushroom", "hood", "topknot", "long"]
const ACCS := ["crown", "halo", "horns", "wings", "bat_wings", "pauldrons", "spikes", "scarf", "backpack", "jetpack",
	"tail", "bowtie", "medal", "antenna", "flower", "mustache"]
const FACES := ["happy", "angry", "shades", "eyepatch", "fangs", "sleepy", "goggles", "visor", "robot", "cyclops"]
const WEAPONS := {"melee": ["katana", "axe", "scythe", "spear", "claws", "great", "hammer", "trident"],
	"gun": ["pistol", "blaster", "bow", "cannon", "shotgun", "guitar"],
	"throw": ["bomb", "boomerang"], "magic": ["staff", "wand", "book", "fan", "lollipop"]}

static func theme_skins(b: Dictionary, count: int) -> Array:
	var keys: Array = PALETTES.keys()
	var out := []
	var i := 0
	while out.size() < count and i < 40:
		var key: String = keys[_h(b.id + "pal" + str(i)) % keys.size()]
		i += 1
		if out.any(func(sk): return sk.theme == key):
			continue
		out.append(theme_skin(b, key, out.size()))
	return out

static func theme_skin(b: Dictionary, key: String, n := 0) -> Dictionary:
	var pal: Array = PALETTES.get(key, PALETTES["gold"])
	var base: Dictionary = b.forms[0].look
	var seed: String = b.id + key
	var lk := {"robe": pal[2], "trim": pal[3], "hair": pal[4], "hat": pal[2].darkened(0.15), "blade": pal[3].lerp(Color.WHITE, 0.3),
		"scarf_color": pal[3], "acc_color": pal[3], "pack_color": pal[2].darkened(0.2), "armor_color": pal[3].lerp(Color(0.7, 0.7, 0.75), 0.5),
		"wing_color": pal[4].lerp(Color.WHITE, 0.4), "eye": pal[3].darkened(0.2)}
	# Kopfbedeckung: bei mehrformigen Brawlern nie, sonst oft eine neue
	if b.forms.size() == 1 and _h(seed + "hg") % 3 != 0:
		var hg: String = HEADGEAR[_h(seed + "hgk") % HEADGEAR.size()]
		if hg != base.get("hair_style", ""):
			lk["hair_style"] = hg
	if b.forms.size() == 1 and _h(seed + "fc") % 2 == 0:
		lk["face"] = FACES[_h(seed + "fck") % FACES.size()]
	# 1–2 eigene Accessoires
	var accs: Array = []
	for k in 1 + _h(seed + "na") % 2:
		var a: String = ACCS[_h(seed + "ac" + str(k)) % ACCS.size()]
		if not a in accs:
			accs.append(a)
	lk["acc"] = accs
	# Waffe passend zur Klasse austauschen
	var wc: String = b.get("wclass", "")
	if wc != "" and b.forms.size() == 1 and _h(seed + "wp") % 2 == 0:
		var opts: Array = WEAPONS[wc]
		lk["weapon"] = opts[_h(seed + "wpk") % opts.size()]
	var name_s: String = "%s-%s" % [pal[0], b.name]
	return {"id": "%s_%s" % [b.id, key], "name": name_s, "price": pal[1], "theme": key, "look": lk}

# ------------------------------------------------------------------ Erwachen / Reich / Geistwächter
# Diese Brawler bekommen statt ihrer normalen Super eine der großen Anime-artigen Fähigkeiten.
static func ANIME_SUPERS() -> Dictionary:
	return {
	# Erwachen: Verwandlung für einige Sekunden (neue Form mit eigenem Angriff + eigener Super)
	"Taku": ["Erwachen: Sturmklinge", "Erwacht für 10 s: neues Outfit, Aura, stärkere Schnitte mit Windwellen und eine neue Super.",
		{"type": "awaken", "dur": 10.0, "dmg": 900.0, "radius": 3.0, "form_name": "Erwacht – Sturmklinge", "hair": "flame", "acc": ["scarf", "pauldrons"],
			"atk_name": "Sturmschnitt", "atk_desc": "Präzisionsschnitt, der eine weite Windklinge aussendet.",
			"sup_name": "Himmelsspalter", "sup_desc": "5 riesige Windklingen im Fächer.",
			"sup": {"type": "fan", "count": 5, "spread": 40.0, "dmg": 1100.0, "range": 11.0, "speed": 24.0, "width": 0.8}}],
	"Blitzklinge": ["Erwachen: Donnerkönigin", "Erwacht für 10 s: Blitzrüstung, Kettenblitz-Hiebe und eine neue Super.",
		{"type": "awaken", "dur": 10.0, "dmg": 900.0, "radius": 3.0, "stun": 0.6, "form_name": "Erwacht – Donnerkönigin", "hair": "flame", "acc": ["wings", "crown"],
			"atk_name": "Donnerkette", "atk_desc": "Hiebe, deren Wellen auf 3 Gegner überspringen.",
			"sup_name": "Himmelsgericht", "sup_desc": "8 Blitze schlagen ein und betäuben.",
			"sup": {"type": "meteor", "range": 9.0, "count": 8, "dmg": 750.0, "radius": 1.5, "stun": 0.8, "interval": 0.1}}],
	"Aurelia": ["Erwachen: Sonnengöttin", "Erwacht für 10 s: goldene Rüstung, Sonnenwellen bei jedem Angriff.",
		{"type": "awaken", "dur": 10.0, "dmg": 1000.0, "radius": 3.2, "form_name": "Erwacht – Sonnengöttin", "acc": ["halo", "wings", "crown", "pauldrons"],
			"atk_name": "Sonnenschwert", "atk_desc": "Jeder Hieb sendet eine Sonnenwelle.",
			"sup_name": "Zenit", "sup_desc": "Ein riesiger Sonnenstrahl, der alles durchdringt.",
			"sup": {"type": "beam", "dmg": 3000.0, "range": 14.0, "width": 1.4, "break": true}}],
	"Nachtschatten": ["Erwachen: Mondlose Nacht", "Erwacht für 10 s: Schattenform, schneller, mit tödlichen Stichen.",
		{"type": "awaken", "dur": 10.0, "dmg": 800.0, "radius": 3.0, "form_name": "Erwacht – Mondlose Nacht", "hair": "long", "acc": ["bat_wings", "scarf"],
			"atk_name": "Nachtstich", "atk_desc": "Blitzschnelle Stiche mit Schattenwelle.",
			"sup_name": "Schattentanz", "sup_desc": "Springt 5-mal zwischen Gegnern hin und her.",
			"sup": {"type": "blink", "range": 8.0, "hits": 5, "dmg": 750.0, "stun": 0.3}}],
	"Kaiser Frost": ["Erwachen: Ewiger Kaiser", "Erwacht für 10 s: Eisrüstung, vernichtende Frosthiebe.",
		{"type": "awaken", "dur": 10.0, "dmg": 1000.0, "radius": 3.5, "slow": 2.0, "form_name": "Erwacht – Ewiger Kaiser", "hair": "knight", "acc": ["crown", "pauldrons", "spikes", "wings"],
			"atk_name": "Kaiserfrost", "atk_desc": "Hiebe mit Eiswellen, die einfrieren.",
			"sup_name": "Weißer Tod", "sup_desc": "Ein Eissturm um ihn, der alles einfriert.",
			"sup": {"type": "slam", "waves": 3, "radius": 3.0, "dmg": 900.0, "stun": 0.8}}],
	"Säbelzahn": ["Erwachen: Urbestie", "Erwacht für 10 s: riesige Bestienform mit wilden Krallen.",
		{"type": "awaken", "dur": 10.0, "dmg": 900.0, "radius": 3.0, "form_name": "Erwacht – Urbestie", "hair": "flame", "acc": ["horns", "spikes", "tail"],
			"atk_name": "Bestienklaue", "atk_desc": "Wilde Klauenhiebe mit Eiswelle.",
			"sup_name": "Urschrei", "sup_desc": "Sprung mit gewaltigem Einschlag.",
			"sup": {"type": "leap", "range": 9.0, "radius": 3.5, "dmg": 2200.0, "stun": 1.0, "break": true}}],
	"Aurion": ["Geistwächter: Ursprung", "Ein goldener Geist kämpft an seiner Seite.",
		{"type": "spirit", "dur": 8.0, "dmg": 230.0, "interval": 0.11, "reach": 3.0, "spirit_hair": "long", "spirit_face": "visor", "spirit_acc": ["halo", "wings", "pauldrons"], "spirit_color": Color(1.0, 0.85, 0.35),
			"stand_ult": {"type": "rewind", "radius": 7.5, "dmg": 2600.0, "stun": 2.0}, "stand_ult_name": "Rückfall",
			"stand_ult_desc": "Spult alle Gegner im Umkreis 3 s in der Zeit zurück: zurück an ihren alten Ort, Geschosse gelöscht, Munition leer, 2 s betäubt und schwer verletzt."}],
	"Kalamis": ["Geistwächter: Verhängnis", "Ein Unheilsgeist schwebt an seiner Seite.",
		{"type": "spirit", "dur": 8.0, "dmg": 210.0, "interval": 0.12, "reach": 3.0, "spirit_hair": "hood", "spirit_face": "cyclops", "spirit_acc": ["bat_wings", "spikes"], "spirit_color": Color(0.45, 0.8, 1.0),
			"stand_ult": {"type": "doom", "radius": 7.0, "dmg": 700.0, "dur": 9.0}, "stand_ult_name": "Verhängnis",
			"stand_ult_desc": "9 s lang trifft jeden Gegner in seiner Nähe immer wieder zufälliges Unglück: herabstürzende Trümmer, die betäuben und verlangsamen."}],
	"Kairo": ["Erwachen: Sonnenkern", "Erwacht für 12 s: Sonnenaura, Heiligenschein und Lichtflügel, stärkere Kombos und eine gewaltige Energiekanone als Super.",
		{"type": "awaken", "dur": 12.0, "dmg": 1000.0, "radius": 3.2, "knock": 1.5, "form_name": "Erwacht – Sonnenkern", "acc": ["halo", "wings", "pauldrons"],
			"atk_name": "Sonnenfaust-Sturm", "atk_desc": "Kombo mit durchschlagender Energiewelle.",
			"sup_name": "Sonnenkanone", "sup_desc": "Ein riesiger Energiestrahl quer über die Arena.",
			"sup": {"type": "beam", "dmg": 3200.0, "range": 15.0, "width": 1.5, "knock": 2.5, "break": true}}],
	"Zirr": ["Erwachen: Blitzrausch", "Erwacht für 10 s: Blitzaura, viel schneller, Krallen mit Kettenblitz-Wellen.",
		{"type": "awaken", "dur": 10.0, "dmg": 800.0, "radius": 3.0, "stun": 0.5, "form_name": "Erwacht – Blitzrausch", "hair": "flame", "acc": ["scarf", "spikes"],
			"atk_name": "Donnerkette", "atk_desc": "Dolchstiche mit überspringender Blitzwelle.",
			"sup_name": "Blitzgewitter", "sup_desc": "Springt 6-mal blitzschnell zwischen Gegnern und betäubt sie.",
			"sup": {"type": "blink", "range": 9.0, "hits": 6, "dmg": 650.0, "stun": 0.5}}],
	"Grimmzahn": ["Geistwächter: Höllenschlächter", "Ein kleiner Dämonengeist schlägt 8 s lang mit wilden Hieben zu und raubt Leben.",
		{"type": "spirit", "dur": 8.0, "dmg": 190.0, "interval": 0.12, "reach": 2.8, "spirit_hair": "flame", "spirit_face": "fangs", "spirit_acc": ["horns", "spikes"], "buff_after": {"type": "buff", "dur": 8.0, "lifesteal": 0.3}}],
	"Nyxara": ["Reich des Sternenmeers", "Eine Sternenkuppel: gefangene Gegner schweben fast still, Nyxara wird viel stärker.",
		{"type": "domain", "range": 0.0, "radius": 5.5, "dur": 6.0, "dps": 450.0, "slow": 2.5, "stun": 0.15, "pull": 0.8, "dmg_mult": 1.6}],
	# Reich: Kuppel, die Gegner einsperrt
	"Chronos": ["Reich der stillen Zeit", "Eine Zeitkuppel: Gegner darin sind gefangen und fast eingefroren.",
		{"type": "domain", "range": 0.0, "radius": 5.0, "dur": 6.0, "dps": 300.0, "slow": 3.0, "dmg_mult": 1.4}],
	"Astra": ["Reich der tausend Sterne", "Eine Sternenkuppel: Gegner gefangen und zur Mitte gezogen.",
		{"type": "domain", "range": 0.0, "radius": 5.0, "dur": 6.0, "dps": 450.0, "pull": 1.5, "dmg_mult": 1.5}],
	"Seelensammler": ["Reich der verlorenen Seelen", "Eine Seelenkuppel: Gegner gefangen, er raubt Leben mit jedem Treffer.",
		{"type": "domain", "range": 0.0, "radius": 5.0, "dur": 6.0, "dps": 400.0, "slow": 0.8, "dmg_mult": 1.3, "lifesteal": 0.5}],
	"Echo": ["Reich des Widerhalls", "Eine Klangkuppel: Gegner gefangen, Echo wird viel schneller und stärker.",
		{"type": "domain", "range": 0.0, "radius": 4.8, "dur": 6.0, "dps": 350.0, "stun": 0.15, "dmg_mult": 1.7, "speed": true}],
	"Morla": ["Reich des Giftsumpfs", "Eine Giftkuppel: gefangene Gegner nehmen hohen Giftschaden.",
		{"type": "domain", "range": 0.0, "radius": 5.0, "dur": 6.0, "dps": 650.0, "slow": 1.0, "dmg_mult": 1.2}],
	"Tiefseeauge": ["Reich der Tiefsee", "Eine Wasserkuppel: Gegner gefangen, verlangsamt und in die Tiefe gezogen.",
		{"type": "domain", "range": 0.0, "radius": 5.2, "dur": 6.0, "dps": 400.0, "slow": 1.5, "pull": 1.0, "dmg_mult": 1.4}],
	# Geistwächter: Kampfgeist mit Schlaghagel
	"Golem": ["Geistwächter: Urgestein", "Ein riesiger Steingeist kämpft 8 s an seiner Seite – schwere Schläge mit Rückstoß.",
		{"type": "spirit", "dur": 8.0, "dmg": 420.0, "interval": 0.45, "reach": 2.8, "knock": 1.2, "spirit_hair": "bald", "spirit_face": "cyclops", "spirit_acc": ["spikes", "pauldrons", "horns"]}],
	"Kraken-Kai": ["Geistwächter: Tiefenkrake", "Ein Krakengeist schlägt 7 s lang mit Tentakel-Hagel zu.",
		{"type": "spirit", "dur": 7.0, "dmg": 150.0, "interval": 0.12, "reach": 3.2, "slow": 0.5, "spirit_hair": "bald", "spirit_face": "fangs", "spirit_acc": ["tail", "spikes"]}],
	"Mumie Mo": ["Geistwächter: Pharaonengeist", "Ein Pharaonengeist schlägt zu und raubt Leben.",
		{"type": "spirit", "dur": 7.0, "dmg": 200.0, "interval": 0.16, "reach": 2.6, "spirit_hair": "hood", "spirit_face": "cyclops", "spirit_acc": ["crown"]}],
	"Felsenfaust": ["Geistwächter: Berggeist", "Ein Berggeist trommelt 7 s lang Faustschläge auf Gegner.",
		{"type": "spirit", "dur": 7.0, "dmg": 170.0, "interval": 0.12, "reach": 2.6, "spirit_hair": "viking", "spirit_face": "angry", "spirit_acc": ["pauldrons", "beard"]}],
	"Arietta": ["Geistwächter: Sirene", "Eine singende Geisterdiva schlägt zu und lässt Gegner kurz erstarren.",
		{"type": "spirit", "dur": 7.0, "dmg": 180.0, "interval": 0.15, "reach": 3.0, "stun": 0.1, "spirit_hair": "long", "spirit_face": "sleepy", "spirit_acc": ["wings", "halo"]}],
	"Dudel": ["Geistwächter: Rhythmusgeist", "Ein Groove-Geist schlägt im Takt auf Gegner ein.",
		{"type": "spirit", "dur": 7.0, "dmg": 160.0, "interval": 0.12, "reach": 2.6, "spirit_hair": "afro", "spirit_face": "shades", "spirit_acc": ["bowtie", "pauldrons"]}],
	}

## Erwachte Form aus der Grundform erzeugen (stärker, neues Aussehen, neue Super).
static func _awakened_form(base: Dictionary, sup: Dictionary, col: Color, dm: float) -> Dictionary:
	var f2: Dictionary = base.duplicate(true)
	f2.name = sup.form_name
	var lk: Dictionary = f2.look
	lk["size"] = lk.get("size", 1.0) * 1.12
	if sup.has("hair"):
		lk["hair_style"] = sup.hair
	var acc: Array = lk.get("acc", []).duplicate()
	for a in sup.get("acc", []):
		if not a in acc:
			acc.append(a)
	lk["acc"] = acc
	lk["robe"] = (lk.robe as Color).lerp(col.darkened(0.3), 0.5)
	lk["trim"] = col.lerp(Color.WHITE, 0.3)
	lk["hair"] = (lk.hair as Color).lerp(col, 0.6)
	lk["eye"] = col
	lk["cape"] = not ("wings" in acc or "bat_wings" in acc)
	f2["aura"] = Color(col.r, col.g, col.b, 0.85)
	f2["hp_mul"] = 1.2
	f2["speed_mul"] = 1.1
	f2["reload_mul"] = 0.7
	f2["stance"] = 0.7
	f2["combo_name"] = sup.atk_name
	f2["combo_desc"] = sup.atk_desc
	if f2.has("combo"):
		var steps: Array = []
		for st in f2.combo:
			var st2: Dictionary = st.duplicate(true)
			st2.dmg = round(st2.dmg * 1.4)
			st2.range = st2.range * 1.1
			steps.append(st2)
		var last: Dictionary = steps[-1]
		last["wave"] = {"dmg": round(650.0 * dm), "range": 7.5, "width": 0.7, "speed": 17.0, "color": col, "pierce": true,
			"chain": 3 if sup.atk_name == "Donnerkette" else 0, "slow": 1.5 if sup.atk_name == "Kaiserfrost" else 0.0}
		f2["combo"] = steps
	else:
		var atk: Dictionary = f2.attack.duplicate(true)
		atk.dmg = round(atk.dmg * 1.5)
		atk["pierce"] = true
		f2["attack"] = atk
	var s2: Dictionary = _prep(sup.sup.duplicate(true), col, dm)
	s2["name"] = sup.sup_name
	s2["desc"] = sup.sup_desc
	f2["super"] = s2
	return f2

# ------------------------------------------------------------------ Individuelle Fähigkeiten
# Pro Brawler: [Angriffsname, Beschreibung, Angriff, Super-Name, Beschreibung, Super].
# Farben setzt build() aus dem Element. Schaden wird mit Seltenheit leicht skaliert.
static func M(steps: Array) -> Dictionary:
	return {"type": "melee", "combo": steps}

static func KITS() -> Dictionary:
	return {
	# ---------------- Selten
	"Zunder": ["Glutsalve", "1 Munition = 3 schnelle Feuerkugeln.", {"type": "shot", "dmg": 330.0, "range": 8.0, "speed": 22.0, "burst": 3, "interval": 0.09, "width": 0.22},
		"Feuersbrunst", "Setzt den Zielbereich 4 s lang in Flammen.", {"type": "zone", "range": 7.0, "radius": 2.3, "dur": 4.0, "dps": 650.0}],
	"Quirl": ["Wirbelschnitt", "1 Munition = 2 Rundum-Schnitte um sich herum.", M([{"t": 0.0, "dir": "ltr", "dmg": 430.0, "range": 2.1, "arc": 360.0}, {"t": 0.15, "dir": "rtl", "dmg": 430.0, "range": 2.1, "arc": 360.0}]),
		"Taifunlauf", "Wird 2,5 s zum Wirbelwind: trifft ringsum ständig und ist schneller.", {"type": "spin", "dur": 2.5, "radius": 2.2, "dmg": 280.0}],
	"Klotz": ["Felsfaust", "1 Munition = ein Schlag, der Gegner weit wegschleudert.", M([{"t": 0.0, "dir": "over", "dmg": 1200.0, "range": 2.4, "arc": 120.0, "knock": 2.2}]),
		"Erdbebenstoß", "3 Bodenwellen um ihn herum, die Kisten zerstören.", {"type": "slam", "waves": 3, "radius": 2.2, "dmg": 650.0, "knock": 1.2, "break": true}],
	"Pippa": ["Zappelbombe", "1 Munition = eine Bombe, die in 3 Mini-Explosionen zerplatzt.", {"type": "lob", "dmg": 700.0, "range": 7.5, "radius": 1.3, "cluster": 3},
		"Tesla-Turm", "Baut einen Turm, dessen Blitze auf weitere Gegner überspringen.", {"type": "turret", "dur": 8.0, "interval": 0.75, "dmg": 260.0, "range": 7.0, "chain": 2}],
	"Moosbart": ["Dornenspross", "1 Munition = eine Kugel, die ihn um 30 % des Schadens heilt.", {"type": "shot", "dmg": 620.0, "range": 8.0, "speed": 12.0, "width": 0.35, "visual": "orb", "drain": 0.3},
		"Wurzelgriff", "Wurzeln halten Gegner im Zielbereich fest (stark verlangsamt) und schaden ihnen.", {"type": "zone", "range": 7.0, "radius": 2.5, "dur": 4.0, "dps": 300.0, "slow": 3.0}],
	"Rostig": ["Schrottkanone", "1 Munition = 6 Schrottteile in breitem Fächer.", {"type": "shot", "dmg": 250.0, "range": 4.5, "speed": 16.0, "count": 6, "spread": 55.0},
		"Schrottlawine", "Rollt nach vorne, schleudert alles weg und zerstört Kisten.", {"type": "dash", "dmg": 1600.0, "range": 6.5, "speed": 15.0, "knock": 3.0, "break": true}],
	"Flitz": ["Paketexpress", "1 Munition = ein Paket, das bis zu 2-mal von Wänden abprallt.", {"type": "shot", "dmg": 650.0, "range": 9.0, "speed": 20.0, "width": 0.3, "bounce": 2},
		"Eillieferung", "5 s schneller, sofort nachgeladen und 30 % mehr Schaden.", {"type": "buff", "dur": 5.0, "speed": true, "reload": true, "dmg_mult": 1.3}],
	"Kiesel": ["Kieselbumerang", "1 Munition = ein Bumerang, der hin und zurück trifft.", {"type": "shot", "dmg": 480.0, "range": 6.5, "speed": 15.0, "width": 0.35, "boomerang": true, "visual": "orb"},
		"Steinlawine", "6 Felsbrocken stürzen auf den Zielbereich.", {"type": "meteor", "range": 8.0, "count": 6, "dmg": 600.0, "radius": 1.3, "spread": 2.5}],
	"Brise": ["Windklinge", "1 Munition = 2 Windklingen mit Rückstoß.", {"type": "shot", "dmg": 450.0, "range": 7.5, "speed": 18.0, "count": 2, "spread": 10.0, "width": 0.3, "knock": 0.8},
		"Fächersturm", "5 große Windsicheln im Fächer, die alles wegschieben.", {"type": "fan", "count": 5, "spread": 70.0, "dmg": 600.0, "range": 8.0, "speed": 16.0, "width": 0.7, "knock": 2.0}],
	"Knall": ["Böller", "1 Munition = ein Böller mit großer Explosion.", {"type": "lob", "dmg": 950.0, "range": 7.5, "radius": 1.6},
		"Großes Finale", "8 Feuerwerkskörper regnen im Zielbereich herab.", {"type": "meteor", "range": 8.0, "count": 8, "dmg": 450.0, "radius": 1.2, "interval": 0.12, "spread": 2.8}],
	"Hagel": ["Frostpfeil", "1 Munition = ein weiter Pfeil, der verlangsamt.", {"type": "shot", "dmg": 1000.0, "range": 11.0, "speed": 30.0, "width": 0.22, "slow": 1.0},
		"Eissturm", "Hagelkörner prasseln herab und verlangsamen stark.", {"type": "meteor", "range": 9.0, "count": 7, "dmg": 480.0, "radius": 1.5, "slow": 1.5, "spread": 2.6}],
	"Tobi": ["Axthieb", "1 Munition = ein Seitenhieb und ein Schlag von oben.", M([{"t": 0.0, "dir": "ltr", "dmg": 650.0, "range": 2.6, "arc": 140.0}, {"t": 0.2, "dir": "over", "dmg": 600.0, "range": 2.6, "arc": 100.0, "knock": 1.0}]),
		"Axtwurf", "Wirft seine Axt, die durch alle fliegt und zurückkehrt.", {"type": "shot", "dmg": 1100.0, "range": 8.0, "speed": 14.0, "width": 0.6, "boomerang": true, "pierce": true, "visual": "orb"}],
	"Mira": ["Mondsichel", "1 Munition = eine Kugel, die am Ende in 4 Splitter zerbricht.", {"type": "shot", "dmg": 550.0, "range": 7.0, "speed": 12.0, "width": 0.35, "visual": "orb", "split": 4},
		"Sternenkreis", "4 Sterne kreisen 6 s um sie und treffen jeden, der nahe kommt.", {"type": "orbit", "count": 4, "dmg": 420.0, "dur": 6.0, "radius": 1.8}],
	"Ruß": ["Rußwolke", "1 Munition = 5 Rußladungen, die leicht verlangsamen.", {"type": "shot", "dmg": 280.0, "range": 5.0, "speed": 16.0, "count": 5, "spread": 45.0, "slow": 0.5},
		"Rußbombe", "Riesige Rußwolke: Schaden und starke Verlangsamung für 4 s.", {"type": "lob", "dmg": 900.0, "range": 8.0, "radius": 2.2, "zone": {"radius": 2.2, "dur": 4.0, "dps": 120.0, "slow": 2.0}}],
	"Sumpfi": ["Sumpfblase", "1 Munition = eine Blase, die eine giftige Pfütze hinterlässt.", {"type": "lob", "dmg": 400.0, "range": 7.0, "radius": 1.5, "zone": {"radius": 1.5, "dur": 2.5, "dps": 320.0, "slow": 0.6}},
		"Moorgrund", "Großes Moor: Gegner werden langsam, Verbündete geheilt.", {"type": "zone", "range": 6.0, "radius": 3.2, "dur": 5.0, "dps": 380.0, "slow": 1.0, "heal": 0.06}],
	"Blinker": ["Leuchtstrahl", "1 Munition = ein sofortiger Lichtstrahl.", {"type": "beam", "dmg": 750.0, "range": 9.0, "width": 0.35},
		"Leuchtturm", "Baut einen Leuchtturm, der Gegner beschießt und verlangsamt.", {"type": "turret", "dur": 8.0, "interval": 0.5, "dmg": 240.0, "range": 7.5, "slow": 0.6}],
	"Bolzen": ["Armbrustbolzen", "1 Munition = ein Bolzen, der durch alle Gegner fliegt.", {"type": "shot", "dmg": 900.0, "range": 10.5, "speed": 32.0, "width": 0.22, "pierce": true},
		"Bolzenhagel", "9 durchschlagende Bolzen im weiten Fächer.", {"type": "shot", "dmg": 450.0, "range": 9.0, "speed": 28.0, "count": 9, "spread": 70.0, "pierce": true}],
	"Fauchi": ["Krallenhatz", "1 Munition = 3 schnelle Krallenhiebe.", M([{"t": 0.0, "dir": "thrust", "dmg": 360.0, "range": 2.2, "arc": 80.0}, {"t": 0.07, "dir": "ltr", "dmg": 360.0, "range": 2.2, "arc": 110.0}, {"t": 0.14, "dir": "rtl", "dmg": 420.0, "range": 2.2, "arc": 110.0}]),
		"Raubtiersprung", "Springt auf Gegner und heilt sich danach 4 s lang durch Treffer.", {"type": "leap", "range": 7.0, "radius": 1.8, "dmg": 1400.0, "buff_after": {"type": "buff", "dur": 4.0, "lifesteal": 0.4}}],
	"Krabbler": ["Dreizackstich", "1 Munition = ein weitreichender Stich mit Rückstoß.", M([{"t": 0.0, "dir": "thrust", "dmg": 1100.0, "range": 3.3, "arc": 50.0, "knock": 1.2}]),
		"Flutwelle", "Eine riesige Welle, die alle weit zurückspült.", {"type": "wave", "dmg": 1400.0, "range": 8.0, "width": 1.8, "speed": 10.0, "pierce": true, "knock": 3.0}],
	"Dudel": ["Akkordsalve", "1 Munition = 3 Töne im Fächer, die leicht verlangsamen.", {"type": "shot", "dmg": 340.0, "range": 7.5, "speed": 15.0, "count": 3, "spread": 25.0, "width": 0.3, "visual": "orb", "slow": 0.4},
		"Bassdrop", "3 Schallwellen um ihn herum, die kurz betäuben.", {"type": "slam", "waves": 3, "radius": 2.0, "dmg": 580.0, "stun": 0.4}],
	"Pfiff": ["Pfiffschuss", "1 Munition = 2 Schüsse, deren Funken auf einen weiteren Gegner springen.", {"type": "shot", "dmg": 440.0, "range": 8.5, "speed": 22.0, "burst": 2, "interval": 0.1, "chain": 1},
		"Rote Karte", "Teleportiert zum Gegner und betäubt ihn 2 s.", {"type": "blink", "range": 8.0, "dmg": 1600.0, "stun": 2.0}],
	"Brummer": ["Hummelkanone", "1 Munition = eine Kugel, die beim Aufprall explodiert.", {"type": "shot", "dmg": 800.0, "range": 8.0, "speed": 11.0, "width": 0.5, "visual": "orb", "explode": 1.3},
		"Schwarmangriff", "6 Hummeln umkreisen ihn 7 s lang.", {"type": "orbit", "count": 6, "dmg": 300.0, "dur": 7.0, "radius": 2.2, "spin_speed": 6.0}],
	"Koko": ["Kokosnuss", "1 Munition = eine Kokosnuss, die Gegner kurz betäubt.", {"type": "lob", "dmg": 950.0, "range": 7.0, "radius": 1.2, "stun": 0.35, "knock": 1.2},
		"Palmenregen", "5 Kokosnüsse fallen vom Himmel.", {"type": "meteor", "range": 8.0, "count": 5, "dmg": 700.0, "radius": 1.5, "stun": 0.4}],
	"Schnapp": ["Bärenfalle", "1 Munition = legt eine Falle, die Gegner betäubt (max. 4).", {"type": "mine", "range": 1.5, "dmg": 850.0, "radius": 1.4, "stun": 1.0},
		"Palisade", "Baut eine Holzwand (5 Felder) für 6 s.", {"type": "barrier", "range": 2.2, "width": 5, "dur": 6.0}],
	"Wuschel": ["Kuschelklatscher", "1 Munition = 3 Klatscher, der letzte betäubt kurz.", M([{"t": 0.0, "dir": "ltr", "dmg": 380.0, "range": 2.4, "arc": 130.0}, {"t": 0.12, "dir": "rtl", "dmg": 380.0, "range": 2.4, "arc": 130.0}, {"t": 0.26, "dir": "over", "dmg": 500.0, "range": 2.5, "arc": 100.0, "stun": 0.4}]),
		"Riesenknuddler", "Zieht alle Gegner in der Nähe zu sich heran und drückt zu.", {"type": "zone", "range": 0.0, "radius": 3.2, "dur": 1.6, "dps": 1100.0, "pull": 5.0}],
	# ---------------- Super Selten
	"Glutherz": ["Ambossschlag", "1 Munition = ein Hammerschlag, der eine Feuerwelle auslöst.", M([{"t": 0.0, "dir": "over", "dmg": 1050.0, "range": 2.6, "arc": 110.0, "wave": {"dmg": 450.0, "range": 4.5, "width": 0.6, "speed": 12.0}}]),
		"Schmiedefeuer", "Explodiert in Flammen und hat 5 s Schild und +60 % Schaden.", {"type": "buff", "dur": 5.0, "dmg_mult": 1.6, "shield": true, "dmg": 800.0, "radius": 2.5}],
	"Raureif": ["Eissplitter", "1 Munition = 3 geworfene Eissplitter, die verlangsamen.", {"type": "shot", "dmg": 330.0, "range": 6.5, "speed": 22.0, "count": 3, "spread": 12.0, "width": 0.22, "slow": 0.6},
		"Eisspiegel", "Wird 4 s unsichtbar und schneller.", {"type": "buff", "dur": 4.0, "invis": true, "speed": true}],
	"Zappel": ["Funkenlanze", "1 Munition = ein kurzer Blitzstrahl, der auf 2 Gegner überspringt.", {"type": "beam", "dmg": 700.0, "range": 4.5, "width": 0.5, "chain": 2},
		"Gewitterspeer", "Ein Blitzspeer, der durch alles fliegt und auf 3 Gegner überspringt.", {"type": "shot", "dmg": 1900.0, "range": 12.0, "speed": 30.0, "width": 0.5, "pierce": true, "chain": 3, "visual": "orb"}],
	"Morla": ["Giftfluch", "1 Munition = ein zielsuchender Fluch, der eine Giftpfütze hinterlässt.", {"type": "shot", "dmg": 480.0, "range": 8.0, "speed": 9.0, "width": 0.35, "visual": "orb", "homing": 4.0, "zone": {"radius": 1.2, "dur": 2.0, "dps": 220.0}},
		"Hexenkessel", "Ein brodelnder Giftkessel: Schaden und Verlangsamen für 5 s.", {"type": "zone", "range": 7.0, "radius": 3.4, "dur": 5.0, "dps": 450.0, "slow": 1.0}],
	"Kanonenkäthe": ["Prallkugel", "1 Munition = eine Kanonenkugel, die 3-mal abprallt.", {"type": "shot", "dmg": 950.0, "range": 10.0, "speed": 13.0, "width": 0.5, "visual": "orb", "bounce": 3},
		"Volle Breitseite", "5 explodierende Kanonenkugeln im Fächer.", {"type": "shot", "dmg": 700.0, "range": 9.0, "speed": 14.0, "count": 5, "spread": 50.0, "width": 0.5, "visual": "orb", "explode": 1.2}],
	"Säbelzahn": ["Frostbiss", "1 Munition = 3 eisige Hiebe, die verlangsamen.", M([{"t": 0.0, "dir": "ltr", "dmg": 420.0, "range": 2.7, "arc": 140.0, "slow": 0.8}, {"t": 0.12, "dir": "rtl", "dmg": 420.0, "range": 2.7, "arc": 140.0, "slow": 0.8}, {"t": 0.26, "dir": "over", "dmg": 600.0, "range": 2.9, "arc": 100.0, "slow": 0.8}]),
		"Gletscherspalte", "Eine Eiswelle, die betäubt und ein Eisfeld hinterlässt.", {"type": "wave", "dmg": 1400.0, "range": 8.0, "width": 1.2, "speed": 12.0, "pierce": true, "stun": 1.0, "break": true, "zone": {"radius": 2.0, "dur": 3.0, "dps": 0.0, "slow": 1.0}}],
	"Schattenfuchs": ["Fuchsklaue", "1 Munition = 2 Klauenhiebe, die ihn heilen.", M([{"t": 0.0, "dir": "ltr", "dmg": 520.0, "range": 2.3, "arc": 120.0, "drain": 0.25}, {"t": 0.12, "dir": "rtl", "dmg": 520.0, "range": 2.3, "arc": 120.0, "drain": 0.25}]),
		"Fuchsfeuer", "5 Geisterflammen umkreisen ihn, dazu 5 s Tempo.", {"type": "orbit", "count": 5, "dmg": 340.0, "dur": 5.0, "radius": 1.5, "buff_after": {"type": "buff", "dur": 5.0, "speed": true}}],
	"Felsenfaust": ["Gipfelhieb", "1 Munition = zwei wuchtige Fausthiebe.", M([{"t": 0.0, "dir": "ltr", "dmg": 650.0, "range": 2.4, "arc": 120.0}, {"t": 0.18, "dir": "rtl", "dmg": 650.0, "range": 2.4, "arc": 120.0, "knock": 1.5}]),
		"Bergsturz", "Springt weit und schlägt mit voller Wucht ein – zerstört Kisten.", {"type": "leap", "range": 8.0, "radius": 3.0, "dmg": 1900.0, "stun": 0.8, "break": true}],
	"Nova": ["Plasmasalve", "1 Munition = 4 schnelle Plasmaschüsse.", {"type": "shot", "dmg": 260.0, "range": 9.0, "speed": 26.0, "burst": 4, "interval": 0.07, "width": 0.2},
		"Orbitalschlag", "Ein gewaltiger Laser aus dem All, der Kisten zerschmilzt.", {"type": "beam", "dmg": 2500.0, "range": 13.0, "width": 1.0, "break": true}],
	"Wellenreiter": ["Gischtschuss", "1 Munition = ein Wasserschuss mit starkem Rückstoß.", {"type": "shot", "dmg": 520.0, "range": 7.0, "speed": 16.0, "width": 0.5, "visual": "orb", "knock": 1.6},
		"Monsterwelle", "Eine gigantische Welle, die alle mitreißt und verlangsamt.", {"type": "wave", "dmg": 1250.0, "range": 10.0, "width": 2.2, "speed": 9.0, "pierce": true, "knock": 4.0, "slow": 1.0}],
	"Dornröschen": ["Rosenranke", "1 Munition = eine Ranke (Strahl), die Gegner festhält.", {"type": "beam", "dmg": 620.0, "range": 7.0, "width": 0.3, "slow": 1.2},
		"Dornenhecke", "Lässt eine Dornenhecke wachsen und heilt sich um 30 %.", {"type": "barrier", "range": 2.2, "width": 5, "dur": 6.0, "buff_after": {"type": "buff", "dur": 2.0, "heal": 0.3}}],
	"Donnerkeil": ["Blitzbumerang", "1 Munition = ein Bumerang, dessen Blitze überspringen.", {"type": "shot", "dmg": 440.0, "range": 7.0, "speed": 16.0, "width": 0.3, "boomerang": true, "chain": 1, "visual": "orb"},
		"Kugelblitz", "Ein langsamer Kugelblitz, der wächst und Blitze verteilt.", {"type": "shot", "dmg": 1300.0, "range": 9.0, "speed": 7.0, "width": 0.5, "grow": 2.0, "pierce": true, "chain": 2, "visual": "orb"}],
	"Pilzkopf": ["Sporenwolke", "1 Munition = eine Sporenwolke, die verlangsamt.", {"type": "lob", "dmg": 300.0, "range": 7.0, "radius": 1.8, "zone": {"radius": 1.8, "dur": 3.0, "dps": 330.0, "slow": 0.5}},
		"Sporenexplosion", "2 Sporenwellen um ihn herum, die lange verlangsamen.", {"type": "slam", "waves": 2, "radius": 2.6, "dmg": 750.0, "slow": 2.0}],
	"Ritter Rost": ["Ritterschlag", "1 Munition = ein schwerer Schwertschlag von oben.", M([{"t": 0.0, "dir": "over", "dmg": 1050.0, "range": 2.9, "arc": 110.0}]),
		"Letzte Bastion", "5 s Schild, +40 % Schaden und 20 % Heilung.", {"type": "buff", "dur": 5.0, "shield": true, "dmg_mult": 1.4, "heal": 0.2}],
	"Tiefseeted": ["Harpune", "1 Munition = eine Harpune, die den Gegner heranzieht.", {"type": "shot", "dmg": 750.0, "range": 8.0, "speed": 18.0, "width": 0.3, "pull": 4.0},
		"Tiefenstrudel", "Ein Strudel, der Gegner in die Mitte zieht.", {"type": "zone", "range": 7.0, "radius": 3.0, "dur": 3.0, "dps": 450.0, "pull": 4.0}],
	"Kobold": ["Glückstopf", "1 Munition = ein Topf, der in 2 Glücksexplosionen zerspringt.", {"type": "lob", "dmg": 700.0, "range": 7.5, "radius": 1.4, "cluster": 2, "knock": 0.8},
		"Regenbogenschatz", "Goldregen: 6 Einschläge, die Verbündete heilen.", {"type": "meteor", "range": 8.0, "count": 6, "dmg": 500.0, "radius": 1.3, "zone": {"radius": 1.5, "dur": 2.0, "heal": 0.1}}],
	"Lavalurch": ["Lavaklaue", "1 Munition = 2 Klauenhiebe und ein Stoß mit Rückstoß.", M([{"t": 0.0, "dir": "ltr", "dmg": 440.0, "range": 2.6, "arc": 130.0}, {"t": 0.12, "dir": "rtl", "dmg": 440.0, "range": 2.6, "arc": 130.0}, {"t": 0.26, "dir": "thrust", "dmg": 580.0, "range": 2.9, "arc": 70.0, "knock": 1.2}]),
		"Vulkansprung", "Springt auf Gegner und hinterlässt einen Lavasee.", {"type": "leap", "range": 7.0, "radius": 2.6, "dmg": 1500.0, "zone": {"radius": 2.6, "dur": 4.0, "dps": 400.0}}],
	"Spuk": ["Spukball", "1 Munition = ein Geisterball, der Gegner verfolgt.", {"type": "shot", "dmg": 560.0, "range": 8.5, "speed": 10.0, "width": 0.4, "visual": "orb", "homing": 3.0, "slow": 0.6},
		"Schreckensschrei", "Ein Schrei, der alle in der Nähe 1,2 s betäubt.", {"type": "slam", "radius": 4.0, "dmg": 500.0, "stun": 1.2}],
	"Kaktus Karl": ["Stachelkranz", "1 Munition = 9 Stacheln in alle Richtungen.", {"type": "shot", "dmg": 220.0, "range": 4.5, "speed": 15.0, "count": 9, "spread": 320.0, "width": 0.2},
		"Dornenpanzer", "Stacheln explodieren um ihn herum, dazu 5 s Schild.", {"type": "buff", "dur": 5.0, "shield": true, "dmg": 950.0, "radius": 3.0}],
	"Schallwelle": ["Bassbombe", "1 Munition = eine Schallkugel, die mit der Strecke wächst.", {"type": "shot", "dmg": 700.0, "range": 7.0, "speed": 9.0, "width": 0.4, "grow": 2.0, "pierce": true, "knock": 1.0, "visual": "orb"},
		"Schallkanone", "Ein breiter Schallstrahl, der alle wegdrückt.", {"type": "beam", "dmg": 1700.0, "range": 12.0, "width": 1.2, "knock": 3.0}],
	"Eulalia": ["Eulenblick", "1 Munition = ein Pfeil, der leicht zum Ziel lenkt.", {"type": "shot", "dmg": 900.0, "range": 11.0, "speed": 24.0, "width": 0.22, "homing": 2.0},
		"Federwirbel", "16 Federn fliegen in alle Richtungen.", {"type": "nova", "dmg": 420.0, "range": 7.0, "speed": 13.0, "count": 16, "burst": 1, "width": 0.3}],
	"Tornado": ["Sensenschwung", "1 Munition = 2 extrem weite Sensenschwünge.", M([{"t": 0.0, "dir": "ltr", "dmg": 600.0, "range": 3.0, "arc": 220.0}, {"t": 0.2, "dir": "rtl", "dmg": 600.0, "range": 3.0, "arc": 220.0, "knock": 0.6}]),
		"Windhose", "Ein Tornado zieht Gegner ein und wirbelt sie herum.", {"type": "zone", "range": 7.0, "radius": 2.5, "dur": 3.5, "dps": 500.0, "pull": 4.0}],
	"Funkelfee": ["Feenstaub", "1 Munition = Feenstaub, der abprallt und sie heilt.", {"type": "shot", "dmg": 520.0, "range": 8.0, "speed": 13.0, "width": 0.35, "visual": "orb", "bounce": 1, "drain": 0.4},
		"Sternenschutz", "Ein Heilkreis um sie, der 6 s lang alle Verbündeten heilt.", {"type": "zone", "range": 0.0, "radius": 3.5, "dur": 6.0, "heal": 0.15}],
	"Panzerknacker": ["Tresorschrot", "1 Munition = 4 Schrotkugeln, die Kisten durchschlagen.", {"type": "shot", "dmg": 320.0, "range": 5.5, "speed": 16.0, "count": 4, "spread": 30.0, "break": true},
		"Dynamitpaket", "Legt ein riesiges Dynamitpaket, das Kisten sprengt.", {"type": "mine", "range": 1.8, "dmg": 2400.0, "radius": 2.6, "break": true}],
	"Mammut": ["Stoßzahn", "1 Munition = ein Stoß, der verlangsamt und wegschleudert.", M([{"t": 0.0, "dir": "thrust", "dmg": 1150.0, "range": 2.8, "arc": 70.0, "knock": 2.0, "slow": 0.8}]),
		"Stampede", "Stürmt los, trampelt alles nieder und verlangsamt.", {"type": "dash", "dmg": 1500.0, "range": 9.0, "speed": 13.0, "knock": 3.0, "slow": 2.0}],
	# ---------------- Episch
	"Phönixa": ["Phönixfeder", "1 Munition = 3 Federn, die leicht zum Ziel lenken.", {"type": "shot", "dmg": 350.0, "range": 8.0, "speed": 14.0, "count": 3, "spread": 20.0, "width": 0.3, "visual": "orb", "homing": 1.5},
		"Wiedergeburt", "Explodiert in Flammen, heilt sich um 60 % und wird schneller.", {"type": "buff", "dur": 4.0, "heal": 0.6, "speed": true, "dmg": 1100.0, "radius": 3.0}],
	"Frostbiss": ["Eiszapfen", "1 Munition = ein Eiszapfen, der in 4 Splitter zerbricht.", {"type": "shot", "dmg": 1000.0, "range": 10.0, "speed": 26.0, "width": 0.25, "split": 4},
		"Absoluter Nullpunkt", "Ein Eisstrahl, der alle Getroffenen 1,5 s einfriert.", {"type": "beam", "dmg": 1400.0, "range": 12.0, "width": 0.8, "stun": 1.5}],
	"Volt-Otto": ["Spulenblitz", "1 Munition = ein Blitz, der auf 3 Gegner überspringt.", {"type": "beam", "dmg": 450.0, "range": 6.0, "width": 0.3, "chain": 3},
		"Stromfeld", "Ein Stromfeld, das Gegner immer wieder lähmt.", {"type": "zone", "range": 7.0, "radius": 2.8, "dur": 3.0, "dps": 400.0, "stun": 0.3}],
	"Nachtschatten": ["Schattenschnitt", "1 Munition = 2 Schnitte und ein Stich.", M([{"t": 0.0, "dir": "ltr", "dmg": 480.0, "range": 2.6, "arc": 130.0}, {"t": 0.09, "dir": "rtl", "dmg": 480.0, "range": 2.6, "arc": 130.0}, {"t": 0.2, "dir": "thrust", "dmg": 650.0, "range": 2.9, "arc": 60.0}]),
		"Schattenzwilling", "Verschwindet 3 s und trifft danach mit +80 % Schaden.", {"type": "buff", "dur": 3.5, "invis": true, "dmg_mult": 1.8}],
	"Kraken-Kai": ["Tentakelpeitsche", "1 Munition = 2 Tentakel, die Gegner heranziehen.", {"type": "shot", "dmg": 560.0, "range": 5.5, "speed": 18.0, "count": 2, "spread": 20.0, "width": 0.3, "pull": 2.5},
		"Kraken erwacht", "8 Tentakel kreisen um ihn und verlangsamen.", {"type": "orbit", "count": 8, "dmg": 330.0, "dur": 5.0, "radius": 2.4, "spin_speed": 3.0, "slow": 1.0}],
	"Sternenstaub": ["Kometenschweif", "1 Munition = ein Komet, der immer schneller wird und durchfliegt.", {"type": "shot", "dmg": 700.0, "range": 10.0, "speed": 10.0, "width": 0.3, "accel": 2.0, "pierce": true, "visual": "orb"},
		"Sternschnuppenregen", "10 Sternschnuppen regnen auf das Zielgebiet.", {"type": "meteor", "range": 9.0, "count": 10, "dmg": 430.0, "radius": 1.2, "spread": 3.0, "interval": 0.12}],
	"Gaia": ["Lebensstrahl", "1 Munition = ein Strahl, der sie um 50 % des Schadens heilt.", {"type": "beam", "dmg": 600.0, "range": 8.0, "width": 0.3, "drain": 0.5},
		"Erblühen", "Ein Blumenfeld: heilt Verbündete, verlangsamt Gegner.", {"type": "zone", "range": 0.0, "radius": 4.0, "dur": 6.0, "dps": 300.0, "slow": 0.6, "heal": 0.12}],
	"Golem": ["Golemfaust", "1 Munition = ein Schlag, der betäubt und wegschleudert.", M([{"t": 0.0, "dir": "over", "dmg": 1300.0, "range": 2.4, "arc": 120.0, "knock": 2.0, "stun": 0.3}]),
		"Steinwall", "Errichtet eine Steinmauer und bekommt 5 s Schild.", {"type": "barrier", "range": 2.2, "width": 5, "dur": 7.0, "buff_after": {"type": "buff", "dur": 5.0, "shield": true}}],
	"Arietta": ["Hohes C", "1 Munition = ein Schallstrahl, der stark verlangsamt.", {"type": "beam", "dmg": 520.0, "range": 8.0, "width": 0.6, "slow": 1.2},
		"Arie der Stille", "2 Klangwellen, die alle in der Nähe betäuben.", {"type": "slam", "waves": 2, "radius": 3.4, "dmg": 600.0, "stun": 1.0}],
	"Sturmkrähe": ["Krähenpfeil", "1 Munition = ein Pfeil, der einmal abprallt.", {"type": "shot", "dmg": 950.0, "range": 11.0, "speed": 28.0, "width": 0.22, "bounce": 1},
		"Krähenschwarm", "7 Krähen jagen zielsuchend die Gegner.", {"type": "shot", "dmg": 420.0, "range": 10.0, "speed": 14.0, "count": 7, "spread": 60.0, "width": 0.3, "homing": 3.0, "visual": "orb"}],
	"Vulkan": ["Lavabrocken", "1 Munition = ein Lavabrocken, der brennenden Boden hinterlässt.", {"type": "lob", "dmg": 850.0, "range": 7.5, "radius": 1.5, "zone": {"radius": 1.5, "dur": 2.5, "dps": 300.0}},
		"Eruption", "8 Lavabomben, die brennende Felder hinterlassen.", {"type": "meteor", "range": 8.5, "count": 8, "dmg": 650.0, "radius": 1.6, "spread": 3.0, "zone": {"radius": 1.4, "dur": 3.0, "dps": 280.0}}],
	"Giftzahn": ["Schlangenbiss", "1 Munition = 2 Giftschlangen, die Gegner verfolgen und ihn heilen.", {"type": "shot", "dmg": 440.0, "range": 8.0, "speed": 12.0, "count": 2, "spread": 20.0, "width": 0.28, "homing": 6.0, "drain": 0.2, "slow": 0.6, "visual": "orb"},
		"Versteinernder Blick", "Ein Blick, der alle Getroffenen 1,8 s erstarren lässt.", {"type": "beam", "dmg": 1100.0, "range": 10.0, "width": 0.9, "stun": 1.8}],
	"Blitzklinge": ["Donnerschnitt", "1 Munition = 2 Schnitte, der zweite feuert eine Blitzwelle.", M([{"t": 0.0, "dir": "ltr", "dmg": 520.0, "range": 2.7, "arc": 130.0}, {"t": 0.14, "dir": "rtl", "dmg": 520.0, "range": 2.7, "arc": 130.0, "wave": {"dmg": 380.0, "range": 5.0, "width": 0.5, "speed": 18.0, "chain": 2}}]),
		"Blitzschritt", "Blitzt zu 2 Gegnern hintereinander und betäubt sie.", {"type": "blink", "range": 9.0, "hits": 2, "dmg": 1050.0, "stun": 0.8}],
	"Mumie Mo": ["Bandagenschlinge", "1 Munition = eine Bandage, die Gegner heranzieht.", {"type": "shot", "dmg": 700.0, "range": 6.5, "speed": 16.0, "width": 0.4, "pull": 3.0},
		"Fluch des Pharao", "Ein Fluchfeld um ihn – und 5 s Lebensraub.", {"type": "zone", "range": 0.0, "radius": 3.5, "dur": 5.0, "dps": 480.0, "slow": 1.0, "buff_after": {"type": "buff", "dur": 5.0, "lifesteal": 0.5}}],
	"Bärbel": ["Eisaxt", "1 Munition = ein weiter Axthieb, der verlangsamt.", M([{"t": 0.0, "dir": "ltr", "dmg": 1100.0, "range": 2.8, "arc": 170.0, "slow": 1.0}]),
		"Bärenbrüller", "Ein Brüllen betäubt alle in der Nähe, danach +40 % Schaden.", {"type": "slam", "radius": 4.0, "dmg": 900.0, "stun": 1.0, "buff_after": {"type": "buff", "dur": 5.0, "dmg_mult": 1.4}}],
	"Kürbiskönig": ["Kürbisbombe", "1 Munition = ein Kürbis, der in 4 Teile zerplatzt.", {"type": "lob", "dmg": 550.0, "range": 7.5, "radius": 1.2, "cluster": 4},
		"Kürbislaterne", "Stellt eine Laterne auf, die zielsuchende Flammen schießt.", {"type": "turret", "dur": 8.0, "interval": 0.7, "dmg": 320.0, "range": 8.0, "homing": 3.0}],
	"Seiltänzer": ["Messerjonglage", "1 Munition = 3 Messer, die wie Bumerangs zurückkehren.", {"type": "shot", "dmg": 270.0, "range": 5.5, "speed": 16.0, "count": 3, "spread": 30.0, "width": 0.22, "boomerang": true},
		"Salto Mortale", "Springt auf Gegner, betäubt sie und verschwindet kurz.", {"type": "leap", "range": 7.0, "radius": 1.8, "dmg": 1250.0, "stun": 1.0, "buff_after": {"type": "buff", "dur": 2.0, "invis": true}}],
	"Neptuna": ["Wasserkugel", "1 Munition = eine Wasserkugel, die in 3 Tropfen zerspritzt.", {"type": "shot", "dmg": 600.0, "range": 8.0, "speed": 12.0, "width": 0.4, "visual": "orb", "split": 3, "knock": 0.5},
		"Mahlstrom", "Ein gewaltiger Wasserstrudel zieht Gegner in die Tiefe.", {"type": "zone", "range": 8.0, "radius": 3.5, "dur": 3.0, "dps": 600.0, "pull": 5.0}],
	"Schrotti": ["Nagelkanone", "1 Munition = 3 Salven aus je 2 Nägeln.", {"type": "shot", "dmg": 200.0, "range": 6.0, "speed": 22.0, "count": 2, "spread": 12.0, "burst": 3, "interval": 0.08, "width": 0.2},
		"Schrottroboter", "Baut einen Mini-Roboter mit Schnellfeuer.", {"type": "turret", "dur": 7.0, "interval": 0.35, "dmg": 180.0, "range": 7.0}],
	"Lichtbringer": ["Heiliges Schwert", "1 Munition = ein Schlag von oben, der eine Lichtwelle aussendet.", M([{"t": 0.0, "dir": "over", "dmg": 850.0, "range": 3.0, "arc": 110.0, "wave": {"dmg": 480.0, "range": 6.0, "width": 0.7, "speed": 14.0}}]),
		"Göttliches Urteil", "Eine Lichtsäule schlägt ein und betäubt alle.", {"type": "meteor", "range": 8.0, "count": 1, "dmg": 2500.0, "radius": 3.5, "stun": 1.0}],
	# ---------------- Mythisch
	"Chronos": ["Zeitkugel", "1 Munition = eine Kugel, die Gegner 2 s verlangsamt.", {"type": "shot", "dmg": 550.0, "range": 8.0, "speed": 9.0, "width": 0.5, "visual": "orb", "slow": 2.0},
		"Zeitstillstand", "Hält die Zeit an: alle in der Nähe 2,2 s betäubt.", {"type": "slam", "radius": 5.0, "dmg": 400.0, "stun": 2.2}],
	"Seelensammler": ["Seelensense", "1 Munition = ein riesiger Sensenhieb, der Leben raubt.", M([{"t": 0.0, "dir": "ltr", "dmg": 750.0, "range": 3.2, "arc": 200.0, "drain": 0.4}]),
		"Seelenernte", "Zieht Seelen in einen Wirbel um ihn und raubt 5 s Leben.", {"type": "zone", "range": 0.0, "radius": 3.0, "dur": 3.0, "dps": 700.0, "pull": 3.0, "buff_after": {"type": "buff", "dur": 5.0, "lifesteal": 0.4}}],
	"Drachenherz": ["Drachenodem", "1 Munition = ein Flammenkegel aus 5 Feuerbällen.", {"type": "shot", "dmg": 230.0, "range": 5.5, "speed": 14.0, "count": 5, "spread": 30.0, "width": 0.45, "visual": "orb"},
		"Drachensturz", "Stürzt vom Himmel und hinterlässt ein Flammenmeer.", {"type": "leap", "range": 9.0, "radius": 3.2, "dmg": 2100.0, "zone": {"radius": 3.0, "dur": 4.0, "dps": 480.0}}],
	"Ylva": ["Kristallsplitter", "1 Munition = ein Splitter, der durchfliegt, abprallt und verlangsamt.", {"type": "shot", "dmg": 580.0, "range": 8.0, "speed": 16.0, "width": 0.3, "pierce": true, "bounce": 2, "slow": 1.2, "visual": "orb"},
		"Ewiger Winter", "Ein Schneesturm um sie: Schaden und extreme Verlangsamung.", {"type": "zone", "range": 0.0, "radius": 4.5, "dur": 5.0, "dps": 350.0, "slow": 3.0}],
	"Donnerfaust": ["Donnerhammer", "1 Munition = ein Hammerschlag auf den Boden, der kurz betäubt.", {"type": "slam", "range": 2.3, "radius": 2.3, "dmg": 1000.0, "stun": 0.35},
		"Gewittergott", "6 Blitze schlagen im Zielgebiet ein und betäuben.", {"type": "meteor", "range": 9.0, "count": 6, "dmg": 700.0, "radius": 1.4, "stun": 0.8, "interval": 0.15}],
	"Taku": ["Iai-Schnitt", "1 Munition = ein einziger, blitzschneller Präzisionsschnitt.", M([{"t": 0.0, "dir": "thrust", "dmg": 1300.0, "range": 3.6, "arc": 35.0}]),
		"Windschnitt-Welle", "3 Windklingen fliegen durch alles hindurch.", {"type": "fan", "count": 3, "spread": 20.0, "dmg": 1050.0, "range": 10.0, "speed": 22.0, "width": 0.6}],
	"Grimbold": ["Zerplatzende Phiole", "1 Munition = eine Phiole, die in 5 Giftspritzer zerplatzt.", {"type": "shot", "dmg": 420.0, "range": 6.5, "speed": 11.0, "width": 0.35, "visual": "orb", "split": 5, "slow": 0.5},
		"Transmutation", "Verwandelt sich: 40 % Heilung, +50 % Schaden, Lebensraub.", {"type": "buff", "dur": 6.0, "heal": 0.4, "dmg_mult": 1.5, "lifesteal": 0.3}],
	"Tiefseeauge": ["Tiefenstrahl", "1 Munition = ein extrem weiter Strahl mit Rückstoß.", {"type": "beam", "dmg": 950.0, "range": 12.0, "width": 0.25, "knock": 2.0},
		"Auge des Abgrunds", "Öffnet einen Abgrund, der alles hineinzieht.", {"type": "zone", "range": 10.0, "radius": 4.0, "dur": 2.5, "dps": 900.0, "pull": 6.0}],
	"Waldgeist": ["Rankenpfeil", "1 Munition = ein durchschlagender Pfeil, der heilt und verlangsamt.", {"type": "shot", "dmg": 560.0, "range": 9.0, "speed": 18.0, "width": 0.28, "pierce": true, "drain": 0.25, "slow": 0.8},
		"Ruf des Waldes", "6 Waldgeister umkreisen ihn, dazu 40 % Heilung.", {"type": "orbit", "count": 6, "dmg": 300.0, "dur": 8.0, "radius": 2.0, "buff_after": {"type": "buff", "dur": 2.0, "heal": 0.4}}],
	"Stahlkoloss": ["Gatling", "1 Munition = 6 Schüsse in schneller Folge.", {"type": "shot", "dmg": 160.0, "range": 7.0, "speed": 24.0, "burst": 6, "interval": 0.06, "width": 0.2},
		"Raketenhagel", "8 Raketen schlagen ein und zerstören Kisten.", {"type": "meteor", "range": 9.0, "count": 8, "dmg": 550.0, "radius": 1.4, "interval": 0.1, "break": true}],
	"Mondwolf": ["Mondklaue", "1 Munition = 2 Klauenhiebe, die Leben rauben.", M([{"t": 0.0, "dir": "ltr", "dmg": 520.0, "range": 2.4, "arc": 120.0, "drain": 0.25}, {"t": 0.1, "dir": "rtl", "dmg": 520.0, "range": 2.4, "arc": 120.0, "drain": 0.25}]),
		"Blutmond", "6 s Raserei: +60 % Schaden, Tempo und Lebensraub.", {"type": "buff", "dur": 6.0, "dmg_mult": 1.6, "speed": true, "lifesteal": 0.4}],
	"Glockenspiel": ["Glockenschlag", "1 Munition = ein Glockenschlag, der ringsum verlangsamt.", {"type": "slam", "range": 2.6, "radius": 2.6, "dmg": 620.0, "slow": 0.8},
		"Wiegenlied", "Eine Melodie: heilt Verbündete und lässt Gegner einschlafen (langsam).", {"type": "zone", "range": 0.0, "radius": 4.0, "dur": 5.0, "slow": 1.5, "heal": 0.1}],
	"Erdbeben-Kalle": ["Bohrkanone", "1 Munition = ein Bohrer, der durch Gegner und Kisten bohrt.", {"type": "shot", "dmg": 780.0, "range": 9.0, "speed": 15.0, "width": 0.45, "pierce": true, "break": true, "visual": "orb"},
		"Grubenbeben", "4 Erdbebenwellen, die alles zerstören.", {"type": "slam", "waves": 4, "radius": 2.0, "dmg": 620.0, "knock": 1.0, "break": true}],
	# ---------------- Legendär
	"Aurelia": ["Sonnenklinge", "1 Munition = 3 Hiebe, der letzte schießt eine Sonnenwelle.", M([{"t": 0.0, "dir": "ltr", "dmg": 520.0, "range": 2.8, "arc": 130.0}, {"t": 0.11, "dir": "rtl", "dmg": 520.0, "range": 2.8, "arc": 130.0}, {"t": 0.24, "dir": "over", "dmg": 600.0, "range": 3.0, "arc": 100.0, "wave": {"dmg": 600.0, "range": 7.0, "width": 0.6, "speed": 16.0}}]),
		"Sonnenaufgang", "20 Sonnenstrahlen in alle Richtungen (2 Wellen), dazu 30 % Heilung.", {"type": "nova", "dmg": 450.0, "range": 7.0, "speed": 13.0, "count": 20, "burst": 2, "width": 0.3, "buff_after": {"type": "buff", "dur": 2.0, "heal": 0.3}}],
	"Kaiser Frost": ["Kaiserhieb", "1 Munition = ein gewaltiger Hieb, der verlangsamt und wegschleudert.", M([{"t": 0.0, "dir": "over", "dmg": 1300.0, "range": 2.8, "arc": 140.0, "slow": 1.2, "knock": 1.2}]),
		"Thron aus Eis", "Eisexplosion: betäubt 1,5 s und lässt ein Eisfeld entstehen.", {"type": "slam", "radius": 4.5, "dmg": 1200.0, "stun": 1.5, "buff_after": {"type": "zone", "range": 0.0, "radius": 4.0, "dur": 4.0, "slow": 2.0}}],
	"Zephyra": ["Wirbelklingen", "1 Munition = 4 Windklingen, die zurückkehren.", {"type": "shot", "dmg": 300.0, "range": 7.0, "speed": 16.0, "count": 4, "spread": 40.0, "width": 0.25, "boomerang": true, "knock": 0.6},
		"Orkanring", "3 Ringe aus Windklingen schleudern alles weg.", {"type": "nova", "dmg": 380.0, "range": 7.0, "speed": 14.0, "count": 12, "burst": 3, "width": 0.35, "knock": 2.0}],
	"Infernus": ["Höllensense", "1 Munition = 2 riesige Sensenhiebe.", M([{"t": 0.0, "dir": "ltr", "dmg": 650.0, "range": 3.2, "arc": 240.0}, {"t": 0.2, "dir": "rtl", "dmg": 650.0, "range": 3.2, "arc": 240.0}]),
		"Höllentor", "Öffnet ein Höllenfeld um sich: +50 % Schaden und Lebensraub.", {"type": "zone", "range": 0.0, "radius": 4.0, "dur": 5.0, "dps": 780.0, "buff_after": {"type": "buff", "dur": 5.0, "dmg_mult": 1.5, "lifesteal": 0.3}}],
	"Leviathan": ["Tiefseebombe", "1 Munition = eine Bombe, die abprallt und explodiert.", {"type": "shot", "dmg": 950.0, "range": 9.0, "speed": 10.0, "width": 0.55, "visual": "orb", "bounce": 1, "explode": 1.6, "knock": 1.5},
		"Zorn der Tiefe", "Eine titanische Flutwelle, die Kisten zerstört.", {"type": "wave", "dmg": 2100.0, "range": 11.0, "width": 3.0, "speed": 9.0, "pierce": true, "knock": 4.0, "break": true}],
	"Astra": ["Sternenpfeil", "1 Munition = 3 zielsuchende Sterne, die beschleunigen.", {"type": "shot", "dmg": 320.0, "range": 9.0, "speed": 10.0, "count": 3, "spread": 25.0, "width": 0.28, "homing": 4.0, "accel": 1.0, "visual": "orb"},
		"Schwarzes Loch", "Ein schwarzes Loch saugt alles ein und zermalmt es.", {"type": "zone", "range": 8.0, "radius": 4.0, "dur": 3.5, "dps": 900.0, "pull": 7.0}],
	"Echo": ["Echoschnitt", "1 Munition = blitzt zum nächsten Gegner und schneidet.", {"type": "blink", "range": 5.0, "dmg": 900.0},
		"Tausendfaches Echo", "Springt 6-mal zwischen Gegnern hin und her.", {"type": "blink", "range": 7.0, "hits": 6, "dmg": 600.0, "stun": 0.2}],
	"Aurion": ["Lebensfunke", "1 Munition = ein Funke, der durchfliegt und ihn heilt.", {"type": "shot", "dmg": 600.0, "range": 9.0, "speed": 15.0, "width": 0.35, "visual": "orb", "pierce": true, "drain": 0.35},
		"Quelle des Lebens", "Ein Lebensfeld: heilt Verbündete und schadet Gegnern.", {"type": "zone", "range": 6.0, "radius": 3.5, "dur": 5.0, "dps": 500.0, "heal": 0.12}],
	"Kalamis": ["Unglücksbote", "1 Munition = 2 Unglücksboten, die Gegner verfolgen und verlangsamen.", {"type": "shot", "dmg": 420.0, "range": 9.0, "speed": 11.0, "count": 2, "spread": 18.0, "width": 0.3, "visual": "orb", "homing": 4.0, "slow": 0.8},
		"Pechsträhne", "Trümmer stürzen auf das Zielgebiet.", {"type": "meteor", "range": 9.0, "count": 7, "dmg": 600.0, "radius": 1.4, "spread": 2.8, "stun": 0.3}],
	"Kairo": ["Sonnenfaust-Kombo", "1 Munition = 2 Faustschläge und ein Stoß, der eine Energiekugel abfeuert.", M([{"t": 0.0, "dir": "ltr", "dmg": 420.0, "range": 2.4, "arc": 120.0}, {"t": 0.1, "dir": "rtl", "dmg": 420.0, "range": 2.4, "arc": 120.0}, {"t": 0.22, "dir": "thrust", "dmg": 500.0, "range": 2.6, "arc": 70.0, "knock": 1.0, "wave": {"dmg": 450.0, "range": 7.0, "width": 0.5, "speed": 18.0}}]),
		"", "", {}],
	"Nyxara": ["Gravitationskern", "1 Munition = ein Sternenkern, der Gegner verfolgt und heranzieht.", {"type": "shot", "dmg": 600.0, "range": 8.5, "speed": 11.0, "width": 0.4, "visual": "orb", "homing": 2.5, "pull": 2.0},
		"", "", {}],
	"Grimmzahn": ["Doppelspalter", "1 Munition = 2 unsichtbar schnelle Schnittwellen im Fächer.", {"type": "fan", "count": 2, "spread": 24.0, "dmg": 560.0, "range": 6.5, "speed": 22.0, "width": 0.55},
		"", "", {}],
	"Zirr": ["Blitzdolche", "1 Munition = 3 elektrische Dolchstiche, die ganz kurz lähmen.", M([{"t": 0.0, "dir": "thrust", "dmg": 380.0, "range": 2.3, "arc": 80.0, "stun": 0.12}, {"t": 0.07, "dir": "ltr", "dmg": 380.0, "range": 2.3, "arc": 110.0, "stun": 0.12}, {"t": 0.14, "dir": "rtl", "dmg": 450.0, "range": 2.3, "arc": 110.0, "stun": 0.12}]),
		"", "", {}],
	"Titania": ["Feenlicht", "1 Munition = ein Lichtball, der verfolgt, abprallt und heilt.", {"type": "shot", "dmg": 500.0, "range": 8.5, "speed": 12.0, "width": 0.35, "homing": 3.0, "bounce": 1, "drain": 0.3, "visual": "orb"},
		"Feenring", "6 Feen umkreisen sie, dazu ein Heilkreis.", {"type": "orbit", "count": 6, "dmg": 350.0, "dur": 6.0, "radius": 2.0, "buff_after": {"type": "zone", "range": 0.0, "radius": 3.5, "dur": 5.0, "heal": 0.12}}],
	}
