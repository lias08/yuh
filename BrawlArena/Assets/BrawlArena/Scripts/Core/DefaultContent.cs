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

        private static readonly Color Skin1 = new Color(1f, 0.82f, 0.66f), Skin2 = new Color(0.85f, 0.62f, 0.45f);

        // ======================================================================= Brawler
        public static List<BrawlerDefinition> CreateBrawlers()
        {
            var list = new List<BrawlerDefinition>();

            // ---------------------------------------------------------------- Funke (Starter)
            {
                var b = B("funke", "Funke", "Schütze", Rarity.Starter, 0, "Ein flinker Revolverheld mit großer Reichweite. Ideal für Einsteiger.");
                b.appearance = Look(BodyShape.Round, HatStyle.Cap, WeaponStyle.Pistol, FaceStyle.Happy, C(0.95f, 0.35f, 0.25f), C(0.25f, 0.3f, 0.45f), Skin1, C(0.2f, 0.45f, 0.95f));
                b.maxHealth = 3800; b.moveSpeed = 3.1f; b.maxAmmo = 3; b.reloadTime = 1.4f; b.attackCooldown = 0.4f; b.hitsToChargeSuper = 5;
                b.mainAttack = Shot("Doppelschuss", "Feuert zwei schnelle Kugeln hintereinander.", 420, 8.5f, 16f, 1, 0, C(1f, 0.85f, 0.3f), ProjectileVisual.Bullet);
                b.mainAttack.burstCount = 2; b.mainAttack.burstInterval = 0.1f;
                b.superAbility = Shot("Kugelhagel", "Ein Fächer aus Kugeln, der auch Wände durchschlägt.", 380, 9f, 18f, 9, 32f, C(1f, 0.6f, 0.2f), ProjectileVisual.Bullet);
                b.superAbility.burstCount = 2; b.superAbility.burstInterval = 0.12f; b.superAbility.destroysWalls = true;
                b.sounds.attackFallback = SfxPreset.Pew;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Brocken
            {
                var b = B("brocken", "Brocken", "Panzer", Rarity.Rare, 10, "Massiver Kraftprotz mit Schrotflinte. Sein Super-Ansturm reißt Wände ein.");
                b.appearance = Look(BodyShape.Stocky, HatStyle.Bandana, WeaponStyle.Shotgun, FaceStyle.Angry, C(0.35f, 0.55f, 0.3f), C(0.55f, 0.35f, 0.2f), Skin2, C(0.9f, 0.2f, 0.2f));
                b.appearance.size = 1.15f;
                b.animations.style = ProceduralAnimStyle.Heavy;
                b.maxHealth = 6600; b.moveSpeed = 3.0f; b.maxAmmo = 3; b.reloadTime = 1.6f; b.attackCooldown = 0.5f; b.hitsToChargeSuper = 3;
                b.mainAttack = Shot("Schrotladung", "Fünf Schrotkugeln im Fächer – vernichtend auf kurze Distanz.", 340, 4.6f, 15f, 5, 38f, C(1f, 0.75f, 0.35f), ProjectileVisual.Bullet);
                b.superAbility = new AttackSpec { kind = AttackKind.Dash, displayName = "Abrissbirne", description = "Stürmt nach vorne, schleudert Gegner weg und zerstört Wände.", damage = 1300, range = 6.5f, projectileSpeed = 14f, knockback = 2.2f, destroysWalls = true, areaRadius = 1.6f, color = C(1f, 0.55f, 0.2f) };
                b.sounds.attackFallback = SfxPreset.Shotgun; b.sounds.superFallback = SfxPreset.Dash; b.sounds.pitch = 0.85f;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Lumi
            {
                var b = B("lumi", "Lumi", "Unterstützer", Rarity.Rare, 20, "Sternenmagierin, die Gegner durchbohrt und ihr Team mit einer Heilquelle versorgt.");
                b.appearance = Look(BodyShape.Tall, HatStyle.WizardHat, WeaponStyle.Staff, FaceStyle.Happy, C(0.55f, 0.4f, 0.95f), C(1f, 0.85f, 0.35f), Skin1, C(0.35f, 0.25f, 0.75f));
                b.animations.style = ProceduralAnimStyle.Floaty;
                b.maxHealth = 3400; b.moveSpeed = 3.1f; b.maxAmmo = 3; b.reloadTime = 1.5f; b.attackCooldown = 0.45f; b.hitsToChargeSuper = 4;
                b.mainAttack = Shot("Sternenlanze", "Ein Lichtstrahl, der durch mehrere Gegner fliegt und Lumi heilt.", 620, 7.5f, 13f, 1, 0, C(0.75f, 0.6f, 1f), ProjectileVisual.Orb);
                b.mainAttack.pierce = true; b.mainAttack.projectileRadius = 0.3f; b.mainAttack.healAmount = 150;
                b.superAbility = new AttackSpec { kind = AttackKind.HealZone, displayName = "Heilquelle", description = "Erschafft eine Quelle, die Verbündete schnell heilt.", healAmount = 450, damage = 0, range = 7f, areaRadius = 2.3f, duration = 6f, tickInterval = 0.5f, color = C(0.45f, 1f, 0.55f) };
                b.sounds.attackFallback = SfxPreset.Magic; b.sounds.superFallback = SfxPreset.Heal; b.sounds.pitch = 1.15f;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Bumm
            {
                var b = B("bumm", "Bumm", "Werfer", Rarity.Rare, 30, "Wirft Bomben über Wände. Seine Mega-Bombe sprengt ganze Deckungen weg.");
                b.appearance = Look(BodyShape.Blob, HatStyle.Helmet, WeaponStyle.Bomb, FaceStyle.Happy, C(1f, 0.6f, 0.2f), C(0.35f, 0.35f, 0.4f), Skin1, C(0.45f, 0.5f, 0.35f));
                b.animations.style = ProceduralAnimStyle.Waddle;
                b.maxHealth = 3000; b.moveSpeed = 3.0f; b.maxAmmo = 3; b.reloadTime = 1.7f; b.attackCooldown = 0.5f; b.hitsToChargeSuper = 5;
                b.mainAttack = new AttackSpec { kind = AttackKind.Lob, displayName = "Kracher", description = "Bogenwurf über Hindernisse, explodiert am Ziel.", damage = 950, range = 7.5f, projectileSpeed = 11f, areaRadius = 1.3f, color = C(1f, 0.55f, 0.15f), visual = ProjectileVisual.Bomb };
                b.superAbility = new AttackSpec { kind = AttackKind.Lob, displayName = "Mega-Bombe", description = "Eine riesige Bombe mit großem Radius, zerstört Wände.", damage = 2100, range = 8.5f, projectileSpeed = 9f, areaRadius = 2.8f, destroysWalls = true, knockback = 1.5f, color = C(1f, 0.35f, 0.1f), visual = ProjectileVisual.Bomb };
                b.sounds.attackFallback = SfxPreset.Throw;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Zack
            {
                var b = B("zack", "Zack", "Scharfschütze", Rarity.SuperRare, 40, "Präzisionsschütze mit durchdringendem Laser. Wenig Leben, enorme Reichweite.");
                b.appearance = Look(BodyShape.Tall, HatStyle.Antenna, WeaponStyle.Blaster, FaceStyle.Visor, C(0.2f, 0.75f, 0.85f), C(0.2f, 1f, 0.6f), Skin1, C(1f, 0.3f, 0.3f));
                b.animations.style = ProceduralAnimStyle.Sneaky;
                b.maxHealth = 2800; b.moveSpeed = 3.1f; b.maxAmmo = 2; b.reloadTime = 1.8f; b.attackCooldown = 0.6f; b.hitsToChargeSuper = 4;
                b.mainAttack = new AttackSpec { kind = AttackKind.Beam, displayName = "Präzisionslaser", description = "Sofortiger Laserstrahl, der alle Gegner auf der Linie trifft.", damage = 1150, range = 10.5f, projectileRadius = 0.3f, pierce = true, color = C(0.3f, 1f, 0.8f) };
                b.superAbility = new AttackSpec { kind = AttackKind.Beam, displayName = "Plasmakanone", description = "Riesiger Strahl, der Wände zerstört und Gegner verlangsamt.", damage = 2200, range = 12f, projectileRadius = 0.8f, pierce = true, destroysWalls = true, slowPercent = 40, slowDuration = 2f, color = C(0.2f, 1f, 1f) };
                b.sounds.attackFallback = SfxPreset.Laser; b.sounds.superFallback = SfxPreset.Zap;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Robo-Rex
            {
                var b = B("roborex", "Robo-Rex", "Techniker", Rarity.SuperRare, 50, "Ein Bastler-Roboter mit Blaster-Salven, der Geschütztürme aufstellt.");
                b.appearance = Look(BodyShape.Robot, HatStyle.Antenna, WeaponStyle.Blaster, FaceStyle.Visor, C(0.95f, 0.75f, 0.2f), C(0.25f, 0.85f, 1f), Skin1, C(1f, 0.3f, 0.3f));
                b.animations.style = ProceduralAnimStyle.Robotic;
                b.maxHealth = 4200; b.moveSpeed = 3.0f; b.maxAmmo = 3; b.reloadTime = 1.5f; b.attackCooldown = 0.45f; b.hitsToChargeSuper = 5;
                b.mainAttack = Shot("Blastersalve", "Drei Energiekugeln kurz nacheinander.", 300, 7.5f, 15f, 1, 0, C(0.3f, 0.85f, 1f), ProjectileVisual.Bolt);
                b.mainAttack.burstCount = 3; b.mainAttack.burstInterval = 0.09f;
                b.superAbility = new AttackSpec { kind = AttackKind.Turret, displayName = "Wachturm", description = "Stellt einen Turm auf, der automatisch auf Gegner feuert.", damage = 320, range = 7.5f, projectileSpeed = 14f, duration = 14f, tickInterval = 0.55f, turretHealth = 3000, color = C(0.3f, 0.85f, 1f) };
                b.sounds.attackFallback = SfxPreset.Zap; b.sounds.superFallback = SfxPreset.Deploy; b.sounds.pitch = 0.9f;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Kiki
            {
                var b = B("kiki", "Kiki", "Assassine", Rarity.Epic, 60, "Flinke Katzenkriegerin mit Doppelkrallen. Springt mitten ins Getümmel.");
                b.appearance = Look(BodyShape.Tiny, HatStyle.Ears, WeaponStyle.Gloves, FaceStyle.Angry, C(0.25f, 0.25f, 0.35f), C(1f, 0.4f, 0.6f), Skin1, C(0.3f, 0.3f, 0.4f));
                b.animations.style = ProceduralAnimStyle.Sneaky; b.animations.walkCycleSpeed = 1.3f;
                b.maxHealth = 3800; b.moveSpeed = 3.5f; b.maxAmmo = 3; b.reloadTime = 1.1f; b.attackCooldown = 0.35f; b.hitsToChargeSuper = 4;
                b.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Krallenwirbel", description = "Zwei blitzschnelle Krallenhiebe.", damage = 520, range = 2.3f, color = C(1f, 0.45f, 0.65f) };
                b.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 520, 2.3f, 110));
                b.mainAttack.comboSteps.Add(Swing(0.14f, SwingDirection.RightToLeft, 520, 2.3f, 110));
                b.superAbility = new AttackSpec { kind = AttackKind.Leap, displayName = "Panthersprung", description = "Springt über Wände zum Ziel und betäubt Gegner beim Aufprall.", damage = 1400, range = 8f, areaRadius = 1.8f, stunDuration = 0.8f, color = C(1f, 0.4f, 0.65f) };
                b.sounds.attackFallback = SfxPreset.Swoosh; b.sounds.superFallback = SfxPreset.Swoosh; b.sounds.pitch = 1.25f;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Frosti
            {
                var b = B("frosti", "Frosti", "Kontrolle", Rarity.Epic, 70, "Eiskalter Schneemann. Sein Eis-Bumerang verlangsamt, sein Schneesturm hält Gegner fest.");
                b.appearance = Look(BodyShape.Round, HatStyle.CowboyHat, WeaponStyle.Staff, FaceStyle.Sleepy, C(0.92f, 0.96f, 1f), C(0.35f, 0.7f, 1f), C(0.95f, 0.97f, 1f), C(0.3f, 0.35f, 0.5f));
                b.appearance.backpack = false;
                b.maxHealth = 4000; b.moveSpeed = 3.0f; b.maxAmmo = 3; b.reloadTime = 1.6f; b.attackCooldown = 0.5f; b.hitsToChargeSuper = 5;
                b.mainAttack = new AttackSpec { kind = AttackKind.Boomerang, displayName = "Eis-Bumerang", description = "Fliegt hin und zurück und verlangsamt Getroffene.", damage = 560, range = 7f, projectileSpeed = 12f, projectileRadius = 0.32f, slowPercent = 30, slowDuration = 1.2f, color = C(0.55f, 0.85f, 1f), visual = ProjectileVisual.Star };
                b.superAbility = new AttackSpec { kind = AttackKind.DamageZone, displayName = "Schneesturm", description = "Ein Sturm, der Gegner verletzt und stark verlangsamt.", damage = 260, range = 7.5f, areaRadius = 2.5f, duration = 5f, tickInterval = 0.5f, slowPercent = 55, slowDuration = 0.7f, color = C(0.65f, 0.9f, 1f) };
                b.sounds.attackFallback = SfxPreset.Swoosh; b.sounds.superFallback = SfxPreset.Magic; b.sounds.pitch = 0.9f;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Feuerfuchs
            {
                var b = B("feuerfuchs", "Feuerfuchs", "Nahkämpfer", Rarity.Mythic, 80, "Ein Fuchs mit Flammenhandschuhen. Kurze Reichweite, riesiger Flächenschaden.");
                b.appearance = Look(BodyShape.Round, HatStyle.Ears, WeaponStyle.Gloves, FaceStyle.Cool, C(1f, 0.45f, 0.15f), C(1f, 0.85f, 0.3f), C(1f, 0.6f, 0.35f), C(1f, 0.45f, 0.15f));
                b.appearance.cape = true;
                b.maxHealth = 4600; b.moveSpeed = 3.3f; b.maxAmmo = 3; b.reloadTime = 1.3f; b.attackCooldown = 0.4f; b.hitsToChargeSuper = 4;
                b.mainAttack = Shot("Flammenstoß", "Drei durchdringende Flammenzungen.", 380, 4.2f, 10f, 3, 24f, C(1f, 0.5f, 0.1f), ProjectileVisual.Flame);
                b.mainAttack.pierce = true; b.mainAttack.projectileRadius = 0.32f;
                b.superAbility = new AttackSpec { kind = AttackKind.Nova, displayName = "Feuerring", description = "Flammen in alle Richtungen – zwei Wellen.", damage = 520, range = 5f, projectileSpeed = 10f, projectileCount = 14, burstCount = 2, burstInterval = 0.25f, pierce = true, projectileRadius = 0.3f, color = C(1f, 0.4f, 0.05f), visual = ProjectileVisual.Flame };
                b.sounds.attackFallback = SfxPreset.Swoosh; b.sounds.superFallback = SfxPreset.Explosion;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Glöckchen
            {
                var b = B("gloeckchen", "Glöckchen", "Magier", Rarity.Epic, 90, "Bücherwurm mit abprallenden Zauberkugeln und schützendem Bannschild.");
                b.appearance = Look(BodyShape.Round, HatStyle.Halo, WeaponStyle.Book, FaceStyle.Happy, C(0.35f, 0.75f, 0.55f), C(1f, 0.75f, 0.85f), Skin1, C(1f, 0.9f, 0.5f));
                b.animations.style = ProceduralAnimStyle.Floaty;
                b.maxHealth = 3600; b.moveSpeed = 3.0f; b.maxAmmo = 3; b.reloadTime = 1.5f; b.attackCooldown = 0.45f; b.hitsToChargeSuper = 5;
                b.mainAttack = Shot("Hüpfkugel", "Eine Zauberkugel, die zweimal von Wänden abprallt.", 700, 8f, 12f, 1, 0, C(1f, 0.7f, 0.9f), ProjectileVisual.Orb);
                b.mainAttack.bounces = 2; b.mainAttack.projectileRadius = 0.3f;
                b.superAbility = new AttackSpec { kind = AttackKind.Shield, displayName = "Bannschild", description = "Reduziert Schaden um 60 %, heilt und stößt Gegner zurück.", shieldPercent = 60, duration = 4f, healAmount = 1200, damage = 600, areaRadius = 2.2f, knockback = 1.8f, color = C(1f, 0.85f, 0.4f) };
                b.sounds.attackFallback = SfxPreset.Magic; b.sounds.superFallback = SfxPreset.Shield; b.sounds.pitch = 1.2f;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Kaiser Kron
            {
                var b = B("kaiserkron", "Kaiser Kron", "Schütze", Rarity.Legendary, 100, "Der selbsternannte Herrscher der Arena. Sternensalven und ein königlicher Sternenregen.");
                b.appearance = Look(BodyShape.Stocky, HatStyle.Crown, WeaponStyle.Blaster, FaceStyle.Cool, C(0.65f, 0.15f, 0.3f), C(1f, 0.8f, 0.2f), Skin1, C(1f, 0.82f, 0.2f));
                b.appearance.cape = true;
                b.maxHealth = 4400; b.moveSpeed = 3.1f; b.maxAmmo = 3; b.reloadTime = 1.4f; b.attackCooldown = 0.45f; b.hitsToChargeSuper = 5;
                b.mainAttack = Shot("Sternensalve", "Zwei Salven aus je zwei Sternen.", 330, 8f, 15f, 2, 10f, C(1f, 0.85f, 0.25f), ProjectileVisual.Star);
                b.mainAttack.burstCount = 2; b.mainAttack.burstInterval = 0.12f;
                b.superAbility = new AttackSpec { kind = AttackKind.Lob, displayName = "Sternenregen", description = "Sechs Sternbomben regnen um das Ziel herab.", damage = 900, range = 8f, projectileSpeed = 10f, projectileCount = 6, areaRadius = 1.2f, burstInterval = 0.07f, color = C(1f, 0.8f, 0.2f), visual = ProjectileVisual.Star };
                b.sounds.attackFallback = SfxPreset.Pew; b.sounds.superFallback = SfxPreset.Explosion; b.sounds.pitch = 0.95f;
                list.Add(b);
            }
            // ---------------------------------------------------------------- Klingengeist (4 Formen)
            list.Add(CreateBladeSpirit());
            return list;
        }

        /// <summary>
        /// Schwertkämpfer mit 4 Evolutionsstufen. Jede Super lässt ihn eine Stufe aufsteigen:
        ///  Stufe 1: 1 Munition = 1 kräftiger horizontaler Hieb
        ///  Stufe 2: 1 Munition = 2 Hiebe (links→rechts, rechts→links)
        ///  Stufe 3: 1 Munition = 3 schnelle Hiebe, der letzte erzeugt eine kleine Energiewelle
        ///  Stufe 4: 1 Munition = 2 blitzschnelle Hiebe + kräftiger 3. Schlag mit großer Klingenwelle
        /// Vorlage für eigene Evolutions-Brawler – alle Werte im Inspector änderbar.
        /// </summary>
        private static BrawlerDefinition CreateBladeSpirit()
        {
            var b = B("klingengeist", "Klingengeist", "Schwertkämpfer", Rarity.Legendary, 110,
                "Ein Schwertkämpfer, der sich mit jeder Super weiterentwickelt. Jede Stufe bringt eine neue Schlagkombo.");
            Color robe = C(0.12f, 0.12f, 0.18f), hair = C(0.2f, 0.8f, 0.75f), blade = C(0.75f, 0.95f, 1f);
            b.appearance = Look(BodyShape.Tall, HatStyle.Mohawk, WeaponStyle.Sword, FaceStyle.Angry, robe, C(0.85f, 0.85f, 0.9f), Skin1, hair);
            b.appearance.weaponColor = C(0.2f, 0.2f, 0.25f);
            b.maxHealth = 4200; b.moveSpeed = 3.3f; b.maxAmmo = 3; b.reloadTime = 1.3f; b.attackCooldown = 0.45f; b.hitsToChargeSuper = 4;
            b.evolutionTrigger = EvolutionTrigger.SuperUses;
            b.baseFormName = "Stufe 1 – Seelenklinge";

            // Stufe 1
            b.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Klingenhieb", description = "1 Munition = 1 kräftiger horizontaler Schwerthieb (mittlere Reichweite).", range = 2.7f, damage = 1000, color = blade };
            b.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 1000, 2.7f, 130));
            b.superAbility = new AttackSpec { kind = AttackKind.Dash, displayName = "Geisterschritt", description = "Stürmt durch Gegner und entfesselt dabei die nächste Stufe.", damage = 1300, range = 6.5f, projectileSpeed = 16f, knockback = 1f, areaRadius = 1.5f, color = blade };
            b.sounds.attackFallback = SfxPreset.Swoosh; b.sounds.superFallback = SfxPreset.Dash;

            // Stufe 2
            var f2 = new BrawlerForm { formName = "Stufe 2 – Kettenklinge", threshold = 1, healthMultiplier = 1.08f, speedMultiplier = 1.03f, transformColor = C(0.6f, 0.9f, 1f) };
            f2.appearance = b.appearance.Clone();
            f2.appearance.cape = true; f2.appearance.secondaryColor = C(0.7f, 0.7f, 0.75f);
            f2.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Doppelhieb", description = "1 Munition = 2 Hiebe: links→rechts, direkt zurück rechts→links.", range = 2.7f, color = blade };
            f2.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 650, 2.7f, 130));
            f2.mainAttack.comboSteps.Add(Swing(0.18f, SwingDirection.RightToLeft, 650, 2.7f, 130));
            b.forms.Add(f2);

            // Stufe 3
            var f3 = new BrawlerForm { formName = "Stufe 3 – Maskenwut", threshold = 2, healthMultiplier = 1.08f, speedMultiplier = 1.04f, reloadMultiplier = 0.9f, transformColor = C(1f, 1f, 1f) };
            f3.appearance = f2.appearance.Clone();
            f3.appearance.face = FaceStyle.Visor; f3.appearance.secondaryColor = C(0.95f, 0.95f, 0.95f); f3.appearance.hatColor = C(0.85f, 0.85f, 0.9f);
            f3.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Wutkombo", description = "1 Munition = 3 schnelle, aggressive Hiebe. Der letzte erzeugt eine kleine Energiewelle.", range = 2.7f, color = C(0.9f, 0.9f, 1f) };
            f3.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 480, 2.6f, 120));
            f3.mainAttack.comboSteps.Add(Swing(0.12f, SwingDirection.RightToLeft, 480, 2.6f, 120));
            var s3 = Swing(0.24f, SwingDirection.Thrust, 520, 2.8f, 70);
            s3.firesWave = true; s3.waveDamage = 600; s3.waveRange = 5.5f; s3.waveWidth = 0.5f; s3.waveColor = C(0.85f, 0.9f, 1f);
            f3.mainAttack.comboSteps.Add(s3);
            b.forms.Add(f3);

            // Stufe 4
            var f4 = new BrawlerForm { formName = "Stufe 4 – Wahre Klinge", threshold = 3, healthMultiplier = 1.1f, speedMultiplier = 1.06f, reloadMultiplier = 0.85f, transformColor = C(1f, 0.25f, 0.3f) };
            f4.appearance = f3.appearance.Clone();
            f4.appearance.face = FaceStyle.Angry; f4.appearance.primaryColor = C(0.08f, 0.06f, 0.1f); f4.appearance.secondaryColor = C(0.9f, 0.15f, 0.2f);
            f4.appearance.weaponColor = C(0.05f, 0.05f, 0.08f);
            f4.mainAttack = new AttackSpec { kind = AttackKind.Melee, displayName = "Finale Kombo", description = "1 Munition = 2 blitzschnelle Hiebe + ein kräftiger dritter Schlag, der eine große Klingenwelle abfeuert.", range = 2.8f, color = C(1f, 0.3f, 0.35f) };
            f4.mainAttack.comboSteps.Add(Swing(0f, SwingDirection.LeftToRight, 500, 2.7f, 130));
            f4.mainAttack.comboSteps.Add(Swing(0.09f, SwingDirection.RightToLeft, 500, 2.7f, 130));
            var s4 = Swing(0.24f, SwingDirection.Overhead, 950, 3f, 90);
            s4.knockback = 1f; s4.firesWave = true; s4.waveDamage = 1300; s4.waveRange = 9f; s4.waveWidth = 0.85f; s4.waveSpeed = 15f; s4.waveColor = C(1f, 0.2f, 0.25f);
            f4.mainAttack.comboSteps.Add(s4);
            f4.overrideSuper = true;
            f4.superAbility = new AttackSpec { kind = AttackKind.Shot, displayName = "Mondsichel-Sturm", description = "Drei riesige Klingenwellen, die Wände zerschneiden.", damage = 1600, range = 11f, projectileSpeed = 15f, projectileCount = 3, spreadAngle = 26f, projectileRadius = 0.9f, pierce = true, destroysWalls = true, color = C(1f, 0.15f, 0.2f), visual = ProjectileVisual.Slash };
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
        private static SkinDefinition S(string id, BrawlerDefinition baseDef, string name, int price, System.Action<AppearanceConfig> edit)
        {
            var s = ScriptableObject.CreateInstance<SkinDefinition>();
            s.name = id; s.id = id; s.brawlerId = baseDef.id; s.displayName = name; s.gemPrice = price;
            s.appearance = baseDef.appearance.Clone();
            edit(s.appearance);
            return s;
        }

        public static List<SkinDefinition> CreateSkins()
        {
            var list = new List<SkinDefinition>();
            var all = CreateBrawlers();
            System.Func<string, BrawlerDefinition> get = id => all.Find(b => b.id == id);
            list.Add(S("funke_ranger", get("funke"), "Wüstenranger", 30, a => { a.hat = HatStyle.CowboyHat; a.hatColor = C(0.55f, 0.35f, 0.2f); a.primaryColor = C(0.85f, 0.6f, 0.3f); a.face = FaceStyle.Cool; }));
            list.Add(S("funke_neon", get("funke"), "Neon-Funke", 80, a => { a.primaryColor = C(0.1f, 0.1f, 0.15f); a.secondaryColor = C(0f, 1f, 0.8f); a.hatColor = C(1f, 0.1f, 0.8f); a.weapon = WeaponStyle.Blaster; }));
            list.Add(S("brocken_eis", get("brocken"), "Eisbrocken", 30, a => { a.primaryColor = C(0.6f, 0.85f, 1f); a.secondaryColor = C(0.3f, 0.45f, 0.7f); a.skinColor = C(0.8f, 0.9f, 1f); a.hat = HatStyle.Horns; a.hatColor = C(0.95f, 0.95f, 1f); }));
            list.Add(S("lumi_stern", get("lumi"), "Sternen-Lumi", 80, a => { a.hat = HatStyle.Halo; a.primaryColor = C(0.15f, 0.15f, 0.35f); a.secondaryColor = C(1f, 0.95f, 0.5f); }));
            list.Add(S("bumm_kuerbis", get("bumm"), "Kürbis-Bumm", 30, a => { a.primaryColor = C(1f, 0.5f, 0.05f); a.hat = HatStyle.WizardHat; a.hatColor = C(0.25f, 0.15f, 0.3f); a.face = FaceStyle.Angry; }));
            list.Add(S("kiki_tiger", get("kiki"), "Tiger-Kiki", 30, a => { a.primaryColor = C(1f, 0.6f, 0.1f); a.hatColor = C(1f, 0.6f, 0.1f); a.secondaryColor = C(0.1f, 0.1f, 0.1f); }));
            list.Add(S("klinge_schatten", get("klingengeist"), "Schattenklinge", 150, a => { a.primaryColor = C(0.3f, 0.05f, 0.4f); a.hatColor = C(0.95f, 0.95f, 1f); a.secondaryColor = C(0.6f, 0.2f, 0.9f); }));
            list.Add(S("kron_gold", get("kaiserkron"), "Goldkaiser", 150, a => { a.primaryColor = C(1f, 0.8f, 0.2f); a.secondaryColor = C(1f, 1f, 1f); a.weaponColor = C(0.9f, 0.7f, 0.15f); }));
            return list;
        }
    }
}
