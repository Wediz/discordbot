import numpy as np, wave, json, sys
voice = sys.argv[1]; upto = int(sys.argv[2]) if len(sys.argv) > 2 else 99
lines = json.load(open('lines.json'))[:upto]
# pause after each line (seconds): slow, deliberate delivery
gaps = [0.3, 0.8, 0.22, 0.22, 0.22, 0.5, 0.7, 0.5, 0.6, 0.8, 0.45, 0.9, 0.55, 0][:len(lines)]
start = 1.6; out = []; tl = []; t = start; SR = None
for i, g in enumerate(gaps):
    w = wave.open(f'{voice}_{i:02d}.wav'); SR = w.getframerate()
    a = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
    env = np.convolve(np.abs(a), np.ones(SR//100)/(SR//100), 'same'); idx = np.where(env > 0.02)[0]
    a = a[max(0, idx[0]-SR//30): idx[-1]+SR//20]
    tl.append({'t0': round(t, 3), 't1': round(t + len(a)/SR, 3), 'text': lines[i]['text']})
    out.append((t, a)); t += len(a)/SR + g
total = t
buf = np.zeros(int((total + 1.5) * SR))
for t0, a in out: n = int(t0*SR); buf[n:n+len(a)] += a
with wave.open(f'vo_raw_{voice}.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(buf, -1, 1)*32767).astype('<i2').tobytes())
json.dump({'lines': tl, 'vo_end': round(total, 3)}, open(f'timeline_{voice}.json', 'w'), ensure_ascii=False, indent=1)
print(voice, 'vo_end', round(total, 2))
