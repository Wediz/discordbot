import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {EASE, pulse, tween} from '../anim';
import {LightFlash} from '../components/Light';
import {RiseText} from '../components/Reveal';
import {IMAGES, segment, TEXTS} from '../content';
import {COLORS, FONTS} from '../theme';

/** Bascule entre le plan de profil et le plan 3/4. */
const CUT = 78;

/** Fond d'ambiance flou, en parallaxe (se déplace à l'inverse du produit). */
const Ambience: React.FC<{x: number; opacity: number}> = ({x, opacity}) => (
	<AbsoluteFill style={{opacity}}>
		<Img
			src={staticFile(IMAGES.ambience.src)}
			style={{position: 'absolute', width: 1500, height: 1465, left: -210 + x, top: 230, filter: 'brightness(0.55) saturate(0.7)'}}
		/>
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${COLORS.black} 8%, transparent 35%, transparent 62%, ${COLORS.black} 92%)`}} />
	</AbsoluteFill>
);

/**
 * Chaussure révélée par la lumière : une couche sombre (silhouette)
 * et une couche éclairée dévoilée par un masque lumineux qui balaie.
 */
const LitShoe: React.FC<{
	src: string;
	width: number;
	height: number;
	ambient: number;
	beam: number;
	beamAngle?: number;
}> = ({src, width, height, ambient, beam, beamAngle = 100}) => {
	const mask = `linear-gradient(${beamAngle}deg, transparent ${beam - 34}%, black ${beam - 8}%, black ${beam + 4}%, transparent ${beam + 30}%)`;
	const img: React.CSSProperties = {position: 'absolute', inset: 0, width, height};
	return (
		<div style={{position: 'relative', width, height}}>
			<Img src={staticFile(src)} style={{...img, filter: `brightness(${ambient}) contrast(1.08)`}} />
			<Img
				src={staticFile(src)}
				style={{...img, filter: 'brightness(1.9) contrast(1.15)', maskImage: mask, WebkitMaskImage: mask, mixBlendMode: 'screen', opacity: 0.85}}
			/>
		</div>
	);
};

/** 00:04 → 00:10 — Révélation progressive de la chaussure. */
export const ProductReveal: React.FC<{duration?: number}> = ({duration = segment('reveal').duration}) => {
	const frame = useCurrentFrame();

	// ── Plan A : profil, sorti de l'obscurité par un balayage lumineux
	const aW = 1000;
	const aH = (aW * IMAGES.shoeSide.h) / IMAGES.shoeSide.w;
	const aOpacity = tween(frame, [CUT - 2, CUT + 2], [1, 0], EASE.inOut);

	// ── Plan B : 3/4 avant, poussée de caméra et parallaxe
	const b = frame - CUT;
	const bW = 960;
	const bH = (bW * IMAGES.shoe34.h) / IMAGES.shoe34.w;
	const exit = tween(frame, [duration - 14, duration], [0, 1], EASE.in);

	return (
		<AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
			{frame < CUT + 2 ? (
				<AbsoluteFill style={{opacity: aOpacity}}>
					<Ambience x={tween(frame, [0, CUT], [40, -10], EASE.soft)} opacity={tween(frame, [0, 50], [0, 0.45])} />
					{/* Faisceau de lumière en arrière-plan */}
					<AbsoluteFill
						style={{
							opacity: tween(frame, [6, 40], [0, 0.5]),
							background: `radial-gradient(ellipse 50% 22% at ${tween(frame, [0, CUT], [30, 62], EASE.soft)}% 46%, rgba(255,236,214,0.22), transparent 70%)`,
						}}
					/>
					<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', perspective: 1800}}>
						<div
							style={{
								marginTop: -120,
								rotate: `y ${tween(frame, [0, CUT], [-16, 3], EASE.soft)}deg`,
								translate: `${tween(frame, [0, CUT], [60, -30], EASE.soft)}px 0px`,
								scale: `${tween(frame, [0, CUT], [1.08, 1], EASE.soft)}`,
							}}
						>
							<LitShoe
								src={IMAGES.shoeSide.src}
								width={aW}
								height={aH}
								ambient={tween(frame, [4, 70], [0.04, 0.85], EASE.soft)}
								beam={tween(frame, [8, 68], [-20, 125], EASE.inOut)}
							/>
						</div>
					</AbsoluteFill>
					<AbsoluteFill style={{alignItems: 'center', top: 1330}}>
						<RiseText delay={34} style={{fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 64, letterSpacing: '0.42em', marginRight: '-0.42em', color: COLORS.bone}}>
							{TEXTS.brand}
						</RiseText>
					</AbsoluteFill>
				</AbsoluteFill>
			) : null}

			{frame >= CUT - 2 ? (
				<AbsoluteFill style={{opacity: tween(frame, [CUT - 2, CUT + 3], [0, 1], EASE.inOut)}}>
					<Ambience x={tween(b, [0, duration - CUT], [-30, 30], EASE.soft)} opacity={0.4} />
					{/* Lueur de signalisation derrière le produit */}
					<AbsoluteFill
						style={{
							background: `radial-gradient(ellipse 42% 22% at 52% 40%, ${COLORS.orangeGlow}, transparent 70%)`,
							opacity: tween(b, [0, 30], [0, 0.55]),
						}}
					/>
					{/* Ombre au sol */}
					<div
						style={{
							position: 'absolute',
							left: 150,
							width: 780,
							top: 1040,
							height: 90,
							borderRadius: '50%',
							background: 'radial-gradient(ellipse, rgba(0,0,0,0.85), transparent 70%)',
						}}
					/>
					<AbsoluteFill style={{alignItems: 'center', perspective: 1600}}>
						<div
							style={{
								marginTop: 330,
								rotate: `y ${tween(b, [0, duration - CUT], [10, -3], EASE.soft)}deg`,
								translate: `${tween(b, [0, duration - CUT], [-40, 20], EASE.soft)}px ${tween(b, [0, duration - CUT], [20, -10], EASE.soft)}px`,
								scale: `${tween(b, [0, duration - CUT], [1.0, 1.07], EASE.soft) + exit * 0.25}`,
								filter: `blur(${exit * 14}px)`,
							}}
						>
							<LitShoe
								src={IMAGES.shoe34.src}
								width={bW}
								height={bH}
								ambient={tween(b, [0, 20], [1.4, 1], EASE.out)}
								beam={tween(b, [10, 70], [-30, 130], EASE.inOut)}
								beamAngle={120}
							/>
						</div>
					</AbsoluteFill>

					<AbsoluteFill style={{top: 1170, alignItems: 'center', opacity: 1 - exit}}>
						<RiseText delay={CUT + 8} style={{fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 56, letterSpacing: '0.42em', marginRight: '-0.42em', color: COLORS.boneDim}}>
							{TEXTS.brand}
						</RiseText>
						<RiseText delay={CUT + 14} duration={20} style={{fontFamily: FONTS.display, fontSize: 190, lineHeight: 1.0, color: COLORS.bone, marginTop: 6}}>
							{TEXTS.modelTop}
						</RiseText>
						<RiseText delay={CUT + 20} duration={20} style={{fontFamily: FONTS.display, fontSize: 190, lineHeight: 1.0, color: COLORS.bone}}>
							{TEXTS.modelBottom} <span style={{color: COLORS.orange}}>{TEXTS.modelNumber}</span>
						</RiseText>
					</AbsoluteFill>
				</AbsoluteFill>
			) : null}

			<LightFlash at={CUT} before={5} after={10} />
			{/* Petite pulsation de lumière à l'arrivée du titre */}
			<AbsoluteFill style={{background: COLORS.orange, mixBlendMode: 'overlay', opacity: 0.25 * pulse(frame, CUT + 30, CUT + 34, CUT + 44)}} />
		</AbsoluteFill>
	);
};
