// ---------------------------------------------------------------------------------------------
// FX – zentrale Effekt-Schnittstelle. Partikel werden über wenige gemeinsame ParticleSystems
// per Emit() erzeugt (keine Instanziierung pro Effekt → sehr schnell auf Mobilgeräten).
// Formeffekte (Ringe, Schwerthiebe, Strahlen) nutzen einen kleinen Objekt-Pool.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Rendering;

namespace BrawlArena.Gameplay
{
    public static class FX
    {
        private static ParticleSystem sparks, glow, smoke, debris, stars;
        private static Transform root;
        private static readonly List<ShapeFx> pool = new List<ShapeFx>();

        /// <summary>Schadenszahl anzeigen (wird vom HUD abonniert).</summary>
        public static event Action<Vector3, float, Color, bool> DamageNumber;
        /// <summary>Kamerawackeln (Stärke).</summary>
        public static event Action<float> Shake;
        /// <summary>Effektqualität 0..2 (aus den Einstellungen).</summary>
        public static int Quality = 2;

        public static void Init(Transform parent)
        {
            if (root != null) return;
            root = new GameObject("FX").transform;
            root.SetParent(parent, false);
            sparks = CreateSystem("Sparks", MaterialLibrary.ParticleAdd, 0.6f, true);
            glow = CreateSystem("Glow", MaterialLibrary.ParticleAdd, 0f, false);
            smoke = CreateSystem("Smoke", MaterialLibrary.ParticleSmoke, -0.05f, false);
            debris = CreateSystem("Debris", MaterialLibrary.ParticleAlpha, 1.6f, true);
            stars = CreateSystem("Stars", MaterialLibrary.ParticleStar, 0f, true);
        }

        private static ParticleSystem CreateSystem(string name, Material mat, float gravity, bool shrink)
        {
            var go = new GameObject(name);
            go.transform.SetParent(root, false);
            var ps = go.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main;
            main.loop = false;
            main.playOnAwake = false;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.maxParticles = 1500;
            main.gravityModifier = gravity;
            var em = ps.emission; em.enabled = false;
            var shape = ps.shape; shape.enabled = false;
            var col = ps.colorOverLifetime; col.enabled = true;
            var g = new Gradient();
            g.SetKeys(new[] { new GradientColorKey(Color.white, 0), new GradientColorKey(Color.white, 1) },
                      new[] { new GradientAlphaKey(1, 0), new GradientAlphaKey(0.8f, 0.6f), new GradientAlphaKey(0, 1) });
            col.color = new ParticleSystem.MinMaxGradient(g);
            var sol = ps.sizeOverLifetime; sol.enabled = true;
            sol.size = new ParticleSystem.MinMaxCurve(1f, shrink ? AnimationCurve.Linear(0, 1, 1, 0.1f) : AnimationCurve.EaseInOut(0, 0.6f, 1, 1.4f));
            var r = go.GetComponent<ParticleSystemRenderer>();
            r.sharedMaterial = mat;
            r.renderMode = ParticleSystemRenderMode.Billboard;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            r.receiveShadows = false;
            r.sortingFudge = 0;
            ps.Play();
            return ps;
        }

        private static int Scale(int count) { return Quality >= 2 ? count : Quality == 1 ? Mathf.Max(1, count / 2) : Mathf.Max(1, count / 4); }

        private static void Emit(ParticleSystem ps, Vector3 pos, Vector3 vel, Color c, float size, float life)
        {
            if (ps == null) return;
            var ep = new ParticleSystem.EmitParams
            {
                position = pos,
                velocity = vel,
                startColor = c,
                startSize = size,
                startLifetime = life,
                applyShapeToPosition = false
            };
            ps.Emit(ep, 1);
        }

        private static Vector3 RandDir(float upBias)
        {
            var d = UnityEngine.Random.onUnitSphere;
            d.y = Mathf.Abs(d.y) * upBias;
            return d;
        }

        // =============================================================== Öffentliche Effekte
        public static void Muzzle(Vector3 pos, Vector3 dir, Color c)
        {
            Emit(glow, pos, Vector3.zero, Color.Lerp(c, Color.white, 0.4f), 0.7f, 0.1f);
            for (int i = 0; i < Scale(5); i++)
                Emit(sparks, pos, (dir + UnityEngine.Random.insideUnitSphere * 0.6f) * UnityEngine.Random.Range(2f, 5f), c, UnityEngine.Random.Range(0.08f, 0.16f), 0.25f);
        }

        public static void Hit(Vector3 pos, Color c)
        {
            Emit(glow, pos, Vector3.zero, c, 0.9f, 0.15f);
            for (int i = 0; i < Scale(9); i++)
                Emit(sparks, pos, RandDir(1f) * UnityEngine.Random.Range(2f, 6f), Color.Lerp(c, Color.white, 0.3f), UnityEngine.Random.Range(0.08f, 0.18f), 0.35f);
        }

        public static void Explosion(Vector3 pos, float radius, Color c)
        {
            Emit(glow, pos + Vector3.up * 0.4f, Vector3.zero, Color.Lerp(c, Color.white, 0.5f), radius * 2.6f, 0.22f);
            for (int i = 0; i < Scale(18); i++)
                Emit(sparks, pos + Vector3.up * 0.3f, RandDir(1.5f) * UnityEngine.Random.Range(3f, 7f) * Mathf.Max(0.6f, radius * 0.6f), c, UnityEngine.Random.Range(0.15f, 0.3f), 0.5f);
            for (int i = 0; i < Scale(10); i++)
                Emit(smoke, pos + UnityEngine.Random.insideUnitSphere * radius * 0.5f + Vector3.up * 0.3f, RandDir(1f) * 0.8f + Vector3.up * 0.6f,
                    new Color(0.35f, 0.32f, 0.3f, 0.75f), UnityEngine.Random.Range(0.8f, 1.4f) * Mathf.Max(0.7f, radius * 0.6f), 0.9f);
            Ring(pos, radius, c, 0.35f);
            ShakeCamera(0.15f + radius * 0.05f);
        }

        public static void Heal(Vector3 pos)
        {
            for (int i = 0; i < Scale(8); i++)
                Emit(stars, pos + new Vector3(UnityEngine.Random.Range(-0.4f, 0.4f), UnityEngine.Random.Range(0.2f, 1f), UnityEngine.Random.Range(-0.4f, 0.4f)),
                    Vector3.up * UnityEngine.Random.Range(0.8f, 1.6f), new Color(0.4f, 1f, 0.5f), UnityEngine.Random.Range(0.18f, 0.3f), 0.7f);
        }

        public static void Poof(Vector3 pos, Color c)
        {
            for (int i = 0; i < Scale(14); i++)
                Emit(smoke, pos + Vector3.up * 0.5f, RandDir(1f) * UnityEngine.Random.Range(1f, 3f), Color.Lerp(c, Color.white, 0.5f), UnityEngine.Random.Range(0.5f, 0.9f), 0.7f);
            for (int i = 0; i < Scale(10); i++)
                Emit(stars, pos + Vector3.up * 0.7f, RandDir(1.4f) * UnityEngine.Random.Range(2f, 4f), Color.white, 0.25f, 0.6f);
        }

        public static void Dust(Vector3 pos)
        {
            if (Quality == 0) return;
            Emit(smoke, pos + Vector3.up * 0.05f, new Vector3(UnityEngine.Random.Range(-0.3f, 0.3f), 0.3f, UnityEngine.Random.Range(-0.3f, 0.3f)),
                new Color(0.9f, 0.85f, 0.75f, 0.45f), UnityEngine.Random.Range(0.25f, 0.4f), 0.45f);
        }

        public static void Sparkle(Vector3 pos, Color c)
        {
            Emit(stars, pos + UnityEngine.Random.insideUnitSphere * 0.3f, Vector3.up * 0.5f, c, UnityEngine.Random.Range(0.15f, 0.28f), 0.5f);
        }

        public static void Debris(Vector3 pos, Color c)
        {
            for (int i = 0; i < Scale(10); i++)
                Emit(debris, pos, RandDir(2f) * UnityEngine.Random.Range(2f, 5f) + Vector3.up * 2f, c, UnityEngine.Random.Range(0.15f, 0.3f), 0.8f);
            Emit(smoke, pos, Vector3.up * 0.4f, new Color(0.6f, 0.55f, 0.5f, 0.6f), 1.2f, 0.7f);
        }

        /// <summary>Super ist bereit / Verwandlung / Respawn: Lichtsäule mit Sternen.</summary>
        public static void PowerUp(Vector3 pos, Color c)
        {
            for (int i = 0; i < Scale(24); i++)
            {
                float a = i / 24f * Mathf.PI * 2f;
                var d = new Vector3(Mathf.Cos(a), 0, Mathf.Sin(a));
                Emit(sparks, pos + d * 0.6f + Vector3.up * 0.1f, Vector3.up * UnityEngine.Random.Range(3f, 6f) + d * 0.5f, c, 0.2f, 0.6f);
            }
            Emit(glow, pos + Vector3.up * 0.8f, Vector3.zero, c, 3f, 0.35f);
            Ring(pos, 1.6f, c, 0.4f);
        }

        public static void Trail(Vector3 pos, Color c, float size)
        {
            Emit(glow, pos, Vector3.zero, new Color(c.r, c.g, c.b, 0.6f), size, 0.18f);
        }

        public static void Gas(Vector3 pos)
        {
            Emit(smoke, pos, new Vector3(UnityEngine.Random.Range(-0.3f, 0.3f), 0.4f, UnityEngine.Random.Range(-0.3f, 0.3f)),
                new Color(0.35f, 0.9f, 0.3f, 0.5f), UnityEngine.Random.Range(1.2f, 2f), 1.6f);
        }

        public static void ShowDamageNumber(Vector3 pos, float amount, Color c, bool big)
        {
            if (DamageNumber != null) DamageNumber(pos, amount, c, big);
        }

        public static void ShakeCamera(float amount)
        {
            if (Shake != null) Shake(amount);
        }

        // =============================================================== Formeffekte
        private static ShapeFx GetShape()
        {
            for (int i = 0; i < pool.Count; i++) if (pool[i] != null && !pool[i].gameObject.activeSelf) return pool[i];
            var go = new GameObject("ShapeFx");
            go.transform.SetParent(root, false);
            var fx = go.AddComponent<ShapeFx>();
            fx.Init();
            pool.Add(fx);
            return fx;
        }

        /// <summary>Sich ausdehnender Ring am Boden.</summary>
        public static void Ring(Vector3 pos, float radius, Color c, float duration)
        {
            if (root == null) return;
            GetShape().PlayRing(pos, radius, c, duration);
        }

        /// <summary>Schwerthieb-Bogen vor einer Position.</summary>
        public static void Slash(Vector3 pos, Vector3 dir, float radius, float angle, Color c, bool leftToRight)
        {
            if (root == null) return;
            GetShape().PlaySlash(pos, dir, radius, angle, c, leftToRight);
            for (int i = 0; i < Scale(6); i++)
            {
                float a = UnityEngine.Random.Range(-angle * 0.5f, angle * 0.5f);
                var d = Quaternion.Euler(0, a, 0) * dir;
                Emit(sparks, pos + d * radius * 0.85f + Vector3.up * 0.5f, d * 2f, c, 0.12f, 0.25f);
            }
        }

        /// <summary>Strahl von a nach b.</summary>
        public static void Beam(Vector3 a, Vector3 b, Color c, float width)
        {
            if (root == null) return;
            GetShape().PlayBeam(a, b, c, width);
            Hit(b, c);
        }

        public static void Clear()
        {
            foreach (var ps in new[] { sparks, glow, smoke, debris, stars })
                if (ps != null) ps.Clear();
            foreach (var p in pool) if (p != null) p.gameObject.SetActive(false);
        }
    }

    /// <summary>Kurzlebiger Mesh-Effekt (Ring, Bogen, Strahl) aus dem Pool.</summary>
    public class ShapeFx : MonoBehaviour
    {
        private enum Kind { Ring, Slash, Beam }
        private MeshFilter mf;
        private MeshRenderer mr;
        private Material mat;
        private Kind kind;
        private float t, duration, radius;
        private Color color;
        private Mesh ringMesh, beamMesh;
        private readonly Dictionary<int, Mesh> sectorCache = new Dictionary<int, Mesh>();
        private Vector3 slashDir;
        private bool slashLtr;
        private float slashAngle;

        public void Init()
        {
            mf = gameObject.AddComponent<MeshFilter>();
            mr = gameObject.AddComponent<MeshRenderer>();
            mat = new Material(MaterialLibrary.ParticleAdd);
            mat.mainTexture = Texture2D.whiteTexture;
            mr.sharedMaterial = mat;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            mr.receiveShadows = false;
            ringMesh = ProcMesh.BuildRing(0.85f, 1f, 40);
            beamMesh = ProcMesh.BuildStrip(1f, 1f);
            gameObject.SetActive(false);
        }

        public void PlayRing(Vector3 pos, float r, Color c, float dur)
        {
            kind = Kind.Ring; radius = r; color = c; duration = dur; t = 0;
            mf.sharedMesh = ringMesh;
            mat.mainTexture = Texture2D.whiteTexture;
            transform.position = pos + Vector3.up * 0.06f;
            transform.rotation = Quaternion.identity;
            transform.localScale = Vector3.one * 0.1f;
            gameObject.SetActive(true);
        }

        public void PlaySlash(Vector3 pos, Vector3 dir, float r, float angle, Color c, bool ltr)
        {
            kind = Kind.Slash; radius = r; color = c; duration = 0.22f; t = 0;
            int key = Mathf.RoundToInt(angle);
            Mesh m;
            if (!sectorCache.TryGetValue(key, out m)) { m = ProcMesh.BuildSector(1f, angle, 20); sectorCache[key] = m; }
            mf.sharedMesh = m;
            mat.mainTexture = TextureFactory.Ring;
            slashDir = dir; slashLtr = ltr; slashAngle = angle;
            transform.position = pos + Vector3.up * 0.55f;
            transform.rotation = Quaternion.LookRotation(dir);
            transform.localScale = new Vector3(r, 1, r);
            gameObject.SetActive(true);
        }

        public void PlayBeam(Vector3 a, Vector3 b, Color c, float width)
        {
            kind = Kind.Beam; color = c; duration = 0.25f; t = 0;
            mf.sharedMesh = beamMesh;
            mat.mainTexture = TextureFactory.TrailGradient;
            Vector3 d = b - a; d.y = 0;
            transform.position = a;
            transform.rotation = d.sqrMagnitude > 0.0001f ? Quaternion.LookRotation(d) : Quaternion.identity;
            transform.localScale = new Vector3(width * 2f, 1, d.magnitude);
            radius = width;
            gameObject.SetActive(true);
        }

        private void Update()
        {
            t += Time.deltaTime;
            float k = Mathf.Clamp01(t / duration);
            switch (kind)
            {
                case Kind.Ring:
                    transform.localScale = Vector3.one * Mathf.Lerp(0.2f, radius, 1f - (1f - k) * (1f - k));
                    break;
                case Kind.Slash:
                    // Leichtes Nachdrehen in Schlagrichtung
                    float sweep = (slashLtr ? 1f : -1f) * slashAngle * 0.25f * (k - 0.5f);
                    transform.rotation = Quaternion.LookRotation(Quaternion.Euler(0, sweep, 0) * slashDir);
                    break;
                case Kind.Beam:
                    var s = transform.localScale; s.x = radius * 2f * (1f - k); transform.localScale = s;
                    break;
            }
            var c = color; c.a = color.a * (1f - k);
            mat.SetColor("_TintColor", c);
            if (k >= 1f) gameObject.SetActive(false);
        }
    }
}
