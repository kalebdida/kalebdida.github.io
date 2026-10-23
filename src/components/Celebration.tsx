import { useEffect, useRef, type CSSProperties } from 'react';

export function Celebration({ onDone }: { onDone: () => void }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finish = useRef(onDone); finish.current = onDone;
  useEffect(() => { const timer = setTimeout(() => finish.current(), 1500); return () => clearTimeout(timer); }, []);
  if (reduced) return null;
  return <div aria-hidden="true" className="celebration" data-testid="celebration">{Array.from({ length: 32 }, (_, i) => {
    const angle = (i / 32) * Math.PI * 2;
    return <i key={i} style={{ '--dx': `${Math.cos(angle) * (90 + (i % 5) * 30)}px`, '--dy': `${Math.sin(angle) * 120 - 70}px`, '--spin': `${(i % 2 ? 1 : -1) * (90 + i * 19)}deg`, '--confetti': i % 2 ? '#2da861' : '#eb5b65', '--delay': `${i % 4 * 20}ms` } as CSSProperties} />;
  })}</div>;
}
