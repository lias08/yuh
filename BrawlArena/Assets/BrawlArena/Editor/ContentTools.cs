// ---------------------------------------------------------------------------------------------
// ContentTools – Editor-Menü "BrawlArena" zum Anlegen neuer Inhalte ohne Programmierung:
//   • Standardinhalte als Assets exportieren (danach alles im Inspector bearbeitbar)
//   • Neuer Brawler / Skin / Karte / Spielmodus (aus Vorlage)
//   • Spielstand & eigene Brawler löschen, Inhalte prüfen
// Alle Assets landen in Assets/BrawlArena/Resources/BrawlArena/... und werden vom Spiel
// automatisch geladen (ContentDatabase).
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using BrawlArena.Core;
using BrawlArena.Data;

namespace BrawlArena.EditorTools
{
    public static class ContentTools
    {
        public const string Root = "Assets/BrawlArena/Resources/BrawlArena/";

        [MenuItem("BrawlArena/Standardinhalte als Assets exportieren", priority = 20)]
        public static void ExportDefaults()
        {
            int n = 0;
            n += Export(DefaultContent.CreateBrawlers(), "Brawlers", b => b.id);
            n += Export(DefaultContent.CreateMaps(), "Maps", m => m.id);
            n += Export(DefaultContent.CreateModes(), "Modes", m => m.id);
            n += Export(DefaultContent.CreateSkins(), "Skins", s => s.id);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            EditorUtility.DisplayDialog("BrawlArena", n + " Assets exportiert nach\n" + Root + "\n\nDiese Assets haben Vorrang vor den eingebauten Standardwerten und können im Inspector frei bearbeitet werden.", "OK");
        }

        private static int Export<T>(List<T> items, string folder, System.Func<T, string> id) where T : ScriptableObject
        {
            string dir = Root + folder;
            Directory.CreateDirectory(dir);
            int n = 0;
            foreach (var it in items)
            {
                string path = dir + "/" + id(it) + ".asset";
                if (File.Exists(path)) continue;
                AssetDatabase.CreateAsset(it, path);
                n++;
            }
            return n;
        }

        [MenuItem("BrawlArena/Neu/Brawler", priority = 40)]
        public static void NewBrawler()
        {
            var template = DefaultContent.CreateBrawlers()[0];
            template.id = UniqueId("brawler_neu", "Brawlers");
            template.displayName = "Neuer Brawler";
            template.rarity = Rarity.Rare;
            template.unlockedByDefault = true;
            template.sortOrder = 200;
            CreateAndSelect(template, "Brawlers", template.id);
        }

        [MenuItem("BrawlArena/Neu/Brawler mit 4 Evolutionsstufen (Vorlage)", priority = 41)]
        public static void NewEvolvingBrawler()
        {
            var template = DefaultContent.CreateBrawlers().Find(b => b.forms.Count > 0);
            template.id = UniqueId("evolution_neu", "Brawlers");
            template.displayName = "Neuer Evolutions-Brawler";
            template.unlockedByDefault = true;
            template.sortOrder = 210;
            CreateAndSelect(template, "Brawlers", template.id);
        }

        [MenuItem("BrawlArena/Neu/Skin", priority = 42)]
        public static void NewSkin()
        {
            var s = ScriptableObject.CreateInstance<SkinDefinition>();
            var b = DefaultContent.CreateBrawlers()[0];
            s.id = UniqueId("skin_neu", "Skins");
            s.brawlerId = b.id;
            s.displayName = "Neuer Skin";
            s.appearance = b.appearance.Clone();
            s.appearance.primaryColor = new Color(0.2f, 0.8f, 0.6f);
            CreateAndSelect(s, "Skins", s.id);
        }

        [MenuItem("BrawlArena/Neu/Karte", priority = 43)]
        public static void NewMap()
        {
            var m = DefaultContent.CreateMaps()[0];
            m.id = UniqueId("karte_neu", "Maps");
            m.displayName = "Neue Karte";
            CreateAndSelect(m, "Maps", m.id);
        }

        [MenuItem("BrawlArena/Neu/Spielmodus", priority = 44)]
        public static void NewMode()
        {
            var m = DefaultContent.CreateModes()[0];
            m.id = UniqueId("modus_neu", "Modes");
            m.displayName = "Neuer Modus";
            m.sortOrder = 50;
            CreateAndSelect(m, "Modes", m.id);
        }

        [MenuItem("BrawlArena/Inhalte prüfen", priority = 60)]
        public static void Validate()
        {
            ContentDatabase.Init();
            var log = new System.Text.StringBuilder();
            var ids = new HashSet<string>();
            foreach (var b in ContentDatabase.Brawlers)
            {
                if (!ids.Add(b.id)) log.AppendLine("Doppelte Brawler-ID: " + b.id);
                if (b.maxHealth <= 0) log.AppendLine(b.id + ": Lebenspunkte <= 0");
                if (b.mainAttack.kind == AttackKind.Custom && b.mainAttack.customPattern == null) log.AppendLine(b.id + ": Custom-Angriff ohne Muster");
                if (b.appearance.customModel != null && b.animations.HasClips && b.appearance.customModel.GetComponentInChildren<Animator>() == null)
                    log.AppendLine(b.id + ": Eigene Animationen gesetzt, aber das Modell hat keine Animator-Komponente");
            }
            foreach (var mode in ContentDatabase.Modes)
                if (ContentDatabase.MapsFor(mode).Count == 0) log.AppendLine("Modus '" + mode.displayName + "' hat keine passende Karte");
            foreach (var s in ContentDatabase.Skins)
                if (ContentDatabase.GetBrawler(s.brawlerId) == null) log.AppendLine("Skin '" + s.id + "' verweist auf unbekannten Brawler '" + s.brawlerId + "'");
            string msg = log.Length == 0 ? "Alles in Ordnung!\n\n" + ContentDatabase.Brawlers.Count + " Brawler, " + ContentDatabase.Maps.Count + " Karten, " + ContentDatabase.Modes.Count + " Modi, " + ContentDatabase.Skins.Count + " Skins." : log.ToString();
            EditorUtility.DisplayDialog("BrawlArena – Inhaltsprüfung", msg, "OK");
        }

        [MenuItem("BrawlArena/Spielstand löschen", priority = 80)]
        public static void DeleteSave()
        {
            if (!EditorUtility.DisplayDialog("Spielstand löschen", "Spielstand und eigene (im Spiel erstellte) Brawler auf diesem Rechner löschen?", "Löschen", "Abbrechen")) return;
            foreach (var f in new[] { "brawlarena_save.json", "brawlarena_save.json.bak" })
            {
                string p = Path.Combine(Application.persistentDataPath, f);
                if (File.Exists(p)) File.Delete(p);
            }
            string dir = Path.Combine(Application.persistentDataPath, "custom_brawlers");
            if (Directory.Exists(dir)) Directory.Delete(dir, true);
        }

        [MenuItem("BrawlArena/Startszene anlegen", priority = 81)]
        public static void CreateScene()
        {
            BuildScript.EnsureScene();
            UnityEditor.SceneManagement.EditorSceneManager.OpenScene(BuildScript.ScenePath);
        }

        private static string UniqueId(string baseId, string folder)
        {
            string id = baseId; int i = 2;
            while (File.Exists(Root + folder + "/" + id + ".asset")) id = baseId + "_" + i++;
            return id;
        }

        private static void CreateAndSelect(ScriptableObject obj, string folder, string id)
        {
            Directory.CreateDirectory(Root + folder);
            string path = Root + folder + "/" + id + ".asset";
            obj.name = id;
            AssetDatabase.CreateAsset(obj, path);
            AssetDatabase.SaveAssets();
            Selection.activeObject = obj;
            EditorGUIUtility.PingObject(obj);
        }
    }
}
