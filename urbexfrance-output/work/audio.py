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
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max()
ve = np.convolve(np.abs(voice), np.ones(SR // 20) / (SR // 20), 'same')
ve = np.clip(ve / (np.percentile(ve[ve > 1e-3], 90) + 1e-9), 0, 1)
ve = np.convolve(ve, np.ones(SR // 5) / (SR // 5), 'same'); duck = 1 - .45 * ve

live = 1 - ss(37.4, 37.95, t)
drone = np.sin(2*np.pi*D1*t) * .9 + np.sin(2*np.pi*D2*t + .3*np.sin(2*np.pi*.2*t)) * .5 + np.sin(2*np.pi*A2*t) * .15 * (.5 + .5*np.sin(2*np.pi*.13*t))
shape = .4 + .3*ss(5.5, 6, t) - .15*ss(10.8, 11.2, t) + .3*ss(24, 28.7, t)
music += drone * shape * .2 * live
bn = np.cumsum(rng.standard_normal(N)); bn -= lp(bn, .5); bn /= np.abs(bn).max()
music += lp(bn, 500) * .14 * (0.6 + .4*np.sin(2*np.pi*.09*t)) * live
for tb in [0.15, 0.4, 1.3, 1.55]:
    tt, e = env(.004, .09, .5); f = 58 - 18 * tt / .5
    add(music, tb, np.sin(2*np.pi*np.cumsum(f)/SR) * e * .5)
def click(t0, g=.25):
    L = int(.012 * SR); c = hp(rng.standard_normal(L), 2000) * np.exp(-np.arange(L)/SR/.002); add(fx, t0, c * g)
def blip(t0, f, g=.06, d=.08):
    tt, e = env(.003, d, d*5); add(fx, t0, np.sin(2*np.pi*f*tt) * e * g)
def impact(t0, g):
    tt, e = env(.002, .45, 2.2); f = 30 + 55*np.exp(-tt/.08)
    add(music, t0, np.sin(2*np.pi*np.cumsum(f)/SR) * e * g)
    L = int(.35 * SR); c = rng.standard_normal(L) * np.exp(-np.arange(L)/SR/.04); add(fx, t0, lp(c, 1800) * g * .3)
def whoosh(t0, g=.09):
    L = int(.3 * SR); tt = np.arange(L)/SR
    add(fx, t0 - .3, lp(hp(rng.standard_normal(L), 900), 4500) * np.sin(np.pi*tt/.3)**2 * g)
# categories
for t0 in [5.86, 6.906, 8.319, 9.783]: impact(t0, .9); whoosh(t0)
# map: shimmer as the outline draws, soft plinks as pins appear
L = int(1.8*SR); tt = np.arange(L)/SR
add(fx, 11.0, lp(hp(rng.standard_normal(L), 3500), 9000) * np.sin(np.pi*tt/1.8)**2 * .035)
r2 = np.random.default_rng(9)
for k in range(40): blip(11.8 + r2.random()*2.2, [D6, A5*2, 1318.5][k % 3], .018, .05)
# driving pulse 11–24.3
kt = 11.0
while kt < 24.3:
    tt, e = env(.002, .11, .4); f = 45 + 90*np.exp(-tt/.03)
    add(music, kt, np.sin(2*np.pi*np.cumsum(f)/SR) * e * .32)
    tt, e = env(.01, .12, .3); add(music, kt + .25, np.tanh(2.5*np.sin(2*np.pi*D2*tt)) * e * .07)
    kt += .5
# GPS card
blip(16.6, D6, .07); blip(16.68, A5*2, .05)
for k in range(24): click(16.5 + k*.066, .06)
# regions light up + forum chips
for i in range(13): blip(19.56 + i*.28, [587.33, 659.25, 698.46, 880.0][i % 4], .035, .06)
for t0 in [19.9, 20.9, 21.9]: blip(t0, 1174.66, .05, .05); blip(t0+.07, 1760, .03, .05)
# free badge / lock
blip(24.5, 880, .06); blip(24.58, 1318.5, .05)
click(26.3, .35); impact(26.3, .45)
# URL
impact(28.75, 1.1); whoosh(28.75, .12)
for tg in [28.8, 28.87, 29.0, 29.08]:
    Lg = int(.03*SR); add(fx, tg, lp(rng.standard_normal(Lg), 3000) * .07 * np.hanning(Lg))
# pad to the end
padm = ss(28.75, 29.8, t) * (1 - ss(37.3, 37.95, t))
pad = np.zeros(N)
for f in [D3, F3, A3, E4, D3*2]:
    for det in (-1.3, 1.3): pad += np.sin(2*np.pi*(f + det*f/440)*t + rng.random()*6)
music += lp(pad, 1100) / 10 * padm * .5
# subscribe tap + bell, signature slash
click(32.9, .35)
tt, e = env(.002, .5, 2.0)
bellw = (np.sin(2*np.pi*1760*tt) + .6*np.sin(2*np.pi*1760*2.76*tt) + .3*np.sin(2*np.pi*1760*5.4*tt)) * e
add(fx, 33.3, bellw * .05); add(fx, 33.5, bellw * .03)
tt, e = env(.003, .35, 1.6); add(fx, 35.35, (np.sin(2*np.pi*D6*tt) + .5*np.sin(2*np.pi*880*tt)) * e * .06)

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
