/**
 * Web Audio API Sound Synthesizer
 * Generates playful, high-quality chimes, fanfares, and clicks natively in the browser.
 * No external asset downloading required!
 */

class PlayfulSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMutedState = false;

  private initContext() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMute(muted: boolean) {
    this.isMutedState = muted;
  }

  public toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    return this.isMutedState;
  }

  public get isMuted(): boolean {
    return this.isMutedState;
  }

  /**
   * Âm thanh click nhẹ nhàng dạng gỗ cây hoặc bong bóng
   */
  public playClick() {
    if (this.isMutedState) return;
    const ctx = this.initContext();
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  /**
   * Tiếng DING vui tai khi làm đúng phép toán (Hài hòa C5 -> E5)
   */
  public playCorrect() {
    if (this.isMutedState) return;
    const ctx = this.initContext();
    const time = ctx.currentTime;

    // Nốt thứ nhất (C5 = 523.25 Hz)
    this.playTone(523.25, 0.08, 'sine', 0.2, time);
    // Nốt thứ hai (E5 = 659.25 Hz) sau đó một chút
    this.playTone(659.25, 0.35, 'sine', 0.2, time + 0.07);
  }

  /**
   * Tiếng BZZZ trầm ấm nhẹ nhàng khi làm sai, khích lệ bé làm lại
   */
  public playWrong() {
    if (this.isMutedState) return;
    const ctx = this.initContext();
    const time = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(130, time);
    osc1.frequency.linearRampToValueAtTime(80, time + 0.3);

    osc2.frequency.setValueAtTime(133, time);
    osc2.frequency.linearRampToValueAtTime(83, time + 0.3);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.35);

    // Dùng bộ lọc thông thấp (lowpass) để tiếng bzzz mềm mại, không chói tai cho trẻ em
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(time);
    osc2.start(time);
    
    osc1.stop(time + 0.35);
    osc2.stop(time + 0.35);
  }

  /**
   * Nhạc chiến thắng hào hùng (Level Up Fanfare)
   */
  public playLevelUp() {
    if (this.isMutedState) return;
    const ctx = this.initContext();
    const time = ctx.currentTime;

    const notes = [
      { f: 261.63, t: 0.0 }, // C4
      { f: 329.63, t: 0.08 }, // E4
      { f: 392.00, t: 0.16 }, // G4
      { f: 523.25, t: 0.24 }, // C5
      { f: 659.25, t: 0.32 }, // E5
      { f: 783.99, t: 0.40 }, // G5
      { f: 1046.50, t: 0.48 } // C6 (giữ dài hơn)
    ];

    notes.forEach((note, index) => {
      const isLast = index === notes.length - 1;
      const duration = isLast ? 0.8 : 0.18;
      this.playTone(note.f, duration, 'triangle', 0.15, time + note.t);
      if (isLast) {
        // Thêm nốt sine cao lấp lánh ở cuối
        this.playTone(note.f * 1.5, duration, 'sine', 0.05, time + note.t + 0.05);
      }
    });
  }

  /**
   * Âm thanh ma thuật lấp lánh (Shimmer) khi mở khóa phần thưởng/cúp
   */
  public playReward() {
    if (this.isMutedState) return;
    const ctx = this.initContext();
    const time = ctx.currentTime;

    // Phát chuỗi các nốt nhạc cao dần siêu nhanh
    for (let i = 0; i < 12; i++) {
      const freq = 600 + i * 120;
      const startTime = time + i * 0.04;
      this.playTone(freq, 0.15, 'sine', 0.08, startTime);
    }
  }

  /**
   * Helper phát nốt nhạc cụ thể
   */
  private playTone(freq: number, duration: number, type: OscillatorType, maxVolume: number, startTime: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(maxVolume, startTime + 0.02);
    gain.gain.setValueAtTime(maxVolume, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const audioSynth = new PlayfulSoundSynthesizer();
