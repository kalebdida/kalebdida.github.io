import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCtfFlag, filterAndGroupPosts, updateKeystrokeBuffer, adamaClock } from './logic';
import { buildFormations, makeLayout, FORMATION, FORMATION_COUNT } from '../three/formations';
import { SITE_DATA } from '../data/siteData';

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

test('adama clock gives a lowercase time and ethiopian date', () => {
  const { time, ethDate } = adamaClock(new Date('2026-10-22T16:55:00Z'));
  assert.equal(time, '7:55 pm');
  assert.equal(ethDate, 'tekemt 12, 2019');
});

test('blog filtering and grouping by year', () => {
  const all = filterAndGroupPosts(SITE_DATA.posts, '', null);
  assert.equal(all.length, 1);
  assert.equal(all[0].posts.length, 3);
  const robots = filterAndGroupPosts(SITE_DATA.posts, 'robot', null);
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
