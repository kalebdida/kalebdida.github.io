import { Fragment, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { AtSign, Github, Instagram, Linkedin, Mail, Send } from 'lucide-react';

export function RevealWords({ text }: { text: string }) {
  return <span className="reveal-words"><span className="sr-only">{text}</span>{text.split(/\s+/).map((word, i) => (
    <Fragment key={i}><span className="word-mask" aria-hidden="true"><span className="word" style={{ '--i': Math.min(i, 18) } as CSSProperties}>{word}</span></span>{' '}</Fragment>
  ))}</span>;
}

export function Motif({ kind }: { kind: string }) {
  const paths: Record<string, React.ReactNode> = {
    location: <><path d="M24 42S10 29 10 18a14 14 0 0 1 28 0c0 11-14 24-14 24Z"/><circle cx="24" cy="18" r="5"/></>,
    study: <><path d="m4 17 20-9 20 9-20 9-20-9Zm8 5v12q12 9 24 0V22M44 17v18"/></>,
    mind: <><path d="M24 39V9m0 7C15 2 5 17 12 23 1 34 16 45 24 36m0-20C33 2 43 17 36 23c11 11-4 22-12 13M13 23l6 4m16-4-6 4"/></>,
    language: <><path d="M4 10h25M17 5v5M9 10c2 11 8 18 19 23M25 10C22 21 14 31 4 34m23 8 9-24 10 24m-15-8h11"/></>,
    music: <><path className="motif-strings" d="M4 14h40M4 24h40M4 34h40"/><path d="M12 8v32m24-32v32"/></>,
    football: <><circle className="motif-ball" cx="24" cy="24" r="18"/><path className="motif-ball" d="m24 15 9 6-3 10H18l-3-10 9-6Zm0 0V6m9 15 8-5m-11 15 4 8m-16-8-4 8m1-18-8-5"/></>,
    writing: <><path d="m10 33 4-12L33 3l9 9-19 18-13 3Zm4-12 9 9M5 43h36"/></>,
    teaching: <><path d="M5 7h38v28H5V7Zm7 20 8-9 7 5 9-10M19 35l-4 9m14-9 4 9"/></>,
    security: <><path d="M10 21h28v22H10V21Zm6 0V13a8 8 0 0 1 16 0v8M24 29v7"/></>,
    embedded: <><rect x="12" y="12" width="24" height="24" rx="3"/><path d="M18 3v9m12-9v9M18 36v9m12-9v9M3 18h9m-9 12h9m24-12h9m-9 12h9M20 20h8v8h-8z"/></>,
  };
  return <svg className={`motif motif-${kind}`} width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind] ?? paths.mind}</svg>;
}

export function spotlight(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

export function Rank({ title }: { title: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(title);
  useEffect(() => {
    const match = title.match(/\d+/);
    if (!match) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let io: IntersectionObserver | undefined;
    const stop = () => { cancelAnimationFrame(raf); setValue(title); };
    const start = () => {
      if (media.matches) return stop();
      const begin = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - begin) / 800);
        setValue(title.replace(match[0], String(Math.round(Number(match[0]) * (1 - (1 - progress) ** 3)))));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { start(); io?.disconnect(); } }, { threshold: .5 });
      if (ref.current) io.observe(ref.current);
    }
    media.addEventListener('change', stop);
    return () => { io?.disconnect(); cancelAnimationFrame(raf); media.removeEventListener('change', stop); };
  }, [title]);
  const parts = value.match(/^(Stage )?(\d+(?:st|nd|rd|th)?)(.*)$/);
  return <span ref={ref} className="rank"><span className="sr-only">{title}</span><span aria-hidden="true">{parts ? <>{parts[1] && <span className="t-meta text-ash block mb-2">{parts[1]}</span>}{parts[2]}<span className="t-meta text-ash ml-2">{parts[3].trim()}</span></> : value}</span></span>;
}


export function Arrow({ className = '' }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>;
}

export function SocialIcon({ label }: { label: string }) {
  const props = { size: 19, strokeWidth: 1.5, 'aria-hidden': true as const };
  if (label === 'Email') return <Mail {...props} />;
  if (label === 'GitHub') return <Github {...props} />;
  if (label === 'LinkedIn') return <Linkedin {...props} />;
  if (label === 'Instagram') return <Instagram {...props} />;
  if (label === 'Telegram') return <Send {...props} />;
  return <AtSign {...props} />;
}
