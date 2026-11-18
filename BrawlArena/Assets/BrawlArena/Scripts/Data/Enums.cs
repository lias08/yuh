// ---------------------------------------------------------------------------------------------
// BrawlArena – zentrale Aufzählungen (Enums), die von Daten, Gameplay und UI geteilt werden.
// Neue Werte können problemlos ergänzt werden; bestehende Reihenfolge NICHT ändern, da Unity
// Enums als Ganzzahl serialisiert (sonst verschieben sich bereits gespeicherte Werte).
// ---------------------------------------------------------------------------------------------
using UnityEngine;

namespace BrawlArena.Data
{
    /// <summary>Seltenheit eines Brawlers – beeinflusst Preis, Farbe der Karte und Drop-Chance.</summary>
    public enum Rarity
    {
        Starter = 0,
        Rare = 1,
        SuperRare = 2,
        Epic = 3,
        Mythic = 4,
        Legendary = 5,
    }

    /// <summary>Grundtyp eines Angriffs oder einer Superfähigkeit.</summary>
    public enum AttackKind
    {
        /// <summary>Gerade fliegende Projektile (Einzelschuss, Schrotflinte, Salve).</summary>
        Shot = 0,
        /// <summary>Im Bogen geworfenes Projektil, fliegt über Wände, explodiert am Ziel.</summary>
        Lob = 1,
        /// <summary>Nahkampf-Hieb in einem Bogen vor dem Brawler.</summary>
        Melee = 2,
        /// <summary>Sofort treffender Strahl, durchdringt Gegner.</summary>
        Beam = 3,
        /// <summary>Projektil fliegt bis zur maximalen Reichweite und kehrt zurück.</summary>
        Boomerang = 4,
        /// <summary>Projektile in alle Richtungen rund um den Brawler.</summary>
        Nova = 5,
        /// <summary>Sturmangriff: der Brawler stürmt nach vorne und verletzt Gegner auf dem Weg.</summary>
        Dash = 6,
        /// <summary>Sprung zum Zielpunkt (auch über Wände) mit Flächenschaden bei der Landung.</summary>
        Leap = 7,
        /// <summary>Heilzone, die Verbündete über Zeit heilt.</summary>
        HealZone = 8,
        /// <summary>Schadenszone (z.B. Gift/Feuer) am Zielpunkt.</summary>
        DamageZone = 9,
        /// <summary>Stellt einen Geschützturm auf, der automatisch auf Gegner schießt.</summary>
        Turret = 10,
        /// <summary>Schild: reduziert erlittenen Schaden für eine Dauer und gibt Tempo.</summary>
        Shield = 11,
        /// <summary>Eigenes Muster über ein CustomAttackPattern-Asset (für Programmierer).</summary>
        Custom = 12,
    }

    /// <summary>Optik eines Projektils.</summary>
    public enum ProjectileVisual
    {
        Bullet = 0,
        Orb = 1,
        Bomb = 2,
        Arrow = 3,
        Flame = 4,
        Star = 5,
        Slash = 6,
        Bolt = 7,
    }

    /// <summary>Körperform der prozedural erzeugten Figur.</summary>
    public enum BodyShape
    {
        Round = 0,
        Tall = 1,
        Stocky = 2,
        Robot = 3,
        Tiny = 4,
        Blob = 5,
    }

    /// <summary>Kopfbedeckung / Accessoire.</summary>
    public enum HatStyle
    {
        None = 0,
        Cap = 1,
        Crown = 2,
        Horns = 3,
        Helmet = 4,
        WizardHat = 5,
        Mohawk = 6,
        Antenna = 7,
        Bandana = 8,
        CowboyHat = 9,
        Halo = 10,
        Ears = 11,
        SpikyHair = 12,
        SpikyHairHorns = 13,
    }

    /// <summary>Waffen-Optik in der Hand.</summary>
    public enum WeaponStyle
    {
        None = 0,
        Pistol = 1,
        Shotgun = 2,
        Staff = 3,
        Bomb = 4,
        Sword = 5,
        Gloves = 6,
        Bow = 7,
        Blaster = 8,
        Hammer = 9,
        Book = 10,
        GreatBlade = 11,
        ChainBlade = 12,
        Katana = 13,
    }

    /// <summary>Gesichtsausdruck.</summary>
    public enum FaceStyle
    {
        Happy = 0,
        Angry = 1,
        Cool = 2,
        Cyclops = 3,
        Visor = 4,
        Sleepy = 5,
        Mask = 6,
    }

    /// <summary>Prozeduraler Animationsstil (wird genutzt, wenn keine eigenen AnimationClips gesetzt sind).</summary>
    public enum ProceduralAnimStyle
    {
        Bouncy = 0,
        Waddle = 1,
        Robotic = 2,
        Floaty = 3,
        Heavy = 4,
        Sneaky = 5,
    }

    /// <summary>Synthetische Ersatz-Soundeffekte, falls kein eigener AudioClip gesetzt ist.</summary>
    public enum SfxPreset
    {
        None = 0,
        Pew = 1,
        Shotgun = 2,
        Laser = 3,
        Throw = 4,
        Explosion = 5,
        Swoosh = 6,
        Zap = 7,
        Magic = 8,
        Heal = 9,
        Punch = 10,
        Hit = 11,
        Hurt = 12,
        Death = 13,
        Pickup = 14,
        Gem = 15,
        Click = 16,
        Confirm = 17,
        SuperReady = 18,
        Victory = 19,
        Defeat = 20,
        Countdown = 21,
        Goal = 22,
        Dash = 23,
        Footstep = 24,
        Coin = 25,
        BoxOpen = 26,
        Deploy = 27,
        Shield = 28,
        Kick = 29,
    }

    /// <summary>Mitgelieferte Spielmodus-Logiken. Eigene Modi: <see cref="ModeType.Custom"/> + Klassenname.</summary>
    public enum ModeType
    {
        TeamBattle = 0,
        GemGrab = 1,
        BrawlBall = 2,
        Showdown = 3,
        SoloSurvival = 4,
        DuoSurvival = 5,
        Training = 6,
        Custom = 7,
    }

    /// <summary>Dekorationsstil einer Karte (Bäume, Kakteen, Felsen am Rand ...).</summary>
    public enum DecorationStyle
    {
        Desert = 0,
        Forest = 1,
        Snow = 2,
        Candy = 3,
        Ruins = 4,
        Stadium = 5,
    }

    public static class RarityUtil
    {
        public static Color GetColor(Rarity r)
        {
            switch (r)
            {
                case Rarity.Starter: return new Color(0.55f, 0.80f, 1.00f);
                case Rarity.Rare: return new Color(0.35f, 0.85f, 0.35f);
                case Rarity.SuperRare: return new Color(0.20f, 0.55f, 1.00f);
                case Rarity.Epic: return new Color(0.72f, 0.30f, 0.95f);
                case Rarity.Mythic: return new Color(1.00f, 0.25f, 0.35f);
                case Rarity.Legendary: return new Color(1.00f, 0.85f, 0.15f);
            }
            return Color.white;
        }

        public static string GetName(Rarity r)
        {
            switch (r)
            {
                case Rarity.Starter: return "Start";
                case Rarity.Rare: return "Selten";
                case Rarity.SuperRare: return "Super Selten";
                case Rarity.Epic: return "Episch";
                case Rarity.Mythic: return "Mythisch";
                case Rarity.Legendary: return "Legendär";
            }
            return r.ToString();
        }

        /// <summary>Standard-Freischaltpreis in Münzen nach Seltenheit.</summary>
        public static int DefaultCoinPrice(Rarity r)
        {
            switch (r)
            {
                case Rarity.Starter: return 0;
                case Rarity.Rare: return 500;
                case Rarity.SuperRare: return 1200;
                case Rarity.Epic: return 2500;
                case Rarity.Mythic: return 5000;
                case Rarity.Legendary: return 9000;
            }
            return 1000;
        }

        /// <summary>Gewichtung für Box-Drops (höher = häufiger).</summary>
        public static float DropWeight(Rarity r)
        {
            switch (r)
            {
                case Rarity.Starter: return 0f;
                case Rarity.Rare: return 50f;
                case Rarity.SuperRare: return 25f;
                case Rarity.Epic: return 12f;
                case Rarity.Mythic: return 5f;
                case Rarity.Legendary: return 2f;
            }
            return 1f;
        }
    }
}
