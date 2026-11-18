// ---------------------------------------------------------------------------------------------
// Arena – Logik der Spielkarte: Kachelraster, Kreis-Kollision mit Gleiten an Wänden,
// Sichtlinien, Projektil-Wandtreffer, zerstörbare Wände und A*-Wegfindung für Bots.
// Bewusst ohne Unity-Physik: deterministisch, schnell und später netzwerkfähig.
// Weltkoordinaten: 1 Kachel = 1 Einheit, Kartenmitte = Ursprung, Zeile 0 = Norden (+Z).
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Data;

namespace BrawlArena.Gameplay
{
    public enum TileType : byte { Floor, Wall, Crate, Bush, Water }

    public class Arena : MonoBehaviour
    {
        public MapDefinition Map { get; private set; }
        public int Width { get; private set; }
        public int Height { get; private set; }

        private TileType[,] tiles;
        public readonly List<Vector3> SpawnsBlue = new List<Vector3>();
        public readonly List<Vector3> SpawnsRed = new List<Vector3>();
        public readonly List<Vector3> SpawnsShowdown = new List<Vector3>();
        public readonly List<Vector3> EnemySpawns = new List<Vector3>();
        public readonly List<Vector3> PowerBoxes = new List<Vector3>();
        public readonly List<Vector3> Dummies = new List<Vector3>();
        public readonly List<Vector3> HealPads = new List<Vector3>();
        public readonly List<Vector3> GoalBlue = new List<Vector3>();
        public readonly List<Vector3> GoalRed = new List<Vector3>();
        public Vector3? GemMine;
        public Vector3? BallSpawn;

        /// <summary>Wird ausgelöst, wenn sich Kacheln ändern (z.B. Wand zerstört) – Grafik baut sich neu.</summary>
        public event Action TilesChanged;

        public ArenaView View { get; private set; }

        public void Build(MapDefinition map)
        {
            Map = map;
            var grid = map.GetGrid();
            Width = grid.GetLength(0);
            Height = grid.GetLength(1);
            tiles = new TileType[Width, Height];
            for (int x = 0; x < Width; x++)
                for (int r = 0; r < Height; r++)
                {
                    char c = grid[x, r];
                    Vector3 w = CellToWorld(x, r);
                    switch (c)
                    {
                        case MapLegend.Wall: tiles[x, r] = TileType.Wall; break;
                        case MapLegend.Crate: tiles[x, r] = TileType.Crate; break;
                        case MapLegend.Bush: tiles[x, r] = TileType.Bush; break;
                        case MapLegend.Water: tiles[x, r] = TileType.Water; break;
                        default: tiles[x, r] = TileType.Floor; break;
                    }
                    switch (c)
                    {
                        case MapLegend.SpawnBlue: SpawnsBlue.Add(w); break;
                        case MapLegend.SpawnRed: SpawnsRed.Add(w); break;
                        case MapLegend.SpawnShowdown: SpawnsShowdown.Add(w); break;
                        case MapLegend.EnemySpawn: EnemySpawns.Add(w); break;
                        case MapLegend.PowerBox: PowerBoxes.Add(w); break;
                        case MapLegend.Dummy: Dummies.Add(w); break;
                        case MapLegend.HealShroom: HealPads.Add(w); break;
                        case MapLegend.GoalBlue: GoalBlue.Add(w); break;
                        case MapLegend.GoalRed: GoalRed.Add(w); break;
                        case MapLegend.GemMine: GemMine = w; break;
                        case MapLegend.Ball: BallSpawn = w; break;
                    }
                }
            // Fallbacks, damit jede Karte mit jedem Modus startet
            if (SpawnsBlue.Count == 0) SpawnsBlue.Add(FindNearestFree(new Vector3(0, 0, -Height * 0.4f)));
            if (SpawnsRed.Count == 0) SpawnsRed.Add(FindNearestFree(new Vector3(0, 0, Height * 0.4f)));

            View = gameObject.AddComponent<ArenaView>();
            View.Build(this);
        }

        // ------------------------------------------------------------------ Koordinaten
        public Vector3 CellToWorld(int x, int r)
        {
            return new Vector3(x - Width * 0.5f + 0.5f, 0f, Height * 0.5f - 0.5f - r);
        }

        public void WorldToCell(Vector3 p, out int x, out int r)
        {
            x = Mathf.FloorToInt(p.x + Width * 0.5f);
            r = Mathf.FloorToInt(Height * 0.5f - p.z);
        }

        public bool InBounds(int x, int r) { return x >= 0 && r >= 0 && x < Width && r < Height; }

        public TileType GetTile(int x, int r) { return InBounds(x, r) ? tiles[x, r] : TileType.Wall; }

        public TileType GetTile(Vector3 p) { int x, r; WorldToCell(p, out x, out r); return GetTile(x, r); }

        public bool BlocksMove(int x, int r)
        {
            var t = GetTile(x, r);
            return t == TileType.Wall || t == TileType.Crate || t == TileType.Water;
        }

        public bool BlocksShot(int x, int r)
        {
            var t = GetTile(x, r);
            return t == TileType.Wall || t == TileType.Crate;
        }

        public bool BlocksShot(Vector3 p) { int x, r; WorldToCell(p, out x, out r); return BlocksShot(x, r); }
        public bool BlocksMove(Vector3 p) { int x, r; WorldToCell(p, out x, out r); return BlocksMove(x, r); }
        public bool IsBush(Vector3 p) { return GetTile(p) == TileType.Bush; }

        public Rect WorldBounds { get { return new Rect(-Width * 0.5f, -Height * 0.5f, Width, Height); } }

        // ------------------------------------------------------------------ Bewegung
        /// <summary>Bewegt einen Kreis um delta und gleitet dabei an Wänden entlang.</summary>
        public Vector3 MoveCircle(Vector3 p, Vector3 delta, float radius)
        {
            delta.y = 0f;
            float len = delta.magnitude;
            if (len < 1e-5f) return ResolveCircle(p, radius);
            int steps = Mathf.Max(1, Mathf.CeilToInt(len / (radius * 0.5f)));
            Vector3 step = delta / steps;
            for (int i = 0; i < steps; i++)
            {
                p += step;
                p = ResolveCircle(p, radius);
            }
            return p;
        }

        /// <summary>Schiebt einen Kreis aus allen blockierenden Kacheln heraus.</summary>
        public Vector3 ResolveCircle(Vector3 p, float radius)
        {
            for (int iter = 0; iter < 3; iter++)
            {
                int cx, cr; WorldToCell(p, out cx, out cr);
                bool moved = false;
                for (int dx = -1; dx <= 1; dx++)
                    for (int dr = -1; dr <= 1; dr++)
                    {
                        int x = cx + dx, r = cr + dr;
                        if (!BlocksMove(x, r)) continue;
                        Vector3 c = CellToWorld(x, r);
                        float nx = Mathf.Clamp(p.x, c.x - 0.5f, c.x + 0.5f);
                        float nz = Mathf.Clamp(p.z, c.z - 0.5f, c.z + 0.5f);
                        float ddx = p.x - nx, ddz = p.z - nz;
                        float d2 = ddx * ddx + ddz * ddz;
                        if (d2 >= radius * radius) continue;
                        float d = Mathf.Sqrt(d2);
                        if (d < 1e-4f)
                        {
                            // Mittelpunkt steckt in der Kachel: entlang der geringsten Eindringtiefe herausschieben
                            float ox = p.x - c.x, oz = p.z - c.z;
                            if (Mathf.Abs(ox) > Mathf.Abs(oz)) p.x = c.x + Mathf.Sign(ox == 0 ? 1 : ox) * (0.5f + radius);
                            else p.z = c.z + Mathf.Sign(oz == 0 ? 1 : oz) * (0.5f + radius);
                        }
                        else
                        {
                            float push = radius - d;
                            p.x += ddx / d * push;
                            p.z += ddz / d * push;
                        }
                        moved = true;
                    }
                if (!moved) break;
            }
            // Kartenrand
            p.x = Mathf.Clamp(p.x, -Width * 0.5f + radius, Width * 0.5f - radius);
            p.z = Mathf.Clamp(p.z, -Height * 0.5f + radius, Height * 0.5f - radius);
            return p;
        }

        /// <summary>Nächste begehbare Position (z.B. nach Sprung auf eine Wand).</summary>
        public Vector3 FindNearestFree(Vector3 p)
        {
            int cx, cr; WorldToCell(p, out cx, out cr);
            if (InBounds(cx, cr) && !BlocksMove(cx, cr)) return p;
            for (int ring = 1; ring < Mathf.Max(Width, Height); ring++)
            {
                float best = float.MaxValue; Vector3 bestP = p; bool found = false;
                for (int dx = -ring; dx <= ring; dx++)
                    for (int dr = -ring; dr <= ring; dr++)
                    {
                        if (Mathf.Abs(dx) != ring && Mathf.Abs(dr) != ring) continue;
                        int x = cx + dx, r = cr + dr;
                        if (!InBounds(x, r) || BlocksMove(x, r)) continue;
                        Vector3 w = CellToWorld(x, r);
                        float d = (w - p).sqrMagnitude;
                        if (d < best) { best = d; bestP = w; found = true; }
                    }
                if (found) return bestP;
            }
            return p;
        }

        // ------------------------------------------------------------------ Projektile & Sicht
        /// <summary>Prüft, ob eine Strecke eine schussblockierende Kachel trifft.</summary>
        public bool SegmentHitsWall(Vector3 a, Vector3 b, out Vector3 hitPoint, out Vector3 normal)
        {
            hitPoint = b; normal = Vector3.zero;
            Vector3 d = b - a; d.y = 0;
            float len = d.magnitude;
            if (len < 1e-5f) return false;
            int steps = Mathf.CeilToInt(len / 0.1f);
            int px, pr; WorldToCell(a, out px, out pr);
            Vector3 prev = a;
            for (int i = 1; i <= steps; i++)
            {
                Vector3 p = a + d * ((float)i / steps);
                int x, r; WorldToCell(p, out x, out r);
                if ((x != px || r != pr) && BlocksShot(x, r))
                {
                    hitPoint = prev;
                    if (x != px && r == pr) normal = new Vector3(-Mathf.Sign(x - px), 0, 0);
                    else if (r != pr && x == px) normal = new Vector3(0, 0, Mathf.Sign(r - pr));
                    else normal = -d.normalized;
                    return true;
                }
                px = x; pr = r; prev = p;
            }
            return false;
        }

        public bool HasLineOfSight(Vector3 a, Vector3 b)
        {
            Vector3 h, n;
            return !SegmentHitsWall(a, b, out h, out n);
        }

        /// <summary>Kürzt eine Strecke an der ersten Wand (für Strahlen).</summary>
        public Vector3 ClipToWalls(Vector3 a, Vector3 b)
        {
            Vector3 h, n;
            return SegmentHitsWall(a, b, out h, out n) ? h : b;
        }

        /// <summary>Zerstört Wände/Kisten im Radius. Gibt die Anzahl zerstörter Kacheln zurück.</summary>
        public int DestroyTilesInRadius(Vector3 center, float radius)
        {
            int cx, cr; WorldToCell(center, out cx, out cr);
            int ir = Mathf.CeilToInt(radius) + 1;
            int count = 0;
            for (int dx = -ir; dx <= ir; dx++)
                for (int dr = -ir; dr <= ir; dr++)
                {
                    int x = cx + dx, r = cr + dr;
                    if (!InBounds(x, r)) continue;
                    var t = tiles[x, r];
                    if (t != TileType.Wall && t != TileType.Crate && t != TileType.Bush) continue;
                    // Äußerste Kartenränder bleiben stehen
                    if (x == 0 || r == 0 || x == Width - 1 || r == Height - 1) continue;
                    if ((CellToWorld(x, r) - center).magnitude > radius + 0.3f) continue;
                    tiles[x, r] = TileType.Floor;
                    count++;
                    FX.Debris(CellToWorld(x, r) + Vector3.up * 0.5f, t == TileType.Bush ? Map.theme.bush : Map.theme.wallSide);
                }
            if (count > 0 && TilesChanged != null) TilesChanged();
            return count;
        }

        // ------------------------------------------------------------------ Wegfindung (A*)
        private struct Node { public int g; public int f; public int parent; public bool closed; public bool open; }
        private Node[] nodes;
        private readonly List<int> openList = new List<int>(256);

        /// <summary>Findet einen Pfad (Liste von Wegpunkten in Weltkoordinaten). Leere Liste = kein Weg.</summary>
        public List<Vector3> FindPath(Vector3 from, Vector3 to, float radius)
        {
            var result = new List<Vector3>();
            int sx, sr, tx, tr;
            WorldToCell(from, out sx, out sr);
            WorldToCell(FindNearestFree(to), out tx, out tr);
            if (!InBounds(sx, sr) || !InBounds(tx, tr)) return result;
            if (IsWalkableLine(from, to, radius)) { result.Add(to); return result; }

            int n = Width * Height;
            if (nodes == null || nodes.Length != n) nodes = new Node[n];
            else Array.Clear(nodes, 0, n);
            openList.Clear();
            int start = sr * Width + sx, goal = tr * Width + tx;
            nodes[start].g = 0; nodes[start].f = Heuristic(sx, sr, tx, tr); nodes[start].open = true; nodes[start].parent = -1;
            openList.Add(start);
            int iterations = 0;
            bool found = false;
            while (openList.Count > 0 && iterations++ < 4000)
            {
                int bestI = 0;
                for (int i = 1; i < openList.Count; i++) if (nodes[openList[i]].f < nodes[openList[bestI]].f) bestI = i;
                int cur = openList[bestI];
                openList[bestI] = openList[openList.Count - 1];
                openList.RemoveAt(openList.Count - 1);
                if (cur == goal) { found = true; break; }
                nodes[cur].closed = true;
                int cx = cur % Width, cr = cur / Width;
                for (int dx = -1; dx <= 1; dx++)
                    for (int dr = -1; dr <= 1; dr++)
                    {
                        if (dx == 0 && dr == 0) continue;
                        int nx = cx + dx, nr = cr + dr;
                        if (!InBounds(nx, nr) || BlocksMove(nx, nr)) continue;
                        if (dx != 0 && dr != 0 && (BlocksMove(cx + dx, cr) || BlocksMove(cx, cr + dr))) continue; // keine Ecken schneiden
                        int ni = nr * Width + nx;
                        if (nodes[ni].closed) continue;
                        int g = nodes[cur].g + (dx != 0 && dr != 0 ? 14 : 10);
                        if (!nodes[ni].open || g < nodes[ni].g)
                        {
                            nodes[ni].g = g;
                            nodes[ni].f = g + Heuristic(nx, nr, tx, tr);
                            nodes[ni].parent = cur;
                            if (!nodes[ni].open) { nodes[ni].open = true; openList.Add(ni); }
                        }
                    }
            }
            if (!found) return result;
            var cells = new List<Vector3>();
            for (int c = goal; c != -1 && c != start; c = nodes[c].parent) cells.Add(CellToWorld(c % Width, c / Width));
            cells.Reverse();
            if (cells.Count > 0) cells[cells.Count - 1] = to;
            // Pfad glätten
            Vector3 anchor = from;
            int idx = 0;
            while (idx < cells.Count)
            {
                int furthest = idx;
                for (int j = cells.Count - 1; j > idx; j--)
                    if (IsWalkableLine(anchor, cells[j], radius)) { furthest = j; break; }
                result.Add(cells[furthest]);
                anchor = cells[furthest];
                idx = furthest + 1;
            }
            return result;
        }

        private static int Heuristic(int x, int r, int tx, int tr)
        {
            int dx = Mathf.Abs(x - tx), dr = Mathf.Abs(r - tr);
            return 10 * (dx + dr) - 6 * Mathf.Min(dx, dr);
        }

        /// <summary>Kann ein Kreis mit diesem Radius die Strecke geradlinig ablaufen?</summary>
        public bool IsWalkableLine(Vector3 a, Vector3 b, float radius)
        {
            Vector3 d = b - a; d.y = 0;
            float len = d.magnitude;
            if (len < 0.01f) return true;
            Vector3 side = new Vector3(-d.z, 0, d.x) / len * radius * 0.9f;
            int steps = Mathf.CeilToInt(len / 0.25f);
            for (int i = 0; i <= steps; i++)
            {
                Vector3 p = a + d * ((float)i / steps);
                if (BlocksMove(p) || BlocksMove(p + side) || BlocksMove(p - side)) return false;
            }
            return true;
        }
    }
}
