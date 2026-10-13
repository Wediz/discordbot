import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {Grain, Vignette} from './components/Grain';
import {Hud} from './components/Hud';
import {LightFlash} from './components/Light';
import {TIMING} from './content';
import {Details} from './scenes/Details';
import {Hero} from './scenes/Hero';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {ProductReveal} from './scenes/ProductReveal';
import {COLORS} from './theme';

const T1 = TIMING.intro;
const T2 = T1 + TIMING.reveal;
const T3 = T2 + TIMING.details;
const T4 = T3 + TIMING.hero;

/** Composition principale : Présentation Matériel EP.01 — 25 s, 9:16. */
export const SpeedAssault2: React.FC = () => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<Sequence name="01 Intro" from={0} durationInFrames={TIMING.intro} premountFor={fps}>
				<Intro />
			</Sequence>
			<Sequence name="02 Révélation produit" from={T1} durationInFrames={TIMING.reveal} premountFor={fps}>
				<ProductReveal />
			</Sequence>
			<Sequence name="03 Détails" from={T2} durationInFrames={TIMING.details} premountFor={fps}>
				<Details />
			</Sequence>
			<Sequence name="04 Hero shot" from={T3} durationInFrames={TIMING.hero} premountFor={fps}>
				<Hero />
			</Sequence>
			<Sequence name="05 Outro" from={T4} durationInFrames={TIMING.outro} premountFor={fps}>
				<Outro />
			</Sequence>

			{/* Transitions lumineuses aux raccords */}
			<LightFlash at={T1} />
			<LightFlash at={T2} before={3} after={7} />
			<LightFlash at={T3} />
			<LightFlash at={T4} before={3} after={8} />

			<Hud from={T1} to={T4} />
			<Vignette />
			<Grain />
		</AbsoluteFill>
	);
};
