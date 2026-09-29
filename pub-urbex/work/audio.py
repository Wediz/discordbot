import numpy as np, wave

SR, DUR = 48000, 50.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(21)

def lp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1/SR); X *= 1/np.sqrt(1+(f/fc)**4); return np.fft.irfft(X, len(x))
def hp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1/SR); X *= 1/np.sqrt(1+(fc/np.maximum(f, 1))**4); return np.fft.irfft(X, len(x))
def ss(a, b, x):
    k = np.clip((x-a)/(b-a), 0, 1); return k*k*(3-2*k)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

L = np.zeros(N); R = np.zeros(N)
def add(t0, sig, pan=0.0, g=1.0):
    n0 = int(t0*SR); n1 = min(N, n0+len(sig))
    if n1 <= n0: return
    s = sig[:n1-n0] * g
    L[n0:n1] += s * np.sqrt((1-pan)/2); R[n0:n1] += s * np.sqrt((1+pan)/2)

# ── piano: inharmonic partials with per-partial decay + soft hammer ──
def piano(m, vel=.5, length=5.0):
    f = mtof(m); n = int(length*SR); tt = np.arange(n)/SR; B = 0.00035; y = np.zeros(n)
    bright = .5 + vel
    for k in range(1, 12):
        fk = k*f*np.sqrt(1+B*k*k)
        if fk > 12000: break
        amp = (1/k**(1.35-.35*bright)) * np.exp(-tt*(0.35+0.28*k)*(1+f/1200))
        y += amp*np.sin(2*np.pi*fk*tt + rng.random()*6)
    y *= np.minimum(tt/.004, 1)
    y *= np.exp(-tt*0.12)                                    # long sustain, pedal feel
    ham = lp(rng.standard_normal(int(.02*SR)), 2500) * np.exp(-np.arange(int(.02*SR))/SR/.004) * .15
    y[:len(ham)] += ham
    return y * vel * .22

CH = {'Dm':[50,53,57],'Bb':[46,50,53],'F':[41,45,48],'C':[48,52,55],'Gm':[43,46,50],'A':[45,49,52]}
PROG = [(0,'Dm'),(5.4,'Bb'),(8.4,'F'),(11.6,'C'),(14.1,'Dm'),(16.8,'Bb'),(19.2,'Gm'),(21.95,'Dm'),(23.15,'Bb'),
        (24.6,'F'),(25.65,'A'),(27.2,'Dm'),(30.5,'Bb'),(33.4,'F'),(35.5,'C'),(37.5,'Dm'),(40.5,'Bb'),(43.1,'F'),(45.7,'Dm'),(50,'')]

# arpeggios: sparse at first, fuller as the piece opens up
for i, (c0, name) in enumerate(PROG[:-1]):
    c1 = PROG[i+1][0]; tones = CH[name]
    dens = .9 if c0 < 8 else (.55 if c0 < 21.9 else (.42 if c0 < 37.5 else .5))
    vel0 = .32 if c0 < 21.9 else .4
    add(c0, piano(tones[0]-12, vel0+.12, 7), pan=-.2)          # bass
    pattern = [tones[0], tones[2], tones[1]+12, tones[2]+12, tones[0]+24, tones[2]+12, tones[1]+12, tones[2]]
    k = 0; tk = c0 + dens*.5
    while tk < c1 - .1 and c0 < 45.7:
        m = pattern[k % len(pattern)]
        add(tk, piano(m, vel0*(.8+.3*rng.random()), 5), pan=np.clip((m-60)/24, -.6, .6))
        tk += dens; k += 1

# melody (top voice) on the key lines
MEL = [(2.6,74,.45),(3.9,72,.35),(5.5,70,.45),(7.0,69,.4),(8.7,72,.45),(10.2,69,.4),(11.8,76,.5),(13.2,74,.4),
       (14.3,74,.5),(15.6,77,.45),(17.0,74,.5),(18.2,72,.4),(19.4,74,.55),(20.5,70,.45),
       (27.3,81,.5),(28.8,77,.45),(30.6,74,.5),(32.0,77,.45),(33.6,81,.55),(35.6,79,.5),(36.8,76,.45),
       (37.6,81,.6),(38.6,86,.55),(40.6,82,.55),(41.9,81,.5),(43.2,77,.55),(44.4,81,.5),(45.8,74,.6),(46.6,69,.4),(47.6,62,.5)]
for t0, m, v in MEL: add(t0, piano(m, v, 7), pan=.15)

# ── strings: detuned additive saws, slow swells, crossfading chords ──
def string_voice(m, t0, t1, att=1.4, rel=1.8):
    n0 = int(t0*SR); n1 = min(N, int((t1+rel)*SR)); tt = np.arange(n1-n0)/SR
    f = mtof(m); y = np.zeros(len(tt))
    for det in (-.12, 0, .13):
        ff = f*2**(det/12); vib = 1+.003*np.sin(2*np.pi*5.2*tt+rng.random()*6)
        ph = 2*np.pi*np.cumsum(ff*vib)/SR
        for k in range(1, 9): y += np.sin(k*ph)/k
    env = np.minimum(tt/att, 1) * np.where(tt < (t1-t0), 1, np.exp(-(tt-(t1-t0))/(rel/3)))
    return n0, y*env
strings = np.zeros(N)
for i, (c0, name) in enumerate(PROG[:-1]):
    if c0 < 5.4: continue
    c1 = PROG[i+1][0]
    for m in CH[name] + [CH[name][0]+12]:
        n0, y = string_voice(m+12, c0, c1)
        n1 = min(N, n0+len(y)); strings[n0:n1] += y[:n1-n0]
strings = lp(strings, 2600) / 40
swell = (ss(5, 9, t)*.35 + ss(21.5, 22.5, t)*.35 - ss(26.8, 27.6, t)*.25 + ss(30, 37.5, t)*.45 + ss(37.4, 38.6, t)*.25) * (1 - ss(45.0, 45.7, t)*.5) * (1 - ss(48.2, 49.8, t))
add(0, strings*np.clip(swell, 0, 1.2), pan=-.1, g=.9)
add(0, np.roll(strings, int(.013*SR))*np.clip(swell, 0, 1.2), pan=.6, g=.5)

# ── low hits on the categories, swell into the light, soft air ──
def sub(t0, g, d=1.6):
    tt = np.arange(int(d*SR))/SR; e = np.minimum(tt/.004, 1)*np.exp(-tt/.5)
    add(t0, np.sin(2*np.pi*np.cumsum(28+30*np.exp(-tt/.1))/SR)*e, g=g)
for c in [21.95, 23.15, 24.6, 25.65]: sub(c, .45)
sub(38.5, .6, 3)
n0 = int(43.6*SR); tt = np.arange(int(2.1*SR))/SR
shimmer = hp(rng.standard_normal(len(tt)), 5000) * (tt/2.1)**2.5 * .05
add(43.6, lp(shimmer, 14000), pan=-.3); add(43.6, lp(np.roll(shimmer, 900), 14000), pan=.3)
air = lp(np.cumsum(rng.standard_normal(N)) - lp(np.cumsum(rng.standard_normal(N)), .5), 400)
air /= np.abs(air).max(); add(0, air*.03*(1-ss(48, 50, t)))

music = np.stack([L, R], 1)

# ── voice ──
w = wave.open('vo/vo_natural.wav'); v = np.frombuffer(w.readframes(w.getnframes()), '<i2')/32768
if w.getnchannels() == 2: v = v.reshape(-1, 2).mean(1)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max()
ve = np.convolve(np.abs(voice), np.ones(SR//20)/(SR//20), 'same'); ve = np.clip(ve/(np.percentile(ve[ve > 1e-3], 90)+1e-9), 0, 1)
ve = np.convolve(ve, np.ones(SR//4)/(SR//4), 'same'); duck = (1 - .4*ve)[:, None]

# ── hall reverb ──
def reverb(x, seed, secs=3.8, decay=.9):
    r = np.random.default_rng(seed); Lr = int(secs*SR)
    ir = lp(r.standard_normal(Lr)*np.exp(-np.arange(Lr)/SR/decay), 6000); ir[:int(.02*SR)] = 0; ir /= np.sqrt((ir**2).sum())
    n = len(x)+Lr; nf = 1 << (n-1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nf)*np.fft.rfft(ir, nf), nf)[:len(x)]
mix = np.zeros((N, 2))
for ch in (0, 1):
    send = music[:, ch]*.7 + voice*.18
    mix[:, ch] = music[:, ch]*duck[:, 0]*.8 + reverb(send, ch+3)*.5 + voice*1.0
mix = np.stack([hp(mix[:, 0], 30), hp(mix[:, 1], 30)], 1)
mix /= np.abs(mix).max(); mix = np.tanh(mix*1.3)/np.tanh(1.3); mix *= 10**(-1/20)/np.abs(mix).max()
fade = (1 - ss(49.0, 49.95, t))[:, None]; mix *= fade
with wave.open('audio.wav', 'wb') as o:
    o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((mix*32767).astype('<i2').tobytes())
print('audio ok')
