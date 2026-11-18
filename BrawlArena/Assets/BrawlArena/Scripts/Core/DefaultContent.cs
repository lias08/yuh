// ---------------------------------------------------------------------------------------------
// DefaultContent – die mitgelieferten Brawler, Gegner-Roboter, Spielmodi und Skins.
// Alle Werte hier sind nur Startwerte: Über "BrawlArena > Standardinhalte als Assets exportieren"
// werden sie zu bearbeitbaren Assets. Ein Asset mit derselben ID ersetzt den Eintrag hier.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Data;

namespace BrawlArena.Core
{
    public static partial class DefaultContent
    {
        // ======================================================================= Helfer
        private static Color C(float r, float g, float b) { return new Color(r, g, b); }

        private static BrawlerDefinition B(string id, string name, string role, Rarity rarity, int order, string desc)
        {
            var b = ScriptableObject.CreateInstance<BrawlerDefinition>();
            b.name = id; b.id = id; b.displayName = name; b.role = role; b.rarity = rarity; b.sortOrder = order; b.description = desc;
            b.unlockedByDefault = rarity == Rarity.Starter;
            return b;
        }

        private static AppearanceConfig Look(BodyShape body, HatStyle hat, WeaponStyle weapon, FaceStyle face, Color primary, Color secondary, Color skin, Color hatC)
        {
            return new AppearanceConfig { bodyShape = body, hat = hat, weapon = weapon, face = face, primaryColor = primary, secondaryColor = secondary, skinColor = skin, hatColor = hatC, weaponColor = C(0.32f, 0.33f, 0.38f) };
        }

        private static AttackSpec Shot(string name, string desc, float dmg, float range, float speed, int count, float spread, Color color, ProjectileVisual vis)
        {
            return new AttackSpec { kind = AttackKind.Shot, displayName = name, description = desc, damage = dmg, range = range, projectileSpeed = speed, projectileCount = count, spreadAngle = spread, color = color, visual = vis, projectileRadius = 0.22f };
        }

        private static ComboStep Swing(float delay, SwingDirection dir, float dmg, float range, float arc)
        {
            return new ComboStep { delay = delay, swing = dir, damage = dmg, range = range, arcAngle = arc, lunge = 0.25f };
        }

        private static readonly Color Skin1 = new Color(1f, 0.82f, 0.66f);

        // ======================================================================= Brawler
        /// <summary>
        /// Spielbare Brawler. Aktuell: ein Charakter (Klingengeist) mit 4 Evolutionsformen.
        /// Weitere Brawler hier ergänzen – sie sind dann nur über Boxen (oder Code) freischaltbar.
        /// </summary>
        public static List<BrawlerDefinition> CreateBrawlers()
        {
            var list = new List<BrawlerDefinition>();
            list.Add(CreateBladeSpirit());
            return list;
        }

        private static ComboStep Wave(ComboStep st, float dmg, float range, float width, float speed, Color color)
        {
            st.firesWave = true; st.waveDamage = dmg; st.waveRange = range; st.waveWidth = width; st.waveSpeed = speed; st.waveColor = color; st.wavePierces = true;
            return st;
        }

        private static AttackSpec WaveSuper(string name, string desc, float dmg, float range, float radius, float speed, Color color)
        {
            return new AttackSpec
            {
                kind = AttackKind.Shot, displayName = name, description = desc, damage = dmg, range = range, projectileSpeed = speed,
                projectileRadius = radius, projectileCount = 1, pierce = true, color = color, visual = ProjectileVisual.Slash, knockback = 0.8f
            };
        }

        /// <summary>
        /// Klingengeist – Legendärer Schwertkämpfer (Schadensverursacher) mit permanenter Evolution:
        /// Jede Super-Aktivierung schaltet die nächste Form frei (bleibt bis Matchende).
        /// Die Super lädt sich durch Schaden an Gegnern auf.
        ///   Form 1: 1 Munition = 1 Hieb
        ///   Form 2: 1 Munition = 2 Hiebe (links→rechts, rechts→links)
        ///   Form 3: 1 Munition = 3 Hiebe, der letzte mit kleiner Energiewelle
        ///   Form 4: 1 Munition = 3 Hiebe + Klingenwelle; Super = aufgeladene Finale Welle mit Explosion
        /// Jeder Hieb und jede Welle haben eine eigene Treffererkennung (pro Hieb trifft jedes Ziel max. 1x).
        /// </summary>
        private static BrawlerDefinition CreateBladeSpirit()
        {
            var b = B("klingengeist", "Klingengeist", "Schadensverursacher", Rarity.Legendary, 0,
                "Der Klingenwächter der Arena. Mit jeder Super erwacht eine neue Form – mit neuem Schwert, neuem Outfit und einer neuen Schlagkombo.");
            b.unlockedByDefault = true; // aktuell einziger Brawler → von Anfang an spielbar

            Color robe = C(0.12f, 0.14f, 0.3f), sash = C(0.95f, 0.95f, 0.98f), hair = C(0.2f, 0.85f, 0.8f);
            Color blue = C(0.4f, 0.85f, 1f), white = C(0.9f, 0.95f, 1f), crimson = C(1f, 0.2f, 0.28f), finalC = C(0.75f, 0.8f, 1f);

            // ---------------------------------------------------------------- Form 1 – Seelenwächter
            b.appearance = Look(BodyShape.Tall, HatStyle.SpikyHair, WeaponStyle.GreatBlade, FaceStyle.Angry, robe, sash, Skin1, hair);
            b.appearance.weaponColor = C(0.18f, 0.18f, 0.22f);
            b.appearance.secondaryColor = C(0.95f, 0.8f, 0.3f);
            b.animations.style = ProceduralAnimStyle.Bouncy;
            b.maxHealth = 4200; b.moveSpeed = 3.2f; b.maxAmmo = 3; b.reloadTime = 1.35f; b.attackCooldown = 0.42f; b.hitsToChargeSuper = 4;
            b.evolutionTrigger = EvolutionTrigger.SuperUses;
            b.baseFormName = "Form 1 – Seelenwächter";
            b.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Wächterhieb", description = "1 Munition = 1 kräftiger horizontaler Hieb mit großer Klinge. Mittlere Reichweite, breiter Bogen.", range = 2.8f, damage = 1100, color = white };
            b.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 1100, 2.8f, 140));
            b.superAbility = WaveSuper("Mondsichelwelle", "Schleudert eine Klingenwelle nach vorne und erweckt Form 2.", 1400, 9f, 0.7f, 14f, blue);
            b.sounds.attackFallback = SfxPreset.Swoosh; b.sounds.superFallback = SfxPreset.Zap; b.sounds.pitch = 1f;

            // ---------------------------------------------------------------- Form 2 – Kettenläufer
            var f2 = new BrawlerForm { formName = "Form 2 – Kettenläufer", threshold = 1, healthMultiplier = 1.08f, speedMultiplier = 1.06f, reloadMultiplier = 0.95f,
                transformColor = blue, auraColor = new Color(0.5f, 0.85f, 1f, 0.35f), transformSound = SfxPreset.Magic };
            f2.appearance = b.appearance.Clone();
            f2.appearance.weapon = WeaponStyle.ChainBlade;
            f2.appearance.cape = true;
            f2.appearance.primaryColor = C(0.08f, 0.08f, 0.12f);
            f2.appearance.secondaryColor = C(0.92f, 0.92f, 0.95f);
            f2.overrideAnimations = true;
            f2.animations = new AnimationConfig { style = ProceduralAnimStyle.Sneaky, walkCycleSpeed = 1.15f, bounceAmount = 0.9f, armSwing = 1f };
            f2.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Kettendoppelhieb", description = "1 Munition = 2 Hiebe: links→rechts und direkt zurück. Beide Hiebe treffen einzeln.", range = 2.8f, color = blue };
            f2.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 650, 2.8f, 135));
            f2.mainAttack.comboSteps.Add(Swing(0.14f, SwingDirection.RightToLeft, 650, 2.8f, 135));
            f2.overrideSuper = true;
            f2.superAbility = WaveSuper("Verstärkte Mondsichelwelle", "Größere, stärkere Klingenwelle mit mehr Reichweite. Erweckt Form 3.", 1800, 10.5f, 0.85f, 15f, blue);
            b.forms.Add(f2);

            // ---------------------------------------------------------------- Form 3 – Maskenzorn
            var f3 = new BrawlerForm { formName = "Form 3 – Maskenzorn", threshold = 2, healthMultiplier = 1.08f, speedMultiplier = 1.03f, reloadMultiplier = 0.9f,
                transformColor = crimson, auraColor = new Color(1f, 0.25f, 0.3f, 0.45f), transformSound = SfxPreset.Explosion };
            f3.appearance = f2.appearance.Clone();
            f3.appearance.face = FaceStyle.Mask;
            f3.appearance.hat = HatStyle.SpikyHairHorns;
            f3.appearance.secondaryColor = crimson;
            f3.appearance.eyeColor = C(1f, 0.85f, 0.2f);
            f3.overrideAnimations = true;
            f3.animations = new AnimationConfig { style = ProceduralAnimStyle.Sneaky, walkCycleSpeed = 1.3f, bounceAmount = 1.1f, armSwing = 1.3f };
            f3.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Maskenkombo", description = "1 Munition = 3 schnelle Hiebe. Der kraftvolle Abschlusshieb setzt eine kleine Energiewelle frei.", range = 2.8f, color = crimson };
            f3.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 520, 2.8f, 130));
            f3.mainAttack.comboSteps.Add(Swing(0.1f, SwingDirection.RightToLeft, 520, 2.8f, 130));
            f3.mainAttack.comboSteps.Add(Wave(Swing(0.22f, SwingDirection.Overhead, 650, 3f, 100), 600, 5.5f, 0.55f, 15f, crimson));
            f3.overrideSuper = true;
            f3.superAbility = WaveSuper("Zornwelle", "Gewaltige schwarz-rote Welle – breiter, schneller und stärker. Zerschneidet Wände. Erweckt Form 4.", 2300, 11f, 1.15f, 18f, crimson);
            f3.superAbility.destroysWalls = true;
            b.forms.Add(f3);

            // ---------------------------------------------------------------- Form 4 – Wahre Klinge
            var f4 = new BrawlerForm { formName = "Form 4 – Wahre Klinge", threshold = 3, healthMultiplier = 1.1f, speedMultiplier = 1.05f, reloadMultiplier = 0.85f,
                transformColor = finalC, auraColor = new Color(0.85f, 0.9f, 1f, 0.5f), transformSound = SfxPreset.Victory };
            f4.appearance = f3.appearance.Clone();
            f4.appearance.face = FaceStyle.Angry;
            f4.appearance.hat = HatStyle.SpikyHair;
            f4.appearance.weapon = WeaponStyle.Katana;
            f4.appearance.primaryColor = C(0.05f, 0.05f, 0.08f);
            f4.appearance.secondaryColor = C(0.95f, 0.95f, 1f);
            f4.appearance.hatColor = C(0.55f, 1f, 0.95f);
            f4.appearance.eyeColor = C(0.3f, 0.5f, 1f);
            f4.appearance.backpack = false;
            f4.overrideAnimations = true;
            f4.animations = new AnimationConfig { style = ProceduralAnimStyle.Sneaky, walkCycleSpeed = 1.35f, bounceAmount = 0.8f, armSwing = 1.2f };
            f4.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Wahre Klingenkombo", description = "1 Munition = 2 blitzschnelle Hiebe + kraftvoller Abschlusshieb, der eine Klingenwelle abfeuert (kostet keine extra Munition).", range = 3f, color = finalC };
            f4.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 560, 3f, 135));
            f4.mainAttack.comboSteps.Add(Swing(0.08f, SwingDirection.RightToLeft, 560, 3f, 135));
            var fin = Wave(Swing(0.22f, SwingDirection.Overhead, 900, 3.2f, 100), 1100, 9f, 0.8f, 16f, C(0.6f, 0.7f, 1f));
            fin.knockback = 0.8f;
            f4.mainAttack.comboSteps.Add(fin);
            f4.overrideSuper = true;
            f4.superAbility = new AttackSpec
            {
                kind = AttackKind.Shot, displayName = "Finale Mondsichel", chargeTime = 0.7f,
                description = "Hebt die Klinge, sammelt Energie und entfesselt eine gigantische Welle, die beim Aufprall gewaltig explodiert.",
                damage = 3200, range = 12f, projectileSpeed = 16f, projectileRadius = 1.5f, projectileCount = 1, pierce = false,
                explodeOnImpact = true, areaRadius = 3f, destroysWalls = true, knockback = 2f, color = finalC, visual = ProjectileVisual.Slash
            };
            b.forms.Add(f4);
            return b;
        }

        // ======================================================================= Gegner & Puppen
        public static List<BrawlerDefinition> CreateNpcs()
        {
            var list = new List<BrawlerDefinition>();
            {
                var b = B("npc_robo_grunt", "Robo-Raufbold", "Gegner", Rarity.Rare, 900, "Nahkampf-Roboter.");
                b.appearance = Look(BodyShape.Robot, HatStyle.None, WeaponStyle.Gloves, FaceStyle.Cyclops, C(0.55f, 0.55f, 0.6f), C(1f, 0.3f, 0.2f), Skin1, C(1f, 0.3f, 0.2f));
                b.appearance.size = 0.9f; b.appearance.eyeColor = C(1f, 0.2f, 0.1f);
                b.animations.style = ProceduralAnimStyle.Robotic;
                b.maxHealth = 2400; b.moveSpeed = 3.2f; b.maxAmmo = 2; b.reloadTime = 1.2f; b.attackCooldown = 0.6f;
                b.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Robo-Faust", damage = 450, range = 1.6f, spreadAngle = 90, color = C(1f, 0.4f, 0.2f) };
                b.superAbility = b.mainAttack.Clone();
                b.sounds.attackFallback = SfxPreset.Punch; b.sounds.pitch = 0.7f;
                list.Add(b);
            }
            {
                var b = B("npc_robo_shooter", "Robo-Schütze", "Gegner", Rarity.Rare, 901, "Fernkampf-Roboter.");
                b.appearance = Look(BodyShape.Robot, HatStyle.Antenna, WeaponStyle.Pistol, FaceStyle.Visor, C(0.4f, 0.42f, 0.5f), C(1f, 0.25f, 0.25f), Skin1, C(1f, 0.25f, 0.25f));
                b.appearance.size = 0.9f;
                b.animations.style = ProceduralAnimStyle.Robotic;
                b.maxHealth = 1800; b.moveSpeed = 2.8f; b.maxAmmo = 2; b.reloadTime = 1.8f; b.attackCooldown = 0.8f;
                b.mainAttack = Shot("Laser", "", 350, 7f, 11f, 1, 0, C(1f, 0.25f, 0.25f), ProjectileVisual.Bolt);
                b.superAbility = b.mainAttack.Clone();
                b.sounds.attackFallback = SfxPreset.Laser; b.sounds.pitch = 0.8f;
                list.Add(b);
            }
            {
                var b = B("npc_robo_tank", "Robo-Koloss", "Gegner", Rarity.Epic, 902, "Schwerer Roboter.");
                b.appearance = Look(BodyShape.Robot, HatStyle.Horns, WeaponStyle.Hammer, FaceStyle.Cyclops, C(0.3f, 0.3f, 0.35f), C(1f, 0.5f, 0.1f), Skin1, C(0.9f, 0.9f, 0.9f));
                b.appearance.size = 1.3f;
                b.animations.style = ProceduralAnimStyle.Heavy;
                b.maxHealth = 6000; b.moveSpeed = 2.4f; b.maxAmmo = 1; b.reloadTime = 1.6f; b.attackCooldown = 1f;
                b.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Hammer", damage = 900, range = 2.2f, spreadAngle = 140, knockback = 1.2f, color = C(1f, 0.6f, 0.2f) };
                b.superAbility = b.mainAttack.Clone();
                b.sounds.attackFallback = SfxPreset.Punch; b.sounds.pitch = 0.6f;
                list.Add(b);
            }
            {
                var b = B("npc_robo_boss", "Robo-Boss", "Boss", Rarity.Legendary, 903, "Der Endgegner im Überlebensmodus.");
                b.appearance = Look(BodyShape.Robot, HatStyle.Crown, WeaponStyle.Blaster, FaceStyle.Cyclops, C(0.25f, 0.22f, 0.3f), C(1f, 0.15f, 0.2f), Skin1, C(1f, 0.8f, 0.1f));
                b.appearance.size = 1.6f; b.appearance.eyeColor = C(1f, 0.1f, 0.1f);
                b.animations.style = ProceduralAnimStyle.Heavy;
                b.maxHealth = 22000; b.moveSpeed = 2.3f; b.maxAmmo = 3; b.reloadTime = 1.2f; b.attackCooldown = 0.7f; b.hitsToChargeSuper = 3;
                b.mainAttack = Shot("Bossfeuer", "", 420, 8f, 12f, 5, 50f, C(1f, 0.2f, 0.2f), ProjectileVisual.Orb);
                b.superAbility = new AttackSpec { kind = AttackKind.Nova, displayName = "Vernichtungsring", damage = 500, range = 7f, projectileSpeed = 9f, projectileCount = 16, burstCount = 3, burstInterval = 0.3f, color = C(1f, 0.1f, 0.2f), visual = ProjectileVisual.Orb, projectileRadius = 0.3f };
                b.sounds.attackFallback = SfxPreset.Zap; b.sounds.pitch = 0.6f;
                list.Add(b);
            }
            {
                var b = B("npc_dummy", "Trainingspuppe", "Puppe", Rarity.Starter, 910, "");
                b.appearance = Look(BodyShape.Round, HatStyle.None, WeaponStyle.None, FaceStyle.Sleepy, C(0.85f, 0.7f, 0.45f), C(0.6f, 0.45f, 0.3f), C(0.9f, 0.78f, 0.55f), C(0.5f, 0.5f, 0.5f));
                b.appearance.size = 1.1f;
                b.maxHealth = 40000; b.moveSpeed = 2f; b.maxAmmo = 1;
                b.mainAttack = Shot("–", "", 0, 1, 10, 1, 0, Color.white, ProjectileVisual.Bullet);
                b.superAbility = b.mainAttack.Clone();
                b.sounds.hurtFallback = SfxPreset.Hit;
                list.Add(b);
            }
            {
                var b = B("npc_dummy_shooter", "Schützen-Puppe", "Puppe", Rarity.Starter, 911, "");
                b.appearance = Look(BodyShape.Round, HatStyle.Cap, WeaponStyle.Pistol, FaceStyle.Angry, C(0.85f, 0.6f, 0.45f), C(0.6f, 0.45f, 0.3f), C(0.9f, 0.78f, 0.55f), C(0.9f, 0.3f, 0.3f));
                b.appearance.size = 1.1f;
                b.maxHealth = 40000; b.moveSpeed = 2f; b.maxAmmo = 1; b.reloadTime = 2f;
                b.mainAttack = Shot("Übungsschuss", "", 300, 8f, 9f, 1, 0, C(1f, 0.6f, 0.3f), ProjectileVisual.Orb);
                b.superAbility = b.mainAttack.Clone();
                list.Add(b);
            }
            return list;
        }

        // ======================================================================= Spielmodi
        private static GameModeDefinition M(string id, string name, ModeType type, int order, Color color, string desc)
        {
            var m = ScriptableObject.CreateInstance<GameModeDefinition>();
            m.name = id; m.id = id; m.displayName = name; m.modeType = type; m.sortOrder = order; m.themeColor = color; m.description = desc;
            return m;
        }

        public static List<GameModeDefinition> CreateModes()
        {
            var list = new List<GameModeDefinition>();
            var tb = M("team_battle", "3v3 Teamkampf", ModeType.TeamBattle, 0, C(0.95f, 0.3f, 0.35f), "Zwei Teams à 3. Das Team, das zuerst 10 Gegner besiegt – oder nach Ablauf der Zeit mehr hat – gewinnt.");
            tb.teamCount = 2; tb.teamSize = 3; tb.matchDuration = 150; tb.targetScore = 10; tb.respawnTime = 3;
            list.Add(tb);

            var gg = M("gem_grab", "Gem Grab", ModeType.GemGrab, 1, C(0.75f, 0.35f, 1f), "Sammelt Edelsteine aus der Mine. Hält dein Team 10 Steine für 15 Sekunden, gewinnt ihr. Wer besiegt wird, verliert seine Steine!");
            gg.teamCount = 2; gg.teamSize = 3; gg.matchDuration = 180; gg.targetScore = 10; gg.countdownTime = 15; gg.respawnTime = 4;
            list.Add(gg);

            var bb = M("brawl_ball", "Brawl Ball", ModeType.BrawlBall, 2, C(0.3f, 0.6f, 1f), "Schieß den Ball ins gegnerische Tor! Wer den Ball trägt, schießt mit dem Angriff, die Super ist ein Kraftschuss. 2 Tore gewinnen.");
            bb.teamCount = 2; bb.teamSize = 3; bb.matchDuration = 150; bb.targetScore = 2; bb.respawnTime = 3;
            list.Add(bb);

            var sd = M("showdown", "Showdown", ModeType.Showdown, 3, C(0.4f, 0.85f, 0.3f), "Jeder gegen jeden – 10 Brawler, ein Sieger. Zerstöre Boxen für Power-Würfel und flieh vor dem Giftgas!");
            sd.teamCount = 10; sd.teamSize = 1; sd.matchDuration = 0; sd.allowRespawn = false; sd.useGas = true; sd.gasStartDelay = 30; sd.gasSpeed = 0.2f;
            sd.trophiesWin = 10; sd.trophiesLoss = -6; sd.coinsWin = 25;
            list.Add(sd);

            var ss = M("solo_survival", "Solo-Überleben", ModeType.SoloSurvival, 4, C(1f, 0.6f, 0.15f), "Überstehe allein 5 Wellen angreifender Roboter – inklusive Boss. Du hast 3 Leben.");
            ss.teamCount = 1; ss.teamSize = 1; ss.matchDuration = 0; ss.waves = 5; ss.lives = 3; ss.respawnTime = 3;
            ss.trophiesWin = 6; ss.trophiesLoss = -3; ss.coinsWin = 25; ss.coinsLoss = 10; ss.xpWin = 35;
            list.Add(ss);

            var ds = M("duo_survival", "Duo-Überleben", ModeType.DuoSurvival, 5, C(1f, 0.45f, 0.1f), "Zusammen mit einem Partner gegen 6 immer härtere Roboterwellen. Jeder hat 2 Leben.");
            ds.teamCount = 1; ds.teamSize = 2; ds.matchDuration = 0; ds.waves = 6; ds.lives = 2; ds.respawnTime = 4;
            ds.trophiesWin = 7; ds.trophiesLoss = -3; ds.coinsWin = 25; ds.coinsLoss = 10; ds.xpWin = 40;
            list.Add(ds);

            var tr = M("training", "Trainingsmodus", ModeType.Training, 6, C(0.5f, 0.55f, 0.65f), "Teste Brawler, Angriffe und Superfähigkeiten an Puppen. Kein Zeitlimit, keine Trophäen.");
            tr.teamCount = 1; tr.teamSize = 1; tr.matchDuration = 0; tr.respawnTime = 2; tr.ranked = false;
            tr.trophiesWin = tr.trophiesLoss = 0; tr.coinsWin = tr.coinsLoss = 0; tr.xpWin = tr.xpLoss = 0;
            list.Add(tr);
            return list;
        }

        // ======================================================================= Skins
        /// <summary>Mitgelieferte Skins (aktuell keine). Eigene Skins als Assets anlegen.</summary>
        public static List<SkinDefinition> CreateSkins()
        {
            return new List<SkinDefinition>();
        }
    }
}
