// ---------------------------------------------------------------------------------------------
// Netzwerk-vorbereitete Datenstrukturen.
//
// Ein Match wird AUSSCHLIESSLICH aus einer MatchConfig aufgebaut (Modus, Karte, Teilnehmer,
// Zufalls-Seed). Für Online-Multiplayer verteilt ein Server dieselbe MatchConfig an alle Clients,
// und Eingaben laufen als InputFrame über eine Netzwerk-IBrawlerInputSource.
// IMatchmaker abstrahiert die Spielersuche: offline füllt OfflineMatchmaker mit Bots auf,
// online kann z.B. ein Matchmaker für Unity Netcode / Photon / eigenen Server implementiert werden.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;

namespace BrawlArena.Net
{
    [Serializable]
    public class MatchParticipant
    {
        public string playerId;
        public string displayName;
        public string brawlerId;
        public string skinId;
        public int level = 1;
        public int team;
        public bool isBot;
        public bool isLocal;
        [Range(0f, 1f)] public float botSkill = 0.5f;
        public int trophies;
        public Color nameColor = Color.white;
    }

    [Serializable]
    public class MatchConfig
    {
        public string modeId;
        public string mapId;
        public int seed;
        public List<MatchParticipant> participants = new List<MatchParticipant>();

        public MatchParticipant Local { get { return participants.Find(p => p.isLocal); } }
        public string ToJson() { return JsonUtility.ToJson(this); }
        public static MatchConfig FromJson(string json) { return JsonUtility.FromJson<MatchConfig>(json); }
    }

    public enum MatchOutcome { Victory, Defeat, Draw, Abandoned, None }

    [Serializable]
    public class ParticipantStats
    {
        public string name;
        public string brawlerId;
        public int team;
        public bool isLocal;
        public int kills, deaths;
        public float damage, healing;
        public int score;
    }

    [Serializable]
    public class MatchResult
    {
        public string modeId, mapId;
        public MatchOutcome outcome = MatchOutcome.None;
        public int rank;          // Showdown-Platz (1 = Sieger), sonst 0
        public int playerCount;
        public float duration;
        public string headline;   // z.B. "SIEG!" oder "PLATZ 3"
        public string detail;     // z.B. "2 : 1"
        public List<ParticipantStats> stats = new List<ParticipantStats>();
        public string mvpName;

        // Belohnungen (werden von der Economy berechnet)
        public int trophyDelta, coins, xp, tokens;
        public bool starPlayer;
    }

    /// <summary>Anfrage an einen Matchmaker.</summary>
    public class MatchRequest
    {
        public string modeId;
        public string mapId;
        public MatchParticipant localPlayer;
    }

    /// <summary>Spielersuche – offline oder online austauschbar.</summary>
    public interface IMatchmaker
    {
        /// <summary>Startet die Suche. progress meldet (gefundene Spieler, benötigte Spieler).</summary>
        void FindMatch(MatchRequest request, Action<int, int> progress, Action<MatchConfig> found);
        void Cancel();
        /// <summary>Muss regelmäßig aufgerufen werden (z.B. aus Update).</summary>
        void Tick(float dt);
        bool IsSearching { get; }
    }
}
