import { useEffect, useRef, useState } from 'react';
import { BOARD, newRound, stepRound } from '../utils/paddle';

export default function KeepItUp({ theme }: { theme: 'dark' | 'light' }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const round = useRef(newRound());
  const running = useRef(false);
  const paint = useRef<() => void>(() => {});
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(0);
  const pause = () => { running.current = false; setPlaying(false); };
  const start = () => {
    if (round.current.over) { round.current = newRound(); setScore(0); setOver(false); }
    running.current = true; setPlaying(true); canvas.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const node = canvas.current, context = node?.getContext('2d');
    if (!node || !context) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    node.width = BOARD.width * dpr; node.height = BOARD.height * dpr;
    context.scale(dpr, dpr);
    const color = theme === 'dark' ? '#5ad1ff' : '#006f9c';
    const draw = () => {
      const r = round.current;
      context.clearRect(0, 0, BOARD.width, BOARD.height);
      context.fillStyle = theme === 'dark' ? '#a7a7af' : '#53555e';
      context.globalAlpha = .25;
      for (let i = 0; i < 28; i++) context.fillRect((i * 79 + 17) % 315, (i * 43 + 7) % 160, 1, 1);
      context.globalAlpha = 1;
      const glow = context.createRadialGradient(r.x - 2, r.y - 2, 0, r.x, r.y, 9);
      glow.addColorStop(0, theme === 'dark' ? '#ffffff' : '#8ee5ff'); glow.addColorStop(1, color);
      context.fillStyle = glow; context.beginPath(); context.arc(r.x, r.y, BOARD.radius, 0, Math.PI * 2); context.fill();
      context.fillStyle = color; context.beginPath(); context.roundRect(r.paddle - BOARD.paddleWidth / 2, BOARD.paddleY, BOARD.paddleWidth, 5, 3); context.fill();
    };
    paint.current = draw; draw();
    return () => { paint.current = () => {}; };
  }, [theme]);
  useEffect(() => {
    if (!playing) { paint.current(); return; }
    let frame = 0, last = 0, remainder = 0;
    const tick = (time: number) => {
      if (!running.current) return;
      remainder += last ? Math.min((time - last) / 1000, .05) : 0; last = time;
      while (remainder >= 1 / 120) { stepRound(round.current, 1 / 120); remainder -= 1 / 120; }
      paint.current();
      setScore(previous => previous === round.current.score ? previous : round.current.score);
      if (round.current.over) { pause(); setOver(true); setBest(previous => Math.max(previous, round.current.score)); }
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  useEffect(() => {
    const visibility = () => { if (document.hidden) pause(); };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); });
    if (canvas.current) observer.observe(canvas.current);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); running.current = false; };
  }, []);
  const move = (clientX: number) => {
    const rect = canvas.current!.getBoundingClientRect();
    round.current.paddle = Math.max(BOARD.paddleWidth / 2, Math.min(BOARD.width - BOARD.paddleWidth / 2, (clientX - rect.left) / rect.width * BOARD.width));
    if (!running.current) paint.current();
  };
  return <div className="keep-it-up" data-playing={playing}>
    <div className="game-caption t-meta"><span>Keep it up</span><span>Score {score}</span></div>
    <canvas ref={canvas} tabIndex={0} role="group" aria-label="Keep it up paddle game" aria-describedby="paddle-help" onBlur={pause}
      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(event.clientX); }}
      onPointerMove={event => { if (event.pointerType === 'mouse' || event.buttons) move(event.clientX); }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); event.stopPropagation();
          round.current.paddle = Math.max(32, Math.min(288, round.current.paddle + (event.key === 'ArrowLeft' ? -18 : 18))); paint.current();
        }
        if (event.key === 'Escape') pause();
      }}>Move the paddle to keep the ball in play.</canvas>
    <div className="game-controls"><button type="button" className="t-meta link" onClick={playing ? pause : start}>{playing ? 'Pause game' : over ? 'Play again' : score ? 'Resume game' : 'Play game'}</button><span className="t-meta text-ash" role="status">{over ? `Round over. Best ${best}.` : `Best ${best}`}</span></div>
    <p id="paddle-help" className="t-meta text-ash">Move your mouse, drag, or use ← →.</p>
  </div>;
}
