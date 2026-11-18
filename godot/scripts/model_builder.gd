# Baut die 3D-Cartoon-Figur einer Form aus Grundkörpern (Toon-Material mit Umriss).
# Rückgabe: Dictionary mit den animierbaren Teilen (body, head, hand_r, hand_l, foot_l, foot_r, cape, tip).
class_name ModelBuilder

static var _mats := {}
static var _meshes := {}

static func mat(c: Color, outline := true, emissive := false) -> StandardMaterial3D:
	var key := "%s|%s|%s" % [c.to_html(), outline, emissive]
	if _mats.has(key):
		return _mats[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.diffuse_mode = BaseMaterial3D.DIFFUSE_TOON
	m.specular_mode = BaseMaterial3D.SPECULAR_TOON
	m.roughness = 0.7
	m.rim_enabled = true
	m.rim = 0.35
	m.rim_tint = 0.4
	if emissive:
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	if outline:
		var o := StandardMaterial3D.new()
		o.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		o.albedo_color = Color(0.07, 0.05, 0.12)
		o.cull_mode = BaseMaterial3D.CULL_FRONT
		o.grow = true
		o.grow_amount = 0.022
		m.next_pass = o
	_mats[key] = m
	return m

static func mesh(kind: String) -> Mesh:
	if _meshes.has(kind):
		return _meshes[kind]
	var m: Mesh
	match kind:
		"sphere":
			var s := SphereMesh.new(); s.radius = 0.5; s.height = 1.0; s.radial_segments = 20; s.rings = 12; m = s
		"box":
			var b := BoxMesh.new(); b.size = Vector3.ONE; m = b
		"cyl":
			var c := CylinderMesh.new(); c.top_radius = 0.5; c.bottom_radius = 0.5; c.height = 1.0; c.radial_segments = 16; m = c
		"cone":
			var k := CylinderMesh.new(); k.top_radius = 0.0; k.bottom_radius = 0.5; k.height = 1.0; k.radial_segments = 12; m = k
		"torus":
			var t := TorusMesh.new(); t.inner_radius = 0.38; t.outer_radius = 0.5; t.rings = 20; t.ring_segments = 8; m = t
	_meshes[kind] = m
	return m

static func part(parent: Node3D, kind: String, pos: Vector3, scl: Vector3, color: Color, rot := Vector3.ZERO, outline := true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh(kind)
	mi.material_override = mat(color, outline)
	mi.position = pos
	mi.rotation_degrees = rot
	mi.scale = scl
	parent.add_child(mi)
	return mi

static func pivot(parent: Node3D, name: String, pos: Vector3) -> Node3D:
	var n := Node3D.new()
	n.name = name
	n.position = pos
	parent.add_child(n)
	return n

## Figur bauen. Blickrichtung = -Z (Godot-Standard "vorwärts").
static func build(look: Dictionary) -> Dictionary:
	var root := Node3D.new()
	root.name = "Model"
	var body := pivot(root, "Body", Vector3.ZERO)
	var robe: Color = look.robe
	var trim: Color = look.trim
	var skin: Color = look.skin
	var dark := Color(0.08, 0.07, 0.1)
	var white := Color(0.98, 0.98, 1.0)

	# Körper + Robe
	part(body, "sphere", Vector3(0, 0.62, 0), Vector3(0.62, 0.66, 0.54), robe)
	part(body, "cyl", Vector3(0, 0.36, 0), Vector3(0.66, 0.36, 0.6), robe)
	part(body, "torus", Vector3(0, 0.52, 0), Vector3(1.27, 1.6, 1.12), trim, Vector3.ZERO, false)
	part(body, "box", Vector3(0.0, 0.78, -0.27), Vector3(0.36, 0.06, 0.04), trim, Vector3(0, 0, -35), false)
	part(body, "box", Vector3(0.0, 0.78, -0.27), Vector3(0.36, 0.06, 0.04), trim, Vector3(0, 0, 35), false)

	# Kopf
	var head := pivot(body, "Head", Vector3(0, 1.22, 0))
	part(head, "sphere", Vector3.ZERO, Vector3(0.72, 0.68, 0.68), skin)
	_face(head, look, dark, white)
	_hair(head, look)

	# Umhang
	var cape: Node3D = null
	if look.get("cape", false):
		cape = pivot(body, "Cape", Vector3(0, 0.95, 0.24))
		part(cape, "box", Vector3(0, -0.36, 0.02), Vector3(0.62, 0.78, 0.04), trim if look.face == "mask" else dark.lightened(0.05), Vector3(-6, 0, 0))
		part(cape, "box", Vector3(0, -0.36, 0.045), Vector3(0.5, 0.7, 0.02), robe.lightened(0.08), Vector3(-6, 0, 0), false)

	# Hände
	var hand_l := pivot(root, "HandL", Vector3(-0.44, 0.62, -0.08))
	part(hand_l, "sphere", Vector3.ZERO, Vector3.ONE * 0.2, skin)
	var hand_r := pivot(root, "HandR", Vector3(0.44, 0.62, -0.08))
	part(hand_r, "sphere", Vector3.ZERO, Vector3.ONE * 0.2, skin)
	var weapon := pivot(hand_r, "Weapon", Vector3.ZERO)
	var tip := _weapon(weapon, look, dark)

	# Füße
	var foot_l := pivot(root, "FootL", Vector3(-0.17, 0.08, 0))
	part(foot_l, "sphere", Vector3(0, 0, -0.04), Vector3(0.2, 0.15, 0.28), dark)
	var foot_r := pivot(root, "FootR", Vector3(0.17, 0.08, 0))
	part(foot_r, "sphere", Vector3(0, 0, -0.04), Vector3(0.2, 0.15, 0.28), dark)

	return {"root": root, "body": body, "head": head, "hand_l": hand_l, "hand_r": hand_r,
		"weapon": weapon, "foot_l": foot_l, "foot_r": foot_r, "cape": cape, "tip": tip, "height": 1.75}

static func _face(head: Node3D, look: Dictionary, dark: Color, white: Color) -> void:
	if look.face == "mask":
		var bone := Color(0.97, 0.96, 0.92)
		part(head, "sphere", Vector3(0, -0.03, -0.12), Vector3(0.66, 0.62, 0.5), bone)
		for side in [-1, 1]:
			part(head, "box", Vector3(0.13 * side, 0.04, -0.37), Vector3(0.15, 0.05, 0.03), dark, Vector3(0, 0, -12 * side), false)
			part(head, "sphere", Vector3(0.13 * side, 0.04, -0.385), Vector3(0.045, 0.035, 0.02), look.eye, Vector3.ZERO, false)
			part(head, "box", Vector3(0.13 * side, 0.18, -0.33), Vector3(0.03, 0.14, 0.03), look.mark, Vector3(20, 0, 0), false)
			part(head, "box", Vector3(0.18 * side, -0.12, -0.33), Vector3(0.03, 0.15, 0.03), look.mark, Vector3(-20, 0, 15 * side), false)
		for i in range(-2, 3):
			part(head, "box", Vector3(i * 0.045, -0.16, -0.36), Vector3(0.03, 0.06, 0.02), bone.darkened(0.3), Vector3.ZERO, false)
		return
	for side in [-1, 1]:
		var e := Vector3(0.13 * side, 0.03, -0.3)
		part(head, "sphere", e, Vector3(0.13, 0.16, 0.08), white, Vector3.ZERO, false)
		part(head, "sphere", e + Vector3(0, -0.01, -0.035), Vector3(0.075, 0.1, 0.04), look.eye, Vector3.ZERO, false)
		part(head, "sphere", e + Vector3(0.02, 0.03, -0.055), Vector3(0.03, 0.03, 0.02), white, Vector3.ZERO, false)
		part(head, "box", e + Vector3(0, 0.1, -0.02), Vector3(0.15, 0.03, 0.03), dark, Vector3(0, 0, -22 * side), false)
	part(head, "box", Vector3(0, -0.15, -0.31), Vector3(0.1, 0.02, 0.02), dark, Vector3.ZERO, false)

static func _hair(head: Node3D, look: Dictionary) -> void:
	var hc: Color = look.hair
	part(head, "sphere", Vector3(0, 0.1, 0.04), Vector3(0.76, 0.6, 0.74), hc)
	var spikes := 11
	for i in spikes:
		var t := float(i) / (spikes - 1)
		var yaw: float = lerp(-150.0, 150.0, t)
		var pitch: float = lerp(30.0, 58.0, abs(t - 0.5) * 2.0)
		var basis := Basis(Vector3.UP, deg_to_rad(yaw)) * Basis(Vector3.RIGHT, deg_to_rad(pitch))
		var dir := basis * Vector3.UP
		var length := 0.26 + (i % 3) * 0.05
		var mi := MeshInstance3D.new()
		mi.mesh = mesh("cone")
		mi.material_override = mat(hc.lightened((i % 2) * 0.08))
		mi.transform = Transform3D(basis.scaled(Vector3(0.14, length, 0.14)), dir * (0.26 + length * 0.35) + Vector3(0, 0.08, 0.04))
		head.add_child(mi)
	for i in [-1, 0, 1]:
		part(head, "cone", Vector3(i * 0.11, 0.2, -0.27), Vector3(0.1, 0.2, 0.1), hc, Vector3(-140, 0, i * 15))
	if look.hair_style == "spiky_horns":
		var horn := Color(0.95, 0.93, 0.88)
		for side in [-1, 1]:
			part(head, "cone", Vector3(0.22 * side, 0.26, -0.05), Vector3(0.11, 0.3, 0.11), horn, Vector3(-20, 0, -40 * side))
			part(head, "cone", Vector3(0.33 * side, 0.42, -0.1), Vector3(0.07, 0.2, 0.07), horn, Vector3(-35, 0, -15 * side))

## Waffe in der rechten Hand; Klinge zeigt nach -Z. Gibt die Klingenspitze zurück.
static func _weapon(w: Node3D, look: Dictionary, dark: Color) -> Node3D:
	var blade: Color = look.blade
	var trim: Color = look.trim
	match look.weapon:
		"great":
			part(w, "cyl", Vector3(0, 0, 0.07), Vector3(0.07, 0.22, 0.07), dark, Vector3(90, 0, 0))
			part(w, "torus", Vector3(0, 0, -0.06), Vector3(0.45, 0.6, 0.45), trim, Vector3(90, 0, 0))
			part(w, "box", Vector3(0, 0.05, -0.6), Vector3(0.05, 0.28, 0.95), blade)
			part(w, "box", Vector3(0, -0.07, -0.55), Vector3(0.035, 0.04, 0.85), blade.darkened(0.35), Vector3.ZERO, false)
			part(w, "box", Vector3(0, 0.1, -1.08), Vector3(0.05, 0.2, 0.2), blade, Vector3(45, 0, 0))
			part(w, "sphere", Vector3(0, 0, -0.06), Vector3.ONE * 0.08, trim, Vector3.ZERO, false)
		"chain":
			part(w, "cyl", Vector3(0, 0, 0.06), Vector3(0.06, 0.22, 0.06), dark, Vector3(90, 0, 0))
			part(w, "box", Vector3(0, 0, -0.08), Vector3(0.16, 0.16, 0.04), trim, Vector3(0, 0, 45))
			part(w, "box", Vector3(0, 0.03, -0.65), Vector3(0.04, 0.18, 1.05), blade)
			part(w, "box", Vector3(0, 0.11, -0.65), Vector3(0.045, 0.04, 1.05), dark, Vector3.ZERO, false)
			part(w, "cone", Vector3(0, 0.03, -1.22), Vector3(0.06, 0.16, 0.2), blade, Vector3(-90, 0, 0))
			for i in 4:
				part(w, "torus", Vector3(0, -0.05 - i * 0.07, 0.18 + i * 0.03), Vector3.ONE * 0.14, Color(0.6, 0.6, 0.65), Vector3(0, 90 * (i % 2), 90), false)
		_:
			part(w, "cyl", Vector3(0, 0, 0.08), Vector3(0.06, 0.26, 0.06), Color(0.85, 0.85, 0.9), Vector3(90, 0, 0))
			part(w, "box", Vector3(0, 0, -0.08), Vector3(0.2, 0.06, 0.04), trim)
			part(w, "box", Vector3(0, 0.03, -0.72), Vector3(0.035, 0.11, 1.2), blade)
			part(w, "box", Vector3(0, -0.01, -0.72), Vector3(0.04, 0.025, 1.2), trim, Vector3.ZERO, false)
			part(w, "cone", Vector3(0, 0.05, -1.37), Vector3(0.04, 0.16, 0.1), blade, Vector3(-80, 0, 0))
	var tip := pivot(w, "Tip", Vector3(0, 0, -1.2))
	return tip

## Trainingspuppe (Strohpuppe mit Zielscheibe).
static func build_dummy(color: Color) -> Dictionary:
	var root := Node3D.new()
	var body := pivot(root, "Body", Vector3.ZERO)
	var straw := Color(0.9, 0.78, 0.5)
	part(body, "cyl", Vector3(0, 0.35, 0), Vector3(0.12, 0.7, 0.12), Color(0.5, 0.33, 0.2))
	part(body, "sphere", Vector3(0, 0.85, 0), Vector3(0.62, 0.7, 0.55), straw)
	part(body, "torus", Vector3(0, 0.88, -0.27), Vector3(0.7, 0.7, 0.7), color, Vector3(90, 0, 0), false)
	part(body, "sphere", Vector3(0, 0.88, -0.28), Vector3(0.18, 0.18, 0.06), color, Vector3.ZERO, false)
	part(body, "sphere", Vector3(0, 1.38, 0), Vector3(0.5, 0.48, 0.48), straw)
	for side in [-1, 1]:
		part(body, "box", Vector3(0.09 * side, 1.42, -0.23), Vector3(0.08, 0.02, 0.02), Color(0.2, 0.15, 0.1), Vector3(0, 0, 45), false)
		part(body, "box", Vector3(0.09 * side, 1.42, -0.23), Vector3(0.08, 0.02, 0.02), Color(0.2, 0.15, 0.1), Vector3(0, 0, -45), false)
		part(body, "cyl", Vector3(0.42 * side, 0.95, 0), Vector3(0.08, 0.5, 0.08), Color(0.5, 0.33, 0.2), Vector3(0, 0, 90))
	part(root, "cyl", Vector3(0, 0.03, 0), Vector3(0.7, 0.06, 0.7), Color(0.45, 0.4, 0.35))
	return {"root": root, "body": body, "height": 1.7}
