import { useEffect } from 'react';

export function useReveals() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let io: IntersectionObserver | undefined;
    const observe = () => {
      const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
      if (media.matches || !('IntersectionObserver' in window)) els.forEach(el => el.classList.add('is-in'));
      else els.forEach(el => io?.observe(el));
    };
    if ('IntersectionObserver' in window) io = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io?.unobserve(entry.target); } });
    }, { rootMargin: '0px 0px -5% 0px', threshold: .08 });
    observe();
    const mutations = new MutationObserver(observe);
    mutations.observe(document.body, { childList: true, subtree: true });
    media.addEventListener('change', observe);
    return () => { io?.disconnect(); mutations.disconnect(); media.removeEventListener('change', observe); };
  }, []);
}
