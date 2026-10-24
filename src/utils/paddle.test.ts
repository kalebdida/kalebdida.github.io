import test from 'node:test';
import assert from 'node:assert/strict';
import { newRound, stepRound } from './paddle';
test('paddle catches score once, send the ball upward and preserve playable speed', () => {
  const round = { ...newRound(), x: 160, y: 169, vx: 0, vy: 150 };
  stepRound(round, 1 / 60);
  assert.equal(round.score, 1); assert.ok(round.vy < 0);
  stepRound(round, 1 / 60); assert.equal(round.score, 1);
});
test('misses end a round without awarding points, and a new round resets it', () => {
  const round = { ...newRound(), x: 20, y: 168, vy: 180 };
  for (let i = 0; i < 30; i++) stepRound(round, 1 / 60);
  assert.equal(round.over, true); assert.equal(round.score, 0);
  assert.equal(newRound().over, false);
});
