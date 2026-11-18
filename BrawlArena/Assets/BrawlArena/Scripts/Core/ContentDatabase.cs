// ---------------------------------------------------------------------------------------------
// ContentDatabase – sammelt ALLE Inhalte des Spiels an einem Ort:
//   1. Eigene Assets aus Resources/BrawlArena/{Brawlers,Maps,Modes,Skins} (im Editor erstellt)
//   2. Im Spiel erstellte Brawler (Charakter-Editor, als JSON gespeichert)
//   3. Mitgelieferte Standardinhalte (DefaultContent) – werden durch Assets mit gleicher ID ersetzt.
// Dadurch kann man neue Inhalte hinzufügen, ohne Code zu ändern.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using BrawlArena.Data;

namespace BrawlArena.Core
{
    public static class ContentDatabase
    {
        public static readonly List<BrawlerDefinition> Brawlers = new List<BrawlerDefinition>();
        public static readonly List<BrawlerDefinition> Npcs = new List<BrawlerDefinition>();
        public static readonly List<MapDefinition> Maps = new List<MapDefinition>();
        public static readonly List<GameModeDefinition> Modes = new List<GameModeDefinition>();
        public static readonly List<SkinDefinition> Skins = new List<SkinDefinition>();
        public static readonly HashSet<string> CustomBrawlerIds = new HashSet<string>();
        public static bool Initialized { get; private set; }

        public const string ResourceRoot = "BrawlArena/";

        public static void Init()
        {
            Brawlers.Clear(); Npcs.Clear(); Maps.Clear(); Modes.Clear(); Skins.Clear(); CustomBrawlerIds.Clear();

            AddRange(Brawlers, Resources.LoadAll<BrawlerDefinition>(ResourceRoot + "Brawlers"), b => b.id);
            AddRange(Maps, Resources.LoadAll<MapDefinition>(ResourceRoot + "Maps"), m => m.id);
            AddRange(Modes, Resources.LoadAll<GameModeDefinition>(ResourceRoot + "Modes"), m => m.id);
            AddRange(Skins, Resources.LoadAll<SkinDefinition>(ResourceRoot + "Skins"), s => s.id);

            AddRange(Brawlers, DefaultContent.CreateBrawlers(), b => b.id);
            AddRange(Npcs, DefaultContent.CreateNpcs(), b => b.id);
            AddRange(Maps, DefaultContent.CreateMaps(), m => m.id);
            AddRange(Modes, DefaultContent.CreateModes(), m => m.id);
            AddRange(Skins, DefaultContent.CreateSkins(), s => s.id);

            foreach (var custom in LoadCustomBrawlers())
            {
                if (Brawlers.Exists(b => b.id == custom.id)) continue;
                Brawlers.Add(custom);
                CustomBrawlerIds.Add(custom.id);
            }

            Brawlers.Sort((a, b) => a.sortOrder != b.sortOrder ? a.sortOrder.CompareTo(b.sortOrder) : a.rarity.CompareTo(b.rarity));
            Modes.Sort((a, b) => a.sortOrder.CompareTo(b.sortOrder));
            Initialized = true;
            Debug.Log("[BrawlArena] Inhalte geladen: " + Brawlers.Count + " Brawler, " + Maps.Count + " Karten, " + Modes.Count + " Modi, " + Skins.Count + " Skins.");
        }

        private static void AddRange<T>(List<T> list, IEnumerable<T> items, System.Func<T, string> id) where T : Object
        {
            foreach (var it in items)
            {
                if (it == null) continue;
                string key = id(it);
                if (string.IsNullOrEmpty(key) || list.Exists(x => id(x) == key)) continue;
                list.Add(it);
            }
        }

        public static BrawlerDefinition GetBrawler(string id) { return Brawlers.Find(b => b.id == id); }
        public static BrawlerDefinition GetNpc(string id) { return Npcs.Find(b => b.id == id) ?? GetBrawler(id); }
        public static MapDefinition GetMap(string id) { return Maps.Find(m => m.id == id); }
        public static GameModeDefinition GetMode(string id) { return Modes.Find(m => m.id == id); }
        public static SkinDefinition GetSkin(string id) { return string.IsNullOrEmpty(id) ? null : Skins.Find(s => s.id == id); }
        public static List<SkinDefinition> GetSkinsFor(string brawlerId) { return Skins.FindAll(s => s.brawlerId == brawlerId); }
        public static List<MapDefinition> MapsFor(GameModeDefinition mode) { return Maps.FindAll(m => m.Supports(mode)); }

        /// <summary>Liefert die Definition mit angewendetem Skin (Kopie) oder das Original.</summary>
        public static BrawlerDefinition CreateSkinned(BrawlerDefinition def, string skinId)
        {
            var skin = GetSkin(skinId);
            if (skin == null || skin.brawlerId != def.id) return def;
            var copy = def.CreateRuntimeCopy();
            skin.ApplyTo(copy);
            return copy;
        }

        // ------------------------------------------------------------------ Eigene Brawler (In-Game-Editor)
        private static string CustomDir { get { return Path.Combine(Application.persistentDataPath, "custom_brawlers"); } }

        public static List<BrawlerDefinition> LoadCustomBrawlers()
        {
            var result = new List<BrawlerDefinition>();
            try
            {
                if (!Directory.Exists(CustomDir)) return result;
                foreach (var file in Directory.GetFiles(CustomDir, "*.json"))
                {
                    var def = ScriptableObject.CreateInstance<BrawlerDefinition>();
                    JsonUtility.FromJsonOverwrite(File.ReadAllText(file), def);
                    StripObjectReferences(def);
                    def.name = def.id;
                    def.unlockedByDefault = true;
                    result.Add(def);
                }
            }
            catch (System.Exception e) { Debug.LogWarning("[BrawlArena] Eigene Brawler konnten nicht geladen werden: " + e.Message); }
            return result;
        }

        public static void SaveCustomBrawler(BrawlerDefinition def)
        {
            Directory.CreateDirectory(CustomDir);
            StripObjectReferences(def);
            File.WriteAllText(Path.Combine(CustomDir, def.id + ".json"), JsonUtility.ToJson(def, true));
            var existing = GetBrawler(def.id);
            if (existing != null && existing != def) Brawlers.Remove(existing);
            if (!Brawlers.Contains(def)) Brawlers.Add(def);
            CustomBrawlerIds.Add(def.id);
        }

        public static void DeleteCustomBrawler(string id)
        {
            string path = Path.Combine(CustomDir, id + ".json");
            if (File.Exists(path)) File.Delete(path);
            Brawlers.RemoveAll(b => b.id == id && CustomBrawlerIds.Contains(id));
            CustomBrawlerIds.Remove(id);
        }

        /// <summary>Asset-Verweise (Modelle, Clips, Sounds) können nicht als JSON gespeichert werden.</summary>
        private static void StripObjectReferences(BrawlerDefinition d)
        {
            d.portrait = null;
            d.appearance.customModel = null;
            d.animations.idleClip = d.animations.walkClip = d.animations.attackClip = d.animations.superClip = null;
            d.animations.hitClip = d.animations.deathClip = d.animations.victoryClip = null;
            d.sounds.attack = d.sounds.super = d.sounds.hurt = d.sounds.death = d.sounds.spawn = d.sounds.footstep = null;
            d.mainAttack.customPattern = null;
            d.superAbility.customPattern = null;
            if (d.forms != null)
                foreach (var f in d.forms)
                {
                    f.appearance.customModel = null;
                    f.mainAttack.customPattern = null;
                    f.superAbility.customPattern = null;
                }
        }
    }
}
