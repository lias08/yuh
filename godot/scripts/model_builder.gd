# Baut die 3D-Cartoon-Figuren (eigener Stil: große Köpfe, große Augen, runde Formen) mit einem
# eigenen Toon-Shader (weiche Licht/Schatten-Kante, farbiger Schatten, Randlicht, Glanzpunkt)
# und dünnem Umriss. Arme und Beine werden pro Frame zwischen Schulter/Hüfte und Hand/Fuß gespannt.
class_name ModelBuilder

static var _mats := {}
static var _meshes := {}
static var _toon: Shader
static var _outline: Shader

const TOON_CODE := """
shader_type spatial;
render_mode cull_back, specular_disabled;
uniform vec4 albedo : source_color = vec4(1.0);
uniform vec4 shade_tint : source_color = vec4(0.62, 0.55, 0.85, 1.0);
uniform float rim_strength = 0.45;
uniform float gloss = 0.35;
uniform float emission = 0.0;
uniform bool use_vc = false;
varying vec3 tint;
void vertex() {
	tint = use_vc ? mix(COLOR.rgb, vec3(0.45, 0.4, 0.75), 0.35) : shade_tint.rgb;
}
void fragment() {
	ALBEDO = use_vc ? COLOR.rgb : albedo.rgb;
	EMISSION = ALBEDO * emission;
}
void light() {
	float ndl = dot(NORMAL, LIGHT);
	float lit = smoothstep(-0.05, 0.12, ndl) * mix(0.25, 1.0, ATTENUATION);
	vec3 col = mix(tint * 0.75, vec3(1.0), lit);
	DIFFUSE_LIGHT += col * LIGHT_COLOR / PI * 0.85;
	float rim = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 3.0);
	DIFFUSE_LIGHT += vec3(rim) * rim_strength * 0.5 * (0.4 + 0.6 * lit) * LIGHT_COLOR / PI;
	vec3 h = normalize(LIGHT + VIEW);
	float spec = smoothstep(0.93, 0.97, dot(NORMAL, h)) * gloss * lit;
	SPECULAR_LIGHT += vec3(spec) * LIGHT_COLOR / PI;
}
"""

const OUTLINE_CODE := """
shader_type spatial;
render_mode unshaded, cull_front;
uniform vec4 color : source_color = vec4(0.09, 0.06, 0.14, 1.0);
uniform float width = 0.018;
void vertex() { VERTEX += NORMAL * width; }
void fragment() { ALBEDO = color.rgb; }
"""

static func mat(c: Color, outline := true, emissive := false) -> Material:
	var key := "%s|%s|%s" % [c.to_html(), outline, emissive]
	if _mats.has(key):
		return _mats[key]
	if _toon == null:
		_toon = Shader.new(); _toon.code = TOON_CODE
		_outline = Shader.new(); _outline.code = OUTLINE_CODE
	var m := ShaderMaterial.new()
	m.shader = _toon
	m.set_shader_parameter("albedo", c)
	# Schatten leicht in Richtung Lila/Blau verschoben (Comic-Look), dunkle Farben weniger
	m.set_shader_parameter("shade_tint", c.lerp(Color(0.45, 0.4, 0.75), 0.35))
	m.set_shader_parameter("emission", 0.6 if emissive else 0.0)
	if outline:
		var o := ShaderMaterial.new()
		o.shader = _outline
		m.next_pass = o
	_mats[key] = m
	return m

static func mesh(kind: String) -> Mesh:
	if _meshes.has(kind):
		return _meshes[kind]
	var m: Mesh
	match kind:
		"sphere":
			var s := SphereMesh.new(); s.radius = 0.5; s.height = 1.0; s.radial_segments = 28; s.rings = 16; m = s
		"box":
			var b := BoxMesh.new(); b.size = Vector3.ONE; m = b
		"cyl":
			var c := CylinderMesh.new(); c.top_radius = 0.5; c.bottom_radius = 0.5; c.height = 1.0; c.radial_segments = 24; m = c
		"taper":
			var t := CylinderMesh.new(); t.top_radius = 0.36; t.bottom_radius = 0.5; t.height = 1.0; t.radial_segments = 24; m = t
		"cone":
			var k := CylinderMesh.new(); k.top_radius = 0.0; k.bottom_radius = 0.5; k.height = 1.0; k.radial_segments = 16; m = k
		"torus":
			var tr := TorusMesh.new(); tr.inner_radius = 0.38; tr.outer_radius = 0.5; tr.rings = 28; tr.ring_segments = 10; m = tr
		"capsule":
			var cp := CapsuleMesh.new(); cp.radius = 0.5; cp.height = 2.0; cp.radial_segments = 16; cp.rings = 6; m = cp
		"rbox":
			m = _rounded_box()
	_meshes[kind] = m
	return m

## Abgerundeter Würfel (für Wände, Kisten): Kugel-Projektion eines unterteilten Würfels.
static func _rounded_box() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var n := 6
	var r := 0.12
	var dirs := [Vector3.UP, Vector3.DOWN, Vector3.LEFT, Vector3.RIGHT, Vector3.FORWARD, Vector3.BACK]
	for d in dirs:
		var u: Vector3 = Vector3.FORWARD if abs(d.y) > 0.5 else Vector3.UP
		var v: Vector3 = d.cross(u)
		for i in n:
			for j in n:
				var quad := []
				for c in [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]]:
					var p: Vector3 = d * 0.5 + u * (float(c[0]) / n - 0.5) + v * (float(c[1]) / n - 0.5)
					var inner := Vector3(clamp(p.x, -0.5 + r, 0.5 - r), clamp(p.y, -0.5 + r, 0.5 - r), clamp(p.z, -0.5 + r, 0.5 - r))
					var nn := (p - inner).normalized()
					quad.append([inner + nn * r, nn])
				for idx in [0, 2, 1, 0, 3, 2]:
					st.set_normal(quad[idx][1])
					st.add_vertex(quad[idx][0])
	return st.commit()

static func part(parent: Node3D, kind: String, pos: Vector3, scl: Vector3, color: Color, rot := Vector3.ZERO, outline := true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh(kind)
	mi.material_override = mat(color, outline)
	mi.position = pos
	mi.rotation_degrees = rot
	mi.scale = scl
	mi.set_meta("col", color)
	mi.set_meta("ol", outline)
	parent.add_child(mi)
	return mi

static var _vc_mats := {}

static func _vc_mat(outline: bool) -> Material:
	if _vc_mats.has(outline):
		return _vc_mats[outline]
	mat(Color.WHITE)  # Shader laden
	var m := ShaderMaterial.new()
	m.shader = _toon
	m.set_shader_parameter("use_vc", true)
	if outline:
		var o := ShaderMaterial.new()
		o.shader = _outline
		m.next_pass = o
	_vc_mats[outline] = m
	return m

## Leistung: Fasst alle einfachen Teile unter jedem Gelenk zu je einem Mesh (mit Vertex-Farben) zusammen.
## Aus ~150 Draw-Calls pro Figur werden so ~20 – entscheidend für Handys und den Browser.
static func merge_tree(node: Node) -> void:
	var groups := {true: [], false: []}
	for c in node.get_children():
		if c is MeshInstance3D and c.has_meta("col"):
			groups[bool(c.get_meta("ol"))].append(c)
		elif c is Node3D:
			merge_tree(c)
	for ol in groups:
		var list: Array = groups[ol]
		if list.size() < 2:
			continue
		var verts := PackedVector3Array()
		var norms := PackedVector3Array()
		var cols := PackedColorArray()
		var idx := PackedInt32Array()
		for mi in list:
			var arr: Array = (mi.mesh as Mesh).surface_get_arrays(0)
			var xf: Transform3D = mi.transform
			var nb: Basis = xf.basis.inverse().transposed()
			var flip: bool = xf.basis.determinant() < 0.0
			var base := verts.size()
			var col: Color = mi.get_meta("col")
			var v: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
			var n: PackedVector3Array = arr[Mesh.ARRAY_NORMAL]
			for i in v.size():
				verts.append(xf * v[i])
				norms.append((nb * n[i]).normalized())
				cols.append(col)
			var ix = arr[Mesh.ARRAY_INDEX]
			if ix == null or (ix as PackedInt32Array).is_empty():
				for i in range(0, v.size(), 3):
					if flip:
						idx.append_array([base + i, base + i + 2, base + i + 1])
					else:
						idx.append_array([base + i, base + i + 1, base + i + 2])
			else:
				var pi: PackedInt32Array = ix
				for i in range(0, pi.size(), 3):
					if flip:
						idx.append_array([base + pi[i], base + pi[i + 2], base + pi[i + 1]])
					else:
						idx.append_array([base + pi[i], base + pi[i + 1], base + pi[i + 2]])
			node.remove_child(mi)
			mi.queue_free()
		var arrays := []
		arrays.resize(Mesh.ARRAY_MAX)
		arrays[Mesh.ARRAY_VERTEX] = verts
		arrays[Mesh.ARRAY_NORMAL] = norms
		arrays[Mesh.ARRAY_COLOR] = cols
		arrays[Mesh.ARRAY_INDEX] = idx
		var am := ArrayMesh.new()
		am.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
		var merged := MeshInstance3D.new()
		merged.name = "Merged" + ("O" if ol else "")
		merged.mesh = am
		merged.material_override = _vc_mat(ol)
		node.add_child(merged)

static func pivot(parent: Node3D, name: String, pos: Vector3) -> Node3D:
	var n := Node3D.new()
	n.name = name
	n.position = pos
	parent.add_child(n)
	return n

## Figur bauen. Blickrichtung = -Z.
static func build(look: Dictionary) -> Dictionary:
	var root := Node3D.new()
	root.name = "Model"
	var body := pivot(root, "Body", Vector3.ZERO)
	var robe: Color = look.robe
	var trim: Color = look.trim
	var skin: Color = look.skin
	if "beard" in look.get("acc", []):
		look = look.duplicate()
		look["beard"] = true
	var dark := Color(0.1, 0.08, 0.13)
	var white := Color(1, 1, 1)

	# ---- Rumpf: Robe (unten breit), Oberkörper, Gürtel mit Knoten, Kragen
	part(body, "taper", Vector3(0, 0.4, 0), Vector3(0.78, 0.42, 0.66), robe)
	part(body, "sphere", Vector3(0, 0.72, 0), Vector3(0.72, 0.62, 0.58), robe)
	part(body, "torus", Vector3(0, 0.56, 0), Vector3(0.84, 0.9, 0.72), trim, Vector3.ZERO, false)
	part(body, "sphere", Vector3(0.12, 0.54, -0.3), Vector3(0.14, 0.1, 0.08), trim, Vector3.ZERO, false)
	part(body, "box", Vector3(-0.07, 0.86, -0.27), Vector3(0.2, 0.06, 0.05), trim, Vector3(0, 0, 55), false)
	part(body, "box", Vector3(0.07, 0.86, -0.27), Vector3(0.2, 0.06, 0.05), trim, Vector3(0, 0, -55), false)
	part(body, "box", Vector3(0.0, 0.73, -0.29), Vector3(0.12, 0.2, 0.04), skin, Vector3.ZERO, false)
	var shoulder_l := pivot(body, "ShoulderL", Vector3(-0.32, 0.86, 0))
	var shoulder_r := pivot(body, "ShoulderR", Vector3(0.32, 0.86, 0))
	part(shoulder_l, "sphere", Vector3.ZERO, Vector3.ONE * 0.24, robe)
	part(shoulder_r, "sphere", Vector3.ZERO, Vector3.ONE * 0.24, robe)
	var hip_l := pivot(body, "HipL", Vector3(-0.15, 0.3, 0))
	var hip_r := pivot(body, "HipR", Vector3(0.15, 0.3, 0))

	# ---- Kopf (groß, Chibi-Proportionen)
	var head := pivot(body, "Head", Vector3(0, 1.38, 0))
	part(head, "sphere", Vector3.ZERO, Vector3(0.9, 0.84, 0.84), skin)
	part(head, "sphere", Vector3(-0.44, -0.02, 0.0), Vector3(0.12, 0.18, 0.1), skin)
	part(head, "sphere", Vector3(0.44, -0.02, 0.0), Vector3(0.12, 0.18, 0.1), skin)
	_face(head, look, dark, white)
	_hair(head, look)
	_accessories(body, head, look)

	# ---- Umhang
	var cape: Node3D = null
	if look.get("cape", false):
		cape = pivot(body, "Cape", Vector3(0, 1.0, 0.24))
		var cape_col: Color = trim if look.face == "mask" else Color(0.1, 0.1, 0.14)
		part(cape, "box", Vector3(0, -0.42, 0.03), Vector3(0.7, 0.9, 0.05), cape_col, Vector3(-6, 0, 0))
		part(cape, "box", Vector3(0, -0.42, 0.06), Vector3(0.58, 0.82, 0.02), robe.lightened(0.1), Vector3(-6, 0, 0), false)

	# ---- Hände (Handschuhe) + Waffe
	var hand_l := pivot(root, "HandL", Vector3(-0.5, 0.62, -0.08))
	part(hand_l, "sphere", Vector3.ZERO, Vector3.ONE * 0.22, skin)
	var hand_r := pivot(root, "HandR", Vector3(0.5, 0.62, -0.08))
	part(hand_r, "sphere", Vector3.ZERO, Vector3.ONE * 0.22, skin)
	var weapon := pivot(hand_r, "Weapon", Vector3.ZERO)
	var tip := _weapon(weapon, look, dark)

	# ---- Füße (Stiefel)
	var foot_l := pivot(root, "FootL", Vector3(-0.17, 0.08, 0))
	part(foot_l, "sphere", Vector3(0, 0, -0.05), Vector3(0.22, 0.16, 0.32), dark)
	var foot_r := pivot(root, "FootR", Vector3(0.17, 0.08, 0))
	part(foot_r, "sphere", Vector3(0, 0, -0.05), Vector3(0.22, 0.16, 0.32), dark)

	# ---- Arme & Beine (werden in update_limbs gespannt)
	var arm_l := _limb(root, robe)
	var arm_r := _limb(root, robe)
	var leg_l := _limb(root, robe.darkened(0.2))
	var leg_r := _limb(root, robe.darkened(0.2))

	var size: float = look.get("size", 1.0)
	root.scale = Vector3.ONE * size
	var rig := {"root": root, "body": body, "head": head, "hand_l": hand_l, "hand_r": hand_r,
		"weapon": weapon, "foot_l": foot_l, "foot_r": foot_r, "cape": cape, "tip": tip, "height": 1.95,
		"shoulder_l": shoulder_l, "shoulder_r": shoulder_r, "hip_l": hip_l, "hip_r": hip_r,
		"arm_l": arm_l, "arm_r": arm_r, "leg_l": leg_l, "leg_r": leg_r}
	rig["height"] = 1.95 * size
	merge_tree(root)
	return rig

static func _limb(parent: Node3D, color: Color) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh("capsule")
	mi.material_override = mat(color)
	parent.add_child(mi)
	return mi

## Spannt Arme/Beine als Kapseln zwischen den Gelenken (pro Frame aufrufen).
static func update_limbs(rig: Dictionary) -> void:
	var root: Node3D = rig.root
	if not root.is_inside_tree():
		return
	var inv := root.global_transform.affine_inverse()
	_stretch(rig.arm_l, inv * rig.shoulder_l.global_position, inv * rig.hand_l.global_position, 0.17)
	_stretch(rig.arm_r, inv * rig.shoulder_r.global_position, inv * rig.hand_r.global_position, 0.17)
	_stretch(rig.leg_l, inv * rig.hip_l.global_position, inv * rig.foot_l.global_position, 0.19)
	_stretch(rig.leg_r, inv * rig.hip_r.global_position, inv * rig.foot_r.global_position, 0.19)

static func _stretch(mi: MeshInstance3D, a: Vector3, b: Vector3, thickness: float) -> void:
	var d := b - a
	var length: float = max(d.length(), 0.01)
	var y := d / length
	var ref := Vector3.FORWARD if abs(y.dot(Vector3.FORWARD)) < 0.95 else Vector3.RIGHT
	var x := y.cross(ref).normalized()
	var z := x.cross(y)
	# Kapsel: Höhe 2 (inkl. Kappen), Radius 0.5 → auf Länge und Dicke skalieren
	var sy: float = max(length / 2.0, thickness)
	mi.transform = Transform3D(Basis(x * thickness * 2.0, y * sy, z * thickness * 2.0), (a + b) / 2.0)

static func _face(head: Node3D, look: Dictionary, dark: Color, white: Color) -> void:
	if look.face == "mask":
		var bone: Color = look.get("mask_color", Color(0.97, 0.96, 0.92))
		part(head, "sphere", Vector3(0, -0.04, -0.16), Vector3(0.84, 0.78, 0.6), bone)
		for side in [-1, 1]:
			part(head, "sphere", Vector3(0.17 * side, 0.05, -0.44), Vector3(0.2, 0.08, 0.05), dark, Vector3(0, 0, -14 * side), false)
			part(head, "sphere", Vector3(0.17 * side, 0.05, -0.465), Vector3(0.06, 0.045, 0.02), look.eye, Vector3.ZERO, false)
			part(head, "box", Vector3(0.17 * side, 0.24, -0.39), Vector3(0.04, 0.18, 0.04), look.mark, Vector3(22, 0, 0), false)
			part(head, "box", Vector3(0.24 * side, -0.16, -0.38), Vector3(0.04, 0.2, 0.04), look.mark, Vector3(-22, 0, 16 * side), false)
		for i in range(-3, 4):
			part(head, "box", Vector3(i * 0.05, -0.22, -0.42), Vector3(0.035, 0.08, 0.03), bone.darkened(0.3), Vector3.ZERO, false)
		return
	if look.face == "goggles":
		part(head, "torus", Vector3(0, 0.08, -0.05), Vector3(0.95, 0.5, 0.92), Color(0.25, 0.22, 0.2), Vector3(-8, 0, 0), false)
		for side in [-1, 1]:
			part(head, "cyl", Vector3(0.16 * side, 0.06, -0.4), Vector3(0.24, 0.08, 0.24), Color(0.35, 0.3, 0.25), Vector3(90, 0, 0))
			part(head, "cyl", Vector3(0.16 * side, 0.06, -0.445), Vector3(0.18, 0.02, 0.18), Color(0.55, 0.85, 1.0), Vector3(90, 0, 0), false)
		part(head, "sphere", Vector3(0, -0.2, -0.39), Vector3(0.18, 0.08, 0.05), Color(0.45, 0.12, 0.15), Vector3.ZERO, false)
		return
	if look.face == "ninja":
		for side in [-1, 1]:
			var e := Vector3(0.15 * side, 0.06, -0.39)
			part(head, "sphere", e, Vector3(0.16, 0.13, 0.06), white, Vector3(0, 0, -10 * side), false)
			part(head, "sphere", e + Vector3(0, 0, -0.03), Vector3(0.08, 0.09, 0.03), look.eye, Vector3.ZERO, false)
			part(head, "box", e + Vector3(0, 0.12, -0.01), Vector3(0.17, 0.035, 0.03), dark, Vector3(0, 0, -18 * side), false)
		part(head, "sphere", Vector3(0, -0.2, -0.2), Vector3(0.84, 0.42, 0.56), look.trim.darkened(0.45))
		return
	if look.face == "visor":
		part(head, "box", Vector3(0, 0.05, -0.4), Vector3(0.62, 0.16, 0.1), Color(0.15, 0.2, 0.3))
		part(head, "box", Vector3(0, 0.06, -0.455), Vector3(0.52, 0.06, 0.02), look.eye, Vector3.ZERO, false)
		part(head, "sphere", Vector3(0, -0.2, -0.38), Vector3(0.14, 0.05, 0.04), Color(0.3, 0.3, 0.4), Vector3.ZERO, false)
		return
	if look.face == "robot":
		part(head, "rbox", Vector3(0, 0.02, -0.36), Vector3(0.62, 0.34, 0.14), Color(0.12, 0.14, 0.2))
		for side in [-1, 1]:
			part(head, "box", Vector3(0.14 * side, 0.05, -0.44), Vector3(0.14, 0.08, 0.02), look.eye.lightened(0.3), Vector3.ZERO, false)
		part(head, "box", Vector3(0, -0.08, -0.44), Vector3(0.22, 0.03, 0.02), look.eye.lightened(0.3), Vector3.ZERO, false)
		return
	if look.face == "cyclops":
		part(head, "sphere", Vector3(0, 0.05, -0.36), Vector3(0.34, 0.36, 0.12), white, Vector3.ZERO, false)
		part(head, "sphere", Vector3(0, 0.04, -0.42), Vector3(0.2, 0.22, 0.06), look.eye, Vector3.ZERO, false)
		part(head, "sphere", Vector3(0, 0.04, -0.45), Vector3(0.1, 0.12, 0.03), Color(0.03, 0.03, 0.06), Vector3.ZERO, false)
		part(head, "sphere", Vector3(0.05, 0.11, -0.46), Vector3(0.06, 0.06, 0.02), white, Vector3.ZERO, false)
		part(head, "box", Vector3(0, 0.27, -0.36), Vector3(0.34, 0.05, 0.04), look.hair.darkened(0.45), Vector3.ZERO, false)
		part(head, "sphere", Vector3(0, -0.22, -0.37), Vector3(0.22, 0.08, 0.05), Color(0.45, 0.12, 0.15), Vector3.ZERO, false)
		return
	if look.face == "shades":
		part(head, "box", Vector3(0, 0.06, -0.42), Vector3(0.66, 0.05, 0.04), dark, Vector3.ZERO, false)
		for side in [-1, 1]:
			part(head, "rbox", Vector3(0.16 * side, 0.03, -0.42), Vector3(0.24, 0.15, 0.05), Color(0.08, 0.08, 0.14), Vector3(0, 0, 6 * side))
			part(head, "box", Vector3(0.12 * side, 0.07, -0.45), Vector3(0.07, 0.03, 0.01), Color(0.6, 0.8, 1.0), Vector3(0, 0, 30), false)
		part(head, "sphere", Vector3(0.05, -0.19, -0.38), Vector3(0.2, 0.07, 0.05), Color(0.45, 0.12, 0.15), Vector3(0, 0, 10), false)
		part(head, "sphere", Vector3(0, -0.07, -0.42), Vector3(0.05, 0.04, 0.04), look.skin.darkened(0.08), Vector3.ZERO, false)
		return
	if look.face == "sleepy":
		for side in [-1, 1]:
			part(head, "box", Vector3(0.16 * side, 0.0, -0.39), Vector3(0.16, 0.035, 0.03), dark, Vector3(0, 0, 8 * side), false)
			part(head, "sphere", Vector3(0.25 * side, -0.1, -0.35), Vector3(0.1, 0.06, 0.03), Color(1.0, 0.55, 0.6), Vector3.ZERO, false)
		part(head, "sphere", Vector3(0, -0.18, -0.39), Vector3(0.12, 0.06, 0.04), Color(0.45, 0.12, 0.15), Vector3.ZERO, false)
		if look.get("beard", false):
			part(head, "sphere", Vector3(0, -0.3, -0.24), Vector3(0.62, 0.36, 0.42), look.hair)
		return
	var fangs: bool = look.face == "fangs"
	var patch: bool = look.face == "eyepatch"
	var happy: bool = look.face == "happy"
	for side in [-1, 1]:
		var e := Vector3(0.16 * side, 0.02, -0.37)
		if patch and side == 1:
			part(head, "sphere", e + Vector3(0, 0, -0.02), Vector3(0.2, 0.2, 0.06), dark, Vector3.ZERO, false)
			part(head, "box", Vector3(0, 0.12, -0.3), Vector3(0.95, 0.03, 0.03), dark, Vector3(0, 0, -22), false)
			continue
		part(head, "sphere", e, Vector3(0.18, 0.24, 0.08), white, Vector3(0, 0, 0), false)
		part(head, "sphere", e + Vector3(-0.01 * side, -0.02, -0.035), Vector3(0.12, 0.16, 0.05), look.eye, Vector3.ZERO, false)
		part(head, "sphere", e + Vector3(-0.01 * side, -0.03, -0.05), Vector3(0.06, 0.08, 0.03), Color(0.03, 0.03, 0.06), Vector3.ZERO, false)
		part(head, "sphere", e + Vector3(0.025, 0.05, -0.065), Vector3(0.05, 0.05, 0.02), white, Vector3.ZERO, false)
		part(head, "sphere", e + Vector3(-0.03, -0.06, -0.065), Vector3(0.025, 0.025, 0.01), white, Vector3.ZERO, false)
		part(head, "box", e + Vector3(0.01 * side, 0.17 + (0.03 if happy else 0.0), -0.02), Vector3(0.2, 0.045, 0.04), look.hair.darkened(0.45), Vector3(0, 0, (8 if happy else -20) * side), false)
	# Mund (entschlossenes Grinsen) + Nase
	if happy:
		part(head, "sphere", Vector3(0, -0.19, -0.38), Vector3(0.2, 0.1, 0.05), Color(0.45, 0.12, 0.15), Vector3.ZERO, false)
		part(head, "sphere", Vector3(0, -0.22, -0.395), Vector3(0.1, 0.04, 0.03), Color(1.0, 0.5, 0.55), Vector3.ZERO, false)
	else:
		part(head, "sphere", Vector3(0.04, -0.2, -0.39), Vector3(0.16, 0.06, 0.04), Color(0.45, 0.12, 0.15), Vector3(0, 0, 8), false)
	if fangs:
		for side in [-1, 1]:
			part(head, "cone", Vector3(0.06 * side, -0.24, -0.4), Vector3(0.04, 0.07, 0.03), white, Vector3(180, 0, 0), false)
	if look.get("beard", false):
		part(head, "sphere", Vector3(0, -0.3, -0.24), Vector3(0.62, 0.36, 0.42), look.hair)
	part(head, "sphere", Vector3(0, -0.07, -0.42), Vector3(0.05, 0.04, 0.04), look.skin.darkened(0.08), Vector3.ZERO, false)

static func dark_c() -> Color:
	return Color(0.1, 0.08, 0.13)

static func _hair(head: Node3D, look: Dictionary) -> void:
	var hc: Color = look.hair
	var hat: Color = look.get("hat", look.trim)
	match look.hair_style:
		"mohawk":
			part(head, "sphere", Vector3(0, 0.1, 0.06), Vector3(0.9, 0.6, 0.86), look.skin.darkened(0.05))
			for i in 6:
				var z := -0.3 + i * 0.13
				part(head, "cone", Vector3(0, 0.42 - abs(z) * 0.25, z), Vector3(0.1, 0.34, 0.2), hc.lightened((i % 2) * 0.1), Vector3(-40 + i * 16, 0, 0))
			return
		"afro":
			part(head, "sphere", Vector3(0, 0.2, 0.08), Vector3(1.3, 1.05, 1.2), hc)
			for i in 8:
				var a := i / 8.0 * TAU
				part(head, "sphere", Vector3(cos(a) * 0.5, 0.3 + sin(a * 2.0) * 0.06, sin(a) * 0.45 + 0.08), Vector3.ONE * 0.42, hc.lightened(0.06))
			return
		"long":
			part(head, "sphere", Vector3(0, 0.12, 0.06), Vector3(0.95, 0.76, 0.92), hc)
			part(head, "sphere", Vector3(0, 0.22, -0.3), Vector3(0.74, 0.26, 0.3), hc, Vector3(-15, 0, 0))
			part(head, "capsule", Vector3(0, -0.3, 0.3), Vector3(0.78, 0.42, 0.34), hc)
			for side in [-1, 1]:
				part(head, "capsule", Vector3(0.38 * side, -0.25, -0.12), Vector3(0.2, 0.3, 0.2), hc)
			return
		"topknot":
			part(head, "sphere", Vector3(0, 0.12, 0.06), Vector3(0.92, 0.72, 0.88), hc)
			part(head, "sphere", Vector3(0, 0.56, 0.06), Vector3.ONE * 0.3, hc)
			part(head, "cyl", Vector3(0, 0.44, 0.06), Vector3(0.2, 0.06, 0.2), look.trim, Vector3.ZERO, false)
			return
		"cowboy":
			part(head, "sphere", Vector3(0, 0.0, 0.08), Vector3(0.9, 0.6, 0.85), hc)
			part(head, "cyl", Vector3(0, 0.28, 0.0), Vector3(1.5, 0.05, 1.4), hat)
			part(head, "taper", Vector3(0, 0.46, 0.0), Vector3(0.78, 0.36, 0.72), hat)
			part(head, "cyl", Vector3(0, 0.33, 0.0), Vector3(0.8, 0.07, 0.74), look.trim, Vector3.ZERO, false)
			return
		"pirate":
			part(head, "sphere", Vector3(0, 0.0, 0.08), Vector3(0.9, 0.6, 0.85), hc)
			part(head, "sphere", Vector3(0, 0.32, 0.0), Vector3(0.95, 0.42, 0.9), hat)
			part(head, "cyl", Vector3(0, 0.3, 0.0), Vector3(1.35, 0.06, 1.0), hat.darkened(0.15))
			for side in [-1, 1]:
				part(head, "box", Vector3(0.52 * side, 0.42, 0.0), Vector3(0.08, 0.26, 0.9), hat.darkened(0.1), Vector3(0, 0, 25 * side))
			part(head, "box", Vector3(0, 0.42, -0.5), Vector3(0.9, 0.22, 0.06), hat.darkened(0.1), Vector3(-25, 0, 0))
			part(head, "sphere", Vector3(0, 0.44, -0.54), Vector3(0.14, 0.12, 0.04), Color(0.95, 0.95, 0.9), Vector3.ZERO, false)
			return
		"tophat":
			part(head, "sphere", Vector3(0, 0.0, 0.08), Vector3(0.9, 0.62, 0.85), hc)
			part(head, "cyl", Vector3(0, 0.3, 0.0), Vector3(1.1, 0.05, 1.05), hat)
			part(head, "cyl", Vector3(0, 0.62, 0.0), Vector3(0.66, 0.6, 0.64), hat)
			part(head, "cyl", Vector3(0, 0.4, 0.0), Vector3(0.68, 0.1, 0.66), look.trim, Vector3.ZERO, false)
			return
		"knight":
			part(head, "sphere", Vector3(0, 0.06, 0.0), Vector3(1.04, 1.0, 1.0), Color(0.72, 0.74, 0.8))
			part(head, "box", Vector3(0, 0.04, -0.47), Vector3(0.6, 0.06, 0.06), dark_c(), Vector3.ZERO, false)
			part(head, "box", Vector3(0, 0.3, -0.25), Vector3(0.08, 0.55, 0.5), Color(0.82, 0.84, 0.9), Vector3(-30, 0, 0))
			part(head, "cone", Vector3(0, 0.6, 0.25), Vector3(0.18, 0.6, 0.24), hc, Vector3(40, 0, 0))
			return
		"viking":
			part(head, "sphere", Vector3(0, 0.0, 0.08), Vector3(0.95, 0.7, 0.9), hc)
			part(head, "sphere", Vector3(0, 0.2, 0.0), Vector3(0.98, 0.7, 0.96), Color(0.6, 0.62, 0.68))
			part(head, "torus", Vector3(0, 0.12, 0.0), Vector3(1.0, 0.8, 0.98), look.trim, Vector3.ZERO, false)
			for side in [-1, 1]:
				part(head, "cone", Vector3(0.5 * side, 0.4, 0.0), Vector3(0.14, 0.45, 0.14), Color(0.96, 0.94, 0.85), Vector3(0, 0, -55 * side))
			return
		"samurai":
			part(head, "sphere", Vector3(0, 0.18, 0.02), Vector3(1.0, 0.76, 0.98), Color(0.18, 0.16, 0.2))
			part(head, "cyl", Vector3(0, 0.08, 0.1), Vector3(1.2, 0.08, 1.1), Color(0.22, 0.2, 0.25), Vector3(12, 0, 0))
			for side in [-1, 1]:
				part(head, "cone", Vector3(0.18 * side, 0.6, -0.28), Vector3(0.08, 0.5, 0.05), look.trim, Vector3(-20, 0, -30 * side))
			part(head, "sphere", Vector3(0, 0.38, -0.42), Vector3.ONE * 0.12, look.trim, Vector3.ZERO, false)
			return
		"astro":
			part(head, "sphere", Vector3(0, 0.04, 0.0), Vector3(1.12, 1.08, 1.08), Color(0.95, 0.95, 0.98))
			part(head, "sphere", Vector3(0, 0.04, -0.2), Vector3(0.8, 0.62, 0.72), Color(0.12, 0.18, 0.35))
			part(head, "sphere", Vector3(-0.15, 0.16, -0.54), Vector3(0.16, 0.08, 0.03), Color(0.7, 0.85, 1.0), Vector3(0, 0, 20), false)
			part(head, "torus", Vector3(0, -0.4, 0.0), Vector3(0.9, 0.9, 0.9), look.trim, Vector3.ZERO, false)
			part(head, "cyl", Vector3(0.36, 0.5, 0.1), Vector3(0.04, 0.3, 0.04), Color(0.7, 0.7, 0.75))
			part(head, "sphere", Vector3(0.36, 0.68, 0.1), Vector3.ONE * 0.08, Color(1, 0.3, 0.3), Vector3.ZERO, false)
			return
		"pumpkin":
			var pc := Color(1.0, 0.55, 0.12)
			for i in 6:
				var a := i / 6.0 * TAU
				part(head, "sphere", Vector3(cos(a) * 0.14, 0.02, sin(a) * 0.14), Vector3(0.75, 0.9, 0.75), pc.darkened((i % 2) * 0.08))
			part(head, "cyl", Vector3(0, 0.5, 0), Vector3(0.1, 0.18, 0.1), Color(0.35, 0.55, 0.2))
			for side in [-1, 1]:
				part(head, "cone", Vector3(0.17 * side, 0.1, -0.5), Vector3(0.16, 0.14, 0.04), Color(1.0, 0.9, 0.3), Vector3(90, 0, 0), false)
			part(head, "box", Vector3(0, -0.14, -0.52), Vector3(0.4, 0.07, 0.03), Color(1.0, 0.9, 0.3), Vector3.ZERO, false)
			return
		"robot":
			part(head, "rbox", Vector3(0, 0.02, 0.0), Vector3(1.0, 0.92, 0.94), Color(0.62, 0.66, 0.72))
			part(head, "box", Vector3(0, 0.4, 0.0), Vector3(0.7, 0.06, 0.7), look.trim, Vector3.ZERO, false)
			for side in [-1, 1]:
				part(head, "cyl", Vector3(0.52 * side, 0.0, 0.0), Vector3(0.18, 0.08, 0.18), look.trim, Vector3(0, 0, 90))
			part(head, "cyl", Vector3(0, 0.6, 0), Vector3(0.04, 0.3, 0.04), Color(0.5, 0.5, 0.55))
			part(head, "sphere", Vector3(0, 0.78, 0), Vector3.ONE * 0.1, look.eye.lightened(0.3), Vector3.ZERO, false)
			return
		"bunny", "cat":
			part(head, "sphere", Vector3(0, 0.12, 0.06), Vector3(0.94, 0.72, 0.9), hc)
			for side in [-1, 1]:
				if look.hair_style == "bunny":
					part(head, "capsule", Vector3(0.18 * side, 0.68, 0.05), Vector3(0.16, 0.3, 0.1), hc, Vector3(0, 0, -10 * side))
					part(head, "capsule", Vector3(0.18 * side, 0.68, 0.0), Vector3(0.08, 0.24, 0.06), Color(1, 0.7, 0.75), Vector3(0, 0, -10 * side), false)
				else:
					part(head, "cone", Vector3(0.28 * side, 0.46, 0.0), Vector3(0.22, 0.28, 0.12), hc, Vector3(0, 0, -20 * side))
					part(head, "cone", Vector3(0.28 * side, 0.45, -0.04), Vector3(0.12, 0.18, 0.05), Color(1, 0.7, 0.75), Vector3(0, 0, -20 * side), false)
			return
		"beanie":
			part(head, "sphere", Vector3(0, 0.0, 0.08), Vector3(0.9, 0.62, 0.85), hc)
			part(head, "sphere", Vector3(0, 0.2, 0.02), Vector3(0.96, 0.7, 0.94), hat)
			part(head, "torus", Vector3(0, 0.08, 0.02), Vector3(0.98, 0.9, 0.96), hat.darkened(0.15), Vector3.ZERO, false)
			part(head, "sphere", Vector3(0, 0.58, 0.02), Vector3.ONE * 0.2, look.trim)
			return
		"mushroom":
			part(head, "sphere", Vector3(0, 0.0, 0.08), Vector3(0.9, 0.6, 0.85), hc)
			part(head, "sphere", Vector3(0, 0.3, 0.0), Vector3(1.45, 0.8, 1.4), hat)
			for i in 6:
				var a := i / 6.0 * TAU + 0.4
				part(head, "sphere", Vector3(cos(a) * 0.45, 0.48, sin(a) * 0.42), Vector3(0.2, 0.12, 0.2), Color(1, 1, 0.96), Vector3.ZERO, false)
			part(head, "sphere", Vector3(0, 0.66, 0.0), Vector3(0.24, 0.1, 0.24), Color(1, 1, 0.96), Vector3.ZERO, false)
			return
		"flame":
			part(head, "sphere", Vector3(0, 0.12, 0.05), Vector3(0.94, 0.72, 0.9), hc)
			for i in 9:
				var t := float(i) / 8.0
				var x: float = lerp(-0.35, 0.35, t)
				var h: float = 0.4 + sin(t * PI) * 0.35
				var c: Color = hc.lerp(Color(1.0, 0.9, 0.3), t * 0.6 if i % 2 == 0 else 0.0)
				part(head, "cone", Vector3(x, 0.38 + h * 0.4, 0.05 + abs(x) * 0.2), Vector3(0.2, h, 0.22), c, Vector3(10, 0, -x * 50))
			return
		"bald":
			part(head, "sphere", Vector3(0, 0.3, 0.12), Vector3(0.5, 0.2, 0.4), hc)
			return
		"ponytail":
			part(head, "sphere", Vector3(0, 0.12, 0.06), Vector3(0.94, 0.76, 0.9), hc)
			part(head, "sphere", Vector3(0, 0.22, -0.3), Vector3(0.7, 0.26, 0.3), hc, Vector3(-15, 0, 0))
			part(head, "sphere", Vector3(0, 0.34, 0.44), Vector3(0.18, 0.18, 0.18), look.trim, Vector3.ZERO, false)
			part(head, "capsule", Vector3(0, 0.05, 0.62), Vector3(0.24, 0.32, 0.24), hc, Vector3(35, 0, 0))
			return
		"hood":
			part(head, "sphere", Vector3(0, 0.06, 0.06), Vector3(1.02, 0.98, 0.98), look.robe)
			part(head, "cone", Vector3(0, 0.3, 0.5), Vector3(0.4, 0.5, 0.4), look.robe, Vector3(-60, 0, 0))
			part(head, "torus", Vector3(0, 0.02, -0.26), Vector3(0.82, 0.75, 0.55), look.trim, Vector3(90, 0, 0), false)
			return
		"cap":
			part(head, "sphere", Vector3(0, 0.0, 0.08), Vector3(0.9, 0.6, 0.85), hc)
			part(head, "sphere", Vector3(0, 0.2, 0.0), Vector3(0.94, 0.62, 0.92), hat)
			part(head, "cyl", Vector3(0, 0.2, -0.42), Vector3(0.6, 0.05, 0.42), hat.darkened(0.2), Vector3(-10, 0, 0))
			part(head, "sphere", Vector3(0, 0.5, 0.0), Vector3.ONE * 0.1, look.trim, Vector3.ZERO, false)
			return
		"helmet":
			part(head, "sphere", Vector3(0, 0.12, 0.02), Vector3(1.0, 0.82, 0.98), hc)
			part(head, "torus", Vector3(0, 0.02, 0.0), Vector3(1.05, 0.6, 1.0), hc.darkened(0.25), Vector3.ZERO, false)
			part(head, "cyl", Vector3(0, 0.52, 0.0), Vector3(0.12, 0.12, 0.12), look.trim)
			return
		"wizard":
			part(head, "sphere", Vector3(0, 0.0, 0.1), Vector3(0.92, 0.75, 0.88), hc)
			part(head, "cyl", Vector3(0, 0.3, 0.0), Vector3(1.25, 0.05, 1.25), hat)
			part(head, "cone", Vector3(0, 0.68, 0.05), Vector3(0.7, 0.8, 0.7), hat, Vector3(-12, 0, 8))
			part(head, "cyl", Vector3(0, 0.36, 0.0), Vector3(0.72, 0.1, 0.72), look.trim, Vector3.ZERO, false)
			return
	part(head, "sphere", Vector3(0, 0.12, 0.05), Vector3(0.94, 0.72, 0.9), hc)
	# Große, gebündelte Stacheln
	var spikes := 13
	for i in spikes:
		var t := float(i) / (spikes - 1)
		var yaw: float = lerp(-160.0, 160.0, t)
		var pitch: float = lerp(25.0, 62.0, abs(t - 0.5) * 2.0)
		var basis := Basis(Vector3.UP, deg_to_rad(yaw)) * Basis(Vector3.RIGHT, deg_to_rad(pitch))
		var dir := basis * Vector3.UP
		var length := 0.34 + (i % 3) * 0.07
		var mi := MeshInstance3D.new()
		mi.mesh = mesh("cone")
		mi.material_override = mat(hc.lightened((i % 2) * 0.1))
		mi.set_meta("col", hc.lightened((i % 2) * 0.1))
		mi.set_meta("ol", true)
		mi.transform = Transform3D(basis.scaled(Vector3(0.2, length, 0.2)), dir * (0.3 + length * 0.35) + Vector3(0, 0.1, 0.05))
		head.add_child(mi)
	# Pony
	for i in [-1, 0, 1]:
		part(head, "cone", Vector3(i * 0.15, 0.24, -0.33), Vector3(0.15, 0.26, 0.13), hc, Vector3(-145, 0, i * 18))
	if look.hair_style == "spiky_horns":
		var horn: Color = look.get("horn_color", Color(0.96, 0.94, 0.88))
		for side in [-1, 1]:
			part(head, "cone", Vector3(0.28 * side, 0.34, -0.06), Vector3(0.14, 0.38, 0.14), horn, Vector3(-18, 0, -40 * side))
			part(head, "cone", Vector3(0.42 * side, 0.55, -0.12), Vector3(0.09, 0.26, 0.09), horn, Vector3(-32, 0, -14 * side))

## Accessoires (aus Skins oder Brawler-Daten): look.acc = ["crown", "wings", ...]
static func _accessories(body: Node3D, head: Node3D, look: Dictionary) -> void:
	var acc: Array = look.get("acc", [])
	var ac: Color = look.get("acc_color", Color(1.0, 0.82, 0.25))
	var trim: Color = look.trim
	for a in acc:
		match a:
			"crown":
				part(head, "cyl", Vector3(0, 0.5, 0.02), Vector3(0.5, 0.14, 0.5), ac)
				for i in 5:
					var ang := i / 5.0 * TAU
					part(head, "cone", Vector3(cos(ang) * 0.22, 0.65, sin(ang) * 0.22 + 0.02), Vector3(0.1, 0.18, 0.1), ac)
				part(head, "sphere", Vector3(0, 0.5, -0.24), Vector3(0.08, 0.08, 0.04), Color(0.9, 0.15, 0.3), Vector3.ZERO, false)
			"halo":
				part(head, "torus", Vector3(0, 0.78, 0.05), Vector3(0.5, 0.5, 0.5), Color(1.0, 0.95, 0.55), Vector3(10, 0, 0), false)
			"horns":
				for side in [-1, 1]:
					part(head, "cone", Vector3(0.24 * side, 0.42, -0.08), Vector3(0.12, 0.34, 0.12), look.get("horn_color", Color(0.96, 0.94, 0.88)), Vector3(-15, 0, -35 * side))
			"antenna":
				for side in [-1, 1]:
					part(head, "cyl", Vector3(0.16 * side, 0.55, 0), Vector3(0.03, 0.3, 0.03), Color(0.2, 0.2, 0.25), Vector3(0, 0, -15 * side), false)
					part(head, "sphere", Vector3(0.21 * side, 0.72, 0), Vector3.ONE * 0.09, trim)
			"flower":
				for i in 5:
					var ang := i / 5.0 * TAU
					part(head, "sphere", Vector3(-0.36 + cos(ang) * 0.07, 0.3 + sin(ang) * 0.07, -0.12), Vector3(0.09, 0.09, 0.04), Color(1, 0.55, 0.75), Vector3.ZERO, false)
				part(head, "sphere", Vector3(-0.36, 0.3, -0.14), Vector3.ONE * 0.06, Color(1, 0.9, 0.3), Vector3.ZERO, false)
			"mustache":
				for side in [-1, 1]:
					part(head, "sphere", Vector3(0.09 * side, -0.13, -0.41), Vector3(0.16, 0.06, 0.06), look.hair, Vector3(0, 0, 15 * side))
			"wings":
				var wc: Color = look.get("wing_color", Color(1, 1, 1))
				for side in [-1, 1]:
					var piv := pivot(body, "Wing", Vector3(0.12 * side, 0.85, 0.3))
					piv.rotation_degrees = Vector3(0, 25 * side, 0)
					part(piv, "sphere", Vector3(0.38 * side, 0.18, 0.05), Vector3(0.7, 0.36, 0.08), wc, Vector3(0, 0, 25 * side))
					part(piv, "sphere", Vector3(0.3 * side, -0.05, 0.06), Vector3(0.5, 0.22, 0.07), wc.darkened(0.08), Vector3(0, 0, 10 * side))
			"bat_wings":
				for side in [-1, 1]:
					for i in 3:
						part(body, "cone", Vector3((0.3 + i * 0.2) * side, 0.95 - i * 0.05, 0.36), Vector3(0.22, 0.6 - i * 0.1, 0.04), Color(0.2, 0.08, 0.15), Vector3(0, 0, (60 + i * 25) * side))
			"pauldrons":
				for side in [-1, 1]:
					part(body, "sphere", Vector3(0.34 * side, 0.92, 0), Vector3(0.36, 0.22, 0.34), look.get("armor_color", Color(0.75, 0.77, 0.82)))
					part(body, "torus", Vector3(0.34 * side, 0.88, 0), Vector3(0.36, 0.4, 0.34), trim, Vector3.ZERO, false)
			"spikes":
				for side in [-1, 1]:
					for i in 2:
						part(body, "cone", Vector3((0.3 + i * 0.08) * side, 1.0, -0.02 + i * 0.1), Vector3(0.09, 0.22, 0.09), Color(0.92, 0.9, 0.85), Vector3(0, 0, -30 * side))
			"scarf":
				part(body, "torus", Vector3(0, 1.0, 0), Vector3(0.62, 0.9, 0.56), look.get("scarf_color", Color(0.85, 0.15, 0.2)))
				part(body, "box", Vector3(0.12, 0.8, 0.3), Vector3(0.12, 0.42, 0.04), look.get("scarf_color", Color(0.85, 0.15, 0.2)), Vector3(-15, 0, -10))
			"backpack":
				part(body, "rbox", Vector3(0, 0.75, 0.36), Vector3(0.46, 0.5, 0.24), look.get("pack_color", Color(0.55, 0.38, 0.22)))
				part(body, "box", Vector3(0, 0.82, 0.49), Vector3(0.3, 0.16, 0.04), trim, Vector3.ZERO, false)
			"jetpack":
				for side in [-1, 1]:
					part(body, "cyl", Vector3(0.14 * side, 0.78, 0.38), Vector3(0.2, 0.52, 0.2), Color(0.72, 0.74, 0.8))
					part(body, "cone", Vector3(0.14 * side, 0.45, 0.38), Vector3(0.16, 0.2, 0.16), Color(1.0, 0.6, 0.15), Vector3(180, 0, 0), false)
					part(body, "sphere", Vector3(0.14 * side, 1.06, 0.38), Vector3.ONE * 0.2, trim)
			"tail":
				for i in 5:
					part(body, "sphere", Vector3(0, 0.35 - i * 0.04 + i * i * 0.012, 0.32 + i * 0.12), Vector3.ONE * (0.2 - i * 0.02), look.hair if i < 4 else look.hair.lightened(0.3))
			"bowtie":
				for side in [-1, 1]:
					part(body, "cone", Vector3(0.08 * side, 0.98, -0.3), Vector3(0.12, 0.12, 0.06), look.get("scarf_color", Color(0.85, 0.15, 0.2)), Vector3(0, 0, 90 * side))
			"medal":
				part(body, "torus", Vector3(0, 0.98, -0.02), Vector3(0.6, 0.6, 0.52), Color(0.85, 0.2, 0.25), Vector3(-10, 0, 0), false)
				part(body, "cyl", Vector3(0, 0.74, -0.32), Vector3(0.16, 0.03, 0.16), ac, Vector3(90, 0, 0))

## Waffe in der rechten Hand; Klinge zeigt nach -Z. Gibt die Klingenspitze zurück.
static func _weapon(w: Node3D, look: Dictionary, dark: Color) -> Node3D:
	var blade: Color = look.blade
	var trim: Color = look.trim
	match look.weapon:
		"great":
			part(w, "cyl", Vector3(0, 0, 0.08), Vector3(0.08, 0.24, 0.08), dark, Vector3(90, 0, 0))
			part(w, "torus", Vector3(0, 0, -0.06), Vector3(0.5, 0.7, 0.5), trim, Vector3(90, 0, 0))
			part(w, "box", Vector3(0, 0.06, -0.65), Vector3(0.06, 0.32, 1.05), blade)
			part(w, "box", Vector3(0, -0.08, -0.6), Vector3(0.04, 0.05, 0.95), blade.darkened(0.35), Vector3.ZERO, false)
			part(w, "box", Vector3(0, 0.11, -1.16), Vector3(0.06, 0.22, 0.22), blade, Vector3(45, 0, 0))
			part(w, "sphere", Vector3(0, 0, -0.06), Vector3.ONE * 0.09, trim, Vector3.ZERO, false)
		"chain":
			part(w, "cyl", Vector3(0, 0, 0.07), Vector3(0.07, 0.24, 0.07), dark, Vector3(90, 0, 0))
			part(w, "box", Vector3(0, 0, -0.08), Vector3(0.18, 0.18, 0.05), trim, Vector3(0, 0, 45))
			part(w, "box", Vector3(0, 0.03, -0.7), Vector3(0.045, 0.2, 1.12), blade)
			part(w, "box", Vector3(0, 0.12, -0.7), Vector3(0.05, 0.045, 1.12), dark, Vector3.ZERO, false)
			part(w, "cone", Vector3(0, 0.03, -1.31), Vector3(0.07, 0.18, 0.22), blade, Vector3(-90, 0, 0))
			for i in 4:
				part(w, "torus", Vector3(0, -0.05 - i * 0.07, 0.2 + i * 0.03), Vector3.ONE * 0.15, Color(0.65, 0.65, 0.7), Vector3(0, 90 * (i % 2), 90), false)
		"blaster":
			part(w, "rbox", Vector3(0, 0.08, -0.2), Vector3(0.18, 0.18, 0.46), Color(0.3, 0.32, 0.4))
			part(w, "cyl", Vector3(0, 0.08, -0.46), Vector3(0.15, 0.1, 0.15), Color(0.2, 0.22, 0.28), Vector3(90, 0, 0))
			part(w, "torus", Vector3(0, 0.08, -0.3), Vector3.ONE * 0.32, blade, Vector3(90, 0, 0), false)
			part(w, "sphere", Vector3(0, 0.2, -0.12), Vector3(0.12, 0.08, 0.2), blade, Vector3.ZERO, false)
		"daggers":
			part(w, "cyl", Vector3(0, 0, 0.04), Vector3(0.05, 0.16, 0.05), dark, Vector3(90, 0, 0))
			part(w, "box", Vector3(0, 0, -0.04), Vector3(0.16, 0.04, 0.04), trim)
			part(w, "box", Vector3(0, 0.02, -0.3), Vector3(0.035, 0.09, 0.46), blade)
			part(w, "cone", Vector3(0, 0.02, -0.57), Vector3(0.04, 0.12, 0.08), blade, Vector3(-90, 0, 0))
		"fists":
			part(w, "rbox", Vector3(0, 0, -0.05), Vector3(0.42, 0.38, 0.42), blade)
			for i in 3:
				part(w, "sphere", Vector3((i - 1) * 0.12, 0.1, -0.24), Vector3.ONE * 0.13, blade.lightened(0.1))
			part(w, "torus", Vector3(0, 0, 0.12), Vector3(0.5, 0.5, 0.5), trim, Vector3(90, 0, 0), false)
		"pistol":
			part(w, "box", Vector3(0, 0.07, -0.2), Vector3(0.1, 0.12, 0.38), Color(0.35, 0.35, 0.42))
			part(w, "box", Vector3(0, -0.04, -0.06), Vector3(0.09, 0.18, 0.1), trim, Vector3(15, 0, 0))
			part(w, "cyl", Vector3(0, 0.07, -0.4), Vector3(0.07, 0.06, 0.07), Color(1, 0.8, 0.3), Vector3(90, 0, 0), false)
		"shotgun":
			for x in [-0.04, 0.04]:
				part(w, "cyl", Vector3(x, 0.07, -0.32), Vector3(0.08, 0.6, 0.08), Color(0.3, 0.3, 0.36), Vector3(90, 0, 0))
			part(w, "box", Vector3(0, 0.03, 0.05), Vector3(0.12, 0.14, 0.3), Color(0.55, 0.32, 0.18), Vector3(10, 0, 0))
		"bomb":
			part(w, "sphere", Vector3(0, 0.12, -0.1), Vector3.ONE * 0.34, Color(0.15, 0.15, 0.2))
			part(w, "cyl", Vector3(0, 0.32, -0.1), Vector3(0.04, 0.1, 0.04), Color(0.85, 0.75, 0.5), Vector3.ZERO, false)
			part(w, "sphere", Vector3(0, 0.39, -0.1), Vector3.ONE * 0.08, Color(1, 0.7, 0.2), Vector3.ZERO, false)
		"staff":
			part(w, "cyl", Vector3(0, 0.25, -0.05), Vector3(0.06, 1.0, 0.06), Color(0.5, 0.32, 0.2), Vector3(12, 0, 0))
			part(w, "sphere", Vector3(0, 0.78, -0.16), Vector3.ONE * 0.24, blade)
			part(w, "torus", Vector3(0, 0.78, -0.16), Vector3.ONE * 0.36, trim, Vector3(90, 0, 0), false)
		"axe":
			part(w, "cyl", Vector3(0, 0.1, -0.2), Vector3(0.07, 0.9, 0.07), Color(0.5, 0.33, 0.2), Vector3(-80, 0, 0))
			part(w, "cyl", Vector3(0.0, 0.18, -0.58), Vector3(0.5, 0.06, 0.42), blade, Vector3(0, 0, 90))
			part(w, "box", Vector3(0, 0.12, -0.58), Vector3(0.08, 0.14, 0.16), trim, Vector3.ZERO, false)
		"scythe":
			part(w, "cyl", Vector3(0, 0.2, -0.05), Vector3(0.06, 1.4, 0.06), Color(0.3, 0.22, 0.18), Vector3(15, 0, 0))
			for i in 5:
				var a := deg_to_rad(i * 22.0)
				part(w, "box", Vector3(0, 0.88 - (1.0 - cos(a)) * 0.35, -0.22 - sin(a) * 0.5), Vector3(0.04, 0.12 - i * 0.015, 0.2), blade, Vector3(-i * 22.0, 0, 0))
		"trident", "spear":
			part(w, "cyl", Vector3(0, 0.05, -0.3), Vector3(0.06, 1.5, 0.06), Color(0.55, 0.4, 0.25) if look.weapon == "spear" else trim, Vector3(-90, 0, 0))
			if look.weapon == "spear":
				part(w, "cone", Vector3(0, 0.05, -1.15), Vector3(0.12, 0.3, 0.08), blade, Vector3(-90, 0, 0))
				part(w, "box", Vector3(0, -0.05, -0.95), Vector3(0.03, 0.2, 0.06), Color(0.9, 0.2, 0.2), Vector3(20, 0, 0), false)
			else:
				part(w, "box", Vector3(0, 0.05, -1.02), Vector3(0.36, 0.05, 0.05), blade)
				for x in [-0.17, 0.0, 0.17]:
					part(w, "cone", Vector3(x, 0.05, -1.16), Vector3(0.07, 0.26, 0.07), blade, Vector3(-90, 0, 0))
		"bow":
			for i in 7:
				var a := deg_to_rad((i - 3) * 22.0)
				part(w, "box", Vector3(0, sin(a) * 0.55, -0.15 - cos(a) * 0.18), Vector3(0.05, 0.17, 0.06), trim if i == 3 else Color(0.55, 0.36, 0.2), Vector3(-rad_to_deg(a), 0, 0))
			part(w, "box", Vector3(0, 0, 0.02), Vector3(0.01, 1.1, 0.01), Color(0.95, 0.95, 0.9), Vector3.ZERO, false)
		"guitar":
			part(w, "sphere", Vector3(0, -0.05, 0.05), Vector3(0.42, 0.12, 0.42), blade)
			part(w, "sphere", Vector3(0, -0.05, -0.22), Vector3(0.32, 0.11, 0.3), blade)
			part(w, "cyl", Vector3(0, 0.0, 0.0), Vector3(0.1, 0.02, 0.1), dark, Vector3.ZERO, false)
			part(w, "box", Vector3(0, 0.0, -0.55), Vector3(0.08, 0.04, 0.6), Color(0.4, 0.25, 0.15))
			part(w, "box", Vector3(0, 0.0, -0.9), Vector3(0.14, 0.05, 0.14), trim)
		"wand":
			part(w, "cyl", Vector3(0, 0.05, -0.25), Vector3(0.04, 0.55, 0.04), Color(0.35, 0.25, 0.4), Vector3(-80, 0, 0))
			part(w, "sphere", Vector3(0, 0.1, -0.56), Vector3.ONE * 0.16, blade)
			for i in 5:
				var a := i / 5.0 * TAU
				part(w, "cone", Vector3(cos(a) * 0.1, 0.1 + sin(a) * 0.1, -0.56), Vector3(0.07, 0.12, 0.04), blade, Vector3(0, 0, rad_to_deg(a) - 90))
		"cannon":
			part(w, "cyl", Vector3(0, 0.12, -0.25), Vector3(0.3, 0.75, 0.3), Color(0.25, 0.25, 0.3), Vector3(-90, 0, 0))
			part(w, "torus", Vector3(0, 0.12, -0.62), Vector3(0.38, 0.38, 0.38), trim, Vector3(90, 0, 0), false)
			part(w, "torus", Vector3(0, 0.12, -0.1), Vector3(0.36, 0.36, 0.36), trim, Vector3(90, 0, 0), false)
			part(w, "sphere", Vector3(0, 0.12, 0.14), Vector3.ONE * 0.24, Color(0.25, 0.25, 0.3))
		"claws":
			part(w, "rbox", Vector3(0, 0, -0.02), Vector3(0.26, 0.2, 0.26), trim)
			for x in [-0.08, 0.0, 0.08]:
				part(w, "cone", Vector3(x, 0.02, -0.3), Vector3(0.05, 0.42, 0.04), blade, Vector3(-90, 0, 0))
		"book":
			part(w, "rbox", Vector3(0, 0.05, -0.12), Vector3(0.32, 0.1, 0.4), trim)
			part(w, "box", Vector3(0, 0.05, -0.12), Vector3(0.3, 0.08, 0.36), Color(0.98, 0.95, 0.85), Vector3.ZERO, false)
			part(w, "sphere", Vector3(0, 0.3, -0.12), Vector3.ONE * 0.14, blade, Vector3.ZERO, false)
		"boomerang":
			part(w, "box", Vector3(0.1, 0.05, -0.18), Vector3(0.36, 0.04, 0.1), blade, Vector3(0, 40, 0))
			part(w, "box", Vector3(-0.1, 0.05, -0.18), Vector3(0.36, 0.04, 0.1), blade, Vector3(0, -40, 0))
			part(w, "sphere", Vector3(0, 0.06, -0.06), Vector3(0.1, 0.05, 0.1), trim, Vector3.ZERO, false)
		"lollipop":
			part(w, "cyl", Vector3(0, 0.3, -0.05), Vector3(0.05, 0.75, 0.05), Color(0.97, 0.97, 0.95), Vector3(10, 0, 0))
			part(w, "cyl", Vector3(0, 0.75, -0.12), Vector3(0.48, 0.07, 0.48), blade, Vector3(80, 0, 0))
			part(w, "torus", Vector3(0, 0.75, -0.16), Vector3(0.3, 0.3, 0.3), Color(1, 1, 1), Vector3(80, 0, 0), false)
		"fan":
			for i in 7:
				part(w, "box", Vector3(0, 0.05, -0.2), Vector3(0.02, 0.1, 0.5), blade if i % 2 == 0 else trim, Vector3(0, -45 + i * 15, 0))
		"hammer":
			part(w, "cyl", Vector3(0, 0.25, -0.08), Vector3(0.07, 0.9, 0.07), Color(0.5, 0.35, 0.22), Vector3(20, 0, 0))
			part(w, "rbox", Vector3(0, 0.66, -0.25), Vector3(0.5, 0.32, 0.32), blade, Vector3(20, 0, 0))
			part(w, "box", Vector3(0, 0.66, -0.25), Vector3(0.52, 0.08, 0.34), trim, Vector3(20, 0, 0), false)
		_:
			part(w, "cyl", Vector3(0, 0, 0.09), Vector3(0.065, 0.28, 0.065), Color(0.85, 0.85, 0.9), Vector3(90, 0, 0))
			part(w, "box", Vector3(0, 0, -0.08), Vector3(0.22, 0.07, 0.05), trim)
			part(w, "box", Vector3(0, 0.03, -0.78), Vector3(0.04, 0.12, 1.3), blade)
			part(w, "box", Vector3(0, -0.01, -0.78), Vector3(0.045, 0.03, 1.3), trim, Vector3.ZERO, false)
			part(w, "cone", Vector3(0, 0.05, -1.48), Vector3(0.045, 0.18, 0.11), blade, Vector3(-80, 0, 0))
	return pivot(w, "Tip", Vector3(0, 0, -1.25))

## Trainingspuppe (Strohpuppe mit Zielscheibe).
static func build_dummy(color: Color) -> Dictionary:
	var root := Node3D.new()
	var body := pivot(root, "Body", Vector3.ZERO)
	var straw := Color(0.95, 0.8, 0.5)
	var wood := Color(0.55, 0.36, 0.22)
	part(body, "cyl", Vector3(0, 0.4, 0), Vector3(0.14, 0.8, 0.14), wood)
	part(body, "sphere", Vector3(0, 0.95, 0), Vector3(0.72, 0.8, 0.62), straw)
	for i in 3:
		part(body, "torus", Vector3(0, 0.75 + i * 0.2, 0), Vector3(1.3 - abs(i - 1) * 0.25, 0.6, 1.1 - abs(i - 1) * 0.2), straw.darkened(0.2), Vector3.ZERO, false)
	part(body, "cyl", Vector3(0, 1.0, -0.3), Vector3(0.48, 0.05, 0.48), Color.WHITE, Vector3(90, 0, 0), false)
	part(body, "cyl", Vector3(0, 1.0, -0.32), Vector3(0.34, 0.05, 0.34), color, Vector3(90, 0, 0), false)
	part(body, "cyl", Vector3(0, 1.0, -0.34), Vector3(0.16, 0.05, 0.16), Color.WHITE, Vector3(90, 0, 0), false)
	part(body, "sphere", Vector3(0, 1.58, 0), Vector3(0.58, 0.56, 0.56), straw)
	part(body, "cone", Vector3(0, 1.92, 0), Vector3(0.5, 0.3, 0.5), color.darkened(0.2))
	for side in [-1, 1]:
		part(body, "box", Vector3(0.11 * side, 1.62, -0.27), Vector3(0.1, 0.025, 0.02), Color(0.2, 0.15, 0.1), Vector3(0, 0, 45), false)
		part(body, "box", Vector3(0.11 * side, 1.62, -0.27), Vector3(0.1, 0.025, 0.02), Color(0.2, 0.15, 0.1), Vector3(0, 0, -45), false)
		part(body, "cyl", Vector3(0.5 * side, 1.05, 0), Vector3(0.09, 0.55, 0.09), wood, Vector3(0, 0, 90))
		part(body, "sphere", Vector3(0.8 * side, 1.05, 0), Vector3.ONE * 0.18, straw)
	part(root, "cyl", Vector3(0, 0.04, 0), Vector3(0.8, 0.08, 0.8), Color(0.5, 0.45, 0.4))
	merge_tree(root)
	return {"root": root, "body": body, "height": 2.0}
