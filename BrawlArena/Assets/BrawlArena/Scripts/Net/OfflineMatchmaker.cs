// ---------------------------------------------------------------------------------------------
// OfflineMatchmaker – Spielersuche für Offline-Matches: füllt alle freien Plätze mit Bots auf.
// Bot-Stärke, Brawler-Wahl und Level richten sich nach den Trophäen des Spielers.
// Für Online-Spiel einfach eine andere IMatchmaker-Implementierung in GameFlow eintragen.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Core;
using BrawlArena.Data;

namespace BrawlArena.Net
{
    public class OfflineMatchmaker : IMatchmaker
    {
        private static readonly string[] BotNames =
        {
            "Blitzbirne", "Kaktus Kalle", "Nova", "Sternchen", "Krawallo", "Pixelpirat", "Zuckerwatte", "Turbo-Tina",
            "Sir Boing", "Mampfi", "Donnerkeil", "Glitzerfee", "Kommandant K", "Purzel", "Wirbelwind", "Schattenfuchs",
            "Funkenflug", "Brummbär", "Lila Laune", "Raketenrudi", "Kicher-Karl", "Mondkalb", "Feuerzahn", "Bolzen"
        };

        private Action<int, int> progress;
        private Action<MatchConfig> found;
        private MatchConfig pending;
        private float timer, nextJoin;
        private int joined;
        public bool IsSearching { get; private set; }

        public void FindMatch(MatchRequest req, Action<int, int> onProgress, Action<MatchConfig> onFound)
        {
            progress = onProgress; found = onFound;
            pending = Build(req);
            joined = 1;
            timer = 0f;
            nextJoin = UnityEngine.Random.Range(0.2f, 0.5f);
            IsSearching = true;
            var mode = ContentDatabase.GetMode(req.modeId);
            if (mode != null && mode.modeType == ModeType.Training) Complete();
            else if (progress != null) progress(joined, pending.participants.Count);
        }

        public void Cancel() { IsSearching = false; pending = null; }

        public void Tick(float dt)
        {
            if (!IsSearching || pending == null) return;
            timer += dt;
            if (timer >= nextJoin && joined < pending.participants.Count)
            {
                joined = Mathf.Min(pending.participants.Count, joined + UnityEngine.Random.Range(1, 3));
                nextJoin = timer + UnityEngine.Random.Range(0.15f, 0.45f);
                if (progress != null) progress(joined, pending.participants.Count);
            }
            if (joined >= pending.participants.Count && timer > nextJoin + 0.4f) Complete();
        }

        private void Complete()
        {
            IsSearching = false;
            var cfg = pending;
            pending = null;
            if (found != null) found(cfg);
        }

        /// <summary>Stellt die komplette MatchConfig zusammen (Teams, Bots, Karte, Seed).</summary>
        public static MatchConfig Build(MatchRequest req)
        {
            var mode = ContentDatabase.GetMode(req.modeId);
            var cfg = new MatchConfig { modeId = req.modeId, seed = UnityEngine.Random.Range(1, int.MaxValue) };
            var map = ContentDatabase.GetMap(req.mapId);
            if (map == null || !map.Supports(mode))
            {
                var maps = ContentDatabase.MapsFor(mode);
                map = maps.Count > 0 ? maps[UnityEngine.Random.Range(0, maps.Count)] : ContentDatabase.Maps[0];
            }
            cfg.mapId = map.id;

            var local = req.localPlayer;
            local.team = 0;
            cfg.participants.Add(local);
            if (mode.modeType == ModeType.Training) return cfg;

            var names = new List<string>(BotNames);
            Shuffle(names);
            var pool = ContentDatabase.Brawlers;
            float skill = Mathf.Clamp(0.3f + local.trophies / 700f, 0.3f, 0.92f);
            int nameIdx = 0;

            Action<int> addBot = team =>
            {
                var def = pool[UnityEngine.Random.Range(0, pool.Count)];
                cfg.participants.Add(new MatchParticipant
                {
                    playerId = "bot" + cfg.participants.Count,
                    displayName = names[nameIdx++ % names.Count],
                    brawlerId = def.id,
                    level = Mathf.Clamp(local.level + UnityEngine.Random.Range(-1, 2), 1, 11),
                    team = team,
                    isBot = true,
                    botSkill = Mathf.Clamp01(skill + UnityEngine.Random.Range(-0.12f, 0.12f)),
                    trophies = Mathf.Max(0, local.trophies + UnityEngine.Random.Range(-30, 30))
                });
            };

            switch (mode.modeType)
            {
                case ModeType.SoloSurvival:
                    break;
                case ModeType.DuoSurvival:
                    addBot(0);
                    break;
                case ModeType.Showdown:
                    // Jeder in einem eigenen Team (bei teamSize 2: Duo-Teams)
                    for (int t = 0; t < mode.teamCount; t++)
                        for (int s = 0; s < mode.teamSize; s++)
                            if (!(t == 0 && s == 0)) addBot(t);
                    break;
                default:
                    for (int t = 0; t < mode.teamCount; t++)
                        for (int s = 0; s < mode.teamSize; s++)
                            if (!(t == 0 && s == 0)) addBot(t);
                    break;
            }
            return cfg;
        }

        private static void Shuffle<T>(List<T> list)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = UnityEngine.Random.Range(0, i + 1);
                var t = list[i]; list[i] = list[j]; list[j] = t;
            }
        }
    }
}
