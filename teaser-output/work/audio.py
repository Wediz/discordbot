import numpy as np, wave, json

SR, DUR = 48000, 38.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(5)

def lp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))
def hp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X, len(x))
def ss(a, b, x):
    k = np.clip((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k)
def add(buf, t0, sig):
    n0 = int(t0 * SR); n1 = min(N, n0 + len(sig))
    if n1 > n0: buf[n0:n1] += sig[: n1 - n0]
def env(attack, decay, length):
    tt = np.arange(int(length * SR)) / SR
    return tt, np.minimum(tt / max(attack, 1e-4), 1) * np.exp(-tt / decay)

D1, D2, A2, D3, F3, A3, E4, A5, D6 = 36.71, 73.42, 110.0, 146.83, 174.61, 220.0, 329.63, 880.0, 1174.66
music = np.zeros(N); fx = np.zeros(N)

# ── voice ──
w = wave.open('vo/vo_siwis.wav'); v = np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32768
if w.getnchannels() == 2: v = v.reshape(-1, 2).mean(1)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
voice /= np.abs(voice).max()
# ducking envelope (voice presence)
ve = np.convolve(np.abs(voice), np.ones(SR // 20) / (SR // 20), 'same')
ve = np.clip(ve / (np.percentile(ve[ve > 1e-3], 90) + 1e-9), 0, 1)
ve = np.convolve(ve, np.ones(SR // 5) / (SR // 5), 'same')
duck = 1 - .45 * ve

# ── bed: drone + room tone (off during the blackout 27.05–28.0, out at the end card fade) ──
live = (1 - ss(27.0, 27.08, t) * (1 - ss(27.95, 28.1, t))) * (1 - ss(37.4, 37.95, t))
drone = np.sin(2*np.pi*D1*t) * .9 + np.sin(2*np.pi*D2*t + .3*np.sin(2*np.pi*.2*t)) * .5 + np.sin(2*np.pi*A2*t) * .15 * (.5 + .5*np.sin(2*np.pi*.13*t))
shape = .35 + .25*ss(1, 2, t) + .35*ss(18.7, 23.1, t) - .3*ss(28, 28.2, t) + .3*ss(33.7, 33.9, t)
music += drone * shape * .2 * live
bn = np.cumsum(rng.standard_normal(N)); bn -= lp(bn, .5); bn /= np.abs(bn).max()
music += lp(bn, 500) * .16 * (0.6 + .4*np.sin(2*np.pi*.09*t)) * live

# ── heartbeat intro + during blackout ──
for tb in [0.2, 0.45, 1.5, 1.75] + [27.1, 27.33, 27.6, 27.83]:
    tt, e = env(.004, .09, .5); f = 58 - 18 * tt / .5
    add(music, tb, np.sin(2*np.pi*np.cumsum(f)/SR) * e * .5)

# ── flashlight clicks (match flicker in the picture) ──
def click(t0, g=.25):
    L = int(.012 * SR); c = hp(rng.standard_normal(L), 2000) * np.exp(-np.arange(L)/SR/.002)
    add(fx, t0, c * g)
for tc in [1.0, 1.033, 1.1, 1.166, 27.05, 28.0]: click(tc)
# electrical buzz on the flicker at "C'est terminé."
tt = np.arange(int(.65 * SR)) / SR
buzz = np.sign(np.sin(2*np.pi*100*tt)) * (rng.random(len(tt)) < .6) * np.exp(-tt/.4)
add(fx, 16.85, lp(buzz, 2500) * .06)

# ── impacts ──
def impact(t0, g):
    tt, e = env(.002, .45, 2.2); f = 30 + 55*np.exp(-tt/.08)
    add(music, t0, np.sin(2*np.pi*np.cumsum(f)/SR) * e * g)
    L = int(.35 * SR); c = rng.standard_normal(L) * np.exp(-np.arange(L)/SR/.04)
    add(fx, t0, lp(c, 1800) * g * .3)
for t0, g in [(16.85, .8), (23.2, 1.0), (24.95, 1.0), (26.13, 1.1), (33.72, 1.0)]: impact(t0, g)
for t0 in [23.2, 24.95, 26.13]:
    L = int(.3 * SR); tt = np.arange(L)/SR
    add(fx, t0 - .3, lp(hp(rng.standard_normal(L), 900), 4500) * np.sin(np.pi*tt/.3)**2 * .09)

# ── tension: clock ticks 8–16.8, riser 18.8 → 23.2 ──
tk = 8.0
while tk < 16.8:
    tt, e = env(.001, .012, .06); add(fx, tk, np.sin(2*np.pi*2400*tt) * e * .05); tk += .5
L = int(4.4 * SR); tt = np.arange(L)/SR
riser = lp(hp(rng.standard_normal(L), 400), 6000) * (tt/4.4)**2.5 * .22 + np.sin(2*np.pi*np.cumsum(D2*2**(tt/4.4*2))/SR) * (tt/4.4)**2 * .1
add(fx, 18.8, riser)
# pulse under the action words
kt = 23.2
while kt < 27.0:
    tt, e = env(.002, .1, .4); f = 45 + 90*np.exp(-tt/.03)
    add(music, kt, np.sin(2*np.pi*np.cumsum(f)/SR) * e * .45); kt += .295

# ── pad: from "La première vidéo arrive" to the end ──
padm = ss(28.0, 29.2, t) * (1 - ss(37.3, 37.95, t))
pad = np.zeros(N)
for f in [D3, F3, A3, E4, D3*2]:
    for det in (-1.3, 1.3): pad += np.sin(2*np.pi*(f + det*f/440)*t + rng.random()*6)
music += lp(pad, 1100) / 10 * padm * .5

# ── subscribe: tap + bell ──
click(31.55, .35)
tt, e = env(.002, .5, 2.0)
bell = (np.sin(2*np.pi*A5*2*tt) + .6*np.sin(2*np.pi*A5*2*2.76*tt) + .3*np.sin(2*np.pi*A5*2*5.4*tt)) * e
add(fx, 31.95, bell * .05)
add(fx, 32.15, bell * .03)

# ── end card: door opening (low creak + light swell) ──
L = int(1.6 * SR); tt = np.arange(L)/SR
fcreak = 70 + 40*np.sin(2*np.pi*1.3*tt) + 25*tt
creak = np.sign(np.sin(2*np.pi*np.cumsum(fcreak)/SR)) * (0.5 + .5*rng.random(L))
creak = lp(hp(creak, 200), 1800) * np.sin(np.pi*np.clip(tt/1.6, 0, 1)) * .05
add(fx, 33.78, creak)
sw = lp(hp(rng.standard_normal(int(2*SR)), 3000), 9000) * np.sin(np.pi*np.arange(int(2*SR))/SR/2)**2 * .03
add(fx, 33.8, sw)

# ── reverb ──
def reverb(x, seed, secs=2.4):
    r = np.random.default_rng(seed); L = int(secs*SR)
    ir = lp(r.standard_normal(L) * np.exp(-np.arange(L)/SR/.5), 5000); ir /= np.sqrt((ir**2).sum())
    n = len(x) + L; nf = 1 << (n-1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), nf)[:len(x)]
bus = music * duck + fx
send = fx + music * .2 + voice * .12
chans = []
for seed in (1, 2):
    chans.append(hp(bus + reverb(send, seed) * .45, 25) * .55 + voice * 1.0)
mix = np.stack(chans, 1)
mix /= np.abs(mix).max()
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
mix *= 10 ** (-1 / 20) / np.abs(mix).max()
with wave.open('audio.wav', 'wb') as o:
    o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((mix*32767).astype('<i2').tobytes())
print('audio ok')
