// ---------------------------------------------------------------------------------------------
// ArenaView – baut die komplette 3D-Optik einer Karte aus dem Raster: Boden, Wände mit
// hellen Deckflächen, Kisten, wogende Büsche, Wasser, Randmauer und Dekoration (Kakteen, Bäume,
// Felsen ...). Alles wird zu wenigen Meshes zusammengefasst (gut für Android).
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using BrawlArena.Data;
using BrawlArena.Rendering;

namespace BrawlArena.Gameplay
{
    public class ArenaView : MonoBehaviour
    {
        private Arena arena;
        private MeshFilter wallsMf, cratesMf, bushMf;
        private System.Random rng;

        public void Build(Arena a)
        {
            arena = a;
            rng = new System.Random(a.Map.id.GetHashCode());
            var th = a.Map.theme;

            // Boden
            var ground = MakeObj("Ground", MaterialLibrary.CreateGround(th.groundA, th.groundB));
            var gb = new MeshBuilder();
            gb.Add(ProcMesh.GroundQuad, new Vector3(0, 0, 0), Quaternion.identity, new Vector3(a.Width, 1, a.Height), Color.white);
            ground.GetComponent<MeshFilter>().sharedMesh = gb.Build("Ground");
            ground.GetComponent<MeshRenderer>().shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            var gmat = ground.GetComponent<MeshRenderer>().sharedMaterial;
            gmat.SetVector("_Offset", new Vector4(a.Width % 2 == 1 ? 0.5f : 0f, a.Height % 2 == 1 ? 0.5f : 0f, 0, 0));

            // Außenboden (darunter, größer, dunkler)
            var outer = MakeObj("OuterGround", MaterialLibrary.CreateGround(Color.Lerp(th.groundA, th.border, 0.45f), Color.Lerp(th.groundB, th.border, 0.5f)));
            var ob = new MeshBuilder();
            ob.Add(ProcMesh.GroundQuad, new Vector3(0, -0.02f, 0), Quaternion.identity, new Vector3(a.Width + 60, 1, a.Height + 60), Color.white);
            outer.GetComponent<MeshFilter>().sharedMesh = ob.Build("Outer");

            wallsMf = MakeObj("Walls", MaterialLibrary.WorldToonOutline).GetComponent<MeshFilter>();
            cratesMf = MakeObj("Crates", MaterialLibrary.WorldToonOutline).GetComponent<MeshFilter>();
            bushMf = MakeObj("Bushes", MaterialLibrary.Bush).GetComponent<MeshFilter>();
            BuildWater();
            BuildBorderAndDecoration();
            BuildMarkers();
            Rebuild();
            a.TilesChanged += Rebuild;
        }

        private GameObject MakeObj(string name, Material mat)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            go.AddComponent<MeshFilter>();
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = mat;
            return go;
        }

        private float Hash(int x, int r) { unchecked { int h = x * 73856093 ^ r * 19349663 ^ arena.Map.id.Length * 83492791; return ((h & 0x7fffffff) % 1000) / 1000f; } }

        /// <summary>Baut Wände, Kisten und Büsche neu (nach Zerstörung).</summary>
        public void Rebuild()
        {
            var th = arena.Map.theme;
            var walls = new MeshBuilder(); var crates = new MeshBuilder(); var bushes = new MeshBuilder();
            for (int x = 0; x < arena.Width; x++)
                for (int r = 0; r < arena.Height; r++)
                {
                    var t = arena.GetTile(x, r);
                    Vector3 c = arena.CellToWorld(x, r);
                    float h = Hash(x, r);
                    switch (t)
                    {
                        case TileType.Wall:
                        {
                            float height = 1.05f + h * 0.2f;
                            Color side = Color.Lerp(th.wallSide, Color.black, h * 0.12f);
                            walls.Add(ProcMesh.Box, c + Vector3.up * height * 0.5f, Quaternion.identity, new Vector3(1f, height, 1f), side);
                            walls.Add(ProcMesh.Box, c + Vector3.up * (height + 0.06f), Quaternion.identity, new Vector3(1.04f, 0.14f, 1.04f), th.wallTop);
                            if (h > 0.7f) walls.Add(ProcMesh.SphereLow, c + new Vector3(0.2f, height + 0.15f, -0.15f), Quaternion.identity, Vector3.one * 0.22f, Color.Lerp(th.wallTop, Color.white, 0.2f));
                            break;
                        }
                        case TileType.Crate:
                        {
                            Color cc = th.crate; Color dark = Color.Lerp(cc, Color.black, 0.3f);
                            crates.Add(ProcMesh.Box, c + Vector3.up * 0.45f, Quaternion.Euler(0, (h - 0.5f) * 10f, 0), new Vector3(0.92f, 0.9f, 0.92f), cc);
                            crates.Add(ProcMesh.Box, c + Vector3.up * 0.45f, Quaternion.identity, new Vector3(0.96f, 0.12f, 0.96f), dark);
                            crates.Add(ProcMesh.Box, c + Vector3.up * 0.88f, Quaternion.identity, new Vector3(0.96f, 0.08f, 0.96f), dark);
                            crates.Add(ProcMesh.Box, c + Vector3.up * 0.04f, Quaternion.identity, new Vector3(0.96f, 0.08f, 0.96f), dark);
                            break;
                        }
                        case TileType.Bush:
                        {
                            for (int i = 0; i < 4; i++)
                            {
                                float a = (i / 4f + h) * Mathf.PI * 2f;
                                Vector3 p = c + new Vector3(Mathf.Cos(a) * 0.22f, 0.4f + (i % 2) * 0.12f, Mathf.Sin(a) * 0.22f);
                                Color bc = Color.Lerp(th.bush, Color.white, (i % 3) * 0.06f);
                                bushes.Add(ProcMesh.SphereLow, p, Quaternion.Euler(0, i * 40, 0), new Vector3(0.7f, 0.75f, 0.7f) * (0.85f + h * 0.3f), bc);
                            }
                            bushes.Add(ProcMesh.SphereLow, c + Vector3.up * 0.7f, Quaternion.identity, Vector3.one * 0.6f, Color.Lerp(th.bush, Color.white, 0.12f));
                            break;
                        }
                    }
                }
            // Alte Meshes freigeben (Neuaufbau nach zerstörten Wänden)
            ProcMesh.Release(wallsMf.sharedMesh); ProcMesh.Release(cratesMf.sharedMesh); ProcMesh.Release(bushMf.sharedMesh);
            wallsMf.sharedMesh = walls.Build("Walls");
            cratesMf.sharedMesh = crates.Build("Crates");
            bushMf.sharedMesh = bushes.Build("Bushes");
        }

        private void BuildWater()
        {
            var wb = new MeshBuilder();
            for (int x = 0; x < arena.Width; x++)
                for (int r = 0; r < arena.Height; r++)
                    if (arena.GetTile(x, r) == TileType.Water)
                        wb.Add(ProcMesh.GroundQuad, arena.CellToWorld(x, r) + Vector3.up * 0.03f, Quaternion.identity, Vector3.one, Color.white);
            if (wb.VertexCount == 0) return;
            var go = MakeObj("Water", MaterialLibrary.Instance(MaterialLibrary.Water));
            var mat = go.GetComponent<MeshRenderer>().sharedMaterial;
            mat.SetColor("_Color", arena.Map.theme.water);
            mat.SetColor("_DeepColor", Color.Lerp(arena.Map.theme.water, Color.black, 0.35f));
            go.GetComponent<MeshFilter>().sharedMesh = wb.Build("Water");
            go.GetComponent<MeshRenderer>().shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        }

        private void BuildBorderAndDecoration()
        {
            var th = arena.Map.theme;
            var mb = new MeshBuilder();
            float hw = arena.Width * 0.5f, hh = arena.Height * 0.5f;
            // Randmauer
            for (int x = -1; x <= arena.Width; x++)
            {
                AddBorderBlock(mb, new Vector3(x - hw + 0.5f, 0, hh + 0.5f), th);
                AddBorderBlock(mb, new Vector3(x - hw + 0.5f, 0, -hh - 0.5f), th);
            }
            for (int r = 0; r < arena.Height; r++)
            {
                AddBorderBlock(mb, new Vector3(-hw - 0.5f, 0, hh - 0.5f - r), th);
                AddBorderBlock(mb, new Vector3(hw + 0.5f, 0, hh - 0.5f - r), th);
            }
            // Dekoration außerhalb
            int count = (arena.Width + arena.Height) * 3;
            for (int i = 0; i < count; i++)
            {
                float side = (float)rng.NextDouble();
                float dist = 1.8f + (float)rng.NextDouble() * 7f;
                Vector3 p;
                if (side < 0.25f) p = new Vector3(Mathf.Lerp(-hw - 8, hw + 8, (float)rng.NextDouble()), 0, hh + dist);
                else if (side < 0.5f) p = new Vector3(Mathf.Lerp(-hw - 8, hw + 8, (float)rng.NextDouble()), 0, -hh - dist);
                else if (side < 0.75f) p = new Vector3(-hw - dist, 0, Mathf.Lerp(-hh - 8, hh + 8, (float)rng.NextDouble()));
                else p = new Vector3(hw + dist, 0, Mathf.Lerp(-hh - 8, hh + 8, (float)rng.NextDouble()));
                AddDecoration(mb, p, th, (float)rng.NextDouble());
            }
            var go = MakeObj("BorderDeco", MaterialLibrary.WorldToonOutline);
            go.GetComponent<MeshFilter>().sharedMesh = mb.Build("BorderDeco");
        }

        private void AddBorderBlock(MeshBuilder mb, Vector3 p, MapTheme th)
        {
            float h = 0.9f + (float)rng.NextDouble() * 0.35f;
            mb.Add(ProcMesh.Box, p + Vector3.up * h * 0.5f, Quaternion.identity, new Vector3(1f, h, 1f), th.border);
            mb.Add(ProcMesh.Box, p + Vector3.up * (h + 0.05f), Quaternion.identity, new Vector3(1.03f, 0.1f, 1.03f), Color.Lerp(th.border, Color.white, 0.25f));
        }

        private void AddDecoration(MeshBuilder mb, Vector3 p, MapTheme th, float k)
        {
            float rot = k * 360f;
            switch (th.decoration)
            {
                case DecorationStyle.Desert:
                    if (k < 0.5f)
                    {
                        Color cg = new Color(0.3f, 0.65f, 0.35f);
                        mb.Add(ProcMesh.Cylinder, p + Vector3.up * 0.8f, Quaternion.identity, new Vector3(0.45f, 1.6f, 0.45f), cg);
                        mb.Add(ProcMesh.Sphere, p + Vector3.up * 1.6f, Quaternion.identity, new Vector3(0.45f, 0.45f, 0.45f), cg);
                        mb.Add(ProcMesh.Cylinder, p + new Vector3(0.35f, 1.0f, 0), Quaternion.identity, new Vector3(0.28f, 0.6f, 0.28f), cg);
                        mb.Add(ProcMesh.Cylinder, p + new Vector3(0.2f, 0.75f, 0), Quaternion.Euler(0, 0, 90), new Vector3(0.24f, 0.35f, 0.24f), cg);
                        mb.Add(ProcMesh.SphereLow, p + new Vector3(0, 1.85f, 0), Quaternion.identity, Vector3.one * 0.15f, new Color(1f, 0.45f, 0.6f));
                    }
                    else AddRock(mb, p, new Color(0.75f, 0.55f, 0.4f), k);
                    break;
                case DecorationStyle.Forest:
                    if (k < 0.65f) AddTree(mb, p, new Color(0.25f, 0.6f, 0.3f), new Color(0.5f, 0.33f, 0.2f), k);
                    else AddRock(mb, p, new Color(0.55f, 0.58f, 0.6f), k);
                    break;
                case DecorationStyle.Snow:
                    if (k < 0.6f)
                    {
                        Color pine = new Color(0.2f, 0.45f, 0.4f);
                        mb.Add(ProcMesh.Cylinder, p + Vector3.up * 0.3f, Quaternion.identity, new Vector3(0.25f, 0.6f, 0.25f), new Color(0.45f, 0.3f, 0.2f));
                        for (int i = 0; i < 3; i++)
                        {
                            mb.Add(ProcMesh.Cone, p + Vector3.up * (0.9f + i * 0.5f), Quaternion.Euler(0, rot, 0), new Vector3(1.4f - i * 0.35f, 0.8f, 1.4f - i * 0.35f), pine);
                            mb.Add(ProcMesh.Cone, p + Vector3.up * (1.05f + i * 0.5f), Quaternion.Euler(0, rot, 0), new Vector3(1.0f - i * 0.3f, 0.45f, 1.0f - i * 0.3f), Color.white);
                        }
                    }
                    else AddRock(mb, p, new Color(0.85f, 0.9f, 0.95f), k);
                    break;
                case DecorationStyle.Candy:
                {
                    Color c1 = Color.HSVToRGB(k, 0.55f, 1f);
                    mb.Add(ProcMesh.Cylinder, p + Vector3.up * 0.8f, Quaternion.identity, new Vector3(0.12f, 1.6f, 0.12f), Color.white);
                    mb.Add(ProcMesh.Sphere, p + Vector3.up * 1.75f, Quaternion.Euler(90, rot, 0), new Vector3(1f, 1f, 0.3f), c1);
                    mb.Add(ProcMesh.Torus, p + Vector3.up * 1.75f, Quaternion.Euler(90, rot, 0), new Vector3(1.2f, 1.2f, 1.2f), Color.white);
                    break;
                }
                case DecorationStyle.Ruins:
                    if (k < 0.5f)
                    {
                        Color st = new Color(0.7f, 0.68f, 0.62f);
                        float h = 1f + k * 3f;
                        mb.Add(ProcMesh.Cylinder, p + Vector3.up * h * 0.5f, Quaternion.identity, new Vector3(0.6f, h, 0.6f), st);
                        mb.Add(ProcMesh.Box, p + Vector3.up * (h + 0.1f), Quaternion.Euler(0, rot, 0), new Vector3(0.85f, 0.2f, 0.85f), st);
                    }
                    else AddTree(mb, p, new Color(0.35f, 0.55f, 0.3f), new Color(0.45f, 0.35f, 0.25f), k);
                    break;
                case DecorationStyle.Stadium:
                {
                    // Tribünen-Zuschauer: bunte Kugeln auf Stufen
                    Color seat = new Color(0.35f, 0.38f, 0.5f);
                    mb.Add(ProcMesh.Box, p + Vector3.up * 0.3f, Quaternion.identity, new Vector3(1.2f, 0.6f, 1.2f), seat);
                    mb.Add(ProcMesh.Sphere, p + Vector3.up * 0.85f, Quaternion.identity, Vector3.one * 0.5f, Color.HSVToRGB(k, 0.6f, 1f));
                    mb.Add(ProcMesh.Sphere, p + Vector3.up * 1.25f, Quaternion.identity, Vector3.one * 0.38f, new Color(1f, 0.82f, 0.65f));
                    break;
                }
            }
        }

        private void AddTree(MeshBuilder mb, Vector3 p, Color leaves, Color trunk, float k)
        {
            mb.Add(ProcMesh.Cylinder, p + Vector3.up * 0.6f, Quaternion.identity, new Vector3(0.3f, 1.2f, 0.3f), trunk);
            mb.Add(ProcMesh.SphereLow, p + Vector3.up * 1.6f, Quaternion.identity, Vector3.one * (1.3f + k * 0.4f), leaves);
            mb.Add(ProcMesh.SphereLow, p + new Vector3(0.35f, 2.0f, 0.1f), Quaternion.identity, Vector3.one * 0.9f, Color.Lerp(leaves, Color.white, 0.1f));
        }

        private void AddRock(MeshBuilder mb, Vector3 p, Color c, float k)
        {
            mb.Add(ProcMesh.SphereLow, p + Vector3.up * 0.25f, Quaternion.Euler(k * 50, k * 300, 0), new Vector3(0.9f + k, 0.6f, 0.8f), c);
            mb.Add(ProcMesh.SphereLow, p + new Vector3(0.4f, 0.15f, 0.3f), Quaternion.identity, new Vector3(0.45f, 0.35f, 0.45f), Color.Lerp(c, Color.black, 0.1f));
        }

        private void BuildMarkers()
        {
            var mb = new MeshBuilder();
            foreach (var p in arena.SpawnsBlue) mb.Add(ProcMesh.Disc, p + Vector3.up * 0.02f, Quaternion.identity, Vector3.one * 0.9f, new Color(0.35f, 0.6f, 1f, 1f));
            foreach (var p in arena.SpawnsRed) mb.Add(ProcMesh.Disc, p + Vector3.up * 0.02f, Quaternion.identity, Vector3.one * 0.9f, new Color(1f, 0.4f, 0.4f, 1f));
            foreach (var p in arena.GoalBlue) mb.Add(ProcMesh.GroundQuad, p + Vector3.up * 0.015f, Quaternion.identity, Vector3.one, new Color(0.45f, 0.65f, 1f));
            foreach (var p in arena.GoalRed) mb.Add(ProcMesh.GroundQuad, p + Vector3.up * 0.015f, Quaternion.identity, Vector3.one, new Color(1f, 0.5f, 0.5f));
            if (mb.VertexCount == 0) return;
            var go = MakeObj("Markers", MaterialLibrary.WorldToon);
            go.GetComponent<MeshFilter>().sharedMesh = mb.Build("Markers");
            go.GetComponent<MeshRenderer>().shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        }

        private void OnDestroy()
        {
            if (arena != null) arena.TilesChanged -= Rebuild;
        }
    }
}
