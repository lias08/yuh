// ---------------------------------------------------------------------------------------------
// PreviewStage – kleine 3D-Bühne abseits der Spielwelt, die eine Figur in eine RenderTexture
// rendert (Charakterdetails, Charakter-Editor). PortraitCache rendert einmalig Porträts aller
// Brawler für Listen und Karten.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Data;
using BrawlArena.Gameplay;

namespace BrawlArena.Rendering
{
    public class PreviewStage : MonoBehaviour
    {
        private static int stageCounter;
        public Camera Cam { get; private set; }
        public RenderTexture Texture { get; private set; }
        private Transform pivot;
        private BrawlerAnimator anim;
        private GameObject podium;
        public float Yaw = 160f;
        public bool AutoRotate = true;
        private float idleTimer;

        public static PreviewStage Create(int width, int height, Color background, bool withPodium = true)
        {
            var go = new GameObject("PreviewStage");
            DontDestroyOnLoad(go);
            var stage = go.AddComponent<PreviewStage>();
            stage.transform.position = new Vector3(1000f + (stageCounter++ % 8) * 50f, -500f, 0f);
            stage.Texture = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32) { antiAliasing = QualitySettings.antiAliasing > 0 ? 2 : 1, name = "PreviewRT" };
            var camGo = new GameObject("PreviewCam");
            camGo.transform.SetParent(go.transform, false);
            camGo.transform.localPosition = new Vector3(0, 1.35f, -4.4f);
            camGo.transform.localRotation = Quaternion.Euler(10f, 0, 0);
            stage.Cam = camGo.AddComponent<Camera>();
            stage.Cam.targetTexture = stage.Texture;
            stage.Cam.clearFlags = CameraClearFlags.SolidColor;
            stage.Cam.backgroundColor = background;
            stage.Cam.fieldOfView = 30f;
            stage.Cam.nearClipPlane = 0.3f; stage.Cam.farClipPlane = 20f;
            // Eigenes Licht, damit die Vorschau auch ohne Menübühne beleuchtet ist
            var lightGo = new GameObject("PreviewLight");
            lightGo.transform.SetParent(go.transform, false);
            lightGo.transform.rotation = Quaternion.Euler(35f, -25f, 0f);
            var light = lightGo.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            light.color = new Color(1f, 0.97f, 0.92f);
            light.shadows = LightShadows.None;
            stage.pivot = new GameObject("Pivot").transform;
            stage.pivot.SetParent(go.transform, false);
            if (withPodium)
            {
                stage.podium = new GameObject("Podium");
                stage.podium.transform.SetParent(go.transform, false);
                var mb = new MeshBuilder();
                mb.Add(ProcMesh.Cylinder, new Vector3(0, -0.1f, 0), Quaternion.identity, new Vector3(2.4f, 0.2f, 2.4f), new Color(0.35f, 0.3f, 0.55f));
                mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.01f, 0), Quaternion.identity, new Vector3(2.1f, 0.04f, 2.1f), new Color(0.55f, 0.5f, 0.8f));
                stage.podium.AddComponent<MeshFilter>().sharedMesh = mb.Build("Podium");
                stage.podium.AddComponent<MeshRenderer>().sharedMaterial = MaterialLibrary.WorldToonOutline;
            }
            return stage;
        }

        /// <summary>Zeigt eine Figur (Aussehen + Animationen).</summary>
        public void Show(AppearanceConfig appearance, AnimationConfig animations)
        {
            if (anim != null) { anim.gameObject.SetActive(false); Destroy(anim.gameObject); }
            var go = new GameObject("PreviewBrawler");
            go.transform.SetParent(pivot, false);
            anim = go.AddComponent<BrawlerAnimator>();
            anim.Setup(appearance, animations);
            anim.SetFacing(Vector3.forward, true);
            anim.PlaySpawn();
            // Kamera an Figurengröße anpassen
            float h = Mathf.Max(1f, anim.Rig.height);
            Cam.transform.localPosition = new Vector3(0, h * 0.55f + 0.2f, -2.6f - h * 1.25f);
            Cam.transform.localRotation = Quaternion.Euler(8f, 0, 0);
        }

        public void Show(BrawlerDefinition def) { Show(def.appearance, def.animations); }

        public void PlayAttack(bool super)
        {
            if (anim == null) return;
            if (super) anim.PlaySuper(); else anim.PlayAttack(SwingDirection.LeftToRight, true, 0.3f);
        }

        public void Drag(float dx) { Yaw -= dx * 0.4f; idleTimer = 3f; }

        private void Update()
        {
            idleTimer -= Time.unscaledDeltaTime;
            if (AutoRotate && idleTimer <= 0f) Yaw += Time.unscaledDeltaTime * 20f;
            pivot.localRotation = Quaternion.Euler(0, Yaw, 0);
            if (anim != null) anim.SetMovement(0f);
        }

        public void SetActive(bool active) { gameObject.SetActive(active); }

        private void OnDestroy()
        {
            if (Texture != null) { Texture.Release(); Destroy(Texture); }
        }
    }

    /// <summary>Erzeugt und speichert Porträtbilder aller Brawler (einmalig gerendert).</summary>
    public static class PortraitCache
    {
        private static readonly Dictionary<string, Texture2D> cache = new Dictionary<string, Texture2D>();
        private static PreviewStage stage;

        public static Texture Get(BrawlerDefinition def, AppearanceConfig appearanceOverride = null, string key = null)
        {
            if (def.portrait != null) return def.portrait.texture;
            key = key ?? def.id;
            Texture2D tex;
            if (cache.TryGetValue(key, out tex) && tex != null) return tex;
            if (stage == null)
            {
                stage = PreviewStage.Create(256, 256, new Color(0, 0, 0, 0), false);
                stage.AutoRotate = false;
            }
            stage.gameObject.SetActive(true);
            stage.Show(appearanceOverride ?? def.appearance, def.animations);
            stage.Yaw = 200f;
            var t = stage.transform.Find("Pivot");
            t.localRotation = Quaternion.Euler(0, stage.Yaw, 0);
            // Porträt-Ausschnitt: Kopf und Oberkörper
            var animator = t.GetComponentInChildren<BrawlerAnimator>();
            float h = animator != null && animator.Rig != null ? animator.Rig.height : 1.4f;
            animator.transform.localScale = Vector3.one;
            stage.Cam.transform.localPosition = new Vector3(0, h * 0.62f, -1.6f - h * 0.85f);
            stage.Cam.transform.localRotation = Quaternion.Euler(6f, 0, 0);
            stage.Cam.backgroundColor = new Color(0, 0, 0, 0);
            stage.Cam.Render();
            var prev = RenderTexture.active;
            RenderTexture.active = stage.Texture;
            tex = new Texture2D(256, 256, TextureFormat.RGBA32, false);
            tex.ReadPixels(new Rect(0, 0, 256, 256), 0, 0);
            tex.Apply();
            RenderTexture.active = prev;
            stage.gameObject.SetActive(false);
            cache[key] = tex;
            return tex;
        }

        public static void Invalidate(string key) { cache.Remove(key); }
    }
}
