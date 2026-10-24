const COUNTER = 'https://hits.dwyl.com/kalebdida/portfolio-site-20261024.json';
const MAX_BODY = 10000;

async function readJson(request) {
  if (!request.body) throw new Error('Missing body');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, text = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); throw new Error('Body too large'); }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}

/** The public API never exposes the delivery service, bot token or destination. */
export async function handle(request, env, requestUpstream = fetch) {
  const allowed = env.SITE_ORIGIN || 'https://kalebdida.github.io';
  const origin = request.headers.get('Origin');
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
  const reply = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
  if (origin !== allowed) return reply({ ok: false, error: 'Origin not allowed' }, 403);
  headers['Access-Control-Allow-Origin'] = allowed;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '3600' } });
  const path = new URL(request.url).pathname.replace(/\/$/, '');
  if (path !== '/notes' && path !== '/visits') return reply({ ok: false }, 404);
  if ((path === '/notes' && request.method !== 'POST') || (path === '/visits' && request.method !== 'GET')) return reply({ ok: false }, 405);
  const limiter = path === '/notes' ? env.NOTES_LIMITER : env.VISITS_LIMITER;
  if (!limiter) return reply({ ok: false, error: 'Temporarily unavailable' }, 503);
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (!(await limiter.limit({ key })).success) return reply({ ok: false, error: 'Please try again later' }, 429, { 'Retry-After': '60' });
    if (path === '/visits') {
      const response = await requestUpstream(COUNTER, { signal: AbortSignal.timeout(7000), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Counter unavailable');
      const data = await response.json();
      const raw = data.message;
      if ((typeof raw !== 'string' && typeof raw !== 'number') || !/^\d+$/.test(String(raw))) throw new Error('Invalid counter');
      const count = Number(raw);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid counter');
      return reply({ count });
    }
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return reply({ ok: false, error: 'Temporarily unavailable' }, 503);
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply({ ok: false }, 415);
    let data;
    try { data = await readJson(request); } catch { return reply({ ok: false, error: 'Invalid note' }, 400); }
    if (!data || typeof data.message !== 'string' || data.website || !data.message.trim() || data.message.trim().length > 2000) return reply({ ok: false, error: 'Invalid note' }, 400);
    const response = await requestUpstream(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', signal: AbortSignal.timeout(9000), headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `Anonymous portfolio note\n\n${data.message.trim()}`, link_preview_options: { is_disabled: true } }),
    });
    if (!response.ok || (await response.json()).ok !== true) throw new Error('Delivery unavailable');
    return reply({ ok: true });
  } catch {
    // Never forward upstream responses: those can contain private delivery details.
    return reply({ ok: false, error: 'Temporarily unavailable' }, 502);
  }
}

export default { fetch: (request, env) => handle(request, env) };
