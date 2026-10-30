import {z} from 'zod';

/**
 * ─── HUD URBEX : RÉGLAGES À MODIFIER ───────────────────────────────────
 * Chaque jauge suit une liste de points { t: secondes, v: valeur }.
 * Entre deux points, la valeur glisse en douceur.
 *
 * Exemple : peur qui monte d'un coup à 12 s puis redescend :
 *   peur: [{t: 0, v: 10}, {t: 11, v: 20}, {t: 12, v: 90}, {t: 20, v: 30}]
 *
 * Ces réglages sont aussi modifiables dans Remotion Studio (npm run studio →
 * composition HudUrbex → panneau « Props » à droite).
 */

const point = z.object({t: z.number().min(0), v: z.number()});

export const hudSchema = z.object({
	dureeSecondes: z.number().min(3).max(1200),
	lieu: z.string(),
	sousTitreLieu: z.string(),
	heureDepart: z.string().describe('Heure affichée au début, format HH:MM'),
	/** 0 à 100 */
	peur: z.array(point),
	/** Battements par minute (60 à 190) */
	stress: z.array(point),
	/** 0 à 100 % */
	batterie: z.array(point),
	alertes: z.array(z.object({t: z.number().min(0), duree: z.number().min(0.5), texte: z.string()})),
	afficher: z.object({
		rec: z.boolean(),
		heure: z.boolean(),
		lieu: z.boolean(),
		peur: z.boolean(),
		stress: z.boolean(),
		batterie: z.boolean(),
		/** Bords de l'écran qui rougissent quand la peur dépasse 70 */
		effetPeur: z.boolean(),
	}),
});

export type HudProps = z.infer<typeof hudSchema>;

/** Valeurs par défaut : une petite « histoire » de 30 s pour la démo. */
export const HUD_DEFAULT: HudProps = {
	dureeSecondes: 30,
	lieu: 'SANATORIUM ABANDONNÉ',
	sousTitreLieu: 'AILE NORD — SOUS-SOL',
	heureDepart: '02:47',
	peur: [
		{t: 0, v: 12},
		{t: 9, v: 25},
		{t: 12, v: 88},
		{t: 16, v: 70},
		{t: 24, v: 35},
		{t: 30, v: 28},
	],
	stress: [
		{t: 0, v: 78},
		{t: 11, v: 86},
		{t: 12.5, v: 148},
		{t: 18, v: 120},
		{t: 30, v: 92},
	],
	batterie: [
		{t: 0, v: 64},
		{t: 20, v: 41},
		{t: 26, v: 18},
		{t: 30, v: 12},
	],
	alertes: [
		{t: 12, duree: 3, texte: 'BRUIT SUSPECT'},
		{t: 26, duree: 3, texte: 'BATTERIE FAIBLE'},
	],
	afficher: {rec: true, heure: true, lieu: true, peur: true, stress: true, batterie: true, effetPeur: true},
};
