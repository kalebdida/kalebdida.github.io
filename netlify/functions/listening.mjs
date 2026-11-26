// What Kal is listening to, from Last.fm. The API key lives only in Netlify env vars
// (LASTFM_API_KEY, LASTFM_USER), never in the site bundle.
export const config = {
  path: '/listening',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip'] },
};

const ORIGIN = 'https://kalebdida.github.io';

export async function listening(request, env = process.env, requestUpstream = fetch) {
  const headers = { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
  const origin = request.headers.get('Origin');
  if (origin && origin !== ORIGIN) return new Response(JSON.stringify({ ok: false, error: 'Origin not allowed' }), { status: 403, headers });
  headers['Access-Control-Allow-Origin'] = ORIGIN;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET' } });
  if (request.method !== 'GET') return new Response(JSON.stringify({ ok: false }), { status: 405, headers });
  const reply = (body, status = 200, cache = 'public, max-age=30') => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Cache-Control': cache } });

  const key = env.LASTFM_API_KEY, user = env.LASTFM_USER;
  if (!key || !user) return reply({ ok: false, configured: false }, 200, 'no-store');

  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.search = new URLSearchParams({ method: 'user.getrecenttracks', user, api_key: key, format: 'json', limit: '1' });
  try {
    const response = await requestUpstream(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return reply({ ok: false, error: 'Last.fm unavailable' }, 502, 'no-store');
    const data = await response.json();
    const track = [].concat(data?.recenttracks?.track ?? [])[0];
    if (!track) return reply({ ok: true, track: null });
    const image = [].concat(track.image ?? []).find(i => i.size === 'large')?.['#text'] || null;
    return reply({
      ok: true,
      track: {
        name: String(track.name ?? ''),
        artist: String(track.artist?.['#text'] ?? track.artist?.name ?? ''),
        url: String(track.url ?? ''),
        image,
        playing: track['@attr']?.nowplaying === 'true',
        at: track.date?.uts ? Number(track.date.uts) * 1000 : null,
      },
    });
  } catch {
    return reply({ ok: false, error: 'Last.fm unavailable' }, 502, 'no-store');
  }
}

export default request => listening(request);
