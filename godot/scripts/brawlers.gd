# Brawler-Definitionen (reine Daten). Neue Brawler: weiteres Dictionary in all() ergänzen.
# Neue Brawler sind gesperrt und nur über Boxen (oder Code 67) freischaltbar – außer "default_unlocked".
class_name Brawlers

const RosterData = preload("res://scripts/roster.gd")

static func all() -> Array:
	var list := [klingengeist(), varg(), funke(), brocken(), bumm(), lumi(), frosti(), volta(), nebel(), granit()]
	# Gadgets (3 Einsätze pro Match)
	var gadgets := {
		"klingengeist": {"name": "Schattenschritt", "desc": "Teleportiert dich ein Stück nach vorne.", "type": "blink", "range": 4.0, "cooldown": 5.0, "color": Color(0.5, 0.85, 1.0)},
		"funke": {"name": "Schnellladen", "desc": "Füllt sofort alle Munition auf.", "type": "reload", "cooldown": 6.0, "color": Color(1, 0.8, 0.3)},
		"brocken": {"name": "Adrenalin", "desc": "3 Sekunden 40 % schneller.", "type": "speed", "duration": 3.0, "cooldown": 7.0, "color": Color(1, 0.55, 0.2)},
		"bumm": {"name": "Blendgranate", "desc": "Betäubt Gegner in der Nähe für 1,5 s.", "type": "stun_pulse", "range": 4.0, "stun": 1.5, "dmg": 300.0, "cooldown": 7.0, "color": Color(1, 0.95, 0.6)},
		"lumi": {"name": "Sternenlicht", "desc": "Heilt dich um 35 %.", "type": "heal", "amount": 0.35, "cooldown": 7.0, "color": Color(0.4, 1.0, 0.5)},
		"frosti": {"name": "Eispanzer", "desc": "3 Sekunden 65 % weniger Schaden.", "type": "shield", "duration": 3.0, "cooldown": 8.0, "color": Color(0.6, 0.9, 1.0)},
	}
	var wclass := {"funke": "gun", "brocken": "gun", "bumm": "throw", "lumi": "magic", "frosti": "melee", "volta": "gun", "nebel": "melee", "granit": "melee"}
	for b in list:
		if gadgets.has(b.id):
			b["gadget"] = gadgets[b.id]
		if wclass.has(b.id):
			b["wclass"] = wclass[b.id]
	_upgrade_skins(list)
	list.append_array(RosterData.all())
	for b in list:
		_balance(b)
		_add_inspiration(b)
	return list

# ------------------------------------------------------------------ Anime-Inspiration (Info für Spieler)
# Brawler mit Stern: Fähigkeiten-Konzepte sind von Animes inspiriert (eigene Umsetzung).
static func _add_inspiration(b: Dictionary) -> void:
	var by_name := {
		"Klingengeist": ["Bleach", "Ichigo Kurosaki", "Formen-Entwicklung wie Shikai/Bankai, Klingenwelle, Masken-Form (Hollow), finale Form"],
		"Varg": ["Jujutsu Kaisen", "Toji Fushiguro", "Waffenarsenal mit schnellem Waffenwechsel, jede Waffe mit eigenem Moveset"],
		"Aurion": ["JoJo's Bizarre Adventure (Teil 5)", "Giorno Giovanna – Gold Experience Requiem", "Stand-Konzept; Ulti angelehnt an „Return to Zero“ (Handlungen der Gegner werden zurückgesetzt)"],
		"Kalamis": ["JoJo's Bizarre Adventure (Teil 8)", "Tōru – Wonder of U", "Stand-Konzept; Ulti angelehnt an „Calamity“ (wer ihn verfolgt, wird vom Unglück getroffen)"],
		"Kairo": ["Dragon Ball", "Son Goku", "Kampfkunst-Kombos, Energiekugeln, Power-Up-Verwandlung mit Aura, großer Energiestrahl"],
		"Nyxara": ["Jujutsu Kaisen", "Satoru Gojo", "Raum-Manipulation (Heranziehen), Domain Expansion als Ulti"],
		"Grimmzahn": ["Jujutsu Kaisen / JoJo's Bizarre Adventure", "Ryomen Sukuna / Stand-Nutzer", "schnelle Schnittwellen (wie Dismantle/Cleave), Kampfgeist als Stand"],
		"Zirr": ["Hunter x Hunter", "Killua Zoldyck", "Blitz-Nen, extreme Geschwindigkeit (wie Godspeed), Blitzangriffe zwischen Gegnern"],
	}
	if by_name.has(b.name):
		var e: Array = by_name[b.name]
		b["inspired"] = {"anime": e[0], "character": e[1], "abilities": e[2]}
		return
	var sup_type: String = b.forms[0].super.get("type", "")
	if b.has("stand_spirit"):
		b["inspired"] = {"anime": "JoJo's Bizarre Adventure", "character": "Stand-Nutzer (z. B. Jotaro Kujo mit Star Platinum)",
			"abilities": "Stand ein-/ausfahren mit eigenem Moveset, Schlaghagel des Geistes (wie „Ora-Ora“-Rush)"}
	elif sup_type == "awaken":
		var who := "Tōshirō Hitsugaya" if b.name == "Kaiser Frost" else "Bankai-Nutzer (z. B. Ichigo, Byakuya)"
		b["inspired"] = {"anime": "Bleach", "character": who, "abilities": "Bankai-Konzept: Freisetzung der wahren Form mit neuem Aussehen, stärkeren Angriffen und neuer Ulti"}
	elif sup_type == "domain":
		b["inspired"] = {"anime": "Jujutsu Kaisen", "character": "Domain-Nutzer (z. B. Satoru Gojo, Ryomen Sukuna)",
			"abilities": "Domain Expansion: eine Barriere, die Gegner einsperrt und in der der Besitzer stärker ist"}

# ------------------------------------------------------------------ Balance
# Alle Brawler einer Seltenheit sind gleich stark: Angriff pro Munition, Super-Wert und Leben werden
# auf Rollen-Zielwerte normiert. Seltenheit gibt nur einen kleinen Bonus, Hyperlegendär einen großen.
const RARITY_DMG := {"Selten": 1.0, "Super Selten": 1.03, "Episch": 1.06, "Mythisch": 1.09, "Legendär": 1.12, "Hyperlegendär": 1.7}
const RARITY_HP := {"Selten": 1.0, "Super Selten": 1.02, "Episch": 1.04, "Mythisch": 1.06, "Legendär": 1.08, "Hyperlegendär": 1.45}
const ROLE_HP := {"Panzer": 7000.0, "Nahkampf-Schütze": 5200.0, "Berserker": 5000.0, "Nahkämpfer": 4800.0, "Artillerie": 4200.0,
	"Schadensverursacher": 4200.0, "Waffenmeister": 5000.0, "Kontrolle": 3700.0, "Schütze": 3600.0, "Unterstützer": 3600.0,
	"Assassine": 3500.0, "Magier": 3300.0, "Werfer": 3100.0, "Scharfschütze": 2900.0}
const ROLE_ATK := {"Panzer": 1200.0, "Nahkampf-Schütze": 1250.0, "Berserker": 1350.0, "Nahkämpfer": 1300.0, "Artillerie": 1100.0,
	"Schadensverursacher": 1150.0, "Waffenmeister": 1300.0, "Kontrolle": 1000.0, "Schütze": 1050.0, "Unterstützer": 900.0,
	"Assassine": 1300.0, "Magier": 1000.0, "Werfer": 950.0, "Scharfschütze": 1150.0}
const SUPER_TARGET := 2600.0

static func _atk_value(f: Dictionary) -> float:
	if f.has("combo") and not f.combo.is_empty():
		var t := 0.0
		for st in f.combo:
			t += st.dmg + (st.wave.dmg * 0.6 if st.has("wave") else 0.0)
		return t
	return _spec_value(f.get("attack", {}), true)

## Grober Schadenswert einer Fähigkeit (für die Normierung).
static func _spec_value(s: Dictionary, is_attack: bool) -> float:
	var d: float = s.get("dmg", 0.0)
	match s.get("type", ""):
		"shot":
			var n: float = s.get("count", 1) * s.get("burst", 1)
			var v: float = d * n * (0.6 if s.get("count", 1) > 2 else 1.0)
			v *= 1.0 + float(s.get("chain", 0)) * 0.4
			if s.get("boomerang", false): v *= 1.4
			if s.get("split", 0) > 0: v *= 1.3
			return v
		"lob": return d * (1.0 + float(s.get("cluster", 0)) * 0.35) + (s.zone.get("dps", 0.0) * s.zone.get("dur", 0.0) * 0.4 if s.has("zone") else 0.0)
		"beam": return d * (1.0 + float(s.get("chain", 0)) * 0.4)
		"mine", "dash", "leap", "awaken": return d
		"slam": return d * s.get("waves", 1)
		"blink": return d * s.get("hits", 1)
		"fan": return d * s.get("count", 3) * 0.6
		"wave": return d * (1.0 + s.get("explode", 0.0) * 0.2)
		"nova": return d * s.get("count", 12) * s.get("burst", 1) * 0.22
		"zone", "domain": return s.get("dps", 0.0) * s.get("dur", 3.0) * 0.5
		"turret": return d * s.get("dur", 8.0) / s.get("interval", 0.6) * 0.35
		"orbit": return d * s.get("count", 3) * s.get("dur", 6.0) * 0.25
		"spin": return d * s.get("dur", 2.0) * 4.0 * 0.5
		"meteor": return d * s.get("count", 5) * 0.55
		"spirit": return d * s.get("dur", 7.0) / s.get("interval", 0.14) * 0.35
		"rewind": return d
		"doom": return d * s.get("dur", 8.0) / 0.55 * 0.4
	return 0.0

static func _scale_spec(s: Dictionary, k: float) -> void:
	for key in ["dmg", "dps"]:
		if s.has(key):
			s[key] = round(float(s[key]) * k)
	for key in ["zone", "wave"]:
		if s.has(key) and s[key] is Dictionary:
			_scale_spec(s[key], k)
	if s.has("combo"):
		for st in s.combo:
			_scale_spec(st, k)
	if s.has("sup") and s.sup is Dictionary:
		_scale_spec(s.sup, k)

static func _balance(b: Dictionary) -> void:
	var rar: String = b.get("rarity", "Selten")
	var rd: float = RARITY_DMG.get(rar, 1.0)
	b.hp = round(ROLE_HP.get(b.role, 4000.0) * RARITY_HP.get(rar, 1.0) / 50.0) * 50.0
	var atk_target: float = ROLE_ATK.get(b.role, 1100.0) * rd
	var evolving: bool = b.forms.size() > 1 and not b.get("no_evolve", false)
	var base_k := 1.0
	for i in b.forms.size():
		var f: Dictionary = b.forms[i]
		var awakened: bool = i > 0 and b.forms[0].super.get("type", "") == "awaken"
		var k := base_k
		if not evolving or i == 0:
			var val: float = _atk_value(f)
			if val > 0.0:
				k = clamp(atk_target * (1.35 if awakened else 1.0) / val, 0.4, 2.5)
			if i == 0:
				base_k = k
		if f.has("combo"):
			for st in f.combo:
				_scale_spec(st, k)
		if f.has("attack"):
			_scale_spec(f.attack, k)
		# Super normieren (reine Verstärkungen/Mauern bleiben unverändert)
		var sp: Dictionary = f.super
		var sv: float = _spec_value(sp, false) if sp.has("type") else (sp.get("dmg", 0.0) * (1.0 + sp.get("explode", 0.0) * 0.2))
		if sv > 0.0 and not sp.get("type", "") in ["awaken"]:
			var sk: float = clamp(SUPER_TARGET * rd * (1.2 if awakened else 1.0) / sv, 0.5, 2.0) if not evolving or i == 0 else base_k
			_scale_spec(sp, sk)
	if b.has("stand_spirit"):
		var ss: Dictionary = b.stand_spirit
		var sv2: float = _spec_value(ss, false)
		if sv2 > 0.0:
			_scale_spec(ss, clamp(SUPER_TARGET * 0.8 * rd / sv2, 0.4, 2.0))

## Bestehende Skins bekommen echte Formänderungen (Kopfbedeckung, Gesicht, Waffe, Accessoires)
## + je ein zusätzlicher Themen-Skin. IDs bleiben gleich, damit gekaufte Skins erhalten bleiben.
static func _upgrade_skins(list: Array) -> void:
	var extra := {
		"funke_ranger": {"hair_style": "cowboy", "hat": Color(0.55, 0.38, 0.22), "acc": ["scarf", "medal"], "scarf_color": Color(0.85, 0.2, 0.2)},
		"funke_neon": {"hair_style": "mohawk", "face": "shades", "weapon": "blaster", "acc": ["spikes"]},
		"brocken_eis": {"hair_style": "viking", "acc": ["beard", "pauldrons"], "armor_color": Color(0.8, 0.92, 1.0)},
		"brocken_lava": {"face": "fangs", "acc": ["beard", "horns", "spikes"], "horn_color": Color(0.25, 0.1, 0.1)},
		"bumm_kuerbis": {"hair_style": "pumpkin", "acc": ["scarf"], "scarf_color": Color(0.3, 0.6, 0.2)},
		"bumm_weltraum": {"hair_style": "astro", "weapon": "cannon", "acc": ["jetpack"]},
		"lumi_nacht": {"hair_style": "hood", "face": "sleepy", "weapon": "book", "acc": ["halo"]},
		"frosti_lava": {"face": "fangs", "hair_style": "flame", "acc": ["horns", "spikes"]},
		"volta_neon": {"hair_style": "robot", "face": "robot", "acc": ["antenna", "jetpack"]},
		"nebel_sakura": {"hair_style": "long", "face": "happy", "weapon": "fan", "acc": ["flower"]},
		"granit_kristall": {"face": "cyclops", "acc": ["spikes", "crown"], "acc_color": Color(0.75, 0.45, 1.0)},
		"klinge_schatten": {"acc": ["scarf"], "scarf_color": Color(0.2, 0.15, 0.3)},
		"klinge_feuer": {"acc": ["horns"], "horn_color": Color(1.0, 0.45, 0.15)},
	}
	for b in list:
		for sk in b.skins:
			if extra.has(sk.id):
				sk["look"] = extra[sk.id]
		var keys: Array = RosterData.PALETTES.keys()
		var key: String = keys[abs(hash(b.id + "pal")) % keys.size()]
		b.skins.append(RosterData.theme_skin(b, key))

## Seltenheitsfarben (Kartenfarbe, Box-Drops).
static func rarity_color(r: String) -> Color:
	match r:
		"Selten": return Color(0.35, 0.85, 0.35)
		"Super Selten": return Color(0.25, 0.6, 1.0)
		"Episch": return Color(0.75, 0.35, 1.0)
		"Mythisch": return Color(1.0, 0.3, 0.4)
		"Legendär": return Color(1.0, 0.85, 0.15)
		"Hyperlegendär": return Color(1.0, 0.25, 0.75)
	return Color(0.6, 0.8, 1.0)

## Box-Wahrscheinlichkeitsgewicht je Seltenheit (höher = häufiger).
static func rarity_weight(r: String) -> float:
	match r:
		"Selten": return 40.0
		"Super Selten": return 22.0
		"Episch": return 10.0
		"Mythisch": return 4.0
		"Legendär": return 1.5
		"Hyperlegendär": return 0.0  # eigener Wurf: 0,00000001 % pro Box-Belohnung
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
# Varg – Hyperlegendär. Söldner mit einem Arsenal auf dem Rücken. Gadget "Arsenalwechsel":
# unbegrenzt, 3 s Abklingzeit – wechselt die Waffe. Jede Waffe hat eigenen Angriff UND eigene Super.
# Chance aus Boxen: 0,00000001 % pro Belohnung (oder Code 67).
# ------------------------------------------------------------------------------------------
static func varg() -> Dictionary:
	var base := {"robe": Color(0.22, 0.24, 0.28), "trim": Color(0.2, 0.85, 0.75), "skin": Color(0.86, 0.66, 0.5), "hair": Color(0.92, 0.92, 0.96),
		"hair_style": "spiky", "face": "angry", "cape": false, "eye": Color(0.15, 0.75, 0.7), "acc": ["scarf", "backpack"],
		"scarf_color": Color(0.2, 0.85, 0.75), "pack_color": Color(0.3, 0.3, 0.34), "size": 1.05, "mark": Color(0.2, 0.85, 0.75)}
	var teal := Color(0.3, 1.0, 0.85)
	var forms := []
	var specs := [
		["Katana", "katana", Color(0.85, 0.95, 1.0), "Klingenwirbel", "1 Munition = 3 blitzschnelle Schnitte.",
			[{"t": 0.0, "dir": "ltr", "dmg": 520.0, "range": 2.8, "arc": 140.0, "color": teal},
			 {"t": 0.09, "dir": "rtl", "dmg": 520.0, "range": 2.8, "arc": 140.0, "color": teal},
			 {"t": 0.2, "dir": "thrust", "dmg": 700.0, "range": 3.0, "arc": 70.0, "color": teal}],
			{"type": "dash", "name": "Phantomschnitt", "desc": "Unsichtbar schneller Sprint, der alle Getroffenen betäubt.", "dmg": 1900.0, "range": 8.0, "speed": 28.0, "color": teal, "stun": 1.2}],
		["Speer", "spear", Color(0.9, 0.3, 0.3), "Speerstoß", "1 Munition = 2 weitreichende Stöße.",
			[{"t": 0.0, "dir": "thrust", "dmg": 780.0, "range": 3.8, "arc": 45.0, "color": Color(1, 0.4, 0.4)},
			 {"t": 0.16, "dir": "thrust", "dmg": 780.0, "range": 3.8, "arc": 45.0, "color": Color(1, 0.4, 0.4), "knock": 0.8}],
			{"type": "wave", "name": "Speerwurf", "desc": "Schleudert den Speer – durchbohrt alles und zerstört Kisten.", "dmg": 2200.0, "range": 12.0, "width": 0.5, "speed": 24.0, "color": Color(1, 0.35, 0.35), "pierce": true, "charge": 0.0, "explode": 0.0, "break": true}],
		["Kettenklinge", "chain", Color(0.75, 0.75, 0.82), "Kettenkreisel", "1 Munition = ein weiter Rundumschlag, dann ein Hieb von oben.",
			[{"t": 0.0, "dir": "ltr", "dmg": 650.0, "range": 3.6, "arc": 300.0, "color": Color(0.8, 0.8, 0.9), "knock": 0.6},
			 {"t": 0.22, "dir": "over", "dmg": 750.0, "range": 3.4, "arc": 100.0, "color": Color(0.8, 0.8, 0.9), "slow": 1.0}],
			{"type": "nova", "name": "Kettensturm", "desc": "Die Kette wirbelt um ihn herum: Klingen in alle Richtungen, verlangsamt.", "dmg": 600.0, "range": 6.0, "speed": 13.0, "count": 16, "burst": 2, "width": 0.35, "color": Color(0.8, 0.85, 1.0), "slow": 1.5}],
		["Revolver", "pistol", Color(0.4, 0.4, 0.45), "Schnellfeuer", "1 Munition = 3 schnelle Schüsse.",
			{"type": "shot", "dmg": 420.0, "range": 9.5, "speed": 24.0, "count": 1, "spread": 0.0, "burst": 3, "interval": 0.08, "width": 0.25, "color": Color(1, 0.85, 0.4), "visual": "bullet"},
			{"type": "shot", "name": "Letzter Schuss", "desc": "Eine durchschlagende Kugel mit gewaltigem Schaden, die betäubt.", "dmg": 3000.0, "range": 14.0, "speed": 36.0, "count": 1, "spread": 0.0, "burst": 1, "interval": 0.1, "width": 0.45, "color": Color(1, 0.75, 0.3), "visual": "orb", "pierce": true, "stun": 0.8}],
	]
	for sp in specs:
		var look: Dictionary = base.duplicate(true)
		look["weapon"] = sp[1]
		look["blade"] = sp[2]
		var form := {"name": "Waffe: " + sp[0], "look": look, "hp_mul": 1.0, "speed_mul": 1.0, "reload_mul": 1.0,
			"aura": Color(0.3, 1.0, 0.85, 0.5), "stance": 0.5, "combo_name": sp[3], "combo_desc": sp[4], "super": sp[6]}
		if sp[5] is Array:
			form["combo"] = sp[5]
		else:
			form["attack"] = sp[5]
		forms.append(form)
	var b := {"id": "varg", "name": "Varg", "title": "Der Arsenalträger", "rarity": "Hyperlegendär",
		"rarity_color": rarity_color("Hyperlegendär"), "role": "Waffenmeister",
		"desc": "Söldner mit einem ganzen Arsenal auf dem Rücken. Sein Gadget wechselt alle 3 Sekunden die Waffe – jede mit eigenem Angriff und eigener Super.",
		"default_unlocked": false, "no_evolve": true, "weapon_swap": true,
		"hp": 5200.0, "speed": 4.8, "ammo": 3, "reload": 1.2, "cooldown": 0.36, "charge_hits": 3.5, "forms": forms,
		"gadget": {"name": "Arsenalwechsel", "desc": "Wechselt zur nächsten Waffe. Unbegrenzt, 3 s Abklingzeit.", "type": "swap", "cooldown": 3.0, "unlimited": true, "color": teal},
		"skins": []}
	b.skins = [
		{"id": "varg_schatten", "name": "Schattensöldner", "price": 200, "look": {"robe": Color(0.08, 0.08, 0.1), "trim": Color(0.6, 0.2, 1.0), "hair": Color(0.15, 0.12, 0.2), "face": "ninja", "scarf_color": Color(0.6, 0.2, 1.0), "acc": ["bat_wings"]}},
		{"id": "varg_gold", "name": "Goldener Varg", "price": 300, "look": {"robe": Color(1.0, 0.78, 0.2), "trim": Color(1, 1, 0.95), "hair": Color(1, 0.9, 0.5), "scarf_color": Color(1, 1, 0.95), "acc": ["crown", "halo"]}},
	]
	return b

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
		{"type": "dash", "name": "Abrissbirne", "desc": "Stürmt nach vorne, schleudert Gegner weg und zerstört Kisten.", "dmg": 1500.0, "range": 7.0, "speed": 16.0, "color": Color(1, 0.55, 0.2), "knock": 2.5, "break": true},
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
		{"type": "lob", "name": "Mega-Bombe", "desc": "Riesige Bombe: zerstört Kisten und betäubt kurz.", "dmg": 2200.0, "range": 8.5, "radius": 3.0, "color": Color(1, 0.3, 0.1), "break": true, "stun": 0.6, "knock": 1.5},
		[{"id": "bumm_kuerbis", "name": "Kürbis-Bumm", "price": 30, "hue": -0.05, "hair": Color(0.2, 0.6, 0.2)},
		 {"id": "bumm_weltraum", "name": "Weltraum-Bumm", "price": 150, "hue": 0.6, "hair": Color(0.9, 0.9, 1.0)}])

static func lumi() -> Dictionary:
	return _single("lumi", "Lumara", "Sternenmagierin", "Episch", "Unterstützer",
		"Sternenmagierin, deren Lichtkugeln Gegner durchbohren. Ihre Super lässt Sterne in alle Richtungen regnen.",
		3400.0, 4.4, 3, 1.5,
		{"robe": Color(0.55, 0.38, 0.95), "trim": Color(1.0, 0.85, 0.35), "skin": Color(0.98, 0.78, 0.66), "hair": Color(1.0, 0.85, 0.45),
			"hair_style": "wizard", "hat": Color(0.3, 0.2, 0.7), "face": "happy", "weapon": "staff", "cape": true, "eye": Color(0.35, 0.2, 0.7), "blade": Color(1.0, 0.9, 0.4)},
		"Sternenlanze", "1 Munition = eine Lichtkugel, die durch alle Gegner fliegt.",
		{"type": "shot", "dmg": 680.0, "range": 8.5, "speed": 13.0, "count": 1, "spread": 0.0, "burst": 1, "interval": 0.1, "width": 0.4, "color": Color(0.8, 0.6, 1.0), "visual": "orb", "pierce": true},
		{"type": "nova", "name": "Sternenregen", "desc": "16 Sterne in alle Richtungen, zwei Wellen. Verlangsamt Getroffene.", "dmg": 520.0, "range": 6.5, "speed": 11.0, "count": 16, "burst": 2, "width": 0.35, "color": Color(1, 0.85, 0.4), "slow": 1.5},
		[{"id": "lumi_nacht", "name": "Nacht-Lumi", "price": 80, "hue": 0.35, "hair": Color(0.85, 0.9, 1.0)}])

static func frosti() -> Dictionary:
	return _single("frosti", "Frosti", "Der Eishammer", "Mythisch", "Nahkämpfer",
		"Ein Schneeriese mit Eishammer. Seine Hiebe sind langsam, aber verheerend.",
		5600.0, 4.3, 3, 1.4,
		{"robe": Color(0.65, 0.85, 1.0), "trim": Color(0.25, 0.45, 0.85), "skin": Color(0.92, 0.96, 1.0), "hair": Color(0.95, 0.97, 1.0),
			"hair_style": "spiky", "face": "visor", "weapon": "hammer", "cape": true, "eye": Color(0.3, 0.8, 1.0), "blade": Color(0.7, 0.9, 1.0), "size": 1.1},
		"Gletscherschlag", "1 Munition = 2 wuchtige Hammerschläge (von oben, dann seitlich).",
		{"type": "melee", "combo": [
			{"t": 0.0, "dir": "over", "dmg": 800.0, "range": 2.6, "arc": 120.0, "color": Color(0.6, 0.9, 1.0), "slow": 1.2},
			{"t": 0.2, "dir": "ltr", "dmg": 700.0, "range": 2.8, "arc": 160.0, "color": Color(0.6, 0.9, 1.0), "slow": 1.2, "knock": 0.8}]},
		{"type": "wave", "name": "Lawine", "desc": "Riesige Eiswelle: explodiert beim Aufprall, betäubt und sprengt Kisten.", "dmg": 1800.0, "range": 9.0, "width": 1.3, "speed": 12.0,
			"color": Color(0.6, 0.9, 1.0), "pierce": false, "charge": 0.0, "explode": 2.2, "stun": 1.0, "break": true},
		[{"id": "frosti_lava", "name": "Magma-Frosti", "price": 150, "hue": 0.5, "hair": Color(1.0, 0.5, 0.15)}])

# ------------------------------------------------------------------------------------------
# Klingengeist – Legendär, Schadensverursacher. Jede Super schaltet dauerhaft die nächste Form frei.
# Die Super lädt sich durch Schaden an Gegnern auf. Jede Kombo kostet genau 1 Munition.
#   Form 1: 1 Hieb | Form 2: 2 Hiebe | Form 3: 3 Hiebe (+ kleine Welle) | Form 4: 3 Hiebe + Klingenwelle
# ------------------------------------------------------------------------------------------
# ------------------------------------------------------------------------------------------
static func volta() -> Dictionary:
	var b := _single("volta", "Volta", "Funkenschmiedin", "Episch", "Kontrolle",
		"Erfinderin mit Blitzkanone. Ihre Ladungen verlangsamen, ihre Elektrogranate betäubt ganze Gruppen.",
		3700.0, 4.5, 3, 1.4,
		{"robe": Color(0.15, 0.17, 0.25), "trim": Color(1.0, 0.85, 0.15), "skin": Color(0.9, 0.68, 0.5), "hair": Color(0.25, 0.7, 1.0),
			"hair_style": "ponytail", "face": "goggles", "weapon": "blaster", "cape": false, "eye": Color(0.1, 0.1, 0.12), "blade": Color(0.4, 0.9, 1.0)},
		"Blitzsalve", "1 Munition = 3 Blitzladungen im Fächer. Verlangsamt Getroffene.",
		{"type": "shot", "dmg": 400.0, "range": 7.5, "speed": 18.0, "count": 3, "spread": 16.0, "burst": 1, "interval": 0.1, "width": 0.28, "color": Color(0.45, 0.9, 1.0), "visual": "orb", "slow": 0.8},
		{"type": "lob", "name": "Elektrogranate", "desc": "Betäubt alle Gegner im großen Radius für 1,5 s und sprengt Kisten.", "dmg": 1600.0, "range": 8.0, "radius": 2.6,
			"color": Color(0.45, 0.9, 1.0), "stun": 1.5, "break": true},
		[{"id": "volta_neon", "name": "Neon-Volta", "price": 80, "hue": 0.5, "hair": Color(1.0, 0.3, 0.8)}])
	b["gadget"] = {"name": "Überladung", "desc": "Elektroschock: betäubt Gegner in der Nähe.", "type": "stun_pulse", "range": 3.5, "stun": 1.2, "dmg": 500.0, "cooldown": 7.0, "color": Color(0.45, 0.9, 1.0)}
	return b

static func nebel() -> Dictionary:
	var b := _single("nebel", "Nebel", "Schattenläuferin", "Mythisch", "Assassine",
		"Lautlose Kämpferin mit zwei Dolchen. Schnelle Stichkombos und ein Schattensprint, der Gegner betäubt.",
		3500.0, 4.9, 3, 1.1,
		{"robe": Color(0.22, 0.14, 0.32), "trim": Color(0.75, 0.3, 0.95), "skin": Color(0.96, 0.78, 0.66), "hair": Color(0.18, 0.12, 0.25),
			"hair_style": "hood", "face": "ninja", "weapon": "daggers", "cape": true, "eye": Color(0.8, 0.4, 1.0), "blade": Color(0.85, 0.85, 0.95), "size": 0.95},
		"Dolchwirbel", "1 Munition = 3 blitzschnelle Stiche.",
		{"type": "melee", "combo": [
			{"t": 0.0, "dir": "thrust", "dmg": 400.0, "range": 2.3, "arc": 70.0, "color": Color(0.8, 0.5, 1.0)},
			{"t": 0.08, "dir": "ltr", "dmg": 400.0, "range": 2.3, "arc": 110.0, "color": Color(0.8, 0.5, 1.0)},
			{"t": 0.16, "dir": "rtl", "dmg": 450.0, "range": 2.3, "arc": 110.0, "color": Color(0.8, 0.5, 1.0)}]},
		{"type": "dash", "name": "Schattensprint", "desc": "Blitzschneller Sprint durch Gegner – betäubt alle Getroffenen.", "dmg": 1200.0, "range": 7.5, "speed": 24.0,
			"color": Color(0.7, 0.4, 1.0), "stun": 1.2},
		[{"id": "nebel_sakura", "name": "Kirschblüte", "price": 150, "hue": 0.55, "hair": Color(1.0, 0.7, 0.85)}])
	b["gadget"] = {"name": "Rauchwolke", "desc": "Verschwindet im Rauch und taucht weiter vorne auf.", "type": "blink", "range": 5.0, "cooldown": 5.0, "color": Color(0.6, 0.5, 0.8)}
	return b

static func granit() -> Dictionary:
	var b := _single("granit", "Granit", "Der Felsenriese", "Super Selten", "Panzer",
		"Ein lebender Felsbrocken. Seine Fäuste schleudern Gegner weg, sein Erdbeben bricht durch Kisten.",
		6800.0, 4.0, 3, 1.5,
		{"robe": Color(0.45, 0.42, 0.4), "trim": Color(0.35, 0.75, 0.4), "skin": Color(0.62, 0.6, 0.58), "hair": Color(0.35, 0.65, 0.35),
			"hair_style": "bald", "face": "angry", "weapon": "fists", "cape": false, "eye": Color(1.0, 0.75, 0.2), "blade": Color(0.55, 0.52, 0.5), "size": 1.25},
		"Felsfaust", "1 Munition = ein wuchtiger Schlag von oben mit starkem Rückstoß.",
		{"type": "melee", "combo": [
			{"t": 0.0, "dir": "over", "dmg": 1300.0, "range": 2.5, "arc": 120.0, "color": Color(0.85, 0.75, 0.55), "knock": 1.8}]},
		{"type": "wave", "name": "Erdbeben", "desc": "Eine Bodenwelle, die alle Gegner betäubt und Kisten zerstört.", "dmg": 1500.0, "range": 8.0, "width": 1.4, "speed": 10.0,
			"color": Color(0.85, 0.7, 0.45), "pierce": true, "charge": 0.0, "explode": 0.0, "stun": 1.0, "break": true},
		[{"id": "granit_kristall", "name": "Kristall-Granit", "price": 80, "hue": 0.55, "hair": Color(0.7, 0.4, 1.0)}])
	b["gadget"] = {"name": "Steinhaut", "desc": "3 Sekunden 65 % weniger Schaden.", "type": "shield", "duration": 3.0, "cooldown": 8.0, "color": Color(0.85, 0.75, 0.55)}
	return b

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
					"dmg": 2300.0, "range": 11.0, "width": 1.15, "speed": 18.0, "color": crimson, "pierce": true, "charge": 0.0, "explode": 0.0, "break": true},
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
					"dmg": 3200.0, "range": 12.0, "width": 1.5, "speed": 16.0, "color": final_c, "pierce": false, "charge": 0.7, "explode": 3.0, "break": true, "stun": 1.0, "knock": 2.0},
			},
		],
	}
