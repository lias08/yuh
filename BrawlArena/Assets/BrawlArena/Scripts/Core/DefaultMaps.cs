// AUTOMATISCH ERZEUGT aus scratch maps.py – Standardkarten. Eigene Karten bitte als Assets anlegen.
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Data;

namespace BrawlArena.Core
{
    public static partial class DefaultContent
    {
        public static List<MapDefinition> CreateMaps()
        {
            var list = new List<MapDefinition>();
            {
                var m = ScriptableObject.CreateInstance<MapDefinition>();
                m.name = "kaktuspass"; m.id = "kaktuspass"; m.displayName = "Kaktuspass"; m.mirrorVertically = true;
                m.supportedModes = new List<ModeType> { ModeType.TeamBattle };
                m.theme = new MapTheme { groundA = new Color(0.95f, 0.80f, 0.55f), groundB = new Color(0.91f, 0.74f, 0.49f), wallSide = new Color(0.78f, 0.45f, 0.30f), wallTop = new Color(0.95f, 0.62f, 0.40f), crate = new Color(0.80f, 0.55f, 0.28f), bush = new Color(0.35f, 0.72f, 0.30f), water = new Color(0.25f, 0.68f, 0.95f), border = new Color(0.62f, 0.38f, 0.25f), sky = new Color(0.55f, 0.80f, 1.00f), decoration = DecorationStyle.Desert };
                m.layout =
                    "..BBB....###....BBB..\n" +
                    "..BBB...........BBB..\n" +
                    ".......#.....#.......\n" +
                    "..##...#.BBB.#...##..\n" +
                    "..##.....BBB.....##..\n" +
                    ".........BBB.........\n" +
                    "WWW.....X...X.....WWW\n" +
                    "WWW...............WWW\n" +
                    ".....BB.......BB.....\n" +
                    "..#..BB..###..BB..#..\n" +
                    "..#.......#.......#..\n" +
                    "..#...............#..\n" +
                    "......BBB...BBB......\n" +
                    "......BBB...BBB......\n" +
                    ".........1.1.1.......\n" +
                    ".....................\n";
                list.Add(m);
            }
            {
                var m = ScriptableObject.CreateInstance<MapDefinition>();
                m.name = "kristallmine"; m.id = "kristallmine"; m.displayName = "Kristallmine"; m.mirrorVertically = true;
                m.supportedModes = new List<ModeType> { ModeType.GemGrab, ModeType.TeamBattle };
                m.theme = new MapTheme { groundA = new Color(0.70f, 0.80f, 0.62f), groundB = new Color(0.65f, 0.75f, 0.57f), wallSide = new Color(0.55f, 0.55f, 0.62f), wallTop = new Color(0.75f, 0.76f, 0.82f), crate = new Color(0.62f, 0.48f, 0.32f), bush = new Color(0.25f, 0.62f, 0.35f), water = new Color(0.20f, 0.62f, 0.85f), border = new Color(0.42f, 0.44f, 0.50f), sky = new Color(0.60f, 0.82f, 0.95f), decoration = DecorationStyle.Ruins };
                m.layout =
                    "BB.......G.......BB..\n" +
                    "BB...............BB..\n" +
                    "....##.........##....\n" +
                    "....#...BBBBB...#....\n" +
                    "........B...B........\n" +
                    ".##.............##...\n" +
                    ".##..X.......X..##...\n" +
                    "........WWWWW........\n" +
                    "BBB...............BBB\n" +
                    "BBB....#.....#....BBB\n" +
                    ".......#.....#.......\n" +
                    "...##...........##...\n" +
                    "...##..BB...BB..##...\n" +
                    ".......BB...BB.......\n" +
                    ".........1.1.1.......\n" +
                    ".....................\n";
                list.Add(m);
            }
            {
                var m = ScriptableObject.CreateInstance<MapDefinition>();
                m.name = "stadion"; m.id = "stadion"; m.displayName = "Sonnenstadion"; m.mirrorVertically = true;
                m.supportedModes = new List<ModeType> { ModeType.BrawlBall };
                m.theme = new MapTheme { groundA = new Color(0.45f, 0.78f, 0.40f), groundB = new Color(0.40f, 0.72f, 0.36f), wallSide = new Color(0.30f, 0.40f, 0.70f), wallTop = new Color(0.50f, 0.62f, 0.95f), crate = new Color(0.85f, 0.55f, 0.25f), bush = new Color(0.25f, 0.60f, 0.28f), water = new Color(0.25f, 0.65f, 0.95f), border = new Color(0.28f, 0.30f, 0.42f), sky = new Color(0.50f, 0.75f, 1.00f), decoration = DecorationStyle.Stadium };
                m.layout =
                    ".........O...........\n" +
                    ".....................\n" +
                    "..BB.....###.....BB..\n" +
                    "..BB.............BB..\n" +
                    ".....##.......##.....\n" +
                    "..........B..........\n" +
                    ".X......BBBBB......X.\n" +
                    ".X.................X.\n" +
                    "......#.......#......\n" +
                    "..BBB.#.......#.BBB..\n" +
                    "..BBB...........BBB..\n" +
                    ".....................\n" +
                    "....###.......###....\n" +
                    "..........1..........\n" +
                    ".......1.....1.......\n" +
                    "#######.aaaaaaa.#####\n";
                list.Add(m);
            }
            {
                var m = ScriptableObject.CreateInstance<MapDefinition>();
                m.name = "brueckenbruch"; m.id = "brueckenbruch"; m.displayName = "Brückenbruch"; m.mirrorVertically = true;
                m.supportedModes = new List<ModeType> { ModeType.TeamBattle };
                m.theme = new MapTheme { groundA = new Color(0.62f, 0.82f, 0.45f), groundB = new Color(0.57f, 0.77f, 0.41f), wallSide = new Color(0.50f, 0.38f, 0.28f), wallTop = new Color(0.68f, 0.55f, 0.40f), crate = new Color(0.72f, 0.50f, 0.28f), bush = new Color(0.20f, 0.58f, 0.25f), water = new Color(0.22f, 0.60f, 0.92f), border = new Color(0.35f, 0.30f, 0.24f), sky = new Color(0.55f, 0.82f, 0.98f), decoration = DecorationStyle.Forest };
                m.layout =
                    "WWWWWW.........WWWWWW\n" +
                    "WWWWWW...BBB...WWWWWW\n" +
                    "......#..BBB..#......\n" +
                    "..BB..#.......#..BB..\n" +
                    "..BB.............BB..\n" +
                    "........X...X........\n" +
                    ".###.............###.\n" +
                    ".....BBB.....BBB.....\n" +
                    ".....BBB..#..BBB.....\n" +
                    "..........#..........\n" +
                    "..##.............##..\n" +
                    "..##..BB.....BB..##..\n" +
                    "......BB.....BB......\n" +
                    ".....................\n" +
                    ".........1.1.1.......\n" +
                    ".....................\n";
                list.Add(m);
            }
            {
                var m = ScriptableObject.CreateInstance<MapDefinition>();
                m.name = "wuestenschlacht"; m.id = "wuestenschlacht"; m.displayName = "Wüstenschlacht"; m.mirrorVertically = false;
                m.supportedModes = new List<ModeType> { ModeType.Showdown };
                m.theme = new MapTheme { groundA = new Color(0.95f, 0.80f, 0.55f), groundB = new Color(0.91f, 0.74f, 0.49f), wallSide = new Color(0.78f, 0.45f, 0.30f), wallTop = new Color(0.95f, 0.62f, 0.40f), crate = new Color(0.80f, 0.55f, 0.28f), bush = new Color(0.35f, 0.72f, 0.30f), water = new Color(0.25f, 0.68f, 0.95f), border = new Color(0.62f, 0.38f, 0.25f), sky = new Color(0.55f, 0.80f, 1.00f), decoration = DecorationStyle.Desert };
                m.layout =
                    "S.....BBB.......S.......BBB.....S\n" +
                    "..........##.........##..........\n" +
                    "..C.......##....C....##.......C..\n" +
                    "....###..........................\n" +
                    "....#.....BBB...........BBB......\n" +
                    "....#.....BBB.....##....BBB...###\n" +
                    "..................##..........#..\n" +
                    "S........X..................X.#..\n" +
                    "..BB.............................\n" +
                    "..BB.....###...C.....###.........\n" +
                    ".........#...............#...BB..\n" +
                    ".....C...#.....BBBBB.....#...BB..\n" +
                    "...............B...B.............\n" +
                    "..WWW..........B.C.B.........WWW.\n" +
                    "..WWW....BB....BB.BB....BB...WWW.\n" +
                    "S........BB.............BB.......\n" +
                    "..WWW....BB.............BB...WWW.\n" +
                    "..WWW..........BBBBB.........WWW.\n" +
                    ".................................\n" +
                    "..BB.....#...............#...BB..\n" +
                    "..BB.....#.....C.........#...BB..\n" +
                    ".........###.........###.........\n" +
                    "S.....X.....................X....\n" +
                    "..................##.............\n" +
                    "....#.....BBB.....##....BBB...#..\n" +
                    "....#.....BBB...........BBB...#..\n" +
                    "....###.....................###..\n" +
                    "..C.......##....C....##.......C..\n" +
                    "..........##.........##..........\n" +
                    "S.....BBB.......S.......BBB.....S\n" +
                    ".................................\n" +
                    "..BB.......C...........C.....BB..\n" +
                    "..BB.........................BB..\n";
                list.Add(m);
            }
            {
                var m = ScriptableObject.CreateInstance<MapDefinition>();
                m.name = "ruinenarena"; m.id = "ruinenarena"; m.displayName = "Ruinenarena"; m.mirrorVertically = false;
                m.supportedModes = new List<ModeType> { ModeType.SoloSurvival, ModeType.DuoSurvival };
                m.theme = new MapTheme { groundA = new Color(0.70f, 0.80f, 0.62f), groundB = new Color(0.65f, 0.75f, 0.57f), wallSide = new Color(0.55f, 0.55f, 0.62f), wallTop = new Color(0.75f, 0.76f, 0.82f), crate = new Color(0.62f, 0.48f, 0.32f), bush = new Color(0.25f, 0.62f, 0.35f), water = new Color(0.20f, 0.62f, 0.85f), border = new Color(0.42f, 0.44f, 0.50f), sky = new Color(0.60f, 0.82f, 0.95f), decoration = DecorationStyle.Ruins };
                m.layout =
                    "EE.........E.........EE..\n" +
                    "E.......................E\n" +
                    "....##.....BBB.....##....\n" +
                    "....#...............#....\n" +
                    "..........#...#..........\n" +
                    "..BB....................B\n" +
                    "..BB.....X.......X.......\n" +
                    ".........................\n" +
                    ".....##.............##...\n" +
                    ".....#.....H.....H..#....\n" +
                    "..........BBB............\n" +
                    "E.........BBB...........E\n" +
                    "...........1.............\n" +
                    ".........................\n" +
                    "..##.......BBB.......##..\n" +
                    "..#..........H........#..\n" +
                    "......X...........X......\n" +
                    ".........................\n" +
                    "....BB.....###.....BB....\n" +
                    "....BB.............BB....\n" +
                    ".........................\n" +
                    "..##.................##..\n" +
                    "E.......................E\n" +
                    "...........1.............\n" +
                    "EE.........E.........EE..\n";
                list.Add(m);
            }
            {
                var m = ScriptableObject.CreateInstance<MapDefinition>();
                m.name = "trainingsplatz"; m.id = "trainingsplatz"; m.displayName = "Trainingsplatz"; m.mirrorVertically = false;
                m.supportedModes = new List<ModeType> { ModeType.Training };
                m.theme = new MapTheme { groundA = new Color(0.62f, 0.82f, 0.45f), groundB = new Color(0.57f, 0.77f, 0.41f), wallSide = new Color(0.50f, 0.38f, 0.28f), wallTop = new Color(0.68f, 0.55f, 0.40f), crate = new Color(0.72f, 0.50f, 0.28f), bush = new Color(0.20f, 0.58f, 0.25f), water = new Color(0.22f, 0.60f, 0.92f), border = new Color(0.35f, 0.30f, 0.24f), sky = new Color(0.55f, 0.82f, 0.98f), decoration = DecorationStyle.Forest };
                m.layout =
                    ".................\n" +
                    "..D.....D.....D..\n" +
                    ".................\n" +
                    "....##.....##....\n" +
                    ".................\n" +
                    "...BB.......BB...\n" +
                    "...BB...C...BB...\n" +
                    ".................\n" +
                    "......#...#......\n" +
                    ".................\n" +
                    "..H...........H..\n" +
                    "........1........\n" +
                    ".................\n";
                list.Add(m);
            }
            return list;
        }
    }
}
