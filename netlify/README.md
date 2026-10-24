# Free Netlify relay setup

The portfolio stays on GitHub Pages. Netlify hosts only `/notes` and `/visits`.
It uses the existing tested delivery handler and the same public Relay URL field.
Choose Netlify's Free plan, which has usage limits; no paid plan is needed to start.

1. Sign in at https://app.netlify.com using GitHub.
2. Choose **Add new project → Import an existing project → GitHub**. Authorize
   access to `kalebdida/kalebdida.github.io` and select that repository.
3. Set **Branch to deploy** to **source**. The root `netlify.toml` supplies the
   remaining build settings: base `netlify`, build command
   `node --test relay.test.mjs`, publish directory `netlify/public` relative to the
   repository (or `public` relative to the base), functions `netlify/functions`.
   Leave **Package directory** empty if shown. Do not select the generated `main` branch.
4. Under **Environment variables**, add `TELEGRAM_BOT_TOKEN` and
   `TELEGRAM_CHAT_ID`. These are server-only values. If choosing scopes, include
   **Functions** and the **Production** deploy context. You can also add them after
   deployment under **Project configuration → Environment variables**, then trigger
   a new production deployment to apply them.
5. Select **Deploy** and wait for success. Open your Telegram bot and press **Start**.
6. Copy the project's production `https://your-project.netlify.app` address into
   **Pages CMS → Site → Private message delivery → Relay URL**, on **source**.
   Do not append `/notes` or `/visits`. Save and wait for the portfolio to redeploy.
7. Send a test note from the portfolio and confirm it arrives in Telegram. Check
   that the page-visit count appears too. Opening `/notes` directly can return 403;
   the handler accepts requests from the portfolio origin.

Keep tokens and chat IDs out of chat, source control and Pages CMS. The browser
receives neither secret, Telegram's response nor a link to the bot. The handler
forwards only the note text. No visitor name or email is requested.

The two functions declare Netlify's native edge rate limits: 3 note requests and
60 visit requests per IP per minute, including function URL aliases. The existing
handler still rejects oversized messages, honeypots, invalid origins and upstream
errors. Neither function logs notes or secret values. Rate limits are enforced by
Netlify in production, not by in-memory counters in individual function instances.

Local verification (outbound requests are mocked):

```sh
node --test netlify/relay.test.mjs workers/contact/worker.test.mjs
```

No Cloudflare account, Wrangler commands or manually created bindings are needed
for this host. The Cloudflare files remain as an optional adapter for the shared
handler; Netlify does not deploy a Cloudflare Worker.
