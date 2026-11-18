# Brawler-Definitionen (reine Daten). Neue Brawler: weiteres Dictionary in all() ergänzen.
# Neue Brawler sind gesperrt und nur über Boxen (oder Code 67) freischaltbar – außer "default_unlocked".
class_name Brawlers

static func all() -> Array:
	return [klingengeist(), funke(), brocken(), bumm(), lumi(), frosti()]

## Seltenheitsfarben (Kartenfarbe, Box-Drops).
static func rarity_color(r: String) -> Color:
	match r:
		"Selten": return Color(0.35, 0.85, 0.35)
		"Super Selten": return Color(0.25, 0.6, 1.0)
		"Episch": return Color(0.75, 0.35, 1.0)
		"Mythisch": return Color(1.0, 0.3, 0.4)
		"Legendär": return Color(1.0, 0.85, 0.15)
	return Color(0.6, 0.8, 1.0)

## Box-Wahrscheinlichkeitsgewicht je Seltenheit (höher = häufiger).
static func rarity_weight(r: String) -> float:
	match r:
		"Selten": return 40.0
		"Super Selten": return 22.0
		"Episch": return 10.0
		"Mythisch": return 4.0
		"Legendär": return 1.5
	return 10.0

## Brawler mit nur einer Form (Super entwickelt nicht weiter).
static func _single(id: String, name: String, title: String, rarity: String, role: String, desc: String,
		hp: float, speed: float, ammo: int, reload: float, look: Dictionary, attack_name: String, attack_desc: String,
		attack: Dictionary, sup: Dictionary, skins: Array) -> Dictionary:
	var form := {"name": name, "look": look, "hp_mul": 1.0, "speed_mul": 1.0, "reload_mul": 1.0,
		"aura": Color(0, 0, 0, 0), "stance": 0.2, "combo_name": attack_name, "combo_desc": attack_desc, "super": sup}
	if attack.get("type", "melee") == "melee":
		form["combo"] = attack.combo
	else:
		form["attack"] = attack
	return {"id": id, "name": name, "title": title, "rarity": rarity, "rarity_color": rarity_color(rarity), "role": role,
		"desc": desc, "default_unlocked": false, "hp": hp, "speed": speed, "ammo": ammo, "reload": reload,
		"cooldown": 0.38, "charge_hits": 4.0, "forms": [form], "skins": skins}

# ------------------------------------------------------------------------------------------
static func funke() -> Dictionary:
	return _single("funke", "Funke", "Schnellster Colt der Wüste", "Selten", "Schütze",
		"Ein flinker Revolverheld. Trifft aus großer Distanz mit Doppelschüssen.",
		3800.0, 4.6, 3, 1.3,
		{"robe": Color(0.85, 0.28, 0.2), "trim": Color(0.55, 0.35, 0.2), "skin": Color(0.96, 0.74, 0.58), "hair": Color(0.45, 0.28, 0.15),
			"hair_style": "cap", "hat": Color(0.2, 0.45, 0.95), "face": "happy", "weapon": "pistol", "cape": false,
			"eye": Color(0.2, 0.35, 0.15), "blade": Color(0.4, 0.4, 0.45)},
		"Doppelschuss", "1 Munition = 2 schnelle Kugeln mit großer Reichweite.",
		{"type": "shot", "dmg": 460.0, "range": 9.0, "speed": 20.0, "count": 1, "spread": 0.0, "burst": 2, "interval": 0.1, "width": 0.25, "color": Color(1, 0.85, 0.3), "visual": "bullet"},
		{"type": "shot", "name": "Kugelhagel", "desc": "Ein Fächer aus 9 Kugeln, zweimal hintereinander.", "dmg": 380.0, "range": 9.5, "speed": 20.0,
			"count": 9, "spread": 36.0, "burst": 2, "interval": 0.15, "width": 0.25, "color": Color(1, 0.6, 0.2), "visual": "bullet"},
		[{"id": "funke_ranger", "name": "Wüstenranger", "price": 30, "hue": 0.08, "hair": Color(0.85, 0.75, 0.5)},
		 {"id": "funke_neon", "name": "Neon-Funke", "price": 80, "hue": 0.55, "hair": Color(1.0, 0.2, 0.8)}])

static func brocken() -> Dictionary:
	var look := {"robe": Color(0.3, 0.55, 0.3), "trim": Color(0.5, 0.32, 0.18), "skin": Color(0.85, 0.62, 0.45), "hair": Color(0.25, 0.18, 0.12),
		"hair_style": "bald", "face": "angry", "weapon": "shotgun", "cape": false, "eye": Color(0.1, 0.1, 0.12), "blade": Color(0.35, 0.35, 0.4), "size": 1.18, "beard": true}
	return _single("brocken", "Brocken", "Der Mauerbrecher", "Super Selten", "Panzer",
		"Massiver Kraftprotz mit Schrotflinte. Sein Ansturm wirft alles um.",
		6400.0, 4.2, 3, 1.6, look,
		"Schrotladung", "1 Munition = 5 Schrotkugeln im Fächer – vernichtend auf kurze Distanz.",
		{"type": "shot", "dmg": 330.0, "range": 5.0, "speed": 16.0, "count": 5, "spread": 40.0, "burst": 1, "interval": 0.1, "width": 0.25, "color": Color(1, 0.75, 0.35), "visual": "bullet"},
		{"type": "dash", "name": "Abrissbirne", "desc": "Stürmt nach vorne und trifft alle Gegner auf dem Weg.", "dmg": 1500.0, "range": 7.0, "speed": 16.0, "color": Color(1, 0.55, 0.2)},
		[{"id": "brocken_eis", "name": "Eisbrocken", "price": 30, "hue": 0.45, "hair": Color(0.9, 0.95, 1.0)},
		 {"id": "brocken_lava", "name": "Lavabrocken", "price": 80, "hue": -0.3, "hair": Color(1.0, 0.4, 0.1)}])

static func bumm() -> Dictionary:
	return _single("bumm", "Bumm", "Sprengmeister", "Episch", "Werfer",
		"Wirft Bomben über Wände. Seine Mega-Bombe macht ganze Bereiche dem Erdboden gleich.",
		3200.0, 4.3, 3, 1.7,
		{"robe": Color(1.0, 0.55, 0.15), "trim": Color(0.3, 0.3, 0.35), "skin": Color(0.96, 0.74, 0.58), "hair": Color(0.4, 0.45, 0.3),
			"hair_style": "helmet", "face": "goggles", "weapon": "bomb", "cape": false, "eye": Color(0.1, 0.1, 0.12), "blade": Color(0.2, 0.2, 0.25), "size": 0.95},
		"Kracher", "1 Munition = eine Bombe im Bogen über Hindernisse, explodiert am Ziel.",
		{"type": "lob", "dmg": 950.0, "range": 7.5, "radius": 1.4, "color": Color(1, 0.55, 0.15)},
		{"type": "lob", "name": "Mega-Bombe", "desc": "Riesige Bombe mit gewaltigem Explosionsradius.", "dmg": 2200.0, "range": 8.5, "radius": 3.0, "color": Color(1, 0.3, 0.1)},
		[{"id": "bumm_kuerbis", "name": "Kürbis-Bumm", "price": 30, "hue": -0.05, "hair": Color(0.2, 0.6, 0.2)},
		 {"id": "bumm_weltraum", "name": "Weltraum-Bumm", "price": 150, "hue": 0.6, "hair": Color(0.9, 0.9, 1.0)}])

static func lumi() -> Dictionary:
	return _single("lumi", "Lumi", "Sternenmagierin", "Episch", "Unterstützer",
		"Sternenmagierin, deren Lichtkugeln Gegner durchbohren. Ihre Super lässt Sterne in alle Richtungen regnen.",
		3400.0, 4.4, 3, 1.5,
		{"robe": Color(0.55, 0.38, 0.95), "trim": Color(1.0, 0.85, 0.35), "skin": Color(0.98, 0.78, 0.66), "hair": Color(1.0, 0.85, 0.45),
			"hair_style": "wizard", "hat": Color(0.3, 0.2, 0.7), "face": "happy", "weapon": "staff", "cape": true, "eye": Color(0.35, 0.2, 0.7), "blade": Color(1.0, 0.9, 0.4)},
		"Sternenlanze", "1 Munition = eine Lichtkugel, die durch alle Gegner fliegt.",
		{"type": "shot", "dmg": 680.0, "range": 8.5, "speed": 13.0, "count": 1, "spread": 0.0, "burst": 1, "interval": 0.1, "width": 0.4, "color": Color(0.8, 0.6, 1.0), "visual": "orb", "pierce": true},
		{"type": "nova", "name": "Sternenregen", "desc": "16 Sterne fliegen in alle Richtungen – zwei Wellen.", "dmg": 520.0, "range": 6.5, "speed": 11.0, "count": 16, "burst": 2, "width": 0.35, "color": Color(1, 0.85, 0.4)},
		[{"id": "lumi_nacht", "name": "Nacht-Lumi", "price": 80, "hue": 0.35, "hair": Color(0.85, 0.9, 1.0)}])

static func frosti() -> Dictionary:
	return _single("frosti", "Frosti", "Der Eishammer", "Mythisch", "Nahkämpfer",
		"Ein Schneeriese mit Eishammer. Seine Hiebe sind langsam, aber verheerend.",
		5600.0, 4.3, 3, 1.4,
		{"robe": Color(0.65, 0.85, 1.0), "trim": Color(0.25, 0.45, 0.85), "skin": Color(0.92, 0.96, 1.0), "hair": Color(0.95, 0.97, 1.0),
			"hair_style": "spiky", "face": "visor", "weapon": "hammer", "cape": true, "eye": Color(0.3, 0.8, 1.0), "blade": Color(0.7, 0.9, 1.0), "size": 1.1},
		"Gletscherschlag", "1 Munition = 2 wuchtige Hammerschläge (von oben, dann seitlich).",
		{"type": "melee", "combo": [
			{"t": 0.0, "dir": "over", "dmg": 800.0, "range": 2.6, "arc": 120.0, "color": Color(0.6, 0.9, 1.0)},
			{"t": 0.2, "dir": "ltr", "dmg": 700.0, "range": 2.8, "arc": 160.0, "color": Color(0.6, 0.9, 1.0)}]},
		{"type": "wave", "name": "Lawine", "desc": "Eine riesige Eiswelle, die beim Aufprall explodiert.", "dmg": 1800.0, "range": 9.0, "width": 1.3, "speed": 12.0,
			"color": Color(0.6, 0.9, 1.0), "pierce": false, "charge": 0.0, "explode": 2.2},
		[{"id": "frosti_lava", "name": "Magma-Frosti", "price": 150, "hue": 0.5, "hair": Color(1.0, 0.5, 0.15)}])

# ------------------------------------------------------------------------------------------
# Klingengeist – Legendär, Schadensverursacher. Jede Super schaltet dauerhaft die nächste Form frei.
# Die Super lädt sich durch Schaden an Gegnern auf. Jede Kombo kostet genau 1 Munition.
#   Form 1: 1 Hieb | Form 2: 2 Hiebe | Form 3: 3 Hiebe (+ kleine Welle) | Form 4: 3 Hiebe + Klingenwelle
# ------------------------------------------------------------------------------------------
static func klingengeist() -> Dictionary:
	var skin := Color(0.96, 0.74, 0.58)
	var hair := Color(0.12, 0.72, 0.74)
	var blue := Color(0.45, 0.85, 1.0)
	var crimson := Color(0.7, 0.35, 1.0)  # Form-3-Farbe (violett)
	var final_c := Color(1.0, 0.88, 0.45)  # Form-4-Farbe (gold)
	return {
		"id": "klingengeist",
		"name": "Klingengeist",
		"title": "Wächter der Klinge",
		"rarity": "Legendär",
		"rarity_color": Color(1.0, 0.85, 0.15),
		"role": "Schadensverursacher",
		"desc": "Mit jeder Super erwacht eine neue Form – mit neuem Outfit, neuem Schwert und einer neuen Schlagkombo.",
		"default_unlocked": true,
		"skins": [
			{"id": "klinge_schatten", "name": "Schattenklinge", "price": 80, "hue": 0.62, "hair": Color(0.85, 0.85, 0.95)},
			{"id": "klinge_feuer", "name": "Feuerklinge", "price": 150, "hue": -0.45, "hair": Color(1.0, 0.45, 0.15)},
		],
		"hp": 4200.0, "speed": 4.4, "ammo": 3, "reload": 1.35, "cooldown": 0.42, "charge_hits": 4.0,
		"forms": [
			{
				"name": "Form 1 – Seelenwächter",
				"look": {"robe": Color(0.12, 0.14, 0.3), "trim": Color(0.95, 0.8, 0.3), "skin": skin, "hair": hair,
					"hair_style": "spiky", "face": "angry", "weapon": "great", "cape": false, "eye": Color(0.1, 0.1, 0.15),
					"mark": crimson, "blade": Color(0.85, 0.88, 0.95)},
				"hp_mul": 1.0, "speed_mul": 1.0, "reload_mul": 1.0, "aura": Color(0, 0, 0, 0), "stance": 0.0,
				"combo_name": "Wächterhieb",
				"combo_desc": "1 Munition = 1 kräftiger horizontaler Hieb mit großer Klinge.",
				"combo": [
					{"t": 0.0, "dir": "ltr", "dmg": 1100.0, "range": 2.9, "arc": 140.0, "color": Color(0.95, 0.97, 1.0)},
				],
				"super": {"name": "Mondsichelwelle", "desc": "Schleudert eine Klingenwelle und erweckt Form 2.",
					"dmg": 1400.0, "range": 9.0, "width": 0.7, "speed": 14.0, "color": blue, "pierce": true, "charge": 0.0, "explode": 0.0},
			},
			{
				"name": "Form 2 – Kettenläufer",
				"look": {"robe": Color(0.08, 0.08, 0.12), "trim": Color(0.92, 0.92, 0.95), "skin": skin, "hair": hair,
					"hair_style": "spiky", "face": "angry", "weapon": "chain", "cape": true, "eye": Color(0.1, 0.1, 0.15),
					"mark": crimson, "blade": Color(0.9, 0.92, 1.0)},
				"hp_mul": 1.08, "speed_mul": 1.06, "reload_mul": 0.95, "aura": Color(0.5, 0.85, 1.0, 0.6), "stance": 0.3,
				"combo_name": "Kettendoppelhieb",
				"combo_desc": "1 Munition = 2 Hiebe: links→rechts und direkt zurück. Beide treffen einzeln.",
				"combo": [
					{"t": 0.0, "dir": "ltr", "dmg": 650.0, "range": 2.9, "arc": 135.0, "color": blue},
					{"t": 0.14, "dir": "rtl", "dmg": 650.0, "range": 2.9, "arc": 135.0, "color": blue},
				],
				"super": {"name": "Verstärkte Mondsichelwelle", "desc": "Größere, stärkere Welle. Erweckt Form 3.",
					"dmg": 1800.0, "range": 10.5, "width": 0.85, "speed": 15.0, "color": blue, "pierce": true, "charge": 0.0, "explode": 0.0},
			},
			{
				"name": "Form 3 – Kristallzorn",
				"look": {"robe": Color(0.32, 0.14, 0.48), "trim": Color(1.0, 0.78, 0.25), "skin": skin, "hair": hair,
					"hair_style": "spiky_horns", "face": "mask", "weapon": "chain", "cape": true, "eye": Color(0.3, 1.0, 0.95),
					"mark": Color(0.3, 0.95, 1.0), "blade": Color(0.85, 0.75, 1.0),
					"mask_color": Color(1.0, 0.8, 0.3), "horn_color": Color(0.6, 0.4, 1.0)},
				"hp_mul": 1.16, "speed_mul": 1.09, "reload_mul": 0.88, "aura": Color(0.7, 0.4, 1.0, 0.7), "stance": 0.6,
				"combo_name": "Maskenkombo",
				"combo_desc": "1 Munition = 3 schnelle Hiebe. Der Abschlusshieb setzt eine kleine Energiewelle frei.",
				"combo": [
					{"t": 0.0, "dir": "ltr", "dmg": 520.0, "range": 2.9, "arc": 130.0, "color": crimson},
					{"t": 0.1, "dir": "rtl", "dmg": 520.0, "range": 2.9, "arc": 130.0, "color": crimson},
					{"t": 0.22, "dir": "over", "dmg": 650.0, "range": 3.1, "arc": 100.0, "color": crimson,
						"wave": {"dmg": 600.0, "range": 5.5, "width": 0.55, "speed": 15.0, "color": crimson}},
				],
				"super": {"name": "Zornwelle", "desc": "Gewaltige violette Kristallwelle – breiter, schneller, stärker. Erweckt Form 4.",
					"dmg": 2300.0, "range": 11.0, "width": 1.15, "speed": 18.0, "color": crimson, "pierce": true, "charge": 0.0, "explode": 0.0},
			},
			{
				"name": "Form 4 – Wahre Klinge",
				"look": {"robe": Color(0.95, 0.93, 0.88), "trim": Color(1.0, 0.78, 0.25), "skin": skin, "hair": Color(0.3, 0.95, 0.9),
					"hair_style": "spiky", "face": "angry", "weapon": "katana", "cape": true, "eye": Color(0.2, 0.75, 1.0),
					"mark": Color(0.3, 0.95, 1.0), "blade": Color(0.55, 0.95, 1.0)},
				"hp_mul": 1.27, "speed_mul": 1.14, "reload_mul": 0.75, "aura": Color(1.0, 0.9, 0.5, 0.8), "stance": 0.8,
				"combo_name": "Wahre Klingenkombo",
				"combo_desc": "1 Munition = 2 blitzschnelle Hiebe + Abschlusshieb, der eine Klingenwelle abfeuert (keine extra Munition).",
				"combo": [
					{"t": 0.0, "dir": "ltr", "dmg": 560.0, "range": 3.0, "arc": 135.0, "color": final_c},
					{"t": 0.08, "dir": "rtl", "dmg": 560.0, "range": 3.0, "arc": 135.0, "color": final_c},
					{"t": 0.22, "dir": "over", "dmg": 900.0, "range": 3.2, "arc": 100.0, "color": final_c,
						"wave": {"dmg": 1100.0, "range": 9.0, "width": 0.8, "speed": 16.0, "color": Color(1.0, 0.85, 0.4)}},
				],
				"super": {"name": "Finale Mondsichel", "desc": "Sammelt Energie und entfesselt eine gigantische Welle, die beim Aufprall explodiert. Beliebig oft einsetzbar.",
					"dmg": 3200.0, "range": 12.0, "width": 1.5, "speed": 16.0, "color": final_c, "pierce": false, "charge": 0.7, "explode": 3.0},
			},
		],
	}
