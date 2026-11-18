// ---------------------------------------------------------------------------------------------
// Weitere Menüs: Shop, Trophäenpfad, Spielmodi-Auswahl (inkl. Karte), Einstellungen, Profil,
// Matchmaking und Ergebnisbildschirm (Sieg/Niederlage + Belohnungen).
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using BrawlArena.Audio;
using BrawlArena.Core;
using BrawlArena.Data;
using BrawlArena.Net;
using BrawlArena.Rendering;
using BrawlArena.Save;

namespace BrawlArena.UI
{
    // =============================================================================== Shop
    public class ShopScreen : UIScreen
    {
        private float timer;

        protected override void Build()
        {
            UIFactory.Backdrop(Root, new Color(1f, 0.6f, 0.25f), new Color(0.4f, 0.12f, 0.3f));
            MainMenuScreen.BuildHeader(Root, "Shop");
            var hint = UIFactory.Label(Root, "Neue Brawler gibt es nur mit Glück aus Boxen! Keine Echtgeld-Käufe.", 28, new Color(1, 1, 1, 0.8f), TextAnchor.MiddleLeft);
            hint.rectTransform.Place(0, 1, 170, -125, 1300, 50, 0, 1);

            var row = UIFactory.ScrollList(Root, true, 28);
            ((RectTransform)row.parent.parent).Anchor(0, 0.06f, 1, 0.84f, 30, 0, 30, 0);
            foreach (var offer in Economy.GetShopOffers()) BuildOffer(row, offer);
        }

        private void BuildOffer(Transform row, ShopOffer o)
        {
            var card = UIFactory.FancyPanel(row, o.color, o.id);
            UIFactory.Layout(card.gameObject, 380, 0);
            var t = UIFactory.Label(card.transform, o.title.ToUpper(), 40, Color.white);
            t.rectTransform.Anchor(0, 0.84f, 1, 1, 10, 0, 10, 10);
            var icon = UIFactory.IconImage(card.transform, UIManager.RewardIcon(o.reward), 210);
            icon.rectTransform.Place(0.5f, 0.55f, 0, 0, 210, 210);
            icon.gameObject.AddComponent<Pulse>().amount = 0.03f;
            var s = UIFactory.Label(card.transform, o.subtitle, 30, Color.white);
            s.rectTransform.Anchor(0, 0.24f, 1, 0.36f, 10, 0, 10, 0);
            string price = o.id == "free_box" ? (Economy.FreeBoxReady() ? "GRATIS" : Economy.FreeBoxRemainingText()) : (o.coinPrice > 0 ? o.coinPrice.ToString() : o.gemPrice.ToString());
            Icon? pi = o.id == "free_box" ? (Icon?)null : (o.coinPrice > 0 ? Icon.Coin : Icon.Gem);
            bool afford = Economy.CanAfford(o);
            var buy = UIFactory.Button(card.transform, price, afford ? Palette.Green : Palette.Gray, () =>
            {
                var got = Economy.Buy(o);
                if (got == null) { UIManager.Instance.Toast(o.id == "free_box" ? "Die Gratis-Box ist noch nicht bereit." : "Nicht genug Währung!", Palette.Red); return; }
                AudioManager.Sfx(SfxPreset.Coin);
                UIManager.Instance.ShowRewards(o.title, got, Refresh);
            }, 36, pi);
            ((RectTransform)buy.transform).Anchor(0, 0, 1, 0.22f, 24, 20, 24, 0);
        }

        private void Update()
        {
            timer += Time.unscaledDeltaTime;
            if (timer > 30f && !UIManager.Instance.HasPopup) { timer = 0f; Refresh(); }
        }
    }

    // =============================================================================== Trophäenpfad
    public class TrophyRoadScreen : UIScreen
    {
        protected override void Build()
        {
            var p = SaveSystem.Profile;
            UIFactory.Backdrop(Root, new Color(1f, 0.75f, 0.25f), new Color(0.45f, 0.2f, 0.15f));
            MainMenuScreen.BuildHeader(Root, "Trophäenpfad");
            var info = UIFactory.Label(Root, "Höchststand: " + p.highestTrophies + "   •   Aktuell: " + p.TotalTrophies, 32, Color.white, TextAnchor.MiddleLeft);
            info.rectTransform.Place(0, 1, 170, -125, 1200, 50, 0, 1);

            var row = UIFactory.ScrollList(Root, true, 20);
            ((RectTransform)row.parent.parent).Anchor(0, 0.08f, 1, 0.84f, 30, 0, 30, 0);
            int firstOpen = -1;
            for (int i = 0; i < Economy.TrophyRoad.Count; i++)
            {
                var step = Economy.TrophyRoad[i];
                int idx = i;
                bool claimed = p.claimedTrophyRoad.Contains(i);
                bool reached = p.highestTrophies >= step.trophies;
                if (firstOpen < 0 && !claimed) firstOpen = i;
                var card = UIFactory.FancyPanel(row, claimed ? new Color(0.3f, 0.3f, 0.38f) : reached ? new Color(0.25f, 0.65f, 0.35f) : Palette.Panel, "Step");
                UIFactory.Layout(card.gameObject, 300, 0);
                var trBg = UIFactory.Image(card.transform, new Color(0, 0, 0, 0.45f), UIFactory.Rounded, "Tr");
                trBg.rectTransform.Anchor(0, 0.85f, 1, 1, 14, 0, 14, 12);
                var ti = UIFactory.IconImage(trBg.transform, Icon.Trophy, 56);
                ti.rectTransform.Place(0, 0.5f, 8, 0, 56, 56, 0, 0.5f);
                UIFactory.Label(trBg.transform, step.trophies.ToString(), 36, Palette.Yellow).rectTransform.Anchor(0, 0, 1, 1, 60, 0, 0, 0);
                var ic = UIFactory.IconImage(card.transform, UIManager.RewardIcon(step.reward), 170);
                ic.rectTransform.Place(0.5f, 0.55f, 0, 0, 170, 170);
                var lb = UIFactory.Label(card.transform, step.reward.label, 28, Color.white);
                lb.rectTransform.Anchor(0, 0.22f, 1, 0.38f, 10, 0, 10, 0);
                if (claimed)
                {
                    var ch = UIFactory.IconImage(card.transform, Icon.Check, 90);
                    ch.rectTransform.Place(0.5f, 0.1f, 0, 0, 90, 90);
                }
                else
                {
                    var b = UIFactory.Button(card.transform, reached ? "Abholen" : "Gesperrt", reached ? Palette.Yellow : Palette.Gray, () =>
                    {
                        if (!Economy.CanClaimRoad(idx)) { UIManager.Instance.Toast("Erreiche " + step.trophies + " Trophäen, um diese Belohnung abzuholen."); return; }
                        UIManager.Instance.ShowRewards("Trophäenpfad", Economy.ClaimRoad(idx), Refresh);
                    }, 32, reached ? (Icon?)null : Icon.Lock);
                    ((RectTransform)b.transform).Anchor(0, 0, 1, 0.2f, 20, 18, 20, 0);
                    if (reached) b.gameObject.AddComponent<Pulse>().amount = 0.04f;
                }
            }
            // Zum ersten offenen Schritt scrollen
            var sr = row.GetComponentInParent<ScrollRect>();
            if (sr != null && firstOpen > 0)
            {
                Canvas.ForceUpdateCanvases();
                sr.horizontalNormalizedPosition = Mathf.Clamp01((firstOpen - 1) / (float)Mathf.Max(1, Economy.TrophyRoad.Count - 4));
            }
        }
    }

    // =============================================================================== Spielmodi
    public class ModeSelectScreen : UIScreen
    {
        protected override void Build()
        {
            var p = SaveSystem.Profile;
            UIFactory.Backdrop(Root, new Color(0.4f, 0.3f, 0.9f), new Color(0.1f, 0.08f, 0.3f));
            MainMenuScreen.BuildHeader(Root, "Spielmodi");
            var content = UIFactory.ScrollList(Root, false, 20, 3, new Vector2(560, 330));
            ((RectTransform)content.parent.parent).Anchor(0, 0, 1, 1, 40, 20, 40, 160);

            foreach (var mode in ContentDatabase.Modes)
            {
                var m = mode;
                bool locked = p.TotalTrophies < m.requiredTrophies;
                bool sel = p.selectedModeId == m.id;
                var card = UIFactory.Button(content, "", locked ? Palette.Gray : m.themeColor, () =>
                {
                    if (locked) { UIManager.Instance.Toast("Benötigt " + m.requiredTrophies + " Trophäen."); return; }
                    OpenMapPicker(m);
                }, 30);
                var c = card.transform.Find("Face/Content");
                var t = UIFactory.Label(c, m.displayName.ToUpper(), 44, Color.white, TextAnchor.UpperLeft);
                t.rectTransform.Anchor(0, 0.66f, 1, 1, 22, 0, 22, 16);
                var d = UIFactory.Label(c, m.description, 24, new Color(1, 1, 1, 0.92f), TextAnchor.UpperLeft, false);
                d.rectTransform.Anchor(0, 0.15f, 1, 0.68f, 22, 0, 22, 0);
                string teams = m.modeType == ModeType.Showdown ? m.teamCount + " Spieler" : m.modeType == ModeType.Training ? "Solo" :
                    (m.modeType == ModeType.SoloSurvival || m.modeType == ModeType.DuoSurvival) ? m.teamSize + " vs. Roboter" : m.teamSize + " vs " + m.teamSize;
                var info = UIFactory.Label(c, teams + (locked ? "   (ab " + m.requiredTrophies + " Trophäen)" : ""), 26, Palette.Yellow, TextAnchor.LowerLeft);
                info.rectTransform.Anchor(0, 0, 1, 0.18f, 22, 6, 22, 0);
                if (sel)
                {
                    var ch = UIFactory.IconImage(c, Icon.Check, 70);
                    ch.rectTransform.Place(1, 1, -10, -10, 70, 70, 1, 1);
                }
            }
        }

        private void OpenMapPicker(GameModeDefinition mode)
        {
            var p = SaveSystem.Profile;
            var maps = ContentDatabase.MapsFor(mode);
            GameObject popup;
            var c = UIManager.Instance.OpenPopup(mode.displayName + " – Karte", 1300, 780, out popup);
            var list = UIFactory.ScrollList(c, false, 14);
            ((RectTransform)list.parent.parent).Fill();
            System.Action<string, string> add = (id, name) =>
            {
                bool sel = p.selectedModeId == mode.id && (p.selectedMapId ?? "") == id;
                var b = UIFactory.Button(list, name, sel ? Palette.Green : Palette.Blue, () =>
                {
                    p.selectedModeId = mode.id;
                    p.selectedMapId = id;
                    SaveSystem.Save();
                    UIManager.Instance.ClosePopup(popup);
                    UIManager.Instance.Back();
                }, 38, id == "" ? (Icon?)Icon.Star : Icon.Flag);
                UIFactory.Layout(b.gameObject, 0, 120);
            };
            add("", "Zufällige Karte");
            foreach (var m in maps) add(m.id, m.displayName + "  (" + m.Width + "×" + m.Height + ")");
            if (maps.Count == 0)
            {
                var t = UIFactory.Label(list, "Keine Karte unterstützt diesen Modus – es wird eine Ersatzkarte verwendet.", 30, Palette.TextDim);
                UIFactory.Layout(t.gameObject, 0, 100);
            }
        }
    }

    // =============================================================================== Einstellungen
    public class SettingsScreen : UIScreen
    {
        protected override void Build()
        {
            var s = SaveSystem.Profile.settings;
            UIFactory.Backdrop(Root, new Color(0.35f, 0.4f, 0.55f), new Color(0.12f, 0.12f, 0.2f));
            MainMenuScreen.BuildHeader(Root, "Einstellungen");
            var list = UIFactory.ScrollList(Root, false, 14);
            ((RectTransform)list.parent.parent).Anchor(0.15f, 0.02f, 0.85f, 0.86f);

            AddSlider(list, "Musik", s.musicVolume, v => { s.musicVolume = v; GameFlow.Instance.ApplySettings(); });
            AddSlider(list, "Soundeffekte", s.sfxVolume, v => { s.sfxVolume = v; GameFlow.Instance.ApplySettings(); });
            AddChoice(list, "Grafikqualität", new[] { "Niedrig", "Mittel", "Hoch" }, s.quality, v => { s.quality = v; GameFlow.Instance.ApplySettings(); });
            AddToggle(list, "60 FPS (sonst 30 FPS, spart Akku)", s.targetFps60, v => { s.targetFps60 = v; GameFlow.Instance.ApplySettings(); });
            AddToggle(list, "FPS anzeigen", s.showFps, v => s.showFps = v);
            AddToggle(list, "Bewegungs-Joystick folgt dem Finger", s.floatingJoystick, v => s.floatingJoystick = v);
            AddToggle(list, "Antippen = automatisch zielen", s.tapToAutoAim, v => s.tapToAutoAim = v);
            AddToggle(list, "Vibration", s.vibration, v => s.vibration = v);
            AddSlider(list, "Joystick-Größe", Mathf.InverseLerp(0.7f, 1.4f, s.joystickSize), v => s.joystickSize = Mathf.Lerp(0.7f, 1.4f, v));

            var code = UIFactory.Button(list, "Code eingeben", Palette.Purple, ShowCodeMenu, 36, Icon.Gift);
            UIFactory.Layout(code.gameObject, 0, 120);
            var help = UIFactory.Button(list, "Steuerung & Hilfe", Palette.Blue, ShowHelp, 36, Icon.Info);
            UIFactory.Layout(help.gameObject, 0, 120);
            var reset = UIFactory.Button(list, "Fortschritt zurücksetzen", Palette.Red, () =>
                UIManager.Instance.Confirm("Achtung", "Wirklich ALLEN Fortschritt löschen?\nDas kann nicht rückgängig gemacht werden.", "Löschen", () =>
                {
                    SaveSystem.ResetProgress();
                    GameFlow.Instance.ValidateSelection();
                    GameFlow.Instance.GoToMenu();
                }, Palette.Red), 36, Icon.Skull);
            UIFactory.Layout(reset.gameObject, 0, 120);
            var ver = UIFactory.Label(list, "BrawlArena v" + Application.version + " • Unity " + Application.unityVersion, 26, Palette.TextDim);
            UIFactory.Layout(ver.gameObject, 0, 60);
        }

        public override void OnBack() { SaveSystem.Save(); base.OnBack(); }

        private RectTransform Row(Transform list, string label)
        {
            var row = UIFactory.FancyPanel(list, Palette.Panel, "Row");
            UIFactory.Layout(row.gameObject, 0, 120);
            var t = UIFactory.Label(row.transform, label, 36, Color.white, TextAnchor.MiddleLeft);
            t.rectTransform.Anchor(0, 0, 0.55f, 1, 30, 0, 0, 0);
            return row.rectTransform;
        }

        private void AddSlider(Transform list, string label, float value, System.Action<float> onChange)
        {
            var row = Row(list, label);
            var s = UIFactory.Slider(row, 0, 1, value, onChange, Palette.Yellow);
            ((RectTransform)s.transform).Anchor(0.55f, 0.15f, 1, 0.85f, 10, 0, 40, 0);
        }

        private void AddToggle(Transform list, string label, bool value, System.Action<bool> onChange)
        {
            var row = Row(list, label);
            row.GetComponentInChildren<Text>().rectTransform.Anchor(0, 0, 0.8f, 1, 30, 0, 0, 0);
            var t = UIFactory.Toggle(row, value, onChange);
            ((RectTransform)t.transform).Place(1, 0.5f, -40, 0, 150, 70, 1, 0.5f);
        }

        private void AddChoice(Transform list, string label, string[] options, int value, System.Action<int> onChange)
        {
            var row = Row(list, label);
            for (int i = 0; i < options.Length; i++)
            {
                int idx = i;
                var b = UIFactory.Button(row, options[i], i == value ? Palette.Green : Palette.Gray, () => { onChange(idx); Refresh(); }, 28);
                float w = 0.45f / options.Length;
                ((RectTransform)b.transform).Anchor(0.55f + w * i, 0.12f, 0.55f + w * (i + 1), 0.88f, 6, 0, 6, 0);
            }
        }

        /// <summary>Code-Menü: gültige Codes schalten Inhalte frei.</summary>
        public static void ShowCodeMenu()
        {
            GameObject popup;
            var c = UIManager.Instance.OpenPopup("Code eingeben", 1000, 560, out popup);
            var hint = UIFactory.Label(c, "Gib einen Code ein:", 36, Color.white);
            hint.rectTransform.Anchor(0, 0.7f, 1, 1);
            var field = UIFactory.Input(c, "", 20, null);
            ((RectTransform)field.transform).Place(0.5f, 0.55f, 0, 0, 600, 100);
            var ok = UIFactory.Button(c, "Einlösen", Palette.Green, () =>
            {
                var got = Economy.RedeemCode(field.text);
                if (got == null) { UIManager.Instance.Toast("Ungültiger Code.", Palette.Red); return; }
                UIManager.Instance.ClosePopup(popup);
                GameFlow.Instance.ValidateSelection();
                UIManager.Instance.ShowRewards("Code eingelöst!", got);
            }, 40);
            ((RectTransform)ok.transform).Place(0.5f, 0, 0, 10, 420, 120, 0.5f, 0);
        }

        public static void ShowHelp()
        {
            GameObject popup;
            var c = UIManager.Instance.OpenPopup("Steuerung", 1400, 860, out popup);
            var t = UIFactory.Label(c,
                "• Linker Daumen: Bewegen (virtueller Joystick)\n" +
                "• Rechter Button antippen: Angriff mit automatischem Zielen\n" +
                "• Rechter Button ziehen & loslassen: gezielter Angriff (Zielanzeige)\n" +
                "• Gelber Super-Button: Superfähigkeit (lädt sich durch Treffer auf)\n" +
                "• Munitionsbalken laden automatisch nach\n" +
                "• Nach 3 s ohne Kampf heilst du dich langsam\n" +
                "• Büsche verstecken dich vor Gegnern\n\n" +
                "Tastatur (PC/Editor): WASD bewegen, Maus zielen, Linksklick Angriff,\n" +
                "Rechtsklick Super, Leertaste Auto-Angriff, E Auto-Super, Esc Pause",
                32, Color.white, TextAnchor.UpperLeft, false);
            t.rectTransform.Fill();
        }
    }

    // =============================================================================== Profil
    public class ProfileScreen : UIScreen
    {
        private static readonly Color[] IconColors =
        {
            new Color(0.3f, 0.6f, 1f), new Color(1f, 0.35f, 0.35f), new Color(0.35f, 0.85f, 0.4f), new Color(1f, 0.8f, 0.2f),
            new Color(0.7f, 0.35f, 1f), new Color(1f, 0.55f, 0.15f), new Color(0.2f, 0.85f, 0.85f), new Color(1f, 0.45f, 0.75f)
        };
        public static Color IconColor(int i) { return IconColors[Mathf.Abs(i) % IconColors.Length]; }

        protected override void Build()
        {
            var p = SaveSystem.Profile;
            UIFactory.Backdrop(Root, new Color(0.25f, 0.6f, 0.9f), new Color(0.1f, 0.12f, 0.35f));
            MainMenuScreen.BuildHeader(Root, "Profil");

            var left = UIFactory.FancyPanel(Root, Palette.Panel, "Card");
            left.rectTransform.Anchor(0.03f, 0.04f, 0.38f, 0.86f);
            var avatar = UIFactory.Image(left.transform, IconColor(p.iconIndex), UIFactory.Circle, "Avatar");
            avatar.rectTransform.Place(0.5f, 1, 0, -40, 230, 230, 0.5f, 1);
            UIFactory.IconImage(avatar.transform, Icon.Person, 160).rectTransform.Place(0.5f, 0.5f, 0, 0, 160, 160);
            var nameField = UIFactory.Input(left.transform, p.playerName, 16, v =>
            {
                v = v.Trim();
                if (v.Length >= 2) { p.playerName = v; SaveSystem.Save(); UIManager.Instance.Toast("Name geändert!"); }
                else UIManager.Instance.Toast("Der Name braucht mindestens 2 Zeichen.", Palette.Red);
            });
            ((RectTransform)nameField.transform).Place(0.5f, 1, 0, -300, 520, 90, 0.5f, 1);
            var hint = UIFactory.Label(left.transform, "Tippe auf den Namen, um ihn zu ändern", 24, Palette.TextDim);
            hint.rectTransform.Place(0.5f, 1, 0, -395, 560, 40, 0.5f, 1);
            // Farbauswahl
            for (int i = 0; i < IconColors.Length; i++)
            {
                int idx = i;
                var b = UIFactory.Button(left.transform, "", IconColors[i], () => { p.iconIndex = idx; SaveSystem.Save(); Refresh(); }, 20, idx == p.iconIndex ? (Icon?)Icon.Check : null);
                ((RectTransform)b.transform).Place(0.5f, 0, -240 + (i % 4) * 160, 170 - (i / 4) * 120, 110, 105);
            }

            var right = UIFactory.FancyPanel(Root, Palette.Panel, "Stats");
            right.rectTransform.Anchor(0.4f, 0.04f, 0.97f, 0.86f);
            var st = p.stats;
            string fav = "-";
            int best = -1;
            foreach (var b in p.brawlers) if (b.matches > best && ContentDatabase.GetBrawler(b.id) != null) { best = b.matches; fav = ContentDatabase.GetBrawler(b.id).displayName; }
            var rows = new[]
            {
                new KeyValuePair<string, string>("Spielerlevel", p.level + "  (" + p.xp + "/" + Economy.XpForLevel(p.level) + " XP)"),
                new KeyValuePair<string, string>("Trophäen", p.TotalTrophies.ToString()),
                new KeyValuePair<string, string>("Höchststand", p.highestTrophies.ToString()),
                new KeyValuePair<string, string>("Matches", st.matches.ToString()),
                new KeyValuePair<string, string>("3v3-Siege", st.teamWins.ToString()),
                new KeyValuePair<string, string>("Showdown-Siege", st.showdownWins.ToString()),
                new KeyValuePair<string, string>("Überleben geschafft", st.survivalWins.ToString()),
                new KeyValuePair<string, string>("K.O.s / Niederlagen", st.kills + " / " + st.deaths),
                new KeyValuePair<string, string>("Gesamtschaden", st.totalDamage.ToString("N0")),
                new KeyValuePair<string, string>("Star-Spieler", st.starPlayer.ToString()),
                new KeyValuePair<string, string>("Brawler freigeschaltet", ContentDatabase.Brawlers.FindAll(b => p.IsUnlocked(b)).Count + " / " + ContentDatabase.Brawlers.Count),
                new KeyValuePair<string, string>("Lieblings-Brawler", fav),
                new KeyValuePair<string, string>("Geöffnete Boxen", st.boxesOpened.ToString()),
            };
            for (int i = 0; i < rows.Length; i++)
            {
                float y1 = 1f - i / (float)rows.Length, y0 = y1 - 1f / rows.Length;
                var k = UIFactory.Label(right.transform, rows[i].Key, 32, Palette.TextDim, TextAnchor.MiddleLeft);
                k.rectTransform.Anchor(0, y0, 0.6f, y1, 40, 0, 0, 0);
                var v = UIFactory.Label(right.transform, rows[i].Value, 34, Color.white, TextAnchor.MiddleRight);
                v.rectTransform.Anchor(0.5f, y0, 1, y1, 0, 0, 40, 0);
            }
        }
    }

    // =============================================================================== Matchmaking
    public class MatchmakingScreen : UIScreen
    {
        private Text status;
        private readonly List<Image> slots = new List<Image>();

        protected override void Build()
        {
            var p = SaveSystem.Profile;
            var mode = ContentDatabase.GetMode(p.selectedModeId);
            slots.Clear();
            UIFactory.Backdrop(Root, Color.Lerp(mode.themeColor, Color.white, 0.1f), new Color(0.08f, 0.06f, 0.2f));
            var title = UIFactory.Label(Root, mode.displayName.ToUpper(), 80, Color.white);
            title.rectTransform.Place(0.5f, 0.82f, 0, 0, 1600, 120);
            var spin = UIFactory.IconImage(Root, Icon.Star, 160);
            spin.rectTransform.Place(0.5f, 0.6f, 0, 0, 160, 160);
            spin.gameObject.AddComponent<Spin>().speed = 180f;
            status = UIFactory.Label(Root, "Spielersuche (offline – Bots) ...", 44, Palette.Yellow);
            status.rectTransform.Place(0.5f, 0.45f, 0, 0, 1400, 80);
            var cancel = UIFactory.Button(Root, "Abbrechen", Palette.Red, () => GameFlow.Instance.CancelMatchmaking(), 40, Icon.Close);
            ((RectTransform)cancel.transform).Place(0.5f, 0.08f, 0, 0, 460, 130);

            int total = mode.TotalPlayers;
            if (mode.modeType == ModeType.SoloSurvival) total = 1;
            float w = Mathf.Min(150f, 1500f / Mathf.Max(1, total));
            for (int i = 0; i < total; i++)
            {
                var slot = UIFactory.Image(Root, new Color(0, 0, 0, 0.4f), UIFactory.Circle, "Slot");
                slot.rectTransform.Place(0.5f, 0.28f, (i - (total - 1) * 0.5f) * (w + 14), 0, w, w);
                var ic = UIFactory.IconImage(slot.transform, Icon.Person, w * 0.7f);
                ic.rectTransform.Place(0.5f, 0.5f, 0, 0, w * 0.7f, w * 0.7f);
                ic.color = new Color(1, 1, 1, 0.15f);
                slots.Add(ic);
            }
            SetProgress(1, total);
        }

        public override void OnBack() { GameFlow.Instance.CancelMatchmaking(); }

        public void SetProgress(int found, int needed)
        {
            if (status == null) return;
            status.text = "Spieler gefunden: " + found + " / " + needed + "  (offline – Bots)";
            for (int i = 0; i < slots.Count; i++)
            {
                bool filled = i < found;
                if (filled && slots[i].color.a < 0.5f) AudioManager.Sfx(SfxPreset.Click, null, 0.5f, 1.3f);
                slots[i].color = filled ? Color.white : new Color(1, 1, 1, 0.15f);
            }
        }
    }

    // =============================================================================== Ergebnis
    public class ResultScreen : UIScreen
    {
        public override bool ShowMenuStage { get { return true; } }
        private MatchResult result;
        private int levelBefore;

        public void Show(MatchResult r, int lvlBefore)
        {
            result = r; levelBefore = lvlBefore;
            Refresh();
        }

        protected override void Build()
        {
            if (result == null) return;
            GameFlow.Instance.Stage.SetFraming(-2.2f);
            bool win = result.outcome == MatchOutcome.Victory;
            bool draw = result.outcome == MatchOutcome.Draw;
            if (win) GameFlow.Instance.Stage.PlayCheer();

            var banner = UIFactory.Image(Root, win ? new Color(1f, 0.75f, 0.1f) : draw ? Palette.Gray : new Color(0.75f, 0.15f, 0.2f), UIFactory.Rounded, "Banner");
            banner.rectTransform.Place(0.5f, 1, 0, -30, 1300, 170, 0.5f, 1);
            banner.gameObject.AddComponent<PopIn>();
            var head = UIFactory.Label(banner.transform, result.headline, 96, Color.white);
            head.rectTransform.Fill();
            var det = UIFactory.Label(Root, result.detail, 44, Color.white);
            det.rectTransform.Place(0.5f, 1, 0, -210, 1300, 70, 0.5f, 1);

            // Belohnungen (rechts)
            var panel = UIFactory.FancyPanel(Root, Palette.Panel, "Rewards");
            panel.rectTransform.Anchor(0.5f, 0.2f, 0.97f, 0.76f);
            var rows = new List<KeyValuePair<Icon, string>>();
            rows.Add(new KeyValuePair<Icon, string>(Icon.Trophy, (result.trophyDelta >= 0 ? "+" : "") + result.trophyDelta + " Trophäen"));
            rows.Add(new KeyValuePair<Icon, string>(Icon.Coin, "+" + result.coins + " Münzen"));
            rows.Add(new KeyValuePair<Icon, string>(Icon.Star, "+" + result.xp + " XP"));
            rows.Add(new KeyValuePair<Icon, string>(Icon.Token, "+" + result.tokens + " Tokens"));
            if (result.starPlayer) rows.Add(new KeyValuePair<Icon, string>(Icon.Crown, "STAR-SPIELER!"));
            if (SaveSystem.Profile.level > levelBefore) rows.Add(new KeyValuePair<Icon, string>(Icon.Bolt, "LEVEL " + SaveSystem.Profile.level + " erreicht!"));
            for (int i = 0; i < rows.Count; i++)
            {
                float y1 = 0.95f - i * 0.15f;
                var ic = UIFactory.IconImage(panel.transform, rows[i].Key, 80);
                ic.rectTransform.Place(0.1f, y1, 0, -40, 80, 80, 0.5f, 0.5f);
                var t = UIFactory.Label(panel.transform, rows[i].Value, 44, i == 0 ? (result.trophyDelta >= 0 ? Palette.Yellow : Palette.Red) : Color.white, TextAnchor.MiddleLeft);
                t.rectTransform.Anchor(0.18f, y1 - 0.15f, 1, y1);
                ic.gameObject.AddComponent<PopIn>().delay = 0.2f + i * 0.15f;
            }

            // Statistik (links unten)
            var local = result.stats.Find(s => s.isLocal);
            if (local != null)
            {
                var st = UIFactory.Label(Root, "K.O.s: " + local.kills + "    Schaden: " + Mathf.RoundToInt(local.damage) + (local.healing > 0 ? "    Heilung: " + Mathf.RoundToInt(local.healing) : "") +
                    "\nMVP: " + (string.IsNullOrEmpty(result.mvpName) ? "-" : result.mvpName) + "    Dauer: " + Modes.GameModeController.FormatTime(result.duration), 32, Color.white, TextAnchor.MiddleLeft);
                st.rectTransform.Place(0, 0, 40, 230, 900, 110, 0, 0);
            }

            var again = UIFactory.Button(Root, "Nochmal", Palette.Blue, () => GameFlow.Instance.PlayAgain(), 44, Icon.Play);
            ((RectTransform)again.transform).Place(1, 0, -520, 40, 440, 140, 1, 0);
            var cont = UIFactory.Button(Root, "Weiter", Palette.Yellow, () => GameFlow.Instance.GoToMenu(), 48);
            ((RectTransform)cont.transform).Place(1, 0, -40, 40, 440, 140, 1, 0);
        }

        public override void OnBack() { GameFlow.Instance.GoToMenu(); }
    }
}
