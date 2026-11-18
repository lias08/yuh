# Globaler Spielzustand (Autoload "Game"): Speicherstand, Brawler-Daten, Boxen, Codes,
# synthetische Soundeffekte und UI-Stil-Helfer.
extends Node

const BrawlersData = preload("res://scripts/brawlers.gd")

const SAVE_PATH := "user://brawlarena_save.json"

var data := {
	"coins": 500, "gems": 20, "trophies": 0, "unlocked": [], "selected": "klingengeist",
	"music": 0.6, "sfx": 0.8, "boxes_opened": 0,
	"owned_skins": [], "equipped": {}, "last_free_box": 0.0, "infinite": false,
	"road_claimed": [], "lang": "de", "mode": "training",
}
var brawlers: Array = []
var _sfx_cache := {}
var _players: Array = []
var _player_idx := 0

func _ready() -> void:
	brawlers = BrawlersData.all()
	load_game()
	for b in brawlers:
		if b.get("default_unlocked", false) and not (b.id in data.unlocked):
			data.unlocked.append(b.id)
	if get_brawler(data.selected).is_empty():
		data.selected = brawlers[0].id
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_players.append(p)

# ------------------------------------------------------------------ Speicherstand
func load_game() -> void:
	var parsed = _read_json(SAVE_PATH)
	if not (parsed is Dictionary):
		parsed = _read_json(SAVE_PATH + ".bak")  # Fallback auf Sicherungskopie
	if parsed is Dictionary:
		for k in (parsed as Dictionary).keys():
			data[k] = parsed[k]

## Speichert sicher: erst in eine temporäre Datei, dann ersetzen; die vorige Version bleibt als Backup.
func save_game() -> void:
	data.save_version = 2
	var tmp := SAVE_PATH + ".tmp"
	var f := FileAccess.open(tmp, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify(data))
	f.close()
	var dir := DirAccess.open("user://")
	if dir == null:
		return
	if FileAccess.file_exists(SAVE_PATH):
		dir.copy(SAVE_PATH, SAVE_PATH + ".bak")
		dir.remove(SAVE_PATH)
	dir.rename(tmp, SAVE_PATH)

## Beim Schließen / In-den-Hintergrund-Wechseln der App immer speichern.
func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		save_game()

func _read_json(path: String):
	if not FileAccess.file_exists(path):
		return null
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return null
	return JSON.parse_string(f.get_as_text())

# ------------------------------------------------------------------ Brawler
func get_brawler(id: String) -> Dictionary:
	for b in brawlers:
		if b.id == id:
			return b
	return {}

func is_unlocked(id: String) -> bool:
	return id in data.unlocked

func selected_brawler() -> Dictionary:
	return get_brawler(data.selected)

## Code-Menü: "67" schaltet alle Brawler frei.
func redeem_code(code: String) -> String:
	if code.strip_edges() != "67":
		return ""
	if not data.has("owned_skins"):
		data.owned_skins = []
	var count := 0
	for b in brawlers:
		if not is_unlocked(b.id):
			data.unlocked.append(b.id)
			count += 1
	data.infinite = true
	var skins := 0
	for b in brawlers:
		for sk in b.get("skins", []):
			if not owns_skin(sk.id):
				data.owned_skins.append(sk.id)
				skins += 1
	save_game()
	if count == 0 and skins == 0:
		return "Du besitzt bereits alle Brawler und Skins!\nUnendlich Münzen und Edelsteine sind aktiv."
	return "%d Brawler und %d Skins freigeschaltet!\nAb jetzt: unendlich Münzen und Edelsteine." % [count, skins]

# ------------------------------------------------------------------ Trophäenpfad
const ROAD := [
	{"trophies": 10, "type": "coins", "amount": 100},
	{"trophies": 25, "type": "box", "box": "brawl"},
	{"trophies": 50, "type": "gems", "amount": 20},
	{"trophies": 80, "type": "box", "box": "big"},
	{"trophies": 120, "type": "coins", "amount": 300},
	{"trophies": 170, "type": "skin"},
	{"trophies": 230, "type": "box", "box": "big"},
	{"trophies": 300, "type": "gems", "amount": 50},
	{"trophies": 400, "type": "box", "box": "mega"},
	{"trophies": 500, "type": "coins", "amount": 800},
	{"trophies": 650, "type": "skin"},
	{"trophies": 800, "type": "box", "box": "mega"},
	{"trophies": 1000, "type": "gems", "amount": 150},
]

func road_state(i: int) -> String:
	if i in data.road_claimed:
		return "claimed"
	return "ready" if int(data.trophies) >= ROAD[i].trophies else "locked"

func road_label(step: Dictionary) -> String:
	match step.type:
		"coins": return "%d %s" % [step.amount, t("Münzen")]
		"gems": return "%d %s" % [step.amount, t("Edelsteine")]
		"box": return t(BOXES[step.box].name)
		"skin": return t("Zufälliger Skin")
	return ""

## Belohnung abholen. Rückgabe: Belohnungsliste (wie bei Boxen).
func claim_road(i: int) -> Array:
	if road_state(i) != "ready":
		return []
	data.road_claimed.append(i)
	var step: Dictionary = ROAD[i]
	var rewards: Array = []
	match step.type:
		"coins":
			data.coins += step.amount
			rewards.append({"kind": "coins", "amount": step.amount, "text": road_label(step), "sub": "", "color": Color(1.0, 0.85, 0.25)})
		"gems":
			data.gems += step.amount
			rewards.append({"kind": "gems", "amount": step.amount, "text": road_label(step), "sub": "", "color": Color(0.35, 1.0, 0.55)})
		"box":
			rewards = open_box(step.box, false, true)
		"skin":
			var sk := _roll_skin()
			if sk.is_empty():
				data.gems += 40
				rewards.append({"kind": "gems", "amount": 40, "text": "40 " + t("Edelsteine"), "sub": t("Alle Skins schon im Besitz"), "color": Color(0.35, 1.0, 0.55)})
			else:
				data.owned_skins.append(sk.skin.id)
				rewards.append({"kind": "skin", "id": sk.skin.id, "text": sk.skin.name, "sub": t("NEUER SKIN für ") + sk.brawler.name, "color": Color(1, 0.5, 0.85)})
	save_game()
	return rewards

func road_ready_count() -> int:
	var n := 0
	for i in ROAD.size():
		if road_state(i) == "ready":
			n += 1
	return n

# ------------------------------------------------------------------ Sprache
## Übersetzung DE -> EN. Unbekannte Texte bleiben unverändert (Deutsch ist die Grundsprache).
const EN := {
	"Brawler": "Brawlers", "Shop": "Shop", "Einstellungen": "Settings", "SPIELEN": "PLAY", "Zurück": "Back",
	"Trophäenpfad": "Trophy Road", "TROPHÄENPFAD": "TROPHY ROAD", "BRAWLER": "BRAWLERS", "SHOP": "SHOP",
	"EINSTELLUNGEN": "SETTINGS", "SPIELMODUS": "GAME MODE", "Spielmodus": "Game mode",
	"Training": "Training", "3v3 Teamkampf": "3v3 Team Battle", "Showdown": "Showdown",
	"Teste deine Brawler an Puppen.\nKein Zeitlimit, keine Trophäen.": "Test your brawlers on dummies.\nNo time limit, no trophies.",
	"Du + 2 Bots gegen 3 Bots.\nZuerst 10 K.O.s gewinnt (2:30 Minuten).": "You + 2 bots vs 3 bots.\nFirst to 10 KOs wins (2:30 minutes).",
	"Jeder gegen jeden – 7 Brawler.\nKein Respawn. Der Letzte gewinnt!": "Free for all – 7 brawlers.\nNo respawn. Last one standing wins!",
	"✔ AUSGEWÄHLT": "✔ SELECTED", "Auswählen": "Select", "Ausgewählt": "Selected",
	"Münzen": "Coins", "Edelsteine": "Gems", "Trophäen": "Trophies",
	"Soundeffekte": "Sound effects", "Code eingeben": "Enter code", "Einlösen": "Redeem", "Code": "Code",
	"Bewegungs-Joystick folgt dem Finger": "Movement joystick follows finger", "Sprache": "Language",
	"Ungültiger Code.": "Invalid code.", "OK": "OK", "Abbrechen": "Cancel", "Kaufen": "Buy", "Super!": "Great!",
	"GRATIS-BOX": "FREE BOX", "BRAWL-BOX": "BRAWL BOX", "GROSSE BOX": "BIG BOX", "GROßE BOX": "BIG BOX", "MEGA-BOX": "MEGA BOX",
	"Brawl-Box": "Brawl Box", "Große Box": "Big Box", "Mega-Box": "Mega Box", "Zufälliger Skin": "Random skin",
	"Alle 4 Stunden kostenlos!": "Free every 4 hours!", "ABHOLEN": "CLAIM", "Abholen": "Claim", "Abgeholt": "Claimed", "Gesperrt": "Locked",
	"BELOHNUNGEN": "REWARDS", "Tippe, um die Box zu öffnen!": "Tap to open the box!", "SKINS": "SKINS", "SKIN": "SKIN",
	"Gesperrt – nur mit Glück aus Boxen!": "Locked – only from boxes with luck!", "GESPERRT\n(nur aus Boxen)": "LOCKED\n(boxes only)",
	"Verlassen": "Leave", "TRAINING": "TRAINING", "3v3 TEAMKAMPF": "3v3 TEAM BATTLE", "SHOWDOWN": "SHOWDOWN",
	"SIEG!": "VICTORY!", "NIEDERLAGE": "DEFEAT", "UNENTSCHIEDEN": "DRAW", "Weiter": "Continue",
	"Belohnung": "Reward", "Training beendet": "Training finished", "Match verlassen": "Left match",
	"Ohne Belohnung verlassen.": "Left without reward.", "Nicht verfügbar": "Not available",
	"Dafür fehlt dir noch Währung.": "You don't have enough currency.", "Skin kaufen?": "Buy skin?", "Skin gekauft!": "Skin bought!",
	"Standard": "Default", "AUSGERÜSTET": "EQUIPPED", "Besitzt du": "Owned", "Hoppla": "Oops",
	"NEUER SKIN für ": "NEW SKIN for ", "Alle Skins schon im Besitz": "All skins already owned",
	"Die Super lädt sich durch Schaden an Gegnern auf.": "Your super charges by damaging enemies.",
	"Modus: ": "Mode: ", "Deutsch": "Deutsch", "English": "English",
}
## Wort-Ersetzungen für zusammengesetzte Texte (z.B. "Münzen: 500").
const EN_WORDS := {
	"Münzen": "Coins", "Edelsteine": "Gems", "Trophäen": "Trophies", "Belohnungen": "rewards", "Brawler-Chance": "Brawler chance",
	"Leben": "Health", "Tempo": "Speed", "Munition": "Ammo", "Nachladen": "Reload", "ANGRIFF": "ATTACK", "Hiebe pro Munition": "Hits per ammo",
	"Schaden pro Kombo": "Damage per combo", "Schaden pro Angriff": "Damage per attack", "Reichweite": "Range", "Schaden gesamt": "Total damage",
	"Wiedereinstieg in": "Respawn in", "Übrig": "Left", "Blau": "Blue", "Rot": "Red", "Deine K.O.s": "Your KOs", "PLATZ": "RANK",
	"Verursachter Schaden": "Damage dealt", "gesamt": "total", "Übrig gebliebene Gegner": "Enemies left", "Formen": "Forms",
	"Kombo": "Combo", "Hieb(e) pro Munition": "hit(s) per ammo", "Angriff": "Attack", "Modus": "Mode", "NEUER BRAWLER!": "NEW BRAWLER!",
	"Weiter": "Next", "Noch": "Tap", "x tippen!": "more times!", "für": "for", "in ": "in ",
}

func t(text: String) -> String:
	if data.get("lang", "de") != "en" or text == "":
		return text
	if EN.has(text):
		return EN[text]
	var out := text
	for w in EN_WORDS:
		out = out.replace(w, EN_WORDS[w])
	return out

# ------------------------------------------------------------------ Währung
## Unendliche Ressourcen (Code 67): Käufe kosten nichts.
func is_infinite() -> bool:
	return data.get("infinite", false)

func has_gems(amount: int) -> bool:
	return is_infinite() or data.gems >= amount

func spend(currency: String, amount: int) -> void:
	if not is_infinite():
		data[currency] -= amount

func currency_text() -> String:
	if is_infinite():
		return t("Münzen") + ": ∞    " + t("Edelsteine") + ": ∞"
	return "%s: %d    %s: %d" % [t("Münzen"), data.coins, t("Edelsteine"), data.gems]

# ------------------------------------------------------------------ Skins
func get_skin(b: Dictionary, skin_id: String) -> Dictionary:
	for sk in b.get("skins", []):
		if sk.id == skin_id:
			return sk
	return {}

func owns_skin(skin_id: String) -> bool:
	return skin_id in data.owned_skins

func equipped_skin(b: Dictionary) -> Dictionary:
	return get_skin(b, data.equipped.get(b.id, ""))

## Aussehen einer Form inkl. ausgerüstetem (oder angegebenem) Skin.
func look_for(b: Dictionary, form_i: int, skin_override := "-") -> Dictionary:
	var look: Dictionary = b.forms[form_i].look.duplicate()
	var sk: Dictionary = equipped_skin(b) if skin_override == "-" else get_skin(b, skin_override)
	if not sk.is_empty():
		for key in ["robe", "trim", "hat", "blade"]:
			if look.has(key):
				var c: Color = look[key]
				look[key] = Color.from_hsv(fposmod(c.h + sk.hue, 1.0), max(c.s, 0.35) if c.s > 0.05 else c.s, c.v)
		if sk.has("hair"):
			look.hair = sk.hair
	return look

func buy_skin(b: Dictionary, skin_id: String) -> String:
	var sk := get_skin(b, skin_id)
	if sk.is_empty() or owns_skin(skin_id):
		return ""
	if not has_gems(sk.price):
		return "Nicht genug Edelsteine! (%d benötigt)" % sk.price
	spend("gems", sk.price)
	data.owned_skins.append(skin_id)
	data.equipped[b.id] = skin_id
	save_game()
	return "ok"

func equip_skin(b: Dictionary, skin_id: String) -> void:
	data.equipped[b.id] = skin_id
	save_game()

# ------------------------------------------------------------------ Boxen
const BOXES := {
	"brawl": {"name": "Brawl-Box", "price": 100, "currency": "coins", "rolls": 3, "brawler": 0.10, "color": Color(0.25, 0.55, 1.0)},
	"big": {"name": "Große Box", "price": 30, "currency": "gems", "rolls": 6, "brawler": 0.22, "color": Color(1.0, 0.5, 0.15)},
	"mega": {"name": "Mega-Box", "price": 80, "currency": "gems", "rolls": 10, "brawler": 0.45, "color": Color(0.75, 0.3, 1.0)},
}
const FREE_BOX_SECONDS := 4 * 3600

func can_afford_box(type: String) -> bool:
	var bx: Dictionary = BOXES[type]
	return data.get("infinite", false) or data[bx.currency] >= bx.price

func free_box_ready() -> bool:
	return Time.get_unix_time_from_system() - float(data.last_free_box) >= FREE_BOX_SECONDS

func free_box_wait_text() -> String:
	var left := int(FREE_BOX_SECONDS - (Time.get_unix_time_from_system() - float(data.last_free_box)))
	return "%dh %02dm" % [left / 3600, (left % 3600) / 60]

## Öffnet eine Box. Rückgabe: Liste von Belohnungen {kind, text, color, amount, id}.
func open_box(type: String, free := false, gift := false) -> Array:
	var bx: Dictionary = BOXES[type]
	if gift:
		pass  # Geschenk (z.B. Trophäenpfad): kostet nichts
	elif free:
		if not free_box_ready():
			return []
		data.last_free_box = Time.get_unix_time_from_system()
	else:
		if not can_afford_box(type):
			return []
		spend(bx.currency, bx.price)
	data.boxes_opened += 1
	var rewards: Array = []
	var coins := 0
	var gems := 0
	for i in bx.rolls:
		var r := randf()
		if r < bx.brawler:
			var b := _roll_locked_brawler()
			if not b.is_empty():
				data.unlocked.append(b.id)
				rewards.append({"kind": "brawler", "id": b.id, "text": b.name, "sub": "NEUER BRAWLER! (" + b.rarity + ")", "color": b.rarity_color})
				continue
		if r > 0.93:
			var sk := _roll_skin()
			if not sk.is_empty():
				data.owned_skins.append(sk.skin.id)
				rewards.append({"kind": "skin", "id": sk.skin.id, "text": sk.skin.name, "sub": "NEUER SKIN für " + sk.brawler.name, "color": Color(1, 0.5, 0.85)})
				continue
		if r > 0.78:
			gems += randi_range(2, 6)
		else:
			coins += randi_range(25, 70)
	if gems > 0:
		data.gems += gems
		rewards.push_front({"kind": "gems", "amount": gems, "text": "%d Edelsteine" % gems, "sub": "", "color": Color(0.35, 1.0, 0.55)})
	if coins > 0:
		data.coins += coins
		rewards.push_front({"kind": "coins", "amount": coins, "text": "%d Münzen" % coins, "sub": "", "color": Color(1.0, 0.85, 0.25)})
	save_game()
	return rewards

func _roll_locked_brawler() -> Dictionary:
	var locked: Array = brawlers.filter(func(b): return not is_unlocked(b.id))
	if locked.is_empty():
		return {}
	var total := 0.0
	for b in locked:
		total += BrawlersData.rarity_weight(b.rarity)
	var x := randf() * total
	for b in locked:
		x -= BrawlersData.rarity_weight(b.rarity)
		if x <= 0.0:
			return b
	return locked[-1]

func _roll_skin() -> Dictionary:
	var pool: Array = []
	for b in brawlers:
		if not is_unlocked(b.id):
			continue
		for sk in b.get("skins", []):
			if not owns_skin(sk.id):
				pool.append({"brawler": b, "skin": sk})
	return pool[randi() % pool.size()] if pool.size() > 0 else {}

## Belohnungen für Teamkampf/Showdown (Trophäen + Münzen).
func award_match(res: Dictionary) -> Dictionary:
	var tr := 0
	var coins := 0
	if res.mode == "team":
		tr = {"victory": 8, "draw": 0, "defeat": -4}[res.outcome]
		coins = {"victory": 30, "draw": 15, "defeat": 10}[res.outcome]
	else:
		var table := [10, 7, 4, 1, -2, -4, -6]
		tr = table[clamp(res.rank - 1, 0, table.size() - 1)]
		coins = max(5, 35 - (res.rank - 1) * 5)
	coins += res.kills * 3
	var total: int = int(data.get("trophies", 0))
	tr = max(tr, -total)
	data.trophies = total + tr
	data.coins += coins
	save_game()
	return {"trophies": tr, "coins": coins}

## Münzen für das Training (nach Schaden), max. 60 pro Runde.
func award_training(damage: float) -> int:
	var coins := int(min(60.0, damage / 1500.0))
	data.coins += coins
	save_game()
	return coins

# ------------------------------------------------------------------ Sound (synthetisch)
func play_sfx(name: String, volume := 1.0, pitch := 1.0) -> void:
	if data.sfx <= 0.01:
		return
	if not _sfx_cache.has(name):
		_sfx_cache[name] = _make_sfx(name)
	var p: AudioStreamPlayer = _players[_player_idx]
	_player_idx = (_player_idx + 1) % _players.size()
	p.stream = _sfx_cache[name]
	p.volume_db = linear_to_db(clamp(volume * data.sfx, 0.001, 1.0))
	p.pitch_scale = pitch * randf_range(0.95, 1.05)
	p.play()

func _make_sfx(name: String) -> AudioStreamWAV:
	# [Länge, Startfrequenz, Endfrequenz, Rauschanteil, Rechteckanteil, Attack]
	var cfg := {
		"swoosh": [0.2, 600.0, 180.0, 0.9, 0.0, 0.03],
		"hit": [0.12, 700.0, 180.0, 0.5, 0.3, 0.001],
		"wave": [0.45, 300.0, 1400.0, 0.4, 0.4, 0.02],
		"explosion": [0.8, 110.0, 30.0, 0.9, 0.0, 0.003],
		"transform": [0.9, 200.0, 1600.0, 0.3, 0.5, 0.15],
		"charge": [0.7, 150.0, 900.0, 0.2, 0.6, 0.3],
		"click": [0.06, 1500.0, 1100.0, 0.0, 0.5, 0.001],
		"box": [0.6, 300.0, 1200.0, 0.2, 0.4, 0.1],
		"hurt": [0.2, 420.0, 180.0, 0.1, 0.7, 0.002],
		"shot": [0.18, 900.0, 300.0, 0.2, 0.6, 0.002],
		"ready": [0.4, 523.0, 1568.0, 0.0, 0.3, 0.01],
	}
	var c: Array = cfg.get(name, cfg["click"])
	var rate := 22050
	var n: int = int(c[0] * rate)
	var bytes := PackedByteArray()
	bytes.resize(n * 2)
	var phase := 0.0
	var lp := 0.0
	for i in n:
		var t := float(i) / rate
		var k: float = t / float(c[0])
		var f: float = lerp(c[1], c[2], k)
		phase += f / rate
		var s := sin(phase * TAU)
		var sq := 1.0 if s >= 0.0 else -1.0
		lp += (randf() * 2.0 - 1.0 - lp) * clamp(f / 3000.0 + 0.05, 0.0, 1.0)
		var tone: float = lerp(s, sq * 0.6, c[4])
		var v: float = lerp(tone, lp * 1.6, c[3])
		var env: float = t / c[5] if t < c[5] else clamp(1.0 - (t - c[5]) / (c[0] - c[5]), 0.0, 1.0)
		var sample := int(clamp(v * env * env * 0.5, -1.0, 1.0) * 32767.0)
		bytes.encode_s16(i * 2, sample)
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = rate
	wav.stereo = false
	wav.data = bytes
	return wav

# ------------------------------------------------------------------ UI-Stil
func style(color: Color, radius := 22, border := 5) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = color
	s.set_corner_radius_all(radius)
	s.set_border_width_all(border)
	s.border_color = Color(0.06, 0.04, 0.12)
	s.border_width_bottom = border + 6
	s.shadow_color = Color(0, 0, 0, 0.35)
	s.shadow_size = 4
	s.content_margin_left = 16
	s.content_margin_right = 16
	return s

func make_button(text: String, color: Color, size := Vector2(300, 90), font_size := 30) -> Button:
	var b := Button.new()
	b.text = t(text)
	b.custom_minimum_size = size
	b.add_theme_stylebox_override("normal", style(color))
	b.add_theme_stylebox_override("hover", style(color.lightened(0.1)))
	b.add_theme_stylebox_override("pressed", style(color.darkened(0.15)))
	b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	b.add_theme_stylebox_override("disabled", style(Color(0.4, 0.4, 0.45)))
	b.add_theme_font_size_override("font_size", font_size)
	b.add_theme_color_override("font_color", Color.WHITE)
	b.add_theme_color_override("font_outline_color", Color(0.05, 0.03, 0.1))
	b.add_theme_constant_override("outline_size", 8)
	b.pressed.connect(func(): play_sfx("click", 0.6))
	return b

func make_label(text: String, font_size := 28, color := Color.WHITE, outline := 8) -> Label:
	var l := Label.new()
	l.text = t(text)
	l.add_theme_font_size_override("font_size", font_size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_outline_color", Color(0.05, 0.03, 0.1))
	l.add_theme_constant_override("outline_size", outline)
	return l

func make_panel(color: Color) -> PanelContainer:
	var p := PanelContainer.new()
	var s := style(color, 26, 5)
	s.content_margin_top = 14
	s.content_margin_bottom = 18
	p.add_theme_stylebox_override("panel", s)
	return p
