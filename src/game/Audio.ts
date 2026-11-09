/**
 * High-Performance Supercar Audio & Indian Desi Horn Engine
 * Synthesizes roaring V8/W16 engine harmonics + authentic multi-tone Indian musical horn.
 * Created for Abhijeet kangane
 */

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  private hornOsc: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;
  private isHornPlaying = false;

  private isMuted = false;
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupSupercarEngine();
      this.isInitialized = true;
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupSupercarEngine() {
    if (!this.ctx) return;

    // V8/W16 Primary Cylinder Firing (Sawtooth for sharp exhaust rasp)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    // Secondary Sub-Harmonic Rumble
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(27.5, this.ctx.currentTime);

    // Resonant Exhaust Filter
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  public updateEngine(rpmNormalized: number, throttle: number, isRunning: boolean) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    if (this.isMuted || !isRunning) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      return;
    }

    // Supercar revs: 50Hz idle up to 480Hz screaming redline
    const targetFreq = 50 + rpmNormalized * 400;
    const subFreq = targetFreq * 0.5;
    const filterCutoff = 250 + throttle * 2800 + rpmNormalized * 1500;

    this.engineOsc1.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.04);
    this.engineOsc2.frequency.setTargetAtTime(subFreq, this.ctx.currentTime, 0.04);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, this.ctx.currentTime, 0.04);

    const volume = 0.08 + throttle * 0.16 + rpmNormalized * 0.06;
    this.engineGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  /**
   * Iconic Indian Musical Melody Horn ("Po-po-po-po-poo!")
   */
  public playIndianHorn() {
    if (!this.ctx || this.isMuted || this.isHornPlaying) return;
    this.isHornPlaying = true;

    // Desi Melody note frequencies
    const notes = [440, 554.37, 659.25, 554.37, 880];
    const duration = 0.11;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * duration);

      gain.gain.setValueAtTime(0.18, this.ctx!.currentTime + idx * duration);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + (idx + 1) * duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + idx * duration);
      osc.stop(this.ctx!.currentTime + (idx + 1) * duration + 0.02);
    });

    setTimeout(() => {
      this.isHornPlaying = false;
    }, notes.length * duration * 1000);
  }

  public playBrakeScreech() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1100, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.26);
  }

  public playCrash() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.52);
  }

  public playGearShift() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  public playBlinker() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  public playSuccessChime() {
    if (!this.ctx || this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + idx * 0.12);
      osc.stop(this.ctx!.currentTime + idx * 0.12 + 0.45);
    });
  }

  public setTireScreech(intensity: number) {
    if (intensity > 0.6) {
      this.playBrakeScreech();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const sounds = new SoundSystem();
