import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelay } from './relay.mjs';
import { config as notesConfig } from './functions/notes.mjs';
import { config as visitsConfig } from './functions/visits.mjs';

const origin = 'https://kalebdida.github.io';
const env = { TELEGRAM_BOT_TOKEN: 'test-private-token', TELEGRAM_CHAT_ID: 'test-private-chat' };
const note = (path = '/notes', body = { message: 'A private note.', website: '' }, from = origin) => new Request(`https://relay.example${path}`, {
  method: 'POST', headers: { Origin: from, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('both Netlify endpoints declare platform IP rate limits', () => {
  assert.deepEqual(notesConfig, { path: '/notes', rateLimit: { windowLimit: 3, windowSize: 60, aggregateBy: ['ip'] } });
  assert.deepEqual(visitsConfig, { path: '/visits', rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip'] } });
});

test('custom and default Netlify function URLs deliver privately through the same handler', async () => {
  for (const path of ['/notes', '/.netlify/functions/notes']) {
    let calls = 0;
    const relay = createRelay('/notes', env, async (url, init) => {
      calls++;
      assert.equal(url, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`);
      assert.deepEqual(JSON.parse(init.body), { chat_id: env.TELEGRAM_CHAT_ID, text: 'Anonymous portfolio note\n\nA private note.', link_preview_options: { is_disabled: true } });
      return new Response('{"ok":true,"result":{"private":"data"}}');
    });
    const response = await relay(note(path));
    assert.equal(calls, 1);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.deepEqual(await response.json(), { ok: true });
  }
});

test('missing secrets, invalid origins and honeypots never send', async () => {
  const noSend = async () => assert.fail('Unexpected upstream request');
  assert.equal((await createRelay('/notes', {}, noSend)(note())).status, 503);
  assert.equal((await createRelay('/notes', env, noSend)(note('/notes', {}, 'https://other.example'))).status, 403);
  assert.equal((await createRelay('/notes', env, noSend)(note('/notes', { message: 'Hello', website: 'spam' }))).status, 400);
});

test('visits work without bot secrets and never expose the upstream response', async () => {
  const request = new Request('https://relay.example/visits', { headers: { Origin: origin } });
  const response = await createRelay('/visits', {}, async () => new Response('{"message":"42","label":"hits"}'))(request);
  assert.deepEqual(await response.json(), { count: 42 });
});

test('delivery errors remain generic and CORS preflight never calls Telegram', async () => {
  const relay = createRelay('/notes', env, async () => new Response(JSON.stringify(env), { status: 400 }));
  const response = await relay(note());
  assert.equal(response.status, 502);
  const body = await response.text();
  assert.equal(body.includes(env.TELEGRAM_BOT_TOKEN), false);
  assert.equal(body.includes(env.TELEGRAM_CHAT_ID), false);
  const preflight = await createRelay('/notes', env, async () => assert.fail('Unexpected upstream request'))(new Request('https://relay.example/notes', { method: 'OPTIONS', headers: { Origin: origin } }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
});
