# BrawlArena – 3D-Mobile-Brawler für Android (Unity)

Ein eigenständiges 3D-Arena-Brawler-Spiel im Stil schneller Mobile-Team-Shooter: isometrische Kamera,
Cartoon-Grafik, Touch-Joysticks, Bots, sieben Spielmodi, Fortschrittssystem und ein komplett
datengetriebenes **Charakter-System** (im Unity-Editor *und* direkt im Spiel).

Alle Grafiken, Modelle, Icons, Sounds und die Musik werden **im Code erzeugt** – es werden keine fremden
Assets verwendet. Eigene Modelle, Animationen, Sounds, Schriftarten und Icons können jederzeit ergänzt werden.

> Das Unity-Projekt liegt im Ordner **`BrawlArena/`** (Unity **2022.3 LTS**, Built-in Render Pipeline).

---

## Inhalt

1. [Schnellstart](#1-schnellstart)
2. [APK bauen](#2-apk-bauen)
3. [Was ist drin?](#3-was-ist-drin)
4. [Eigene Charaktere erstellen](#4-eigene-charaktere-erstellen)
5. [Evolution & Kombo-Angriffe](#5-evolution--kombo-angriffe)
6. [Eigene 3D-Modelle & Animationen](#6-eigene-3d-modelle--animationen)
7. [Skins, Karten, Spielmodi, Sounds](#7-skins-karten-spielmodi-sounds)
8. [Neue Angriffsarten & Modi programmieren](#8-neue-angriffsarten--modi-programmieren)
9. [Architektur & Online-Multiplayer](#9-architektur--online-multiplayer)
10. [Steuerung](#10-steuerung)

---

## 1. Schnellstart

1. **Unity Hub** installieren, Unity **2022.3 LTS** mit Modul **„Android Build Support“** (inkl. OpenJDK + SDK/NDK) hinzufügen.
2. In Unity Hub **„Add project from disk“** → Ordner `BrawlArena` wählen und öffnen.
   Unity erzeugt beim ersten Öffnen die fehlenden Projektdateien (dauert einige Minuten).
3. Menü **BrawlArena → Startszene anlegen**, dann **Play** drücken.
   Das Spiel baut sich selbst auf – es funktioniert in jeder (auch leeren) Szene.
4. Im Editor steuern: **WASD** bewegen, **Maus** zielen, **Linksklick** Angriff, **Rechtsklick** Super.

## 2. APK bauen

### Variante A – lokal in Unity (empfohlen)

Menü **BrawlArena → Android-APK bauen** → Speicherort wählen → fertig.
Das Script stellt automatisch alles ein: Paketname `com.brawlarena.game`, Querformat, IL2CPP,
ARM64 + ARMv7, Android 7.0+ (API 24), Startszene.
Die APK auf das Handy kopieren und installieren („Installation aus unbekannten Quellen“ erlauben).

Kommandozeile:

```bash
Unity -batchmode -quit -projectPath BrawlArena -buildTarget Android \
      -executeMethod BrawlArena.EditorTools.BuildScript.BuildAndroidCI \
      -customBuildPath Builds/BrawlArena.apk
```

### Variante B – automatisch mit GitHub Actions

Der Workflow `.github/workflows/build-android.yml` baut die APK in der Cloud (game-ci).

1. Unity-Lizenz besorgen (kostenlose Personal-Lizenz reicht):
   Anleitung: <https://game.ci/docs/github/activation> → ergibt eine `.ulf`-Datei.
2. Im GitHub-Repository unter **Settings → Secrets and variables → Actions** anlegen:
   `UNITY_LICENSE` (Inhalt der `.ulf`-Datei), `UNITY_EMAIL`, `UNITY_PASSWORD`.
3. Reiter **Actions → „Android-APK bauen“ → Run workflow**.
4. Nach ~20–40 Minuten liegt die APK als Artefakt **BrawlArena-APK** am Workflow-Lauf.

## 3. Was ist drin?

| Bereich | Umfang |
|---|---|
| **Gameplay** | Virtueller Bewegungs-Joystick (folgt dem Finger), Angriffs- und Super-Joystick: Antippen = Auto-Zielen, Ziehen = manuell zielen mit Zielanzeige. Lebenspunkte, Schaden, Munition mit Nachladen, Super-Aufladung durch Treffer, automatische Heilung, Busch-Tarnung, Wasser, zerstörbare Wände/Kisten, Rückstoß, Verlangsamung, Betäubung, Schilde, Respawn, Sieg-/Niederlagen-Bildschirm. |
| **Angriffsarten** | Schuss (Einzel/Schrot/Salve), Wurf über Wände, Nahkampf mit **Kombos**, Strahl, Bumerang, Rundumschlag, Sturmangriff, Sprung, Heilzone, Schadenszone, Geschützturm, Schild, eigene Muster. |
| **Spielmodi** | 3v3-Teamkampf, Gem Grab, Brawl Ball, Showdown (10 Spieler, Giftgas, Power-Würfel), Solo-Überleben (Wellen + Boss), Duo-Überleben (mit Bot-Partner), Trainingsmodus (Puppen + Schadensmessung). Jeder Modus hat eigene Regeln, Spawnpunkte und Siegbedingungen. |
| **Brawler** | 12 eigene Charaktere in 6 Seltenheiten, darunter **Klingengeist** mit 4 Evolutionsstufen, plus Gegner-Roboter, Boss und Trainingspuppen. |
| **Karten** | 7 Karten (Wüste, Ruinen, Stadion, Wald) mit Deko, Büschen, Wasser, Kisten. |
| **KI** | Bots mit A*-Wegfindung, Zielwahl, Vorhalten, Ausweichen, Rückzug, Super-Einsatz und Modus-Zielen (Edelsteine, Ball, Gas, Boxen). Stärke passt sich den Trophäen an. |
| **Menüs** | Hauptmenü mit 3D-Brawler, Brawler-Liste, Charakterdetails (3D-Vorschau, Werte, Upgrades, Skins), Shop, Trophäenpfad, Modus-/Kartenwahl, Einstellungen, Profil, Matchmaking, Belohnungen, In-Game-Charakter-Editor. |
| **Fortschritt** | Trophäen pro Brawler, Spielerlevel/XP, Münzen, Edelsteine, Tokens, Kraftpunkte, Brawler-Level 1–11, Boxen, tägliche Belohnung, Gratis-Box, Skins. Alles wird im Spiel verdient – **keine Echtgeld-Käufe**. |
| **Technik** | Speicherstand als JSON (atomar + Backup), Offline gegen Bots, eigene Toon-Shader mit Umriss und Schatten, Partikeleffekte, synthetische Sounds & Musik, Qualitätsstufen, Safe-Area, Android-Zurück-Taste. |

## 4. Eigene Charaktere erstellen

### Im Unity-Editor (volle Kontrolle)

1. Menü **BrawlArena → Neu → Brawler** (oder Rechtsklick im Projekt → *Create → BrawlArena → Brawler*).
2. Das Asset liegt in `Assets/BrawlArena/Resources/BrawlArena/Brawlers/` – **nur dort** wird es vom Spiel gefunden.
3. Im Inspector alles einstellen; unten im Inspector ist eine **drehbare 3D-Vorschau**:

| Feld | Bedeutung |
|---|---|
| `id` | Eindeutige ID (für den Speicherstand – später nicht mehr ändern) |
| `displayName`, `role`, `description` | Name, Rolle, Beschreibung |
| `rarity`, `coinPrice`, `unlockedByDefault` | Seltenheit, Preis, von Anfang an verfügbar |
| `appearance` | Eigenes **3D-Modell** *oder* prozedurale Figur: Körperform, Kopfbedeckung, Waffe, Gesicht, Rucksack, Umhang, **Größe**, Kopfgröße, **Farben** |
| `animations` | Prozeduraler Stil (Hüpfend, Watschelnd, Roboter, Schwebend, Schwer, Schleichend) *oder* eigene Clips: **Idle, Lauf, Angriff, Super**, Treffer, Tod, Sieg |
| `maxHealth`, `moveSpeed`, `maxAmmo`, `reloadTime`, `attackCooldown` | Lebenspunkte, Tempo, Munition, Nachladezeit, Angriffsgeschwindigkeit |
| `mainAttack` / `superAbility` | Angriffstyp, Schaden, Reichweite, Projektile, Streuung, Salven, Durchdringen, Abpraller, Fläche, Dauer, Statuseffekte, Farbe, Optik, Kombo-Schritte … |
| `sounds` | Eigene AudioClips oder synthetische Ersatzsounds, Tonhöhe |
| `evolutionTrigger`, `forms` | Evolutionsstufen (siehe unten) |

Tipp: **BrawlArena → Standardinhalte als Assets exportieren** legt alle mitgelieferten Brawler, Karten,
Modi und Skins als bearbeitbare Assets an. Ein Asset mit derselben ID ersetzt den eingebauten Eintrag.

### Direkt im Spiel (ohne Unity)

Hauptmenü → **Editor**: Aussehen, Farben, Werte, Angriff (inkl. Kombo-Schläge und Energiewelle), Super und
Sounds mit Live-3D-Vorschau einstellen → **Speichern** → der Brawler ist sofort in der Brawler-Liste
und mit **Testen** im Trainingsmodus spielbar.

## 5. Evolution & Kombo-Angriffe

**Kombos:** Bei `kind = Melee` kann `comboSteps` mehrere Schläge enthalten, die **ein** Munitionsbalken auslöst.
Jeder Schritt: Verzögerung, Richtung (links→rechts, rechts→links, Stoß, von oben, Drehung), Schaden,
Reichweite, Bogenbreite, Rückstoß, Vorwärtsschritt und optional eine **Energiewelle** (eigener Schaden,
Reichweite, Tempo, Breite, Farbe).

**Evolution:** `forms` enthält weitere Formen (Stufe 2, 3, 4 …). Jede Form kann Aussehen, Animationen,
Hauptangriff und Super ersetzen sowie Leben/Tempo/Nachladen multiplizieren. Auslöser (`evolutionTrigger`):
Super-Einsätze, K.O.s, Matchzeit, Brawler-Level oder verursachter Schaden; `threshold` legt den Wert fest.

Beispiel **Klingengeist** (Vorlage: *BrawlArena → Neu → Brawler mit 4 Evolutionsstufen*):

| Stufe | Auslöser | 1 Munition = |
|---|---|---|
| 1 – Seelenklinge | Start | 1 kräftiger horizontaler Hieb |
| 2 – Kettenklinge | 1. Super | 2 Hiebe: links→rechts, direkt zurück |
| 3 – Maskenwut | 2. Super | 3 schnelle Hiebe, der letzte erzeugt eine kleine Energiewelle |
| 4 – Wahre Klinge | 3. Super | 2 blitzschnelle Hiebe + kräftiger 3. Schlag mit großer Klingenwelle, neue Super |

## 6. Eigene 3D-Modelle & Animationen

1. Modell (FBX/OBJ/…) in Unity importieren und ein Prefab daraus machen. Das Modell sollte entlang **+Z**
   schauen (sonst `customModelRotation` anpassen) und mit den Füßen auf y = 0 stehen.
2. Im Brawler-Asset `appearance.customModel` = Prefab, `customModelScale`/`Offset` anpassen.
3. Optional ein leeres Kindobjekt **`WeaponTip`** (oder `Muzzle`) an die Waffenmündung setzen – dort entstehen Projektile.
4. **Animationen:** Clips in `animations` eintragen (Idle, Walk, Attack, Super, Hit, Death, Victory).
   Das Modell braucht nur eine **Animator-Komponente** (ohne Controller) – die Clips werden über das
   Playables-System abgespielt und überblendet (`crossFade`). Ohne Clips bekommt das Modell eine einfache
   prozedurale Animation (Hüpfen, Neigen, Drehung bei der Super).
5. Collider im Modell werden automatisch entfernt (die Spiel-Kollision ist eigene Logik).

## 7. Skins, Karten, Spielmodi, Sounds

**Skins:** *BrawlArena → Neu → Skin* → `brawlerId` setzen, Aussehen/Modell/Animationen/Sounds/Projektilfarbe
ändern, Edelstein-Preis festlegen. Erscheint automatisch in den Charakterdetails.

**Karten:** *BrawlArena → Neu → Karte*. Eine Karte ist ein Textraster – der Inspector zeigt eine farbige Vorschau:

```
.  Boden      #  Wand         X  Kiste (zerstörbar)   B  Busch     W  Wasser
1  Spawn Blau 2  Spawn Rot    S  Showdown-Spawn       E  Gegner-Spawn (Überleben)
G  Edelsteinmine  O  Ball     a/b  Tor Blau/Rot       C  Power-Box  D  Puppe  H  Heilpilz
```

Mit `mirrorVertically` gibst du nur die untere Hälfte (ab der Mittelzeile) an – sie wird gespiegelt und
die Teams werden getauscht. `supportedModes` legt fest, für welche Modi die Karte erscheint;
`theme` steuert Farben, Licht und Deko (Wüste, Wald, Schnee, Süßigkeiten, Ruinen, Stadion).

**Spielmodi:** *BrawlArena → Neu → Spielmodus* – Teams, Spieler pro Team, Dauer, Respawn, Zielpunktzahl,
Countdown, Wellen, Leben, Giftgas, Belohnungen, benötigte Trophäen.

**Sounds & Musik:** Eigene Clips direkt im Brawler eintragen. Globale Ersatzsounds: Datei nach
`Resources/BrawlArena/Audio/<Name>` legen, z.B. `Explosion`, `Pew`, `Victory` (Namen siehe `SfxPreset`),
Musik als `MenuMusic` bzw. `BattleMusic`.

**Schrift & Icons:** `Resources/BrawlArena/Fonts/MainFont.ttf` ersetzt die Schriftart,
`Resources/BrawlArena/Icons/<Icon>.png` (als Sprite importiert) ersetzt einzelne Icons (`Coin`, `Gem`, `Trophy` …).

Mit **BrawlArena → Inhalte prüfen** werden doppelte IDs, fehlende Karten und falsche Verweise gemeldet.

## 8. Neue Angriffsarten & Modi programmieren

**Angriff:** Klasse von `CustomAttackPattern` ableiten, `Execute(AttackContext ctx)` überschreiben
(Hilfsfunktionen: `SpawnProjectile`, `DamageArea`, `Schedule`). Asset erzeugen und im Brawler
`kind = Custom`, `customPattern = Asset` setzen. Beispiel: `SpiralAttackPattern`.

**Modus:** Klasse von `GameModeController` ableiten (z.B. `Tick`, `OnBrawlerDied`, `GetHudInfo`,
`GetBotObjective` überschreiben). Im Spielmodus-Asset `modeType = Custom` und
`controllerClassName = "MeinNamespace.MeinModus"` eintragen.

## 9. Architektur & Online-Multiplayer

```
BrawlArena/Assets/BrawlArena/
├── Scripts/
│   ├── Core/       Bootstrap, GameFlow (Ablauf), ContentDatabase, Standardinhalte & -karten
│   ├── Data/       BrawlerDefinition, AttackSpec, Kombo/Evolution, Skin, Karte, Spielmodus (ScriptableObjects)
│   ├── Gameplay/   Brawler, Animator, Angriffe, Projektile, Arena (Kollision, A*), Kamera, Match, Objekte
│   ├── Modes/      Teamkampf, Gem Grab, Brawl Ball, Showdown, Überleben, Training
│   ├── AI/         BotBrain, Trainingspuppen
│   ├── Input/      Touch-Joysticks, Spielersteuerung, Zielanzeige
│   ├── Rendering/  Prozedurale Meshes, Figurengenerator, Materialien, Vorschau-Bühnen
│   ├── FX/ Audio/  Partikel & Formeffekte, Sound-/Musiksynthese
│   ├── Save/       Spielstand, Wirtschaft & Belohnungen
│   ├── Net/        MatchConfig, MatchResult, IMatchmaker, OfflineMatchmaker
│   └── UI/         UI-Baukasten, Icons, Bildschirme, Kampf-HUD
├── Editor/         APK-Build, Menübefehle, Inspektoren mit 3D-/Kartenvorschau
└── Resources/      Shader (Toon mit Umriss, Boden, Wasser, Partikel, Zielanzeige) + eigene Inhalte
```

**Vorbereitet für Online-Spiel:**
- Ein Match entsteht ausschließlich aus einer serialisierbaren **`MatchConfig`** (Modus, Karte, Teilnehmer, Seed).
- Jede Figur wird über eine **`IBrawlerInputSource`** gesteuert, die pro Frame einen **`InputFrame`** liefert
  (Spieler, Bot – oder später Netzwerk). Für Online-Spiel: eine `NetworkInputSource` schreiben, die
  InputFrames empfängt, und in `MatchContext.SpawnBrawler` für Remote-Spieler verwenden.
- Die Spielersuche läuft über **`IMatchmaker`**; offline füllt `OfflineMatchmaker` mit Bots auf.
  Ein Online-Matchmaker (Unity Netcode/Relay, Photon, eigener Server) ersetzt ihn in `GameFlow.Init`.
- Kollision, Wegfindung und Projektile laufen ohne Physik-Engine auf einem Kachelraster – gut geeignet
  für Server-Autorität oder Lockstep.

## 10. Steuerung

| Aktion | Touch | Tastatur/Maus |
|---|---|---|
| Bewegen | linker Daumen (Joystick) | WASD |
| Angriff (Auto-Zielen) | rechten Button antippen | Leertaste |
| Angriff (gezielt) | rechten Button ziehen & loslassen | Linksklick |
| Super | gelben Button antippen / ziehen | E / Rechtsklick |
| Pause | Button oben links / Zurück-Taste | Esc |
