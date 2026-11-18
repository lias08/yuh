// ---------------------------------------------------------------------------------------------
// PlayerProfile + SaveSystem – kompletter Spielerfortschritt als JSON in
// Application.persistentDataPath (auf Android: interner App-Speicher).
// Speichern ist atomar (temporäre Datei + Ersetzen) und es gibt eine Sicherungskopie.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using BrawlArena.Data;

namespace BrawlArena.Save
{
    [Serializable]
    public class BrawlerProgress
    {
        public string id;
        public bool unlocked;
        public int level = 1;
        public int powerPoints;
        public int trophies;
        public int highestTrophies;
        public int wins;
        public int matches;
        public string selectedSkin = "";
    }

    [Serializable]
    public class PlayerStats
    {
        public int matches;
        public int teamWins;
        public int showdownWins;
        public int survivalWins;
        public int kills;
        public int deaths;
        public long totalDamage;
        public int starPlayer;
        public int boxesOpened;
    }

    [Serializable]
    public class GameSettings
    {
        public float musicVolume = 0.5f;
        public float sfxVolume = 0.8f;
        public int quality = 2;            // 0 = niedrig, 1 = mittel, 2 = hoch
        public bool showFps = false;
        public bool floatingJoystick = true;
        public bool vibration = true;
        public bool tapToAutoAim = true;
        public float joystickSize = 1f;
        public bool targetFps60 = true;
    }

    [Serializable]
    public class PlayerProfile
    {
        public int version = 1;
        public string playerName = "Spieler";
        public int iconIndex;
        public int xp;
        public int level = 1;
        public int coins = 300;
        public int gems = 40;
        public int tokens;
        public int highestTrophies;
        public string selectedBrawlerId = "funke";
        public string selectedModeId = "team_battle";
        public string selectedMapId = "";
        public List<BrawlerProgress> brawlers = new List<BrawlerProgress>();
        public List<string> ownedSkins = new List<string>();
        public List<int> claimedTrophyRoad = new List<int>();
        public PlayerStats stats = new PlayerStats();
        public GameSettings settings = new GameSettings();
        public long lastDailyRewardTicks;
        public int dailyStreak;
        public long lastFreeBoxTicks;
        public bool tutorialSeen;

        public int TotalTrophies
        {
            get { int t = 0; foreach (var b in brawlers) t += b.trophies; return t; }
        }

        /// <summary>Fortschritt eines Brawlers (wird bei Bedarf angelegt).</summary>
        public BrawlerProgress Get(string brawlerId)
        {
            var p = brawlers.Find(b => b.id == brawlerId);
            if (p == null)
            {
                p = new BrawlerProgress { id = brawlerId };
                brawlers.Add(p);
            }
            return p;
        }

        public bool IsUnlocked(BrawlerDefinition def)
        {
            if (def.unlockedByDefault) return true;
            var p = brawlers.Find(b => b.id == def.id);
            return p != null && p.unlocked;
        }

        public bool OwnsSkin(string skinId) { return ownedSkins.Contains(skinId); }
    }

    public static class SaveSystem
    {
        public static PlayerProfile Profile { get; private set; }
        public static event Action Changed;

        private static string PathMain { get { return System.IO.Path.Combine(Application.persistentDataPath, "brawlarena_save.json"); } }
        private static string PathBackup { get { return PathMain + ".bak"; } }

        public static void Load()
        {
            Profile = TryRead(PathMain) ?? TryRead(PathBackup);
            if (Profile == null)
            {
                Profile = new PlayerProfile();
                Profile.playerName = "Brawler" + UnityEngine.Random.Range(1000, 9999);
                Save();
            }
            if (Profile.settings == null) Profile.settings = new GameSettings();
            if (Profile.stats == null) Profile.stats = new PlayerStats();
        }

        private static PlayerProfile TryRead(string path)
        {
            try
            {
                if (!File.Exists(path)) return null;
                var p = JsonUtility.FromJson<PlayerProfile>(File.ReadAllText(path));
                return p;
            }
            catch (Exception e)
            {
                Debug.LogWarning("[BrawlArena] Speicherstand beschädigt (" + path + "): " + e.Message);
                return null;
            }
        }

        public static void Save()
        {
            if (Profile == null) return;
            try
            {
                string json = JsonUtility.ToJson(Profile, true);
                string tmp = PathMain + ".tmp";
                File.WriteAllText(tmp, json);
                if (File.Exists(PathMain)) File.Copy(PathMain, PathBackup, true);
                if (File.Exists(PathMain)) File.Delete(PathMain);
                File.Move(tmp, PathMain);
            }
            catch (Exception e) { Debug.LogError("[BrawlArena] Speichern fehlgeschlagen: " + e.Message); }
            if (Changed != null) Changed();
        }

        /// <summary>Löscht den Fortschritt komplett (Einstellungen > Zurücksetzen).</summary>
        public static void ResetProgress()
        {
            var settings = Profile != null ? Profile.settings : new GameSettings();
            Profile = new PlayerProfile { settings = settings, playerName = Profile != null ? Profile.playerName : "Spieler" };
            Save();
        }

        public static void NotifyChanged() { if (Changed != null) Changed(); }
    }
}
