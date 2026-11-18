# Hauptmenü & Bildschirme: Start, Brawler-Menü (Liste + Details mit 3D-Vorschau aller Formen),
# Shop (Brawl-Box), Einstellungen (Lautstärke + Code-Menü) und Start des Trainingsmatches.
extends Node

var ui: CanvasLayer
var screen: Control
var stage_viewport: SubViewport
var stage_model: Node3D
var stage_rig: Dictionary
var stage_form := 0
var current_match: Node3D
var _t := 0.0

func _ready() -> void:
	if "--test" in OS.get_cmdline_user_args():
		_run_tests()
		return
	ui = CanvasLayer.new()
	add_child(ui)
	show_menu()

# ==================================================================== Hilfen
func _clear() -> void:
	if screen:
		screen.queue_free()
	screen = Control.new()
	screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	ui.add_child(screen)
	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(0.22, 0.32, 0.85)
	screen.add_child(bg)
	var grad := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.set_color(0, Color(0.35, 0.6, 1.0))
	g.set_color(1, Color(0.18, 0.12, 0.45))
	gt.gradient = g
	gt.fill_from = Vector2(0, 0)
	gt.fill_to = Vector2(0, 1)
	grad.texture = gt
	grad.stretch_mode = TextureRect.STRETCH_SCALE
	grad.set_anchors_preset(Control.PRESET_FULL_RECT)
	screen.add_child(grad)

func _place(c: Control, anchor: Vector2, offset: Vector2) -> Control:
	screen.add_child(c)
	c.anchor_left = anchor.x; c.anchor_right = anchor.x
	c.anchor_top = anchor.y; c.anchor_bottom = anchor.y
	c.position = Vector2.ZERO
	c.offset_left = offset.x
	c.offset_top = offset.y
	return c

func _top_bar(title: String, back: bool) -> void:
	if back:
		var b := Game.make_button("Zurück", Color(0.25, 0.55, 1.0), Vector2(190, 80), 26)
		b.pressed.connect(show_menu)
		_place(b, Vector2(0, 0), Vector2(20, 18))
	var t := Game.make_label(title, 44, Color.WHITE, 12)
	_place(t, Vector2(0, 0), Vector2(230 if back else 30, 26))
	var cur := Game.make_label("Münzen: %d    Edelsteine: %d" % [Game.data.coins, Game.data.gems], 26, Color(1, 0.88, 0.3), 8)
	_place(cur, Vector2(1, 0), Vector2(-520, 34))

## 3D-Bühne mit dem Brawler (eigene Welt in einem SubViewport).
func _stage(form_index: int, anchor: Vector2, offset: Vector2, size: Vector2) -> void:
	var container := SubViewportContainer.new()
	container.stretch = true
	container.size = size
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_place(container, anchor, offset)
	container.size = size
	stage_viewport = SubViewport.new()
	stage_viewport.own_world_3d = true
	stage_viewport.transparent_bg = true
	stage_viewport.size = Vector2i(size)
	container.add_child(stage_viewport)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.8, 0.82, 1.0)
	e.ambient_light_energy = 0.6
	env.environment = e
	stage_viewport.add_child(env)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-40, 30, 0)
	light.shadow_enabled = true
	stage_viewport.add_child(light)
	var cam := Camera3D.new()
	cam.fov = 32
	cam.position = Vector3(0, 1.6, 5.6)
	stage_viewport.add_child(cam)
	cam.look_at(Vector3(0, 0.95, 0))
	ModelBuilder.part(stage_viewport_root(), "cyl", Vector3(0, -0.12, 0), Vector3(2.6, 0.24, 2.6), Color(0.98, 0.75, 0.2))
	ModelBuilder.part(stage_viewport_root(), "cyl", Vector3(0, -0.4, 0), Vector3(3.1, 0.3, 3.1), Color(0.85, 0.5, 0.15))
	stage_model = Node3D.new()
	stage_viewport.add_child(stage_model)
	_show_form(form_index)

func stage_viewport_root() -> Node3D:
	var n := Node3D.new()
	stage_viewport.add_child(n)
	return n

func _show_form(i: int) -> void:
	stage_form = i
	for c in stage_model.get_children():
		c.queue_free()
	var b := Game.selected_brawler() if screen == null or not screen.has_meta("detail") else Game.get_brawler(screen.get_meta("detail"))
	stage_rig = ModelBuilder.build(b.forms[i].look)
	stage_rig.root.rotation.y = PI
	stage_model.add_child(stage_rig.root)

func _process(delta: float) -> void:
	_t += delta
	if stage_model and is_instance_valid(stage_model) and stage_rig.has("root") and is_instance_valid(stage_rig.root):
		stage_model.rotation.y = sin(_t * 0.6) * 0.6
		stage_rig.body.position.y = sin(_t * 2.6) * 0.03
		stage_rig.hand_r.position.y = 0.62 + sin(_t * 2.6) * 0.03

# ==================================================================== Hauptmenü
func show_menu() -> void:
	_clear()
	_top_bar("BRAWLARENA", false)
	var b := Game.selected_brawler()
	_stage(0, Vector2(0.5, 0.5), Vector2(-300, -300), Vector2(600, 560))
	var name_l := Game.make_label(b.name.to_upper() + "  •  " + b.rarity, 34, b.rarity_color, 10)
	_place(name_l, Vector2(0.5, 1), Vector2(-220, -120))

	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 18)
	_place(col, Vector2(0, 0), Vector2(30, 130))
	var brawlers := Game.make_button("Brawler", Color(0.25, 0.55, 1.0))
	brawlers.pressed.connect(show_brawlers)
	col.add_child(brawlers)
	var shop := Game.make_button("Shop", Color(1.0, 0.55, 0.15))
	shop.pressed.connect(show_shop)
	col.add_child(shop)
	var settings := Game.make_button("Einstellungen", Color(0.45, 0.45, 0.55))
	settings.pressed.connect(show_settings)
	col.add_child(settings)

	var mode := Game.make_label("Modus: Training gegen Puppen", 24, Color.WHITE, 8)
	_place(mode, Vector2(1, 1), Vector2(-430, -230))
	var play := Game.make_button("SPIELEN", Color(1.0, 0.8, 0.15), Vector2(400, 130), 46)
	play.pressed.connect(start_match)
	_place(play, Vector2(1, 1), Vector2(-430, -180))

# ==================================================================== Brawler-Menü
func show_brawlers() -> void:
	_clear()
	_top_bar("BRAWLER", true)
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 24)
	grid.add_theme_constant_override("v_separation", 24)
	_place(grid, Vector2(0, 0), Vector2(40, 140))
	for b in Game.brawlers:
		var unlocked := Game.is_unlocked(b.id)
		var card := Game.make_button("", b.rarity_color.darkened(0.35) if unlocked else Color(0.3, 0.3, 0.36), Vector2(270, 330))
		var vb := VBoxContainer.new()
		vb.alignment = BoxContainer.ALIGNMENT_CENTER
		vb.set_anchors_preset(Control.PRESET_FULL_RECT)
		vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
		card.add_child(vb)
		var n := Game.make_label(b.name.to_upper(), 30, Color.WHITE if unlocked else Color(0.7, 0.7, 0.75))
		n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vb.add_child(n)
		var r := Game.make_label(b.rarity, 22, b.rarity_color)
		r.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vb.add_child(r)
		var s := Game.make_label(("%d Formen" % b.forms.size()) if unlocked else "GESPERRT\n(nur aus Boxen)", 22, Color.WHITE)
		s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vb.add_child(s)
		if Game.data.selected == b.id:
			var sel := Game.make_label("✔ AUSGEWÄHLT", 20, Color(0.5, 1, 0.5))
			sel.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			vb.add_child(sel)
		var id: String = b.id
		card.pressed.connect(func(): show_detail(id))
		grid.add_child(card)

func show_detail(id: String) -> void:
	_clear()
	screen.set_meta("detail", id)
	var b := Game.get_brawler(id)
	var unlocked := Game.is_unlocked(id)
	_top_bar(b.name.to_upper(), true)
	_stage(stage_form if stage_form < b.forms.size() else 0, Vector2(0, 0.5), Vector2(10, -280), Vector2(520, 520))

	var forms := HBoxContainer.new()
	forms.add_theme_constant_override("separation", 10)
	_place(forms, Vector2(0, 1), Vector2(30, -120))
	for i in b.forms.size():
		var fb := Game.make_button("Form %d" % (i + 1), Color(1, 0.75, 0.2) if i == stage_form else Color(0.35, 0.35, 0.5), Vector2(118, 80), 22)
		var idx: int = i
		fb.pressed.connect(func():
			stage_form = idx
			show_detail(id))
		forms.add_child(fb)

	var panel := Game.make_panel(Color(0.14, 0.12, 0.3, 0.92))
	panel.custom_minimum_size = Vector2(700, 0)
	_place(panel, Vector2(1, 0), Vector2(-740, 120))
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(680, 440)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel.add_child(scroll)
	var vb := VBoxContainer.new()
	vb.custom_minimum_size = Vector2(660, 0)
	vb.add_theme_constant_override("separation", 10)
	scroll.add_child(vb)
	var f: Dictionary = b.forms[stage_form]
	var head := Game.make_label("%s  •  %s  •  %s" % [b.rarity, b.role, b.title], 24, b.rarity_color, 6)
	vb.add_child(head)
	var desc := Game.make_label(b.desc, 20, Color(0.85, 0.85, 0.95), 4)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.custom_minimum_size = Vector2(640, 0)
	vb.add_child(desc)
	var stats := Game.make_label("Leben: %d    Tempo: %.1f    Munition: %d    Nachladen: %.2f s" % [int(b.hp * f.hp_mul), b.speed * f.speed_mul, b.ammo, b.reload * f.reload_mul], 20, Color.WHITE, 5)
	vb.add_child(stats)
	vb.add_child(Game.make_label(f.name, 28, Color(1, 0.85, 0.3), 8))
	var a := Game.make_label("ANGRIFF – %s\n%s" % [f.combo_name, f.combo_desc], 20, Color(1, 0.7, 0.45), 5)
	a.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	a.custom_minimum_size = Vector2(640, 0)
	vb.add_child(a)
	var dmg := 0.0
	for s in f.combo:
		dmg += s.dmg + (s.wave.dmg if s.has("wave") else 0.0)
	vb.add_child(Game.make_label("Hiebe pro Munition: %d    Schaden pro Kombo: %d" % [f.combo.size(), int(dmg)], 20, Color.WHITE, 5))
	var sup := Game.make_label("SUPER – %s\n%s" % [f.super.name, f.super.desc], 20, Color(1, 0.9, 0.35), 5)
	sup.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	sup.custom_minimum_size = Vector2(640, 0)
	vb.add_child(sup)
	var evo := Game.make_label("Die Super lädt sich durch Schaden an Gegnern auf. Jede Super schaltet bis Matchende die nächste Form frei.", 18, Color(0.8, 0.8, 0.9), 4)
	evo.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	evo.custom_minimum_size = Vector2(640, 0)
	vb.add_child(evo)

	if unlocked:
		var selected: bool = Game.data.selected == id
		var sel := Game.make_button("Ausgewählt" if selected else "Auswählen", Color(0.4, 0.4, 0.5) if selected else Color(0.3, 0.8, 0.35), Vector2(320, 100), 32)
		sel.pressed.connect(func():
			Game.data.selected = id
			Game.save_game()
			show_brawlers())
		_place(sel, Vector2(1, 1), Vector2(-360, -130))
	else:
		var l := Game.make_label("Gesperrt – nur mit Glück aus Boxen!", 28, Color(1, 0.85, 0.3), 8)
		_place(l, Vector2(1, 1), Vector2(-560, -100))

# ==================================================================== Shop
func show_shop() -> void:
	_clear()
	_top_bar("SHOP", true)
	var panel := Game.make_panel(Color(0.95, 0.5, 0.2))
	_place(panel, Vector2(0.5, 0.5), Vector2(-230, -220))
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 16)
	vb.custom_minimum_size = Vector2(420, 400)
	panel.add_child(vb)
	var t := Game.make_label("BRAWL-BOX", 44, Color.WHITE, 12)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(t)
	var d := Game.make_label("Münzen, Edelsteine und mit\nGlück ein neuer Brawler!", 24, Color.WHITE, 6)
	d.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(d)
	var buy := Game.make_button("Öffnen – %d Münzen" % Game.BOX_PRICE, Color(0.3, 0.8, 0.35), Vector2(380, 100), 28)
	buy.disabled = Game.data.coins < Game.BOX_PRICE
	buy.pressed.connect(func():
		var r := Game.open_box()
		if r.is_empty():
			return
		Game.play_sfx("box", 1.0)
		show_shop()
		_popup("Box geöffnet!", "\n".join(r)))
	vb.add_child(buy)

# ==================================================================== Einstellungen
func show_settings() -> void:
	_clear()
	_top_bar("EINSTELLUNGEN", true)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 22)
	_place(vb, Vector2(0.5, 0), Vector2(-360, 150))
	vb.add_child(Game.make_label("Soundeffekte", 30))
	var slider := HSlider.new()
	slider.min_value = 0
	slider.max_value = 1
	slider.step = 0.05
	slider.value = Game.data.sfx
	slider.custom_minimum_size = Vector2(720, 50)
	slider.value_changed.connect(func(v):
		Game.data.sfx = v
		Game.save_game())
	vb.add_child(slider)
	var joy := CheckButton.new()
	joy.text = "Bewegungs-Joystick folgt dem Finger"
	joy.add_theme_font_size_override("font_size", 26)
	joy.button_pressed = Game.data.get("floating_joy", true)
	joy.toggled.connect(func(on):
		Game.data.floating_joy = on
		Game.save_game())
	vb.add_child(joy)
	vb.add_child(Game.make_label("Code eingeben", 30))
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 16)
	vb.add_child(hb)
	var code := LineEdit.new()
	code.placeholder_text = "Code"
	code.custom_minimum_size = Vector2(400, 80)
	code.add_theme_font_size_override("font_size", 32)
	hb.add_child(code)
	var redeem := Game.make_button("Einlösen", Color(0.65, 0.35, 1.0), Vector2(260, 80), 28)
	redeem.pressed.connect(func():
		var msg := Game.redeem_code(code.text)
		code.text = ""
		_popup("Code", msg if msg != "" else "Ungültiger Code."))
	hb.add_child(redeem)
	var hint := Game.make_label("Steuerung: linker Daumen bewegen • oranger Button: antippen = Auto-Zielen, ziehen = zielen\ngelber Button: Super (lädt sich durch Schaden auf) • PC: WASD, Leertaste, E", 20, Color(0.85, 0.85, 0.95), 5)
	vb.add_child(hint)

func _popup(title: String, text: String) -> void:
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	screen.add_child(dim)
	var panel := Game.make_panel(Color(0.18, 0.15, 0.38))
	dim.add_child(panel)
	panel.set_anchors_preset(Control.PRESET_CENTER)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 16)
	vb.custom_minimum_size = Vector2(560, 300)
	panel.add_child(vb)
	var t := Game.make_label(title, 38, Color(1, 0.85, 0.3), 10)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(t)
	var l := Game.make_label(text, 26, Color.WHITE, 6)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(520, 0)
	vb.add_child(l)
	var ok := Game.make_button("OK", Color(0.3, 0.8, 0.35), Vector2(220, 80), 30)
	ok.pressed.connect(dim.queue_free)
	vb.add_child(ok)
	panel.position = -panel.get_combined_minimum_size() / 2.0

# ==================================================================== Match
func start_match() -> void:
	if screen:
		screen.queue_free()
		screen = null
	stage_model = null
	current_match = preload("res://scripts/match.gd").new()
	add_child(current_match)
	current_match.exit_requested.connect(end_match)

func end_match() -> void:
	if current_match:
		current_match.queue_free()
		current_match = null
	show_menu()

# ==================================================================== Automatischer Test (headless)
func _run_tests() -> void:
	var ok := true
	var log := PackedStringArray()
	Game.data.unlocked = ["klingengeist"]
	log.append("Code falsch: '%s'" % Game.redeem_code("12"))
	ok = ok and Game.redeem_code("12") == ""
	ok = ok and Game.redeem_code("67") != ""
	var m = preload("res://scripts/match.gd").new()
	m.test_mode = true
	add_child(m)
	await get_tree().process_frame
	var p: Fighter = m.player
	var expected := [1, 2, 3, 3]
	for form_i in 4:
		# Spieler direkt vor eine Puppe stellen
		p.position = Vector3(0, 0, 0.6)
		p.ammo = 3.0
		p._cooldown = 0.0
		var hp_before: float = m.dummies[3].hp
		var hits_before: float = m.total_damage
		var ammo_before := p.ammo
		var started := p.try_attack(Vector3(0, 0, -1))
		var used := ammo_before - p.ammo   # direkt nach dem Angriff messen (danach lädt es nach)
		for f in 40:
			await get_tree().process_frame
		await get_tree().create_timer(0.4).timeout
		var combo: Array = p.form().combo
		var swing_dmg := 0.0
		for s in combo:
			swing_dmg += s.dmg
		var dealt: float = m.total_damage - hits_before
		var line := "Form %d (%s): Angriff=%s, Hiebe=%d (erwartet %d), Munition verbraucht≈%.2f, Schaden=%d (Hiebe allein %d)" % [form_i + 1, p.form().name, started, combo.size(), expected[form_i], used, int(dealt), int(swing_dmg)]
		log.append(line)
		ok = ok and started and combo.size() == expected[form_i] and is_equal_approx(used, 1.0) and dealt >= swing_dmg - 1.0
		# Super durch Schaden aufladen und auslösen
		p.super_charge = 0.0
		var guard := 0
		while p.super_charge < 1.0 and guard < 60:
			p.add_charge(1000.0)
			guard += 1
		log.append("   Super geladen nach %d x 1000 Schaden" % guard)
		var fi_before := p.form_index
		var super_ok := p.try_super(Vector3(0, 0, -1))
		ok = ok and super_ok
		await get_tree().create_timer(1.2).timeout
		log.append("   Form nach Super: %d" % (p.form_index + 1))
		if form_i < 3:
			ok = ok and p.form_index == fi_before + 1
		else:
			ok = ok and p.form_index == 3
	log.append("Gesamtschaden: %d, Wellen aktiv: %d" % [int(m.total_damage), m.waves.size()])
	for l in log:
		print(l)
	print("TEST " + ("BESTANDEN" if ok else "FEHLGESCHLAGEN"))
	get_tree().quit(0 if ok else 1)
