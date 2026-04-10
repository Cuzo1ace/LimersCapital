import React from 'react';
import { Composition, Sequence, AbsoluteFill, Audio, staticFile } from 'remotion';
import { FPS } from './data/scenes';
import { buildCalculateMetadata, VoiceoverProps } from './utils/audio-timing';

import { ColdOpen } from './scenes/ColdOpen';
import { CaribbeanMap } from './scenes/CaribbeanMap';
import { Hook } from './scenes/Hook';
import { Hero } from './scenes/Hero';
import { Problem } from './scenes/Problem';
import { Learn } from './scenes/Learn';
import { Trade } from './scenes/Trade';
import { Market } from './scenes/Market';
import { Portfolio } from './scenes/Portfolio';
import { Earn } from './scenes/Earn';
import { BottomNav } from './scenes/BottomNav';
import { CTA } from './scenes/CTA';

// ─── Scene audio file lists (paired with scene components below) ────────

const WALKTHROUGH_AUDIO = [
  'voiceover/walkthrough/w01-coldopen.mp3',
  'voiceover/walkthrough/w02-map.mp3',
  'voiceover/walkthrough/w03-hook.mp3',
  'voiceover/walkthrough/w04-hero.mp3',
  'voiceover/walkthrough/w05-problem.mp3',
  'voiceover/walkthrough/w06-learn.mp3',
  'voiceover/walkthrough/w07-trade.mp3',
  'voiceover/walkthrough/w08-market.mp3',
  'voiceover/walkthrough/w09-portfolio.mp3',
  'voiceover/walkthrough/w10-earn.mp3',
  'voiceover/walkthrough/w11-bottomnav.mp3',
  'voiceover/walkthrough/w12-cta.mp3',
];

const WALKTHROUGH_SCENE_COMPONENTS: React.FC[] = [
  ColdOpen, CaribbeanMap, Hook, Hero, Problem, Learn, Trade, Market, Portfolio, Earn, BottomNav, CTA,
];

const COLOSSEUM_AUDIO = [
  'voiceover/colosseum/c01-coldopen.mp3',
  'voiceover/colosseum/c02-map.mp3',
  'voiceover/colosseum/c03-hook.mp3',
  'voiceover/colosseum/c04-hero.mp3',
  'voiceover/colosseum/c05-problem.mp3',
  'voiceover/colosseum/c06-learn.mp3',
  'voiceover/colosseum/c07-trade.mp3',
  'voiceover/colosseum/c08-portfolio.mp3',
  'voiceover/colosseum/c09-earn.mp3',
  'voiceover/colosseum/c10-cta.mp3',
];

const COLOSSEUM_SCENE_COMPONENTS: React.FC[] = [
  ColdOpen, CaribbeanMap, Hook, Hero, Problem, Learn, Trade, Portfolio, Earn, CTA,
];

const SOCIAL_AUDIO = [
  'voiceover/social/s01-hook.mp3',
  'voiceover/social/s02-hero.mp3',
  'voiceover/social/s03-highlight.mp3',
  'voiceover/social/s04-cta.mp3',
];

const SOCIAL_SCENE_COMPONENTS: React.FC[] = [Hook, Hero, Earn, CTA];

// ─── Scene renderer with voiceover ──────────────────────────────────────

interface VoiceoverComposition extends VoiceoverProps {
  scenes: React.FC[];
}

const VoiceoverComposition: React.FC<VoiceoverComposition> = ({
  scenes,
  sceneDurations,
  audioFiles,
}) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: '#0d0e10' }}>
      {scenes.map((SceneComponent, i) => {
        const from = cursor;
        const duration = sceneDurations[i] ?? 300;
        cursor += duration;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <SceneComponent />
            <Audio src={staticFile(audioFiles[i])} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Landing loop (no voiceover — cinematic with music) ──────────────────

const LandingLoop: React.FC = () => {
  const sceneDurations = [300, 240, 240, 240, 180, 150]; // hero, market, trade, portfolio, earn, loopBack
  const components = [Hero, Market, Trade, Portfolio, Earn, Hero];
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: '#0d0e10' }}>
      {components.map((C, i) => {
        const from = cursor;
        const duration = sceneDurations[i];
        cursor += duration;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <C />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const LANDING_TOTAL = 1350; // 45s @ 30fps

// ─── Wrapper components for each composition variant ───────────────────

const WalkthroughWithVO: React.FC<VoiceoverProps> = (props) => (
  <VoiceoverComposition
    {...props}
    scenes={WALKTHROUGH_SCENE_COMPONENTS}
  />
);

const ColosseumWithVO: React.FC<VoiceoverProps> = (props) => (
  <VoiceoverComposition
    {...props}
    scenes={COLOSSEUM_SCENE_COMPONENTS}
  />
);

const SocialWithVO: React.FC<VoiceoverProps> = (props) => (
  <VoiceoverComposition
    {...props}
    scenes={SOCIAL_SCENE_COMPONENTS}
  />
);

// ─── Composition registry ──────────────────────────────────────────────

export const Root: React.FC = () => (
  <>
    <Composition
      id="WalkthroughFull"
      component={WalkthroughWithVO}
      defaultProps={{ sceneDurations: [], audioFiles: WALKTHROUGH_AUDIO }}
      calculateMetadata={buildCalculateMetadata(WALKTHROUGH_AUDIO)}
      durationInFrames={4500}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="ColosseumPitch"
      component={ColosseumWithVO}
      defaultProps={{ sceneDurations: [], audioFiles: COLOSSEUM_AUDIO }}
      calculateMetadata={buildCalculateMetadata(COLOSSEUM_AUDIO)}
      durationInFrames={2250}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="LandingLoop"
      component={LandingLoop}
      durationInFrames={LANDING_TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="SocialTeaser"
      component={SocialWithVO}
      defaultProps={{ sceneDurations: [], audioFiles: SOCIAL_AUDIO }}
      calculateMetadata={buildCalculateMetadata(SOCIAL_AUDIO)}
      durationInFrames={600}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
