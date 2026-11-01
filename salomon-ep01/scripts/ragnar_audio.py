"""Bande-son de l'intro ALPHA RAGNAR — 100 % synthèse (aucun son externe).

    python3 scripts/ragnar_audio.py  →  public/audio/alpha-ragnar.wav

Tambours de guerre (90 BPM), chœur sombre, souffle inversé, éclair (tonnerre +
sub + cor), enclume à chaque lettre, lame qui tranche, impact final.
Les instants reprennent src/alpha-ragnar/content.ts.
"""
import numpy as np

from build_audio import AUDIO, SR, add, bandpass, env_exp, highpass, lowpass, rng, saw, with_reverb, write

FPS = 30
BEAT = 20
DURATION = 450
T = dict(cracks=30, ring=60, words=[72, 100, 124], strike=150, letters=168, gap=6, sheen=246, slash=262, echo=345, final=390)
TITLE = ["ALPHA", "RAGNAR"]


def s(f: float) -> float:
    return f / FPS


def letter_frames() -> list[int]:
    out, i = [], 0
    for w, word in enumerate(TITLE):
        for _ in word:
            out.append(T["letters"] + i * T["gap"] + (12 if w else 0))
            i += 1
    return out


# ───────────── Instruments ─────────────

def taiko(pitch=1.0, length=1.4):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = (48 + 70 * np.exp(-t / 0.05)) * pitch
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.32)
    skin = bandpass(rng.standard_normal(n), 120, 900) * env_exp(n, 0.035) * 0.8
    slap = highpass(rng.standard_normal(n), 2000) * env_exp(n, 0.006) * 0.3
    return with_reverb(np.tanh((body + skin + slap) * 1.6), 0.28)


def heartbeat():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 38 + 30 * np.exp(-t / 0.04)
    return lowpass(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.14), 200) * 1.2


def choir(freqs, length, attack=1.5, release=1.5, bright=1.0):
    """Chœur « aaah » : dents de scie filtrées par les formants de la voyelle A."""
    n = int(length * SR)
    t = np.arange(n) / SR
    voice = np.zeros(n)
    for f in freqs:
        for det in (-0.006, -0.002, 0.003, 0.007):
            vib = 1 + 0.004 * np.sin(2 * np.pi * (5 + det * 100) * t)
            ph = np.cumsum(f * (1 + det) * vib) / SR
            voice += 2 * (ph % 1) - 1
    form = bandpass(voice, 600, 900) * 1.0 + bandpass(voice, 1000, 1300) * 0.6 * bright + bandpass(voice, 2300, 2800) * 0.25 * bright
    env = np.minimum(1, t / attack) * np.minimum(1, (length - t) / release)
    out = form * env / max(1, len(freqs) * 4) * 0.9
    return with_reverb(out, 0.5)


def horn(length=3.2, root=73.42):
    """Cor de guerre : cluster grave, attaque lente, filtre qui s'ouvre."""
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in (root, root * 1.5, root * 2):
        for det in (-0.004, 0, 0.005):
            x += saw(f * (1 + 0.003 * np.sin(2 * np.pi * 4.5 * 0)), n, det)
    out = np.zeros(n)
    steps = 16
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps
        fc = 350 + 1700 * min(1, k / 5) * (1 - 0.4 * k / steps)
        out[a:b] = lowpass(x[a:b], fc, 2)
    env = np.minimum(1, t / 0.18) * np.exp(-np.maximum(0, t - 1.2) / 1.0)
    return with_reverb(np.tanh(out * 0.35) * env * 0.8, 0.4)


def thunder(length=4.0):
    n = int(length * SR)
    rumble = lowpass(rng.standard_normal(n), 180, 4) * env_exp(n, 1.2) * 2.2
    crack = np.zeros(n)
    for _ in range(26):
        p = int(abs(rng.normal(0, 0.18)) * SR)
        d = int(rng.uniform(0.005, 0.03) * SR)
        if p + d < n:
            crack[p:p + d] += rng.standard_normal(d) * rng.uniform(0.3, 1)
    crack = bandpass(crack, 400, 6000) * 0.9
    return with_reverb(rumble + crack, 0.35)


def sub_drop(length=2.5):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 30 + 60 * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.9) * 1.2


def anvil(pitch=1.0):
    """Frappe métallique (partiels inharmoniques)."""
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for ratio, amp, dec in ((1, 1, 0.5), (2.76, 0.6, 0.35), (5.4, 0.4, 0.2), (8.93, 0.25, 0.12)):
        x += np.sin(2 * np.pi * 620 * pitch * ratio * t) * amp * env_exp(n, dec)
    hit = highpass(rng.standard_normal(n), 3000) * env_exp(n, 0.004) * 0.6
    low = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t / 0.03)) / SR) * env_exp(n, 0.12) * 0.7
    return with_reverb((x * 0.35 + hit + low), 0.3)


def reverse_swell(length):
    n = int(length * SR)
    noise = highpass(rng.standard_normal(n), 1500)
    shimmer = with_reverb(noise * env_exp(n, 0.25), 0.8)[:n, 0]
    return shimmer[::-1] * np.linspace(0, 1, n) ** 3 * 1.5


def shing():
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    sweep = np.zeros(n)
    m = int(0.22 * SR)
    noise = rng.standard_normal(m)
    for k in range(12):
        a, b = k * m // 12, (k + 1) * m // 12
        fc = 1800 * (4.5 ** (k / 12))
        sweep[a:b] = bandpass(noise[a:b], fc * 0.7, min(fc * 1.4, 20000))
    sweep[:m] *= np.linspace(0.2, 1, m)
    ring = (np.sin(2 * np.pi * 3150 * t) + 0.7 * np.sin(2 * np.pi * 4720 * t) + 0.4 * np.sin(2 * np.pi * 6310 * t)) * env_exp(n, 0.45) * 0.18
    ring[: int(0.12 * SR)] = 0
    return with_reverb(sweep * 0.8 + ring, 0.35)


def crackle(length):
    n = int(length * SR)
    x = np.zeros(n)
    for _ in range(int(length * 18)):
        p = int(rng.uniform(0, n - 400))
        d = int(rng.uniform(40, 300))
        x[p:p + d] += rng.standard_normal(d) * rng.uniform(0.1, 0.6) * env_exp(d, 0.002)
    return highpass(x, 800) * 0.25


def sparkle():
    out = np.zeros(int(2.5 * SR))
    for i, f in enumerate((1760, 2093, 2637, 3136, 3520)):
        n = int(0.8 * SR)
        tone = np.sin(2 * np.pi * f * np.arange(n) / SR) * env_exp(n, 0.25) * 0.08
        start = int(i * 0.05 * SR)
        out[start:start + n] += tone
    return with_reverb(out, 0.6)


# ───────────── Composition ─────────────

def main() -> None:
    end = s(DURATION)
    n = int((end + 3.0) * SR)
    mus = np.zeros((n, 2))
    fx = np.zeros((n, 2))
    t = np.arange(n) / SR

    # Drone grave (gorge) + feu qui crépite
    drone = lowpass(saw(36.71, n) + 0.6 * saw(36.71 * 1.498, n, 0.002), 140) * 0.3
    add(mus, drone * np.minimum(1, t / 2.5) * np.clip((end + 1.5 - t) / 2, 0, 1), 0)
    add(fx, crackle(end), 0, 0.8)

    # Cœur dans le noir
    for f in (6, 18):
        add(fx, heartbeat(), s(f), 0.9)

    # Chœur qui monte jusqu'à l'éclair (ré mineur), puis s'élève
    add(mus, choir([146.83, 174.61, 220.0], s(T["strike"] - 20), attack=3.0, release=0.4, bright=0.7), s(20), 0.9)
    add(mus, choir([146.83, 220.0, 293.66, 349.23], end - s(T["strike"]) + 1.5, attack=0.4, release=2.0), s(T["strike"]), 1.0)

    # Tambours qui accélèrent
    roll = [T["ring"], T["ring"] + 20, T["ring"] + 40, T["ring"] + 50, T["ring"] + 60, T["ring"] + 70,
            T["ring"] + 75, T["ring"] + 80, T["ring"] + 84, T["ring"] + 87]
    for i, f in enumerate(roll):
        add(mus, taiko(1.0 + 0.08 * (i % 2), 1.2), s(f), 0.55 + 0.04 * i, pan=(-0.3 if i % 2 else 0.3))
    for w in T["words"]:
        add(fx, sparkle(), s(w), 0.25, pan=0.2)

    # Souffle inversé → ÉCLAIR
    add(fx, reverse_swell(s(40)), s(T["strike"] - 40), 0.5)
    strike = s(T["strike"])
    add(fx, thunder(), strike, 1.0)
    add(fx, sub_drop(), strike, 1.0)
    add(mus, taiko(0.8, 2.0), strike, 1.0)
    add(mus, horn(3.4), strike + 0.05, 0.9)

    # Enclume : une frappe par lettre (impact 6 images après l'apparition)
    for i, f in enumerate(letter_frames()):
        add(fx, anvil(1.0 + 0.04 * (i % 3) - 0.06 * (i >= 5)), s(f + 6), 0.55, pan=-0.5 + i / 10)
    add(mus, taiko(1.0, 1.4), s(T["letters"] + 6), 0.7)
    add(mus, taiko(0.9, 1.4), s(T["letters"] + 5 * T["gap"] + 12 + 6), 0.8)

    # Reflet + lame
    add(fx, sparkle(), s(T["sheen"]), 0.5)
    add(fx, shing(), s(T["slash"] - 3), 0.9, pan=0.3)

    # Rythme de guerre jusqu'à l'impact final
    groove = [300, 320, 330, 340, 350, 360, 365, 370, 375, 380, 384, 387]
    for i, f in enumerate(groove):
        add(mus, taiko(1.05 if i % 2 else 0.95, 1.0), s(f), 0.5 + 0.03 * i, pan=(0.25 if i % 2 else -0.25))
    add(fx, thunder(3.0), s(T["echo"]), 0.35, pan=0.6)

    # Impact final + queue
    final = s(T["final"])
    add(fx, reverse_swell(1.0), final - 1.0, 0.45)
    add(fx, sub_drop(3.0), final, 1.0)
    add(mus, taiko(0.75, 2.5), final, 1.0)
    add(mus, horn(3.0, 73.42), final, 0.8)
    add(fx, highpass(rng.standard_normal(int(3 * SR)), 3000) * env_exp(int(3 * SR), 0.9) * 0.25, final, 1.0)

    out = mus * 0.6 + fx * 0.75
    out *= np.clip((end + 1.0 - t) / 1.8, 0, 1)[:, None]
    write(AUDIO / "alpha-ragnar.wav", out, -1.0)
    print(f"public/audio/alpha-ragnar.wav — {end:.1f} s")


if __name__ == "__main__":
    main()
