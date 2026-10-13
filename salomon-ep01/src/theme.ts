import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const COLORS = {
	black: '#070708',
	coal: '#111214',
	anthracite: '#1F2023',
	steel: '#3B3D42',
	bone: '#ECE6DA',
	boneDim: 'rgba(236, 230, 218, 0.62)',
	boneFaint: 'rgba(236, 230, 218, 0.22)',
	orange: '#FF5B1A',
	orangeGlow: 'rgba(255, 91, 26, 0.35)',
};

export const FONTS = {
	display: 'Anton',
	condensed: 'Barlow Condensed',
	mono: 'JetBrains Mono',
};

// Polices locales (public/fonts) : aucun appel réseau au rendu.
loadFont({family: FONTS.display, url: staticFile('fonts/anton-latin-400-normal.woff2'), weight: '400'});
loadFont({family: FONTS.condensed, url: staticFile('fonts/barlow-condensed-latin-500-normal.woff2'), weight: '500'});
loadFont({family: FONTS.condensed, url: staticFile('fonts/barlow-condensed-latin-700-normal.woff2'), weight: '700'});
loadFont({family: FONTS.mono, url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
