"""Génère la voix off avec Piper (synthèse vocale gratuite, hors ligne).

    pip install piper-tts numpy
    python3 scripts/voice.py

Le modèle de voix (voiceover/script.json → voice.model) est téléchargé une fois
depuis huggingface.co/rhasspy/piper-voices dans voiceover/models/.
Sortie : public/audio/vo/<id>.wav (une piste par séquence, silences coupés).
Ensuite : python3 scripts/build_audio.py pour recaler le montage sur la voix.
"""
import json
import subprocess
import urllib.request
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = json.loads((ROOT / "voiceover" / "script.json").read_text(encoding="utf-8"))
MODELS = ROOT / "voiceover" / "models"
OUT = ROOT / "public" / "audio" / "vo"
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main"


def model_path(name: str) -> Path:
    """fr_FR-tom-medium → fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx"""
    lang, speaker, quality = name.split("-")
    rel = f"{lang.split('_')[0]}/{lang}/{speaker}/{quality}/{name}.onnx"
    MODELS.mkdir(parents=True, exist_ok=True)
    dest = MODELS / f"{name}.onnx"
    for suffix in ("", ".json"):
        target = Path(str(dest) + suffix)
        if not target.exists():
            print("Téléchargement", target.name)
            urllib.request.urlretrieve(f"{HF}/{rel}{suffix}", target)
    return dest


def trim(audio: np.ndarray, sr: int) -> np.ndarray:
    """Coupe les silences de début et de fin."""
    win = sr // 100
    env = np.convolve(np.abs(audio), np.ones(win) / win, "same")
    idx = np.where(env > 0.015)[0]
    if len(idx) == 0:
        return audio
    return audio[max(0, idx[0] - sr // 40): idx[-1] + sr // 15]


def main() -> None:
    from piper import PiperVoice, SynthesisConfig

    cfg = SCRIPT["voice"]
    voice = PiperVoice.load(str(model_path(cfg["model"])))
    syn = SynthesisConfig(length_scale=cfg["length_scale"], noise_scale=0.6, noise_w_scale=0.7)
    OUT.mkdir(parents=True, exist_ok=True)

    for seg in SCRIPT["segments"]:
        raw = OUT / f"{seg['id']}.raw.wav"
        with wave.open(str(raw), "wb") as w:
            voice.synthesize_wav(seg["say"], w, syn_config=syn)
        with wave.open(str(raw)) as w:
            sr = w.getframerate()
            audio = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float32) / 32768
        audio = trim(audio, sr)
        with wave.open(str(raw), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sr)
            w.writeframes((np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes())

        # Traitement « voix pub » : grave renforcé, présence, compression, 48 kHz.
        final = OUT / f"{seg['id']}.wav"
        subprocess.run(
            [
                "ffmpeg", "-v", "error", "-y", "-i", str(raw),
                "-af",
                "highpass=f=70,equalizer=f=140:t=q:w=1:g=3,equalizer=f=3500:t=q:w=1.2:g=2.5,"
                "acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=4,"
                "aresample=48000,loudnorm=I=-16:TP=-1.5:LRA=7",
                "-ar", "48000", "-ac", "1", str(final),
            ],
            check=True,
        )
        raw.unlink()
        print(f"{seg['id']:8s} {len(audio) / sr:5.2f} s")


if __name__ == "__main__":
    main()
