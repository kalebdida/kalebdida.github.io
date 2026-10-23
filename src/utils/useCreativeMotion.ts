import { useEffect } from 'react';

/** Pointer work is delegated and throttled to a frame; it never re-renders React. */
export function useCreativeMotion(reduced: boolean) {
  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
    let current: HTMLElement | null = null, frame = 0;
    const reset = () => { current?.style.setProperty('--mag-x', '0px'); current?.style.setProperty('--mag-y', '0px'); };
    const move = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-magnetic]');
      if (target !== current) { reset(); current = target; }
      cancelAnimationFrame(frame);
      if (!target) return;
      const x = event.clientX, y = event.clientY;
      frame = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--mag-x', `${Math.max(-8, Math.min(8, (x - rect.left - rect.width / 2) * .14))}px`);
        target.style.setProperty('--mag-y', `${Math.max(-6, Math.min(6, (y - rect.top - rect.height / 2) * .14))}px`);
      });
    };
    const leave = () => { cancelAnimationFrame(frame); reset(); current = null; };
    window.addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', leave);
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); leave(); };
  }, [reduced]);
}
