import test from 'node:test';
import assert from 'node:assert/strict';
import { listening } from './functions/listening.mjs';

const req = (origin = 'https://kalebdida.github.io') => new Request('https://x/listening', { headers: { Origin: origin } });

test('reports not configured without leaking anything', async () => {
  const r = await listening(req(), {});
  assert.deepEqual(await r.json(), { ok: false, configured: false });
});

test('rejects other origins', async () => {
  assert.equal((await listening(req('https://evil.example'), { LASTFM_API_KEY: 'k', LASTFM_USER: 'u' })).status, 403);
});

test('returns the latest track and never the key', async () => {
  const upstream = async url => {
    assert.equal(url.searchParams.get('api_key'), 'secret');
    return new Response(JSON.stringify({ recenttracks: { track: [{ name: 'Song', artist: { '#text': 'Artist' }, url: 'https://www.last.fm/x', image: [{ size: 'large', '#text': 'https://img' }], '@attr': { nowplaying: 'true' } }] } }));
  };
  const r = await listening(req(), { LASTFM_API_KEY: 'secret', LASTFM_USER: 'kal' }, upstream);
  const text = await r.text();
  assert.ok(!text.includes('secret'));
  assert.deepEqual(JSON.parse(text).track, { name: 'Song', artist: 'Artist', url: 'https://www.last.fm/x', image: 'https://img', playing: true, at: null });
});
