// Web Audio API synthesizer for soft ambient pad + A-K gentle piano notes (no external files)

const STORAGE_KEY = 'kal_sound_enabled';

// Warm A-minor / C-major contemplative scale mapped to A S D F G H J K
export const PIANO_KEY_MAP: Record<string, { freq: number; label: string; index: number }> = {
  a: { freq: 220.0, label: 'A3', index: 0 },
  s: { freq: 246.94, label: 'B3', index: 1 },
  d: { freq: 261.63, label: 'C4', index: 2 },
  f: { freq: 293.66, label: 'D4', index: 3 },
  g: { freq: 329.63, label: 'E4', index: 4 },
  h: { freq: 349.23, label: 'F4', index: 5 },
  j: { freq: 392.0, label: 'G4', index: 6 },
  k: { freq: 440.0, label: 'A4', index: 7 },
};

/** each part of the site has its own chord and color: low and deep at the top, airy at the end */
const MOODS: Record<string, { freqs: [number, number, number]; cutoff: number; level: number }> = {
  hero: { freqs: [110.0, 164.81, 220.5], cutoff: 260, level: 0.022 },
  about: { freqs: [130.81, 196.0, 261.9], cutoff: 380, level: 0.022 },
  disciplines: { freqs: [116.54, 174.61, 233.4], cutoff: 520, level: 0.02 },
  work: { freqs: [146.83, 220.0, 293.9], cutoff: 460, level: 0.02 },
  journey: { freqs: [98.0, 146.83, 196.3], cutoff: 300, level: 0.024 },
  recognition: { freqs: [130.81, 196.0, 329.9], cutoff: 600, level: 0.018 },
  'field-notes': { freqs: [164.81, 246.94, 330.2], cutoff: 760, level: 0.016 },
  'off-screen': { freqs: [146.83, 220.0, 370.2], cutoff: 820, level: 0.016 },
  contact: { freqs: [196.0, 293.66, 392.4], cutoff: 1100, level: 0.014 },
  calm: { freqs: [110.0, 164.81, 220.5], cutoff: 220, level: 0.016 },
};
const CHIMES = [1318.5, 1568.0, 1760.0, 2093.0, 2349.3, 2637.0];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private padGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private mood = 'hero';
  private ducked = false;
  private glitchTimer: number | null = null;
  private lastChime = 0;
  private padOscs: OscillatorNode[] = [];
  private ambientTimer: number | null = null;
  private enabled = false;

  constructor() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // Always start silent until explicit user gesture, but remember preference label if needed
      if (saved === 'true') {
        this.enabled = false; // Web Audio requires gesture; user can toggle on with 1 click
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): boolean {
    this.enabled = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Ignore localStorage restrictions
    }

    if (next) {
      this.startPad();
    } else {
      this.stopPad();
    }
    return this.enabled;
  }

  public toggle(): boolean {
    return this.setEnabled(!this.enabled);
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private startPad(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopPad();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    const start = MOODS[this.mood] ?? MOODS.hero;
    masterGain.gain.exponentialRampToValueAtTime(this.ducked ? 0.0001 : start.level, ctx.currentTime + 1.8);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(start.cutoff, ctx.currentTime);
    this.padFilter = filter;

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Soft warm fifth drone (A2 + E3 + A3 slightly detuned)
    const freqs = start.freqs;
    this.padOscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      osc.connect(masterGain);
      osc.start();
      return osc;
    });

    this.padGain = masterGain;

    // Occasional gentle ambient note every ~9 seconds while sound is on
    this.ambientTimer = window.setInterval(() => {
      if (!this.enabled || this.ducked) return;
      const keys = Object.keys(PIANO_KEY_MAP);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      this.playPianoNote(randomKey, 0.018);
    }, 9000);
    if (this.mood === 'disciplines') this.glitchTimer = window.setInterval(() => this.tick(), 1700);
  }

  /** glide the drone to the chord of the section in view */
  public setMood(name: string): void {
    if (name === this.mood) return;
    this.mood = name;
    const mood = MOODS[name] ?? MOODS.calm;
    if (this.glitchTimer !== null) { clearInterval(this.glitchTimer); this.glitchTimer = null; }
    if (!this.enabled || !this.ctx || !this.padGain) return;
    const now = this.ctx.currentTime;
    this.padOscs.forEach((osc, i) => { osc.frequency.cancelScheduledValues(now); osc.frequency.setTargetAtTime(mood.freqs[i], now, 0.9); });
    this.padFilter?.frequency.setTargetAtTime(mood.cutoff, now, 0.9);
    if (!this.ducked) this.padGain.gain.setTargetAtTime(mood.level, now, 0.8);
    // the security section gets quiet digital ticks under the drone
    if (name === 'disciplines') this.glitchTimer = window.setInterval(() => this.tick(), 1700);
  }

  /** stay out of the way while Kal's real music is playing */
  public setDucked(next: boolean): void {
    if (next === this.ducked) return;
    this.ducked = next;
    if (!this.ctx || !this.padGain) return;
    const level = next ? 0.0001 : (MOODS[this.mood] ?? MOODS.calm).level;
    this.padGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.6);
  }

  private tick(): void {
    if (!this.enabled || this.ducked || !this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
      const at = now + i * 0.06;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900 + Math.random() * 1400, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.0035, at + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(at); osc.stop(at + 0.06);
    }
  }

  /** a tiny glassy chime as the cursor brushes through the particles */
  public chime(x: number, strength: number): void {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    if (now - this.lastChime < 0.07) return;
    this.lastChime = now;
    const freq = CHIMES[Math.floor(Math.random() * CHIMES.length)];
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.004 + 0.006 * Math.min(1, strength), now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain);
    if (typeof ctx.createStereoPanner === 'function') {
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(Math.max(-1, Math.min(1, x)) * 0.7, now);
      gain.connect(pan); pan.connect(ctx.destination);
    } else gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.4);
  }

  private stopPad(): void {
    if (this.glitchTimer !== null) { clearInterval(this.glitchTimer); this.glitchTimer = null; }
    if (this.ambientTimer !== null) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
    if (this.ctx && this.padGain) {
      try {
        const now = this.ctx.currentTime;
        this.padGain.gain.setValueAtTime(this.padGain.gain.value, now);
        this.padGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      } catch {
        // Ignore
      }
    }
    const oscs = this.padOscs;
    this.padOscs = [];
    setTimeout(() => {
      oscs.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {
          // Ignore
        }
      });
    }, 450);
  }

  public playPianoNote(keyChar: string, peakGain = 0.055): boolean {
    if (!this.enabled) return false;
    const entry = PIANO_KEY_MAP[keyChar.toLowerCase()];
    if (!entry) return false;

    const ctx = this.ensureContext();
    if (!ctx) return false;

    const now = ctx.currentTime;

    // Felt-piano style synthesis: fundamental sine + soft 2nd harmonic triangle through lowpass
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.018);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(entry.freq * 3.2, now);
    filter.frequency.exponentialRampToValueAtTime(entry.freq * 1.1, now + 1.8);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(entry.freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(entry.freq * 2, now);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.15, now);
    harmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc1.connect(filter);
    osc2.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.7);
    osc2.stop(now + 2.7);

    // Dispatch custom event so the 3D particle canvas sends a faint ripple
    window.dispatchEvent(
      new CustomEvent('kal:piano-ripple', {
        detail: {
          key: keyChar.toLowerCase(),
          index: entry.index,
          freq: entry.freq,
          label: entry.label,
        },
      }),
    );

    return true;
  }
}

export const soundEngine = new SoundEngine();
