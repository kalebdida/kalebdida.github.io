import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/** A local canvas keeps the interaction visible beside the control that triggers it. */
export default function ParticleOrb({ theme, pulse }: { theme: 'dark' | 'light'; pulse: number }) {
  const mount = useRef<HTMLSpanElement>(null);
  const trigger = useRef<() => void>(() => {});
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const [fallback, setFallback] = useState(false);
  const [bursting, setBursting] = useState(false);
  const reset = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(reset.current), []);
  const burst = () => {
    trigger.current(); setBursting(true); clearTimeout(reset.current);
    reset.current = window.setTimeout(() => setBursting(false), 1600);
  };
  useEffect(() => { if (pulse) burst(); }, [pulse]);
  useEffect(() => {
    const node = mount.current;
    if (!node) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    node.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 20); camera.position.z = 4.5;
    const count = 650, positions = new Float32Array(count * 3), seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const y = 1 - 2 * (i + .5) / count, radius = Math.sqrt(1 - y * y), angle = i * 2.399963;
      positions.set([Math.cos(angle) * radius, y, Math.sin(angle) * radius], i * 3); seeds[i] = i / count;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uBurst: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() }, uColor: { value: new THREE.Color(theme === 'dark' ? '#5ad1ff' : '#006f9c') } },
      vertexShader: `attribute float aSeed; uniform float uTime; uniform float uBurst; uniform float uPixelRatio; varying float vAlpha;
        void main(){vec3 p=position*(1.0+uBurst*(.45+aSeed*.9));float a=uTime*.18+uBurst*.5;float c=cos(a),s=sin(a);p.xz=mat2(c,-s,s,c)*p.xz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);gl_PointSize=(1.6+uBurst*1.8)*uPixelRatio;vAlpha=(.45+.4*sin(aSeed*80.0+uTime))*(1.0-uBurst*.22);}`,
      fragmentShader: `uniform vec3 uColor; varying float vAlpha; void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(uColor,(1.0-smoothstep(.1,.5,d))*vAlpha);}`,
    });
    materialRef.current = material;
    const points = new THREE.Points(geometry, material); points.frustumCulled = false; scene.add(points);
    let frame = 0, visible = false, burstAt = -100;
    const tick = (time: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      const now = time * .001;
      material.uniforms.uTime.value = now;
      material.uniforms.uBurst.value = Math.sin(Math.min(1, Math.max(0, (now - burstAt) / 1.6)) * Math.PI);
      points.rotation.x = Math.sin(now * .2) * .15;
      renderer.render(scene, camera); frame = requestAnimationFrame(tick);
    };
    const start = () => { if (visible && !document.hidden && !frame) frame = requestAnimationFrame(tick); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start(); };
    const resize = new ResizeObserver(() => { const size = Math.max(1, node.clientWidth); renderer.setSize(size, size); });
    resize.observe(node);
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (!visible) { cancelAnimationFrame(frame); frame = 0; } else start();
    });
    observer.observe(node);
    trigger.current = () => { burstAt = performance.now() * .001; node.dataset.burstAt = String(burstAt); visible = true; start(); };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearTimeout(reset.current); cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      document.removeEventListener('visibilitychange', visibility); trigger.current = () => {};
      materialRef.current = null; geometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  useEffect(() => { materialRef.current?.uniforms.uColor.value.set(theme === 'dark' ? '#5ad1ff' : '#006f9c'); }, [theme]);
  return <div className={`particle-toy ${bursting ? 'is-bursting' : ''}`}>
    <button type="button" className="particle-orb" onClick={burst} aria-label="Scatter the particles" aria-describedby="orb-hint" data-cursor="Play">
      <span ref={mount} className="particle-orb-canvas" aria-hidden="true">{fallback && <svg viewBox="0 0 100 100">{Array.from({ length: 28 }, (_, i) => <circle key={i} cx={50 + Math.cos(i * 2.4) * (18 + i % 8 * 2)} cy={50 + Math.sin(i * 2.4) * (18 + i % 8 * 2)} r="1.5" fill="currentColor" />)}</svg>}</span>
    </button>
    <p id="orb-hint" className="t-meta text-ash">Tap to scatter</p>
  </div>;
}
