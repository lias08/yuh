// ---------------------------------------------------------------------------------------------
// MaterialLibrary – zentrale, gecachte Materialien. Die Shader liegen in Resources/Shaders und
// werden dadurch garantiert in den Android-Build aufgenommen.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;

namespace BrawlArena.Rendering
{
    public static class MaterialLibrary
    {
        private static readonly Dictionary<string, Material> cache = new Dictionary<string, Material>();
        private static readonly Dictionary<string, Shader> shaders = new Dictionary<string, Shader>();

        private static readonly HashSet<Material> generated = new HashSet<Material>();

        /// <summary>Erzeugt eine eigene Material-Instanz (wird beim Match-Ende freigegeben).</summary>
        public static Material Instance(Material source)
        {
            var m = new Material(source);
            generated.Add(m);
            return m;
        }

        /// <summary>Gibt eine zur Laufzeit erzeugte Material-Instanz frei (Bibliothek/Assets bleiben unberührt).</summary>
        public static void Release(Material m)
        {
            if (m == null || !generated.Remove(m)) return;
            Object.Destroy(m);
        }

        public static Shader GetShader(string name, string fallback)
        {
            Shader s;
            if (shaders.TryGetValue(name, out s) && s != null) return s;
            s = Shader.Find(name);
            if (s == null || !s.isSupported)
            {
                Debug.LogWarning("[BrawlArena] Shader nicht gefunden/unterstützt: " + name + " – verwende " + fallback);
                s = Shader.Find(fallback);
                if (s == null) s = Shader.Find("Sprites/Default");
            }
            shaders[name] = s;
            return s;
        }

        private static Material Get(string key, string shader, string fallback, System.Action<Material> setup)
        {
            Material m;
            if (cache.TryGetValue(key, out m) && m != null) return m;
            m = new Material(GetShader(shader, fallback)) { name = key };
            if (setup != null) setup(m);
            cache[key] = m;
            return m;
        }

        /// <summary>Toon-Material für Figuren mit Umriss (nutzt Vertexfarben).</summary>
        public static Material CharacterToon
        {
            get { return Get("CharacterToon", "BrawlArena/ToonOutline", "Standard", m => { m.SetFloat("_OutlineWidth", 0.03f); }); }
        }

        /// <summary>Toon-Material ohne Umriss (Wände, Deko).</summary>
        public static Material WorldToon
        {
            get { return Get("WorldToon", "BrawlArena/Toon", "Standard", null); }
        }

        /// <summary>Toon-Material mit Umriss für Wände/Kisten.</summary>
        public static Material WorldToonOutline
        {
            get { return Get("WorldToonOutline", "BrawlArena/ToonOutline", "Standard", m => { m.SetFloat("_OutlineWidth", 0.02f); m.SetColor("_OutlineColor", new Color(0.18f, 0.1f, 0.08f)); }); }
        }

        /// <summary>Büsche mit Wind.</summary>
        public static Material Bush
        {
            get { return Get("Bush", "BrawlArena/Toon", "Standard", m => { m.SetFloat("_Wind", 1f); m.SetColor("_ShadeColor", new Color(0.45f, 0.6f, 0.5f)); }); }
        }

        public static Material Unlit
        {
            get { return Get("Unlit", "BrawlArena/Unlit", "Unlit/Color", null); }
        }

        public static Material UnlitTransparent
        {
            get { return Get("UnlitTransparent", "BrawlArena/UnlitTransparent", "Sprites/Default", null); }
        }

        public static Material Indicator
        {
            get { return Get("Indicator", "BrawlArena/Indicator", "Sprites/Default", null); }
        }

        public static Material ParticleAdd
        {
            get { return Get("ParticleAdd", "BrawlArena/ParticleAdd", "Sprites/Default", m => { m.mainTexture = TextureFactory.SoftCircle; }); }
        }

        public static Material ParticleAlpha
        {
            get { return Get("ParticleAlpha", "BrawlArena/ParticleAlpha", "Sprites/Default", m => { m.mainTexture = TextureFactory.SoftCircle; }); }
        }

        public static Material ParticleStar
        {
            get { return Get("ParticleStar", "BrawlArena/ParticleAdd", "Sprites/Default", m => { m.mainTexture = TextureFactory.Star; }); }
        }

        public static Material ParticleSmoke
        {
            get { return Get("ParticleSmoke", "BrawlArena/ParticleAlpha", "Sprites/Default", m => { m.mainTexture = TextureFactory.Smoke; }); }
        }

        public static Material Trail
        {
            get { return Get("Trail", "BrawlArena/ParticleAdd", "Sprites/Default", m => { m.mainTexture = TextureFactory.TrailGradient; }); }
        }

        public static Material Shadow
        {
            get { return Get("BlobShadow", "BrawlArena/UnlitTransparent", "Sprites/Default", m => { m.mainTexture = TextureFactory.SoftCircle; m.color = new Color(0, 0, 0, 0.35f); }); }
        }

        public static Material Water
        {
            get { return Get("Water", "BrawlArena/Water", "Unlit/Color", null); }
        }

        /// <summary>Erzeugt eine Instanz des Bodenmaterials mit den Themenfarben der Karte.</summary>
        public static Material CreateGround(Color a, Color b)
        {
            var m = new Material(GetShader("BrawlArena/Ground", "Standard")) { name = "Ground" };
            generated.Add(m);
            m.SetColor("_ColorA", a);
            m.SetColor("_ColorB", b);
            return m;
        }

        /// <summary>Neues transparentes Material (eigene Farbe, z.B. für Zonen).</summary>
        public static Material CreateTransparent(Color c, Texture tex = null)
        {
            var m = Instance(UnlitTransparent);
            m.name = "TransparentInstance";
            m.color = c;
            if (tex != null) m.mainTexture = tex;
            return m;
        }

        public static Material CreateUnlit(Color c)
        {
            var m = Instance(Unlit);
            m.name = "UnlitInstance";
            m.color = c;
            return m;
        }
    }

    /// <summary>Prozedural erzeugte Texturen (keine externen Bilddateien nötig).</summary>
    public static class TextureFactory
    {
        private static Texture2D softCircle, star, smoke, trail, ring, noise;

        public static Texture2D SoftCircle
        {
            get
            {
                if (softCircle != null) return softCircle;
                softCircle = Generate(64, (u, v) =>
                {
                    float d = Vector2.Distance(new Vector2(u, v), new Vector2(0.5f, 0.5f)) * 2f;
                    float a = Mathf.Clamp01(1f - d);
                    return new Color(1, 1, 1, a * a);
                });
                return softCircle;
            }
        }

        public static Texture2D Ring
        {
            get
            {
                if (ring != null) return ring;
                ring = Generate(64, (u, v) =>
                {
                    float d = Vector2.Distance(new Vector2(u, v), new Vector2(0.5f, 0.5f)) * 2f;
                    float a = Mathf.Clamp01(1f - Mathf.Abs(d - 0.85f) * 8f);
                    return new Color(1, 1, 1, a);
                });
                return ring;
            }
        }

        public static Texture2D Star
        {
            get
            {
                if (star != null) return star;
                star = Generate(64, (u, v) =>
                {
                    float x = u - 0.5f, y = v - 0.5f;
                    float ang = Mathf.Atan2(y, x);
                    float r = Mathf.Sqrt(x * x + y * y) * 2f;
                    float spikes = 0.45f + 0.55f * Mathf.Pow(Mathf.Abs(Mathf.Cos(ang * 2f)), 8f);
                    float a = Mathf.Clamp01((spikes - r) * 4f) + Mathf.Clamp01(1f - r * 3f);
                    return new Color(1, 1, 1, Mathf.Clamp01(a));
                });
                return star;
            }
        }

        public static Texture2D Smoke
        {
            get
            {
                if (smoke != null) return smoke;
                smoke = Generate(64, (u, v) =>
                {
                    float d = Vector2.Distance(new Vector2(u, v), new Vector2(0.5f, 0.5f)) * 2f;
                    float n = Mathf.PerlinNoise(u * 5f, v * 5f);
                    float a = Mathf.Clamp01(1f - d) * (0.6f + n * 0.6f);
                    return new Color(1, 1, 1, Mathf.Clamp01(a));
                });
                return smoke;
            }
        }

        public static Texture2D Noise
        {
            get
            {
                if (noise != null) return noise;
                noise = Generate(64, (u, v) =>
                {
                    float n = Mathf.PerlinNoise(u * 6f, v * 6f) * 0.7f + Mathf.PerlinNoise(u * 17f, v * 17f) * 0.3f;
                    return new Color(1, 1, 1, n);
                });
                noise.wrapMode = TextureWrapMode.Repeat;
                return noise;
            }
        }

        public static Texture2D TrailGradient
        {
            get
            {
                if (trail != null) return trail;
                trail = Generate(32, (u, v) =>
                {
                    float edge = 1f - Mathf.Abs(v - 0.5f) * 2f;
                    return new Color(1, 1, 1, Mathf.Clamp01(edge * 1.5f));
                });
                return trail;
            }
        }

        public static Texture2D Generate(int size, System.Func<float, float, Color> fn)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, true);
            var px = new Color[size * size];
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                    px[y * size + x] = fn((x + 0.5f) / size, (y + 0.5f) / size);
            tex.SetPixels(px);
            tex.wrapMode = TextureWrapMode.Clamp;
            tex.filterMode = FilterMode.Bilinear;
            tex.Apply(true, true);
            return tex;
        }
    }
}
