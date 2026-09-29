import wave, json, sys
from piper import PiperVoice, SynthesisConfig
name = sys.argv[1]
V = PiperVoice.load(f'/tmp/claude-0/-home-user-discordbot/e7b47077-5a6c-529b-badd-36c76cf91cdd/scratchpad/voice/fr-{name}.onnx')
lines = json.load(open('lines.json'))
cfg = SynthesisConfig(length_scale=1.22, noise_scale=0.55, noise_w_scale=0.6)
for i, l in enumerate(lines):
    with wave.open(f'{name}_{i:02d}.wav', 'wb') as w:
        V.synthesize_wav(l['say'], w, syn_config=cfg)
