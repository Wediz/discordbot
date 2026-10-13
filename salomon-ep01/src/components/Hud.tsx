import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {tween} from '../anim';
import {TEXTS, TIMING} from '../content';
import {COLORS, FONTS} from '../theme';

const mono: React.CSSProperties = {
	fontFamily: FONTS.mono,
	fontWeight: 500,
	fontSize: 24,
	letterSpacing: '0.14em',
	color: COLORS.boneDim,
};

const Corner: React.FC<{style: React.CSSProperties; flip: [number, number]}> = ({style, flip}) => (
	<div style={{position: 'absolute', width: 56, height: 56, ...style, scale: `${flip[0]} ${flip[1]}`}}>
		<div style={{position: 'absolute', left: 0, top: 0, width: 56, height: 3, background: COLORS.boneFaint}} />
		<div style={{position: 'absolute', left: 0, top: 0, width: 3, height: 56, background: COLORS.boneFaint}} />
	</div>
);

/** Interface tactique : coins de cadrage, repère, minutage, progression. */
export const Hud: React.FC<{from: number; to: number}> = ({from, to}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const opacity = tween(frame, [from, from + 12], [0, 1]) * tween(frame, [to - 8, to], [1, 0]);
	if (opacity <= 0) return null;

	const s = Math.floor(frame / fps);
	const ff = String(frame % fps).padStart(2, '0');
	const tc = `00:00:${String(s).padStart(2, '0')}:${ff}`;

	const bounds = [
		TIMING.intro,
		TIMING.intro + TIMING.reveal,
		TIMING.intro + TIMING.reveal + TIMING.details,
		TIMING.intro + TIMING.reveal + TIMING.details + TIMING.hero,
	];
	const segment = bounds.filter((b) => frame >= b).length - 1;

	return (
		<AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
			<Corner style={{left: 40, top: 40}} flip={[1, 1]} />
			<Corner style={{right: 40, top: 40}} flip={[-1, 1]} />
			<Corner style={{left: 40, bottom: 40}} flip={[1, -1]} />
			<Corner style={{right: 40, bottom: 40}} flip={[-1, -1]} />
			<div style={{...mono, position: 'absolute', left: 112, top: 58}}>{TEXTS.hudLeft}</div>
			<div style={{...mono, position: 'absolute', right: 112, top: 58, display: 'flex', alignItems: 'center', gap: 12}}>
				<span style={{width: 12, height: 12, borderRadius: 6, background: COLORS.orange, opacity: frame % 30 < 18 ? 1 : 0.25}} />
				{tc}
			</div>
			<div style={{position: 'absolute', left: 112, right: 112, bottom: 70, display: 'flex', gap: 10}}>
				{[0, 1, 2].map((i) => (
					<div key={i} style={{flex: 1, height: 4, background: i <= segment ? COLORS.orange : COLORS.boneFaint, opacity: i === segment ? 1 : 0.6}} />
				))}
			</div>
		</AbsoluteFill>
	);
};
