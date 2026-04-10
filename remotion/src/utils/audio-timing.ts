import { CalculateMetadataFunction, staticFile } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { FPS } from '../data/scenes';

export interface VoiceoverProps {
  sceneDurations: number[]; // duration in FRAMES for each scene
  audioFiles: string[];     // relative paths like "voiceover/walkthrough/w01-coldopen.mp3"
}

/**
 * Build a `calculateMetadata` function for a composition that has voiceover.
 * Reads audio file durations + adds a pad per scene (for visual breathing room),
 * then returns total composition duration + per-scene durations via props.
 */
export const buildCalculateMetadata = (
  audioFiles: string[],
  padSeconds = 0.4,
): CalculateMetadataFunction<VoiceoverProps> => {
  return async () => {
    const durations = await Promise.all(
      audioFiles.map((file) => getAudioDurationInSeconds(staticFile(file))),
    );

    const sceneDurations = durations.map((secs) =>
      Math.ceil((secs + padSeconds) * FPS),
    );

    const totalFrames = sceneDurations.reduce((a, b) => a + b, 0);

    return {
      durationInFrames: totalFrames,
      props: { sceneDurations, audioFiles },
    };
  };
};
