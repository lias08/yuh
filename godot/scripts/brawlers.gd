# Brawler-Definitionen (reine Daten). Neue Brawler: weiteres Dictionary in all() ergänzen.
# Neue Brawler sind gesperrt und nur über Boxen (oder Code 67) freischaltbar – außer "default_unlocked".
class_name Brawlers

static func all() -> Array:
	return [klingengeist()]

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
