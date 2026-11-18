// ---------------------------------------------------------------------------------------------
// GameModeDefinition – Regeln eines Spielmodus als Daten.
// Die Logik steckt in einer GameModeController-Unterklasse (siehe Scripts/Modes).
// Für einen komplett neuen Modus: Klasse von GameModeController ableiten, hier
// modeType = Custom und controllerClassName = "Namespace.KlassenName" eintragen.
// ---------------------------------------------------------------------------------------------
using UnityEngine;

namespace BrawlArena.Data
{
    [CreateAssetMenu(menuName = "BrawlArena/Spielmodus", fileName = "NewMode", order = 4)]
    public class GameModeDefinition : ScriptableObject
    {
        [Header("Identität")]
        public string id = "new_mode";
        public string displayName = "Neuer Modus";
        [TextArea(2, 4)] public string description = "";
        public ModeType modeType = ModeType.TeamBattle;
        [Tooltip("Nur bei Custom: vollständiger Klassenname des GameModeControllers.")]
        public string controllerClassName = "";
        public Color themeColor = new Color(0.9f, 0.3f, 0.6f);
        [Tooltip("Ab wie vielen Gesamt-Trophäen ist der Modus spielbar?")]
        public int requiredTrophies = 0;
        public int sortOrder = 0;

        [Header("Teams")]
        [Tooltip("Anzahl Teams (z.B. 2 bei 3v3, 10 bei Solo-Showdown).")]
        public int teamCount = 2;
        [Tooltip("Spieler pro Team.")]
        public int teamSize = 3;

        [Header("Regeln")]
        [Tooltip("Matchdauer in Sekunden (0 = unbegrenzt).")]
        public float matchDuration = 150f;
        [Tooltip("Wiedereinstieg erlaubt?")]
        public bool allowRespawn = true;
        [Tooltip("Respawn-Zeit in Sekunden.")]
        public float respawnTime = 3f;
        [Tooltip("Siegpunktzahl (Kills, Tore, Edelsteine, Wellen ...).")]
        public int targetScore = 10;
        [Tooltip("Countdown in Sekunden (z.B. Edelstein-Countdown).")]
        public float countdownTime = 15f;
        [Tooltip("Anzahl Wellen (Überleben).")]
        public int waves = 6;
        [Tooltip("Leben pro Spieler (Überleben). 0 = unendlich.")]
        public int lives = 3;
        [Tooltip("Giftgas aktiv (Showdown)?")]
        public bool useGas = false;
        [Tooltip("Sekunden bis das Gas beginnt.")]
        public float gasStartDelay = 25f;
        [Tooltip("Kacheln pro Sekunde, um die das Gas vorrückt.")]
        public float gasSpeed = 0.18f;

        [Header("Belohnungen")]
        public int trophiesWin = 8;
        public int trophiesDraw = 0;
        public int trophiesLoss = -5;
        public int coinsWin = 20;
        public int coinsLoss = 8;
        public int xpWin = 30;
        public int xpLoss = 12;
        [Tooltip("Zählt dieser Modus für Trophäen? (Training: nein)")]
        public bool ranked = true;

        public int TotalPlayers { get { return Mathf.Max(1, teamCount * teamSize); } }
    }
}
