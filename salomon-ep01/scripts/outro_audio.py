"""Bande-son de l'outro / écran de fin YouTube (musique + bruitages, synthèse).

    python3 scripts/outro_audio.py   →  public/audio/outro-urbex.wav
"""
import numpy as np

from build_audio import AUDIO, SR, add, bass_note, blip, env_exp, hat, impact, kick, pad_chord, riser, snare, whoosh, with_reverb, write
from intro_audio import click, crackle

FPS = 30
DURATION = 450
CLICK = 78


def s(frames: float) -> float:
    return frames / FPS


def ding():
    """Cloche de notification (deux notes métalliques)."""
    out = np.zeros(int(1.6 * SR))
    for i, f in enumerate((1318.5, 1760.0)):
        n = int(1.2 * SR)
        t = np.arange(n) / SR
        tone = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * env_exp(n, 0.35) * 0.25
        start = int(i * 0.12 * SR)
        out[start:start + n] += tone[: len(out) - start]
    return with_reverb(out, 0.35)


def main() -> None:
    end = s(DURATION)
    n = int((end + 2.5) * SR)
    music = np.zeros((n, 2))
    fx = np.zeros((n, 2))
    beat = 60 / 100
    t = np.arange(n) / SR

    # Groove posé (même univers que l'intro), en ré mineur
    chords = [(73.42, [146.83, 174.61, 220.0]), (58.27, [116.54, 146.83, 174.61]),
              (49.0, [98.0, 116.54, 146.83]), (55.0, [110.0, 138.59, 164.81])]
    tt, i = s(12), 0
    while tt < end - 0.01:
        root, chord = chords[(i // 4) % 4]
        if i % 4 == 0:
            add(music, pad_chord(chord, beat * 4 + 0.6), tt, 0.55)
        add(music, kick(0.8 if i % 2 == 0 else 0.55), tt)
        if i % 4 == 2:
            add(music, with_reverb(snare(), 0.25), tt, 0.55)
        add(music, hat(), tt + beat / 2, 0.8, pan=0.3)
        add(music, bass_note(root, beat / 2), tt, 0.7)
        tt += beat
        i += 1

    # Bruitages
    add(fx, crackle(0.5), 0, 0.5)
    add(fx, impact(0.9), s(18), 0.9)
    add(fx, whoosh(0.35), s(34) - 0.2, 0.4, pan=0.5)
    add(fx, whoosh(0.35), s(42) - 0.2, 0.4, pan=0.5)
    add(fx, blip(1500, 0.08, 0.3), s(30))
    add(fx, click(), s(CLICK), 1.0)
    add(fx, ding(), s(CLICK + 4), 1.0)
    add(fx, blip(2000, 0.06, 0.25), s(CLICK + 30))
    add(fx, riser(1.5, 300, 5000), end - 2.0, 0.25)

    out = music * 0.5 + fx * 0.8
    out *= np.clip((end + 0.4 - t) / 1.6, 0, 1)[:, None]
    write(AUDIO / "outro-urbex.wav", out, -1.5)
    print(f"public/audio/outro-urbex.wav — {end:.1f} s")


if __name__ == "__main__":
    main()
