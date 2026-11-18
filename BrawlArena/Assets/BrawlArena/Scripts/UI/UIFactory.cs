// ---------------------------------------------------------------------------------------------
// UIFactory – Baukasten für die komplette Benutzeroberfläche (uGUI, per Code erzeugt).
// Erzeugt abgerundete Panels, dicke Comic-Buttons mit 3D-Kante, Texte mit Umriss, Icons,
// Schieberegler, Schalter, Eingabefelder und Scroll-Listen im einheitlichen Stil.
// Eigene Schriftart: Datei nach Resources/BrawlArena/Fonts/MainFont.ttf legen.
// ---------------------------------------------------------------------------------------------
using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using BrawlArena.Audio;

namespace BrawlArena.UI
{
    public static class Palette
    {
        public static readonly Color Yellow = new Color(1f, 0.82f, 0.15f);
        public static readonly Color Orange = new Color(1f, 0.55f, 0.15f);
        public static readonly Color Blue = new Color(0.25f, 0.55f, 1f);
        public static readonly Color Green = new Color(0.3f, 0.85f, 0.35f);
        public static readonly Color Red = new Color(1f, 0.3f, 0.32f);
        public static readonly Color Purple = new Color(0.65f, 0.35f, 1f);
        public static readonly Color Dark = new Color(0.1f, 0.08f, 0.18f, 0.92f);
        public static readonly Color Panel = new Color(0.16f, 0.14f, 0.3f, 0.94f);
        public static readonly Color PanelLight = new Color(0.26f, 0.24f, 0.45f, 0.96f);
        public static readonly Color Text = Color.white;
        public static readonly Color TextDim = new Color(0.78f, 0.78f, 0.9f);
        public static readonly Color Gray = new Color(0.45f, 0.45f, 0.55f);
    }

    public static class UIFactory
    {
        private static Font font;
        private static Sprite rounded, roundedSmall, circle, gradient, white, ring, stripes;

        public static Font Font
        {
            get
            {
                if (font != null) return font;
                font = Resources.Load<Font>("BrawlArena/Fonts/MainFont");
                if (font == null) { try { font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); } catch { font = null; } }
                if (font == null) { try { font = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch { font = null; } }
                if (font == null) font = Font.CreateDynamicFontFromOSFont(new[] { "Roboto", "Arial", "Helvetica" }, 32);
                return font;
            }
        }

        // ------------------------------------------------------------------ Sprites
        public static Sprite Rounded { get { return rounded ?? (rounded = MakeRounded(96, 30)); } }
        public static Sprite RoundedSmall { get { return roundedSmall ?? (roundedSmall = MakeRounded(48, 12)); } }
        public static Sprite Circle { get { return circle ?? (circle = MakeCircle(128, false)); } }
        public static Sprite Ring { get { return ring ?? (ring = MakeCircle(128, true)); } }
        public static Sprite White
        {
            get
            {
                if (white != null) return white;
                var t = new Texture2D(4, 4); var px = new Color[16]; for (int i = 0; i < 16; i++) px[i] = Color.white; t.SetPixels(px); t.Apply();
                white = Sprite.Create(t, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
                return white;
            }
        }
        public static Sprite Gradient
        {
            get
            {
                if (gradient != null) return gradient;
                var t = new Texture2D(4, 128, TextureFormat.RGBA32, false);
                for (int y = 0; y < 128; y++) for (int x = 0; x < 4; x++) { float k = y / 127f; t.SetPixel(x, y, new Color(1, 1, 1, 1) * Mathf.Lerp(0.55f, 1f, k) + new Color(0, 0, 0, 1) * 0f); }
                for (int y = 0; y < 128; y++) for (int x = 0; x < 4; x++) { var c = t.GetPixel(x, y); c.a = 1; t.SetPixel(x, y, c); }
                t.wrapMode = TextureWrapMode.Clamp; t.Apply();
                gradient = Sprite.Create(t, new Rect(0, 0, 4, 128), new Vector2(0.5f, 0.5f));
                return gradient;
            }
        }
        public static Sprite Stripes
        {
            get
            {
                if (stripes != null) return stripes;
                var t = new Texture2D(64, 64, TextureFormat.RGBA32, false);
                for (int y = 0; y < 64; y++) for (int x = 0; x < 64; x++) { bool s = ((x + y) / 16) % 2 == 0; t.SetPixel(x, y, new Color(1, 1, 1, s ? 0.06f : 0f)); }
                t.wrapMode = TextureWrapMode.Repeat; t.Apply();
                stripes = Sprite.Create(t, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f), 100f, 0, SpriteMeshType.FullRect);
                return stripes;
            }
        }

        private static Sprite MakeRounded(int size, int radius)
        {
            var t = new Texture2D(size, size, TextureFormat.RGBA32, false);
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float dx = Mathf.Max(0, Mathf.Max(radius - x - 0.5f, x + 0.5f - (size - radius)));
                    float dy = Mathf.Max(0, Mathf.Max(radius - y - 0.5f, y + 0.5f - (size - radius)));
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    float a = Mathf.Clamp01(radius - d + 0.5f);
                    t.SetPixel(x, y, new Color(1, 1, 1, a));
                }
            t.wrapMode = TextureWrapMode.Clamp; t.Apply();
            return Sprite.Create(t, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f, 0, SpriteMeshType.FullRect, new Vector4(radius, radius, radius, radius));
        }

        private static Sprite MakeCircle(int size, bool ringOnly)
        {
            var t = new Texture2D(size, size, TextureFormat.RGBA32, false);
            float r = size * 0.5f;
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float d = Mathf.Sqrt((x + 0.5f - r) * (x + 0.5f - r) + (y + 0.5f - r) * (y + 0.5f - r));
                    float a = Mathf.Clamp01(r - d);
                    if (ringOnly) a *= Mathf.Clamp01(d - (r - 10f));
                    t.SetPixel(x, y, new Color(1, 1, 1, a));
                }
            t.wrapMode = TextureWrapMode.Clamp; t.Apply();
            return Sprite.Create(t, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }

        // ------------------------------------------------------------------ Layout-Helfer
        public static RectTransform Rect(Transform parent, string name)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            go.layer = 5;
            return (RectTransform)go.transform;
        }

        /// <summary>Anker (0..1) und Pixel-Abstände setzen.</summary>
        public static RectTransform Anchor(this RectTransform rt, float x0, float y0, float x1, float y1, float l = 0, float b = 0, float r = 0, float t = 0)
        {
            rt.anchorMin = new Vector2(x0, y0); rt.anchorMax = new Vector2(x1, y1);
            rt.offsetMin = new Vector2(l, b); rt.offsetMax = new Vector2(-r, -t);
            return rt;
        }

        /// <summary>Feste Größe an einem Ankerpunkt.</summary>
        public static RectTransform Place(this RectTransform rt, float ax, float ay, float x, float y, float w, float h, float px = 0.5f, float py = 0.5f)
        {
            rt.anchorMin = rt.anchorMax = new Vector2(ax, ay);
            rt.pivot = new Vector2(px, py);
            rt.anchoredPosition = new Vector2(x, y);
            rt.sizeDelta = new Vector2(w, h);
            return rt;
        }

        public static RectTransform Fill(this RectTransform rt) { return rt.Anchor(0, 0, 1, 1); }

        // ------------------------------------------------------------------ Elemente
        public static Image Image(Transform parent, Color color, Sprite sprite = null, string name = "Image")
        {
            var rt = Rect(parent, name);
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = sprite;
            img.color = color;
            if (sprite != null && sprite.border != Vector4.zero) img.type = UnityEngine.UI.Image.Type.Sliced;
            img.raycastTarget = false;
            return img;
        }

        public static Image Panel(Transform parent, Color color, string name = "Panel")
        {
            var img = Image(parent, color, Rounded, name);
            img.raycastTarget = true;
            return img;
        }

        /// <summary>Panel mit dunklem Rand und hellerer Oberkante (Comic-Look).</summary>
        public static Image FancyPanel(Transform parent, Color color, string name = "Panel")
        {
            var outer = Image(parent, new Color(0.06f, 0.04f, 0.12f, 0.95f), Rounded, name);
            outer.raycastTarget = true;
            var inner = Image(outer.transform, color, Rounded, "Inner");
            inner.rectTransform.Fill().offsetMin = new Vector2(5, 7);
            inner.rectTransform.offsetMax = new Vector2(-5, -5);
            var shine = Image(inner.transform, new Color(1, 1, 1, 0.08f), Rounded, "Shine");
            shine.rectTransform.Anchor(0, 0.55f, 1, 1, 4, 0, 4, 4);
            return outer;
        }

        public static Text Label(Transform parent, string text, int size, Color color, TextAnchor anchor = TextAnchor.MiddleCenter, bool outline = true, string name = "Label")
        {
            var rt = Rect(parent, name);
            var t = rt.gameObject.AddComponent<Text>();
            t.font = Font;
            t.text = text;
            t.fontSize = size;
            t.fontStyle = FontStyle.Bold;
            t.color = color;
            t.alignment = anchor;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.raycastTarget = false;
            if (outline)
            {
                var o = rt.gameObject.AddComponent<Outline>();
                o.effectColor = new Color(0.05f, 0.03f, 0.1f, 1f);
                o.effectDistance = new Vector2(Mathf.Max(1.5f, size / 16f), -Mathf.Max(1.5f, size / 16f));
                var s = rt.gameObject.AddComponent<Shadow>();
                s.effectColor = new Color(0.05f, 0.03f, 0.1f, 0.9f);
                s.effectDistance = new Vector2(0, -Mathf.Max(2f, size / 9f));
            }
            return t;
        }

        public static Image IconImage(Transform parent, Icon icon, float size, string name = "Icon")
        {
            var img = Image(parent, Color.white, IconFactory.Get(icon), name);
            img.preserveAspect = true;
            img.rectTransform.sizeDelta = new Vector2(size, size);
            return img;
        }

        /// <summary>Dicker Comic-Button mit dunkler 3D-Kante, Drück-Animation und Klick-Sound.</summary>
        public static Button Button(Transform parent, string label, Color color, Action onClick, int fontSize = 40, Icon? icon = null, string name = "Button")
        {
            var rt = Rect(parent, name);
            var edge = rt.gameObject.AddComponent<Image>();
            edge.sprite = Rounded; edge.type = UnityEngine.UI.Image.Type.Sliced;
            edge.color = new Color(0.06f, 0.04f, 0.12f, 1f);

            var faceDark = Image(rt, Color.Lerp(color, Color.black, 0.35f), Rounded, "Bottom");
            faceDark.rectTransform.Fill().offsetMin = new Vector2(5, 5); faceDark.rectTransform.offsetMax = new Vector2(-5, -5);
            var face = Image(rt, color, Rounded, "Face");
            face.rectTransform.Fill().offsetMin = new Vector2(5, 13); face.rectTransform.offsetMax = new Vector2(-5, -5);
            var shine = Image(face.transform, new Color(1, 1, 1, 0.22f), Rounded, "Shine");
            shine.rectTransform.Anchor(0, 0.52f, 1, 1, 6, 0, 6, 4);

            var content = Rect(face.transform, "Content").Fill();
            if (icon.HasValue)
            {
                var ic = IconImage(content, icon.Value, fontSize * 1.4f);
                if (string.IsNullOrEmpty(label)) ic.rectTransform.Place(0.5f, 0.5f, 0, 0, fontSize * 1.5f, fontSize * 1.5f);
                else ic.rectTransform.Place(0f, 0.5f, 14, 0, fontSize * 1.3f, fontSize * 1.3f, 0f, 0.5f);
            }
            if (!string.IsNullOrEmpty(label))
            {
                var t = Label(content, label, fontSize, Color.white);
                t.rectTransform.Fill();
                if (icon.HasValue) t.rectTransform.offsetMin = new Vector2(fontSize * 1.3f + 10, 0);
                t.resizeTextForBestFit = true; t.resizeTextMinSize = 14; t.resizeTextMaxSize = fontSize;
            }

            var btn = rt.gameObject.AddComponent<Button>();
            btn.targetGraphic = face;
            var colors = btn.colors; colors.disabledColor = new Color(0.55f, 0.55f, 0.6f, 1f); colors.pressedColor = new Color(0.85f, 0.85f, 0.85f); btn.colors = colors;
            if (onClick != null) btn.onClick.AddListener(() => { AudioManager.UiClick(); onClick(); });
            rt.gameObject.AddComponent<ButtonPressFx>();
            return btn;
        }

        /// <summary>Schlichter runder Icon-Button (z.B. Zurück, Schließen).</summary>
        public static Button IconButton(Transform parent, Icon icon, Color color, Action onClick, float size = 100)
        {
            var b = Button(parent, "", color, onClick, Mathf.RoundToInt(size * 0.4f), icon, "IconButton");
            ((RectTransform)b.transform).sizeDelta = new Vector2(size, size);
            return b;
        }

        public static void SetButtonLabel(Button b, string text)
        {
            var t = b.GetComponentInChildren<Text>();
            if (t != null) t.text = text;
        }

        public static void SetButtonColor(Button b, Color c)
        {
            var face = b.transform.Find("Face");
            var bottom = b.transform.Find("Bottom");
            if (face != null) face.GetComponent<Image>().color = c;
            if (bottom != null) bottom.GetComponent<Image>().color = Color.Lerp(c, Color.black, 0.35f);
        }

        /// <summary>Fortschrittsbalken. Rückgabe: Füll-Image (fillAmount nutzen).</summary>
        public static Image Bar(Transform parent, Color fill, Color back, string name = "Bar")
        {
            var bg = Image(parent, back, RoundedSmall, name);
            var f = Image(bg.transform, fill, White, "Fill");
            f.rectTransform.Fill().offsetMin = new Vector2(3, 3); f.rectTransform.offsetMax = new Vector2(-3, -3);
            f.type = UnityEngine.UI.Image.Type.Filled;
            f.fillMethod = UnityEngine.UI.Image.FillMethod.Horizontal;
            f.fillAmount = 1f;
            return f;
        }

        public static Slider Slider(Transform parent, float min, float max, float value, Action<float> onChange, Color fillColor)
        {
            var rt = Rect(parent, "Slider");
            var bg = Image(rt, new Color(0, 0, 0, 0.5f), RoundedSmall, "Background");
            bg.rectTransform.Anchor(0, 0.3f, 1, 0.7f);
            var fillArea = Rect(rt, "FillArea").Anchor(0, 0.3f, 1, 0.7f, 6, 0, 6, 0);
            var fill = Image(fillArea, fillColor, RoundedSmall, "Fill");
            fill.rectTransform.Anchor(0, 0, 0, 1);
            var handleArea = Rect(rt, "HandleArea").Anchor(0, 0, 1, 1, 20, 0, 20, 0);
            var handle = Image(handleArea, Color.white, Circle, "Handle");
            handle.rectTransform.sizeDelta = new Vector2(48, 0);
            handle.rectTransform.anchorMin = new Vector2(0, 0); handle.rectTransform.anchorMax = new Vector2(0, 1);
            var s = rt.gameObject.AddComponent<Slider>();
            s.fillRect = fill.rectTransform; s.handleRect = handle.rectTransform; s.targetGraphic = handle;
            s.minValue = min; s.maxValue = max; s.value = value;
            handle.raycastTarget = true; bg.raycastTarget = true;
            if (onChange != null) s.onValueChanged.AddListener(v => onChange(v));
            return s;
        }

        public static Toggle Toggle(Transform parent, bool value, Action<bool> onChange)
        {
            var rt = Rect(parent, "Toggle");
            var bg = Image(rt, new Color(0, 0, 0, 0.55f), Rounded, "Background");
            bg.rectTransform.Fill(); bg.raycastTarget = true;
            var on = Image(bg.transform, Palette.Green, Rounded, "On");
            on.rectTransform.Fill().offsetMin = new Vector2(5, 5); on.rectTransform.offsetMax = new Vector2(-5, -5);
            var knob = Image(bg.transform, Color.white, Circle, "Knob");
            var t = rt.gameObject.AddComponent<Toggle>();
            t.targetGraphic = bg; t.graphic = on; t.isOn = value;
            Action<bool> layout = v =>
            {
                knob.rectTransform.anchorMin = knob.rectTransform.anchorMax = new Vector2(v ? 1 : 0, 0.5f);
                knob.rectTransform.pivot = new Vector2(v ? 1 : 0, 0.5f);
                knob.rectTransform.anchoredPosition = new Vector2(v ? -8 : 8, 0);
                knob.rectTransform.sizeDelta = new Vector2(52, 52);
            };
            layout(value);
            t.onValueChanged.AddListener(v => { layout(v); AudioManager.UiClick(); if (onChange != null) onChange(v); });
            return t;
        }

        public static InputField Input(Transform parent, string value, int maxChars, Action<string> onEnd)
        {
            var rt = Rect(parent, "Input");
            var bg = rt.gameObject.AddComponent<Image>();
            bg.sprite = Rounded; bg.type = UnityEngine.UI.Image.Type.Sliced; bg.color = new Color(1, 1, 1, 0.95f);
            var text = Label(rt, value, 40, new Color(0.15f, 0.1f, 0.25f), TextAnchor.MiddleLeft, false, "Text");
            text.rectTransform.Fill().offsetMin = new Vector2(24, 0); text.rectTransform.offsetMax = new Vector2(-24, 0);
            text.supportRichText = false;
            var f = rt.gameObject.AddComponent<InputField>();
            f.textComponent = text; f.text = value; f.characterLimit = maxChars;
            f.targetGraphic = bg;
            if (onEnd != null) f.onEndEdit.AddListener(v => onEnd(v));
            return f;
        }

        /// <summary>Scrollbare Liste. Rückgabe: Content-Transform (mit Layout-Gruppe).</summary>
        public static RectTransform ScrollList(Transform parent, bool horizontal, float spacing, int gridColumns = 0, Vector2 cellSize = default(Vector2))
        {
            var rt = Rect(parent, "Scroll");
            var viewport = Rect(rt, "Viewport").Fill();
            var mask = viewport.gameObject.AddComponent<RectMask2D>();
            mask.enabled = true;
            var hit = viewport.gameObject.AddComponent<Image>(); hit.color = new Color(0, 0, 0, 0.001f);
            var content = Rect(viewport, "Content");
            if (horizontal) { content.anchorMin = new Vector2(0, 0); content.anchorMax = new Vector2(0, 1); content.pivot = new Vector2(0, 0.5f); }
            else { content.anchorMin = new Vector2(0, 1); content.anchorMax = new Vector2(1, 1); content.pivot = new Vector2(0.5f, 1); }
            content.offsetMin = content.offsetMax = Vector2.zero;
            if (gridColumns > 0)
            {
                var g = content.gameObject.AddComponent<GridLayoutGroup>();
                g.cellSize = cellSize; g.spacing = new Vector2(spacing, spacing);
                g.constraint = horizontal ? GridLayoutGroup.Constraint.FixedRowCount : GridLayoutGroup.Constraint.FixedColumnCount;
                g.constraintCount = gridColumns;
                g.childAlignment = TextAnchor.UpperCenter;
                g.padding = new RectOffset(12, 12, 12, 24);
            }
            else if (horizontal)
            {
                var h = content.gameObject.AddComponent<HorizontalLayoutGroup>();
                h.spacing = spacing; h.childForceExpandWidth = false; h.childForceExpandHeight = true; h.childControlWidth = false; h.childControlHeight = true;
                h.padding = new RectOffset(16, 16, 8, 8);
            }
            else
            {
                var v = content.gameObject.AddComponent<VerticalLayoutGroup>();
                v.spacing = spacing; v.childForceExpandHeight = false; v.childForceExpandWidth = true; v.childControlHeight = false; v.childControlWidth = true;
                v.padding = new RectOffset(12, 12, 12, 24);
            }
            var fitter = content.gameObject.AddComponent<ContentSizeFitter>();
            if (horizontal) fitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
            else fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            var sr = rt.gameObject.AddComponent<ScrollRect>();
            sr.viewport = viewport; sr.content = content;
            sr.horizontal = horizontal; sr.vertical = !horizontal;
            sr.movementType = ScrollRect.MovementType.Elastic;
            sr.scrollSensitivity = 30f;
            return content;
        }

        /// <summary>Element in einer Layout-Liste mit fester Höhe/Breite.</summary>
        public static LayoutElement Layout(GameObject go, float prefW, float prefH)
        {
            var le = go.GetComponent<LayoutElement>() ?? go.AddComponent<LayoutElement>();
            if (prefW > 0) { le.preferredWidth = prefW; le.minWidth = prefW; }
            if (prefH > 0) { le.preferredHeight = prefH; le.minHeight = prefH; }
            return le;
        }

        /// <summary>Währungsanzeige (Icon + Zahl) in einer Kapsel.</summary>
        public static Text CurrencyPill(Transform parent, Icon icon, string value, out RectTransform rt)
        {
            var bg = Image(parent, new Color(0, 0, 0, 0.55f), Rounded, "Pill");
            rt = bg.rectTransform;
            var ic = IconImage(bg.transform, icon, 72);
            ic.rectTransform.Place(0, 0.5f, -10, 0, 76, 76, 0, 0.5f);
            var t = Label(bg.transform, value, 38, Color.white, TextAnchor.MiddleCenter);
            t.rectTransform.Fill().offsetMin = new Vector2(60, 0); t.rectTransform.offsetMax = new Vector2(-12, 0);
            return t;
        }

        /// <summary>Hintergrund mit Farbverlauf und diagonalen Streifen (Brawler-, Shop-Menüs).</summary>
        public static void Backdrop(Transform parent, Color top, Color bottom)
        {
            var b = Image(parent, bottom, White, "Backdrop");
            b.rectTransform.Fill();
            b.raycastTarget = true;
            var g = Image(b.transform, top, Gradient, "Gradient");
            g.rectTransform.Fill();
            var s = Image(b.transform, Color.white, Stripes, "Stripes");
            s.type = UnityEngine.UI.Image.Type.Tiled;
            s.rectTransform.Fill();
        }
    }

    /// <summary>Kleiner „Drück“-Effekt für Buttons.</summary>
    public class ButtonPressFx : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
    {
        private float target = 1f, current = 1f;
        public void OnPointerDown(PointerEventData e) { var b = GetComponent<Button>(); if (b == null || b.interactable) target = 0.92f; }
        public void OnPointerUp(PointerEventData e) { target = 1f; }
        public void OnPointerExit(PointerEventData e) { target = 1f; }
        private void Update()
        {
            if (Mathf.Abs(current - target) < 0.001f) return;
            current = Mathf.MoveTowards(current, target, Time.unscaledDeltaTime * 3f);
            transform.localScale = Vector3.one * current;
        }
    }

    /// <summary>Lässt ein Element sanft pulsieren (z.B. Spielen-Button, Benachrichtigung).</summary>
    public class Pulse : MonoBehaviour
    {
        public float amount = 0.05f, speed = 3f;
        private void Update() { transform.localScale = Vector3.one * (1f + Mathf.Sin(Time.unscaledTime * speed) * amount); }
    }

    /// <summary>Lässt ein Element rotieren (Lade-Symbole, Strahlen).</summary>
    public class Spin : MonoBehaviour
    {
        public float speed = 90f;
        private void Update() { transform.Rotate(0, 0, -speed * Time.unscaledDeltaTime); }
    }
}
