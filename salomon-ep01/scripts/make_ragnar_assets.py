"""Éléments générés pour l'intro ALPHA RAGNAR (aucune image externe).

    python3 scripts/make_ragnar_assets.py
→ public/assets/ragnar/smoke.jpg   texture de fumée (niveaux de gris, mode « screen »)
→ src/alpha-ragnar/cracks.json     fissures de lave qui partent du centre de l'emblème
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


if __name__ == "__main__":
    smoke()
    cracks()
