import { useCallback, useEffect, useRef, useState } from 'react';

export function useRouteCurtain(reduced: boolean) {
  const [phase, setPhase] = useState<'idle' | 'cover' | 'reveal'>('idle');
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => {
    if (reduced && busy.current) { clear(); pending.current?.(); pending.current = null; busy.current = false; setPhase('idle'); }
  }, [reduced]);
  useEffect(() => () => clear(), []);
  const transition = useCallback((change: () => void) => {
    // A second navigation, including browser Back, supersedes the pending route.
    clear();
    if (reduced) { pending.current = null; busy.current = false; setPhase('idle'); change(); return; }
    busy.current = true; pending.current = change; setPhase('cover');
    timers.current.push(window.setTimeout(() => {
      pending.current?.(); pending.current = null; setPhase('reveal');
      timers.current.push(window.setTimeout(() => { setPhase('idle'); busy.current = false; }, 480));
    }, 260));
  }, [reduced]);
  return { phase, transition };
}
