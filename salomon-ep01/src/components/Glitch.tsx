import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

/**
 * Glitch numérique discret : décalage RVB + tranches horizontales.
 * `intensity` = 0 → rendu normal (aucun coût).
 */
export const Glitch: React.FC<{
	intensity: number;
	seed?: string;
	children: React.ReactNode;
}> = ({intensity, seed = 'g', children}) => {
	const frame = useCurrentFrame();
	if (intensity <= 0.01) {
		return <AbsoluteFill>{children}</AbsoluteFill>;
	}

	// Change de motif toutes les 2 images : saccadé mais lisible.
	const step = Math.floor(frame / 2);
	const r = (k: string) => random(`${seed}-${step}-${k}`);
	const split = 14 * intensity;

	const slices = Array.from({length: 4}, (_, i) => {
		const top = r(`t${i}`) * 92;
		const height = 1.5 + r(`h${i}`) * 7;
		const shift = (r(`s${i}`) - 0.5) * 90 * intensity;
		return {top, height, shift};
	});

	return (
		<AbsoluteFill>
			<AbsoluteFill style={{translate: `${-split}px 0px`, opacity: 0.7, mixBlendMode: 'screen', filter: 'sepia(1) saturate(9) hue-rotate(-45deg) brightness(0.9)'}}>
				{children}
			</AbsoluteFill>
			<AbsoluteFill style={{translate: `${split}px 0px`, opacity: 0.55, mixBlendMode: 'screen', filter: 'sepia(1) saturate(7) hue-rotate(150deg) brightness(0.9)'}}>
				{children}
			</AbsoluteFill>
			<AbsoluteFill style={{mixBlendMode: 'normal'}}>{children}</AbsoluteFill>
			{slices.map((s, i) => (
				<AbsoluteFill
					key={i}
					style={{
						clipPath: `inset(${s.top}% 0 ${Math.max(0, 100 - s.top - s.height)}% 0)`,
						translate: `${s.shift}px 0px`,
					}}
				>
					{children}
				</AbsoluteFill>
			))}
		</AbsoluteFill>
	);
};
