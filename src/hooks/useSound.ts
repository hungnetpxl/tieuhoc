import { useState, useCallback } from 'react';
import { audioSynth } from '../utils/audioSynth';

export const useSound = () => {
  const [muted, setMuted] = useState(audioSynth.isMuted);

  const toggleMute = useCallback(() => {
    const nextState = audioSynth.toggleMute();
    setMuted(nextState);
    return nextState;
  }, []);

  const playClick = useCallback(() => {
    audioSynth.playClick();
  }, []);

  const playCorrect = useCallback(() => {
    audioSynth.playCorrect();
  }, []);

  const playWrong = useCallback(() => {
    audioSynth.playWrong();
  }, []);

  const playLevelUp = useCallback(() => {
    audioSynth.playLevelUp();
  }, []);

  const playReward = useCallback(() => {
    audioSynth.playReward();
  }, []);

  return {
    isMuted: muted,
    toggleMute,
    playClick,
    playCorrect,
    playWrong,
    playLevelUp,
    playReward
  };
};
