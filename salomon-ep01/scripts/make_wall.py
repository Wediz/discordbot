"""Fond « lieu abandonné » généré (aucune image externe) : mur de béton banché,
salissures, coulures d'humidité, fissures, trous de banche.

    python3 scripts/make_wall.py   →  public/assets/urbex/wall.jpg (2400×1350)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
W, H = 2400, 1350
rng = np.random.default_rng(11)


def noise(scale: int, octaves: int = 5, persistence: float = 0.55) -> np.ndarray:
    """Bruit fractal (somme de bruits lissés à plusieurs échelles), 0..1."""
    out = np.zeros((H, W), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        s = max(2, scale >> o)
        small = rng.random((H // s + 2, W // s + 2)).astype(np.float32)
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((W + 2 * s, H + 2 * s), Image.BICUBIC)
        out += amp * (np.asarray(img, np.float32)[s:s + H, s:s + W] / 255)
        total += amp
        amp *= persistence
    out /= total
    return (out - out.min()) / (out.max() - out.min())


def blur(a: np.ndarray, r: float) -> np.ndarray:
    img = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(img, np.float32) / 255


def main() -> None:
    base = noise(256)  # grandes variations
    grain = noise(8, 3)  # grain du béton
    pores = (rng.random((H, W)) > 0.995).astype(np.float32)
    pores = blur(pores, 1.2) * 3

    # Taches sombres (humidité, moisissure) et coulures verticales
    stains = np.clip((noise(320, 4) - 0.55) * 3, 0, 1)
    streak_src = np.zeros((H, W), np.float32)
    for _ in range(70):
        x = rng.integers(0, W)
        y0 = rng.integers(0, H // 3)
        length = rng.integers(H // 4, H)
        streak_src[y0:y0 + length, x:x + rng.integers(2, 10)] = rng.uniform(0.3, 1)
    streaks = Image.fromarray((streak_src * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(6))
    streaks = np.asarray(streaks.filter(ImageFilter.GaussianBlur(4)), np.float32) / 255
    fade = np.linspace(1, 0.2, H)[:, None]
    streaks *= fade

    # Joints de banche horizontaux + trous de banche
    seams = np.zeros((H, W), np.float32)
    holes = np.zeros((H, W), np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    for y in range(160, H, 340):
        seams[y:y + 3, :] = 1
        for x in range(150, W, 300):
            jx, jy = x + rng.integers(-6, 6), y + 170 + rng.integers(-4, 4)
            r = rng.uniform(9, 13)
            holes += np.clip(r - np.hypot(xx - jx, yy - jy), 0, 1)
    seams = blur(seams, 1.5)
    holes = blur(np.clip(holes, 0, 1), 1.0)

    # Fissures (marches aléatoires)
    cracks = np.zeros((H, W), np.float32)
    for _ in range(9):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        ang = rng.uniform(0, np.pi * 2)
        for _ in range(rng.integers(300, 900)):
            ang += rng.normal(0, 0.12)
            x += np.cos(ang) * 2.2
            y += np.sin(ang) * 2.2
            if 1 <= x < W - 1 and 1 <= y < H - 1:
                cracks[int(y), int(x)] = 1
                if rng.random() < 0.004:  # embranchement
                    ang += rng.choice([-1, 1]) * rng.uniform(0.4, 0.8)
    cracks_dark = blur(cracks, 0.7) * 1.6
    cracks_light = np.roll(blur(cracks, 0.9), 2, axis=0) * 0.5

    lum = 0.26 + 0.20 * base + 0.12 * grain
    lum -= 0.22 * stains + 0.20 * streaks + 0.10 * seams + 0.22 * holes + 0.25 * np.clip(cracks_dark, 0, 1)
    lum += 0.05 * np.clip(cracks_light, 0, 1) - 0.08 * pores
    lum = np.clip(lum, 0, 1)

    # Teinte : béton gris légèrement chaud, salissures brun-vert
    rgb = np.stack([lum * 1.02, lum * 0.98, lum * 0.92], axis=2)
    rust = np.clip((noise(180, 4) - 0.62) * 4, 0, 1) * streaks.clip(0, 1) ** 0.5
    rgb[..., 0] += rust * 0.10
    rgb[..., 1] += rust * 0.03
    rgb[..., 2] -= rust * 0.04
    rgb = np.clip(rgb, 0, 1)

    out = ROOT / "public" / "assets" / "urbex" / "wall.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray((rgb * 255).astype(np.uint8)).save(out, quality=90, optimize=True)
    print(out.relative_to(ROOT), f"{W}x{H}")


if __name__ == "__main__":
    main()
