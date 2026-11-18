// ---------------------------------------------------------------------------------------------
// BuildScript – erstellt die Android-APK mit einem Klick (Menü "BrawlArena > Android-APK bauen")
// oder auf einem Build-Server (GitHub Actions / Kommandozeile):
//
//   Unity -batchmode -quit -projectPath <Pfad> -buildTarget Android \
//         -executeMethod BrawlArena.EditorTools.BuildScript.BuildAndroidCI -customBuildPath Builds/BrawlArena.apk
//
// Setzt alle nötigen Player-Einstellungen (Paketname, Querformat, IL2CPP, ARM64/ARMv7,
// Mindest-Android-Version), legt die Startszene an und baut die APK.
// ---------------------------------------------------------------------------------------------
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace BrawlArena.EditorTools
{
    public static class BuildScript
    {
        public const string ScenePath = "Assets/BrawlArena/Scenes/Main.unity";
        public const string PackageName = "com.brawlarena.game";
        public const string DefaultApkPath = "Builds/Android/BrawlArena.apk";

        [MenuItem("BrawlArena/Android-APK bauen", priority = 0)]
        public static void BuildAndroidMenu()
        {
            string path = EditorUtility.SaveFilePanel("APK speichern", "Builds/Android", "BrawlArena", "apk");
            if (string.IsNullOrEmpty(path)) return;
            if (BuildAndroid(path)) EditorUtility.RevealInFinder(path);
        }

        /// <summary>Einstiegspunkt für Kommandozeile/CI. Beendet Unity mit Exit-Code 0/1.</summary>
        public static void BuildAndroidCI()
        {
            string path = GetArg("-customBuildPath") ?? DefaultApkPath;
            if (Directory.Exists(path) || !path.EndsWith(".apk", StringComparison.OrdinalIgnoreCase))
                path = Path.Combine(path, "BrawlArena.apk");
            bool ok = false;
            try { ok = BuildAndroid(path); }
            catch (Exception e) { Debug.LogException(e); }
            EditorApplication.Exit(ok ? 0 : 1);
        }

        public static bool BuildAndroid(string outputPath)
        {
            EnsureScene();
            ConfigurePlayerSettings();
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath)));
#if UNITY_2019_1_OR_NEWER
            EditorUserBuildSettings.buildAppBundle = false; // APK statt AAB
#endif
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);

            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = outputPath,
                target = BuildTarget.Android,
                targetGroup = BuildTargetGroup.Android,
                options = BuildOptions.None
            };
            var report = BuildPipeline.BuildPlayer(options);
            bool ok = report.summary.result == BuildResult.Succeeded;
            Debug.Log("[BrawlArena] Build " + (ok ? "erfolgreich" : "FEHLGESCHLAGEN") + ": " + outputPath +
                      " (" + report.summary.totalSize / (1024 * 1024) + " MB, " + report.summary.totalErrors + " Fehler)");
            return ok;
        }

        /// <summary>Legt die (leere) Startszene an – das Spiel baut sich zur Laufzeit selbst auf.</summary>
        public static void EnsureScene()
        {
            if (!File.Exists(ScenePath))
            {
                Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                EditorSceneManager.SaveScene(scene, ScenePath);
                AssetDatabase.Refresh();
            }
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        }

        public static void ConfigurePlayerSettings()
        {
            PlayerSettings.companyName = "BrawlArena";
            PlayerSettings.productName = "BrawlArena";
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, PackageName);
            if (string.IsNullOrEmpty(PlayerSettings.bundleVersion) || PlayerSettings.bundleVersion == "0.1") PlayerSettings.bundleVersion = "1.0.0";
            PlayerSettings.Android.bundleVersionCode = Mathf.Max(1, PlayerSettings.Android.bundleVersionCode);

            // Querformat, beide Richtungen
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;

            // Technik: IL2CPP + 64 Bit (Pflicht für moderne Geräte), Gamma-Farbraum (läuft überall)
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64 | AndroidArchitecture.ARMv7;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel24;
            PlayerSettings.colorSpace = ColorSpace.Gamma;
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.Android, true);
#if UNITY_2019_1_OR_NEWER
            PlayerSettings.Android.startInFullscreen = true;
            PlayerSettings.Android.renderOutsideSafeArea = true;
#endif
            PlayerSettings.runInBackground = false;

            // Standard-Qualitätsstufe: Schatten an, wird im Spiel über die Einstellungen angepasst
            QualitySettings.shadowDistance = 28f;
            AssetDatabase.SaveAssets();
        }

        private static string GetArg(string name)
        {
            var args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++)
                if (args[i] == name) return args[i + 1];
            return null;
        }
    }
}
