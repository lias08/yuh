// ---------------------------------------------------------------------------------------------
// GameModeController – Basisklasse aller Spielmodi.
// Jeder Modus legt fest: Spawnpunkte, Regeln (Tick), Respawn, Siegbedingung, HUD-Anzeige,
// KI-Ziele und optionale Sonderregeln (Ball schießen, Edelsteine aufsammeln ...).
//
// Eigenen Modus erstellen:
//   public class MeinModus : GameModeController { ... }   (Methoden überschreiben)
//   GameModeDefinition-Asset: modeType = Custom, controllerClassName = "MeinNamespace.MeinModus"
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Data;
using BrawlArena.Gameplay;
using BrawlArena.Net;

namespace BrawlArena.Modes
{
    /// <summary>Daten für die Anzeige oben im HUD.</summary>
    public struct HudInfo
    {
        public string leftValue, rightValue;   // z.B. Punkte Blau / Rot
        public string centerTop;               // Zeit
        public string centerBottom;            // Zusatzinfo (Countdown, Übrige Spieler ...)
        public float leftProgress, rightProgress; // 0..1 (z.B. Edelsteine / 10), -1 = aus
        public bool showTeams;
    }

    /// <summary>Hinweis für Bots, was der Modus von ihnen will.</summary>
    public struct BotObjective
    {
        public Vector3 position;
        public bool hasPosition;
        public float aggression;   // 0 = defensiv, 1 = sehr aggressiv
        public bool retreat;       // z.B. mit vielen Edelsteinen zurückziehen
        public bool shoot;         // Bot soll sofort in Richtung shootTarget angreifen (z.B. Torschuss)
        public Vector3 shootTarget;
    }

    public abstract class GameModeController
    {
        protected MatchContext Ctx;
        protected GameModeDefinition Def;
        public bool IsOver { get; protected set; }
        protected MatchOutcome Outcome = MatchOutcome.None;
        protected int Rank;
        protected string Headline = "", Detail = "";

        private readonly List<KeyValuePair<Brawler, float>> respawnQueue = new List<KeyValuePair<Brawler, float>>();

        /// <summary>Erzeugt den passenden Controller für eine Modus-Definition.</summary>
        public static GameModeController Create(GameModeDefinition def)
        {
            switch (def.modeType)
            {
                case ModeType.TeamBattle: return new TeamBattleMode();
                case ModeType.GemGrab: return new GemGrabMode();
                case ModeType.BrawlBall: return new BrawlBallMode();
                case ModeType.Showdown: return new ShowdownMode();
                case ModeType.SoloSurvival:
                case ModeType.DuoSurvival: return new SurvivalMode();
                case ModeType.Training: return new TrainingMode();
                case ModeType.Custom:
                {
                    var t = Type.GetType(def.controllerClassName);
                    if (t == null)
                        foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                        {
                            t = asm.GetType(def.controllerClassName);
                            if (t != null) break;
                        }
                    if (t != null && typeof(GameModeController).IsAssignableFrom(t)) return (GameModeController)Activator.CreateInstance(t);
                    Debug.LogError("[BrawlArena] Modus-Klasse nicht gefunden: " + def.controllerClassName + " – verwende Teamkampf.");
                    return new TeamBattleMode();
                }
            }
            return new TeamBattleMode();
        }

        public virtual void Setup(MatchContext ctx, GameModeDefinition def)
        {
            Ctx = ctx; Def = def;
        }

        /// <summary>Spawnt alle Teilnehmer der MatchConfig.</summary>
        public virtual void SpawnParticipants()
        {
            var counters = new Dictionary<int, int>();
            foreach (var p in Ctx.Config.participants)
            {
                int idx;
                counters.TryGetValue(p.team, out idx);
                counters[p.team] = idx + 1;
                Ctx.SpawnBrawler(p, GetSpawnPoint(p.team, idx));
            }
        }

        /// <summary>Nach dem Spawnen (z.B. Objekte platzieren).</summary>
        public virtual void AfterSpawn()
        {
            foreach (var h in Ctx.Arena.HealPads) HealPad.Spawn(h);
        }

        /// <summary>Spawnpunkt für Team und Index.</summary>
        public virtual Vector3 GetSpawnPoint(int team, int index)
        {
            var list = team == 0 ? Ctx.Arena.SpawnsBlue : Ctx.Arena.SpawnsRed;
            if (list.Count == 0) return Vector3.zero;
            if (index < list.Count) return list[index];
            return list[index % list.Count] + new Vector3((index / list.Count) * 0.8f, 0, 0);
        }

        public virtual void Tick(float dt)
        {
            // Respawn-Warteschlange
            for (int i = respawnQueue.Count - 1; i >= 0; i--)
            {
                var kv = respawnQueue[i];
                if (Time.time >= kv.Value)
                {
                    respawnQueue.RemoveAt(i);
                    if (kv.Key != null && !IsOver) kv.Key.Respawn(GetRespawnPoint(kv.Key));
                }
            }
            if (Def.matchDuration > 0f && Ctx.MatchTime >= Def.matchDuration && !IsOver) OnTimeUp();
        }

        /// <summary>Restzeit für einen Brawler bis zum Respawn (oder -1).</summary>
        public float GetRespawnRemaining(Brawler b)
        {
            foreach (var kv in respawnQueue) if (kv.Key == b) return Mathf.Max(0f, kv.Value - Time.time);
            return -1f;
        }

        public virtual void OnBrawlerDied(Brawler victim, Brawler killer)
        {
            if (AllowRespawn(victim)) respawnQueue.Add(new KeyValuePair<Brawler, float>(victim, Time.time + Def.respawnTime));
        }

        protected void ClearRespawns() { respawnQueue.Clear(); }

        public virtual bool AllowRespawn(Brawler b) { return Def.allowRespawn; }

        public virtual Vector3 GetRespawnPoint(Brawler b)
        {
            var list = b.TeamId == 0 ? Ctx.Arena.SpawnsBlue : Ctx.Arena.SpawnsRed;
            return list.Count > 0 ? list[Ctx.Rng.Next(list.Count)] : Vector3.zero;
        }

        protected virtual void OnTimeUp() { End(MatchOutcome.Draw, 0, "UNENTSCHIEDEN", ""); }

        /// <summary>Beendet das Match aus Sicht des lokalen Spielers.</summary>
        protected void End(MatchOutcome outcome, int rank, string headline, string detail)
        {
            if (IsOver) return;
            IsOver = true;
            Outcome = outcome; Rank = rank; Headline = headline; Detail = detail;
        }

        public virtual MatchResult BuildResult()
        {
            return new MatchResult
            {
                modeId = Def.id, mapId = Ctx.MapDef.id, outcome = Outcome, rank = Rank,
                playerCount = Ctx.Config.participants.Count, headline = Headline, detail = Detail
            };
        }

        public abstract HudInfo GetHudInfo();

        /// <summary>Spielmodus kann einen Angriff abfangen (true = übernommen).</summary>
        public virtual bool OverrideAttack(Brawler b, Vector3 dir, float dist, bool isSuper) { return false; }

        /// <summary>Ein Brawler berührt ein Pickup. true = aufgesammelt.</summary>
        public virtual bool OnPickup(Brawler b, Pickup p) { return false; }

        public virtual BotObjective GetBotObjective(Brawler bot)
        {
            return new BotObjective { aggression = 0.7f };
        }

        protected string TimeText()
        {
            if (Def.matchDuration <= 0f) return FormatTime(Ctx.MatchTime);
            return FormatTime(Mathf.Max(0f, Def.matchDuration - Ctx.MatchTime));
        }

        public static string FormatTime(float s)
        {
            int t = Mathf.CeilToInt(s);
            return (t / 60) + ":" + (t % 60).ToString("00");
        }

        /// <summary>Gegnerische Basis/Spawn als Fallback-Ziel.</summary>
        protected Vector3 EnemyBase(int team)
        {
            var list = team == 0 ? Ctx.Arena.SpawnsRed : Ctx.Arena.SpawnsBlue;
            return list.Count > 0 ? list[0] : Vector3.zero;
        }

        protected Vector3 OwnBase(int team)
        {
            var list = team == 0 ? Ctx.Arena.SpawnsBlue : Ctx.Arena.SpawnsRed;
            return list.Count > 0 ? list[0] : Vector3.zero;
        }
    }
}
