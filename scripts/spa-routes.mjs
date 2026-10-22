// after `vite build`: give every page of the site its own index.html, so links like
// kalebdida.github.io/blog or /resume open directly on github pages (no 404).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const index = join(dist, 'index.html');
if (!existsSync(index)) throw new Error('run vite build first');

const data = readFileSync(join(root, 'src/data/siteData.ts'), 'utf8');
const postsBlock = data.slice(data.indexOf('posts: ['), data.indexOf('] as BlogPost[]'));
// only posts that live on this site get a page (medium / substack links open elsewhere)
const slugs = postsBlock
  .split(/\n    \{\n/)
  .filter((b) => !b.includes('external:'))
  .flatMap((b) => [...b.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]));

const routes = ['blog', 'now', 'resume', ...slugs.map((s) => `blog/${s}`)];
for (const r of routes) {
  mkdirSync(join(dist, r), { recursive: true });
  copyFileSync(index, join(dist, r, 'index.html'));
}
copyFileSync(index, join(dist, '404.html'));
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`spa routes: ${routes.join(', ')} + 404.html`);
