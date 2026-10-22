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

class SoundEngine {
  private ctx: AudioContext | null = null;
  private padGain: GainNode | null = null;
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
    masterGain.gain.exponentialRampToValueAtTime(0.022, ctx.currentTime + 1.8);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, ctx.currentTime);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Soft warm fifth drone (A2 + E3 + A3 slightly detuned)
    const freqs = [110.0, 164.81, 220.5];
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
      if (!this.enabled) return;
      const keys = Object.keys(PIANO_KEY_MAP);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      this.playPianoNote(randomKey, 0.018);
    }, 9000);
  }

  private stopPad(): void {
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
