// ---------------------------------------------------------------------------------------------
// UIManager – Canvas, EventSystem, Bildschirm-Stapel (Navigation mit Zurück), Popups,
// Hinweis-Meldungen (Toasts) und Übergangs-Animationen. Android-Zurück-Taste wird unterstützt.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using BrawlArena.Audio;
using BrawlArena.Data;
using BrawlArena.Save;

namespace BrawlArena.UI
{
    /// <summary>Basisklasse aller Bildschirme. Build() erzeugt den Inhalt jedes Mal neu.</summary>
    public abstract class UIScreen : MonoBehaviour
    {
        public RectTransform Root { get; private set; }
        /// <summary>Soll die 3D-Menübühne (Brawler auf dem Podest) sichtbar sein?</summary>
        public virtual bool ShowMenuStage { get { return false; } }

        public void Init(RectTransform root) { Root = root; Build(); }
        protected abstract void Build();
        public virtual void OnBack() { UIManager.Instance.Back(); }
        public virtual void Refresh()
        {
            for (int i = Root.childCount - 1; i >= 0; i--) Destroy(Root.GetChild(i).gameObject);
            Build();
        }
    }

    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }
        public Canvas Canvas { get; private set; }
        public RectTransform ScreenRoot { get; private set; }
        public RectTransform PopupRoot { get; private set; }
        public RectTransform HudRoot { get; private set; }
        private RectTransform toastRoot;
        private readonly List<UIScreen> stack = new List<UIScreen>();
        private readonly List<GameObject> popups = new List<GameObject>();
        private Text fpsText;
        private float fpsTimer; private int fpsFrames;
        public event Action<UIScreen> ScreenChanged;

        public UIScreen Current { get { return stack.Count > 0 ? stack[stack.Count - 1] : null; } }

        public static UIManager Create(Transform parent)
        {
            var go = new GameObject("UI");
            go.transform.SetParent(parent, false);
            Instance = go.AddComponent<UIManager>();
            Instance.Setup();
            return Instance;
        }

        private void Setup()
        {
            Canvas = gameObject.AddComponent<Canvas>();
            Canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            Canvas.sortingOrder = 10;
            var scaler = gameObject.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.75f;
            gameObject.AddComponent<GraphicRaycaster>();

            if (FindObjectOfType<EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                es.transform.SetParent(transform.parent, false);
                es.AddComponent<EventSystem>();
                es.AddComponent<StandaloneInputModule>();
            }

            var safe = UIFactory.Rect(transform, "SafeArea").Fill();
            safe.gameObject.AddComponent<SafeArea>();
            HudRoot = UIFactory.Rect(safe, "HUD").Fill();
            ScreenRoot = UIFactory.Rect(safe, "Screens").Fill();
            PopupRoot = UIFactory.Rect(transform, "Popups").Fill();
            toastRoot = UIFactory.Rect(transform, "Toasts").Fill();
            fpsText = UIFactory.Label(transform, "", 26, Palette.Yellow, TextAnchor.UpperLeft);
            fpsText.rectTransform.Place(0, 1, 12, -8, 200, 40, 0, 1);
        }

        // ------------------------------------------------------------------ Navigation
        /// <summary>Ersetzt den gesamten Stapel durch einen neuen Bildschirm.</summary>
        public T SetRoot<T>() where T : UIScreen
        {
            foreach (var s in stack) if (s != null) Destroy(s.gameObject);
            stack.Clear();
            return Push<T>();
        }

        /// <summary>Öffnet einen Bildschirm über dem aktuellen (Zurück kehrt zurück).</summary>
        public T Push<T>(Action<T> configure = null) where T : UIScreen
        {
            if (Current != null) Current.gameObject.SetActive(false);
            var rt = UIFactory.Rect(ScreenRoot, typeof(T).Name).Fill();
            var screen = rt.gameObject.AddComponent<T>();
            if (configure != null) configure(screen);
            screen.Init(rt);
            stack.Add(screen);
            rt.gameObject.AddComponent<ScreenTransition>();
            if (ScreenChanged != null) ScreenChanged(screen);
            return screen;
        }

        public void Back()
        {
            if (stack.Count <= 1) return;
            var top = stack[stack.Count - 1];
            stack.RemoveAt(stack.Count - 1);
            Destroy(top.gameObject);
            var cur = Current;
            if (cur != null)
            {
                cur.gameObject.SetActive(true);
                cur.Refresh();
                cur.gameObject.AddComponent<ScreenTransition>();
            }
            if (ScreenChanged != null) ScreenChanged(cur);
        }

        public void ClearScreens()
        {
            foreach (var s in stack) if (s != null) Destroy(s.gameObject);
            stack.Clear();
            if (ScreenChanged != null) ScreenChanged(null);
        }

        public void RefreshCurrent() { if (Current != null) Current.Refresh(); }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                if (popups.Count > 0) ClosePopup(popups[popups.Count - 1]);
                else if (Current != null) Current.OnBack();
            }
            var settings = SaveSystem.Profile != null ? SaveSystem.Profile.settings : null;
            if (settings != null && settings.showFps)
            {
                fpsFrames++; fpsTimer += Time.unscaledDeltaTime;
                if (fpsTimer >= 0.5f) { fpsText.text = Mathf.RoundToInt(fpsFrames / fpsTimer) + " FPS"; fpsFrames = 0; fpsTimer = 0f; }
            }
            else if (fpsText.text.Length > 0) fpsText.text = "";
        }

        // ------------------------------------------------------------------ Popups
        /// <summary>Erzeugt ein modales Popup mit abgedunkeltem Hintergrund. Rückgabe: Inhaltsfläche.</summary>
        public RectTransform OpenPopup(string title, float width, float height, out GameObject popup, bool closable = true)
        {
            var blocker = UIFactory.Image(PopupRoot, new Color(0, 0, 0, 0.65f), UIFactory.White, "Popup");
            blocker.rectTransform.Fill();
            blocker.raycastTarget = true;
            popup = blocker.gameObject;
            var panel = UIFactory.FancyPanel(blocker.transform, Palette.Panel);
            panel.rectTransform.Place(0.5f, 0.5f, 0, 0, width, height);
            panel.gameObject.AddComponent<PopIn>();
            var titleBar = UIFactory.Image(panel.transform, Palette.Blue, UIFactory.Rounded, "TitleBar");
            titleBar.rectTransform.Anchor(0, 1, 1, 1, 14, -96, 14, 14);
            var t = UIFactory.Label(titleBar.transform, title, 48, Color.white);
            t.rectTransform.Fill();
            var go = popup;
            if (closable)
            {
                var close = UIFactory.IconButton(panel.transform, Icon.Close, Palette.Red, () => ClosePopup(go), 90);
                ((RectTransform)close.transform).Place(1, 1, 20, 20, 90, 90, 1, 1);
            }
            var content = UIFactory.Rect(panel.transform, "Content").Anchor(0, 0, 1, 1, 30, 30, 30, 120);
            popups.Add(popup);
            return content;
        }

        public void ClosePopup(GameObject popup)
        {
            popups.Remove(popup);
            if (popup != null) Destroy(popup);
        }

        public void CloseAllPopups()
        {
            foreach (var p in popups) if (p != null) Destroy(p);
            popups.Clear();
        }

        public bool HasPopup { get { return popups.Count > 0; } }

        /// <summary>Ja/Nein-Abfrage.</summary>
        public void Confirm(string title, string message, string yes, Action onYes, Color? yesColor = null)
        {
            GameObject popup;
            var c = OpenPopup(title, 1000, 560, out popup);
            var t = UIFactory.Label(c, message, 38, Color.white);
            t.rectTransform.Anchor(0, 0.35f, 1, 1);
            var no = UIFactory.Button(c, "Abbrechen", Palette.Gray, () => ClosePopup(popup));
            ((RectTransform)no.transform).Place(0.27f, 0, 0, 10, 380, 120, 0.5f, 0);
            var ok = UIFactory.Button(c, yes, yesColor ?? Palette.Green, () => { ClosePopup(popup); if (onYes != null) onYes(); });
            ((RectTransform)ok.transform).Place(0.73f, 0, 0, 10, 380, 120, 0.5f, 0);
        }

        /// <summary>Einfache Meldung mit OK.</summary>
        public void Message(string title, string message)
        {
            GameObject popup;
            var c = OpenPopup(title, 1000, 520, out popup);
            var t = UIFactory.Label(c, message, 38, Color.white);
            t.rectTransform.Anchor(0, 0.3f, 1, 1);
            var ok = UIFactory.Button(c, "OK", Palette.Green, () => ClosePopup(popup));
            ((RectTransform)ok.transform).Place(0.5f, 0, 0, 10, 380, 120, 0.5f, 0);
        }

        /// <summary>Belohnungs-Popup (z.B. nach Box-Öffnung) – zeigt Belohnungen nacheinander animiert.</summary>
        public void ShowRewards(string title, List<Reward> rewards, Action onClose = null)
        {
            if (rewards == null || rewards.Count == 0) { if (onClose != null) onClose(); return; }
            GameObject popup;
            var c = OpenPopup(title, 1200, 820, out popup, false);
            AudioManager.Sfx(SfxPreset.BoxOpen);
            var rays = UIFactory.Image(c, new Color(1f, 0.9f, 0.4f, 0.15f), IconFactory.Get(Icon.Star), "Rays");
            rays.rectTransform.Place(0.5f, 0.62f, 0, 0, 520, 520);
            rays.gameObject.AddComponent<Spin>().speed = 25f;
            var list = UIFactory.ScrollList(c, false, 14);
            ((RectTransform)list.parent.parent).Anchor(0.05f, 0.18f, 0.95f, 1f);
            for (int i = 0; i < rewards.Count; i++)
            {
                var r = rewards[i];
                var row = UIFactory.FancyPanel(list, Palette.PanelLight, "Reward");
                UIFactory.Layout(row.gameObject, 0, 110);
                var ic = UIFactory.IconImage(row.transform, RewardIcon(r), 86);
                ic.rectTransform.Place(0, 0.5f, 26, 0, 86, 86, 0, 0.5f);
                var t = UIFactory.Label(row.transform, r.label, 40, RewardColor(r), TextAnchor.MiddleLeft);
                t.rectTransform.Fill().offsetMin = new Vector2(140, 0);
                var pop = row.gameObject.AddComponent<PopIn>();
                pop.delay = 0.15f + i * 0.22f;
                if (r.type == RewardType.Brawler) row.gameObject.AddComponent<Pulse>().amount = 0.03f;
            }
            var ok = UIFactory.Button(c, "Super!", Palette.Green, () => { ClosePopup(popup); if (onClose != null) onClose(); });
            ((RectTransform)ok.transform).Place(0.5f, 0, 0, 0, 420, 120, 0.5f, 0);
            SaveSystem.NotifyChanged();
        }

        public static Icon RewardIcon(Reward r)
        {
            switch (r.type)
            {
                case RewardType.Coins: return Icon.Coin;
                case RewardType.Gems: return Icon.Gem;
                case RewardType.PowerPoints: return Icon.PowerPoint;
                case RewardType.Brawler: return Icon.Star;
                case RewardType.Box: return Icon.Box;
                case RewardType.Tokens: return Icon.Token;
                case RewardType.Skin: return Icon.Crown;
            }
            return Icon.Gift;
        }

        public static Color RewardColor(Reward r)
        {
            switch (r.type)
            {
                case RewardType.Coins: return Palette.Yellow;
                case RewardType.Gems: return Palette.Green;
                case RewardType.PowerPoints: return new Color(0.9f, 0.6f, 1f);
                case RewardType.Brawler: return new Color(1f, 0.9f, 0.4f);
            }
            return Color.white;
        }

        // ------------------------------------------------------------------ Toasts
        public void Toast(string message, Color? color = null)
        {
            var bg = UIFactory.Image(toastRoot, new Color(0.08f, 0.06f, 0.15f, 0.92f), UIFactory.Rounded, "Toast");
            bg.rectTransform.Place(0.5f, 1f, 0, -150, 1100, 100, 0.5f, 1f);
            var t = UIFactory.Label(bg.transform, message, 36, color ?? Color.white);
            t.rectTransform.Fill().offsetMin = new Vector2(20, 0); t.rectTransform.offsetMax = new Vector2(-20, 0);
            bg.gameObject.AddComponent<ToastFade>();
        }
    }

    // ================================================================== kleine UI-Komponenten
    /// <summary>Passt die UI an Notch/abgerundete Displays an.</summary>
    public class SafeArea : MonoBehaviour
    {
        private Rect last;
        private void Update()
        {
            var sa = Screen.safeArea;
            if (sa == last || Screen.width <= 0 || Screen.height <= 0) return;
            last = sa;
            var rt = (RectTransform)transform;
            rt.anchorMin = new Vector2(sa.xMin / Screen.width, sa.yMin / Screen.height);
            rt.anchorMax = new Vector2(sa.xMax / Screen.width, sa.yMax / Screen.height);
            rt.offsetMin = rt.offsetMax = Vector2.zero;
        }
    }

    public class ScreenTransition : MonoBehaviour
    {
        private float t;
        private CanvasGroup cg;
        private void Awake() { cg = gameObject.GetComponent<CanvasGroup>() ?? gameObject.AddComponent<CanvasGroup>(); cg.alpha = 0f; }
        private void Update()
        {
            t += Time.unscaledDeltaTime / 0.18f;
            cg.alpha = Mathf.Clamp01(t);
            transform.localScale = Vector3.one * Mathf.Lerp(1.04f, 1f, Mathf.Clamp01(t));
            if (t >= 1f) { cg.alpha = 1f; transform.localScale = Vector3.one; Destroy(this); }
        }
    }

    public class PopIn : MonoBehaviour
    {
        public float delay;
        private float t;
        private void Awake() { transform.localScale = Vector3.zero; }
        private void Update()
        {
            if (delay > 0f) { delay -= Time.unscaledDeltaTime; return; }
            t += Time.unscaledDeltaTime / 0.25f;
            float k = Mathf.Clamp01(t);
            float s = 1f + Mathf.Sin(k * Mathf.PI) * 0.12f;
            transform.localScale = Vector3.one * Mathf.Lerp(0f, 1f, k * (2f - k)) * s;
            if (k >= 1f) { transform.localScale = Vector3.one; enabled = false; }
        }
    }

    public class ToastFade : MonoBehaviour
    {
        private float t;
        private CanvasGroup cg;
        private void Awake() { cg = gameObject.AddComponent<CanvasGroup>(); cg.blocksRaycasts = false; }
        private void Update()
        {
            t += Time.unscaledDeltaTime;
            cg.alpha = t < 0.2f ? t / 0.2f : (t > 2.2f ? 1f - (t - 2.2f) / 0.4f : 1f);
            ((RectTransform)transform).anchoredPosition = new Vector2(0, -150 + Mathf.Min(t, 0.2f) * 100f);
            if (t > 2.6f) Destroy(gameObject);
        }
    }
}
