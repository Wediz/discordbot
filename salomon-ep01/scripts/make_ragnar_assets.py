"""Éléments générés pour l'intro ALPHA RAGNAR (aucune image externe).

    python3 scripts/make_ragnar_assets.py
→ public/assets/ragnar/smoke.jpg   texture de fumée (niveaux de gris, mode « screen »)
→ src/alpha-ragnar/cracks.json     fissures de lave qui partent du centre de l'emblème
→ public/assets/ragnar/personnage.jpg + personnage-matte.png
   photo fournie (public/assets/ragnar/source/personnage.*) et sa silhouette pleine,
   qui masque le décor derrière lui (la photo n'est pas modifiée).
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(1337)


def smoke(w=1600, h=900) -> None:
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(6):
        s = max(2, 320 >> o)
        small = rng.random((h // s + 3, w // s + 3)).astype(np.float32)
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((w + 3 * s, h + 3 * s), Image.BICUBIC)
        out += amp * np.asarray(img, np.float32)[s:s + h, s:s + w] / 255
        total += amp
        amp *= 0.55
    out /= total
    out = np.clip((out - 0.42) * 2.6, 0, 1) ** 1.6  # volutes contrastées
    img = Image.fromarray((out * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
    img.save(ROOT / "public" / "assets" / "ragnar" / "smoke.jpg", quality=88)


def cracks(cx=960, cy=400) -> None:
    """Marches aléatoires ramifiées ; chaque point garde sa distance au centre (pour l'animation)."""
    paths = []

    def walk(x, y, ang, length, dist, depth):
        pts = [(x, y, dist)]
        for _ in range(length):
            ang += rng.normal(0, 0.28)
            step = rng.uniform(9, 16)
            x += math.cos(ang) * step
            y += math.sin(ang) * step
            dist += step
            pts.append((round(x, 1), round(y, 1), round(dist, 1)))
            if not (-50 < x < 1970 and -50 < y < 1130):
                break
            if depth < 3 and rng.random() < 0.06:
                walk(x, y, ang + rng.choice([-1, 1]) * rng.uniform(0.5, 1.1), int(length * 0.55), dist, depth + 1)
        paths.append({"d": depth, "pts": pts})

    for i in range(11):
        ang = i / 11 * math.tau + rng.uniform(-0.2, 0.2)
        r0 = 270  # part du bord de l'anneau de runes
        walk(cx + math.cos(ang) * r0, cy + math.sin(ang) * r0, ang, int(rng.integers(45, 90)), r0, 0)
    (ROOT / "src" / "alpha-ragnar" / "cracks.json").write_text(json.dumps(paths), encoding="utf-8")
    print(len(paths), "fissures")


def character() -> None:
    srcs = sorted((ROOT / "public" / "assets" / "ragnar" / "source").glob("personnage.*"))
    if not srcs:
        print("Pas de photo de personnage (optionnel)")
        return
    im = Image.open(srcs[0]).convert("RGB").resize((1920, 1080), Image.LANCZOS)
    im.save(ROOT / "public" / "assets" / "ragnar" / "personnage.jpg", quality=92)
    lum = np.asarray(im).astype(np.int16).max(axis=2)
    mask = Image.fromarray(((lum > 4) * 255).astype(np.uint8))
    # Fermeture morphologique : bouche les zones très sombres de la veste
    mask = mask.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.MaxFilter(31))
    mask = mask.filter(ImageFilter.MinFilter(31)).filter(ImageFilter.MinFilter(25))
    # Remplit les trous : tout ce qui n'est pas relié au bord devient silhouette
    arr = np.asarray(mask) > 127
    h, w = arr.shape
    outside = np.zeros_like(arr)
    stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if outside[y, x] or arr[y, x]:
            continue
        outside[y, x] = True
        if y > 0: stack.append((y - 1, x))
        if y < h - 1: stack.append((y + 1, x))
        if x > 0: stack.append((y, x - 1))
        if x < w - 1: stack.append((y, x + 1))
    matte = Image.fromarray(((~outside) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(8))
    black = Image.new("RGBA", (1920, 1080), (0, 0, 0, 255))
    black.putalpha(matte)
    black.save(ROOT / "public" / "assets" / "ragnar" / "personnage-matte.png", optimize=True)
    print("personnage.jpg + personnage-matte.png")


if __name__ == "__main__":
    smoke()
    cracks()
    character()
