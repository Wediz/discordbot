import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BEAT, BUTTON, C, CTA, DURATION, EARN, LOGO, REDEEM, REFERRAL, S, WEBSITE} from './content';

loadFont({family: 'Playfair', url: staticFile('fonts/playfair-display-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'Playfair', url: staticFile('fonts/playfair-display-latin-600-italic.woff2'), weight: '600', style: 'italic'});
loadFont({family: 'Vibes', url: staticFile('fonts/great-vibes-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'Montserrat', url: staticFile('fonts/montserrat-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'Montserrat', url: staticFile('fonts/montserrat-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'Montserrat', url: staticFile('fonts/montserrat-latin-700-normal.woff2'), weight: '700'});

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const soft = Easing.bezier(0.22, 1, 0.36, 1);
const tw = (f: number, a: number, b: number, from: number, to: number, e: (t: number) => number = soft) =>
	interpolate(f, [a, b], [from, to], {...CL, easing: e});

/** Rebond doux (spring) à partir d'une image donnée. */
const useBounce = () => {
	const {fps} = useVideoConfig();
	return (frame: number, at: number, damping = 12) => spring({frame: frame - at, fps, config: {damping, stiffness: 140, mass: 0.7}});
};

const serif: React.CSSProperties = {fontFamily: 'Playfair', fontWeight: 700, color: C.cocoa};
const sans: React.CSSProperties = {fontFamily: 'Montserrat', fontWeight: 600, color: C.cocoa};
const script: React.CSSProperties = {fontFamily: 'Vibes', fontWeight: 400, color: C.caramel};

/* ───────────── Décor : fond crème, taches de couleur, paillettes ───────────── */

const Backdrop: React.FC = () => {
	const frame = useCurrentFrame();
	const pinkness = tw(frame, S.referral - 10, S.referral + 20, 0, 1) * (1 - tw(frame, S.cta, S.cta + 20, 0, 0.6));
	const blob = (x: number, y: number, r: number, color: string, speed: number, phase: number) => (
		<div
			style={{
				position: 'absolute',
				left: x + Math.sin(frame / speed + phase) * 60 - r,
				top: y + Math.cos(frame / (speed * 1.3) + phase) * 50 - r,
				width: r * 2,
				height: r * 2,
				borderRadius: '50%',
				background: color,
				filter: 'blur(90px)',
				opacity: 0.75,
			}}
		/>
	);
	return (
		<AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
			{blob(180, 260, 340, '#F6D6D3', 70, 0)}
			{blob(950, 640, 360, '#EAD5C1', 80, 2)}
			{blob(200, 1500, 380, '#F3D1D6', 60, 4)}
			{blob(900, 1700, 300, '#EFDCC9', 90, 1)}
			<AbsoluteFill style={{background: `linear-gradient(180deg, #F9D9DE, #F4C6CF)`, opacity: 0.85 * pinkness}} />
			{/* fines lignes dorées en arche, façon papeterie chic */}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.35}}>
				<rect x={46} y={46} width={988} height={1828} rx={480} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray="4 10" />
			</svg>
		</AbsoluteFill>
	);
};

/** Étoile scintillante à 4 branches. */
const Sparkle: React.FC<{x: number; y: number; size: number; delay: number; color?: string}> = ({x, y, size, delay, color = C.gold}) => {
	const frame = useCurrentFrame();
	const t = ((frame + delay) % 50) / 50;
	const s = Math.sin(t * Math.PI);
	return (
		<svg width={size} height={size} viewBox="-10 -10 20 20" style={{position: 'absolute', left: x - size / 2, top: y - size / 2, scale: `${0.3 + 0.7 * s}`, opacity: s, rotate: `${t * 90}deg`}}>
			<path d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10 Z" fill={color} />
		</svg>
	);
};

const Sparkles: React.FC<{n?: number; seed: string; area?: [number, number, number, number]}> = ({n = 22, seed, area = [60, 80, 1020, 1840]}) => (
	<>
		{Array.from({length: n}, (_, i) => (
			<Sparkle
				key={i}
				x={area[0] + random(`${seed}x${i}`) * (area[2] - area[0])}
				y={area[1] + random(`${seed}y${i}`) * (area[3] - area[1])}
				size={18 + random(`${seed}s${i}`) * 34}
				delay={Math.floor(random(`${seed}d${i}`) * 50)}
				color={i % 3 === 0 ? C.white : i % 3 === 1 ? C.gold : C.rose}
			/>
		))}
	</>
);

const Heart: React.FC<{size: number; color?: string; style?: React.CSSProperties}> = ({size, color = C.rose, style}) => (
	<svg width={size} height={size} viewBox="0 0 24 22" style={style}>
		<path d="M12 21 C5 15 1 11 1 6.5 C1 3 3.6 1 6.5 1 C9 1 11 2.6 12 4.6 C13 2.6 15 1 17.5 1 C20.4 1 23 3 23 6.5 C23 11 19 15 12 21 Z" fill={color} />
	</svg>
);

/** Cœurs qui montent doucement (section parrainage). */
const FloatingHearts: React.FC<{from: number; to: number}> = ({from, to}) => {
	const frame = useCurrentFrame();
	if (frame < from || frame > to + 60) return null;
	return (
		<>
			{Array.from({length: 18}, (_, i) => {
				const start = from + Math.floor(random(`h${i}`) * (to - from));
				const t = frame - start;
				if (t < 0 || t > 90) return null;
				const x = 60 + random(`hx${i}`) * 960 + Math.sin(t / 12 + i) * 30;
				const y = 1950 - t * (10 + random(`hv${i}`) * 8);
				return <Heart key={i} size={30 + random(`hs${i}`) * 40} color={i % 2 ? C.rose : '#F2B8C4'} style={{position: 'absolute', left: x, top: y, opacity: Math.min(1, t / 10) * (1 - t / 90), rotate: `${Math.sin(t / 10 + i) * 15}deg`}} />;
			})}
		</>
	);
};

/** Pluie de confettis. */
const Confetti: React.FC<{at: number; x: number; y: number; count?: number}> = ({at, x, y, count = 70}) => {
	const frame = useCurrentFrame();
	const t = frame - at;
	if (t < 0 || t > 80) return null;
	const colors = [C.rose, C.gold, C.latte, '#F6C8D0', C.white, C.roseDeep];
	return (
		<>
			{Array.from({length: count}, (_, i) => {
				const a = -Math.PI / 2 + (random(`c${at}a${i}`) - 0.5) * Math.PI * 1.4;
				const v = 18 + random(`c${at}v${i}`) * 26;
				const px = x + Math.cos(a) * v * t * 0.9;
				const py = y + Math.sin(a) * v * t * 0.9 + 0.55 * t * t;
				const w = 12 + random(`c${at}w${i}`) * 12;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: px,
							top: py,
							width: w,
							height: w * 0.45,
							borderRadius: i % 4 === 0 ? w : 3,
							background: colors[i % colors.length],
							rotate: `${t * (8 + (i % 7) * 3)}deg`,
							scale: `1 ${Math.cos(t / 3 + i)}`,
							opacity: 1 - Math.max(0, t - 55) / 25,
						}}
					/>
				);
			})}
		</>
	);
};

/* ───────────── Icônes simples ───────────── */

const Icon: React.FC<{name: string; size: number; color: string}> = ({name, size, color}) => {
	const p = {fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	return (
		<svg width={size} height={size} viewBox="0 0 24 24">
			{name === 'star' ? <path {...p} d="M12 3l2.6 5.5 6 .7-4.5 4.1 1.2 5.9L12 16.3 6.7 19.2l1.2-5.9L3.4 9.2l6-.7z" /> : null}
			{name === 'camera' ? (
				<>
					<rect {...p} x={3} y={3} width={18} height={18} rx={5} />
					<circle {...p} cx={12} cy={12} r={4} />
					<circle cx={17.3} cy={6.7} r={1.1} fill={color} />
				</>
			) : null}
			{name === 'note' ? <path {...p} d="M14 3v11.5a3.5 3.5 0 1 1-3-3.46M14 3c.5 2.5 2.5 4 5 4" /> : null}
			{name === 'cake' ? (
				<>
					<path {...p} d="M4 20h16M5 20v-7h14v7M5 15.5c2 1.5 3.5 1.5 5 0 1.5 1.5 3 1.5 5 0 1.5 1.5 2.5 1.5 4 0M12 13V9" />
					<path d="M12 4.5c1 1.2 1 2.4 0 3-1-.6-1-1.8 0-3z" fill={color} />
				</>
			) : null}
			{name === 'gift' ? <path {...p} d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7C10 3 6.5 4 8 7M12 7c2-4 5.5-3 4 0" /> : null}
		</svg>
	);
};

/** Silhouette féminine (avatar). */
const Avatar: React.FC<{size: number; color: string; hair: string}> = ({size, color, hair}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx={50} cy={50} r={48} fill={C.white} />
		<path d="M22 58 C18 30 32 16 50 16 C68 16 82 30 78 58 C76 70 72 76 70 80 L30 80 C28 76 24 70 22 58 Z" fill={hair} />
		<circle cx={50} cy={44} r={16} fill="#F2D3C2" />
		<path d="M20 98 C22 74 36 66 50 66 C64 66 78 74 80 98 Z" fill={color} />
		<circle cx={50} cy={50} r={47} fill="none" stroke={C.gold} strokeWidth={2.5} />
	</svg>
);

/* ───────────── Sections ───────────── */

/** Entrée/sortie commune à chaque section (glisse + flou léger). */
const SectionFx: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
	const f = useCurrentFrame();
	const enter = tw(f, 0, 14, 0, 1);
	const exit = tw(f, dur - 10, dur, 0, 1, Easing.in(Easing.cubic));
	return (
		<AbsoluteFill style={{opacity: enter * (1 - exit), translate: `0px ${(1 - enter) * 60 - exit * 80}px`, filter: `blur(${(1 - enter) * 10 + exit * 10}px)`}}>
			{children}
		</AbsoluteFill>
	);
};

const Intro: React.FC = () => {
	const f = useCurrentFrame();
	const bounce = useBounce();
	const shine = tw(f, 40, 70, -30, 130);
	return (
		<SectionFx dur={S.earn - S.intro}>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
				<Img src={staticFile(LOGO)} style={{width: 360, scale: `${bounce(f, 2)}`, opacity: tw(f, 0, 8, 0, 1)}} />
				<div style={{...sans, fontSize: 40, letterSpacing: '0.42em', marginRight: '-0.42em', color: C.caramel, marginTop: 70, opacity: tw(f, 14, 26, 0, 1)}}>
					NOUVEAU
				</div>
				<div
					style={{
						...script,
						fontSize: 230,
						lineHeight: 1.1,
						marginTop: 10,
						clipPath: `inset(0 ${100 - tw(f, 20, 48, 0, 100, Easing.inOut(Easing.cubic))}% 0 0)`,
						backgroundImage: `linear-gradient(110deg, ${C.caramel} ${shine - 12}%, #F3D9B5 ${shine}%, ${C.caramel} ${shine + 12}%)`,
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
						color: 'transparent',
						padding: '0 30px',
					}}
				>
					Fidélité
				</div>
				<div style={{...serif, fontStyle: 'italic', fontWeight: 600, fontSize: 56, color: C.cocoa, marginTop: 10, opacity: tw(f, 44, 58, 0, 1), translate: `0px ${tw(f, 44, 60, 30, 0)}px`}}>
					ton programme de récompenses
				</div>
			</AbsoluteFill>
			<Sparkles seed="intro" n={18} />
		</SectionFx>
	);
};

const Earn: React.FC = () => {
	const f = useCurrentFrame();
	const bounce = useBounce();
	const coinFlip = tw(f, 14, 34, 0, 720);
	return (
		<SectionFx dur={S.redeem - S.earn}>
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 400}}>
				<div style={{...serif, fontSize: 104, textAlign: 'center'}}>{EARN.title}</div>
				{/* 1 € = 1 point, avec une pièce qui tourne */}
				<div style={{display: 'flex', alignItems: 'center', gap: 34, marginTop: 70, scale: `${bounce(f, 10)}`}}>
					<div
						style={{
							width: 170,
							height: 170,
							borderRadius: '50%',
							background: `radial-gradient(circle at 35% 30%, #FFF1C9, ${C.gold} 55%, #A9812F)`,
							boxShadow: '0 16px 40px rgba(139,106,78,0.35), inset 0 0 0 8px rgba(255,255,255,0.35)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							scale: `${Math.abs(Math.cos((coinFlip * Math.PI) / 180)) * 0.85 + 0.15} 1`,
						}}
					>
						<span style={{...serif, fontSize: 84, color: C.white, textShadow: '0 2px 6px rgba(120,80,20,0.5)'}}>€</span>
					</div>
					<div style={{...serif, fontSize: 92}}>
						{EARN.main.left} <span style={{color: C.roseDeep}}>=</span> {EARN.main.right}
					</div>
				</div>
				<div style={{...sans, fontWeight: 500, fontSize: 38, color: C.caramel, marginTop: 26, opacity: tw(f, 22, 34, 0, 1)}}>à chaque commande</div>
				{/* Bonus */}
				<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 34, marginTop: 110, width: 920}}>
					{EARN.ways.map((w, i) => {
						const at = 36 + i * 8;
						const s = bounce(f, at, 10);
						return (
							<div
								key={w.label}
								style={{
									background: C.white,
									borderRadius: 36,
									padding: '40px 30px',
									display: 'flex',
									alignItems: 'center',
									gap: 22,
									boxShadow: '0 14px 40px rgba(139,106,78,0.16)',
									scale: `${s}`,
									opacity: Math.min(1, s * 1.5),
								}}
							>
								<div style={{width: 84, height: 84, borderRadius: 42, background: C.blush, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
									<Icon name={w.icon} size={46} color={C.roseDeep} />
								</div>
								<div>
									<div style={{...sans, fontWeight: 500, fontSize: 34, color: C.caramel}}>{w.label}</div>
									<div style={{...serif, fontSize: 54, color: C.cocoa}}>
										{w.points} <span style={{fontSize: 30}}>pts</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
			<Sparkles seed="earn" n={14} />
		</SectionFx>
	);
};

const Voucher: React.FC<{points: string; value: string; at: number; tilt: number}> = ({points, value, at, tilt}) => {
	const f = useCurrentFrame();
	const bounce = useBounce();
	const s = bounce(f, at, 11);
	return (
		<div
			style={{
				position: 'relative',
				width: 820,
				height: 300,
				marginTop: 70,
				rotate: `${tilt * s}deg`,
				translate: `${(1 - s) * (tilt > 0 ? 900 : -900)}px 0px`,
				filter: 'drop-shadow(0 18px 30px rgba(139,106,78,0.28))',
			}}
		>
			{/* ticket avec encoches */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 34,
					background: `linear-gradient(120deg, ${C.white}, #FFF4EE)`,
					WebkitMaskImage: 'radial-gradient(circle 34px at 0 50%, transparent 98%, black 100%), radial-gradient(circle 34px at 100% 50%, transparent 98%, black 100%)',
					WebkitMaskComposite: 'source-in',
					maskImage: 'radial-gradient(circle 34px at 0 50%, transparent 98%, black 100%), radial-gradient(circle 34px at 100% 50%, transparent 98%, black 100%)',
					maskComposite: 'intersect',
				}}
			/>
			<div style={{position: 'absolute', left: 300, top: 40, bottom: 40, borderLeft: `3px dashed ${C.latte}`}} />
			<div style={{position: 'absolute', left: 0, width: 300, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
				<Icon name="gift" size={80} color={C.roseDeep} />
				<div style={{...sans, fontSize: 34, color: C.caramel, marginTop: 10}}>{points}</div>
			</div>
			<div style={{position: 'absolute', left: 300, right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
				<div style={{...serif, fontSize: 130, lineHeight: 1, color: C.cocoa}}>{value}</div>
				<div style={{...sans, fontWeight: 500, fontSize: 34, color: C.caramel, marginTop: 8}}>de réduction</div>
			</div>
		</div>
	);
};

const Redeem: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<SectionFx dur={S.referral - S.redeem}>
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 470}}>
				<div style={{...serif, fontSize: 104, opacity: tw(f, 2, 14, 0, 1)}}>{REDEEM.title}</div>
				<div style={{...script, fontSize: 130, lineHeight: 1, marginTop: -6, opacity: tw(f, 8, 20, 0, 1)}}>{REDEEM.subtitle}</div>
				<Voucher points={REDEEM.vouchers[0].points} value={REDEEM.vouchers[0].value} at={18} tilt={-3} />
				<Voucher points={REDEEM.vouchers[1].points} value={REDEEM.vouchers[1].value} at={30} tilt={2.5} />
			</AbsoluteFill>
			<Sparkles seed="redeem" n={14} />
		</SectionFx>
	);
};

const Referral: React.FC = () => {
	const f = useCurrentFrame();
	const bounce = useBounce();
	const dur = S.cta - S.referral;
	// lien qui relie les deux copines, cœur qui voyage
	const linkDraw = tw(f, 66, 92, 0, 1, Easing.inOut(Easing.cubic));
	const heartT = tw(f, 92, 118, 0, 1, Easing.inOut(Easing.cubic));
	const tap = 82; // appui sur « Partager »
	const press = interpolate(f, [tap - 2, tap, tap + 6], [1, 0.92, 1], CL);
	const giftsAt = 126;
	const ax = 250;
	const bx = 830;
	const ay = 850;
	return (
		<SectionFx dur={dur}>
			<AbsoluteFill>
				<div style={{position: 'absolute', top: 240, left: 0, right: 0, textAlign: 'center', ...sans, fontWeight: 500, fontSize: 36, letterSpacing: '0.08em', color: C.caramel, opacity: tw(f, 0, 12, 0, 1)}}>
					{REFERRAL.kicker}
				</div>
				<div
					style={{
						position: 'absolute',
						top: 285,
						left: 0,
						right: 0,
						textAlign: 'center',
						...script,
						fontSize: 250,
						lineHeight: 1.05,
						color: C.roseDeep,
						clipPath: `inset(0 ${100 - tw(f, 8, 34, 0, 100, Easing.inOut(Easing.cubic))}% 0 0)`,
						textShadow: '0 6px 24px rgba(210,127,146,0.35)',
					}}
				>
					{REFERRAL.script}
				</div>
				<div style={{position: 'absolute', top: 540, left: 0, right: 0, textAlign: 'center', ...serif, fontStyle: 'italic', fontWeight: 600, fontSize: 92, scale: `${bounce(f, 28)}`}}>
					{REFERRAL.title}
				</div>

				{/* Toi —— lien —— ta copine */}
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<path d={`M${ax + 90} ${ay} Q 540 ${ay - 120} ${bx - 90} ${ay}`} fill="none" stroke={C.roseDeep} strokeWidth={5} strokeDasharray="2 16" strokeLinecap="round" pathLength={1} strokeDashoffset={0} style={{clipPath: `inset(0 ${(1 - linkDraw) * 100}% 0 0)`}} />
				</svg>
				{[
					{x: ax, label: REFERRAL.you, color: C.caramel, hair: '#6B4A32', at: 40},
					{x: bx, label: REFERRAL.friend, color: C.rose, hair: '#B07A4F', at: 48},
				].map((p) => (
					<div key={p.label} style={{position: 'absolute', left: p.x - 160, top: ay - 110, width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', scale: `${bounce(f, p.at, 10)}`}}>
						<div style={{filter: 'drop-shadow(0 12px 24px rgba(139,106,78,0.3))'}}>
							<Avatar size={220} color={p.color} hair={p.hair} />
						</div>
						<div style={{...serif, fontSize: 50, marginTop: 14, whiteSpace: 'nowrap'}}>{p.label}</div>
					</div>
				))}
				{heartT > 0 && heartT < 1 ? (
					<Heart
						size={70}
						color={C.roseDeep}
						style={{
							position: 'absolute',
							left: ax + 90 + (bx - ax - 180) * heartT - 35,
							top: ay - 35 - Math.sin(heartT * Math.PI) * 90,
							scale: `${1 + 0.3 * Math.sin(heartT * Math.PI * 4)}`,
						}}
					/>
				) : null}

				{/* Lien de parrainage + bouton Partager */}
				<div style={{position: 'absolute', top: 1080, left: 90, right: 90, opacity: tw(f, 54, 66, 0, 1), translate: `0px ${tw(f, 54, 70, 40, 0)}px`}}>
					<div style={{...sans, fontWeight: 500, fontSize: 30, color: C.caramel, marginBottom: 12, marginLeft: 8}}>{REFERRAL.link}</div>
					<div style={{display: 'flex', gap: 18}}>
						<div style={{flex: 1, background: C.white, borderRadius: 26, padding: '24px 30px', ...sans, fontWeight: 500, fontSize: 34, color: '#7A6A60', boxShadow: '0 10px 26px rgba(139,106,78,0.14)', whiteSpace: 'nowrap', overflow: 'hidden'}}>
							{WEBSITE}/…
						</div>
						<div
							style={{
								background: f >= tap ? C.roseDeep : C.caramel,
								borderRadius: 26,
								padding: '24px 40px',
								...sans,
								color: C.white,
								fontWeight: 700,
								fontSize: 34,
								scale: `${press}`,
								boxShadow: f >= tap ? `0 0 0 ${tw(f, tap, tap + 16, 0, 26)}px rgba(210,127,146,${tw(f, tap, tap + 16, 0.45, 0)})` : 'none',
							}}
						>
							{REFERRAL.share}
						</div>
					</div>
				</div>

				{/* Les deux récompenses */}
				<div style={{position: 'absolute', top: 1270, left: 70, right: 70, display: 'flex', gap: 30}}>
					{[
						{who: REFERRAL.friend, ...REFERRAL.friendGets, at: giftsAt, bg: `linear-gradient(150deg, #F9D3DA, ${C.rose})`},
						{who: REFERRAL.you, ...REFERRAL.youGet, at: giftsAt + 10, bg: `linear-gradient(150deg, #F3E0C8, ${C.latte})`},
					].map((g) => {
						const s = bounce(f, g.at, 9);
						return (
							<div
								key={g.who}
								style={{
									flex: 1,
									background: g.bg,
									borderRadius: 44,
									padding: '40px 24px 44px',
									textAlign: 'center',
									scale: `${s}`,
									opacity: Math.min(1, s * 1.5),
									boxShadow: '0 20px 40px rgba(139,106,78,0.25)',
								}}
							>
								<div style={{...sans, fontWeight: 600, fontSize: 32, color: C.white, letterSpacing: '0.06em'}}>{g.who.toUpperCase()}</div>
								<div style={{...serif, fontSize: g.big.length > 6 ? 84 : 120, lineHeight: 1.1, color: C.white, marginTop: 14, textShadow: '0 4px 14px rgba(120,60,60,0.25)'}}>{g.big}</div>
								<div style={{...sans, fontWeight: 500, fontSize: 30, color: C.white, marginTop: 10}}>{g.small}</div>
							</div>
						);
					})}
				</div>
				<div style={{position: 'absolute', top: 1645, left: 60, right: 60, textAlign: 'center', ...script, fontSize: 74, color: C.cocoa, opacity: tw(f, giftsAt + 30, giftsAt + 44, 0, 1)}}>
					{REFERRAL.together}
				</div>
			</AbsoluteFill>
			<Sparkles seed="ref" n={20} />
			<Confetti at={giftsAt + 2} x={540} y={1380} />
			<Confetti at={tap} x={870} y={1130} count={30} />
		</SectionFx>
	);
};

const Cta: React.FC = () => {
	const f = useCurrentFrame();
	const bounce = useBounce();
	const pulse = 1 + 0.05 * Math.max(0, Math.sin(((f - 30) / BEAT) * Math.PI));
	const tap = 52;
	const press = interpolate(f, [tap - 2, tap, tap + 6], [1, 0.9, 1], CL);
	const cx = tw(f, 34, tap - 2, 980, 660, Easing.inOut(Easing.cubic));
	const cy = tw(f, 34, tap - 2, 1880, 1190, Easing.inOut(Easing.cubic));
	return (
		<AbsoluteFill style={{opacity: tw(f, 0, 12, 0, 1)}}>
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 440}}>
				<Img src={staticFile(LOGO)} style={{width: 300, scale: `${bounce(f, 2)}`}} />
				<div style={{...sans, fontWeight: 500, fontSize: 42, color: C.caramel, marginTop: 80}}>{CTA.line}</div>
				<div style={{...serif, fontSize: 100, marginTop: 6, scale: `${bounce(f, 10)}`}}>{WEBSITE}</div>
				<div style={{...sans, fontWeight: 500, fontSize: 36, color: C.caramel, marginTop: 110, opacity: tw(f, 18, 28, 0, 1)}}>{CTA.hint}</div>
				<div
					style={{
						marginTop: 34,
						display: 'flex',
						alignItems: 'center',
						gap: 22,
						background: C.caramel,
						borderRadius: 80,
						padding: '34px 70px',
						...sans,
						color: C.white,
						fontWeight: 600,
						fontSize: 56,
						letterSpacing: '0.06em',
						scale: `${bounce(f, 22) * pulse * press}`,
						boxShadow: `0 18px 40px rgba(139,106,78,0.35), 0 0 0 ${f >= tap ? tw(f, tap, tap + 18, 0, 34) : 0}px rgba(212,175,106,${f >= tap ? tw(f, tap, tap + 18, 0.5, 0) : 0})`,
					}}
				>
					<svg width={44} height={44} viewBox="-10 -10 20 20">
						<path d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10 Z" fill="#F7E3B4" />
					</svg>
					{BUTTON}
					<svg width={44} height={44} viewBox="-10 -10 20 20">
						<path d="M0 -10 C1 -2 2 -1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2 -1 -1 -2 0 -10 Z" fill="#F7E3B4" />
					</svg>
				</div>
			</AbsoluteFill>
			{/* doigt qui appuie */}
			<div style={{position: 'absolute', left: cx, top: cy, opacity: tw(f, 34, 40, 0, 1) * (1 - tw(f, tap + 20, tap + 28, 0, 1)), scale: `${f >= tap - 2 && f < tap + 6 ? 0.88 : 1}`}}>
				<svg width={110} height={110} viewBox="0 0 24 24">
					<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5c0 3.6-2.4 6.5-6 6.5h-.6c-2 0-3.4-.9-4.6-2.5L5 15.3c-.7-.9-.5-2.1.4-2.6.8-.5 1.8-.2 2.3.5L9 15" fill={C.white} stroke={C.cocoa} strokeWidth={1.3} strokeLinejoin="round" />
				</svg>
			</div>
			<Sparkles seed="cta" n={24} />
			<Confetti at={tap} x={540} y={1210} count={50} />
		</AbsoluteFill>
	);
};

/* ───────────── Composition ───────────── */

export const InnaFidelite: React.FC = () => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Backdrop />
			<Sequence name="1 Intro" from={S.intro} durationInFrames={S.earn - S.intro} premountFor={fps}>
				<Intro />
			</Sequence>
			<Sequence name="2 Gagner des points" from={S.earn} durationInFrames={S.redeem - S.earn} premountFor={fps}>
				<Earn />
			</Sequence>
			<Sequence name="3 Échanger" from={S.redeem} durationInFrames={S.referral - S.redeem} premountFor={fps}>
				<Redeem />
			</Sequence>
			<FloatingHearts from={S.referral + 20} to={S.cta - 30} />
			<Sequence name="4 Parrainage" from={S.referral} durationInFrames={S.cta - S.referral} premountFor={fps}>
				<Referral />
			</Sequence>
			<Sequence name="5 Appel à l'action" from={S.cta} durationInFrames={DURATION - S.cta} premountFor={fps}>
				<Cta />
			</Sequence>
			{/* fondu de fin */}
			<AbsoluteFill style={{background: C.cream, opacity: interpolate(frame, [DURATION - 8, DURATION], [0, 0.6], CL)}} />
			<Audio name="Musique + bruitages" src={staticFile('audio/inna-fidelite.wav')} />
		</AbsoluteFill>
	);
};
