/**
 * particle formations for "the quiet mind".
 * the same particles travel between these shapes as you scroll.
 * every formation is a Float32Array of xyz positions, one per particle.
 *
 *  0 mind      hero: a slowly turning orb of thought, with a thin orbit
 *  1 brain     about: two hemispheres seen from above, with folds
 *  2 triad     what i do: network, lattice, circuit (one per discipline)
 *  3 stars     work: four bright stars joined like a constellation
 *  4 highlands journey: night-time highland terrain the camera drifts over
 *  5 dust      recognition + field notes: a quiet starfield
 *  6 sound     off-screen: a sheet that moves like sound
 *  7 light     contact: everything gathers into one point, with a halo
 */

export const FORMATION = {
  mind: 0,
  brain: 1,
  triad: 2,
  constellation: 3,
  highlands: 4,
  dust: 5,
  sound: 6,
  light: 7,
} as const;

export const FORMATION_COUNT = 8;

export interface Layout {
  isMobile: boolean;
  orbCenter: [number, number, number];
  orbRadius: number;
  brainCenter: [number, number, number];
  triadCenters: [number, number, number][];
  starCenters: [number, number, number][];
  pointCenter: [number, number, number];
}

export function makeLayout(isMobile: boolean): Layout {
  if (isMobile) {
    return {
      isMobile,
      orbCenter: [0.55, 2.35, -0.5],
      orbRadius: 0.82,
      brainCenter: [0.6, 1.4, -1],
      triadCenters: [
        [-1.1, -1.9, -0.5],
        [0.0, -1.9, -0.5],
        [1.1, -1.9, -0.5],
      ],
      starCenters: [
        [-0.9, 2.2, -1],
        [0.5, 1.7, -1],
        [-0.2, 0.9, -1],
        [1.1, 0.3, -1],
      ],
      pointCenter: [0.9, 1.6, 0],
    };
  }
  return {
    isMobile,
    orbCenter: [3.6, -0.2, -0.6],
    orbRadius: 1.7,
    brainCenter: [-3.55, -0.75, 0],
    triadCenters: [
      [-0.55, -1.35, 0],
      [1.45, -1.35, 0],
      [3.45, -1.35, 0],
    ],
    starCenters: [
      [-4.4, 0.9, 0],
      [-3.1, 0.05, 0],
      [-4.0, -0.95, 0],
      [-2.55, -1.85, 0],
    ],
    pointCenter: [2.8, 0.55, 0],
  };
}

/* ---------- small deterministic helpers ---------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand: () => number): number {
  const u = Math.max(1e-6, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** ridged fbm: sharp crests, soft valleys */
function ridged(x: number, y: number): number {
  let sum = 0;
  let amp = 0.55;
  let freq = 1;
  for (let o = 0; o < 5; o++) {
    const n = valueNoise(x * freq, y * freq) * 2 - 1;
    const r = 1 - Math.abs(n);
    sum += r * r * amp;
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

function rotateY(p: [number, number, number], a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
}

function rotateX(p: [number, number, number], a: number): [number, number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
}

/* ---------- formations ---------- */

export interface Formations {
  list: Float32Array[]; // indexed by FORMATION
  link: Float32Array; // -1 for star cores, otherwise interpolation along a constellation link
  seed: Float32Array; // 0..1 per particle, used for stagger + twinkle
  group: Float32Array; // 0..1 per particle, picks the cluster in triad / constellation / halo
}

export function buildFormations(count: number, layout: Layout): Formations {
  const rand = mulberry32(20260722);
  const list = Array.from({ length: FORMATION_COUNT }, () => new Float32Array(count * 3));
  const seed = new Float32Array(count);
  const group = new Float32Array(count);
  const link = new Float32Array(count).fill(-1);

  for (let i = 0; i < count; i++) {
    seed[i] = rand();
    group[i] = rand();
  }

  const set = (f: number, i: number, p: [number, number, number]) => {
    list[f][i * 3] = p[0];
    list[f][i * 3 + 1] = p[1];
    list[f][i * 3 + 2] = p[2];
  };

  /* 0 mind: a globe drawn in contour lines, a soft core, and a thin saturn-like orbit */
  {
    const [cx, cy, cz] = layout.orbCenter;
    const R = layout.orbRadius;
    const rings = 30;
    const meridians = 10;
    for (let i = 0; i < count; i++) {
      const g = group[i];
      let p: [number, number, number];
      if (g < 0.68) {
        // latitude contours, gently displaced like a topographic map of a thought
        // fewer points near the poles so they don't bunch up
        let ring = 0;
        let lat = 0;
        for (let tries = 0; tries < 8; tries++) {
          ring = Math.floor(rand() * rings);
          lat = -Math.PI / 2 + ((ring + 0.5) / rings) * Math.PI;
          if (rand() < Math.cos(lat)) break;
        }
        const lon = rand() * Math.PI * 2;
        const bump = 1 + 0.05 * Math.cos(lat) * Math.sin(3 * lon + 5 * lat) * Math.cos(2 * lat - lon);
        const r = R * bump;
        p = [Math.cos(lat) * Math.cos(lon) * r, Math.sin(lat) * r, Math.cos(lat) * Math.sin(lon) * r];
      } else if (g < 0.8) {
        // meridians
        const m = Math.floor(rand() * meridians);
        const lon = (m / meridians) * Math.PI;
        const a = rand() * Math.PI * 2;
        p = [Math.cos(a) * Math.cos(lon) * R, Math.sin(a) * R, Math.cos(a) * Math.sin(lon) * R];
      } else if (g < 0.9) {
        // inner thoughts: a sparse, glowing core
        const u = rand();
        const v = rand();
        const w = Math.pow(rand(), 0.7) * R * 0.55;
        const th = 2 * Math.PI * u;
        const ph = Math.acos(2 * v - 1);
        p = [w * Math.sin(ph) * Math.cos(th), w * Math.sin(ph) * Math.sin(th), w * Math.cos(ph)];
      } else {
        // orbit, tilted like saturn's rings
        const th = rand() * Math.PI * 2;
        const rr = R * (1.42 + gauss(rand) * 0.025 + (rand() < 0.35 ? 0.11 : 0));
        p = rotateX([Math.cos(th) * rr, gauss(rand) * 0.012, Math.sin(th) * rr], 0.32);
        p = rotateY(p, -0.2);
        p = [p[0], p[1], p[2]];
      }
      // tilt the whole globe a little
      p = rotateX(p, 0.18);
      set(FORMATION.mind, i, [p[0] + cx, p[1] + cy, p[2] + cz]);
    }
  }

  /* 1 brain: side view. cerebrum with folds, temporal lobe, cerebellum, brainstem */
  {
    const [bx, by, bz] = layout.brainCenter;
    const s = 0.88;
    const onEllipsoid = (rx: number, ry: number, rz: number) => {
      const u = rand();
      const v = rand();
      const th = 2 * Math.PI * u;
      const ph = Math.acos(2 * v - 1);
      return { th, ph, p: [rx * Math.sin(ph) * Math.cos(th), ry * Math.cos(ph), rz * Math.sin(ph) * Math.sin(th)] as [number, number, number] };
    };
    for (let i = 0; i < count; i++) {
      const r = seed[i];
      let p: [number, number, number] = [0, 0, 0];
      if (r < 0.64) {
        // cerebrum: keep points that land on the gyri, so the folds read as lines
        for (let tries = 0; tries < 12; tries++) {
          const e = onEllipsoid(1.55, 1.05, 1.0);
          const [x, y, z] = e.p;
          const gyri = Math.abs(Math.sin(7.5 * x + 3.2 * Math.sin(2.6 * y + 1.3 * z) + 2.1 * y));
          p = [x, y + 0.15, z];
          if (gyri > 0.72) break;
        }
        // flatten the underside
        if (p[1] < -0.35) p[1] = -0.35 + (p[1] + 0.35) * 0.35;
        // central sulcus and lateral fissure: thin the points along them
        if (Math.abs(p[0] + 0.1 - 0.35 * p[1]) < 0.035 && p[1] > 0) p = [p[0] + 0.06, p[1], p[2]];
      } else if (r < 0.74) {
        // temporal lobe
        const e = onEllipsoid(0.9, 0.42, 0.85);
        p = [e.p[0] + 0.2, e.p[1] - 0.5, e.p[2]];
      } else if (r < 0.9) {
        // cerebellum, with fine horizontal folia
        let q: [number, number, number] = [0, 0, 0];
        for (let tries = 0; tries < 10; tries++) {
          const e = onEllipsoid(0.58, 0.36, 0.7);
          q = e.p;
          if (Math.abs(Math.sin(q[1] * 38)) > 0.55) break;
        }
        p = [q[0] - 1.05, q[1] - 0.72, q[2]];
      } else if (r < 0.96) {
        // brainstem
        const t = rand();
        const a = rand() * Math.PI * 2;
        const rr = 0.17 * (1 - 0.25 * t);
        p = [-0.42 - t * 0.22 + Math.cos(a) * rr, -0.62 - t * 0.85, Math.sin(a) * rr];
      } else {
        // a few neurons inside
        const e = onEllipsoid(1.2, 0.7, 0.75);
        const k = Math.cbrt(rand());
        p = [e.p[0] * k, e.p[1] * k + 0.1, e.p[2] * k];
      }
      p = rotateY(p, 0.38);
      set(FORMATION.brain, i, [p[0] * s + bx, p[1] * s + by, p[2] * s + bz]);
    }
  }

  /* 2 triad: network | lattice | circuit */
  {
    const nodes: [number, number, number][] = [];
    const nrand = mulberry32(7);
    for (let n = 0; n < 22; n++) {
      const th = nrand() * Math.PI * 2;
      const ph = Math.acos(2 * nrand() - 1);
      const r = 0.25 + nrand() * 0.6;
      nodes.push([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)]);
    }
    const edges: [number, number][] = [];
    for (let a = 0; a < nodes.length; a++) {
      const d = nodes
        .map((n, b) => [b, Math.hypot(n[0] - nodes[a][0], n[1] - nodes[a][1], n[2] - nodes[a][2])] as const)
        .filter(([b]) => b !== a)
        .sort((x, y) => x[1] - y[1]);
      edges.push([a, d[0][0]], [a, d[1][0]], [a, d[2][0]]);
    }
    // circuit: a chip with pins, and traces that leave it at right angles
    const traces: [number, number][][] = [];
    const chipEdges: [number, number][][] = [];
    const pins: [number, number][][] = [];
    {
      const crand = mulberry32(11);
      const hs = 0.22;
      const sq = (h: number): [number, number][][] => [
        [[-h, -h], [h, -h]],
        [[h, -h], [h, h]],
        [[h, h], [-h, h]],
        [[-h, h], [-h, -h]],
      ];
      chipEdges.push(...sq(hs), ...sq(0.13));
      const sides: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of sides) {
        for (let k = 0; k < 5; k++) {
          const o = -0.16 + k * 0.08;
          const sx = dx !== 0 ? dx * hs : o;
          const sy = dy !== 0 ? dy * hs : o;
          const ex = sx + dx * 0.07;
          const ey = sy + dy * 0.07;
          pins.push([[sx, sy], [ex, ey]]);
          if (crand() < 0.8) {
            const l1 = 0.08 + crand() * 0.22;
            const mx = ex + dx * l1;
            const my = ey + dy * l1;
            const turn = crand() < 0.5 ? 1 : -1;
            const l2 = 0.05 + crand() * 0.22;
            const tx = mx + (dx === 0 ? turn * l2 : 0);
            const ty = my + (dy === 0 ? turn * l2 : 0);
            const l3 = 0.05 + crand() * 0.12;
            traces.push([[ex, ey], [mx, my], [tx, ty], [tx + dx * l3, ty + dy * l3]]);
          }
        }
      }
    }
    const onSegment = (a: [number, number], b: [number, number]): [number, number, number] => {
      const t = rand();
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0];
    };
    const scale = 0.72;

    for (let i = 0; i < count; i++) {
      const g = Math.min(2, Math.floor(group[i] * 3));
      const [cx, cy, cz] = layout.triadCenters[g];
      let p: [number, number, number];
      if (g === 0) {
        if (seed[i] < 0.3) {
          const n = nodes[Math.floor(rand() * nodes.length)];
          p = [n[0] + gauss(rand) * 0.035, n[1] + gauss(rand) * 0.035, n[2] + gauss(rand) * 0.035];
        } else {
          const [a, b] = edges[Math.floor(rand() * edges.length)];
          const t = rand();
          p = [
            nodes[a][0] + (nodes[b][0] - nodes[a][0]) * t,
            nodes[a][1] + (nodes[b][1] - nodes[a][1]) * t,
            nodes[a][2] + (nodes[b][2] - nodes[a][2]) * t,
          ];
        }
      } else if (g === 1) {
        // a padlock: wireframe body with a lattice face, a shackle, and a keyhole
        const r = seed[i];
        const W = 0.45;
        const H0 = -0.55;
        const H1 = 0.15;
        const D = 0.16;
        if (r < 0.38) {
          // the 12 edges of the body
          const e = Math.floor(rand() * 12);
          const t = rand();
          const xs = [-W, W];
          const ys = [H0, H1];
          const zs = [-D, D];
          if (e < 4) p = [-W + t * 2 * W, ys[e & 1], zs[e >> 1]];
          else if (e < 8) p = [xs[e & 1], H0 + t * (H1 - H0), zs[(e >> 1) & 1]];
          else p = [xs[e & 1], ys[(e >> 1) & 1], -D + t * 2 * D];
        } else if (r < 0.62) {
          // the front face, drawn as a lattice
          const horizontal = rand() < 0.5;
          const t = rand();
          if (horizontal) {
            const k = Math.floor(rand() * 5);
            p = [-W + t * 2 * W, H0 + ((k + 0.5) / 5) * (H1 - H0), D];
          } else {
            const k = Math.floor(rand() * 6);
            p = [-W + ((k + 0.5) / 6) * 2 * W, H0 + t * (H1 - H0), D];
          }
        } else if (r < 0.9) {
          // the shackle: two legs and an arc, as a thin tube
          const tube = 0.035;
          const ta = rand() * Math.PI * 2;
          const off: [number, number] = [Math.cos(ta) * tube, Math.sin(ta) * tube];
          const part = rand();
          if (part < 0.7) {
            const a = rand() * Math.PI;
            p = [Math.cos(a) * (0.28 + off[0]), 0.34 + Math.sin(a) * (0.28 + off[0]), off[1]];
          } else {
            const side = rand() < 0.5 ? -1 : 1;
            p = [side * 0.28 + off[0], H1 + rand() * (0.34 - H1), off[1]];
          }
        } else {
          // keyhole on the front
          if (rand() < 0.6) {
            const a = rand() * Math.PI * 2;
            p = [Math.cos(a) * 0.06, -0.14 + Math.sin(a) * 0.06, D + 0.01];
          } else {
            const t = rand();
            p = [(rand() < 0.5 ? -1 : 1) * 0.022, -0.18 - t * 0.17, D + 0.01];
          }
        }
        p = [p[0], p[1] + 0.12, p[2]];
      } else {
        const r = seed[i];
        if (r < 0.2) {
          const e = chipEdges[Math.floor(rand() * chipEdges.length)];
          p = onSegment(e[0], e[1]);
        } else if (r < 0.3) {
          const e = pins[Math.floor(rand() * pins.length)];
          p = onSegment(e[0], e[1]);
        } else if (r < 0.85) {
          const path = traces[Math.floor(rand() * traces.length)];
          const seg = Math.floor(rand() * (path.length - 1));
          p = onSegment(path[seg], path[seg + 1]);
        } else {
          // solder pads at the trace ends
          const path = traces[Math.floor(rand() * traces.length)];
          const end = path[path.length - 1];
          const th = rand() * Math.PI * 2;
          const rr = 0.012 + rand() * 0.018;
          p = [end[0] + Math.cos(th) * rr, end[1] + Math.sin(th) * rr, 0];
        }
        p = [p[0] * 1.45, p[1] * 1.45, 0];
        p = rotateX(p, -0.5);
      }
      set(FORMATION.triad, i, [p[0] * scale * 1.35 + cx, p[1] * scale * 1.35 + cy, p[2] * scale * 1.35 + cz]);
    }
  }

  /* 3 constellation: four stars with cores, halos and faint joining lines */
  {
    const stars = layout.starCenters;
    for (let i = 0; i < count; i++) {
      const g = Math.min(3, Math.floor(group[i] * 4));
      const [cx, cy, cz] = stars[g];
      const r = seed[i];
      let p: [number, number, number];
      if (r < 0.42) {
        p = [cx + gauss(rand) * 0.07, cy + gauss(rand) * 0.07, cz + gauss(rand) * 0.07];
      } else if (r < 0.78) {
        p = [cx + gauss(rand) * 0.32, cy + gauss(rand) * 0.32, cz + gauss(rand) * 0.25];
      } else {
        const next = stars[Math.min(stars.length - 1, g + 1)];
        const from = g === stars.length - 1 ? stars[g - 1] : stars[g];
        const to = g === stars.length - 1 ? stars[g] : next;
        const t = rand();
        link[i] = t;
        p = [
          from[0] + (to[0] - from[0]) * t + gauss(rand) * 0.012,
          from[1] + (to[1] - from[1]) * t + gauss(rand) * 0.012,
          from[2] + (to[2] - from[2]) * t,
        ];
      }
      set(FORMATION.constellation, i, p);
    }
  }

  /* 4 highlands: a grid of terrain, mountains rising in the distance */
  {
    const cols = Math.round(Math.sqrt(count * 1.6));
    const rows = Math.ceil(count / cols);
    for (let i = 0; i < count; i++) {
      const cxi = i % cols;
      const rzi = Math.floor(i / cols);
      const x = (cxi / (cols - 1) - 0.5) * 18 + (rand() - 0.5) * 0.05;
      const z = 2.6 - (rzi / Math.max(1, rows - 1)) * 12;
      const far = Math.min(1, Math.max(0, (2.6 - z) / 12));
      const h = ridged(x * 0.16 + 3.1, z * 0.16 + 1.7) * (0.6 + far * 2.4);
      set(FORMATION.highlands, i, [x, -2.35 + h, z]);
    }
  }

  /* 5 dust: a calm starfield */
  for (let i = 0; i < count; i++) {
    set(FORMATION.dust, i, [(rand() - 0.5) * 26, (rand() - 0.5) * 15, -13 + rand() * 15]);
  }

  /* 6 sound: a flat sheet, waves are added in the shader */
  {
    const cols = Math.round(Math.sqrt(count * 2));
    const rows = Math.ceil(count / cols);
    for (let i = 0; i < count; i++) {
      const x = ((i % cols) / (cols - 1) - 0.5) * 15;
      const z = 2.4 - (Math.floor(i / cols) / Math.max(1, rows - 1)) * 9;
      set(FORMATION.sound, i, [x, -1.55, z]);
    }
  }

  /* 7 light: one bright point, with a slow halo ring */
  {
    const [px, py, pz] = layout.pointCenter;
    for (let i = 0; i < count; i++) {
      let p: [number, number, number];
      if (group[i] > 0.88) {
        const th = rand() * Math.PI * 2;
        const rr = 1.05 + gauss(rand) * 0.03;
        p = rotateX([Math.cos(th) * rr, 0, Math.sin(th) * rr], 1.28);
      } else {
        const u = rand();
        const v = rand();
        const w = Math.pow(rand(), 1.8) * 0.2;
        const th = 2 * Math.PI * u;
        const ph = Math.acos(2 * v - 1);
        p = [w * Math.sin(ph) * Math.cos(th), w * Math.sin(ph) * Math.sin(th), w * Math.cos(ph)];
      }
      set(FORMATION.light, i, [p[0] + px, p[1] + py, p[2] + pz]);
    }
  }

  return { list, seed, group, link };
}
