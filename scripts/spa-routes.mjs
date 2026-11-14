// Direct-entry routes, metadata and feeds use the same CMS content as the app.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteArtifacts, renderPage } from './site-content.mjs';
import { llmsTxt } from './prerender.mjs';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const template = readFileSync(join(dist, 'index.html'), 'utf8');
const data = siteArtifacts(root);
for (const route of data.routes) {
  mkdirSync(join(dist, route.path), { recursive: true });
  writeFileSync(join(dist, route.path, 'index.html'), renderPage(template, route, data));
}
writeFileSync(join(dist, '404.html'), renderPage(template, { path: '404.html', title: `Page not found, ${data.identity.shortName}`, description: 'This page wandered off. Follow the particles home.' }, data));
writeFileSync(join(dist, '.nojekyll'), '');
writeFileSync(join(dist, 'rss.xml'), data.rss);
writeFileSync(join(dist, 'sitemap.xml'), data.sitemap);
writeFileSync(join(dist, 'llms.txt'), llmsTxt(data.content, data.posts));
writeFileSync(join(dist, 'humans.txt'), `/* TEAM */\nBuilt by: ${data.identity.name} (${data.identity.handle})\nFrom: ${data.identity.city}\nSite: ${data.identity.url}\n\n/* SITE */\nStack: React, Vite, Tailwind, three.js\nFonts: Newsreader, Geist, Noto Serif Ethiopic\nHosting: GitHub Pages\nLast build: ${new Date().toISOString().slice(0, 10)}\n`);
// social previews (Google, LinkedIn, WhatsApp, Telegram) need a raster image, not SVG
await sharp(readFileSync(join(root, 'public/og-image.svg'))).resize(1200, 630).png().toFile(join(dist, 'og-image.png'));
console.log(`Static routes, RSS and sitemap: ${data.routes.length} routes, ${data.posts.length} public posts.`);
