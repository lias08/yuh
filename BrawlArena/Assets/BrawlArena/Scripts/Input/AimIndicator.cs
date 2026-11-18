// ---------------------------------------------------------------------------------------------
// AimIndicator – Zielanzeige am Boden während des Zielens (Linie, Kegel, Wurfkreis, Bogen,
// Fläche um den Spieler). Form und Größe ergeben sich automatisch aus dem AttackSpec.
// ---------------------------------------------------------------------------------------------
using UnityEngine;
using BrawlArena.Data;
using BrawlArena.Gameplay;
using BrawlArena.Rendering;

namespace BrawlArena.Controls
{
    public class AimIndicator : MonoBehaviour
    {
        private MeshFilter mainMf, targetMf;
        private MeshRenderer mainMr, targetMr;
        private Material mat, targetMat;
        private AttackSpec lastSpec;
        private float lastLength = -1f;
        private Mesh circleMesh;

        public static AimIndicator Create(Transform parent)
        {
            var go = new GameObject("AimIndicator");
            go.transform.SetParent(parent, false);
            var a = go.AddComponent<AimIndicator>();
            a.mat = new Material(MaterialLibrary.Indicator);
            a.targetMat = new Material(MaterialLibrary.Indicator);
            a.mainMf = go.AddComponent<MeshFilter>();
            a.mainMr = go.AddComponent<MeshRenderer>();
            a.mainMr.sharedMaterial = a.mat;
            a.mainMr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            var t = new GameObject("Target");
            t.transform.SetParent(parent, false); // eigenes Objekt, damit die Linien-Skalierung den Kreis nicht verzerrt
            a.targetMf = t.AddComponent<MeshFilter>();
            a.targetMr = t.AddComponent<MeshRenderer>();
            a.targetMr.sharedMaterial = a.targetMat;
            a.targetMr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            a.circleMesh = ProcMesh.BuildSector(1f, 359.9f, 40);
            a.Hide();
            return a;
        }

        public void Hide() { mainMr.enabled = false; targetMr.enabled = false; }

        /// <summary>Zeigt die Zielanzeige. aim = Richtung * Anteil der Reichweite.</summary>
        public void Show(Brawler owner, AttackSpec spec, Vector2 aim, bool isSuper)
        {
            if (owner == null || !owner.IsAlive || spec == null) { Hide(); return; }
            Color c = isSuper ? new Color(1f, 0.85f, 0.2f, 0.4f) : new Color(1f, 1f, 1f, 0.32f);
            Color edge = isSuper ? new Color(1f, 0.9f, 0.3f, 0.9f) : new Color(1f, 1f, 1f, 0.85f);
            mat.SetColor("_Color", c); mat.SetColor("_EdgeColor", edge);
            targetMat.SetColor("_Color", c); targetMat.SetColor("_EdgeColor", edge);

            Vector3 dir = InputFrame.ToWorld(aim);
            if (dir.sqrMagnitude < 0.0001f) dir = owner.AimFacing;
            dir.Normalize();
            transform.position = owner.Position + Vector3.up * 0.06f;
            transform.rotation = Quaternion.LookRotation(dir);
            mainMr.enabled = true;
            targetMr.enabled = false;

            float range = Mathf.Max(0.5f, spec.range);
            switch (spec.kind)
            {
                case AttackKind.Lob:
                case AttackKind.Leap:
                case AttackKind.HealZone:
                case AttackKind.DamageZone:
                case AttackKind.Turret:
                {
                    float dist = Mathf.Clamp01(aim.magnitude) * range;
                    if (spec.kind == AttackKind.Leap || spec.kind == AttackKind.Lob) dist = Mathf.Max(0.5f, dist);
                    SetMesh(spec, range, () => ProcMesh.BuildStrip(0.12f, 1f));
                    transform.localScale = new Vector3(1, 1, Mathf.Max(0.1f, dist));
                    float r = spec.kind == AttackKind.Turret ? 0.6f : Mathf.Max(0.5f, spec.areaRadius);
                    targetMr.enabled = true;
                    targetMf.sharedMesh = circleMesh;
                    targetMr.transform.position = owner.Position + dir * dist + Vector3.up * 0.07f;
                    targetMr.transform.rotation = Quaternion.identity;
                    targetMr.transform.localScale = new Vector3(r, 1, r);
                    break;
                }
                case AttackKind.Melee:
                {
                    float reach = spec.comboSteps != null && spec.comboSteps.Count > 0 ? spec.comboSteps[0].range : range;
                    float arc = spec.comboSteps != null && spec.comboSteps.Count > 0 ? spec.comboSteps[0].arcAngle : (spec.spreadAngle > 1 ? spec.spreadAngle : 100f);
                    SetMesh(spec, reach, () => ProcMesh.BuildSector(1f, Mathf.Min(arc, 359f), 24));
                    transform.localScale = new Vector3(reach, 1, reach);
                    break;
                }
                case AttackKind.Nova:
                case AttackKind.Shield:
                {
                    float r = spec.kind == AttackKind.Shield ? Mathf.Max(1f, spec.areaRadius) : range;
                    SetMesh(spec, r, () => ProcMesh.BuildSector(1f, 359.9f, 40));
                    transform.localScale = new Vector3(r, 1, r);
                    break;
                }
                default:
                {
                    // Linie oder Kegel (bei Streuung); an Wänden gekürzt, außer der Angriff zerstört Wände
                    float len = range;
                    var ctx = MatchContext.Current;
                    if (ctx != null && !spec.destroysWalls && spec.bounces == 0 && spec.kind != AttackKind.Dash)
                    {
                        Vector3 a = owner.Position + Vector3.up * 0.5f;
                        Vector3 end = ctx.Arena.ClipToWalls(a, a + dir * range);
                        len = Mathf.Max(0.6f, (end - a).magnitude);
                    }
                    if (spec.spreadAngle > 4f && spec.projectileCount > 1)
                    {
                        float ang = spec.spreadAngle + 6f;
                        SetMesh(spec, range, () => ProcMesh.BuildSector(1f, ang, 20));
                        transform.localScale = new Vector3(len, 1, len);
                    }
                    else
                    {
                        float w = Mathf.Max(0.35f, spec.projectileRadius * 2.2f);
                        SetMesh(spec, w, () => ProcMesh.BuildStrip(w, 1f));
                        transform.localScale = new Vector3(1, 1, len);
                    }
                    break;
                }
            }
        }

        private void SetMesh(AttackSpec spec, float key, System.Func<Mesh> build)
        {
            if (lastSpec == spec && Mathf.Approximately(lastLength, key)) return;
            lastSpec = spec; lastLength = key;
            ProcMesh.Release(mainMf.sharedMesh);
            mainMf.sharedMesh = build();
        }

        private void OnDestroy()
        {
            if (targetMr != null) Destroy(targetMr.gameObject);
            if (mat != null) Destroy(mat);
            if (targetMat != null) Destroy(targetMat);
        }
    }
}
