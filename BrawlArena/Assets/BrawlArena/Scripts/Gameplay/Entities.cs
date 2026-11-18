// ---------------------------------------------------------------------------------------------
// Entities – weitere Objekte im Match: Zonen (Heilung/Schaden), Geschütztürme, Schild-Blasen,
// Power-Würfel-Boxen, aufsammelbare Objekte (Power-Würfel, Edelsteine) und Heilpilze.
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using BrawlArena.Audio;
using BrawlArena.Data;
using BrawlArena.Rendering;

namespace BrawlArena.Gameplay
{
    /// <summary>Objekte mit Lebensbalken im HUD (außer Brawlern).</summary>
    public interface IHealthBarTarget
    {
        bool ShowHealthBar { get; }
        float Health01 { get; }
        Vector3 BarWorldPosition { get; }
        int Team { get; }
    }

    // =============================================================================== Zone
    public class Zone : MonoBehaviour
    {
        private Brawler owner;
        private AttackSpec spec;
        private bool isSuper, heal;
        private float t, tick;
        private Material mat;
        private int team;

        public static Zone Spawn(Brawler owner, AttackSpec spec, Vector3 pos, bool isSuper)
        {
            var go = new GameObject(spec.kind == AttackKind.HealZone ? "HealZone" : "DamageZone");
            go.transform.SetParent(MatchContext.Current.EntityRoot, false);
            go.transform.position = new Vector3(pos.x, 0.05f, pos.z);
            var z = go.AddComponent<Zone>();
            z.owner = owner; z.spec = spec; z.isSuper = isSuper; z.heal = spec.kind == AttackKind.HealZone;
            z.team = owner != null ? owner.TeamId : TeamUtil.Neutral;
            go.AddComponent<MeshFilter>().sharedMesh = ProcMesh.Disc;
            var mr = go.AddComponent<MeshRenderer>();
            z.mat = MaterialLibrary.CreateTransparent(new Color(spec.color.r, spec.color.g, spec.color.b, 0.35f), TextureFactory.Ring);
            mr.sharedMaterial = z.mat;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            go.transform.localScale = new Vector3(spec.areaRadius * 2f, 1f, spec.areaRadius * 2f);
            AudioManager.Sfx(z.heal ? SfxPreset.Heal : SfxPreset.Magic, pos, 0.7f);
            FX.Ring(pos, spec.areaRadius, spec.color, 0.4f);
            return z;
        }

        private void Update()
        {
            var match = MatchContext.Current;
            if (match == null) { Destroy(gameObject); return; }
            t += Time.deltaTime; tick += Time.deltaTime;
            float pulse = 0.3f + Mathf.Sin(t * 6f) * 0.06f;
            mat.color = new Color(spec.color.r, spec.color.g, spec.color.b, pulse * Mathf.Clamp01((spec.duration - t) * 2f));
            if (Random.value < 0.4f) FX.Sparkle(transform.position + new Vector3(Random.Range(-1f, 1f), 0.2f, Random.Range(-1f, 1f)) * spec.areaRadius * 0.8f, spec.color);
            if (tick >= Mathf.Max(0.1f, spec.tickInterval))
            {
                tick = 0f;
                float mult = owner != null ? owner.DamageMultiplier : 1f;
                if (heal)
                {
                    foreach (var b in match.Brawlers)
                        if (b.IsAlive && b.TeamId == team && (b.Position - transform.position).sqrMagnitude <= spec.areaRadius * spec.areaRadius)
                        {
                            float before = b.Health;
                            b.Heal(spec.healAmount * mult, true);
                            if (owner != null) owner.HealingDone += b.Health - before;
                        }
                    if (spec.damage > 0f) AttackSystem.DamageArea(owner, transform.position, spec.areaRadius, spec.damage * mult, spec, isSuper, null);
                }
                else AttackSystem.DamageArea(owner, transform.position, spec.areaRadius, spec.damage * mult, spec, isSuper, null);
            }
            if (t >= spec.duration) Destroy(gameObject);
        }

        private void OnDestroy() { if (mat != null) Destroy(mat); }
    }

    // =============================================================================== Turm
    public class Turret : MonoBehaviour, IDamageable, IHealthBarTarget
    {
        private Brawler owner;
        private AttackSpec spec, shotSpec;
        private float health, maxHealth, life, cooldown;
        private Transform head;

        public int Team { get; private set; }
        public Vector3 Position { get { return transform.position; } }
        public float Radius { get { return 0.45f; } }
        public bool IsAlive { get { return health > 0f; } }
        public bool ShowHealthBar { get { return IsAlive; } }
        public float Health01 { get { return health / maxHealth; } }
        public Vector3 BarWorldPosition { get { return transform.position + Vector3.up * 1.5f; } }

        public static Turret Spawn(Brawler owner, AttackSpec spec, Vector3 pos)
        {
            var match = MatchContext.Current;
            pos = match.Arena.FindNearestFree(new Vector3(pos.x, 0, pos.z));
            var go = new GameObject("Turret");
            go.transform.SetParent(match.EntityRoot, false);
            go.transform.position = pos;
            var t = go.AddComponent<Turret>();
            t.owner = owner; t.spec = spec; t.Team = owner.TeamId;
            t.maxHealth = t.health = spec.turretHealth * owner.LevelMultiplier;
            t.shotSpec = spec.Clone();
            t.shotSpec.kind = AttackKind.Shot;
            t.shotSpec.projectileCount = 1;
            t.shotSpec.visual = ProjectileVisual.Bullet;
            t.shotSpec.projectileRadius = 0.2f;
            t.shotSpec.projectileSpeed = Mathf.Max(10f, spec.projectileSpeed);
            t.shotSpec.areaRadius = 0f;
            t.Build(owner.Def.appearance);
            match.RegisterDamageable(t);
            AudioManager.Sfx(SfxPreset.Deploy, pos);
            FX.PowerUp(pos, spec.color);
            return t;
        }

        private void Build(AppearanceConfig a)
        {
            var mb = new MeshBuilder();
            mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.2f, 0), Quaternion.identity, new Vector3(0.8f, 0.4f, 0.8f), a.weaponColor);
            mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.5f, 0), Quaternion.identity, new Vector3(0.3f, 0.4f, 0.3f), a.secondaryColor);
            var baseGo = new GameObject("Base");
            baseGo.transform.SetParent(transform, false);
            baseGo.AddComponent<MeshFilter>().sharedMesh = mb.Build("TurretBase");
            baseGo.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.CharacterToon;

            var hb = new MeshBuilder();
            hb.Add(ProcMesh.Sphere, Vector3.zero, Quaternion.identity, Vector3.one * 0.55f, a.primaryColor);
            hb.Add(ProcMesh.Cylinder, new Vector3(0, 0, 0.35f), Quaternion.Euler(90, 0, 0), new Vector3(0.14f, 0.4f, 0.14f), a.weaponColor);
            hb.Add(ProcMesh.Sphere, new Vector3(0, 0.08f, 0.22f), Quaternion.identity, new Vector3(0.25f, 0.12f, 0.1f), a.secondaryColor);
            var headGo = new GameObject("Head");
            head = headGo.transform;
            head.SetParent(transform, false);
            head.localPosition = new Vector3(0, 0.85f, 0);
            headGo.AddComponent<MeshFilter>().sharedMesh = hb.Build("TurretHead");
            headGo.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.CharacterToon;
        }

        private void Update()
        {
            var match = MatchContext.Current;
            if (match == null || !IsAlive) return;
            float dt = Time.deltaTime;
            life += dt; cooldown -= dt;
            if (life >= spec.duration || owner == null) { Kill(); return; }
            var target = match.FindNearestEnemy(Team, transform.position, spec.range, true);
            if (target != null)
            {
                Vector3 to = target.Position - transform.position; to.y = 0;
                head.rotation = Quaternion.Slerp(head.rotation, Quaternion.LookRotation(to), dt * 10f);
                if (cooldown <= 0f && match.Arena.HasLineOfSight(transform.position + Vector3.up * 0.8f, target.Position + Vector3.up * 0.6f))
                {
                    cooldown = Mathf.Max(0.25f, spec.tickInterval);
                    Vector3 origin = transform.position + Vector3.up * 0.85f + to.normalized * 0.6f;
                    ProjectileSystem.Fire(owner, shotSpec, origin, to, spec.range, spec.damage * owner.DamageMultiplier, false);
                    FX.Muzzle(origin, to.normalized, spec.color);
                    AudioManager.Sfx(SfxPreset.Pew, origin, 0.4f, 1.3f);
                }
            }
            else head.Rotate(0, 40f * dt, 0);
        }

        public float TakeDamage(DamageInfo info)
        {
            if (!IsAlive || info.amount <= 0f) return 0f;
            if (info.attacker != null && info.attacker.TeamId == Team) return 0f;
            health -= info.amount;
            FX.ShowDamageNumber(transform.position + Vector3.up * 1.6f, info.amount, Color.white, false);
            if (info.attacker != null) info.attacker.AddSuperCharge(info.amount * 0.5f, info.fromSuper);
            if (health <= 0f) Kill();
            return info.amount;
        }

        private void Kill()
        {
            health = 0f;
            FX.Explosion(transform.position, 1f, spec.color);
            AudioManager.Sfx(SfxPreset.Explosion, transform.position, 0.6f);
            if (MatchContext.Current != null) MatchContext.Current.UnregisterDamageable(this);
            Destroy(gameObject);
        }
    }

    // =============================================================================== Schild-Blase
    public class ShieldBubble : MonoBehaviour
    {
        private Brawler owner; private float until; private Material mat;

        public static void Attach(Brawler owner, float duration, Color color)
        {
            var go = new GameObject("Shield");
            go.transform.SetParent(owner.transform, false);
            go.transform.localPosition = Vector3.up * 0.7f;
            go.transform.localScale = Vector3.one * (owner.VisualHeight * 1.2f + 0.4f);
            go.AddComponent<MeshFilter>().sharedMesh = ProcMesh.Sphere;
            var mr = go.AddComponent<MeshRenderer>();
            var s = go.AddComponent<ShieldBubble>();
            s.mat = MaterialLibrary.CreateTransparent(new Color(color.r, color.g, color.b, 0.25f), TextureFactory.Noise);
            s.mat.SetFloat("_Pulse", 1f);
            s.mat.SetVector("_Scroll", new Vector4(0.2f, 0.3f, 0, 0));
            mr.sharedMaterial = s.mat;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            s.owner = owner; s.until = Time.time + duration;
        }

        private void Update()
        {
            if (owner == null || !owner.IsAlive || Time.time >= until) Destroy(gameObject);
        }

        private void OnDestroy() { if (mat != null) Destroy(mat); }
    }

    // =============================================================================== Power-Würfel-Box
    public class PowerBox : MonoBehaviour, IDamageable, IHealthBarTarget
    {
        private float health, maxHealth = 4000f;
        private Transform visual;
        private float shake;
        public System.Action<PowerBox> Destroyed;

        public int Team { get { return TeamUtil.Neutral; } }
        public Vector3 Position { get { return transform.position; } }
        public float Radius { get { return 0.5f; } }
        public bool IsAlive { get { return health > 0f; } }
        public bool ShowHealthBar { get { return IsAlive && health < maxHealth; } }
        public float Health01 { get { return health / maxHealth; } }
        public Vector3 BarWorldPosition { get { return transform.position + Vector3.up * 1.3f; } }

        public static PowerBox Spawn(Vector3 pos, float hp)
        {
            var go = new GameObject("PowerBox");
            go.transform.SetParent(MatchContext.Current.EntityRoot, false);
            go.transform.position = pos;
            var b = go.AddComponent<PowerBox>();
            b.maxHealth = b.health = hp;
            var mb = new MeshBuilder();
            Color wood = new Color(0.75f, 0.5f, 0.28f), dark = new Color(0.45f, 0.28f, 0.16f), glow = new Color(0.4f, 1f, 0.5f);
            mb.Add(ProcMesh.Box, new Vector3(0, 0.45f, 0), Quaternion.identity, new Vector3(0.9f, 0.9f, 0.9f), wood);
            mb.Add(ProcMesh.Box, new Vector3(0, 0.45f, 0), Quaternion.identity, new Vector3(0.95f, 0.15f, 0.95f), dark);
            mb.Add(ProcMesh.Box, new Vector3(0, 0.45f, 0), Quaternion.Euler(0, 0, 90), new Vector3(0.95f, 0.15f, 0.95f), dark);
            mb.Add(ProcMesh.Box, new Vector3(0, 0.45f, 0.47f), Quaternion.Euler(0, 0, 45), new Vector3(0.3f, 0.3f, 0.04f), glow);
            mb.Add(ProcMesh.Box, new Vector3(0, 0.45f, -0.47f), Quaternion.Euler(0, 0, 45), new Vector3(0.3f, 0.3f, 0.04f), glow);
            var v = new GameObject("Visual");
            b.visual = v.transform;
            b.visual.SetParent(go.transform, false);
            v.AddComponent<MeshFilter>().sharedMesh = mb.Build("PowerBox");
            v.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.WorldToonOutline;
            MatchContext.Current.RegisterDamageable(b);
            return b;
        }

        private void Update()
        {
            if (shake > 0f)
            {
                shake -= Time.deltaTime;
                visual.localPosition = Random.insideUnitSphere * 0.05f * shake * 5f;
            }
        }

        public float TakeDamage(DamageInfo info)
        {
            if (!IsAlive) return 0f;
            health -= info.amount;
            shake = 0.2f;
            FX.ShowDamageNumber(transform.position + Vector3.up * 1.2f, info.amount, Color.white, false);
            if (info.attacker != null) info.attacker.AddSuperCharge(info.amount * 0.3f, info.fromSuper);
            if (health <= 0f)
            {
                FX.Debris(transform.position + Vector3.up * 0.5f, new Color(0.75f, 0.5f, 0.28f));
                AudioManager.Sfx(SfxPreset.BoxOpen, transform.position, 0.6f);
                MatchContext.Current.UnregisterDamageable(this);
                if (Destroyed != null) Destroyed(this);
                Destroy(gameObject);
            }
            return info.amount;
        }
    }

    // =============================================================================== Aufsammelbares
    public enum PickupType { PowerCube, Gem }

    public class Pickup : MonoBehaviour
    {
        public PickupType Type;
        private float t, armTime;
        private Vector3 basePos, velocity;
        private Transform visual;

        public static Pickup Spawn(PickupType type, Vector3 pos, Vector3 scatter)
        {
            var go = new GameObject(type.ToString());
            go.transform.SetParent(MatchContext.Current.EntityRoot, false);
            var p = go.AddComponent<Pickup>();
            p.Type = type;
            p.basePos = pos;
            p.velocity = scatter;
            p.armTime = 0.5f;
            go.transform.position = pos;
            var mb = new MeshBuilder();
            if (type == PickupType.Gem)
            {
                Color g = new Color(0.8f, 0.35f, 1f);
                mb.Add(ProcMesh.Cone, new Vector3(0, 0.15f, 0), Quaternion.identity, new Vector3(0.38f, 0.3f, 0.38f), g);
                mb.Add(ProcMesh.Cone, new Vector3(0, -0.15f, 0), Quaternion.Euler(180, 0, 0), new Vector3(0.38f, 0.3f, 0.38f), Color.Lerp(g, Color.white, 0.3f));
            }
            else
            {
                Color c = new Color(0.35f, 1f, 0.45f);
                mb.Add(ProcMesh.Box, Vector3.zero, Quaternion.Euler(45, 0, 45), Vector3.one * 0.35f, c);
                mb.Add(ProcMesh.Box, Vector3.zero, Quaternion.Euler(45, 0, 45), Vector3.one * 0.2f, Color.white);
            }
            var v = new GameObject("Visual");
            p.visual = v.transform;
            p.visual.SetParent(go.transform, false);
            v.AddComponent<MeshFilter>().sharedMesh = mb.Build("Pickup");
            var mr = v.AddComponent<MeshRenderer>();
            mr.sharedMaterial = MaterialLibrary.CharacterToon;
            MatchContext.Current.RegisterPickup(p);
            return p;
        }

        private void Update()
        {
            var match = MatchContext.Current;
            if (match == null) return;
            float dt = Time.deltaTime;
            t += dt;
            if (velocity.sqrMagnitude > 0.01f)
            {
                basePos = match.Arena.MoveCircle(basePos, velocity * dt, 0.2f);
                velocity = Vector3.MoveTowards(velocity, Vector3.zero, dt * 8f);
            }
            transform.position = basePos;
            visual.localPosition = Vector3.up * (0.55f + Mathf.Sin(t * 3f) * 0.12f);
            visual.localRotation = Quaternion.Euler(0, t * 120f, 0);
            if (Random.value < 0.05f) FX.Sparkle(transform.position + Vector3.up * 0.6f, Type == PickupType.Gem ? new Color(0.9f, 0.5f, 1f) : new Color(0.5f, 1f, 0.6f));
            if (t < armTime) return;
            foreach (var b in match.Brawlers)
            {
                if (!b.IsAlive) continue;
                if ((b.Position - transform.position).sqrMagnitude < Mathf.Pow(b.Radius + 0.45f, 2))
                {
                    if (match.Mode != null && match.Mode.OnPickup(b, this))
                    {
                        AudioManager.Sfx(Type == PickupType.Gem ? SfxPreset.Gem : SfxPreset.Pickup, transform.position, 0.8f);
                        match.UnregisterPickup(this);
                        Destroy(gameObject);
                        return;
                    }
                }
            }
        }
    }

    // =============================================================================== Heilpilz
    public class HealPad : MonoBehaviour
    {
        private float cooldown;
        private Transform cap;

        public static HealPad Spawn(Vector3 pos)
        {
            var go = new GameObject("HealPad");
            go.transform.SetParent(MatchContext.Current.EntityRoot, false);
            go.transform.position = pos;
            var h = go.AddComponent<HealPad>();
            var mb = new MeshBuilder();
            mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.2f, 0), Quaternion.identity, new Vector3(0.25f, 0.4f, 0.25f), new Color(1f, 0.95f, 0.85f));
            var stem = new GameObject("Stem");
            stem.transform.SetParent(go.transform, false);
            stem.AddComponent<MeshFilter>().sharedMesh = mb.Build("Stem");
            stem.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.CharacterToon;
            var cb = new MeshBuilder();
            cb.Add(ProcMesh.Hemisphere, Vector3.zero, Quaternion.identity, new Vector3(0.75f, 0.5f, 0.75f), new Color(1f, 0.35f, 0.55f));
            for (int i = 0; i < 4; i++)
            {
                float a = i * Mathf.PI * 0.5f + 0.4f;
                cb.Add(ProcMesh.SphereLow, new Vector3(Mathf.Cos(a) * 0.2f, 0.17f, Mathf.Sin(a) * 0.2f), Quaternion.identity, Vector3.one * 0.12f, Color.white);
            }
            var capGo = new GameObject("Cap");
            h.cap = capGo.transform;
            h.cap.SetParent(go.transform, false);
            h.cap.localPosition = new Vector3(0, 0.38f, 0);
            capGo.AddComponent<MeshFilter>().sharedMesh = cb.Build("Cap");
            capGo.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.CharacterToon;
            return h;
        }

        private void Update()
        {
            var match = MatchContext.Current;
            if (match == null) return;
            if (cooldown > 0f)
            {
                cooldown -= Time.deltaTime;
                cap.localScale = Vector3.one * Mathf.Lerp(1f, 0.2f, cooldown / 12f);
                return;
            }
            cap.localScale = Vector3.one * (1f + Mathf.Sin(Time.time * 3f) * 0.04f);
            foreach (var b in match.Brawlers)
                if (b.IsAlive && b.Health < b.MaxHealth && (b.Position - transform.position).sqrMagnitude < 0.7f)
                {
                    b.Heal(b.MaxHealth * 0.35f, true);
                    AudioManager.Sfx(SfxPreset.Heal, transform.position, 0.8f);
                    cooldown = 12f;
                    break;
                }
        }
    }
}
