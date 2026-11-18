// ---------------------------------------------------------------------------------------------
// Inspektoren für den Unity-Editor:
//  • BrawlerDefinition: Kurzübersicht, Hinweise und interaktive 3D-Vorschau der Figur
//    (unten im Inspector, mit der Maus drehbar) – inkl. Vorschau jeder Evolutionsform.
//  • MapDefinition: farbige Rasteransicht der Karte mit Legende und Prüfung.
// ---------------------------------------------------------------------------------------------
using UnityEditor;
using UnityEngine;
using BrawlArena.Data;
using BrawlArena.Rendering;

namespace BrawlArena.EditorTools
{
    [CustomEditor(typeof(BrawlerDefinition))]
    public class BrawlerDefinitionEditor : Editor
    {
        private PreviewRenderUtility preview;
        private GameObject model;
        private Vector2 drag = new Vector2(160f, -8f);
        private int previewForm;
        private int lastHash;
        private float modelHeight = 1.4f;

        public override void OnInspectorGUI()
        {
            var b = (BrawlerDefinition)target;
            EditorGUILayout.HelpBox(
                b.displayName + "  •  " + RarityUtil.GetName(b.rarity) + "  •  " + b.role + "\n" +
                "Leben " + b.maxHealth + "  •  Tempo " + b.moveSpeed + "  •  Munition " + b.maxAmmo + "  •  Nachladen " + b.reloadTime + " s\n" +
                "Angriff: " + b.mainAttack.displayName + " (" + b.mainAttack.kind + ", " + Mathf.RoundToInt(b.mainAttack.DamagePerUse) + " Schaden)\n" +
                "Super: " + b.superAbility.displayName + " (" + b.superAbility.kind + ")" +
                (b.forms.Count > 0 ? "\nEvolution: " + (b.forms.Count + 1) + " Formen (" + b.evolutionTrigger + ")" : ""),
                MessageType.None);
            if (b.appearance.customModel != null && b.animations.HasClips && b.appearance.customModel.GetComponentInChildren<Animator>() == null)
                EditorGUILayout.HelpBox("Eigene Animationsclips benötigen eine Animator-Komponente am Modell (kein Controller nötig).", MessageType.Warning);
            if (!AssetDatabase.GetAssetPath(b).Contains("/Resources/"))
                EditorGUILayout.HelpBox("Dieses Asset liegt nicht in einem 'Resources'-Ordner und wird vom Spiel NICHT gefunden. Verschiebe es nach Assets/BrawlArena/Resources/BrawlArena/Brawlers.", MessageType.Error);
            DrawDefaultInspector();
        }

        public override bool HasPreviewGUI() { return true; }

        public override GUIContent GetPreviewTitle() { return new GUIContent("3D-Vorschau"); }

        public override void OnPreviewSettings()
        {
            var b = (BrawlerDefinition)target;
            if (b.forms.Count == 0) return;
            var names = new string[b.forms.Count + 1];
            names[0] = "Form 1";
            for (int i = 0; i < b.forms.Count; i++) names[i + 1] = "Form " + (i + 2);
            int sel = EditorGUILayout.Popup(previewForm, names, GUILayout.Width(90));
            if (sel != previewForm) { previewForm = sel; lastHash = 0; }
        }

        public override void OnInteractivePreviewGUI(Rect r, GUIStyle background)
        {
            var b = (BrawlerDefinition)target;
            if (Event.current.type == EventType.MouseDrag && r.Contains(Event.current.mousePosition))
            {
                drag.x -= Event.current.delta.x;
                Event.current.Use();
                Repaint();
            }
            if (Event.current.type != EventType.Repaint) return;
            if (preview == null)
            {
                preview = new PreviewRenderUtility();
                preview.camera.fieldOfView = 30f;
                preview.camera.nearClipPlane = 0.1f;
                preview.camera.farClipPlane = 50f;
                preview.camera.clearFlags = CameraClearFlags.SolidColor;
                preview.camera.backgroundColor = new Color(0.25f, 0.4f, 0.8f);
                preview.lights[0].intensity = 1.2f;
                preview.lights[0].transform.rotation = Quaternion.Euler(40f, -30f, 0);
            }
            var appearance = previewForm > 0 && previewForm - 1 < b.forms.Count && b.forms[previewForm - 1].overrideAppearance ? b.forms[previewForm - 1].appearance : b.appearance;
            int hash = JsonUtility.ToJson(appearance).GetHashCode();
            if (model == null || hash != lastHash)
            {
                if (model != null) DestroyImmediate(model);
                model = new GameObject("Preview") { hideFlags = HideFlags.HideAndDontSave };
                var rig = BrawlerModelBuilder.Build(appearance, model.transform);
                foreach (var t in model.GetComponentsInChildren<Transform>(true)) t.gameObject.hideFlags = HideFlags.HideAndDontSave;
                preview.AddSingleGO(model);
                lastHash = hash;
                model.transform.localScale = Vector3.one;
                model.transform.position = Vector3.zero;
                modelHeight = rig.height;
            }
            float h = modelHeight;
            model.transform.rotation = Quaternion.Euler(0, drag.x, 0);
            preview.camera.transform.position = new Vector3(0, h * 0.55f, -2.4f - h * 1.3f);
            preview.camera.transform.rotation = Quaternion.Euler(8f, 0, 0);
            preview.BeginPreview(r, background);
            preview.Render();
            preview.EndAndDrawPreview(r);
        }

        private void OnDisable()
        {
            if (model != null) DestroyImmediate(model);
            if (preview != null) preview.Cleanup();
            preview = null;
        }
    }

    [CustomEditor(typeof(MapDefinition))]
    public class MapDefinitionEditor : Editor
    {
        public override void OnInspectorGUI()
        {
            var m = (MapDefinition)target;
            DrawDefaultInspector();
            EditorGUILayout.Space();
            var grid = MapDefinition.ParseLayout(m.layout, m.mirrorVertically);
            int w = grid.GetLength(0), h = grid.GetLength(1);
            EditorGUILayout.LabelField("Vorschau (" + w + " × " + h + " Kacheln)", EditorStyles.boldLabel);
            float cell = Mathf.Clamp((EditorGUIUtility.currentViewWidth - 40f) / w, 4f, 16f);
            var rect = GUILayoutUtility.GetRect(w * cell, h * cell);
            int blue = 0, red = 0, sd = 0;
            for (int x = 0; x < w; x++)
                for (int r = 0; r < h; r++)
                {
                    char c = grid[x, r];
                    if (c == MapLegend.SpawnBlue) blue++;
                    if (c == MapLegend.SpawnRed) red++;
                    if (c == MapLegend.SpawnShowdown) sd++;
                    EditorGUI.DrawRect(new Rect(rect.x + x * cell, rect.y + r * cell, cell - 1, cell - 1), MapLegend.EditorColor(c));
                }
            EditorGUILayout.HelpBox(
                "Legende:  . Boden   # Wand   X Kiste   B Busch   W Wasser\n" +
                "1 Spawn Blau   2 Spawn Rot   S Showdown-Spawn   E Gegner-Spawn (Überleben)\n" +
                "G Edelsteinmine   O Ball   a Tor Blau   b Tor Rot   C Power-Box   D Puppe   H Heilpilz\n\n" +
                "Spawns: Blau " + blue + " • Rot " + red + " • Showdown " + sd, MessageType.Info);
            if (m.supportedModes.Contains(ModeType.Showdown) && sd < 10)
                EditorGUILayout.HelpBox("Für Showdown werden 10 'S'-Spawnpunkte empfohlen (fehlende werden automatisch verteilt).", MessageType.Warning);
            if (m.supportedModes.Contains(ModeType.BrawlBall) && m.layout.IndexOf('a') < 0)
                EditorGUILayout.HelpBox("Brawl Ball benötigt Torkacheln ('a' bzw. durch Spiegelung 'b').", MessageType.Warning);
            if (!AssetDatabase.GetAssetPath(m).Contains("/Resources/"))
                EditorGUILayout.HelpBox("Diese Karte liegt nicht in einem 'Resources'-Ordner und wird vom Spiel NICHT gefunden.", MessageType.Error);
        }
    }
}
