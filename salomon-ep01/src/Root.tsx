import React from 'react';
import {Composition, Folder} from 'remotion';
import {FEATURES, FPS, segment, TOTAL_FRAMES} from './content';
import {Details} from './scenes/Details';
import {Hero} from './scenes/Hero';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {ProductReveal} from './scenes/ProductReveal';
import {SpeedAssault2} from './SpeedAssault2';
import {INTRO_DURATION, IntroUrbex} from './intro-urbex/IntroUrbex';
import {OUTRO_DURATION, OutroUrbex} from './outro-urbex/OutroUrbex';
import {HUD_DEFAULT, hudSchema, type HudProps} from './hud/config';
import {HudPreview, HudUrbex} from './hud/HudUrbex';
import {AlphaRagnar} from './alpha-ragnar/AlphaRagnar';
import {DURATION as RAGNAR_DURATION} from './alpha-ragnar/content';
import './theme';

const SIZE = {width: 1080, height: 1920, fps: FPS};

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="IntroUrbexFrance" component={IntroUrbex} durationInFrames={INTRO_DURATION} width={1920} height={1080} fps={FPS} />
		<Composition id="OutroUrbexFrance" component={OutroUrbex} durationInFrames={OUTRO_DURATION} width={1920} height={1080} fps={FPS} />
		<Composition id="IntroAlphaRagnar" component={AlphaRagnar} durationInFrames={RAGNAR_DURATION} width={1920} height={1080} fps={FPS} />
		<Folder name="HUD">
			<Composition
				id="HudUrbex"
				component={HudUrbex}
				schema={hudSchema}
				defaultProps={HUD_DEFAULT}
				calculateMetadata={({props}: {props: HudProps}) => ({durationInFrames: Math.round(props.dureeSecondes * FPS)})}
				durationInFrames={30 * FPS}
				width={1920}
				height={1080}
				fps={FPS}
			/>
			<Composition
				id="HudApercu"
				component={HudPreview}
				schema={hudSchema}
				defaultProps={HUD_DEFAULT}
				calculateMetadata={({props}: {props: HudProps}) => ({durationInFrames: Math.round(props.dureeSecondes * FPS)})}
				durationInFrames={30 * FPS}
				width={1920}
				height={1080}
				fps={FPS}
			/>
		</Folder>
		<Composition id="SpeedAssault2" component={SpeedAssault2} durationInFrames={TOTAL_FRAMES} {...SIZE} />
		<Folder name="Sequences">
			<Composition id="S1-Intro" component={Intro} durationInFrames={segment('intro').duration} {...SIZE} />
			<Composition id="S2-Revelation" component={ProductReveal} durationInFrames={segment('reveal').duration} {...SIZE} />
			<Composition id="S3-Caracteristiques" component={Details} durationInFrames={segment(FEATURES[5].id).from + segment(FEATURES[5].id).duration - segment(FEATURES[0].id).from} {...SIZE} />
			<Composition id="S4-Hero" component={Hero} durationInFrames={segment('hero').duration} {...SIZE} />
			<Composition id="S5-Outro" component={Outro} durationInFrames={segment('outro').duration} {...SIZE} />
		</Folder>
	</>
);
