// ---------------------------------------------------------------------------------------------
// AudioManager – spielt Soundeffekte (eigene AudioClips oder synthetische Ersatzsounds) und
// Musik. Alle Standard-Sounds werden prozedural erzeugt (SfxSynth / MusicSynth), es werden
// also keine fremden Audiodateien benötigt. Eigene Clips: im BrawlerDefinition-Asset eintragen
// oder Dateien nach "Resources/BrawlArena/Audio/<PresetName>" legen (überschreibt Synth-Sound).
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Data;

namespace BrawlArena.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        private readonly Dictionary<SfxPreset, AudioClip> presetClips = new Dictionary<SfxPreset, AudioClip>();
        private readonly List<AudioSource> sources = new List<AudioSource>();
        private AudioSource musicSource;
        private AudioClip menuMusic, battleMusic;
        private readonly Dictionary<SfxPreset, float> lastPlayed = new Dictionary<SfxPreset, float>();

        public float SfxVolume = 0.8f;
        public float MusicVolume = 0.5f;
        /// <summary>Position, relativ zu der Lautstärke nach Entfernung berechnet wird (Kamera-Ziel).</summary>
        public Vector3 ListenerPosition;

        public static AudioManager Create(Transform parent)
        {
            var go = new GameObject("AudioManager");
            go.transform.SetParent(parent, false);
            Instance = go.AddComponent<AudioManager>();
            Instance.Setup();
            return Instance;
        }

        private void Setup()
        {
            for (int i = 0; i < 16; i++)
            {
                var s = gameObject.AddComponent<AudioSource>();
                s.playOnAwake = false;
                s.spatialBlend = 0f;
                sources.Add(s);
            }
            musicSource = gameObject.AddComponent<AudioSource>();
            musicSource.loop = true;
            musicSource.playOnAwake = false;
            if (FindObjectOfType<AudioListener>() == null) gameObject.AddComponent<AudioListener>();
        }

        public AudioClip GetClip(SfxPreset preset)
        {
            if (preset == SfxPreset.None) return null;
            AudioClip c;
            if (presetClips.TryGetValue(preset, out c)) return c;
            c = Resources.Load<AudioClip>("BrawlArena/Audio/" + preset);
            if (c == null) c = SfxSynth.Generate(preset);
            presetClips[preset] = c;
            return c;
        }

        /// <summary>Spielt einen Sound. Bei worldPos != null wird die Lautstärke nach Entfernung skaliert.</summary>
        public void Play(AudioClip clip, Vector3? worldPos = null, float volume = 1f, float pitch = 1f)
        {
            if (clip == null || SfxVolume <= 0.001f) return;
            float vol = volume * SfxVolume;
            if (worldPos.HasValue)
            {
                float d = Vector3.Distance(worldPos.Value, ListenerPosition);
                vol *= Mathf.Clamp01(1.2f - d / 16f);
                if (vol < 0.02f) return;
            }
            AudioSource src = null;
            foreach (var s in sources) if (!s.isPlaying) { src = s; break; }
            if (src == null) src = sources[Random.Range(0, sources.Count)];
            src.pitch = pitch * Random.Range(0.95f, 1.05f);
            src.PlayOneShot(clip, vol);
        }

        public void Play(SfxPreset preset, Vector3? worldPos = null, float volume = 1f, float pitch = 1f)
        {
            // Gleichen Sound nicht 20x im selben Frame stapeln
            float last;
            if (lastPlayed.TryGetValue(preset, out last) && Time.unscaledTime - last < 0.035f) return;
            lastPlayed[preset] = Time.unscaledTime;
            Play(GetClip(preset), worldPos, volume, pitch);
        }

        /// <summary>Eigener Clip, sonst Ersatz-Preset.</summary>
        public void Play(AudioClip custom, SfxPreset fallback, Vector3? worldPos, float volume = 1f, float pitch = 1f)
        {
            if (custom != null) Play(custom, worldPos, volume, pitch);
            else Play(fallback, worldPos, volume, pitch);
        }

        public static void Sfx(SfxPreset preset, Vector3? pos = null, float volume = 1f, float pitch = 1f)
        {
            if (Instance != null) Instance.Play(preset, pos, volume, pitch);
        }

        public static void UiClick() { Sfx(SfxPreset.Click, null, 0.6f); }

        // ------------------------------------------------------------------ Musik
        public void PlayMenuMusic()
        {
            if (menuMusic == null) menuMusic = Resources.Load<AudioClip>("BrawlArena/Audio/MenuMusic") ?? MusicSynth.Generate(false);
            PlayMusic(menuMusic);
        }

        public void PlayBattleMusic()
        {
            if (battleMusic == null) battleMusic = Resources.Load<AudioClip>("BrawlArena/Audio/BattleMusic") ?? MusicSynth.Generate(true);
            PlayMusic(battleMusic);
        }

        public void StopMusic() { musicSource.Stop(); }

        private void PlayMusic(AudioClip clip)
        {
            if (musicSource.clip == clip && musicSource.isPlaying) return;
            musicSource.clip = clip;
            musicSource.volume = MusicVolume * 0.6f;
            musicSource.Play();
        }

        private void Update()
        {
            musicSource.volume = Mathf.MoveTowards(musicSource.volume, MusicVolume * 0.6f, Time.unscaledDeltaTime);
        }
    }
}
