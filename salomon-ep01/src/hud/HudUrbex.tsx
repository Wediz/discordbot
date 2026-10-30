import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {tween} from '../anim';
import {Glitch} from '../components/Glitch';
import {Wall} from '../intro-urbex/IntroUrbex';
import {COLORS, FONTS} from '../theme';
import type {HudProps} from './config';

const RED = '#FF2D1F';
const PLATE = 'rgba(8, 8, 9, 0.58)';
const SHADOW = '0 2px 10px rgba(0,0,0,0.85)';

/** Valeur d'une jauge à l'instant t (secondes), lissée entre les points. */
const valueAt = (points: {t: number; v: number}[], t: number) => {
	if (points.length === 0) return 0;
	const pts = [...points].sort((a, b) => a.t - b.t);
	if (t <= pts[0].t) return pts[0].v;
	for (let i = 0; i < pts.length - 1; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		if (t <= b.t) {
			return interpolate(t, [a.t, b.t], [a.v, b.v], {easing: Easing.bezier(0.45, 0, 0.25, 1)});
		}
	}
	return pts[pts.length - 1].v;
};

const mono: React.CSSProperties = {fontFamily: FONTS.mono, fontWeight: 500, letterSpacing: '0.12em', textShadow: SHADOW};

/** Plaque sombre aux coins coupés. */
const Plate: React.FC<{style?: React.CSSProperties; children: React.ReactNode; accent?: string}> = ({style, children, accent = COLORS.orange}) => (
	<div
		style={{
			position: 'absolute',
			background: PLATE,
			clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
			borderLeft: `4px solid ${accent}`,
			padding: '16px 22px',
			...style,
		}}
	>
		{children}
	</div>
);

/* ───────────── PEUR : barre segmentée ───────────── */

const FearGauge: React.FC<{value: number; frame: number}> = ({value, frame}) => {
	const v = Math.max(0, Math.min(100, value));
	const segs = 20;
	const lit = Math.round((v / 100) * segs);
	const danger = v >= 70;
	const shake = danger ? (random(`f${Math.floor(frame / 2)}`) - 0.5) * 6 * ((v - 70) / 30) : 0;
	const color = (i: number) => (i / segs < 0.5 ? COLORS.orange : i / segs < 0.75 ? '#FF7A1A' : RED);
	return (
		<Plate style={{left: 60, top: 760, width: 520}} accent={danger ? RED : COLORS.orange}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', translate: `${shake}px 0px`}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
					{/* œil */}
					<svg width={34} height={22} viewBox="0 0 34 22">
						<path d="M1 11 C7 2 27 2 33 11 C27 20 7 20 1 11 Z" fill="none" stroke={danger ? RED : COLORS.bone} strokeWidth={2.4} />
						<circle cx={17} cy={11} r={4.5 + (v / 100) * 2.5} fill={danger ? RED : COLORS.bone} />
					</svg>
					<span style={{...mono, fontSize: 28, color: COLORS.bone}}>PEUR</span>
				</div>
				<span style={{...mono, fontSize: 34, color: danger ? RED : COLORS.bone}}>{Math.round(v)}%</span>
			</div>
			<div style={{display: 'flex', gap: 4, marginTop: 12, translate: `${shake}px 0px`}}>
				{Array.from({length: segs}, (_, i) => (
					<div
						key={i}
						style={{
							flex: 1,
							height: 18,
							background: i < lit ? color(i) : 'rgba(236,230,218,0.14)',
							boxShadow: i < lit && danger ? `0 0 12px ${RED}` : 'none',
							opacity: i === lit - 1 && danger ? (frame % 6 < 3 ? 1 : 0.5) : 1,
						}}
					/>
				))}
			</div>
		</Plate>
	);
};

/* ───────────── STRESS : cœur + électrocardiogramme ───────────── */

/** Forme d'un battement (0..1 → amplitude). */
const beatShape = (p: number) => {
	if (p < 0.08) return Math.sin((p / 0.08) * Math.PI) * 0.15; // onde P
	if (p < 0.14) return 0;
	if (p < 0.16) return -0.2;
	if (p < 0.19) return 1; // pic R
	if (p < 0.22) return -0.35;
	if (p < 0.4) return Math.sin(((p - 0.22) / 0.18) * Math.PI) * 0.25; // onde T
	return 0;
};

const StressGauge: React.FC<{points: HudProps['stress']; frame: number; fps: number}> = ({points, frame, fps}) => {
	// Phase cumulée (le rythme accélère avec le stress).
	let phase = 0;
	for (let f = 0; f < frame; f++) phase += valueAt(points, f / fps) / 60 / fps;
	const bpm = valueAt(points, frame / fps) + Math.sin(frame / 7) * 1.5;
	const W = 290;
	const H = 70;
	const samples = 90;
	const windowBeats = 3.2;
	const path = Array.from({length: samples + 1}, (_, i) => {
		const ph = phase - windowBeats * (1 - i / samples);
		const y = H / 2 - beatShape(((ph % 1) + 1) % 1) * (H * 0.45);
		return `${i === 0 ? 'M' : 'L'}${((i / samples) * W).toFixed(1)} ${y.toFixed(1)}`;
	}).join(' ');
	const beatPos = ((phase % 1) + 1) % 1;
	const thump = beatPos > 0.16 && beatPos < 0.3 ? 1.18 : 1;
	const high = bpm >= 120;
	const col = high ? RED : COLORS.orange;
	return (
		<Plate style={{left: 60, top: 900, width: 520}} accent={col}>
			<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
				<div style={{width: 170, flexShrink: 0}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 10}}>
						<svg width={30} height={28} viewBox="0 0 24 22" style={{scale: `${thump}`, flexShrink: 0}}>
							<path d="M12 21 C5 15 1 11 1 6.5 C1 3 3.6 1 6.5 1 C9 1 11 2.6 12 4.6 C13 2.6 15 1 17.5 1 C20.4 1 23 3 23 6.5 C23 11 19 15 12 21 Z" fill={col} />
						</svg>
						<span style={{...mono, fontSize: 22, color: COLORS.bone}}>STRESS</span>
					</div>
					<div style={{...mono, fontSize: 40, color: high ? RED : COLORS.bone, marginTop: 4, whiteSpace: 'nowrap'}}>
						{Math.round(bpm)}
						<span style={{fontSize: 18, color: COLORS.boneDim}}> BPM</span>
					</div>
				</div>
				<svg width={W} height={H} style={{marginLeft: 4, overflow: 'visible', flexShrink: 0}}>
					<path d={path} fill="none" stroke={col} strokeWidth={3} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 6px ${col})`}} />
				</svg>
			</div>
		</Plate>
	);
};

/* ───────────── BATTERIE de la lampe ───────────── */

const BatteryGauge: React.FC<{value: number; frame: number}> = ({value, frame}) => {
	const v = Math.max(0, Math.min(100, value));
	const low = v < 20;
	const blink = low ? (frame % 20 < 10 ? 1 : 0.35) : 1;
	const col = low ? RED : v < 45 ? '#FFB01A' : '#9BE36D';
	const bars = 5;
	return (
		<Plate style={{right: 60, top: 940, width: 330}} accent={col}>
			<div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: blink}}>
				{/* lampe */}
				<svg width={30} height={30} viewBox="0 0 24 24">
					<path d="M3 4 H13 L11 10 V21 H5 V10 Z" fill="none" stroke={COLORS.bone} strokeWidth={2} strokeLinejoin="round" />
					<path d="M15 6 L21 3 M15 9 H22 M15 12 L21 15" stroke={col} strokeWidth={2} strokeLinecap="round" />
				</svg>
				<div style={{display: 'flex', alignItems: 'center'}}>
					<div style={{width: 120, height: 44, border: `3px solid ${COLORS.bone}`, borderRadius: 5, padding: 4, display: 'flex', gap: 4}}>
						{Array.from({length: bars}, (_, i) => (
							<div key={i} style={{flex: 1, background: i < Math.ceil((v / 100) * bars) ? col : 'transparent'}} />
						))}
					</div>
					<div style={{width: 7, height: 18, background: COLORS.bone, borderRadius: '0 3px 3px 0'}} />
				</div>
				<div style={{...mono, fontSize: 34, color: low ? RED : COLORS.bone}}>{Math.round(v)}%</div>
			</div>
		</Plate>
	);
};

/* ───────────── Alerte centrale ───────────── */

const Alert: React.FC<{text: string; local: number; dur: number}> = ({text, local, dur}) => {
	const inOut = tween(local, [0, 6], [0, 1]) * tween(local, [dur - 8, dur], [1, 0]);
	const glitch = Math.max(1 - local / 8, local > dur - 8 ? (local - (dur - 8)) / 8 : 0);
	return (
		<AbsoluteFill style={{top: 150, alignItems: 'center', opacity: inOut}}>
			<div style={{position: 'relative', width: 760, height: 96}}>
				<Glitch intensity={Math.max(0, glitch) * 0.8} seed={`al-${text}`}>
					<AbsoluteFill
						style={{
							background: 'rgba(10,6,6,0.72)',
							border: `3px solid ${RED}`,
							alignItems: 'center',
							justifyContent: 'center',
							flexDirection: 'row',
							gap: 22,
							opacity: local % 24 < 18 ? 1 : 0.6,
						}}
					>
						<svg width={48} height={43} viewBox="0 0 100 90">
							<path d="M50 4 L96 86 L4 86 Z" fill="none" stroke={RED} strokeWidth={8} strokeLinejoin="round" />
							<rect x={45} y={30} width={10} height={30} fill={RED} />
							<rect x={45} y={67} width={10} height={10} fill={RED} />
						</svg>
						<span style={{fontFamily: FONTS.display, fontSize: 64, color: COLORS.bone, letterSpacing: '0.06em', textShadow: SHADOW}}>{text}</span>
					</AbsoluteFill>
				</Glitch>
			</div>
		</AbsoluteFill>
	);
};

/* ───────────── HUD complet (fond transparent) ───────────── */

export const HudUrbex: React.FC<HudProps> = (props) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const show = props.afficher;
	const fear = valueAt(props.peur, t);
	const boot = tween(frame, [0, 12], [0, 1]);

	// Heure qui avance réellement pendant la vidéo
	const [hh, mm] = props.heureDepart.split(':').map((x) => parseInt(x, 10) || 0);
	const total = hh * 3600 + mm * 60 + Math.floor(t);
	const clock = `${String(Math.floor(total / 3600) % 24).padStart(2, '0')}:${String(Math.floor(total / 60) % 60).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
	const tc = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t) % 60).padStart(2, '0')}:${String(frame % fps).padStart(2, '0')}`;
	const fearFx = show.effetPeur ? tween(fear, [70, 100], [0, 1]) * (0.75 + 0.25 * Math.sin(frame / 4)) : 0;

	return (
		<AbsoluteFill style={{opacity: boot}}>
			{/* Bords rouges quand la peur monte */}
			{fearFx > 0 ? (
				<AbsoluteFill style={{background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(200,20,10,${0.55 * fearFx}) 100%)`}} />
			) : null}

			{/* Coins de cadrage */}
			{[
				{left: 30, top: 30, s: '1 1'},
				{right: 30, top: 30, s: '-1 1'},
				{left: 30, bottom: 30, s: '1 -1'},
				{right: 30, bottom: 30, s: '-1 -1'},
			].map(({s, ...pos}, i) => (
				<div key={i} style={{position: 'absolute', width: 60, height: 60, ...pos, scale: s}}>
					<div style={{position: 'absolute', left: 0, top: 0, width: 60, height: 3, background: 'rgba(236,230,218,0.7)'}} />
					<div style={{position: 'absolute', left: 0, top: 0, width: 3, height: 60, background: 'rgba(236,230,218,0.7)'}} />
				</div>
			))}

			{show.rec ? (
				<div style={{position: 'absolute', left: 70, top: 62, display: 'flex', alignItems: 'center', gap: 14}}>
					<div style={{width: 22, height: 22, borderRadius: 11, background: RED, opacity: frame % 30 < 18 ? 1 : 0.15, boxShadow: `0 0 14px ${RED}`}} />
					<span style={{...mono, fontSize: 30, color: COLORS.bone}}>REC</span>
					<span style={{...mono, fontSize: 30, color: COLORS.boneDim}}>{tc}</span>
				</div>
			) : null}

			{show.lieu ? (
				<Plate style={{left: 60, top: 118}}>
					<div style={{fontFamily: FONTS.condensed, fontWeight: 700, fontSize: 40, letterSpacing: '0.06em', color: COLORS.bone, textShadow: SHADOW}}>{props.lieu}</div>
					<div style={{...mono, fontSize: 22, color: COLORS.orange, marginTop: 4}}>{props.sousTitreLieu}</div>
				</Plate>
			) : null}

			{show.heure ? (
				<div style={{position: 'absolute', right: 70, top: 58, textAlign: 'right'}}>
					<div style={{...mono, fontSize: 44, color: COLORS.bone}}>{clock}</div>
					<div style={{...mono, fontSize: 20, color: COLORS.boneDim, marginTop: 2}}>HEURE LOCALE</div>
				</div>
			) : null}

			{show.peur ? <FearGauge value={fear} frame={frame} /> : null}
			{show.stress ? <StressGauge points={props.stress} frame={frame} fps={fps} /> : null}
			{show.batterie ? <BatteryGauge value={valueAt(props.batterie, t)} frame={frame} /> : null}

			{props.alertes.map((a) => {
				const local = frame - a.t * fps;
				const dur = a.duree * fps;
				return local >= 0 && local < dur ? <Alert key={`${a.t}-${a.texte}`} text={a.texte} local={local} dur={dur} /> : null;
			})}
		</AbsoluteFill>
	);
};

/** Aperçu : le HUD posé sur le décor « abandonné » (pour se rendre compte). */
export const HudPreview: React.FC<HudProps> = (props) => {
	const {durationInFrames} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<Wall duration={durationInFrames} light={{x: 960, y: 560, r: 760}} seed="hud" />
			<HudUrbex {...props} />
		</AbsoluteFill>
	);
};
