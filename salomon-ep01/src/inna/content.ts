/**
 * ─── INNA SHOP · PROGRAMME FIDÉLITÉ & PARRAINAGE : FICHIER À MODIFIER ───
 * Vidéo verticale 1080×1920 (stories / Reels / TikTok), 30 images/s, 20 s.
 * Musique à 120 BPM : 1 temps = 15 images.
 * Les chiffres reprennent le programme Smile affiché sur inna-shops.com.
 */

export const LOGO = 'assets/inna/logo-inna-shop.png';
export const WEBSITE = 'inna-shops.com';
export const BUTTON = 'FIDÉLITÉ';

/** Comment gagner des points */
export const EARN = {
	title: 'Gagne des points',
	main: {left: '1 €', right: '1 point'},
	ways: [
		{label: 'Inscription', points: '+10', icon: 'star'},
		{label: 'Instagram', points: '+20', icon: 'camera'},
		{label: 'TikTok', points: '+20', icon: 'note'},
		{label: 'Anniversaire', points: '+40', icon: 'cake'},
	],
};

/** Comment échanger des points */
export const REDEEM = {
	title: 'Transforme-les',
	subtitle: 'en réductions',
	vouchers: [
		{points: '500 points', value: '5 €'},
		{points: '1000 points', value: '12 €'},
	],
};

/** Parrainage (mis en avant) */
export const REFERRAL = {
	kicker: 'Le meilleur pour la fin…',
	script: 'Parraine',
	title: 'tes copines',
	you: 'Toi',
	friend: 'Ta copine',
	link: 'Ton lien de parrainage',
	share: 'Partager',
	friendGets: {big: '-10 %', small: 'sur sa commande'},
	youGet: {big: '5 € offerts', small: 'dès qu’elle commande'},
	together: 'Plus on est de copines, plus on est gâtées',
};

export const CTA = {
	line: 'Rendez-vous sur',
	hint: 'Clique sur le bouton',
};

export const BEAT = 15;
export const DURATION = 600;

/** Découpage (en images) */
export const S = {
	intro: 0,
	earn: 90,
	redeem: 210,
	referral: 300,
	cta: 510,
};

export const C = {
	cream: '#FBF5EF',
	blush: '#F7DCDD',
	rose: '#E7A3B1',
	roseDeep: '#D27F92',
	latte: '#C9A27E',
	caramel: '#8B6A4E',
	cocoa: '#4A3426',
	gold: '#D4AF6A',
	white: '#FFFFFF',
};
