// ---------------------------------------------------------------------------------------------
// InputFrame – die komplette Steuerung eines Brawlers für einen Frame.
// Spieler (Touch/Tastatur), Bots und später Netzwerk-Spieler liefern alle dieselbe Struktur.
// → Für Online-Multiplayer muss nur eine neue IBrawlerInputSource geschrieben werden, die
//   InputFrames aus dem Netzwerk liest. Die Spiellogik bleibt unverändert.
// ---------------------------------------------------------------------------------------------
using System;
using UnityEngine;

namespace BrawlArena.Gameplay
{
    public enum AimShape { Line, Cone, Circle, Arc, Self }

    [Serializable]
    public struct InputFrame
    {
        /// <summary>Bewegung in Welt-XZ (Länge 0..1).</summary>
        public Vector2 move;

        /// <summary>Angriff wurde in diesem Frame ausgelöst.</summary>
        public bool attack;
        /// <summary>Automatisch zielen (kurzes Antippen).</summary>
        public bool attackAuto;
        /// <summary>Zielrichtung in Welt-XZ; Länge 0..1 = Anteil der Reichweite (für Würfe).</summary>
        public Vector2 attackAim;

        public bool super;
        public bool superAuto;
        public Vector2 superAim;

        /// <summary>Spieler zielt gerade (Zielanzeige sichtbar) – Figur dreht sich in diese Richtung.</summary>
        public bool aiming;
        public Vector2 aimingDir;

        public static Vector3 ToWorld(Vector2 v) { return new Vector3(v.x, 0f, v.y); }
        public static Vector2 FromWorld(Vector3 v) { return new Vector2(v.x, v.z); }
    }

    /// <summary>Quelle für Steuerbefehle (Spieler, Bot, Netzwerk, Replay ...).</summary>
    public interface IBrawlerInputSource
    {
        InputFrame Poll(Brawler self, float dt);
    }

    /// <summary>Keine Eingabe (z.B. Trainingspuppe).</summary>
    public class NullInput : IBrawlerInputSource
    {
        public InputFrame Poll(Brawler self, float dt) { return new InputFrame(); }
    }
}
