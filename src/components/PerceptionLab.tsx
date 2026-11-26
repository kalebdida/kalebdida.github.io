import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const HollowFace = lazy(() => import('./HollowFace'));

type Experiment = 'afterimage' | 'melt' | 'hollow' | 'stroop';
const EXPERIMENTS: { id: Experiment; title: string; time: string; pitch: string }[] = [
  { id: 'afterimage', title: 'See a face that isn’t there', time: '20 sec', pitch: 'Stare at a negative photo of me, then look at white.' },
  { id: 'melt', title: 'The melting face', time: '30 sec', pitch: 'Watch a spiral, then watch a still photo move.' },
  { id: 'hollow', title: 'The hollow mask', time: 'As long as you like', pitch: 'A mask turns around. Try to see its inside.' },
  { id: 'stroop', title: 'Color words, two languages', time: '1 min', pitch: 'Name the ink, not the word, in English and Amharic.' },
];

/** shared fullscreen stage with Esc to close */
function Stage({ tone = 'dark', onClose, children, closeOnClick = false }: { tone?: 'dark' | 'white'; onClose: () => void; children: ReactNode; closeOnClick?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.documentElement.classList.add('afterimage-open');
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.classList.remove('afterimage-open'); };
  }, [onClose]);
  return createPortal(<div className={`lab-stage is-${tone}`} role="dialog" aria-modal="true" onClick={closeOnClick ? onClose : undefined}>
    {children}
    <button type="button" className="lab-close t-meta" onClick={onClose}>Esc</button>
  </div>, document.body);
}

function Caption({ title, children }: { title: string; children: ReactNode }) {
  return <div className="lab-caption">
    <p className="t-h3">{title}</p>
    <p className="t-ui mt-3">{children}</p>
    <p className="t-meta mt-5 opacity-70">Click anywhere or press Esc to go back</p>
  </div>;
}

/** 1. negative afterimage */
function Afterimage({ src, onClose }: { src: string; onClose: () => void }) {
  const [left, setLeft] = useState(15);
  useEffect(() => {
    const timer = window.setInterval(() => setLeft(n => n - 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const phase = left > 0 ? 'stare' : left > -4 ? 'white' : 'reveal';
  return <Stage tone={phase === 'stare' ? 'dark' : 'white'} onClose={onClose} closeOnClick={phase === 'reveal'}>
    {phase === 'stare' && <>
      <img src={src} alt="" className="lab-photo is-negative" draggable={false} />
      <p className="lab-hint t-meta">Keep your eyes on the red dot · {left}</p>
    </>}
    <span className={`lab-dot ${phase === 'stare' ? '' : 'is-dark'}`} aria-hidden="true" />
    {phase === 'reveal' && <Caption title="That face was your brain, not my code.">Your eyes got tired of the inverted colors, so on white they briefly painted the opposite: the real photo. It’s called a negative afterimage.</Caption>}
  </Stage>;
}

/** 2. motion aftereffect: a spinning spiral, then a still photo that seems to shrink */
function Melt({ src, onClose }: { src: string; onClose: () => void }) {
  const [left, setLeft] = useState(20);
  useEffect(() => {
    const timer = window.setInterval(() => setLeft(n => n - 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const spiral = left > 0;
  const turns = 9, points: string[] = [];
  for (let i = 0; i <= 900; i++) {
    const a = (i / 900) * turns * Math.PI * 2, r = (i / 900) * 48;
    points.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return <Stage onClose={onClose} closeOnClick={left <= -8}>
    {spiral ? <>
      <svg viewBox="0 0 100 100" className="lab-spiral" aria-hidden="true">
        <polyline points={points.join(' ')} fill="none" stroke="#f2efe8" strokeWidth="2.2" />
      </svg>
      <span className="lab-dot is-center" aria-hidden="true" />
      <p className="lab-hint t-meta">Keep your eyes on the center · {left}</p>
    </> : <>
      <img src={src} alt="" className="lab-photo" draggable={false} />
      <span className="lab-dot is-center" aria-hidden="true" />
      {left > -8 ? <p className="lab-hint t-meta">Keep looking at the dot</p> : <Caption title="The photo never moved.">After watching motion in one direction, the neurons that detect it get tired, so a still image seems to flow the other way. It’s called the motion aftereffect, or the waterfall illusion.</Caption>}
    </>}
  </Stage>;
}

/** 3. hollow mask */
function Hollow({ onClose }: { onClose: () => void }) {
  return <Stage onClose={onClose}>
    <Suspense fallback={<p className="t-meta text-ash">Loading the mask…</p>}><HollowFace /></Suspense>
    <div className="lab-side-note">
      <p className="t-h3">Watch it turn around.</p>
      <p className="t-ui mt-3">When the back faces you, you’re looking into a hollow mask. Most people still see a face pushing out, turning the wrong way. Your brain trusts “faces stick out” more than what the light says. Knowing it doesn’t help.</p>
    </div>
  </Stage>;
}

/** 4. Stroop, in English and Amharic */
const INKS = [
  { id: 'red', hex: '#e5484d', en: 'RED', am: 'ቀይ' },
  { id: 'green', hex: '#30a46c', en: 'GREEN', am: 'አረንጓዴ' },
  { id: 'blue', hex: '#4c74f0', en: 'BLUE', am: 'ሰማያዊ' },
  { id: 'yellow', hex: '#ffc53d', en: 'YELLOW', am: 'ቢጫ' },
] as const;
type Lang = 'en' | 'am';
interface Trial { lang: Lang; word: number; ink: number }

function makeTrials(first: Lang): Trial[] {
  const block = (lang: Lang) => Array.from({ length: 12 }, (_, i) => {
    const ink = Math.floor(Math.random() * 4);
    // two in three trials disagree, which is where the brain has to fight
    const word = i % 3 === 0 ? ink : (ink + 1 + Math.floor(Math.random() * 3)) % 4;
    return { lang, word, ink };
  }).sort(() => Math.random() - 0.5);
  return [...block(first), ...block(first === 'en' ? 'am' : 'en')];
}

function Stroop({ onClose }: { onClose: () => void }) {
  const [trials] = useState(() => makeTrials(Math.random() < 0.5 ? 'en' : 'am'));
  const [step, setStep] = useState(-1);
  const [wrong, setWrong] = useState(false);
  const shownAt = useRef(0);
  const results = useRef<{ lang: Lang; ms: number; ok: boolean; conflict: boolean }[]>([]);
  const done = step >= trials.length;

  const answer = (ink: number) => {
    if (step < 0 || done) return;
    const t = trials[step];
    results.current.push({ lang: t.lang, ms: performance.now() - shownAt.current, ok: ink === t.ink, conflict: t.word !== t.ink });
    setWrong(ink !== t.ink);
    setStep(s => s + 1);
  };
  useEffect(() => { shownAt.current = performance.now(); }, [step]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { const n = Number(event.key); if (n >= 1 && n <= 4) answer(n - 1); if (step < 0 && event.key === 'Enter') setStep(0); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const summary = (lang: Lang) => {
    const rows = results.current.filter(r => r.lang === lang);
    const hard = rows.filter(r => r.conflict && r.ok), easy = rows.filter(r => !r.conflict && r.ok);
    const mean = (xs: { ms: number }[]) => xs.length ? Math.round(xs.reduce((a, r) => a + r.ms, 0) / xs.length) : null;
    return { hard: mean(hard), easy: mean(easy), correct: rows.filter(r => r.ok).length, total: rows.length };
  };

  let body: ReactNode;
  if (step < 0) body = <div className="lab-caption is-static">
    <p className="t-h3">Click the color of the ink.</p>
    <p className="t-ui mt-3">Ignore what the word says. 24 words, half in English, half in Amharic. Use the buttons or keys 1 to 4. Go fast, but try not to miss.</p>
    <button type="button" className="lab-button t-ui mt-6" onClick={() => setStep(0)}>Start</button>
  </div>;
  else if (!done) {
    const t = trials[step];
    body = <>
      <p className="lab-hint is-top t-meta">{t.lang === 'en' ? 'English' : 'Amharic'} · {step + 1} / {trials.length}{wrong ? ' · missed one' : ''}</p>
      <p key={step} className={`lab-word ${t.lang === 'am' ? 't-geez' : ''}`} style={{ color: INKS[t.ink].hex }}>{INKS[t.word][t.lang]}</p>
      <div className="lab-swatches">{INKS.map((ink, i) => <button key={ink.id} type="button" aria-label={ink.id} className="lab-swatch" style={{ background: ink.hex }} onClick={() => answer(i)}><span className="t-meta">{i + 1}</span></button>)}</div>
    </>;
  } else {
    const en = summary('en'), am = summary('am');
    const costEn = en.hard !== null && en.easy !== null ? en.hard - en.easy : null;
    const costAm = am.hard !== null && am.easy !== null ? am.hard - am.easy : null;
    const verdict = costEn === null || costAm === null || en.correct < 8 || am.correct < 8 ? 'Too many misses to compare the two languages fairly. Try again a little slower.'
      : Math.abs(costEn - costAm) < 40 ? 'Both languages slowed you down about the same. Your brain reads both automatically.'
      : costEn > costAm ? 'English words got in your way more. Your brain reads English more automatically, so it was harder to ignore.'
      : 'Amharic words got in your way more. Your brain reads Amharic more automatically, so it was harder to ignore.';
    const row = (label: string, s: ReturnType<typeof summary>, cost: number | null) => <tr><td>{label}</td><td>{s.easy ?? '–'} ms</td><td>{s.hard ?? '–'} ms</td><td>{cost === null ? '–' : `${cost > 0 ? '+' : ''}${cost} ms`}</td><td>{s.correct}/{s.total}</td></tr>;
    body = <div className="lab-caption is-static">
      <p className="t-h3">{verdict}</p>
      <table className="lab-table t-ui mt-6"><thead><tr><th></th><th>Word matched ink</th><th>Word fought ink</th><th>Slowdown</th><th>Correct</th></tr></thead>
        <tbody>{row('English', en, costEn)}{row('Amharic', am, costAm)}</tbody></table>
      <p className="t-ui mt-5 opacity-80">This is the Stroop effect: reading is so automatic that the word fights the color. One short run is noisy, so treat it as a fun hint, not a measurement.</p>
      <p className="t-meta mt-5 opacity-70">Press Esc to go back</p>
    </div>;
  }
  return <Stage onClose={onClose}>{body}</Stage>;
}

/** the four experiments, gathered in one place at the end of the home page */
export function PerceptionLab({ src }: { src: string }) {
  const [open, setOpen] = useState<Experiment | null>(null);
  const close = () => setOpen(null);
  return <section className="perception-lab mt-16 max-w-3xl" data-reveal="up" aria-labelledby="lab-title">
    <p className="t-meta text-ash">Perception lab</p>
    <h3 id="lab-title" className="t-h3 mt-3">Four small experiments on your own brain.</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
      {EXPERIMENTS.map(x => <button key={x.id} type="button" className="contact-card lab-card text-left" onClick={() => setOpen(x.id)}>
        <span className="t-meta text-ash">{x.time}</span>
        <span className="block t-ui text-bone mt-2">{x.title}</span>
        <span className="block t-meta text-ash mt-2">{x.pitch}</span>
      </button>)}
    </div>
    <p className="t-meta text-ash mt-3">The first two flash between dark and light.</p>
    {open === 'afterimage' && <Afterimage src={src} onClose={close} />}
    {open === 'melt' && <Melt src={src} onClose={close} />}
    {open === 'hollow' && <Hollow onClose={close} />}
    {open === 'stroop' && <Stroop onClose={close} />}
  </section>;
}
