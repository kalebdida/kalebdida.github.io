# Private contact relay

The recommended setup is now [Netlify](../../netlify/README.md). This folder keeps
the shared request handler and optional Cloudflare adapter. Use the Netlify guide
to avoid Cloudflare setup; the portfolio accepts the same public Relay URL.

This small Cloudflare Worker accepts a note from the portfolio and forwards the
text to the owner's existing Telegram bot. The browser sends only the note and a
honeypot field to `/notes`. It never receives the bot token, chat ID, bot username,
or Telegram's response. It does not request a visitor name or email, and it does
not attach visitor IP addresses or browser details to the forwarded note.

`GET /visits` returns the existing shared page-view total as JSON, so the site can
display a plain number using its own theme. There is no badge or redirect.

## Deploy once

You need access to your Cloudflare account and your existing bot's token. Keep the
token out of chat, source control, Pages CMS, and frontend environment variables.

The [Workers Free plan](https://developers.cloudflare.com/workers/platform/pricing/)
includes 100,000 requests per day and suits this relay. Keep the account on Free;
this setup does not require a paid subscription or a custom domain.

1. Open your bot's conversation in Telegram and press **Start**.
2. In this repository's **source** branch, run:

   ```sh
   npx wrangler login
   npx wrangler secret put TELEGRAM_BOT_TOKEN --config workers/contact/wrangler.toml
   npx wrangler secret put TELEGRAM_CHAT_ID --config workers/contact/wrangler.toml
   npx wrangler deploy --config workers/contact/wrangler.toml
   ```

   Wrangler asks for secret values interactively. The chat ID is your destination
   conversation ID, not the bot username. If you do not know it, send a message to
   your bot and inspect `getUpdates` privately using Telegram's Bot API. Do not
   paste a token-bearing API URL into this repository or a public browser screenshot.

3. Copy the resulting public `https://kal-portfolio-contact.<account>.workers.dev`
   URL into **Pages CMS → Site → Private message delivery → Relay URL**. Save on
   `source`. Only this public URL belongs in CMS.
4. Send one test note from the website and confirm that it arrives in Telegram.

Opening the relay URL directly can show a 403 response; it accepts browser requests
from your site, rather than serving a public page.

The included Wrangler configuration creates the rate-limit bindings automatically:
3 note attempts and 60 counter requests per minute, per IP and Cloudflare location.
If bindings or secrets are missing, the relay refuses delivery. It restricts browser
origins to `SITE_ORIGIN` and caps note length and request-body size. Rate-limiting
keys are hashed; request details are not included in messages. Avoid adding logs
that include messages, request bodies, bot tokens, or chat IDs.

For Cloudflare's GitHub deployment UI, select **source** as the production branch,
use `workers/contact` as the root directory and `npx wrangler deploy` as the deploy
command. Add the two secrets in the Worker's
**Settings → Variables and Secrets**. The Wrangler configuration must be used so
that both rate-limit bindings are provisioned.

## Validate without sending a message

```sh
node --test workers/contact/worker.test.mjs
npx wrangler deploy --dry-run --config workers/contact/wrangler.toml
```

Tests replace outbound requests and never send real notes. The frontend deliberately
disables message submission and hides the numeric counter until a relay URL is
configured. There is no fallback to email delivery.
