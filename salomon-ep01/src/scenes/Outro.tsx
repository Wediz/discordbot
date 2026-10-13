import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {EASE, pulse, tween} from '../anim';
import {Glitch} from '../components/Glitch';
import {DrawLine} from '../components/Reveal';
import {IMAGES, TEXTS} from '../content';
import {COLORS, FONTS} from '../theme';

const LOGO_W = 800;
const LOGO_H = (LOGO_W * IMAGES.logo.h) / IMAGES.logo.w;
const CENTER_Y = 880;

/** Coin de visée qui se referme sur le logo (verrouillage). */
const Bracket: React.FC<{sx: 1 | -1; sy: 1 | -1; gap: number; opacity: number}> = ({sx, sy, gap, opacity}) => {
	const x = 540 + sx * (LOGO_W / 2 + gap);
	const y = CENTER_Y + sy * (LOGO_H / 2 + gap);
	const len = 64;
	return (
		<div style={{position: 'absolute', left: x, top: y, opacity, scale: `${-sx} ${-sy}`, transformOrigin: '0 0'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: len, height: 4, background: COLORS.orange}} />
			<div style={{position: 'absolute', left: 0, top: 0, width: 4, height: len, background: COLORS.orange}} />
		</div>
	);
};

/** 00:22 → 00:25 — Logo, verrouillage, reflet final. */
export const Outro: React.FC = () => {
	const frame = useCurrentFrame();
	const gap = tween(frame, [4, 26], [180, 44], EASE.out);
	const lockBlink = frame >= 26 && frame < 34 ? (frame % 4 < 2 ? 1 : 0.3) : 1;
	const shine = tween(frame, [50, 76], [-40, 140], EASE.inOut);
	const logoMask = `url(${staticFile(IMAGES.logo.src)})`;

	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<AbsoluteFill
				style={{
					opacity: tween(frame, [0, 30], [0, 1]),
					background: `radial-gradient(ellipse 60% 16% at 50% ${(CENTER_Y / 1920) * 100}%, rgba(255,91,26,0.14), transparent 70%)`,
				}}
			/>
			<Glitch intensity={pulse(frame, 0, 3, 12)} seed="outro">
				<AbsoluteFill>
					<div
						style={{
							position: 'absolute',
							left: 540 - LOGO_W / 2,
							top: CENTER_Y - LOGO_H / 2,
							width: LOGO_W,
							height: LOGO_H,
							scale: `${tween(frame, [0, 24], [1.14, 1], EASE.out)}`,
						}}
					>
						<Img src={staticFile(IMAGES.logo.src)} style={{width: LOGO_W, height: LOGO_H, filter: `brightness(${tween(frame, [0, 14], [2.2, 1])})`}} />
						{/* Reflet métallique qui traverse uniquement le logo */}
						<div
							style={{
								position: 'absolute',
								inset: 0,
								maskImage: logoMask,
								WebkitMaskImage: logoMask,
								maskSize: '100% 100%',
								WebkitMaskSize: '100% 100%',
								background: `linear-gradient(110deg, transparent ${shine - 14}%, rgba(255,250,240,0.95) ${shine}%, transparent ${shine + 14}%)`,
								mixBlendMode: 'screen',
							}}
						/>
					</div>
				</AbsoluteFill>
			</Glitch>

			<Bracket sx={-1} sy={-1} gap={gap} opacity={lockBlink} />
			<Bracket sx={1} sy={-1} gap={gap} opacity={lockBlink} />
			<Bracket sx={-1} sy={1} gap={gap} opacity={lockBlink} />
			<Bracket sx={1} sy={1} gap={gap} opacity={lockBlink} />

			<AbsoluteFill style={{top: CENTER_Y + LOGO_H / 2 + 110, alignItems: 'center'}}>
				<div
					style={{
						fontFamily: FONTS.condensed,
						fontWeight: 700,
						fontSize: 52,
						letterSpacing: '0.14em',
						marginRight: '-0.14em',
						color: COLORS.bone,
						whiteSpace: 'nowrap',
						opacity: tween(frame, [22, 34], [0, 1]),
						translate: `0px ${tween(frame, [22, 38], [26, 0])}px`,
					}}
				>
					{TEXTS.outroLine} <span style={{color: COLORS.orange}}>— {TEXTS.outroEpisode}</span>
				</div>
				<DrawLine from={34} duration={18} width={760} color={COLORS.orange} align="center" style={{marginTop: 26}} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
