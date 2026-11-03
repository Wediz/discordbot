"""Musique + bruitages de la vidéo INNA SHOP Fidélité & Parrainage (100 % synthèse).

    python3 scripts/inna_audio.py  →  public/audio/inna-fidelite.wav

Pop douce à 120 BPM en fa majeur (F – C – Dm – Bb), clochettes, claps,
bruitages « girly » calés sur src/inna/content.ts.
"""
import numpy as np

from build_audio import AUDIO, SR, add, bandpass, env_exp, highpass, kick, lowpass, rng, with_reverb, write

FPS = 30
BEAT = 15
DURATION = 600
S = dict(intro=0, earn=90, redeem=210, referral=300, cta=510)
SLOW = 2  # même valeur que SLOW dans src/inna/content.ts


def s(f: float) -> float:
    return f * SLOW / FPS


def note(name: str) -> float:
    names = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[pitch] + 12 * (octave + 1) - 69) / 12)


CHORDS = [  # (basse, notes)
    ("F2", ["F4", "A4", "C5", "E5"]),
    ("C3", ["E4", "G4", "C5", "D5"]),
    ("D3", ["D4", "F4", "A4", "C5"]),
    ("Bb2", ["D4", "F4", "Bb4", "C5"]),
]


def pluck(freq, length=0.35, bright=1.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.35 * bright * np.sin(2 * np.pi * 2 * freq * t) + 0.12 * bright * np.sin(2 * np.pi * 3 * freq * t)
    return x * env_exp(n, 0.12) * np.minimum(1, t / 0.003) * 0.3


def bell(freq, length=1.4):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * env_exp(n, d) for r, a, d in ((1, 1, 0.6), (2.4, 0.4, 0.3), (3.9, 0.2, 0.15)))
    return x * 0.18


def pad(freqs, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in freqs:
        for det in (-0.003, 0.004):
            x += np.sin(2 * np.pi * f * (1 + det) * t) + 0.3 * np.sin(2 * np.pi * 2 * f * (1 + det) * t)
    env = np.minimum(1, t / 0.4) * np.minimum(1, (length - t) / 0.4)
    return lowpass(x, 2500) * env * 0.05


def bass(freq, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * 2 * freq * t)
    return x * np.minimum(1, t / 0.01) * env_exp(n, 0.35) * 0.45


def clap():
    n = int(0.3 * SR)
    x = np.zeros(n)
    for k, off in enumerate((0, 0.011, 0.022)):
        a = int(off * SR)
        m = n - a
        x[a:] += bandpass(rng.standard_normal(m), 900, 3500) * env_exp(m, 0.012 if k < 2 else 0.09)
    return with_reverb(x * 0.35, 0.25)


def shaker():
    n = int(0.08 * SR)
    return highpass(rng.standard_normal(n), 6000) * env_exp(n, 0.02) * 0.08


def pop(pitch=1.0):
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    f = 500 * pitch * (1 + 2.5 * t / 0.16)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.04) * 0.5


def ding():
    out = np.zeros(int(1.5 * SR))
    for i, f in enumerate((1318.5, 1975.5)):
        b = bell(f, 1.2)
        st = int(i * 0.07 * SR)
        out[st:st + len(b)] += b * 1.4
    return with_reverb(out, 0.35)


def swish(length=0.35):
    n = int(length * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    for k in range(10):
        a, b = k * n // 10, (k + 1) * n // 10
        fc = 900 * (6 ** (k / 10))
        out[a:b] = bandpass(noise[a:b], fc * 0.7, min(fc * 1.4, 18000))
    return out * np.sin(np.linspace(0, np.pi, n)) * 0.35


def glide(length=0.9):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 600 * 2 ** (1.2 * t / length)
    return with_reverb(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / length) * 0.12, 0.4)


def glitter(length=1.2, density=40):
    out = np.zeros(int((length + 1) * SR))
    for i in range(int(length * density)):
        f = rng.choice([2093, 2349, 2637, 3136, 3520, 4186])
        b = bell(f, 0.5) * rng.uniform(0.3, 0.8)
        st = int(rng.uniform(0, length) * SR)
        out[st:st + len(b)] += b[: len(out) - st]
    return with_reverb(out * 0.5, 0.5)


def success():
    out = np.zeros(int(2 * SR))
    for i, n in enumerate(("F5", "A5", "C6", "F6")):
        b = bell(note(n), 1.2)
        st = int(i * 0.06 * SR)
        out[st:st + len(b)] += b * 1.3
    return with_reverb(out, 0.4)


def confetti_pop():
    n = int(0.25 * SR)
    burst = bandpass(rng.standard_normal(n), 1500, 7000) * env_exp(n, 0.03) * 0.5
    return burst


def main() -> None:
    end = s(DURATION)
    n = int((end + 2.5) * SR)
    mus = np.zeros((n, 2))
    fx = np.zeros((n, 2))
    beat = 0.5

    # Pad + arpège dès le début, groove complet à partir de « Gagne des points »
    bars = int(end / 2) + 1
    for b in range(bars):
        t0 = b * 2.0
        root, chord = CHORDS[b % 4]
        add(mus, pad([note(x) for x in chord], 2.2), t0, 1.0)
        full = t0 >= s(S["earn"]) - 0.01
        bright = t0 >= s(S["referral"]) - 0.01
        for k in range(8):  # arpège en croches
            f = note(chord[k % 4]) * (2 if bright and k % 2 else 1)
            add(mus, pluck(f, bright=1.2 if bright else 0.8), t0 + k * 0.25, 0.9 if full else 0.6, pan=-0.3 + 0.6 * (k % 2))
        if full:
            for k in range(4):
                tb = t0 + k * beat
                add(mus, kick(0.5), tb, 0.55)
                if k % 2 == 1:
                    add(mus, clap(), tb, 0.8)
                add(mus, bass(note(root), 0.45), tb, 0.8)
                for j in range(2):
                    add(mus, shaker(), tb + j * 0.25 + 0.125, 1.0, pan=0.35)

    # Bruitages
    add(fx, glitter(1.4), s(2), 0.8)
    add(fx, glide(1.0), s(20), 0.8)
    add(fx, pop(1.3), s(44), 0.6)
    for at in (S["earn"], S["redeem"], S["cta"]):
        add(fx, swish(), s(at) - 0.12, 0.7)
    add(fx, ding(), s(S["earn"] + 30), 0.9)
    for i in range(4):
        add(fx, pop(1 + 0.15 * i), s(S["earn"] + 36 + i * 8), 0.8, pan=-0.4 + 0.27 * i)
    for i, at in enumerate((18, 30)):
        add(fx, swish(0.3), s(S["redeem"] + at) - 0.05, 0.6, pan=(-0.5 if i == 0 else 0.5))
        add(fx, ding(), s(S["redeem"] + at + 6), 0.45)
    # Parrainage
    add(fx, glitter(1.5, 50), s(S["referral"]) - 0.6, 0.9)
    add(fx, glide(0.8), s(S["referral"] + 10), 0.7)
    add(fx, pop(0.9), s(S["referral"] + 40), 0.6, pan=-0.4)
    add(fx, pop(1.1), s(S["referral"] + 48), 0.6, pan=0.4)
    add(fx, highpass(rng.standard_normal(int(0.03 * SR)), 2000) * env_exp(int(0.03 * SR), 0.005) * 0.5, s(S["referral"] + 82), 1.0)
    add(fx, success(), s(S["referral"] + 82), 0.8)
    add(fx, glide(0.9), s(S["referral"] + 92), 1.0)
    add(fx, confetti_pop(), s(S["referral"] + 128), 1.0)
    add(fx, glitter(1.6, 60), s(S["referral"] + 128), 1.0)
    add(fx, pop(1.2), s(S["referral"] + 126), 0.8, pan=-0.3)
    add(fx, pop(1.4), s(S["referral"] + 136), 0.8, pan=0.3)
    # Appel à l'action
    add(fx, highpass(rng.standard_normal(int(0.03 * SR)), 2000) * env_exp(int(0.03 * SR), 0.005) * 0.5, s(S["cta"] + 52), 1.0)
    add(fx, success(), s(S["cta"] + 52), 1.0)
    add(fx, confetti_pop(), s(S["cta"] + 52), 0.9)
    add(fx, glitter(1.8, 50), s(S["cta"] + 60), 0.9)

    out = mus * 0.7 + fx * 0.8
    t = np.arange(n) / SR
    out *= np.clip((end + 0.6 - t) / 1.2, 0, 1)[:, None]
    write(AUDIO / "inna-fidelite.wav", out, -1.0)
    print(f"public/audio/inna-fidelite.wav — {end:.1f} s")


if __name__ == "__main__":
    main()
