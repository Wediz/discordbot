// Captures de contrôle : node scripts/stills.mjs [image1 image2 ...]
// (par défaut : une image représentative par séquence)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const list = frames.length
	? frames.map((f) => [`f${String(f).padStart(3, '0')}`, f])
	: [
			['1-intro', 90],
			['2-revelation', 250],
			['3-details-design', 345],
			['3-details-mobilite', 425],
			['3-details-terrain', 505],
			['4-hero', 620],
			['5-outro', 735],
		];

const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'SpeedAssault2', browserExecutable});
for (const [name, frame] of list) {
	const output = path.resolve('stills', `${name}.jpg`);
	await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 88, browserExecutable});
	console.log('✔', output);
}
