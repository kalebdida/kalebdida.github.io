import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** height of a simple sculpted face at (x, y); x in [-1, 1], y in [-1.3, 1.3] */
function faceDepth(x: number, y: number) {
  const g = (dx: number, sx: number, dy: number, sy: number) => Math.exp(-((dx / sx) ** 2 + (dy / sy) ** 2));
  const ax = Math.abs(x);
  const base = Math.sqrt(Math.max(0, 1 - (x / 0.82) ** 2 - (y / 1.18) ** 2)) * 0.55;
  return base
    + 0.2 * g(x, 0.12, y + 0.02, 0.36)            // nose bridge
    + 0.13 * g(x, 0.13, y + 0.3, 0.12)            // nose tip
    - 0.13 * g(ax - 0.31, 0.17, y - 0.17, 0.1)    // eye sockets
    + 0.05 * g(ax - 0.31, 0.06, y - 0.16, 0.045)  // eyeballs
    + 0.06 * g(ax - 0.3, 0.24, y - 0.33, 0.06)    // brow ridge
    + 0.05 * g(ax - 0.45, 0.17, y + 0.22, 0.2)    // cheeks
    + 0.06 * g(x, 0.24, y + 0.56, 0.055)          // lips
    - 0.035 * g(x, 0.2, y + 0.585, 0.012)         // mouth line
    + 0.05 * g(x, 0.24, y + 0.95, 0.14);          // chin
}

function buildMask() {
  // polar grid, so the rim is a smooth oval instead of grid steps
  const rings = 90, spokes = 220;
  const positions: number[] = [0, 0, faceDepth(0, 0)], index: number[] = [];
  for (let r = 1; r <= rings; r++) for (let k = 0; k < spokes; k++) {
    const rr = r / rings, a = (k / spokes) * Math.PI * 2;
    const x = 0.82 * rr * Math.cos(a), y = 1.18 * rr * Math.sin(a);
    // the edge rolls back a little, like the rim of a real mask
    positions.push(x, y, faceDepth(x, y) - Math.max(0, rr - 0.93) * 0.8);
  }
  const at = (r: number, k: number) => r === 0 ? 0 : 1 + (r - 1) * spokes + (k % spokes);
  for (let k = 0; k < spokes; k++) index.push(0, at(1, k), at(1, k + 1));
  for (let r = 1; r < rings; r++) for (let k = 0; k < spokes; k++) index.push(at(r, k), at(r + 1, k), at(r + 1, k + 1), at(r, k), at(r + 1, k + 1), at(r, k + 1));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** A sculpted mask that turns slowly. Its back is hollow, but most brains insist it is a face pointing out. */
export default function HollowFace() {
  const mount = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 6.2);
    const material = new THREE.MeshStandardMaterial({ color: 0xe6dfd2, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
    const mask = new THREE.Mesh(buildMask(), material);
    scene.add(mask);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(0.4, 2, 3);
    scene.add(key);
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);
    let frame = 0;
    const start = performance.now();
    const loop = () => {
      mask.rotation.y = (performance.now() - start) * 0.00045;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      mask.geometry.dispose(); material.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={mount} className="hollow-face" aria-label="A slowly turning face mask" role="img" />;
}
