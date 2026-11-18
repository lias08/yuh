// ---------------------------------------------------------------------------------------------
// Team-Modi (3v3): Teamkampf (Kills), Gem Grab (Edelsteine sammeln + Countdown),
// Brawl Ball (Tore schießen).
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using BrawlArena.Audio;
using BrawlArena.Data;
using BrawlArena.Gameplay;
using BrawlArena.Net;
using BrawlArena.Rendering;

namespace BrawlArena.Modes
{
    // ============================================================================ Teamkampf
    /// <summary>3v3-Teamkampf: Das Team mit den meisten Eliminierungen (oder zuerst targetScore) gewinnt.</summary>
    public class TeamBattleMode : GameModeController
    {
        private readonly int[] score = new int[2];

        public override void OnBrawlerDied(Brawler victim, Brawler killer)
        {
            base.OnBrawlerDied(victim, killer);
            int scorer = victim.TeamId == 0 ? 1 : 0;
            score[scorer] += 1;
            if (score[scorer] >= Def.targetScore) Finish();
        }

        protected override void OnTimeUp() { Finish(); }

        private void Finish()
        {
            int lt = Ctx.LocalTeam;
            int mine = score[lt], theirs = score[1 - lt];
            string detail = mine + " : " + theirs;
            if (mine > theirs) End(MatchOutcome.Victory, 0, "SIEG!", detail);
            else if (mine < theirs) End(MatchOutcome.Defeat, 0, "NIEDERLAGE", detail);
            else End(MatchOutcome.Draw, 0, "UNENTSCHIEDEN", detail);
        }

        public override HudInfo GetHudInfo()
        {
            int lt = Ctx.LocalTeam;
            return new HudInfo
            {
                showTeams = true, leftValue = score[lt].ToString(), rightValue = score[1 - lt].ToString(),
                centerTop = TimeText(), centerBottom = "Ziel: " + Def.targetScore + " K.O.",
                leftProgress = score[lt] / (float)Def.targetScore, rightProgress = score[1 - lt] / (float)Def.targetScore
            };
        }

        public override BotObjective GetBotObjective(Brawler bot)
        {
            // Mitte halten und angreifen
            return new BotObjective { position = Vector3.zero, hasPosition = true, aggression = 0.85f };
        }
    }

    // ============================================================================ Gem Grab
    /// <summary>Edelsteine aus der Mine sammeln. Hält ein Team ≥ targetScore Steine für countdownTime Sekunden, gewinnt es.</summary>
    public class GemGrabMode : GameModeController
    {
        private float spawnTimer = 4f;
        private float countdown = -1f;
        private int countdownTeam = -1;
        private Transform mineVisual;
        private int lastShownSecond = -1;

        public override void AfterSpawn()
        {
            base.AfterSpawn();
            if (!Ctx.Arena.GemMine.HasValue) Ctx.Arena.GemMine = Vector3.zero;
            var go = new GameObject("GemMine");
            go.transform.SetParent(Ctx.EntityRoot, false);
            go.transform.position = Ctx.Arena.GemMine.Value;
            var mb = new MeshBuilder();
            mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.1f, 0), Quaternion.identity, new Vector3(1.6f, 0.2f, 1.6f), new Color(0.35f, 0.3f, 0.4f));
            mb.Add(ProcMesh.Torus, new Vector3(0, 0.2f, 0), Quaternion.identity, new Vector3(1.9f, 1f, 1.9f), new Color(0.55f, 0.5f, 0.6f));
            for (int i = 0; i < 6; i++)
            {
                float a = i / 6f * Mathf.PI * 2f;
                mb.Add(ProcMesh.Cone, new Vector3(Mathf.Cos(a) * 0.75f, 0.35f, Mathf.Sin(a) * 0.75f), Quaternion.Euler(Mathf.Sin(a) * 20f, 0, Mathf.Cos(a) * -20f), new Vector3(0.25f, 0.5f, 0.25f), new Color(0.8f, 0.4f, 1f));
            }
            go.AddComponent<MeshFilter>().sharedMesh = mb.Build("GemMine");
            go.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.WorldToonOutline;
            mineVisual = go.transform;
        }

        public override void Tick(float dt)
        {
            base.Tick(dt);
            if (IsOver) return;
            spawnTimer -= dt;
            if (spawnTimer <= 0f && Ctx.Pickups.Count < 20)
            {
                spawnTimer = 7f;
                var dir = Quaternion.Euler(0, Random.Range(0f, 360f), 0) * Vector3.forward;
                Pickup.Spawn(PickupType.Gem, Ctx.Arena.GemMine.Value + Vector3.up * 0.1f, dir * Random.Range(2f, 4f));
                FX.Sparkle(Ctx.Arena.GemMine.Value + Vector3.up * 0.5f, new Color(0.9f, 0.5f, 1f));
            }
            if (mineVisual != null && Random.value < 0.08f) FX.Sparkle(mineVisual.position + Vector3.up * 0.5f, new Color(0.9f, 0.5f, 1f));

            int g0 = TeamGems(0), g1 = TeamGems(1);
            int leader = -1;
            if (g0 >= Def.targetScore && g0 > g1) leader = 0;
            else if (g1 >= Def.targetScore && g1 > g0) leader = 1;
            if (leader < 0) { countdown = -1f; countdownTeam = -1; lastShownSecond = -1; }
            else
            {
                if (countdownTeam != leader) { countdownTeam = leader; countdown = Def.countdownTime; Ctx.Announce(leader == Ctx.LocalTeam ? "HALTET DURCH!" : "GEGNER-COUNTDOWN!", ""); }
                countdown -= dt;
                int sec = Mathf.CeilToInt(countdown);
                if (sec != lastShownSecond && sec <= 5 && sec > 0) { lastShownSecond = sec; AudioManager.Sfx(SfxPreset.Countdown, null, 0.6f); }
                if (countdown <= 0f)
                {
                    int lt = Ctx.LocalTeam;
                    string detail = TeamGems(lt) + " : " + TeamGems(1 - lt) + " Edelsteine";
                    End(leader == lt ? MatchOutcome.Victory : MatchOutcome.Defeat, 0, leader == lt ? "SIEG!" : "NIEDERLAGE", detail);
                }
            }
        }

        protected override void OnTimeUp()
        {
            int lt = Ctx.LocalTeam;
            int a = TeamGems(lt), b = TeamGems(1 - lt);
            string d = a + " : " + b + " Edelsteine";
            if (a > b) End(MatchOutcome.Victory, 0, "SIEG!", d);
            else if (a < b) End(MatchOutcome.Defeat, 0, "NIEDERLAGE", d);
            else End(MatchOutcome.Draw, 0, "UNENTSCHIEDEN", d);
        }

        private int TeamGems(int team)
        {
            int n = 0;
            foreach (var b in Ctx.Brawlers) if (b.TeamId == team && b.IsAlive) n += b.Gems;
            return n;
        }

        public override bool OnPickup(Brawler b, Pickup p)
        {
            if (p.Type != PickupType.Gem) return false;
            b.Gems++;
            return true;
        }

        public override void OnBrawlerDied(Brawler victim, Brawler killer)
        {
            base.OnBrawlerDied(victim, killer);
            // Edelsteine fallen verstreut zu Boden
            for (int i = 0; i < victim.Gems; i++)
            {
                var dir = Quaternion.Euler(0, i * (360f / Mathf.Max(1, victim.Gems)) + Random.Range(-20f, 20f), 0) * Vector3.forward;
                Pickup.Spawn(PickupType.Gem, victim.Position, dir * Random.Range(2.5f, 4.5f));
            }
            victim.Gems = 0;
        }

        public override HudInfo GetHudInfo()
        {
            int lt = Ctx.LocalTeam;
            string bottom = countdown > 0f ? (countdownTeam == lt ? "Sieg in " : "Niederlage in ") + Mathf.CeilToInt(countdown) : "Sammle " + Def.targetScore + " Edelsteine";
            return new HudInfo
            {
                showTeams = true, leftValue = TeamGems(lt).ToString(), rightValue = TeamGems(1 - lt).ToString(),
                centerTop = TimeText(), centerBottom = bottom,
                leftProgress = TeamGems(lt) / (float)Def.targetScore, rightProgress = TeamGems(1 - lt) / (float)Def.targetScore
            };
        }

        public override BotObjective GetBotObjective(Brawler bot)
        {
            var o = new BotObjective { aggression = 0.6f, hasPosition = true };
            bool teamCountdown = countdownTeam == bot.TeamId && countdown > 0f;
            if (bot.Gems >= 4 || (teamCountdown && bot.Gems > 0))
            {
                o.position = OwnBase(bot.TeamId);
                o.retreat = true;
                o.aggression = 0.3f;
                return o;
            }
            // Nächster Edelstein oder Mine
            Pickup best = null; float bd = float.MaxValue;
            foreach (var p in Ctx.Pickups)
            {
                if (p.Type != PickupType.Gem) continue;
                float d = (p.transform.position - bot.Position).sqrMagnitude;
                if (d < bd) { bd = d; best = p; }
            }
            o.position = best != null ? best.transform.position : Ctx.Arena.GemMine.Value;
            if (countdownTeam >= 0 && countdownTeam != bot.TeamId) o.aggression = 1f;
            return o;
        }
    }

    // ============================================================================ Brawl Ball
    /// <summary>Den Ball ins gegnerische Tor schießen. Wer zuerst targetScore Tore hat, gewinnt.</summary>
    public class BrawlBallMode : GameModeController
    {
        private readonly int[] goals = new int[2];
        private Ball ball;
        private float resetTimer = -1f;
        private bool overtime;

        public Ball Ball { get { return ball; } }

        public override void AfterSpawn()
        {
            base.AfterSpawn();
            ball = Ball.Spawn(Ctx.Arena.BallSpawn ?? Vector3.zero);
        }

        public override void Tick(float dt)
        {
            if (resetTimer > 0f)
            {
                resetTimer -= dt;
                if (resetTimer <= 0f) ResetPositions();
                return;
            }
            base.Tick(dt);
            if (IsOver || ball == null) return;
            int scoredOn = ball.CheckGoal(Ctx.Arena);
            if (scoredOn >= 0)
            {
                int scorer = 1 - scoredOn;
                goals[scorer]++;
                AudioManager.Sfx(SfxPreset.Goal);
                FX.Explosion(ball.transform.position, 2.5f, scorer == Ctx.LocalTeam ? TeamUtil.Blue : TeamUtil.Red);
                Ctx.Announce("TOR!", scorer == Ctx.LocalTeam ? "Dein Team trifft!" : "Gegner trifft!");
                ball.Drop();
                ball.gameObject.SetActive(false);
                if (goals[scorer] >= Def.targetScore || overtime) { Finish(); return; }
                resetTimer = 3f;
            }
        }

        private void ResetPositions()
        {
            ClearRespawns();
            int[] idx = new int[2];
            foreach (var b in Ctx.Brawlers)
            {
                var p = GetSpawnPoint(b.TeamId, idx[b.TeamId]++);
                if (b.IsAlive) b.Teleport(p); else b.Respawn(p);
                b.Heal(b.MaxHealth, false);
            }
            ball.gameObject.SetActive(true);
            ball.ResetTo(Ctx.Arena.BallSpawn ?? Vector3.zero);
        }

        protected override void OnTimeUp()
        {
            if (goals[0] == goals[1] && !overtime)
            {
                overtime = true;
                Ctx.Announce("VERLÄNGERUNG", "Das nächste Tor entscheidet!");
                return;
            }
            Finish();
        }

        private void Finish()
        {
            int lt = Ctx.LocalTeam;
            int a = goals[lt], b = goals[1 - lt];
            string d = a + " : " + b;
            if (a > b) End(MatchOutcome.Victory, 0, "SIEG!", d);
            else if (a < b) End(MatchOutcome.Defeat, 0, "NIEDERLAGE", d);
            else End(MatchOutcome.Draw, 0, "UNENTSCHIEDEN", d);
        }

        public override bool OverrideAttack(Brawler b, Vector3 dir, float dist, bool isSuper)
        {
            if (ball == null || ball.Holder != b) return false;
            ball.Kick(dir, isSuper ? 20f : 13f, b);
            b.Anim.PlayAttack(SwingDirection.Thrust, false, 0.2f);
            AudioManager.Sfx(SfxPreset.Kick, b.Position);
            return true;
        }

        public override void OnBrawlerDied(Brawler victim, Brawler killer)
        {
            base.OnBrawlerDied(victim, killer);
            if (ball != null && ball.Holder == victim) ball.Drop();
        }

        public override HudInfo GetHudInfo()
        {
            int lt = Ctx.LocalTeam;
            return new HudInfo
            {
                showTeams = true, leftValue = goals[lt].ToString(), rightValue = goals[1 - lt].ToString(),
                centerTop = overtime ? "VERLÄNGERUNG" : TimeText(), centerBottom = ball != null && ball.Holder != null && ball.Holder.IsLocalPlayer ? "Angriff = Schuss, Super = Volltreffer" : "Erzielt " + Def.targetScore + " Tore",
                leftProgress = -1f, rightProgress = -1f
            };
        }

        public override BotObjective GetBotObjective(Brawler bot)
        {
            var o = new BotObjective { hasPosition = true, aggression = 0.7f };
            if (ball == null || !ball.gameObject.activeSelf) { o.position = Vector3.zero; return o; }
            if (ball.Holder == bot)
            {
                o.position = GoalCenter(1 - bot.TeamId);
                o.aggression = 0.2f;
                Vector3 toGoal = o.position - bot.Position;
                if (toGoal.magnitude < 8f && Ctx.Arena.HasLineOfSight(bot.Position + Vector3.up * 0.3f, o.position + Vector3.up * 0.3f))
                { o.shoot = true; o.shootTarget = o.position; }
            }
            else if (ball.Holder != null && ball.Holder.TeamId == bot.TeamId)
            {
                o.position = Vector3.Lerp(ball.transform.position, GoalCenter(1 - bot.TeamId), 0.5f);
            }
            else
            {
                o.position = ball.transform.position;
                o.aggression = ball.Holder != null ? 1f : 0.6f;
            }
            return o;
        }

        /// <summary>Mittelpunkt des Tors eines Teams.</summary>
        public Vector3 GoalCenter(int team)
        {
            var list = team == 0 ? Ctx.Arena.GoalBlue : Ctx.Arena.GoalRed;
            if (list.Count == 0) return new Vector3(0, 0, team == 0 ? -Ctx.Arena.Height * 0.5f : Ctx.Arena.Height * 0.5f);
            Vector3 s = Vector3.zero;
            foreach (var p in list) s += p;
            return s / list.Count;
        }
    }

    /// <summary>Der Ball in Brawl Ball: wird durch Berührung aufgenommen, geschossen, prallt ab.</summary>
    public class Ball : MonoBehaviour
    {
        public Brawler Holder { get; private set; }
        private Vector3 velocity;
        private float noPickupUntil;
        private Brawler lastKicker;
        private Transform visual;

        public static Ball Spawn(Vector3 pos)
        {
            var go = new GameObject("Ball");
            go.transform.SetParent(MatchContext.Current.EntityRoot, false);
            var b = go.AddComponent<Ball>();
            var mb = new MeshBuilder();
            mb.Add(ProcMesh.Sphere, Vector3.zero, Quaternion.identity, Vector3.one * 0.6f, Color.white);
            for (int i = 0; i < 6; i++)
            {
                var d = Quaternion.Euler(i * 60f, i * 37f, 0) * Vector3.forward;
                mb.Add(ProcMesh.SphereLow, d * 0.26f, Quaternion.LookRotation(d), new Vector3(0.2f, 0.2f, 0.1f), new Color(0.15f, 0.15f, 0.2f));
            }
            var v = new GameObject("Visual");
            b.visual = v.transform;
            b.visual.SetParent(go.transform, false);
            b.visual.localPosition = Vector3.up * 0.3f;
            v.AddComponent<MeshFilter>().sharedMesh = mb.Build("Ball");
            v.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.CharacterToon;
            b.ResetTo(pos);
            return b;
        }

        public void ResetTo(Vector3 pos)
        {
            Holder = null; velocity = Vector3.zero;
            transform.position = pos;
            noPickupUntil = Time.time + 0.5f;
        }

        public void Drop()
        {
            if (Holder != null) transform.position = Holder.Position;
            Holder = null;
            velocity = Vector3.zero;
            noPickupUntil = Time.time + 0.4f;
        }

        public void Kick(Vector3 dir, float speed, Brawler kicker)
        {
            Holder = null;
            dir.y = 0;
            velocity = dir.normalized * speed;
            transform.position = kicker.Position + dir.normalized * (kicker.Radius + 0.4f);
            noPickupUntil = Time.time + 0.35f;
            lastKicker = kicker;
        }

        private void Update()
        {
            var ctx = MatchContext.Current;
            if (ctx == null) return;
            float dt = Time.deltaTime;
            if (Holder != null)
            {
                if (!Holder.IsAlive) { Drop(); return; }
                transform.position = Holder.Position + Holder.AimFacing.normalized * (Holder.Radius + 0.3f);
                visual.Rotate(Holder.Velocity.magnitude * 120f * dt, 0, 0, Space.World);
                return;
            }
            if (velocity.sqrMagnitude > 0.01f)
            {
                Vector3 from = transform.position;
                Vector3 to = from + velocity * dt;
                Vector3 hit, n;
                if (ctx.Arena.SegmentHitsWall(from + Vector3.up * 0.3f, to + Vector3.up * 0.3f, out hit, out n) && n != Vector3.zero)
                {
                    velocity = Vector3.Reflect(velocity, n) * 0.7f;
                    to = new Vector3(hit.x, 0, hit.z);
                    AudioManager.Sfx(SfxPreset.Kick, to, 0.4f, 1.4f);
                }
                transform.position = ctx.Arena.ResolveCircle(to, 0.3f);
                velocity = Vector3.MoveTowards(velocity, Vector3.zero, dt * 9f);
                visual.Rotate(velocity.magnitude * 150f * dt, 0, 0, Space.World);
                if (FX.Quality > 0) FX.Trail(transform.position + Vector3.up * 0.3f, Color.white, 0.5f);
                // Ball trifft Gegner → kleiner Schaden + Rückstoß
                foreach (var b in ctx.Brawlers)
                {
                    if (!b.IsAlive || b == lastKicker || velocity.magnitude < 6f) continue;
                    if (lastKicker != null && b.TeamId == lastKicker.TeamId) continue;
                    if ((b.Position - transform.position).sqrMagnitude < Mathf.Pow(b.Radius + 0.35f, 2))
                    {
                        b.TakeDamage(new DamageInfo { amount = 600f, attacker = lastKicker, sourcePosition = transform.position - velocity, knockback = 1.2f, color = Color.white });
                        velocity *= 0.3f;
                    }
                }
            }
            if (Time.time < noPickupUntil) return;
            foreach (var b in ctx.Brawlers)
            {
                if (!b.IsAlive || b.IsAirborne) continue;
                if ((b.Position - transform.position).sqrMagnitude < Mathf.Pow(b.Radius + 0.4f, 2))
                {
                    Holder = b;
                    velocity = Vector3.zero;
                    AudioManager.Sfx(SfxPreset.Pickup, transform.position, 0.6f);
                    break;
                }
            }
        }

        /// <summary>-1 = kein Tor, sonst das Team, in dessen Tor der Ball liegt.</summary>
        public int CheckGoal(Arena arena)
        {
            if (Holder != null) return -1;
            foreach (var g in arena.GoalBlue) if (Mathf.Abs(g.x - transform.position.x) < 0.5f && Mathf.Abs(g.z - transform.position.z) < 0.5f) return 0;
            foreach (var g in arena.GoalRed) if (Mathf.Abs(g.x - transform.position.x) < 0.5f && Mathf.Abs(g.z - transform.position.z) < 0.5f) return 1;
            return -1;
        }
    }
}
