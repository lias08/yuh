// ---------------------------------------------------------------------------------------------
// MatchContext – baut ein Match aus einer MatchConfig auf und steuert seinen Ablauf:
// Arena + Licht + Kamera + Projektile + Spielmodus → Intro & Countdown → Spiel → Ende.
// Stellt außerdem Abfragen für Gameplay & KI bereit (Ziele, Gegner, Sichtbarkeit ...).
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Audio;
using BrawlArena.Core;
using BrawlArena.Data;
using BrawlArena.Modes;
using BrawlArena.Net;

namespace BrawlArena.Gameplay
{
    public enum MatchPhase { Intro, Countdown, Playing, Ending, Finished }

    public class MatchContext : MonoBehaviour
    {
        public static MatchContext Current { get; private set; }

        public MatchConfig Config { get; private set; }
        public GameModeDefinition ModeDef { get; private set; }
        public MapDefinition MapDef { get; private set; }
        public Arena Arena { get; private set; }
        public GameModeController Mode { get; private set; }
        public ArenaCamera Camera { get; private set; }
        public Transform EntityRoot { get; private set; }
        public Brawler LocalPlayer { get; private set; }
        public int LocalTeam { get { return LocalPlayer != null ? LocalPlayer.TeamId : 0; } }
        public MatchPhase Phase { get; private set; }
        public float MatchTime { get; private set; }
        public float PhaseTime { get; private set; }
        public bool InputLocked { get { return Phase != MatchPhase.Playing; } }
        public System.Random Rng { get; private set; }

        /// <summary>Wird vom HUD gesetzt: liefert die Spielereingaben.</summary>
        public IBrawlerInputSource LocalInputSource;

        public readonly List<Brawler> Brawlers = new List<Brawler>();
        public readonly List<IDamageable> Damageables = new List<IDamageable>();
        public readonly List<Pickup> Pickups = new List<Pickup>();
        public readonly List<string> KillFeed = new List<string>();
        public event Action<string> KillFeedAdded;
        public event Action<string, string> Announcement; // (Titel, Untertitel)

        private Action<MatchResult> onFinished;
        private MatchResult result;
        private Light sun;

        private struct Scheduled { public float time; public Action action; }
        private readonly List<Scheduled> scheduled = new List<Scheduled>();
        private readonly List<Scheduled> scheduleBuffer = new List<Scheduled>();
        private readonly List<IDamageable>[] targetLists = new List<IDamageable>[8];
        private int targetListIdx;
        private int lastCountdown;

        // ================================================================= Aufbau
        public static MatchContext StartMatch(MatchConfig config, Action<MatchResult> onFinished)
        {
            if (Current != null) Current.Dispose();
            var go = new GameObject("Match");
            var ctx = go.AddComponent<MatchContext>();
            Current = ctx;
            ctx.Setup(config, onFinished);
            return ctx;
        }

        private void Setup(MatchConfig config, Action<MatchResult> finished)
        {
            Config = config;
            onFinished = finished;
            Rng = new System.Random(config.seed);
            for (int i = 0; i < targetLists.Length; i++) targetLists[i] = new List<IDamageable>(32);

            ModeDef = ContentDatabase.GetMode(config.modeId);
            MapDef = ContentDatabase.GetMap(config.mapId);
            if (MapDef == null || ModeDef == null) throw new Exception("Modus oder Karte nicht gefunden: " + config.modeId + " / " + config.mapId);

            var arenaGo = new GameObject("Arena");
            arenaGo.transform.SetParent(transform, false);
            Arena = arenaGo.AddComponent<Arena>();
            Arena.Build(MapDef);

            EntityRoot = new GameObject("Entities").transform;
            EntityRoot.SetParent(transform, false);
            ProjectileSystem.Create(transform);
            SetupLighting(MapDef.theme);

            Camera = ArenaCamera.Create(transform, MapDef.theme.sky);
            Brawler.Died += OnBrawlerDied;

            Mode = GameModeController.Create(ModeDef);
            Mode.Setup(this, ModeDef);
            Mode.SpawnParticipants();
            Mode.AfterSpawn();

            if (LocalPlayer != null)
            {
                Camera.SetTarget(LocalPlayer.transform, Arena);
                Camera.SnapTo(LocalPlayer.transform.position);
            }
            Phase = MatchPhase.Intro;
            PhaseTime = 0f;
            lastCountdown = 4;
            if (AudioManager.Instance != null) AudioManager.Instance.PlayBattleMusic();
            Announce(ModeDef.displayName, MapDef.displayName);
        }

        private void SetupLighting(MapTheme theme)
        {
            var lgo = new GameObject("Sun");
            lgo.transform.SetParent(transform, false);
            lgo.transform.rotation = Quaternion.Euler(52f, -35f, 0f);
            sun = lgo.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = theme.sunColor;
            sun.intensity = theme.sunIntensity;
            sun.shadows = QualitySettings.shadows == ShadowQuality.Disable ? LightShadows.None : LightShadows.Soft;
            sun.shadowStrength = 0.55f;
            sun.shadowBias = 0.04f;
            sun.shadowNormalBias = 0.3f;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = Color.Lerp(theme.sky, Color.white, 0.4f);
            RenderSettings.ambientEquatorColor = Color.Lerp(theme.groundA, Color.white, 0.3f);
            RenderSettings.ambientGroundColor = Color.Lerp(theme.groundB, Color.black, 0.3f);
            RenderSettings.fog = false;
        }

        // ================================================================= Brawler erzeugen
        /// <summary>Erzeugt einen Brawler für einen Teilnehmer (inkl. Skin, Level, Steuerung).</summary>
        public Brawler SpawnBrawler(MatchParticipant p, Vector3 pos)
        {
            var baseDef = ContentDatabase.GetBrawler(p.brawlerId) ?? ContentDatabase.Brawlers[0];
            var def = ContentDatabase.CreateSkinned(baseDef, p.skinId);
            IBrawlerInputSource input;
            if (p.isLocal) input = LocalInputSource ?? new NullInput();
            else if (p.isBot) input = new AI.BotBrain(p.botSkill);
            else input = new NullInput(); // Platz für Netzwerk-Eingaben
            return SpawnBrawler(def, p.level, p.team, p.displayName, p.isLocal, p.isBot, input, pos);
        }

        public Brawler SpawnBrawler(BrawlerDefinition def, int level, int team, string name, bool isLocal, bool isBot, IBrawlerInputSource input, Vector3 pos)
        {
            var go = new GameObject("Brawler_" + name);
            go.transform.SetParent(transform, false);
            go.transform.position = Arena.FindNearestFree(pos);
            var b = go.AddComponent<Brawler>();
            b.Init(def, level, team, name, isLocal, isBot, input);
            Brawlers.Add(b);
            Damageables.Add(b);
            if (isLocal) LocalPlayer = b;
            return b;
        }

        public void RemoveBrawler(Brawler b)
        {
            Brawlers.Remove(b);
            Damageables.Remove(b);
            if (b != null) Destroy(b.gameObject);
        }

        public void RegisterDamageable(IDamageable d) { if (!Damageables.Contains(d)) Damageables.Add(d); }
        public void UnregisterDamageable(IDamageable d) { Damageables.Remove(d); }
        public void RegisterPickup(Pickup p) { Pickups.Add(p); }
        public void UnregisterPickup(Pickup p) { Pickups.Remove(p); }

        // ================================================================= Ablauf
        private void Update()
        {
            float dt = Time.deltaTime;
            PhaseTime += dt;
            RunScheduled();
            if (AudioManager.Instance != null && LocalPlayer != null) AudioManager.Instance.ListenerPosition = LocalPlayer.Position;

            switch (Phase)
            {
                case MatchPhase.Intro:
                    if (PhaseTime > 1.2f) { Phase = MatchPhase.Countdown; PhaseTime = 0f; }
                    break;
                case MatchPhase.Countdown:
                {
                    int n = 3 - Mathf.FloorToInt(PhaseTime / 0.7f);
                    if (n != lastCountdown && n >= 1)
                    {
                        lastCountdown = n;
                        Announce(n.ToString(), "");
                        AudioManager.Sfx(SfxPreset.Countdown, null, 0.8f);
                    }
                    if (PhaseTime >= 2.1f)
                    {
                        Phase = MatchPhase.Playing; PhaseTime = 0f;
                        Announce("LOS!", "");
                        AudioManager.Sfx(SfxPreset.Countdown, null, 0.9f, 1.5f);
                    }
                    break;
                }
                case MatchPhase.Playing:
                    MatchTime += dt;
                    Mode.Tick(dt);
                    if (Mode.IsOver) BeginEnding();
                    break;
                case MatchPhase.Ending:
                    if (PhaseTime > 3f) Finish();
                    break;
            }
        }

        private void LateUpdate()
        {
            int lt = LocalTeam;
            foreach (var b in Brawlers)
            {
                if (b == null || b.Anim == null) continue;
                if (!b.IsAlive) continue;
                bool visible = b.IsVisibleTo(lt);
                b.Anim.SetVisible(visible);
                b.Anim.SetGhost(b.TeamId == lt && b.InBush);
            }
        }

        private void BeginEnding()
        {
            Phase = MatchPhase.Ending; PhaseTime = 0f;
            result = Mode.BuildResult();
            result.duration = MatchTime;
            foreach (var b in Brawlers)
            {
                result.stats.Add(new ParticipantStats
                {
                    name = b.PlayerName, brawlerId = b.Def.id, team = b.TeamId, isLocal = b.IsLocalPlayer,
                    kills = b.Kills, deaths = b.Deaths, damage = b.DamageDealt, healing = b.HealingDone,
                    score = Mathf.RoundToInt(b.DamageDealt / 100f + b.Kills * 30 + b.HealingDone / 150f)
                });
                if (b.IsAlive) b.Anim.SetVictory(result.outcome == MatchOutcome.Victory ? b.TeamId == LocalTeam : b.TeamId != LocalTeam);
            }
            ParticipantStats mvp = null;
            foreach (var s in result.stats) if (mvp == null || s.score > mvp.score) mvp = s;
            if (mvp != null) { result.mvpName = mvp.name; result.starPlayer = mvp.isLocal; }

            bool win = result.outcome == MatchOutcome.Victory;
            Announce(result.headline, result.detail);
            AudioManager.Sfx(win ? SfxPreset.Victory : (result.outcome == MatchOutcome.Draw ? SfxPreset.Confirm : SfxPreset.Defeat));
            if (AudioManager.Instance != null) AudioManager.Instance.StopMusic();
            if (LocalPlayer != null) Camera.ZoomIn();
        }

        private void Finish()
        {
            if (Phase == MatchPhase.Finished) return;
            Phase = MatchPhase.Finished;
            var cb = onFinished;
            var r = result;
            Dispose();
            if (cb != null) cb(r);
        }

        /// <summary>Spieler verlässt das Match vorzeitig (zählt als Niederlage).</summary>
        public void Abandon()
        {
            if (Phase == MatchPhase.Finished) return;
            result = new MatchResult
            {
                modeId = ModeDef.id, mapId = MapDef.id, outcome = ModeDef.ranked ? MatchOutcome.Abandoned : MatchOutcome.None,
                headline = "VERLASSEN", detail = "", duration = MatchTime, playerCount = Brawlers.Count
            };
            Phase = MatchPhase.Ending;
            Finish();
        }

        public void Dispose()
        {
            Brawler.Died -= OnBrawlerDied;
            Time.timeScale = 1f;
            FX.Clear();
            if (Current == this) Current = null;
            Destroy(gameObject);
        }

        private void OnDestroy()
        {
            Brawler.Died -= OnBrawlerDied;
            if (Current == this) Current = null;
        }

        private void OnBrawlerDied(Brawler victim, Brawler killer)
        {
            if (Current != this) return;
            string msg = killer != null && killer != victim
                ? killer.PlayerName + "  »  " + victim.PlayerName
                : victim.PlayerName + " wurde besiegt";
            KillFeed.Add(msg);
            if (KillFeedAdded != null) KillFeedAdded(msg);
            if (killer != null && killer.IsLocalPlayer) AudioManager.Sfx(SfxPreset.Coin, null, 0.6f);
            Mode.OnBrawlerDied(victim, killer);
        }

        public void Announce(string title, string subtitle)
        {
            if (Announcement != null) Announcement(title, subtitle);
        }

        // ================================================================= Zeitplanung
        public void Schedule(float delay, Action action)
        {
            scheduled.Add(new Scheduled { time = Time.time + Mathf.Max(0f, delay), action = action });
        }

        private void RunScheduled()
        {
            if (scheduled.Count == 0) return;
            scheduleBuffer.Clear();
            float now = Time.time;
            for (int i = scheduled.Count - 1; i >= 0; i--)
                if (scheduled[i].time <= now) { scheduleBuffer.Add(scheduled[i]); scheduled.RemoveAt(i); }
            for (int i = scheduleBuffer.Count - 1; i >= 0; i--)
            {
                try { scheduleBuffer[i].action(); }
                catch (Exception e) { Debug.LogException(e); }
            }
        }

        // ================================================================= Abfragen
        /// <summary>Alle lebenden Ziele, die NICHT zum Team gehören (inkl. neutraler Kisten).</summary>
        public List<IDamageable> GetEnemyTargets(int team)
        {
            var list = targetLists[targetListIdx];
            targetListIdx = (targetListIdx + 1) % targetLists.Length;
            list.Clear();
            for (int i = 0; i < Damageables.Count; i++)
            {
                var d = Damageables[i];
                if (d == null || !d.IsAlive) continue;
                if (d.Team == team && team != TeamUtil.Neutral) continue;
                var b = d as Brawler;
                if (b != null && b.IsAirborne) continue;
                list.Add(d);
            }
            return list;
        }

        /// <summary>Nächster sichtbarer Gegner-Brawler (oder Ziel) innerhalb der Reichweite.</summary>
        public IDamageable FindNearestEnemy(int team, Vector3 pos, float range, bool brawlersFirst)
        {
            IDamageable best = null; float bestD = range * range;
            IDamageable bestOther = null; float bestOtherD = range * range;
            foreach (var d in GetEnemyTargets(team))
            {
                float dd = (d.Position - pos).sqrMagnitude;
                var b = d as Brawler;
                if (b != null)
                {
                    if (!b.IsVisibleTo(team)) continue;
                    if (dd < bestD) { bestD = dd; best = d; }
                }
                else if (dd < bestOtherD) { bestOtherD = dd; bestOther = d; }
            }
            if (best != null) return best;
            return brawlersFirst ? bestOther : (bestOther ?? best);
        }

        /// <summary>Ziel für automatisches Zielen. Im Heilmodus: verletzter Verbündeter.</summary>
        public IDamageable FindAutoAimTarget(Brawler self, float range, bool healMode)
        {
            if (healMode)
            {
                Brawler best = null; float bestRatio = 0.95f;
                foreach (var b in Brawlers)
                {
                    if (!b.IsAlive || b.TeamId != self.TeamId || b == self) continue;
                    if ((b.Position - self.Position).sqrMagnitude > range * range) continue;
                    float ratio = b.Health / b.MaxHealth;
                    if (ratio < bestRatio) { bestRatio = ratio; best = b; }
                }
                return best;
            }
            IDamageable target = null; float bestScore = float.MaxValue;
            foreach (var d in GetEnemyTargets(self.TeamId))
            {
                Vector3 to = d.Position - self.Position;
                float dist = to.magnitude;
                if (dist > range) continue;
                var b = d as Brawler;
                if (b != null && !b.IsVisibleTo(self.TeamId)) continue;
                float score = dist + (b == null ? 4f : 0f); // Brawler bevorzugen
                if (!Arena.HasLineOfSight(self.Position + Vector3.up * 0.5f, d.Position + Vector3.up * 0.5f)) score += 3f;
                if (score < bestScore) { bestScore = score; target = d; }
            }
            return target;
        }

        /// <summary>Verhindert, dass Brawler ineinander stehen (sanftes Wegschieben).</summary>
        public Vector3 SeparateFromOthers(Brawler self, Vector3 pos)
        {
            for (int i = 0; i < Brawlers.Count; i++)
            {
                var o = Brawlers[i];
                if (o == self || !o.IsAlive || o.IsAirborne) continue;
                Vector3 d = pos - o.Position; d.y = 0;
                float min = self.Radius + o.Radius * 0.8f;
                float m = d.magnitude;
                if (m < min && m > 0.001f) pos += d / m * (min - m) * 0.5f;
            }
            return Arena.ResolveCircle(pos, self.Radius);
        }

        public int CountAlive(int team)
        {
            int n = 0;
            foreach (var b in Brawlers) if (b.IsAlive && b.TeamId == team) n++;
            return n;
        }

        public void SetPaused(bool paused) { Time.timeScale = paused ? 0f : 1f; }
    }
}
