/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Lenis from 'lenis';
import { Moon, Sun } from 'lucide-react';
import { SITE_DATA, type ProjectCaseFile } from './data/siteData';
import { adamaClock, updateKeystrokeBuffer, selectHomePosts } from './utils/logic';
import { soundEngine, PIANO_KEY_MAP } from './utils/soundEngine';
import type { SceneState } from './components/ParticleField';
import { ProjectDrawer } from './components/ProjectDrawer';
import { NoteCard } from './components/NoteCard';
import { NowView, ResumeView } from './components/ExtraPages';
import { Arrow, Motif, Rank, RevealWords, SocialIcon, spotlight } from './components/Details';
import { useDialog } from './utils/useDialog';
import { useReveals } from './utils/useReveals';
import { ResumeDownload } from './components/ResumeDownload';
import { AnonymousNote } from './components/AnonymousNote';
import { VisitorCount } from './components/VisitorCount';
import { Photo } from './components/Photo';
import { Piano } from './components/Piano';
import { Celebration } from './components/Celebration';
import { DecodeLabel } from './components/DecodeLabel';
import { WorkPreview } from './components/WorkPreview';
import { NotFound } from './components/NotFound';
import { useCreativeMotion } from './utils/useCreativeMotion';
import { useRouteCurtain } from './utils/useRouteCurtain';
import { FORMATION } from './three/formations';

const ParticleField = lazy(() => import('./components/ParticleField').then(m => ({ default: m.ParticleField })));
const BlogIndexView = lazy(() => import('./components/BlogViews').then(m => ({ default: m.BlogIndexView })));
const BlogPostView = lazy(() => import('./components/BlogViews').then(m => ({ default: m.BlogPostView })));
const ProjectsView = lazy(() => import('./components/ProjectsView'));

type RouteState =
  | { page: 'notfound' }
  | { page: 'home' }
  | { page: 'blog' }
  | { page: 'projects' }
  | { page: 'post'; slug: string }
  | { page: 'now' }
  | { page: 'resume' };

function parseLocationToRoute(pathname: string, hash: string): RouteState {
  const cleanHash = hash.replace(/^#/, '');
  const path = cleanHash.startsWith('/') ? cleanHash : pathname;
  if (path === '/blog' || path === '/blog/') return { page: 'blog' };
  if (path === '/projects' || path === '/projects/') return { page: 'projects' };
  if (path.startsWith('/blog/')) {
    const slug = path.replace('/blog/', '').replace(/\/$/, '');
    return SITE_DATA.posts.some(post => post.slug === slug && !post.draft && !post.external) ? { page: 'post', slug } : { page: 'notfound' };
  }
  if (path === '/now' || path === '/now/') return { page: 'now' };
  if (path === '/resume' || path === '/resume/') return { page: 'resume' };
  return path === '/' || path === '' || path === '/index.html' ? { page: 'home' } : { page: 'notfound' };
}

/** the sections of the home page, in order, and the shape the particles take in each */
const CHAPTERS: { id: string; label: string; formation: number }[] = [
  { id: 'hero', label: 'Kal', formation: FORMATION.mind },
  { id: 'about', label: 'About', formation: FORMATION.brain },
  { id: 'disciplines', label: 'What I do', formation: FORMATION.triad },
  { id: 'work', label: 'Work', formation: FORMATION.constellation },
  { id: 'journey', label: 'Journey', formation: FORMATION.highlands },
  { id: 'recognition', label: 'Recognition', formation: FORMATION.dust },
  { id: 'field-notes', label: 'Field notes', formation: FORMATION.dust },
  { id: 'off-screen', label: 'Off-screen', formation: FORMATION.sound },
  { id: 'contact', label: 'Say hi', formation: FORMATION.light },
].filter(chapter => chapter.id !== 'journey' || SITE_DATA.journey.some(item => item.showOnHome))
 .filter(chapter => chapter.id !== 'recognition' || SITE_DATA.recognition.some(item => item.showOnHome));

/** live "7:55 pm" + ethiopian date, refreshed every 20s */
function useAdamaClock() {
  const [clock, setClock] = useState(() => adamaClock());
  useEffect(() => {
    const id = window.setInterval(() => setClock(adamaClock()), 20_000);
    return () => window.clearInterval(id);
  }, []);
  return clock;
}

/** text that rises letter by letter. `trigger` = play on load, or when revealed by scroll */
function Letters({ text, trigger, delay = 0 }: { text: string; trigger: 'load' | 'reveal'; delay?: number }) {
  return (
    <span className={trigger === 'load' ? 'letters-load' : 'letters-reveal'}><span className="sr-only">{text}</span>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="char-mask" aria-hidden="true">
          <span className="char" style={{ '--i': i, '--d': `${delay}ms` } as CSSProperties}>
            {ch === ' ' ? ' ' : ch}
          </span>
        </span>
      ))}
    </span>
  );
}

/** left column heading + right column content, the rhythm every home section shares */
function Section({
  id,
  title,
  aside,
  visual,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  visual?: ReactNode;
  children: ReactNode;
}) {
  const formation = CHAPTERS.find((c) => c.id === id)?.formation ?? FORMATION.dust;
  return (
    <section id={id} data-formation={formation} className="home-section relative py-28 sm:py-40">
      <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 data-reveal="words" className="t-h2 text-bone">
              {['work', 'disciplines', 'field-notes'].includes(id) ? <DecodeLabel text={title} /> : <RevealWords text={title} />}
            </h2>
            {visual}
            {aside && (
              <div data-reveal="up" style={{ '--d': '120ms' } as CSSProperties} className="mt-5">
                {aside}
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-8">{children}</div>
      </div>
    </section>
  );
}

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

export default function App() {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const { phase: routePhase, transition } = useRouteCurtain(reducedMotion);
  useCreativeMotion(reducedMotion);
  const [showLoader, setShowLoader] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  });

  const [route, setRoute] = useState<RouteState>(() =>
    typeof window !== 'undefined' ? parseLocationToRoute(window.location.pathname, window.location.hash) : { page: 'home' },
  );

  const [soundOn, setSoundOn] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return localStorage.getItem('kal-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  const portraitSrc = theme === 'dark' ? SITE_DATA.identity.portraitDark : SITE_DATA.identity.portraitLight;
  const [activeProject, setActiveProject] = useState<ProjectCaseFile | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<'Copied' | 'Copy failed' | null>(null);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  const [celebration, setCelebration] = useState(0);
  const celebrationId = useRef(0);
  const toastTimer = useRef<number | undefined>(undefined);
  const siuuuAudioRef = useRef<HTMLAudioElement>(null);
  const [preview, setPreview] = useState<ProjectCaseFile | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [siuuuToast, setSiuuuToast] = useState(false);
  const [flagFound, setFlagFound] = useState(false);
  const [chapter, setChapter] = useState(0);
  const clock = useAdamaClock();
  const flagDialogRef = useDialog(flagFound, () => setFlagFound(false));
  useReveals();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0A0A0C' : '#F4F1E9');
    try { localStorage.setItem('kal-theme', theme); } catch {}
    window.dispatchEvent(new CustomEvent('kal:theme', { detail: theme }));
  }, [theme]);
  useEffect(() => () => { clearTimeout(copyTimer.current); clearTimeout(toastTimer.current); }, []);
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(SITE_DATA.identity.email); setCopiedEmail('Copied'); }
    catch { setCopiedEmail('Copy failed'); }
    clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedEmail(null), 2000);
  };

  const keystrokeBufRef = useRef('');
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const journeyListRef = useRef<HTMLOListElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  // shared with the three.js loop, never causes a react re-render
  const sceneRef = useRef<SceneState>({
    stage: 0,
    formations: CHAPTERS.map((c) => c.formation),
    journeyDrift: 0,
    hl3: -1,
    hl4: -1,
    portrait: portraitSrc,
  });
  sceneRef.current.portrait = portraitSrc;

  useEffect(() => {
    if (!showLoader) return;
    if (reducedMotion) { setShowLoader(false); return; }
    const timer = window.setTimeout(() => setShowLoader(false), 480);
    return () => clearTimeout(timer);
  }, [showLoader, reducedMotion]);

  // console greeting + ctf piece 2 of 3
  useEffect(() => {
    const ascii = [' _         _ ', '| | ____ _| |', '| |/ / _` | |', '|   < (_| | |', '|_|\\_\\__,_|_|'].join('\n');
    console.info(
      `%c${ascii}\n%cHey dev. A flag is hidden on this site in three pieces, and one of them is right here.\nWhen you have all three, just type the whole flag anywhere on the page.\n%cctf_part_2: ${SITE_DATA.ctf.part2Console}`,
      'color: #EDEAE3; font-family: monospace;',
      'color: #8A8A93; font-family: monospace;',
      'color: #5AD1FF; font-family: monospace;',
    );
  }, []);

  const celebrate = (withVoice = false) => {
    setCelebration(++celebrationId.current); setSiuuuToast(true);
    if (withVoice && siuuuAudioRef.current) {
      const recording = siuuuAudioRef.current;
      recording.pause(); recording.currentTime = 0;
      void recording.play().catch(() => {});
    }
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setSiuuuToast(false), 2000);
  };
  const pendingSection = useRef<string | null>(null);
  const navigateTo = (path: string) => {
    setMobileNav(false); setPreview(null);
    if (path === window.location.pathname && !window.location.hash) {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' }); return;
    }
    transition(() => {
      window.history.pushState({}, '', path);
      setRoute(parseLocationToRoute(window.location.pathname, window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };
  useEffect(() => {
    const onPopState = () => {
      const next = parseLocationToRoute(window.location.pathname, window.location.hash);
      if (JSON.stringify(next) === JSON.stringify(route)) return;
      setMobileNav(false); transition(() => setRoute(next));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [transition, route]);
  const initialRoute = useRef(true);
  useEffect(() => {
    if (initialRoute.current) { initialRoute.current = false; return; }
    const focus = () => {
      const heading = Array.from(document.querySelectorAll<HTMLElement>('main h1')).find(el => el.getClientRects().length > 0);
      if (!heading) return false;
      heading.tabIndex = -1; heading.focus({ preventScroll: true }); return document.activeElement === heading;
    };
    const observer = new MutationObserver(() => { if (focus()) observer.disconnect(); });
    if (!focus()) observer.observe(document.querySelector('main')!, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [route]);

  useEffect(() => {
    const base = SITE_DATA.identity.shortName;
    if (route.page === 'home') document.title = `${base} (Kal)`;
    else if (route.page === 'projects') document.title = `Projects, ${base}`;
    else if (route.page === 'blog') document.title = `Field notes, ${base}`;
    else if (route.page === 'post') {
      const found = SITE_DATA.posts.find((p) => p.slug === route.slug && !p.draft && !p.external);
      document.title = found ? `${found.title}, ${base}` : `Field notes, ${base}`;
    } else if (route.page === 'now') document.title = `Now, ${base}`;
    else if (route.page === 'resume') document.title = `Resume, ${base}`;
    else document.title = `Page not found, ${base}`;
  }, [route]);

  // "come back to the void" while the tab is hidden
  useEffect(() => {
    let saved = document.title;
    const onVis = () => {
      if (document.hidden) {
        saved = document.title;
        document.title = 'Come back to the void';
      } else {
        document.title = saved;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // smooth scroll + everything that follows the scroll position
  useEffect(() => {
    const reduced = reducedMotion;
    let lenis: Lenis | null = null;
    let rafId = 0;
    if (!reduced) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    let lastY = window.scrollY, lastScrollTime = performance.now(), skewTimer: number | undefined;
    const update = () => {
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const now = performance.now();
      if (!reduced) {
        const speed = (scrollY - lastY) / Math.max(16, now - lastScrollTime);
        document.documentElement.style.setProperty('--scroll-skew', `${Math.max(-1.4, Math.min(1.4, speed * .16))}deg`);
        clearTimeout(skewTimer);
        skewTimer = window.setTimeout(() => document.documentElement.style.setProperty('--scroll-skew', '0deg'), 90);
      }
      lastY = scrollY; lastScrollTime = now;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      progressRef.current?.style.setProperty('--p', String(Math.min(1, Math.max(0, scrollY / max))));

      if (route.page !== 'home') return;

      // which chapter we're in, as a continuous number (2.4 = 40% from chapter 2 to 3)
      const tops = CHAPTERS.map((c) => {
        const el = document.getElementById(c.id);
        return el ? el.getBoundingClientRect().top + scrollY : Infinity;
      });
      const center = scrollY + vh * 0.5;
      let stage = 0;
      for (let i = 0; i < tops.length - 1; i++) {
        if (!Number.isFinite(tops[i + 1])) continue;
        // each boundary crossed adds up to 1
        stage += Math.min(1, Math.max(0, (center - (tops[i + 1] - vh * 0.32)) / (vh * 0.6)));
      }
      sceneRef.current.stage = stage;
      const nextChapter = Math.round(stage);
      setChapter((prev) => (prev === nextChapter ? prev : nextChapter));

      const journey = document.getElementById('journey');
      if (journey) {
        const r = journey.getBoundingClientRect();
        sceneRef.current.journeyDrift = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / Math.max(1, r.height)));
      }
      const milestones = Array.from(journeyListRef.current?.querySelectorAll('li') ?? []);
      let nearest = 0, distance = Infinity;
      milestones.forEach((el, i) => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - vh / 2); if (d < distance) { distance = d; nearest = i; } });
      milestones.forEach((el, i) => el.classList.toggle('is-current', i === nearest));
      const list = journeyListRef.current;
      if (list) {
        const r = list.getBoundingClientRect();
        list.style.setProperty('--jp', String(Math.min(1, Math.max(0, (vh * 0.62 - r.top) / Math.max(1, r.height)))));
      }
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(rafId);
      clearTimeout(skewTimer);
      document.documentElement.style.setProperty('--scroll-skew', '0deg');
      lenis?.destroy();
    };
  }, [route.page, reducedMotion]);

  // keyboard: esc closes things, a to k plays piano when sound is on, "siuuu", and the flag
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape') {
        if (flagFound) setFlagFound(false);
        else if (activeProject) setActiveProject(null);
        return;
      }
      if (activeProject || flagFound || e.metaKey || e.ctrlKey || e.altKey) return;

      const { nextBuffer, triggered } = updateKeystrokeBuffer(keystrokeBufRef.current, e.key);
      keystrokeBufRef.current = nextBuffer;
      if (triggered === 'siuuu') {
        celebrate();
      } else if (triggered === 'flag') {
        setFlagFound(true);
      }

      if (isInput || e.repeat) return;
      const k = e.key.toLowerCase();
      if (soundEngine.isEnabled() && PIANO_KEY_MAP[k]) {
        soundEngine.playPianoNote(k);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeProject, flagFound]);

  // cursor ring on fine pointers; it opens up over anything clickable
  useEffect(() => {
    const el = cursorRef.current;
    if (!el || window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      el.style.opacity = '1';
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const interactive = (e.target as HTMLElement | null)?.closest?.('a, button, [role="button"], input');
      el.dataset.hover = interactive ? '1' : '0';
      const label = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]')?.dataset.cursor ?? '';
      el.dataset.label = label;
      const text = el.querySelector('b'); if (text) text.textContent = label;
    };
    const onLeave = () => {
      el.style.opacity = '0';
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [reducedMotion]);

  const handleToggleSound = (forceState?: boolean) => {
    const next = typeof forceState === 'boolean' ? soundEngine.setEnabled(forceState) : soundEngine.toggle();
    setSoundOn(next);
  };

  const scrollToSection = (sectionId: string) => {
    setMobileNav(false);
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (route.page !== 'home') {
      pendingSection.current = sectionId;
      navigateTo('/');
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: behavior as ScrollBehavior });
    }
  };

  useEffect(() => {
    if (route.page !== 'home' || !pendingSection.current) return;
    const id = pendingSection.current; pendingSection.current = null;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' }));
    return () => cancelAnimationFrame(frame);
  }, [route, reducedMotion]);

  const navItems = [
    { label: 'About', onClick: () => scrollToSection('about'), active: false },
    { label: 'Work', onClick: () => route.page === 'home' ? scrollToSection('work') : navigateTo('/projects'), active: route.page === 'projects' },
    { label: 'Journey', onClick: () => scrollToSection('journey'), active: false },
    { label: 'Field notes', onClick: () => navigateTo('/blog'), active: route.page === 'blog' || route.page === 'post' },
    { label: 'Now', onClick: () => navigateTo('/now'), active: route.page === 'now' },
  ];

  const homePosts = selectHomePosts(SITE_DATA.posts);

  return (
    <div data-sound={soundOn ? 'on' : 'off'} className="min-h-screen bg-night text-bone relative">
      <div className="route-curtain" data-phase={routePhase} aria-hidden="true"><span className="t-title">Kal</span></div>
      {/* ctf piece 1 also lives here, for anyone using the inspector */}
      <div
        hidden
        aria-hidden="true"
        data-ctf-fragment-1={SITE_DATA.ctf.part1Base64}
        data-ctf-hint="part 1 is base64. part 2 is in the console. part 3 is in /robots.txt. then type the flag anywhere."
      />

      {showLoader && (
        <div aria-hidden="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-night pointer-events-none">
          <span className="loader-fade font-serif text-[28px] font-light text-bone">Kal</span>
        </div>
      )}

      {/* very faint film grain */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-20 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div ref={cursorRef} aria-hidden="true" className="cursor-ring hidden lg:block">
        <span><b /></span>
      </div>

      {reducedMotion ? <div className="static-field" aria-hidden="true" /> : <Suspense fallback={<div className="static-field" aria-hidden="true" />}><ParticleField mode={route.page === 'home' ? 'home' : route.page === 'notfound' ? 'lost' : 'calm'} sceneRef={sceneRef} /></Suspense>}

      {/* nav */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-night/70 backdrop-blur-md border-b border-hair print:hidden">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/');
            }}
            className="font-serif text-[22px] tracking-[-0.01em] text-bone hover:text-signal transition-colors"
          >
            Kal
          </a>
          <button type="button" className="md:hidden t-meta link-quiet ml-auto" aria-expanded={mobileNav} aria-controls="primary-nav" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? 'Close menu' : 'Menu'}</button>
          <nav id="primary-nav" aria-label="Primary" className={`primary-nav ${mobileNav ? 'is-open' : ''} md:flex items-center gap-6`}>
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                data-magnetic
                aria-current={item.active ? 'page' : undefined}
                className={`t-ui nav-link ${item.active ? 'text-bone is-active' : 'text-ash hover:text-bone'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => handleToggleSound()}
            aria-pressed={soundOn}
            data-magnetic
            className="t-meta text-ash hover:text-bone transition-colors flex items-center gap-2"
          >
            <span aria-hidden="true" className={`sound-bars ${soundOn ? 'is-on' : ''}`}>
              <i />
              <i />
              <i />
            </span>
            {soundOn ? 'Sound on' : 'Sound off'}
          </button>
        </div>
        {/* thin page progress */}
        <div ref={progressRef} aria-hidden="true" className="page-progress" />
      </header>

      <main id="main-content" className="relative z-10"><Suspense fallback={<p className="t-ui max-w-3xl mx-auto px-6 pt-36">Loading…</p>}>
        {route.page === 'notfound' && <NotFound onHome={() => navigateTo('/')} />}
        {route.page === 'projects' && <ProjectsView onHome={() => navigateTo('/')} onOpen={setActiveProject} />}
        {route.page === 'blog' && (
          <BlogIndexView onSelectPost={(slug) => navigateTo(`/blog/${slug}`)} onNavigateHome={() => navigateTo('/')} />
        )}
        {route.page === 'post' &&
          (() => {
            const post = SITE_DATA.posts.find((p) => p.slug === route.slug && !p.draft && !p.external);
            if (!post) return <NotFound onHome={() => navigateTo('/')} />;
            return (
              <BlogPostView
                post={post}
                onBackToIndex={() => navigateTo('/blog')}
                onSelectPost={(slug) => navigateTo(`/blog/${slug}`)}
              />
            );
          })()}
        {route.page === 'now' && <NowView onNavigateHome={() => navigateTo('/')} />}
        {route.page === 'resume' && <ResumeView onNavigateHome={() => navigateTo('/')} />}

        {route.page === 'home' && (
          <div className="max-w-6xl mx-auto px-6">
            {/* hero */}
            <section id="hero" data-formation={FORMATION.mind} className="hero-section min-h-[100svh] flex flex-col pt-28 pb-16 sm:pb-20">
              <div className="hero-portrait-wrap intro-fade" style={delay(850)} aria-hidden="true">
                <span className="hero-portrait-frame" />
                <Photo src={portraitSrc} alt="" eager sizes="(min-width: 1024px) 520px, 45vw" className="hero-portrait" />
              </div>
              <div className="flex items-baseline justify-between gap-6 t-meta text-ash intro-fade" style={delay(1500)}>
                <span>{SITE_DATA.identity.city}</span>
                <span className="text-right">
                  {clock.time}
                  {clock.ethDate && <span className="block sm:inline"><span className="hidden sm:inline">, </span>{clock.ethDate}</span>}
                </span>
              </div>

              <div className="hero-copy mt-auto">
                <h1 className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
                  <span className="t-display text-bone">
                    <Letters text={SITE_DATA.identity.shortName} trigger="load" delay={420} />
                  </span>
                  <span lang="am" className="basis-full t-geez text-ash text-[1.25rem] sm:text-[1.5rem] tracking-wide intro-fade" style={delay(1150)}>
                    {SITE_DATA.identity.geezName}
                  </span>
                </h1>

                <div className="mt-10 sm:mt-12">
                  <p className="t-lead text-bone max-w-[26ch] intro-fade" style={delay(1000)}>
                    {SITE_DATA.identity.tagline}
                  </p>
                  <p className="t-body text-ash mt-5 max-w-[48ch] intro-fade" style={delay(1200)}>
                    {SITE_DATA.identity.intro}
                  </p>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 t-ui intro-fade" style={delay(1400)}>
                  <button type="button" data-magnetic onClick={() => scrollToSection('work')} className="link">
                    See the work
                  </button>
                  <button type="button" data-magnetic onClick={() => navigateTo('/blog')} className="link-quiet">
                    Read field notes
                  </button>
                  <ResumeDownload className="link-quiet" />
                </div>
              </div>

              <div className="scroll-cue intro-fade" style={delay(2000)} aria-hidden="true">
                <span />
              </div>
            </section>

            {/* about */}
            <Section id="about" title="About" visual={<div className="about-visual mt-8">{portraitSrc && <Photo src={portraitSrc} alt={SITE_DATA.identity.name} sizes="(min-width: 1024px) 320px, 80vw" className="about-portrait" />}<div data-particle-anchor="brain" className="brain-slot" aria-hidden="true" /></div>}>
              <p data-reveal="words" className="about-pullquote t-lead text-bone max-w-[34ch]">
                <RevealWords text={SITE_DATA.about.lead} />
              </p>
              <p data-reveal="up" className="mt-8 t-body text-ash max-w-[60ch]">{SITE_DATA.about.homeParagraph}</p>
              <dl onPointerMove={spotlight} className="facts-grid spotlight relative mt-14 grid grid-cols-1 sm:grid-cols-2">
                <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
                {SITE_DATA.about.facts.map((fact, i) => (
                  <div key={fact.key} data-reveal="up" className="fact-card" style={delay(i * 70)}>
                    <Motif kind={['location', 'study', 'mind', 'language'][i]} />
                    <dt className="t-meta text-ash">{fact.key}</dt>
                    <dd className="t-ui text-bone mt-1">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <div className="marquee-wrap"><div className="keyword-marquee" data-paused={marqueePaused} role="img" aria-label={SITE_DATA.keywords.join(', ')}><div aria-hidden="true">{[0, 1].map(copy => <span key={copy} data-copy={copy}>{SITE_DATA.keywords.map(word => <span key={word}>{word}<i>·</i></span>)}</span>)}</div></div><button type="button" className="marquee-pause t-meta" aria-pressed={marqueePaused} aria-label={marqueePaused ? 'Resume keyword animation' : 'Pause keyword animation'} onClick={() => setMarqueePaused(!marqueePaused)}>{marqueePaused ? 'Play' : 'Pause'}</button></div>
            {/* what i do */}
            <Section id="disciplines" title="What I do">
              <div className="discipline-grid grid grid-cols-1 xl:grid-cols-3 gap-4">
                {SITE_DATA.disciplines.map((d, i) => (
                  <div
                    key={d.id}
                    data-reveal="up"
                    style={delay(i * 110)}
                    className="discipline spotlight"
                    tabIndex={0}
                    onPointerMove={spotlight}
                    onFocus={() => (sceneRef.current.hl3 = i)}
                    onBlur={() => (sceneRef.current.hl3 = -1)}
                    onMouseEnter={() => (sceneRef.current.hl3 = i)}
                    onMouseLeave={() => (sceneRef.current.hl3 = -1)}
                  >
                    <Motif kind={d.id} />
                    <h3 className="t-h3 text-bone mt-6">{d.title}</h3>
                    <p className="t-ui text-ash mt-3 leading-relaxed">{d.text}</p>
                    <div data-particle-anchor={`discipline-${i}`} className="formation-slot" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </Section>

            {/* work */}
            <Section id="work" title="Work" aside={<><p className="t-ui text-ash max-w-[28ch]">Open any one to read its case file.</p><a href="/projects" className="t-ui link mt-5 inline-flex" onClick={event => { event.preventDefault(); navigateTo('/projects'); }}>Browse projects <Arrow className="inline-block ml-2" /></a></>}>
              <ul className="work-list">
                {SITE_DATA.projects.map((project, i) => (
                  <li key={project.id} data-reveal="up" style={delay(i * 80)} className="relative">
                    <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
                    <button
                      type="button"
                      onClick={() => setActiveProject(project)}
                      onMouseEnter={() => { sceneRef.current.hl4 = i; if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) setPreview(project); }}
                      onMouseLeave={() => { sceneRef.current.hl4 = -1; setPreview(null); }}
                      onFocus={() => (sceneRef.current.hl4 = i)}
                      onBlur={() => (sceneRef.current.hl4 = -1)}
                      onPointerMove={event => { spotlight(event); if (previewRef.current) { previewRef.current.style.left = `${Math.max(12, Math.min(window.innerWidth - 300, event.clientX + 24))}px`; previewRef.current.style.top = `${Math.max(80, Math.min(window.innerHeight - 340, event.clientY - 90))}px`; } }}
                      data-cursor="Open"
                      className="work-row spotlight group w-full text-left py-8 grid grid-cols-[2.5rem_1fr] sm:grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2"
                    >
                      <span className="t-meta text-ash pt-2 group-hover:text-signal transition-colors">{project.id}</span><span data-particle-anchor={`work-${i}`} className="work-star-slot" aria-hidden="true" />
                      <span className="work-row-body">
                        <span className="t-h3 text-bone group-hover:text-signal transition-colors">
                          {project.title}
                        </span>
                        <span className="block t-body text-ash mt-2 max-w-[52ch]">{project.homeSummary || project.summary}</span>
                      </span>
                      <span className="work-preview col-start-2 t-meta text-ash flex flex-wrap items-center gap-3 mt-3">
                        <Arrow className="work-arrow ml-auto text-signal" />
                      </span>
                    </button>
                  </li>
                ))}
                <li aria-hidden="true" className="h-px bg-hair" />
              </ul>
            </Section>

            {/* journey */}
            {SITE_DATA.journey.some(item => item.showOnHome) && <Section id="journey" title="Journey" aside={<ResumeDownload>Full resume <Arrow className="inline-block ml-2 align-middle" /></ResumeDownload>}>
              <ol ref={journeyListRef} className="journey-list relative pl-8">
                <span aria-hidden="true" className="journey-rail" />
                {SITE_DATA.journey.filter(item => item.showOnHome).map((m, i) => (
                  <li
                    key={m.id}
                    data-reveal="up"
                    style={delay(Math.min(i, 3) * 60)}
                    className="relative py-6 grid grid-cols-1 sm:grid-cols-[9.5rem_1fr] gap-x-8 gap-y-1"
                  >
                    <span aria-hidden="true" className="jdot" />
                    <span className="t-meta text-ash sm:pt-1.5"><span className="period-chip">{m.when}</span></span>
                    <div>
                      <h3 className="t-h3 text-bone">{m.homeSummary || m.title}</h3>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>}

            {/* recognition */}
            {SITE_DATA.recognition.some(item => item.showOnHome) && <Section id="recognition" title="Recognition">
              <ul>
                {SITE_DATA.recognition.filter(item => item.showOnHome).map((item, i) => (
                  <li
                    key={item.detail}
                    data-reveal="up"
                    style={delay(i * 70)}
                    className="recognition-row relative py-9 grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-4 items-baseline"
                  >
                    <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
                    <Rank title={item.title} />
                    <span className="t-body text-ash">{item.homeDetail || item.detail}</span>
                    {item.scope && <span className="scope-pill t-meta text-ash sm:col-start-2">{item.scope}</span>}
                  </li>
                ))}
                <li aria-hidden="true" className="h-px bg-hair" />
              </ul>
            </Section>}

            {/* field notes */}
            <Section
              id="field-notes"
              title="Field notes"
              aside={
                <button type="button" onClick={() => navigateTo('/blog')} className="t-ui link">
                  All notes
                </button>
              }
            >
              {!homePosts.length && <div className="writing-soon" data-reveal="up"><span className="t-meta text-signal">Field notes</span><p className="t-title mt-5">Writing soon.</p><p className="t-body text-ash mt-4">New notes coming soon.</p><button type="button" data-magnetic onClick={() => navigateTo('/blog')} className="t-ui link mt-6">Browse field notes</button></div>}
              <ul>
                {homePosts.map((post, i) => (
                  <li key={post.slug} data-reveal="up" style={delay(i * 80)} className="relative">
                    <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
                    <NoteCard post={post} onOpen={(slug) => navigateTo(`/blog/${slug}`)} />
                  </li>
                ))}
                <li aria-hidden="true" className="h-px bg-hair" />
              </ul>
            </Section>

            {/* off-screen */}
            <Section id="off-screen" title="Off-screen">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-10">
                {SITE_DATA.offScreen.map((item, i) => (
                  <div key={item.id} data-reveal="up" className="offscreen-card" tabIndex={0} style={delay(i * 80)}>
                    {item.id === 'football' ? <button type="button" className="football-trigger" data-cursor="Play" onClick={() => celebrate(true)} aria-label="Play Siuu celebration"><Motif kind="football" /></button> : <Motif kind={item.id} />}
                    <h3 className="t-h3 text-bone">{item.label}</h3>
                    <p className="t-body text-ash mt-2">{item.text}</p>
                    {item.href && <a href={item.href} target="_blank" rel="noopener noreferrer" className="t-meta link inline-flex items-center gap-2 mt-4"><SocialIcon label="Telegram" />{item.linkLabel}<Arrow /></a>}
                    {item.id === 'music' && <Piano soundOn={soundOn} onEnable={() => handleToggleSound(true)} />}
                    {item.id === 'football' && <p className="t-meta text-ash mt-4">Try typing <kbd className="typing-hint">siuuu</kbd>, or tap the football.</p>}
                  </div>
                ))}
              </div>
            </Section>

            {/* contact */}
            <section id="contact" data-formation={FORMATION.light} className="relative min-h-[100svh] pt-32 pb-12 flex flex-col">
              <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
              <div className="my-auto relative">
                <div data-particle-anchor="light" className="contact-light-slot" aria-hidden="true" />
                <h2 data-reveal="chars" className="contact-title t-display text-bone">
                  <Letters text="Say hi." trigger="reveal" />
                </h2>
                <p data-reveal="up" style={delay(300)} className="t-lead text-ash mt-8 max-w-[36ch]">
                  Happy to talk about cognitive science, security, robotics, or whatever you’re building.
                </p>
                <dl className="contact-grid mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
                  {SITE_DATA.socials.map((soc, i) => (
                    <div key={soc.label} data-reveal="up" style={delay(200 + i * 60)} className="contact-card">
                      <dt className="t-meta text-ash flex items-center gap-2"><SocialIcon label={soc.label} />{soc.label}</dt>
                      <dd className="mt-2 flex items-center gap-3">
                        {soc.href ? <a href={soc.href} target={soc.href.startsWith('http') ? '_blank' : undefined} rel={soc.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="t-ui link">{soc.handle}<Arrow className="contact-arrow ml-2 inline-block align-middle" /></a> : <span className="t-ui text-bone">{soc.handle}</span>}
                        {soc.href.startsWith('mailto:') && <button type="button" onClick={copyEmail} className="copy-button t-meta" aria-label="Copy email address">Copy</button>}
                      </dd>
                    </div>
                  ))}
                  <VisitorCount relayUrl={SITE_DATA.contact.relayUrl} siteUrl={SITE_DATA.identity.url} />
                </dl>
                <AnonymousNote relayUrl={SITE_DATA.contact.relayUrl} reducedMotion={reducedMotion} theme={theme} />
              </div>

              <footer className="relative mt-24 pt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 t-meta text-ash">
                <div className="absolute top-0 left-0 right-0 h-px bg-hair" />
                <span className="footer-byline">
                  <span>
                    © {new Date().getFullYear()} {SITE_DATA.identity.name}
                    <span className="t-geez ml-2">{SITE_DATA.identity.geezName}</span>
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-6"><button type="button" data-magnetic onClick={() => scrollToSection('hero')} className="link-quiet">Back to top</button>
                  <button type="button" onClick={() => navigateTo('/now')} className="link-quiet">
                    Now
                  </button>
                  <ResumeDownload className="link-quiet" />
                </span>
              </footer>
            </section>
          </div>
        )}
      </Suspense></main>

      {/* which chapter you're in (desktop) */}
      {route.page === 'home' && (
        <div aria-hidden="true" className="chapter-indicator hidden md:flex">
          <span key={chapter} className="chapter-label">
            {CHAPTERS[chapter]?.label}
          </span>
          <span className="chapter-count">
            {String(chapter + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </span>
        </div>
      )}

      <WorkPreview ref={previewRef} project={preview} />
      <audio ref={siuuuAudioRef} src="/audio/ronaldo-siuuu.mp3" preload="none" />
      {!!celebration && <Celebration key={celebration} onDone={() => setCelebration(0)} />}
      {copiedEmail && <div className="copy-toast t-ui" role="status">{copiedEmail}</div>}

      {siuuuToast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="siuuu-toast"
          className="fixed bottom-6 left-6 right-6 w-fit mx-auto z-50 px-3 py-1.5 rounded-md border border-hair bg-raised font-mono text-[14px] text-bone fade-in"
        >
          Siuuu!
        </div>
      )}

      {flagFound && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-night/60 backdrop-blur-[3px] fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setFlagFound(false);
          }}
        >
          <div
            ref={flagDialogRef}
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-label="You found the flag"
            data-testid="ctf-thank-you"
            className="flag-dialog term-in w-full max-w-lg bg-raised border border-hair rounded-[10px] p-8"
          >
            <p className="font-mono text-[14px] text-signal break-all">{SITE_DATA.ctf.fullFlag}</p>
            <p className="t-h2 text-bone mt-5">Thank you for looking closely.</p>
            <p className="t-ui text-ash mt-4 leading-relaxed">
              Most people skim and move on. You read the source, opened the console and checked robots.txt. Write to me
              at{' '}
              <a href={`mailto:${SITE_DATA.identity.email}?subject=found%20the%20flag`} className="link">
                {SITE_DATA.identity.email}
              </a>{' '}
              and tell me you found it.
            </p>
            <button type="button" onClick={() => setFlagFound(false)} className="t-meta link-quiet mt-8">
              Close
            </button>
          </div>
        </div>
      )}

      <ProjectDrawer project={activeProject} onClose={() => setActiveProject(null)} />
    </div>
  );
}
