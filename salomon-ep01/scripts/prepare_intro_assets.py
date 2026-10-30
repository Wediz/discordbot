"""Prépare les visuels de l'intro Urbex-France.com.

    python3 scripts/prepare_intro_assets.py

- Fond « lieu abandonné » : voir scripts/make_wall.py (généré, aucune photo).
- Logo officiel (badge rond) : déposer le fichier fourni dans
  public/assets/brand/source/logo-urbex-fr.png. Le fond blanc autour du
  cercle est retiré (masque circulaire), le badge lui-même n'est pas modifié.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public" / "assets" / "brand"


def logo() -> None:
    src = BRAND / "source" / "logo-urbex-fr.png"
    if not src.exists():
        print("Logo absent :", src.relative_to(ROOT), "(à déposer)")
        return
    im = Image.open(src).convert("RGB")
    arr = np.asarray(im).astype(np.int16)
    # Zone non blanche = le badge.
    ys, xs = np.nonzero(arr.min(axis=2) < 200)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    r = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 + 2
    # Masque circulaire anti-aliasé (rendu x4 puis réduit).
    k = 4
    mask = Image.new("L", (im.width * k, im.height * k), 0)
    ImageDraw.Draw(mask).ellipse(((cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k), fill=255)
    mask = mask.resize(im.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    rgba = im.convert("RGBA")
    rgba.putalpha(mask)
    box = (int(cx - r), int(cy - r), int(cx + r), int(cy + r))
    rgba = rgba.crop(box)
    BRAND.mkdir(parents=True, exist_ok=True)
    rgba.save(BRAND / "logo-urbex-fr.png", optimize=True)
    print("brand/logo-urbex-fr.png", rgba.size)


if __name__ == "__main__":
    logo()
