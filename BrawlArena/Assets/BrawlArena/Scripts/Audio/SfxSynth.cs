// ---------------------------------------------------------------------------------------------
// SfxSynth – erzeugt alle Standard-Soundeffekte mathematisch (Oszillatoren, Rauschen,
// Hüllkurven). Ergebnis: eigene, lizenzfreie Sounds ohne Audiodateien.
// MusicSynth – erzeugt eine fröhliche Menü- und eine treibende Kampfmusik-Schleife.
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using BrawlArena.Data;

namespace BrawlArena.Audio
{
    public static class SfxSynth
    {
        private const int Rate = 22050;

        private struct Voice
        {
            public float f0, f1;      // Start-/Endfrequenz
            public float noise;       // Rauschanteil 0..1
            public float square;      // Rechteckanteil 0..1
            public float attack, decay; // Sekunden
            public float vibrato;
        }

        public static AudioClip Generate(SfxPreset p)
        {
            switch (p)
            {
                case SfxPreset.Pew: return Make(p, 0.16f, new Voice { f0 = 1300, f1 = 380, square = 0.6f, attack = 0.003f, decay = 0.15f });
                case SfxPreset.Shotgun: return Make(p, 0.3f, new Voice { f0 = 180, f1 = 60, noise = 0.85f, attack = 0.002f, decay = 0.28f });
                case SfxPreset.Laser: return Make(p, 0.3f, new Voice { f0 = 2200, f1 = 900, square = 0.3f, attack = 0.005f, decay = 0.28f, vibrato = 40 });
                case SfxPreset.Throw: return Make(p, 0.25f, new Voice { f0 = 300, f1 = 700, noise = 0.4f, attack = 0.05f, decay = 0.2f });
                case SfxPreset.Explosion: return Make(p, 0.7f, new Voice { f0 = 110, f1 = 30, noise = 0.9f, attack = 0.003f, decay = 0.65f });
                case SfxPreset.Swoosh: return Make(p, 0.22f, new Voice { f0 = 500, f1 = 200, noise = 0.95f, attack = 0.04f, decay = 0.18f });
                case SfxPreset.Zap: return Make(p, 0.25f, new Voice { f0 = 900, f1 = 1600, square = 0.8f, noise = 0.2f, attack = 0.002f, decay = 0.22f, vibrato = 90 });
                case SfxPreset.Magic: return MakeArp(p, new[] { 880f, 1108f, 1318f, 1760f }, 0.06f, 0.4f);
                case SfxPreset.Heal: return MakeArp(p, new[] { 523f, 659f, 784f, 1046f }, 0.07f, 0.45f);
                case SfxPreset.Punch: return Make(p, 0.15f, new Voice { f0 = 160, f1 = 60, noise = 0.6f, attack = 0.002f, decay = 0.13f });
                case SfxPreset.Hit: return Make(p, 0.1f, new Voice { f0 = 700, f1 = 200, noise = 0.5f, square = 0.3f, attack = 0.001f, decay = 0.09f });
                case SfxPreset.Hurt: return Make(p, 0.2f, new Voice { f0 = 420, f1 = 180, square = 0.7f, attack = 0.002f, decay = 0.18f });
                case SfxPreset.Death: return Make(p, 0.6f, new Voice { f0 = 600, f1 = 80, square = 0.6f, noise = 0.2f, attack = 0.01f, decay = 0.58f, vibrato = 15 });
                case SfxPreset.Pickup: return MakeArp(p, new[] { 660f, 990f }, 0.06f, 0.2f);
                case SfxPreset.Gem: return MakeArp(p, new[] { 1318f, 1760f, 2093f }, 0.05f, 0.25f);
                case SfxPreset.Click: return Make(p, 0.06f, new Voice { f0 = 1500, f1 = 1100, square = 0.5f, attack = 0.001f, decay = 0.05f });
                case SfxPreset.Confirm: return MakeArp(p, new[] { 784f, 1175f }, 0.07f, 0.22f);
                case SfxPreset.SuperReady: return MakeArp(p, new[] { 523f, 784f, 1046f, 1568f }, 0.06f, 0.5f);
                case SfxPreset.Victory: return MakeArp(p, new[] { 523f, 659f, 784f, 1046f, 784f, 1046f }, 0.13f, 1.1f);
                case SfxPreset.Defeat: return MakeArp(p, new[] { 392f, 370f, 349f, 262f }, 0.22f, 1.1f);
                case SfxPreset.Countdown: return Make(p, 0.18f, new Voice { f0 = 880, f1 = 880, square = 0.5f, attack = 0.002f, decay = 0.16f });
                case SfxPreset.Goal: return MakeArp(p, new[] { 523f, 659f, 784f, 1046f, 1318f }, 0.08f, 0.8f);
                case SfxPreset.Dash: return Make(p, 0.3f, new Voice { f0 = 200, f1 = 900, noise = 0.7f, attack = 0.02f, decay = 0.26f });
                case SfxPreset.Footstep: return Make(p, 0.05f, new Voice { f0 = 120, f1 = 80, noise = 0.8f, attack = 0.001f, decay = 0.045f });
                case SfxPreset.Coin: return MakeArp(p, new[] { 1046f, 1568f }, 0.05f, 0.25f);
                case SfxPreset.BoxOpen: return Make(p, 0.6f, new Voice { f0 = 200, f1 = 1200, noise = 0.3f, square = 0.4f, attack = 0.2f, decay = 0.38f, vibrato = 25 });
                case SfxPreset.Deploy: return Make(p, 0.25f, new Voice { f0 = 220, f1 = 440, square = 0.7f, attack = 0.01f, decay = 0.22f });
                case SfxPreset.Shield: return Make(p, 0.4f, new Voice { f0 = 300, f1 = 600, square = 0.2f, attack = 0.05f, decay = 0.33f, vibrato = 30 });
                case SfxPreset.Kick: return Make(p, 0.14f, new Voice { f0 = 220, f1 = 70, noise = 0.4f, attack = 0.001f, decay = 0.13f });
            }
            return Make(p, 0.1f, new Voice { f0 = 600, f1 = 400, attack = 0.002f, decay = 0.09f });
        }

        private static AudioClip Make(SfxPreset name, float length, Voice v)
        {
            int n = Mathf.CeilToInt(length * Rate);
            var data = new float[n];
            float phase = 0f;
            uint seed = 22222u + (uint)name * 7919u;
            float lp = 0f;
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / Rate;
                float k = t / length;
                float f = Mathf.Lerp(v.f0, v.f1, k) + Mathf.Sin(t * 30f) * v.vibrato;
                phase += f / Rate;
                float sine = Mathf.Sin(phase * Mathf.PI * 2f);
                float sq = sine >= 0 ? 1f : -1f;
                seed = seed * 1664525u + 1013904223u;
                float white = ((seed >> 9) / 8388608f) * 2f - 1f;
                lp += (white - lp) * Mathf.Clamp01(f / 3000f + 0.05f); // gefiltertes Rauschen
                float tone = Mathf.Lerp(sine, sq * 0.6f, v.square);
                float s = Mathf.Lerp(tone, lp * 1.6f, v.noise);
                float env = t < v.attack ? t / Mathf.Max(0.0001f, v.attack) : Mathf.Clamp01(1f - (t - v.attack) / Mathf.Max(0.0001f, v.decay));
                data[i] = s * env * env * 0.55f;
            }
            return ToClip(name.ToString(), data);
        }

        private static AudioClip MakeArp(SfxPreset name, float[] notes, float noteLen, float length)
        {
            int n = Mathf.CeilToInt(length * Rate);
            var data = new float[n];
            float phase = 0f;
            for (int i = 0; i < n; i++)
            {
                float t = (float)i / Rate;
                int idx = Mathf.Min(notes.Length - 1, (int)(t / noteLen));
                float f = notes[idx];
                phase += f / Rate;
                float s = Mathf.Sin(phase * Mathf.PI * 2f) * 0.7f + Mathf.Sin(phase * Mathf.PI * 4f) * 0.2f;
                float local = t - idx * noteLen;
                float env = Mathf.Clamp01(local / 0.005f) * Mathf.Exp(-local * 6f);
                float tail = Mathf.Clamp01((length - t) / 0.1f);
                data[i] = s * env * tail * 0.5f;
            }
            return ToClip(name.ToString(), data);
        }

        private static AudioClip ToClip(string name, float[] data)
        {
            var clip = AudioClip.Create("sfx_" + name, data.Length, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }

    public static class MusicSynth
    {
        private const int Rate = 22050;

        /// <summary>Erzeugt eine Musikschleife (8 Takte). battle = schneller und treibender.</summary>
        public static AudioClip Generate(bool battle)
        {
            float bpm = battle ? 138f : 112f;
            float beat = 60f / bpm;
            int bars = 8;
            float length = bars * 4 * beat;
            int n = Mathf.CeilToInt(length * Rate);
            var data = new float[n];
            // Akkordfolge (Grundtöne in Hz): C - A - F - G  bzw. A-Moll-Variante im Kampf
            float[] roots = battle ? new[] { 220f, 174.6f, 261.6f, 196f } : new[] { 261.6f, 220f, 174.6f, 196f };
            int[][] chords = battle
                ? new[] { new[] { 0, 3, 7 }, new[] { 0, 4, 7 }, new[] { 0, 4, 7 }, new[] { 0, 4, 7 } }
                : new[] { new[] { 0, 4, 7 }, new[] { 0, 3, 7 }, new[] { 0, 4, 7 }, new[] { 0, 4, 7 } };
            int[] melody = battle
                ? new[] { 0, 3, 7, 10, 7, 3, 5, 7, 12, 10, 7, 5, 3, 5, 7, 3 }
                : new[] { 7, 9, 12, 9, 7, 4, 7, 9, 12, 14, 12, 9, 7, 9, 4, 7 };
            uint seed = 1234567u;

            for (int i = 0; i < n; i++)
            {
                float t = (float)i / Rate;
                float beatPos = t / beat;
                int bar = (int)(beatPos / 4f) % bars;
                int chordIdx = (bar / 2) % 4;
                float root = roots[chordIdx];
                float s = 0f;

                // Bass (Achtel)
                float eighth = beatPos * 2f;
                float eLocal = (eighth - Mathf.Floor(eighth)) * beat * 0.5f;
                float bassF = root * 0.5f * (((int)eighth % 2 == 1 && battle) ? 2f : 1f);
                s += Saw(t * bassF) * 0.22f * Mathf.Exp(-eLocal * 5f);

                // Akkord-Pad
                foreach (int semi in chords[chordIdx])
                    s += Mathf.Sin(2f * Mathf.PI * t * root * Mathf.Pow(2f, semi / 12f)) * 0.06f;

                // Melodie (Sechzehntel/Achtel)
                float step = beatPos * (battle ? 2f : 1f);
                int mIdx = (int)step % melody.Length;
                float mLocal = (step - Mathf.Floor(step)) * beat / (battle ? 2f : 1f);
                float mf = root * 2f * Mathf.Pow(2f, melody[(mIdx + bar * 3) % melody.Length] / 12f);
                float mEnv = Mathf.Clamp01(mLocal / 0.01f) * Mathf.Exp(-mLocal * (battle ? 9f : 5f));
                float sq = Mathf.Sin(2f * Mathf.PI * t * mf);
                s += (sq + Mathf.Sin(4f * Mathf.PI * t * mf) * 0.3f) * 0.12f * mEnv;

                // Schlagzeug
                float bLocal = (beatPos - Mathf.Floor(beatPos)) * beat;
                int beatInBar = (int)beatPos % 4;
                if (beatInBar == 0 || beatInBar == 2 || battle)
                    s += Mathf.Sin(2f * Mathf.PI * (60f + 90f * Mathf.Exp(-bLocal * 30f)) * bLocal) * Mathf.Exp(-bLocal * 14f) * 0.45f;
                seed = seed * 1664525u + 1013904223u;
                float noise = ((seed >> 9) / 8388608f) * 2f - 1f;
                if (beatInBar == 1 || beatInBar == 3)
                    s += noise * Mathf.Exp(-bLocal * 18f) * 0.22f;
                float hLocal = (eighth - Mathf.Floor(eighth)) * beat * 0.5f;
                s += noise * Mathf.Exp(-hLocal * 60f) * 0.05f;

                data[i] = Mathf.Clamp(s * 0.6f, -1f, 1f);
            }
            // Weiches Schleifenende
            int fade = Rate / 50;
            for (int i = 0; i < fade; i++) { data[i] *= (float)i / fade; data[n - 1 - i] *= (float)i / fade; }
            var clip = AudioClip.Create(battle ? "BattleMusic" : "MenuMusic", n, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        private static float Saw(float x) { return 2f * (x - Mathf.Floor(x + 0.5f)); }
    }
}
