"""Prépare les visuels à partir des fichiers fournis dans public/assets/source.

Aucun visuel n'est inventé : uniquement des recadrages, un détourage du fond
uni des photos produit et une extraction du logo par sa luminosité.

Lancer :  python3 scripts/prepare_assets.py
"""
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "source"
OUT = ROOT / "public" / "assets"


def save(img: Image.Image, name: str) -> None:
    img.save(OUT / name, optimize=True)
    print(f"{name:28s} {img.size[0]}x{img.size[1]}")


def logo() -> None:
    """Logo URBEX FRANCE extrait du visuel fourni (texte clair sur fond sombre)."""
    poster = Image.open(SRC / "poster-hero.png").convert("RGB")
    crop = poster.crop((190, 50, 865, 262))
    arr = np.asarray(crop).astype(np.float32) / 255.0
    lum = arr.max(axis=2)
    # Clé de luminance : le fond (< 0.30) devient transparent, le logo reste.
    alpha = np.clip((lum - 0.30) / 0.30, 0, 1) ** 1.2
    rgb = np.clip(arr * 1.08, 0, 1)
    rgba = np.dstack([rgb, alpha])
    img = Image.fromarray((rgba * 255).astype(np.uint8), "RGBA")
    save(img, "logo-urbex-france.png")


def cutout(src: str, name: str, threshold: int) -> None:
    """Retire le fond clair relié aux bords (la chaussure, noire, reste intacte)."""
    im = Image.open(SRC / src).convert("RGB")
    w, h = im.size
    arr = np.asarray(im).astype(np.int16)
    light = arr.min(axis=2) >= threshold

    # Remplissage depuis les bords : seul le fond connecté est retiré.
    bg = np.zeros_like(light)
    stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    stack += [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if bg[y, x] or not light[y, x]:
            continue
        bg[y, x] = True
        if y > 0:
            stack.append((y - 1, x))
        if y < h - 1:
            stack.append((y + 1, x))
        if x > 0:
            stack.append((y, x - 1))
        if x < w - 1:
            stack.append((y, x + 1))

    # Trous de fond enfermés (ex. intérieur de la boucle du talon) : zones
    # claires de plus de 300 px non reliées aux bords.
    seen = bg.copy()
    for sy, sx in zip(*np.nonzero(light & ~bg)):
        if seen[sy, sx]:
            continue
        comp, todo = [], [(sy, sx)]
        while todo:
            y, x = todo.pop()
            if seen[y, x] or not light[y, x]:
                continue
            seen[y, x] = True
            comp.append((y, x))
            todo += [(y + dy, x + dx) for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))
                     if 0 <= y + dy < h and 0 <= x + dx < w]
        if len(comp) > 300:
            ys, xs = zip(*comp)
            bg[list(ys), list(xs)] = True

    mask = Image.fromarray(((~bg) * 255).astype(np.uint8))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = im.convert("RGBA")
    rgba.putalpha(mask)
    bbox = mask.point(lambda v: 255 if v > 8 else 0).getbbox()
    rgba = rgba.crop(bbox)
    # Agrandissement x2 doux pour l'affichage plein cadre.
    rgba = rgba.resize((rgba.width * 2, rgba.height * 2), Image.LANCZOS)
    rgba = rgba.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    save(rgba, name)


def hero() -> None:
    """Scène de la chaussure dans le lieu abandonné, sans les textes du visuel."""
    poster = Image.open(SRC / "poster-hero.png").convert("RGB")
    crop = poster.crop((0, 395, 1024, 1190))
    save(crop, "hero-scene.jpg")
    # Plaque d'ambiance floue pour les fonds.
    plate = poster.crop((0, 300, 1024, 1300)).filter(ImageFilter.GaussianBlur(28))
    plate = ImageOps.autocontrast(plate, cutoff=1)
    save(plate, "ambience-blur.jpg")


if __name__ == "__main__":
    logo()
    cutout("shoe-side.webp", "shoe-side-cut.png", 238)
    cutout("shoe-34-white.webp", "shoe-34-cut.png", 238)
    hero()
