import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../theme';

/**
 * ─── ANIMATION « J'AIME / ABONNE-TOI / CLOCHE » (fond transparent) ───
 * 1920×1080, 30 images/s, 7 s. Textes et chaîne réglables par props
 * (voir les compositions AbonneUrbexFrance / AbonneAlphaRagnar dans Root.tsx).
 */
export type SubscribeProps = {
	channel: string;
	tagline: string;
	avatar: string;
	accent: string;
};

export const SUBSCRIBE_DURATION = 210;

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const tw = (f: number, a: number, b: number, from: number, to: number, e = Easing.bezier(0.22, 1, 0.36, 1)) => interpolate(f, [a, b], [from, to], {...CL, easing: e});

const LIKE = 52;
const SUB = 92;
const BELL = 132;
const OUT = 186;

const RED = '#FF0033';
const PILL_H = 132;
const LEFT = 70;
const BOTTOM = 90;

/** Petite gerbe de particules au moment d'un clic. */
const Burst: React.FC<{at: number; x: number; y: number; color: string; seed: string}> = ({at, x, y, color, seed}) => {
	const f = useCurrentFrame();
	const t = f - at;
	if (t < 0 || t > 22) return null;
	return (
		<>
			{Array.from({length: 12}, (_, i) => {
				const a = (i / 12) * Math.PI * 2 + random(`${seed}${i}`) * 0.4;
				const d = tw(t, 0, 18, 10, 70 + random(`${seed}d${i}`) * 30);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x + Math.cos(a) * d - 5,
							top: y + Math.sin(a) * d - 5,
							width: 10,
							height: 10,
							borderRadius: 5,
							background: i % 3 ? color : '#FFFFFF',
							opacity: 1 - t / 22,
							scale: `${1 - t / 30}`,
						}}
					/>
				);
			})}
		</>
	);
};

const Thumb: React.FC<{filled: boolean; size: number}> = ({filled, size}) => (
	<svg width={size} height={size} viewBox="0 0 24 24">
		<path
			d="M7 21H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3m0 10V11m0 10h9.6a2 2 0 0 0 2-1.7l1.3-7A2 2 0 0 0 17.9 10H14V5.5A2.5 2.5 0 0 0 11.5 3L7 11"
			fill={filled ? '#FFFFFF' : 'none'}
			stroke="#FFFFFF"
			strokeWidth={1.8}
			strokeLinejoin="round"
		/>
	</svg>
);

const BellIcon: React.FC<{filled: boolean; size: number}> = ({filled, size}) => (
	<svg width={size} height={size} viewBox="0 0 24 24">
		<path d="M12 3c-3.3 0-5.5 2.6-5.5 6v4.2L4.8 16.5h14.4L17.5 13.2V9c0-3.4-2.2-6-5.5-6z" fill={filled ? '#FFFFFF' : 'none'} stroke="#FFFFFF" strokeWidth={1.8} strokeLinejoin="round" />
		<path d="M9.8 19a2.3 2.3 0 0 0 4.4 0" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
	</svg>
);

export const SubscribeOverlay: React.FC<SubscribeProps> = ({channel, tagline, avatar, accent}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const sp = (at: number, damping = 13) => spring({frame: f - at, fps, config: {damping, stiffness: 160, mass: 0.6}});

	// Le bandeau s'ouvre puis se referme
	const open = sp(2, 15);
	const close = tw(f, OUT, OUT + 16, 0, 1, Easing.in(Easing.cubic));
	const pillW = 1120 * open * (1 - close * 0.25);
	const alpha = Math.min(1, open * 2) * (1 - close);

	// Positions des boutons (dans le bandeau)
	const top = 1080 - BOTTOM - PILL_H;
	const likeX = LEFT + 470;
	const subX = LEFT + 700;
	const bellX = LEFT + 1010;
	const midY = top + PILL_H / 2;

	// Curseur : J'aime → S'abonner → Cloche
	const path: [number, number, number][] = [
		[24, 1900, 1150],
		[LIKE - 2, likeX + 60, midY + 6],
		[SUB - 2, subX + 120, midY + 6],
		[BELL - 2, bellX, midY + 6],
		[OUT - 10, bellX + 260, 1150],
	];
	const times = path.map((p) => p[0]);
	const cx = interpolate(f, times, path.map((p) => p[1]), {...CL, easing: Easing.inOut(Easing.cubic)});
	const cy = interpolate(f, times, path.map((p) => p[2]), {...CL, easing: Easing.inOut(Easing.cubic)});
	const pressed = [LIKE, SUB, BELL].some((c) => f >= c - 1 && f < c + 4);

	const liked = f >= LIKE;
	const subscribed = f >= SUB;
	const rang = f >= BELL;
	const bellSwing = rang ? Math.sin((f - BELL) * 0.9) * 26 * Math.exp(-(f - BELL) / 14) : 0;
	const pop = (at: number) => 1 + 0.25 * Math.max(0, Math.sin(((f - at) / 8) * Math.PI)) * (f >= at && f < at + 8 ? 1 : 0);

	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: LEFT,
					top,
					width: pillW,
					height: PILL_H,
					borderRadius: PILL_H / 2,
					background: 'rgba(15,15,17,0.88)',
					boxShadow: `0 18px 50px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.08)`,
					overflow: 'hidden',
					opacity: alpha,
				}}
			>
				{/* liseré de couleur de la chaîne */}
				<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: accent}} />
				{/* avatar + nom */}
				<div style={{position: 'absolute', left: 22, top: 18, width: 96, height: 96, borderRadius: 48, overflow: 'hidden', border: `3px solid ${accent}`, scale: `${sp(8)}`}}>
					<Img src={staticFile(avatar)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				</div>
				<div style={{position: 'absolute', left: 140, top: 24, opacity: tw(f, 12, 22, 0, 1), translate: `${tw(f, 12, 24, -20, 0)}px 0px`}}>
					<div style={{fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 46, color: '#FFFFFF', letterSpacing: '0.02em', whiteSpace: 'nowrap'}}>{channel}</div>
					<div style={{fontFamily: 'Barlow Condensed', fontWeight: 500, fontSize: 28, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap'}}>{tagline}</div>
				</div>

				{/* J'aime */}
				<div
					style={{
						position: 'absolute',
						left: likeX - LEFT,
						top: 30,
						height: 72,
						padding: '0 26px',
						borderRadius: 36,
						background: liked ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
						display: 'flex',
						alignItems: 'center',
						gap: 14,
						scale: `${sp(18) * pop(LIKE)}`,
					}}
				>
					<div style={{rotate: `${liked ? -12 * Math.exp(-(f - LIKE) / 6) : 0}deg`}}>
						<Thumb filled={liked} size={42} />
					</div>
					<span style={{fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 36, color: '#FFFFFF'}}>J'aime</span>
				</div>

				{/* S'abonner → Abonné */}
				<div
					style={{
						position: 'absolute',
						left: subX - LEFT,
						top: 30,
						height: 72,
						width: 270,
						borderRadius: 36,
						background: subscribed ? 'rgba(255,255,255,0.18)' : RED,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 12,
						scale: `${sp(24) * pop(SUB)}`,
						boxShadow: subscribed ? 'none' : `0 0 30px rgba(255,0,51,${0.35 + 0.25 * Math.sin(f / 5)})`,
					}}
				>
					{subscribed ? (
						<svg width={34} height={34} viewBox="0 0 24 24">
							<path d="M4 12.5 L9.5 18 L20 6" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tw(f, SUB, SUB + 8, 0, 1)} />
						</svg>
					) : null}
					<span style={{fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 38, color: '#FFFFFF', letterSpacing: '0.02em'}}>{subscribed ? 'Abonné' : "S'abonner"}</span>
				</div>

				{/* Cloche */}
				<div
					style={{
						position: 'absolute',
						left: bellX - LEFT - 36,
						top: 30,
						width: 72,
						height: 72,
						borderRadius: 36,
						background: rang ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						scale: `${sp(30) * pop(BELL)}`,
					}}
				>
					<div style={{rotate: `${bellSwing}deg`, transformOrigin: '50% 15%'}}>
						<BellIcon filled={rang} size={42} />
					</div>
				</div>
			</div>

			{/* Ondes de la cloche */}
			{rang && f < BELL + 30
				? [0, 1].map((k) => (
						<div
							key={k}
							style={{
								position: 'absolute',
								left: bellX - 40 - (f - BELL - k * 8) * 2.2,
								top: midY - 40 - (f - BELL - k * 8) * 2.2,
								width: 80 + (f - BELL - k * 8) * 4.4,
								height: 80 + (f - BELL - k * 8) * 4.4,
								borderRadius: '50%',
								border: `3px solid ${accent}`,
								opacity: f - BELL - k * 8 < 0 ? 0 : Math.max(0, 1 - (f - BELL - k * 8) / 20),
							}}
						/>
					))
				: null}

			<Burst at={LIKE} x={likeX + 60} y={midY} color={accent} seed="like" />
			<Burst at={SUB} x={subX + 135} y={midY} color={RED} seed="sub" />
			<Burst at={BELL} x={bellX} y={midY} color={accent} seed="bell" />

			{/* « Merci ! » */}
			<div
				style={{
					position: 'absolute',
					left: LEFT + 40,
					top: top - 74,
					fontFamily: 'Barlow Condensed',
					fontWeight: 700,
					fontSize: 44,
					color: '#FFFFFF',
					textShadow: '0 3px 14px rgba(0,0,0,0.85)',
					opacity: tw(f, BELL + 10, BELL + 20, 0, 1) * (1 - close),
					translate: `0px ${tw(f, BELL + 10, BELL + 24, 20, 0)}px`,
				}}
			>
				Merci pour le soutien ! <span style={{color: accent}}>♥</span>
			</div>

			{/* Curseur */}
			<svg
				width={46}
				height={58}
				viewBox="0 0 22 28"
				style={{
					position: 'absolute',
					left: cx,
					top: cy,
					opacity: tw(f, 24, 30, 0, 1) * (1 - tw(f, OUT - 16, OUT - 8, 0, 1)),
					scale: `${pressed ? 0.82 : 1}`,
					filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.7))',
				}}
			>
				<path d="M1 1 L1 22 L7 17 L11 26 L15 24 L11 15.5 L19 15.5 Z" fill="#FFFFFF" stroke="#111" strokeWidth={1.5} strokeLinejoin="round" />
			</svg>

			<Audio name="Clics + sons" src={staticFile('audio/abonne.wav')} />
		</AbsoluteFill>
	);
};

/** Aperçu sur un fond (pour se rendre compte). */
export const SubscribePreview: React.FC<SubscribeProps> = (props) => (
	<AbsoluteFill style={{background: 'linear-gradient(135deg, #2b3440, #11151b)'}}>
		<Img src={staticFile('assets/urbex/wall.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8}} />
		<SubscribeOverlay {...props} />
	</AbsoluteFill>
);
