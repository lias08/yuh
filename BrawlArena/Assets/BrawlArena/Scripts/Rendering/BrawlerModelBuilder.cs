// ---------------------------------------------------------------------------------------------
// BrawlerModelBuilder – baut aus einer AppearanceConfig eine 3D-Cartoon-Figur im "Chibi"-Stil
// (großer Kopf, kleiner Körper, schwebende Hände und Füße). Teile, die sich gemeinsam bewegen,
// werden zu EINEM Mesh mit Vertexfarben zusammengefasst (≈5 Draw-Calls pro Figur).
// Ist ein eigenes Modell gesetzt, wird stattdessen dieses instanziiert.
// ---------------------------------------------------------------------------------------------
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Data;

namespace BrawlArena.Rendering
{
    /// <summary>Referenzen auf die animierbaren Teile einer Figur.</summary>
    public class BrawlerRig
    {
        public Transform root;        // wird vom Spiel gedreht (Blickrichtung)
        public Transform bodyPivot;   // Körper + Kopf (Hüpfen, Stauchen)
        public Transform head;        // Kopf (nur Kopfnicken, Teil des Körper-Meshes)
        public Transform leftHand, rightHand, leftFoot, rightFoot;
        public Transform weaponTip;   // Mündung – hier entstehen Projektile
        public Transform cape;
        public Renderer[] renderers;
        public Animator animator;     // nur bei eigenen Modellen
        public bool isCustomModel;
        public float height = 1.4f;
        public Vector3 leftHandRest, rightHandRest, leftFootRest, rightFootRest;
    }

    public static class BrawlerModelBuilder
    {
        private static readonly Color Dark = new Color(0.08f, 0.07f, 0.1f);
        private static readonly Color White = new Color(0.98f, 0.98f, 1f);

        public static BrawlerRig Build(AppearanceConfig a, Transform parent)
        {
            var rig = new BrawlerRig();
            var rootGo = new GameObject("Model");
            rig.root = rootGo.transform;
            rig.root.SetParent(parent, false);

            if (a.customModel != null)
            {
                BuildCustom(a, rig);
                return rig;
            }

            var bodyGo = new GameObject("Body");
            rig.bodyPivot = bodyGo.transform;
            rig.bodyPivot.SetParent(rig.root, false);

            float s = a.size;
            var renderers = new List<Renderer>();

            // ---------------- Körper ----------------
            var mb = new MeshBuilder();
            Vector3 headCenter; float headRadius;
            BuildTorso(mb, a, out headCenter, out headRadius);
            if (a.bodyShape != BodyShape.Blob) BuildHead(mb, a, headCenter, headRadius);
            BuildFace(mb, a, headCenter, headRadius);
            BuildHat(mb, a, headCenter, headRadius);
            if (a.backpack) BuildBackpack(mb, a);
            renderers.Add(AddMesh(rig.bodyPivot, mb.Build("BrawlerBody"), MaterialLibrary.CharacterToon));
            var headGo = new GameObject("HeadAnchor");
            rig.head = headGo.transform; rig.head.SetParent(rig.bodyPivot, false); rig.head.localPosition = headCenter;

            if (a.cape)
            {
                var capeGo = new GameObject("Cape");
                rig.cape = capeGo.transform; rig.cape.SetParent(rig.bodyPivot, false);
                rig.cape.localPosition = new Vector3(0, TorsoTop(a), -TorsoDepth(a) * 0.45f);
                var cb = new MeshBuilder();
                cb.Add(ProcMesh.Box, new Vector3(0, -0.28f, -0.02f), Quaternion.Euler(8, 0, 0), new Vector3(TorsoWidth(a) * 0.95f, 0.6f, 0.04f), a.secondaryColor);
                renderers.Add(AddMesh(rig.cape, cb.Build("Cape"), MaterialLibrary.CharacterToon));
            }

            // ---------------- Hände ----------------
            float shoulderY = TorsoCenterY(a) + 0.02f;
            float handX = TorsoWidth(a) * 0.5f + 0.1f;
            bool gloves = a.weapon == WeaponStyle.Gloves;
            float handSize = gloves ? 0.3f : 0.19f;
            Color handColor = gloves ? a.secondaryColor : (a.bodyShape == BodyShape.Robot ? a.weaponColor : a.skinColor);

            rig.leftHand = MakePivot("LeftHand", rig.root, new Vector3(-handX, shoulderY, 0.05f));
            rig.rightHand = MakePivot("RightHand", rig.root, new Vector3(handX, shoulderY, 0.05f));
            var lh = new MeshBuilder();
            lh.Add(ProcMesh.Sphere, Vector3.zero, Quaternion.identity, Vector3.one * handSize, handColor);
            if (a.weapon == WeaponStyle.Bow) BuildBow(lh, a);
            renderers.Add(AddMesh(rig.leftHand, lh.Build("LeftHand"), MaterialLibrary.CharacterToon));

            var rh = new MeshBuilder();
            rh.Add(ProcMesh.Sphere, Vector3.zero, Quaternion.identity, Vector3.one * handSize, handColor);
            Vector3 tip = BuildWeapon(rh, a);
            renderers.Add(AddMesh(rig.rightHand, rh.Build("RightHand"), MaterialLibrary.CharacterToon));
            rig.weaponTip = MakePivot("WeaponTip", rig.rightHand, tip);
            if (a.weapon == WeaponStyle.Bow) rig.weaponTip.SetParent(rig.leftHand, false);

            // ---------------- Füße ----------------
            if (a.bodyShape != BodyShape.Blob)
            {
                float footX = Mathf.Max(0.12f, TorsoWidth(a) * 0.25f);
                Color footColor = Color.Lerp(a.secondaryColor, Dark, 0.35f);
                rig.leftFoot = MakePivot("LeftFoot", rig.root, new Vector3(-footX, 0.08f, 0));
                rig.rightFoot = MakePivot("RightFoot", rig.root, new Vector3(footX, 0.08f, 0));
                foreach (var f in new[] { rig.leftFoot, rig.rightFoot })
                {
                    var fb = new MeshBuilder();
                    if (a.bodyShape == BodyShape.Robot)
                        fb.Add(ProcMesh.Box, new Vector3(0, 0, 0.03f), Quaternion.identity, new Vector3(0.18f, 0.14f, 0.26f), footColor);
                    else
                        fb.Add(ProcMesh.Sphere, new Vector3(0, 0, 0.04f), Quaternion.identity, new Vector3(0.2f, 0.16f, 0.27f), footColor);
                    renderers.Add(AddMesh(f, fb.Build("Foot"), MaterialLibrary.CharacterToon));
                }
                rig.leftFootRest = rig.leftFoot.localPosition;
                rig.rightFootRest = rig.rightFoot.localPosition;
            }

            rig.leftHandRest = rig.leftHand.localPosition;
            rig.rightHandRest = rig.rightHand.localPosition;
            rig.height = (headCenter.y + headRadius + HatHeight(a)) * s;
            rig.root.localScale = Vector3.one * s;
            rig.renderers = renderers.ToArray();
            return rig;
        }

        // ================================================================== Maße
        private static float TorsoWidth(AppearanceConfig a)
        {
            switch (a.bodyShape)
            {
                case BodyShape.Tall: return 0.5f;
                case BodyShape.Stocky: return 0.85f;
                case BodyShape.Robot: return 0.66f;
                case BodyShape.Tiny: return 0.46f;
                case BodyShape.Blob: return 0.95f;
                default: return 0.62f;
            }
        }
        private static float TorsoHeight(AppearanceConfig a)
        {
            switch (a.bodyShape)
            {
                case BodyShape.Tall: return 0.78f;
                case BodyShape.Stocky: return 0.62f;
                case BodyShape.Robot: return 0.58f;
                case BodyShape.Tiny: return 0.42f;
                case BodyShape.Blob: return 0.9f;
                default: return 0.56f;
            }
        }
        private static float TorsoDepth(AppearanceConfig a) { return TorsoWidth(a) * 0.85f; }
        private static float TorsoCenterY(AppearanceConfig a) { return 0.18f + TorsoHeight(a) * 0.5f; }
        private static float TorsoTop(AppearanceConfig a) { return 0.18f + TorsoHeight(a); }

        private static float HatHeight(AppearanceConfig a)
        {
            switch (a.hat)
            {
                case HatStyle.WizardHat: return 0.55f;
                case HatStyle.Antenna: return 0.3f;
                case HatStyle.Crown: case HatStyle.Horns: case HatStyle.Halo: case HatStyle.Ears: return 0.22f;
                case HatStyle.Mohawk: case HatStyle.CowboyHat: return 0.2f;
                default: return 0.05f;
            }
        }

        // ================================================================== Körperteile
        private static void BuildTorso(MeshBuilder mb, AppearanceConfig a, out Vector3 headCenter, out float headRadius)
        {
            float w = TorsoWidth(a), h = TorsoHeight(a), d = TorsoDepth(a);
            float cy = TorsoCenterY(a);
            if (a.bodyShape == BodyShape.Robot)
            {
                mb.Add(ProcMesh.Box, new Vector3(0, cy, 0), Quaternion.identity, new Vector3(w, h, d), a.primaryColor);
                mb.Add(ProcMesh.Box, new Vector3(0, cy, d * 0.5f), Quaternion.identity, new Vector3(w * 0.5f, h * 0.45f, 0.04f), a.secondaryColor);
                mb.Add(ProcMesh.Sphere, new Vector3(0, cy, d * 0.5f + 0.02f), Quaternion.identity, Vector3.one * 0.12f, Color.Lerp(a.secondaryColor, White, 0.5f));
            }
            else
            {
                mb.Add(ProcMesh.Sphere, new Vector3(0, cy, 0), Quaternion.identity, new Vector3(w, h, d), a.primaryColor);
                // Gürtel
                if (a.bodyShape != BodyShape.Blob)
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, cy - h * 0.2f, 0), Quaternion.identity, new Vector3(w * 0.97f, 0.08f, d * 0.97f), a.secondaryColor);
                // Bauch-Fleck
                mb.Add(ProcMesh.Sphere, new Vector3(0, cy + h * 0.05f, d * 0.3f), Quaternion.identity, new Vector3(w * 0.5f, h * 0.5f, d * 0.4f), Color.Lerp(a.primaryColor, White, 0.25f));
            }

            float hs = a.headSize;
            switch (a.bodyShape)
            {
                case BodyShape.Tall: headRadius = 0.3f * hs; break;
                case BodyShape.Stocky: headRadius = 0.29f * hs; break;
                case BodyShape.Robot: headRadius = 0.3f * hs; break;
                case BodyShape.Tiny: headRadius = 0.36f * hs; break;
                case BodyShape.Blob: headRadius = h * 0.5f; break;
                default: headRadius = 0.33f * hs; break;
            }
            if (a.bodyShape == BodyShape.Blob) headCenter = new Vector3(0, cy + 0.05f, 0);
            else headCenter = new Vector3(0, TorsoTop(a) + headRadius * 0.82f, 0);
        }

        private static void BuildHead(MeshBuilder mb, AppearanceConfig a, Vector3 c, float r)
        {
            if (a.bodyShape == BodyShape.Robot)
            {
                mb.Add(ProcMesh.Box, c, Quaternion.identity, new Vector3(r * 2f, r * 1.7f, r * 1.8f), a.primaryColor);
                mb.Add(ProcMesh.Box, c + new Vector3(0, 0, r * 0.9f), Quaternion.identity, new Vector3(r * 1.7f, r * 1.2f, 0.04f), Color.Lerp(a.weaponColor, Dark, 0.5f));
                // Ohren-Bolzen
                mb.Add(ProcMesh.Cylinder, c + new Vector3(r, 0, 0), Quaternion.Euler(0, 0, 90), new Vector3(0.12f, 0.06f, 0.12f), a.secondaryColor);
                mb.Add(ProcMesh.Cylinder, c - new Vector3(r, 0, 0), Quaternion.Euler(0, 0, 90), new Vector3(0.12f, 0.06f, 0.12f), a.secondaryColor);
            }
            else
            {
                mb.Add(ProcMesh.Sphere, c, Quaternion.identity, new Vector3(r * 2.05f, r * 1.95f, r * 1.95f), a.skinColor);
                // Wangen
                Color blush = Color.Lerp(a.skinColor, new Color(1f, 0.45f, 0.5f), 0.45f);
                mb.Add(ProcMesh.SphereLow, c + new Vector3(r * 0.55f, -r * 0.25f, r * 0.72f), Quaternion.identity, Vector3.one * r * 0.28f, blush);
                mb.Add(ProcMesh.SphereLow, c + new Vector3(-r * 0.55f, -r * 0.25f, r * 0.72f), Quaternion.identity, Vector3.one * r * 0.28f, blush);
            }
        }

        private static void BuildFace(MeshBuilder mb, AppearanceConfig a, Vector3 c, float r)
        {
            float fz = r * (a.bodyShape == BodyShape.Robot ? 0.93f : 0.86f);
            float ex = r * 0.36f, ey = r * 0.12f;
            float eyeS = r * 0.42f;
            Color eye = a.eyeColor;

            switch (a.face)
            {
                case FaceStyle.Cyclops:
                    mb.Add(ProcMesh.Sphere, c + new Vector3(0, ey, fz), Quaternion.identity, new Vector3(eyeS * 1.6f, eyeS * 1.6f, eyeS * 0.6f), White);
                    mb.Add(ProcMesh.Sphere, c + new Vector3(0, ey, fz + eyeS * 0.28f), Quaternion.identity, new Vector3(eyeS * 0.8f, eyeS * 0.8f, eyeS * 0.3f), eye);
                    mb.Add(ProcMesh.SphereLow, c + new Vector3(eyeS * 0.18f, ey + eyeS * 0.2f, fz + eyeS * 0.42f), Quaternion.identity, Vector3.one * eyeS * 0.2f, White);
                    break;
                case FaceStyle.Visor:
                    mb.Add(ProcMesh.Box, c + new Vector3(0, ey, fz), Quaternion.identity, new Vector3(r * 1.5f, r * 0.34f, 0.08f), a.secondaryColor);
                    mb.Add(ProcMesh.Box, c + new Vector3(0, ey + r * 0.05f, fz + 0.045f), Quaternion.identity, new Vector3(r * 1.3f, r * 0.08f, 0.02f), White);
                    break;
                case FaceStyle.Cool:
                    mb.Add(ProcMesh.Box, c + new Vector3(ex, ey, fz), Quaternion.identity, new Vector3(eyeS * 1.2f, eyeS * 0.7f, 0.05f), Dark);
                    mb.Add(ProcMesh.Box, c + new Vector3(-ex, ey, fz), Quaternion.identity, new Vector3(eyeS * 1.2f, eyeS * 0.7f, 0.05f), Dark);
                    mb.Add(ProcMesh.Box, c + new Vector3(0, ey + eyeS * 0.15f, fz), Quaternion.identity, new Vector3(ex * 1.2f, 0.03f, 0.04f), Dark);
                    break;
                default:
                    for (int side = -1; side <= 1; side += 2)
                    {
                        Vector3 p = c + new Vector3(ex * side, ey, fz);
                        mb.Add(ProcMesh.Sphere, p, Quaternion.identity, new Vector3(eyeS * 0.85f, eyeS * 1.05f, eyeS * 0.5f), White);
                        mb.Add(ProcMesh.Sphere, p + new Vector3(0, -eyeS * 0.05f, eyeS * 0.2f), Quaternion.identity, new Vector3(eyeS * 0.5f, eyeS * 0.65f, eyeS * 0.3f), eye);
                        mb.Add(ProcMesh.SphereLow, p + new Vector3(eyeS * 0.12f, eyeS * 0.15f, eyeS * 0.33f), Quaternion.identity, Vector3.one * eyeS * 0.18f, White);
                        if (a.face == FaceStyle.Angry)
                            mb.Add(ProcMesh.Box, p + new Vector3(0, eyeS * 0.62f, eyeS * 0.1f), Quaternion.Euler(0, 0, 22f * side), new Vector3(eyeS * 1.1f, eyeS * 0.2f, 0.04f), Dark);
                        if (a.face == FaceStyle.Sleepy)
                            mb.Add(ProcMesh.Sphere, p + new Vector3(0, eyeS * 0.22f, eyeS * 0.06f), Quaternion.identity, new Vector3(eyeS * 0.95f, eyeS * 0.6f, eyeS * 0.55f), a.bodyShape == BodyShape.Robot ? a.primaryColor : a.skinColor);
                    }
                    break;
            }

            // Mund
            if (a.bodyShape != BodyShape.Robot && a.face != FaceStyle.Visor)
            {
                Vector3 m = c + new Vector3(0, -r * 0.38f, r * 0.82f);
                if (a.face == FaceStyle.Angry)
                    mb.Add(ProcMesh.Box, m, Quaternion.identity, new Vector3(r * 0.35f, r * 0.06f, 0.04f), Dark);
                else
                {
                    mb.Add(ProcMesh.Sphere, m, Quaternion.identity, new Vector3(r * 0.42f, r * 0.2f, r * 0.12f), new Color(0.45f, 0.1f, 0.15f));
                    mb.Add(ProcMesh.SphereLow, m + new Vector3(0, -r * 0.03f, r * 0.04f), Quaternion.identity, new Vector3(r * 0.2f, r * 0.08f, r * 0.08f), new Color(1f, 0.45f, 0.5f));
                }
            }
        }

        private static void BuildHat(MeshBuilder mb, AppearanceConfig a, Vector3 c, float r)
        {
            Vector3 top = c + new Vector3(0, r * 0.85f, 0);
            Color hc = a.hatColor;
            switch (a.hat)
            {
                case HatStyle.Cap:
                    mb.Add(ProcMesh.Hemisphere, top - new Vector3(0, r * 0.35f, 0), Quaternion.identity, new Vector3(r * 2.1f, r * 1.4f, r * 2.1f), hc);
                    mb.Add(ProcMesh.Cylinder, top + new Vector3(0, -r * 0.3f, r * 0.75f), Quaternion.identity, new Vector3(r * 1.3f, 0.04f, r * 0.9f), Color.Lerp(hc, Dark, 0.2f));
                    mb.Add(ProcMesh.SphereLow, top + new Vector3(0, r * 0.32f, 0), Quaternion.identity, Vector3.one * 0.07f, a.secondaryColor);
                    break;
                case HatStyle.Crown:
                    mb.Add(ProcMesh.Cylinder, top, Quaternion.identity, new Vector3(r * 1.3f, r * 0.35f, r * 1.3f), hc);
                    for (int i = 0; i < 5; i++)
                    {
                        float ang = i / 5f * Mathf.PI * 2f;
                        Vector3 p = top + new Vector3(Mathf.Cos(ang) * r * 0.55f, r * 0.32f, Mathf.Sin(ang) * r * 0.55f);
                        mb.Add(ProcMesh.Cone, p, Quaternion.identity, new Vector3(0.12f, 0.2f, 0.12f), hc);
                        mb.Add(ProcMesh.SphereLow, p + Vector3.up * 0.12f, Quaternion.identity, Vector3.one * 0.06f, a.secondaryColor);
                    }
                    break;
                case HatStyle.Horns:
                    for (int side = -1; side <= 1; side += 2)
                        mb.Add(ProcMesh.Cone, c + new Vector3(r * 0.65f * side, r * 0.7f, 0), Quaternion.Euler(0, 0, -35f * side), new Vector3(0.15f, 0.34f, 0.15f), hc);
                    break;
                case HatStyle.Helmet:
                    mb.Add(ProcMesh.Hemisphere, c - new Vector3(0, r * 0.05f, 0), Quaternion.identity, new Vector3(r * 2.25f, r * 2.1f, r * 2.25f), hc);
                    mb.Add(ProcMesh.Box, c + new Vector3(0, r * 0.12f, r * 1.02f), Quaternion.identity, new Vector3(r * 1.6f, r * 0.1f, 0.05f), a.secondaryColor);
                    mb.Add(ProcMesh.Box, top + new Vector3(0, r * 0.15f, 0), Quaternion.identity, new Vector3(0.06f, r * 0.4f, r * 1.6f), a.secondaryColor);
                    break;
                case HatStyle.WizardHat:
                    mb.Add(ProcMesh.Cylinder, top - new Vector3(0, r * 0.15f, 0), Quaternion.identity, new Vector3(r * 2.6f, 0.05f, r * 2.6f), hc);
                    mb.Add(ProcMesh.Cone, top + new Vector3(0, r * 0.7f, -0.05f), Quaternion.Euler(-12, 0, 6), new Vector3(r * 1.5f, r * 1.9f, r * 1.5f), hc);
                    mb.Add(ProcMesh.Cylinder, top - new Vector3(0, r * 0.05f, 0), Quaternion.identity, new Vector3(r * 1.5f, 0.08f, r * 1.5f), a.secondaryColor);
                    break;
                case HatStyle.Mohawk:
                    for (int i = 0; i < 5; i++)
                    {
                        float z = Mathf.Lerp(r * 0.6f, -r * 0.7f, i / 4f);
                        float y = Mathf.Sqrt(Mathf.Max(0f, r * r - z * z)) * 0.95f;
                        mb.Add(ProcMesh.Cone, c + new Vector3(0, y + 0.07f, z), Quaternion.Euler(z / r * -40f, 0, 0), new Vector3(0.09f, 0.26f, 0.16f), hc);
                    }
                    break;
                case HatStyle.Antenna:
                    mb.Add(ProcMesh.Cylinder, top + new Vector3(0, 0.12f, 0), Quaternion.identity, new Vector3(0.04f, 0.28f, 0.04f), Color.Lerp(a.weaponColor, Dark, 0.3f));
                    mb.Add(ProcMesh.Sphere, top + new Vector3(0, 0.28f, 0), Quaternion.identity, Vector3.one * 0.12f, hc);
                    break;
                case HatStyle.Bandana:
                    mb.Add(ProcMesh.Torus, c + new Vector3(0, r * 0.38f, 0), Quaternion.Euler(-8, 0, 0), new Vector3(r * 2.05f, r * 1.4f, r * 2.05f), hc);
                    mb.Add(ProcMesh.SphereLow, c + new Vector3(0, r * 0.35f, -r * 1.02f), Quaternion.identity, new Vector3(0.12f, 0.1f, 0.08f), hc);
                    mb.Add(ProcMesh.Box, c + new Vector3(0.06f, r * 0.15f, -r * 1.08f), Quaternion.Euler(0, 0, 25), new Vector3(0.06f, 0.2f, 0.03f), hc);
                    break;
                case HatStyle.CowboyHat:
                    mb.Add(ProcMesh.Cylinder, top - new Vector3(0, r * 0.2f, 0), Quaternion.Euler(-6, 0, 0), new Vector3(r * 2.9f, 0.05f, r * 2.6f), hc);
                    mb.Add(ProcMesh.Cylinder, top + new Vector3(0, r * 0.12f, 0), Quaternion.identity, new Vector3(r * 1.35f, r * 0.7f, r * 1.25f), hc);
                    mb.Add(ProcMesh.Cylinder, top - new Vector3(0, r * 0.08f, 0), Quaternion.identity, new Vector3(r * 1.38f, 0.07f, r * 1.28f), a.secondaryColor);
                    break;
                case HatStyle.Halo:
                    mb.Add(ProcMesh.Torus, top + new Vector3(0, 0.2f, 0), Quaternion.identity, new Vector3(r * 1.3f, r * 1.3f, r * 1.3f), new Color(1f, 0.95f, 0.5f));
                    break;
                case HatStyle.Ears:
                    for (int side = -1; side <= 1; side += 2)
                    {
                        Vector3 p = c + new Vector3(r * 0.6f * side, r * 0.85f, -0.02f);
                        mb.Add(ProcMesh.Sphere, p, Quaternion.Euler(0, 0, -20f * side), new Vector3(0.22f, 0.3f, 0.1f), hc);
                        mb.Add(ProcMesh.Sphere, p + new Vector3(0, 0, 0.03f), Quaternion.Euler(0, 0, -20f * side), new Vector3(0.13f, 0.2f, 0.06f), Color.Lerp(hc, White, 0.5f));
                    }
                    break;
            }
        }

        private static void BuildBackpack(MeshBuilder mb, AppearanceConfig a)
        {
            float cy = TorsoCenterY(a);
            float d = TorsoDepth(a);
            mb.Add(ProcMesh.Box, new Vector3(0, cy + 0.05f, -d * 0.55f), Quaternion.identity, new Vector3(TorsoWidth(a) * 0.7f, TorsoHeight(a) * 0.75f, 0.22f), a.secondaryColor);
            mb.Add(ProcMesh.Box, new Vector3(0, cy - 0.02f, -d * 0.55f - 0.12f), Quaternion.identity, new Vector3(TorsoWidth(a) * 0.5f, TorsoHeight(a) * 0.3f, 0.06f), Color.Lerp(a.secondaryColor, Dark, 0.25f));
        }

        /// <summary>Baut die Waffe in die rechte Hand. Gibt die Position der Mündung zurück.</summary>
        private static Vector3 BuildWeapon(MeshBuilder mb, AppearanceConfig a)
        {
            Color w = a.weaponColor; Color s2 = a.secondaryColor;
            switch (a.weapon)
            {
                case WeaponStyle.Pistol:
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.05f, 0.16f), Quaternion.identity, new Vector3(0.09f, 0.1f, 0.32f), w);
                    mb.Add(ProcMesh.Box, new Vector3(0, -0.03f, 0.05f), Quaternion.Euler(15, 0, 0), new Vector3(0.08f, 0.14f, 0.08f), Color.Lerp(w, Dark, 0.4f));
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.05f, 0.33f), Quaternion.Euler(90, 0, 0), new Vector3(0.06f, 0.04f, 0.06f), s2);
                    return new Vector3(0, 0.05f, 0.38f);
                case WeaponStyle.Shotgun:
                    mb.Add(ProcMesh.Cylinder, new Vector3(-0.035f, 0.06f, 0.25f), Quaternion.Euler(90, 0, 0), new Vector3(0.07f, 0.5f, 0.07f), w);
                    mb.Add(ProcMesh.Cylinder, new Vector3(0.035f, 0.06f, 0.25f), Quaternion.Euler(90, 0, 0), new Vector3(0.07f, 0.5f, 0.07f), w);
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.02f, -0.05f), Quaternion.Euler(10, 0, 0), new Vector3(0.1f, 0.12f, 0.25f), new Color(0.55f, 0.32f, 0.18f));
                    return new Vector3(0, 0.06f, 0.52f);
                case WeaponStyle.Staff:
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.15f, 0.02f), Quaternion.Euler(10, 0, 0), new Vector3(0.05f, 0.85f, 0.05f), new Color(0.5f, 0.32f, 0.2f));
                    mb.Add(ProcMesh.Sphere, new Vector3(0, 0.6f, 0.1f), Quaternion.identity, Vector3.one * 0.18f, s2);
                    mb.Add(ProcMesh.Torus, new Vector3(0, 0.6f, 0.1f), Quaternion.Euler(90, 0, 0), Vector3.one * 0.3f, w);
                    return new Vector3(0, 0.6f, 0.2f);
                case WeaponStyle.Bomb:
                    mb.Add(ProcMesh.Sphere, new Vector3(0, 0.12f, 0.05f), Quaternion.identity, Vector3.one * 0.26f, new Color(0.15f, 0.15f, 0.2f));
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.27f, 0.05f), Quaternion.identity, new Vector3(0.03f, 0.08f, 0.03f), new Color(0.8f, 0.7f, 0.5f));
                    mb.Add(ProcMesh.SphereLow, new Vector3(0, 0.32f, 0.05f), Quaternion.identity, Vector3.one * 0.06f, new Color(1f, 0.7f, 0.2f));
                    return new Vector3(0, 0.15f, 0.15f);
                case WeaponStyle.Sword:
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.03f, 0.35f), Quaternion.identity, new Vector3(0.04f, 0.1f, 0.6f), new Color(0.85f, 0.88f, 0.95f));
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.03f, 0.05f), Quaternion.identity, new Vector3(0.24f, 0.06f, 0.05f), s2);
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.03f, -0.03f), Quaternion.Euler(90, 0, 0), new Vector3(0.05f, 0.12f, 0.05f), w);
                    return new Vector3(0, 0.03f, 0.6f);
                case WeaponStyle.Gloves:
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, 0, -0.14f), Quaternion.Euler(90, 0, 0), new Vector3(0.2f, 0.08f, 0.2f), Color.Lerp(s2, White, 0.5f));
                    return new Vector3(0, 0, 0.2f);
                case WeaponStyle.Blaster:
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.07f, 0.15f), Quaternion.identity, new Vector3(0.16f, 0.16f, 0.4f), w);
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.07f, 0.38f), Quaternion.Euler(90, 0, 0), new Vector3(0.13f, 0.1f, 0.13f), Color.Lerp(w, Dark, 0.3f));
                    mb.Add(ProcMesh.Sphere, new Vector3(0, 0.17f, 0.1f), Quaternion.identity, new Vector3(0.1f, 0.06f, 0.18f), s2);
                    mb.Add(ProcMesh.Torus, new Vector3(0, 0.07f, 0.28f), Quaternion.Euler(90, 0, 0), Vector3.one * 0.3f, s2);
                    return new Vector3(0, 0.07f, 0.45f);
                case WeaponStyle.Hammer:
                    mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.2f, 0.05f), Quaternion.Euler(20, 0, 0), new Vector3(0.05f, 0.6f, 0.05f), new Color(0.5f, 0.32f, 0.2f));
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.48f, 0.15f), Quaternion.Euler(20, 0, 0), new Vector3(0.36f, 0.22f, 0.22f), w);
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.48f, 0.15f), Quaternion.Euler(20, 0, 0), new Vector3(0.38f, 0.06f, 0.24f), s2);
                    return new Vector3(0, 0.45f, 0.3f);
                case WeaponStyle.Book:
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.08f, 0.1f), Quaternion.Euler(-30, 0, 0), new Vector3(0.28f, 0.05f, 0.22f), w);
                    mb.Add(ProcMesh.Box, new Vector3(0, 0.11f, 0.1f), Quaternion.Euler(-30, 0, 0), new Vector3(0.25f, 0.03f, 0.2f), White);
                    mb.Add(ProcMesh.SphereLow, new Vector3(0, 0.25f, 0.15f), Quaternion.identity, Vector3.one * 0.1f, s2);
                    return new Vector3(0, 0.2f, 0.25f);
                case WeaponStyle.Bow:
                    return new Vector3(0, 0.05f, 0.3f);
                default:
                    return new Vector3(0, 0, 0.15f);
            }
        }

        private static void BuildBow(MeshBuilder mb, AppearanceConfig a)
        {
            mb.Add(ProcMesh.Torus, new Vector3(0, 0.05f, 0.12f), Quaternion.Euler(0, 0, 90), new Vector3(0.9f, 0.9f, 0.35f), a.weaponColor);
            mb.Add(ProcMesh.Box, new Vector3(0, 0.05f, 0.0f), Quaternion.identity, new Vector3(0.015f, 0.42f, 0.015f), White);
            mb.Add(ProcMesh.Cylinder, new Vector3(0, 0.05f, 0.15f), Quaternion.Euler(90, 0, 0), new Vector3(0.03f, 0.4f, 0.03f), a.secondaryColor);
        }

        // ================================================================== Eigenes Modell
        private static void BuildCustom(AppearanceConfig a, BrawlerRig rig)
        {
            rig.isCustomModel = true;
            var inst = Object.Instantiate(a.customModel, rig.root);
            inst.name = "CustomModel";
            inst.transform.localPosition = a.customModelOffset;
            inst.transform.localRotation = Quaternion.Euler(a.customModelRotation);
            inst.transform.localScale = Vector3.one * a.customModelScale * a.size;
            rig.bodyPivot = inst.transform;
            rig.animator = inst.GetComponentInChildren<Animator>();
            rig.renderers = inst.GetComponentsInChildren<Renderer>();

            // Kollider aus importierten Modellen entfernen (die Spiel-Kollision ist eigene Logik).
            foreach (var col in inst.GetComponentsInChildren<Collider>()) Object.Destroy(col);

            if (a.tintCustomModel)
                foreach (var r in rig.renderers)
                    foreach (var m in r.materials)
                        if (m.HasProperty("_Color")) m.color = a.primaryColor;

            // Mündung: Kindobjekt "WeaponTip" oder "Muzzle" im Modell, sonst vor der Brust.
            rig.weaponTip = FindDeep(inst.transform, "WeaponTip") ?? FindDeep(inst.transform, "Muzzle");
            if (rig.weaponTip == null) rig.weaponTip = MakePivot("WeaponTip", rig.root, new Vector3(0.25f, 0.6f, 0.45f));

            var b = new Bounds(inst.transform.position, Vector3.zero);
            foreach (var r in rig.renderers) b.Encapsulate(r.bounds);
            rig.height = Mathf.Max(0.8f, b.max.y - rig.root.position.y);
        }

        private static Transform FindDeep(Transform t, string name)
        {
            if (t.name == name) return t;
            for (int i = 0; i < t.childCount; i++)
            {
                var r = FindDeep(t.GetChild(i), name);
                if (r != null) return r;
            }
            return null;
        }

        // ================================================================== Helfer
        private static Transform MakePivot(string name, Transform parent, Vector3 localPos)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            return go.transform;
        }

        private static Renderer AddMesh(Transform t, Mesh mesh, Material mat)
        {
            var mf = t.gameObject.AddComponent<MeshFilter>();
            mf.sharedMesh = mesh;
            var mr = t.gameObject.AddComponent<MeshRenderer>();
            mr.sharedMaterial = mat;
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
            mr.receiveShadows = true;
            return mr;
        }
    }
}
