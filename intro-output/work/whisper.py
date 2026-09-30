import numpy as np, wave
from piper import PiperVoice, SynthesisConfig
V = PiperVoice.load('/tmp/claude-0/-home-user-discordbot/e7b47077-5a6c-529b-badd-36c76cf91cdd/scratchpad/voice/fr-siwis-medium.onnx')
SR = V.config.sample_rate
# phonemes chosen by hand so "trace" sounds English (tʁej-s), not French "trasse"
ph = ['n', 'ˈ', 'o', ' ', 't', 'ʁ', 'ˈ', 'e', 'j', 's', '.']
ids = V.phonemes_to_ids(ph)
a = V.phoneme_ids_to_audio(ids, SynthesisConfig(length_scale=1.35, noise_scale=.5, noise_w_scale=.5)).astype(float)
a /= np.abs(a).max()

def stft(x, n=1024, h=256):
    w = np.hanning(n); fr = [np.fft.rfft(np.pad(x, (0, n))[i:i+n]*w) for i in range(0, len(x), h)]; return np.array(fr)
def istft(X, n=1024, h=256, L=None):
    w = np.hanning(n); y = np.zeros(h*len(X)+n); ws = np.zeros_like(y)
    for i, f in enumerate(X): y[i*h:i*h+n] += np.fft.irfft(f, n)*w; ws[i*h:i*h+n] += w*w
    y /= np.maximum(ws, 1e-6); return y[:L]
X = stft(a); mag = np.abs(X)
# spectral envelope: smooth across frequency to wash out the harmonics (the "voiced" part)
k = np.ones(9)/9; env = np.array([np.convolve(m, k, 'same') for m in mag])
f = np.fft.rfftfreq(1024, 1/SR); tilt = (1 + (f/3000)**1.2)          # breathier top end
rng = np.random.default_rng(3); noise = np.exp(1j*rng.uniform(0, 2*np.pi, X.shape))
W = istft(env*tilt*noise, L=len(a))
W /= np.abs(W).max()
y = W*.92 + a*.10                                   # a hint of the soft voice under the breath
y /= np.abs(y).max()
with wave.open('whisper_raw.wav', 'wb') as o:
    o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((y*32767*.9).astype('<i2').tobytes())
print('ok', SR, round(len(y)/SR, 2))
