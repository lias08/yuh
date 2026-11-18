// ---------------------------------------------------------------------------------------------
// Combat – gemeinsame Typen für Schaden, Teams und alles, was Schaden nehmen kann.
// ---------------------------------------------------------------------------------------------
using UnityEngine;

namespace BrawlArena.Gameplay
{
    /// <summary>Alle Objekte, die getroffen werden können (Brawler, Türme, Kisten, Puppen ...).</summary>
    public interface IDamageable
    {
        int Team { get; }
        Vector3 Position { get; }
        float Radius { get; }
        bool IsAlive { get; }
        /// <summary>Fügt Schaden zu und gibt den tatsächlich verursachten Schaden zurück.</summary>
        float TakeDamage(DamageInfo info);
    }

    /// <summary>Alle Daten eines einzelnen Treffers.</summary>
    public struct DamageInfo
    {
        public float amount;
        public Brawler attacker;
        public Vector3 sourcePosition;
        public float knockback;
        public float slowPercent;
        public float slowDuration;
        public float stunDuration;
        public bool fromSuper;
        public Color color;

        public static DamageInfo Simple(float amount, Brawler attacker, Vector3 from, bool super)
        {
            return new DamageInfo { amount = amount, attacker = attacker, sourcePosition = from, fromSuper = super, color = Color.white };
        }
    }

    /// <summary>Teamfarben und -namen. Team 0 = Blau (Spielerteam), 1 = Rot, weitere = Showdown.</summary>
    public static class TeamUtil
    {
        public const int Neutral = -1;
        public static readonly Color Blue = new Color(0.25f, 0.6f, 1f);
        public static readonly Color Red = new Color(1f, 0.28f, 0.3f);
        public static readonly Color Self = new Color(0.35f, 1f, 0.45f);

        /// <summary>Farbe eines Teams aus Sicht des lokalen Spielers.</summary>
        public static Color ColorFor(int team, int localTeam, bool isSelf)
        {
            if (isSelf) return Self;
            return team == localTeam ? Blue : Red;
        }

        public static string Name(int team)
        {
            if (team == 0) return "Blau";
            if (team == 1) return "Rot";
            return "Team " + (team + 1);
        }
    }
}
