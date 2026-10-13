import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE, tween} from '../anim';
import {SEGMENTS} from '../content';
import {COLORS, FONTS} from '../theme';

/**
 * Sous-titres de la voix off (pour les gens qui regardent sans le son).
 * Textes : voiceover/script.json → "caption".
 */
export const Captions: React.FC = () => {
	const frame = useCurrentFrame();
	for (const seg of SEGMENTS) {
		for (const c of seg.captions) {
			const start = seg.from + c.from;
			const end = start + c.duration;
			if (frame < start || frame >= end) continue;
			const local = frame - start;
			const opacity = tween(local, [0, 4], [0, 1]) * tween(local, [c.duration - 3, c.duration], [1, 0], EASE.in);
			return (
				<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 150, pointerEvents: 'none'}}>
					<div
						style={{
							maxWidth: 920,
							textAlign: 'center',
							fontFamily: FONTS.condensed,
							fontWeight: 700,
							fontSize: 50,
							lineHeight: 1.18,
							color: COLORS.bone,
							background: 'rgba(7, 7, 8, 0.78)',
							borderLeft: `5px solid ${COLORS.orange}`,
							padding: '10px 26px 12px',
							opacity,
							translate: `0px ${tween(local, [0, 6], [12, 0])}px`,
						}}
					>
						{c.text}
					</div>
				</AbsoluteFill>
			);
		}
	}
	return null;
};
