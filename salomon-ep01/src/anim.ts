import {Easing, interpolate} from 'remotion';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Courbes de mouvement de la pub (sorties franches, arrivées amorties). */
export const EASE = {
	out: Easing.bezier(0.16, 1, 0.3, 1),
	inOut: Easing.bezier(0.7, 0, 0.2, 1),
	in: Easing.bezier(0.6, 0, 0.9, 0.4),
	soft: Easing.bezier(0.33, 0, 0.2, 1),
};

/** interpolate() bornée, avec une courbe optionnelle. */
export const tween = (
	frame: number,
	input: [number, number],
	output: [number, number],
	easing: (t: number) => number = EASE.out,
) => interpolate(frame, input, output, {...CLAMP, easing});

/** Cloche 0 → 1 → 0 (flashs, glitchs). */
export const pulse = (frame: number, start: number, peak: number, end: number) =>
	interpolate(frame, [start, peak, end], [0, 1, 0], CLAMP);
