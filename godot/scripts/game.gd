# Globaler Spielzustand (Autoload "Game"): Speicherstand, Brawler-Daten, Boxen, Codes,
# synthetische Soundeffekte und UI-Stil-Helfer.
extends Node

const BrawlersData = preload("res://scripts/brawlers.gd")

const SAVE_PATH := "user://brawlarena_save.json"

var data := {
	"coins": 500, "gems": 20, "trophies": 0, "unlocked": [], "selected": "klingengeist",
	"music": 0.6, "sfx": 0.8, "boxes_opened": 0,
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
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return
	var parsed = JSON.parse_string(f.get_as_text())
	if parsed is Dictionary:
		for k in (parsed as Dictionary).keys():
			data[k] = parsed[k]

func save_game() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(data))

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
	var count := 0
	for b in brawlers:
		if not is_unlocked(b.id):
			data.unlocked.append(b.id)
			count += 1
	save_game()
	if count == 0:
		return "Code eingelöst! Du besitzt bereits alle Brawler."
	return "Code eingelöst! %d Brawler freigeschaltet." % count

## Brawl-Box: Münzen, Edelsteine und mit Glück ein neuer Brawler.
const BOX_PRICE := 100
func open_box() -> Array:
	if data.coins < BOX_PRICE:
		return []
	data.coins -= BOX_PRICE
	data.boxes_opened += 1
	var rewards: Array = []
	var locked: Array = brawlers.filter(func(b): return not is_unlocked(b.id))
	if locked.size() > 0 and randf() < 0.12:
		var b = locked[randi() % locked.size()]
		data.unlocked.append(b.id)
		rewards.append("NEUER BRAWLER: " + b.name + "!")
	var coins := randi_range(40, 120)
	data.coins += coins
	rewards.append("+%d Münzen" % coins)
	if randf() < 0.3:
		var gems := randi_range(2, 8)
		data.gems += gems
		rewards.append("+%d Edelsteine" % gems)
	if locked.size() == 0 and rewards.size() < 3:
		rewards.append("(Alle Brawler bereits freigeschaltet)")
	save_game()
	return rewards

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
	b.text = text
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
	l.text = text
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
