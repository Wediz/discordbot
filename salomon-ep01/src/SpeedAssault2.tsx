import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Captions} from './components/Captions';
import {Grain, Vignette} from './components/Grain';
import {Hud} from './components/Hud';
import {LightFlash} from './components/Light';
import {SEGMENTS, segment, TOTAL_FRAMES, VOLUME} from './content';
import {Details} from './scenes/Details';
import {Hero} from './scenes/Hero';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {ProductReveal} from './scenes/ProductReveal';
import {COLORS} from './theme';

const intro = segment('intro');
const reveal = segment('reveal');
const first = segment('grip');
const last = segment('weight');
const hero = segment('hero');
const outro = segment('outro');

/** Composition principale : Présentation Matériel EP.01 — 9:16. */
export const SpeedAssault2: React.FC = () => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: COLORS.black}}>
			<Sequence name="01 Intro" from={intro.from} durationInFrames={intro.duration} premountFor={fps}>
				<Intro duration={intro.duration} />
			</Sequence>
			<Sequence name="02 Révélation produit" from={reveal.from} durationInFrames={reveal.duration} premountFor={fps}>
				<ProductReveal duration={reveal.duration} />
			</Sequence>
			<Sequence name="03 Caractéristiques" from={first.from} durationInFrames={last.from + last.duration - first.from} premountFor={fps}>
				<Details />
			</Sequence>
			<Sequence name="04 Hero shot" from={hero.from} durationInFrames={hero.duration} premountFor={fps}>
				<Hero duration={hero.duration} />
			</Sequence>
			<Sequence name="05 Outro" from={outro.from} durationInFrames={outro.duration} premountFor={fps}>
				<Outro />
			</Sequence>

			{/* Transitions lumineuses aux raccords principaux */}
			<LightFlash at={reveal.from} />
			<LightFlash at={first.from} before={3} after={7} />
			<LightFlash at={hero.from} />
			<LightFlash at={outro.from} before={3} after={8} />

			<Hud from={reveal.from} to={outro.from} />
			<Captions />
			<Vignette />
			<Grain />

			{/* Audio : musique et bruitages générés (scripts/build_audio.py), voix off */}
			<Audio name="Musique" src={staticFile('audio/music.wav')} volume={VOLUME.music} durationInFrames={TOTAL_FRAMES} />
			<Audio name="Bruitages" src={staticFile('audio/sfx.wav')} volume={VOLUME.sfx} durationInFrames={TOTAL_FRAMES} />
			{SEGMENTS.filter((s) => s.vo.file).map((s) => (
				<Audio
					key={s.id}
					name={`Voix — ${s.id}`}
					src={staticFile(s.vo.file ?? "")}
					from={s.from + s.vo.from}
					premountFor={fps}
					volume={VOLUME.voice}
				/>
			))}
		</AbsoluteFill>
	);
};
