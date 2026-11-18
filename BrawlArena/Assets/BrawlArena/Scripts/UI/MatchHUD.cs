// ---------------------------------------------------------------------------------------------
// MatchHUD – die komplette Kampfoberfläche:
//  Joysticks (Bewegen / Angriff / Super), Zielanzeige, Lebensbalken + Namen + Munition über
//  den Figuren, Schadenszahlen, Punktestand & Zeit, Super-Aufladung, Evolutionsanzeige,
//  Kill-Feed, Ansagen (3-2-1, Tor!, Sieg), Respawn-Countdown und Pausenmenü.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using BrawlArena.Audio;
using BrawlArena.Controls;
using BrawlArena.Core;
using BrawlArena.Data;
using BrawlArena.Gameplay;
using BrawlArena.Modes;
using BrawlArena.Save;

namespace BrawlArena.UI
{
    public class MatchHUD : MonoBehaviour
    {
        private static MatchHUD current;
        private MatchContext ctx;
        private RectTransform root, worldLayer, numberLayer;
        private VirtualJoystick moveStick, attackStick, superStick;
        private AimIndicator aim;
        private Image superFill, superFace, superGlow, attackFace;
        private Text leftScore, rightScore, timeText, infoText, announceTitle, announceSub, respawnText, evoText;
        private Image leftBar, rightBar, evoBar;
        private RectTransform scorePanel, evoPanel, killFeed;
        private float announceT = 99f;
        private readonly Dictionary<Brawler, BarWidget> bars = new Dictionary<Brawler, BarWidget>();
        private readonly Dictionary<IHealthBarTarget, Image> objectBars = new Dictionary<IHealthBarTarget, Image>();
        private readonly List<DamageNumber> numbers = new List<DamageNumber>();
        private readonly List<KeyValuePair<Text, float>> feed = new List<KeyValuePair<Text, float>>();
        private readonly List<Brawler> removeBuffer = new List<Brawler>();
        private readonly List<IHealthBarTarget> deadBuffer = new List<IHealthBarTarget>();
        private GameObject pausePopup;
        private bool paused;
        private bool wasSuperReady;

        private class BarWidget
        {
            public RectTransform root;
            public Image fill, back;
            public Text name, hp, extra;
            public Image extraIcon;
            public Image[] ammo;
            public Image superIcon;
        }

        private class DamageNumber
        {
            public Text text; public Vector3 world; public float t; public bool big;
        }

        public static MatchHUD Create(RectTransform parent)
        {
            DestroyCurrent();
            var rt = UIFactory.Rect(parent, "MatchHUD").Fill();
            current = rt.gameObject.AddComponent<MatchHUD>();
            current.root = rt;
            current.Build();
            return current;
        }

        public static void DestroyCurrent()
        {
            if (current != null) Destroy(current.gameObject);
            current = null;
        }

        // ================================================================== Aufbau
        private void Build()
        {
            worldLayer = UIFactory.Rect(root, "WorldBars").Fill();
            numberLayer = UIFactory.Rect(root, "Numbers").Fill();
            var s = SaveSystem.Profile.settings;
            float js = s.joystickSize;

            // ---- Bewegungs-Joystick (linke Bildschirmhälfte)
            var moveZone = UIFactory.Image(root, new Color(0, 0, 0, 0.001f), UIFactory.White, "MoveZone");
            moveZone.rectTransform.Anchor(0, 0, 0.45f, 0.78f);
            moveZone.raycastTarget = true;
            moveStick = MakeStick(moveZone.rectTransform, new Vector2(300, 270), 135 * js, new Color(1, 1, 1, 0.18f), new Color(1, 1, 1, 0.7f), null);
            moveStick.Floating = s.floatingJoystick;

            // ---- Angriffs-Joystick
            var atkZone = UIFactory.Image(root, new Color(0, 0, 0, 0.001f), UIFactory.Circle, "AttackZone");
            atkZone.rectTransform.Place(1, 0, -110, 90, 420 * js, 420 * js, 1, 0);
            atkZone.raycastTarget = true;
            attackStick = MakeStick(atkZone.rectTransform, Vector2.zero, 120 * js, new Color(1f, 0.45f, 0.25f, 0.45f), new Color(1f, 0.55f, 0.3f, 1f), Icon.Sword);
            attackStick.IsAttackStick = true;
            attackStick.Floating = false;
            attackFace = attackStick.Knob.GetComponent<Image>();
            ((RectTransform)attackStick.Base).anchorMin = ((RectTransform)attackStick.Base).anchorMax = new Vector2(0.5f, 0.5f);
            ((RectTransform)attackStick.Base).anchoredPosition = Vector2.zero;

            // ---- Super-Joystick
            var supZone = UIFactory.Image(root, new Color(0, 0, 0, 0.001f), UIFactory.Circle, "SuperZone");
            supZone.rectTransform.Place(1, 0, -520 * js, 70, 280 * js, 280 * js, 1, 0);
            supZone.raycastTarget = true;
            superStick = MakeStick(supZone.rectTransform, Vector2.zero, 95 * js, new Color(0.3f, 0.3f, 0.35f, 0.6f), new Color(1f, 0.85f, 0.2f, 1f), Icon.Bolt);
            superStick.IsAttackStick = true;
            superStick.Floating = false;
            ((RectTransform)superStick.Base).anchorMin = ((RectTransform)superStick.Base).anchorMax = new Vector2(0.5f, 0.5f);
            ((RectTransform)superStick.Base).anchoredPosition = Vector2.zero;
            superFace = superStick.Knob.GetComponent<Image>();
            superFill = UIFactory.Image(superStick.Base, new Color(1f, 0.85f, 0.2f, 0.9f), UIFactory.Ring, "Charge");
            superFill.rectTransform.Fill().offsetMin = new Vector2(-14, -14); superFill.rectTransform.offsetMax = new Vector2(14, 14);
            superFill.type = Image.Type.Filled; superFill.fillMethod = Image.FillMethod.Radial360; superFill.fillOrigin = 2; superFill.fillClockwise = false;
            superGlow = UIFactory.Image(superStick.Base, new Color(1f, 0.9f, 0.3f, 0.35f), UIFactory.Circle, "Glow");
            superGlow.rectTransform.Fill().offsetMin = new Vector2(-40, -40); superGlow.rectTransform.offsetMax = new Vector2(40, 40);
            superGlow.transform.SetAsFirstSibling();
            superGlow.gameObject.AddComponent<Pulse>().amount = 0.08f;

            // ---- Evolutionsanzeige
            evoPanel = UIFactory.Image(root, new Color(0, 0, 0, 0.55f), UIFactory.Rounded, "Evolution").rectTransform;
            evoPanel.Place(1, 0, -520 * js - 140 * js, 330 * js + 30, 420, 86, 0.5f, 0);
            evoText = UIFactory.Label(evoPanel, "", 24, new Color(0.85f, 0.7f, 1f));
            evoText.rectTransform.Anchor(0, 0.45f, 1, 1, 10, 0, 10, 4);
            evoBar = UIFactory.Bar(evoPanel, new Color(0.7f, 0.4f, 1f), new Color(0, 0, 0, 0.5f));
            ((RectTransform)evoBar.transform.parent).Anchor(0, 0, 1, 0, 16, 10, 16, -36);
            evoPanel.gameObject.SetActive(false);

            // ---- Punkteanzeige oben
            scorePanel = UIFactory.FancyPanel(root, new Color(0.12f, 0.1f, 0.25f, 0.9f), "Score").rectTransform;
            scorePanel.Place(0.5f, 1, 0, -10, 640, 150, 0.5f, 1);
            leftScore = UIFactory.Label(scorePanel, "0", 64, TeamUtil.Blue);
            leftScore.rectTransform.Anchor(0, 0.3f, 0.28f, 1);
            rightScore = UIFactory.Label(scorePanel, "0", 64, TeamUtil.Red);
            rightScore.rectTransform.Anchor(0.72f, 0.3f, 1, 1);
            timeText = UIFactory.Label(scorePanel, "", 46, Color.white);
            timeText.rectTransform.Anchor(0.25f, 0.35f, 0.75f, 1);
            leftBar = UIFactory.Bar(scorePanel, TeamUtil.Blue, new Color(0, 0, 0, 0.5f));
            ((RectTransform)leftBar.transform.parent).Anchor(0.04f, 0.1f, 0.48f, 0.28f);
            rightBar = UIFactory.Bar(scorePanel, TeamUtil.Red, new Color(0, 0, 0, 0.5f));
            ((RectTransform)rightBar.transform.parent).Anchor(0.52f, 0.1f, 0.96f, 0.28f);
            rightBar.fillOrigin = 1;
            infoText = UIFactory.Label(root, "", 30, Color.white);
            infoText.rectTransform.Place(0.5f, 1, 0, -165, 1000, 50, 0.5f, 1);

            // ---- Pause
            var pause = UIFactory.IconButton(root, Icon.Close, new Color(0.3f, 0.3f, 0.4f), OpenPause, 90);
            ((RectTransform)pause.transform).Place(0, 1, 20, -20, 90, 90, 0, 1);

            // ---- Kill-Feed
            killFeed = UIFactory.Rect(root, "KillFeed");
            killFeed.Place(1, 1, -20, -20, 560, 300, 1, 1);

            // ---- Ansagen & Respawn
            announceTitle = UIFactory.Label(root, "", 120, Color.white);
            announceTitle.rectTransform.Place(0.5f, 0.62f, 0, 0, 1600, 170);
            announceSub = UIFactory.Label(root, "", 44, Palette.Yellow);
            announceSub.rectTransform.Place(0.5f, 0.52f, 0, 0, 1600, 80);
            respawnText = UIFactory.Label(root, "", 60, Color.white);
            respawnText.rectTransform.Place(0.5f, 0.38f, 0, 0, 1400, 100);

            FX.DamageNumber += OnDamageNumber;
        }

        private VirtualJoystick MakeStick(RectTransform zone, Vector2 pos, float radius, Color baseColor, Color knobColor, Icon? icon)
        {
            var baseImg = UIFactory.Image(zone, baseColor, UIFactory.Circle, "Base");
            baseImg.rectTransform.Place(0, 0, pos.x, pos.y, radius * 2.2f, radius * 2.2f);
            var ring = UIFactory.Image(baseImg.transform, new Color(1, 1, 1, 0.5f), UIFactory.Ring, "Ring");
            ring.rectTransform.Fill();
            var knob = UIFactory.Image(baseImg.transform, knobColor, UIFactory.Circle, "Knob");
            knob.rectTransform.Place(0.5f, 0.5f, 0, 0, radius * 1.1f, radius * 1.1f);
            if (icon.HasValue)
            {
                var ic = UIFactory.IconImage(knob.transform, icon.Value, radius * 0.75f);
                ic.rectTransform.Place(0.5f, 0.5f, 0, 0, radius * 0.75f, radius * 0.75f);
            }
            var stick = zone.gameObject.AddComponent<VirtualJoystick>();
            stick.Base = baseImg.rectTransform;
            stick.Knob = knob.rectTransform;
            stick.Radius = radius;
            return stick;
        }

        public void Bind(MatchContext context)
        {
            ctx = context;
            ctx.LocalInputSource = new PlayerInputSource(moveStick, attackStick, superStick);
            if (ctx.LocalPlayer != null) ctx.LocalPlayer.InputSource = ctx.LocalInputSource;
            ctx.Announcement += OnAnnounce;
            ctx.KillFeedAdded += OnKill;
            aim = AimIndicator.Create(ctx.transform);
            var lp = ctx.LocalPlayer;
            if (lp != null) lp.Evolved += b => OnAnnounce(b.FormName.ToUpper(), "Neue Kombo freigeschaltet!");
        }

        private void OnDestroy()
        {
            FX.DamageNumber -= OnDamageNumber;
            if (ctx != null) { ctx.Announcement -= OnAnnounce; ctx.KillFeedAdded -= OnKill; }
            if (pausePopup != null) UIManager.Instance.ClosePopup(pausePopup);
            Time.timeScale = 1f;
        }

        // ================================================================== Update
        private void LateUpdate()
        {
            if (ctx == null) return;
            var lp = ctx.LocalPlayer;
            var info = ctx.Mode.GetHudInfo();

            // Punkte & Zeit
            leftScore.gameObject.SetActive(info.showTeams); rightScore.gameObject.SetActive(info.showTeams);
            leftScore.text = info.leftValue; rightScore.text = info.rightValue;
            timeText.text = info.centerTop;
            if (!info.showTeams) timeText.rectTransform.Anchor(0, 0.3f, 1, 1); else timeText.rectTransform.Anchor(0.25f, 0.35f, 0.75f, 1);
            leftBar.transform.parent.gameObject.SetActive(info.leftProgress >= 0f);
            rightBar.transform.parent.gameObject.SetActive(info.rightProgress >= 0f);
            leftBar.fillAmount = Mathf.Clamp01(info.leftProgress); rightBar.fillAmount = Mathf.Clamp01(info.rightProgress);
            infoText.text = info.centerBottom;

            // Steuerung
            bool alive = lp != null && lp.IsAlive && !ctx.InputLocked;
            if (lp != null)
            {
                superFill.fillAmount = lp.SuperCharge;
                bool ready = lp.SuperReady;
                superFace.color = ready ? new Color(1f, 0.85f, 0.2f) : new Color(0.55f, 0.55f, 0.6f);
                superGlow.enabled = ready;
                if (ready && !wasSuperReady) superStick.Base.gameObject.AddComponent<PopIn>();
                wasSuperReady = ready;
                attackFace.color = lp.Ammo >= 1f ? new Color(1f, 0.55f, 0.3f) : new Color(0.55f, 0.4f, 0.35f);

                // Zielanzeige
                if (alive && attackStick.IsAiming) aim.Show(lp, lp.MainAttack, attackStick.Value, false);
                else if (alive && superStick.IsAiming && ready) aim.Show(lp, lp.SuperAttack, superStick.Value, true);
                else if (alive && (Input.GetMouseButton(0) || Input.GetMouseButton(1)) && lp.LastInput.aiming && Input.touchCount == 0)
                    aim.Show(lp, Input.GetMouseButton(1) ? lp.SuperAttack : lp.MainAttack, lp.LastInput.aimingDir, Input.GetMouseButton(1));
                else aim.Hide();

                // Evolution
                float evo = lp.EvolutionProgress;
                bool hasForms = lp.Def.forms != null && lp.Def.forms.Count > 0;
                evoPanel.gameObject.SetActive(hasForms);
                if (hasForms)
                {
                    evoText.text = lp.FormName + (evo >= 0f ? "" : "  (MAX)");
                    evoBar.fillAmount = evo >= 0f ? evo : 1f;
                }

                // Respawn
                float rem = ctx.Mode.GetRespawnRemaining(lp);
                respawnText.text = !lp.IsAlive && rem >= 0f ? "Wiedereinstieg in " + Mathf.CeilToInt(rem) : "";
            }

            UpdateBars();
            UpdateObjectBars();
            UpdateNumbers();
            UpdateAnnouncement();
            UpdateFeed();
        }

        // ================================================================== Lebensbalken
        private void UpdateBars()
        {
            var cam = ctx.Camera != null ? ctx.Camera.Cam : null;
            if (cam == null) return;
            int lt = ctx.LocalTeam;
            foreach (var b in ctx.Brawlers)
            {
                BarWidget w;
                if (!bars.TryGetValue(b, out w)) { w = CreateBar(b); bars[b] = w; }
                bool show = b.IsAlive && b.IsVisibleTo(lt);
                Vector3 sp = cam.WorldToScreenPoint(b.Position + Vector3.up * (b.VisualHeight + 0.25f));
                if (sp.z < 0) show = false;
                w.root.gameObject.SetActive(show);
                if (!show) continue;
                Vector2 local;
                RectTransformUtility.ScreenPointToLocalPointInRectangle(worldLayer, sp, null, out local);
                w.root.anchoredPosition = local;
                w.fill.fillAmount = b.Health / b.MaxHealth;
                w.hp.text = Mathf.CeilToInt(b.Health).ToString();
                // Getragene Edelsteine bzw. Power-Würfel über dem Kopf
                int count = b.Gems > 0 ? b.Gems : b.PowerCubes;
                w.extra.text = count > 0 ? count.ToString() : "";
                w.extraIcon.enabled = count > 0;
                if (count > 0) w.extraIcon.sprite = IconFactory.Get(b.Gems > 0 ? Icon.Gem : Icon.PowerPoint);
                if (w.ammo != null)
                {
                    for (int i = 0; i < w.ammo.Length; i++)
                    {
                        float a = Mathf.Clamp01(b.Ammo - i);
                        w.ammo[i].fillAmount = a;
                        w.ammo[i].color = a >= 1f ? new Color(1f, 0.6f, 0.2f) : new Color(1f, 0.6f, 0.2f, 0.55f);
                    }
                }
                if (w.superIcon != null) w.superIcon.enabled = b.SuperReady;
            }
            // Entfernte Brawler aufräumen
            removeBuffer.Clear();
            foreach (var kv in bars) if (kv.Key == null) removeBuffer.Add(kv.Key);
            foreach (var k in removeBuffer) { Destroy(bars[k].root.gameObject); bars.Remove(k); }
        }

        private BarWidget CreateBar(Brawler b)
        {
            var w = new BarWidget();
            int lt = ctx.LocalTeam;
            Color c = TeamUtil.ColorFor(b.TeamId, lt, b.IsLocalPlayer);
            w.root = UIFactory.Rect(worldLayer, "Bar_" + b.PlayerName);
            w.root.anchorMin = w.root.anchorMax = new Vector2(0.5f, 0.5f);
            w.root.pivot = new Vector2(0.5f, 0f);
            w.root.sizeDelta = new Vector2(180, 80);
            w.name = UIFactory.Label(w.root, b.PlayerName, 24, c);
            w.name.rectTransform.Anchor(0, 1, 1, 1, -60, -4, -60, -34);
            w.back = UIFactory.Image(w.root, new Color(0.05f, 0.03f, 0.1f, 0.9f), UIFactory.RoundedSmall, "Back");
            w.back.rectTransform.Anchor(0, 0.32f, 1, 0.68f);
            w.fill = UIFactory.Image(w.back.transform, c, UIFactory.White, "Fill");
            w.fill.rectTransform.Fill().offsetMin = new Vector2(4, 4); w.fill.rectTransform.offsetMax = new Vector2(-4, -4);
            w.fill.type = Image.Type.Filled; w.fill.fillMethod = Image.FillMethod.Horizontal;
            w.hp = UIFactory.Label(w.back.transform, "", 22, Color.white);
            w.hp.rectTransform.Fill();
            w.extra = UIFactory.Label(w.root, "", 28, Color.white, TextAnchor.MiddleLeft);
            w.extra.rectTransform.Anchor(0.5f, 1, 1, 1, 6, 26, -40, -64);
            w.extraIcon = UIFactory.IconImage(w.root, Icon.Gem, 40);
            w.extraIcon.rectTransform.Place(0.5f, 1, -18, 45, 40, 40);
            w.extraIcon.enabled = false;
            if (b.IsLocalPlayer)
            {
                w.ammo = new Image[b.Def.maxAmmo];
                float seg = 1f / b.Def.maxAmmo;
                for (int i = 0; i < b.Def.maxAmmo; i++)
                {
                    var bg = UIFactory.Image(w.root, new Color(0.05f, 0.03f, 0.1f, 0.9f), UIFactory.RoundedSmall, "AmmoBg");
                    bg.rectTransform.Anchor(seg * i, 0.02f, seg * (i + 1), 0.28f, 2, 0, 2, 0);
                    var f = UIFactory.Image(bg.transform, new Color(1f, 0.6f, 0.2f), UIFactory.White, "Ammo");
                    f.rectTransform.Fill().offsetMin = new Vector2(3, 3); f.rectTransform.offsetMax = new Vector2(-3, -3);
                    f.type = Image.Type.Filled; f.fillMethod = Image.FillMethod.Horizontal;
                    w.ammo[i] = f;
                }
                w.superIcon = UIFactory.IconImage(w.root, Icon.Bolt, 40);
                w.superIcon.rectTransform.Place(1, 0.5f, 26, 0, 40, 40, 0.5f, 0.5f);
            }
            return w;
        }

        private void UpdateObjectBars()
        {
            var cam = ctx.Camera.Cam;
            foreach (var d in ctx.Damageables)
            {
                var hb = d as IHealthBarTarget;
                if (hb == null) continue;
                Image fill;
                if (!objectBars.TryGetValue(hb, out fill))
                {
                    var bg = UIFactory.Image(worldLayer, new Color(0.05f, 0.03f, 0.1f, 0.9f), UIFactory.RoundedSmall, "ObjBar");
                    bg.rectTransform.anchorMin = bg.rectTransform.anchorMax = new Vector2(0.5f, 0.5f);
                    bg.rectTransform.sizeDelta = new Vector2(120, 22);
                    fill = UIFactory.Image(bg.transform, hb.Team == TeamUtil.Neutral ? new Color(0.4f, 1f, 0.5f) : TeamUtil.ColorFor(hb.Team, ctx.LocalTeam, false), UIFactory.White, "Fill");
                    fill.rectTransform.Fill().offsetMin = new Vector2(3, 3); fill.rectTransform.offsetMax = new Vector2(-3, -3);
                    fill.type = Image.Type.Filled; fill.fillMethod = Image.FillMethod.Horizontal;
                    objectBars[hb] = fill;
                }
            }
            var dead = deadBuffer;
            dead.Clear();
            foreach (var kv in objectBars)
            {
                var hb = kv.Key;
                var bg = kv.Value.transform.parent.gameObject;
                bool alive = hb != null && !(hb is Object && (Object)hb == null) && ((IDamageable)hb).IsAlive && ctx.Damageables.Contains((IDamageable)hb);
                if (!alive) { dead.Add(hb); Destroy(bg); continue; }
                Vector3 sp = cam.WorldToScreenPoint(hb.BarWorldPosition);
                bg.SetActive(hb.ShowHealthBar && sp.z > 0);
                Vector2 local;
                RectTransformUtility.ScreenPointToLocalPointInRectangle(worldLayer, sp, null, out local);
                ((RectTransform)bg.transform).anchoredPosition = local;
                kv.Value.fillAmount = hb.Health01;
            }
            foreach (var d in dead) objectBars.Remove(d);
        }

        // ================================================================== Schadenszahlen
        private void OnDamageNumber(Vector3 world, float amount, Color color, bool big)
        {
            DamageNumber n = null;
            foreach (var x in numbers) if (!x.text.gameObject.activeSelf) { n = x; break; }
            if (n == null)
            {
                n = new DamageNumber { text = UIFactory.Label(numberLayer, "", 36, Color.white) };
                n.text.rectTransform.anchorMin = n.text.rectTransform.anchorMax = new Vector2(0.5f, 0.5f);
                n.text.rectTransform.sizeDelta = new Vector2(240, 60);
                numbers.Add(n);
            }
            n.text.gameObject.SetActive(true);
            n.text.text = Mathf.RoundToInt(amount).ToString();
            n.text.color = color;
            n.text.fontSize = big ? 48 : 36;
            n.world = world + new Vector3(Random.Range(-0.3f, 0.3f), 0, 0);
            n.t = 0f;
            n.big = big;
        }

        private void UpdateNumbers()
        {
            var cam = ctx.Camera.Cam;
            foreach (var n in numbers)
            {
                if (!n.text.gameObject.activeSelf) continue;
                n.t += Time.deltaTime;
                if (n.t > 0.85f) { n.text.gameObject.SetActive(false); continue; }
                Vector3 sp = cam.WorldToScreenPoint(n.world + Vector3.up * n.t * 1.2f);
                Vector2 local;
                RectTransformUtility.ScreenPointToLocalPointInRectangle(numberLayer, sp, null, out local);
                n.text.rectTransform.anchoredPosition = local;
                float s = n.t < 0.12f ? Mathf.Lerp(1.6f, 1f, n.t / 0.12f) : 1f;
                n.text.rectTransform.localScale = Vector3.one * s;
                var c = n.text.color; c.a = n.t > 0.55f ? 1f - (n.t - 0.55f) / 0.3f : 1f; n.text.color = c;
            }
        }

        // ================================================================== Ansagen & Feed
        private void OnAnnounce(string title, string sub)
        {
            announceTitle.text = title;
            announceSub.text = sub;
            announceT = 0f;
        }

        private void UpdateAnnouncement()
        {
            announceT += Time.unscaledDeltaTime;
            float dur = 1.6f;
            bool on = announceT < dur || (ctx.Phase == MatchPhase.Ending);
            announceTitle.enabled = announceSub.enabled = on;
            if (!on) return;
            float k = Mathf.Clamp01(announceT / 0.2f);
            announceTitle.rectTransform.localScale = Vector3.one * Mathf.Lerp(1.8f, 1f, k);
            var c = announceTitle.color; c.a = ctx.Phase == MatchPhase.Ending ? 1f : Mathf.Clamp01((dur - announceT) / 0.3f); announceTitle.color = c;
        }

        private void OnKill(string msg)
        {
            var bg = UIFactory.Image(killFeed, new Color(0, 0, 0, 0.5f), UIFactory.RoundedSmall, "Feed");
            var t = UIFactory.Label(bg.transform, msg, 26, Color.white, TextAnchor.MiddleRight);
            t.rectTransform.Fill().offsetMin = new Vector2(10, 0); t.rectTransform.offsetMax = new Vector2(-12, 0);
            feed.Insert(0, new KeyValuePair<Text, float>(t, Time.time));
            while (feed.Count > 4) { Destroy(feed[feed.Count - 1].Key.transform.parent.gameObject); feed.RemoveAt(feed.Count - 1); }
        }

        private void UpdateFeed()
        {
            for (int i = feed.Count - 1; i >= 0; i--)
            {
                var rt = (RectTransform)feed[i].Key.transform.parent;
                rt.Place(1, 1, 0, -i * 56, 560, 50, 1, 1);
                if (Time.time - feed[i].Value > 5f) { Destroy(rt.gameObject); feed.RemoveAt(i); }
            }
        }

        // ================================================================== Pause
        private void OpenPause()
        {
            if (pausePopup != null || ctx == null) return;
            ctx.SetPaused(true);
            paused = true;
            var c = UIManager.Instance.OpenPopup("Pause", 900, 640, out pausePopup, false);
            var cont = UIFactory.Button(c, "Weiterspielen", Palette.Green, ClosePause, 42, Icon.Play);
            ((RectTransform)cont.transform).Place(0.5f, 1, 0, -10, 600, 130, 0.5f, 1);
            var help = UIFactory.Button(c, "Steuerung", Palette.Blue, SettingsScreen.ShowHelp, 36, Icon.Info);
            ((RectTransform)help.transform).Place(0.5f, 0.5f, 0, -10, 600, 110);
            bool ranked = ctx.ModeDef.ranked;
            var leave = UIFactory.Button(c, ranked ? "Match verlassen" : "Training beenden", Palette.Red, () =>
            {
                if (!ranked) { ClosePause(); ctx.Abandon(); return; }
                UIManager.Instance.Confirm("Verlassen?", "Das Match zählt dann als Niederlage.", "Verlassen", () => { ClosePause(); ctx.Abandon(); }, Palette.Red);
            }, 36, Icon.Back);
            ((RectTransform)leave.transform).Place(0.5f, 0, 0, 10, 600, 110, 0.5f, 0);
        }

        private void ClosePause()
        {
            if (pausePopup != null) UIManager.Instance.ClosePopup(pausePopup);
            pausePopup = null;
            paused = false;
            if (ctx != null) ctx.SetPaused(false);
        }

        private void Update()
        {
            // Popup wurde von außen geschlossen (z.B. Android-Zurück-Taste) → Spiel fortsetzen
            if (paused && pausePopup == null) { paused = false; if (ctx != null) ctx.SetPaused(false); }
            if (Input.GetKeyDown(KeyCode.Escape) && pausePopup == null && ctx != null && ctx.Phase == MatchPhase.Playing && !UIManager.Instance.HasPopup) OpenPause();
        }
    }
}
