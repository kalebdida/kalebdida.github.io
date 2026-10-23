import { useEffect, useRef, useState } from 'react';

export function DecodeLabel({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number | undefined;
    const finish = () => { clearInterval(timer); setDisplay(text); };
    if (media.matches || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      io.disconnect(); let tick = 0;
      timer = window.setInterval(() => {
        const progress = ++tick / 12;
        setDisplay(text.split('').map((char, i) => char === ' ' || i < progress * text.length ? char : '01_<>*'[Math.floor(Math.random() * 6)]).join(''));
        if (tick >= 12) finish();
      }, 40);
    }, { threshold: .4 });
    if (ref.current) io.observe(ref.current);
    media.addEventListener('change', finish);
    return () => { io.disconnect(); finish(); media.removeEventListener('change', finish); };
  }, [text]);
  return <span ref={ref} className="decode-label"><span className="sr-only">{text}</span><span aria-hidden="true" className="decode-text">{display}</span><span className="decode-sizer" aria-hidden="true">{text}</span></span>;
}
