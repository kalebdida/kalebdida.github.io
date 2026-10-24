import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from './worker.mjs';

const origin = 'https://kalebdida.github.io';
const limiter = { limit: async () => ({ success: true }) };
const env = { SITE_ORIGIN: origin, TELEGRAM_BOT_TOKEN: 'test-private-token', TELEGRAM_CHAT_ID: 'test-private-chat', NOTES_LIMITER: limiter, VISITS_LIMITER: limiter };
const note = (body = { message: 'Hello <b>Kal</b>', website: '' }, extra = {}) => new Request('https://relay.example/notes', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...extra }, body: JSON.stringify(body) });

test('relay sends only message text and hides private routing details', async () => {
  let called = false;
  const response = await handle(note(), env, async (url, init) => {
    called = true;
    assert.equal(url, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`);
    const body = JSON.parse(init.body);
    assert.equal(body.chat_id, env.TELEGRAM_CHAT_ID);
    assert.equal(body.text, 'Anonymous portfolio note\n\nHello <b>Kal</b>');
    assert.equal('parse_mode' in body, false);
    assert.equal('email' in body, false);
    assert.equal('ip' in body, false);
    return new Response('{"ok":true,"result":{"chat":{"id":"private"}}}');
  });
  assert.equal(called, true);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '{"ok":true}');
});
test('wrong origins, honeypots, invalid notes and missing secrets never send', async () => {
  const noSend = async () => assert.fail('Unexpected upstream request');
  for (const request of [note({}, { Origin: 'https://other.example' }), note({ message: ' ', website: '' }), note({ message: 'x'.repeat(2001) }), note({ message: 'Hello', website: 'bot' }), note({ message: 12 }), note({ message: 'x'.repeat(11000) })]) {
    assert.ok((await handle(request, env, noSend)).status >= 400);
  }
  assert.equal((await handle(note(), { ...env, TELEGRAM_BOT_TOKEN: '' }, noSend)).status, 503);
});
test('rate limits and provider errors stay generic, including secret-bearing failures', async () => {
  const limited = { ...env, NOTES_LIMITER: { limit: async () => ({ success: false }) } };
  assert.equal((await handle(note(), limited, async () => assert.fail())).status, 429);
  for (const upstream of [async () => new Response(JSON.stringify(env), { status: 400 }), async () => new Response('{"ok":false}'), async () => { throw new Error(env.TELEGRAM_BOT_TOKEN); }]) {
    const response = await handle(note(), env, upstream);
    assert.equal(response.status, 502);
    const text = await response.text();
    assert.equal(text.includes(env.TELEGRAM_BOT_TOKEN), false);
    assert.equal(text.includes(env.TELEGRAM_CHAT_ID), false);
    assert.equal(text.includes('telegram'), false);
  }
});
test('counter returns a real integer or an error, never a fabricated fallback', async () => {
  const request = () => new Request('https://relay.example/visits', { headers: { Origin: origin } });
  const response = await handle(request(), env, async () => new Response('{"message":"127"}'));
  assert.deepEqual(await response.json(), { count: 127 });
  for (const body of ['{}', '{"message":null}', '{"message":"invalid url"}', '{"message":-1}']) {
    assert.equal((await handle(request(), env, async () => new Response(body))).status, 502);
  }
});
test('CORS preflight is restricted to the portfolio origin', async () => {
  const response = await handle(new Request('https://relay.example/notes', { method: 'OPTIONS', headers: { Origin: origin } }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
});
