import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE, tween} from '../anim';
import {RiseText} from '../components/Reveal';
import {FEATURES, segment, type Feature} from '../content';
import {COLORS, FONTS} from '../theme';

/** Fenêtre « caméra » : position et taille à l'écran. */
const VIEW = {left: 60, top: 170, width: 960, height: 1000};

/** Grille technique de fond, légèrement en parallaxe. */
const Grid: React.FC<{offset: number}> = ({offset}) => (
	<AbsoluteFill
		style={{
			opacity: 0.5,
			backgroundImage: `linear-gradient(${COLORS.boneFaint} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.boneFaint} 1px, transparent 1px)`,
			backgroundSize: '80px 80px',
			backgroundPosition: `${offset}px ${offset * 0.4}px`,
			maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 85%)',
			WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 85%)',
		}}
	/>
);

/** Un détail : gros plan avec caméra simulée, viseur, annotation et titre. */
export const DetailShot: React.FC<{detail: Feature; index: number; total: number; duration: number}> = ({
	detail,
	index,
	total,
	duration,
}) => {
	const frame = useCurrentFrame();
	const {image, camFrom, camTo, target} = detail;

	// Caméra : panoramique + poussée continue sur toute la durée du plan.
	const p = tween(frame, [0, duration], [0, 1], EASE.soft);
	const cx = camFrom.x + (camTo.x - camFrom.x) * p;
	const cy = camFrom.y + (camTo.y - camFrom.y) * p;
	const z = camFrom.zoom + (camTo.zoom - camFrom.zoom) * p;
	const imgLeft = VIEW.width / 2 - cx * z;
	const imgTop = VIEW.height / 2 - cy * z;

	// Point annoté, suivi à l'écran.
	const tx = imgLeft + target.x * z;
	const ty = imgTop + target.y * z;

	// Entrée par masque (volet), sortie par volet inverse.
	const wipeIn = tween(frame, [0, 14], [100, 0], EASE.inOut);
	const wipeOut = tween(frame, [duration - 10, duration], [0, 100], EASE.in);
	const edge = frame < 16 ? 100 - wipeIn : wipeOut > 0 ? wipeOut : -1;

	const reticle = tween(frame, [16, 30], [0, 1], EASE.out);
	const line = tween(frame, [24, 38], [0, 1], EASE.inOut);
	const labelX = tx < VIEW.width / 2 ? tx + 120 : tx - 120;
	const labelY = Math.max(80, ty - 160);

	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					...VIEW,
					overflow: 'hidden',
					background: `radial-gradient(ellipse 70% 60% at 50% 48%, #34363B 0%, ${COLORS.anthracite} 45%, ${COLORS.coal} 100%)`,
					clipPath: `inset(0 ${wipeIn}% 0 ${wipeOut}%)`,
				}}
			>
				<Grid offset={-p * 60} />
				<Img
					src={staticFile(image.src)}
					style={{
						position: 'absolute',
						left: imgLeft,
						top: imgTop,
						width: image.w * z,
						height: image.h * z,
						filter: `contrast(1.12) brightness(${tween(frame, [0, 16], [1.6, 1.05])}) drop-shadow(0 30px 40px rgba(0,0,0,0.6))`,
					}}
				/>
				{/* Reflet qui glisse sur la matière */}
				<AbsoluteFill
					style={{
						mixBlendMode: 'screen',
						opacity: 0.22,
						background: `linear-gradient(115deg, transparent ${p * 120 - 30}%, rgba(255,240,220,0.8) ${p * 120 - 15}%, transparent ${p * 120}%)`,
					}}
				/>

				{/* Viseur sur le point annoté */}
				<div
					style={{
						position: 'absolute',
						left: tx - 50,
						top: ty - 50,
						width: 100,
						height: 100,
						border: `3px solid ${COLORS.orange}`,
						borderRadius: '50%',
						scale: `${1.6 - reticle * 0.6}`,
						opacity: reticle,
						boxShadow: `0 0 18px ${COLORS.orangeGlow}`,
					}}
				/>
				<div style={{position: 'absolute', left: tx - 7, top: ty - 7, width: 14, height: 14, borderRadius: 7, background: COLORS.orange, opacity: reticle}} />

				{/* Trait d'annotation + étiquette */}
				<svg style={{position: 'absolute', inset: 0}} width={VIEW.width} height={VIEW.height}>
					<polyline
						points={`${tx},${ty} ${labelX},${labelY + 20} ${labelX + (labelX > tx ? 60 : -60)},${labelY + 20}`}
						fill="none"
						stroke={COLORS.bone}
						strokeWidth={2.5}
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - line}
					/>
				</svg>
				<div
					style={{
						position: 'absolute',
						top: labelY - 26,
						...(labelX > tx ? {left: labelX} : {right: VIEW.width - labelX}),
						fontFamily: FONTS.mono,
						fontWeight: 500,
						fontSize: 30,
						letterSpacing: '0.08em',
						color: COLORS.bone,
						background: 'rgba(7,7,8,0.72)',
						padding: '6px 12px',
						opacity: tween(frame, [34, 42], [0, 1]),
						whiteSpace: 'nowrap',
					}}
				>
					{detail.label}
				</div>

				{/* Bord lumineux du volet */}
				{edge >= 0 ? (
					<div
						style={{
							position: 'absolute',
							top: 0,
							bottom: 0,
							left: `${edge}%`,
							width: 6,
							background: COLORS.orange,
							boxShadow: `0 0 30px 8px ${COLORS.orangeGlow}`,
						}}
					/>
				) : null}
			</div>

			{/* Cadre de la fenêtre */}
			<div style={{position: 'absolute', ...VIEW, border: `2px solid ${COLORS.boneFaint}`, opacity: 1 - wipeOut / 100}} />

			{/* Bloc texte */}
			<div style={{position: 'absolute', left: 80, right: 80, top: 1225}}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 18,
						fontFamily: FONTS.mono,
						fontWeight: 500,
						fontSize: 34,
						letterSpacing: '0.12em',
						color: COLORS.orange,
						opacity: tween(frame, [6, 14], [0, 1]) * (1 - wipeOut / 100),
					}}
				>
					{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
					<div style={{flex: 1, height: 2, background: COLORS.boneFaint}} />
				</div>
				<RiseText delay={8} exitAt={duration - 10} style={{marginTop: 14, fontFamily: FONTS.display, fontSize: 140, lineHeight: 1.05, color: COLORS.bone, whiteSpace: 'nowrap'}}>
					{detail.title}
				</RiseText>
				<div style={{display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 22}}>
					{detail.specs.map((spec, i) => (
						<div
							key={spec}
							style={{
								fontFamily: FONTS.mono,
								fontWeight: 500,
								fontSize: 32,
								letterSpacing: '0.06em',
								color: i === 0 ? COLORS.black : COLORS.bone,
								background: i === 0 ? COLORS.orange : 'transparent',
								border: `2px solid ${i === 0 ? COLORS.orange : COLORS.boneFaint}`,
								padding: '8px 16px',
								opacity: tween(frame, [18 + i * 5, 26 + i * 5], [0, 1]) * (1 - tween(frame, [duration - 10, duration - 2], [0, 1])),
								translate: `${tween(frame, [18 + i * 5, 30 + i * 5], [-24, 0])}px 0px`,
							}}
						>
							{spec}
						</div>
					))}
				</div>
			</div>
		</AbsoluteFill>
	);
};

/** Les 6 caractéristiques, chacune calée sur sa phrase de voix off. */
export const Details: React.FC = () => {
	const {fps} = useVideoConfig();
	const first = segment(FEATURES[0].id).from;
	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			{FEATURES.map((f, i) => {
				const seg = segment(f.id);
				return (
					<Sequence key={f.id} name={f.title} from={seg.from - first} durationInFrames={seg.duration} premountFor={fps}>
						<DetailShot detail={f} index={i} total={FEATURES.length} duration={seg.duration} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
