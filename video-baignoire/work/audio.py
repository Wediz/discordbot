import numpy as np, wave

SR, DUR = 48000, 15.0
N = int(SR*DUR); t = np.arange(N)/SR
rng = np.random.default_rng(8)
def lp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1/SR); X *= 1/np.sqrt(1+(f/fc)**4); return np.fft.irfft(X, len(x))
def ss(a, b, x):
    k = np.clip((x-a)/(b-a), 0, 1); return k*k*(3-2*k)
def mtof(m): return 440*2**((m-69)/12)
L = np.zeros(N); R = np.zeros(N)
def add(t0, sig, pan=0., g=1.):
    n0 = int(t0*SR); n1 = min(N, n0+len(sig))
    if n1 <= n0: return
    s = sig[:n1-n0]*g; L[n0:n1] += s*np.sqrt((1-pan)/2); R[n0:n1] += s*np.sqrt((1+pan)/2)

# music-box / celesta: bell partials, soft attack, long ring
def bell(m, v=.5, d=2.2):
    f = mtof(m); tt = np.arange(int(d*1.6*SR))/SR; y = np.zeros(len(tt))
    for ratio, amp, dec in ((1, 1, 1), (2, .35, .6), (3.01, .12, .4), (4.2, .06, .25)):
        y += amp*np.sin(2*np.pi*f*ratio*tt)*np.exp(-tt/(d*dec))
    return y*np.minimum(tt/.004, 1)*v*.18
# soft marimba-ish bass
def mallet(m, v=.5):
    f = mtof(m); tt = np.arange(int(1.2*SR))/SR
    return (np.sin(2*np.pi*f*tt)+.25*np.sin(2*np.pi*4*f*tt)*np.exp(-tt/.05))*np.exp(-tt/.35)*np.minimum(tt/.003, 1)*v*.3

BPM = 96; b = 60/BPM
# C  G  Am  F | C  G  F  C   (one chord per bar of 4 beats)
prog = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60), (60, 64, 67), (55, 59, 62), (53, 57, 60), (60, 64, 67)]
mel = [76, 74, 72, 74, 76, 76, 76, None, 74, 74, 74, None, 76, 79, 79, None,
       76, 74, 72, 74, 76, 76, 76, 76, 74, 74, 76, 74, 72, None, None, None]
t0 = .35
for i, ch in enumerate(prog):
    bar = t0 + i*4*b
    if bar > 14.2: break
    add(bar, mallet(ch[0]-12, .55), pan=-.2)
    add(bar+2*b, mallet(ch[0]-12+7 if ch[0] < 60 else ch[0]-5, .4), pan=-.2)
    for k in range(4):                                   # gentle arpeggio on the off-beats
        add(bar+k*b+b/2, bell(ch[k % 3], .22, 1.2), pan=.35)
for j, m in enumerate(mel):
    tt0 = t0 + j*b
    if m is None or tt0 > 14.0: continue
    add(tt0, bell(m, .5), pan=.1)

# pad
pad = np.zeros(N)
for i, ch in enumerate(prog):
    a, z = t0+i*4*b, t0+(i+1)*4*b
    m = (t > a) & (t < z+.6)
    for n in ch: pad[m] += np.sin(2*np.pi*mtof(n)*t[m])*.5 + np.sin(2*np.pi*mtof(n)*1.003*t[m])*.5
pad = lp(pad, 900)*ss(0, 1.2, t)*(1-ss(14.2, 15, t))*.035
add(0, pad, -.3); add(0, np.roll(pad, 600), .3)

# water plops when captions pop, bubble pops, sparkle chime at the end card
def plop(t0, f0=900, g=.35):
    tt = np.arange(int(.12*SR))/SR; f = f0*np.exp(-tt*18)+180
    add(t0, np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt/.03)*g, pan=rng.uniform(-.4, .4))
for tc in (.4, 3.4, 6.4, 9.4): plop(tc, 1100, .3)
r2 = np.random.default_rng(2)
for k in range(14): plop(.8+r2.random()*13, 1600+r2.random()*1200, .07)
for i, m in enumerate((84, 88, 91, 96)): add(12.85+i*.09, bell(m, .35, .9), pan=-.3+.2*i)
add(13.4, bell(79, .45, 1.6)); add(13.4, bell(84, .3, 1.6), pan=.2)
# soft water ambience
wn = lp(rng.standard_normal(N), 2500); wn /= np.abs(wn).max()
add(0, wn*.018*(1-ss(12.2, 13, t)))

def reverb(x, seed, secs=2.0):
    r = np.random.default_rng(seed); Lr = int(secs*SR)
    ir = lp(r.standard_normal(Lr)*np.exp(-np.arange(Lr)/SR/.5), 7000); ir /= np.sqrt((ir**2).sum())
    n = len(x)+Lr; nf = 1 << (n-1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nf)*np.fft.rfft(ir, nf), nf)[:len(x)]
mix = np.stack([L+reverb(L, 1)*.35, R+reverb(R, 2)*.35], 1)
mix /= np.abs(mix).max(); mix = np.tanh(mix*1.2)/np.tanh(1.2); mix *= 10**(-1.5/20)/np.abs(mix).max()
mix *= (1-ss(14.4, 15, t))[:, None]
with wave.open('audio.wav', 'wb') as o:
    o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((mix*32767).astype('<i2').tobytes())
print('audio ok')
