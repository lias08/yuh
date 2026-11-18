// ---------------------------------------------------------------------------------------------
// MapDefinition – eine Karte wird als Text-Raster beschrieben. Jedes Zeichen ist eine Kachel.
// Neue Karte: Create > BrawlArena > Karte, in "Resources/BrawlArena/Maps" speichern.
//
//  Legende (siehe auch MapLegend):
//   .  Boden            #  Wand              X  Kiste (Wand, durch Supers zerstörbar)
//   B  Busch (versteckt) W  Wasser (blockiert Laufen, nicht Schüsse)
//   1  Spawn Team Blau   2  Spawn Team Rot    S  Showdown-Spawn
//   G  Edelsteinmine     O  Ball-Startpunkt   a  Tor Team Blau (wird von Rot angegriffen)
//   b  Tor Team Rot      C  Power-Würfel-Box  E  Gegner-Spawn (Überleben)
//   D  Trainingspuppe    H  Heilpilz (heilt beim Darüberlaufen)
//
// Zeile 0 = oberer Kartenrand (Norden). Team Blau (Spieler) startet unten.
// Mit "mirrorVertically" wird nur die untere Hälfte inkl. Mittelzeile angegeben und
// automatisch gespiegelt (1<->2 und a<->b werden dabei getauscht).
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;

namespace BrawlArena.Data
{
    [Serializable]
    public class MapTheme
    {
        public Color groundA = new Color(0.93f, 0.78f, 0.52f);
        public Color groundB = new Color(0.89f, 0.72f, 0.46f);
        public Color wallSide = new Color(0.72f, 0.42f, 0.28f);
        public Color wallTop = new Color(0.90f, 0.58f, 0.38f);
        public Color crate = new Color(0.78f, 0.52f, 0.25f);
        public Color bush = new Color(0.30f, 0.70f, 0.30f);
        public Color water = new Color(0.25f, 0.65f, 0.95f);
        public Color border = new Color(0.45f, 0.30f, 0.22f);
        public Color sky = new Color(0.45f, 0.75f, 1f);
        public Color sunColor = new Color(1f, 0.95f, 0.85f);
        public float sunIntensity = 1.15f;
        public DecorationStyle decoration = DecorationStyle.Desert;

        public MapTheme Clone() { return (MapTheme)MemberwiseClone(); }
    }

    [CreateAssetMenu(menuName = "BrawlArena/Karte", fileName = "NewMap", order = 3)]
    public class MapDefinition : ScriptableObject
    {
        public string id = "new_map";
        public string displayName = "Neue Karte";
        [Tooltip("Welche Spielmodi diese Karte unterstützt.")]
        public List<ModeType> supportedModes = new List<ModeType> { ModeType.TeamBattle };
        [Tooltip("Optional: Name eines eigenen Modus (GameModeDefinition.id), wenn ModeType = Custom.")]
        public List<string> supportedCustomModes = new List<string>();
        public bool mirrorVertically = false;
        [TextArea(10, 40)] public string layout = "";
        public MapTheme theme = new MapTheme();

        [NonSerialized] private char[,] cachedGrid;
        [NonSerialized] private string cachedSource;

        /// <summary>Liefert das (ggf. gespiegelte) Raster [x, row]; row 0 = Norden.</summary>
        public char[,] GetGrid()
        {
            string src = layout + (mirrorVertically ? "|m" : "");
            if (cachedGrid != null && cachedSource == src) return cachedGrid;
            cachedSource = src;
            cachedGrid = ParseLayout(layout, mirrorVertically);
            return cachedGrid;
        }

        public int Width { get { return GetGrid().GetLength(0); } }
        public int Height { get { return GetGrid().GetLength(1); } }

        public bool Supports(GameModeDefinition mode)
        {
            if (mode == null) return false;
            if (mode.modeType == ModeType.Custom) return supportedCustomModes.Contains(mode.id);
            return supportedModes.Contains(mode.modeType);
        }

        public static char[,] ParseLayout(string text, bool mirror)
        {
            var lines = new List<string>();
            if (!string.IsNullOrEmpty(text))
            {
                foreach (var raw in text.Replace("\r", "").Split('\n'))
                {
                    string l = raw.TrimEnd();
                    if (l.Length > 0) lines.Add(l);
                }
            }
            if (lines.Count == 0) lines.Add(".");

            if (mirror)
            {
                // Eingabe: die UNTERE Hälfte inkl. Mittelzeile (erste Zeile = Mitte, letzte = unterer Rand).
                // Ergebnis: gespiegelte Kopie (Teams getauscht) oben + Original unten.
                var full = new List<string>();
                for (int i = lines.Count - 1; i >= 1; i--) full.Add(SwapTeams(lines[i]));
                full.AddRange(lines);
                lines = full;
            }

            int w = 0;
            foreach (var l in lines) w = Mathf.Max(w, l.Length);
            var grid = new char[w, lines.Count];
            for (int r = 0; r < lines.Count; r++)
                for (int x = 0; x < w; x++)
                    grid[x, r] = x < lines[r].Length ? lines[r][x] : '.';
            return grid;
        }

        private static string SwapTeams(string line)
        {
            var c = line.ToCharArray();
            for (int i = 0; i < c.Length; i++)
            {
                switch (c[i])
                {
                    case '1': c[i] = '2'; break;
                    case '2': c[i] = '1'; break;
                    case 'a': c[i] = 'b'; break;
                    case 'b': c[i] = 'a'; break;
                }
            }
            return new string(c);
        }
    }

    /// <summary>Bedeutung der Kartenzeichen – zentral, damit Editor und Spiel übereinstimmen.</summary>
    public static class MapLegend
    {
        public const char Floor = '.';
        public const char Wall = '#';
        public const char Crate = 'X';
        public const char Bush = 'B';
        public const char Water = 'W';
        public const char SpawnBlue = '1';
        public const char SpawnRed = '2';
        public const char SpawnShowdown = 'S';
        public const char GemMine = 'G';
        public const char Ball = 'O';
        public const char GoalBlue = 'a';
        public const char GoalRed = 'b';
        public const char PowerBox = 'C';
        public const char EnemySpawn = 'E';
        public const char Dummy = 'D';
        public const char HealShroom = 'H';

        public static bool BlocksMovement(char c) { return c == Wall || c == Crate || c == Water; }
        public static bool BlocksProjectiles(char c) { return c == Wall || c == Crate; }

        public static Color EditorColor(char c)
        {
            switch (c)
            {
                case Wall: return new Color(0.55f, 0.35f, 0.25f);
                case Crate: return new Color(0.80f, 0.55f, 0.25f);
                case Bush: return new Color(0.25f, 0.70f, 0.25f);
                case Water: return new Color(0.25f, 0.55f, 0.95f);
                case SpawnBlue: return new Color(0.2f, 0.5f, 1f);
                case SpawnRed: return new Color(1f, 0.25f, 0.25f);
                case SpawnShowdown: return new Color(1f, 1f, 0.3f);
                case GemMine: return new Color(0.8f, 0.3f, 1f);
                case Ball: return Color.white;
                case GoalBlue: return new Color(0.4f, 0.7f, 1f);
                case GoalRed: return new Color(1f, 0.5f, 0.5f);
                case PowerBox: return new Color(0.4f, 1f, 0.6f);
                case EnemySpawn: return new Color(0.6f, 0f, 0f);
                case Dummy: return new Color(1f, 0.6f, 0.2f);
                case HealShroom: return new Color(1f, 0.4f, 0.8f);
            }
            return new Color(0.92f, 0.85f, 0.7f);
        }
    }
}
