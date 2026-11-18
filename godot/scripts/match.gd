# Trainingsmatch: Arena, Licht, Kamera, Spieler, Trainingspuppen (stehend, laufend, schießend),
# Treffererkennung, Klingenwellen, Effekte und das komplette Touch-HUD.
extends Node3D

signal exit_requested

const ARENA_W := 20.0
const ARENA_H := 26.0

var player: Fighter
var dummies: Array = []
var waves: Array = []
var enemy_shots: Array = []
var walls: Array = []        # Rect2 in der XZ-Ebene
var fx: Array = []           # kurzlebige Effekt-Meshes {node, t, dur, kind, ...}
var cam: Camera3D
var _cam_focus := Vector3.ZERO
var _shake := 0.0
var total_damage := 0.0
var test_mode := false

# HUD
var hud: CanvasLayer
var hud_root: Control
var move_joy: JoyDraw
var atk_joy: JoyDraw
var sup_joy: JoyDraw
var touches := {}            # index -> {"zone": String, "start": Vector2, "pos": Vector2, "time": float}
var bars := {}               # Objekt -> Control
var form_label: Label
var banner: Label
var banner_t := 99.0
var info_label: Label
var evo_dots: Array = []
var aim_mesh: MeshInstance3D
var _sector_cache := {}
var _crescent: ArrayMesh
var _respawn_t := -1.0

class JoyDraw extends Control:
	var radius := 110.0
	var knob := Vector2.ZERO
	var color := Color(1, 1, 1, 0.25)
	var knob_color := Color(1, 1, 1, 0.8)
	var charge := -1.0
	var is_ready := false
	var dim := false
	func _draw() -> void:
		var c := size / 2.0
		if is_ready:
			draw_circle(c, radius * 1.25, Color(1, 0.9, 0.3, 0.25 + 0.15 * sin(Time.get_ticks_msec() / 150.0)))
		draw_circle(c, radius, color)
		draw_arc(c, radius, 0, TAU, 48, Color(1, 1, 1, 0.5), 4.0)
		if charge >= 0.0:
			draw_arc(c, radius + 9, -PI / 2, -PI / 2 + TAU * charge, 48, Color(1, 0.85, 0.2), 10.0)
		var kc := knob_color
		if dim:
			kc = kc.darkened(0.45)
		draw_circle(c + knob, radius * 0.5, kc)
		draw_arc(c + knob, radius * 0.5, 0, TAU, 32, Color(0.05, 0.03, 0.1), 4.0)

# ==================================================================== Aufbau
func _ready() -> void:
	_build_environment()
	_build_arena()
	player = Fighter.new()
	add_child(player)
	player.setup(Game.selected_brawler(), self)
	player.position = Vector3(0, 0, 8)
	player.transformed.connect(_on_transformed)
	_spawn_dummy(Vector3(-4, 0, -4), "static")
	_spawn_dummy(Vector3(0, 0, -6), "walker")
	_spawn_dummy(Vector3(4, 0, -4), "shooter")
	_spawn_dummy(Vector3(0, 0, -1), "static")
	aim_mesh = MeshInstance3D.new()
	aim_mesh.material_override = _fx_mat(Color(1, 1, 1, 0.3))
	aim_mesh.visible = false
	add_child(aim_mesh)
	_build_hud()
	_cam_focus = player.position
	_update_camera(1.0)

func _build_environment() -> void:
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color(0.45, 0.72, 1.0)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.75, 0.78, 0.95)
	e.ambient_light_energy = 0.55
	env.environment = e
	add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52, -35, 0)
	sun.light_energy = 1.15
	sun.light_color = Color(1, 0.96, 0.88)
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 40.0
	add_child(sun)
	cam = Camera3D.new()
	cam.fov = 40.0
	add_child(cam)
	cam.current = true

func _build_arena() -> void:
	# Boden mit Schachbrettmuster (Shader in Weltkoordinaten)
	var ground := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(ARENA_W, ARENA_H)
	ground.mesh = pm
	var sh := Shader.new()
	sh.code = """
shader_type spatial;
render_mode diffuse_toon;
uniform vec4 col_a : source_color = vec4(0.93, 0.80, 0.55, 1.0);
uniform vec4 col_b : source_color = vec4(0.88, 0.74, 0.49, 1.0);
varying vec3 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	vec2 g = wpos.xz;
	float c = mod(floor(g.x) + floor(g.y), 2.0);
	vec2 f = fract(g);
	float edge = 1.0 - smoothstep(0.0, 0.04, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
	ALBEDO = mix(col_a.rgb, col_b.rgb, c) * (1.0 - edge * 0.12);
}
"""
	var sm := ShaderMaterial.new()
	sm.shader = sh
	ground.material_override = sm
	add_child(ground)
	var outer := MeshInstance3D.new()
	var om := PlaneMesh.new()
	om.size = Vector2(80, 80)
	outer.mesh = om
	outer.position.y = -0.02
	outer.material_override = ModelBuilder.mat(Color(0.55, 0.75, 0.4), false)
	add_child(outer)

	# Randmauern + Deckung
	var wall_col := Color(0.78, 0.48, 0.32)
	var top_col := Color(0.95, 0.65, 0.42)
	var hw := ARENA_W / 2.0
	var hh := ARENA_H / 2.0
	_add_wall(Rect2(-hw - 1, -hh - 1, ARENA_W + 2, 1), wall_col, top_col)
	_add_wall(Rect2(-hw - 1, hh, ARENA_W + 2, 1), wall_col, top_col)
	_add_wall(Rect2(-hw - 1, -hh, 1, ARENA_H), wall_col, top_col)
	_add_wall(Rect2(hw, -hh, 1, ARENA_H), wall_col, top_col)
	_add_wall(Rect2(-7, 2, 3, 1), wall_col, top_col)
	_add_wall(Rect2(4, 2, 3, 1), wall_col, top_col)
	_add_wall(Rect2(-1.5, -9, 3, 1), wall_col, top_col)
	_add_wall(Rect2(-8, -9, 1, 3), wall_col, top_col)
	_add_wall(Rect2(7, -9, 1, 3), wall_col, top_col)
	# Büsche & Deko (nur Optik)
	for p in [Vector3(-7, 0, 7), Vector3(7, 0, 7), Vector3(-6, 0, -1), Vector3(6, 0, -1)]:
		for i in 4:
			ModelBuilder.part(self, "sphere", p + Vector3((i % 2) * 0.7 - 0.35, 0.45 + (i / 2) * 0.15, (i / 2) * 0.7 - 0.35), Vector3.ONE * 0.85, Color(0.3, 0.68, 0.3))
	for i in 26:
		var a := i / 26.0 * TAU
		var r := randf_range(16.5, 22.0)
		var tp := Vector3(cos(a) * r, 0, sin(a) * r * 1.2)
		ModelBuilder.part(self, "cyl", tp + Vector3(0, 0.6, 0), Vector3(0.3, 1.2, 0.3), Color(0.5, 0.33, 0.2))
		ModelBuilder.part(self, "sphere", tp + Vector3(0, 1.7, 0), Vector3.ONE * randf_range(1.3, 1.8), Color(0.28, 0.62, 0.32))

func _add_wall(r: Rect2, side: Color, top: Color) -> void:
	walls.append(r)
	var c := Vector3(r.position.x + r.size.x / 2.0, 0, r.position.y + r.size.y / 2.0)
	ModelBuilder.part(self, "box", c + Vector3(0, 0.6, 0), Vector3(r.size.x, 1.2, r.size.y), side)
	ModelBuilder.part(self, "box", c + Vector3(0, 1.24, 0), Vector3(r.size.x + 0.06, 0.14, r.size.y + 0.06), top, Vector3.ZERO, false)

func _spawn_dummy(pos: Vector3, kind: String) -> void:
	var color := Color(1, 0.3, 0.3) if kind != "shooter" else Color(0.3, 0.5, 1.0)
	if kind == "walker":
		color = Color(1, 0.75, 0.2)
	var rig := ModelBuilder.build_dummy(color)
	rig.root.position = pos
	add_child(rig.root)
	var d := {"rig": rig, "node": rig.root, "pos": pos, "home": pos, "kind": kind, "hp": 40000.0, "max": 40000.0,
		"last_hit": -99.0, "dir": 1.0, "shoot_t": 2.0, "radius": 0.5, "shake": 0.0,
		"name": {"static": "Puppe", "walker": "Läufer-Puppe", "shooter": "Schützen-Puppe"}[kind]}
	dummies.append(d)

# ==================================================================== Kollision
func move_circle(p: Vector3, delta: Vector3, r: float) -> Vector3:
	var steps: int = max(1, int(ceil(delta.length() / (r * 0.5))))
	var step := delta / steps
	for i in steps:
		p += step
		p = resolve_circle(p, r)
	return p

func resolve_circle(p: Vector3, r: float) -> Vector3:
	for it in 3:
		var moved := false
		for w in walls:
			var nx: float = clamp(p.x, w.position.x, w.position.x + w.size.x)
			var nz: float = clamp(p.z, w.position.y, w.position.y + w.size.y)
			var dx := p.x - nx
			var dz := p.z - nz
			var d2 := dx * dx + dz * dz
			if d2 >= r * r:
				continue
			var d := sqrt(d2)
			if d < 0.0001:
				var cx: float = w.position.x + w.size.x / 2.0
				var cz: float = w.position.y + w.size.y / 2.0
				if abs(p.x - cx) / w.size.x > abs(p.z - cz) / w.size.y:
					p.x = (w.position.x - r) if p.x < cx else (w.position.x + w.size.x + r)
				else:
					p.z = (w.position.y - r) if p.z < cz else (w.position.y + w.size.y + r)
			else:
				p.x += dx / d * (r - d)
				p.z += dz / d * (r - d)
			moved = true
		if not moved:
			break
	return p

func blocked(p: Vector3) -> bool:
	for w in walls:
		if w.has_point(Vector2(p.x, p.z)):
			return true
	return false

# ==================================================================== Kampf
## Ein einzelner Schwerthieb: trifft jedes Ziel im Bogen GENAU einmal.
func melee_swing(f: Fighter, step: Dictionary) -> void:
	var origin := f.position
	var hits := 0
	for d in dummies:
		var to: Vector3 = d.pos - origin
		to.y = 0
		var dist := to.length()
		if dist > step.range + d.radius:
			continue
		if dist > 0.3 and rad_to_deg(f.aim_dir.angle_to(to)) > step.arc * 0.5 + 10.0:
			continue
		_damage_dummy(d, step.dmg, f)
		hits += 1
	_slash_fx(origin, f.aim_dir, step.range, step.arc, step.color, step.dir)
	Game.play_sfx("swoosh", 0.7, 1.1 if step.dir == "rtl" else 1.0)
	if hits > 0:
		Game.play_sfx("hit", 0.6)

## Klingenwelle (aus Kombo oder Super).
func spawn_wave(f: Fighter, w: Dictionary, is_super: bool) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = _crescent_mesh()
	mi.material_override = _fx_mat(Color(w.color.r, w.color.g, w.color.b, 0.85))
	var width: float = w.width
	mi.scale = Vector3(width * 1.6, 1.0, width * 1.0)
	mi.position = f.position + Vector3(0, 0.65, 0) + f.aim_dir * 0.6
	mi.rotation.y = atan2(-f.aim_dir.x, -f.aim_dir.z)
	add_child(mi)
	waves.append({"node": mi, "dir": f.aim_dir, "speed": w.speed, "range": w.range, "travel": 0.0, "dmg": w.dmg,
		"width": width, "hit": [], "pierce": w.get("pierce", true), "explode": w.get("explode", 0.0), "color": w.color, "owner": f})
	Game.play_sfx("wave", 0.8 if is_super else 0.5, 1.0 if is_super else 1.3)
	if is_super:
		_shake = max(_shake, 0.25)
		_burst(mi.position, w.color, 24, 5.0, 0.18)

func charge_effect(f: Fighter, sup: Dictionary) -> void:
	Game.play_sfx("charge", 1.0)
	var steps := 6
	for i in steps:
		get_tree().create_timer(sup.charge * i / float(steps), false).timeout.connect(func():
			_ring_fx(f.position, 2.6 - i * 0.3, sup.color, 0.25)
			_burst(f.position + Vector3(0, 1.0, 0), sup.color, 10, -3.0, 0.15))
	_shake = 0.2

func _damage_dummy(d: Dictionary, amount: float, f: Fighter) -> void:
	d.hp -= amount
	d.last_hit = Time.get_ticks_msec() / 1000.0
	d.shake = 0.2
	total_damage += amount
	if f != null:
		f.damage_dealt += amount
		f.add_charge(amount)
	_damage_number(d.pos + Vector3(0, 2.0, 0), amount, Color.WHITE)
	_burst(d.pos + Vector3(0, 0.9, 0), Color(1, 0.95, 0.7), 8, 4.0, 0.1)
	if d.hp <= 0.0:
		d.hp = d.max
		_burst(d.pos + Vector3(0, 0.9, 0), Color(1, 0.8, 0.3), 30, 6.0, 0.18)

func _explode(pos: Vector3, radius: float, dmg: float, color: Color, f: Fighter) -> void:
	for d in dummies:
		var to: Vector3 = d.pos - pos
		to.y = 0
		if to.length() <= radius + d.radius:
			_damage_dummy(d, dmg * 0.5, f)
	_burst(pos + Vector3(0, 0.6, 0), color, 60, 9.0, 0.3)
	_burst(pos + Vector3(0, 0.6, 0), Color.WHITE, 30, 5.0, 0.25)
	_ring_fx(pos, radius, color, 0.45)
	_ring_fx(pos, radius * 0.6, Color.WHITE, 0.3)
	_shake = 0.6
	Game.play_sfx("explosion", 1.0)

# ==================================================================== Update
func _process(delta: float) -> void:
	var input := _joy_vector()
	var kb := Vector2(
		float(Input.is_key_pressed(KEY_D)) - float(Input.is_key_pressed(KEY_A)),
		float(Input.is_key_pressed(KEY_S)) - float(Input.is_key_pressed(KEY_W)))
	if kb.length() > 0.0:
		input = kb.normalized()
	if player.alive:
		player.update_movement(input, delta)
	else:
		_respawn_t -= delta
		if _respawn_t <= 0.0:
			player.respawn(Vector3(0, 0, 8))
	_update_dummies(delta)
	_update_waves(delta)
	_update_enemy_shots(delta)
	_update_fx(delta)
	_update_aim()
	_update_camera(delta)
	_update_hud(delta)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_SPACE:
			player.try_attack(auto_aim(player.def.forms[player.form_index].combo[0].range + 3.0))
		elif event.keycode == KEY_E:
			player.try_super(auto_aim(12.0))
		elif event.keycode == KEY_ESCAPE:
			emit_signal("exit_requested")

func auto_aim(max_range: float) -> Vector3:
	var best = null
	var bd := max_range
	for d in dummies:
		var dist: float = (d.pos - player.position).length()
		if dist < bd:
			bd = dist
			best = d
	if best == null:
		return player.aim_dir
	var v: Vector3 = best.pos - player.position
	v.y = 0
	return v.normalized()

func _update_dummies(delta: float) -> void:
	var now := Time.get_ticks_msec() / 1000.0
	for d in dummies:
		if d.kind == "walker":
			d.pos.x += d.dir * 1.6 * delta
			if d.pos.x > d.home.x + 3.0:
				d.dir = -1.0
			elif d.pos.x < d.home.x - 3.0:
				d.dir = 1.0
		elif d.kind == "shooter" and player.alive:
			d.shoot_t -= delta
			var to: Vector3 = player.position - d.pos
			to.y = 0
			d.node.rotation.y = atan2(-to.x, -to.z)
			if d.shoot_t <= 0.0 and to.length() < 9.0:
				d.shoot_t = 2.4
				_spawn_enemy_shot(d.pos + Vector3(0, 0.9, 0), to.normalized())
		if d.hp < d.max and now - d.last_hit > 2.5:
			d.hp = d.max
		d.shake = max(0.0, d.shake - delta)
		d.node.position = d.pos + Vector3(randf_range(-1, 1), 0, randf_range(-1, 1)) * d.shake * 0.25
		d.rig.body.rotation.z = sin(now * 30.0) * d.shake * 0.6

func _update_waves(delta: float) -> void:
	for i in range(waves.size() - 1, -1, -1):
		var w: Dictionary = waves[i]
		var node: MeshInstance3D = w.node
		var step: float = w.speed * delta
		var nxt: Vector3 = node.position + w.dir * step
		var done := false
		if blocked(nxt):
			done = true
			if w.explode > 0.0:
				_explode(node.position, w.explode, w.dmg, w.color, w.owner)
		else:
			for d in dummies:
				if d in w.hit:
					continue
				var to: Vector3 = d.pos - nxt
				to.y = 0
				if to.length() <= w.width + d.radius:
					w.hit.append(d)
					_damage_dummy(d, w.dmg, w.owner)
					if not w.pierce:
						done = true
						if w.explode > 0.0:
							_explode(d.pos, w.explode, w.dmg, w.color, w.owner)
						break
		node.position = nxt
		w.travel += step
		if not done and w.travel >= w.range:
			done = true
			if w.explode > 0.0:
				_explode(nxt, w.explode, w.dmg, w.color, w.owner)
		var fade: float = clamp((w.range - w.travel) / 2.0, 0.2, 1.0)
		(node.material_override as StandardMaterial3D).albedo_color.a = 0.85 * fade
		if randf() < 0.6:
			_burst(node.position, w.color, 2, 1.0, 0.12)
		if done:
			node.queue_free()
			waves.remove_at(i)

func _spawn_enemy_shot(pos: Vector3, dir: Vector3) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = ModelBuilder.mesh("sphere")
	mi.material_override = _fx_mat(Color(0.4, 0.6, 1.0, 0.95))
	mi.scale = Vector3.ONE * 0.4
	mi.position = pos
	add_child(mi)
	enemy_shots.append({"node": mi, "dir": dir, "travel": 0.0})
	Game.play_sfx("shot", 0.4)

func _update_enemy_shots(delta: float) -> void:
	for i in range(enemy_shots.size() - 1, -1, -1):
		var s: Dictionary = enemy_shots[i]
		var node: MeshInstance3D = s.node
		node.position += s.dir * 8.0 * delta
		s.travel += 8.0 * delta
		var done: bool = s.travel > 9.0 or blocked(node.position)
		if not done and player.alive:
			var to := player.position - node.position
			to.y = 0
			if to.length() < player.radius + 0.25:
				player.take_damage(300.0)
				_damage_number(player.position + Vector3(0, 2.1, 0), 300, Color(1, 0.4, 0.4))
				Game.play_sfx("hurt", 0.6)
				done = true
				if not player.alive:
					_respawn_t = 2.0
					_burst(player.position + Vector3(0, 0.8, 0), Color.WHITE, 30, 5.0, 0.2)
		if done:
			node.queue_free()
			enemy_shots.remove_at(i)

func _update_camera(delta: float) -> void:
	var target := player.position
	target.x = clamp(target.x, -3.0, 3.0)
	target.z = clamp(target.z, -9.0, 9.0)
	_cam_focus = _cam_focus.lerp(target, 1.0 - exp(-delta * 6.0))
	_shake = max(0.0, _shake - delta * 1.5)
	var shake := Vector3(randf_range(-1, 1), randf_range(-1, 1), 0) * _shake * 0.3
	cam.position = _cam_focus + Vector3(0, 13.0, 9.0) + shake
	cam.look_at(_cam_focus + Vector3(0, 0, -1.2), Vector3.UP)

# ==================================================================== Effekte
func _fx_mat(c: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.albedo_color = c
	m.no_depth_test = false
	return m

## Kreissektor am Boden (Schwerthieb / Zielanzeige), Spitze im Ursprung, Richtung -Z.
func _sector_mesh(radius: float, arc: float, inner := 0.0) -> ArrayMesh:
	var key := "%.2f|%.0f|%.2f" % [radius, arc, inner]
	if _sector_cache.has(key):
		return _sector_cache[key]
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var seg := 24
	var half := deg_to_rad(arc) / 2.0
	for i in seg:
		var a0: float = lerp(-half, half, float(i) / seg)
		var a1: float = lerp(-half, half, float(i + 1) / seg)
		var o0 := Vector3(sin(a0), 0, -cos(a0))
		var o1 := Vector3(sin(a1), 0, -cos(a1))
		st.add_vertex(o0 * inner); st.add_vertex(o0 * radius); st.add_vertex(o1 * radius)
		st.add_vertex(o0 * inner); st.add_vertex(o1 * radius); st.add_vertex(o1 * inner)
	var m := st.commit()
	_sector_cache[key] = m
	return m

## Sichelförmige Klingenwelle (Breite 1, nach -Z gewölbt).
func _crescent_mesh() -> ArrayMesh:
	if _crescent != null:
		return _crescent
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var seg := 20
	for i in seg:
		var a0: float = lerp(-1.2, 1.2, float(i) / seg)
		var a1: float = lerp(-1.2, 1.2, float(i + 1) / seg)
		var th0 := 0.35 * cos(a0 * 1.2)
		var th1 := 0.35 * cos(a1 * 1.2)
		var p0 := Vector3(sin(a0), 0, -cos(a0) + 0.6)
		var p1 := Vector3(sin(a1), 0, -cos(a1) + 0.6)
		var q0 := p0 + Vector3(0, 0, th0)
		var q1 := p1 + Vector3(0, 0, th1)
		for yy in [-0.25, 0.25]:
			var o := Vector3(0, yy, 0)
			st.add_vertex(p0 + o); st.add_vertex(p1 + o); st.add_vertex(q1 + o)
			st.add_vertex(p0 + o); st.add_vertex(q1 + o); st.add_vertex(q0 + o)
		st.add_vertex(p0 + Vector3(0, -0.25, 0)); st.add_vertex(p0 + Vector3(0, 0.25, 0)); st.add_vertex(p1 + Vector3(0, 0.25, 0))
		st.add_vertex(p0 + Vector3(0, -0.25, 0)); st.add_vertex(p1 + Vector3(0, 0.25, 0)); st.add_vertex(p1 + Vector3(0, -0.25, 0))
	_crescent = st.commit()
	return _crescent

func _slash_fx(origin: Vector3, dir: Vector3, radius: float, arc: float, color: Color, swing: String) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = _sector_mesh(radius, min(arc, 359.0), radius * 0.55)
	mi.material_override = _fx_mat(Color(color.r, color.g, color.b, 0.7))
	mi.position = origin + Vector3(0, 0.6, 0)
	mi.rotation.y = atan2(-dir.x, -dir.z)
	add_child(mi)
	fx.append({"node": mi, "t": 0.0, "dur": 0.22, "kind": "slash", "spin": (0.35 if swing == "ltr" else -0.35) if swing != "over" else 0.0, "base_yaw": mi.rotation.y})
	_burst(origin + Vector3(0, 0.7, 0) + dir * radius * 0.8, color, 8, 3.0, 0.1)

func _ring_fx(pos: Vector3, radius: float, color: Color, dur: float) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = _sector_mesh(1.0, 359.9, 0.85)
	mi.material_override = _fx_mat(Color(color.r, color.g, color.b, 0.8))
	mi.position = pos + Vector3(0, 0.08, 0)
	add_child(mi)
	fx.append({"node": mi, "t": 0.0, "dur": dur, "kind": "ring", "radius": radius})

func aura_particle(pos: Vector3, color: Color) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = ModelBuilder.mesh("sphere")
	mi.material_override = _fx_mat(Color(color.r, color.g, color.b, color.a))
	mi.scale = Vector3.ONE * 0.14
	mi.position = pos
	add_child(mi)
	fx.append({"node": mi, "t": 0.0, "dur": 0.5, "kind": "rise"})

func _burst(pos: Vector3, color: Color, amount: int, speed: float, size: float) -> void:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.explosiveness = 1.0
	p.amount = max(1, amount)
	p.lifetime = 0.5
	var sm := SphereMesh.new()
	sm.radius = size
	sm.height = size * 2.0
	sm.radial_segments = 6
	sm.rings = 3
	p.mesh = sm
	p.material_override = _fx_mat(Color(color.r, color.g, color.b, 0.9))
	p.direction = Vector3.UP
	p.spread = 180.0
	p.initial_velocity_min = abs(speed) * 0.5
	p.initial_velocity_max = abs(speed)
	p.gravity = Vector3(0, -6.0 if speed > 0 else 2.0, 0)
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.2
	var curve := Curve.new()
	curve.add_point(Vector2(0, 1))
	curve.add_point(Vector2(1, 0))
	p.scale_amount_curve = curve
	p.position = pos
	add_child(p)
	p.emitting = true
	fx.append({"node": p, "t": 0.0, "dur": 0.8, "kind": "particles"})

func _update_fx(delta: float) -> void:
	for i in range(fx.size() - 1, -1, -1):
		var f: Dictionary = fx[i]
		f.t += delta
		var k: float = clamp(f.t / f.dur, 0.0, 1.0)
		var node: Node3D = f.node
		match f.kind:
			"slash":
				node.rotation.y = f.base_yaw + f.spin * (k - 0.5) * 2.0
				(node.material_override as StandardMaterial3D).albedo_color.a = 0.7 * (1.0 - k)
			"ring":
				node.scale = Vector3.ONE * lerp(0.2, f.radius, 1.0 - (1.0 - k) * (1.0 - k))
				(node.material_override as StandardMaterial3D).albedo_color.a = 0.8 * (1.0 - k)
			"rise":
				node.position.y += delta * 1.2
				(node.material_override as StandardMaterial3D).albedo_color.a *= 0.93
		if k >= 1.0:
			node.queue_free()
			fx.remove_at(i)

func _on_transformed(index: int) -> void:
	var f: Dictionary = player.def.forms[index]
	var c: Color = f.aura if f.aura.a > 0.0 else Color.WHITE
	c.a = 1.0
	_burst(player.position + Vector3(0, 1.0, 0), c, 60, 8.0, 0.2)
	_burst(player.position + Vector3(0, 1.0, 0), Color.WHITE, 30, 4.0, 0.15)
	_ring_fx(player.position, 3.0, c, 0.5)
	_ring_fx(player.position, 1.8, Color.WHITE, 0.35)
	_shake = 0.5
	Game.play_sfx("transform", 1.0)
	show_banner(f.name.to_upper())

# ==================================================================== Zielanzeige
func _update_aim() -> void:
	var t = _touch_in("attack")
	var is_super := false
	if t == null:
		t = _touch_in("super")
		is_super = true
	if t == null or not player.alive:
		aim_mesh.visible = false
		return
	var v: Vector2 = t.pos - t.start
	if v.length() < 25.0:
		aim_mesh.visible = false
		return
	var dir := Vector3(v.x, 0, v.y).normalized()
	var form: Dictionary = player.form()
	aim_mesh.visible = true
	aim_mesh.position = player.position + Vector3(0, 0.05, 0)
	aim_mesh.rotation.y = atan2(-dir.x, -dir.z)
	if is_super:
		var sup: Dictionary = form.super
		aim_mesh.mesh = _sector_mesh(sup.range, 8.0 + sup.width * 6.0)
		(aim_mesh.material_override as StandardMaterial3D).albedo_color = Color(1, 0.85, 0.2, 0.35)
	else:
		var st: Dictionary = form.combo[0]
		aim_mesh.mesh = _sector_mesh(st.range, st.arc)
		(aim_mesh.material_override as StandardMaterial3D).albedo_color = Color(1, 1, 1, 0.3)

# ==================================================================== HUD & Touch
func _build_hud() -> void:
	hud = CanvasLayer.new()
	add_child(hud)
	hud_root = Control.new()
	hud_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	hud_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(hud_root)

	move_joy = JoyDraw.new()
	move_joy.radius = 95
	move_joy.size = Vector2(240, 240)
	move_joy.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(move_joy)
	atk_joy = JoyDraw.new()
	atk_joy.radius = 100
	atk_joy.color = Color(1, 0.5, 0.25, 0.35)
	atk_joy.knob_color = Color(1, 0.55, 0.3)
	atk_joy.size = Vector2(260, 260)
	atk_joy.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(atk_joy)
	sup_joy = JoyDraw.new()
	sup_joy.radius = 72
	sup_joy.color = Color(0.3, 0.3, 0.35, 0.5)
	sup_joy.knob_color = Color(1, 0.85, 0.2)
	sup_joy.size = Vector2(200, 200)
	sup_joy.charge = 0.0
	sup_joy.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(sup_joy)

	var top := Game.make_panel(Color(0.12, 0.1, 0.25, 0.85))
	top.position = Vector2(0, 0)
	top.set_anchors_preset(Control.PRESET_CENTER_TOP)
	hud_root.add_child(top)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	top.add_child(vb)
	var title := Game.make_label("TRAINING", 30, Color(1, 0.85, 0.2))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(title)
	form_label = Game.make_label("", 22)
	form_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(form_label)
	var dots := HBoxContainer.new()
	dots.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_child(dots)
	for i in player.def.forms.size():
		var p := Panel.new()
		p.custom_minimum_size = Vector2(26, 26)
		dots.add_child(p)
		evo_dots.append(p)

	info_label = Game.make_label("", 20, Color(1, 1, 1, 0.9), 6)
	info_label.position = Vector2(20, 110)
	hud_root.add_child(info_label)

	var exit := Game.make_button("Verlassen", Color(0.85, 0.25, 0.3), Vector2(200, 70), 24)
	exit.position = Vector2(16, 16)
	exit.pressed.connect(func(): emit_signal("exit_requested"))
	hud_root.add_child(exit)

	banner = Game.make_label("", 64, Color(1, 0.9, 0.4), 14)
	banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner.set_anchors_preset(Control.PRESET_CENTER)
	banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(banner)
	_layout_hud()
	get_viewport().size_changed.connect(_layout_hud)

func _layout_hud() -> void:
	var s := get_viewport().get_visible_rect().size
	move_joy.position = Vector2(170, s.y - 170) - move_joy.size / 2.0
	atk_joy.position = Vector2(s.x - 170, s.y - 170) - atk_joy.size / 2.0
	sup_joy.position = Vector2(s.x - 400, s.y - 110) - sup_joy.size / 2.0

func _zone_at(p: Vector2) -> String:
	var s := get_viewport().get_visible_rect().size
	if p.distance_to(atk_joy.position + atk_joy.size / 2.0) < atk_joy.radius * 1.4:
		return "attack"
	if p.distance_to(sup_joy.position + sup_joy.size / 2.0) < sup_joy.radius * 1.5:
		return "super"
	if p.x < s.x * 0.45 and p.y > s.y * 0.2:
		return "move"
	return ""

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			var zone := _zone_at(event.position)
			if zone != "" and _touch_in(zone) == null:
				touches[event.index] = {"zone": zone, "start": event.position, "pos": event.position, "time": Time.get_ticks_msec() / 1000.0}
				if zone == "move" and Game.data.get("floating_joy", true):
					move_joy.position = event.position - move_joy.size / 2.0
		elif touches.has(event.index):
			var t: Dictionary = touches[event.index]
			touches.erase(event.index)
			_release(t)
	elif event is InputEventScreenDrag and touches.has(event.index):
		touches[event.index].pos = event.position

func _touch_in(zone: String):
	for k in touches:
		if touches[k].zone == zone:
			return touches[k]
	return null

func _release(t: Dictionary) -> void:
	var v: Vector2 = t.pos - t.start
	var tap := v.length() < 25.0
	match t.zone:
		"move":
			_layout_hud()
		"attack":
			var r: float = player.form().combo[0].range + 3.0
			player.try_attack(auto_aim(r) if tap else Vector3(v.x, 0, v.y).normalized())
		"super":
			player.try_super(auto_aim(14.0) if tap else Vector3(v.x, 0, v.y).normalized())

func _joy_vector() -> Vector2:
	var t = _touch_in("move")
	if t == null:
		return Vector2.ZERO
	var v: Vector2 = (t.pos - t.start) / move_joy.radius
	return v.limit_length(1.0)

func _knob(t, joy: JoyDraw) -> Vector2:
	if t == null:
		return Vector2.ZERO
	return (t.pos - t.start).limit_length(joy.radius * 0.8)

func _update_hud(delta: float) -> void:
	move_joy.knob = _knob(_touch_in("move"), move_joy)
	atk_joy.knob = _knob(_touch_in("attack"), atk_joy)
	sup_joy.knob = _knob(_touch_in("super"), sup_joy)
	atk_joy.dim = player.ammo < 1.0
	sup_joy.charge = player.super_charge
	sup_joy.is_ready = player.super_charge >= 1.0
	sup_joy.dim = player.super_charge < 1.0
	for j in [move_joy, atk_joy, sup_joy]:
		j.queue_redraw()
	var f: Dictionary = player.form()
	form_label.text = f.name + "   •   " + f.combo_name
	for i in evo_dots.size():
		var st := StyleBoxFlat.new()
		st.set_corner_radius_all(13)
		st.bg_color = (Color(1, 0.85, 0.2) if i <= player.form_index else Color(0.3, 0.3, 0.38))
		st.set_border_width_all(3)
		st.border_color = Color(0.05, 0.03, 0.1)
		evo_dots[i].add_theme_stylebox_override("panel", st)
	info_label.text = "Kombo: %d Hieb(e) pro Munition\nSchaden gesamt: %d\nSuper: %d%%" % [f.combo.size(), int(total_damage), int(player.super_charge * 100)]
	banner_t += delta
	banner.modulate.a = clamp(1.6 - banner_t, 0.0, 1.0)
	banner.scale = Vector2.ONE * lerp(1.5, 1.0, clamp(banner_t / 0.2, 0.0, 1.0))
	banner.pivot_offset = banner.size / 2.0
	_update_bars()

func show_banner(text: String) -> void:
	banner.text = text
	banner_t = 0.0

func _update_bars() -> void:
	var list: Array = [player]
	list.append_array(dummies)
	for o in list:
		var is_player := o is Fighter
		var bar: Control
		if not bars.has(o):
			bar = _make_bar(is_player, o.name if not is_player else Game.data.get("player_name", "Du"))
			bars[o] = bar
		bar = bars[o]
		var wpos: Vector3 = (o.position if is_player else o.pos) + Vector3(0, 2.15, 0)
		var visible_bar: bool = (o.alive if is_player else true) and not cam.is_position_behind(wpos)
		bar.visible = visible_bar
		if not visible_bar:
			continue
		bar.position = cam.unproject_position(wpos) - Vector2(80, 30)
		var hp: float = o.hp
		var mx: float = o.max_hp if is_player else o.max
		var fill: ColorRect = bar.get_node("Fill")
		fill.size.x = 152.0 * clamp(hp / mx, 0.0, 1.0)
		(bar.get_node("HP") as Label).text = str(int(hp))
		if is_player:
			for i in 3:
				var a: ColorRect = bar.get_node("Ammo%d" % i)
				var amt: float = clamp(player.ammo - i, 0.0, 1.0)
				a.size.x = 48.0 * amt
				a.color = Color(1, 0.6, 0.2) if amt >= 1.0 else Color(1, 0.6, 0.2, 0.55)

func _make_bar(is_player: bool, title: String) -> Control:
	var c := Control.new()
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(c)
	hud_root.move_child(c, 0)
	var name_l := Game.make_label(title, 18, Color(0.4, 1, 0.45) if is_player else Color(1, 0.45, 0.45), 6)
	name_l.position = Vector2(0, -26)
	name_l.size = Vector2(160, 24)
	name_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	c.add_child(name_l)
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.03, 0.1, 0.9)
	bg.size = Vector2(160, 26)
	c.add_child(bg)
	var fill := ColorRect.new()
	fill.name = "Fill"
	fill.color = Color(0.4, 1, 0.45) if is_player else Color(1, 0.35, 0.35)
	fill.position = Vector2(4, 4)
	fill.size = Vector2(152, 18)
	c.add_child(fill)
	var hp := Game.make_label("", 16, Color.WHITE, 5)
	hp.name = "HP"
	hp.size = Vector2(160, 26)
	hp.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	c.add_child(hp)
	if is_player:
		for i in 3:
			var ab := ColorRect.new()
			ab.color = Color(0.05, 0.03, 0.1, 0.9)
			ab.position = Vector2(i * 54, 30)
			ab.size = Vector2(52, 12)
			c.add_child(ab)
			var a := ColorRect.new()
			a.name = "Ammo%d" % i
			a.position = Vector2(i * 54 + 2, 32)
			a.size = Vector2(48, 8)
			c.add_child(a)
	return c

func _damage_number(wpos: Vector3, amount: float, color: Color) -> void:
	var l := Game.make_label(str(int(amount)), 30, color, 8)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(l)
	l.position = cam.unproject_position(wpos) - Vector2(30, 20) + Vector2(randf_range(-20, 20), 0)
	var tw := l.create_tween()
	tw.set_parallel(true)
	tw.tween_property(l, "position:y", l.position.y - 60, 0.8)
	tw.tween_property(l, "modulate:a", 0.0, 0.8).set_delay(0.3)
	tw.chain().tween_callback(l.queue_free)
