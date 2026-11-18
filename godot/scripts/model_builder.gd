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
void fragment() {
	ALBEDO = albedo.rgb;
	EMISSION = albedo.rgb * emission;
}
void light() {
	float ndl = dot(NORMAL, LIGHT);
	float lit = smoothstep(-0.05, 0.12, ndl) * mix(0.25, 1.0, ATTENUATION);
	vec3 col = mix(shade_tint.rgb * 0.75, vec3(1.0), lit);
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
	parent.add_child(mi)
	return mi

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

	var rig := {"root": root, "body": body, "head": head, "hand_l": hand_l, "hand_r": hand_r,
		"weapon": weapon, "foot_l": foot_l, "foot_r": foot_r, "cape": cape, "tip": tip, "height": 1.95,
		"shoulder_l": shoulder_l, "shoulder_r": shoulder_r, "hip_l": hip_l, "hip_r": hip_r,
		"arm_l": arm_l, "arm_r": arm_r, "leg_l": leg_l, "leg_r": leg_r}
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
	for side in [-1, 1]:
		var e := Vector3(0.16 * side, 0.02, -0.37)
		part(head, "sphere", e, Vector3(0.18, 0.24, 0.08), white, Vector3(0, 0, 0), false)
		part(head, "sphere", e + Vector3(-0.01 * side, -0.02, -0.035), Vector3(0.12, 0.16, 0.05), look.eye, Vector3.ZERO, false)
		part(head, "sphere", e + Vector3(-0.01 * side, -0.03, -0.05), Vector3(0.06, 0.08, 0.03), Color(0.03, 0.03, 0.06), Vector3.ZERO, false)
		part(head, "sphere", e + Vector3(0.025, 0.05, -0.065), Vector3(0.05, 0.05, 0.02), white, Vector3.ZERO, false)
		part(head, "sphere", e + Vector3(-0.03, -0.06, -0.065), Vector3(0.025, 0.025, 0.01), white, Vector3.ZERO, false)
		part(head, "box", e + Vector3(0.01 * side, 0.17, -0.02), Vector3(0.2, 0.045, 0.04), look.hair.darkened(0.45), Vector3(0, 0, -20 * side), false)
	# Mund (entschlossenes Grinsen) + Nase
	part(head, "sphere", Vector3(0.04, -0.2, -0.39), Vector3(0.16, 0.06, 0.04), Color(0.45, 0.12, 0.15), Vector3(0, 0, 8), false)
	part(head, "sphere", Vector3(0, -0.07, -0.42), Vector3(0.05, 0.04, 0.04), look.skin.darkened(0.08), Vector3.ZERO, false)

static func _hair(head: Node3D, look: Dictionary) -> void:
	var hc: Color = look.hair
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
	return {"root": root, "body": body, "height": 2.0}
