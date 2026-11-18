// ---------------------------------------------------------------------------------------------
// AttackSystem – führt jeden AttackSpec aus: Schüsse, Würfe, Nahkampf (inkl. Kombos mit
// Energiewelle), Strahlen, Bumerangs, Novas, Stürme, Sprünge, Zonen, Türme, Schilde und
// eigene Muster. Alle Werte stammen aus den Daten – hier steht nur die Mechanik.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Audio;
using BrawlArena.Data;

namespace BrawlArena.Gameplay
{
    /// <summary>Kontext eines ausgelösten Angriffs – wird auch an CustomAttackPattern übergeben.</summary>
    public class AttackContext
    {
        public Brawler Owner;
        public AttackSpec Spec;
        public Vector3 AimDirection;
        public float AimDistance;
        public bool IsSuper;

        public Vector3 Origin { get { return Owner.MuzzlePosition; } }
        public Vector3 TargetPoint { get { return Owner.Position + AimDirection * AimDistance; } }
        public float DamageMultiplier { get { return Owner.DamageMultiplier; } }

        /// <summary>Feuert ein gerades Projektil mit den Werten des Specs.</summary>
        public Projectile SpawnProjectile(Vector3 dir, float range, float damage)
        {
            return ProjectileSystem.Fire(Owner, Spec, Origin, dir, range, damage * DamageMultiplier, IsSuper);
        }

        /// <summary>Flächenschaden an einem Punkt.</summary>
        public void DamageArea(Vector3 center, float radius, float damage)
        {
            AttackSystem.DamageArea(Owner, center, radius, damage * DamageMultiplier, Spec, IsSuper, null);
        }

        /// <summary>Verzögert eine Aktion (nur solange das Match läuft).</summary>
        public void Schedule(float delay, System.Action action)
        {
            if (MatchContext.Current != null) MatchContext.Current.Schedule(delay, action);
        }
    }

    public static class AttackSystem
    {
        public static void Execute(Brawler owner, AttackSpec spec, Vector3 dir, float dist, bool isSuper)
        {
            var ctx = new AttackContext { Owner = owner, Spec = spec, AimDirection = dir.normalized, AimDistance = dist, IsSuper = isSuper };
            var match = MatchContext.Current;
            float mult = owner.DamageMultiplier;
            Vector3 targetPoint = ctx.TargetPoint;

            switch (spec.kind)
            {
                case AttackKind.Shot:
                {
                    if (spec.chargeTime > 0.01f)
                    {
                        // Aufgeladener Schuss: Energie sammelt sich, dann ein gewaltiger Hieb nach vorne
                        owner.Root(spec.chargeTime + 0.15f);
                        owner.Anim.PlayAttack(SwingDirection.Overhead, true, spec.chargeTime + 0.2f);
                        FX.PowerUp(owner.Position, spec.color);
                        FX.ShakeCamera(0.15f);
                        for (int i = 1; i <= 4; i++)
                            match.Schedule(spec.chargeTime * i / 5f, () => { if (owner.IsAlive) { FX.Ring(owner.Position, 2.2f, spec.color, 0.3f); FX.Sparkle(owner.MuzzlePosition, spec.color); } });
                        match.Schedule(spec.chargeTime, () =>
                        {
                            if (!owner.IsAlive) return;
                            FireSpread(owner, spec, ctx.AimDirection, spec.projectileCount, spec.spreadAngle, mult, isSuper);
                            FX.Slash(owner.Position, ctx.AimDirection, 3f, 160f, spec.color, true);
                            FX.Explosion(owner.MuzzlePosition, 1.2f, spec.color);
                            AudioManager.Sfx(SfxPreset.Explosion, owner.Position);
                        });
                        break;
                    }
                    owner.Anim.PlayAttack(SwingDirection.Thrust, false, 0.22f);
                    for (int b = 0; b < spec.burstCount; b++)
                    {
                        System.Action fire = () =>
                        {
                            if (!owner.IsAlive) return;
                            FireSpread(owner, spec, ctx.AimDirection, spec.projectileCount, spec.spreadAngle, mult, isSuper);
                            FX.Muzzle(owner.MuzzlePosition, ctx.AimDirection, spec.color);
                            if (spec.burstCount > 1) owner.Anim.PlayAttack(SwingDirection.Thrust, false, 0.12f);
                        };
                        if (b == 0) fire(); else match.Schedule(b * spec.burstInterval, fire);
                    }
                    break;
                }
                case AttackKind.Nova:
                {
                    owner.Anim.PlayAttack(SwingDirection.Spin, true, 0.3f);
                    for (int b = 0; b < spec.burstCount; b++)
                    {
                        int burst = b;
                        System.Action fire = () =>
                        {
                            if (!owner.IsAlive) return;
                            int n = Mathf.Max(3, spec.projectileCount);
                            for (int i = 0; i < n; i++)
                            {
                                Vector3 d = Quaternion.Euler(0, 360f / n * i + burst * (180f / n), 0) * ctx.AimDirection;
                                ProjectileSystem.Fire(owner, spec, owner.Position + Vector3.up * 0.6f + d * owner.Radius, d, spec.range, spec.damage * mult, isSuper);
                            }
                            FX.Ring(owner.Position, 1.2f, spec.color, 0.3f);
                        };
                        if (b == 0) fire(); else match.Schedule(b * spec.burstInterval, fire);
                    }
                    break;
                }
                case AttackKind.Lob:
                {
                    owner.Anim.PlayAttack(SwingDirection.Overhead, false, 0.3f);
                    int n = Mathf.Max(1, spec.projectileCount);
                    for (int i = 0; i < n; i++)
                    {
                        Vector3 tp = targetPoint;
                        if (n > 1)
                        {
                            float a = i / (float)n * Mathf.PI * 2f;
                            tp += new Vector3(Mathf.Cos(a), 0, Mathf.Sin(a)) * spec.areaRadius * 0.9f;
                        }
                        int idx = i;
                        System.Action throwIt = () =>
                        {
                            if (!owner.IsAlive) return;
                            ProjectileSystem.Lob(owner, spec, owner.MuzzlePosition, tp, spec.damage * mult, isSuper, null);
                        };
                        if (idx == 0) throwIt(); else match.Schedule(idx * Mathf.Max(0.04f, spec.burstInterval), throwIt);
                    }
                    break;
                }
                case AttackKind.Melee:
                {
                    if (spec.comboSteps != null && spec.comboSteps.Count > 0) ExecuteCombo(owner, spec, ctx.AimDirection, isSuper);
                    else
                    {
                        owner.Anim.PlayAttack(SwingDirection.LeftToRight, true, 0.22f);
                        float arc = spec.spreadAngle > 1f ? spec.spreadAngle : 100f;
                        MeleeSwing(owner, spec, ctx.AimDirection, spec.range, arc, spec.damage * mult, spec.knockback, isSuper, true);
                    }
                    break;
                }
                case AttackKind.Beam:
                {
                    owner.Anim.PlayAttack(SwingDirection.Thrust, false, 0.25f);
                    Vector3 from = owner.MuzzlePosition;
                    Vector3 to = from + ctx.AimDirection * spec.range;
                    Vector3 end = spec.pierce ? match.Arena.ClipToWalls(from, to) : match.Arena.ClipToWalls(from, to);
                    float width = Mathf.Max(0.2f, spec.projectileRadius);
                    var hits = new List<IDamageable>();
                    foreach (var d in match.GetEnemyTargets(owner.TeamId))
                    {
                        float t;
                        float dd = DistancePointSegment(d.Position, from, end, out t);
                        if (dd < width + d.Radius) hits.Add(d);
                    }
                    hits.Sort((x, y) => (x.Position - from).sqrMagnitude.CompareTo((y.Position - from).sqrMagnitude));
                    if (!spec.pierce && hits.Count > 0)
                    {
                        Vector3 hp = hits[0].Position; hp.y = from.y;
                        end = hp;
                        hits.RemoveRange(1, hits.Count - 1);
                    }
                    foreach (var h in hits) DealDamage(owner, h, spec, spec.damage * mult, from, isSuper);
                    FX.Beam(from, end, spec.color, width);
                    if (spec.destroysWalls) match.Arena.DestroyTilesInRadius(end, 0.8f);
                    break;
                }
                case AttackKind.Boomerang:
                {
                    owner.Anim.PlayAttack(SwingDirection.LeftToRight, true, 0.25f);
                    int n = Mathf.Max(1, spec.projectileCount);
                    for (int i = 0; i < n; i++)
                    {
                        float a = n > 1 ? Mathf.Lerp(-spec.spreadAngle * 0.5f, spec.spreadAngle * 0.5f, i / (float)(n - 1)) : 0f;
                        var p = ProjectileSystem.Fire(owner, spec, owner.MuzzlePosition, Quaternion.Euler(0, a, 0) * ctx.AimDirection, spec.range, spec.damage * mult, isSuper);
                        if (p != null) p.SetBoomerang();
                    }
                    break;
                }
                case AttackKind.Dash:
                    owner.Anim.PlayAttack(SwingDirection.Thrust, true, 0.3f);
                    owner.StartDash(ctx.AimDirection, spec.range, spec, isSuper);
                    break;
                case AttackKind.Leap:
                    owner.StartLeap(owner.Position + ctx.AimDirection * Mathf.Clamp(dist, 0.5f, spec.range), spec, isSuper);
                    break;
                case AttackKind.HealZone:
                case AttackKind.DamageZone:
                {
                    owner.Anim.PlayAttack(SwingDirection.Overhead, false, 0.3f);
                    if (dist < 0.4f)
                        Zone.Spawn(owner, spec, owner.Position, isSuper);
                    else
                        ProjectileSystem.Lob(owner, spec, owner.MuzzlePosition, targetPoint, 0f, isSuper, land => Zone.Spawn(owner, spec, land, isSuper));
                    break;
                }
                case AttackKind.Turret:
                    owner.Anim.PlayAttack(SwingDirection.Overhead, false, 0.3f);
                    ProjectileSystem.Lob(owner, spec, owner.MuzzlePosition, targetPoint, 0f, isSuper, land => Turret.Spawn(owner, spec, land));
                    break;
                case AttackKind.Shield:
                    owner.ApplyShield(spec.shieldPercent, spec.duration);
                    if (spec.healAmount > 0f) owner.Heal(spec.healAmount * mult, true);
                    ShieldBubble.Attach(owner, spec.duration, spec.color);
                    if (spec.damage > 0f) DamageArea(owner, owner.Position, spec.areaRadius, spec.damage * mult, spec, isSuper, null);
                    AudioManager.Sfx(SfxPreset.Shield, owner.Position);
                    break;
                case AttackKind.Custom:
                    owner.Anim.PlayAttack(SwingDirection.Thrust, false, 0.25f);
                    if (spec.customPattern != null) spec.customPattern.Execute(ctx);
                    else FireSpread(owner, spec, ctx.AimDirection, 1, 0, mult, isSuper);
                    break;
            }
        }

        private static void FireSpread(Brawler owner, AttackSpec spec, Vector3 dir, int count, float spread, float mult, bool isSuper)
        {
            Vector3 origin = owner.MuzzlePosition;
            for (int i = 0; i < count; i++)
            {
                float a = count > 1 ? Mathf.Lerp(-spread * 0.5f, spread * 0.5f, i / (float)(count - 1)) : 0f;
                ProjectileSystem.Fire(owner, spec, origin, Quaternion.Euler(0, a, 0) * dir, spec.range, spec.damage * mult, isSuper);
            }
        }

        // ------------------------------------------------------------------ Kombos
        /// <summary>Führt eine Kombo aus: mehrere Schläge (+ optionale Energiewelle) mit einem Munitionsbalken.</summary>
        private static void ExecuteCombo(Brawler owner, AttackSpec spec, Vector3 dir, bool isSuper)
        {
            var match = MatchContext.Current;
            var steps = spec.comboSteps;
            for (int i = 0; i < steps.Count; i++)
            {
                var step = steps[i];
                float nextDelay = i + 1 < steps.Count ? steps[i + 1].delay - step.delay : 0.25f;
                System.Action doStep = () =>
                {
                    if (!owner.IsAlive || owner.IsStunned) return;
                    float mult = owner.DamageMultiplier;
                    Vector3 d = owner.AimFacing.sqrMagnitude > 0.01f ? owner.AimFacing.normalized : dir;
                    owner.Anim.PlayAttack(step.swing, true, Mathf.Clamp(nextDelay * 0.95f, 0.12f, 0.3f));
                    owner.Lunge(d, step.lunge);
                    float arc = step.swing == SwingDirection.Spin ? 360f : step.arcAngle;
                    MeleeSwing(owner, spec, d, step.range, arc, step.damage * mult, step.knockback, isSuper,
                        step.swing != SwingDirection.RightToLeft, step.swing);
                    if (step.firesWave)
                    {
                        var wave = spec.Clone();
                        wave.kind = AttackKind.Shot;
                        wave.visual = ProjectileVisual.Slash;
                        wave.projectileSpeed = step.waveSpeed;
                        wave.projectileRadius = step.waveWidth;
                        wave.pierce = step.wavePierces;
                        wave.color = step.waveColor;
                        wave.knockback = 0f;
                        ProjectileSystem.Fire(owner, wave, owner.Position + Vector3.up * 0.6f + d * 0.4f, d, step.waveRange, step.waveDamage * mult, isSuper);
                        FX.Muzzle(owner.Position + Vector3.up * 0.6f + d * 0.6f, d, step.waveColor);
                        FX.ShakeCamera(0.1f);
                    }
                };
                if (step.delay <= 0f && i == 0) doStep();
                else match.Schedule(step.delay, doStep);
            }
        }

        /// <summary>Nahkampf-Hieb im Kreissektor. Wände blockieren den Treffer.</summary>
        public static void MeleeSwing(Brawler owner, AttackSpec spec, Vector3 dir, float range, float arc, float damage, float knockback, bool isSuper, bool leftToRight, SwingDirection swing = SwingDirection.LeftToRight)
        {
            var match = MatchContext.Current;
            Vector3 c = owner.Position;
            foreach (var d in match.GetEnemyTargets(owner.TeamId))
            {
                Vector3 to = d.Position - c; to.y = 0;
                float dist = to.magnitude;
                if (dist > range + d.Radius) continue;
                if (dist > 0.3f && Vector3.Angle(dir, to) > arc * 0.5f + Mathf.Rad2Deg * Mathf.Atan2(d.Radius, dist)) continue;
                if (!match.Arena.HasLineOfSight(c + Vector3.up * 0.5f, d.Position + Vector3.up * 0.5f)) continue;
                var info = MakeInfo(owner, spec, damage, c, isSuper);
                info.knockback = knockback;
                float dealt = d.TakeDamage(info);
                if (dealt > 0f)
                {
                    FX.Hit(d.Position + Vector3.up * 0.6f, spec.color);
                    if (spec.healAmount > 0f) owner.Heal(spec.healAmount, true);
                }
            }
            if (spec.destroysWalls) match.Arena.DestroyTilesInRadius(c + dir * range * 0.6f, range * 0.5f);
            FX.Slash(c, dir, range, Mathf.Min(arc, 359f), spec.color, leftToRight);
            AudioManager.Sfx(SfxPreset.Swoosh, c, 0.7f);
        }

        // ------------------------------------------------------------------ Schaden
        public static DamageInfo MakeInfo(Brawler owner, AttackSpec spec, float damage, Vector3 from, bool isSuper)
        {
            return new DamageInfo
            {
                amount = damage,
                attacker = owner,
                sourcePosition = from,
                knockback = spec.knockback,
                slowPercent = spec.slowPercent,
                slowDuration = spec.slowDuration,
                stunDuration = spec.stunDuration,
                fromSuper = isSuper,
                color = spec.color
            };
        }

        public static float DealDamage(Brawler owner, IDamageable target, AttackSpec spec, float damage, Vector3 from, bool isSuper)
        {
            float dealt = target.TakeDamage(MakeInfo(owner, spec, damage, from, isSuper));
            if (dealt > 0f)
            {
                FX.Hit(target.Position + Vector3.up * 0.6f, spec.color);
                AudioManager.Sfx(SfxPreset.Hit, target.Position, 0.6f);
                if (spec.healAmount > 0f && owner != null && owner.IsAlive) owner.Heal(spec.healAmount, true);
            }
            return dealt;
        }

        /// <summary>Flächenschaden; Ziele in "exclude" werden übersprungen.</summary>
        public static void DamageArea(Brawler owner, Vector3 center, float radius, float damage, AttackSpec spec, bool isSuper, HashSet<IDamageable> exclude)
        {
            var match = MatchContext.Current;
            if (match == null || damage <= 0f) return;
            int team = owner != null ? owner.TeamId : TeamUtil.Neutral;
            foreach (var d in match.GetEnemyTargets(team))
            {
                if (exclude != null && exclude.Contains(d)) continue;
                Vector3 to = d.Position - center; to.y = 0;
                if (to.magnitude > radius + d.Radius) continue;
                DealDamage(owner, d, spec, damage, center, isSuper);
            }
            if (spec.destroysWalls) match.Arena.DestroyTilesInRadius(center, radius);
        }

        public static float DistancePointSegment(Vector3 p, Vector3 a, Vector3 b, out float t)
        {
            p.y = a.y = b.y = 0;
            Vector3 ab = b - a;
            float len2 = ab.sqrMagnitude;
            t = len2 > 0.0001f ? Mathf.Clamp01(Vector3.Dot(p - a, ab) / len2) : 0f;
            return Vector3.Distance(p, a + ab * t);
        }
    }
}
