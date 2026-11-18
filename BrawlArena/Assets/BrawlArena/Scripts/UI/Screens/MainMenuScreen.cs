// ---------------------------------------------------------------------------------------------
// Hauptmenü: Profil, Währungen, Trophäen, Navigation (Shop, Brawler, Trophäenpfad, Editor,
// Einstellungen), tägliche Belohnung, Token-Box, Modusauswahl und der große SPIELEN-Button.
// Der gewählte Brawler steht in 3D auf dem Podest (MenuStage) und lässt sich drehen.
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using BrawlArena.Audio;
using BrawlArena.Core;
using BrawlArena.Data;
using BrawlArena.Save;

namespace BrawlArena.UI
{
    public class MainMenuScreen : UIScreen
    {
        public override bool ShowMenuStage { get { return true; } }
        private float lastRefresh;

        protected override void Build()
        {
            var p = SaveSystem.Profile;
            GameFlow.Instance.Stage.SetFraming(0f);
            GameFlow.Instance.Stage.ShowBrawler(GameFlow.Instance.SelectedBrawlerForDisplay());

            // Drehfläche für den 3D-Brawler
            var drag = UIFactory.Image(Root, new Color(0, 0, 0, 0.001f), UIFactory.White, "DragArea");
            drag.rectTransform.Anchor(0.3f, 0.25f, 0.7f, 0.85f);
            drag.raycastTarget = true;
            drag.gameObject.AddComponent<StageDragHandler>();

            BuildTopBar(Root, true);

            // ------------------------------------------------ Linke Navigationsleiste
            float y = -210;
            AddNav(Icon.Shop, "Shop", Palette.Orange, () => UIManager.Instance.Push<ShopScreen>(), ref y, Economy.FreeBoxReady());
            AddNav(Icon.Users, "Brawler", Palette.Blue, () => UIManager.Instance.Push<BrawlersScreen>(), ref y, false);
            AddNav(Icon.Flag, "Trophäenpfad", Palette.Red, () => UIManager.Instance.Push<TrophyRoadScreen>(), ref y, Economy.UnclaimedRoadCount() > 0);

            // ------------------------------------------------ Tägliche Belohnung & Token-Box
            if (Economy.DailyRewardReady())
            {
                var gift = UIFactory.Button(Root, "Täglich", Palette.Green, () =>
                {
                    var r = Economy.ClaimDailyReward();
                    UIManager.Instance.ShowRewards("Tägliche Belohnung (Tag " + SaveSystem.Profile.dailyStreak + ")", r, Refresh);
                }, 30, Icon.Gift);
                ((RectTransform)gift.transform).Place(0, 0, 30, 190, 300, 110, 0, 0);
                gift.gameObject.AddComponent<Pulse>();
            }
            var tokenBg = UIFactory.FancyPanel(Root, Palette.Panel, "Tokens");
            tokenBg.rectTransform.Place(0, 0, 30, 40, 420, 130, 0, 0);
            var tokIcon = UIFactory.IconImage(tokenBg.transform, Icon.Token, 80);
            tokIcon.rectTransform.Place(0, 0.5f, 18, 0, 80, 80, 0, 0.5f);
            var tokBar = UIFactory.Bar(tokenBg.transform, Palette.Blue, new Color(0, 0, 0, 0.5f));
            ((RectTransform)tokBar.rectTransform.parent).Place(0, 0, 112, 22, 285, 34, 0, 0);
            tokBar.fillAmount = Mathf.Clamp01(p.tokens / (float)Economy.TokensPerSmallBox);
            var tokText = UIFactory.Label(tokenBg.transform, Economy.CanOpenTokenBox() ? "Box bereit! Antippen" : "Tokens " + p.tokens + "/" + Economy.TokensPerSmallBox, 30, Color.white, TextAnchor.MiddleLeft);
            tokText.rectTransform.Anchor(0, 0.45f, 1, 1, 112, 0, 10, 8);
            var tokBtn = tokenBg.gameObject.AddComponent<Button>();
            tokBtn.onClick.AddListener(() =>
            {
                if (!Economy.CanOpenTokenBox()) { UIManager.Instance.Toast("Sammle Tokens in Matches: 100 Tokens = 1 Brawl-Box"); return; }
                AudioManager.UiClick();
                UIManager.Instance.ShowRewards("Brawl-Box", Economy.OpenTokenBox(), Refresh);
            });
            if (Economy.CanOpenTokenBox()) tokenBg.gameObject.AddComponent<Pulse>();

            // ------------------------------------------------ Brawler-Info unter dem Podest
            var def = ContentDatabase.GetBrawler(p.selectedBrawlerId);
            var bp = p.Get(def.id);
            var infoBtn = UIFactory.Button(Root, "", new Color(0.15f, 0.13f, 0.3f, 0.9f), () => UIManager.Instance.Push<BrawlerDetailScreen>(s => s.Brawler = def), 30);
            ((RectTransform)infoBtn.transform).Place(0.5f, 0, 0, 40, 520, 150, 0.5f, 0);
            var nameT = UIFactory.Label(infoBtn.transform.Find("Face/Content"), def.displayName.ToUpper(), 46, RarityUtil.GetColor(def.rarity));
            nameT.rectTransform.Anchor(0, 0.45f, 1, 1);
            var sub = UIFactory.Label(infoBtn.transform.Find("Face/Content"), "Level " + bp.level + "   ", 30, Color.white);
            sub.rectTransform.Anchor(0, 0, 0.6f, 0.5f);
            var trIc = UIFactory.IconImage(infoBtn.transform.Find("Face/Content"), Icon.Trophy, 44);
            trIc.rectTransform.Place(0.6f, 0.25f, 0, 0, 44, 44);
            var trT = UIFactory.Label(infoBtn.transform.Find("Face/Content"), bp.trophies.ToString(), 32, Palette.Yellow, TextAnchor.MiddleLeft);
            trT.rectTransform.Anchor(0.66f, 0, 1, 0.5f);

            // ------------------------------------------------ Modus + Spielen
            var mode = ContentDatabase.GetMode(p.selectedModeId);
            var map = ContentDatabase.GetMap(p.selectedMapId);
            var modeBtn = UIFactory.Button(Root, "", mode.themeColor, () => UIManager.Instance.Push<ModeSelectScreen>(), 30);
            ((RectTransform)modeBtn.transform).Place(1, 0, -30, 215, 520, 150, 1, 0);
            var mc = modeBtn.transform.Find("Face/Content");
            var modeName = UIFactory.Label(mc, mode.displayName, 44, Color.white);
            modeName.rectTransform.Anchor(0, 0.42f, 1, 1, 10, 0, 10, 0);
            var mapName = UIFactory.Label(mc, map != null ? map.displayName : "Zufällige Karte", 28, new Color(1, 1, 1, 0.9f));
            mapName.rectTransform.Anchor(0, 0, 1, 0.48f, 10, 4, 10, 0);
            var change = UIFactory.Label(modeBtn.transform, "MODUS ÄNDERN", 22, Palette.Yellow);
            change.rectTransform.Place(0.5f, 1, 0, 18, 300, 36);

            var play = UIFactory.Button(Root, "SPIELEN", Palette.Yellow, () => GameFlow.Instance.StartMatchmaking(), 64, Icon.Play);
            ((RectTransform)play.transform).Place(1, 0, -30, 30, 520, 170, 1, 0);
            play.gameObject.AddComponent<Pulse>().amount = 0.025f;
            var playText = play.GetComponentInChildren<Text>();
            playText.color = Color.white;
        }

        private void AddNav(Icon icon, string label, Color color, System.Action onClick, ref float y, bool badge)
        {
            var b = UIFactory.Button(Root, label, color, onClick, 32, icon);
            ((RectTransform)b.transform).Place(0, 1, 30, y, 330, 115, 0, 1);
            if (badge)
            {
                var dot = UIFactory.Image(b.transform, Palette.Red, UIFactory.Circle, "Badge");
                dot.rectTransform.Place(1, 1, 8, 8, 44, 44, 1, 1);
                var ex = UIFactory.Label(dot.transform, "!", 30, Color.white);
                ex.rectTransform.Fill();
                dot.gameObject.AddComponent<Pulse>().amount = 0.12f;
            }
            y -= 132;
        }

        /// <summary>Obere Leiste: Profil, Trophäen, Münzen, Edelsteine, Einstellungen.</summary>
        public static void BuildTopBar(RectTransform root, bool withProfile)
        {
            var p = SaveSystem.Profile;
            if (withProfile)
            {
                var prof = UIFactory.Button(root, "", Palette.Panel, () => UIManager.Instance.Push<ProfileScreen>(), 30);
                ((RectTransform)prof.transform).Place(0, 1, 30, -24, 470, 150, 0, 1);
                var content = prof.transform.Find("Face/Content");
                var avatar = UIFactory.Image(content, ProfileScreen.IconColor(p.iconIndex), UIFactory.Circle, "Avatar");
                avatar.rectTransform.Place(0, 0.5f, 10, 0, 100, 100, 0, 0.5f);
                var av = UIFactory.IconImage(avatar.transform, Icon.Person, 70);
                av.rectTransform.Place(0.5f, 0.5f, 0, 0, 70, 70);
                var nm = UIFactory.Label(content, p.playerName, 34, Color.white, TextAnchor.MiddleLeft);
                nm.rectTransform.Anchor(0, 0.5f, 1, 1, 125, 0, 10, 4);
                var lvl = UIFactory.Image(content, Palette.Blue, UIFactory.Circle, "Level");
                lvl.rectTransform.Place(0, 0, 70, 6, 50, 50, 0, 0);
                var lt = UIFactory.Label(lvl.transform, p.level.ToString(), 26, Color.white);
                lt.rectTransform.Fill();
                var xp = UIFactory.Bar(content, Palette.Yellow, new Color(0, 0, 0, 0.5f));
                ((RectTransform)xp.transform.parent).Anchor(0, 0, 1, 0, 125, 14, 20, -38);
                xp.fillAmount = p.xp / (float)Economy.XpForLevel(p.level);
            }

            var trophyBtn = UIFactory.Button(root, "", new Color(0.1f, 0.08f, 0.2f, 0.85f), () => UIManager.Instance.Push<TrophyRoadScreen>(), 30);
            ((RectTransform)trophyBtn.transform).Place(0.5f, 1, withProfile ? -120 : 0, -24, 300, 110, 0.5f, 1);
            var tc = trophyBtn.transform.Find("Face/Content");
            var ti = UIFactory.IconImage(tc, Icon.Trophy, 76);
            ti.rectTransform.Place(0, 0.5f, 10, 0, 76, 76, 0, 0.5f);
            var tt = UIFactory.Label(tc, p.TotalTrophies.ToString(), 44, Palette.Yellow, TextAnchor.MiddleCenter);
            tt.rectTransform.Fill().offsetMin = new Vector2(80, 0);

            RectTransform rt;
            UIFactory.CurrencyPill(root, Icon.Coin, p.coins.ToString(), out rt);
            rt.Place(1, 1, -460, -40, 250, 80, 1, 1);
            UIFactory.CurrencyPill(root, Icon.Gem, p.gems.ToString(), out rt);
            rt.Place(1, 1, -170, -40, 250, 80, 1, 1);
            var gear = UIFactory.IconButton(root, Icon.Gear, Palette.Gray, () => UIManager.Instance.Push<SettingsScreen>(), 110);
            ((RectTransform)gear.transform).Place(1, 1, -30, -24, 110, 110, 1, 1);
        }

        /// <summary>Kopfzeile für Unterbildschirme: Zurück-Button + Titel + Währungen.</summary>
        public static void BuildHeader(RectTransform root, string title)
        {
            var back = UIFactory.IconButton(root, Icon.Back, Palette.Blue, () => UIManager.Instance.Current.OnBack(), 110);
            ((RectTransform)back.transform).Place(0, 1, 30, -24, 110, 110, 0, 1);
            var t = UIFactory.Label(root, title.ToUpper(), 60, Color.white, TextAnchor.MiddleLeft);
            t.rectTransform.Place(0, 1, 170, -24, 900, 110, 0, 1);
            var p = SaveSystem.Profile;
            RectTransform rt;
            UIFactory.CurrencyPill(root, Icon.Coin, p.coins.ToString(), out rt);
            rt.Place(1, 1, -320, -40, 250, 80, 1, 1);
            UIFactory.CurrencyPill(root, Icon.Gem, p.gems.ToString(), out rt);
            rt.Place(1, 1, -30, -40, 250, 80, 1, 1);
        }

        private void Update()
        {
            // Zeitabhängige Anzeigen (Gratis-Box, Tagesbelohnung) gelegentlich aktualisieren
            lastRefresh += Time.unscaledDeltaTime;
            if (lastRefresh > 60f && !UIManager.Instance.HasPopup) { lastRefresh = 0f; Refresh(); }
        }
    }

    /// <summary>Wischen zum Drehen des 3D-Brawlers im Hauptmenü; Antippen lässt ihn jubeln.</summary>
    public class StageDragHandler : MonoBehaviour, IDragHandler, IPointerClickHandler
    {
        public void OnDrag(PointerEventData e) { GameFlow.Instance.Stage.Drag(e.delta.x); }
        public void OnPointerClick(PointerEventData e) { if (!e.dragging) GameFlow.Instance.Stage.PlayCheer(); }
    }
}
