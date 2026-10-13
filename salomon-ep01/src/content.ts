/**
 * ─── FICHIER À MODIFIER ───────────────────────────────────────────────
 * Textes à l'écran, images, cadrages et volumes de la pub.
 *
 * - Texte de la voix off et sous-titres : voiceover/script.json
 * - Durées : calculées automatiquement d'après la voix
 *   (scripts/build_audio.py → src/generated/timeline.json).
 */
import timeline from './generated/timeline.json';

export const FPS = 30;

export type Segment = {
	id: string;
	from: number;
	duration: number;
	vo: {file: string | null; from: number; duration: number; estimated: boolean};
	captions: {text: string; from: number; duration: number}[];
};
export const SEGMENTS = timeline.segments as unknown as Segment[];
export const TOTAL_FRAMES = timeline.total;
export const segment = (id: string): Segment => {
	const s = SEGMENTS.find((x) => x.id === id);
	if (!s) throw new Error(`Séquence inconnue : ${id}`);
	return s;
};

/** Volumes (1 = normal). */
export const VOLUME = {
	voice: 1,
	music: 0.5,
	sfx: 0.75,
};

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
	website: 'URBEX-FRANCE.COM',
	hudLeft: 'URBEX FRANCE // MAT-01',
};

export type ImageRef = (typeof IMAGES)[keyof typeof IMAGES];

export type Feature = {
	/** Identifiant de la séquence dans voiceover/script.json */
	id: string;
	title: string;
	/** Données de la fiche officielle Salomon. */
	specs: string[];
	label: string;
	image: ImageRef;
	/** Caméra simulée : point visé (pixels de l'image) et zoom, début → fin. */
	camFrom: {x: number; y: number; zoom: number};
	camTo: {x: number; y: number; zoom: number};
	/** Point annoté (pixels de l'image). */
	target: {x: number; y: number};
};

/** Les 6 caractéristiques, dans l'ordre de la vidéo. */
export const FEATURES: Feature[] = [
	{
		id: 'grip',
		title: 'ACCROCHE',
		specs: ['MUD CONTAGRIP', 'CRAMPONS PROFONDS'],
		label: 'FIG.01 — SEMELLE',
		image: IMAGES.shoeSide,
		camFrom: {x: 620, y: 390, zoom: 1.2},
		camTo: {x: 820, y: 440, zoom: 1.45},
		target: {x: 760, y: 690},
	},
	{
		id: 'cushion',
		title: 'AMORTI',
		specs: ['ENERGYCELL', 'DROP 4 MM'],
		label: 'FIG.02 — MOUSSE',
		image: IMAGES.shoeSide,
		camFrom: {x: 520, y: 340, zoom: 1.05},
		camTo: {x: 380, y: 390, zoom: 1.22},
		target: {x: 330, y: 615},
	},
	{
		id: 'debris',
		title: 'ANTI-DÉBRIS',
		specs: ['LANGUETTE À SOUFFLET', 'MESH ANTI-DÉBRIS'],
		label: 'FIG.03 — LANGUETTE',
		image: IMAGES.shoe34,
		camFrom: {x: 420, y: 280, zoom: 1.15},
		camTo: {x: 400, y: 200, zoom: 1.38},
		target: {x: 330, y: 140},
	},
	{
		id: 'laces',
		title: 'LAÇAGE RAPIDE',
		specs: ['QUICKLACE', 'POCHE À LACET'],
		label: 'FIG.04 — LAÇAGE',
		image: IMAGES.shoe34,
		camFrom: {x: 470, y: 380, zoom: 1.12},
		camTo: {x: 420, y: 280, zoom: 1.34},
		target: {x: 500, y: 330},
	},
	{
		id: 'stealth',
		title: 'DISCRÉTION',
		specs: ['NON RÉFLÉCHISSANT', 'TOUT NOIR'],
		label: 'FIG.05 — MATIÈRES',
		image: IMAGES.heroScene,
		camFrom: {x: 470, y: 400, zoom: 1.32},
		camTo: {x: 540, y: 400, zoom: 1.5},
		target: {x: 420, y: 330},
	},
	{
		id: 'weight',
		title: 'LÉGÈRETÉ',
		specs: ['≈ 320 G', 'TIGE MI-MONTANTE'],
		label: 'FIG.06 — TIGE',
		image: IMAGES.shoeSide,
		camFrom: {x: 650, y: 380, zoom: 0.7},
		camTo: {x: 620, y: 360, zoom: 0.8},
		target: {x: 300, y: 140},
	},
];
