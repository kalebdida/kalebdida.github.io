import { PerspectiveCamera, Vector3 } from 'three';

export interface AnchorRect { left: number; top: number; width: number; height: number; }

/** Intersect a screen ray with the scene's z=0 plane, using the live camera. */
export function screenToWorld(x: number, y: number, width: number, height: number, camera: PerspectiveCamera, out = new Vector3()) {
  out.set(x / Math.max(1, width) * 2 - 1, 1 - y / Math.max(1, height) * 2, .5).unproject(camera).sub(camera.position).normalize();
  const distance = -camera.position.z / out.z;
  return out.multiplyScalar(distance).add(camera.position);
}

/** DOM reads happen on layout/scroll changes, never in the WebGL frame loop. */
export class AnchorTracker {
  rectangles = new Map<string, AnchorRect>();
  private frame = 0;
  private resize: ResizeObserver | undefined;
  private mutations: MutationObserver;
  constructor() {
    if ('ResizeObserver' in window) this.resize = new ResizeObserver(this.schedule);
    this.resize?.observe(document.documentElement);
    this.mutations = new MutationObserver(this.schedule);
    this.mutations.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', this.schedule, { passive: true });
    window.addEventListener('resize', this.schedule);
    this.measure();
  }
  private schedule = () => { if (!this.frame) this.frame = requestAnimationFrame(this.measure); };
  private measure = () => {
    this.frame = 0; this.rectangles.clear();
    document.querySelectorAll<HTMLElement>('[data-particle-anchor]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) this.rectangles.set(el.dataset.particleAnchor!, { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height });
    });
  };
  dispose() {
    cancelAnimationFrame(this.frame); this.resize?.disconnect(); this.mutations.disconnect();
    window.removeEventListener('scroll', this.schedule); window.removeEventListener('resize', this.schedule);
  }
}

/** Deterministic luminance sampling; no network or canvas is needed in this pure step. */
export function samplePortrait(rgba: Uint8ClampedArray, width: number, height: number, count: number) {
  const cumulative = new Float64Array(width * height);
  let total = 0;
  for (let i = 0; i < cumulative.length; i++) {
    const brightness = (.2126 * rgba[i * 4] + .7152 * rgba[i * 4 + 1] + .0722 * rgba[i * 4 + 2]) / 255;
    total += (brightness * brightness + .015) * rgba[i * 4 + 3] / 255;
    cumulative[i] = total;
  }
  if (!total) return null;
  const positions = new Float32Array(count * 3), brightness = new Float32Array(count);
  let seed = 19;
  const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
  for (let i = 0; i < count; i++) {
    const target = random() * total;
    let low = 0, high = cumulative.length - 1;
    while (low < high) { const middle = low + high >>> 1; if (cumulative[middle] < target) low = middle + 1; else high = middle; }
    const x = low % width, y = Math.floor(low / width);
    const luma = (.2126 * rgba[low * 4] + .7152 * rgba[low * 4 + 1] + .0722 * rgba[low * 4 + 2]) / 255;
    positions[i * 3] = ((x + random()) / width - .5) * 2;
    positions[i * 3 + 1] = (.5 - (y + random()) / height) * 2 * height / width;
    positions[i * 3 + 2] = (luma - .5) * .1;
    brightness[i] = luma;
  }
  return { positions, brightness };
}
