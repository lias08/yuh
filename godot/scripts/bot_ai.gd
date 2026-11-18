# Bot-KI für Gegner und Verbündete: sucht Ziele, hält passende Distanz, weicht seitlich aus,
# umgeht Hindernisse, greift mit leichter Ungenauigkeit an, nutzt Super und Gadget.
class_name BotAI
extends RefCounted

var skill := 0.6
var _react := 0.0
var _strafe := 1.0
var _strafe_t := 0.0
var _avoid := 0.0
var _last_pos := Vector3.ZERO
var _stuck_t := 0.0

func _init(s: float = 0.6) -> void:
	skill = s
	_react = randf_range(0.3, 0.8)

## Liefert die Bewegungsrichtung (Joystick-Wert) und löst Angriffe direkt aus.
func think(f: Fighter, m, delta: float) -> Vector2:
	if not f.alive:
		return Vector2.ZERO
	_react -= delta
	_strafe_t -= delta
	if _strafe_t <= 0.0:
		_strafe_t = randf_range(0.8, 1.8)
		_strafe = -1.0 if randf() < 0.5 else 1.0
	var target = m.nearest_enemy(f)
	var move := Vector3.ZERO
	if target == null:
		move = (Vector3.ZERO - f.position)
		move.y = 0
		return Vector2(move.x, move.z).normalized() if move.length() > 1.0 else Vector2.ZERO
	var to: Vector3 = target.pos - f.position
	to.y = 0
	var dist := to.length()
	var dir: Vector3 = to / max(dist, 0.001)
	var rng: float = m.attack_range(f.form())
	var melee: bool = f.form().has("combo")
	var desired: float = 1.4 if melee else rng * 0.75
	var low_hp: bool = f.hp < f.max_hp * 0.25
	if low_hp:
		move = -dir
	elif dist > desired + 0.6:
		move = dir
	elif dist < desired - 1.2:
		move = -dir
	move += Vector3(-dir.z, 0, dir.x) * _strafe * 0.6
	# Showdown: vor der Giftwolke in Richtung Mitte fliehen
	if m.mode == "showdown":
		var flat := Vector3(f.position.x, 0, f.position.z)
		if flat.length() > m.gas_r - 2.5:
			move = -flat.normalized() * 1.5 + move * 0.3
	# Hängt an einer Wand fest? Richtung drehen.
	if (f.position - _last_pos).length() < 0.02 and move.length() > 0.1:
		_stuck_t += delta
	else:
		_stuck_t = 0.0
	if _stuck_t > 0.3:
		_avoid = 0.8
		_stuck_t = 0.0
		_strafe = -_strafe
	if _avoid > 0.0:
		_avoid -= delta
		move = Vector3(-dir.z, 0, dir.x) * _strafe + dir * 0.3
	_last_pos = f.position

	# Angreifen
	if _react <= 0.0 and not f.is_rooted():
		var aim: Vector3 = dir.rotated(Vector3.UP, deg_to_rad(randf_range(-10.0, 10.0) * (1.0 - skill)))
		if f.super_charge >= 1.0 and dist <= m.super_range(f) * 0.9:
			m._aim_frac = clamp(dist / max(m.super_range(f), 1.0), 0.25, 1.0)
			f.try_super(aim)
			_react = randf_range(0.4, 0.8)
		elif dist <= rng + 0.4 and f.ammo >= 1.0:
			m._aim_frac = clamp(dist / max(rng, 1.0), 0.25, 1.0)
			f.try_attack(aim)
			_react = randf_range(0.35, 0.75) * (1.4 - skill)
		if low_hp and f.gadget_uses > 0 and randf() < 0.3:
			f.try_gadget()
		elif f.gadget().get("type", "") == "swap" and randf() < 0.15:
			f.try_gadget()
	return Vector2(move.x, move.z).normalized() if move.length() > 0.05 else Vector2.ZERO
