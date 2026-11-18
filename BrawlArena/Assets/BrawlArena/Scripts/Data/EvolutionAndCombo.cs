// ---------------------------------------------------------------------------------------------
// Kombo- und Evolutionssystem
//
// ComboStep: Ein Angriff kann aus mehreren Einzelschlägen bestehen ("1 Munition = 3 Schläge").
//   Jeder Schritt hat eigene Verzögerung, Schlagrichtung (links->rechts / rechts->links / Stoß),
//   Schaden, Reichweite, Bogenbreite und kann optional eine Energiewelle (Projektil) abfeuern.
//
// BrawlerForm: Ein Brawler kann sich im Match weiterentwickeln (Stufe 1 -> 2 -> 3 -> 4).
//   Jede Form kann Aussehen, Werte, Hauptangriff und Super ersetzen.
//   Auslöser (EvolutionTrigger) ist frei wählbar: Super-Einsätze, Kills, Matchzeit oder Level.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;

namespace BrawlArena.Data
{
    public enum SwingDirection
    {
        LeftToRight = 0,
        RightToLeft = 1,
        Thrust = 2,      // gerader Stich nach vorne
        Overhead = 3,    // Schlag von oben (kurzer, breiter Aufprall)
        Spin = 4,        // 360°-Drehschlag
    }

    [Serializable]
    public class ComboStep
    {
        [Tooltip("Verzögerung nach Beginn des Angriffs in Sekunden.")]
        public float delay = 0f;
        public SwingDirection swing = SwingDirection.LeftToRight;
        [Tooltip("Schaden dieses Schlags.")]
        public float damage = 500f;
        [Tooltip("Reichweite in Kacheln.")]
        public float range = 2.6f;
        [Tooltip("Breite des Schlagbogens in Grad.")]
        [Range(10f, 360f)] public float arcAngle = 110f;
        [Tooltip("Rückstoß in Kacheln.")]
        public float knockback = 0f;
        [Tooltip("Schritt nach vorne während des Schlags (Kacheln).")]
        public float lunge = 0.2f;

        [Header("Energiewelle (optional)")]
        [Tooltip("Feuert dieser Schlag zusätzlich eine Welle (z.B. Klingenwelle) ab?")]
        public bool firesWave = false;
        public float waveDamage = 800f;
        public float waveRange = 8f;
        public float waveSpeed = 13f;
        [Tooltip("Breite (Kollisionsradius) der Welle.")]
        public float waveWidth = 0.6f;
        public bool wavePierces = true;
        public Color waveColor = new Color(0.4f, 0.8f, 1f);

        public ComboStep Clone() { return (ComboStep)MemberwiseClone(); }
    }

    public enum EvolutionTrigger
    {
        SuperUses = 0,   // Entwicklung nach X Super-Einsätzen
        Kills = 1,       // nach X Eliminierungen im Match
        MatchTime = 2,   // nach X Sekunden Matchzeit
        BrawlerLevel = 3,// abhängig vom Brawler-Level (dauerhaft)
        DamageDealt = 4, // nach X verursachtem Schaden
    }

    [Serializable]
    public class BrawlerForm
    {
        public string formName = "Stufe 2";
        [Tooltip("Ab welchem Wert (je nach Auslöser) diese Form aktiv wird.")]
        public float threshold = 1f;

        [Header("Aussehen")]
        public bool overrideAppearance = true;
        public AppearanceConfig appearance = new AppearanceConfig();
        public bool overrideAnimations = false;
        public AnimationConfig animations = new AnimationConfig();

        [Header("Werte (Multiplikatoren)")]
        public float healthMultiplier = 1.1f;
        public float speedMultiplier = 1.05f;
        public float reloadMultiplier = 1f;

        [Header("Angriffe")]
        public bool overrideMainAttack = true;
        public AttackSpec mainAttack = new AttackSpec();
        public bool overrideSuper = false;
        public AttackSpec superAbility = new AttackSpec();

        [Tooltip("Farbe des Verwandlungseffekts.")]
        public Color transformColor = new Color(0.5f, 0.8f, 1f);
    }
}
