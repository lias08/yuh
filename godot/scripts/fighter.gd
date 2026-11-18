# Spielfigur des Spielers: Werte, Munition, Super-Aufladung, Evolution (4 Formen),
# Kombo-Ausführung und prozedurale Animationen (Laufen, Hiebe, Super, Verwandlung).
class_name Fighter
extends Node3D

signal transformed(form_index: int)

var def: Dictionary
var arena  # Match-Knoten (Treffer, Wellen, Effekte)
var form_index := 0
var super_uses := 0
var hp := 1.0
var max_hp := 1.0
var ammo := 3.0
var super_charge := 0.0
var radius := 0.45
var alive := true
var aim_dir := Vector3(0, 0, -1)
var rig: Dictionary
var damage_dealt := 0.0
var team := 0
var is_bot := false
var display_name := "Du"
var kills := 0
var deaths := 0
var stun_until := 0.0
var slow_until := 0.0
var knock := Vector3.ZERO
var proxy: Dictionary = {}      # Ziel-Eintrag für die Treffererkennung
var gadget_uses := 3
var gadget_cd := 0.0
var shield_until := 0.0
var speed_until := 0.0
var dmg_mult := 1.0
var dmg_mult_until := 0.0
var lifesteal := 0.0
var lifesteal_until := 0.0
var invis_until := 0.0
var buff_color := Color.WHITE
var buff_until := 0.0

const ABILITY_TYPES := ["beam", "zone", "turret", "orbit", "mine", "spin", "leap", "blink", "slam", "buff", "meteor", "barrier", "fan",
	"awaken", "domain", "spirit"]
var awaken_until := 0.0   # Erwachen: Zeitpunkt, an dem die erwachte Form endet

var level := 1

func damage_mult() -> float:
	return (dmg_mult if _time < dmg_mult_until else 1.0) * (1.0 + 0.1 * (level - 1))

func lifesteal_now() -> float:
	return lifesteal if _time < lifesteal_until else 0.0

func invisible() -> bool:
	return _time < invis_until

var _cooldown := 0.0
var _last_damaged := -99.0
var _last_action := -99.0
var _move := 0.0
var _phase := 0.0
var _swing_t := -1.0
var _swing_dur := 0.2
var _swing_dir := "ltr"
var _super_t := -1.0
var _transform_t := -1.0
var _hit_t := -1.0
var _rooted_until := 0.0
var _aura_t := 0.0
var _regen_t := 0.0
var _foot_rest_l := Vector3.ZERO
var _foot_rest_r := Vector3.ZERO
var _time := 0.0

func setup(brawler: Dictionary, match_node, lvl := 1) -> void:
	level = lvl
	def = brawler
	arena = match_node
	apply_form(0, false)
	hp = max_hp
	ammo = def.ammo

func form() -> Dictionary:
	return def.forms[form_index]

func move_speed() -> float:
	return def.speed * form().speed_mul * (1.4 if _time < speed_until else 1.0) * (0.5 if _time < slow_until else 1.0)

func stunned() -> bool:
	return _time < stun_until

## Betäubung/Verlangsamung/Rückstoß von außen (Gegnertreffer).
func apply_status(efx: Dictionary, from: Vector3) -> void:
	if efx.get("stun", 0.0) > 0.0:
		stun_until = max(stun_until, _time + efx.stun)
	if efx.get("slow", 0.0) > 0.0:
		slow_until = max(slow_until, _time + efx.slow)
	if efx.get("knock", 0.0) > 0.0 and from != Vector3.INF:
		var push := position - from
		push.y = 0
		if push.length() > 0.01:
			knock = push.normalized() * efx.knock

func gadget() -> Dictionary:
	return def.get("gadget", {})

## Gadget: begrenzte Einsätze pro Match, kurze Abklingzeit.
func try_gadget() -> bool:
	var g := gadget()
	if g.is_empty() or not alive or gadget_uses <= 0 or gadget_cd > 0.0:
		return false
	if not g.get("unlimited", false):
		gadget_uses -= 1
	gadget_cd = g.get("cooldown", 5.0)
	_super_t = 0.0
	arena.use_gadget(self, g)
	return true

func has_shield() -> bool:
	return _time < shield_until

func now() -> float:
	return _time

func reload_time() -> float:
	return def.reload * form().reload_mul

## Form wechseln: komplettes Modell, Schwert, Werte und Kombo werden ersetzt.
func apply_form(i: int, animate: bool) -> void:
	form_index = clamp(i, 0, def.forms.size() - 1)
	if rig.has("root"):
		rig.root.queue_free()
	rig = ModelBuilder.build(Game.look_for(def, form_index))
	add_child(rig.root)
	_foot_rest_l = rig.foot_l.position
	_foot_rest_r = rig.foot_r.position
	_face(aim_dir)
	var ratio: float = hp / max_hp if max_hp > 0.0 else 1.0
	max_hp = def.hp * form().hp_mul * (1.0 + 0.1 * (level - 1))
	hp = max(1.0, max_hp * ratio)
	if animate:
		_transform_t = 0.0
		_rooted_until = _time + 0.6
		hp = min(max_hp, hp + max_hp * 0.3)
		emit_signal("transformed", form_index)

func _face(dir: Vector3) -> void:
	if dir.length_squared() < 0.0001:
		return
	rig.root.rotation.y = atan2(-dir.x, -dir.z)

func is_rooted() -> bool:
	return _time < _rooted_until or stunned()

# ------------------------------------------------------------------ Bewegung
func update_movement(input: Vector2, delta: float) -> void:
	_time += delta
	if not alive:
		return
	var v := Vector3(input.x, 0, input.y)
	if v.length() > 1.0:
		v = v.normalized()
	if is_rooted():
		v = Vector3.ZERO
	if knock.length() > 0.01:
		var k: Vector3 = knock * min(1.0, delta * 10.0)
		position = arena.move_circle(position, k, radius)
		knock -= k
	var before := position
	position = arena.move_circle(position, v * move_speed() * delta, radius)
	var moved: float = (position - before).length() / max(delta, 0.0001)
	_move = move_toward(_move, clamp(moved / move_speed(), 0.0, 1.0), delta * 8.0)
	if v.length() > 0.05 and _cooldown <= 0.0 and _swing_t < 0.0:
		aim_dir = v.normalized()
	var target_yaw := atan2(-aim_dir.x, -aim_dir.z)
	rig.root.rotation.y = lerp_angle(rig.root.rotation.y, target_yaw, 1.0 - exp(-delta * 18.0))

	# Nachladen & Heilung
	if ammo < def.ammo:
		ammo = min(float(def.ammo), ammo + delta / reload_time())
	_cooldown -= delta
	gadget_cd = max(0.0, gadget_cd - delta)
	# Erwachen läuft ab -> zurück in die Grundform
	if awaken_until > 0.0 and _time >= awaken_until:
		awaken_until = 0.0
		apply_form(0, false)
		arena._ring_fx(position, 2.0, Color(1, 1, 1), 0.3)
	if hp < max_hp and _time - _last_damaged > 3.0 and _time - _last_action > 3.0:
		_regen_t += delta
		if _regen_t >= 1.0:
			_regen_t = 0.0
			heal(max_hp * 0.13)
	_update_aura(delta)

# ------------------------------------------------------------------ Angriffe
## Hauptangriff: die komplette Kombo der aktuellen Form kostet genau 1 Munition.
func try_attack(dir: Vector3) -> bool:
	if not alive or is_rooted() or ammo < 1.0 or _cooldown > 0.0:
		return false
	ammo -= 1.0
	_cooldown = def.cooldown
	_last_action = _time
	if dir.length_squared() > 0.0001:
		aim_dir = dir.normalized()
	_face(aim_dir)
	var atk: Dictionary = form().get("attack", {})
	if not atk.is_empty():
		# Fernkampf: Schuss (mit Salven) oder Wurf
		_swing_t = 0.0; _swing_dur = 0.2; _swing_dir = "thrust" if atk.type in ["shot", "beam", "fan"] else "over"
		invis_until = 0.0  # Angreifen beendet Unsichtbarkeit
		if atk.type in ABILITY_TYPES:
			arena.ability(self, atk, aim_dir, false)
		elif atk.type == "lob":
			arena.throw_lob(self, atk, aim_dir, false)
		else:
			arena.fire_shot(self, atk, aim_dir, false)
		return true
	var combo: Array = form().combo
	for i in combo.size():
		var step: Dictionary = combo[i]
		var next_t: float = combo[i + 1].t if i + 1 < combo.size() else step.t + 0.24
		var dur: float = clamp((next_t - step.t) * 0.95, 0.12, 0.26)
		if step.t <= 0.0:
			_do_step(step, dur)
		else:
			get_tree().create_timer(step.t, false).timeout.connect(func(): _do_step(step, dur))
	return true

func _do_step(step: Dictionary, dur: float) -> void:
	if not alive:
		return
	_swing_t = 0.0
	_swing_dur = dur
	_swing_dir = step.dir
	# kleiner Schritt nach vorne
	position = arena.move_circle(position, aim_dir * 0.18, radius)
	arena.melee_swing(self, step)
	if step.has("wave"):
		arena.spawn_wave(self, step.wave, false)

## Super: Formen 1–3 → Welle + Verwandlung in die nächste Form; Form 4 → Finale Welle (wiederholbar).
func try_super(dir: Vector3) -> bool:
	if not alive or is_rooted() or super_charge < 1.0:
		return false
	super_charge = 0.0
	super_uses += 1
	if arena.has_method("voice"):
		arena.voice(self, "super")
	_last_action = _time
	if dir.length_squared() > 0.0001:
		aim_dir = dir.normalized()
	_face(aim_dir)
	var sup: Dictionary = form().super
	var stype: String = sup.get("type", "wave")
	if stype != "wave":
		_super_t = 0.0
		if stype in ABILITY_TYPES:
			if stype != "buff":
				invis_until = 0.0
			arena.ability(self, sup, aim_dir, true)
			if sup.get("buff_after", {}).size() > 0:
				arena.ability(self, sup.buff_after, aim_dir, true)
			return true
		match stype:
			"shot": arena.fire_shot(self, sup, aim_dir, true)
			"lob": arena.throw_lob(self, sup, aim_dir, true)
			"dash": arena.dash(self, sup, aim_dir)
			"nova": arena.nova(self, sup)
		return true
	if sup.get("charge", 0.0) > 0.0:
		_rooted_until = _time + sup.charge + 0.2
		_super_t = 0.0
		arena.charge_effect(self, sup)
		get_tree().create_timer(sup.charge, false).timeout.connect(func():
			if alive:
				_swing_t = 0.0; _swing_dur = 0.3; _swing_dir = "over"
				arena.spawn_wave(self, sup, true))
	else:
		_super_t = 0.0
		arena.spawn_wave(self, sup, true)
		if form_index < def.forms.size() - 1 and not def.get("no_evolve", false):
			apply_form(form_index + 1, true)
	return true

## Super-Aufladung durch Schaden an Gegnern (wie im Vorbild: X volle Kombos = 1 Super).
func add_charge(damage: float) -> void:
	var per_use: float = attack_damage(form())
	var was_ready := super_charge >= 1.0
	super_charge = min(1.0, super_charge + damage / (per_use * def.charge_hits))
	if not was_ready and super_charge >= 1.0:
		Game.play_sfx("ready", 0.8)

## Schaden einer kompletten Angriffsaktion (für Super-Aufladung und Anzeige).
static func attack_damage(f: Dictionary) -> float:
	var atk: Dictionary = f.get("attack", {})
	if not atk.is_empty():
		if atk.has("dps"):
			return atk.dps * atk.get("dur", 2.0) * 0.6
		if atk.type in ["lob", "beam", "mine", "slam", "blink", "leap"]:
			return atk.dmg * (1.0 + float(atk.get("chain", 0)) * 0.5) * float(atk.get("hits", 1)) * float(atk.get("waves", 1))
		if atk.type == "fan":
			return atk.dmg * atk.get("count", 3) * 0.6
		return atk.dmg * atk.get("count", 1) * atk.get("burst", 1) * (0.6 if atk.get("count", 1) > 2 else 1.0)
	var total := 0.0
	for s in f.combo:
		total += s.dmg + (s.wave.dmg if s.has("wave") else 0.0)
	return total

## Kurzer Sturmangriff (vom Match gesteuert).
func dash_move(delta_pos: Vector3) -> void:
	position = arena.move_circle(position, delta_pos, radius)
	_move = 1.0

func take_damage(amount: float) -> void:
	if not alive:
		return
	if has_shield():
		amount *= 0.35
	hp -= amount
	_last_damaged = _time
	_hit_t = 0.0
	if hp <= 0.0:
		hp = 0.0
		alive = false
		visible = false

func heal(amount: float) -> void:
	hp = min(max_hp, hp + amount)

func respawn(pos: Vector3) -> void:
	position = pos
	stun_until = 0.0
	slow_until = 0.0
	knock = Vector3.ZERO
	invis_until = 0.0
	if awaken_until > 0.0:
		awaken_until = 0.0
		apply_form(0, false)
	dmg_mult_until = 0.0
	lifesteal_until = 0.0
	alive = true
	visible = true
	hp = max_hp
	ammo = def.ammo

func _update_aura(delta: float) -> void:
	var c: Color = form().aura
	if c.a <= 0.01:
		return
	_aura_t -= delta
	if _aura_t <= 0.0:
		_aura_t = 0.09
		arena.aura_particle(global_position + Vector3(randf_range(-0.4, 0.4), randf_range(0.2, 1.6), randf_range(-0.4, 0.4)), c)

# ------------------------------------------------------------------ Animation
func _process(delta: float) -> void:
	if not rig.has("root"):
		return
	var t := Time.get_ticks_msec() / 1000.0
	var stance: float = form().stance
	_phase += delta * lerp(0.0, 13.0, _move) * (1.0 + stance * 0.2)
	var s1 := sin(_phase)
	var body: Node3D = rig.body
	var bob: float = abs(s1) * 0.08 * _move + sin(t * 2.6) * 0.015 * (1.0 - _move)
	var lean := -0.15 * _move - stance * 0.08
	var yaw_extra := 0.0
	var scale_pulse := 1.0

	# Hand-Ruheposition
	var hr := Vector3(0.52, 0.66 - stance * 0.05, -0.16 - stance * 0.12) + Vector3(0, sin(t * 2.6) * 0.02, -s1 * 0.14 * _move)
	var hl := Vector3(-0.52, 0.64, -0.08) + Vector3(0, sin(t * 2.6 + 1.0) * 0.02, s1 * 0.14 * _move)
	var wrot := Vector3(-0.35 - stance * 0.3, 0.0, 0.0)

	# Schwerthiebe
	if _swing_t >= 0.0:
		_swing_t += delta
		var k: float = clamp(_swing_t / _swing_dur, 0.0, 1.0)
		var e := smoothstep(0.0, 1.0, k)
		match _swing_dir:
			"ltr", "rtl":
				var a0 := -85.0 if _swing_dir == "ltr" else 85.0
				var a := deg_to_rad(lerp(a0, -a0, e))
				hr = Vector3(sin(a) * 0.62, 0.8, -cos(a) * 0.58)
				wrot = Vector3(0, -a, 0)
				yaw_extra = -a * 0.25
				hl = hl.lerp(hr * Vector3(0.4, 1, 1), 0.4)
			"thrust":
				hr = Vector3(0.3, 0.8, lerp(-0.3, -0.7, sin(k * PI)))
				wrot = Vector3(0, 0, 0)
			_:
				hr = Vector3(0.2, lerp(1.6, 0.6, e), -0.5)
				wrot = Vector3(deg_to_rad(lerp(80.0, -15.0, e)), 0, 0)
				lean -= sin(k * PI) * 0.25
		if k >= 1.0:
			_swing_t = -1.0

	# Super: Sprung + Drehung
	if _super_t >= 0.0:
		_super_t += delta
		var k2: float = clamp(_super_t / 0.5, 0.0, 1.0)
		bob += sin(k2 * PI) * 0.45
		yaw_extra += k2 * TAU
		if k2 >= 1.0:
			_super_t = -1.0

	# Verwandlung: Aufsteigen, doppelte Drehung, Pulsieren
	if _transform_t >= 0.0:
		_transform_t += delta
		var k3: float = clamp(_transform_t / 0.8, 0.0, 1.0)
		bob += sin(k3 * PI) * 0.7
		yaw_extra += k3 * TAU * 2.0
		scale_pulse = 1.0 + sin(k3 * PI) * 0.2
		hr.y += sin(k3 * PI) * 0.5
		hl.y += sin(k3 * PI) * 0.5
		if k3 >= 1.0:
			_transform_t = -1.0

	# Treffer: kurzes Stauchen
	if _hit_t >= 0.0:
		_hit_t += delta
		var k4: float = clamp(_hit_t / 0.15, 0.0, 1.0)
		scale_pulse *= 1.0 - sin(k4 * PI) * 0.08
		if k4 >= 1.0:
			_hit_t = -1.0

	body.position = Vector3(0, bob, 0)
	body.rotation = Vector3(lean, yaw_extra, 0)
	rig.root.scale = Vector3.ONE * scale_pulse
	rig.hand_r.position = rig.hand_r.position.lerp(hr + Vector3(0, bob * 0.6, 0), 1.0 if _swing_t >= 0.0 else 1.0 - exp(-delta * 20.0))
	rig.hand_l.position = rig.hand_l.position.lerp(hl + Vector3(0, bob * 0.6, 0), 1.0 - exp(-delta * 20.0))
	rig.weapon.rotation = wrot
	rig.foot_l.position = _foot_rest_l + Vector3(0, max(0.0, cos(_phase)) * 0.12 * _move, s1 * 0.18 * _move)
	rig.foot_r.position = _foot_rest_r + Vector3(0, max(0.0, -cos(_phase)) * 0.12 * _move, -s1 * 0.18 * _move)
	if rig.cape != null:
		rig.cape.rotation.x = 0.35 * _move + abs(s1) * 0.08 * _move
	ModelBuilder.update_limbs(rig)
