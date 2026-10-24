import test from 'node:test';
import assert from 'node:assert/strict';
import { deliverAnonymousNote } from './anonymousNotes';

const endpoint = 'https://example.test/notes';
const signal = new AbortController().signal;
test('anonymous delivery sends only the note and reports success only on confirmation', async () => {
  const request = (async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.message, 'Hello Kal');
    assert.equal('email' in payload, false);
    assert.equal('name' in payload, false);
    return new Response(JSON.stringify({ success: 'true' }));
  }) as typeof fetch;
  await deliverAnonymousNote(endpoint, '  Hello Kal  ', '', signal, request);
});
test('provider rejection, activation pending, malformed replies and outages never look like delivery', async () => {
  for (const response of [new Response('{}'), new Response('{"success":"false","message":"Activate your form"}'), new Response('Unavailable', { status: 503 }), new Response('Not JSON')]) {
    await assert.rejects(deliverAnonymousNote(endpoint, 'Hello', '', signal, (async () => response) as typeof fetch));
  }
});
test('empty, oversized and honeypot notes never reach the service', async () => {
  const request = (async () => { assert.fail('Must not send invalid submissions'); }) as typeof fetch;
  for (const [message, honey] of [[' ', ''], ['x'.repeat(2001), ''], ['Hello', 'bot']]) {
    await assert.rejects(deliverAnonymousNote(endpoint, message, honey, signal, request));
  }
});
