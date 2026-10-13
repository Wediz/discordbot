import React from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, tween} from '../anim';

/**
 * Texte qui monte depuis un masque (révélation éditoriale),
 * avec une traînée de flou de mouvement pendant la montée.
 */
export const RiseText: React.FC<{
	delay: number;
	duration?: number;
	exitAt?: number;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({delay, duration = 18, exitAt, style, children}) => {
	const frame = useCurrentFrame();
	const y = (f: number) => tween(f, [delay, delay + duration], [108, 0], EASE.out);
	const exit = exitAt === undefined ? 0 : tween(frame, [exitAt, exitAt + 10], [0, -108], EASE.in);
	const ghosts = [2, 1];
	return (
		<div style={{overflow: 'hidden', position: 'relative', paddingTop: '0.04em', ...style}}>
			{ghosts.map((g) => (
				<div
					key={g}
					aria-hidden
					style={{position: 'absolute', inset: 0, paddingTop: '0.04em', translate: `0px ${y(frame - g * 0.9) + exit}%`, opacity: 0.18 / g}}
				>
					{children}
				</div>
			))}
			<div style={{translate: `0px ${y(frame) + exit}%`}}>{children}</div>
		</div>
	);
};

/** Ligne fine qui se trace (annotations, soulignements). */
export const DrawLine: React.FC<{
	from: number;
	duration?: number;
	width: number;
	color: string;
	thickness?: number;
	align?: 'left' | 'right' | 'center';
	style?: React.CSSProperties;
}> = ({from, duration = 14, width, color, thickness = 3, align = 'left', style}) => {
	const frame = useCurrentFrame();
	const p = tween(frame, [from, from + duration], [0, 1], EASE.inOut);
	const origin = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
	return (
		<div style={{width, height: thickness, background: color, scale: `${p} 1`, transformOrigin: origin, ...style}} />
	);
};
