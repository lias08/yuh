// ---------------------------------------------------------------------------------------------
// IconFactory – zeichnet alle UI-Icons (Münze, Edelstein, Trophäe, Schloss, Zahnrad ...) zur
// Laufzeit über Distanzfelder (SDF) mit dunklem Comic-Umriss. Keine Bilddateien nötig.
// Eigene Icons: PNG nach Resources/BrawlArena/Icons/<IconName> legen (überschreibt).
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;

namespace BrawlArena.UI
{
    public enum Icon
    {
        Coin, Gem, Trophy, Star, Lock, Gear, Person, Heart, Play, Back, Close, Box, Bolt, Crown, Ball,
        Sword, Token, Plus, Check, Info, PowerPoint, Shop, Flag, Pencil, Skull, Clock, Gift, Users
    }

    public static class IconFactory
    {
        private static readonly Dictionary<Icon, Sprite> cache = new Dictionary<Icon, Sprite>();
        private const int Size = 128;
        private static readonly Color Outline = new Color(0.1f, 0.07f, 0.15f, 1f);

        private struct Layer { public Func<Vector2, float> sdf; public Color color; }

        public static Sprite Get(Icon icon)
        {
            Sprite s;
            if (cache.TryGetValue(icon, out s) && s != null) return s;
            var custom = Resources.Load<Sprite>("BrawlArena/Icons/" + icon);
            if (custom != null) { cache[icon] = custom; return custom; }
            var tex = Render(Build(icon));
            s = Sprite.Create(tex, new Rect(0, 0, Size, Size), new Vector2(0.5f, 0.5f), 100f);
            s.name = "Icon_" + icon;
            cache[icon] = s;
            return s;
        }

        // ------------------------------------------------------------------ SDF-Grundformen
        private static float Circle(Vector2 p, Vector2 c, float r) { return (p - c).magnitude - r; }
        private static float Box(Vector2 p, Vector2 c, Vector2 h, float round = 0f, float rotDeg = 0f)
        {
            Vector2 q = p - c;
            if (rotDeg != 0f) { float a = -rotDeg * Mathf.Deg2Rad; q = new Vector2(q.x * Mathf.Cos(a) - q.y * Mathf.Sin(a), q.x * Mathf.Sin(a) + q.y * Mathf.Cos(a)); }
            Vector2 d = new Vector2(Mathf.Abs(q.x) - h.x + round, Mathf.Abs(q.y) - h.y + round);
            return new Vector2(Mathf.Max(d.x, 0), Mathf.Max(d.y, 0)).magnitude + Mathf.Min(Mathf.Max(d.x, d.y), 0f) - round;
        }
        private static float Seg(Vector2 p, Vector2 a, Vector2 b, float r)
        {
            Vector2 pa = p - a, ba = b - a;
            float h = Mathf.Clamp01(Vector2.Dot(pa, ba) / Vector2.Dot(ba, ba));
            return (pa - ba * h).magnitude - r;
        }
        private static float Poly(Vector2 p, Vector2[] v)
        {
            float d = Vector2.Dot(p - v[0], p - v[0]);
            float s = 1f;
            for (int i = 0, j = v.Length - 1; i < v.Length; j = i, i++)
            {
                Vector2 e = v[j] - v[i], w = p - v[i];
                Vector2 b = w - e * Mathf.Clamp01(Vector2.Dot(w, e) / Vector2.Dot(e, e));
                d = Mathf.Min(d, Vector2.Dot(b, b));
                bool c1 = p.y >= v[i].y, c2 = p.y < v[j].y, c3 = e.x * w.y > e.y * w.x;
                if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
            }
            return s * Mathf.Sqrt(d);
        }
        private static Vector2[] StarPts(int n, float r1, float r2, float rot)
        {
            var pts = new Vector2[n * 2];
            for (int i = 0; i < n * 2; i++)
            {
                float a = rot + i * Mathf.PI / n;
                float r = i % 2 == 0 ? r1 : r2;
                pts[i] = new Vector2(Mathf.Sin(a) * r, Mathf.Cos(a) * r);
            }
            return pts;
        }
        private static Vector2 V(float x, float y) { return new Vector2(x, y); }
        private static Layer L(Func<Vector2, float> f, Color c) { return new Layer { sdf = f, color = c }; }
        private static Color C(float r, float g, float b) { return new Color(r, g, b, 1f); }

        // ------------------------------------------------------------------ Icon-Definitionen
        private static List<Layer> Build(Icon icon)
        {
            var l = new List<Layer>();
            Color gold = C(1f, 0.8f, 0.2f), goldDark = C(0.93f, 0.6f, 0.1f), white = C(1f, 1f, 1f);
            switch (icon)
            {
                case Icon.Coin:
                    l.Add(L(p => Circle(p, V(0, 0), 0.82f), goldDark));
                    l.Add(L(p => Circle(p, V(0, 0.05f), 0.7f), gold));
                    l.Add(L(p => Box(p, V(0, 0.05f), V(0.13f, 0.38f), 0.08f), goldDark));
                    break;
                case Icon.Gem:
                    var gem = new[] { V(-0.5f, 0.6f), V(0.5f, 0.6f), V(0.85f, 0.15f), V(0f, -0.85f), V(-0.85f, 0.15f) };
                    l.Add(L(p => Poly(p, gem), C(0.25f, 0.85f, 0.45f)));
                    var facet = new[] { V(-0.3f, 0.6f), V(0.3f, 0.6f), V(0.45f, 0.15f), V(0f, -0.6f), V(-0.45f, 0.15f) };
                    l.Add(L(p => Poly(p, facet), C(0.45f, 1f, 0.6f)));
                    l.Add(L(p => Poly(p, new[] { V(-0.25f, 0.5f), V(0.05f, 0.5f), V(-0.25f, 0.2f) }), C(0.85f, 1f, 0.9f)));
                    break;
                case Icon.Trophy:
                    var cup = new[] { V(-0.6f, 0.78f), V(0.6f, 0.78f), V(0.48f, 0.05f), V(0.18f, -0.18f), V(-0.18f, -0.18f), V(-0.48f, 0.05f) };
                    l.Add(L(p => Mathf.Min(Mathf.Min(Seg(p, V(-0.62f, 0.55f), V(-0.82f, 0.3f), 0.09f), Seg(p, V(0.62f, 0.55f), V(0.82f, 0.3f), 0.09f)),
                        Mathf.Min(Seg(p, V(-0.82f, 0.3f), V(-0.45f, 0.08f), 0.09f), Seg(p, V(0.82f, 0.3f), V(0.45f, 0.08f), 0.09f))), goldDark));
                    l.Add(L(p => Poly(p, cup), gold));
                    l.Add(L(p => Box(p, V(0, -0.38f), V(0.1f, 0.22f)), goldDark));
                    l.Add(L(p => Box(p, V(0, -0.7f), V(0.45f, 0.13f), 0.05f), gold));
                    l.Add(L(p => Box(p, V(-0.25f, 0.45f), V(0.08f, 0.22f), 0.06f), C(1f, 0.95f, 0.6f)));
                    break;
                case Icon.Star:
                    l.Add(L(p => Poly(p, StarPts(5, 0.9f, 0.42f, 0f)), gold));
                    l.Add(L(p => Poly(p, StarPts(5, 0.45f, 0.2f, 0f)) + 0.0f, C(1f, 0.93f, 0.55f)));
                    break;
                case Icon.Lock:
                    l.Add(L(p => Mathf.Max(Mathf.Abs(Circle(p, V(0, 0.2f), 0.36f)) - 0.1f, -(p.y - 0.18f)), C(0.7f, 0.72f, 0.78f)));
                    l.Add(L(p => Box(p, V(0, -0.3f), V(0.6f, 0.45f), 0.12f), gold));
                    l.Add(L(p => Mathf.Min(Circle(p, V(0, -0.2f), 0.12f), Box(p, V(0, -0.4f), V(0.05f, 0.15f))), goldDark));
                    break;
                case Icon.Gear:
                    l.Add(L(p =>
                    {
                        float d = Circle(p, V(0, 0), 0.58f);
                        for (int i = 0; i < 4; i++) d = Mathf.Min(d, Box(p, V(0, 0), V(0.14f, 0.85f), 0.04f, i * 45f));
                        return Mathf.Max(d, -Circle(p, V(0, 0), 0.25f));
                    }, C(0.75f, 0.78f, 0.85f)));
                    break;
                case Icon.Person:
                case Icon.Users:
                    if (icon == Icon.Users)
                    {
                        l.Add(L(p => Mathf.Min(Circle(p, V(0.45f, 0.5f), 0.25f), Mathf.Max(Circle(p, V(0.45f, -0.45f), 0.5f), -(p.y + 0.85f))), C(0.4f, 0.6f, 1f)));
                    }
                    l.Add(L(p => Circle(p, V(icon == Icon.Users ? -0.15f : 0f, 0.42f), 0.33f), C(1f, 0.82f, 0.65f)));
                    l.Add(L(p => Mathf.Max(Circle(p, V(icon == Icon.Users ? -0.15f : 0f, -0.62f), 0.66f), -(p.y + 0.9f)), C(0.3f, 0.6f, 1f)));
                    break;
                case Icon.Heart:
                    l.Add(L(p => Mathf.Min(Mathf.Min(Circle(p, V(-0.38f, 0.3f), 0.42f), Circle(p, V(0.38f, 0.3f), 0.42f)), Poly(p, new[] { V(-0.78f, 0.2f), V(0.78f, 0.2f), V(0f, -0.8f) })), C(1f, 0.3f, 0.4f)));
                    l.Add(L(p => Circle(p, V(-0.42f, 0.38f), 0.14f), C(1f, 0.7f, 0.75f)));
                    break;
                case Icon.Play:
                    l.Add(L(p => Poly(p, new[] { V(-0.5f, 0.75f), V(0.75f, 0f), V(-0.5f, -0.75f) }), white));
                    break;
                case Icon.Back:
                    l.Add(L(p => Mathf.Min(Poly(p, new[] { V(-0.8f, 0f), V(-0.1f, 0.65f), V(-0.1f, -0.65f) }), Box(p, V(0.3f, 0), V(0.45f, 0.2f), 0.05f)), white));
                    break;
                case Icon.Close:
                    l.Add(L(p => Mathf.Min(Seg(p, V(-0.55f, -0.55f), V(0.55f, 0.55f), 0.16f), Seg(p, V(-0.55f, 0.55f), V(0.55f, -0.55f), 0.16f)), white));
                    break;
                case Icon.Box:
                case Icon.Gift:
                    Color bc = icon == Icon.Gift ? C(1f, 0.35f, 0.5f) : C(0.35f, 0.6f, 1f);
                    l.Add(L(p => Box(p, V(0, -0.2f), V(0.72f, 0.55f), 0.1f), bc));
                    l.Add(L(p => Box(p, V(0, 0.4f), V(0.8f, 0.18f), 0.06f), Color.Lerp(bc, Color.white, 0.25f)));
                    l.Add(L(p => Box(p, V(0, 0f), V(0.12f, 0.75f)), gold));
                    if (icon == Icon.Gift) l.Add(L(p => Mathf.Min(Circle(p, V(-0.2f, 0.7f), 0.17f), Circle(p, V(0.2f, 0.7f), 0.17f)), gold));
                    break;
                case Icon.Bolt:
                    l.Add(L(p => Poly(p, new[] { V(0.15f, 0.9f), V(-0.55f, -0.05f), V(-0.05f, -0.05f), V(-0.2f, -0.9f), V(0.55f, 0.15f), V(0.05f, 0.15f) }), gold));
                    break;
                case Icon.Crown:
                    l.Add(L(p => Poly(p, new[] { V(-0.8f, -0.5f), V(-0.85f, 0.55f), V(-0.4f, 0.1f), V(0f, 0.7f), V(0.4f, 0.1f), V(0.85f, 0.55f), V(0.8f, -0.5f) }), gold));
                    l.Add(L(p => Box(p, V(0, -0.55f), V(0.82f, 0.13f), 0.05f), goldDark));
                    l.Add(L(p => Circle(p, V(0, 0.05f), 0.13f), C(1f, 0.3f, 0.4f)));
                    break;
                case Icon.Ball:
                    l.Add(L(p => Circle(p, V(0, 0), 0.82f), white));
                    l.Add(L(p => Poly(p, StarPts(5, 0.32f, 0.3f, 0f)), C(0.15f, 0.15f, 0.2f)));
                    break;
                case Icon.Sword:
                    l.Add(L(p => Poly(p, new[] { V(0.75f, 0.75f), V(0.6f, 0.35f), V(-0.25f, -0.5f), V(-0.4f, -0.35f), V(0.45f, 0.5f) }), C(0.85f, 0.9f, 1f)));
                    l.Add(L(p => Seg(p, V(-0.55f, -0.15f), V(-0.15f, -0.55f), 0.09f), gold));
                    l.Add(L(p => Seg(p, V(-0.42f, -0.42f), V(-0.7f, -0.7f), 0.08f), C(0.5f, 0.3f, 0.2f)));
                    break;
                case Icon.Token:
                    l.Add(L(p => Circle(p, V(0, 0), 0.82f), C(0.25f, 0.5f, 1f)));
                    l.Add(L(p => Poly(p, StarPts(5, 0.5f, 0.22f, 0f)), white));
                    break;
                case Icon.Plus:
                    l.Add(L(p => Mathf.Min(Box(p, V(0, 0), V(0.18f, 0.7f), 0.08f), Box(p, V(0, 0), V(0.7f, 0.18f), 0.08f)), C(0.4f, 1f, 0.45f)));
                    break;
                case Icon.Check:
                    l.Add(L(p => Mathf.Min(Seg(p, V(-0.6f, 0f), V(-0.15f, -0.5f), 0.15f), Seg(p, V(-0.15f, -0.5f), V(0.65f, 0.55f), 0.15f)), C(0.4f, 1f, 0.45f)));
                    break;
                case Icon.Info:
                    l.Add(L(p => Circle(p, V(0, 0), 0.82f), C(0.3f, 0.6f, 1f)));
                    l.Add(L(p => Mathf.Min(Circle(p, V(0, 0.42f), 0.13f), Box(p, V(0, -0.2f), V(0.11f, 0.38f), 0.05f)), white));
                    break;
                case Icon.PowerPoint:
                    l.Add(L(p => Circle(p, V(0, 0), 0.82f), C(0.75f, 0.3f, 1f)));
                    l.Add(L(p => Poly(p, new[] { V(0.1f, 0.65f), V(-0.4f, -0.05f), V(-0.05f, -0.05f), V(-0.15f, -0.65f), V(0.4f, 0.1f), V(0.05f, 0.1f) }), C(1f, 0.85f, 1f)));
                    break;
                case Icon.Shop:
                    l.Add(L(p => Mathf.Max(Mathf.Abs(Circle(p, V(0, 0.35f), 0.3f)) - 0.08f, -(p.y - 0.3f)), C(0.8f, 0.5f, 0.2f)));
                    l.Add(L(p => Box(p, V(0, -0.25f), V(0.7f, 0.55f), 0.1f), C(1f, 0.6f, 0.2f)));
                    l.Add(L(p => Circle(p, V(0, -0.25f), 0.18f), gold));
                    break;
                case Icon.Flag:
                    l.Add(L(p => Box(p, V(-0.55f, -0.05f), V(0.07f, 0.85f), 0.03f), C(0.6f, 0.6f, 0.65f)));
                    l.Add(L(p => Poly(p, new[] { V(-0.5f, 0.8f), V(0.75f, 0.45f), V(-0.5f, 0.05f) }), C(1f, 0.35f, 0.35f)));
                    break;
                case Icon.Pencil:
                    l.Add(L(p => Seg(p, V(-0.45f, -0.45f), V(0.55f, 0.55f), 0.2f), gold));
                    l.Add(L(p => Poly(p, new[] { V(-0.75f, -0.75f), V(-0.62f, -0.22f), V(-0.22f, -0.62f) }), C(1f, 0.85f, 0.7f)));
                    l.Add(L(p => Seg(p, V(0.45f, 0.45f), V(0.62f, 0.62f), 0.2f), C(1f, 0.45f, 0.5f)));
                    break;
                case Icon.Skull:
                    l.Add(L(p => Mathf.Min(Circle(p, V(0, 0.15f), 0.65f), Box(p, V(0, -0.5f), V(0.35f, 0.25f), 0.08f)), white));
                    l.Add(L(p => Mathf.Min(Circle(p, V(-0.25f, 0.1f), 0.17f), Circle(p, V(0.25f, 0.1f), 0.17f)), C(0.15f, 0.1f, 0.2f)));
                    break;
                case Icon.Clock:
                    l.Add(L(p => Circle(p, V(0, 0), 0.82f), white));
                    l.Add(L(p => Mathf.Min(Seg(p, V(0, 0), V(0, 0.5f), 0.08f), Seg(p, V(0, 0), V(0.35f, -0.1f), 0.08f)), C(0.15f, 0.1f, 0.2f)));
                    break;
            }
            return l;
        }

        // ------------------------------------------------------------------ Rasterisierung
        private static Texture2D Render(List<Layer> layers)
        {
            var tex = new Texture2D(Size, Size, TextureFormat.RGBA32, true);
            var px = new Color[Size * Size];
            const float outlineW = 0.09f;
            float aa = 2.5f / Size;
            for (int y = 0; y < Size; y++)
                for (int x = 0; x < Size; x++)
                {
                    Vector2 p = new Vector2((x + 0.5f) / Size * 2f - 1f, (y + 0.5f) / Size * 2f - 1f) * 1.08f;
                    float union = float.MaxValue;
                    foreach (var layer in layers) union = Mathf.Min(union, layer.sdf(p));
                    float outerA = Mathf.Clamp01(0.5f - (union - outlineW) / aa);
                    if (outerA <= 0f) { px[y * Size + x] = new Color(0, 0, 0, 0); continue; }
                    Color c = Outline;
                    foreach (var layer in layers)
                    {
                        float d = layer.sdf(p);
                        float a = Mathf.Clamp01(0.5f - d / aa);
                        if (a <= 0f) continue;
                        // Innere Umrisslinie zwischen Ebenen
                        float inner = Mathf.Clamp01(0.5f - (d + 0.035f) / aa);
                        Color lc = layer.color * (1.08f - (1f - p.y) * 0.1f);
                        lc.a = 1f;
                        c = Color.Lerp(c, Color.Lerp(Outline, lc, inner), a);
                    }
                    c.a = outerA;
                    px[y * Size + x] = c;
                }
            tex.SetPixels(px);
            tex.wrapMode = TextureWrapMode.Clamp;
            tex.Apply(true, true);
            return tex;
        }
    }
}
