/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Lenis from 'lenis';
import { SITE_DATA, type ProjectCaseFile } from './data/siteData';
import { adamaClock, updateKeystrokeBuffer } from './utils/logic';
import { soundEngine, PIANO_KEY_MAP } from './utils/soundEngine';
import type { SceneState } from './components/ParticleField';
import { ProjectDrawer } from './components/ProjectDrawer';
import { NoteCard } from './components/NoteCard';
import { NowView, ResumeView } from './components/ExtraPages';
import { Arrow, Motif, Rank, RevealWords, spotlight } from './components/Details';
import { useDialog } from './utils/useDialog';
import { useReveals } from './utils/useReveals';
import { FORMATION } from './three/formations';

const ParticleField = lazy(() => import('./components/ParticleField').then(m => ({ default: m.ParticleField })));
const BlogIndexView = lazy(() => import('./components/BlogViews').then(m => ({ default: m.BlogIndexView })));
const BlogPostView = lazy(() => import('./components/BlogViews').then(m => ({ default: m.BlogPostView })));

type RouteState =
  | { page: 'home' }
  | { page: 'blog' }
  | { page: 'post'; slug: string }
  | { page: 'now' }
  | { page: 'resume' };

function parseLocationToRoute(pathname: string, hash: string): RouteState {
  const cleanHash = hash.replace(/^#/, '');
  const path = cleanHash.startsWith('/') ? cleanHash : pathname;
  if (path === '/blog' || path === '/blog/') return { page: 'blog' };
  if (path.startsWith('/blog/')) return { page: 'post', slug: path.replace('/blog/', '').replace(/\/$/, '') };
  if (path === '/now' || path === '/now/') return { page: 'now' };
  if (path === '/resume' || path === '/resume/') return { page: 'resume' };
  return { page: 'home' };
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
];

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
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
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
              <RevealWords text={title} />
            </h2>
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
  const [activeProject, setActiveProject] = useState<ProjectCaseFile | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<'Copied' | 'Copy failed' | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  const [siuuuToast, setSiuuuToast] = useState(false);
  const [flagFound, setFlagFound] = useState(false);
  const [lastPianoKey, setLastPianoKey] = useState<string | null>(null);
  const [chapter, setChapter] = useState(0);
  const clock = useAdamaClock();
  const flagDialogRef = useDialog(flagFound, () => setFlagFound(false));
  useReveals();
  useEffect(() => () => clearTimeout(copyTimer.current), []);
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
  });

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

  const navigateTo = (path: string) => {
    setMobileNav(false);
    window.history.pushState({}, '', path);
    setRoute(parseLocationToRoute(window.location.pathname, window.location.hash));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  useEffect(() => {
    const onPopState = () => setRoute(parseLocationToRoute(window.location.pathname, window.location.hash));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const base = SITE_DATA.identity.shortName;
    if (route.page === 'home') document.title = `${base} (Kal)`;
    else if (route.page === 'blog') document.title = `Field notes, ${base}`;
    else if (route.page === 'post') {
      const found = SITE_DATA.posts.find((p) => p.slug === route.slug && !p.draft && !p.external);
      document.title = found ? `${found.title}, ${base}` : `Field notes, ${base}`;
    } else if (route.page === 'now') document.title = `Now, ${base}`;
    else if (route.page === 'resume') document.title = `Resume, ${base}`;
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

    const update = () => {
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
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
        setSiuuuToast(true);
        window.setTimeout(() => setSiuuuToast(false), 2000);
      } else if (triggered === 'flag') {
        setFlagFound(true);
      }

      if (isInput) return;
      const k = e.key.toLowerCase();
      if (soundEngine.isEnabled() && PIANO_KEY_MAP[k]) {
        soundEngine.playPianoNote(k);
        setLastPianoKey(k);
        window.setTimeout(() => setLastPianoKey(current => current === k ? null : current), 240);
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
      navigateTo('/');
      window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: behavior as ScrollBehavior }), 80);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: behavior as ScrollBehavior });
    }
  };

  const navItems = [
    { label: 'About', onClick: () => scrollToSection('about'), active: false },
    { label: 'Work', onClick: () => scrollToSection('work'), active: false },
    { label: 'Journey', onClick: () => scrollToSection('journey'), active: false },
    { label: 'Field notes', onClick: () => navigateTo('/blog'), active: route.page === 'blog' || route.page === 'post' },
    { label: 'Now', onClick: () => navigateTo('/now'), active: route.page === 'now' },
  ];

  return (
    <div data-sound={soundOn ? 'on' : 'off'} className="min-h-screen bg-night text-bone relative">
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
        <span />
      </div>

      <Suspense fallback={null}><ParticleField mode={route.page === 'home' ? 'home' : 'calm'} sceneRef={sceneRef} /></Suspense>

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
                aria-current={item.active ? 'page' : undefined}
                className={`t-ui nav-link ${item.active ? 'text-bone is-active' : 'text-ash hover:text-bone'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => handleToggleSound()}
            aria-pressed={soundOn}
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

      <main className="relative z-10"><Suspense fallback={<p className="t-ui max-w-3xl mx-auto px-6 pt-36">Loading field notes…</p>}>
        {route.page === 'blog' && (
          <BlogIndexView onSelectPost={(slug) => navigateTo(`/blog/${slug}`)} onNavigateHome={() => navigateTo('/')} />
        )}
        {route.page === 'post' &&
          (() => {
            const post = SITE_DATA.posts.find((p) => p.slug === route.slug && !p.draft && !p.external);
            if (!post) return <div className="max-w-3xl mx-auto px-6 pt-36 pb-28"><h1 className="t-title">Note not found</h1><button type="button" className="link t-ui mt-8" onClick={() => navigateTo('/blog')}>All field notes</button></div>;
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
            <section id="hero" data-formation={FORMATION.mind} className="min-h-[100svh] flex flex-col pt-28 pb-16 sm:pb-20">
              <div className="flex items-baseline justify-between gap-6 t-meta text-ash intro-fade" style={delay(1500)}>
                <span>{SITE_DATA.identity.city}</span>
                <span className="text-right">
                  {clock.time}
                  {clock.ethDate && <span className="block sm:inline"><span className="hidden sm:inline">, </span>{clock.ethDate}</span>}
                </span>
              </div>

              <div className="mt-auto">
                <h1 className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
                  <span className="t-display text-bone">
                    <Letters text={SITE_DATA.identity.shortName} trigger="load" delay={420} />
                  </span>
                  <span lang="am" className="t-geez text-ash text-[1.25rem] sm:text-[1.5rem] tracking-wide intro-fade" style={delay(1150)}>
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
                  <button type="button" onClick={() => scrollToSection('work')} className="link">
                    See the work
                  </button>
                  <button type="button" onClick={() => navigateTo('/blog')} className="link-quiet">
                    Read field notes
                  </button>
                  <button type="button" onClick={() => navigateTo('/resume')} className="link-quiet">
                    Resume
                  </button>
                </div>
              </div>

              <div className="scroll-cue intro-fade" style={delay(2000)} aria-hidden="true">
                <span />
              </div>
            </section>

            {/* about */}
            <Section id="about" title="About">
              <p data-reveal="words" className="about-pullquote t-lead text-bone max-w-[34ch]">
                <RevealWords text={SITE_DATA.about.lead} />
              </p>
              <div className="mt-8 space-y-5 t-body text-ash max-w-[60ch]">
                {SITE_DATA.about.paragraphs.map((p, idx) => (
                  <p key={idx} data-reveal="up" style={delay(80 + idx * 70)}>
                    {p}
                  </p>
                ))}
              </div>
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
                  </div>
                ))}
              </div>
            </Section>

            {/* work */}
            <Section id="work" title="Work" aside={<p className="t-ui text-ash max-w-[28ch]">Open any one to read its case file.</p>}>
              <ul className="work-list">
                {SITE_DATA.projects.map((project, i) => (
                  <li key={project.id} data-reveal="up" style={delay(i * 80)} className="relative">
                    <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
                    <button
                      type="button"
                      onClick={() => setActiveProject(project)}
                      onMouseEnter={() => (sceneRef.current.hl4 = i)}
                      onMouseLeave={() => (sceneRef.current.hl4 = -1)}
                      onFocus={() => (sceneRef.current.hl4 = i)}
                      onBlur={() => (sceneRef.current.hl4 = -1)}
                      onPointerMove={spotlight}
                      className="work-row spotlight group w-full text-left py-8 grid grid-cols-[2.5rem_1fr] sm:grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2"
                    >
                      <span className="t-meta text-ash pt-2 group-hover:text-signal transition-colors">{project.id}</span>
                      <span className="work-row-body">
                        <span className="t-h3 text-bone group-hover:text-signal transition-colors">
                          {project.title}
                        </span>
                        <span className="block t-body text-ash mt-2 max-w-[52ch]">{project.summary}</span>
                      </span>
                      <span className="work-preview col-start-2 t-meta text-ash flex flex-wrap items-center gap-3 mt-3">
                        <span className="status-pill">{project.status}</span><span>{project.kind}{project.year ? ` · ${project.year}` : ''}</span><Arrow className="work-arrow ml-auto text-signal" />
                      </span>
                    </button>
                  </li>
                ))}
                <li aria-hidden="true" className="h-px bg-hair" />
              </ul>
            </Section>

            {/* journey */}
            <Section id="journey" title="Journey">
              <ol ref={journeyListRef} className="journey-list relative pl-8">
                <span aria-hidden="true" className="journey-rail" />
                {SITE_DATA.journey.map((m, i) => (
                  <li
                    key={m.id}
                    data-reveal="up"
                    style={delay(Math.min(i, 3) * 60)}
                    className="relative py-6 grid grid-cols-1 sm:grid-cols-[9.5rem_1fr] gap-x-8 gap-y-1"
                  >
                    <span aria-hidden="true" className="jdot" />
                    <span className="t-meta text-ash sm:pt-1.5"><span className="period-chip">{m.when}</span></span>
                    <div>
                      <h3 className="t-h3 text-bone">
                        {m.title}
                        {m.place && <span className="text-ash">, {m.place}</span>}
                      </h3>
                      {m.note && <p className="t-ui text-ash mt-1.5 max-w-[56ch] leading-relaxed">{m.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            {/* recognition */}
            <Section id="recognition" title="Recognition">
              <ul>
                {SITE_DATA.recognition.map((item, i) => (
                  <li
                    key={item.detail}
                    data-reveal="up"
                    style={delay(i * 70)}
                    className="recognition-row relative py-9 grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-4 items-baseline"
                  >
                    <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
                    <Rank title={item.title} />
                    <span className="t-body text-ash">{item.detail}</span>
                    {item.scope && <span className="scope-pill t-meta text-ash sm:col-start-2">{item.scope}</span>}
                  </li>
                ))}
                <li aria-hidden="true" className="h-px bg-hair" />
              </ul>
            </Section>

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
              <ul>
                {[...SITE_DATA.posts].filter((p) => !p.draft).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((post, i) => (
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
                    <Motif kind={item.id} />
                    <h3 className="t-h3 text-bone">{item.label}</h3>
                    <p className="t-body text-ash mt-2">{item.text}</p>
                  </div>
                ))}
              </div>

              <div data-reveal="up" className="relative mt-14 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="absolute top-0 left-0 right-0 h-px bg-hair" />
                <p className="t-ui text-ash">{soundOn ? 'Play with a to k, or click.' : 'Click a key to turn the sound on.'}</p>
                <div className="flex items-stretch" role="group" aria-label="Piano">
                  {Object.entries(PIANO_KEY_MAP).map(([k, info]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (!soundEngine.isEnabled()) handleToggleSound(true);
                        soundEngine.playPianoNote(k);
                        setLastPianoKey(k);
        window.setTimeout(() => setLastPianoKey(current => current === k ? null : current), 240);
                      }}
                      aria-label={`Play ${info.label} (key ${k})`}
                      className={`piano-key ${lastPianoKey === k && soundOn ? 'is-last' : ''}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* contact */}
            <section id="contact" data-formation={FORMATION.light} className="relative min-h-[100svh] pt-32 pb-12 flex flex-col">
              <div data-reveal="line" className="absolute top-0 left-0 right-0 h-px bg-hair origin-left" />
              <div className="my-auto">
                <h2 data-reveal="chars" className="contact-title t-display text-bone">
                  <Letters text="Say hi." trigger="reveal" />
                </h2>
                <p data-reveal="up" style={delay(300)} className="t-lead text-ash mt-8 max-w-[36ch]">
                  Happy to talk about cognitive science, security, robotics, or whatever you’re building.
                </p>
                <dl className="contact-grid mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
                  {SITE_DATA.socials.map((soc, i) => (
                    <div key={soc.label} data-reveal="up" style={delay(200 + i * 60)} className="contact-card">
                      <dt className="t-meta text-ash">{soc.label}</dt>
                      <dd className="mt-2 flex items-center gap-3">
                        <a href={soc.href} target={soc.href.startsWith('http') ? '_blank' : undefined} rel={soc.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="t-ui link">{soc.handle}<Arrow className="contact-arrow ml-2 inline-block align-middle" /></a>
                        {soc.href.startsWith('mailto:') && <button type="button" onClick={copyEmail} className="copy-button t-meta" aria-label="Copy email address">Copy</button>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <footer className="relative mt-24 pt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 t-meta text-ash">
                <div className="absolute top-0 left-0 right-0 h-px bg-hair" />
                <span>
                  © {new Date().getFullYear()} {SITE_DATA.identity.name}
                  <span className="t-geez ml-2">{SITE_DATA.identity.geezName}</span>
                </span>
                <span className="flex items-center gap-6">
                  <button type="button" onClick={() => navigateTo('/now')} className="link-quiet">
                    Now
                  </button>
                  <button type="button" onClick={() => navigateTo('/resume')} className="link-quiet">
                    Resume
                  </button>
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

      {copiedEmail && <div className="copy-toast t-ui" role="status">{copiedEmail}</div>}

      {siuuuToast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="siuuu-toast"
          className="fixed bottom-6 left-6 right-6 w-fit mx-auto z-50 px-3 py-1.5 rounded-md border border-hair bg-raised font-mono text-[14px] text-bone fade-in"
        >
          Siuuu.
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
