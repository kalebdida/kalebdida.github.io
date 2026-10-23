import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCtfFlag, filterAndGroupPosts, updateKeystrokeBuffer, adamaClock } from './logic';
import { buildFormations, makeLayout, FORMATION, FORMATION_COUNT } from '../three/formations';
import { parsePost } from '../../scripts/content.mjs';
// Isolated fixtures keep CMS additions and deletions from breaking logic tests.
const fixture = (slug: string, title: string, tags: string[] = []) => parsePost(slug, `---
title: ${title}
date: "2026-10-22"
summary: A test note.
tags: ${JSON.stringify(tags)}
draft: false
status: outline
---
## A heading
A paragraph.`);
const posts = [
  fixture('building-logbook', 'Building Logbook', ['Building']),
  fixture('obstacle-avoiding-robot-2023', 'An obstacle-avoiding robot', ['Robotics']),
  fixture('why-cognitive-science', 'Why cognitive science', ['Cognitive science']),
];

const typeAll = (text: string) => {
  let buf = '';
  let last: ReturnType<typeof updateKeystrokeBuffer>['triggered'] = null;
  for (const ch of text) {
    const step = updateKeystrokeBuffer(buf, ch);
    buf = step.nextBuffer;
    if (step.triggered) last = step.triggered;
  }
  return last;
};

test('ctf flag check', () => {
  assert.equal(verifyCtfFlag('flag{still_curious_after_all_these_years}'), true);
  assert.equal(verifyCtfFlag('flag{wrong}'), false);
});

test('typing the flag anywhere unlocks the note', () => {
  assert.equal(typeAll('hello flag{still_curious_after_all_these_years}'), 'flag');
  assert.equal(typeAll('flag{still_curious_'), null);
});

test('siuuu easter egg', () => {
  assert.equal(typeAll('siuu'), null);
  assert.equal(typeAll('siuuu'), 'siuuu');
});

test('adama clock gives an Adama time and Ethiopian date', () => {
  const { time, ethDate } = adamaClock(new Date('2026-10-22T16:55:00Z'));
  assert.equal(time, '7:55 PM');
  assert.equal(ethDate, 'Tekemt 12, 2019');
});

test('blog filtering and grouping by year', () => {
  const all = filterAndGroupPosts(posts, '', null);
  assert.equal(all.length, 1);
  assert.equal(all[0].posts.length, 3);
  const robots = filterAndGroupPosts(posts, 'robot', null);
  assert.equal(robots[0].posts[0].slug, 'obstacle-avoiding-robot-2023');
});

test('particle formations are complete and finite', () => {
  for (const mobile of [false, true]) {
    const count = 1500;
    const f = buildFormations(count, makeLayout(mobile));
    assert.equal(f.list.length, FORMATION_COUNT);
    for (const arr of f.list) {
      assert.equal(arr.length, count * 3);
      for (let i = 0; i < arr.length; i++) assert.ok(Number.isFinite(arr[i]));
    }
  }
});

test('point of light: the core gathers tightly around its center', () => {
  const layout = makeLayout(false);
  const f = buildFormations(1200, layout);
  const light = f.list[FORMATION.light];
  const [cx, cy, cz] = layout.pointCenter;
  for (let i = 0; i < 1200; i++) {
    if (f.group[i] > 0.88) continue; // halo ring
    const d = Math.hypot(light[i * 3] - cx, light[i * 3 + 1] - cy, light[i * 3 + 2] - cz);
    assert.ok(d <= 0.21);
  }
});


test('CMS Markdown is authoritative, validates fields and preserves body', () => {
  assert.equal(posts.length, 3);
  assert.ok(posts.every(p => p.body.includes('## ') && p.sections.length > 0));
  const raw = `---
title: Test
date: "2026-10-22"
summary: Test summary
tags: [AI]
draft: true
status: published
external_url: https://medium.com/example
external_platform: medium
---
## Memory
A new paragraph.
## Memory
Another paragraph.`;
  const post = parsePost('test', raw);
  assert.equal(post.external?.platform, 'medium');
  assert.equal(post.sections[1].id, 'memory-2');
  const code = parsePost('test', raw + '\n```md\n## Not a heading\n```\n## **Real** heading');
  assert.equal(code.sections.length, 3);
  assert.equal(code.sections[2].heading, 'Real heading');
  assert.ok(post.body.includes('A new paragraph.'));
  assert.equal(filterAndGroupPosts([post], '', null).length, 0);
  assert.throws(() => parsePost('../escape', raw), /slug/);
  assert.throws(() => parsePost('test', raw.replace('2026-10-22', '2026-02-30')), /date/);
  assert.throws(() => parsePost('test', raw.replace('https://medium.com/example', 'javascript:alert(1)')), /HTTPS/);
  assert.throws(() => parsePost('test', raw.replace('status: published', 'status: unknown')), /status/);
});


test('static routes and feeds exclude drafts and external post routes', async () => {
  const { siteArtifacts, renderPage } = await import('../../scripts/site-content.mjs');
  const root = new URL('../../', import.meta.url).pathname;
  const data = siteArtifacts(root);
  assert.equal(data.routes.filter(route => route.path.startsWith('blog/')).length, data.posts.filter(post => !post.external).length);
  for (const post of data.posts) {
    assert.equal(data.routes.some(route => route.path === `blog/${post.slug}`), !post.external);
    assert.ok(data.rss.includes(post.title.replace(/&/g, '&amp;')));
  }
  const html = renderPage('<title>Old</title><meta name="description" content="Old"/><link rel="canonical" href="old"/>', data.routes[0], data);
  assert.ok(html.includes(`${data.identity.shortName} (${data.identity.handle})`));
  assert.ok(html.includes('href="https://kalebdida.github.io/"'));
});


test('home writing excludes outlines and drafts, while keeping published notes and link-outs', async () => {
  const { selectHomePosts } = await import('./logic');
  const published = { ...posts[0], status: 'published' as const, date: '2026-10-20' };
  const link = { ...posts[1], external: { url: 'https://medium.com/example', platform: 'medium' as const }, date: '2026-10-22' };
  const draft = { ...published, draft: true, date: '2026-10-23' };
  assert.deepEqual(selectHomePosts([...posts, published, link, draft]).map(post => post.slug), [link.slug, published.slug]);
  assert.equal(selectHomePosts([link, published], 1).length, 1);
  assert.equal(selectHomePosts(posts).length, 0);
});

test('DOM screen anchors round-trip through the live camera at every requested width', async () => {
  const { screenToWorld } = await import('../three/anchors');
  const { PerspectiveCamera } = await import('three');
  for (const width of [390, 768, 1280, 1440, 1920]) {
    const height = width === 390 ? 844 : 900;
    const camera = new PerspectiveCamera(50, width / height, .1, 60);
    camera.position.set(.3, .2, 6.8); camera.lookAt(.1, 0, 0); camera.updateMatrixWorld();
    for (const [x, y] of [[40, 80], [width / 2, height / 2], [width - 60, height - 90]]) {
      const point = screenToWorld(x, y, width, height, camera);
      assert.ok(Math.abs(point.z) < 1e-10);
      const projected = point.project(camera);
      assert.ok(Math.abs((projected.x + 1) * width / 2 - x) < 1e-7);
      assert.ok(Math.abs((1 - projected.y) * height / 2 - y) < 1e-7);
    }
  }
});

test('portrait sampling is finite, deterministic and handles transparent images', async () => {
  const { samplePortrait } = await import('../three/anchors');
  const pixels = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 0, 180, 180, 180, 255, 0, 0, 0, 0]);
  const sampled = samplePortrait(pixels, 2, 2, 300)!;
  assert.equal(sampled.positions.length, 900);
  assert.ok(sampled.positions.every(Number.isFinite));
  assert.ok(sampled.positions.filter((_, i) => i % 3 === 0).every(x => x <= 0));
  assert.deepEqual(samplePortrait(pixels, 2, 2, 300), sampled);
  assert.equal(samplePortrait(new Uint8ClampedArray(16), 2, 2, 30), null);
});

test('the lock shackle stays above its body and constellation links retain interpolation', () => {
  const layout = makeLayout(false), forms = buildFormations(3000, layout);
  const lockY = { body: [] as number[], shackle: [] as number[] };
  for (let i = 0; i < forms.group.length; i++) {
    if (Math.floor(forms.group[i] * 3) !== 1) continue;
    const y = forms.list[FORMATION.triad][i * 3 + 1] - layout.triadCenters[1][1];
    if (forms.seed[i] < .62) lockY.body.push(y);
    else if (forms.seed[i] < .9) lockY.shackle.push(y);
  }
  const average = (items: number[]) => items.reduce((a, b) => a + b, 0) / items.length;
  assert.ok(average(lockY.shackle) > average(lockY.body) + .3);
  assert.ok(forms.link.some(t => t >= 0));
  assert.ok(forms.link.every(t => t === -1 || t >= 0 && t <= 1));
});
