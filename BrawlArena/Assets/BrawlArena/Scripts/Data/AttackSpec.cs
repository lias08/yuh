// ---------------------------------------------------------------------------------------------
// AttackSpec – beschreibt einen Angriff ODER eine Superfähigkeit vollständig über Daten.
// Alle Werte sind im Inspector (bzw. im In-Game-Charakter-Editor) einstellbar.
// Nicht jeder Wert wird von jedem AttackKind genutzt – siehe Tooltips.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;

namespace BrawlArena.Data
{
    [Serializable]
    public class AttackSpec
    {
        [Header("Allgemein")]
        [Tooltip("Art des Angriffs – bestimmt das Verhalten.")]
        public AttackKind kind = AttackKind.Shot;

        [Tooltip("Anzeigename, z.B. 'Feuerstoß'.")]
        public string displayName = "Angriff";

        [TextArea(1, 3)]
        [Tooltip("Beschreibung für das Charakter-Detail-Menü.")]
        public string description = "";

        [Header("Schaden & Reichweite")]
        [Tooltip("Schaden pro Projektil / pro Treffer / pro Tick (bei Zonen).")]
        public float damage = 600f;

        [Tooltip("Reichweite in Kacheln (Tiles).")]
        public float range = 7f;

        [Tooltip("Heilung pro Tick (HealZone) bzw. Selbstheilung pro Treffer (andere Arten).")]
        public float healAmount = 0f;

        [Header("Projektile")]
        [Tooltip("Projektilgeschwindigkeit in Kacheln pro Sekunde.")]
        public float projectileSpeed = 14f;

        [Tooltip("Kollisionsradius des Projektils in Kacheln.")]
        public float projectileRadius = 0.25f;

        [Tooltip("Anzahl Projektile pro Schuss (Schrotflinte = mehrere).")]
        [Range(1, 24)] public int projectileCount = 1;

        [Tooltip("Streuwinkel in Grad, über den die Projektile verteilt werden.")]
        [Range(0f, 360f)] public float spreadAngle = 0f;

        [Tooltip("Anzahl Salven nacheinander (Burst).")]
        [Range(1, 10)] public int burstCount = 1;

        [Tooltip("Zeit zwischen den Salven in Sekunden.")]
        public float burstInterval = 0.08f;

        [Tooltip("Durchdringt das Projektil Gegner?")]
        public bool pierce = false;

        [Tooltip("Wie oft prallt das Projektil von Wänden ab?")]
        [Range(0, 5)] public int bounces = 0;

        [Tooltip("Optik des Projektils.")]
        public ProjectileVisual visual = ProjectileVisual.Bullet;

        [Tooltip("Hauptfarbe des Projektils / Effekts.")]
        public Color color = new Color(1f, 0.85f, 0.2f);

        [Header("Fläche / Zeit")]
        [Tooltip("Explosions- oder Zonenradius in Kacheln (Lob, Leap, Zonen, Nahkampf-Breite).")]
        public float areaRadius = 1.5f;

        [Tooltip("Dauer in Sekunden (Zonen, Schild, Turm-Lebensdauer, Dash-Dauer).")]
        public float duration = 3f;

        [Tooltip("Tick-Intervall für Zonen in Sekunden.")]
        public float tickInterval = 0.5f;

        [Tooltip("Lebenspunkte des Geschützturms (nur Turret).")]
        public float turretHealth = 2500f;

        [Header("Statuseffekte")]
        [Tooltip("Rückstoß in Kacheln.")]
        public float knockback = 0f;

        [Tooltip("Verlangsamung in Prozent (0-90).")]
        [Range(0f, 90f)] public float slowPercent = 0f;

        [Tooltip("Dauer der Verlangsamung in Sekunden.")]
        public float slowDuration = 0f;

        [Tooltip("Betäubungsdauer in Sekunden.")]
        public float stunDuration = 0f;

        [Tooltip("Schadensreduktion des Schildes in Prozent.")]
        [Range(0f, 95f)] public float shieldPercent = 50f;

        [Tooltip("Zerstört dieser Angriff Wände und Kisten im Wirkungsbereich?")]
        public bool destroysWalls = false;

        [Header("Kombo (Nahkampf-Schlagfolge)")]
        [Tooltip("Wenn gefüllt: ein Munitionsbalken löst ALLE Schritte nacheinander aus (z.B. 3 Schläge + Welle). " +
                 "Gilt für kind = Melee.")]
        public List<ComboStep> comboSteps = new List<ComboStep>();

        [Header("Erweiterung (für Programmierer)")]
        [Tooltip("Nur bei kind = Custom: Asset mit eigenem Verhalten (Unterklasse von CustomAttackPattern).")]
        public CustomAttackPattern customPattern;

        /// <summary>Gibt an, ob der Angriff einen frei wählbaren Zielpunkt hat (Lob, Leap, Zonen).</summary>
        public bool UsesTargetPoint
        {
            get
            {
                return kind == AttackKind.Lob || kind == AttackKind.Leap || kind == AttackKind.HealZone ||
                       kind == AttackKind.DamageZone || kind == AttackKind.Turret;
            }
        }

        /// <summary>Selbst-Fähigkeiten ohne Ausrichtung.</summary>
        public bool IsSelfCast { get { return kind == AttackKind.Shield || kind == AttackKind.Nova; } }

        /// <summary>Geschätzter Schaden pro Angriff für UI-Anzeigen.</summary>
        public float DamagePerUse
        {
            get
            {
                switch (kind)
                {
                    case AttackKind.HealZone: return 0f;
                    case AttackKind.DamageZone: return damage * Mathf.Max(1f, duration / Mathf.Max(0.1f, tickInterval));
                    case AttackKind.Shot:
                    case AttackKind.Nova:
                    case AttackKind.Boomerang:
                        return damage * projectileCount * burstCount;
                    case AttackKind.Melee:
                        if (comboSteps != null && comboSteps.Count > 0)
                        {
                            float sum = 0f;
                            foreach (var st in comboSteps) sum += st.damage + (st.firesWave ? st.waveDamage : 0f);
                            return sum;
                        }
                        return damage;
                    default: return damage;
                }
            }
        }

        public AttackSpec Clone()
        {
            var c = (AttackSpec)MemberwiseClone();
            c.comboSteps = new List<ComboStep>();
            if (comboSteps != null) foreach (var st in comboSteps) c.comboSteps.Add(st.Clone());
            return c;
        }
    }
}
