// ---------------------------------------------------------------------------------------------
// ArenaCamera – schräge Third-Person-Kamera wie in Arena-Brawlern: folgt dem Spieler weich,
// blickt etwas voraus, bleibt in den Kartengrenzen und kann wackeln (Explosionen, Treffer).
// ---------------------------------------------------------------------------------------------
using UnityEngine;

namespace BrawlArena.Gameplay
{
    public class ArenaCamera : MonoBehaviour
    {
        public Camera Cam { get; private set; }
        public float Pitch = 58f;
        public float Distance = 15.5f;
        public float FieldOfView = 38f;

        private Transform target;
        private Arena arena;
        private Vector3 focus;
        private float shake;
        private float zoom = 1f, zoomTarget = 1f;

        public static ArenaCamera Create(Transform parent, Color sky)
        {
            var go = new GameObject("ArenaCamera");
            go.transform.SetParent(parent, false);
            var cam = go.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = sky;
            cam.nearClipPlane = 0.5f;
            cam.farClipPlane = 80f;
            cam.tag = "MainCamera";
            var ac = go.AddComponent<ArenaCamera>();
            ac.Cam = cam;
            cam.fieldOfView = ac.FieldOfView;
            // Andere Hauptkameras (Menü) deaktivieren
            foreach (var c in Camera.allCameras) if (c != cam && c.targetTexture == null) c.enabled = false;
            FX.Shake += ac.OnShake;
            return ac;
        }

        private void OnDestroy() { FX.Shake -= OnShake; }

        private void OnShake(float amount) { shake = Mathf.Min(0.6f, shake + amount); }

        public void SetTarget(Transform t, Arena a) { target = t; arena = a; }

        public void SnapTo(Vector3 p) { focus = ClampFocus(p); Apply(0f); }

        public void ZoomIn() { zoomTarget = 0.65f; }

        private void LateUpdate()
        {
            float dt = Time.unscaledDeltaTime;
            if (target != null)
            {
                Vector3 desired = target.position;
                var b = target.GetComponent<Brawler>();
                if (b != null && b.IsAlive) desired += b.Velocity * 0.18f;
                focus = Vector3.Lerp(focus, ClampFocus(desired), 1f - Mathf.Exp(-dt * 7f));
            }
            zoom = Mathf.Lerp(zoom, zoomTarget, 1f - Mathf.Exp(-dt * 3f));
            shake = Mathf.MoveTowards(shake, 0f, dt * 1.8f);
            Apply(shake);
        }

        private Vector3 ClampFocus(Vector3 p)
        {
            if (arena == null) return p;
            float aspect = Cam != null ? Cam.aspect : 1.8f;
            // Sichtbreite in Welt-Einheiten (ungefähr) – schmale Karten bleiben mittig.
            float halfViewW = Distance * Mathf.Tan(FieldOfView * 0.5f * Mathf.Deg2Rad) * aspect * 0.9f;
            float hw = arena.Width * 0.5f, hh = arena.Height * 0.5f;
            p.x = hw <= halfViewW ? 0f : Mathf.Clamp(p.x, -hw + halfViewW, hw - halfViewW);
            p.z = Mathf.Clamp(p.z, -hh + 3.5f, hh - 4.5f);
            p.y = 0f;
            return p;
        }

        private void Apply(float shakeAmount)
        {
            Quaternion rot = Quaternion.Euler(Pitch, 0f, 0f);
            Vector3 pos = focus + new Vector3(0, 0, 1.6f) - rot * Vector3.forward * Distance * zoom;
            if (shakeAmount > 0f) pos += Random.insideUnitSphere * shakeAmount * 0.35f;
            transform.position = pos;
            transform.rotation = rot;
        }

        /// <summary>Wandelt eine Bildschirm-Richtung (Joystick) in eine Welt-Richtung (XZ) um.</summary>
        public Vector2 ScreenToWorldDir(Vector2 screenDir)
        {
            // Kamera schaut entlang +Z ohne Drehung um Y → Bildschirm-oben = Welt +Z.
            return screenDir;
        }
    }
}
