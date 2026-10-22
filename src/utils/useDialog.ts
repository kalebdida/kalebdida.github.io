import { useEffect, useRef } from 'react';

/** Focus containment, Escape, scroll lock and focus restoration for both overlays. */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const latestClose = useRef(onClose);
  latestClose.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex="0"]') ?? []);
    const timer = window.setTimeout(() => focusable()[0]?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); latestClose.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    ref.current?.addEventListener('keydown', onKey);
    const current = ref.current;
    return () => { clearTimeout(timer); current?.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, [open]);
  return ref;
}
