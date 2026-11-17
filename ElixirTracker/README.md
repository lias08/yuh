# Elixir Tracker (Android)

Overlay-App für Clash Royale: schätzt das **Elixier des Gegners** und zeigt seine **Hand-Karten** (+ nächste Karte) an.
Alles läuft automatisch: Match-Start/-Ende, Elixier-Phasen (x2 ab 2:00, x3 in der Verlängerung) und die
gegnerischen Karten (Bildschirm-Scan mit OpenCV). Alle 120 Karten (Bild + Elixierkosten) werden beim Bauen aus
[RoyaleAPI/cr-api-data](https://github.com/RoyaleAPI/cr-api-data) und
[RoyaleAPI/cr-api-assets](https://github.com/RoyaleAPI/cr-api-assets) geladen (`tools/fetch_cards.py`).

> ⚠️ Hilfs-Tools während eines Matches verstoßen wahrscheinlich gegen Supercells Nutzungsbedingungen.
> Nutzung auf eigenes Risiko – am besten nicht mit dem Hauptaccount.

## APK bekommen
GitHub → **Actions** → „Build Elixir Tracker APK“ → letzter Lauf → Artifact **ElixirTracker-apk** herunterladen,
entpacken, die `.apk` aufs Handy kopieren und installieren („Unbekannte Apps installieren“ erlauben).

Selbst bauen: `python3 tools/fetch_cards.py` (braucht Pillow), dann Android Studio → Ordner `ElixirTracker` → Run.

## Einrichtung
1. App öffnen → **Overlay-Berechtigung** erteilen.
2. Optional: Größe, Deckkraft und Position des Overlays wählen.
3. **Starten mit Bildschirm-Scan** → Aufnahme erlauben → Clash Royale öffnen und spielen.
   Im Match musst du nichts drücken. In den ersten Matches sucht die App einmal die Größe,
   in der Karten auf deinem Bildschirm erscheinen („kalibriert noch“), danach ist das gespeichert.

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
