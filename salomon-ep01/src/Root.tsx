import React from 'react';
import {Composition, Folder} from 'remotion';
import {FPS, TIMING, TOTAL_FRAMES} from './content';
import {Details} from './scenes/Details';
import {Hero} from './scenes/Hero';
import {Intro} from './scenes/Intro';
import {Outro} from './scenes/Outro';
import {ProductReveal} from './scenes/ProductReveal';
import {SpeedAssault2} from './SpeedAssault2';
import './theme';

const SIZE = {width: 1080, height: 1920, fps: FPS};

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="SpeedAssault2" component={SpeedAssault2} durationInFrames={TOTAL_FRAMES} {...SIZE} />
		<Folder name="Sequences">
			<Composition id="S1-Intro" component={Intro} durationInFrames={TIMING.intro} {...SIZE} />
			<Composition id="S2-Revelation" component={ProductReveal} durationInFrames={TIMING.reveal} {...SIZE} />
			<Composition id="S3-Details" component={Details} durationInFrames={TIMING.details} {...SIZE} />
			<Composition id="S4-Hero" component={Hero} durationInFrames={TIMING.hero} {...SIZE} />
			<Composition id="S5-Outro" component={Outro} durationInFrames={TIMING.outro} {...SIZE} />
		</Folder>
	</>
);
