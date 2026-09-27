"""
Freisteller-Pipeline für Wesen (Asset-Pilot, Auftrag §15).

Eingabe:  legacy/v22/assets/battle-*.webp (KI-Konzeptbilder mit Hintergrund)
Ausgabe:  apps/game/public/assets/creatures/<name>.png (RGBA, auf Alpha-Bounding-Box beschnitten,
          Bodenlinie = unterer Bildrand, Höhe normiert auf 512 px)

Aufruf:   python scripts/cutout.py            (alle)
          python scripts/cutout.py pyro       (einzeln)

Benötigt: pip install rembg[cpu] pillow  (Modell isnet-general-use wird beim ersten Lauf geladen)

Grenzen: Automatische Masken sind ein Startpunkt. Für Produktions-Rigs (Spine/Cutout) werden
Freisteller manuell nachgearbeitet und in Körperteile zerlegt; siehe docs/ASSET_PIPELINE.md.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "legacy" / "v22" / "assets"
OUT = ROOT / "apps" / "game" / "public" / "assets" / "creatures"
TARGET_HEIGHT = 512

MAPPING = {
    "lumi": "battle-lumi.webp",
    "pyro": "battle-pyro.webp",
    "terra": "battle-terra.webp",
    "nivaro": "battle-nivaro.webp",
    "enemy-rush": "battle-enemy-rush.webp",
    "enemy-flicker": "battle-enemy-flicker.webp",
    "enemy-brute": "battle-enemy-brute.webp",
}


def cutout(name: str, session) -> None:
    src = SRC / MAPPING[name]
    image = Image.open(src).convert("RGBA")
    result = remove(image, session=session, alpha_matting=False)
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)
    scale = TARGET_HEIGHT / result.height
    if scale < 1:
        result = result.resize((round(result.width * scale), TARGET_HEIGHT), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{name}.png"
    result.save(target, optimize=True)
    print(f"{name}: {image.size} -> {result.size} -> {target.relative_to(ROOT)}")


def main(argv: list[str]) -> int:
    names = argv or list(MAPPING)
    unknown = [n for n in names if n not in MAPPING]
    if unknown:
        print(f"Unbekannt: {', '.join(unknown)}. Bekannt: {', '.join(MAPPING)}")
        return 1
    session = new_session("isnet-general-use")
    for name in names:
        cutout(name, session)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
