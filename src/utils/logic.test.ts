import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCtfFlag, filterAndGroupPosts, updateKeystrokeBuffer, adamaClock } from './logic';
import { buildFormations, makeLayout, FORMATION, FORMATION_COUNT } from '../three/formations';
import { readFileSync, readdirSync } from 'node:fs';
import { parsePost } from '../../scripts/content.mjs';
const posts = readdirSync(new URL('../../content/posts/', import.meta.url)).filter(f => f.endsWith('.md')).map(f => parsePost(f.slice(0, -3), readFileSync(new URL(`../../content/posts/${f}`, import.meta.url), 'utf8')));

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
  assert.equal(data.posts.length, posts.filter(p => !p.draft).length);
  for (const post of data.posts) {
    assert.equal(data.routes.some(route => route.path === `blog/${post.slug}`), !post.external);
    assert.ok(data.rss.includes(post.title.replace(/&/g, '&amp;')));
  }
  const html = renderPage('<title>Old</title><meta name="description" content="Old"/><link rel="canonical" href="old"/>', data.routes[0], data);
  assert.ok(html.includes('Kaleb Dida (Kal)'));
  assert.ok(html.includes('href="https://kalebdida.github.io/"'));
});
