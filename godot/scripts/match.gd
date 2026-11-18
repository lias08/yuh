# Trainingsmatch: Arena, Licht, Kamera, Spieler, Trainingspuppen (stehend, laufend, schießend),
# Treffererkennung, Klingenwellen, Effekte und das komplette Touch-HUD.
extends Node3D

signal exit_requested

const ARENA_W := 20.0
const ARENA_H := 26.0

var _static: Node3D
var player: Fighter
var dummies: Array = []
var fighters: Array = []      # alle Brawler (Spieler + Bots)
var bots := {}                # Fighter-ID -> BotAI
var mode := "training"        # training | team | showdown
var score := [0, 0]
var time_left := 150.0
var finished := false
var result := {}
var respawns := {}            # Fighter-ID -> verbleibende Zeit
var feed: Array = []
var feed_label: Label
var score_label: Label
const TEAM_TARGET := 10
var waves: Array = []
var enemy_shots: Array = []
var walls: Array = []        # Rect2 in der XZ-Ebene (Kollision)
var wall_blocks: Array = []  # {rect, nodes, breakable}
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
var gad_btn: JoyDraw
var gad_label: Label
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
var lobs: Array = []
var dashes: Array = []
var _aim_frac := 1.0          # gezogene Stärke (0..1) für Würfe
var _orb_mesh: SphereMesh

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
	mode = Game.data.get("mode", "training")
	player = _spawn_fighter(Game.selected_brawler(), 0, false, Game.data.get("player_name", "Du"))
	player.transformed.connect(_on_transformed)
	match mode:
		"team":
			for i in 2:
				_spawn_fighter(_random_brawler(), 0, true, ["Kiko", "Brummi", "Sunny", "Zapp"][randi() % 4] + " (Bot)")
			for i in 3:
				_spawn_fighter(_random_brawler(), 1, true, ["Grimm", "Vex", "Schnapper", "Rocco", "Mira", "Blitz"][randi() % 6])
		"showdown":
			var names := ["Grimm", "Vex", "Schnapper", "Rocco", "Mira", "Blitz"]
			for i in 6:
				_spawn_fighter(_random_brawler(), i + 1, true, names[i])
		_:
			_spawn_dummy(Vector3(-4, 0, -4), "static")
			_spawn_dummy(Vector3(0, 0, -6), "walker")
			_spawn_dummy(Vector3(4, 0, -4), "shooter")
			_spawn_dummy(Vector3(0, 0, -1), "static")
	for f in fighters:
		f.position = _spawn_point(f)
	aim_mesh = MeshInstance3D.new()
	aim_mesh.material_override = _aim_mat()
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
	e.ambient_light_energy = 0.3
	env.environment = e
	add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52, -35, 0)
	sun.light_energy = 0.95
	sun.light_color = Color(1, 0.96, 0.88)
	# Im Browser (v. a. iPhone) sind Echtzeitschatten zu teuer.
	sun.shadow_enabled = not OS.has_feature("web")
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
uniform vec4 col_a : source_color = vec4(0.86, 0.68, 0.42, 1.0);
uniform vec4 col_b : source_color = vec4(0.8, 0.61, 0.37, 1.0);
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
	outer.material_override = ModelBuilder.mat(Color(0.42, 0.72, 0.35), false)
	add_child(outer)

	# Statische Teile (Mauern, Deko) werden am Ende zu wenigen Meshes zusammengefasst (Leistung).
	_static = Node3D.new()
	add_child(_static)
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
	# Zerstörbare Kisten-Reihen (Supers & Explosionen können sie sprengen)
	_add_wall(Rect2(-3, -3.5, 2, 1), wall_col, top_col, true)
	_add_wall(Rect2(1, -3.5, 2, 1), wall_col, top_col, true)
	_add_wall(Rect2(-6, 5, 1, 2), wall_col, top_col, true)
	_add_wall(Rect2(5, 5, 1, 2), wall_col, top_col, true)
	# Büsche & Deko (nur Optik)
	for p in [Vector3(-7, 0, 7), Vector3(7, 0, 7), Vector3(-6, 0, -1), Vector3(6, 0, -1)]:
		# Buschgruppe aus mehreren flauschigen Kugeln
		for i in 7:
			var a := i / 7.0 * TAU
			var off := Vector3(cos(a), 0, sin(a)) * (0.0 if i == 0 else 0.55)
			ModelBuilder.part(_static, "sphere", p + off + Vector3(0, 0.5 + (0.25 if i == 0 else 0.0), 0), Vector3.ONE * (1.1 if i == 0 else 0.8), Color(0.32, 0.72, 0.32).lightened((i % 3) * 0.06))
	# Kisten als Deko am Rand
	for p in [Vector3(-8.5, 0, 11), Vector3(8.5, 0, 11), Vector3(-8.5, 0, -11.5), Vector3(8.5, 0, -11.5)]:
		ModelBuilder.part(_static, "rbox", p + Vector3(0, 0.45, 0), Vector3(0.9, 0.9, 0.9), Color(0.82, 0.55, 0.3))
		ModelBuilder.part(_static, "box", p + Vector3(0, 0.45, 0), Vector3(0.94, 0.12, 0.94), Color(0.55, 0.35, 0.2), Vector3.ZERO, false)
	for i in 26:
		var a := i / 26.0 * TAU
		var r := randf_range(16.5, 22.0)
		var tp := Vector3(cos(a) * r, 0, sin(a) * r * 1.2)
		ModelBuilder.part(_static, "cyl", tp + Vector3(0, 0.6, 0), Vector3(0.3, 1.2, 0.3), Color(0.5, 0.33, 0.2))
		ModelBuilder.part(_static, "sphere", tp + Vector3(0, 1.7, 0), Vector3.ONE * randf_range(1.3, 1.8), Color(0.28, 0.62, 0.32))
	ModelBuilder.merge_tree(_static)

func _add_wall(r: Rect2, side: Color, top: Color, breakable := false) -> void:
	# Wand aus einzelnen, abgerundeten Blöcken mit heller Deckplatte (leicht unregelmäßig).
	# Jeder Block hat eigene Kollision und kann (falls zerstörbar) einzeln gesprengt werden.
	var nx: int = max(1, int(round(r.size.x)))
	var nz: int = max(1, int(round(r.size.y)))
	for ix in nx:
		for iz in nz:
			var bw := r.size.x / nx
			var bd := r.size.y / nz
			var rect := Rect2(r.position.x + ix * bw, r.position.y + iz * bd, bw, bd)
			var c := Vector3(rect.position.x + bw / 2.0, 0, rect.position.y + bd / 2.0)
			var nodes: Array = []
			if breakable:
				# Holzkiste: hell, mit dunklen Bändern
				nodes.append(ModelBuilder.part(self, "rbox", c + Vector3(0, 0.5, 0), Vector3(bw * 0.94, 1.0, bd * 0.94), Color(0.85, 0.58, 0.32)))
				nodes.append(ModelBuilder.part(self, "box", c + Vector3(0, 0.5, 0), Vector3(bw * 0.97, 0.14, bd * 0.97), Color(0.55, 0.35, 0.2), Vector3.ZERO, false))
				nodes.append(ModelBuilder.part(self, "box", c + Vector3(0, 0.92, 0), Vector3(bw * 0.97, 0.1, bd * 0.97), Color(0.55, 0.35, 0.2), Vector3.ZERO, false))
			else:
				var h := 1.15 + fmod(abs(c.x * 3.7 + c.z * 1.3), 0.25)
				var shade := side.darkened(fmod(abs(c.x * 1.7 + c.z * 2.9), 0.12))
				ModelBuilder.part(_static, "rbox", c + Vector3(0, h * 0.5, 0), Vector3(bw, h, bd), shade)
				ModelBuilder.part(_static, "rbox", c + Vector3(0, h + 0.04, 0), Vector3(bw + 0.06, 0.16, bd + 0.06), top, Vector3.ZERO, false)
			wall_blocks.append({"rect": rect, "nodes": nodes, "breakable": breakable, "color": Color(0.85, 0.58, 0.32) if breakable else side})
	_rebuild_walls()

func _rebuild_walls() -> void:
	walls.clear()
	for b in wall_blocks:
		walls.append(b.rect)

## Zerstört alle zerstörbaren Blöcke im Radius. Rückgabe: Anzahl.
func break_walls(pos: Vector3, radius: float) -> int:
	var n := 0
	for i in range(wall_blocks.size() - 1, -1, -1):
		var b: Dictionary = wall_blocks[i]
		if not b.breakable:
			continue
		var c := Vector3(b.rect.position.x + b.rect.size.x / 2.0, 0, b.rect.position.y + b.rect.size.y / 2.0)
		if Vector2(c.x - pos.x, c.z - pos.z).length() > radius + 0.6:
			continue
		for node in b.nodes:
			node.queue_free()
		_burst(c + Vector3(0, 0.6, 0), b.color, 18, 6.0, 0.16)
		_burst(c + Vector3(0, 0.4, 0), Color(0.9, 0.85, 0.75), 8, 2.0, 0.3)
		wall_blocks.remove_at(i)
		n += 1
	if n > 0:
		_rebuild_walls()
		Game.play_sfx("explosion", 0.5, 1.4)
		_shake = max(_shake, 0.25)
	return n

func _block_at(p: Vector3) -> Dictionary:
	for b in wall_blocks:
		if b.rect.has_point(Vector2(p.x, p.z)):
			return b
	return {}

## Statuseffekte eines Angriffs (Betäubung, Verlangsamung, Rückstoß).
static func fx_of(spec: Dictionary) -> Dictionary:
	return {"stun": spec.get("stun", 0.0), "slow": spec.get("slow", 0.0), "knock": spec.get("knock", 0.0)}

# ==================================================================== Brawler & Teams
func _spawn_fighter(b: Dictionary, team: int, bot: bool, name: String) -> Fighter:
	var f := Fighter.new()
	f.team = team
	f.is_bot = bot
	f.display_name = name
	add_child(f)
	f.setup(b, self)
	f.proxy = {"fighter": f, "pos": f.position, "radius": 0.5}
	fighters.append(f)
	if bot:
		bots[f.get_instance_id()] = BotAI.new(randf_range(0.45, 0.75))
	return f

func _random_brawler() -> Dictionary:
	return Game.brawlers[randi() % Game.brawlers.size()]

func _spawn_point(f: Fighter) -> Vector3:
	if mode == "showdown":
		var i: int = fighters.find(f)
		var a: float = TAU * i / max(1, fighters.size()) + PI / 2.0
		return resolve_circle(Vector3(cos(a) * 8.0, 0, sin(a) * 10.0), 0.5)
	var same: Array = fighters.filter(func(x): return x.team == f.team)
	var idx: int = same.find(f)
	var z: float = 10.5 if f.team == 0 else -11.0
	return resolve_circle(Vector3((idx - (same.size() - 1) / 2.0) * 3.0, 0, z), 0.5)

func is_enemy(a: Fighter, b: Fighter) -> bool:
	return a.team != b.team

## Alle Ziele, die ein Brawler treffen kann (gegnerische Brawler und – im Training – Puppen).
func _targets(f: Fighter) -> Array:
	var list: Array = []
	if f == null or f.team == 0:
		list.append_array(dummies)
	for o in fighters:
		if o != f and o.alive and (f == null or is_enemy(f, o)):
			o.proxy.pos = o.position
			list.append(o.proxy)
	return list

func nearest_enemy(f: Fighter):
	var best = null
	var bd := 1e9
	for t in _targets(f):
		var d: float = (t.pos - f.position).length()
		if d < bd:
			bd = d
			best = t
	return best

func super_range(f: Fighter) -> float:
	var s: Dictionary = f.form().super
	return s.get("range", 8.0)

func _spawn_dummy(pos: Vector3, kind: String) -> void:
	var color := Color(1, 0.3, 0.3) if kind != "shooter" else Color(0.3, 0.5, 1.0)
	if kind == "walker":
		color = Color(1, 0.75, 0.2)
	var rig := ModelBuilder.build_dummy(color)
	rig.root.position = pos
	add_child(rig.root)
	var d := {"rig": rig, "node": rig.root, "pos": pos, "home": pos, "kind": kind, "hp": 40000.0, "max": 40000.0,
		"last_hit": -99.0, "dir": 1.0, "shoot_t": 2.0, "radius": 0.5, "shake": 0.0,
		"stun_until": 0.0, "slow_until": 0.0, "knock": Vector3.ZERO, "stun_fx": null,
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
	for d in _targets(f):
		var to: Vector3 = d.pos - origin
		to.y = 0
		var dist := to.length()
		if dist > step.range + d.radius:
			continue
		if dist > 0.3 and rad_to_deg(f.aim_dir.angle_to(to)) > step.arc * 0.5 + 10.0:
			continue
		_damage_dummy(d, step.dmg, f, fx_of(step), origin)
		hits += 1
	if step.get("break", false):
		break_walls(origin + f.aim_dir * step.range * 0.6, step.range * 0.6)
	_slash_fx(origin, f.aim_dir, step.range, step.arc, step.color, step.dir)
	Game.play_sfx("swoosh", 0.7, 1.1 if step.dir == "rtl" else 1.0)
	if hits > 0:
		Game.play_sfx("hit", 0.6)

## Reichweite des Hauptangriffs einer Form.
func attack_range(f: Dictionary) -> float:
	var atk: Dictionary = f.get("attack", {})
	return atk.range if not atk.is_empty() else f.combo[0].range

## Projektil erzeugen (Klingenwelle, Kugel, Lichtkugel, Stern).
func _spawn_projectile(f: Fighter, dir: Vector3, dmg: float, rng: float, speed: float, width: float, color: Color, pierce: bool, explode: float, visual: String, spec: Dictionary = {}) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var core := MeshInstance3D.new()
	var core_mat := StandardMaterial3D.new()
	core_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	core_mat.albedo_color = color.lerp(Color.WHITE, 0.55)
	core.material_override = core_mat
	core.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.add_child(core)
	match visual:
		"crescent":
			core.mesh = _crescent_mesh()
			core.scale = Vector3(width * 1.6, 0.5, width * 0.8)
			var cm := StandardMaterial3D.new()
			cm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
			cm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			cm.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
			cm.cull_mode = BaseMaterial3D.CULL_DISABLED
			cm.albedo_color = Color(color.r, color.g, color.b, 0.9)
			core.material_override = cm
			for k in 3:
				_glow_sprite(mi, Color(color.r, color.g, color.b, 0.55), width * 2.2).position = Vector3((k - 1) * width * 0.9, 0, 0.1)
		"bullet":
			core.mesh = _orb()
			core.scale = Vector3(width * 0.8, width * 0.8, width * 2.2)
			_glow_sprite(mi, Color(color.r, color.g, color.b, 0.8), width * 3.0)
		_:
			core.mesh = _orb()
			core.scale = Vector3.ONE * width * 1.3
			_glow_sprite(mi, Color(color.r, color.g, color.b, 0.85), width * 4.0)
	mi.set_meta("trail", _trail(mi, color, width * 2.2))
	mi.position = f.position + Vector3(0, 0.75, 0) + dir * 0.6
	mi.rotation.y = atan2(-dir.x, -dir.z)
	add_child(mi)
	waves.append({"node": mi, "dir": dir, "speed": speed, "range": rng, "travel": 0.0, "dmg": dmg, "width": width,
		"hit": [], "pierce": pierce, "explode": explode, "color": color, "owner": f, "visual": visual,
		"fx": fx_of(spec), "breaks": spec.get("break", false)})
	return mi

func _orb() -> SphereMesh:
	if _orb_mesh == null:
		_orb_mesh = SphereMesh.new()
		_orb_mesh.radius = 0.5; _orb_mesh.height = 1.0; _orb_mesh.radial_segments = 12; _orb_mesh.rings = 6
	return _orb_mesh

## Klingenwelle (aus Kombo oder Super).
func spawn_wave(f: Fighter, w: Dictionary, is_super: bool) -> void:
	var mi := _spawn_projectile(f, f.aim_dir, w.dmg, w.range, w.speed, w.width, w.color, w.get("pierce", true), w.get("explode", 0.0), "crescent", w)
	Game.play_sfx("wave", 0.8 if is_super else 0.5, 1.0 if is_super else 1.3)
	if is_super:
		_shake = max(_shake, 0.25)
		_burst(mi.position, w.color, 24, 5.0, 0.18)

## Schuss mit Streuung und Salven.
func fire_shot(f: Fighter, s: Dictionary, dir: Vector3, is_super: bool) -> void:
	for b in int(s.get("burst", 1)):
		if b == 0:
			_volley(f, s, dir, is_super)
		else:
			get_tree().create_timer(b * s.get("interval", 0.1), false).timeout.connect(func():
				if f.alive: _volley(f, s, dir, is_super))

func _volley(f: Fighter, s: Dictionary, dir: Vector3, is_super: bool) -> void:
	var n: int = int(s.get("count", 1))
	var spread: float = s.get("spread", 0.0)
	for i in n:
		var a: float = lerp(-spread / 2.0, spread / 2.0, float(i) / (n - 1)) if n > 1 else 0.0
		var d := dir.rotated(Vector3.UP, deg_to_rad(a))
		_spawn_projectile(f, d, s.dmg, s.range, s.speed, s.get("width", 0.25), s.color, s.get("pierce", false), 0.0, s.get("visual", "bullet"), s)
	_burst(f.position + Vector3(0, 0.8, 0) + dir * 0.8, s.color, 8, 3.0, 0.08)
	Game.play_sfx("shot", 0.7 if is_super else 0.5, 0.8 if n > 2 else 1.1)

## Bogenwurf mit Landemarkierung, explodiert am Ziel.
func throw_lob(f: Fighter, s: Dictionary, dir: Vector3, is_super: bool) -> void:
	var dist: float = clamp(s.range * _aim_frac, 1.0, s.range)
	var target := f.position + dir * dist
	target = Vector3(clamp(target.x, -ARENA_W / 2 + 0.5, ARENA_W / 2 - 0.5), 0, clamp(target.z, -ARENA_H / 2 + 0.5, ARENA_H / 2 - 0.5))
	var bomb := MeshInstance3D.new()
	bomb.mesh = _orb()
	bomb.material_override = ModelBuilder.mat(Color(0.15, 0.15, 0.2))
	bomb.scale = Vector3.ONE * (0.6 if is_super else 0.38)
	add_child(bomb)
	var marker := MeshInstance3D.new()
	marker.mesh = _sector_mesh(1.0, 359.9, 0.8)
	marker.material_override = _fx_mat(Color(s.color.r, s.color.g, s.color.b, 0.45))
	marker.position = target + Vector3(0, 0.06, 0)
	marker.scale = Vector3.ONE * s.radius
	add_child(marker)
	var start := f.position + Vector3(0, 1.0, 0)
	lobs.append({"node": bomb, "marker": marker, "start": start, "target": target, "t": 0.0,
		"dur": clamp(dist / 9.0, 0.45, 1.0), "dmg": s.dmg, "radius": s.radius, "color": s.color, "owner": f, "height": 1.8 + dist * 0.2,
		"fx": fx_of(s), "breaks": s.get("break", false)})
	_trail(bomb, Color(1, 0.7, 0.3), 0.5)
	Game.play_sfx("swoosh", 0.7, 0.8)

func _update_lobs(delta: float) -> void:
	for i in range(lobs.size() - 1, -1, -1):
		var l: Dictionary = lobs[i]
		l.t += delta
		var k: float = clamp(l.t / l.dur, 0.0, 1.0)
		var p: Vector3 = l.start.lerp(l.target, k)
		p.y = lerp(l.start.y, 0.3, k) + sin(k * PI) * l.height
		l.node.position = p
		l.node.rotate_x(delta * 8.0)
		if k >= 1.0:
			_explode(l.target, l.radius, l.dmg, l.color, l.owner, l.fx, l.breaks)
			l.node.queue_free()
			l.marker.queue_free()
			lobs.remove_at(i)

## Sturmangriff: der Brawler rast nach vorne und trifft jeden Gegner auf dem Weg einmal.
func dash(f: Fighter, s: Dictionary, dir: Vector3) -> void:
	dashes.append({"f": f, "dir": dir, "left": s.range, "speed": s.speed, "dmg": s.dmg, "color": s.color, "hit": [], "fx": fx_of(s), "breaks": s.get("break", false)})
	_trail(f, s.color, 0.9).set_meta("dash_trail", true)
	Game.play_sfx("charge", 0.7, 1.4)
	_shake = 0.2

func _update_dashes(delta: float) -> void:
	for i in range(dashes.size() - 1, -1, -1):
		var d: Dictionary = dashes[i]
		var f: Fighter = d.f
		var step: float = min(d.left, d.speed * delta)
		var before := f.position
		if d.breaks:
			break_walls(f.position + d.dir * 0.9, 0.7)
		f.dash_move(d.dir * step)
		d.left -= step
		_burst(f.position + Vector3(0, 0.3, 0), Color(0.9, 0.85, 0.7), 2, 1.5, 0.12)
		for dm in _targets(f):
			if dm in d.hit:
				continue
			if (dm.pos - f.position).length() < 1.2:
				d.hit.append(dm)
				_damage_dummy(dm, d.dmg, f, d.fx, f.position - d.dir)
				dm.shake = 0.4
				_burst(dm.pos + Vector3(0, 1, 0), d.color, 20, 6.0, 0.15)
		if d.left <= 0.0 or (f.position - before).length() < step * 0.2:
			_ring_fx(f.position, 1.8, d.color, 0.3)
			for c in f.get_children():
				if c is CPUParticles3D and c.has_meta("dash_trail"):
					c.emitting = false
					c.reparent(self)
					fx.append({"node": c, "t": 0.0, "dur": 0.5, "kind": "particles"})
			dashes.remove_at(i)

## Rundumschlag: Projektile in alle Richtungen (mehrere Wellen).
func nova(f: Fighter, s: Dictionary) -> void:
	for b in int(s.get("burst", 1)):
		get_tree().create_timer(b * 0.25 + 0.01, false).timeout.connect(func():
			if not f.alive: return
			var n: int = int(s.count)
			for i in n:
				var a := TAU * i / n + b * PI / n
				_spawn_projectile(f, Vector3(cos(a), 0, sin(a)), s.dmg, s.range, s.speed, s.get("width", 0.3), s.color, true, 0.0, "orb", s)
			_ring_fx(f.position, 2.0, s.color, 0.3)
			Game.play_sfx("wave", 0.6, 1.5))

## Gadgets: Teleport, Heilung, Schild, Betäubungs-Impuls, Sofort-Nachladen, Tempo-Schub.
func use_gadget(f: Fighter, g: Dictionary) -> void:
	var c: Color = g.get("color", Color(0.4, 1.0, 0.5))
	match g.type:
		"swap":
			# Waffenwechsel: nächste Waffe aus dem Arsenal (eigener Angriff + eigene Super)
			f.apply_form((f.form_index + 1) % f.def.forms.size(), false)
			_burst(f.position + Vector3(0, 1.0, 0), c, 22, 4.0, 0.18)
			_ring_fx(f.position, 1.4, c, 0.25)
		"blink":
			_burst(f.position + Vector3(0, 0.9, 0), c, 20, 3.0, 0.2)
			f.position = move_circle(f.position, f.aim_dir * g.get("range", 4.0), f.radius)
			_burst(f.position + Vector3(0, 0.9, 0), c, 24, 4.0, 0.2)
			_ring_fx(f.position, 1.6, c, 0.3)
		"heal":
			f.heal(f.max_hp * g.get("amount", 0.35))
			_damage_number(f.position + Vector3(0, 2.6, 0), f.max_hp * g.get("amount", 0.35), Color(0.4, 1.0, 0.5))
			for i in 3:
				aura_particle(f.position + Vector3(randf_range(-0.5, 0.5), 0.5, randf_range(-0.5, 0.5)), Color(0.4, 1.0, 0.5, 1.0))
			_ring_fx(f.position, 2.0, Color(0.4, 1.0, 0.5), 0.4)
		"shield":
			f.shield_until = f.now() + g.get("duration", 3.0)
			var sh := _glow_sprite(f, Color(c.r, c.g, c.b, 0.45), 2.8)
			sh.position = Vector3(0, 1.0, 0)
			fx.append({"node": sh, "t": 0.0, "dur": g.get("duration", 3.0), "kind": "particles"})
		"stun_pulse":
			for d in _targets(f):
				if (d.pos - f.position).length() <= g.get("range", 4.0):
					_damage_dummy(d, g.get("dmg", 400.0), f, {"stun": g.get("stun", 1.5)}, f.position)
			_ring_fx(f.position, g.get("range", 4.0), c, 0.4)
			_burst(f.position + Vector3(0, 0.8, 0), c, 30, 7.0, 0.2)
			_shake = max(_shake, 0.3)
		"reload":
			f.ammo = float(f.def.ammo)
			_burst(f.position + Vector3(0, 1.0, 0), Color(1, 0.75, 0.3), 16, 3.0, 0.18)
		"speed":
			f.speed_until = f.now() + g.get("duration", 3.0)
			var tr := _trail(f, c, 0.6)
			tr.position = Vector3(0, 0.5, 0)
			fx.append({"node": tr, "t": 0.0, "dur": g.get("duration", 3.0), "kind": "particles"})
	Game.play_sfx("ready", 0.8, 1.3)
	show_banner(f.form().name.to_upper() if g.type == "swap" else g.name.to_upper())

func charge_effect(f: Fighter, sup: Dictionary) -> void:
	Game.play_sfx("charge", 1.0)
	var steps := 6
	for i in steps:
		get_tree().create_timer(sup.charge * i / float(steps), false).timeout.connect(func():
			_ring_fx(f.position, 2.6 - i * 0.3, sup.color, 0.25)
			_burst(f.position + Vector3(0, 1.0, 0), sup.color, 10, -3.0, 0.15))
	_shake = 0.2

func _damage_dummy(d: Dictionary, amount: float, f: Fighter, efx: Dictionary = {}, from := Vector3.INF) -> void:
	if d.has("fighter"):
		_damage_fighter(d.fighter, amount, f, efx, from)
		return
	var now := Time.get_ticks_msec() / 1000.0
	if efx.get("stun", 0.0) > 0.0:
		var first: bool = d.stun_until < now
		d.stun_until = max(d.stun_until, now + efx.stun)
		if first:
			_damage_number(d.pos + Vector3(0, 3.0, 0), -1, Color(1, 0.9, 0.3))
	if efx.get("slow", 0.0) > 0.0:
		d.slow_until = max(d.slow_until, now + efx.slow)
	if efx.get("knock", 0.0) > 0.0 and from != Vector3.INF:
		var push: Vector3 = d.pos - from
		push.y = 0
		if push.length() > 0.01:
			d.knock = push.normalized() * efx.knock
	d.hp -= amount
	d.last_hit = Time.get_ticks_msec() / 1000.0
	d.shake = 0.2
	total_damage += amount
	if f != null:
		f.damage_dealt += amount
		f.add_charge(amount)
	_damage_number(d.pos + Vector3(0, 2.4, 0), amount, Color.WHITE)
	_burst(d.pos + Vector3(0, 0.9, 0), Color(1, 0.95, 0.7), 8, 4.0, 0.1)
	if d.hp <= 0.0:
		d.hp = d.max
		_burst(d.pos + Vector3(0, 0.9, 0), Color(1, 0.8, 0.3), 30, 6.0, 0.18)

func _damage_fighter(v: Fighter, amount: float, f: Fighter, efx: Dictionary, from: Vector3) -> void:
	if not v.alive or finished:
		return
	var was_stunned := v.stunned()
	v.apply_status(efx, from)
	if v.stunned() and not was_stunned:
		_damage_number(v.position + Vector3(0, 3.0, 0), -1, Color(1, 0.9, 0.3))
	v.take_damage(amount)
	total_damage += amount if f == player else 0.0
	if f != null:
		f.damage_dealt += amount
		f.add_charge(amount)
	_damage_number(v.position + Vector3(0, 2.6, 0), amount, Color(1, 0.4, 0.4) if v == player else Color.WHITE)
	_burst(v.position + Vector3(0, 1.0, 0), Color(1, 0.95, 0.7), 8, 4.0, 0.1)
	if v == player:
		Game.play_sfx("hurt", 0.5)
		_shake = max(_shake, 0.15)
	if not v.alive:
		_on_fighter_died(v, f)

func _on_fighter_died(v: Fighter, killer: Fighter) -> void:
	v.deaths += 1
	_burst(v.position + Vector3(0, 0.9, 0), Color.WHITE, 30, 6.0, 0.25)
	_ring_fx(v.position, 2.0, Color(1, 0.5, 0.4), 0.4)
	Game.play_sfx("explosion", 0.6, 1.3)
	if killer != null and killer != v:
		killer.kills += 1
	_add_feed(("%s besiegt %s" % [killer.display_name, v.display_name]) if killer != null else ("%s wurde besiegt" % v.display_name))
	match mode:
		"team":
			if killer != null:
				score[killer.team] += 1
			respawns[v.get_instance_id()] = 3.0
			if score[0] >= TEAM_TARGET or score[1] >= TEAM_TARGET:
				_finish_team()
		"showdown":
			var alive: Array = fighters.filter(func(x): return x.alive)
			if v == player:
				_finish("defeat", alive.size() + 1)
			elif alive.size() == 1 and alive[0] == player:
				_finish("victory", 1)
		_:
			respawns[v.get_instance_id()] = 2.0

func _add_feed(text: String) -> void:
	feed.push_front(text)
	if feed.size() > 4:
		feed.pop_back()

func _finish_team() -> void:
	if score[0] > score[1]:
		_finish("victory", 0)
	elif score[0] < score[1]:
		_finish("defeat", 0)
	else:
		_finish("draw", 0)

## Matchende: Ergebnis-Bildschirm mit Belohnungen.
func _finish(outcome: String, rank: int) -> void:
	if finished:
		return
	finished = true
	result = {"mode": mode, "outcome": outcome, "rank": rank, "kills": player.kills, "score": score.duplicate()}
	Game.play_sfx("transform" if outcome == "victory" else "hurt", 1.0, 1.0 if outcome == "victory" else 0.6)
	var layer := CanvasLayer.new()
	layer.layer = 25
	add_child(layer)
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.55)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(center)
	var col: Color = {"victory": Color(1, 0.75, 0.1), "defeat": Color(0.8, 0.2, 0.25), "draw": Color(0.5, 0.5, 0.6)}[outcome]
	var panel := Game.make_panel(col.darkened(0.35))
	center.add_child(panel)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 14)
	vb.custom_minimum_size = Vector2(560, 300)
	panel.add_child(vb)
	var title: String = {"victory": "SIEG!", "defeat": "NIEDERLAGE", "draw": "UNENTSCHIEDEN"}[outcome]
	if mode == "showdown":
		title = "PLATZ %d" % rank + ("!" if rank == 1 else "")
	var t := Game.make_label(title, 64, Color.WHITE, 14)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(t)
	var detail: String = "Blau %d : %d Rot" % [score[0], score[1]] if mode == "team" else "Übrig gebliebene Gegner: %d" % (rank - 1 if rank > 1 else 0)
	var d := Game.make_label(detail + "\nDeine K.O.s: %d" % player.kills, 28, Color.WHITE, 8)
	d.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(d)
	var ok := Game.make_button("Weiter", Color(0.3, 0.8, 0.35), Vector2(260, 90), 32)
	ok.pressed.connect(func(): emit_signal("exit_requested"))
	vb.add_child(ok)
	panel.scale = Vector2(0.5, 0.5)
	panel.pivot_offset = Vector2(300, 170)
	panel.create_tween().tween_property(panel, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _explode(pos: Vector3, radius: float, dmg: float, color: Color, f: Fighter, efx: Dictionary = {}, breaks := false) -> void:
	for d in _targets(f):
		var to: Vector3 = d.pos - pos
		to.y = 0
		if to.length() <= radius + d.radius:
			_damage_dummy(d, dmg, f, efx, pos)
	if breaks:
		break_walls(pos, radius)
	_burst(pos + Vector3(0, 0.6, 0), color, 40, 9.0, 0.28)
	_burst(pos + Vector3(0, 0.6, 0), Color.WHITE, 16, 4.0, 0.4)
	_burst(pos + Vector3(0, 0.3, 0), Color(0.35, 0.3, 0.3), 10, 2.0, 0.5)
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
	if finished:
		input = Vector2.ZERO
	for f in fighters:
		if not f.alive:
			continue
		if f == player:
			f.update_movement(input, delta)
		elif not finished:
			f.update_movement(bots[f.get_instance_id()].think(f, self, delta), delta)
		else:
			f.update_movement(Vector2.ZERO, delta)
	# Respawns
	for f in fighters:
		var id: int = f.get_instance_id()
		if respawns.has(id):
			respawns[id] -= delta
			if respawns[id] <= 0.0:
				respawns.erase(id)
				if not finished:
					f.respawn(_spawn_point(f))
					_ring_fx(f.position, 1.5, Color(0.5, 0.9, 1.0), 0.4)
	# Zeitlimit Teamkampf
	if mode == "team" and not finished:
		time_left -= delta
		if time_left <= 0.0:
			_finish_team()
	_update_dummies(delta)
	_update_waves(delta)
	_update_lobs(delta)
	_update_dashes(delta)
	_update_enemy_shots(delta)
	_update_fx(delta)
	_update_aim()
	_update_camera(delta)
	_update_hud(delta)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_SPACE:
			_aim_frac = _auto_frac(attack_range(player.form()))
			player.try_attack(auto_aim(attack_range(player.form()) + 3.0))
		elif event.keycode == KEY_E:
			player.try_super(auto_aim(12.0))
		elif event.keycode == KEY_G:
			player.try_gadget()
		elif event.keycode == KEY_ESCAPE:
			emit_signal("exit_requested")

func auto_aim(max_range: float) -> Vector3:
	var best = null
	var bd := max_range
	for d in _targets(player):
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
		var stunned: bool = now < d.stun_until
		var slow_mul := 0.4 if now < d.slow_until else 1.0
		_update_stun_fx(d, stunned, now)
		# Rückstoß (gleitet aus, Wände stoppen)
		if d.knock.length() > 0.01:
			var k: Vector3 = d.knock * min(1.0, delta * 10.0)
			d.pos = move_circle(d.pos, k, 0.45)
			d.knock -= k
		if stunned:
			pass
		elif d.kind == "walker":
			d.pos.x += d.dir * 1.6 * slow_mul * delta
			if d.pos.x > d.home.x + 3.0:
				d.dir = -1.0
			elif d.pos.x < d.home.x - 3.0:
				d.dir = 1.0
		elif d.kind == "shooter" and player.alive:
			d.shoot_t -= delta * slow_mul
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
		# Verlangsamt: leicht bläulich schimmern
		if now < d.slow_until and randf() < 0.15:
			aura_particle(d.pos + Vector3(randf_range(-0.4, 0.4), randf_range(0.3, 1.6), 0), Color(0.5, 0.8, 1.0, 0.8))

## Kreisende Sterne über dem Kopf, solange eine Puppe betäubt ist.
func _update_stun_fx(d: Dictionary, stunned: bool, now: float) -> void:
	if stunned and d.stun_fx == null:
		var n := Node3D.new()
		for i in 3:
			var g := _glow_sprite(n, Color(1, 0.9, 0.3, 1.0), 0.45)
			g.position = Vector3(cos(i * TAU / 3.0), 0, sin(i * TAU / 3.0)) * 0.45
		add_child(n)
		d.stun_fx = n
	if d.stun_fx != null:
		if stunned:
			d.stun_fx.position = d.pos + Vector3(0, 2.25, 0)
			d.stun_fx.rotation.y = now * 6.0
		else:
			d.stun_fx.queue_free()
			d.stun_fx = null

static func _seg_dist_xz(p: Vector3, a: Vector3, b: Vector3) -> float:
	var pa := Vector2(p.x - a.x, p.z - a.z)
	var ba := Vector2(b.x - a.x, b.z - a.z)
	var l2 := ba.length_squared()
	var t: float = 0.0 if l2 < 0.000001 else clampf(pa.dot(ba) / l2, 0.0, 1.0)
	return (pa - ba * t).length()

func _update_waves(delta: float) -> void:
	for i in range(waves.size() - 1, -1, -1):
		var w: Dictionary = waves[i]
		var node: MeshInstance3D = w.node
		var step: float = w.speed * delta
		var nxt: Vector3 = node.position + w.dir * step
		var done := false
		if blocked(nxt):
			# Wandbrecher fliegen durch zerstörbare Blöcke hindurch
			var blk := _block_at(nxt)
			if w.breaks and not blk.is_empty() and blk.breakable:
				break_walls(nxt, 0.3)
			else:
				done = true
				if w.explode > 0.0:
					_explode(node.position, w.explode, w.dmg * 0.5, w.color, w.owner, w.fx, w.breaks)
		else:
			for d in _targets(w.owner):
				if d in w.hit:
					continue
				# Strecken-Test (alte → neue Position): auch bei Rucklern fliegt nichts durch Gegner hindurch
				if _seg_dist_xz(d.pos, node.position, nxt) <= w.width + d.radius:
					w.hit.append(d)
					_damage_dummy(d, w.dmg, w.owner, w.fx, nxt - w.dir)
					if not w.pierce:
						done = true
						if w.explode > 0.0:
							_explode(d.pos, w.explode, w.dmg * 0.5, w.color, w.owner, w.fx, w.breaks)
						break
		node.position = nxt
		w.travel += step
		if not done and w.travel >= w.range:
			done = true
			if w.explode > 0.0:
				_explode(nxt, w.explode, w.dmg * 0.5, w.color, w.owner, w.fx, w.breaks)
		if done:
			# Schweif ausklingen lassen, Projektil entfernen
			var tr: CPUParticles3D = node.get_meta("trail")
			if is_instance_valid(tr):
				tr.emitting = false
				tr.reparent(self)
				fx.append({"node": tr, "t": 0.0, "dur": 0.5, "kind": "particles"})
			_burst(node.position, w.color, 6, 2.5, 0.1)
			node.queue_free()
			waves.remove_at(i)

func _spawn_enemy_shot(pos: Vector3, dir: Vector3) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = ModelBuilder.mesh("sphere")
	mi.material_override = _fx_mat(Color(0.75, 0.85, 1.0, 1.0))
	mi.scale = Vector3.ONE * 0.3
	mi.position = pos
	add_child(mi)
	var g := _glow_sprite(mi, Color(0.4, 0.6, 1.0, 0.9), 4.0)
	g.scale = Vector3.ONE * 4.0
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
				_damage_fighter(player, 300.0, null, {}, Vector3.INF)
				done = true
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
	cam.position = _cam_focus + Vector3(0, 10.5, 7.2) + shake
	cam.look_at(_cam_focus + Vector3(0, 0, -1.2), Vector3.UP)

# ==================================================================== Effekte
## Zielanzeige: halbtransparente Fläche mit hellem Rand und laufenden Streifen, nie vom Boden verdeckt.
func _aim_mat() -> ShaderMaterial:
	var sh := Shader.new()
	sh.code = """
shader_type spatial;
render_mode unshaded, cull_disabled, depth_test_disabled, blend_mix;
uniform vec4 color : source_color = vec4(1.0, 1.0, 1.0, 0.45);
varying vec3 lpos;
void vertex() { lpos = VERTEX; }
void fragment() {
	float r = length(lpos.xz);
	float stripes = step(0.5, fract(r * 1.5 - TIME * 2.0)) * 0.15;
	ALBEDO = color.rgb;
	ALPHA = color.a + stripes;
}
"""
	var m := ShaderMaterial.new()
	m.shader = sh
	m.render_priority = 10
	return m

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
		var u0 := float(i) / seg
		var u1 := float(i + 1) / seg
		st.set_uv(Vector2(u0, 0)); st.add_vertex(o0 * inner)
		st.set_uv(Vector2(u0, 1)); st.add_vertex(o0 * radius)
		st.set_uv(Vector2(u1, 1)); st.add_vertex(o1 * radius)
		st.set_uv(Vector2(u0, 0)); st.add_vertex(o0 * inner)
		st.set_uv(Vector2(u1, 1)); st.add_vertex(o1 * radius)
		st.set_uv(Vector2(u1, 0)); st.add_vertex(o1 * inner)
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

# ---------------------------------------------------------------- weiche Effekte
var _glow_tex: GradientTexture2D
var _pmat_add: StandardMaterial3D
var _pmat_alpha: StandardMaterial3D
var _slash_shader: Shader
var _ring_shader: Shader
var _glow_quad: QuadMesh

## Weiche, runde Leuchttextur (Mitte hell, Rand transparent).
func _glow() -> GradientTexture2D:
	if _glow_tex == null:
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 1))
		g.set_color(1, Color(1, 1, 1, 0))
		g.add_point(0.35, Color(1, 1, 1, 0.6))
		_glow_tex = GradientTexture2D.new()
		_glow_tex.gradient = g
		_glow_tex.fill = GradientTexture2D.FILL_RADIAL
		_glow_tex.fill_from = Vector2(0.5, 0.5)
		_glow_tex.fill_to = Vector2(1.0, 0.5)
		_glow_tex.width = 64
		_glow_tex.height = 64
	return _glow_tex

## Material für Partikel (Billboard, weich, additiv oder normal überblendet).
func _particle_mat(additive := true) -> StandardMaterial3D:
	if additive and _pmat_add != null:
		return _pmat_add
	if not additive and _pmat_alpha != null:
		return _pmat_alpha
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD if additive else BaseMaterial3D.BLEND_MODE_MIX
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.vertex_color_use_as_albedo = true
	m.albedo_texture = _glow()
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.disable_receive_shadows = true
	if additive: _pmat_add = m
	else: _pmat_alpha = m
	return m

## Einzelnes leuchtendes Billboard (z.B. Glühen um Projektile).
func _glow_sprite(parent: Node3D, color: Color, size: float) -> MeshInstance3D:
	if _glow_quad == null:
		_glow_quad = QuadMesh.new()
		_glow_quad.size = Vector2.ONE
	var mi := MeshInstance3D.new()
	mi.mesh = _glow_quad
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.albedo_texture = _glow()
	m.albedo_color = color
	m.disable_receive_shadows = true
	mi.material_override = m
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.scale = Vector3.ONE * size
	parent.add_child(mi)
	return mi

## Partikel-Schweif, der einem Objekt folgt (in Weltkoordinaten).
func _trail(parent: Node3D, color: Color, size: float) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = 24
	p.lifetime = 0.35
	p.local_coords = false
	var q := QuadMesh.new()
	q.size = Vector2.ONE * size
	p.mesh = q
	p.material_override = _particle_mat(true)
	p.gravity = Vector3.ZERO
	p.spread = 15.0
	p.initial_velocity_min = 0.0
	p.initial_velocity_max = 0.3
	p.color = color
	p.color_ramp = _fade_ramp()
	p.scale_amount_curve = _shrink_curve()
	parent.add_child(p)
	p.emitting = true
	return p

var _ramp: Gradient
var _shrink: Curve
func _fade_ramp() -> Gradient:
	if _ramp == null:
		_ramp = Gradient.new()
		_ramp.set_color(0, Color(1, 1, 1, 1))
		_ramp.set_color(1, Color(1, 1, 1, 0))
	return _ramp

func _shrink_curve() -> Curve:
	if _shrink == null:
		_shrink = Curve.new()
		_shrink.add_point(Vector2(0, 1))
		_shrink.add_point(Vector2(1, 0.2))
	return _shrink

## Weicher Funkenregen (Treffer, Explosionen). speed < 0 = nach innen/oben schwebend.
func _burst(pos: Vector3, color: Color, amount: int, speed: float, size: float) -> void:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.explosiveness = 0.95
	p.amount = max(1, amount)
	p.lifetime = 0.55
	var q := QuadMesh.new()
	q.size = Vector2.ONE * size * 4.0
	p.mesh = q
	p.material_override = _particle_mat(true)
	p.direction = Vector3.UP
	p.spread = 180.0
	p.initial_velocity_min = abs(speed) * 0.4
	p.initial_velocity_max = abs(speed)
	p.damping_min = 4.0
	p.damping_max = 8.0
	p.gravity = Vector3(0, -3.0 if speed > 0 else 2.5, 0)
	p.color = Color(color.r, color.g, color.b, 1.0)
	p.color_ramp = _fade_ramp()
	p.scale_amount_min = 0.5
	p.scale_amount_max = 1.2
	p.scale_amount_curve = _shrink_curve()
	p.position = pos
	add_child(p)
	p.emitting = true
	fx.append({"node": p, "t": 0.0, "dur": 0.8, "kind": "particles"})

## Saubere Schwerthieb-Spur: leuchtendes Band, das in Schlagrichtung über den Bogen läuft.
func _slash_fx(origin: Vector3, dir: Vector3, radius: float, arc: float, color: Color, swing: String) -> void:
	if _slash_shader == null:
		_slash_shader = Shader.new()
		_slash_shader.code = """
shader_type spatial;
render_mode unshaded, blend_mix, cull_disabled, depth_draw_never, shadows_disabled;
uniform vec4 color : source_color = vec4(1.0);
uniform float progress = 0.0;
uniform float reverse = 0.0;
uniform float fade = 1.0;
void fragment() {
	float x = mix(UV.x, 1.0 - UV.x, reverse);
	float r = UV.y;
	float band = smoothstep(0.0, 0.55, r) * (1.0 - smoothstep(0.92, 1.0, r));
	float tail = smoothstep(progress - 0.8, progress, x) * (1.0 - smoothstep(progress, progress + 0.04, x));
	float core = smoothstep(0.7, 0.92, r) * (1.0 - smoothstep(0.92, 1.0, r));
	ALBEDO = mix(color.rgb * 1.15, vec3(1.0), core * 0.8);
	ALPHA = clamp(band * tail * fade * color.a * 1.2, 0.0, 0.95);
}
"""
	var mi := MeshInstance3D.new()
	mi.mesh = _sector_mesh(radius, min(arc, 359.0), radius * 0.35)
	var m := ShaderMaterial.new()
	m.shader = _slash_shader
	m.set_shader_parameter("color", color)
	m.set_shader_parameter("reverse", 1.0 if swing == "rtl" else 0.0)
	mi.material_override = m
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.position = origin + Vector3(0, 0.75, 0)
	mi.rotation.y = atan2(-dir.x, -dir.z)
	if swing == "over":
		mi.rotation.x = deg_to_rad(-25)
	add_child(mi)
	fx.append({"node": mi, "t": 0.0, "dur": 0.26, "kind": "slash"})

## Weicher, sich ausdehnender Ring am Boden.
func _ring_fx(pos: Vector3, radius: float, color: Color, dur: float) -> void:
	if _ring_shader == null:
		_ring_shader = Shader.new()
		_ring_shader.code = """
shader_type spatial;
render_mode unshaded, blend_mix, cull_disabled, depth_draw_never, shadows_disabled;
uniform vec4 color : source_color = vec4(1.0);
uniform float fade = 1.0;
void fragment() {
	float r = UV.y;
	ALBEDO = mix(color.rgb, vec3(1.0), smoothstep(0.6, 0.85, r) * 0.5);
	ALPHA = sin(r * 3.14159) * fade * color.a;
}
"""
	var mi := MeshInstance3D.new()
	mi.mesh = _sector_mesh(1.0, 359.9, 0.7)
	var m := ShaderMaterial.new()
	m.shader = _ring_shader
	m.set_shader_parameter("color", color)
	mi.material_override = m
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	mi.position = pos + Vector3(0, 0.08, 0)
	add_child(mi)
	fx.append({"node": mi, "t": 0.0, "dur": dur, "kind": "ring", "radius": radius})

func aura_particle(pos: Vector3, color: Color) -> void:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.amount = 2
	p.lifetime = 0.7
	var q := QuadMesh.new()
	q.size = Vector2.ONE * 0.35
	p.mesh = q
	p.material_override = _particle_mat(true)
	p.direction = Vector3.UP
	p.spread = 25.0
	p.initial_velocity_min = 0.6
	p.initial_velocity_max = 1.3
	p.gravity = Vector3.ZERO
	p.color = Color(color.r, color.g, color.b, 1.0)
	p.color_ramp = _fade_ramp()
	p.scale_amount_curve = _shrink_curve()
	p.position = pos
	add_child(p)
	p.emitting = true
	fx.append({"node": p, "t": 0.0, "dur": 0.9, "kind": "particles"})

func _update_fx(delta: float) -> void:
	for i in range(fx.size() - 1, -1, -1):
		var f: Dictionary = fx[i]
		f.t += delta
		var k: float = clamp(f.t / f.dur, 0.0, 1.0)
		var node: Node3D = f.node
		if not is_instance_valid(node):
			fx.remove_at(i)
			continue
		match f.kind:
			"slash":
				var sm := node.material_override as ShaderMaterial
				sm.set_shader_parameter("progress", k * 1.5)
				sm.set_shader_parameter("fade", 1.0 - smoothstep(0.6, 1.0, k))
			"ring":
				node.scale = Vector3.ONE * lerp(0.2, f.radius, 1.0 - (1.0 - k) * (1.0 - k))
				(node.material_override as ShaderMaterial).set_shader_parameter("fade", 1.0 - k)
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
	if v.length() < 12.0:
		aim_mesh.visible = false
		return
	var dir := Vector3(v.x, 0, v.y).normalized()
	var form: Dictionary = player.form()
	aim_mesh.visible = true
	aim_mesh.position = player.position + Vector3(0, 0.05, 0)
	aim_mesh.rotation.y = atan2(-dir.x, -dir.z)
	var sm := aim_mesh.material_override as ShaderMaterial
	var spec: Dictionary = form.super if is_super else form.get("attack", {"type": "melee"})
	var kind: String = spec.get("type", "wave" if is_super else "melee")
	var joy: JoyDraw = sup_joy if is_super else atk_joy
	var frac: float = clamp(v.length() / (joy.radius * 0.8), 0.25, 1.0)
	match kind:
		"melee":
			var st: Dictionary = form.combo[0]
			aim_mesh.mesh = _sector_mesh(st.range, st.arc)
		"lob":
			aim_mesh.mesh = _sector_mesh(spec.range * frac + spec.radius, 2.0 * rad_to_deg(atan2(spec.radius, max(0.5, spec.range * frac))), spec.range * frac - spec.radius)
		"nova":
			aim_mesh.mesh = _sector_mesh(spec.range, 359.9)
		"shot":
			aim_mesh.mesh = _sector_mesh(spec.range, max(6.0, spec.get("spread", 0.0) + 6.0))
		"dash":
			aim_mesh.mesh = _sector_mesh(spec.range, 10.0)
		_:
			aim_mesh.mesh = _sector_mesh(spec.range, 8.0 + spec.get("width", 0.5) * 6.0)
	sm.set_shader_parameter("color", Color(1, 0.85, 0.15, 0.45) if is_super else Color(1, 1, 1, 0.45))

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

	gad_btn = JoyDraw.new()
	gad_btn.radius = 46
	gad_btn.color = Color(0.2, 0.6, 0.3, 0.6)
	gad_btn.knob_color = Color(0.4, 1.0, 0.5)
	gad_btn.size = Vector2(130, 130)
	gad_btn.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(gad_btn)
	gad_label = Game.make_label("", 22, Color.WHITE, 6)
	gad_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	gad_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	gad_label.size = Vector2(160, 30)
	hud_root.add_child(gad_label)

	var top := Game.make_panel(Color(0.12, 0.1, 0.25, 0.85))
	top.position = Vector2(0, 0)
	top.set_anchors_preset(Control.PRESET_CENTER_TOP)
	hud_root.add_child(top)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	top.add_child(vb)
	var title := Game.make_label({"team": "3v3 TEAMKAMPF", "showdown": "SHOWDOWN"}.get(mode, "TRAINING"), 30, Color(1, 0.85, 0.2))
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

	score_label = Game.make_label("", 34, Color.WHITE, 10)
	score_label.position = Vector2(20, 230)
	hud_root.add_child(score_label)
	feed_label = Game.make_label("", 20, Color(1, 0.9, 0.8), 6)
	feed_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	feed_label.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	feed_label.position = Vector2(-520, 150)
	feed_label.size = Vector2(500, 140)
	hud_root.add_child(feed_label)
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
	gad_btn.position = Vector2(s.x - 330, s.y - 270) - gad_btn.size / 2.0
	gad_label.position = Vector2(s.x - 330, s.y - 270) + Vector2(-80, 50)

func _zone_at(p: Vector2) -> String:
	var s := get_viewport().get_visible_rect().size
	if p.distance_to(atk_joy.position + atk_joy.size / 2.0) < atk_joy.radius * 1.4:
		return "attack"
	if p.distance_to(sup_joy.position + sup_joy.size / 2.0) < sup_joy.radius * 1.5:
		return "super"
	if p.distance_to(gad_btn.position + gad_btn.size / 2.0) < gad_btn.radius * 1.5:
		return "gadget"
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
			var r: float = attack_range(player.form())
			_aim_frac = _auto_frac(r) if tap else clamp(v.length() / (atk_joy.radius * 0.8), 0.25, 1.0)
			player.try_attack(auto_aim(r + 3.0) if tap else Vector3(v.x, 0, v.y).normalized())
		"gadget":
			player.try_gadget()
		"super":
			var sr: float = player.form().super.range
			_aim_frac = _auto_frac(sr) if tap else clamp(v.length() / (sup_joy.radius * 0.8), 0.25, 1.0)
			player.try_super(auto_aim(14.0) if tap else Vector3(v.x, 0, v.y).normalized())

## Wurfweite beim Antippen: Entfernung zur nächsten Puppe.
func _auto_frac(rng: float) -> float:
	var best := rng
	for d in _targets(player):
		best = min(best, (d.pos - player.position).length())
	return clamp(best / rng, 0.25, 1.0)

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
	var g := player.gadget()
	gad_btn.visible = not g.is_empty()
	gad_label.visible = gad_btn.visible
	if gad_btn.visible:
		gad_btn.dim = player.gadget_uses <= 0 or player.gadget_cd > 0.0
		gad_btn.charge = 1.0 - player.gadget_cd / g.get("cooldown", 5.0) if player.gadget_uses > 0 else 0.0
		gad_label.text = ("%s (∞)" % g.name) if g.get("unlimited", false) else ("%s (%d)" % [g.name, player.gadget_uses])
		gad_btn.queue_redraw()
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
	var hits_text: String = ("Kombo: %d Hieb(e) pro Munition" % f.combo.size()) if f.has("combo") else ("Angriff: " + f.combo_name)
	info_label.text = "%s\nSchaden gesamt: %d\nSuper: %d%%" % [hits_text, int(total_damage), int(player.super_charge * 100)]
	_set_score_text()
	feed_label.text = "\n".join(feed)
	banner_t += delta
	banner.modulate.a = clamp(1.6 - banner_t, 0.0, 1.0)
	banner.scale = Vector2.ONE * lerp(1.5, 1.0, clamp(banner_t / 0.2, 0.0, 1.0))
	banner.pivot_offset = banner.size / 2.0
	_update_bars()

func _set_score_text() -> void:
	match mode:
		"team":
			score_label.text = "Blau %d : %d Rot\n%d:%02d" % [score[0], score[1], int(time_left) / 60, int(time_left) % 60]
		"showdown":
			score_label.text = "Übrig: %d" % fighters.filter(func(x): return x.alive).size()
		_:
			score_label.text = ""
	if not player.alive and respawns.has(player.get_instance_id()):
		score_label.text += "\nWiedereinstieg in %d" % (int(respawns[player.get_instance_id()]) + 1)
	score_label.text = Game.t(score_label.text)

func show_banner(text: String) -> void:
	banner.text = text
	banner_t = 0.0

func _update_bars() -> void:
	var list: Array = fighters.duplicate()
	list.append_array(dummies)
	for o in list:
		var is_player := o is Fighter   # Brawler (Spieler oder Bot) vs. Puppe
		var key: int = o.get_instance_id() if is_player else o.node.get_instance_id()
		var bar: Control
		if not bars.has(key):
			var col := Color(1, 0.45, 0.45)
			if is_player and o == player:
				col = Color(0.4, 1, 0.45)
			elif is_player and o.team == player.team:
				col = Color(0.4, 0.7, 1.0)
			bar = _make_bar(is_player and o == player, o.display_name if is_player else o.name, col)
			bars[key] = bar
		bar = bars[key]
		var wpos: Vector3 = (o.position if is_player else o.pos) + Vector3(0, 2.55, 0)
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
		if is_player and o == player:
			for i in 3:
				var a: ColorRect = bar.get_node("Ammo%d" % i)
				var amt: float = clamp(player.ammo - i, 0.0, 1.0)
				a.size.x = 48.0 * amt
				a.color = Color(1, 0.6, 0.2) if amt >= 1.0 else Color(1, 0.6, 0.2, 0.55)

func _make_bar(is_player: bool, title: String, col := Color(1, 0.45, 0.45)) -> Control:
	var c := Control.new()
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(c)
	hud_root.move_child(c, 0)
	var name_l := Game.make_label(title, 18, col, 6)
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
	fill.color = col
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
	var l := Game.make_label("BETÄUBT!" if amount < 0 else str(int(amount)), 30, color, 8)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud_root.add_child(l)
	l.position = cam.unproject_position(wpos) - Vector2(30, 20) + Vector2(randf_range(-20, 20), 0)
	var tw := l.create_tween()
	tw.set_parallel(true)
	tw.tween_property(l, "position:y", l.position.y - 60, 0.8)
	tw.tween_property(l, "modulate:a", 0.0, 0.8).set_delay(0.3)
	tw.chain().tween_callback(l.queue_free)
