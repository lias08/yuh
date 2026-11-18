// ---------------------------------------------------------------------------------------------
// Showdown (Battle Royale mit Giftgas und Power-Würfeln), Solo-/Duo-Überleben (Wellen von
// Gegner-Robotern) und Trainingsmodus (Puppen, Schadensmessung, kein Zeitlimit).
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Audio;
using BrawlArena.Core;
using BrawlArena.Data;
using BrawlArena.Gameplay;
using BrawlArena.Net;
using BrawlArena.Rendering;

namespace BrawlArena.Modes
{
    // ============================================================================ Showdown
    public class ShowdownMode : GameModeController
    {
        private float gasInset;
        private float gasTick;
        private readonly List<Transform> gasWalls = new List<Transform>();
        private Material gasMat;

        public override Vector3 GetSpawnPoint(int team, int index)
        {
            var list = Ctx.Arena.SpawnsShowdown;
            if (list.Count > 0)
            {
                // Spieler-Reihenfolge mischen, damit nicht immer dieselben Plätze belegt sind
                int i = (team * 7 + Ctx.Config.seed) % list.Count;
                if (i < 0) i += list.Count;
                return list[i];
            }
            float a = team / (float)Mathf.Max(1, Def.teamCount) * Mathf.PI * 2f;
            float r = Mathf.Min(Ctx.Arena.Width, Ctx.Arena.Height) * 0.38f;
            return Ctx.Arena.FindNearestFree(new Vector3(Mathf.Cos(a) * r, 0, Mathf.Sin(a) * r));
        }

        public override void SpawnParticipants()
        {
            var used = new HashSet<int>();
            var list = Ctx.Arena.SpawnsShowdown;
            int k = 0;
            foreach (var p in Ctx.Config.participants)
            {
                Vector3 pos;
                if (list.Count >= Ctx.Config.participants.Count)
                {
                    int idx = (k * 3 + Mathf.Abs(Ctx.Config.seed)) % list.Count;
                    while (used.Contains(idx)) idx = (idx + 1) % list.Count;
                    used.Add(idx);
                    pos = list[idx];
                }
                else pos = GetSpawnPoint(p.team, k);
                // Duo-Teams nebeneinander
                if (Def.teamSize > 1) pos += new Vector3((k % Def.teamSize) * 0.9f, 0, 0);
                Ctx.SpawnBrawler(p, pos);
                k++;
            }
        }

        public override void AfterSpawn()
        {
            base.AfterSpawn();
            foreach (var p in Ctx.Arena.PowerBoxes)
            {
                var box = PowerBox.Spawn(p, 4000f);
                box.Destroyed += b => Pickup.Spawn(PickupType.PowerCube, b.Position, Vector3.zero);
            }
            if (Def.useGas)
            {
                gasMat = MaterialLibrary.CreateTransparent(new Color(0.3f, 0.85f, 0.25f, 0.45f), TextureFactory.Noise);
                gasMat.SetVector("_Scroll", new Vector4(0.05f, 0.08f, 0, 0));
                gasMat.mainTextureScale = new Vector2(4, 4);
                for (int i = 0; i < 4; i++)
                {
                    var go = new GameObject("Gas" + i);
                    go.transform.SetParent(Ctx.EntityRoot, false);
                    go.AddComponent<MeshFilter>().sharedMesh = ProcMesh.Box;
                    var mr = go.AddComponent<MeshRenderer>();
                    mr.sharedMaterial = gasMat;
                    mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                    go.SetActive(false);
                    gasWalls.Add(go.transform);
                }
            }
        }

        public override void Tick(float dt)
        {
            base.Tick(dt);
            if (IsOver) return;
            if (Def.useGas && Ctx.MatchTime > Def.gasStartDelay)
            {
                float maxInset = Mathf.Min(Ctx.Arena.Width, Ctx.Arena.Height) * 0.5f - 2.5f;
                gasInset = Mathf.Min(maxInset, gasInset + Def.gasSpeed * dt);
                UpdateGasVisual();
                gasTick += dt;
                if (gasTick >= 0.5f)
                {
                    gasTick = 0f;
                    foreach (var b in Ctx.Brawlers)
                        if (b.IsAlive && InGas(b.Position))
                        {
                            float dmg = 500f + Ctx.MatchTime * 2f;
                            b.TakeDamage(new DamageInfo { amount = dmg, sourcePosition = b.Position, color = Color.green });
                        }
                }
            }
            // Sieg, wenn nur noch das eigene Team lebt
            var teamsAlive = new HashSet<int>();
            foreach (var b in Ctx.Brawlers) if (b.IsAlive) teamsAlive.Add(b.TeamId);
            if (teamsAlive.Count <= 1 && teamsAlive.Contains(Ctx.LocalTeam))
                End(MatchOutcome.Victory, 1, "PLATZ 1!", "Du hast überlebt!");
        }

        private bool InGas(Vector3 p)
        {
            float hw = Ctx.Arena.Width * 0.5f - gasInset, hh = Ctx.Arena.Height * 0.5f - gasInset;
            return gasInset > 0.05f && (Mathf.Abs(p.x) > hw || Mathf.Abs(p.z) > hh);
        }

        private void UpdateGasVisual()
        {
            if (gasWalls.Count < 4) return;
            float W = Ctx.Arena.Width, H = Ctx.Arena.Height, g = gasInset, h = 1.6f;
            SetWall(gasWalls[0], new Vector3(0, h * 0.5f, H * 0.5f - g * 0.5f), new Vector3(W, h, g));
            SetWall(gasWalls[1], new Vector3(0, h * 0.5f, -H * 0.5f + g * 0.5f), new Vector3(W, h, g));
            SetWall(gasWalls[2], new Vector3(-W * 0.5f + g * 0.5f, h * 0.5f, 0), new Vector3(g, h, H - 2 * g));
            SetWall(gasWalls[3], new Vector3(W * 0.5f - g * 0.5f, h * 0.5f, 0), new Vector3(g, h, H - 2 * g));
            if (Random.value < 0.6f)
            {
                float side = Random.value;
                float along = Random.Range(-0.5f, 0.5f);
                Vector3 p = side < 0.25f ? new Vector3(along * W, 0.3f, H * 0.5f - Random.Range(0, g))
                    : side < 0.5f ? new Vector3(along * W, 0.3f, -H * 0.5f + Random.Range(0, g))
                    : side < 0.75f ? new Vector3(-W * 0.5f + Random.Range(0, g), 0.3f, along * H)
                    : new Vector3(W * 0.5f - Random.Range(0, g), 0.3f, along * H);
                FX.Gas(p);
            }
        }

        private static void SetWall(Transform t, Vector3 pos, Vector3 size)
        {
            bool vis = size.x > 0.05f && size.z > 0.05f;
            t.gameObject.SetActive(vis);
            if (!vis) return;
            t.localPosition = pos;
            t.localScale = size;
        }

        public override void OnBrawlerDied(Brawler victim, Brawler killer)
        {
            base.OnBrawlerDied(victim, killer);
            int drop = Mathf.Max(1, victim.PowerCubes);
            for (int i = 0; i < drop; i++)
                Pickup.Spawn(PickupType.PowerCube, victim.Position, Quaternion.Euler(0, i * 360f / drop, 0) * Vector3.forward * (drop > 1 ? 2f : 0f));
            if (victim.IsLocalPlayer || (victim.TeamId == Ctx.LocalTeam && Ctx.CountAlive(Ctx.LocalTeam) == 0))
            {
                if (Ctx.CountAlive(Ctx.LocalTeam) > 0) return; // Duo-Partner lebt noch
                var teamsAlive = new HashSet<int>();
                foreach (var b in Ctx.Brawlers) if (b.IsAlive) teamsAlive.Add(b.TeamId);
                int rank = teamsAlive.Count + 1;
                End(rank <= Mathf.Max(1, Def.teamCount / 2 - 1) ? MatchOutcome.Victory : MatchOutcome.Defeat, rank, "PLATZ " + rank, "Besiegt von " + (killer != null ? killer.PlayerName : "Giftgas"));
            }
        }

        public override bool AllowRespawn(Brawler b) { return false; }

        public override bool OnPickup(Brawler b, Pickup p)
        {
            if (p.Type != PickupType.PowerCube) return false;
            b.AddPowerCube();
            return true;
        }

        public override HudInfo GetHudInfo()
        {
            var teamsAlive = new HashSet<int>();
            foreach (var b in Ctx.Brawlers) if (b.IsAlive) teamsAlive.Add(b.TeamId);
            var local = Ctx.LocalPlayer;
            return new HudInfo
            {
                showTeams = false,
                centerTop = "Übrig: " + teamsAlive.Count,
                centerBottom = Ctx.MatchTime < Def.gasStartDelay ? "Gas in " + Mathf.CeilToInt(Def.gasStartDelay - Ctx.MatchTime) + "s" : "Das Gas zieht sich zu!",
                leftValue = local != null ? local.PowerCubes.ToString() : "0",
                leftProgress = -1f, rightProgress = -1f
            };
        }

        public override BotObjective GetBotObjective(Brawler bot)
        {
            var o = new BotObjective { hasPosition = true, aggression = 0.65f };
            // Power-Würfel in der Nähe einsammeln
            foreach (var p in Ctx.Pickups)
                if (p.Type == PickupType.PowerCube && (p.transform.position - bot.Position).sqrMagnitude < 64f)
                { o.position = p.transform.position; return o; }
            // Boxen angreifen, solange das Gas weit weg ist
            IDamageable bestBox = null; float bd = 100f;
            foreach (var d in Ctx.Damageables)
                if (d is PowerBox && d.IsAlive)
                {
                    float dd = (d.Position - bot.Position).sqrMagnitude;
                    if (dd < bd) { bd = dd; bestBox = d; }
                }
            if (bestBox != null && !InGas(bestBox.Position)) { o.position = bestBox.Position; return o; }
            // In Richtung Mitte (sicher vor dem Gas)
            o.position = Vector3.Lerp(bot.Position, Vector3.zero, 0.6f);
            if (InGas(bot.Position)) { o.position = Vector3.zero; o.retreat = true; }
            return o;
        }
    }

    // ============================================================================ Überleben
    /// <summary>Solo-/Duo-Überleben: Wellen von Gegner-Robotern überstehen. Leben begrenzt.</summary>
    public class SurvivalMode : GameModeController
    {
        private int wave;
        private float waveBreak = 3f;
        private bool waveActive;
        private readonly Dictionary<Brawler, int> lives = new Dictionary<Brawler, int>();
        private readonly List<Brawler> enemies = new List<Brawler>();

        public override void SpawnParticipants()
        {
            int i = 0;
            foreach (var p in Ctx.Config.participants)
            {
                var b = Ctx.SpawnBrawler(p, GetSpawnPoint(0, i++));
                lives[b] = Mathf.Max(0, Def.lives);
            }
        }

        public override void Tick(float dt)
        {
            base.Tick(dt);
            if (IsOver) return;
            enemies.RemoveAll(e => e == null || !e.IsAlive);
            if (!waveActive)
            {
                waveBreak -= dt;
                if (waveBreak <= 0f) StartWave();
            }
            else if (enemies.Count == 0)
            {
                waveActive = false;
                if (wave >= Def.waves) { End(MatchOutcome.Victory, 0, "GESCHAFFT!", "Alle " + Def.waves + " Wellen überstanden"); return; }
                waveBreak = 4f;
                Ctx.Announce("WELLE " + wave + " GESCHAFFT", "Nächste Welle gleich ...");
                foreach (var b in Ctx.Brawlers) if (b.IsAlive && b.TeamId == 0) b.Heal(b.MaxHealth * 0.4f, true);
            }
        }

        private void StartWave()
        {
            wave++;
            waveActive = true;
            bool boss = wave == Def.waves;
            Ctx.Announce(boss ? "BOSS-WELLE!" : "WELLE " + wave, boss ? "Besiege den Robo-Boss!" : "");
            AudioManager.Sfx(SfxPreset.Countdown, null, 0.8f, 0.7f);
            int players = Ctx.Config.participants.Count;
            int count = 2 + wave * 2 + (players > 1 ? wave : 0);
            if (boss) count = 2 + players * 2;
            var spawns = Ctx.Arena.EnemySpawns.Count > 0 ? Ctx.Arena.EnemySpawns : Ctx.Arena.SpawnsRed;
            for (int i = 0; i < count; i++)
            {
                string npc = (i % 3 == 2 || wave >= 4 && i % 2 == 1) ? "npc_robo_shooter" : "npc_robo_grunt";
                if (wave >= 3 && i % 5 == 4) npc = "npc_robo_tank";
                SpawnEnemy(npc, spawns[i % spawns.Count], i);
            }
            if (boss) SpawnEnemy("npc_robo_boss", spawns[0], 0);
        }

        private void SpawnEnemy(string id, Vector3 pos, int i)
        {
            var def = ContentDatabase.GetNpc(id);
            if (def == null) return;
            Vector3 jitter = new Vector3((i % 3 - 1) * 0.8f, 0, (i / 3 % 3 - 1) * 0.8f);
            var e = Ctx.SpawnBrawler(def, 1 + wave / 2, 1, def.displayName, false, true, new AI.BotBrain(0.35f + wave * 0.06f), pos + jitter);
            e.CanRegenerate = false;
            enemies.Add(e);
        }

        public override bool AllowRespawn(Brawler b)
        {
            if (b.TeamId != 0) return false;
            int l;
            if (!lives.TryGetValue(b, out l)) return false;
            if (Def.lives <= 0) return true;
            if (l <= 0) return false;
            lives[b] = l - 1;
            return true;
        }

        public override void OnBrawlerDied(Brawler victim, Brawler killer)
        {
            base.OnBrawlerDied(victim, killer);
            if (victim.TeamId != 0)
            {
                // Besiegte Roboter verschwinden nach kurzer Zeit
                Ctx.Schedule(1.2f, () => { if (Ctx != null && victim != null) Ctx.RemoveBrawler(victim); });
                if (Random.value < 0.15f) Pickup.Spawn(PickupType.PowerCube, victim.Position, Vector3.zero);
                return;
            }
            bool anyoneLeft = false;
            foreach (var kv in lives) if (kv.Key.IsAlive || GetRespawnRemaining(kv.Key) >= 0f) anyoneLeft = true;
            if (!anyoneLeft) End(MatchOutcome.Defeat, 0, "NIEDERLAGE", "Welle " + wave + " von " + Def.waves);
        }

        public override Vector3 GetRespawnPoint(Brawler b) { return GetSpawnPoint(0, 0); }

        public override bool OnPickup(Brawler b, Pickup p)
        {
            if (p.Type != PickupType.PowerCube || b.TeamId != 0) return false;
            b.AddPowerCube();
            return true;
        }

        protected override void OnTimeUp() { }

        public override HudInfo GetHudInfo()
        {
            int l = 0;
            if (Ctx.LocalPlayer != null) lives.TryGetValue(Ctx.LocalPlayer, out l);
            return new HudInfo
            {
                showTeams = false,
                centerTop = "Welle " + Mathf.Max(1, wave) + "/" + Def.waves,
                centerBottom = (waveActive ? "Gegner: " + enemies.Count : "Bereit machen ...") + "   ♥ " + l,
                leftProgress = -1f, rightProgress = -1f
            };
        }

        public override BotObjective GetBotObjective(Brawler bot)
        {
            if (bot.TeamId != 0)
            {
                // Roboter jagen den nächsten Spieler
                Brawler target = null; float bd = float.MaxValue;
                foreach (var b in Ctx.Brawlers)
                    if (b.IsAlive && b.TeamId == 0)
                    {
                        float d = (b.Position - bot.Position).sqrMagnitude;
                        if (d < bd) { bd = d; target = b; }
                    }
                return new BotObjective { hasPosition = target != null, position = target != null ? target.Position : Vector3.zero, aggression = 1f };
            }
            return new BotObjective { hasPosition = true, position = Ctx.LocalPlayer != null ? Ctx.LocalPlayer.Position : Vector3.zero, aggression = 0.8f };
        }
    }

    // ============================================================================ Training
    /// <summary>Trainingsmodus: Puppen zum Testen von Angriffen, Schadensanzeige, kein Zeitlimit.</summary>
    public class TrainingMode : GameModeController
    {
        private readonly List<Brawler> dummies = new List<Brawler>();
        private readonly Queue<KeyValuePair<float, float>> samples = new Queue<KeyValuePair<float, float>>();

        public override void AfterSpawn()
        {
            base.AfterSpawn();
            var spots = new List<Vector3>(Ctx.Arena.Dummies);
            if (spots.Count == 0) { spots.Add(new Vector3(-3, 0, 3)); spots.Add(new Vector3(0, 0, 4)); spots.Add(new Vector3(3, 0, 3)); }
            var def = ContentDatabase.GetNpc("npc_dummy");
            var shooter = ContentDatabase.GetNpc("npc_dummy_shooter");
            for (int i = 0; i < spots.Count; i++)
            {
                IBrawlerInputSource input;
                var d = def;
                string name = "Puppe";
                if (i == 1) { input = new AI.DummyWalkerInput(spots[i]); name = "Läufer-Puppe"; }
                else if (i == 2 && shooter != null) { input = new AI.DummyShooterInput(); d = shooter; name = "Schützen-Puppe"; }
                else input = new NullInput();
                var b = Ctx.SpawnBrawler(d, 1, 1, name, false, false, input, spots[i]);
                b.CanRegenerate = false;
                b.Tag = spots[i];
                dummies.Add(b);
            }
        }

        public override void Tick(float dt)
        {
            base.Tick(dt);
            foreach (var d in dummies)
                if (d != null && d.IsAlive && d.Health < d.MaxHealth && d.TimeSinceDamaged > 2.5f)
                    d.Heal(d.MaxHealth, false);
            var lp = Ctx.LocalPlayer;
            if (lp != null)
            {
                samples.Enqueue(new KeyValuePair<float, float>(Time.time, lp.DamageDealt));
                while (samples.Count > 0 && Time.time - samples.Peek().Key > 5f) samples.Dequeue();
            }
        }

        public override bool AllowRespawn(Brawler b) { return true; }

        public override Vector3 GetRespawnPoint(Brawler b)
        {
            if (b.Tag is Vector3) return (Vector3)b.Tag;
            return base.GetRespawnPoint(b);
        }

        public override bool OnPickup(Brawler b, Pickup p) { if (p.Type == PickupType.PowerCube) { b.AddPowerCube(); return true; } return false; }

        public override HudInfo GetHudInfo()
        {
            float dps = 0f;
            if (samples.Count > 1)
            {
                var first = samples.Peek();
                float last = Ctx.LocalPlayer != null ? Ctx.LocalPlayer.DamageDealt : 0f;
                dps = (last - first.Value) / Mathf.Max(1f, Time.time - first.Key);
            }
            return new HudInfo
            {
                showTeams = false,
                centerTop = "TRAINING",
                centerBottom = "Schaden/s: " + Mathf.RoundToInt(dps) + "   Gesamt: " + Mathf.RoundToInt(Ctx.LocalPlayer != null ? Ctx.LocalPlayer.DamageDealt : 0f),
                leftProgress = -1f, rightProgress = -1f
            };
        }

        protected override void OnTimeUp() { }
    }
}
