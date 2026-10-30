"""Bande-son de l'intro Urbex-France.com (musique + bruitages, 100 % synthèse).

    python3 scripts/intro_audio.py   →  public/audio/intro-urbex.wav

Le découpage reprend src/intro-urbex/content.ts (1 temps = 18 images, 100 BPM).
"""
import numpy as np

from build_audio import (
    AUDIO, SR, add, bandpass, bass_note, blip, env_exp, glitch, hat, highpass, impact, kick,
    lowpass, pad_chord, rng, riser, saw, shimmer, snare, whoosh, with_reverb, write,
)

FPS = 30
BEAT = 18
N_DANGERS, N_RULES = 4, 3
T_DANGERS = 6 * BEAT
T_RULES = T_DANGERS + N_DANGERS * 2 * BEAT
T_BLACK = T_RULES + N_RULES * 2 * BEAT
T_LOGO = T_BLACK + 2 * BEAT
T_BRAND = T_LOGO + 4 * BEAT
T_END = T_BRAND + 10 * BEAT
CTA = T_END - 3 * BEAT


def s(frames: float) -> float:
    return frames / FPS


def braam(length=2.2, root=36.71):
    """Gros accord grave de bande-annonce (cuivres saturés approchés)."""
    n = int(length * SR)
    x = np.zeros(n)
    for f in (root, root * 2, root * 3, root * 2 * 1.189):  # ré, ré, la, fa (mineur)
        for det in (-0.006, 0, 0.007):
            x += saw(f, n, det)
    x = lowpass(np.tanh(x * 0.5), 700, 2)
    att = np.minimum(1, np.arange(n) / (0.03 * SR))
    return with_reverb(x * att * env_exp(n, 0.9) * 0.4, 0.35)


def crackle(length):
    """Grésillement électrique (néon / lampe qui hésite)."""
    n = int(length * SR)
    x = np.zeros(n)
    for _ in range(int(length * 30)):
        p = int(rng.uniform(0, n - 2000))
        d = int(rng.uniform(80, 1500))
        x[p:p + d] += rng.standard_normal(d) * rng.uniform(0.2, 1)
    buzz = np.sign(np.sin(2 * np.pi * 100 * np.arange(n) / SR)) * 0.08
    return highpass(x * 0.4 + buzz * (np.abs(x) > 0.05), 200)


def click():
    n = int(0.08 * SR)
    return highpass(rng.standard_normal(n), 1500) * env_exp(n, 0.006) * 0.9


def tick():
    n = int(0.03 * SR)
    return np.sin(2 * np.pi * 3200 * np.arange(n) / SR) * env_exp(n, 0.006) * 0.3


def main() -> None:
    end = s(T_END)
    n = int((end + 2.5) * SR)
    music = np.zeros((n, 2))
    fx = np.zeros((n, 2))
    beat = 60 / 100
    t = np.arange(n) / SR

    # ── Nappe de tension : ré grave + mi bémol dissonant, jusqu'au noir ──
    tension_len = s(T_BLACK)
    m = int(tension_len * SR)
    drone = lowpass(saw(36.71, m) + 0.6 * saw(38.89, m, 0.001) + 0.5 * saw(73.42, m), 220)
    swell = np.clip(t[:m] / tension_len, 0, 1) ** 1.5 * 0.7 + 0.3
    fade = np.minimum(1, (m - np.arange(m)) / (0.05 * SR))
    add(music, drone * swell * fade * 0.35, 0)
    # aigu inquiétant (sinus qui monte lentement)
    hi = np.sin(2 * np.pi * np.cumsum(np.linspace(880, 1046, m)) / SR) * 0.035 * swell * fade
    add(music, hi, 0, pan=0.4)

    # ── 1. Avertissement ──
    add(fx, crackle(1.0), 0, 0.6)
    add(fx, whoosh(0.6), 0, 0.5, pan=-0.3)
    for b in range(0, 6):  # battements de cœur
        add(music, kick(0.7), s(b * BEAT))
        add(music, kick(0.45), s(b * BEAT) + 0.18)
    add(fx, glitch(0.25), s(34), 0.5)
    add(fx, whoosh(0.3), s(36) - 0.3, 0.4)
    add(fx, impact(1.0), s(54), 1.0)
    add(fx, braam(2.0), s(54), 0.9)
    add(fx, glitch(0.15), s(70), 0.4)
    add(fx, riser(s(T_DANGERS - 66), 300, 6000), s(66), 0.35)

    # ── 2. Risques : impact + braam à chaque coupe, rythme serré ──
    for i in range(N_DANGERS):
        at = s(T_DANGERS + i * 2 * BEAT)
        add(fx, impact(0.9), at, 0.9)
        add(fx, braam(1.2, 36.71 * (1.0, 1.0, 0.94, 0.89)[i]), at, 0.6)
        add(fx, whoosh(0.25), at - 0.25, 0.5)
    tt = s(T_DANGERS)
    while tt < s(T_RULES) - 0.01:
        add(music, kick(0.85), tt)
        add(music, hat(), tt + beat / 2, 1.0, pan=0.3)
        add(music, bass_note(36.71 * 2, beat / 2), tt, 0.7)
        add(music, bass_note(36.71 * 2, beat / 2), tt + beat / 2, 0.5)
        tt += beat

    # ── 3. Règles : plus froid, horloge qui tic-taque ──
    for i in range(N_RULES):
        at = s(T_RULES + i * 2 * BEAT)
        add(fx, impact(0.6), at, 0.7)
        add(fx, whoosh(0.3), at - 0.3, 0.4)
    tt = s(T_RULES)
    k = 0
    while tt < s(T_BLACK) - 0.01:
        add(fx, tick(), tt, 0.8, pan=0.5 if k % 2 else -0.5)
        if k % 4 == 0:
            add(music, kick(0.8), tt)
        if k % 4 == 2:
            add(music, with_reverb(snare(), 0.3), tt, 0.5)
        tt += beat / 2
        k += 1
    add(music, pad_chord([146.83, 174.61, 220.0], s(T_BLACK - T_RULES) + 0.5, 600), s(T_RULES), 0.5)

    # ── 4. Noir, lampe, logo ──
    add(fx, click(), s(T_BLACK + 3), 1.0)
    hum_len = s(T_LOGO - T_BLACK)
    hn = int(hum_len * SR)
    add(fx, lowpass(saw(120, hn), 400) * 0.08 * np.minimum(1, np.arange(hn) / (0.2 * SR)), s(T_BLACK + 3))
    add(fx, riser(hum_len, 200, 9000), s(T_BLACK), 0.6)
    add(fx, impact(1.2), s(T_LOGO), 1.0)
    add(fx, braam(3.0), s(T_LOGO), 1.0)
    add(music, pad_chord([73.42, 146.83, 220.0, 293.66], s(T_BRAND - T_LOGO) + 0.8, 1200), s(T_LOGO), 0.7)
    add(fx, shimmer(), s(T_LOGO + 18), 1.0)

    # ── 5. Le site : groove complet ──
    add(fx, whoosh(0.4), s(T_BRAND) - 0.4, 0.6)
    add(fx, impact(0.7), s(T_BRAND), 0.7)
    chords = [(73.42, [146.83, 174.61, 220.0]), (58.27, [116.54, 146.83, 174.61]),
              (49.0, [98.0, 116.54, 146.83]), (55.0, [110.0, 138.59, 164.81])]
    tt = s(T_BRAND)
    i = 0
    while tt < end - 0.01:
        bar = i // 4
        root, chord = chords[bar % 4]
        if i % 4 == 0:
            add(music, pad_chord(chord, beat * 4 + 0.6), tt, 0.5)
        add(music, kick(0.9), tt)
        if i % 2 == 1:
            add(music, with_reverb(snare(), 0.2), tt, 0.7)
        add(music, hat(), tt + beat / 2, 1.0, pan=0.3)
        add(music, bass_note(root, beat / 2), tt, 0.8)
        add(music, bass_note(root, beat / 2), tt + beat / 2, 0.6)
        tt += beat
        i += 1
    for j in range(4):  # apparition des pastilles
        add(fx, blip(1700 + j * 200, 0.08, 0.3), s(T_BRAND + 44 + j * 6), 0.8)
    add(fx, riser(1.0, 400, 8000), s(CTA) - 1.0, 0.4)
    add(fx, impact(0.9), s(CTA), 0.9)
    add(fx, braam(2.5), s(CTA), 0.7)

    # Fin : tout s'éteint avec le fondu au noir
    out = music * 0.55 + fx * 0.8
    fade_out = np.clip((end + 0.6 - t) / 1.0, 0, 1)
    out *= fade_out[:, None]
    write(AUDIO / "intro-urbex.wav", out, -1.5)
    print(f"public/audio/intro-urbex.wav — {end:.1f} s")


if __name__ == "__main__":
    main()
