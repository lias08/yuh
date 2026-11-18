// ---------------------------------------------------------------------------------------------
// Brawler – eine Spielfigur im Match (Spieler, Bot, Gegner-Roboter oder Trainingspuppe).
// Enthält: Lebenspunkte, Munition + Nachladen, Super-Aufladung, Bewegung mit Wandkollision,
// Statuseffekte (Verlangsamung, Betäubung, Schild), Sturm-/Sprungbewegungen, Busch-Tarnung,
// automatische Heilung, Power-Würfel, Evolution (Formwechsel) und Tod/Respawn.
// Die Steuerung kommt immer über IBrawlerInputSource (Spieler, Bot oder Netzwerk).
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Audio;
using BrawlArena.Data;

namespace BrawlArena.Gameplay
{
    public class Brawler : MonoBehaviour, IDamageable
    {
        // ---------------------------------------------------------------- Identität
        public BrawlerDefinition Def { get; private set; }
        public int Level { get; private set; }
        public int TeamId { get; private set; }
        public string PlayerName { get; private set; }
        public bool IsLocalPlayer { get; private set; }
        public bool IsBot { get; private set; }
        public IBrawlerInputSource InputSource { get; set; }
        public BrawlerAnimator Anim { get; private set; }
        /// <summary>Freie Daten für Spielmodi (z.B. Trainingspuppe, NPC).</summary>
        public object Tag;

        // ---------------------------------------------------------------- Werte
        public float Health { get; private set; }
        public float MaxHealth { get; private set; }
        public float Ammo { get; private set; }
        public float SuperCharge { get; private set; }
        public bool IsAlive { get; private set; }
        public bool CanRegenerate = true;
        public int PowerCubes { get; private set; }
        public int Gems;
        public int Kills, Deaths;
        public float DamageDealt;
        public float HealingDone;
        public int SuperUses;
        public float AliveTime;

        // ---------------------------------------------------------------- Evolution
        public int FormIndex { get; private set; } // 0 = Grundform
        public string FormName { get { return FormIndex == 0 ? Def.baseFormName : Def.forms[FormIndex - 1].formName; } }
        public AttackSpec MainAttack { get; private set; }
        public AttackSpec SuperAttack { get; private set; }
        private float formHealthMul = 1f, formSpeedMul = 1f, formReloadMul = 1f;

        // ---------------------------------------------------------------- Status
        private float lastAttackTime = -99f, lastDamagedTime = -99f, lastActionTime = -99f;
        private float slowUntil, slowFactor = 1f, stunUntil, shieldUntil, shieldFactor = 1f, speedBoostUntil, invulnerableUntil, revealedUntil;
        private float regenTick;
        public bool InBush { get; private set; }
        public Vector3 Velocity { get; private set; }
        public Vector3 AimFacing { get; private set; }
        public bool IsAiming { get; private set; }
        public InputFrame LastInput { get; private set; }

        private enum Motion { Normal, Dash, Leap, Knockback }
        private Motion motion = Motion.Normal;
        private Vector3 motionStart, motionTarget, motionVel;
        private float motionT, motionDur;
        private AttackSpec motionSpec;
        private bool motionIsSuper;
        private readonly HashSet<IDamageable> motionHits = new HashSet<IDamageable>();

        private GameObject blobShadow;

        // ---------------------------------------------------------------- IDamageable
        public int Team { get { return TeamId; } }
        public Vector3 Position { get { return transform.position; } }
        public float Radius { get { return Def != null ? Def.Radius : 0.4f; } }
        public float VisualHeight { get { return Anim != null && Anim.Rig != null ? Anim.Rig.height : 1.4f; } }

        /// <summary>Stärke-Multiplikator durch Level (+10 % pro Level).</summary>
        public float LevelMultiplier { get { return 1f + 0.1f * (Level - 1); } }
        /// <summary>Schadensmultiplikator (Level + Power-Würfel).</summary>
        public float DamageMultiplier { get { return LevelMultiplier * (1f + 0.1f * PowerCubes); } }
        public bool IsStunned { get { return Time.time < stunUntil; } }
        public bool IsShielded { get { return Time.time < shieldUntil; } }
        public bool IsInvulnerable { get { return Time.time < invulnerableUntil; } }
        public bool IsBusyMoving { get { return motion == Motion.Dash || motion == Motion.Leap; } }
        public bool IsAirborne { get { return motion == Motion.Leap; } }
        public bool SuperReady { get { return SuperCharge >= 1f; } }
        public float TimeSinceDamaged { get { return Time.time - lastDamagedTime; } }
        public float TimeSinceAttack { get { return Time.time - lastAttackTime; } }
        public float MoveSpeed
        {
            get
            {
                float s = Def.moveSpeed * formSpeedMul;
                if (Time.time < slowUntil) s *= slowFactor;
                if (Time.time < speedBoostUntil) s *= 1.25f;
                return s;
            }
        }

        public static System.Action<Brawler, Brawler> Died; // (Opfer, Täter)
        public static System.Action<Brawler, float> Damaged;
        public System.Action<Brawler> Evolved;

        // ================================================================= Initialisierung
        public void Init(BrawlerDefinition def, int level, int team, string playerName, bool isLocal, bool isBot, IBrawlerInputSource input)
        {
            Def = def;
            Level = Mathf.Clamp(level, 1, 11);
            TeamId = team;
            PlayerName = playerName;
            IsLocalPlayer = isLocal;
            IsBot = isBot;
            InputSource = input ?? new NullInput();

            Anim = gameObject.AddComponent<BrawlerAnimator>();
            Anim.OnFootstep = OnFootstep;

            int startForm = 0;
            if (def.evolutionTrigger == EvolutionTrigger.BrawlerLevel)
                for (int i = 0; i < def.forms.Count; i++) if (Level >= def.forms[i].threshold) startForm = i + 1;
            ApplyForm(startForm, false);

            blobShadow = new GameObject("BlobShadow");
            blobShadow.transform.SetParent(transform, false);
            blobShadow.transform.localPosition = Vector3.up * 0.02f;
            blobShadow.transform.localScale = Vector3.one * Radius * 2.6f;
            blobShadow.AddComponent<MeshFilter>().sharedMesh = Rendering.ProcMesh.Disc;
            var mr = blobShadow.AddComponent<MeshRenderer>();
            mr.sharedMaterial = Rendering.MaterialLibrary.Shadow;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;

            Health = MaxHealth;
            Ammo = def.maxAmmo;
            IsAlive = true;
            AimFacing = team == 0 ? Vector3.forward : Vector3.back;
            Anim.SetFacing(AimFacing, true);
            Anim.PlaySpawn();
        }

        /// <summary>Setzt eine Evolutionsform (0 = Grundform) inkl. Aussehen und Angriffen.</summary>
        private void ApplyForm(int index, bool animate)
        {
            index = Mathf.Clamp(index, 0, Def.forms.Count);
            FormIndex = index;
            var appearance = Def.appearance;
            var anims = Def.animations;
            MainAttack = Def.mainAttack;
            SuperAttack = Def.superAbility;
            formHealthMul = formSpeedMul = formReloadMul = 1f;
            for (int i = 0; i < index; i++)
            {
                var f = Def.forms[i];
                if (f.overrideAppearance) appearance = f.appearance;
                if (f.overrideAnimations) anims = f.animations;
                if (f.overrideMainAttack) MainAttack = f.mainAttack;
                if (f.overrideSuper) SuperAttack = f.superAbility;
                formHealthMul *= f.healthMultiplier;
                formSpeedMul *= f.speedMultiplier;
                formReloadMul *= f.reloadMultiplier;
            }
            var facing = Anim.Facing;
            Anim.Setup(appearance, anims);
            Anim.SetFacing(facing, true);

            float ratio = MaxHealth > 0f ? Health / MaxHealth : 1f;
            MaxHealth = Def.maxHealth * LevelMultiplier * formHealthMul + PowerCubes * 400f * LevelMultiplier;
            Health = Mathf.Max(1f, MaxHealth * ratio);

            if (animate)
            {
                var form = Def.forms[index - 1];
                Color c = form.transformColor;
                Anim.PlayTransform();
                FX.PowerUp(transform.position, c);
                FX.Explosion(transform.position, 1.8f, c);
                FX.ShakeCamera(0.35f);
                Root(0.5f);
                AudioManager.Instance.Play(form.transformClip, form.transformSound, transform.position);
                Heal(MaxHealth * 0.3f, false);
                if (Evolved != null) Evolved(this);
            }
        }

        private void CheckEvolution()
        {
            if (Def.forms.Count == 0 || FormIndex >= Def.forms.Count) return;
            float value;
            switch (Def.evolutionTrigger)
            {
                case EvolutionTrigger.SuperUses: value = SuperUses; break;
                case EvolutionTrigger.Kills: value = Kills; break;
                case EvolutionTrigger.MatchTime: value = MatchContext.Current != null ? MatchContext.Current.MatchTime : 0f; break;
                case EvolutionTrigger.DamageDealt: value = DamageDealt; break;
                default: return;
            }
            if (value >= Def.forms[FormIndex].threshold) ApplyForm(FormIndex + 1, true);
        }

        /// <summary>Fortschritt zur nächsten Form 0..1 (für die HUD-Anzeige). -1 = keine weitere Form.</summary>
        public float EvolutionProgress
        {
            get
            {
                if (Def.forms.Count == 0 || FormIndex >= Def.forms.Count || Def.evolutionTrigger == EvolutionTrigger.BrawlerLevel) return -1f;
                float prev = FormIndex == 0 ? 0f : Def.forms[FormIndex - 1].threshold;
                float next = Def.forms[FormIndex].threshold;
                float value = 0f;
                switch (Def.evolutionTrigger)
                {
                    case EvolutionTrigger.SuperUses: value = SuperUses; break;
                    case EvolutionTrigger.Kills: value = Kills; break;
                    case EvolutionTrigger.MatchTime: value = MatchContext.Current != null ? MatchContext.Current.MatchTime : 0f; break;
                    case EvolutionTrigger.DamageDealt: value = DamageDealt; break;
                }
                return Mathf.Clamp01((value - prev) / Mathf.Max(0.001f, next - prev));
            }
        }

        // ================================================================= Update
        private void Update()
        {
            var ctx = MatchContext.Current;
            if (ctx == null || !IsAlive) return;
            float dt = Time.deltaTime;
            AliveTime += dt;

            // Munition nachladen
            float reload = Def.reloadTime * formReloadMul;
            if (Ammo < Def.maxAmmo) Ammo = Mathf.Min(Def.maxAmmo, Ammo + dt / Mathf.Max(0.05f, reload));

            // Automatische Heilung nach 3 s ohne Schaden/Angriff
            if (CanRegenerate && Health < MaxHealth && Time.time - lastDamagedTime > 3f && Time.time - lastActionTime > 3f)
            {
                regenTick += dt;
                if (regenTick >= 1f) { regenTick = 0f; Heal(MaxHealth * 0.13f, true); }
            }
            else regenTick = 0f;

            InBush = ctx.Arena.IsBush(transform.position);
            UpdateAura(dt);

            if (ctx.InputLocked) { Anim.SetMovement(0f); return; }

            InputFrame input = InputSource.Poll(this, dt);
            LastInput = input;
            IsAiming = input.aiming;

            switch (motion)
            {
                case Motion.Dash: UpdateDash(dt); break;
                case Motion.Leap: UpdateLeap(dt); break;
                case Motion.Knockback: UpdateKnockback(dt); break;
                default: UpdateNormal(input, dt); break;
            }
            if (Def.evolutionTrigger == EvolutionTrigger.MatchTime) CheckEvolution();
        }

        private float auraTimer;

        /// <summary>Dauerhafte Energie-Aura der aktuellen Evolutionsform.</summary>
        private void UpdateAura(float dt)
        {
            if (FormIndex == 0 || FX.Quality == 0) return;
            Color aura = Def.forms[FormIndex - 1].auraColor;
            if (aura.a <= 0.01f || !Anim.Rig.renderers[0].enabled) return;
            auraTimer -= dt;
            if (auraTimer > 0f) return;
            auraTimer = FX.Quality >= 2 ? 0.07f : 0.15f;
            Vector3 p = transform.position + new Vector3(Random.Range(-0.4f, 0.4f), Random.Range(0.1f, VisualHeight), Random.Range(-0.4f, 0.4f));
            FX.Trail(p, aura, 0.45f);
            if (Random.value < 0.4f) FX.Sparkle(p, aura);
        }

        private void UpdateNormal(InputFrame input, float dt)
        {
            var ctx = MatchContext.Current;
            Vector3 move = InputFrame.ToWorld(Vector2.ClampMagnitude(input.move, 1f));
            if (IsStunned) move = Vector3.zero;
            Vector3 before = transform.position;
            Vector3 after = ctx.Arena.MoveCircle(before, move * MoveSpeed * dt, Radius);
            after = ctx.SeparateFromOthers(this, after);
            transform.position = after;
            Velocity = (after - before) / Mathf.Max(0.0001f, dt);
            Anim.SetMovement(Velocity.magnitude / Mathf.Max(0.1f, Def.moveSpeed));

            if (input.aiming && input.aimingDir.sqrMagnitude > 0.001f) AimFacing = InputFrame.ToWorld(input.aimingDir).normalized;
            else if (move.sqrMagnitude > 0.01f && Time.time - lastAttackTime > 0.35f) AimFacing = move.normalized;
            Anim.SetFacing(AimFacing);

            if (IsStunned) return;
            if (input.attack) TryAttack(input.attackAim, input.attackAuto, false);
            if (input.super) TryAttack(input.superAim, input.superAuto, true);
        }

        // ================================================================= Angriffe
        /// <summary>Versucht Haupt- oder Superangriff. aim = Weltrichtung * Anteil der Reichweite.</summary>
        public bool TryAttack(Vector2 aim, bool auto, bool isSuper)
        {
            var ctx = MatchContext.Current;
            if (!IsAlive || ctx == null || IsStunned || IsBusyMoving) return false;
            if (isSuper && !SuperReady) return false;
            if (!isSuper && (Ammo < 1f || Time.time - lastAttackTime < Def.attackCooldown)) return false;

            AttackSpec spec = isSuper ? SuperAttack : MainAttack;
            Vector3 dir; float dist;
            ResolveAim(spec, aim, auto, out dir, out dist);

            // Spielmodus kann Angriffe überschreiben (z.B. Ball schießen in Brawl Ball)
            if (ctx.Mode != null && ctx.Mode.OverrideAttack(this, dir, dist, isSuper))
            {
                if (!isSuper) { Ammo -= 1f; lastAttackTime = Time.time; }
                else { SuperCharge = 0f; }
                return true;
            }

            if (isSuper) { SuperCharge = 0f; SuperUses++; }
            else { Ammo -= 1f; lastAttackTime = Time.time; }
            lastActionTime = Time.time;
            revealedUntil = Time.time + 1.2f;
            AimFacing = dir;
            Anim.SetFacing(dir, true);

            AttackSystem.Execute(this, spec, dir, dist, isSuper);

            if (isSuper)
            {
                Anim.PlaySuper();
                AudioManager.Instance.Play(Def.sounds.super, Def.sounds.superFallback, transform.position, 1f, Def.sounds.pitch);
                if (Def.evolutionTrigger == EvolutionTrigger.SuperUses) CheckEvolution();
            }
            else
            {
                AudioManager.Instance.Play(Def.sounds.attack, Def.sounds.attackFallback, transform.position, 0.8f, Def.sounds.pitch);
            }
            return true;
        }

        /// <summary>Berechnet Zielrichtung und -entfernung (inkl. automatischem Zielen).</summary>
        public void ResolveAim(AttackSpec spec, Vector2 aim, bool auto, out Vector3 dir, out float dist)
        {
            float range = Mathf.Max(0.5f, spec.range);
            if (auto || aim.sqrMagnitude < 0.0004f)
            {
                var target = MatchContext.Current.FindAutoAimTarget(this, range * 1.05f, spec.kind == AttackKind.HealZone);
                if (target != null)
                {
                    Vector3 to = target.Position - transform.position; to.y = 0;
                    dir = to.sqrMagnitude > 0.0001f ? to.normalized : AimFacing;
                    dist = Mathf.Clamp(to.magnitude, 0.5f, range);
                }
                else
                {
                    dir = AimFacing.sqrMagnitude > 0.01f ? AimFacing.normalized : Vector3.forward;
                    dist = range * (spec.UsesTargetPoint ? 0.6f : 1f);
                }
                if (spec.kind == AttackKind.HealZone && target == null) dist = 0f; // Heilzone auf sich selbst
            }
            else
            {
                dir = InputFrame.ToWorld(aim).normalized;
                dist = Mathf.Clamp01(aim.magnitude) * range;
                if (!spec.UsesTargetPoint) dist = range;
                else dist = Mathf.Max(0.3f, dist);
            }
        }

        /// <summary>Lädt die Super über verursachten Schaden auf.</summary>
        public void AddSuperCharge(float damage, bool fromSuper)
        {
            if (fromSuper || !IsAlive) return;
            float perUse = MainAttack.DamagePerUse;
            if (perUse <= 0f) perUse = Mathf.Max(1f, MainAttack.healAmount);
            float full = perUse * Def.hitsToChargeSuper * LevelMultiplier;
            bool wasReady = SuperReady;
            SuperCharge = Mathf.Min(1f, SuperCharge + damage / Mathf.Max(1f, full));
            if (!wasReady && SuperReady && IsLocalPlayer)
            {
                AudioManager.Sfx(SfxPreset.SuperReady, null, 0.7f);
                FX.Ring(transform.position, 1.2f, new Color(1f, 0.85f, 0.2f), 0.4f);
            }
        }

        /// <summary>Für Heiler: Super durch Heilung aufladen.</summary>
        public void AddSuperChargeFraction(float fraction) { SuperCharge = Mathf.Min(1f, SuperCharge + fraction); }

        // ================================================================= Schaden & Heilung
        public float TakeDamage(DamageInfo info)
        {
            if (!IsAlive || IsInvulnerable || info.amount <= 0f) return 0f;
            if (info.attacker != null && info.attacker.TeamId == TeamId && info.attacker != this) return 0f;
            float amount = info.amount;
            if (IsShielded) amount *= shieldFactor;
            amount = Mathf.Round(amount);
            Health -= amount;
            lastDamagedTime = Time.time;
            revealedUntil = Time.time + 1f;
            Anim.PlayHit();

            if (info.attacker != null && info.attacker != this)
            {
                info.attacker.DamageDealt += amount;
                info.attacker.AddSuperCharge(amount, info.fromSuper);
                if (info.attacker.Def.evolutionTrigger == EvolutionTrigger.DamageDealt) info.attacker.CheckEvolution();
            }
            bool fromLocal = info.attacker != null && info.attacker.IsLocalPlayer;
            FX.ShowDamageNumber(transform.position + Vector3.up * (VisualHeight + 0.3f), amount,
                IsLocalPlayer ? new Color(1f, 0.35f, 0.35f) : (fromLocal ? Color.white : new Color(1f, 0.85f, 0.7f)), info.fromSuper);
            if (IsLocalPlayer) FX.ShakeCamera(0.08f);

            Vector3 away = transform.position - info.sourcePosition; away.y = 0;
            if (info.knockback > 0.01f && away.sqrMagnitude > 0.0001f) ApplyKnockback(away.normalized, info.knockback);
            if (info.slowDuration > 0f) { slowUntil = Time.time + info.slowDuration; slowFactor = 1f - Mathf.Clamp01(info.slowPercent / 100f); }
            if (info.stunDuration > 0f) stunUntil = Mathf.Max(stunUntil, Time.time + info.stunDuration);

            if (Damaged != null) Damaged(this, amount);
            AudioManager.Instance.Play(Def.sounds.hurt, Def.sounds.hurtFallback, transform.position, 0.45f, Def.sounds.pitch);

            if (Health <= 0f) Die(info.attacker);
            return amount;
        }

        public void Heal(float amount, bool showNumber)
        {
            if (!IsAlive || amount <= 0f) return;
            float before = Health;
            Health = Mathf.Min(MaxHealth, Health + amount);
            float healed = Health - before;
            if (healed > 0.5f && showNumber)
            {
                FX.ShowDamageNumber(transform.position + Vector3.up * (VisualHeight + 0.3f), healed, new Color(0.4f, 1f, 0.45f), false);
                FX.Heal(transform.position);
            }
        }

        public void Die(Brawler killer)
        {
            if (!IsAlive) return;
            IsAlive = false;
            Health = 0f;
            Deaths++;
            motion = Motion.Normal;
            if (killer != null && killer != this)
            {
                killer.Kills++;
                if (killer.Def.evolutionTrigger == EvolutionTrigger.Kills) killer.CheckEvolution();
            }
            Anim.PlayDeath();
            FX.Poof(transform.position, Def.appearance.primaryColor);
            AudioManager.Instance.Play(Def.sounds.death, Def.sounds.deathFallback, transform.position, 0.9f, Def.sounds.pitch);
            if (blobShadow != null) blobShadow.SetActive(false);
            if (Died != null) Died(this, killer);
            Invoke("HideAfterDeath", 0.8f);
        }

        private void HideAfterDeath() { if (!IsAlive) Anim.SetVisible(false); }

        /// <summary>Blendet Figur UND Bodenschatten ein/aus (Busch-Tarnung).</summary>
        public void SetVisible(bool visible)
        {
            Anim.SetVisible(visible);
            if (blobShadow != null && IsAlive && blobShadow.activeSelf != visible) blobShadow.SetActive(visible);
        }

        public void Respawn(Vector3 position)
        {
            CancelInvoke("HideAfterDeath");
            transform.position = position;
            IsAlive = true;
            Health = MaxHealth;
            Ammo = Def.maxAmmo;
            motion = Motion.Normal;
            slowUntil = stunUntil = shieldUntil = 0f;
            invulnerableUntil = Time.time + 2f;
            lastDamagedTime = lastActionTime = -99f;
            Anim.SetVisible(true);
            Anim.PlaySpawn();
            if (blobShadow != null) blobShadow.SetActive(true);
            FX.PowerUp(position, TeamUtil.ColorFor(TeamId, MatchContext.Current != null ? MatchContext.Current.LocalTeam : 0, IsLocalPlayer));
            if (Def.sounds.spawn != null) AudioManager.Instance.Play(Def.sounds.spawn, position);
        }

        /// <summary>Sofortige Wiederbelebung ohne Effekt (Matchbeginn / Positions-Reset).</summary>
        public void Teleport(Vector3 position)
        {
            transform.position = position;
            motion = Motion.Normal;
        }

        // ================================================================= Power-Würfel / Status
        public void AddPowerCube()
        {
            PowerCubes++;
            float add = 400f * LevelMultiplier;
            MaxHealth += add;
            Heal(add, true);
            FX.PowerUp(transform.position, new Color(0.4f, 1f, 0.5f));
        }

        public void ApplyShield(float percent, float duration)
        {
            shieldFactor = 1f - Mathf.Clamp01(percent / 100f);
            shieldUntil = Time.time + duration;
            speedBoostUntil = Time.time + duration;
        }

        public void ApplyKnockback(Vector3 dir, float distance)
        {
            if (motion == Motion.Leap) return;
            motion = Motion.Knockback;
            motionT = 0f; motionDur = 0.18f;
            motionVel = dir * (distance / motionDur);
        }

        /// <summary>Hält den Brawler kurz fest (z.B. während ein Angriff aufgeladen wird).</summary>
        public void Root(float seconds) { stunUntil = Mathf.Max(stunUntil, Time.time + seconds); }

        public void AddInvulnerability(float seconds) { invulnerableUntil = Mathf.Max(invulnerableUntil, Time.time + seconds); }

        /// <summary>Ist dieser Brawler für ein Team sichtbar? (Busch-Tarnung)</summary>
        public bool IsVisibleTo(int viewerTeam)
        {
            if (!IsAlive) return false;
            if (viewerTeam == TeamId) return true;
            if (!InBush || Time.time < revealedUntil) return true;
            var ctx = MatchContext.Current;
            if (ctx == null) return true;
            foreach (var b in ctx.Brawlers)
                if (b.IsAlive && b.TeamId == viewerTeam && (b.Position - Position).sqrMagnitude < 2.6f * 2.6f) return true;
            return false;
        }

        // ================================================================= Sturm & Sprung
        public void StartDash(Vector3 dir, float distance, AttackSpec spec, bool isSuper)
        {
            motion = Motion.Dash;
            motionSpec = spec; motionIsSuper = isSuper;
            motionT = 0f;
            float speed = Mathf.Max(8f, spec.projectileSpeed);
            motionDur = Mathf.Max(0.1f, distance / speed);
            motionVel = dir.normalized * speed;
            motionHits.Clear();
            AudioManager.Sfx(SfxPreset.Dash, transform.position);
        }

        private void UpdateDash(float dt)
        {
            var ctx = MatchContext.Current;
            motionT += dt;
            Vector3 before = transform.position;
            transform.position = ctx.Arena.MoveCircle(before, motionVel * dt, Radius);
            Anim.SetMovement(1f);
            if (motionSpec.destroysWalls) ctx.Arena.DestroyTilesInRadius(transform.position + motionVel.normalized * 0.6f, 0.7f);
            FX.Dust(transform.position);
            foreach (var d in ctx.GetEnemyTargets(TeamId))
            {
                if (motionHits.Contains(d)) continue;
                if ((d.Position - transform.position).sqrMagnitude < Mathf.Pow(Radius + d.Radius + 0.3f, 2))
                {
                    motionHits.Add(d);
                    AttackSystem.DealDamage(this, d, motionSpec, motionSpec.damage * DamageMultiplier, transform.position - motionVel.normalized, motionIsSuper);
                }
            }
            bool blocked = (transform.position - before).sqrMagnitude < (motionVel * dt).sqrMagnitude * 0.05f;
            if (motionT >= motionDur || blocked)
            {
                motion = Motion.Normal;
                if (motionSpec.areaRadius > 0.5f && motionSpec.kind == AttackKind.Dash)
                    AttackSystem.DamageArea(this, transform.position, motionSpec.areaRadius, motionSpec.damage * 0.5f * DamageMultiplier, motionSpec, motionIsSuper, motionHits);
            }
        }

        public void StartLeap(Vector3 target, AttackSpec spec, bool isSuper)
        {
            motion = Motion.Leap;
            motionSpec = spec; motionIsSuper = isSuper;
            motionStart = transform.position;
            motionTarget = target;
            motionT = 0f;
            motionDur = Mathf.Clamp(Vector3.Distance(motionStart, target) / 9f, 0.35f, 0.9f);
            AddInvulnerability(motionDur * 0.6f);
            AudioManager.Sfx(SfxPreset.Swoosh, transform.position);
        }

        private void UpdateLeap(float dt)
        {
            var ctx = MatchContext.Current;
            motionT += dt;
            float k = Mathf.Clamp01(motionT / motionDur);
            Vector3 p = Vector3.Lerp(motionStart, motionTarget, k);
            p.y = Mathf.Sin(k * Mathf.PI) * (1.2f + Vector3.Distance(motionStart, motionTarget) * 0.12f);
            transform.position = p;
            Anim.SetMovement(0f);
            if (k >= 1f)
            {
                motion = Motion.Normal;
                Vector3 land = ctx.Arena.FindNearestFree(new Vector3(motionTarget.x, 0, motionTarget.z));
                land = ctx.Arena.ResolveCircle(land, Radius);
                transform.position = land;
                if (motionSpec.destroysWalls) ctx.Arena.DestroyTilesInRadius(land, motionSpec.areaRadius);
                AttackSystem.DamageArea(this, land, motionSpec.areaRadius, motionSpec.damage * DamageMultiplier, motionSpec, motionIsSuper, null);
                FX.Explosion(land, motionSpec.areaRadius, motionSpec.color);
                AudioManager.Sfx(SfxPreset.Explosion, land, 0.8f);
            }
        }

        private void UpdateKnockback(float dt)
        {
            var ctx = MatchContext.Current;
            motionT += dt;
            transform.position = ctx.Arena.MoveCircle(transform.position, motionVel * dt, Radius);
            if (motionT >= motionDur) motion = Motion.Normal;
        }

        /// <summary>Kleiner Schritt nach vorne (Kombo-Schläge).</summary>
        public void Lunge(Vector3 dir, float distance)
        {
            if (!IsAlive || distance <= 0f || motion != Motion.Normal) return;
            transform.position = MatchContext.Current.Arena.MoveCircle(transform.position, dir.normalized * distance, Radius);
        }

        private void OnFootstep()
        {
            FX.Dust(transform.position);
            if (IsLocalPlayer && Def.sounds.footstep != null) AudioManager.Instance.Play(Def.sounds.footstep, transform.position, 0.3f);
        }

        /// <summary>Position der Waffenmündung (für Projektile).</summary>
        public Vector3 MuzzlePosition
        {
            get
            {
                Vector3 p = transform.position + Vector3.up * 0.6f + AimFacing.normalized * (Radius + 0.15f);
                return p;
            }
        }
    }
}
