# Elixir Tracker (Android)

Overlay-App für Clash Royale: schätzt das **Elixier des Gegners** und zeigt seine **Hand-Karten** (+ nächste Karte) an.
Gegnerische Karten werden per Bildschirm-Scan (OpenCV Template-Matching) erkannt oder manuell eingetragen.

> ⚠️ Hilfs-Tools während eines Matches verstoßen wahrscheinlich gegen Supercells Nutzungsbedingungen.
> Nutzung auf eigenes Risiko – am besten nicht mit dem Hauptaccount.

## APK bekommen
GitHub → **Actions** → „Build Elixir Tracker APK“ → letzter Lauf → Artifact **ElixirTracker-apk** herunterladen,
entpacken, die `.apk` aufs Handy kopieren und installieren („Unbekannte Apps installieren“ erlauben).

Selbst bauen: Android Studio öffnen → Ordner `ElixirTracker` → Run.

## Einrichtung
1. App öffnen → **Overlay-Berechtigung** erteilen.
2. **Karten-Vorlagen** anlegen: Im Match Screenshot machen, wenn der Gegner eine Karte spielt (das kleine
   Karten-Symbol über der platzierten Karte), in der Galerie eng zuschneiden und die Datei nach der Karte benennen
   (`Hog Rider.png`, `Schweinereiter.png` oder `Name_4.png` mit Kosten). In der App → **Bilder importieren**.
3. **Starten mit Bildschirm-Scan** → Aufnahme erlauben → Clash Royale öffnen.
4. Unter **Overlay: Größe & Position** Größe (50–200 %), Deckkraft und Bildschirm-Ecke wählen –
   wird live übernommen. Feinjustieren durch Ziehen der Kopfzeile (Position wird gespeichert).
5. Beim Match-Beginn im Overlay **▶ Start** drücken.

## Wie gerechnet wird
- Start 5 Elixier, +1 alle 2,8 s, ab 2:00 Spielzeit doppelt (x2), x3 manuell, max. 10.
- Gespielte Karte → Kosten werden abgezogen (Spiegel = letzte Karte + 1).
- Zyklus: Die letzten 4 gespielten Karten sind nicht auf der Hand; die älteste davon kommt als nächstes.
  Nach 8 verschiedenen Karten ist das Deck bekannt, dann wird auch nur noch nach diesen 8 gesucht.

## Grenzen
- Die Erkennung ist nur so gut wie die Vorlagen. Mit „Besten Treffer anzeigen“ und der Schwelle (Standard 78 %)
  kalibrieren. Den Scan-Bereich so einstellen, dass deine eigene Kartenleiste unten **nicht** drin ist.
- Elixiersammler, Elixir-Golem-Bonus, Helden-Fähigkeiten usw. werden nicht automatisch erfasst → −1/+1 benutzen.
- Kartenkosten stehen in `app/src/main/java/app/elixirtracker/logic/CardDatabase.kt` und sind ggf. anzupassen.

## Projekt
- `logic/` – reine Kotlin-Logik (Elixier, Zyklus, Kartendatenbank) + Unit-Tests
- `ScreenAnalyzer.kt` – OpenCV-Erkennung
- `TrackerService.kt` – Bildschirmaufnahme (MediaProjection) + Overlay-Steuerung
- `OverlayController.kt` – schwebendes Fenster
- `MainActivity.kt` – Einrichtung, Vorlagen-Import, Einstellungen
