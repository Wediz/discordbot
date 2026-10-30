import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE, pulse, tween} from '../anim';
import {Glitch} from '../components/Glitch';
import {Grain, Vignette} from '../components/Grain';
import {LightFlash} from '../components/Light';
import {DrawLine, RiseText} from '../components/Reveal';
import {COLORS, FONTS} from '../theme';
import {BEAT, BRAND, DANGERS, LOGO, RULES, RULES_TITLE, T, WALL, WARNING} from './content';

/* ───────────────────────── éléments communs ───────────────────────── */

/** Ruban de signalisation orange/noir qui défile. */
export const HazardTape: React.FC<{top: number; angle?: number; speed?: number; opacity?: number; height?: number}> = ({
	top,
	angle = -4,
	speed = 6,
	opacity = 1,
	height = 64,
}) => {
	const frame = useCurrentFrame();
	return (
		<div
			style={{
				position: 'absolute',
				left: -200,
				right: -200,
				top,
				height,
				rotate: `${angle}deg`,
				opacity,
				backgroundImage: `repeating-linear-gradient(-45deg, ${COLORS.orange} 0 38px, #0B0B0C 38px 76px)`,
				backgroundPosition: `${frame * speed}px 0px`,
				boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
			}}
		/>
	);
};

/**
 * Fond « lieu abandonné » : mur de béton généré (scripts/make_wall.py),
 * plongé dans le noir et éclairé par une lampe, avec de la poussière en suspension.
 */
export const Wall: React.FC<{
	duration: number;
	light?: {x: number; y: number; r: number};
	dir?: 1 | -1;
	seed?: string;
	power?: number;
}> = ({duration, light = {x: 960, y: 540, r: 620}, dir = 1, seed = 'w', power = 1}) => {
	const frame = useCurrentFrame();
	const pan = tween(frame, [0, duration], [dir * 60, -dir * 60], EASE.soft);
	const dust = Array.from({length: 46}, (_, i) => {
		const x0 = random(`${seed}-x${i}`) * 1920;
		const y0 = random(`${seed}-y${i}`) * 1080;
		const size = 1.5 + random(`${seed}-s${i}`) * 3.5;
		const speed = 0.2 + random(`${seed}-v${i}`) * 0.8;
		return {
			x: (x0 + frame * speed * 1.6) % 1920,
			y: (y0 - frame * speed + 1080) % 1080,
			size,
			opacity: 0.25 + 0.6 * random(`${seed}-o${i}`),
		};
	});
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: COLORS.black}}>
			<Img
				src={staticFile(WALL)}
				style={{
					position: 'absolute',
					left: -240 + pan,
					top: -135,
					width: 2400,
					height: 1350,
					scale: `${tween(frame, [0, duration], [1.06, 1], EASE.soft)}`,
					filter: `brightness(${0.75 * power}) contrast(1.15)`,
				}}
			/>
			{/* Lumière chaude de la lampe sur le mur */}
			<AbsoluteFill
				style={{
					mixBlendMode: 'soft-light',
					background: `radial-gradient(circle ${light.r}px at ${light.x}px ${light.y}px, rgba(255,214,170,0.9), transparent 75%)`,
				}}
			/>
			{/* Obscurité autour du faisceau */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle ${light.r * 1.5}px at ${light.x}px ${light.y}px, rgba(7,7,8,0.05) 0%, rgba(7,7,8,0.55) 45%, rgba(7,7,8,0.94) 100%)`,
				}}
			/>
			{/* Poussière dans la lumière */}
			{dust.map((d, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: d.x,
						top: d.y,
						width: d.size,
						height: d.size,
						borderRadius: d.size,
						background: 'rgba(255,236,214,1)',
						filter: d.size > 3.5 ? 'blur(1.5px)' : undefined,
						opacity:
							d.opacity *
							Math.max(0, 1 - Math.hypot(d.x - light.x, d.y - light.y) / (light.r * 1.1)),
					}}
				/>
			))}
		</AbsoluteFill>
	);
};

/** Deux lignes de texte massives qui claquent sur le temps. */
const Slam: React.FC<{words: string[]; accent?: number; top?: number; size?: number}> = ({words, accent = 1, top = 560, size: maxSize = 200}) => {
	const frame = useCurrentFrame();
	// Taille ajustée pour que le mot le plus long tienne dans 1500 px (Anton ≈ 0,46 em par lettre).
	const longest = Math.max(...words.map((w) => w.length));
	const size = Math.min(maxSize, Math.floor(1500 / (longest * 0.46)));
	return (
		<AbsoluteFill style={{top, alignItems: 'center'}}>
			{words.map((w, i) => (
				<div
					key={w}
					style={{
						fontFamily: FONTS.display,
						fontSize: size,
						lineHeight: 0.98,
						color: i === accent ? COLORS.orange : COLORS.bone,
						whiteSpace: 'nowrap',
						scale: `${tween(frame, [i * 3, i * 3 + 8], [1.35, 1], EASE.out)}`,
						opacity: tween(frame, [i * 3, i * 3 + 3], [0, 1]),
						filter: `blur(${tween(frame, [i * 3, i * 3 + 6], [12, 0])}px)`,
						textShadow: '0 12px 50px rgba(0,0,0,0.9)',
					}}
				>
					{w}
				</div>
			))}
		</AbsoluteFill>
	);
};

const Kicker: React.FC<{children: React.ReactNode; top: number; color?: string; delay?: number}> = ({children, top, color = COLORS.orange, delay = 0}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{top, alignItems: 'center'}}>
			<div
				style={{
					fontFamily: FONTS.mono,
					fontWeight: 500,
					fontSize: 36,
					letterSpacing: '0.24em',
					marginRight: '-0.24em',
					color,
					opacity: tween(frame, [delay, delay + 6], [0, 1]),
				}}
			>
				{children}
			</div>
		</AbsoluteFill>
	);
};

/* ───────────────────────── 1. Avertissement ───────────────────────── */

const Warning: React.FC = () => {
	const frame = useCurrentFrame();
	// Lumière qui grésille avant de tenir.
	const flicker = frame < 30 ? (random(`fl-${frame}`) > 0.45 ? 1 : 0.08) : 1;
	const dur = 6 * BEAT;
	const glitch = Math.max(pulse(frame, 34, 37, 44), 0.6 * pulse(frame, 70, 72, 76), pulse(frame, dur - 10, dur - 2, dur));

	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<AbsoluteFill style={{opacity: flicker}}>
				<Wall duration={6 * BEAT} light={{x: 960, y: 560, r: 760}} seed="warn" power={0.8} />
				<AbsoluteFill style={{background: `radial-gradient(ellipse 60% 45% at 50% 52%, rgba(255,91,26,0.16), transparent 70%)`}} />
				<HazardTape top={tween(frame, [0, 20], [-140, 20], EASE.out)} angle={-3} />
				<HazardTape top={tween(frame, [0, 20], [1160, 990], EASE.out)} angle={-3} speed={-6} />
			</AbsoluteFill>
			<Glitch intensity={glitch} seed="warn">
				<AbsoluteFill style={{opacity: flicker}}>
					{/* Panneau triangle */}
					<AbsoluteFill style={{top: 130, alignItems: 'center'}}>
						<svg width={120} height={108} viewBox="0 0 100 90" style={{opacity: tween(frame, [4, 10], [0, 1]), scale: `${tween(frame, [4, 14], [1.4, 1], EASE.out)}`}}>
							<path d="M50 4 L96 86 L4 86 Z" fill="none" stroke={COLORS.orange} strokeWidth={7} strokeLinejoin="round" />
							<rect x={46} y={30} width={8} height={32} fill={COLORS.orange} />
							<rect x={46} y={68} width={8} height={8} fill={COLORS.orange} />
						</svg>
					</AbsoluteFill>
					<Kicker top={262} delay={10}>
						{WARNING.kicker}
					</Kicker>
					<AbsoluteFill style={{top: 330, alignItems: 'center'}}>
						<RiseText delay={30} style={{fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 64, letterSpacing: '0.2em', marginRight: '-0.2em', color: COLORS.bone}}>
							{WARNING.lines[0]}
						</RiseText>
						<RiseText delay={36} duration={14} style={{fontFamily: FONTS.display, fontSize: 200, lineHeight: 1, color: COLORS.bone, marginTop: 6}}>
							{WARNING.lines[1]}
						</RiseText>
						<div
							style={{
								fontFamily: FONTS.display,
								fontSize: 200,
								lineHeight: 1,
								color: COLORS.orange,
								scale: `${tween(frame, [54, 62], [1.5, 1], EASE.out)}`,
								opacity: tween(frame, [54, 57], [0, 1]),
								filter: `blur(${tween(frame, [54, 60], [16, 0])}px)`,
								textShadow: `0 0 60px ${COLORS.orangeGlow}`,
							}}
						>
							{WARNING.lines[2]}
						</div>
					</AbsoluteFill>
				</AbsoluteFill>
			</Glitch>
			{/* Secousse au mot DANGEREUSE */}
			<AbsoluteFill style={{background: COLORS.orange, mixBlendMode: 'overlay', opacity: 0.5 * pulse(frame, 54, 55, 66)}} />
		</AbsoluteFill>
	);
};

/* ───────────────────────── 2. Risques & 3. Règles ───────────────────────── */

const Beat2: React.FC<{
	words: string[];
	index: number;
	total: number;
	label: string;
	tint: 'warm' | 'cold';
	title?: string;
}> = ({words, index, total, label, tint, title}) => {
	const frame = useCurrentFrame();
	const d = 2 * BEAT;
	const shake = frame < 6 ? (random(`sh-${index}-${frame}`) - 0.5) * 18 : 0;
	return (
		<AbsoluteFill style={{background: COLORS.black, translate: `${shake}px ${shake * 0.6}px`}}>
			<Wall
				duration={d}
				dir={index % 2 ? 1 : -1}
				seed={`${label}${index}`}
				light={{x: 960 + (index % 2 ? 260 : -260) * (tint === 'warm' ? 1 : 0.4), y: 620, r: 680}}
				power={tint === 'warm' ? 1 : 0.8}
			/>
			{tint === 'cold' ? <AbsoluteFill style={{background: 'rgba(40,60,80,0.18)', mixBlendMode: 'color'}} /> : null}
			{tint === 'warm' ? <HazardTape top={110} angle={-2} opacity={0.9} height={26} speed={8} /> : null}
			{title ? (
				<Kicker top={150} color={COLORS.bone}>
					{title}
				</Kicker>
			) : null}
			<Kicker top={490} delay={2}>
				{label} {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
			</Kicker>
			<Slam words={words} accent={tint === 'warm' ? 1 : 1} />
		</AbsoluteFill>
	);
};

/* ───────────────────────── 4. Lampe torche + logo ───────────────────────── */

const LOGO_SIZE = 640;

const LogoReveal: React.FC = () => {
	const frame = useCurrentFrame(); // 0 = début du noir
	const on = 2 * BEAT; // la lumière s'allume franchement
	// Faisceau de lampe qui cherche dans le noir puis se pose sur le logo.
	const bx = 960 + Math.sin(frame / 7) * tween(frame, [0, on], [620, 0], EASE.inOut);
	const by = 540 + Math.cos(frame / 9) * tween(frame, [0, on], [280, 0], EASE.inOut);
	const radius = tween(frame, [0, on - 4], [150, 330], EASE.inOut);
	const full = tween(frame, [on, on + 10], [0, 1], EASE.out);
	const mask = `radial-gradient(circle ${radius + full * 1300}px at ${bx}px ${by}px, black 55%, transparent 100%)`;
	const logoTop = 540 - LOGO_SIZE / 2;
	const shine = tween(frame, [on + 18, on + 46], [-40, 140], EASE.inOut);
	const logoMask = `url(${staticFile(LOGO.src)})`;

	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			{/* Clic de la lampe : petite poussière dans le faisceau */}
			<AbsoluteFill style={{maskImage: mask, WebkitMaskImage: mask}}>
				<Wall duration={T.brand - T.blackout} light={{x: bx, y: by, r: radius * 2.2 + full * 500}} seed="logo" power={0.9} />
				<div style={{position: 'absolute', left: 960 - LOGO_SIZE / 2, top: logoTop, width: LOGO_SIZE, height: LOGO_SIZE, scale: `${tween(frame, [on, on + 24], [1.08, 1], EASE.out)}`}}>
					<Img src={staticFile(LOGO.src)} style={{width: LOGO_SIZE, height: LOGO_SIZE, filter: `drop-shadow(0 0 ${40 * full}px rgba(255,91,26,${0.35 * full}))`}} />
					<div
						style={{
							position: 'absolute',
							inset: 0,
							maskImage: logoMask,
							WebkitMaskImage: logoMask,
							maskSize: '100% 100%',
							WebkitMaskSize: '100% 100%',
							mixBlendMode: 'screen',
							background: `linear-gradient(115deg, transparent ${shine - 12}%, rgba(255,248,236,0.85) ${shine}%, transparent ${shine + 12}%)`,
						}}
					/>
				</div>
			</AbsoluteFill>
			{/* Halo du faisceau */}
			<AbsoluteFill
				style={{
					mixBlendMode: 'screen',
					opacity: 1 - full * 0.6,
					background: `radial-gradient(circle ${radius * 1.3}px at ${bx}px ${by}px, rgba(255,236,210,0.22), transparent 70%)`,
				}}
			/>
			<LightFlash at={on} before={2} after={12} />
		</AbsoluteFill>
	);
};

/* ───────────────────────── 5. Le site ───────────────────────── */

const Brand: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const end = T.end - T.brand;
	const logoScale = tween(frame, [0, 16], [1, 0.9], EASE.inOut);
	const logoX = tween(frame, [0, 16], [960, 500], EASE.inOut);
	const ctaAt = end - 3 * BEAT;

	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<Wall duration={end} light={{x: 760, y: 540, r: 900}} seed="brand" dir={-1} />
			<AbsoluteFill style={{background: 'linear-gradient(90deg, transparent 35%, rgba(7,7,8,0.55) 80%)'}} />

			<div
				style={{
					position: 'absolute',
					left: logoX - LOGO_SIZE / 2,
					top: 540 - LOGO_SIZE / 2,
					width: LOGO_SIZE,
					height: LOGO_SIZE,
					scale: `${logoScale}`,
				}}
			>
				<Img src={staticFile(LOGO.src)} style={{width: LOGO_SIZE, height: LOGO_SIZE, filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.9))'}} />
			</div>

			{/* Adresse du site, en très gros */}
			<AbsoluteFill style={{top: 300, left: 900, alignItems: 'flex-start'}}>
				<RiseText delay={14} duration={16} style={{fontFamily: FONTS.display, fontSize: 124, lineHeight: 1.05, color: COLORS.bone, whiteSpace: 'nowrap'}}>
					URBEX-FRANCE<span style={{color: COLORS.orange}}>.COM</span>
				</RiseText>
				<DrawLine from={24} width={900} color={COLORS.orange} align="left" thickness={4} style={{marginTop: 14}} />
				<div style={{marginTop: 30, textAlign: 'left'}}>
					{BRAND.tagline.map((line, i) => (
						<RiseText
							key={line}
							delay={28 + i * 5}
							style={{fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 62, lineHeight: 1.12, letterSpacing: '0.08em', marginRight: '-0.08em', color: i === 1 ? COLORS.orange : COLORS.bone}}
						>
							{line}
						</RiseText>
					))}
				</div>
			</AbsoluteFill>

			{/* Ce qu'on trouve sur le site */}
			<AbsoluteFill style={{top: 740, left: 900, alignItems: 'flex-start'}}>
				<div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 16, width: 920}}>
					{BRAND.features.map((f, i) => (
						<div
							key={f}
							style={{
								fontFamily: FONTS.mono,
								fontWeight: 500,
								fontSize: 34,
								letterSpacing: '0.06em',
								color: COLORS.bone,
								background: 'rgba(7,7,8,0.7)',
								border: `2px solid ${COLORS.boneFaint}`,
								padding: '12px 20px',
								opacity: tween(frame, [44 + i * 6, 50 + i * 6], [0, 1]) * (1 - tween(frame, [ctaAt - 6, ctaAt], [0, 1])),
								translate: `0px ${tween(frame, [44 + i * 6, 54 + i * 6], [24, 0])}px`,
							}}
						>
							<span style={{color: COLORS.orange}}>▸ </span>
							{f}
						</div>
					))}
				</div>
			</AbsoluteFill>

			{/* Appel à l'action final */}
			<AbsoluteFill style={{top: 750, left: 900, alignItems: 'flex-start'}}>
				<div
					style={{
						fontFamily: FONTS.display,
						fontSize: 78,
						color: COLORS.black,
						background: COLORS.orange,
						padding: '14px 44px 18px',
						opacity: tween(frame, [ctaAt, ctaAt + 4], [0, 1]),
						scale: `${tween(frame, [ctaAt, ctaAt + 10], [1.3, 1], EASE.out) + 0.025 * Math.max(0, Math.sin(((frame - ctaAt) / BEAT) * Math.PI * 2)) * (frame > ctaAt + 10 ? 1 : 0)}`,
						boxShadow: `0 0 80px ${COLORS.orangeGlow}`,
						whiteSpace: 'nowrap',
					}}
				>
					{BRAND.cta}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ───────────────────────── Composition ───────────────────────── */

export const INTRO_DURATION = T.end;

export const IntroUrbex: React.FC = () => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<Sequence name="1 Avertissement" from={T.warning} durationInFrames={T.dangers} premountFor={fps}>
				<Warning />
			</Sequence>
			{DANGERS.map((d, i) => (
				<Sequence key={d.words.join()} name={`2 Risque ${i + 1}`} from={T.dangers + i * 2 * BEAT} durationInFrames={2 * BEAT} premountFor={fps}>
					<Beat2 words={d.words} index={i} total={DANGERS.length} label="RISQUE" tint="warm" />
				</Sequence>
			))}
			{RULES.map((r, i) => (
				<Sequence key={r.words.join()} name={`3 Règle ${i + 1}`} from={T.rules + i * 2 * BEAT} durationInFrames={2 * BEAT} premountFor={fps}>
					<Beat2 words={r.words} index={i} total={RULES.length} label="RÈGLE" tint="cold" title={RULES_TITLE} />
				</Sequence>
			))}
			<Sequence name="4 Lampe + logo" from={T.blackout} durationInFrames={T.brand - T.blackout} premountFor={fps}>
				<LogoReveal />
			</Sequence>
			<Sequence name="5 Urbex-France.com" from={T.brand} durationInFrames={T.end - T.brand} premountFor={fps}>
				<Brand />
			</Sequence>

			<LightFlash at={T.dangers} before={2} after={6} />
			<LightFlash at={T.rules} before={3} after={8} />
			<LightFlash at={T.brand} before={2} after={8} />
			{/* Fondu au noir final */}
			<AbsoluteFill style={{background: COLORS.black, opacity: tween(frame, [T.end - 8, T.end], [0, 1])}} />

			<Vignette strength={0.7} />
			<Grain opacity={0.1} />

			<Audio name="Musique + bruitages" src={staticFile('audio/intro-urbex.wav')} />
		</AbsoluteFill>
	);
};
