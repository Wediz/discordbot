/**
 * ─── INTRO URBEX-FRANCE.COM : FICHIER À MODIFIER ───────────────────────
 * Textes, images et rythme de l'intro (YouTube 16:9, 1920×1080, 30 images/s).
 * 1 temps musical = 18 images (100 BPM) : les coupes tombent sur le temps.
 */

export const BEAT = 18;

export const LOGO = {src: 'assets/brand/logo-urbex-fr.png'};

/** Fond unique « lieu abandonné », généré par scripts/make_wall.py. */
export const WALL = 'assets/urbex/wall.jpg';

export const WARNING = {
	kicker: 'AVERTISSEMENT',
	lines: ["L'URBEX EST UNE", 'PRATIQUE', 'DANGEREUSE'],
};

/** Les risques : 2 temps chacun. */
export const DANGERS = [
	{words: ['BÂTIMENTS', 'INSTABLES']},
	{words: ['SOLS QUI', 'CÈDENT']},
	{words: ['PROPRIÉTÉS', 'PRIVÉES']},
	{words: ['OBSCURITÉ', 'TOTALE']},
];

export const RULES_TITLE = "LE CODE DE L'EXPLORATEUR";

/** Les règles : 2 temps chacune. */
export const RULES = [
	{words: ['JAMAIS', 'SEUL']},
	{words: ['JAMAIS', "D'EFFRACTION"]},
	{words: ['NE PRENDS QUE', 'DES PHOTOS']},
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
