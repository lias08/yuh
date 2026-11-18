// ---------------------------------------------------------------------------------------------
// Charakterauswahl (Raster aller Brawler) und Charakterdetails (3D-Vorschau, Werte, Angriff,
// Super, Evolutionsstufen, Level-Upgrade, Freischalten, Skins, Training).
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using BrawlArena.Audio;
using BrawlArena.Core;
using BrawlArena.Data;
using BrawlArena.Rendering;
using BrawlArena.Save;

namespace BrawlArena.UI
{
    public class BrawlersScreen : UIScreen
    {
        protected override void Build()
        {
            var p = SaveSystem.Profile;
            UIFactory.Backdrop(Root, new Color(0.3f, 0.55f, 1f), new Color(0.12f, 0.15f, 0.45f));
            MainMenuScreen.BuildHeader(Root, "Brawler");
            int unlocked = ContentDatabase.Brawlers.FindAll(b => p.IsUnlocked(b)).Count;
            var count = UIFactory.Label(Root, unlocked + " / " + ContentDatabase.Brawlers.Count + " freigeschaltet", 34, Palette.TextDim, TextAnchor.MiddleLeft);
            count.rectTransform.Place(0, 1, 170, -125, 700, 50, 0, 1);

            var content = UIFactory.ScrollList(Root, false, 22, 5, new Vector2(320, 400));
            ((RectTransform)content.parent.parent).Anchor(0, 0, 1, 1, 40, 20, 40, 190);

            var sorted = new List<BrawlerDefinition>(ContentDatabase.Brawlers);
            sorted.Sort((a, b) =>
            {
                bool ua = p.IsUnlocked(a), ub = p.IsUnlocked(b);
                if (ua != ub) return ua ? -1 : 1;
                return a.sortOrder.CompareTo(b.sortOrder);
            });
            foreach (var def in sorted) BuildCard(content, def);
        }

        private void BuildCard(Transform parent, BrawlerDefinition def)
        {
            var p = SaveSystem.Profile;
            bool unlocked = p.IsUnlocked(def);
            var bp = p.Get(def.id);
            Color rc = RarityUtil.GetColor(def.rarity);
            var card = UIFactory.Button(parent, "", unlocked ? Color.Lerp(rc, new Color(0.15f, 0.12f, 0.3f), 0.45f) : new Color(0.25f, 0.25f, 0.32f),
                () => UIManager.Instance.Push<BrawlerDetailScreen>(s => s.Brawler = def), 30);
            var c = card.transform.Find("Face/Content");
            var portrait = UIFactory.Rect(c, "Portrait");
            portrait.Anchor(0, 0.22f, 1, 1, 8, 0, 8, 6);
            var raw = portrait.gameObject.AddComponent<RawImage>();
            raw.texture = PortraitCache.Get(ContentDatabase.CreateSkinned(def, bp.selectedSkin), null, def.id + "|" + bp.selectedSkin);
            raw.raycastTarget = false;
            if (!unlocked) raw.color = new Color(0.25f, 0.25f, 0.3f, 1f);

            var nameBar = UIFactory.Image(c, new Color(0, 0, 0, 0.45f), UIFactory.RoundedSmall, "NameBar");
            nameBar.rectTransform.Anchor(0, 0, 1, 0.22f, 4, 4, 4, 0);
            var nm = UIFactory.Label(nameBar.transform, def.displayName.ToUpper(), 32, unlocked ? Color.white : Palette.TextDim);
            nm.rectTransform.Fill();
            nm.resizeTextForBestFit = true; nm.resizeTextMaxSize = 32; nm.resizeTextMinSize = 16;

            if (unlocked)
            {
                var lv = UIFactory.Image(c, Palette.Blue, UIFactory.Circle, "Level");
                lv.rectTransform.Place(0, 1, 8, -8, 64, 64, 0, 1);
                UIFactory.Label(lv.transform, bp.level.ToString(), 32, Color.white).rectTransform.Fill();
                var tr = UIFactory.Image(c, new Color(0, 0, 0, 0.5f), UIFactory.RoundedSmall, "Trophies");
                tr.rectTransform.Place(1, 1, -8, -8, 130, 52, 1, 1);
                var ti = UIFactory.IconImage(tr.transform, Icon.Trophy, 44);
                ti.rectTransform.Place(0, 0.5f, 4, 0, 44, 44, 0, 0.5f);
                var tt = UIFactory.Label(tr.transform, bp.trophies.ToString(), 28, Palette.Yellow);
                tt.rectTransform.Fill().offsetMin = new Vector2(44, 0);
                if (p.selectedBrawlerId == def.id)
                {
                    var sel = UIFactory.IconImage(c, Icon.Check, 64);
                    sel.rectTransform.Place(1, 0.22f, -6, 6, 64, 64, 1, 0);
                }
                if (ContentDatabase.CustomBrawlerIds.Contains(def.id))
                {
                    var own = UIFactory.Label(c, "EIGENER", 22, Palette.Purple);
                    own.rectTransform.Place(0.5f, 0.22f, 0, 20, 200, 30);
                }
            }
            else
            {
                var lk = UIFactory.IconImage(c, Icon.Lock, 110);
                lk.rectTransform.Place(0.5f, 0.6f, 0, 0, 110, 110);
                var pr = UIFactory.Label(c, RarityUtil.GetName(def.rarity), 26, rc);
                pr.rectTransform.Place(0.5f, 0.35f, 0, 0, 280, 40);
            }
        }
    }

    // =============================================================================== Details
    public class BrawlerDetailScreen : UIScreen
    {
        public BrawlerDefinition Brawler;
        private PreviewStage stage;
        private string previewSkin;

        protected override void Build()
        {
            var def = Brawler;
            var p = SaveSystem.Profile;
            var bp = p.Get(def.id);
            bool unlocked = p.IsUnlocked(def);
            if (previewSkin == null) previewSkin = bp.selectedSkin ?? "";
            Color rc = RarityUtil.GetColor(def.rarity);
            UIFactory.Backdrop(Root, Color.Lerp(rc, new Color(0.2f, 0.25f, 0.6f), 0.55f), new Color(0.1f, 0.1f, 0.3f));
            MainMenuScreen.BuildHeader(Root, def.displayName);

            // ------------------------------------------------ 3D-Vorschau (links)
            if (stage == null) stage = PreviewStage.Create(900, 1000, new Color(0, 0, 0, 0));
            var shown = ContentDatabase.CreateSkinned(def, previewSkin);
            stage.Show(shown);
            var preview = UIFactory.Rect(Root, "Preview").Anchor(0.02f, 0.2f, 0.4f, 0.88f);
            var raw = preview.gameObject.AddComponent<RawImage>();
            raw.texture = stage.Texture;
            preview.gameObject.AddComponent<PreviewDrag>().Stage = stage;

            var rarity = UIFactory.Image(Root, rc, UIFactory.Rounded, "Rarity");
            rarity.rectTransform.Place(0.21f, 0.88f, 0, 0, 380, 60);
            UIFactory.Label(rarity.transform, RarityUtil.GetName(def.rarity).ToUpper() + " • " + def.role.ToUpper(), 28, Color.white).rectTransform.Fill();

            var atkBtn = UIFactory.Button(Root, "Angriff", Palette.Orange, () => stage.PlayAttack(false), 30);
            ((RectTransform)atkBtn.transform).Place(0.12f, 0.12f, 0, 0, 260, 100);
            var supBtn = UIFactory.Button(Root, "Super", Palette.Yellow, () => stage.PlayAttack(true), 30);
            ((RectTransform)supBtn.transform).Place(0.3f, 0.12f, 0, 0, 260, 100);
            var train = UIFactory.Button(Root, "Im Training testen", Palette.Gray, () =>
            {
                if (!unlocked) { UIManager.Instance.Toast("Schalte den Brawler zuerst frei."); return; }
                p.selectedBrawlerId = def.id;
                p.selectedModeId = "training";
                p.selectedMapId = "";
                SaveSystem.Save();
                GameFlow.Instance.StartMatchmaking();
            }, 28, Icon.Play);
            ((RectTransform)train.transform).Place(0.21f, 0.02f, 0, 0, 540, 95, 0.5f, 0);

            // ------------------------------------------------ Info (rechts, scrollbar)
            var list = UIFactory.ScrollList(Root, false, 16);
            ((RectTransform)list.parent.parent).Anchor(0.42f, 0.17f, 0.98f, 0.86f);

            AddText(list, def.description, 32, Palette.TextDim, 110);
            AddStats(list, def, bp.level);
            AddAttackCard(list, "ANGRIFF: " + def.mainAttack.displayName, AttackSummary(def.mainAttack, bp.level), Palette.Orange);
            AddAttackCard(list, "SUPER: " + def.superAbility.displayName, AttackSummary(def.superAbility, bp.level), Palette.Yellow);
            if (def.forms != null && def.forms.Count > 0)
            {
                string trig = TriggerText(def.evolutionTrigger);
                var sb = new System.Text.StringBuilder();
                sb.Append("1) ").Append(def.baseFormName).Append(": ").Append(def.mainAttack.description).Append('\n');
                for (int i = 0; i < def.forms.Count; i++)
                {
                    var f = def.forms[i];
                    sb.Append(i + 2).Append(") ").Append(f.formName).Append(" (").Append(trig).Append(' ').Append(f.threshold).Append("): ");
                    sb.Append(f.overrideMainAttack ? f.mainAttack.description : "stärkere Werte").Append('\n');
                }
                AddAttackCard(list, "EVOLUTION – " + (def.forms.Count + 1) + " FORMEN", sb.ToString(), Palette.Purple);
            }
            if (unlocked) AddSkins(list, def);

            // ------------------------------------------------ Aktionsleiste (unten rechts)
            if (!unlocked)
            {
                var unlock = UIFactory.Button(Root, "Freischalten   " + def.CoinPrice, Palette.Green, () =>
                {
                    if (Economy.UnlockWithCoins(def)) { AudioManager.Sfx(SfxPreset.Confirm); UIManager.Instance.ShowRewards("Neuer Brawler!", new List<Reward> { new Reward { type = RewardType.Brawler, label = def.displayName + " freigeschaltet!" } }, Refresh); }
                    else UIManager.Instance.Toast("Nicht genug Münzen! Spiele Matches oder öffne Boxen.", Palette.Red);
                }, 40, Icon.Coin);
                ((RectTransform)unlock.transform).Place(0.7f, 0.02f, 0, 0, 640, 130, 0.5f, 0);
                return;
            }

            // Level & Upgrade
            var lvlPanel = UIFactory.FancyPanel(Root, Palette.Panel, "LevelPanel");
            lvlPanel.rectTransform.Place(0.42f, 0.02f, 0, 0, 560, 130, 0, 0);
            var lvT = UIFactory.Label(lvlPanel.transform, "LEVEL " + bp.level, 36, Color.white, TextAnchor.MiddleLeft);
            lvT.rectTransform.Anchor(0, 0.5f, 1, 1, 20, 0, 10, 6);
            int ppCost, coinCost;
            bool canUp = Economy.CanUpgrade(bp, out ppCost, out coinCost);
            var ppBar = UIFactory.Bar(lvlPanel.transform, new Color(0.75f, 0.35f, 1f), new Color(0, 0, 0, 0.5f));
            ((RectTransform)ppBar.transform.parent).Anchor(0, 0, 1, 0, 70, 18, 20, -60);
            var ppIc = UIFactory.IconImage(lvlPanel.transform, Icon.PowerPoint, 50);
            ppIc.rectTransform.Place(0, 0, 14, 16, 50, 50, 0, 0);
            if (bp.level >= Economy.MaxBrawlerLevel)
            {
                ppBar.fillAmount = 1f;
                UIFactory.Label(ppBar.transform.parent, "MAX", 26, Color.white).rectTransform.Fill();
            }
            else
            {
                ppBar.fillAmount = Mathf.Clamp01(bp.powerPoints / (float)ppCost);
                UIFactory.Label(ppBar.transform.parent, bp.powerPoints + "/" + ppCost, 26, Color.white).rectTransform.Fill();
            }

            var upBtn = UIFactory.Button(Root, bp.level >= Economy.MaxBrawlerLevel ? "Max." : "Upgrade  " + coinCost, canUp ? Palette.Green : Palette.Gray, () =>
            {
                if (Economy.Upgrade(def.id))
                {
                    AudioManager.Sfx(SfxPreset.SuperReady);
                    UIManager.Instance.Toast(def.displayName + " ist jetzt Level " + bp.level + "!", Palette.Green);
                    Refresh();
                }
                else if (bp.level >= Economy.MaxBrawlerLevel) UIManager.Instance.Toast("Maximales Level erreicht.");
                else UIManager.Instance.Toast(bp.powerPoints < ppCost ? "Zu wenige Kraftpunkte – öffne Boxen oder kaufe sie im Shop." : "Nicht genug Münzen.", Palette.Red);
            }, 34, Icon.Coin);
            ((RectTransform)upBtn.transform).Place(0.42f, 0.02f, 580, 0, 340, 130, 0, 0);

            bool selected = p.selectedBrawlerId == def.id;
            var selBtn = UIFactory.Button(Root, selected ? "Ausgewählt" : "Auswählen", selected ? Palette.Gray : Palette.Yellow, () =>
            {
                p.selectedBrawlerId = def.id;
                bp.selectedSkin = previewSkin != null && (previewSkin == "" || p.OwnsSkin(previewSkin)) ? previewSkin : bp.selectedSkin;
                SaveSystem.Save();
                AudioManager.Sfx(SfxPreset.Confirm);
                UIManager.Instance.Back();
            }, 40, selected ? (Icon?)Icon.Check : null);
            ((RectTransform)selBtn.transform).Place(0.98f, 0.02f, 0, 0, 340, 130, 1, 0);
        }

        private void AddText(Transform list, string text, int size, Color color, float height)
        {
            var t = UIFactory.Label(list, text, size, color, TextAnchor.UpperLeft);
            UIFactory.Layout(t.gameObject, 0, height);
        }

        private void AddStats(Transform list, BrawlerDefinition def, int level)
        {
            float mult = 1f + 0.1f * (level - 1);
            var panel = UIFactory.FancyPanel(list, Palette.Panel, "Stats");
            UIFactory.Layout(panel.gameObject, 0, 250);
            var rows = new[]
            {
                new KeyValuePair<string, string>("Leben", Mathf.RoundToInt(def.maxHealth * mult).ToString()),
                new KeyValuePair<string, string>("Schaden", Mathf.RoundToInt(def.mainAttack.DamagePerUse * mult).ToString()),
                new KeyValuePair<string, string>("Reichweite", RangeText(def.mainAttack.range)),
                new KeyValuePair<string, string>("Tempo", SpeedText(def.moveSpeed)),
                new KeyValuePair<string, string>("Munition", def.maxAmmo.ToString()),
                new KeyValuePair<string, string>("Nachladen", def.reloadTime.ToString("0.0") + " s"),
            };
            for (int i = 0; i < rows.Length; i++)
            {
                float x0 = (i % 2) * 0.5f, y1 = 1f - (i / 2) * 0.33f;
                var cell = UIFactory.Rect(panel.transform, "Stat").Anchor(x0, y1 - 0.33f, x0 + 0.5f, y1, 30, 6, 20, 6);
                var k = UIFactory.Label(cell, rows[i].Key, 30, Palette.TextDim, TextAnchor.MiddleLeft);
                k.rectTransform.Fill();
                var v = UIFactory.Label(cell, rows[i].Value, 34, Color.white, TextAnchor.MiddleRight);
                v.rectTransform.Fill();
            }
        }

        private void AddAttackCard(Transform list, string title, string body, Color color)
        {
            var panel = UIFactory.FancyPanel(list, Palette.Panel, "Card");
            var bar = UIFactory.Image(panel.transform, color, UIFactory.RoundedSmall, "Accent");
            bar.rectTransform.Anchor(0, 0, 0, 1, 10, 14, -22, 12);
            var t = UIFactory.Label(panel.transform, title, 34, color, TextAnchor.UpperLeft);
            t.rectTransform.Anchor(0, 1, 1, 1, 40, -60, 20, 16);
            var b = UIFactory.Label(panel.transform, body, 28, Color.white, TextAnchor.UpperLeft, false);
            b.rectTransform.Anchor(0, 0, 1, 1, 40, 14, 20, 66);
            int lines = 1 + body.Length / 60 + body.Split('\n').Length;
            UIFactory.Layout(panel.gameObject, 0, 90 + lines * 34);
        }

        private void AddSkins(Transform list, BrawlerDefinition def)
        {
            var skins = ContentDatabase.GetSkinsFor(def.id);
            if (skins.Count == 0) return;
            var p = SaveSystem.Profile;
            var title = UIFactory.Label(list, "SKINS", 36, Color.white, TextAnchor.MiddleLeft);
            UIFactory.Layout(title.gameObject, 0, 50);
            var rowBg = UIFactory.Rect(list, "SkinRow");
            UIFactory.Layout(rowBg.gameObject, 0, 330);
            var row = UIFactory.ScrollList(rowBg, true, 16);
            ((RectTransform)row.parent.parent).Fill();
            AddSkinCard(row, def, null);
            foreach (var s in skins) AddSkinCard(row, def, s);
        }

        private void AddSkinCard(Transform row, BrawlerDefinition def, SkinDefinition skin)
        {
            var p = SaveSystem.Profile;
            var bp = p.Get(def.id);
            string id = skin != null ? skin.id : "";
            bool owned = skin == null || p.OwnsSkin(skin.id);
            bool equipped = (bp.selectedSkin ?? "") == id;
            bool previewing = previewSkin == id;
            var card = UIFactory.Button(row, "", previewing ? Palette.Blue : Palette.PanelLight, () =>
            {
                previewSkin = id;
                if (owned)
                {
                    bp.selectedSkin = id;
                    SaveSystem.Save();
                    Refresh();
                    return;
                }
                UIManager.Instance.Confirm("Skin kaufen", skin.displayName + " für " + skin.gemPrice + " Edelsteine kaufen?", "Kaufen", () =>
                {
                    if (Economy.BuySkin(skin)) { bp.selectedSkin = skin.id; SaveSystem.Save(); AudioManager.Sfx(SfxPreset.Confirm); }
                    else UIManager.Instance.Toast("Nicht genug Edelsteine.", Palette.Red);
                    Refresh();
                });
                Refresh();
            }, 26);
            UIFactory.Layout(card.gameObject, 250, 0);
            var c = card.transform.Find("Face/Content");
            var raw = UIFactory.Rect(c, "Portrait").Anchor(0, 0.28f, 1, 1, 6, 0, 6, 4).gameObject.AddComponent<RawImage>();
            raw.raycastTarget = false;
            raw.texture = PortraitCache.Get(def, skin != null ? skin.appearance : def.appearance, def.id + "|" + id);
            var nm = UIFactory.Label(c, skin != null ? skin.displayName : "Standard", 26, Color.white);
            nm.rectTransform.Anchor(0, 0.12f, 1, 0.3f);
            string status = equipped ? "AUSGERÜSTET" : owned ? "Besitzt du" : skin.gemPrice + " Edelsteine";
            var st = UIFactory.Label(c, status, 22, equipped ? Palette.Green : owned ? Palette.TextDim : Palette.Green);
            st.rectTransform.Anchor(0, 0, 1, 0.14f);
        }

        public static string RangeText(float r) { return r >= 9f ? "Sehr weit" : r >= 7f ? "Weit" : r >= 4.5f ? "Mittel" : "Kurz"; }
        public static string SpeedText(float s) { return s >= 3.4f ? "Sehr schnell" : s >= 3.2f ? "Schnell" : s >= 2.9f ? "Normal" : "Langsam"; }

        public static string TriggerText(EvolutionTrigger t)
        {
            switch (t)
            {
                case EvolutionTrigger.SuperUses: return "nach Supers:";
                case EvolutionTrigger.Kills: return "nach K.O.s:";
                case EvolutionTrigger.MatchTime: return "nach Sekunden:";
                case EvolutionTrigger.BrawlerLevel: return "ab Level";
                case EvolutionTrigger.DamageDealt: return "nach Schaden:";
            }
            return "";
        }

        public static string AttackSummary(AttackSpec a, int level)
        {
            float mult = 1f + 0.1f * (level - 1);
            var sb = new System.Text.StringBuilder();
            if (!string.IsNullOrEmpty(a.description)) sb.Append(a.description).Append('\n');
            if (a.DamagePerUse > 0f) sb.Append("Schaden: ").Append(Mathf.RoundToInt(a.DamagePerUse * mult)).Append("   ");
            if (a.healAmount > 0f) sb.Append("Heilung: ").Append(Mathf.RoundToInt(a.healAmount * mult)).Append("   ");
            sb.Append("Reichweite: ").Append(RangeText(a.range));
            if (a.comboSteps != null && a.comboSteps.Count > 0) sb.Append("   Schläge: ").Append(a.comboSteps.Count);
            if (a.destroysWalls) sb.Append("   Zerstört Wände");
            if (a.slowDuration > 0f) sb.Append("   Verlangsamt");
            if (a.stunDuration > 0f) sb.Append("   Betäubt");
            return sb.ToString();
        }

        private void OnDestroy() { if (stage != null) Destroy(stage.gameObject); }
    }

    /// <summary>Dreht eine Vorschau-Bühne per Wischen.</summary>
    public class PreviewDrag : MonoBehaviour, IDragHandler
    {
        public PreviewStage Stage;
        public void OnDrag(PointerEventData e) { if (Stage != null) Stage.Drag(e.delta.x); }
    }
}
