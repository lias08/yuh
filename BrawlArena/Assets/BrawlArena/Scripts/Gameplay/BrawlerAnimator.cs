// ---------------------------------------------------------------------------------------------
// BrawlerAnimator – animiert eine Figur.
//  • Prozedural (Standard): Laufen, Idle/Atmen, Angriff (inkl. Schwerthiebe links/rechts),
//    Super (Sprung + Drehung), Treffer-Blitz, Tod, Sieges-Jubel, Verwandlung.
//    Stil einstellbar: Bouncy, Waddle, Robotic, Floaty, Heavy, Sneaky.
//  • Eigene AnimationClips (Idle/Walk/Attack/Super/Hit/Death/Victory) werden über das
//    Playables-System abgespielt – es wird KEIN Animator Controller benötigt, nur eine
//    Animator-Komponente am eigenen Modell.
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using UnityEngine.Animations;
using UnityEngine.Playables;
using BrawlArena.Data;
using BrawlArena.Rendering;

namespace BrawlArena.Gameplay
{
    public class BrawlerAnimator : MonoBehaviour
    {
        public BrawlerRig Rig { get; private set; }
        private AnimationConfig cfg;
        private Transform modelRoot;

        // Zustand
        private float move;          // geglättete Bewegungsstärke 0..1
        private float phase;
        private float attackT = -1f, attackDur = 0.25f;
        private SwingDirection attackSwing = SwingDirection.Thrust;
        private bool attackIsSwing;
        private float superT = -1f;
        private float hitT = -1f;
        private float deathT = -1f;
        private float transformT = -1f;
        private bool victory;
        private float spawnT = -1f;
        private float stepTimer;
        private Quaternion targetYaw = Quaternion.identity;
        private float ghost;
        private bool visible = true;

        private MaterialPropertyBlock mpb;
        private static readonly int FlashAmountId = Shader.PropertyToID("_FlashAmount");
        private static readonly int FlashColorId = Shader.PropertyToID("_FlashColor");

        // Clip-Wiedergabe
        private PlayableGraph graph;
        private AnimationMixerPlayable mixer;
        private bool useClips;
        private float actionTimeLeft;
        private bool actionHold;

        public System.Action OnFootstep;

        public AppearanceConfig Appearance { get; private set; }

        public void Setup(AppearanceConfig appearance, AnimationConfig anim)
        {
            Teardown();
            cfg = anim;
            Appearance = appearance;
            customBaseSet = false;
            Rig = BrawlerModelBuilder.Build(appearance, transform);
            modelRoot = Rig.root;
            mpb = new MaterialPropertyBlock();
            useClips = Rig.isCustomModel && Rig.animator != null && anim.HasClips;
            if (useClips) SetupGraph();
            modelRoot.rotation = targetYaw;
        }

        /// <summary>Entfernt das aktuelle Modell (z.B. vor einer Verwandlung).</summary>
        public void Teardown()
        {
            if (graph.IsValid()) graph.Destroy();
            ReleaseMeshes();
            if (modelRoot != null) { modelRoot.gameObject.SetActive(false); Destroy(modelRoot.gameObject); }
            modelRoot = null;
            Rig = null;
        }

        private void OnDestroy() { if (graph.IsValid()) graph.Destroy(); ReleaseMeshes(); }

        /// <summary>Prozedurale Figuren-Meshes freigeben (Assets eigener Modelle bleiben unberührt).</summary>
        private void ReleaseMeshes()
        {
            if (modelRoot == null) return;
            foreach (var mf in modelRoot.GetComponentsInChildren<MeshFilter>(true)) ProcMesh.Release(mf.sharedMesh);
        }

        // =================================================================== Öffentliche API
        public void SetFacing(Vector3 dir, bool instant = false)
        {
            dir.y = 0;
            if (dir.sqrMagnitude < 0.0001f) return;
            targetYaw = Quaternion.LookRotation(dir);
            if (instant && modelRoot != null) modelRoot.rotation = targetYaw;
        }

        public Vector3 Facing { get { return targetYaw * Vector3.forward; } }

        public void SetMovement(float amount01) { move = Mathf.MoveTowards(move, Mathf.Clamp01(amount01), Time.deltaTime * 8f); }

        public void PlayAttack(SwingDirection swing, bool isSwing, float duration)
        {
            attackT = 0f; attackSwing = swing; attackIsSwing = isSwing; attackDur = Mathf.Max(0.12f, duration);
            if (useClips) PlayAction(cfg.attackClip, false);
        }

        public void PlaySuper() { superT = 0f; if (useClips) PlayAction(cfg.superClip ?? cfg.attackClip, false); }
        public void PlayHit() { hitT = 0f; if (useClips && cfg.hitClip != null && actionTimeLeft <= 0f) PlayAction(cfg.hitClip, false); }
        public void PlayDeath() { deathT = 0f; if (useClips) PlayAction(cfg.deathClip, true); }
        public void PlaySpawn() { spawnT = 0f; deathT = -1f; victory = false; if (useClips) StopAction(); }
        public void PlayTransform() { transformT = 0f; }
        public void SetVictory(bool v) { victory = v; if (v && useClips) PlayAction(cfg.victoryClip, true); }

        public void SetVisible(bool v)
        {
            if (visible == v || Rig == null) return;
            visible = v;
            foreach (var r in Rig.renderers) if (r != null) r.enabled = v;
        }

        /// <summary>Halbtransparent wirkender Look für verbündete Brawler im Busch.</summary>
        public void SetGhost(bool g) { ghost = g ? 1f : 0f; }

        // =================================================================== Update
        private void LateUpdate()
        {
            if (Rig == null) return;
            float dt = Time.deltaTime;
            modelRoot.rotation = Quaternion.Slerp(modelRoot.rotation, targetYaw, 1f - Mathf.Exp(-dt * 18f));

            if (useClips) UpdateClips(dt);
            else if (Rig.isCustomModel) UpdateCustomSimple(dt);
            else UpdateProcedural(dt);

            UpdateFlash(dt);
            if (spawnT >= 0f)
            {
                spawnT += dt;
                float k = Mathf.Clamp01(spawnT / 0.35f);
                float s = k < 1f ? Mathf.Sin(k * Mathf.PI * 0.5f) * (1f + Mathf.Sin(k * Mathf.PI) * 0.25f) : 1f;
                transform.localScale = Vector3.one * Mathf.Max(0.01f, s);
                if (k >= 1f) { spawnT = -1f; transform.localScale = Vector3.one; }
            }
        }

        private void UpdateProcedural(float dt)
        {
            var r = Rig;
            float t = Time.time;
            float bounce = cfg.bounceAmount;
            float swing = cfg.armSwing;
            float speedMul = cfg.walkCycleSpeed;
            var style = cfg.style;
            if (style == ProceduralAnimStyle.Heavy) speedMul *= 0.75f;
            if (style == ProceduralAnimStyle.Sneaky) speedMul *= 1.25f;
            phase += dt * Mathf.Lerp(0f, 13f, move) * speedMul;

            float stepPhase = style == ProceduralAnimStyle.Robotic ? Mathf.Round(phase / (Mathf.PI * 0.5f)) * Mathf.PI * 0.5f : phase;
            float s1 = Mathf.Sin(stepPhase), c1 = Mathf.Cos(stepPhase);

            // ------ Körper
            float bob = Mathf.Abs(s1) * 0.09f * bounce * move;
            float idleBreath = Mathf.Sin(t * 2.6f) * 0.018f * (1f - move);
            float baseY = 0f;
            if (style == ProceduralAnimStyle.Floaty) baseY = 0.18f + Mathf.Sin(t * 2.2f) * 0.07f;
            if (style == ProceduralAnimStyle.Sneaky) baseY = -0.04f;
            if (style == ProceduralAnimStyle.Heavy) bob *= 1.5f;
            Vector3 bodyPos = new Vector3(0, baseY + bob, 0);
            Vector3 bodyScale = new Vector3(1f - idleBreath * 0.5f, 1f + idleBreath, 1f - idleBreath * 0.5f);
            float lean = (style == ProceduralAnimStyle.Sneaky ? 14f : 8f) * move;
            float roll = style == ProceduralAnimStyle.Waddle ? s1 * 9f * move : 0f;
            float yawExtra = 0f;

            // Landestauchung beim Laufen
            if (style != ProceduralAnimStyle.Floaty && move > 0.1f)
            {
                float squash = (1f - Mathf.Abs(s1)) * 0.05f * bounce * move;
                bodyScale.y -= squash; bodyScale.x += squash * 0.5f; bodyScale.z += squash * 0.5f;
            }

            // ------ Hände
            Vector3 lh = r.leftHandRest, rh = r.rightHandRest;
            float handSwing = s1 * 0.13f * swing * move;
            lh.z += handSwing; rh.z -= handSwing;
            lh.y += Mathf.Sin(t * 2.6f + 1f) * 0.02f + baseY; rh.y += Mathf.Sin(t * 2.6f) * 0.02f + baseY;
            if (style == ProceduralAnimStyle.Robotic) { lh.z = r.leftHandRest.z + Mathf.Sign(handSwing) * 0.08f * move; rh.z = r.rightHandRest.z - Mathf.Sign(handSwing) * 0.08f * move; }
            // Waffenhand leicht nach vorne
            rh.z += 0.08f; rh.y -= 0.02f;

            // ------ Angriff
            if (attackT >= 0f)
            {
                attackT += dt;
                float k = Mathf.Clamp01(attackT / attackDur);
                if (attackIsSwing)
                {
                    // Schwerthieb: Hand fährt im Bogen von einer Seite zur anderen
                    float from = 0f, to = 0f;
                    switch (attackSwing)
                    {
                        case SwingDirection.LeftToRight: from = -80f; to = 80f; break;
                        case SwingDirection.RightToLeft: from = 80f; to = -80f; break;
                        case SwingDirection.Spin: from = 0f; to = 360f; break;
                    }
                    if (attackSwing == SwingDirection.Thrust || attackSwing == SwingDirection.Overhead)
                    {
                        float thr = Mathf.Sin(k * Mathf.PI);
                        rh = new Vector3(0.15f, r.rightHandRest.y + (attackSwing == SwingDirection.Overhead ? (1f - k) * 0.5f : 0.05f), 0.25f + thr * 0.35f);
                        lean += thr * 12f;
                    }
                    else if (attackSwing == SwingDirection.Spin)
                    {
                        yawExtra = Mathf.Lerp(from, to, Mathf.SmoothStep(0, 1, k));
                        rh = new Vector3(0.55f, r.rightHandRest.y, 0.1f);
                    }
                    else
                    {
                        float a = Mathf.Lerp(from, to, Mathf.SmoothStep(0, 1, k)) * Mathf.Deg2Rad;
                        rh = new Vector3(Mathf.Sin(a) * 0.5f, r.rightHandRest.y + 0.05f, Mathf.Cos(a) * 0.45f);
                        yawExtra = Mathf.Lerp(from, to, k) * 0.25f;
                    }
                }
                else
                {
                    float recoil = k < 0.25f ? k / 0.25f : 1f - (k - 0.25f) / 0.75f;
                    rh.z += 0.12f - recoil * 0.18f;
                    rh.y += recoil * 0.05f;
                    lean -= recoil * 6f;
                    bodyScale.z *= 1f - recoil * 0.06f;
                }
                if (k >= 1f) attackT = -1f;
            }

            // ------ Super
            if (superT >= 0f)
            {
                superT += dt;
                float k = Mathf.Clamp01(superT / 0.5f);
                bodyPos.y += Mathf.Sin(k * Mathf.PI) * 0.45f;
                yawExtra += k * 360f;
                float pop = Mathf.Sin(k * Mathf.PI) * 0.15f;
                bodyScale += new Vector3(pop, pop, pop);
                lh.y += Mathf.Sin(k * Mathf.PI) * 0.3f; rh.y += Mathf.Sin(k * Mathf.PI) * 0.3f;
                if (k >= 1f) superT = -1f;
            }

            // ------ Verwandlung
            if (transformT >= 0f)
            {
                transformT += dt;
                float k = Mathf.Clamp01(transformT / 0.8f);
                bodyPos.y += Mathf.Sin(k * Mathf.PI) * 0.6f;
                yawExtra += k * 720f;
                lh.y += 0.4f * Mathf.Sin(k * Mathf.PI); rh.y += 0.4f * Mathf.Sin(k * Mathf.PI);
                if (k >= 1f) transformT = -1f;
            }

            // ------ Treffer
            if (hitT >= 0f && hitT < 0.15f)
            {
                float k = hitT / 0.15f;
                lean -= Mathf.Sin(k * Mathf.PI) * 10f;
            }

            // ------ Sieg
            if (victory)
            {
                float j = Mathf.Abs(Mathf.Sin(t * 5f));
                bodyPos.y += j * 0.3f;
                lh.y += 0.35f + j * 0.15f; rh.y += 0.35f + j * 0.15f;
                lh.x -= 0.1f; rh.x += 0.1f;
            }

            // ------ Tod
            if (deathT >= 0f)
            {
                deathT += dt;
                float k = Mathf.Clamp01(deathT / 0.5f);
                lean = Mathf.Lerp(lean, -85f, k);
                bodyPos.y = Mathf.Lerp(bodyPos.y, -0.1f, k);
                bodyScale *= Mathf.Lerp(1f, 0.6f, k);
            }

            r.bodyPivot.localPosition = bodyPos;
            r.bodyPivot.localRotation = Quaternion.Euler(lean, yawExtra, roll);
            r.bodyPivot.localScale = bodyScale;

            Quaternion handRot = Quaternion.Euler(0, yawExtra, 0);
            r.leftHand.localPosition = Vector3.Lerp(r.leftHand.localPosition, handRot * lh + bodyPos * 0.6f, 1f - Mathf.Exp(-dt * 25f));
            r.rightHand.localPosition = attackT >= 0f || superT >= 0f ? handRot * rh + bodyPos * 0.6f
                : Vector3.Lerp(r.rightHand.localPosition, handRot * rh + bodyPos * 0.6f, 1f - Mathf.Exp(-dt * 25f));
            r.rightHand.localRotation = Quaternion.Euler(0, (attackIsSwing && attackT >= 0f) ? Mathf.Atan2(rh.x, rh.z) * Mathf.Rad2Deg : 0f, 0) * Quaternion.Euler(0, yawExtra, 0);
            if (r.cape != null) r.cape.localRotation = Quaternion.Euler(-move * 25f - Mathf.Abs(s1) * 6f * move, 0, 0);

            // ------ Füße
            if (r.leftFoot != null)
            {
                float stride = (style == ProceduralAnimStyle.Floaty ? 0.05f : 0.18f) * move;
                float lift = (style == ProceduralAnimStyle.Floaty ? 0f : 0.12f) * move;
                Vector3 lf = r.leftFootRest + new Vector3(0, Mathf.Max(0, c1) * lift + baseY * 0.5f, s1 * stride);
                Vector3 rf = r.rightFootRest + new Vector3(0, Mathf.Max(0, -c1) * lift + baseY * 0.5f, -s1 * stride);
                if (deathT >= 0f) { lf = r.leftFootRest; rf = r.rightFootRest; }
                r.leftFoot.localPosition = lf;
                r.rightFoot.localPosition = rf;
            }

            // Schritt-Ereignis (Staub, Sound)
            if (move > 0.3f && style != ProceduralAnimStyle.Floaty)
            {
                stepTimer += dt * Mathf.Lerp(0f, 13f, move) * speedMul;
                if (stepTimer >= Mathf.PI) { stepTimer -= Mathf.PI; if (OnFootstep != null) OnFootstep(); }
            }
            if (hitT >= 0f) hitT += dt;
        }

        // =================================================================== Eigenes Modell ohne Clips
        private Vector3 customBasePos;
        private bool customBaseSet;

        /// <summary>Einfache Bewegung (Hüpfen, Neigen, Angriffs-Ruck) für eigene Modelle ohne AnimationClips.</summary>
        private void UpdateCustomSimple(float dt)
        {
            var body = Rig.bodyPivot;
            if (!customBaseSet) { customBasePos = body.localPosition; customBaseSet = true; }
            phase += dt * Mathf.Lerp(0f, 12f, move) * cfg.walkCycleSpeed;
            float bob = Mathf.Abs(Mathf.Sin(phase)) * 0.08f * cfg.bounceAmount * move + Mathf.Sin(Time.time * 2.5f) * 0.015f;
            float lean = 8f * move, yaw = 0f;
            if (attackT >= 0f) { attackT += dt; float k = Mathf.Clamp01(attackT / attackDur); lean -= Mathf.Sin(k * Mathf.PI) * 10f; if (k >= 1f) attackT = -1f; }
            if (superT >= 0f) { superT += dt; float k = Mathf.Clamp01(superT / 0.5f); bob += Mathf.Sin(k * Mathf.PI) * 0.45f; yaw = k * 360f; if (k >= 1f) superT = -1f; }
            if (transformT >= 0f) { transformT += dt; float k = Mathf.Clamp01(transformT / 0.8f); bob += Mathf.Sin(k * Mathf.PI) * 0.6f; yaw += k * 720f; if (k >= 1f) transformT = -1f; }
            if (victory) bob += Mathf.Abs(Mathf.Sin(Time.time * 5f)) * 0.3f;
            if (deathT >= 0f) { deathT += dt; lean = Mathf.Lerp(lean, -85f, Mathf.Clamp01(deathT / 0.5f)); }
            body.localPosition = customBasePos + Vector3.up * bob;
            body.localRotation = Quaternion.Euler(Appearance != null ? Appearance.customModelRotation : Vector3.zero) * Quaternion.Euler(lean, yaw, 0);
            if (hitT >= 0f) hitT += dt;
            if (move > 0.3f)
            {
                stepTimer += dt * 6f * move;
                if (stepTimer >= Mathf.PI) { stepTimer -= Mathf.PI; if (OnFootstep != null) OnFootstep(); }
            }
        }

        // =================================================================== Clips (Playables)
        private void SetupGraph()
        {
            Rig.animator.applyRootMotion = false;
            graph = PlayableGraph.Create("BrawlerAnim");
            graph.SetTimeUpdateMode(DirectorUpdateMode.GameTime);
            var output = AnimationPlayableOutput.Create(graph, "Anim", Rig.animator);
            mixer = AnimationMixerPlayable.Create(graph, 3);
            output.SetSourcePlayable(mixer);
            var idle = cfg.idleClip != null ? cfg.idleClip : cfg.walkClip;
            var walk = cfg.walkClip != null ? cfg.walkClip : cfg.idleClip;
            graph.Connect(AnimationClipPlayable.Create(graph, idle), 0, mixer, 0);
            graph.Connect(AnimationClipPlayable.Create(graph, walk), 0, mixer, 1);
            mixer.SetInputWeight(0, 1f);
            graph.Play();
        }

        private void PlayAction(AnimationClip clip, bool hold)
        {
            if (clip == null || !graph.IsValid()) return;
            var old = mixer.GetInput(2);
            if (old.IsValid()) { graph.Disconnect(mixer, 2); old.Destroy(); }
            var p = AnimationClipPlayable.Create(graph, clip);
            p.SetTime(0);
            graph.Connect(p, 0, mixer, 2);
            actionTimeLeft = clip.length;
            actionHold = hold;
        }

        private void StopAction()
        {
            actionTimeLeft = 0f; actionHold = false;
            if (graph.IsValid()) mixer.SetInputWeight(2, 0f);
        }

        private void UpdateClips(float dt)
        {
            if (!graph.IsValid()) return;
            float actionW = mixer.GetInputWeight(2);
            if (actionTimeLeft > 0f || actionHold)
            {
                actionTimeLeft -= dt;
                actionW = Mathf.MoveTowards(actionW, 1f, dt / Mathf.Max(0.01f, cfg.crossFade));
                if (actionHold && actionTimeLeft <= 0f)
                {
                    var p = mixer.GetInput(2);
                    if (p.IsValid()) p.SetSpeed(0);
                }
            }
            else actionW = Mathf.MoveTowards(actionW, 0f, dt / Mathf.Max(0.01f, cfg.crossFade));
            float rest = 1f - actionW;
            mixer.SetInputWeight(0, rest * (1f - move));
            mixer.SetInputWeight(1, rest * move);
            mixer.SetInputWeight(2, actionW);
            var walkP = mixer.GetInput(1);
            if (walkP.IsValid()) walkP.SetSpeed(Mathf.Max(0.2f, move) * cfg.walkClipSpeedScale);

            if (move > 0.3f)
            {
                stepTimer += dt * 6f * move;
                if (stepTimer >= Mathf.PI) { stepTimer -= Mathf.PI; if (OnFootstep != null) OnFootstep(); }
            }
            if (hitT >= 0f) hitT += dt;
        }

        // =================================================================== Blitz-Effekt
        private void UpdateFlash(float dt)
        {
            float flash = 0f; Color c = Color.white;
            if (hitT >= 0f && hitT < 0.14f) flash = 1f - hitT / 0.14f;
            if (transformT >= 0f) { flash = Mathf.Max(flash, Mathf.Sin(Mathf.Clamp01(transformT / 0.8f) * Mathf.PI) * 0.8f); }
            if (ghost > 0f && flash < 0.3f) { flash = 0.35f; c = new Color(0.6f, 1f, 0.6f); }
            foreach (var r in Rig.renderers)
            {
                if (r == null) continue;
                r.GetPropertyBlock(mpb);
                mpb.SetFloat(FlashAmountId, flash * 0.85f);
                mpb.SetColor(FlashColorId, c);
                r.SetPropertyBlock(mpb);
            }
        }
    }
}
