import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Phase = 'idle' | 'stare' | 'white' | 'reveal';
const STARE_SECONDS = 15;

/**
 * A small perception experiment: stare at an inverted photo, then look at white.
 * The eye's tired receptors paint the real (positive) face for a few seconds.
 */
export function Afterimage({ src }: { src: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [left, setLeft] = useState(STARE_SECONDS);
  const timers = useRef<number[]>([]);
  const clear = () => { timers.current.forEach(t => clearTimeout(t)); timers.current = []; };
  const close = () => { clear(); setPhase('idle'); setLeft(STARE_SECONDS); };

  const start = () => {
    clear();
    setPhase('stare'); setLeft(STARE_SECONDS);
    for (let i = 1; i <= STARE_SECONDS; i++) timers.current.push(window.setTimeout(() => setLeft(STARE_SECONDS - i), i * 1000));
    timers.current.push(window.setTimeout(() => setPhase('white'), STARE_SECONDS * 1000));
    timers.current.push(window.setTimeout(() => setPhase('reveal'), STARE_SECONDS * 1000 + 3500));
  };

  useEffect(() => {
    if (phase === 'idle') return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.documentElement.classList.add('afterimage-open');
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.classList.remove('afterimage-open'); };
  }, [phase]);
  useEffect(() => clear, []);

  return <div className="afterimage-card mt-12 max-w-3xl" data-reveal="up">
    <p className="t-meta text-ash">A small experiment, 20 seconds</p>
    <h3 className="t-h3 mt-3">See a face that isn’t on the screen.</h3>
    <p className="t-ui text-ash mt-3 max-w-[52ch]">Stare at the dot on a photo of me for 15 seconds without moving your eyes. Then the screen turns white, and your brain fills in the rest.</p>
    <button type="button" onClick={start} className="link t-ui mt-5">Start the experiment</button>
    <p className="t-meta text-ash mt-3">Heads up: the screen flashes to white.</p>

    {phase !== 'idle' && createPortal(
      <div className={`afterimage-stage is-${phase}`} role="dialog" aria-modal="true" aria-label="Afterimage experiment" onClick={phase === 'reveal' ? close : undefined}>
        {phase === 'stare' && <>
          <img src={src} alt="" className="afterimage-photo" draggable={false} />
          <span className="afterimage-dot" aria-hidden="true" />
          <p className="afterimage-hint t-meta">Keep your eyes on the red dot · {left}</p>
        </>}
        {phase !== 'stare' && <span className="afterimage-dot is-dark" aria-hidden="true" />}
        {phase === 'reveal' && <div className="afterimage-caption">
          <p className="t-h3">That face was your brain, not my code.</p>
          <p className="t-ui mt-3">Your eyes got tired of the inverted colors, so on white they briefly painted the opposite: the real photo. It’s called a negative afterimage.</p>
          <p className="t-meta mt-5">Click anywhere or press Esc to go back</p>
        </div>}
        {phase !== 'reveal' && <button type="button" className="afterimage-close t-meta" onClick={close}>Esc</button>}
      </div>, document.body)}
  </div>;
}
