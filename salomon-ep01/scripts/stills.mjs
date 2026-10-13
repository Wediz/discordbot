// Captures de contrôle : node scripts/stills.mjs [image1 image2 ...]
// (par défaut : une image par séquence)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
// Par défaut : une image vers les 2/3 de chaque séquence (montage dans src/generated/timeline.json).
const timeline = JSON.parse(fs.readFileSync(path.resolve('src/generated/timeline.json'), 'utf8'));
const list = frames.length
	? frames.map((f) => [`f${String(f).padStart(4, '0')}`, f])
	: timeline.segments.map((s, i) => [`${String(i + 1).padStart(2, '0')}-${s.id}`, s.from + Math.round(s.duration * 0.66)]);

const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'SpeedAssault2', browserExecutable});
for (const [name, frame] of list) {
	const output = path.resolve('stills', `${name}.jpg`);
	await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 88, browserExecutable});
	console.log('✔', output);
}
