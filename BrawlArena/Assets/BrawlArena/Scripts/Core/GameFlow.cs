// ---------------------------------------------------------------------------------------------
// GameBootstrap + GameFlow – Einstiegspunkt und Ablaufsteuerung.
// Das Spiel startet automatisch in JEDER Szene (RuntimeInitializeOnLoadMethod), d.h. eine
// leere Szene genügt. Ablauf: Hauptmenü → Matchmaking → Match → Ergebnis → Hauptmenü.
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using BrawlArena.Audio;
using BrawlArena.Data;
using BrawlArena.Gameplay;
using BrawlArena.Net;
using BrawlArena.Rendering;
using BrawlArena.Save;
using BrawlArena.UI;

namespace BrawlArena.Core
{
    public static class GameBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            if (GameFlow.Instance != null) return;
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
            Screen.orientation = ScreenOrientation.AutoRotation;
            Screen.autorotateToLandscapeLeft = Screen.autorotateToLandscapeRight = true;
            Screen.autorotateToPortrait = Screen.autorotateToPortraitUpsideDown = false;
            Input.multiTouchEnabled = true;

            // Szenen-Kameras/Lichter der Vorlage deaktivieren – das Spiel baut alles selbst.
            foreach (var cam in Object.FindObjectsOfType<Camera>()) cam.gameObject.SetActive(false);
            foreach (var l in Object.FindObjectsOfType<Light>()) l.gameObject.SetActive(false);

            var root = new GameObject("BrawlArena");
            Object.DontDestroyOnLoad(root);
            SaveSystem.Load();
            ContentDatabase.Init();
            AudioManager.Create(root.transform);
            FX.Init(root.transform);
            UIManager.Create(root.transform);
            var flow = root.AddComponent<GameFlow>();
            flow.Init();
        }
    }

    public class GameFlow : MonoBehaviour
    {
        public static GameFlow Instance { get; private set; }
        public IMatchmaker Matchmaker { get; private set; }
        public MenuStage Stage { get; private set; }
        public MatchConfig LastConfig { get; private set; }
        private bool inMatch;

        public void Init()
        {
            Instance = this;
            Matchmaker = new OfflineMatchmaker();
            ApplySettings();
            Stage = MenuStage.Create(transform);
            UIManager.Instance.ScreenChanged += s => Stage.SetVisible(!inMatch && s != null && s.ShowMenuStage);
            ValidateSelection();
            GoToMenu();
        }

        /// <summary>Stellt sicher, dass gewählter Brawler/Modus existieren und freigeschaltet sind.</summary>
        public void ValidateSelection()
        {
            var p = SaveSystem.Profile;
            var b = ContentDatabase.GetBrawler(p.selectedBrawlerId);
            if (b == null || !p.IsUnlocked(b))
            {
                var first = ContentDatabase.Brawlers.Find(x => p.IsUnlocked(x)) ?? ContentDatabase.Brawlers[0];
                p.selectedBrawlerId = first.id;
                p.Get(first.id).unlocked = true;
            }
            if (ContentDatabase.GetMode(p.selectedModeId) == null) p.selectedModeId = ContentDatabase.Modes[0].id;
            var mode = ContentDatabase.GetMode(p.selectedModeId);
            var map = ContentDatabase.GetMap(p.selectedMapId);
            if (map != null && !map.Supports(mode)) p.selectedMapId = "";
        }

        public void ApplySettings()
        {
            var s = SaveSystem.Profile.settings;
            if (AudioManager.Instance != null) { AudioManager.Instance.MusicVolume = s.musicVolume; AudioManager.Instance.SfxVolume = s.sfxVolume; }
            Application.targetFrameRate = s.targetFps60 ? 60 : 30;
            FX.Quality = s.quality;
            switch (s.quality)
            {
                case 0:
                    QualitySettings.shadows = ShadowQuality.Disable;
                    QualitySettings.antiAliasing = 0;
                    QualitySettings.shadowDistance = 0f;
                    break;
                case 1:
                    QualitySettings.shadows = ShadowQuality.HardOnly;
                    QualitySettings.shadowResolution = ShadowResolution.Low;
                    QualitySettings.antiAliasing = 0;
                    QualitySettings.shadowDistance = 22f;
                    break;
                default:
                    QualitySettings.shadows = ShadowQuality.All;
                    QualitySettings.shadowResolution = ShadowResolution.Medium;
                    QualitySettings.antiAliasing = 2;
                    QualitySettings.shadowDistance = 28f;
                    break;
            }
            QualitySettings.shadowCascades = 1;
            QualitySettings.shadowProjection = ShadowProjection.StableFit;
            QualitySettings.vSyncCount = 0;
        }

        // ------------------------------------------------------------------ Menü
        public void GoToMenu()
        {
            inMatch = false;
            UIManager.Instance.SetRoot<MainMenuScreen>();
            Stage.SetVisible(true);
            Stage.ShowBrawler(SelectedBrawlerForDisplay());
            AudioManager.Instance.PlayMenuMusic();
        }

        /// <summary>Gewählter Brawler mit gewähltem Skin.</summary>
        public BrawlerDefinition SelectedBrawlerForDisplay()
        {
            var p = SaveSystem.Profile;
            var def = ContentDatabase.GetBrawler(p.selectedBrawlerId) ?? ContentDatabase.Brawlers[0];
            return ContentDatabase.CreateSkinned(def, p.Get(def.id).selectedSkin);
        }

        // ------------------------------------------------------------------ Match
        public void StartMatchmaking()
        {
            var p = SaveSystem.Profile;
            var mode = ContentDatabase.GetMode(p.selectedModeId);
            if (mode == null) return;
            if (mode.modeType == ModeType.Training)
            {
                // Training braucht keine Spielersuche
                Matchmaker.FindMatch(BuildRequest(), null, StartMatch);
                return;
            }
            UIManager.Instance.Push<MatchmakingScreen>();
            Matchmaker.FindMatch(BuildRequest(), (found, needed) =>
            {
                var mm = UIManager.Instance.Current as MatchmakingScreen;
                if (mm != null) mm.SetProgress(found, needed);
            }, StartMatch);
        }

        public void CancelMatchmaking()
        {
            Matchmaker.Cancel();
            if (UIManager.Instance.Current is MatchmakingScreen) UIManager.Instance.Back();
        }

        private MatchRequest BuildRequest()
        {
            var p = SaveSystem.Profile;
            var bp = p.Get(p.selectedBrawlerId);
            return new MatchRequest
            {
                modeId = p.selectedModeId,
                mapId = p.selectedMapId,
                localPlayer = new MatchParticipant
                {
                    playerId = "local", displayName = p.playerName, brawlerId = p.selectedBrawlerId, skinId = bp.selectedSkin,
                    level = bp.level, isLocal = true, trophies = bp.trophies
                }
            };
        }

        public void StartMatch(MatchConfig config)
        {
            LastConfig = config;
            inMatch = true;
            UIManager.Instance.CloseAllPopups();
            UIManager.Instance.ClearScreens();
            Stage.SetVisible(false);
            try
            {
                var hud = MatchHUD.Create(UIManager.Instance.HudRoot);
                var ctx = MatchContext.StartMatch(config, OnMatchFinished);
                hud.Bind(ctx);
            }
            catch (System.Exception e)
            {
                Debug.LogException(e);
                MatchHUD.DestroyCurrent();
                if (MatchContext.Current != null) MatchContext.Current.Dispose();
                GoToMenu();
                UIManager.Instance.Message("Fehler", "Das Match konnte nicht gestartet werden:\n" + e.Message);
            }
        }

        private void OnMatchFinished(MatchResult result)
        {
            MatchHUD.DestroyCurrent();
            inMatch = false;
            var p = SaveSystem.Profile;
            int levelBefore = p.level;
            Economy.ApplyMatchResult(result, p.selectedBrawlerId);
            if (result.outcome == MatchOutcome.None) { GoToMenu(); return; }
            Stage.SetVisible(true);
            Stage.ShowBrawler(SelectedBrawlerForDisplay());
            var rs = UIManager.Instance.SetRoot<ResultScreen>();
            rs.Show(result, levelBefore);
            AudioManager.Instance.PlayMenuMusic();
        }

        public void PlayAgain()
        {
            GoToMenu();
            StartMatchmaking();
        }

        private void Update()
        {
            Matchmaker.Tick(Time.unscaledDeltaTime);
        }

        private void OnApplicationPause(bool paused) { if (paused) SaveSystem.Save(); }
        private void OnApplicationQuit() { SaveSystem.Save(); }
    }

    /// <summary>
    /// 3D-Menübühne: der gewählte Brawler auf einem Podest vor buntem Hintergrund,
    /// direkt von einer eigenen Kamera gerendert (UI liegt darüber).
    /// </summary>
    public class MenuStage : MonoBehaviour
    {
        private Camera cam;
        private Light sun;
        private Transform pivot;
        private BrawlerAnimator current;
        private float yaw = 180f, dragVel;
        private Transform decoRoot;

        public static MenuStage Create(Transform parent)
        {
            var go = new GameObject("MenuStage");
            go.transform.SetParent(parent, false);
            go.transform.position = new Vector3(0, -300f, 0);
            var s = go.AddComponent<MenuStage>();
            s.Build();
            s.SetVisible(true);
            return s;
        }

        private void Build()
        {
            var camGo = new GameObject("MenuCamera");
            camGo.transform.SetParent(transform, false);
            camGo.transform.localPosition = new Vector3(0, 1.5f, -6.2f);
            camGo.transform.localRotation = Quaternion.Euler(6f, 0, 0);
            cam = camGo.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.28f, 0.45f, 0.95f);
            cam.fieldOfView = 34f;
            cam.depth = -1;
            camGo.AddComponent<AudioListener>().enabled = false;

            var lgo = new GameObject("MenuSun");
            lgo.transform.SetParent(transform, false);
            lgo.transform.rotation = Quaternion.Euler(40f, -30f, 0);
            sun = lgo.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.intensity = 1.15f;
            sun.color = new Color(1f, 0.96f, 0.9f);
            sun.shadows = LightShadows.Soft;
            sun.shadowStrength = 0.5f;

            pivot = new GameObject("Pivot").transform;
            pivot.SetParent(transform, false);

            // Podest + Hintergrund
            decoRoot = new GameObject("Deco").transform;
            decoRoot.SetParent(transform, false);
            var mb = new MeshBuilder();
            mb.Add(ProcMesh.Cylinder, new Vector3(0, -0.15f, 0), Quaternion.identity, new Vector3(2.6f, 0.3f, 2.6f), new Color(0.98f, 0.75f, 0.2f));
            mb.Add(ProcMesh.Cylinder, new Vector3(0, -0.45f, 0), Quaternion.identity, new Vector3(3.1f, 0.35f, 3.1f), new Color(0.85f, 0.5f, 0.15f));
            mb.Add(ProcMesh.Torus, new Vector3(0, 0.0f, 0), Quaternion.identity, new Vector3(2.6f, 1f, 2.6f), new Color(1f, 0.9f, 0.5f));
            // Boden
            mb.Add(ProcMesh.Cylinder, new Vector3(0, -0.7f, 4f), Quaternion.identity, new Vector3(40f, 0.2f, 30f), new Color(0.35f, 0.5f, 0.95f));
            // Stilisierte Bühnen-Elemente im Hintergrund
            for (int i = 0; i < 9; i++)
            {
                float x = (i - 4) * 2.4f;
                float h = 2.5f + Mathf.Abs(Mathf.Sin(i * 1.7f)) * 3f;
                Color c = Color.HSVToRGB(0.6f + i * 0.02f, 0.55f, 0.85f);
                mb.Add(ProcMesh.Box, new Vector3(x, h * 0.5f - 0.6f, 9f + Mathf.Abs(i - 4) * 0.4f), Quaternion.Euler(0, (i - 4) * 4f, 0), new Vector3(2f, h, 1.2f), c);
                mb.Add(ProcMesh.Box, new Vector3(x, h - 0.5f, 9f + Mathf.Abs(i - 4) * 0.4f), Quaternion.Euler(0, (i - 4) * 4f, 0), new Vector3(2.15f, 0.25f, 1.35f), Color.Lerp(c, Color.white, 0.35f));
            }
            for (int i = 0; i < 6; i++)
            {
                float a = i / 6f * Mathf.PI * 2f;
                mb.Add(ProcMesh.SphereLow, new Vector3(Mathf.Cos(a) * 6.5f, -0.2f, 4f + Mathf.Sin(a) * 2.5f), Quaternion.identity, new Vector3(1.6f, 1.2f, 1.6f), new Color(0.3f, 0.75f, 0.4f));
            }
            var d = new GameObject("StageMesh");
            d.transform.SetParent(decoRoot, false);
            d.AddComponent<MeshFilter>().sharedMesh = mb.Build("MenuStage");
            d.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.WorldToonOutline;
        }

        public void ShowBrawler(BrawlerDefinition def)
        {
            if (current != null) { current.gameObject.SetActive(false); Destroy(current.gameObject); }
            var go = new GameObject("MenuBrawler");
            go.transform.SetParent(pivot, false);
            current = go.AddComponent<BrawlerAnimator>();
            current.Setup(def.appearance, def.animations);
            current.SetFacing(Vector3.forward, true);
            current.PlaySpawn();
            FX.PowerUp(pivot.position, RarityUtil.GetColor(def.rarity));
        }

        public void PlayCheer() { if (current != null) current.PlaySuper(); }

        public void SetVisible(bool v)
        {
            gameObject.SetActive(v);
            if (!v) return;
            cam.enabled = true;
            // Umgebungslicht für das Menü (das Match setzt eigenes)
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.75f, 0.82f, 1f);
            RenderSettings.ambientEquatorColor = new Color(0.65f, 0.65f, 0.8f);
            RenderSettings.ambientGroundColor = new Color(0.35f, 0.32f, 0.45f);
            RenderSettings.fog = false;
        }

        /// <summary>Verschiebt die Kamera, damit der Brawler im freien Bildbereich steht.</summary>
        public void SetFraming(float screenOffsetX) { cam.transform.localPosition = new Vector3(-screenOffsetX, 1.5f, -6.2f); }

        public void Drag(float dx) { dragVel = -dx * 0.5f; }

        private void Update()
        {
            dragVel = Mathf.Lerp(dragVel, 0f, Time.unscaledDeltaTime * 4f);
            yaw += dragVel;
            yaw = Mathf.LerpAngle(yaw, 180f, Time.unscaledDeltaTime * (Mathf.Abs(dragVel) < 0.5f ? 1.2f : 0f));
            pivot.localRotation = Quaternion.Euler(0, yaw, 0); // 180° = Blick zur Kamera
            if (current != null) current.SetMovement(0f);
            if (AudioManager.Instance != null) AudioManager.Instance.ListenerPosition = transform.position;
        }
    }
}
