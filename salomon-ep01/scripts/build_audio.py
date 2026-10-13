"""Montage + musique + bruitages, entièrement générés (aucun fichier externe).

    python3 scripts/build_audio.py      (numpy + scipy)

1. Calcule le montage à partir de voiceover/script.json et des pistes de voix
   (public/audio/vo/*.wav). Sans voix, la durée est estimée d'après le texte.
   Chaque séquence est arrondie au temps musical (100 BPM = 18 images).
2. Écrit src/generated/timeline.json (lu par la vidéo).
3. Compose public/audio/music.wav et public/audio/sfx.wav calés sur ce montage.
"""
import json
import math
import wave
from pathlib import Path

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = json.loads((ROOT / "voiceover" / "script.json").read_text(encoding="utf-8"))
AUDIO = ROOT / "public" / "audio"
FPS = 30
SR = 48000
BPM = 100
BEAT_FRAMES = FPS * 60 // BPM  # 18
TAIL = 10  # images de respiration après la voix
CHARS_PER_SEC = 14.5  # estimation quand la voix n'est pas encore générée

rng = np.random.default_rng(7)


# ───────────────────────────── Montage ─────────────────────────────

def wav_frames(path: Path) -> int | None:
    if not path.exists():
        return None
    with wave.open(str(path)) as w:
        return math.ceil(w.getnframes() / w.getframerate() * FPS)


def chunk_caption(text: str, max_len: int = 64) -> list[str]:
    """Découpe le sous-titre aux ponctuations (2 lignes max à l'écran)."""
    import re

    # 1. phrases / propositions
    parts = [p.strip() for p in re.split(r"(?<=[.:])\s+", text) if p.strip()]
    # 2. trop long → coupe à la virgule la plus centrale, sinon au mot central
    out = []
    for p in parts:
        while len(p) > max_len:
            commas = [m.end() for m in re.finditer(r",\s", p)]
            cut = min(commas, key=lambda c: abs(c - len(p) / 2)) if commas else None
            if cut is None:
                spaces = [m.start() for m in re.finditer(r"\s", p)]
                cut = min(spaces, key=lambda c: abs(c - len(p) / 2))
            out.append(p[:cut].strip())
            p = p[cut:].strip()
        out.append(p)
    # 3. fusionne les morceaux trop courts avec le précédent
    merged = []
    for p in out:
        if merged and (len(p) < 20 or len(merged[-1]) < 20) and len(merged[-1]) + 1 + len(p) <= max_len:
            merged[-1] = f"{merged[-1]} {p}"
        else:
            merged.append(p)
    return merged


def build_timeline() -> dict:
    segments, t = [], 0
    for seg in SCRIPT["segments"]:
        vo_path = AUDIO / "vo" / f"{seg['id']}.wav"
        real = wav_frames(vo_path)
        vo_len = real if real else math.ceil(len(seg["say"]) / CHARS_PER_SEC * FPS)
        length = max(seg["min"], seg["voStart"] + vo_len + TAIL)
        length = math.ceil(length / BEAT_FRAMES) * BEAT_FRAMES  # coupe sur le temps

        captions = []
        if seg.get("caption"):
            parts = chunk_caption(seg["caption"])
            total_chars = sum(len(p) for p in parts)
            start = seg["voStart"]
            for p in parts:
                d = vo_len * len(p) / total_chars
                captions.append({"text": p, "from": round(start), "duration": max(12, round(d))})
                start += d

        segments.append(
            {
                "id": seg["id"],
                "from": t,
                "duration": length,
                "vo": {
                    "file": f"audio/vo/{seg['id']}.wav" if real else None,
                    "from": seg["voStart"],
                    "duration": vo_len,
                    "estimated": real is None,
                },
                "captions": captions,
            }
        )
        t += length
    return {"fps": FPS, "bpm": BPM, "total": t, "segments": segments}


# ───────────────────────────── Synthèse ─────────────────────────────

def secs(frames: float) -> float:
    return frames / FPS


def env_exp(n: int, decay: float) -> np.ndarray:
    return np.exp(-np.arange(n) / (decay * SR))


def lowpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "low", fs=SR, output="sos"), x)


def highpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "high", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    return signal.sawtooth(2 * np.pi * freq * (1 + detune) * t + rng.uniform(0, 6.28))


def reverb_ir(seconds=2.2, decay=0.6):
    n = int(seconds * SR)
    ir = rng.standard_normal((n, 2)) * env_exp(n, decay)[:, None]
    ir[:, 0] = lowpass(ir[:, 0], 6000)
    ir[:, 1] = lowpass(ir[:, 1], 6000)
    return ir / np.sqrt((ir**2).sum(axis=0))


IR = reverb_ir()


def add(buf, sound, at_sec, gain=1.0, pan=0.0):
    """Ajoute un son (mono ou stéréo) à l'instant donné."""
    start = int(at_sec * SR)
    if start >= len(buf):
        return
    if sound.ndim == 1:
        left, right = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        sound = np.stack([sound * left * 1.41, sound * right * 1.41], axis=1)
    if start < 0:
        sound, start = sound[-start:], 0
    end = min(len(buf), start + len(sound))
    buf[start:end] += sound[: end - start] * gain


def with_reverb(x, wet=0.25):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    out = np.zeros((len(x) + len(IR) - 1, 2))
    for c in range(2):
        out[:, c] = signal.fftconvolve(x[:, c], IR[:, c])
    out[: len(x)] *= wet
    out[: len(x)] += x * (1 - wet)
    out[len(x):] *= wet
    return out


# Instruments
def kick(gain=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 42 + 90 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.16)
    click = highpass(rng.standard_normal(n), 2500) * env_exp(n, 0.004) * 0.25
    return np.tanh((body + click) * 1.4) * gain


def snare():
    n = int(0.45 * SR)
    noise = bandpass(rng.standard_normal(n), 900, 5000) * env_exp(n, 0.07)
    tone = np.sin(2 * np.pi * 185 * np.arange(n) / SR) * env_exp(n, 0.05) * 0.5
    return (noise * 0.7 + tone) * 0.6


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    return highpass(rng.standard_normal(n), 7500, 4) * env_exp(n, 0.05 if open_ else 0.012) * 0.22


def bass_note(freq, length):
    n = int(length * SR)
    x = saw(freq, n) + 0.6 * np.sin(2 * np.pi * freq / 2 * np.arange(n) / SR)
    cutoff_env = 180 + 900 * env_exp(n, 0.06)
    # filtre « pluck » approché : deux passes à fréquence moyenne + enveloppe
    y = lowpass(x, float(cutoff_env.mean()), 2)
    a = np.minimum(1, np.arange(n) / (0.004 * SR)) * env_exp(n, 0.18)
    return y * a * 0.5


def pad_chord(freqs, length, cutoff=900):
    n = int(length * SR)
    x = np.zeros((n, 2))
    for f in freqs:
        for det, pan in ((-0.004, -0.6), (0.0, 0.0), (0.005, 0.6)):
            s = lowpass(saw(f, n, det), cutoff, 2)
            add(x, s, 0, 0.12, pan)
    att = np.minimum(1, np.arange(n) / (0.5 * SR))
    rel = np.minimum(1, (n - np.arange(n)) / (0.6 * SR))
    return x * (att * rel)[:, None]


def riser(length, f0=300, f1=7000):
    n = int(length * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    steps = 24
    for i in range(steps):
        a, b = i * n // steps, (i + 1) * n // steps
        fc = f0 * (f1 / f0) ** (i / steps)
        out[a:b] = bandpass(noise[a:b], fc * 0.7, min(fc * 1.4, SR / 2 - 100))
    return out * np.linspace(0, 1, n) ** 2.2 * 0.5


def whoosh(length=0.45):
    r = riser(length, 500, 6000)
    fade = np.minimum(1, (len(r) - np.arange(len(r))) / (0.06 * SR))
    return r * fade * 1.4


def impact(gain=1.0):
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(30 + 50 * np.exp(-t / 0.08)) / SR) * env_exp(n, 0.55)
    crack = lowpass(rng.standard_normal(n), 3500) * env_exp(n, 0.09) * 0.5
    return with_reverb(np.tanh((sub + crack) * 1.5) * gain, 0.3)


def glitch(length=0.3):
    n = int(length * SR)
    out = np.zeros(n)
    pos = 0
    while pos < n:
        d = int(rng.uniform(0.012, 0.05) * SR)
        f = rng.choice([220, 440, 880, 1320, 2600])
        tone = signal.square(2 * np.pi * f * np.arange(d) / SR) * 0.25
        noise = rng.standard_normal(d) * 0.3
        burst = np.round((tone + noise) * 6) / 6  # « bit crush »
        out[pos: pos + d] = burst[: n - pos] * rng.uniform(0.3, 1)
        pos += d + int(rng.uniform(0, 0.03) * SR)
    return highpass(out, 300) * 0.5


def blip(freq=1900, length=0.09, gain=0.35):
    n = int(length * SR)
    return np.sin(2 * np.pi * freq * np.arange(n) / SR) * env_exp(n, length / 4) * gain


def shimmer(length=1.4):
    out = np.zeros((int(length * SR) + int(2.5 * SR), 2))
    for i, f in enumerate([1175, 1480, 1760, 2350, 2960]):
        n = int(0.9 * SR)
        tone = np.sin(2 * np.pi * f * np.arange(n) / SR) * env_exp(n, 0.25) * 0.12
        add(out, with_reverb(tone, 0.5), i * 0.09)
    return out


# ───────────────────────────── Composition ─────────────────────────────

NOTE = {"D1": 36.71, "D2": 73.42, "A1": 55.0, "Bb1": 58.27, "G1": 49.0, "F2": 87.31, "C2": 65.41, "A2": 110.0}
CHORDS = [  # Ré mineur sombre : Dm – Bb – Gm – A
    ("D2", [146.83, 174.61, 220.0]),
    ("Bb1", [116.54, 146.83, 174.61]),
    ("G1", [98.0, 116.54, 146.83]),
    ("A1", [110.0, 138.59, 164.81]),
]


def compose(tl: dict) -> tuple[np.ndarray, np.ndarray]:
    total = secs(tl["total"]) + 2.5
    n = int(total * SR)
    music = np.zeros((n, 2))
    sfx = np.zeros((n, 2))
    seg = {s["id"]: s for s in tl["segments"]}
    beat = 60 / BPM
    starts = [secs(s["from"]) for s in tl["segments"]]
    features = [s for s in tl["segments"] if s["id"] not in ("intro", "reveal", "hero", "outro")]
    reveal0, feat0 = secs(seg["reveal"]["from"]), secs(features[0]["from"])
    hero0, outro0 = secs(seg["hero"]["from"]), secs(seg["outro"]["from"])
    end = secs(tl["total"])

    # Nappe grave continue (drone) + respiration lente
    t = np.arange(n) / SR
    drone = lowpass(saw(NOTE["D1"], n) + 0.5 * saw(NOTE["D1"] * 1.5, n, 0.002), 160)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / 7.2)
    fade_in = np.clip(t / 2.5, 0, 1)
    fade_out = np.clip((end + 2.0 - t) / 2.5, 0, 1)
    add(music, drone * swell * fade_in * fade_out * 0.28, 0)

    # Montée vers la révélation
    add(music, riser(reveal0 - 0.6), 0.6, 0.35)

    # Basse pulsée (croches) : de la révélation jusqu'au hero
    k = 0
    tt = reveal0
    while tt < hero0 - 0.01:
        bar = int((tt - reveal0) / (beat * 4))
        root = CHORDS[bar % 4][0]
        g = 0.55 if tt < feat0 else 0.8
        add(music, bass_note(NOTE[root], beat / 2), tt, g, pan=0.0)
        tt += beat / 2
        k += 1

    # Accords tenus (nappe) à partir des détails, 1 accord par mesure
    tt = feat0
    bar = 0
    while tt < hero0 - 0.01:
        add(music, pad_chord(CHORDS[bar % 4][1], beat * 4 + 0.6), tt, 0.55)
        tt += beat * 4
        bar += 1

    # Batterie : kick à chaque temps dès le plan 3/4, groove complet sur les détails
    cut_b = reveal0 + secs(78)
    tt = reveal0
    i = 0
    while tt < hero0 - 0.01:
        in_feat = tt >= feat0 - 1e-6
        pos = i % 4
        if tt >= cut_b - 1e-6:
            if in_feat or pos in (0, 2):
                add(music, kick(0.9 if pos in (0, 2) else 0.6), tt)
            if in_feat and pos in (1, 3):
                add(music, with_reverb(snare(), 0.2), tt, 0.7)
        if in_feat:
            add(music, hat(), tt + beat / 2, 1.0, pan=0.3)
            add(music, hat(), tt + beat / 4 * 3, 0.5, pan=-0.3)
        tt += beat
        i += 1

    # Hero : respiration, grand accord tenu, basse longue, kick lent
    add(music, pad_chord([146.83, 220.0, 293.66, 349.23], secs(seg["hero"]["duration"]) + 1, 1400), hero0, 0.8)
    add(music, lowpass(saw(NOTE["D2"], int((secs(seg["hero"]["duration"])) * SR)), 220) * 0.35, hero0)
    tt = hero0
    while tt < outro0 - 0.01:
        add(music, kick(0.8), tt)
        tt += beat * 2
    add(music, riser(1.2, 400, 8000), outro0 - 1.2, 0.3)

    # Outro : accord final qui s'éteint
    add(music, pad_chord([146.83, 174.61, 220.0, 293.66], end - outro0 + 2.0, 700), outro0, 0.7)

    # Duck : la musique baisse sous la voix (−6 dB, transitions douces)
    duck = np.ones(n)
    for s in tl["segments"]:
        a = secs(s["from"] + s["vo"]["from"]) - 0.12
        b = a + secs(s["vo"]["duration"]) + 0.25
        duck[int(a * SR): int(b * SR)] = 0.5
    duck = np.convolve(duck, np.ones(int(0.15 * SR)) / int(0.15 * SR), "same")
    music *= duck[:, None]

    # ── Bruitages (calés sur les animations des scènes) ──
    add(sfx, whoosh(0.4), secs(3) - 0.05, 0.4)  # ligne de balayage
    add(sfx, impact(0.6), secs(15), 0.8)  # logo
    add(sfx, glitch(0.3), secs(15), 0.6)
    add(sfx, glitch(0.12), secs(55), 0.4)
    add(sfx, whoosh(0.5), secs(40), 0.25, pan=-0.2)  # titre
    add(sfx, blip(1500, 0.12, 0.3), secs(62))  # épisode

    for idx, s in enumerate(tl["segments"][1:], start=1):
        at = secs(s["from"])
        big = s["id"] in ("reveal", "hero", "outro")
        add(sfx, whoosh(0.5 if big else 0.32), at - (0.5 if big else 0.32), 0.7 if big else 0.45)
        add(sfx, impact(1.0 if big else 0.45), at, 1.0 if big else 0.6)
        if s["id"] in ("hero", "outro"):
            add(sfx, glitch(0.35), at - 0.4, 0.5)
        if s in features:
            add(sfx, blip(1900), at + secs(16), 0.9, pan=0.2)  # viseur
            add(sfx, blip(2600, 0.05, 0.25), at + secs(34), 0.9, pan=0.3)  # étiquette
            add(sfx, whoosh(0.25), at + secs(s["duration"] - 12), 0.25)

    # Révélation : souffle de lumière, bascule 3/4, titre
    add(sfx, riser(2.0, 200, 2500), reveal0 + secs(8), 0.25)
    add(sfx, impact(0.8), reveal0 + secs(78), 0.9)
    add(sfx, whoosh(0.35), reveal0 + secs(78 + 12), 0.4)
    # Outro : verrouillage + reflet sur le logo
    add(sfx, blip(2200, 0.06, 0.4), outro0 + secs(26))
    add(sfx, blip(2200, 0.06, 0.4), outro0 + secs(30))
    add(sfx, shimmer(), outro0 + secs(50), 0.9)

    return music, sfx


def write(path: Path, x: np.ndarray, peak_db: float) -> None:
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def main() -> None:
    tl = build_timeline()
    out = ROOT / "src" / "generated" / "timeline.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")
    est = any(s["vo"]["estimated"] for s in tl["segments"])
    print(f"Montage : {tl['total']} images = {tl['total'] / FPS:.1f} s" + (" (voix estimée)" if est else ""))
    for s in tl["segments"]:
        print(f"  {s['id']:8s} {s['from'] / FPS:5.1f} s → {(s['from'] + s['duration']) / FPS:5.1f} s")

    music, sfx = compose(tl)
    write(AUDIO / "music.wav", music, -3)
    write(AUDIO / "sfx.wav", sfx, -3)
    print("Audio : public/audio/music.wav, public/audio/sfx.wav")


if __name__ == "__main__":
    main()
