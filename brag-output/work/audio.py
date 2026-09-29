import numpy as np, wave

SR, DUR = 48000, 22.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(3)

def env_at(t0, attack, decay, length=None):
    n0 = int(t0 * SR); L = int((length or decay * 6) * SR)
    tt = np.arange(L) / SR
    e = np.minimum(tt / max(attack, 1e-4), 1) * np.exp(-tt / decay)
    return n0, tt, e

def add(buf, n0, sig):
    n1 = min(N, n0 + len(sig))
    if n1 > n0: buf[n0:n1] += sig[: n1 - n0]

def onepole(x, fc):
    a = np.exp(-2 * np.pi * np.asarray(fc) / SR)
    y = np.zeros_like(x); s = 0.0
    if np.ndim(a) == 0:
        a = np.full(len(x), a)
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y

def lp_fast(x, fc):  # FFT brickwall-ish lowpass with soft rolloff
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))

def hp_fast(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X, len(x))

def ss(a, b, x):
    k = np.clip((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k)

D1, D2, A2, D3, F3, A3, E4, D5, A5, D6 = 36.71, 73.42, 110.0, 146.83, 174.61, 220.0, 329.63, 587.33, 880.0, 1174.66

dry = np.zeros(N); fx = np.zeros(N)

# ── drone (whole piece, shaped by scene) ──
lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * t)
drone = (np.sin(2*np.pi*D1*t) * .9 + np.sin(2*np.pi*D2*t + .3*np.sin(2*np.pi*.2*t)) * .5
         + np.sin(2*np.pi*A2*t) * .18 * lfo)
dshape = (.25 + .35 * ss(3.1, 3.3, t)) * (1 - .5 * ss(14.8, 15.2, t)) * (1 + .6 * ss(18.3, 18.5, t)) * (1 - ss(21.6, 21.95, t))
dry += drone * dshape * .22

# ── wind: brown noise, lowpassed, slow swells ──
wn = np.cumsum(rng.standard_normal(N)); wn -= lp_fast(wn, 0.5); wn /= np.abs(wn).max()
wind = lp_fast(wn, 700) * (0.6 + 0.4 * np.sin(2 * np.pi * .11 * t + 1)) * (1 - ss(21.6, 21.95, t))
dry += wind * .18

# ── heartbeat (hook) ──
for tb in [0.35, 0.62, 1.35, 1.62, 2.3, 2.55]:
    n0, tt, e = env_at(tb, .004, .09, .5)
    f = 58 - 18 * tt / .5
    dry_sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * e
    add(dry, n0, dry_sig * (.55 if tb in (0.35, 1.35, 2.3) else .38))

# ── riser into the reveal ──
n0 = int(2.1 * SR); L = int(1.1 * SR); tt = np.arange(L) / SR
nz = rng.standard_normal(L)
riser = hp_fast(nz, 300) * (tt / 1.1) ** 2.2
riser = lp_fast(riser, 5000)
sweep = np.sin(2 * np.pi * np.cumsum(D2 * 2 ** (tt / 1.1 * 3)) / SR) * (tt / 1.1) ** 2
add(fx, n0, (riser * .25 + sweep * .12))

# ── impacts ──
def impact(t0, gain):
    n0, tt, e = env_at(t0, .002, .45, 2.2)
    f = 30 + 55 * np.exp(-tt / .08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * e
    add(dry, n0, sub * gain)
    L = int(.35 * SR); c = rng.standard_normal(L) * np.exp(-np.arange(L) / SR / .04)
    add(fx, n0, lp_fast(c, 1800) * gain * .35)
for t0, g in [(3.2, 1.0), (7.4, .55), (10.8, .7), (11.85, .7), (12.9, .7), (13.95, .7), (18.4, 1.0)]:
    impact(t0, g)

# whooshes before each category cut
for t0 in [10.8, 11.85, 12.9, 13.95]:
    L = int(.3 * SR); tt = np.arange(L) / SR
    w = hp_fast(rng.standard_normal(L), 900) * np.sin(np.pi * tt / .3) ** 2
    add(fx, int((t0 - .3) * SR), lp_fast(w, 4000) * .08)

# ── title: glitch ticks + the slash "shing" ──
for tg in [4.1, 4.17, 4.3, 4.36, 4.52]:
    L = int(.03 * SR)
    add(dry, int(tg * SR), lp_fast(rng.standard_normal(L), 3000) * .07 * np.hanning(L))
n0, tt, e = env_at(4.55, .003, .35, 1.6)
shing = (np.sin(2*np.pi*D6*tt) + .5*np.sin(2*np.pi*A5*tt) + .25*np.sin(2*np.pi*D6*2*tt)) * e
add(fx, n0, shing * .09)

# ── HUD beeps (D5 / A5) ──
for tb, f in [(7.65, D5), (8.15, D5), (8.65, D5), (8.72, A5), (8.82, A5)]:
    n0, tt, e = env_at(tb, .003, .05, .25)
    add(fx, n0, np.sin(2 * np.pi * f * tt) * e * .07)

# ── pulse: kicks + D bass through HUD and categories ──
kt = 7.65
while kt < 15.0:
    n0, tt, e = env_at(kt, .002, .12, .45)
    f = 45 + 90 * np.exp(-tt / .03)
    add(dry, n0, np.sin(2 * np.pi * np.cumsum(f) / SR) * e * .45)
    n0, tt, e = env_at(kt + .2625, .01, .12, .3)
    add(dry, n0, np.tanh(2.5 * np.sin(2 * np.pi * D2 * tt)) * e * .09)
    kt += .525

# ── pad (the code + outro): D minor add9 ──
padmask = ss(15.0, 16.2, t) * (1 - ss(18.1, 18.4, t)) * .6 + ss(18.4, 18.9, t) * (1 - ss(21.6, 21.95, t))
pad = np.zeros(N)
for f in [D3, F3, A3, E4, D3 * 2]:
    for det in (-1.2, 1.2):
        pad += np.sin(2 * np.pi * (f + det * f / 440) * t + rng.random() * 6)
pad = lp_fast(pad, 1200) / 10
fx += pad * padmask * .35

# ── dissolve shimmer ──
n0 = int(17.8 * SR); L = int(.9 * SR); tt = np.arange(L) / SR
sh = hp_fast(rng.standard_normal(L), 4000) * np.sin(np.pi * tt / .9) ** 2
add(fx, n0, sh * .05)
for i, f in enumerate([A5, D6, E4 * 4, A5 * 2]):
    n0b, ttb, eb = env_at(17.85 + i * .12, .005, .3, 1.2)
    add(fx, n0b, np.sin(2 * np.pi * f * ttb) * eb * .025)

# ── reverb on the fx bus (stereo decorrelated) ──
def reverb(x, seed, secs=2.6):
    r = np.random.default_rng(seed); L = int(secs * SR)
    ir = r.standard_normal(L) * np.exp(-np.arange(L) / SR / .55)
    ir = lp_fast(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    n = len(x) + L; nf = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), nf)[: len(x)]
    return y
wetL, wetR = reverb(fx + dry * .25, 1), reverb(fx + dry * .25, 2)
L_ = dry + fx * .6 + wetL * .55
R_ = dry + fx * .6 + wetR * .55

mix = np.stack([L_, R_], 1)
mix = hp_fast(mix[:, 0], 25), hp_fast(mix[:, 1], 25)
mix = np.stack(mix, 1)
mix /= np.abs(mix).max()
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix *= 10 ** (-1 / 20) / np.abs(mix).max()
fade = np.ones(N); fade[:int(.05*SR)] = np.linspace(0, 1, int(.05*SR))
mix *= fade[:, None]

with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('audio ok', mix.shape)
