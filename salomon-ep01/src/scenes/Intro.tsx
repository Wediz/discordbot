import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {EASE, pulse, tween} from '../anim';
import {Glitch} from '../components/Glitch';
import {DrawLine} from '../components/Reveal';
import {IMAGES, TEXTS} from '../content';
import {COLORS, FONTS} from '../theme';

/** 00:00 → 00:04 — Logo, titre de la série, numéro d'épisode. */
export const Intro: React.FC = () => {
	const frame = useCurrentFrame();
	const logoW = 840;
	const logoH = (logoW * IMAGES.logo.h) / IMAGES.logo.w;

	// Glitch : à l'apparition du logo, une réplique, puis à la sortie.
	const glitch = Math.max(pulse(frame, 15, 18, 26), 0.5 * pulse(frame, 55, 56, 59), pulse(frame, 104, 118, 120));

	const exit = tween(frame, [104, 120], [0, 1], EASE.in);

	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			{/* Halo orange très discret derrière le logo */}
			<AbsoluteFill
				style={{
					opacity: tween(frame, [10, 60], [0, 1]) * 0.9,
					background: `radial-gradient(ellipse 55% 18% at 50% 44%, rgba(255,91,26,0.16), transparent 70%)`,
				}}
			/>

			<AbsoluteFill style={{scale: `${tween(frame, [0, 120], [1.06, 1], EASE.soft) + exit * 0.05}`, opacity: 1 - exit * 0.6}}>
				<Glitch intensity={glitch} seed="intro">
					<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
						{/* Ligne de balayage qui ouvre le logo */}
						<div
							style={{
								position: 'absolute',
								top: 790,
								width: tween(frame, [3, 20], [0, 900], EASE.inOut),
								height: 2,
								background: COLORS.orange,
								boxShadow: `0 0 24px ${COLORS.orange}`,
								opacity: 1 - tween(frame, [24, 36], [0, 1]),
							}}
						/>
						<Img
							src={staticFile(IMAGES.logo.src)}
							style={{
								width: logoW,
								height: logoH,
								marginTop: -40,
								clipPath: `inset(${tween(frame, [14, 38], [50, 0], EASE.out)}% 0 ${tween(frame, [14, 38], [50, 0], EASE.out)}% 0)`,
								filter: `brightness(${tween(frame, [14, 50], [2.4, 1])}) contrast(1.05)`,
							}}
						/>

						<div
							style={{
								marginTop: 80,
								fontFamily: FONTS.condensed,
								fontWeight: 700,
								fontSize: 60,
								color: COLORS.bone,
								letterSpacing: `${tween(frame, [40, 80], [0.5, 0.24])}em`,
								marginRight: `-${tween(frame, [40, 80], [0.5, 0.24])}em`,
								opacity: tween(frame, [40, 58], [0, 1]),
								filter: `blur(${tween(frame, [40, 60], [10, 0])}px)`,
								whiteSpace: 'nowrap',
							}}
						>
							{TEXTS.series}
						</div>

						<div style={{marginTop: 34, display: 'flex', alignItems: 'center', gap: 26}}>
							<DrawLine from={58} width={110} color={COLORS.orange} align="right" />
							<div
								style={{
									fontFamily: FONTS.condensed,
									fontWeight: 700,
									fontSize: 50,
									letterSpacing: '0.3em',
									marginRight: '-0.3em',
									color: COLORS.orange,
									opacity: tween(frame, [60, 72], [0, 1]),
									translate: `0px ${tween(frame, [60, 76], [24, 0])}px`,
								}}
							>
								{TEXTS.episode}
							</div>
							<DrawLine from={58} width={110} color={COLORS.orange} align="left" />
						</div>
					</AbsoluteFill>
				</Glitch>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
