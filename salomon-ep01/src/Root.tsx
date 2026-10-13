import React from 'react';
import {Composition, Folder} from 'remotion';
import {FEATURES, FPS, segment, TOTAL_FRAMES} from './content';
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
			<Composition id="S1-Intro" component={Intro} durationInFrames={segment('intro').duration} {...SIZE} />
			<Composition id="S2-Revelation" component={ProductReveal} durationInFrames={segment('reveal').duration} {...SIZE} />
			<Composition id="S3-Caracteristiques" component={Details} durationInFrames={segment(FEATURES[5].id).from + segment(FEATURES[5].id).duration - segment(FEATURES[0].id).from} {...SIZE} />
			<Composition id="S4-Hero" component={Hero} durationInFrames={segment('hero').duration} {...SIZE} />
			<Composition id="S5-Outro" component={Outro} durationInFrames={segment('outro').duration} {...SIZE} />
		</Folder>
	</>
);
