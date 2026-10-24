import { handle } from '../workers/contact/worker.mjs';

// Netlify enforces each function's config.rateLimit at its edge, before invocation.
// Acknowledge that check for the shared handler; do not use instance-local counters.
const edgeLimited = { limit: async () => ({ success: true }) };

export function createRelay(path, environment = process.env, requestUpstream = fetch) {
  return request => {
    // Both the custom route and Netlify's default function URL reach this handler.
    const url = new URL(request.url);
    url.pathname = path;
    return handle(new Request(url, request), {
      SITE_ORIGIN: 'https://kalebdida.github.io',
      TELEGRAM_BOT_TOKEN: environment.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: environment.TELEGRAM_CHAT_ID,
      NOTES_LIMITER: edgeLimited,
      VISITS_LIMITER: edgeLimited,
    }, requestUpstream);
  };
}
