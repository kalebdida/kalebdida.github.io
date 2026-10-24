import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AnchorTracker, screenToWorld, samplePortrait } from '../three/anchors';
import { buildFormations, makeLayout, FORMATION } from '../three/formations';

/** what the page tells the particle scene, written on scroll / hover, read every frame */
export interface SceneState {
  portrait?: string;
  stage: number; // continuous section index, e.g. 2.4 = 40% of the way from section 2 to 3
  formations: number[]; // formation used by each section, in page order
  journeyDrift: number; // 0..1 progress through the journey section
  hl3: number; // hovered discipline (0..2), -1 none
  hl4: number; // hovered project (0..3), -1 none
}

interface ParticleFieldProps {
  /** 'home' morphs with scroll; 'calm' keeps a distant, still starfield for reading pages */
  mode: 'home' | 'calm' | 'lost';
  sceneRef: React.MutableRefObject<SceneState>;
}

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aPortrait;
  attribute float aPortraitBrightness;
  attribute float aLink;
  attribute vec3 aBrain;
  attribute vec3 aTriad;
  attribute vec3 aConst;
  attribute vec3 aLand;
  attribute vec3 aDust;
  attribute vec3 aSound;
  attribute vec3 aLight;
  attribute float aSeed;
  attribute float aGroup;

  uniform mat3 uViewBasis;
  uniform vec3 uBrainTarget;
  uniform float uBrainScale;
  uniform vec3 uTriadTarget[3];
  uniform float uTriadScale[3];
  uniform vec3 uStarTarget[4];
  uniform vec3 uStarBase[4];
  uniform float uStarScale[4];
  uniform vec3 uLightTarget;
  uniform float uLightScale;
  uniform float uPortrait;
  uniform float uTransition;
  uniform float uTime;
  uniform float uFrom;
  uniform float uTo;
  uniform float uMix;
  uniform float uIntro;
  uniform float uCalm;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform float uLightDensity;
  uniform vec3 uOrbCenter;
  uniform vec3 uBrainCenter;
  uniform vec3 uLightCenter;
  uniform vec3 uTriadC0;
  uniform vec3 uTriadC1;
  uniform vec3 uTriadC2;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform float uAspect;
  uniform float uRippleAge;
  uniform vec2 uRippleOrigin;
  uniform float uHl3;
  uniform float uHl3Amt;
  uniform float uHl4;
  uniform float uHl4Amt;

  varying float vAlpha;
  varying float vAccent;

  float sel(float idx, float i) { return 1.0 - step(0.5, abs(idx - i)); }

  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
  vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c); }

  void main() {
    float t = uTime;
    float g3 = min(2.0, floor(aGroup * 3.0));
    float g4 = min(3.0, floor(aGroup * 4.0));
    float isRing = step(0.88, aGroup);

    // 0 mind: a turning orb that breathes
    vec3 o = position - uOrbCenter;
    // the globe turns; its orbit stays put, like saturn's rings
    float isOrbit = step(0.9, aGroup);
    vec3 p0 = mix(rotY(o, t * 0.07) * (1.0 + sin(t * 0.8) * 0.012), o, isOrbit) + uOrbCenter;

    // 1 brain: a slow sway
    vec3 brainLocal = mix(rotY(aBrain - uBrainCenter, sin(t * 0.18) * 0.2), aPortrait, uPortrait);
    vec3 p1 = uBrainTarget + uViewBasis * brainLocal * uBrainScale;

    // 2 triad: each cluster turns on its own axis (the circuit barely moves)
    vec3 tc = uTriadC0 * sel(g3, 0.0) + uTriadC1 * sel(g3, 1.0) + uTriadC2 * sel(g3, 2.0);
    int tri = int(g3);
    vec3 triLocal = aTriad - tc;
    // The lock always faces the camera. Only a small, upright sway is allowed.
    float sway = sin(t * 0.32) * 0.035;
    if (tri == 1) triLocal.xy = mat2(cos(sway), -sin(sway), sin(sway), cos(sway)) * triLocal.xy;
    else triLocal = rotY(triLocal, sin(t * .25) * .12);
    vec3 p2 = uTriadTarget[tri] + uViewBasis * triLocal * uTriadScale[tri];

    // 3 constellation: a tiny drift
    int star = int(g4);
    vec3 p3;
    if (aLink >= 0.0) {
      int start = star == 3 ? 2 : star;
      int end = star == 3 ? 3 : star + 1;
      p3 = mix(uStarTarget[start], uStarTarget[end], aLink);
    } else p3 = uStarTarget[star] + uViewBasis * (aConst - uStarBase[star]) * uStarScale[star];

    // 4 highlands: still ground, the camera moves instead
    vec3 p4 = aLand;

    // 5 dust: slow drift
    vec3 p5 = aDust + vec3(sin(t * 0.05 + aSeed * 30.0) * 0.3, cos(t * 0.04 + aSeed * 25.0) * 0.2, 0.0);

    // 6 sound: rolling waves
    vec3 p6 = aSound;
    p6.y += sin(p6.x * 0.7 + t * 0.9) * 0.22 + sin(p6.z * 1.1 - t * 0.7) * 0.16 + sin((p6.x + p6.z) * 0.4 + t * 0.5) * 0.12;

    // 7 light: a pulsing core inside a turning halo
    vec3 lp = aLight - uLightCenter;
    lp = mix(lp * (1.0 + sin(t * 1.6 + aSeed * 6.2831) * 0.18), rotY(lp, t * 0.25), isRing);
    vec3 p7 = uLightTarget + uViewBasis * lp * uLightScale;

    vec3 pa = p0 * sel(uFrom, 0.0) + p1 * sel(uFrom, 1.0) + p2 * sel(uFrom, 2.0) + p3 * sel(uFrom, 3.0)
            + p4 * sel(uFrom, 4.0) + p5 * sel(uFrom, 5.0) + p6 * sel(uFrom, 6.0) + p7 * sel(uFrom, 7.0);
    vec3 pb = p0 * sel(uTo, 0.0) + p1 * sel(uTo, 1.0) + p2 * sel(uTo, 2.0) + p3 * sel(uTo, 3.0)
            + p4 * sel(uTo, 4.0) + p5 * sel(uTo, 5.0) + p6 * sel(uTo, 6.0) + p7 * sel(uTo, 7.0);

    // each particle leaves at its own moment, and swirls a little on the way
    float m = smoothstep(0.0, 1.0, clamp((uMix - aSeed * 0.35) / 0.65, 0.0, 1.0));
    vec3 pos = mix(pa, pb, m);
    float travel = sin(m * 3.14159);
    pos += vec3(sin(aSeed * 41.0 + t * 0.6), cos(aSeed * 29.0 + t * 0.5), sin(aSeed * 17.0)) * travel * 0.45;

    // first load: everything arrives out of the dust
    float im = smoothstep(0.0, 1.0, clamp((uIntro - aSeed * 0.4) / 0.6, 0.0, 1.0));
    pos = mix(p5, pos, im);

    float wBrain = sel(uFrom, 1.0) * (1.0 - m) + sel(uTo, 1.0) * m;
    float wTriad = sel(uFrom, 2.0) * (1.0 - m) + sel(uTo, 2.0) * m;
    float wConst = sel(uFrom, 3.0) * (1.0 - m) + sel(uTo, 3.0) * m;
    float wLight = (sel(uFrom, 7.0) * (1.0 - m) + sel(uTo, 7.0) * m) * im;
    // shapes spread over a big area need bigger, brighter points to read
    float wMind = sel(uFrom, 0.0) * (1.0 - m) + sel(uTo, 0.0) * m;
    float wSpread = (sel(uFrom, 4.0) + sel(uFrom, 6.0)) * (1.0 - m) + (sel(uTo, 4.0) + sel(uTo, 6.0)) * m;

    // piano ripple (keys a to k)
    float rippleBoost = 0.0;
    if (uRippleAge < 3.5) {
      float rd = length(pos.xz - uRippleOrigin);
      float ring = exp(-pow(rd - uRippleAge * 3.2, 2.0) * 2.2);
      float fade = 1.0 - uRippleAge / 3.5;
      pos.y += ring * fade * 0.3;
      rippleBoost = ring * fade;
    }

    pos.z -= uCalm * 3.0;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // the cursor field: particles drift out of the way, nothing quite touches it
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uMouse;
    d.x *= uAspect;
    float dist = length(d);
    float push = (1.0 - smoothstep(0.0, 0.32, dist)) * uMouseStrength * (1.0 - uCalm);
    push *= 1.0 - .96 * clamp(wBrain + wTriad + wConst + wLight, 0.0, 1.0);
    mv.xy += (d / max(dist, 0.0001)) * push * 0.45 * (-mv.z / 7.0);
    gl_Position = projectionMatrix * mv;

    float hl = max(sel(g3, uHl3) * wTriad * uHl3Amt, sel(g4, uHl4) * wConst * uHl4Amt);
    float isCore = step(aSeed, 0.42);
    float firing = wBrain * smoothstep(0.985, 1.0, sin(t * 0.9 + aSeed * 80.0 + aBrain.y * 3.0));

    float base = mix(1.4, 2.6, fract(aSeed * 17.3)) * uSizeScale;
    float size = base * (1.0 + wConst * isCore * 0.8 + hl * 1.1 + wLight * (1.0 - isRing) * 1.4 + wSpread * 0.7 + wMind * 0.25)
               + rippleBoost * 2.5 + push * 1.6 + firing * 2.0;
    size *= 1.0 + uTransition * .25;
    gl_PointSize = size * uPixelRatio * min(8.0 / max(1.0, -mv.z), 1.7);

    // fade with distance, and fade spread-out ground near the camera so it never crowds the text
    float depthFade = (1.0 - smoothstep(3.0, 24.0, -mv.z)) * mix(1.0, smoothstep(2.5, 7.0, -mv.z), wSpread);
    float twinkle = 0.78 + 0.22 * sin(t * 1.7 + aSeed * 60.0);
    float lightDensity = mix(1.0, mix(uLightDensity, 1.0, isRing), wLight);
    vAlpha = depthFade * mix(0.5, 0.15, uCalm) * lightDensity * twinkle * (1.0 + hl * 1.4 + firing * 2.0 + wSpread * 1.1 + wMind * 0.9);
    vAlpha *= mix(1.0, .2 + aPortraitBrightness * 1.8, wBrain * uPortrait);
    vAlpha *= 1.0 + uTransition * .25;
    vAccent = clamp(wLight * (1.0 - isRing * 0.5) + rippleBoost * 0.85 + hl + firing + push * 0.6, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying float vAlpha;
  varying float vAccent;
  uniform vec3 uBone;
  uniform vec3 uSignal;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = pow((1.0 - smoothstep(0.0, 0.5, d)), 1.8);
    gl_FragColor = vec4(mix(uBone, uSignal, vAccent), soft * vAlpha);
  }
`;

function detectSoftwareGl(): boolean | null {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return null;
  }
}

export function ParticleField({ mode, sceneRef }: ParticleFieldProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [webglSupported, setWebglSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const container = mountRef.current;
    if (!container) return;

    const detected = detectSoftwareGl();
    // ?fullgl forces the full scene even on software renderers (handy for testing)
    const software = detected && !new URLSearchParams(window.location.search).has('fullgl');
    if (detected === null) {
      setWebglSupported(false);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !software, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setWebglSupported(false);
      return;
    }

    let isMobile = window.innerWidth < 768;
    const dpr = software ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 60);
    camera.position.set(0, 0.2, 7.5);

    const count = software ? 3000 : isMobile ? 3600 : 8000;
    let layout = makeLayout(isMobile);
    const forms = buildFormations(count, layout);

    const geometry = new THREE.BufferGeometry();
    const attr = (arr: Float32Array, size = 3) => new THREE.BufferAttribute(arr, size);
    geometry.setAttribute('position', attr(forms.list[FORMATION.mind]));
    geometry.setAttribute('aBrain', attr(forms.list[FORMATION.brain]));
    geometry.setAttribute('aPortrait', attr(new Float32Array(count * 3)));
    geometry.setAttribute('aPortraitBrightness', attr(new Float32Array(count).fill(1), 1));
    geometry.setAttribute('aLink', attr(forms.link, 1));
    geometry.setAttribute('aTriad', attr(forms.list[FORMATION.triad]));
    geometry.setAttribute('aConst', attr(forms.list[FORMATION.constellation]));
    geometry.setAttribute('aLand', attr(forms.list[FORMATION.highlands]));
    geometry.setAttribute('aDust', attr(forms.list[FORMATION.dust]));
    geometry.setAttribute('aSound', attr(forms.list[FORMATION.sound]));
    geometry.setAttribute('aLight', attr(forms.list[FORMATION.light]));
    geometry.setAttribute('aSeed', attr(forms.seed, 1));
    geometry.setAttribute('aGroup', attr(forms.group, 1));

    const v3 = (p: [number, number, number]) => new THREE.Vector3(p[0], p[1], p[2]);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uViewBasis: { value: new THREE.Matrix3() },
        uBone: { value: new THREE.Color('#edeae3') },
        uSignal: { value: new THREE.Color('#5ad1ff') },
        uBrainTarget: { value: v3(layout.brainCenter) }, uBrainScale: { value: 1 },
        uTriadTarget: { value: layout.triadCenters.map(v3) }, uTriadScale: { value: [1, 1, 1] },
        uStarTarget: { value: layout.starCenters.map(v3) }, uStarBase: { value: layout.starCenters.map(v3) }, uStarScale: { value: [1, 1, 1, 1] },
        uLightTarget: { value: v3(layout.pointCenter) }, uLightScale: { value: 1 },
        uPortrait: { value: 0 }, uTransition: { value: 0 },
        uTime: { value: 0 },
        uFrom: { value: 0 },
        uTo: { value: 0 },
        uMix: { value: 0 },
        uIntro: { value: 0 },
        uCalm: { value: modeRef.current === 'calm' ? 1 : 0 },
        uPixelRatio: { value: dpr },
        uSizeScale: { value: isMobile ? 0.9 : 1 },
        uLightDensity: { value: 160 / count },
        uOrbCenter: { value: v3(layout.orbCenter) },
        uBrainCenter: { value: v3(layout.brainCenter) },
        uLightCenter: { value: v3(layout.pointCenter) },
        uTriadC0: { value: v3(layout.triadCenters[0]) },
        uTriadC1: { value: v3(layout.triadCenters[1]) },
        uTriadC2: { value: v3(layout.triadCenters[2]) },
        uMouse: { value: new THREE.Vector2(9, 9) },
        uMouseStrength: { value: 0 },
        uAspect: { value: window.innerWidth / Math.max(1, window.innerHeight) },
        uRippleAge: { value: 99 },
        uRippleOrigin: { value: new THREE.Vector2(0, 0) },
        uHl3: { value: -1 },
        uHl3Amt: { value: 0 },
        uHl4: { value: -1 },
        uHl4Amt: { value: 0 },
      },
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const applyTheme = (theme = document.documentElement.dataset.theme) => {
      const light = theme === 'light';
      material.uniforms.uBone.value.set(light ? '#242429' : '#edeae3');
      material.uniforms.uSignal.value.set(light ? '#006f9c' : '#5ad1ff');
      material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      material.needsUpdate = true;
    };
    const onTheme = (event: Event) => {
      applyTheme((event as CustomEvent<string>).detail);
      loadPortrait(sceneRef.current.portrait);
    };
    applyTheme();
    window.addEventListener('kal:theme', onTheme);

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    let bloomEnabled = !software && !isMobile;
    if (bloomEnabled) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.38, 0.45, 0.72);
      composer.addPass(bloomPass);
    }

    const anchors = new AnchorTracker();
    let disposed = false;
    let portrait: HTMLImageElement | undefined;
    function loadPortrait(src?: string) {
      if (!container || disposed) return;
      if (portrait) { portrait.onload = null; portrait.onerror = null; }
      material.uniforms.uPortrait.value = 0;
      delete container.dataset.portrait;
      delete container.dataset.portraitSrc;
      if (!src) return;
      const image = new Image(); image.crossOrigin = 'anonymous'; portrait = image;
      image.onload = () => {
        if (disposed || portrait !== image) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 160; canvas.height = Math.max(1, Math.round(160 * image.naturalHeight / image.naturalWidth));
          canvas.height = Math.min(240, canvas.height);
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) return;
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const sampled = samplePortrait(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, count);
          if (!sampled) return;
          (geometry.getAttribute('aPortrait') as THREE.BufferAttribute).copyArray(sampled.positions).needsUpdate = true;
          (geometry.getAttribute('aPortraitBrightness') as THREE.BufferAttribute).copyArray(sampled.brightness).needsUpdate = true;
          material.uniforms.uPortrait.value = 1;
          container.dataset.portrait = 'sampled';
          container.dataset.portraitSrc = src;
        } catch { container.dataset.portrait = 'brain-fallback'; }
      };
      image.onerror = () => { container.dataset.portrait = 'brain-fallback'; };
      image.src = src;
    }
    loadPortrait(sceneRef.current.portrait);

    // when the layout flips between phone and desktop, rebuild the shapes
    const rebuild = () => {
      layout = makeLayout(isMobile);
      const f = buildFormations(count, layout);
      const names = ['position', 'aBrain', 'aTriad', 'aConst', 'aLand', 'aDust', 'aSound', 'aLight'];
      names.forEach((n, i) => {
        const a = geometry.getAttribute(n) as THREE.BufferAttribute;
        (a.array as Float32Array).set(f.list[i]);
        a.needsUpdate = true;
      });
      const u = material.uniforms;
      u.uStarBase.value = layout.starCenters.map(v3);
      u.uOrbCenter.value = v3(layout.orbCenter);
      u.uBrainCenter.value = v3(layout.brainCenter);
      u.uLightCenter.value = v3(layout.pointCenter);
      u.uTriadC0.value = v3(layout.triadCenters[0]);
      u.uTriadC1.value = v3(layout.triadCenters[1]);
      u.uTriadC2.value = v3(layout.triadCenters[2]);
      u.uSizeScale.value = isMobile ? 0.9 : 1;
    };

    // piano notes send a ripple through the field
    let rippleStart = -100;
    const onPianoRipple = (ev: Event) => {
      const idx = (ev as CustomEvent<{ index: number }>).detail?.index ?? 3;
      material.uniforms.uRippleOrigin.value.set((idx / 7 - 0.5) * 6, -0.5);
      rippleStart = performance.now() * 0.001;
    };
    window.addEventListener('kal:piano-ripple', onPianoRipple);

    // pointer
    const mouseTarget = new THREE.Vector2(9, 9);
    let pointerActive = 0;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      pointerActive = 1;
    };
    const onPointerLeave = () => {
      pointerActive = 0;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      const w = window.innerWidth;
      const h = Math.max(1, window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
      material.uniforms.uAspect.value = w / h;
      const nowMobile = w < 768;
      if (nowMobile !== isMobile) {
        isMobile = nowMobile;
        rebuild();
      }
    };
    window.addEventListener('resize', onResize);

    // pause when the tab is hidden or the canvas is off screen
    let hidden = document.hidden;
    const onVisibility = () => {
      hidden = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);

    let frameId = 0;
    let lastTime = performance.now() * 0.001;
    const startTime = lastTime;
    let slowFrames = 0;
    let curStage = sceneRef.current.stage;
    let curCalm = modeRef.current === 'calm' ? 1 : 0;
    let curDrift = 0;
    let curMouseStrength = 0;
    let hl3Index = -1;
    let hl4Index = -1;
    let hl3Amt = 0;
    let hl4Amt = 0;
    const parallax = new THREE.Vector2(0, 0);
    const look = new THREE.Vector3(0, 0, 0);

    const worldA = new THREE.Vector3(), worldB = new THREE.Vector3();
    let debugAt = 0;
    const debug = new URLSearchParams(window.location.search).has('sceneDebug');
    const updateAnchors = (now: number) => {
      const u = material.uniforms, width = window.innerWidth, height = window.innerHeight;
      const diagnostics: Record<string, unknown> = {};
      const anchor = (name: string, target: THREE.Vector3, bounds: [number, number], fallback: [number, number, number]) => {
        const rect = anchors.rectangles.get(name);
        if (!rect) { target.set(...fallback); return 1; }
        const x = rect.left - window.scrollX + rect.width / 2, y = rect.top - window.scrollY + rect.height / 2;
        screenToWorld(x, y, width, height, camera, target);
        screenToWorld(x + rect.width / 2, y, width, height, camera, worldA);
        screenToWorld(x, y + rect.height / 2, width, height, camera, worldB);
        const scale = Math.min(worldA.distanceTo(target) * 2 / bounds[0], worldB.distanceTo(target) * 2 / bounds[1]);
        if (debug && now - debugAt > .2) {
          const projected = target.clone().project(camera);
          diagnostics[name] = { x, y, projectedX: (projected.x + 1) * width / 2, projectedY: (1 - projected.y) * height / 2, width: rect.width, height: rect.height, scale };
        }
        return scale;
      };
      u.uBrainScale.value = anchor('brain', u.uBrainTarget.value, [3.4, 3], layout.brainCenter);
      for (let i = 0; i < 3; i++) u.uTriadScale.value[i] = anchor(`discipline-${i}`, u.uTriadTarget.value[i], [2.1, 1.9], layout.triadCenters[i]);
      for (let i = 0; i < 4; i++) u.uStarScale.value[i] = anchor(`work-${i}`, u.uStarTarget.value[i], [2.3, 2.3], layout.starCenters[i]);
      u.uLightScale.value = anchor('light', u.uLightTarget.value, [2.5, 2.5], layout.pointCenter);
      (u.uViewBasis.value as THREE.Matrix3).setFromMatrix4(camera.matrixWorld);
      if (debug && now - debugAt > .2) { container.dataset.anchors = JSON.stringify(diagnostics); debugAt = now; }
    };

    const formationAt = (forms: number[], i: number) => forms[Math.max(0, Math.min(forms.length - 1, i))] ?? FORMATION.dust;

    function frame() {
      const now = performance.now() * 0.001;
      const dt = Math.min(0.1, Math.max(0.001, now - lastTime));
      const frameMs = (now - lastTime) * 1000;
      lastTime = now;

      if (bloomEnabled && frameMs > 28) {
        if (++slowFrames > 24) bloomEnabled = false;
      } else {
        slowFrames = Math.max(0, slowFrames - 1);
      }

      if (!hidden) {
        const st = sceneRef.current;
        const calm = modeRef.current === 'calm';
        const lost = modeRef.current === 'lost';
        const formsBySection = calm ? [FORMATION.dust] : lost ? [FORMATION.dust, FORMATION.mind] : st.formations;
        const targetStage = calm ? 0 : lost ? .55 : st.stage;

        curStage = THREE.MathUtils.damp(curStage, targetStage, 3.2, dt);
        curCalm = THREE.MathUtils.damp(curCalm, calm ? 1 : 0, 3.5, dt);
        curDrift = THREE.MathUtils.damp(curDrift, st.journeyDrift, 3.5, dt);
        curMouseStrength = THREE.MathUtils.damp(curMouseStrength, pointerActive, 4, dt);

        const fi = Math.floor(curStage);
        const from = formationAt(formsBySection, fi);
        const to = formationAt(formsBySection, fi + 1);
        const mix = Math.min(1, Math.max(0, curStage - fi));
        const weightOf = (f: number) => (from === f ? 1 - mix : 0) + (to === f ? mix : 0);
        const pulse = from !== to ? Math.sin(mix * Math.PI) : 0;
        const wLand = weightOf(FORMATION.highlands);
        const wLight = weightOf(FORMATION.light);

        if (st.hl3 >= 0) hl3Index = st.hl3;
        if (st.hl4 >= 0) hl4Index = st.hl4;
        hl3Amt = THREE.MathUtils.damp(hl3Amt, st.hl3 >= 0 ? 1 : 0, 7, dt);
        hl4Amt = THREE.MathUtils.damp(hl4Amt, st.hl4 >= 0 ? 1 : 0, 7, dt);

        const u = material.uniforms;
        u.uTransition.value = pulse;
        if (bloomPass) bloomPass.strength = .38 + pulse * .6;
        u.uTime.value = now;
        u.uFrom.value = from;
        u.uTo.value = to;
        u.uMix.value = mix;
        u.uIntro.value = Math.min(1, (now - startTime) / 2.6);
        u.uCalm.value = curCalm;
        u.uRippleAge.value = Math.max(0, now - rippleStart);
        u.uHl3.value = hl3Index;
        u.uHl3Amt.value = hl3Amt;
        u.uHl4.value = hl4Index;
        u.uHl4Amt.value = hl4Amt;
        u.uMouseStrength.value = curMouseStrength;
        (u.uMouse.value as THREE.Vector2).lerp(mouseTarget, 1 - Math.exp(-8 * dt));

        // camera: a little parallax with the pointer, a slow flight over the highlands
        parallax.lerp(curMouseStrength > 0.01 ? mouseTarget : new THREE.Vector2(0, 0), 1 - Math.exp(-2 * dt));
        const camX = (curDrift - 0.5) * 7 * wLand + parallax.x * 0.3 * (1 - curCalm);
        const camY = 0.2 + 0.9 * wLand + parallax.y * 0.18 * (1 - curCalm);
        const camZ = 7.5 - 1.1 * wLand - 0.6 * wLight - pulse * .55;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, camX, 3, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, camY, 3, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, camZ, 3, dt);
        look.set(camX * 0.8, -0.9 * wLand, -1.5 * wLand);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        updateAnchors(now);

        if (bloomEnabled && composer) composer.render();
        else renderer.render(scene, camera);
      }

      if (software) frameId = window.setTimeout(frame, 50);
      else frameId = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('kal:piano-ripple', onPianoRipple);
      window.removeEventListener('kal:theme', onTheme);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      disposed = true;
      if (portrait) { portrait.onload = null; portrait.onerror = null; }
      anchors.dispose();
      geometry.dispose();
      material.dispose();
      composer?.dispose();
      renderer.dispose();
    };
  }, [reducedMotion, sceneRef]);

  return (
    <div data-testid="particle-field-container" className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div
        className={`particle-fallback absolute inset-0 transition-opacity duration-700 ${!webglSupported || reducedMotion ? 'opacity-100' : 'opacity-50'}`}
      />
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
