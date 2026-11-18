// ---------------------------------------------------------------------------------------------
// SkinDefinition – alternatives Aussehen eines Brawlers.
// Anlegen: Create > BrawlArena > Skin, in "Resources/BrawlArena/Skins" speichern,
// "brawlerId" auf die ID des Brawlers setzen. Ein Skin kann Farben/Hut/Waffe ändern
// oder ein komplett eigenes Modell (+ Animationen) mitbringen.
// ---------------------------------------------------------------------------------------------
using UnityEngine;

namespace BrawlArena.Data
{
    [CreateAssetMenu(menuName = "BrawlArena/Skin", fileName = "NewSkin", order = 2)]
    public class SkinDefinition : ScriptableObject
    {
        public string id = "new_skin";
        [Tooltip("ID des Brawlers, zu dem der Skin gehört.")]
        public string brawlerId = "";
        public string displayName = "Neuer Skin";
        [Tooltip("Preis in Edelsteinen (0 = gratis).")]
        public int gemPrice = 30;
        public Rarity rarity = Rarity.Epic;

        [Tooltip("Komplettes Aussehen, das das Original ersetzt.")]
        public AppearanceConfig appearance = new AppearanceConfig();
        [Tooltip("Eigene Animationen übernehmen? (Sonst die des Brawlers.)")]
        public bool overrideAnimations = false;
        public AnimationConfig animations = new AnimationConfig();
        [Tooltip("Projektilfarbe ändern?")]
        public bool overrideAttackColor = false;
        public Color attackColor = Color.cyan;
        [Tooltip("Optional: eigene Sounds.")]
        public bool overrideSounds = false;
        public SoundSet sounds = new SoundSet();

        /// <summary>Wendet den Skin auf eine Laufzeitkopie eines Brawlers an.</summary>
        public void ApplyTo(BrawlerDefinition runtimeCopy)
        {
            runtimeCopy.appearance = appearance.Clone();
            if (overrideAnimations) runtimeCopy.animations = animations.Clone();
            if (overrideAttackColor)
            {
                runtimeCopy.mainAttack.color = attackColor;
                runtimeCopy.superAbility.color = attackColor;
            }
            if (overrideSounds) runtimeCopy.sounds = sounds.Clone();
        }
    }
}
