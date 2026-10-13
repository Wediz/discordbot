import React, {useId} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/** Grain argentique animé (bruit SVG, change à chaque image). */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
	const frame = useCurrentFrame();
	const id = useId().replace(/:/g, '');
	return (
		<AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
			<svg width="100%" height="100%">
				<filter id={`grain${id}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 17} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#grain${id})`} />
			</svg>
		</AbsoluteFill>
	);
};

/** Vignettage : assombrit les bords pour concentrer le regard. */
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
	<AbsoluteFill
		style={{
			pointerEvents: 'none',
			background: `radial-gradient(ellipse 75% 62% at 50% 50%, transparent 45%, rgba(0,0,0,${strength}) 100%)`,
		}}
	/>
);
