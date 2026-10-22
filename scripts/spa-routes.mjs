// Direct-entry routes, metadata and feeds use the same CMS content as the app.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteArtifacts, renderPage } from './site-content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const template = readFileSync(join(dist, 'index.html'), 'utf8');
const data = siteArtifacts(root);
for (const route of data.routes) {
  mkdirSync(join(dist, route.path), { recursive: true });
  writeFileSync(join(dist, route.path, 'index.html'), renderPage(template, route, data));
}
writeFileSync(join(dist, '404.html'), readFileSync(join(dist, 'index.html')));
writeFileSync(join(dist, '.nojekyll'), '');
writeFileSync(join(dist, 'rss.xml'), data.rss);
writeFileSync(join(dist, 'sitemap.xml'), data.sitemap);
console.log(`Static routes, RSS and sitemap: ${data.routes.length} routes, ${data.posts.length} public posts.`);
