import numpy as np, wave

SR, DUR = 48000, 10.5
N = int(SR*DUR); t = np.arange(N)/SR
rng = np.random.default_rng(4)
def lp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1/SR); X *= 1/np.sqrt(1+(f/fc)**4); return np.fft.irfft(X, len(x))
def hp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1/SR); X *= 1/np.sqrt(1+(fc/np.maximum(f, 1))**4); return np.fft.irfft(X, len(x))
def ss(a, b, x):
    k = np.clip((x-a)/(b-a), 0, 1); return k*k*(3-2*k)
dry = np.zeros(N); fx = np.zeros(N)
def add(buf, t0, sig):
    n0 = int(t0*SR); n1 = min(N, n0+len(sig))
    if n1 > n0: buf[n0:n1] += sig[:n1-n0]
def env(a, d, length):
    tt = np.arange(int(length*SR))/SR; return tt, np.minimum(tt/max(a, 1e-4), 1)*np.exp(-tt/d)
D1, D2, A2 = 36.71, 73.42, 110.0
BEAT = [2.3, 2.85, 3.4, 3.95, 4.5, 5.05]

# drone bed (drops out at the cut to the face, returns on the title)
bed = (np.sin(2*np.pi*D1*t) + .5*np.sin(2*np.pi*D2*t) + .15*np.sin(2*np.pi*A2*t)) * (.3+.4*ss(.7, 1.2, t)) * (1-.6*ss(5.55, 5.62, t)) * (1+.8*ss(7.28, 7.32, t)) * (1-ss(10.1, 10.4, t))
dry += bed*.2
# heartbeat: slow → fast
hb = [.15, .4, 1.0, 1.25, 1.75, 1.95]+[5.7, 5.9, 6.25, 6.45, 6.8, 6.98]
for tb in hb:
    tt, e = env(.004, .08, .4); add(dry, tb, np.sin(2*np.pi*np.cumsum(58-18*tt/.4)/SR)*e*.55)
# REC beep + HUD typing ticks
def beep(t0, f, g=.06, d=.05):
    tt, e = env(.002, d, d*5); add(fx, t0, np.sin(2*np.pi*f*tt)*e*g)
beep(.2, 1174.66)
for k in range(10): beep(.2+k*.08, 2400, .02, .01)
beep(5.75, 587.33, .07); beep(5.83, 880, .06)
for k in range(10): beep(5.75+k*.065, 2400, .02, .01)
# riser into the action
Lr = int(1.0*SR); tt = np.arange(Lr)/SR
add(fx, 1.3, lp(hp(rng.standard_normal(Lr), 400), 7000)*(tt/1.0)**2.5*.25 + np.sin(2*np.pi*np.cumsum(D2*2**(tt*2.5))/SR)*(tt/1.0)**2*.12)
# hits
def hit(t0, g=1.0):
    tt, e = env(.002, .35, 1.6); add(dry, t0, np.sin(2*np.pi*np.cumsum(32+80*np.exp(-tt/.05))/SR)*e*g)
    L2 = int(.3*SR); c = rng.standard_normal(L2)*np.exp(-np.arange(L2)/SR/.03); add(fx, t0, lp(c, 3000)*g*.35)
    L3 = int(.28*SR); w = np.arange(L3)/SR; add(fx, t0-.28, lp(hp(rng.standard_normal(L3), 1200), 6000)*np.sin(np.pi*w/.28)**2*.08*g)
for b in BEAT: hit(b, .95)
# driving bass eighths between the hits
tk = 2.3
while tk < 5.55:
    tt, e = env(.005, .09, .25); add(dry, tk+.1375, np.tanh(3*np.sin(2*np.pi*D2*tt))*e*.12); tk += .275
# metallic stinger on DISPARAÎTRE
tt, e = env(.002, .6, 2.2); add(fx, 5.05, (np.sin(2*np.pi*587.33*tt)+.6*np.sin(2*np.pi*587.33*2.76*tt)+.3*np.sin(2*np.pi*587.33*5.4*tt))*e*.07)
# tension riser to the title
Lr = int(1.6*SR); tt = np.arange(Lr)/SR
add(fx, 5.7, lp(hp(rng.standard_normal(Lr), 800), 9000)*(tt/1.6)**3*.18)
# title: big impact + slash shing + lights-out click
hit(7.3, 1.25)
tt, e = env(.003, .4, 1.8); add(fx, 7.65, (np.sin(2*np.pi*1174.66*tt)+.5*np.sin(2*np.pi*880*tt))*e*.07)
Lc = int(.012*SR); add(fx, 10.15, hp(rng.standard_normal(Lc), 2000)*np.exp(-np.arange(Lc)/SR/.002)*.3)
# voice tag
w = wave.open('whisper.wav'); v = np.frombuffer(w.readframes(w.getnframes()), '<i2')/32768
if w.getnchannels() == 2: v = v.reshape(-1, 2).mean(1)
v = v/np.abs(v).max(); idx = np.where(np.abs(v) > .02)[0]; v = v[max(0, idx[0]-200):idx[-1]+2000]
voice = np.zeros(N); add(voice, 7.85, v*.95)

def reverb(x, seed, secs=2.2):
    r = np.random.default_rng(seed); L = int(secs*SR)
    ir = lp(r.standard_normal(L)*np.exp(-np.arange(L)/SR/.45), 6000); ir /= np.sqrt((ir**2).sum())
    n = len(x)+L; nf = 1 << (n-1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nf)*np.fft.rfft(ir, nf), nf)[:len(x)]
vd = np.convolve(np.abs(voice), np.ones(SR//10)/(SR//10), 'same'); vd = 1-.5*np.clip(vd/(vd.max()+1e-9)*2, 0, 1)
mix = np.stack([hp((dry+fx*.7)*vd+reverb(fx+dry*.2+voice*.08, s)*.45, 28)*.7 + voice*1.0 for s in (1, 2)], 1)
mix /= np.abs(mix).max(); mix = np.tanh(mix*1.6)/np.tanh(1.6); mix *= 10**(-1/20)/np.abs(mix).max()
mix *= (1-ss(10.3, 10.5, t))[:, None]
with wave.open('audio.wav', 'wb') as o:
    o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR); o.writeframes((mix*32767).astype('<i2').tobytes())
print('audio ok')
