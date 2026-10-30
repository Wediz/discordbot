/**
 * ─── INTRO URBEX-FRANCE.COM : FICHIER À MODIFIER ───────────────────────
 * Textes, images et rythme de l'intro (9:16, 30 images/s).
 * 1 temps musical = 18 images (100 BPM) : les coupes tombent sur le temps.
 */

export const BEAT = 18;

export const LOGO = {src: 'assets/brand/logo-urbex-fr.png'};

/** Images d'ambiance (public/assets/urbex, issues de pub-urbex/work/img). */
const img = (n: string) => `assets/urbex/${n}.jpg`;

export const WARNING = {
	kicker: 'AVERTISSEMENT',
	lines: ["L'URBEX EST UNE", 'PRATIQUE', 'DANGEREUSE'],
};

/** Les risques : 2 temps chacun. */
export const DANGERS = [
	{words: ['BÂTIMENTS', 'INSTABLES'], image: img('03')},
	{words: ['SOLS QUI', 'CÈDENT'], image: img('02')},
	{words: ['PROPRIÉTÉS', 'PRIVÉES'], image: img('01')},
	{words: ['OBSCURITÉ', 'TOTALE'], image: img('10')},
];

export const RULES_TITLE = "LE CODE DE L'EXPLORATEUR";

/** Les règles : 2 temps chacune. */
export const RULES = [
	{words: ['JAMAIS', 'SEUL'], image: img('12')},
	{words: ['JAMAIS', "D'EFFRACTION"], image: img('14')},
	{words: ['NE PRENDS QUE', 'DES PHOTOS'], image: img('13')},
];

export const BRAND = {
	website: 'URBEX-FRANCE.COM',
	/**
	 * ⚠️ « La plus grande communauté » n'est autorisé en pub que si tu peux le
	 * prouver (chiffres à l'appui). Sinon, garde une formulation non comparative.
	 */
	tagline: ['LA COMMUNAUTÉ', 'URBEX FRANCOPHONE'],
	features: ['CARTE INTERACTIVE', 'CHAT & SALONS', 'NIVEAUX & TITRES', 'SUR MOBILE'],
	cta: 'REJOINS LA COMMUNAUTÉ',
	/** Images qui défilent derrière le logo. */
	montage: [img('08'), img('09'), img('11'), img('04'), img('05'), img('06')],
};

/** Découpage (en images). */
export const T = {
	warning: 0, // 0 s : avertissement
	dangers: 6 * BEAT, // 3,6 s
	rules: 6 * BEAT + DANGERS.length * 2 * BEAT, // 8,4 s
	blackout: 6 * BEAT + DANGERS.length * 2 * BEAT + RULES.length * 2 * BEAT, // 12 s
	logo: 0, // calculé ci-dessous
	brand: 0,
	end: 0,
};
T.logo = T.blackout + 2 * BEAT; // la lampe s'allume
T.brand = T.logo + 4 * BEAT; // le site
T.end = T.brand + 10 * BEAT; // fin
