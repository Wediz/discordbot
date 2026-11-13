"""Sons de l'animation « J'aime / Abonne-toi / Cloche » (synthèse).

    python3 scripts/subscribe_audio.py  →  public/audio/abonne.wav
"""
import numpy as np

from build_audio import AUDIO, SR, add, env_exp, highpass, rng, write
from inna_audio import ding, pop, success, swish

FPS = 30
LIKE, SUB, BELL, OUT, DURATION = 52, 92, 132, 186, 210


def s(f):
    return f / FPS


def click():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return (highpass(rng.standard_normal(n), 2500) * env_exp(n, 0.004) * 0.6 + np.sin(2 * np.pi * 1800 * t) * env_exp(n, 0.006) * 0.25)


def main():
    end = s(DURATION)
    out = np.zeros((int((end + 1.5) * SR), 2))
    add(out, swish(0.35), s(0), 0.8, pan=-0.6)
    for at in (LIKE, SUB, BELL):
        add(out, click(), s(at) - 0.02, 1.0)
    add(out, pop(1.2), s(LIKE), 1.0)
    add(out, success(), s(SUB), 0.9)
    add(out, ding(), s(BELL), 1.0)
    add(out, ding(), s(BELL) + 0.25, 0.7)
    add(out, swish(0.3), s(OUT), 0.6, pan=-0.6)
    write(AUDIO / "abonne.wav", out, -1.0)
    print("public/audio/abonne.wav")


if __name__ == "__main__":
    main()
