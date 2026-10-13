/**
 * ─── FICHIER À MODIFIER ───────────────────────────────────────────────
 * Tous les textes, images et durées de la pub sont ici.
 * Les autres fichiers n'ont normalement pas besoin d'être touchés.
 */

export const FPS = 30;

/** Durée de chaque séquence, en images (30 images = 1 seconde). */
export const TIMING = {
	intro: 120, // 0 s → 4 s
	reveal: 180, // 4 s → 10 s
	details: 240, // 10 s → 18 s (3 détails de 80 images)
	hero: 120, // 18 s → 22 s
	outro: 90, // 22 s → 25 s
};

export const TOTAL_FRAMES =
	TIMING.intro + TIMING.reveal + TIMING.details + TIMING.hero + TIMING.outro;

/** Images (dossier public/). Régénérées par scripts/prepare_assets.py. */
export const IMAGES = {
	logo: {src: 'assets/logo-urbex-france.png', w: 675, h: 212},
	shoeSide: {src: 'assets/shoe-side-cut.png', w: 1300, h: 716},
	shoe34: {src: 'assets/shoe-34-cut.png', w: 1296, h: 980},
	heroScene: {src: 'assets/hero-scene.jpg', w: 1024, h: 795},
	ambience: {src: 'assets/ambience-blur.jpg', w: 1024, h: 1000},
};

export const TEXTS = {
	series: 'PRÉSENTATION MATÉRIEL',
	episode: 'ÉPISODE 01',
	brand: 'SALOMON',
	modelTop: 'SPEED',
	modelBottom: 'ASSAULT',
	modelNumber: '2',
	outroLine: 'PRÉSENTATION MATÉRIEL',
	outroEpisode: 'EP. 01',
	hudLeft: 'URBEX FRANCE // MAT-01',
};

export type ImageRef = (typeof IMAGES)[keyof typeof IMAGES];

export type Detail = {
	word: string;
	/** Constat visible sur la photo, sans promesse de performance. */
	note: string;
	label: string;
	image: ImageRef;
	/** Caméra simulée : point visé (pixels de l'image) et zoom, début → fin. */
	camFrom: {x: number; y: number; zoom: number};
	camTo: {x: number; y: number; zoom: number};
	/** Point annoté (pixels de l'image). */
	target: {x: number; y: number};
};

export const DETAILS: Detail[] = [
	{
		word: 'DESIGN TACTIQUE',
		note: 'Tige entièrement noire, logos ton sur ton',
		label: 'FIG.01 — TIGE',
		image: IMAGES.shoeSide,
		camFrom: {x: 330, y: 410, zoom: 1.15},
		camTo: {x: 460, y: 395, zoom: 1.32},
		target: {x: 268, y: 432},
	},
	{
		word: 'MOBILITÉ',
		note: 'Tige montante, laçage par cordon fin',
		label: 'FIG.02 — LAÇAGE',
		image: IMAGES.shoe34,
		camFrom: {x: 470, y: 380, zoom: 1.12},
		camTo: {x: 420, y: 280, zoom: 1.34},
		target: {x: 500, y: 330},
	},
	{
		word: 'TERRAIN',
		note: "Semelle crantée, pare-pierre à l'avant",
		label: 'FIG.03 — SEMELLE',
		image: IMAGES.shoe34,
		camFrom: {x: 900, y: 690, zoom: 1.12},
		camTo: {x: 1000, y: 735, zoom: 1.34},
		target: {x: 1060, y: 905},
	},
];
