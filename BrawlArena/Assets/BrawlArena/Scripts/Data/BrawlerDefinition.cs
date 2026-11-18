// ---------------------------------------------------------------------------------------------
// BrawlerDefinition – DIE zentrale Konfiguration eines Charakters.
//
// Neuen Charakter anlegen (ohne Programmierung):
//   Projekt-Fenster > Rechtsklick > Create > BrawlArena > Brawler
//   (oder Menü "BrawlArena > Neuer Brawler"). Die Datei muss in einem Ordner
//   "Resources/BrawlArena/Brawlers" liegen, damit das Spiel sie automatisch findet.
//
// Jeder Wert ist im Inspector einstellbar: Name, Modell, Aussehen, Größe, Farben,
// Animationen, Angriff, Super, Werte, Seltenheit und Sounds.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;

namespace BrawlArena.Data
{
    /// <summary>Aussehen der Figur. Wird ein eigenes Modell gesetzt, ersetzt es die prozedurale Figur.</summary>
    [Serializable]
    public class AppearanceConfig
    {
        [Header("Eigenes 3D-Modell (optional)")]
        [Tooltip("Eigenes Modell-Prefab (z.B. FBX). Leer lassen = prozedurale Cartoon-Figur.")]
        public GameObject customModel;
        [Tooltip("Skalierung des eigenen Modells.")]
        public float customModelScale = 1f;
        [Tooltip("Versatz des eigenen Modells.")]
        public Vector3 customModelOffset = Vector3.zero;
        [Tooltip("Drehung des eigenen Modells (Euler-Winkel), falls es nicht nach +Z schaut.")]
        public Vector3 customModelRotation = Vector3.zero;
        [Tooltip("Färbt das eigene Modell mit der Hauptfarbe ein (setzt _Color auf allen Materialien).")]
        public bool tintCustomModel = false;

        [Header("Prozedurale Figur")]
        public BodyShape bodyShape = BodyShape.Round;
        public HatStyle hat = HatStyle.None;
        public WeaponStyle weapon = WeaponStyle.Pistol;
        public FaceStyle face = FaceStyle.Happy;
        [Tooltip("Rucksack/Ausrüstung auf dem Rücken.")]
        public bool backpack = false;
        [Tooltip("Umhang.")]
        public bool cape = false;

        [Header("Größe")]
        [Range(0.6f, 1.6f)] public float size = 1f;
        [Range(0.6f, 1.6f)] public float headSize = 1f;

        [Header("Farben")]
        public Color primaryColor = new Color(0.25f, 0.55f, 1f);
        public Color secondaryColor = new Color(1f, 0.85f, 0.2f);
        public Color skinColor = new Color(1f, 0.80f, 0.62f);
        public Color hatColor = new Color(0.9f, 0.2f, 0.2f);
        public Color eyeColor = new Color(0.1f, 0.1f, 0.15f);
        public Color weaponColor = new Color(0.35f, 0.35f, 0.4f);

        public AppearanceConfig Clone() { return (AppearanceConfig)MemberwiseClone(); }
    }

    /// <summary>Animationen. Eigene AnimationClips werden über das Playables-System abgespielt
    /// (Modell braucht dafür eine Animator-Komponente). Sonst prozedurale Animation.</summary>
    [Serializable]
    public class AnimationConfig
    {
        [Header("Prozedurale Animation (ohne eigene Clips)")]
        public ProceduralAnimStyle style = ProceduralAnimStyle.Bouncy;
        [Range(0.3f, 2.5f)] public float walkCycleSpeed = 1f;
        [Range(0f, 2f)] public float bounceAmount = 1f;
        [Range(0f, 2f)] public float armSwing = 1f;

        [Header("Eigene Animationsclips (optional, für eigene Modelle)")]
        public AnimationClip idleClip;
        public AnimationClip walkClip;
        public AnimationClip attackClip;
        public AnimationClip superClip;
        public AnimationClip hitClip;
        public AnimationClip deathClip;
        public AnimationClip victoryClip;
        [Tooltip("Überblendzeit zwischen Clips in Sekunden.")]
        public float crossFade = 0.15f;
        [Tooltip("Faktor für die Laufanimations-Geschwindigkeit relativ zum Tempo.")]
        public float walkClipSpeedScale = 1f;

        public bool HasClips { get { return idleClip != null || walkClip != null; } }
        public AnimationConfig Clone() { return (AnimationConfig)MemberwiseClone(); }
    }

    /// <summary>Soundeffekte. Ohne eigenen AudioClip wird ein synthetischer Effekt verwendet.</summary>
    [Serializable]
    public class SoundSet
    {
        public AudioClip attack;
        public SfxPreset attackFallback = SfxPreset.Pew;
        public AudioClip super;
        public SfxPreset superFallback = SfxPreset.Explosion;
        public AudioClip hurt;
        public SfxPreset hurtFallback = SfxPreset.Hurt;
        public AudioClip death;
        public SfxPreset deathFallback = SfxPreset.Death;
        public AudioClip spawn;
        public AudioClip footstep;
        [Range(0.5f, 2f)] public float pitch = 1f;

        public SoundSet Clone() { return (SoundSet)MemberwiseClone(); }
    }

    [CreateAssetMenu(menuName = "BrawlArena/Brawler", fileName = "NewBrawler", order = 0)]
    public class BrawlerDefinition : ScriptableObject
    {
        [Header("Identität")]
        [Tooltip("Eindeutige ID (keine Leerzeichen). Wird im Speicherstand verwendet – später nicht mehr ändern!")]
        public string id = "new_brawler";
        public string displayName = "Neuer Brawler";
        [Tooltip("Rolle, z.B. 'Schütze', 'Panzer', 'Werfer', 'Unterstützer'.")]
        public string role = "Kämpfer";
        [TextArea(2, 4)] public string description = "";
        public Rarity rarity = Rarity.Rare;
        [Tooltip("Ist der Brawler von Anfang an freigeschaltet?")]
        public bool unlockedByDefault = false;
        [Tooltip("Freischaltpreis in Münzen. -1 = Standardpreis der Seltenheit.")]
        public int coinPrice = -1;
        [Tooltip("Optionales Porträt. Leer = wird automatisch aus dem 3D-Modell gerendert.")]
        public Sprite portrait;
        [Tooltip("Sortierreihenfolge in der Brawler-Liste.")]
        public int sortOrder = 100;

        [Header("Aussehen")]
        public AppearanceConfig appearance = new AppearanceConfig();

        [Header("Animationen")]
        public AnimationConfig animations = new AnimationConfig();

        [Header("Werte (Level 1)")]
        [Tooltip("Lebenspunkte auf Level 1.")]
        public float maxHealth = 3600f;
        [Tooltip("Bewegungstempo in Kacheln pro Sekunde (normal ≈ 3).")]
        [Range(1.5f, 5f)] public float moveSpeed = 3f;
        [Tooltip("Anzahl Munitionsbalken.")]
        [Range(1, 6)] public int maxAmmo = 3;
        [Tooltip("Zeit in Sekunden, um EINEN Munitionsbalken nachzuladen.")]
        public float reloadTime = 1.4f;
        [Tooltip("Mindestabstand zwischen zwei Angriffen in Sekunden (Angriffsgeschwindigkeit).")]
        public float attackCooldown = 0.45f;
        [Tooltip("Wie viele volle Treffer des Hauptangriffs laden die Super komplett auf?")]
        [Range(1, 20)] public float hitsToChargeSuper = 5f;

        [Header("Hauptangriff")]
        public AttackSpec mainAttack = new AttackSpec();

        [Header("Superfähigkeit")]
        public AttackSpec superAbility = new AttackSpec { kind = AttackKind.Lob, displayName = "Super", damage = 1500f, range = 7f, areaRadius = 2.2f };

        [Header("Evolution (optional)")]
        [Tooltip("Wodurch entwickelt sich der Brawler im Match weiter?")]
        public EvolutionTrigger evolutionTrigger = EvolutionTrigger.SuperUses;
        [Tooltip("Name der Grundform (Stufe 1).")]
        public string baseFormName = "Stufe 1";
        [Tooltip("Weitere Formen in aufsteigender Reihenfolge (Stufe 2, 3, 4 ...). Leer = keine Evolution.")]
        public List<BrawlerForm> forms = new List<BrawlerForm>();

        [Header("Sounds")]
        public SoundSet sounds = new SoundSet();

        /// <summary>Tatsächlicher Münzpreis.</summary>
        public int CoinPrice { get { return coinPrice >= 0 ? coinPrice : RarityUtil.DefaultCoinPrice(rarity); } }

        /// <summary>Kollisionsradius in Kacheln (abhängig von der Größe).</summary>
        public float Radius { get { return Mathf.Clamp(0.38f * appearance.size, 0.28f, 0.6f); } }

        /// <summary>Erzeugt eine unabhängige Laufzeitkopie (z.B. für Skins oder den Editor).</summary>
        public BrawlerDefinition CreateRuntimeCopy()
        {
            var copy = Instantiate(this);
            copy.name = name;
            copy.appearance = appearance.Clone();
            copy.animations = animations.Clone();
            copy.sounds = sounds.Clone();
            copy.mainAttack = mainAttack.Clone();
            copy.superAbility = superAbility.Clone();
            return copy;
        }

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(id)) id = name.ToLowerInvariant().Replace(' ', '_');
            maxHealth = Mathf.Max(1f, maxHealth);
            reloadTime = Mathf.Max(0.1f, reloadTime);
            attackCooldown = Mathf.Max(0.05f, attackCooldown);
        }
    }
}
