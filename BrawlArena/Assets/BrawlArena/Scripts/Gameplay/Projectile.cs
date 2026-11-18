// ---------------------------------------------------------------------------------------------
// ProjectileSystem – verwaltet alle Projektile in einer einzigen Update-Schleife (Pooling,
// keine Physik-Engine). Unterstützt gerade Schüsse, Abpraller, Durchdringen, Bumerangs und
// Bogenwürfe (Lob) mit Landemarkierung und Explosion.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Audio;
using BrawlArena.Data;
using BrawlArena.Rendering;

namespace BrawlArena.Gameplay
{
    public class Projectile : MonoBehaviour
    {
        public Brawler Owner;
        public AttackSpec Spec;
        public float Damage;
        public bool IsSuper;
        public bool Active;

        // Gerader Flug
        public Vector3 Dir;
        public float Speed, Range, Travelled, Radius;
        public int BouncesLeft;
        public bool Boomerang, Returning;
        public readonly HashSet<IDamageable> Hit = new HashSet<IDamageable>();

        // Wurf
        public bool IsLob;
        public Vector3 LobStart, LobTarget;
        public float LobT, LobDur, LobHeight;
        public System.Action<Vector3> OnLand;

        public MeshRenderer Renderer;
        public MeshFilter Filter;
        public TrailRenderer Trail;
        public Transform Marker;
        public ProjectileVisual CurrentVisual = (ProjectileVisual)(-1);

        public void SetBoomerang() { Boomerang = true; Returning = false; }
    }

    public class ProjectileSystem : MonoBehaviour
    {
        public static ProjectileSystem Instance { get; private set; }

        private readonly List<Projectile> active = new List<Projectile>(128);
        private readonly Stack<Projectile> free = new Stack<Projectile>();
        private static readonly Dictionary<ProjectileVisual, Mesh> meshes = new Dictionary<ProjectileVisual, Mesh>();
        private MaterialPropertyBlock mpb;
        private Material markerMat;
        private Mesh markerMesh;

        public static ProjectileSystem Create(Transform parent)
        {
            var go = new GameObject("Projectiles");
            go.transform.SetParent(parent, false);
            Instance = go.AddComponent<ProjectileSystem>();
            Instance.mpb = new MaterialPropertyBlock();
            Instance.markerMat = MaterialLibrary.CreateTransparent(new Color(1f, 0.3f, 0.3f, 0.35f), TextureFactory.Ring);
            Instance.markerMesh = ProcMesh.Disc;
            return Instance;
        }

        private void OnDestroy() { if (Instance == this) Instance = null; }

        // ================================================================== Spawnen
        public static Projectile Fire(Brawler owner, AttackSpec spec, Vector3 origin, Vector3 dir, float range, float damage, bool isSuper)
        {
            if (Instance == null) return null;
            dir.y = 0;
            if (dir.sqrMagnitude < 0.0001f) dir = Vector3.forward;
            var p = Instance.Get(spec.visual, spec.color, Mathf.Max(0.15f, spec.projectileRadius));
            p.Owner = owner; p.Spec = spec; p.Damage = damage; p.IsSuper = isSuper;
            p.Dir = dir.normalized; p.Speed = Mathf.Max(1f, spec.projectileSpeed); p.Range = range; p.Travelled = 0f;
            p.Radius = Mathf.Max(0.08f, spec.projectileRadius);
            p.BouncesLeft = spec.bounces; p.Boomerang = false; p.Returning = false;
            p.IsLob = false; p.OnLand = null;
            p.Hit.Clear();
            origin.y = 0.6f;
            p.transform.position = origin;
            p.transform.rotation = Quaternion.LookRotation(p.Dir);
            if (p.Trail != null) p.Trail.Clear();
            p.Marker.gameObject.SetActive(false);
            return p;
        }

        public static Projectile Lob(Brawler owner, AttackSpec spec, Vector3 origin, Vector3 target, float damage, bool isSuper, System.Action<Vector3> onLand)
        {
            if (Instance == null) return null;
            var vis = spec.visual == ProjectileVisual.Bullet ? ProjectileVisual.Bomb : spec.visual;
            var p = Instance.Get(vis, spec.color, 0.35f);
            p.Owner = owner; p.Spec = spec; p.Damage = damage; p.IsSuper = isSuper;
            p.IsLob = true; p.OnLand = onLand;
            p.LobStart = origin; p.LobTarget = new Vector3(target.x, 0f, target.z);
            float dist = Vector3.Distance(new Vector3(origin.x, 0, origin.z), p.LobTarget);
            float speed = Mathf.Max(4f, spec.projectileSpeed * 0.75f);
            p.LobDur = Mathf.Clamp(dist / speed, 0.35f, 1.2f);
            p.LobHeight = 1.6f + dist * 0.18f;
            p.LobT = 0f;
            p.transform.position = origin;
            if (p.Trail != null) p.Trail.Clear();
            // Landemarkierung (für Gegner rot, eigene blau)
            int localTeam = MatchContext.Current != null ? MatchContext.Current.LocalTeam : 0;
            p.Marker.gameObject.SetActive(true);
            p.Marker.position = p.LobTarget + Vector3.up * 0.04f;
            p.Marker.rotation = Quaternion.identity;
            float r = Mathf.Max(0.5f, spec.kind == AttackKind.Lob ? spec.areaRadius : 0.8f);
            p.Marker.localScale = new Vector3(r * 2f, 1f, r * 2f);
            var mr = p.Marker.GetComponent<MeshRenderer>();
            mr.GetPropertyBlock(Instance.mpb);
            Instance.mpb.SetColor("_Color", owner != null && owner.TeamId == localTeam ? new Color(0.3f, 0.6f, 1f, 0.35f) : new Color(1f, 0.3f, 0.3f, 0.4f));
            mr.SetPropertyBlock(Instance.mpb);
            AudioManager.Sfx(SfxPreset.Throw, origin, 0.6f);
            return p;
        }

        private Projectile Get(ProjectileVisual visual, Color color, float radius)
        {
            Projectile p = free.Count > 0 ? free.Pop() : CreateNew();
            p.gameObject.SetActive(true);
            p.Active = true;
            if (p.CurrentVisual != visual)
            {
                p.Filter.sharedMesh = GetMesh(visual);
                p.CurrentVisual = visual;
            }
            float s = Mathf.Clamp(radius * 2.2f, 0.3f, 2.2f);
            if (visual == ProjectileVisual.Slash) p.transform.localScale = new Vector3(s * 1.6f, 1f, s * 0.8f);
            else p.transform.localScale = Vector3.one * Mathf.Clamp(s, 0.3f, 1.2f);
            p.Renderer.GetPropertyBlock(mpb);
            mpb.SetColor("_Color", Color.Lerp(color, Color.white, 0.25f));
            p.Renderer.SetPropertyBlock(mpb);
            if (p.Trail != null)
            {
                p.Trail.startColor = new Color(color.r, color.g, color.b, 0.85f);
                p.Trail.endColor = new Color(color.r, color.g, color.b, 0f);
                p.Trail.widthMultiplier = Mathf.Clamp(radius * 1.6f, 0.15f, 1.4f);
                p.Trail.time = visual == ProjectileVisual.Slash ? 0.12f : 0.2f;
            }
            active.Add(p);
            return p;
        }

        private Projectile CreateNew()
        {
            var go = new GameObject("Projectile");
            go.transform.SetParent(transform, false);
            var p = go.AddComponent<Projectile>();
            p.Filter = go.AddComponent<MeshFilter>();
            p.Renderer = go.AddComponent<MeshRenderer>();
            p.Renderer.sharedMaterial = MaterialLibrary.Unlit;
            p.Renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            p.Renderer.receiveShadows = false;
            if (FX.Quality > 0)
            {
                p.Trail = go.AddComponent<TrailRenderer>();
                p.Trail.sharedMaterial = MaterialLibrary.Trail;
                p.Trail.time = 0.2f;
                p.Trail.minVertexDistance = 0.1f;
                p.Trail.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                p.Trail.receiveShadows = false;
                p.Trail.widthCurve = AnimationCurve.Linear(0, 1, 1, 0);
            }
            var m = new GameObject("Marker");
            m.transform.SetParent(transform, false);
            m.AddComponent<MeshFilter>().sharedMesh = markerMesh;
            var mr = m.AddComponent<MeshRenderer>();
            mr.sharedMaterial = markerMat;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            p.Marker = m.transform;
            m.SetActive(false);
            return p;
        }

        private static Mesh GetMesh(ProjectileVisual v)
        {
            Mesh m;
            if (meshes.TryGetValue(v, out m)) return m;
            var mb = new MeshBuilder();
            Color w = Color.white; Color dark = new Color(0.25f, 0.25f, 0.3f);
            switch (v)
            {
                case ProjectileVisual.Bullet:
                    mb.Add(ProcMesh.Sphere, Vector3.zero, Quaternion.identity, new Vector3(0.35f, 0.35f, 0.8f), w); break;
                case ProjectileVisual.Orb:
                    mb.Add(ProcMesh.Sphere, Vector3.zero, Quaternion.identity, Vector3.one * 0.7f, w);
                    mb.Add(ProcMesh.Torus, Vector3.zero, Quaternion.Euler(90, 0, 0), Vector3.one * 0.9f, w); break;
                case ProjectileVisual.Bomb:
                    mb.Add(ProcMesh.Sphere, Vector3.zero, Quaternion.identity, Vector3.one * 0.7f, dark);
                    mb.Add(ProcMesh.Torus, Vector3.zero, Quaternion.identity, Vector3.one * 1.2f, w);
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.4f, 0), Quaternion.identity, new Vector3(0.1f, 0.2f, 0.1f), new Color(0.9f, 0.8f, 0.5f));
                    mb.Add(ProcMesh.Sphere, new Vector3(0, 0.52f, 0), Quaternion.identity, Vector3.one * 0.18f, new Color(1f, 0.8f, 0.3f)); break;
                case ProjectileVisual.Arrow:
                    mb.Add(ProcMesh.Box, Vector3.zero, Quaternion.identity, new Vector3(0.08f, 0.08f, 0.9f), w);
                    mb.Add(ProcMesh.Cone, new Vector3(0, 0, 0.5f), Quaternion.Euler(90, 0, 0), new Vector3(0.25f, 0.25f, 0.25f), w);
                    mb.Add(ProcMesh.Box, new Vector3(0, 0, -0.4f), Quaternion.identity, new Vector3(0.3f, 0.03f, 0.15f), w); break;
                case ProjectileVisual.Flame:
                    mb.Add(ProcMesh.SphereLow, Vector3.zero, Quaternion.identity, Vector3.one * 0.8f, w);
                    mb.Add(ProcMesh.SphereLow, new Vector3(0, 0, -0.3f), Quaternion.identity, Vector3.one * 0.55f, new Color(1f, 0.6f, 0.3f)); break;
                case ProjectileVisual.Star:
                    mb.Add(ProcMesh.Box, Vector3.zero, Quaternion.Euler(0, 45, 0), new Vector3(0.2f, 0.2f, 0.9f), w);
                    mb.Add(ProcMesh.Box, Vector3.zero, Quaternion.Euler(0, -45, 0), new Vector3(0.2f, 0.2f, 0.9f), w);
                    mb.Add(ProcMesh.Sphere, Vector3.zero, Quaternion.identity, Vector3.one * 0.4f, w); break;
                case ProjectileVisual.Slash:
                    // Sichelförmige Klingenwelle
                    mb.Add(ProcMesh.BuildTorus(16, 6, 0.5f, 0.12f), new Vector3(0, 0, -0.3f), Quaternion.identity, new Vector3(1f, 0.6f, 0.8f), w);
                    break;
                case ProjectileVisual.Bolt:
                    mb.Add(ProcMesh.Box, new Vector3(0.05f, 0, 0.2f), Quaternion.Euler(0, 20, 0), new Vector3(0.1f, 0.1f, 0.45f), w);
                    mb.Add(ProcMesh.Box, new Vector3(-0.05f, 0, -0.2f), Quaternion.Euler(0, -20, 0), new Vector3(0.1f, 0.1f, 0.45f), w); break;
            }
            m = mb.Build("Proj_" + v);
            ProcMesh.MarkShared(m);
            meshes[v] = m;
            return m;
        }

        private void Release(Projectile p)
        {
            p.Active = false;
            p.OnLand = null;
            p.Marker.gameObject.SetActive(false);
            p.gameObject.SetActive(false);
            free.Push(p);
        }

        public void ClearAll()
        {
            for (int i = active.Count - 1; i >= 0; i--) Release(active[i]);
            active.Clear();
        }

        // ================================================================== Update
        private void Update()
        {
            var match = MatchContext.Current;
            if (match == null) return;
            float dt = Time.deltaTime;
            for (int i = active.Count - 1; i >= 0; i--)
            {
                var p = active[i];
                bool done = p.IsLob ? UpdateLob(p, dt, match) : UpdateStraight(p, dt, match);
                if (done)
                {
                    active.RemoveAt(i);
                    Release(p);
                }
            }
        }

        private bool UpdateStraight(Projectile p, float dt, MatchContext match)
        {
            Vector3 from = p.transform.position;
            Vector3 dir = p.Dir;
            if (p.Returning && p.Owner != null)
            {
                Vector3 to = p.Owner.Position + Vector3.up * 0.6f - from; to.y = 0;
                if (to.magnitude < 0.5f) return true;
                dir = to.normalized;
            }
            float step = p.Speed * dt;
            Vector3 next = from + dir * step;

            // Wandkontakt
            Vector3 hitPoint, normal;
            if (match.Arena.SegmentHitsWall(from, next, out hitPoint, out normal))
            {
                if (p.Spec.destroysWalls) match.Arena.DestroyTilesInRadius(next, 0.6f);
                if (p.BouncesLeft > 0 && normal != Vector3.zero)
                {
                    p.BouncesLeft--;
                    p.Dir = Vector3.Reflect(p.Dir, normal).normalized;
                    p.transform.position = hitPoint;
                    p.Hit.Clear();
                    return false;
                }
                if (p.Boomerang && !p.Returning) { p.Returning = true; p.Hit.Clear(); p.transform.position = hitPoint; return false; }
                FX.Hit(hitPoint, p.Spec.color);
                if (p.Spec.kind == AttackKind.Lob || (p.Spec.areaRadius > 0.3f && p.Spec.visual == ProjectileVisual.Bomb)) Explode(p, hitPoint);
                return !p.Returning;
            }

            // Zieltreffer
            foreach (var d in match.GetEnemyTargets(p.Owner != null ? p.Owner.TeamId : TeamUtil.Neutral))
            {
                if (p.Hit.Contains(d)) continue;
                float t;
                float dist = AttackSystem.DistancePointSegment(d.Position, from, next, out t);
                if (dist > p.Radius + d.Radius) continue;
                p.Hit.Add(d);
                AttackSystem.DealDamage(p.Owner, d, p.Spec, p.Damage, from - dir, p.IsSuper);
                if (!p.Spec.pierce && !p.Boomerang)
                {
                    if (p.Spec.areaRadius > 0.3f && p.Spec.visual == ProjectileVisual.Bomb) Explode(p, d.Position);
                    return true;
                }
            }

            p.transform.position = next;
            p.transform.rotation = Quaternion.LookRotation(dir);
            if (p.CurrentVisual == ProjectileVisual.Star) p.transform.Rotate(0, Time.time * 720f % 360f, 0, Space.Self);
            if (p.CurrentVisual == ProjectileVisual.Flame && FX.Quality > 0) FX.Trail(next, p.Spec.color, p.Radius * 3f);
            p.Travelled += step;
            if (!p.Returning && p.Travelled >= p.Range)
            {
                if (p.Boomerang) { p.Returning = true; p.Hit.Clear(); return false; }
                if (p.Spec.visual == ProjectileVisual.Bomb && p.Spec.areaRadius > 0.3f) Explode(p, next);
                return true;
            }
            if (p.Returning && p.Travelled > p.Range * 3f) return true;
            return false;
        }

        private bool UpdateLob(Projectile p, float dt, MatchContext match)
        {
            p.LobT += dt;
            float k = Mathf.Clamp01(p.LobT / p.LobDur);
            Vector3 pos = Vector3.Lerp(p.LobStart, p.LobTarget, k);
            pos.y = Mathf.Lerp(p.LobStart.y, 0.2f, k) + Mathf.Sin(k * Mathf.PI) * p.LobHeight;
            p.transform.position = pos;
            p.transform.Rotate(400f * dt, 0, 0, Space.Self);
            if (k >= 1f)
            {
                Vector3 land = p.LobTarget;
                if (p.Damage > 0f || p.Spec.kind == AttackKind.Lob) Explode(p, land);
                if (p.OnLand != null) p.OnLand(land);
                return true;
            }
            return false;
        }

        private void Explode(Projectile p, Vector3 at)
        {
            at.y = 0;
            float r = Mathf.Max(0.6f, p.Spec.areaRadius);
            if (p.Damage > 0f) AttackSystem.DamageArea(p.Owner, at, r, p.Damage, p.Spec, p.IsSuper, null);
            else if (p.Spec.destroysWalls && MatchContext.Current != null) MatchContext.Current.Arena.DestroyTilesInRadius(at, r);
            FX.Explosion(at, r, p.Spec.color);
            AudioManager.Sfx(SfxPreset.Explosion, at, 0.7f);
        }
    }
}
