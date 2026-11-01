import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {EASE, pulse, tween} from '../anim';
import {Glitch} from '../components/Glitch';
import {Grain} from '../components/Grain';
import cracksData from './cracks.json';
import {BEAT, CHARACTER, COLORS, DURATION, EMBLEM_RUNE, LOGO, RUNES, SUBTITLE, T, TITLE, WORDS} from './content';

loadFont({family: 'Cinzel', url: staticFile('fonts/cinzel-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'Cinzel', url: staticFile('fonts/cinzel-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'Runic', url: staticFile('fonts/noto-sans-runic-runic-400-normal.woff2'), weight: '400'});

const CX = 960; // centre de l'emblème
const CY = 400;
const TITLE_Y = CHARACTER ? 860 : 790;

type Crack = {d: number; pts: [number, number, number][]};
const CRACKS = cracksData as unknown as Crack[];

/* ───────────── Secousses de caméra ───────────── */

/** Chaque impact : [image, force]. */
const IMPACTS: [number, number][] = [
	[6, 4],
	[18, 3],
	[T.ring, 5],
	[T.ring + BEAT, 5],
	[T.ring + 2 * BEAT, 6],
	[T.ring + 2.5 * BEAT, 6],
	[T.ring + 3 * BEAT, 7],
	[T.ring + 3.5 * BEAT, 7],
	[T.ring + 3.75 * BEAT, 8],
	[T.strike, 34],
	...TITLE.join('').split('').map((_, i) => [T.letters + i * T.letterGap + (i >= TITLE[0].length ? 12 : 0) + 6, 6] as [number, number]),
	[T.slash, 8],
	[T.final, 22],
];

const shakeAt = (frame: number) => {
	let x = 0;
	let y = 0;
	let r = 0;
	for (const [at, force] of IMPACTS) {
		const t = frame - at;
		if (t < 0 || t > 24) continue;
		const decay = Math.exp(-t / 5) * force;
		x += (random(`sx${at}-${frame}`) - 0.5) * 2 * decay;
		y += (random(`sy${at}-${frame}`) - 0.5) * 2 * decay;
		r += (random(`sr${at}-${frame}`) - 0.5) * 0.06 * decay;
	}
	return {x, y, r};
};

/* ───────────── Fond : fumée + rayons ───────────── */

const Smoke: React.FC<{frame: number}> = ({frame}) => (
	<AbsoluteFill>
		<AbsoluteFill style={{background: `radial-gradient(ellipse 60% 55% at 50% 40%, #0E1622 0%, #070A10 55%, ${COLORS.bg} 100%)`}} />
		{[0, 1].map((i) => (
			<Img
				key={i}
				src={staticFile('assets/ragnar/smoke.jpg')}
				style={{
					position: 'absolute',
					width: 2400,
					height: 1350,
					left: -240 + (i ? -1 : 1) * frame * 0.8,
					top: -135 - frame * (i ? 0.25 : 0.12),
					scale: `${i ? 1.35 : 1.1}`,
					mixBlendMode: 'screen',
					opacity: (i ? 0.16 : 0.22) * tween(frame, [0, 40], [0.3, 1]),
					filter: i ? 'sepia(1) hue-rotate(170deg) saturate(2.2) brightness(0.9)' : 'sepia(1) hue-rotate(185deg) saturate(1.6)',
				}}
			/>
		))}
	</AbsoluteFill>
);

const GodRays: React.FC<{frame: number}> = ({frame}) => {
	const power = tween(frame, [T.strike - 2, T.strike + 6], [0, 1]) * (0.8 + 0.2 * Math.sin(frame / 9)) + pulse(frame, T.final - 2, T.final, T.final + 30) * 0.8;
	if (power <= 0) return null;
	const mask = `radial-gradient(circle at ${CX}px ${CY}px, black 0, rgba(0,0,0,0.7) 260px, transparent 900px)`;
	return (
		<AbsoluteFill
			style={{
				opacity: 0.35 * power,
				mixBlendMode: 'screen',
				background: `repeating-conic-gradient(from ${frame * 0.25}deg at ${CX}px ${CY}px, rgba(167,220,255,0.55) 0deg 2.2deg, transparent 2.2deg 9deg)`,
				maskImage: mask,
				WebkitMaskImage: mask,
				filter: 'blur(6px)',
			}}
		/>
	);
};

/* ───────────── Fissures de lave ───────────── */

const Cracks: React.FC<{frame: number}> = ({frame}) => {
	const reach = tween(frame, [T.cracks, T.strike], [270, 520], EASE.soft) + tween(frame, [T.strike, T.strike + 18], [0, 560], EASE.out);
	const heat =
		tween(frame, [T.cracks, T.cracks + 30], [0, 0.7]) +
		0.6 * pulse(frame, T.strike - 1, T.strike + 2, T.strike + 40) -
		tween(frame, [T.strike + 30, T.strike + 110], [0, 0.42]) +
		0.05 * Math.sin(frame / 11) +
		0.5 * pulse(frame, T.final - 1, T.final + 2, T.final + 30);
	if (heat <= 0.01) return null;
	const maxDepth = frame > T.strike + 24 ? 1 : 2; // après l'éclair : seulement les grandes fissures
	const lines = CRACKS.map((c, i) => {
		if (c.d > maxDepth) return null;
		const pts = c.pts.filter((p) => p[2] <= reach);
		if (pts.length < 2) return null;
		return <polyline key={i} points={pts.map((p) => `${p[0]},${p[1]}`).join(' ')} strokeWidth={c.d === 0 ? 3 : c.d === 1 ? 2 : 1.2} />;
	});
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: Math.min(1, heat)}}>
			<defs>
				<filter id="crackGlow" x="-10%" y="-10%" width="120%" height="120%">
					<feGaussianBlur stdDeviation="5" result="b" />
					<feMerge>
						<feMergeNode in="b" />
						<feMergeNode in="b" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<g fill="none" stroke="#FF8A2A" strokeLinecap="round" strokeLinejoin="round" filter="url(#crackGlow)" style={{mixBlendMode: 'screen'}}>
				{lines}
			</g>
			<g fill="none" stroke="#FFE2B0" strokeLinecap="round" strokeLinejoin="round" opacity={0.9}>
				{lines}
			</g>
		</svg>
	);
};

/* ───────────── Anneau de runes + emblème ───────────── */

const RuneRing: React.FC<{frame: number}> = ({frame}) => {
	const draw = tween(frame, [T.ring, T.ring + 40], [0, 1], EASE.inOut);
	if (draw <= 0) return null;
	const glow = 0.55 + 0.45 * tween(frame, [T.strike - 2, T.strike + 4], [0, 1]) + 0.4 * pulse(frame, T.final - 2, T.final, T.final + 20);
	const ringPulse = 1 + 0.05 * pulse(frame, T.strike, T.strike + 3, T.strike + 20) + 0.05 * pulse(frame, T.final, T.final + 3, T.final + 22);
	const runes = (RUNES + RUNES).split('');
	const R1 = 252;
	const R2 = 205;
	const RT = 228;
	return (
		<svg
			width={700}
			height={700}
			viewBox="-350 -350 700 700"
			style={{position: 'absolute', left: CX - 350, top: CY - 350, scale: `${ringPulse}`, filter: `drop-shadow(0 0 ${10 * glow}px rgba(167,220,255,${0.8 * glow}))`}}
		>
			<g fill="none" stroke={COLORS.ice} strokeOpacity={0.9}>
				<circle r={R1} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} transform="rotate(-90)" />
				<circle r={R2} strokeWidth={1.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} transform="rotate(90)" />
				<circle r={R1 + 14} strokeWidth={1} strokeOpacity={0.4} pathLength={1} strokeDasharray="0.004 0.0098" strokeDashoffset={-frame * 0.0006} />
			</g>
			<g transform={`rotate(${frame * 0.18})`}>
				{Array.from({length: 72}, (_, i) => (
					<line key={i} x1={0} y1={-R1 + 2} x2={0} y2={-R1 + (i % 3 === 0 ? 14 : 7)} stroke={COLORS.ice} strokeWidth={i % 3 === 0 ? 2 : 1} opacity={draw > i / 72 ? 0.8 : 0} transform={`rotate(${i * 5})`} />
				))}
			</g>
			<g transform={`rotate(${-frame * 0.12})`}>
				{runes.map((r, i) => {
					const a = (i / runes.length) * 360;
					return (
						<text
							key={i}
							transform={`rotate(${a}) translate(0 ${-RT})`}
							textAnchor="middle"
							dominantBaseline="central"
							fontFamily="Runic"
							fontSize={30}
							fill={COLORS.ice}
							opacity={draw > i / runes.length ? 0.55 + 0.45 * glow * (0.6 + 0.4 * Math.sin(frame / 6 + i)) : 0}
						>
							{r}
						</text>
					);
				})}
			</g>
		</svg>
	);
};

const Emblem: React.FC<{frame: number}> = ({frame}) => {
	const smoulder = tween(frame, [16, 60], [0, CHARACTER ? 0.55 : 0.35]);
	const lit = tween(frame, [T.strike - 1, T.strike + 3], [0, 1]);
	const opacity = CHARACTER ? smoulder * (1 - tween(frame, [T.strike - 1, T.strike + 2], [0, 1])) : Math.max(smoulder, lit);
	if (opacity <= 0) return null;
	const sheen = tween(frame, [T.sheen - 20, T.sheen + 20], [-30, 130], EASE.inOut);
	const scale = tween(frame, [T.strike, T.strike + 14], [1.25, 1], EASE.out) * (1 + 0.04 * pulse(frame, T.final, T.final + 3, T.final + 22));
	if (LOGO) {
		return (
			<Img
				src={staticFile(LOGO.src)}
				style={{position: 'absolute', left: CX - 175, top: CY - 175, width: 350, height: 350, objectFit: 'contain', opacity, scale: `${scale}`, filter: `drop-shadow(0 0 30px rgba(255,122,26,${0.5 * lit}))`}}
			/>
		);
	}
	return (
		<div style={{position: 'absolute', left: CX - 200, top: CY - 200, width: 400, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity, scale: `${scale}`}}>
			<span
				style={{
					fontFamily: 'Runic',
					fontSize: 300,
					lineHeight: 1,
					backgroundImage: `linear-gradient(115deg, #6E7883 0%, #F4F7FA ${sheen - 12}%, #FFFFFF ${sheen}%, #9AA6B2 ${sheen + 14}%, #59636E 100%)`,
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
					filter: `drop-shadow(0 0 ${22 * lit + 8}px rgba(255,122,26,${0.35 + 0.5 * (lit ? 1 - lit * 0.4 : 1)})) drop-shadow(0 4px 2px rgba(0,0,0,0.8))`,
				}}
			>
				{EMBLEM_RUNE}
			</span>
		</div>
	);
};

/* ───────────── Personnage + lampe frontale ───────────── */

const Character: React.FC<{frame: number}> = ({frame}) => {
	if (!CHARACTER) return null;
	const lit = tween(frame, [T.strike - 1, T.strike + 2], [0, 1]);
	// Apparitions furtives dans le noir, sur les mots
	const glimpse = T.words.some((w) => frame - w >= 1 && frame - w < 3) ? 0.3 : 0;
	const vis = Math.max(lit, glimpse);
	if (vis <= 0) return null;
	const bright =
		1 + 2.2 * pulse(frame, T.strike - 1, T.strike, T.strike + 14) + 0.5 * pulse(frame, T.echo, T.echo + 1, T.echo + 8) + 1.0 * pulse(frame, T.final - 1, T.final, T.final + 16);
	const s = CHARACTER.scale * tween(frame, [T.strike, T.strike + 40], [1.05, 1], EASE.out);
	const box: React.CSSProperties = {
		position: 'absolute',
		left: CX - CHARACTER.head.x * s,
		top: CY - CHARACTER.head.y * s,
		width: 1920 * s,
		height: 1080 * s,
		maskImage: 'linear-gradient(180deg, black 68%, transparent 84%)',
		WebkitMaskImage: 'linear-gradient(180deg, black 68%, transparent 84%)',
	};
	return (
		<>
			<Img src={staticFile(CHARACTER.matte)} style={{...box, opacity: vis}} />
			<Img
				src={staticFile(CHARACTER.src)}
				style={{...box, opacity: vis, mixBlendMode: 'screen', filter: `brightness(${bright}) contrast(1.06) saturate(0.92)`}}
			/>
		</>
	);
};

const Headlamp: React.FC<{frame: number}> = ({frame}) => {
	if (!CHARACTER) return null;
	const on = tween(frame, [T.strike, T.strike + 6], [0, 1]);
	if (on <= 0) return null;
	const breath = 0.85 + 0.15 * Math.sin(frame / 7) + 0.6 * pulse(frame, T.final - 1, T.final + 1, T.final + 20);
	const x = CX - 2;
	const y = CY + 6;
	return (
		<AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none', opacity: on}}>
			<div style={{position: 'absolute', left: x - 170, top: y - 170, width: 340, height: 340, borderRadius: '50%', background: `radial-gradient(circle, rgba(225,242,255,${0.55 * breath}) 0%, rgba(140,200,255,${0.18 * breath}) 35%, transparent 70%)`}} />
			<div style={{position: 'absolute', left: x - 9, top: y - 9, width: 18, height: 18, borderRadius: 9, background: '#FFFFFF', boxShadow: `0 0 20px 8px rgba(235,248,255,${0.9 * breath})`}} />
			<div style={{position: 'absolute', left: x - 420, top: y - 1.5, width: 840, height: 3, background: 'linear-gradient(90deg, transparent, rgba(150,205,255,0.8), #FFFFFF 50%, rgba(150,205,255,0.8), transparent)', opacity: 0.55 * breath}} />
		</AbsoluteFill>
	);
};

/* ───────────── Éclair ───────────── */

const bolt = (seed: string, x0: number, y0: number, x1: number, y1: number, depth: number, spread: number, withBranches = true): string[] => {
	let pts: [number, number][] = [
		[x0, y0],
		[x1, y1],
	];
	for (let d = 0; d < depth; d++) {
		const next: [number, number][] = [];
		for (let i = 0; i < pts.length - 1; i++) {
			const [ax, ay] = pts[i];
			const [bx, by] = pts[i + 1];
			const off = (random(`${seed}-${d}-${i}`) - 0.5) * spread / (d + 1);
			next.push([ax, ay], [(ax + bx) / 2 + off, (ay + by) / 2 + off * 0.2]);
		}
		next.push(pts[pts.length - 1]);
		pts = next;
	}
	const main = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
	const branches: string[] = [];
	for (let b = 0; withBranches && b < 4; b++) {
		const k = Math.floor((0.2 + random(`${seed}-b${b}`) * 0.6) * pts.length);
		const [bx, by] = pts[k];
		const dir = random(`${seed}-dir${b}`) > 0.5 ? 1 : -1;
		const sub = bolt(`${seed}-sub${b}`, bx, by, bx + dir * (80 + random(`${seed}-l${b}`) * 160), by + 120 + random(`${seed}-h${b}`) * 140, 4, 70, false);
		branches.push(sub[0]);
	}
	return [main, ...branches];
};

const Lightning: React.FC<{frame: number; at: number; x0: number; x1: number; y1: number; seed: string; strength?: number}> = ({frame, at, x0, x1, y1, seed, strength = 1}) => {
	const t = frame - at;
	// Clignotement d'un vrai éclair : on / off / on
	const visible = [0, 1, 3, 4, 7].includes(t + 2);
	if (!visible) return null;
	const paths = bolt(seed + (t > 2 ? 'b' : 'a'), x0, -30, x1, y1, 7, 220);
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: strength}}>
			<defs>
				<filter id={`boltGlow${seed}`} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="9" result="b" />
					<feMerge>
						<feMergeNode in="b" />
						<feMergeNode in="b" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			{paths.map((p, i) => (
				<polyline key={i} points={p} fill="none" stroke={i === 0 ? '#F2FAFF' : '#BFE6FF'} strokeWidth={i === 0 ? 5 : 2} strokeLinejoin="round" filter={`url(#boltGlow${seed})`} />
			))}
		</svg>
	);
};

/* ───────────── Particules : braises + étincelles ───────────── */

const Embers: React.FC<{frame: number}> = ({frame}) => {
	const density = tween(frame, [0, 60], [0.25, 0.6]) + tween(frame, [T.strike, T.strike + 30], [0, 0.4]);
	const n = 130;
	return (
		<AbsoluteFill style={{mixBlendMode: 'screen'}}>
			{Array.from({length: n}, (_, i) => {
				if (random(`e-on${i}`) > density) return null;
				const speed = 0.9 + random(`e-v${i}`) * 2.2;
				const y = 1120 - ((frame * speed + random(`e-o${i}`) * 1300) % 1300);
				const x = random(`e-x${i}`) * 1920 + Math.sin((frame + i * 37) / (22 + (i % 7) * 4)) * 30;
				const size = 2.5 + random(`e-s${i}`) * 5;
				const flick = 0.5 + 0.5 * Math.sin(frame / (3 + (i % 5)) + i);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: size,
							height: size,
							borderRadius: size,
							background: i % 4 === 0 ? '#FFD38A' : COLORS.ember,
							boxShadow: `0 0 ${size * 3}px ${COLORS.ember}`,
							opacity: 0.35 + 0.65 * flick,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/** Gerbe d'étincelles (traînées orientées selon leur vitesse). */
const Sparks: React.FC<{frame: number; at: number; x: number; y: number; count: number; speed: number; life: number; seed: string; up?: boolean}> = ({
	frame,
	at,
	x,
	y,
	count,
	speed,
	life,
	seed,
	up = false,
}) => {
	const t = frame - at;
	if (t < 0 || t > life) return null;
	const g = 0.55;
	return (
		<>
			{Array.from({length: count}, (_, i) => {
				const a = up ? -Math.PI / 2 + (random(`${seed}a${i}`) - 0.5) * 2.4 : random(`${seed}a${i}`) * Math.PI * 2;
				const v = speed * (0.35 + random(`${seed}v${i}`) * 0.9);
				const vx = Math.cos(a) * v;
				const vy = Math.sin(a) * v + g * t;
				const px = x + vx * t;
				const py = y + Math.sin(a) * v * t + 0.5 * g * t * t;
				const len = Math.min(60, Math.hypot(vx, vy) * 2.2);
				const fade = 1 - t / life;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: px,
							top: py,
							width: len,
							height: 2.5,
							borderRadius: 2,
							transformOrigin: '0 50%',
							rotate: `${Math.atan2(vy, vx) + Math.PI}rad`,
							background: `linear-gradient(90deg, #FFF3D0, ${COLORS.ember} 40%, transparent)`,
							opacity: fade,
							mixBlendMode: 'screen',
						}}
					/>
				);
			})}
		</>
	);
};

/* ───────────── Titre forgé ───────────── */

const STEEL = 'linear-gradient(180deg, #FFFFFF 0%, #DCE3EA 34%, #7C8792 50%, #39424C 52%, #C4CDD6 72%, #F3F6F9 100%)';

const letterFrames = () => {
	const out: number[] = [];
	let i = 0;
	TITLE.forEach((word, w) => {
		word.split('').forEach(() => {
			out.push(T.letters + i * T.letterGap + (w > 0 ? 12 : 0));
			i++;
		});
	});
	return out;
};
const LETTER_AT = letterFrames();

const Title: React.FC<{frame: number}> = ({frame}) => {
	let k = 0;
	const sheen = tween(frame, [T.sheen, T.sheen + 34], [-20, 120], EASE.inOut);
	const lastLetter = LETTER_AT[LETTER_AT.length - 1];
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: TITLE_Y - 95, display: 'flex', justifyContent: 'center', gap: 70}}>
			{TITLE.map((word) => (
				<div key={word} style={{display: 'flex', position: 'relative'}}>
					{word.split('').map((ch, j) => {
						const at = LETTER_AT[k++];
						const t = frame - at;
						if (t < 0) return <span key={j} style={{fontFamily: 'Cinzel', fontWeight: 900, fontSize: 160, letterSpacing: '0.04em', opacity: 0}}>{ch}</span>;
						const p = tween(t, [0, 7], [0, 1], EASE.out);
						const hot = tween(t, [0, 20], [1, 0]); // le métal refroidit
						return (
							<span
								key={j}
								style={{
									fontFamily: 'Cinzel',
									fontWeight: 900,
									fontSize: 160,
									lineHeight: 1.2,
									letterSpacing: '0.04em',
									display: 'inline-block',
									backgroundImage: STEEL,
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
									color: 'transparent',
									opacity: p,
									scale: `${2.4 - 1.4 * p}`,
									translate: `0px ${-40 * (1 - p)}px`,
									filter: `blur(${12 * (1 - p)}px) drop-shadow(0 0 ${6 + 26 * hot}px rgba(255,${122 + 80 * (1 - hot)},${26 + 200 * (1 - hot)},${0.25 + 0.6 * hot})) drop-shadow(0 6px 3px rgba(0,0,0,0.85))`,
								}}
							>
								{ch}
							</span>
						);
					})}
					{/* Reflet qui balaie le métal */}
					{frame >= T.sheen ? (
						<div
							aria-hidden
							style={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								fontFamily: 'Cinzel',
								fontWeight: 900,
								fontSize: 160,
								lineHeight: 1.2,
								letterSpacing: '0.04em',
								backgroundImage: `linear-gradient(110deg, transparent ${sheen - 10}%, rgba(255,255,255,0.95) ${sheen}%, transparent ${sheen + 10}%)`,
								WebkitBackgroundClip: 'text',
								backgroundClip: 'text',
								color: 'transparent',
								mixBlendMode: 'screen',
								opacity: frame > lastLetter ? 1 : 0,
							}}
						>
							{word}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
};

const Subtitle: React.FC<{frame: number}> = ({frame}) => {
	const p = tween(frame, [T.slash, T.slash + 8], [0, 1], EASE.inOut);
	if (p <= 0) return null;
	const lineW = tween(frame, [T.slash - 14, T.slash + 4], [0, 1], EASE.out);
	return (
		<>
			{/* filets dorés de part et d'autre */}
			{[-1, 1].map((s) => (
				<div
					key={s}
					style={{
						position: 'absolute',
						top: TITLE_Y + 132,
						left: s < 0 ? CX - 520 : CX + 220,
						width: 300,
						height: 2,
						background: `linear-gradient(${s < 0 ? 90 : 270}deg, transparent, ${COLORS.gold})`,
						scale: `${lineW} 1`,
						transformOrigin: s < 0 ? 'right' : 'left',
					}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: TITLE_Y + 100,
					textAlign: 'center',
					fontFamily: 'Cinzel',
					fontWeight: 600,
					fontSize: 52,
					letterSpacing: '0.9em',
					marginRight: '-0.9em',
					color: COLORS.gold,
					textShadow: '0 0 18px rgba(233,180,76,0.55)',
					clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
				}}
			>
				{SUBTITLE}
			</div>
			{/* Trait de lame */}
			{p < 1 ? (
				<div
					style={{
						position: 'absolute',
						top: TITLE_Y + 95,
						left: CX - 260 + p * 520,
						width: 6,
						height: 80,
						rotate: '18deg',
						background: '#FFFFFF',
						boxShadow: `0 0 24px 8px rgba(255,236,190,0.9), 0 0 80px 20px rgba(233,180,76,0.6)`,
					}}
				/>
			) : null}
		</>
	);
};

const Words: React.FC<{frame: number}> = ({frame}) => (
	<>
		{WORDS.map((w, i) => {
			const at = T.words[i];
			const t = frame - at;
			if (t < 0 || t > 18) return null;
			const o = tween(t, [0, 3], [0, 1]) * tween(t, [12, 18], [1, 0]);
			return (
				<div
					key={w}
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: TITLE_Y - 30,
						textAlign: 'center',
						fontFamily: 'Cinzel',
						fontWeight: 600,
						fontSize: 64,
						letterSpacing: `${0.3 + t * 0.02}em`,
						color: COLORS.steel,
						opacity: o,
						filter: `blur(${tween(t, [0, 4], [10, 0]) + tween(t, [12, 18], [0, 8])}px)`,
						textShadow: '0 0 30px rgba(167,220,255,0.6)',
					}}
				>
					{w}
				</div>
			);
		})}
	</>
);

/* ───────────── Composition ───────────── */

export const AlphaRagnar: React.FC = () => {
	const frame = useCurrentFrame();
	const shake = shakeAt(frame);
	const push = tween(frame, [0, DURATION], [1.0, 1.07], EASE.soft) + 0.06 * pulse(frame, T.strike, T.strike + 1, T.strike + 16);
	const bars = 140 * (1 - tween(frame, [T.strike, T.strike + 14], [0, 1], EASE.out));
	const flash = pulse(frame, T.strike - 1, T.strike, T.strike + 10) + 0.5 * pulse(frame, T.final - 1, T.final, T.final + 12) + 0.18 * pulse(frame, T.echo, T.echo + 1, T.echo + 6);
	const shock = (at: number) => {
		const t = frame - at;
		if (t < 0 || t > 24) return null;
		const r = tween(t, [0, 24], [60, 1500], EASE.out);
		return (
			<div
				style={{
					position: 'absolute',
					left: CX - r,
					top: CY - r,
					width: r * 2,
					height: r * 2,
					borderRadius: '50%',
					border: `${tween(t, [0, 24], [26, 2])}px solid rgba(220,240,255,${tween(t, [0, 24], [0.9, 0])})`,
					boxShadow: `0 0 60px rgba(167,220,255,${tween(t, [0, 24], [0.8, 0])}), inset 0 0 60px rgba(167,220,255,${tween(t, [0, 24], [0.6, 0])})`,
				}}
			/>
		);
	};
	const glitch = 0.7 * pulse(frame, T.strike, T.strike + 1, T.strike + 7) + 0.35 * pulse(frame, T.final, T.final + 1, T.final + 6);
	const fade = tween(frame, [T.fadeOut, DURATION], [0, 1], EASE.in);

	return (
		<AbsoluteFill style={{background: COLORS.bg, overflow: 'hidden'}}>
			<Glitch intensity={glitch} seed="ragnar">
				<AbsoluteFill style={{translate: `${shake.x}px ${shake.y}px`, rotate: `${shake.r}deg`, scale: `${push}`}}>
					<Smoke frame={frame} />
					<GodRays frame={frame} />
					<Cracks frame={frame} />
					<Lightning frame={frame} at={T.echo} x0={1500} x1={1650} y1={620} seed="echo" strength={0.45} />
					<RuneRing frame={frame} />
					<Character frame={frame} />
					<Emblem frame={frame} />
					<Headlamp frame={frame} />
					<Lightning frame={frame} at={T.strike} x0={1010} x1={CX} y1={CY} seed="strike" />
					{shock(T.strike)}
					{shock(T.strike + 5)}
					{shock(T.final)}
					<AbsoluteFill style={{background: `radial-gradient(ellipse 55% 22% at 50% ${((TITLE_Y + 40) / 1080) * 100}%, rgba(2,4,8,0.82), transparent 75%)`, opacity: tween(frame, [T.letters - 10, T.letters + 10], [0, 1])}} />
					<Words frame={frame} />
					<Title frame={frame} />
					<Subtitle frame={frame} />
					<Embers frame={frame} />
					<Sparks frame={frame} at={T.strike} x={CX} y={CY} count={80} speed={26} life={40} seed="strike" />
					<Sparks frame={frame} at={T.final} x={CX} y={CY} count={60} speed={22} life={36} seed="final" />
					{LETTER_AT.map((at, i) => (
						<Sparks key={i} frame={frame} at={at + 6} x={CX - 700 + (i / (LETTER_AT.length - 1)) * 1400} y={TITLE_Y + 60} count={14} speed={14} life={26} seed={`l${i}`} up />
					))}
					<Sparks frame={frame} at={T.slash + 4} x={CX + 260} y={TITLE_Y + 130} count={24} speed={16} life={28} seed="slash" />
				</AbsoluteFill>
			</Glitch>

			{/* Reflet anamorphique (trait de lumière horizontal) */}
			{[T.strike, T.final, T.sheen + 14].map((at, i) => {
				const p = pulse(frame, at - 2, at + 1, at + (i === 2 ? 24 : 18));
				if (p <= 0) return null;
				const y = i === 2 ? TITLE_Y : CY;
				return (
					<div
						key={at}
						style={{
							position: 'absolute',
							left: -200,
							right: -200,
							top: y - 3,
							height: 6,
							background: 'linear-gradient(90deg, transparent, rgba(120,190,255,0.9) 35%, #FFFFFF 50%, rgba(120,190,255,0.9) 65%, transparent)',
							boxShadow: '0 0 40px 10px rgba(80,160,255,0.5)',
							opacity: p * (i === 2 ? 0.6 : 1),
							mixBlendMode: 'screen',
						}}
					/>
				);
			})}

			{/* Éclair : flash blanc-bleu */}
			<AbsoluteFill style={{background: '#EAF6FF', opacity: Math.min(1, flash), mixBlendMode: 'screen', pointerEvents: 'none'}} />

			{/* Étalonnage : vignette froide */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 65% at 50% 45%, transparent 50%, rgba(0,4,12,0.85) 100%)', pointerEvents: 'none'}} />
			<Grain opacity={0.08} />

			{/* Bandes cinéma qui s'ouvrent à l'éclair */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bars, background: '#000'}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: bars, background: '#000'}} />

			<AbsoluteFill style={{background: '#000', opacity: fade}} />
			<Audio name="Musique + bruitages" src={staticFile('audio/alpha-ragnar.wav')} />
		</AbsoluteFill>
	);
};
