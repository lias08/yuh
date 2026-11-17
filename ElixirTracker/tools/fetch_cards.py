#!/usr/bin/env python3
"""
Lädt alle Clash-Royale-Karten (Name, Elixier, Bild) aus den öffentlichen
RoyaleAPI-Repos und legt sie in app/src/main/assets/cards/ ab.
Wird beim Bauen (GitHub Actions) ausgeführt; die Bilder werden nicht eingecheckt.

Quellen:
  https://github.com/RoyaleAPI/cr-api-data   (cards.json)
  https://github.com/RoyaleAPI/cr-api-assets (cards/<key>.png)
"""
import io
import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

DATA = "https://raw.githubusercontent.com/RoyaleAPI/cr-api-data/master/docs/json/cards.json"
IMG = "https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards/{key}.png"
WIDTH = 160  # reicht für die Erkennung, hält die APK klein

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "src", "main", "assets", "cards")
os.makedirs(out_dir, exist_ok=True)


def get(url: str) -> bytes:
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise
            print(f"retry {url}: {e}", file=sys.stderr)


cards = json.loads(get(DATA))


def fetch(c):
    img = Image.open(io.BytesIO(get(IMG.format(key=c["key"])))).convert("RGBA")
    h = round(img.height * WIDTH / img.width)
    img = img.resize((WIDTH, h), Image.LANCZOS)
    img.save(os.path.join(out_dir, c["key"] + ".png"), optimize=True)
    return {"key": c["key"], "name": c["name"], "elixir": c["elixir"], "type": c.get("type", "")}


with ThreadPoolExecutor(8) as ex:
    index = list(ex.map(fetch, cards))

with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=1)

print(f"{len(index)} Karten nach {os.path.normpath(out_dir)} geschrieben")
