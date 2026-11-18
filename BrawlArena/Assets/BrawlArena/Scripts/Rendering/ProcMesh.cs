// ---------------------------------------------------------------------------------------------
// ProcMesh – erzeugt Basis-Meshes (Kugel, Box, Zylinder, Kegel, Torus, Scheibe, Ring, Sektor)
// vollständig im Code. Dadurch braucht das Projekt keine externen Modelle, und alle Meshes
// sind lesbar (für das Zusammenfassen per MeshBuilder).
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;

namespace BrawlArena.Rendering
{
    public static class ProcMesh
    {
        private static Mesh sphere, sphereLow, box, cylinder, cone, torus, quad, disc, hemisphere;
        private static readonly HashSet<Mesh> shared = new HashSet<Mesh>();
        private static readonly HashSet<Mesh> generated = new HashSet<Mesh>();

        /// <summary>Registriert ein zur Laufzeit erzeugtes Mesh (darf später freigegeben werden).</summary>
        public static Mesh Track(Mesh m) { if (m != null) generated.Add(m); return m; }

        /// <summary>Gibt ein zur Laufzeit erzeugtes, nicht geteiltes Mesh frei. Assets werden nie angetastet.</summary>
        public static void Release(Mesh m)
        {
            if (m == null || IsShared(m) || !generated.Remove(m)) return;
            Object.Destroy(m);
        }

        /// <summary>Meshes, die dauerhaft geteilt werden (nicht zerstören).</summary>
        public static void MarkShared(Mesh m) { if (m != null) shared.Add(m); }
        public static bool IsShared(Mesh m)
        {
            return m == sphere || m == sphereLow || m == box || m == cylinder || m == cone || m == torus || m == quad || m == disc || m == hemisphere || shared.Contains(m);
        }

        /// <summary>Kugel mit Durchmesser 1.</summary>
        public static Mesh Sphere { get { return sphere ?? (sphere = BuildSphere(16, 12, 1f)); } }
        /// <summary>Kugel mit wenigen Polygonen (Büsche, Partikel).</summary>
        public static Mesh SphereLow { get { return sphereLow ?? (sphereLow = BuildSphere(8, 6, 1f)); } }
        /// <summary>Halbkugel (Kuppel) mit Durchmesser 1, Boden bei y=0.</summary>
        public static Mesh Hemisphere { get { return hemisphere ?? (hemisphere = BuildSphere(16, 6, 0.5f)); } }
        /// <summary>Würfel mit Kantenlänge 1.</summary>
        public static Mesh Box { get { return box ?? (box = BuildBox()); } }
        /// <summary>Zylinder Durchmesser 1, Höhe 1 (zentriert).</summary>
        public static Mesh Cylinder { get { return cylinder ?? (cylinder = BuildCylinder(16, 1f, 1f)); } }
        /// <summary>Kegel Durchmesser 1, Höhe 1 (Basis bei -0.5).</summary>
        public static Mesh Cone { get { return cone ?? (cone = BuildCylinder(16, 1f, 0f)); } }
        /// <summary>Torus, Hauptradius 0.5, Rohrradius 0.12.</summary>
        public static Mesh Torus { get { return torus ?? (torus = BuildTorus(20, 8, 0.5f, 0.12f)); } }
        /// <summary>Quadrat 1x1 in der XZ-Ebene, nach oben zeigend.</summary>
        public static Mesh GroundQuad { get { return quad ?? (quad = BuildQuad()); } }
        /// <summary>Kreisscheibe Durchmesser 1 in der XZ-Ebene.</summary>
        public static Mesh Disc { get { return disc ?? (disc = BuildDisc(32)); } }

        // ------------------------------------------------------------------ Builder
        public static Mesh BuildSphere(int lon, int lat, float latFraction)
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            int latSteps = Mathf.Max(2, lat);
            for (int y = 0; y <= latSteps; y++)
            {
                float fy = (float)y / latSteps;
                float theta = fy * Mathf.PI * latFraction; // 0 = Nordpol
                for (int x = 0; x <= lon; x++)
                {
                    float fx = (float)x / lon;
                    float phi = fx * Mathf.PI * 2f;
                    var p = new Vector3(Mathf.Sin(theta) * Mathf.Cos(phi), Mathf.Cos(theta), Mathf.Sin(theta) * Mathf.Sin(phi));
                    v.Add(p * 0.5f); n.Add(p); uv.Add(new Vector2(fx, 1f - fy));
                }
            }
            for (int y = 0; y < latSteps; y++)
                for (int x = 0; x < lon; x++)
                {
                    int a = y * (lon + 1) + x, b = a + lon + 1;
                    t.Add(a); t.Add(a + 1); t.Add(b);
                    t.Add(a + 1); t.Add(b + 1); t.Add(b);
                }
            if (latFraction < 1f)
            {
                // Boden schließen
                int center = v.Count; float ringY = Mathf.Cos(Mathf.PI * latFraction) * 0.5f;
                v.Add(new Vector3(0, ringY, 0)); n.Add(Vector3.down); uv.Add(new Vector2(0.5f, 0.5f));
                int ringStart = latSteps * (lon + 1);
                int baseIdx = v.Count;
                for (int x = 0; x <= lon; x++) { v.Add(v[ringStart + x]); n.Add(Vector3.down); uv.Add(uv[ringStart + x]); }
                for (int x = 0; x < lon; x++) { t.Add(center); t.Add(baseIdx + x); t.Add(baseIdx + x + 1); }
                // Halbkugel so verschieben, dass der Boden bei y=0 liegt
                for (int i = 0; i < v.Count; i++) v[i] = v[i] - new Vector3(0, ringY, 0);
            }
            return Make("Sphere", v, n, uv, t);
        }

        private static Mesh BuildBox()
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            Vector3[] dirs = { Vector3.up, Vector3.down, Vector3.forward, Vector3.back, Vector3.right, Vector3.left };
            foreach (var d in dirs)
            {
                Vector3 up = Mathf.Abs(d.y) > 0.5f ? Vector3.forward : Vector3.up;
                Vector3 right = Vector3.Cross(up, d);
                int b = v.Count;
                Vector3 c = d * 0.5f;
                v.Add(c - right * 0.5f - up * 0.5f); v.Add(c + right * 0.5f - up * 0.5f);
                v.Add(c + right * 0.5f + up * 0.5f); v.Add(c - right * 0.5f + up * 0.5f);
                for (int i = 0; i < 4; i++) n.Add(d);
                uv.Add(new Vector2(0, 0)); uv.Add(new Vector2(1, 0)); uv.Add(new Vector2(1, 1)); uv.Add(new Vector2(0, 1));
                t.Add(b); t.Add(b + 1); t.Add(b + 2); t.Add(b); t.Add(b + 2); t.Add(b + 3);
            }
            return Make("Box", v, n, uv, t);
        }

        public static Mesh BuildCylinder(int seg, float bottomDiameter, float topDiameter)
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            float rb = bottomDiameter * 0.5f, rt = topDiameter * 0.5f;
            float slope = (rb - rt);
            for (int i = 0; i <= seg; i++)
            {
                float a = (float)i / seg * Mathf.PI * 2f;
                float cx = Mathf.Cos(a), cz = Mathf.Sin(a);
                var normal = new Vector3(cx, slope, cz).normalized;
                v.Add(new Vector3(cx * rb, -0.5f, cz * rb)); n.Add(normal); uv.Add(new Vector2((float)i / seg, 0));
                v.Add(new Vector3(cx * rt, 0.5f, cz * rt)); n.Add(normal); uv.Add(new Vector2((float)i / seg, 1));
            }
            for (int i = 0; i < seg; i++)
            {
                int a = i * 2;
                t.Add(a); t.Add(a + 1); t.Add(a + 2);
                t.Add(a + 1); t.Add(a + 3); t.Add(a + 2);
            }
            // Deckel
            AddCap(v, n, uv, t, seg, -0.5f, rb, false);
            if (rt > 0.001f) AddCap(v, n, uv, t, seg, 0.5f, rt, true);
            return Make("Cylinder", v, n, uv, t);
        }

        private static void AddCap(List<Vector3> v, List<Vector3> n, List<Vector2> uv, List<int> t, int seg, float y, float r, bool top)
        {
            int c = v.Count;
            v.Add(new Vector3(0, y, 0)); n.Add(top ? Vector3.up : Vector3.down); uv.Add(new Vector2(0.5f, 0.5f));
            for (int i = 0; i <= seg; i++)
            {
                float a = (float)i / seg * Mathf.PI * 2f;
                v.Add(new Vector3(Mathf.Cos(a) * r, y, Mathf.Sin(a) * r)); n.Add(top ? Vector3.up : Vector3.down);
                uv.Add(new Vector2(Mathf.Cos(a) * 0.5f + 0.5f, Mathf.Sin(a) * 0.5f + 0.5f));
            }
            for (int i = 0; i < seg; i++)
            {
                if (top) { t.Add(c); t.Add(c + i + 2); t.Add(c + i + 1); }
                else { t.Add(c); t.Add(c + i + 1); t.Add(c + i + 2); }
            }
        }

        public static Mesh BuildTorus(int seg, int tube, float radius, float tubeRadius)
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            for (int i = 0; i <= seg; i++)
            {
                float a = (float)i / seg * Mathf.PI * 2f;
                var center = new Vector3(Mathf.Cos(a) * radius, 0, Mathf.Sin(a) * radius);
                for (int j = 0; j <= tube; j++)
                {
                    float b = (float)j / tube * Mathf.PI * 2f;
                    var dir = new Vector3(Mathf.Cos(a) * Mathf.Cos(b), Mathf.Sin(b), Mathf.Sin(a) * Mathf.Cos(b));
                    v.Add(center + dir * tubeRadius); n.Add(dir); uv.Add(new Vector2((float)i / seg, (float)j / tube));
                }
            }
            for (int i = 0; i < seg; i++)
                for (int j = 0; j < tube; j++)
                {
                    int a = i * (tube + 1) + j, b = a + tube + 1;
                    t.Add(a); t.Add(a + 1); t.Add(b);
                    t.Add(a + 1); t.Add(b + 1); t.Add(b);
                }
            return Make("Torus", v, n, uv, t);
        }

        private static Mesh BuildQuad()
        {
            var v = new List<Vector3> { new Vector3(-0.5f, 0, -0.5f), new Vector3(0.5f, 0, -0.5f), new Vector3(0.5f, 0, 0.5f), new Vector3(-0.5f, 0, 0.5f) };
            var n = new List<Vector3> { Vector3.up, Vector3.up, Vector3.up, Vector3.up };
            var uv = new List<Vector2> { new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1) };
            var t = new List<int> { 0, 2, 1, 0, 3, 2 };
            return Make("Quad", v, n, uv, t);
        }

        private static Mesh BuildDisc(int seg)
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            v.Add(Vector3.zero); n.Add(Vector3.up); uv.Add(new Vector2(0.5f, 0.5f));
            for (int i = 0; i <= seg; i++)
            {
                float a = (float)i / seg * Mathf.PI * 2f;
                v.Add(new Vector3(Mathf.Cos(a) * 0.5f, 0, Mathf.Sin(a) * 0.5f)); n.Add(Vector3.up);
                uv.Add(new Vector2(Mathf.Cos(a) * 0.5f + 0.5f, Mathf.Sin(a) * 0.5f + 0.5f));
            }
            for (int i = 0; i < seg; i++) { t.Add(0); t.Add(i + 2); t.Add(i + 1); }
            return Make("Disc", v, n, uv, t);
        }

        /// <summary>Ring in der XZ-Ebene (für Zonen, Zielanzeigen). UV.x läuft entlang, UV.y von innen (0) nach außen (1).</summary>
        public static Mesh BuildRing(float innerRadius, float outerRadius, int seg)
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            for (int i = 0; i <= seg; i++)
            {
                float a = (float)i / seg * Mathf.PI * 2f;
                var d = new Vector3(Mathf.Cos(a), 0, Mathf.Sin(a));
                v.Add(d * innerRadius); n.Add(Vector3.up); uv.Add(new Vector2((float)i / seg, 0));
                v.Add(d * outerRadius); n.Add(Vector3.up); uv.Add(new Vector2((float)i / seg, 1));
            }
            for (int i = 0; i < seg; i++)
            {
                int a = i * 2;
                t.Add(a); t.Add(a + 3); t.Add(a + 1);
                t.Add(a); t.Add(a + 2); t.Add(a + 3);
            }
            return Make("Ring", v, n, uv, t);
        }

        /// <summary>Kreissektor (Kegel-Zielanzeige) mit Spitze im Ursprung, Richtung +Z.</summary>
        public static Mesh BuildSector(float radius, float angleDeg, int seg)
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            v.Add(Vector3.zero); n.Add(Vector3.up); uv.Add(new Vector2(0.5f, 0));
            float half = angleDeg * 0.5f * Mathf.Deg2Rad;
            for (int i = 0; i <= seg; i++)
            {
                float a = Mathf.Lerp(-half, half, (float)i / seg);
                v.Add(new Vector3(Mathf.Sin(a), 0, Mathf.Cos(a)) * radius); n.Add(Vector3.up); uv.Add(new Vector2((float)i / seg, 1));
            }
            for (int i = 0; i < seg; i++) { t.Add(0); t.Add(i + 1); t.Add(i + 2); }
            return Make("Sector", v, n, uv, t);
        }

        /// <summary>Rechteck (Linien-Zielanzeige) von z=0 bis z=length, Breite width.</summary>
        public static Mesh BuildStrip(float width, float length)
        {
            float w = width * 0.5f;
            var v = new List<Vector3> { new Vector3(-w, 0, 0), new Vector3(w, 0, 0), new Vector3(w, 0, length), new Vector3(-w, 0, length) };
            var n = new List<Vector3> { Vector3.up, Vector3.up, Vector3.up, Vector3.up };
            var uv = new List<Vector2> { new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1) };
            var t = new List<int> { 0, 2, 1, 0, 3, 2 };
            return Make("Strip", v, n, uv, t);
        }

        private static Mesh Make(string name, List<Vector3> v, List<Vector3> n, List<Vector2> uv, List<int> t)
        {
            var m = new Mesh { name = name };
            m.SetVertices(v); m.SetNormals(n); m.SetUVs(0, uv); m.SetTriangles(t, 0);
            m.RecalculateBounds();
            return Track(m);
        }
    }

    /// <summary>Fasst viele Teil-Meshes mit Transformation und Vertexfarbe zu EINEM Mesh zusammen
    /// (ein Draw-Call statt vieler – wichtig für die Performance auf Android).</summary>
    public class MeshBuilder
    {
        private readonly List<Vector3> verts = new List<Vector3>(1024);
        private readonly List<Vector3> norms = new List<Vector3>(1024);
        private readonly List<Color> cols = new List<Color>(1024);
        private readonly List<Vector2> uvs = new List<Vector2>(1024);
        private readonly List<int> tris = new List<int>(2048);

        public int VertexCount { get { return verts.Count; } }

        public void Add(Mesh mesh, Matrix4x4 matrix, Color color)
        {
            var mv = mesh.vertices; var mn = mesh.normals; var mu = mesh.uv; var mt = mesh.triangles;
            int b = verts.Count;
            var nm = matrix.inverse.transpose;
            bool flip = matrix.determinant < 0f;
            for (int i = 0; i < mv.Length; i++)
            {
                verts.Add(matrix.MultiplyPoint3x4(mv[i]));
                norms.Add(i < mn.Length ? nm.MultiplyVector(mn[i]).normalized : Vector3.up);
                cols.Add(color);
                uvs.Add(i < mu.Length ? mu[i] : Vector2.zero);
            }
            for (int i = 0; i < mt.Length; i += 3)
            {
                if (flip) { tris.Add(b + mt[i]); tris.Add(b + mt[i + 2]); tris.Add(b + mt[i + 1]); }
                else { tris.Add(b + mt[i]); tris.Add(b + mt[i + 1]); tris.Add(b + mt[i + 2]); }
            }
        }

        public void Add(Mesh mesh, Vector3 pos, Quaternion rot, Vector3 scale, Color color)
        {
            Add(mesh, Matrix4x4.TRS(pos, rot, scale), color);
        }

        public Mesh Build(string name)
        {
            var m = new Mesh { name = name };
            if (verts.Count > 65000) m.indexFormat = UnityEngine.Rendering.IndexFormat.UInt32;
            m.SetVertices(verts); m.SetNormals(norms); m.SetColors(cols); m.SetUVs(0, uvs); m.SetTriangles(tris, 0);
            m.RecalculateBounds();
            return ProcMesh.Track(m);
        }

        public void Clear() { verts.Clear(); norms.Clear(); cols.Clear(); uvs.Clear(); tris.Clear(); }
    }
}
