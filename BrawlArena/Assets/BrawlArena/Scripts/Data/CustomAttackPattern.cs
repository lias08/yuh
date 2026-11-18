// ---------------------------------------------------------------------------------------------
// CustomAttackPattern – Erweiterungspunkt für völlig neue Angriffsarten.
//
// So fügst du einen neuen Angriff hinzu (einmalig etwas Code nötig, danach nur noch Daten):
//   1. Neue Klasse erstellen:   public class MeinAngriff : CustomAttackPattern { ... }
//   2. Execute(...) überschreiben und z.B. ctx.SpawnProjectile(...) / ctx.DamageArea(...) nutzen.
//   3. Im Projekt: Rechtsklick > Create > BrawlArena > (dein Asset) – oder [CreateAssetMenu] setzen.
//   4. Im Brawler: kind = Custom und das Asset unter "customPattern" eintragen.
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using BrawlArena.Gameplay;

namespace BrawlArena.Data
{
    public abstract class CustomAttackPattern : ScriptableObject
    {
        /// <summary>Wird beim Auslösen des Angriffs aufgerufen.</summary>
        /// <param name="ctx">Kontext mit Besitzer, Zielrichtung, Zielpunkt und Hilfsfunktionen.</param>
        public abstract void Execute(AttackContext ctx);

        /// <summary>Optional: Form der Zielanzeige (Standard: Linie).</summary>
        public virtual AimShape AimShape { get { return AimShape.Line; } }
    }

    /// <summary>Beispiel für ein eigenes Muster: Spirale aus Projektilen.</summary>
    [CreateAssetMenu(menuName = "BrawlArena/Angriffsmuster/Spirale (Beispiel)", fileName = "SpiralPattern")]
    public class SpiralAttackPattern : CustomAttackPattern
    {
        public int arms = 3;
        public int waves = 4;
        public float waveDelay = 0.1f;

        public override void Execute(AttackContext ctx)
        {
            for (int w = 0; w < waves; w++)
            {
                int wave = w;
                ctx.Schedule(wave * waveDelay, () =>
                {
                    for (int a = 0; a < arms; a++)
                    {
                        float ang = (360f / arms) * a + wave * 25f;
                        Vector3 dir = Quaternion.Euler(0f, ang, 0f) * ctx.AimDirection;
                        ctx.SpawnProjectile(dir, ctx.Spec.range, ctx.Spec.damage);
                    }
                });
            }
        }
    }
}
