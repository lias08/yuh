// ---------------------------------------------------------------------------------------------
// VirtualJoystick – Touch-Joystick (Multitouch-fähig über das EventSystem).
//  • Bewegungsmodus: Joystick erscheint dort, wo der Daumen aufsetzt (optional fest).
//  • Angriffsmodus: Antippen = automatisch zielen, Ziehen = manuell zielen, Loslassen = Feuer.
// PlayerInputSource wandelt die Joystick-Werte in InputFrames um (+ Tastatur/Maus für den PC).
// ---------------------------------------------------------------------------------------------
using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using BrawlArena.Gameplay;
using BrawlArena.Save;

namespace BrawlArena.Controls
{
    public class VirtualJoystick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        public RectTransform Base, Knob;
        public float Radius = 110f;
        public bool Floating = true;
        public bool IsAttackStick;
        public float DeadZone = 0.22f;

        public Vector2 Value { get; private set; }
        public bool IsHeld { get; private set; }
        /// <summary>Loslassen: (Richtung/Stärke, war es ein kurzes Antippen?)</summary>
        public event Action<Vector2, bool> Released;

        private Vector2 restPos;
        private int pointerId = int.MinValue;
        private float downTime;
        private Vector2 maxValue;
        private Canvas canvas;

        private void Start()
        {
            restPos = Base.anchoredPosition;
            canvas = GetComponentInParent<Canvas>();
        }

        public void OnPointerDown(PointerEventData e)
        {
            if (IsHeld) return;
            IsHeld = true;
            pointerId = e.pointerId;
            downTime = Time.unscaledTime;
            maxValue = Vector2.zero;
            if (Floating)
            {
                Vector2 local;
                RectTransformUtility.ScreenPointToLocalPointInRectangle((RectTransform)Base.parent, e.position, e.pressEventCamera, out local);
                Base.localPosition = local;
            }
            UpdateValue(e);
        }

        public void OnDrag(PointerEventData e)
        {
            if (!IsHeld || e.pointerId != pointerId) return;
            UpdateValue(e);
        }

        public void OnPointerUp(PointerEventData e)
        {
            if (e.pointerId != pointerId) return;
            bool tap = maxValue.magnitude < DeadZone + 0.05f && Time.unscaledTime - downTime < 0.45f;
            Vector2 v = Value;
            IsHeld = false;
            pointerId = int.MinValue;
            Value = Vector2.zero;
            Knob.anchoredPosition = Vector2.zero;
            if (Floating) Base.anchoredPosition = restPos;
            if (Released != null) Released(v, tap);
        }

        private void UpdateValue(PointerEventData e)
        {
            Vector2 local;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(Base, e.position, e.pressEventCamera, out local);
            float r = Radius * SizeScale;
            Vector2 v = Vector2.ClampMagnitude(local / r, 1f);
            Knob.anchoredPosition = v * r;
            Value = v.magnitude < DeadZone * 0.5f ? Vector2.zero : v;
            if (v.magnitude > maxValue.magnitude) maxValue = v;
        }

        /// <summary>Ist der Stick weit genug gezogen, um manuell zu zielen?</summary>
        public bool IsAiming { get { return IsHeld && Value.magnitude > DeadZone; } }

        public float SizeScale { get { return SaveSystem.Profile != null ? SaveSystem.Profile.settings.joystickSize : 1f; } }

        private void OnDisable()
        {
            IsHeld = false; Value = Vector2.zero;
            if (Knob != null) Knob.anchoredPosition = Vector2.zero;
        }
    }

    /// <summary>Eingaben des lokalen Spielers (Touch-Joysticks + Tastatur/Maus).</summary>
    public class PlayerInputSource : IBrawlerInputSource
    {
        private readonly VirtualJoystick move, attack, super;
        private bool attackQueued, attackAuto, superQueued, superAuto;
        private Vector2 attackAim, superAim;

        public PlayerInputSource(VirtualJoystick move, VirtualJoystick attack, VirtualJoystick super)
        {
            this.move = move; this.attack = attack; this.super = super;
            attack.Released += (v, tap) => Queue(ref attackQueued, ref attackAuto, ref attackAim, v, tap);
            super.Released += (v, tap) => Queue(ref superQueued, ref superAuto, ref superAim, v, tap);
        }

        private static void Queue(ref bool queued, ref bool auto, ref Vector2 aim, Vector2 v, bool tap)
        {
            bool tapAuto = SaveSystem.Profile == null || SaveSystem.Profile.settings.tapToAutoAim;
            if (tap && !tapAuto) return;
            queued = true;
            auto = tap;
            aim = v;
        }

        public InputFrame Poll(Brawler self, float dt)
        {
            var f = new InputFrame();
            Vector2 mv = move != null ? move.Value : Vector2.zero;

            // ---- Tastatur (Editor / PC / Gamepad-Achsen)
            Vector2 kb = new Vector2((Input.GetKey(KeyCode.D) ? 1 : 0) - (Input.GetKey(KeyCode.A) ? 1 : 0), (Input.GetKey(KeyCode.W) ? 1 : 0) - (Input.GetKey(KeyCode.S) ? 1 : 0));
            if (kb.sqrMagnitude > 0f) mv = kb.normalized;
            f.move = mv;

            // ---- Touch-Angriff
            if (attackQueued)
            {
                f.attack = true; f.attackAuto = attackAuto; f.attackAim = attackAim;
                attackQueued = false;
            }
            if (superQueued)
            {
                f.super = true; f.superAuto = superAuto; f.superAim = superAim;
                superQueued = false;
            }
            if (attack != null && attack.IsAiming) { f.aiming = true; f.aimingDir = attack.Value.normalized; }
            else if (super != null && super.IsAiming) { f.aiming = true; f.aimingDir = super.Value.normalized; }

            // ---- Maus (nur ohne Touch)
            if (Input.touchCount == 0 && (Application.isEditor || !Application.isMobilePlatform))
            {
                if (!EventSystem.current || !EventSystem.current.IsPointerOverGameObject())
                {
                    Vector2 mouseAim;
                    if (MouseAim(self, out mouseAim))
                    {
                        if (Input.GetMouseButtonDown(0)) { f.attack = true; f.attackAim = mouseAim; }
                        if (Input.GetMouseButtonDown(1)) { f.super = true; f.superAim = mouseAim; }
                        if (Input.GetMouseButton(0) || Input.GetMouseButton(1)) { f.aiming = true; f.aimingDir = mouseAim.normalized; }
                    }
                }
                if (Input.GetKeyDown(KeyCode.Space)) { f.attack = true; f.attackAuto = true; }
                if (Input.GetKeyDown(KeyCode.E)) { f.super = true; f.superAuto = true; }
            }
            return f;
        }

        /// <summary>Mausposition → Zielvektor (Richtung * Anteil der Reichweite).</summary>
        private static bool MouseAim(Brawler self, out Vector2 aim)
        {
            aim = Vector2.zero;
            var cam = Camera.main;
            var ctx = MatchContext.Current;
            if (cam == null || ctx == null) return false;
            var ray = cam.ScreenPointToRay(Input.mousePosition);
            var plane = new Plane(Vector3.up, Vector3.zero);
            float d;
            if (!plane.Raycast(ray, out d)) return false;
            Vector3 to = ray.GetPoint(d) - self.Position; to.y = 0;
            float range = Mathf.Max(0.5f, self.MainAttack.range);
            aim = new Vector2(to.x, to.z) / range;
            if (aim.magnitude > 1f) aim = aim.normalized;
            if (aim.magnitude < 0.05f) aim = InputFrame.FromWorld(self.AimFacing) * 0.5f;
            return true;
        }
    }
}
