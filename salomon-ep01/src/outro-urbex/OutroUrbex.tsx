import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {EASE, pulse, tween} from '../anim';
import {Glitch} from '../components/Glitch';
import {Grain, Vignette} from '../components/Grain';
import {DrawLine, RiseText} from '../components/Reveal';
import {HazardTape, Wall} from '../intro-urbex/IntroUrbex';
import {COLORS, FONTS} from '../theme';

/**
 * ─── OUTRO / ÉCRAN DE FIN YOUTUBE (1920×1080, 15 s) : TEXTES À MODIFIER ───
 * Les deux cadres de droite et le cercle du logo sont les emplacements où poser,
 * dans YouTube Studio, les éléments de l'écran de fin (vidéos + bouton S'abonner).
 */
export const OUTRO = {
	kicker: "MERCI D'AVOIR REGARDÉ",
	title: 'ABONNE-TOI',
	button: "S'ABONNER",
	buttonDone: 'ABONNÉ',
	bell: 'ACTIVE LA CLOCHE POUR NE RIEN RATER',
	videos: ['VIDÉO SUIVANTE', 'À VOIR AUSSI'],
	website: 'URBEX-FRANCE.COM',
	websiteLine: 'LA CARTE ET LA COMMUNAUTÉ',
	logo: 'assets/brand/logo-urbex-fr.png',
};

export const OUTRO_DURATION = 450; // 15 s (YouTube : écran de fin de 5 à 20 s)

const CLICK = 78; // instant du clic sur « S'abonner »
const LEFT_X = 520; // centre de la colonne de gauche
const BADGE = 300; // diamètre du logo (zone du bouton d'abonnement YouTube)
const BADGE_Y = 520;

/** Bouton « S'abonner » cliqué par un curseur, qui devient « Abonné ». */
const SubscribeButton: React.FC = () => {
	const frame = useCurrentFrame();
	const done = frame >= CLICK;
	const press = pulse(frame, CLICK - 2, CLICK, CLICK + 5);
	// Curseur : arrive du bas à droite, clique, repart.
	const cx = tween(frame, [46, CLICK - 2], [LEFT_X + 420, LEFT_X + 70], EASE.inOut) + tween(frame, [CLICK + 14, CLICK + 34], [0, 260], EASE.in);
	const cy = tween(frame, [46, CLICK - 2], [1060, 800], EASE.inOut) + tween(frame, [CLICK + 14, CLICK + 34], [0, 220], EASE.in);
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: LEFT_X - 210,
					top: 755,
					width: 420,
					height: 96,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 18,
					background: done ? '#2B2C30' : COLORS.orange,
					color: done ? COLORS.boneDim : COLORS.black,
					fontFamily: FONTS.display,
					fontSize: 52,
					letterSpacing: '0.02em',
					borderRadius: 6,
					scale: `${(1 - press * 0.08) * tween(frame, [30, 42], [0.6, 1], EASE.out)}`,
					opacity: tween(frame, [30, 36], [0, 1]),
					boxShadow: done ? 'none' : `0 0 50px ${COLORS.orangeGlow}`,
				}}
			>
				{done ? (
					<svg width={40} height={40} viewBox="0 0 24 24">
						<path d="M4 12.5 L9.5 18 L20 6" fill="none" stroke={COLORS.boneDim} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				) : null}
				{done ? OUTRO.buttonDone : OUTRO.button}
				{done ? <Bell /> : null}
			</div>
			{/* Onde du clic */}
			<div
				style={{
					position: 'absolute',
					left: LEFT_X + 70 - 60,
					top: 800 - 60,
					width: 120,
					height: 120,
					borderRadius: 60,
					border: `3px solid ${COLORS.bone}`,
					opacity: pulse(frame, CLICK, CLICK + 1, CLICK + 14) * 0.8,
					scale: `${tween(frame, [CLICK, CLICK + 14], [0.2, 1.4])}`,
				}}
			/>
			{/* Curseur */}
			<svg
				width={44}
				height={56}
				viewBox="0 0 22 28"
				style={{
					position: 'absolute',
					left: cx,
					top: cy,
					opacity: tween(frame, [46, 52], [0, 1]) * (1 - tween(frame, [CLICK + 26, CLICK + 34], [0, 1])),
					scale: `${1 - press * 0.15}`,
					filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.7))',
				}}
			>
				<path d="M1 1 L1 22 L7 17 L11 26 L15 24 L11 15.5 L19 15.5 Z" fill="#FFFFFF" stroke="#111" strokeWidth={1.5} strokeLinejoin="round" />
			</svg>
		</>
	);
};

/** Cloche qui sonne juste après le clic. */
const Bell: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame - CLICK - 4;
	const swing = t > 0 && t < 40 ? Math.sin(t * 0.9) * 22 * Math.exp(-t / 14) : 0;
	return (
		<svg width={40} height={40} viewBox="0 0 24 24" style={{rotate: `${swing}deg`, transformOrigin: '50% 10%'}}>
			<path d="M12 3 C8 3 6 6 6 9.5 L6 14 L4 17 L20 17 L18 14 L18 9.5 C18 6 16 3 12 3 Z" fill={COLORS.boneDim} />
			<circle cx={12} cy={19.5} r={2.2} fill={COLORS.boneDim} />
		</svg>
	);
};

/** Cadre d'emplacement pour une vidéo de l'écran de fin. */
const VideoSlot: React.FC<{top: number; label: string; delay: number}> = ({top, label, delay}) => {
	const frame = useCurrentFrame();
	const f = frame - delay;
	const open = tween(f, [0, 14], [0, 1], EASE.inOut);
	const scan = ((f * 6) % 420) - 30;
	const W = 640;
	const H = 360;
	const corner = (style: React.CSSProperties, sx: number, sy: number) => (
		<div style={{position: 'absolute', width: 54, height: 54, ...style, scale: `${sx} ${sy}`}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 54, height: 5, background: COLORS.orange}} />
			<div style={{position: 'absolute', left: 0, top: 0, width: 5, height: 54, background: COLORS.orange}} />
		</div>
	);
	return (
		<div style={{position: 'absolute', left: 1160, top, width: W, height: H, opacity: tween(f, [0, 6], [0, 1])}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'rgba(7,7,8,0.72)',
					border: `2px solid ${COLORS.boneFaint}`,
					clipPath: `inset(0 ${(1 - open) * 50}% 0 ${(1 - open) * 50}%)`,
					overflow: 'hidden',
				}}
			>
				{/* ligne de balayage */}
				<div style={{position: 'absolute', left: 0, right: 0, top: scan, height: 2, background: 'rgba(255,91,26,0.35)', boxShadow: `0 0 18px ${COLORS.orangeGlow}`}} />
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 22}}>
					<svg width={90} height={90} viewBox="0 0 24 24" style={{opacity: 0.85}}>
						<circle cx={12} cy={12} r={11} fill="none" stroke={COLORS.bone} strokeWidth={1.4} />
						<path d="M9.5 7.5 L17 12 L9.5 16.5 Z" fill={COLORS.bone} />
					</svg>
					<div style={{fontFamily: FONTS.mono, fontWeight: 500, fontSize: 30, letterSpacing: '0.18em', marginRight: '-0.18em', color: COLORS.bone}}>{label}</div>
				</AbsoluteFill>
			</div>
			{corner({left: -10, top: -10}, 1, 1)}
			{corner({right: -10, top: -10}, -1, 1)}
			{corner({left: -10, bottom: -10}, 1, -1)}
			{corner({right: -10, bottom: -10}, -1, -1)}
		</div>
	);
};

export const OutroUrbex: React.FC = () => {
	const frame = useCurrentFrame();
	const flicker = frame < 14 ? (random(`o-${frame}`) > 0.4 ? 1 : 0.15) : 1;
	const ring = (frame / 2) % 360;

	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<AbsoluteFill style={{opacity: flicker}}>
				<Wall duration={OUTRO_DURATION} light={{x: 900, y: 520, r: 1050}} seed="outro" dir={1} />
				<HazardTape top={1040} angle={-1} height={24} speed={4} opacity={0.85} />
			</AbsoluteFill>

			<Glitch intensity={pulse(frame, 12, 15, 22)} seed="outro">
				<AbsoluteFill>
					{/* Colonne gauche : appel à l'abonnement */}
					<AbsoluteFill style={{top: 120, left: LEFT_X - 500, width: 1000, alignItems: 'center'}}>
						<div
							style={{
								fontFamily: FONTS.mono,
								fontWeight: 500,
								fontSize: 32,
								letterSpacing: '0.24em',
								marginRight: '-0.24em',
								color: COLORS.orange,
								opacity: tween(frame, [8, 16], [0, 1]),
							}}
						>
							{OUTRO.kicker}
						</div>
						<RiseText delay={14} duration={14} style={{fontFamily: FONTS.display, fontSize: 168, lineHeight: 1.02, color: COLORS.bone, marginTop: 4}}>
							{OUTRO.title}
						</RiseText>
					</AbsoluteFill>

					{/* Logo = emplacement du bouton d'abonnement YouTube */}
					<div
						style={{
							position: 'absolute',
							left: LEFT_X - BADGE / 2,
							top: BADGE_Y - BADGE / 2,
							width: BADGE,
							height: BADGE,
							scale: `${tween(frame, [18, 32], [1.25, 1], EASE.out)}`,
							opacity: tween(frame, [18, 22], [0, 1]),
						}}
					>
						<Img src={staticFile(OUTRO.logo)} style={{width: BADGE, height: BADGE, filter: 'drop-shadow(0 16px 50px rgba(0,0,0,0.9))'}} />
						<svg width={BADGE + 60} height={BADGE + 60} style={{position: 'absolute', left: -30, top: -30, rotate: `${ring}deg`}}>
							<circle
								cx={(BADGE + 60) / 2}
								cy={(BADGE + 60) / 2}
								r={BADGE / 2 + 22}
								fill="none"
								stroke={COLORS.orange}
								strokeWidth={4}
								strokeDasharray="18 14"
								opacity={0.9}
							/>
						</svg>
					</div>

					<SubscribeButton />

					<AbsoluteFill style={{top: 878, left: LEFT_X - 500, width: 1000, alignItems: 'center'}}>
						<div
							style={{
								fontFamily: FONTS.condensed,
								fontWeight: 700,
								fontSize: 40,
								letterSpacing: '0.1em',
								marginRight: '-0.1em',
								color: COLORS.bone,
								opacity: tween(frame, [CLICK + 6, CLICK + 14], [0, 1]),
								translate: `0px ${tween(frame, [CLICK + 6, CLICK + 16], [16, 0])}px`,
							}}
						>
							{OUTRO.bell}
						</div>
					</AbsoluteFill>

					{/* Colonne droite : emplacements des vidéos */}
					<VideoSlot top={150} label={OUTRO.videos[0]} delay={34} />
					<VideoSlot top={570} label={OUTRO.videos[1]} delay={42} />

					{/* Site */}
					<AbsoluteFill style={{top: 965, alignItems: 'center'}}>
						<div style={{display: 'flex', alignItems: 'center', gap: 20, opacity: tween(frame, [CLICK + 30, CLICK + 40], [0, 1])}}>
							<DrawLine from={CLICK + 30} width={60} color={COLORS.orange} align="right" />
							<span style={{fontFamily: FONTS.mono, fontWeight: 500, fontSize: 34, letterSpacing: '0.16em', color: COLORS.orange}}>{OUTRO.website}</span>
							<span style={{fontFamily: FONTS.condensed, fontWeight: 500, fontSize: 34, letterSpacing: '0.1em', color: COLORS.boneDim}}>· {OUTRO.websiteLine}</span>
							<DrawLine from={CLICK + 30} width={60} color={COLORS.orange} align="left" />
						</div>
					</AbsoluteFill>
				</AbsoluteFill>
			</Glitch>

			<AbsoluteFill style={{background: COLORS.black, opacity: tween(frame, [OUTRO_DURATION - 12, OUTRO_DURATION], [0, 1])}} />
			<Vignette strength={0.65} />
			<Grain opacity={0.1} />
			<Audio name="Musique + bruitages" src={staticFile('audio/outro-urbex.wav')} />
		</AbsoluteFill>
	);
};
