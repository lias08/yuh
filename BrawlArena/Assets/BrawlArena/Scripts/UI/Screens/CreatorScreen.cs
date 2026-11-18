// ---------------------------------------------------------------------------------------------
// CreatorScreen – Charakter-Editor IM SPIEL (ohne Programmierkenntnisse, direkt auf dem Handy).
// Name, Rolle, Seltenheit, Körperform, Kopfbedeckung, Waffe, Gesicht, Größe, Farben,
// Animationsstil, alle Werte, Hauptangriff (inkl. Kombo-Schläge mit Energiewelle), Super und
// Sounds sind einstellbar. Die 3D-Vorschau aktualisiert sich live.
// Gespeicherte Brawler sind sofort spielbar (gespeichert als JSON im App-Speicher).
// Für eigene 3D-Modelle/Animationen: BrawlerDefinition-Assets im Unity-Editor verwenden.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using BrawlArena.Audio;
using BrawlArena.Core;
using BrawlArena.Data;
using BrawlArena.Rendering;
using BrawlArena.Save;

namespace BrawlArena.UI
{
    public class CreatorScreen : UIScreen
    {
        private static readonly Color[] Swatches =
        {
            new Color(0.95f, 0.25f, 0.25f), new Color(1f, 0.55f, 0.15f), new Color(1f, 0.85f, 0.2f), new Color(0.55f, 0.9f, 0.25f),
            new Color(0.2f, 0.75f, 0.35f), new Color(0.2f, 0.8f, 0.8f), new Color(0.25f, 0.55f, 1f), new Color(0.3f, 0.3f, 0.85f),
            new Color(0.65f, 0.35f, 1f), new Color(1f, 0.45f, 0.75f), new Color(1f, 0.82f, 0.66f), new Color(0.85f, 0.62f, 0.45f),
            new Color(0.55f, 0.38f, 0.25f), new Color(0.95f, 0.95f, 0.97f), new Color(0.55f, 0.55f, 0.6f), new Color(0.12f, 0.12f, 0.16f)
        };
        private static readonly string[] Tabs = { "Aussehen", "Farben", "Werte", "Angriff", "Super", "Sound" };

        private BrawlerDefinition def;
        private int tab;
        private PreviewStage stage;
        private bool previewDirty = true;
        private float previewTimer;
        private int comboHits = 0;
        private bool comboWave;

        protected override void Build()
        {
            if (def == null) NewFromTemplate(ContentDatabase.GetBrawler("funke") ?? ContentDatabase.Brawlers[0], true);
            UIFactory.Backdrop(Root, new Color(0.55f, 0.35f, 0.95f), new Color(0.12f, 0.08f, 0.3f));
            MainMenuScreen.BuildHeader(Root, "Charakter-Editor");

            // ---- Vorschau
            if (stage == null) stage = PreviewStage.Create(800, 1000, new Color(0, 0, 0, 0));
            var preview = UIFactory.Rect(Root, "Preview").Anchor(0.01f, 0.16f, 0.34f, 0.87f);
            var raw = preview.gameObject.AddComponent<RawImage>();
            raw.texture = stage.Texture;
            preview.gameObject.AddComponent<PreviewDrag>().Stage = stage;
            var nameT = UIFactory.Label(Root, def.displayName, 44, RarityUtil.GetColor(def.rarity));
            nameT.rectTransform.Place(0.175f, 0.87f, 0, 10, 600, 60, 0.5f, 0);
            previewDirty = true;

            var a1 = UIFactory.Button(Root, "Angriff", Palette.Orange, () => stage.PlayAttack(false), 26);
            ((RectTransform)a1.transform).Place(0.09f, 0.16f, 0, 0, 220, 80, 0.5f, 1);
            var a2 = UIFactory.Button(Root, "Super", Palette.Yellow, () => stage.PlayAttack(true), 26);
            ((RectTransform)a2.transform).Place(0.26f, 0.16f, 0, 0, 220, 80, 0.5f, 1);

            // ---- Aktionsleiste unten
            float x = 20;
            AddAction("Neu", Palette.Blue, Icon.Plus, () => OpenTemplatePicker(), ref x);
            AddAction("Meine", Palette.Purple, Icon.Users, OpenMyBrawlers, ref x);
            AddAction("Speichern", Palette.Green, Icon.Check, () => Save(), ref x);
            AddAction("Testen", Palette.Orange, Icon.Play, () => { if (Save()) StartTraining(); }, ref x);

            // ---- Reiter
            for (int i = 0; i < Tabs.Length; i++)
            {
                int idx = i;
                var b = UIFactory.Button(Root, Tabs[i], i == tab ? Palette.Yellow : Palette.PanelLight, () => { tab = idx; Refresh(); }, 28);
                float w = 0.62f / Tabs.Length;
                ((RectTransform)b.transform).Anchor(0.36f + w * i, 0.78f, 0.36f + w * (i + 1), 0.87f, 4, 0, 4, 0);
            }
            var list = UIFactory.ScrollList(Root, false, 12);
            ((RectTransform)list.parent.parent).Anchor(0.36f, 0.02f, 0.98f, 0.77f);
            switch (tab)
            {
                case 0: BuildLook(list); break;
                case 1: BuildColors(list); break;
                case 2: BuildStats(list); break;
                case 3: BuildAttack(list, def.mainAttack, false); break;
                case 4: BuildAttack(list, def.superAbility, true); break;
                case 5: BuildSound(list); break;
            }
        }

        private void AddAction(string label, Color c, Icon icon, Action a, ref float x)
        {
            var b = UIFactory.Button(Root, label, c, a, 28, icon);
            ((RectTransform)b.transform).Place(0, 0, x, 18, 160, 95, 0, 0);
            x += 168;
        }

        // ================================================================== Reiter
        private void BuildLook(Transform list)
        {
            var a = def.appearance;
            TextRow(list, "Name", def.displayName, 16, v => { def.displayName = v; Refresh(); });
            TextRow(list, "Rolle", def.role, 20, v => def.role = v);
            EnumRow(list, "Seltenheit", def.rarity, v => { def.rarity = v; Refresh(); }, RarityUtil.GetName);
            EnumRow(list, "Körperform", a.bodyShape, v => { a.bodyShape = v; Dirty(); }, BodyName);
            EnumRow(list, "Kopfbedeckung", a.hat, v => { a.hat = v; Dirty(); }, HatName);
            EnumRow(list, "Waffe", a.weapon, v => { a.weapon = v; Dirty(); }, WeaponName);
            EnumRow(list, "Gesicht", a.face, v => { a.face = v; Dirty(); }, FaceName);
            ToggleRow(list, "Rucksack", a.backpack, v => { a.backpack = v; Dirty(); });
            ToggleRow(list, "Umhang", a.cape, v => { a.cape = v; Dirty(); });
            SliderRow(list, "Größe", 0.7f, 1.4f, a.size, 0.05f, "0.00", v => { a.size = v; Dirty(); });
            SliderRow(list, "Kopfgröße", 0.7f, 1.4f, a.headSize, 0.05f, "0.00", v => { a.headSize = v; Dirty(); });
            EnumRow(list, "Animationsstil", def.animations.style, v => { def.animations.style = v; Dirty(); }, AnimName);
            SliderRow(list, "Schrittgeschwindigkeit", 0.5f, 2f, def.animations.walkCycleSpeed, 0.1f, "0.0", v => def.animations.walkCycleSpeed = v);
            SliderRow(list, "Hüpfen", 0f, 2f, def.animations.bounceAmount, 0.1f, "0.0", v => def.animations.bounceAmount = v);
        }

        private void BuildColors(Transform list)
        {
            var a = def.appearance;
            ColorRow(list, "Hauptfarbe", c => { a.primaryColor = c; Dirty(); });
            ColorRow(list, "Zweitfarbe", c => { a.secondaryColor = c; Dirty(); });
            ColorRow(list, "Haut", c => { a.skinColor = c; Dirty(); });
            ColorRow(list, "Kopfbedeckung", c => { a.hatColor = c; Dirty(); });
            ColorRow(list, "Augen", c => { a.eyeColor = c; Dirty(); });
            ColorRow(list, "Waffe", c => { a.weaponColor = c; Dirty(); });
        }

        private void BuildStats(Transform list)
        {
            SliderRow(list, "Lebenspunkte", 1500, 9000, def.maxHealth, 100, "0", v => def.maxHealth = v);
            SliderRow(list, "Bewegungstempo", 2.2f, 4.2f, def.moveSpeed, 0.1f, "0.0", v => def.moveSpeed = v);
            SliderRow(list, "Munition", 1, 5, def.maxAmmo, 1, "0", v => def.maxAmmo = Mathf.RoundToInt(v));
            SliderRow(list, "Nachladezeit (s)", 0.5f, 3f, def.reloadTime, 0.1f, "0.0", v => def.reloadTime = v);
            SliderRow(list, "Angriffspause (s)", 0.15f, 1.2f, def.attackCooldown, 0.05f, "0.00", v => def.attackCooldown = v);
            SliderRow(list, "Treffer bis Super", 2, 10, def.hitsToChargeSuper, 1, "0", v => def.hitsToChargeSuper = v);
            var hint = UIFactory.Label(list, "Tipp: Viel Leben + kurze Reichweite = Panzer, wenig Leben + große Reichweite = Scharfschütze.", 26, Palette.TextDim);
            UIFactory.Layout(hint.gameObject, 0, 90);
        }

        private static readonly AttackKind[] MainKinds = { AttackKind.Shot, AttackKind.Lob, AttackKind.Melee, AttackKind.Beam, AttackKind.Boomerang, AttackKind.Nova };
        private static readonly AttackKind[] SuperKinds = { AttackKind.Shot, AttackKind.Lob, AttackKind.Melee, AttackKind.Beam, AttackKind.Boomerang, AttackKind.Nova, AttackKind.Dash, AttackKind.Leap, AttackKind.HealZone, AttackKind.DamageZone, AttackKind.Turret, AttackKind.Shield };

        private void BuildAttack(Transform list, AttackSpec s, bool isSuper)
        {
            TextRow(list, "Name", s.displayName, 24, v => s.displayName = v);
            var kinds = isSuper ? SuperKinds : MainKinds;
            int kIdx = Mathf.Max(0, Array.IndexOf(kinds, s.kind));
            var names = new string[kinds.Length];
            for (int i = 0; i < kinds.Length; i++) names[i] = KindName(kinds[i]);
            CycleRow(list, "Angriffsart", names, kIdx, i => { s.kind = kinds[i]; ApplyKindDefaults(s); Refresh(); });
            var desc = UIFactory.Label(list, KindHelp(s.kind), 26, Palette.TextDim);
            UIFactory.Layout(desc.gameObject, 0, 70);

            bool zone = s.kind == AttackKind.HealZone;
            if (!zone || s.damage > 0) SliderRow(list, s.kind == AttackKind.DamageZone ? "Schaden pro Tick" : "Schaden", 0, 3000, s.damage, 50, "0", v => s.damage = v);
            SliderRow(list, "Reichweite", 1.5f, 12f, s.range, 0.5f, "0.0", v => s.range = v);
            switch (s.kind)
            {
                case AttackKind.Shot:
                case AttackKind.Boomerang:
                case AttackKind.Nova:
                    SliderRow(list, "Projektile", 1, s.kind == AttackKind.Nova ? 20 : 9, s.projectileCount, 1, "0", v => s.projectileCount = Mathf.RoundToInt(v));
                    if (s.kind != AttackKind.Nova) SliderRow(list, "Streuung (°)", 0, 90, s.spreadAngle, 2, "0", v => s.spreadAngle = v);
                    SliderRow(list, "Salven", 1, 5, s.burstCount, 1, "0", v => s.burstCount = Mathf.RoundToInt(v));
                    SliderRow(list, "Projektiltempo", 6, 22, s.projectileSpeed, 1, "0", v => s.projectileSpeed = v);
                    SliderRow(list, "Projektilgröße", 0.1f, 1f, s.projectileRadius, 0.05f, "0.00", v => s.projectileRadius = v);
                    ToggleRow(list, "Durchdringt Gegner", s.pierce, v => s.pierce = v);
                    if (s.kind == AttackKind.Shot) SliderRow(list, "Abpraller an Wänden", 0, 3, s.bounces, 1, "0", v => s.bounces = Mathf.RoundToInt(v));
                    EnumRow(list, "Optik", s.visual, v => s.visual = v, VisualName);
                    break;
                case AttackKind.Lob:
                    SliderRow(list, "Explosionsradius", 0.6f, 3.5f, s.areaRadius, 0.1f, "0.0", v => s.areaRadius = v);
                    SliderRow(list, "Anzahl Bomben", 1, 8, s.projectileCount, 1, "0", v => s.projectileCount = Mathf.RoundToInt(v));
                    EnumRow(list, "Optik", s.visual, v => s.visual = v, VisualName);
                    break;
                case AttackKind.Melee:
                    SliderRow(list, "Schlagbogen (°)", 40, 360, s.spreadAngle > 1 ? s.spreadAngle : 100, 10, "0", v => { s.spreadAngle = v; RebuildCombo(s); });
                    comboHits = s.comboSteps.Count;
                    comboWave = comboHits > 0 && s.comboSteps[comboHits - 1].firesWave;
                    SliderRow(list, "Schläge pro Munition (Kombo)", 1, 5, Mathf.Max(1, comboHits), 1, "0", v => { comboHits = Mathf.RoundToInt(v); RebuildCombo(s); });
                    ToggleRow(list, "Letzter Schlag feuert Energiewelle", comboWave, v => { comboWave = v; RebuildCombo(s); });
                    break;
                case AttackKind.Beam:
                    SliderRow(list, "Strahlbreite", 0.15f, 1.2f, s.projectileRadius, 0.05f, "0.00", v => s.projectileRadius = v);
                    ToggleRow(list, "Durchdringt Gegner", s.pierce, v => s.pierce = v);
                    break;
                case AttackKind.Dash:
                    SliderRow(list, "Sturmtempo", 8, 22, s.projectileSpeed, 1, "0", v => s.projectileSpeed = v);
                    SliderRow(list, "Rückstoß", 0, 3, s.knockback, 0.1f, "0.0", v => s.knockback = v);
                    break;
                case AttackKind.Leap:
                    SliderRow(list, "Aufprallradius", 0.8f, 3.5f, s.areaRadius, 0.1f, "0.0", v => s.areaRadius = v);
                    SliderRow(list, "Betäubung (s)", 0, 2, s.stunDuration, 0.1f, "0.0", v => s.stunDuration = v);
                    break;
                case AttackKind.HealZone:
                case AttackKind.DamageZone:
                    SliderRow(list, "Radius", 1f, 4f, s.areaRadius, 0.1f, "0.0", v => s.areaRadius = v);
                    SliderRow(list, "Dauer (s)", 1f, 10f, s.duration, 0.5f, "0.0", v => s.duration = v);
                    if (s.kind == AttackKind.HealZone) SliderRow(list, "Heilung pro Tick", 50, 1200, s.healAmount, 25, "0", v => s.healAmount = v);
                    break;
                case AttackKind.Turret:
                    SliderRow(list, "Turm-Lebenspunkte", 1000, 6000, s.turretHealth, 100, "0", v => s.turretHealth = v);
                    SliderRow(list, "Turm-Dauer (s)", 4, 25, s.duration, 1, "0", v => s.duration = v);
                    SliderRow(list, "Schussintervall (s)", 0.25f, 1.5f, s.tickInterval, 0.05f, "0.00", v => s.tickInterval = v);
                    break;
                case AttackKind.Shield:
                    SliderRow(list, "Schadensreduktion (%)", 10, 90, s.shieldPercent, 5, "0", v => s.shieldPercent = v);
                    SliderRow(list, "Dauer (s)", 1, 8, s.duration, 0.5f, "0.0", v => s.duration = v);
                    SliderRow(list, "Sofortheilung", 0, 3000, s.healAmount, 100, "0", v => s.healAmount = v);
                    break;
            }
            if (s.kind != AttackKind.HealZone && s.kind != AttackKind.Shield && s.kind != AttackKind.Turret)
            {
                SliderRow(list, "Verlangsamung (%)", 0, 80, s.slowPercent, 5, "0", v => { s.slowPercent = v; s.slowDuration = v > 0 ? 1.5f : 0f; });
                ToggleRow(list, "Zerstört Wände", s.destroysWalls, v => s.destroysWalls = v);
            }
            ColorRow(list, "Effektfarbe", c => s.color = c);
        }

        private void BuildSound(Transform list)
        {
            var snd = def.sounds;
            EnumRow(list, "Angriffs-Sound", snd.attackFallback, v => { snd.attackFallback = v; AudioManager.Sfx(v, null, 1f, snd.pitch); }, x => x.ToString());
            EnumRow(list, "Super-Sound", snd.superFallback, v => { snd.superFallback = v; AudioManager.Sfx(v, null, 1f, snd.pitch); }, x => x.ToString());
            EnumRow(list, "Treffer-Sound", snd.hurtFallback, v => { snd.hurtFallback = v; AudioManager.Sfx(v, null, 1f, snd.pitch); }, x => x.ToString());
            SliderRow(list, "Tonhöhe", 0.6f, 1.6f, snd.pitch, 0.05f, "0.00", v => snd.pitch = v);
            var play = UIFactory.Button(list, "Probehören", Palette.Blue, () => AudioManager.Sfx(snd.attackFallback, null, 1f, snd.pitch), 32, Icon.Play);
            UIFactory.Layout(play.gameObject, 0, 110);
            var note = UIFactory.Label(list, "Eigene Audiodateien (WAV/OGG) können im Unity-Editor im Brawler-Asset eingetragen werden.", 26, Palette.TextDim);
            UIFactory.Layout(note.gameObject, 0, 80);
        }

        // ================================================================== Kombo & Standardwerte
        private void RebuildCombo(AttackSpec s)
        {
            s.comboSteps.Clear();
            int n = Mathf.Max(1, comboHits);
            if (n <= 1 && !comboWave) return; // einfacher Hieb ohne Kombo
            float perHit = s.damage / n * 1.15f;
            float arc = s.spreadAngle > 1 ? s.spreadAngle : 110f;
            for (int i = 0; i < n; i++)
            {
                var st = new ComboStep
                {
                    delay = i * 0.13f, damage = perHit, range = s.range, arcAngle = arc, lunge = 0.2f,
                    swing = i % 2 == 0 ? SwingDirection.LeftToRight : SwingDirection.RightToLeft
                };
                if (i == n - 1 && comboWave)
                {
                    st.swing = SwingDirection.Overhead; st.firesWave = true;
                    st.waveDamage = s.damage * 0.8f; st.waveRange = Mathf.Max(5f, s.range * 2.5f); st.waveWidth = 0.6f; st.waveColor = s.color;
                }
                s.comboSteps.Add(st);
            }
        }

        private static void ApplyKindDefaults(AttackSpec s)
        {
            switch (s.kind)
            {
                case AttackKind.Melee: s.range = Mathf.Min(s.range, 3f); s.spreadAngle = 110; break;
                case AttackKind.Lob: s.areaRadius = Mathf.Max(1.2f, s.areaRadius); s.projectileSpeed = 10; s.visual = ProjectileVisual.Bomb; break;
                case AttackKind.Dash: s.projectileSpeed = 15; s.range = Mathf.Clamp(s.range, 4, 8); break;
                case AttackKind.HealZone: s.healAmount = Mathf.Max(300, s.healAmount); s.damage = 0; s.areaRadius = 2.3f; s.duration = 5; s.tickInterval = 0.5f; break;
                case AttackKind.DamageZone: s.damage = Mathf.Min(s.damage, 400); s.areaRadius = 2.2f; s.duration = 4; s.tickInterval = 0.5f; break;
                case AttackKind.Turret: s.turretHealth = 3000; s.duration = 12; s.tickInterval = 0.6f; s.damage = Mathf.Min(s.damage, 400); break;
                case AttackKind.Shield: s.shieldPercent = 50; s.duration = 4; break;
                case AttackKind.Nova: s.projectileCount = Mathf.Max(8, s.projectileCount); break;
            }
            if (s.kind != AttackKind.Melee) s.comboSteps.Clear();
        }

        // ================================================================== Speichern / Laden
        private void NewFromTemplate(BrawlerDefinition template, bool silent)
        {
            def = template.CreateRuntimeCopy();
            def.forms = new List<BrawlerForm>();
            def.portrait = null;
            def.unlockedByDefault = true;
            if (!ContentDatabase.CustomBrawlerIds.Contains(template.id))
            {
                def.id = "";
                def.displayName = "Mein " + template.displayName;
                def.sortOrder = 500;
            }
            previewDirty = true;
            if (!silent) Refresh();
        }

        private bool Save()
        {
            if (string.IsNullOrEmpty(def.displayName) || def.displayName.Trim().Length < 2) { UIManager.Instance.Toast("Bitte gib einen Namen ein.", Palette.Red); return false; }
            if (string.IsNullOrEmpty(def.id))
            {
                string baseId = "custom_" + Sanitize(def.displayName);
                string id = baseId; int n = 2;
                while (ContentDatabase.GetBrawler(id) != null) id = baseId + "_" + n++;
                def.id = id;
            }
            def.name = def.id;
            def.description = "Eigener Brawler: " + def.mainAttack.displayName + " / " + def.superAbility.displayName;
            if (string.IsNullOrEmpty(def.mainAttack.description)) def.mainAttack.description = KindHelp(def.mainAttack.kind);
            if (string.IsNullOrEmpty(def.superAbility.description)) def.superAbility.description = KindHelp(def.superAbility.kind);
            ContentDatabase.SaveCustomBrawler(def);
            var p = SaveSystem.Profile;
            p.Get(def.id).unlocked = true;
            SaveSystem.Save();
            PortraitCache.Invalidate(def.id);
            PortraitCache.Invalidate(def.id + "|");
            PortraitCache.Invalidate(def.id + "|" + p.Get(def.id).selectedSkin);
            AudioManager.Sfx(SfxPreset.Confirm);
            UIManager.Instance.Toast(def.displayName + " gespeichert – jetzt in der Brawler-Liste!", Palette.Green);
            // Arbeitskopie lösen, damit weitere Änderungen nicht ungespeichert ins Spiel gelangen
            def = def.CreateRuntimeCopy();
            return true;
        }

        private void StartTraining()
        {
            var p = SaveSystem.Profile;
            p.selectedBrawlerId = def.id;
            p.selectedModeId = "training";
            p.selectedMapId = "";
            SaveSystem.Save();
            GameFlow.Instance.StartMatchmaking();
        }

        private static string Sanitize(string s)
        {
            var sb = new System.Text.StringBuilder();
            foreach (char c in s.ToLowerInvariant())
            {
                if (c >= 'a' && c <= 'z' || c >= '0' && c <= '9') sb.Append(c);
                else if (c == 'ä') sb.Append("ae"); else if (c == 'ö') sb.Append("oe"); else if (c == 'ü') sb.Append("ue"); else if (c == 'ß') sb.Append("ss");
                else if (c == ' ' || c == '-') sb.Append('_');
            }
            return sb.Length > 0 ? sb.ToString() : "brawler";
        }

        private void OpenTemplatePicker()
        {
            GameObject popup;
            var c = UIManager.Instance.OpenPopup("Vorlage wählen", 1300, 860, out popup);
            var grid = UIFactory.ScrollList(c, false, 14, 4, new Vector2(270, 300));
            ((RectTransform)grid.parent.parent).Fill();
            foreach (var b in ContentDatabase.Brawlers)
            {
                var t = b;
                var card = UIFactory.Button(grid, "", Color.Lerp(RarityUtil.GetColor(b.rarity), Palette.Panel, 0.5f), () =>
                {
                    UIManager.Instance.ClosePopup(popup);
                    NewFromTemplate(t, false);
                }, 24);
                var cc = card.transform.Find("Face/Content");
                var raw = UIFactory.Rect(cc, "P").Anchor(0, 0.22f, 1, 1).gameObject.AddComponent<RawImage>();
                raw.texture = PortraitCache.Get(b); raw.raycastTarget = false;
                UIFactory.Label(cc, b.displayName, 26, Color.white).rectTransform.Anchor(0, 0, 1, 0.22f);
            }
        }

        private void OpenMyBrawlers()
        {
            GameObject popup;
            var c = UIManager.Instance.OpenPopup("Meine Brawler", 1200, 800, out popup);
            var list = UIFactory.ScrollList(c, false, 12);
            ((RectTransform)list.parent.parent).Fill();
            if (ContentDatabase.CustomBrawlerIds.Count == 0)
            {
                var t = UIFactory.Label(list, "Noch keine eigenen Brawler. Erstelle einen und tippe auf „Speichern“!", 32, Palette.TextDim);
                UIFactory.Layout(t.gameObject, 0, 120);
            }
            foreach (var id in new List<string>(ContentDatabase.CustomBrawlerIds))
            {
                var b = ContentDatabase.GetBrawler(id);
                if (b == null) continue;
                var row = UIFactory.FancyPanel(list, Palette.PanelLight, "Row");
                UIFactory.Layout(row.gameObject, 0, 130);
                var raw = UIFactory.Rect(row.transform, "P").Place(0, 0.5f, 14, 0, 110, 110, 0, 0.5f).gameObject.AddComponent<RawImage>();
                raw.texture = PortraitCache.Get(b);
                UIFactory.Label(row.transform, b.displayName, 36, Color.white, TextAnchor.MiddleLeft).rectTransform.Anchor(0, 0, 0.5f, 1, 140, 0, 0, 0);
                var edit = UIFactory.Button(row.transform, "Bearbeiten", Palette.Blue, () =>
                {
                    UIManager.Instance.ClosePopup(popup);
                    def = b.CreateRuntimeCopy();
                    previewDirty = true;
                    Refresh();
                }, 28, Icon.Pencil);
                ((RectTransform)edit.transform).Place(1, 0.5f, -230, 0, 300, 100, 1, 0.5f);
                var del = UIFactory.IconButton(row.transform, Icon.Skull, Palette.Red, () =>
                    UIManager.Instance.Confirm("Löschen?", b.displayName + " endgültig löschen?", "Löschen", () =>
                    {
                        ContentDatabase.DeleteCustomBrawler(b.id);
                        GameFlow.Instance.ValidateSelection();
                        SaveSystem.Save();
                        UIManager.Instance.ClosePopup(popup);
                        OpenMyBrawlers();
                    }, Palette.Red), 100);
                ((RectTransform)del.transform).Place(1, 0.5f, -16, 0, 100, 100, 1, 0.5f);
            }
        }

        // ================================================================== Steuerelemente
        private RectTransform Row(Transform list, string label, float height = 110)
        {
            var row = UIFactory.FancyPanel(list, Palette.Panel, "Row");
            UIFactory.Layout(row.gameObject, 0, height);
            var t = UIFactory.Label(row.transform, label, 32, Color.white, TextAnchor.MiddleLeft);
            t.rectTransform.Anchor(0, 0, 0.4f, 1, 26, 0, 0, 0);
            return row.rectTransform;
        }

        private void SliderRow(Transform list, string label, float min, float max, float value, float step, string fmt, Action<float> onChange)
        {
            var row = Row(list, label);
            var val = UIFactory.Label(row, value.ToString(fmt), 32, Palette.Yellow, TextAnchor.MiddleRight);
            val.rectTransform.Anchor(0.82f, 0, 1, 1, 0, 0, 26, 0);
            var s = UIFactory.Slider(row, min, max, Mathf.Clamp(value, min, max), null, Palette.Yellow);
            ((RectTransform)s.transform).Anchor(0.4f, 0.15f, 0.82f, 0.85f, 10, 0, 10, 0);
            s.onValueChanged.AddListener(v =>
            {
                float q = step > 0 ? Mathf.Round(v / step) * step : v;
                val.text = q.ToString(fmt);
                onChange(q);
            });
        }

        private void ToggleRow(Transform list, string label, bool value, Action<bool> onChange)
        {
            var row = Row(list, label);
            row.GetComponentInChildren<Text>().rectTransform.Anchor(0, 0, 0.8f, 1, 26, 0, 0, 0);
            var t = UIFactory.Toggle(row, value, onChange);
            ((RectTransform)t.transform).Place(1, 0.5f, -30, 0, 150, 70, 1, 0.5f);
        }

        private void TextRow(Transform list, string label, string value, int max, Action<string> onEnd)
        {
            var row = Row(list, label);
            var f = UIFactory.Input(row, value, max, onEnd);
            ((RectTransform)f.transform).Anchor(0.4f, 0.12f, 1, 0.88f, 10, 0, 26, 0);
        }

        private void CycleRow(Transform list, string label, string[] options, int index, Action<int> onChange)
        {
            var row = Row(list, label);
            var val = UIFactory.Label(row, options[Mathf.Clamp(index, 0, options.Length - 1)], 32, Palette.Yellow);
            val.rectTransform.Anchor(0.5f, 0, 0.88f, 1);
            int cur = index;
            Action<int> step = d =>
            {
                cur = (cur + d + options.Length) % options.Length;
                val.text = options[cur];
                onChange(cur);
            };
            var prev = UIFactory.IconButton(row, Icon.Back, Palette.Blue, () => step(-1), 86);
            ((RectTransform)prev.transform).Place(0.4f, 0.5f, 10, 0, 86, 86, 0, 0.5f);
            var next = UIFactory.IconButton(row, Icon.Play, Palette.Blue, () => step(1), 86);
            ((RectTransform)next.transform).Place(1, 0.5f, -20, 0, 86, 86, 1, 0.5f);
        }

        private void EnumRow<T>(Transform list, string label, T value, Action<T> onChange, Func<T, string> name) where T : struct
        {
            var values = (T[])Enum.GetValues(typeof(T));
            var names = new string[values.Length];
            int idx = 0;
            for (int i = 0; i < values.Length; i++) { names[i] = name(values[i]); if (values[i].Equals(value)) idx = i; }
            CycleRow(list, label, names, idx, i => onChange(values[i]));
        }

        private void ColorRow(Transform list, string label, Action<Color> onPick)
        {
            var row = Row(list, label, 150);
            row.GetComponentInChildren<Text>().rectTransform.Anchor(0, 0, 0.25f, 1, 26, 0, 0, 0);
            for (int i = 0; i < Swatches.Length; i++)
            {
                var c = Swatches[i];
                var b = UIFactory.Image(row, c, UIFactory.Circle, "Swatch");
                float w = 0.73f / 8f;
                int col = i % 8, line = i / 8;
                b.rectTransform.Anchor(0.25f + w * col, line == 0 ? 0.5f : 0.05f, 0.25f + w * (col + 1), line == 0 ? 0.95f : 0.5f, 6, 3, 6, 3);
                b.raycastTarget = true;
                var btn = b.gameObject.AddComponent<Button>();
                btn.targetGraphic = b;
                btn.onClick.AddListener(() => { AudioManager.UiClick(); onPick(c); });
                b.gameObject.AddComponent<ButtonPressFx>();
            }
        }

        private void Dirty() { previewDirty = true; }

        private void Update()
        {
            previewTimer -= Time.unscaledDeltaTime;
            if (previewDirty && previewTimer <= 0f && stage != null && def != null)
            {
                previewDirty = false;
                previewTimer = 0.15f;
                stage.Show(def.appearance, def.animations);
            }
        }

        private void OnDestroy() { if (stage != null) Destroy(stage.gameObject); }

        // ================================================================== Anzeigenamen
        private static string BodyName(BodyShape b) { switch (b) { case BodyShape.Round: return "Rund"; case BodyShape.Tall: return "Groß & schlank"; case BodyShape.Stocky: return "Kräftig"; case BodyShape.Robot: return "Roboter"; case BodyShape.Tiny: return "Winzig"; default: return "Knubbel"; } }
        private static string HatName(HatStyle h)
        {
            switch (h)
            {
                case HatStyle.None: return "Keine"; case HatStyle.Cap: return "Kappe"; case HatStyle.Crown: return "Krone"; case HatStyle.Horns: return "Hörner";
                case HatStyle.Helmet: return "Helm"; case HatStyle.WizardHat: return "Zauberhut"; case HatStyle.Mohawk: return "Irokese"; case HatStyle.Antenna: return "Antenne";
                case HatStyle.Bandana: return "Stirnband"; case HatStyle.CowboyHat: return "Cowboyhut"; case HatStyle.Halo: return "Heiligenschein"; default: return "Tierohren";
            }
        }
        private static string WeaponName(WeaponStyle w)
        {
            switch (w)
            {
                case WeaponStyle.None: return "Keine"; case WeaponStyle.Pistol: return "Pistole"; case WeaponStyle.Shotgun: return "Schrotflinte"; case WeaponStyle.Staff: return "Stab";
                case WeaponStyle.Bomb: return "Bombe"; case WeaponStyle.Sword: return "Schwert"; case WeaponStyle.Gloves: return "Handschuhe"; case WeaponStyle.Bow: return "Bogen";
                case WeaponStyle.Blaster: return "Blaster"; case WeaponStyle.Hammer: return "Hammer"; default: return "Zauberbuch";
            }
        }
        private static string FaceName(FaceStyle f) { switch (f) { case FaceStyle.Happy: return "Fröhlich"; case FaceStyle.Angry: return "Grimmig"; case FaceStyle.Cool: return "Sonnenbrille"; case FaceStyle.Cyclops: return "Zyklop"; case FaceStyle.Visor: return "Visier/Maske"; default: return "Verschlafen"; } }
        private static string AnimName(ProceduralAnimStyle a) { switch (a) { case ProceduralAnimStyle.Bouncy: return "Hüpfend"; case ProceduralAnimStyle.Waddle: return "Watschelnd"; case ProceduralAnimStyle.Robotic: return "Roboterhaft"; case ProceduralAnimStyle.Floaty: return "Schwebend"; case ProceduralAnimStyle.Heavy: return "Schwer"; default: return "Schleichend"; } }
        private static string VisualName(ProjectileVisual v) { switch (v) { case ProjectileVisual.Bullet: return "Kugel"; case ProjectileVisual.Orb: return "Energiekugel"; case ProjectileVisual.Bomb: return "Bombe"; case ProjectileVisual.Arrow: return "Pfeil"; case ProjectileVisual.Flame: return "Flamme"; case ProjectileVisual.Star: return "Stern"; case ProjectileVisual.Slash: return "Klingenwelle"; default: return "Blitz"; } }

        public static string KindName(AttackKind k)
        {
            switch (k)
            {
                case AttackKind.Shot: return "Schuss"; case AttackKind.Lob: return "Wurf"; case AttackKind.Melee: return "Nahkampf"; case AttackKind.Beam: return "Strahl";
                case AttackKind.Boomerang: return "Bumerang"; case AttackKind.Nova: return "Rundumschlag"; case AttackKind.Dash: return "Sturmangriff"; case AttackKind.Leap: return "Sprung";
                case AttackKind.HealZone: return "Heilzone"; case AttackKind.DamageZone: return "Schadenszone"; case AttackKind.Turret: return "Geschützturm"; case AttackKind.Shield: return "Schild";
            }
            return "Eigenes Muster";
        }

        public static string KindHelp(AttackKind k)
        {
            switch (k)
            {
                case AttackKind.Shot: return "Gerade Projektile – einzeln, als Fächer oder als Salve.";
                case AttackKind.Lob: return "Bogenwurf über Wände, explodiert am Zielpunkt.";
                case AttackKind.Melee: return "Nahkampfhieb im Bogen – auch als Kombo mit mehreren Schlägen.";
                case AttackKind.Beam: return "Sofort treffender Strahl auf voller Länge.";
                case AttackKind.Boomerang: return "Fliegt hin und zurück und kann doppelt treffen.";
                case AttackKind.Nova: return "Projektile in alle Richtungen.";
                case AttackKind.Dash: return "Stürmt nach vorne und trifft Gegner auf dem Weg.";
                case AttackKind.Leap: return "Springt (auch über Wände) und verursacht Flächenschaden.";
                case AttackKind.HealZone: return "Zone, die Verbündete über Zeit heilt.";
                case AttackKind.DamageZone: return "Zone, die Gegner über Zeit verletzt.";
                case AttackKind.Turret: return "Stellt einen automatischen Geschützturm auf.";
                case AttackKind.Shield: return "Schild reduziert Schaden und gibt Tempo.";
            }
            return "";
        }
    }
}
