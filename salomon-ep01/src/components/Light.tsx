import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {pulse} from '../anim';
import {COLORS} from '../theme';

/** Éclair lumineux de transition (surexposition chaude puis retour au noir). */
export const LightFlash: React.FC<{at: number; before?: number; after?: number}> = ({at, before = 4, after = 9}) => {
	const frame = useCurrentFrame();
	const p = pulse(frame, at - before, at, at + after);
	if (p <= 0) return null;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
			<AbsoluteFill
				style={{
					opacity: p,
					background: `radial-gradient(ellipse 80% 45% at 50% 50%, rgba(255,244,228,0.95) 0%, rgba(255,150,90,0.55) 38%, rgba(255,91,26,0.15) 65%, transparent 85%)`,
				}}
			/>
			<AbsoluteFill style={{opacity: p * 0.3, background: COLORS.bone}} />
		</AbsoluteFill>
	);
};

/** Balayage de lumière diagonal (reflet qui traverse l'image). */
export const LightSweep: React.FC<{from: number; duration: number; opacity?: number; angle?: number}> = ({
	from,
	duration,
	opacity = 0.35,
	angle = 115,
}) => {
	const frame = useCurrentFrame();
	const t = (frame - from) / duration;
	if (t < 0 || t > 1) return null;
	const pos = -30 + t * 160;
	return (
		<AbsoluteFill
			style={{
				pointerEvents: 'none',
				mixBlendMode: 'screen',
				opacity,
				background: `linear-gradient(${angle}deg, transparent ${pos - 18}%, rgba(255,240,220,0.9) ${pos}%, transparent ${pos + 18}%)`,
			}}
		/>
	);
};
