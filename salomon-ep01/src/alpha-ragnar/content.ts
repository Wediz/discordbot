/**
 * ─── INTRO ALPHA RAGNAR : FICHIER À MODIFIER ───────────────────────────
 * YouTube 16:9 (1920×1080), 30 images/s, 15 s.
 * Rythme : tambours à 90 BPM → 1 temps = 20 images.
 */

/**
 * Logo : quand tu l'as, dépose-le dans public/assets/ragnar/ et indique son
 * chemin ici, ex. {src: 'assets/ragnar/logo-alpha-ragnar.png'}.
 * Sans logo, l'emblème est la rune ᚱ (Raidho = « le voyage »).
 */
export const LOGO: {src: string} | null = null;

/**
 * Personnage révélé par l'éclair (photo fournie + silhouette générée par
 * scripts/make_ragnar_assets.py). Mettre null pour l'enlever.
 * head = position de sa tête dans l'image (1920×1080) : elle est placée au
 * centre de l'anneau de runes, sa lampe frontale prend la place de la rune.
 */
export const CHARACTER: {src: string; matte: string; head: {x: number; y: number}; scale: number} | null = {
	src: 'assets/ragnar/personnage.jpg',
	matte: 'assets/ragnar/personnage-matte.png',
	head: {x: 902, y: 288},
	scale: 1.08,
};

export const TITLE = ['ALPHA', 'RAGNAR'];
export const SUBTITLE = 'URBEX';

/** Mots « subliminaux » pendant la montée des tambours. */
export const WORDS = ['LIEUX OUBLIÉS', 'TERRES INTERDITES', 'SANS PEUR'];

/** Les 24 runes du Futhark ancien (anneau autour de l'emblème). */
export const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
export const EMBLEM_RUNE = 'ᚱ';

export const BEAT = 20;
export const DURATION = 450;

/** Moments clés (en images). */
export const T = {
	cracks: 30, // les fissures s'allument
	ring: 60, // l'anneau de runes se dessine
	words: [72, 100, 124],
	strike: 150, // ÉCLAIR
	letters: 168, // le titre se forge, lettre par lettre
	letterGap: 6,
	sheen: 246, // reflet sur le métal
	slash: 262, // la lame révèle « URBEX »
	echo: 345, // éclair lointain
	final: 390, // dernier impact
	fadeOut: 422,
};

export const COLORS = {
	bg: '#04060A',
	ice: '#A7DCFF',
	iceDeep: '#2D6FB7',
	ember: '#FF7A1A',
	gold: '#E9B44C',
	steel: '#E9EEF2',
};
