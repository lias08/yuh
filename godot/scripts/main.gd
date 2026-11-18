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
	e.ambient_light_energy = 0.35
	env.environment = e
	stage_viewport.add_child(env)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-40, 30, 0)
	light.light_energy = 0.8
	light.shadow_enabled = true
	stage_viewport.add_child(light)
	var cam := Camera3D.new()
	cam.fov = 32
	cam.position = Vector3(0, 1.9, 6.6)
	stage_viewport.add_child(cam)
	cam.look_at(Vector3(0, 1.05, 0))
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
	var skin_id: String = screen.get_meta("skin") if screen != null and screen.has_meta("skin") else "-"
	stage_rig = ModelBuilder.build(Game.look_for(b, i, skin_id))
	stage_rig.root.rotation.y = PI
	stage_model.add_child(stage_rig.root)

func _process(delta: float) -> void:
	_t += delta
	if stage_model and is_instance_valid(stage_model) and stage_rig.has("root") and is_instance_valid(stage_rig.root):
		stage_model.rotation.y = sin(_t * 0.6) * 0.6
		stage_rig.body.position.y = sin(_t * 2.6) * 0.03
		stage_rig.hand_r.position = Vector3(0.52, 0.66 + sin(_t * 2.6) * 0.03, -0.16)
		stage_rig.hand_l.position = Vector3(-0.52, 0.64 + sin(_t * 2.6 + 1.0) * 0.03, -0.08)
		stage_rig.weapon.rotation = Vector3(-0.4, 0, 0)
		ModelBuilder.update_limbs(stage_rig)

# ==================================================================== Hauptmenü
func show_menu() -> void:
	_clear()
	_top_bar("BRAWLARENA", false)
	var b := Game.selected_brawler()
	_stage(0, Vector2(0.5, 0.5), Vector2(-300, -300), Vector2(600, 560))
	var name_l := Game.make_label(b.name.to_upper() + "  •  " + b.rarity, 34, b.rarity_color, 10)
	_place(name_l, Vector2(0.5, 1), Vector2(-330, -100))

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
		var s := Game.make_label((("%d Formen" % b.forms.size()) if b.forms.size() > 1 else b.role) if unlocked else "GESPERRT\n(nur aus Boxen)", 22, Color.WHITE)
		s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vb.add_child(s)
		if Game.data.selected == b.id:
			var sel := Game.make_label("✔ AUSGEWÄHLT", 20, Color(0.5, 1, 0.5))
			sel.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			vb.add_child(sel)
		var id: String = b.id
		card.pressed.connect(func(): show_detail(id))
		grid.add_child(card)

func show_detail(id: String, preview_skin := "-") -> void:
	_clear()
	screen.set_meta("detail", id)
	screen.set_meta("skin", preview_skin)
	var b := Game.get_brawler(id)
	var unlocked := Game.is_unlocked(id)
	_top_bar(b.name.to_upper(), true)
	_stage(stage_form if stage_form < b.forms.size() else 0, Vector2(0, 0.5), Vector2(10, -280), Vector2(520, 520))

	var forms := HBoxContainer.new()
	forms.add_theme_constant_override("separation", 10)
	_place(forms, Vector2(0, 1), Vector2(30, -120))
	for i in (b.forms.size() if b.forms.size() > 1 else 0):
		var fb := Game.make_button("Form %d" % (i + 1), Color(1, 0.75, 0.2) if i == stage_form else Color(0.35, 0.35, 0.5), Vector2(118, 80), 22)
		var idx: int = i
		fb.pressed.connect(func():
			stage_form = idx
			show_detail(id, preview_skin))
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
	var dmg: float = Fighter.attack_damage(f)
	if f.has("combo"):
		vb.add_child(Game.make_label("Hiebe pro Munition: %d    Schaden pro Kombo: %d" % [f.combo.size(), int(dmg)], 20, Color.WHITE, 5))
	else:
		vb.add_child(Game.make_label("Schaden pro Angriff: %d    Reichweite: %.1f" % [int(dmg), f.attack.range], 20, Color.WHITE, 5))
	var sup := Game.make_label("SUPER – %s\n%s" % [f.super.name, f.super.desc], 20, Color(1, 0.9, 0.35), 5)
	sup.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	sup.custom_minimum_size = Vector2(640, 0)
	vb.add_child(sup)
	var evo_text := "Die Super lädt sich durch Schaden an Gegnern auf."
	if b.forms.size() > 1:
		evo_text += " Jede Super schaltet bis Matchende die nächste Form frei."
	var evo := Game.make_label(evo_text, 18, Color(0.8, 0.8, 0.9), 4)
	evo.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	evo.custom_minimum_size = Vector2(640, 0)
	vb.add_child(evo)

	_skin_row(vb, b, unlocked)

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

# ==================================================================== Skins (Detailseite)
func _skin_row(vb: VBoxContainer, b: Dictionary, unlocked: bool) -> void:
	var skins: Array = b.get("skins", [])
	if skins.is_empty():
		return
	vb.add_child(Game.make_label("SKINS", 28, Color(1, 0.6, 0.9), 8))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	vb.add_child(row)
	var preview: String = screen.get_meta("skin")
	var equipped: String = Game.data.equipped.get(b.id, "")
	var entries: Array = [{"id": "", "name": "Standard", "price": 0}]
	entries.append_array(skins)
	for sk in entries:
		var owned: bool = sk.id == "" or Game.owns_skin(sk.id)
		var is_eq: bool = sk.id == equipped
		var label: String = sk.name + "\n" + ("AUSGERÜSTET" if is_eq else ("Besitzt du" if owned else "%d Edelsteine" % sk.price))
		var col := Color(0.3, 0.75, 0.35) if is_eq else (Color(0.25, 0.55, 1.0) if owned else Color(0.75, 0.3, 0.8))
		if (preview == "-" and is_eq) or preview == sk.id:
			col = col.lightened(0.25)
		var btn := Game.make_button(label, col, Vector2(200, 90), 18)
		var sid: String = sk.id
		btn.pressed.connect(func():
			if owned and unlocked:
				Game.equip_skin(b, sid)
				show_detail(b.id, sid)
			elif owned:
				show_detail(b.id, sid)
			else:
				_confirm_skin(b, sid))
		row.add_child(btn)

func _confirm_skin(b: Dictionary, skin_id: String) -> void:
	show_detail(b.id, skin_id)  # Vorschau zeigen
	var sk := Game.get_skin(b, skin_id)
	_dialog("Skin kaufen?", "%s für %s\nPreis: %d Edelsteine" % [sk.name, b.name, sk.price], "Kaufen", func():
		var r := Game.buy_skin(b, skin_id)
		if r == "ok":
			Game.play_sfx("box", 0.8)
			show_detail(b.id, skin_id)
			_popup("Skin gekauft!", sk.name + " ist jetzt ausgerüstet.")
		else:
			_popup("Hoppla", r))

# ==================================================================== Shop
func show_shop() -> void:
	_clear()
	_top_bar("SHOP", true)
	var scroll := ScrollContainer.new()
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(1220, 560)
	_place(scroll, Vector2(0, 0), Vector2(30, 120))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 22)
	scroll.add_child(row)

	# Gratis-Box
	var free_ready := Game.free_box_ready()
	row.add_child(_box_card("GRATIS-BOX", "Alle 4 Stunden kostenlos!", Color(0.3, 0.75, 0.35),
		"ABHOLEN" if free_ready else "in " + Game.free_box_wait_text(), free_ready, func(): _buy_box("brawl", true)))
	for type in ["brawl", "big", "mega"]:
		var bx: Dictionary = Game.BOXES[type]
		var cur := "Münzen" if bx.currency == "coins" else "Edelsteine"
		var t: String = type
		row.add_child(_box_card(bx.name.to_upper(), "%d Belohnungen\nBrawler-Chance: %d%%" % [bx.rolls, int(bx.brawler * 100)], bx.color,
			"%d %s" % [bx.price, cur], Game.can_afford_box(type), func(): _buy_box(t, false)))
	# Skins aller freigeschalteten Brawler
	for b in Game.brawlers:
		if not Game.is_unlocked(b.id):
			continue
		for sk in b.get("skins", []):
			if Game.owns_skin(sk.id):
				continue
			var bb: Dictionary = b
			var sid: String = sk.id
			row.add_child(_box_card("SKIN", "%s\nfür %s" % [sk.name, b.name], Color(0.75, 0.3, 0.8),
				"%d Edelsteine" % sk.price, Game.data.gems >= sk.price, func():
					stage_form = 0
					_confirm_skin(bb, sid)))

func _box_card(title: String, desc: String, color: Color, price: String, enabled: bool, action: Callable) -> Control:
	var panel := Game.make_panel(color)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 14)
	vb.custom_minimum_size = Vector2(250, 470)
	panel.add_child(vb)
	var t := Game.make_label(title, 32, Color.WHITE, 10)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(t)
	var icon := _box_icon(color.lightened(0.15), 130)
	var holder := CenterContainer.new()
	holder.custom_minimum_size = Vector2(250, 150)
	holder.add_child(icon)
	vb.add_child(holder)
	var d := Game.make_label(desc, 20, Color.WHITE, 6)
	d.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	d.custom_minimum_size = Vector2(230, 0)
	vb.add_child(d)
	var buy := Game.make_button(price, Color(0.3, 0.8, 0.35) if enabled else Color(0.4, 0.4, 0.45), Vector2(230, 80), 24)
	buy.pressed.connect(func():
		if enabled:
			action.call()
		else:
			_popup("Nicht verfügbar", "Dafür fehlt dir noch Währung – oder die Gratis-Box ist noch nicht bereit."))
	vb.add_child(buy)
	return panel

## Gezeichnete Box (Korpus, Deckel, Schloss) als UI-Element.
func _box_icon(color: Color, size: float) -> Control:
	var root := Control.new()
	root.custom_minimum_size = Vector2(size, size)
	var body := Panel.new()
	body.add_theme_stylebox_override("panel", Game.style(color, 16, 6))
	body.position = Vector2(size * 0.08, size * 0.38)
	body.size = Vector2(size * 0.84, size * 0.58)
	root.add_child(body)
	var lid := Panel.new()
	lid.name = "Lid"
	lid.add_theme_stylebox_override("panel", Game.style(color.lightened(0.2), 14, 6))
	lid.position = Vector2(0, size * 0.18)
	lid.size = Vector2(size, size * 0.28)
	lid.pivot_offset = Vector2(size * 0.1, size * 0.28)
	root.add_child(lid)
	var lock := Panel.new()
	lock.add_theme_stylebox_override("panel", Game.style(Color(1, 0.85, 0.25), 8, 4))
	lock.position = Vector2(size * 0.4, size * 0.36)
	lock.size = Vector2(size * 0.2, size * 0.24)
	root.add_child(lock)
	return root

func _buy_box(type: String, free: bool) -> void:
	var rewards := Game.open_box(type, free)
	if rewards.is_empty():
		_popup("Nicht verfügbar", "Dafür fehlt dir noch Währung.")
		return
	var bx: Dictionary = Game.BOXES[type]
	_box_opening(("GRATIS-BOX" if free else bx.name.to_upper()), Color(0.3, 0.75, 0.35) if free else bx.color, rewards)

## Box-Öffnung: Box fällt herein, wackelt, springt auf (Lichtblitz) und zeigt die Belohnungen
## einzeln in der Bildschirmmitte. Antippen = weiter.
func _box_opening(title: String, color: Color, rewards: Array) -> void:
	var layer := CanvasLayer.new()
	layer.layer = 20
	add_child(layer)
	var dim := ColorRect.new()
	dim.color = Color(0.05, 0.03, 0.15, 0.92)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(center)
	var stage := Control.new()
	stage.custom_minimum_size = Vector2(600, 520)
	stage.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.add_child(stage)
	var t := Game.make_label(title, 46, Color.WHITE, 12)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	t.size = Vector2(600, 60)
	stage.add_child(t)
	var rays := Panel.new()
	var rs := StyleBoxFlat.new()
	rs.bg_color = Color(1, 0.9, 0.4, 0.0)
	rs.set_corner_radius_all(200)
	rays.add_theme_stylebox_override("panel", rs)
	rays.size = Vector2(400, 400)
	rays.position = Vector2(100, 90)
	rays.pivot_offset = Vector2(200, 200)
	stage.add_child(rays)
	var box := _box_icon(color, 240)
	box.position = Vector2(180, -400)
	box.pivot_offset = Vector2(120, 200)
	stage.add_child(box)
	var hint := Game.make_label("Tippe, um die Box zu öffnen!", 28, Color(1, 0.9, 0.4), 8)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.size = Vector2(600, 40)
	hint.position = Vector2(0, 470)
	stage.add_child(hint)
	Game.play_sfx("swoosh", 0.8, 0.6)
	var tw := box.create_tween()
	tw.tween_property(box, "position:y", 170.0, 0.45).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
	var state := {"phase": 0, "taps": 0, "index": 0, "card": null}

	var show_next := func(self_ref: Callable):
		if state.card != null:
			state.card.queue_free()
		if state.index >= rewards.size():
			_reward_summary(stage, rewards, layer)
			hint.text = ""
			return
		var r: Dictionary = rewards[state.index]
		state.index += 1
		var card := _reward_card(r)
		card.position = Vector2(110, 120)
		card.pivot_offset = Vector2(190, 140)
		card.scale = Vector2(0.1, 0.1)
		stage.add_child(card)
		state.card = card
		var ct := card.create_tween()
		ct.tween_property(card, "scale", Vector2(1.15, 1.15), 0.18).set_trans(Tween.TRANS_BACK)
		ct.tween_property(card, "scale", Vector2.ONE, 0.1)
		Game.play_sfx("ready" if r.kind in ["brawler", "skin"] else "click", 1.0, 1.0 if r.kind != "coins" else 1.4)
		hint.text = "Weiter (%d/%d)" % [state.index, rewards.size()]

	var tap := Button.new()
	tap.flat = true
	tap.set_anchors_preset(Control.PRESET_FULL_RECT)
	tap.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	layer.add_child(tap)
	tap.pressed.connect(func():
		if state.phase == 0:
			state.taps += 1
			Game.play_sfx("hit", 0.8, 0.8 + state.taps * 0.15)
			var sh := box.create_tween()
			var amp: float = 6.0 + state.taps * 6.0
			for i in 4:
				sh.tween_property(box, "rotation", deg_to_rad(amp if i % 2 == 0 else -amp), 0.05)
			sh.tween_property(box, "rotation", 0.0, 0.05)
			if state.taps >= 3:
				state.phase = 1
				# Aufspringen: Deckel fliegt weg, Lichtblitz, Strahlen
				var lid: Control = box.get_node("Lid")
				var ot := box.create_tween().set_parallel(true)
				ot.tween_property(lid, "position:y", -260.0, 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
				ot.tween_property(lid, "rotation", deg_to_rad(-70), 0.35)
				ot.tween_property(box, "modulate:a", 0.0, 0.45).set_delay(0.25)
				rs.bg_color = Color(1, 0.95, 0.6, 0.9)
				var rt := rays.create_tween().set_parallel(true)
				rt.tween_property(rays, "scale", Vector2(2.2, 2.2), 0.5)
				rt.tween_property(rays, "modulate:a", 0.0, 0.6)
				Game.play_sfx("box", 1.0)
				Game.play_sfx("explosion", 0.5, 1.6)
				get_tree().create_timer(0.45).timeout.connect(func(): show_next.call(show_next))
			else:
				hint.text = "Noch %d x tippen!" % (3 - state.taps)
		elif state.phase == 1 and state.index <= rewards.size() and state.card != null:
			show_next.call(show_next)
	)

func _reward_card(r: Dictionary) -> Control:
	var big: bool = r.kind in ["brawler", "skin"]
	var panel := Game.make_panel(r.color.darkened(0.45) if big else Color(0.18, 0.15, 0.38))
	panel.custom_minimum_size = Vector2(380, 280)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 12)
	panel.add_child(vb)
	if r.sub != "":
		var s := Game.make_label(r.sub, 22, Color(1, 0.9, 0.4), 6)
		s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vb.add_child(s)
	var icon := Panel.new()
	var st := StyleBoxFlat.new()
	st.bg_color = r.color
	st.set_corner_radius_all(60 if r.kind in ["coins", "gems"] else 18)
	st.set_border_width_all(6)
	st.border_color = Color(0.05, 0.03, 0.1)
	icon.add_theme_stylebox_override("panel", st)
	icon.custom_minimum_size = Vector2(110, 110)
	var ic := CenterContainer.new()
	ic.add_child(icon)
	vb.add_child(ic)
	var l := Game.make_label(r.text, 40 if big else 36, r.color, 10)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(l)
	return panel

func _reward_summary(stage: Control, rewards: Array, layer: CanvasLayer) -> void:
	stage.visible = false
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(center)
	var panel := Game.make_panel(Color(0.16, 0.13, 0.35))
	center.add_child(panel)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 10)
	panel.add_child(vb)
	var t := Game.make_label("BELOHNUNGEN", 34, Color(1, 0.85, 0.3), 10)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(t)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(560, min(380, 46 * rewards.size()))
	vb.add_child(scroll)
	var list := VBoxContainer.new()
	list.add_theme_constant_override("separation", 6)
	list.custom_minimum_size = Vector2(540, 0)
	scroll.add_child(list)
	for r in rewards:
		var txt: String = r.text if r.sub == "" else "★ %s  (%s)" % [r.text, r.sub.replace("NEUER BRAWLER! ", "Neuer Brawler ").replace("NEUER SKIN", "Neuer Skin")]
		var l := Game.make_label(txt, 22, r.color, 6)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size = Vector2(530, 0)
		list.add_child(l)
	var ok := Game.make_button("Super!", Color(0.3, 0.8, 0.35), Vector2(240, 80), 30)
	ok.pressed.connect(func():
		layer.queue_free()
		show_shop())
	vb.add_child(ok)
	# Der „Weiter“-Knopf über allem darf das OK nicht blockieren
	for c in layer.get_children():
		if c is Button:
			c.queue_free()

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

## Meldung immer in der Bildschirmmitte (eigene Ebene über allem).
func _popup(title: String, text: String) -> void:
	_dialog(title, text, "", Callable())

func _dialog(title: String, text: String, confirm_text: String, on_confirm: Callable) -> void:
	var layer := CanvasLayer.new()
	layer.layer = 30
	add_child(layer)
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(center)
	var panel := Game.make_panel(Color(0.18, 0.15, 0.38))
	center.add_child(panel)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 16)
	vb.custom_minimum_size = Vector2(560, 260)
	panel.add_child(vb)
	var t := Game.make_label(title, 38, Color(1, 0.85, 0.3), 10)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(t)
	var l := Game.make_label(text, 26, Color.WHITE, 6)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(520, 0)
	vb.add_child(l)
	var hb := HBoxContainer.new()
	hb.alignment = BoxContainer.ALIGNMENT_CENTER
	hb.add_theme_constant_override("separation", 20)
	vb.add_child(hb)
	if confirm_text != "":
		var no := Game.make_button("Abbrechen", Color(0.45, 0.45, 0.55), Vector2(220, 80), 26)
		no.pressed.connect(layer.queue_free)
		hb.add_child(no)
		var yes := Game.make_button(confirm_text, Color(0.3, 0.8, 0.35), Vector2(220, 80), 26)
		yes.pressed.connect(func():
			layer.queue_free()
			on_confirm.call())
		hb.add_child(yes)
	else:
		var ok := Game.make_button("OK", Color(0.3, 0.8, 0.35), Vector2(220, 80), 30)
		ok.pressed.connect(layer.queue_free)
		hb.add_child(ok)
	panel.scale = Vector2(0.6, 0.6)
	panel.pivot_offset = Vector2(300, 150)
	panel.create_tween().tween_property(panel, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

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
	var dmg := 0.0
	if current_match:
		dmg = current_match.total_damage
		current_match.queue_free()
		current_match = null
	show_menu()
	var coins := Game.award_training(dmg)
	_popup("Training beendet", "Verursachter Schaden: %d\nBelohnung: %d Münzen" % [int(dmg), coins])

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
	m.queue_free()
	# Alle weiteren Brawler: Angriff (1 Munition) und Super müssen Schaden machen
	for b in Game.brawlers:
		if b.id == "klingengeist":
			continue
		Game.data.selected = b.id
		var mm = preload("res://scripts/match.gd").new()
		add_child(mm)
		await get_tree().process_frame
		var pl: Fighter = mm.player
		pl.position = Vector3(0, 0, 2.2)
		var before: float = pl.ammo
		var atk_ok := pl.try_attack(mm.auto_aim(20.0))
		var used := before - pl.ammo
		await get_tree().create_timer(1.3).timeout
		var d1: float = mm.total_damage
		pl.super_charge = 1.0
		pl.position = Vector3(0, 0, 2.2)
		var sup_ok := pl.try_super(mm.auto_aim(20.0))
		await get_tree().create_timer(1.6).timeout
		var d2: float = mm.total_damage - d1
		var good: bool = atk_ok and is_equal_approx(used, 1.0) and d1 > 0.0 and sup_ok and d2 > 0.0
		log.append("%s: Angriff=%s Munition=%.2f Schaden=%d | Super=%s Schaden=%d -> %s" % [b.name, atk_ok, used, int(d1), sup_ok, int(d2), "OK" if good else "FEHLER"])
		ok = ok and good
		mm.queue_free()
	# Box & Skin
	Game.data.coins = 1000
	Game.data.gems = 500
	var rw := Game.open_box("mega")
	log.append("Mega-Box: %d Belohnungen" % rw.size())
	ok = ok and rw.size() > 0
	Game.data.selected = "klingengeist"
	for l in log:
		print(l)
	print("TEST " + ("BESTANDEN" if ok else "FEHLGESCHLAGEN"))
	get_tree().quit(0 if ok else 1)
