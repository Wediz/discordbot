import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {EASE, pulse, tween} from '../anim';
import {Glitch} from '../components/Glitch';
import {LightSweep} from '../components/Light';
import {DrawLine, RiseText} from '../components/Reveal';
import {IMAGES, TEXTS} from '../content';
import {COLORS, FONTS} from '../theme';

/** 00:18 → 00:22 — Grande photo, composition épurée, typographie massive. */
export const Hero: React.FC = () => {
	const frame = useCurrentFrame();
	const w = 1080;
	const h = (w * IMAGES.heroScene.h) / IMAGES.heroScene.w;
	const bandTop = 560;

	// Ouverture verticale depuis une ligne centrale.
	const open = tween(frame, [0, 22], [50, 0], EASE.out);
	const glitch = pulse(frame, 104, 116, 120);

	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<Glitch intensity={glitch} seed="hero">
				<AbsoluteFill>
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: bandTop,
							width: w,
							height: h,
							overflow: 'hidden',
							clipPath: `inset(${open}% 0 ${open}% 0)`,
						}}
					>
						<Img
							src={staticFile(IMAGES.heroScene.src)}
							style={{
								width: w,
								height: h,
								scale: `${tween(frame, [0, 120], [1.16, 1.04], EASE.soft)}`,
								translate: `${tween(frame, [0, 120], [24, -16], EASE.soft)}px 0px`,
								filter: `brightness(${tween(frame, [0, 18], [1.8, 1])}) contrast(1.08) saturate(0.85)`,
							}}
						/>
						<LightSweep from={34} duration={46} opacity={0.28} />
						{/* Fondu des bords dans le noir */}
						<AbsoluteFill
							style={{
								background: `linear-gradient(180deg, ${COLORS.black} 0%, transparent 18%, transparent 80%, ${COLORS.black} 100%)`,
							}}
						/>
					</div>
					{/* Lignes de scan orange qui ouvrent l'image */}
					{[-1, 1].map((dir) => (
						<div
							key={dir}
							style={{
								position: 'absolute',
								left: 0,
								width: w,
								height: 3,
								top: bandTop + h / 2 + dir * (h / 2) * (1 - (open / 50)),
								background: COLORS.orange,
								boxShadow: `0 0 20px ${COLORS.orange}`,
								opacity: 1 - tween(frame, [18, 30], [0, 1]),
							}}
						/>
					))}

					{/* Titre massif */}
					<AbsoluteFill style={{alignItems: 'center', top: 225}}>
						<RiseText
							delay={10}
							duration={22}
							style={{
								fontFamily: FONTS.display,
								fontSize: 300,
								lineHeight: 1,
								color: COLORS.bone,
								letterSpacing: `${tween(frame, [10, 60], [0.08, 0.01])}em`,
								marginRight: `-${tween(frame, [10, 60], [0.08, 0.01])}em`,
							}}
						>
							{TEXTS.modelTop}
						</RiseText>
					</AbsoluteFill>
					<AbsoluteFill style={{alignItems: 'center', top: bandTop + h + 10}}>
						<RiseText delay={18} duration={22} style={{fontFamily: FONTS.display, fontSize: 210, lineHeight: 1, color: COLORS.bone}}>
							{TEXTS.modelBottom} <span style={{color: COLORS.orange}}>{TEXTS.modelNumber}</span>
						</RiseText>
						<div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 26}}>
							<DrawLine from={36} width={90} color={COLORS.orange} align="right" />
							<div
								style={{
									fontFamily: FONTS.condensed,
									fontWeight: 700,
									fontSize: 46,
									letterSpacing: '0.42em',
									marginRight: '-0.42em',
									color: COLORS.boneDim,
									opacity: tween(frame, [38, 50], [0, 1]),
								}}
							>
								{TEXTS.brand}
							</div>
							<DrawLine from={36} width={90} color={COLORS.orange} align="left" />
						</div>
					</AbsoluteFill>
				</AbsoluteFill>
			</Glitch>
		</AbsoluteFill>
	);
};
