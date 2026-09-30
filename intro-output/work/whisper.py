import numpy as np, wave, sys
from piper import PiperVoice, SynthesisConfig
V = PiperVoice.load('/tmp/claude-0/-home-user-discordbot/e7b47077-5a6c-529b-badd-36c76cf91cdd/scratchpad/voice/fr-siwis-medium.onnx')
SR = V.config.sample_rate
ph = ['n', 'ˈ', 'o', ' ', 't', 'ʁ', 'ˈ', 'e', 'j', 's', '.']
a = V.phoneme_ids_to_audio(V.phonemes_to_ids(ph), SynthesisConfig(length_scale=1.45, noise_scale=.4, noise_w_scale=.4)).astype(float)
a /= np.abs(a).max()

n, h = 2048, 128                                    # long window + dense overlap = smooth, no graininess
win = np.hanning(n)
def stft(x): x = np.pad(x, (n, n)); return np.array([np.fft.rfft(x[i:i+n]*win) for i in range(0, len(x)-n, h)])
def istft(X, L):
    y = np.zeros(h*len(X)+n); ws = np.zeros_like(y)
    for i, f in enumerate(X): y[i*h:i*h+n] += np.fft.irfft(f, n)*win; ws[i*h:i*h+n] += win**2
    return (y/np.maximum(ws, 1e-6))[n:n+L]
X = stft(a); mag = np.abs(X)
# envelope smoothed in frequency (drop harmonics) and in time (no flutter)
env = np.array([np.convolve(m, np.ones(15)/15, 'same') for m in mag])
env = np.apply_along_axis(lambda c: np.convolve(c, np.ones(5)/5, 'same'), 0, env)
f = np.fft.rfftfreq(n, 1/SR); soft = 1/np.sqrt(1+(f/5500)**4) * np.minimum(1, (f/250)**2)   # roll off harsh top + mud
noise = np.random.default_rng(3).standard_normal(len(a))
Nz = stft(noise); Nz /= np.abs(Nz).mean()            # a real, continuous noise → coherent breath
breath = istft(Nz*env*soft, len(a)); breath /= np.abs(breath).max()
# soft voice, low-passed so it stays warm under the breath
F = np.fft.rfft(a); ff = np.fft.rfftfreq(len(a), 1/SR); voice = np.fft.irfft(F/np.sqrt(1+(ff/4500)**4), len(a)); voice /= np.abs(voice).max()
for name, vmix in (('whisper', .45), ('whisper_b', .22)):
    y = breath*(1-vmix) + voice*vmix; y /= np.abs(y).max()
    with wave.open(f'{name}_raw.wav', 'wb') as o:
        o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((y*32767*.9).astype('<i2').tobytes())
print('ok', round(len(a)/SR, 2))
