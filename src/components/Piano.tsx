import { useEffect, useRef, useState } from 'react';
import { PIANO_KEY_MAP, soundEngine } from '../utils/soundEngine';

export function Piano({ soundOn, onEnable }: { soundOn: boolean; onEnable: () => void }) {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    const release = (key: string) => setKeys(current => { const next = new Set(current); next.delete(key); return next; });
    const ripple = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; label: string }>).detail;
      setKeys(current => new Set(current).add(detail.key)); setNote(detail.label);
      clearTimeout(timers.current.get(detail.key));
      timers.current.set(detail.key, window.setTimeout(() => release(detail.key), 450));
    };
    const keyup = (event: KeyboardEvent) => release(event.key.toLowerCase());
    window.addEventListener('kal:piano-ripple', ripple); window.addEventListener('keyup', keyup);
    return () => { window.removeEventListener('kal:piano-ripple', ripple); window.removeEventListener('keyup', keyup); timers.current.forEach(clearTimeout); };
  }, []);
  const play = (key: string) => { if (!soundEngine.isEnabled()) onEnable(); soundEngine.playPianoNote(key); };
  return <div className="music-keys">
    <div className="piano" role="group" aria-label="Playable keyboard notes">
      {Object.entries(PIANO_KEY_MAP).map(([key, info]) => <button type="button" key={key} data-cursor="Play" aria-label={`Play ${info.label} ${key.toUpperCase()}`} aria-description={`Keyboard shortcut: ${key.toUpperCase()}. Enable sound first when using your keyboard.`} className={`piano-key ${keys.has(key) && soundOn ? 'is-playing' : ''}`} onPointerDown={event => { if (event.button === 0) play(key); }} onPointerEnter={event => { if (event.buttons === 1) play(key); }} onClick={event => { if (event.detail === 0) play(key); }}>
        <span className="piano-note">{info.label}</span>{' '}<kbd>{key.toUpperCase()}</kbd>
      </button>)}
    </div><span className="sr-only" aria-live="polite">{soundOn && note ? `${note} played` : ''}</span>
  </div>;
}
