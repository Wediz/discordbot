import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW);
const V = process.env.V === '1';
const mode = process.argv[2] || 'stills';
const out = (mode === 'stills' ? 'stills' : 'frames') + (V ? '_v' : '_h');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: V ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
page.on('pageerror', e => console.log('pageerror:', e.message));
await page.goto('file://' + process.cwd() + '/comp.html' + (V ? '?v=1' : ''));
await page.evaluate(() => window.ready);
const times = mode === 'stills' ? process.argv.slice(3).map(Number) : Array.from({ length: Math.round(10.5 * 30) }, (_, i) => i / 30);
for (const [i, t] of times.entries()) {
  const data = await page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }, t);
  const name = mode === 'stills' ? `s_${t.toFixed(2)}.jpg` : `f_${String(i).padStart(4, '0')}.jpg`;
  fs.writeFileSync(`${out}/${name}`, Buffer.from(data.split(',')[1], 'base64'));
}
await browser.close();
console.log('done', times.length);
