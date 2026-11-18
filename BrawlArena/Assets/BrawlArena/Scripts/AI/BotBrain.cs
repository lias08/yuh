// ---------------------------------------------------------------------------------------------
// BotBrain – KI für Offline-Gegner und -Mitspieler. Liefert InputFrames wie ein Spieler.
//  • Zielwahl (sichtbare Gegner, schwache Ziele bevorzugt), Wegfindung per A*
//  • Abstand halten passend zur eigenen Reichweite, seitliches Ausweichen (Strafing)
//  • Vorhalten bei Schüssen (abhängig vom Können), Super-Einsatz je nach Fähigkeit
//  • Rückzug bei wenig Leben, Modus-Ziele (Edelsteine, Ball, Gas, Boxen ...)
// skill 0..1 steuert Reaktionszeit, Zielgenauigkeit und Taktik.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Data;
using BrawlArena.Gameplay;
using BrawlArena.Modes;

namespace BrawlArena.AI
{
    public class BotBrain : IBrawlerInputSource
    {
        private readonly float skill;
        private float thinkTimer, pathTimer, strafeTimer, attackDelay, superDelay;
        private IDamageable target;
        private List<Vector3> path = new List<Vector3>();
        private int pathIndex;
        private Vector3 desired, lastPathGoal = new Vector3(9999, 0, 9999);
        private float strafeSign = 1f;
        private BotObjective objective;
        private bool retreating;

        public BotBrain(float skill)
        {
            this.skill = Mathf.Clamp01(skill);
            thinkTimer = Random.Range(0f, 0.3f);
        }

        public InputFrame Poll(Brawler self, float dt)
        {
            var ctx = MatchContext.Current;
            var frame = new InputFrame();
            if (ctx == null || ctx.Mode == null) return frame;

            thinkTimer -= dt; pathTimer -= dt; strafeTimer -= dt; attackDelay -= dt; superDelay -= dt;
            if (thinkTimer <= 0f)
            {
                thinkTimer = Mathf.Lerp(0.45f, 0.15f, skill) + Random.Range(0f, 0.1f);
                Think(self, ctx);
            }
            if (strafeTimer <= 0f) { strafeTimer = Random.Range(0.5f, 1.3f); strafeSign = Random.value < 0.5f ? -1f : 1f; }

            // ------------------------------------------------ Bewegung
            if (pathTimer <= 0f || (desired - lastPathGoal).sqrMagnitude > 2.25f)
            {
                pathTimer = 0.6f;
                lastPathGoal = desired;
                path = ctx.Arena.FindPath(self.Position, desired, self.Radius);
                pathIndex = 0;
            }
            Vector3 moveDir = Vector3.zero;
            if (path.Count > 0 && pathIndex < path.Count)
            {
                Vector3 wp = path[pathIndex];
                Vector3 to = wp - self.Position; to.y = 0;
                if (to.magnitude < 0.35f) pathIndex++;
                else moveDir = to.normalized;
            }
            // Im Kampf seitlich ausweichen
            if (target != null && !retreating && (target.Position - self.Position).magnitude < self.MainAttack.range * 1.3f)
            {
                Vector3 toT = target.Position - self.Position; toT.y = 0;
                Vector3 side = new Vector3(-toT.z, 0, toT.x).normalized * strafeSign;
                moveDir = (moveDir + side * Mathf.Lerp(0.3f, 0.9f, skill)).normalized;
            }
            frame.move = InputFrame.FromWorld(moveDir);

            // ------------------------------------------------ Modus-Sonderaktion (z.B. Torschuss)
            if (objective.shoot && attackDelay <= 0f)
            {
                Vector3 d = objective.shootTarget - self.Position; d.y = 0;
                frame.attack = true;
                frame.attackAim = InputFrame.FromWorld(d.normalized);
                attackDelay = 0.6f;
                return frame;
            }

            // ------------------------------------------------ Angriff
            if (target != null && target.IsAlive)
            {
                Vector3 to = target.Position - self.Position; to.y = 0;
                float dist = to.magnitude;
                var spec = self.MainAttack;
                bool lob = spec.kind == AttackKind.Lob;
                float reach = spec.kind == AttackKind.Melee && spec.comboSteps.Count > 0 ? spec.comboSteps[0].range : spec.range;
                bool inRange = dist <= reach * 0.95f + target.Radius;
                bool los = lob || ctx.Arena.HasLineOfSight(self.Position + Vector3.up * 0.5f, target.Position + Vector3.up * 0.5f);
                if (inRange && los && self.Ammo >= 1f && attackDelay <= 0f)
                {
                    Vector3 aimPoint = Lead(self, target, spec.projectileSpeed, dist);
                    Vector3 aim = aimPoint - self.Position; aim.y = 0;
                    float err = (1f - skill) * 18f;
                    aim = Quaternion.Euler(0, Random.Range(-err, err), 0) * aim;
                    frame.attack = true;
                    frame.attackAim = InputFrame.FromWorld(lob ? aim / Mathf.Max(0.5f, spec.range) : aim.normalized);
                    if (frame.attackAim.sqrMagnitude < 0.001f) frame.attackAuto = true;
                    attackDelay = Random.Range(0.15f, 0.55f) * Mathf.Lerp(1.6f, 0.8f, skill);
                    // Gute Bots behalten etwas Munition in Reserve
                    if (skill > 0.6f && self.Ammo < 1.9f && dist > reach * 0.6f) attackDelay += 0.4f;
                }

                // ------------------------------------------------ Super
                if (self.SuperReady && superDelay <= 0f)
                {
                    var sup = self.SuperAttack;
                    bool use = false;
                    Vector2 aim2 = InputFrame.FromWorld(to.normalized);
                    switch (sup.kind)
                    {
                        case AttackKind.HealZone:
                            use = self.Health < self.MaxHealth * 0.55f || AllyHurt(self, ctx);
                            aim2 = Vector2.zero;
                            break;
                        case AttackKind.Shield:
                            use = self.Health < self.MaxHealth * 0.6f && dist < 6f;
                            break;
                        case AttackKind.Leap:
                        case AttackKind.Lob:
                        case AttackKind.DamageZone:
                        case AttackKind.Turret:
                            use = dist <= sup.range;
                            aim2 = InputFrame.FromWorld(to / Mathf.Max(0.5f, sup.range));
                            break;
                        case AttackKind.Dash:
                            use = dist <= sup.range * 0.8f && los;
                            break;
                        default:
                            use = dist <= sup.range * 0.85f && (los || sup.destroysWalls);
                            break;
                    }
                    if (use)
                    {
                        frame.super = true;
                        frame.superAim = aim2;
                        frame.superAuto = aim2.sqrMagnitude < 0.001f;
                        superDelay = Mathf.Lerp(2f, 0.3f, skill);
                    }
                }
                frame.aiming = true;
                frame.aimingDir = InputFrame.FromWorld(to.normalized);
            }
            return frame;
        }

        private void Think(Brawler self, MatchContext ctx)
        {
            objective = ctx.Mode.GetBotObjective(self);
            float aggro = Mathf.Max(self.MainAttack.range * 1.6f, 9f);
            target = ctx.FindNearestEnemy(self.TeamId, self.Position, aggro, true);
            // Schwache Gegner in der Nähe bevorzugen
            if (skill > 0.4f)
            {
                float bestScore = float.MaxValue;
                foreach (var b in ctx.Brawlers)
                {
                    if (!b.IsAlive || b.TeamId == self.TeamId || !b.IsVisibleTo(self.TeamId)) continue;
                    float d = (b.Position - self.Position).magnitude;
                    if (d > aggro) continue;
                    float score = d + (b.Health / b.MaxHealth) * 4f * skill;
                    if (score < bestScore) { bestScore = score; target = b; }
                }
            }

            float hp = self.Health / self.MaxHealth;
            retreating = objective.retreat || (hp < Mathf.Lerp(0.15f, 0.35f, skill) && target != null && ctx.Mode.AllowRespawn(self) == false) || (hp < 0.3f && skill > 0.5f);
            bool engage = target != null && !retreating && Random.value < Mathf.Max(0.3f, objective.aggression);

            if (retreating)
            {
                if (objective.hasPosition && objective.retreat) desired = objective.position;
                else if (target != null)
                {
                    Vector3 away = self.Position - target.Position; away.y = 0;
                    desired = ctx.Arena.FindNearestFree(self.Position + away.normalized * 5f);
                }
                else desired = self.Position;
            }
            else if (engage)
            {
                var spec = self.MainAttack;
                float reach = spec.kind == AttackKind.Melee && spec.comboSteps.Count > 0 ? spec.comboSteps[0].range : spec.range;
                float keep = spec.kind == AttackKind.Melee || spec.kind == AttackKind.Dash ? 0.6f : reach * Mathf.Lerp(0.85f, 0.7f, skill);
                Vector3 toT = target.Position - self.Position; toT.y = 0;
                desired = target.Position - toT.normalized * keep;
                // Bei Modus-Zielen nicht zu weit vom Ziel weglaufen
                if (objective.hasPosition && (objective.position - self.Position).magnitude > 14f) desired = Vector3.Lerp(desired, objective.position, 0.5f);
            }
            else if (objective.hasPosition) desired = objective.position;
            else desired = self.Position + new Vector3(Random.Range(-3f, 3f), 0, Random.Range(-3f, 3f));
            desired.y = 0f;
        }

        private Vector3 Lead(Brawler self, IDamageable target, float projectileSpeed, float dist)
        {
            var b = target as Brawler;
            if (b == null || projectileSpeed <= 0.1f) return target.Position;
            float t = dist / projectileSpeed;
            return target.Position + b.Velocity * t * skill;
        }

        private static bool AllyHurt(Brawler self, MatchContext ctx)
        {
            foreach (var b in ctx.Brawlers)
                if (b != self && b.IsAlive && b.TeamId == self.TeamId && b.Health < b.MaxHealth * 0.5f && (b.Position - self.Position).sqrMagnitude < 25f) return true;
            return false;
        }
    }

    /// <summary>Trainingspuppe, die hin und her läuft.</summary>
    public class DummyWalkerInput : IBrawlerInputSource
    {
        private readonly Vector3 center;
        private float dir = 1f;
        public DummyWalkerInput(Vector3 center) { this.center = center; }

        public InputFrame Poll(Brawler self, float dt)
        {
            if (self.Position.x > center.x + 2.5f) dir = -1f;
            else if (self.Position.x < center.x - 2.5f) dir = 1f;
            return new InputFrame { move = new Vector2(dir * 0.7f, 0f) };
        }
    }

    /// <summary>Trainingspuppe, die langsam auf den Spieler schießt.</summary>
    public class DummyShooterInput : IBrawlerInputSource
    {
        private float timer = 2f;

        public InputFrame Poll(Brawler self, float dt)
        {
            var f = new InputFrame();
            var ctx = MatchContext.Current;
            if (ctx == null || ctx.LocalPlayer == null || !ctx.LocalPlayer.IsAlive) return f;
            Vector3 to = ctx.LocalPlayer.Position - self.Position; to.y = 0;
            f.aiming = true; f.aimingDir = InputFrame.FromWorld(to.normalized);
            timer -= dt;
            if (timer <= 0f && to.magnitude < self.MainAttack.range)
            {
                timer = 2.2f;
                f.attack = true;
                f.attackAim = InputFrame.FromWorld(to.normalized);
            }
            return f;
        }
    }
}
