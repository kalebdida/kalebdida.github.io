import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parsePost } from './content.mjs';

export const escapeHtml = value => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[ch]);

export function siteArtifacts(root) {
  const { identity, socials } = JSON.parse(readFileSync(join(root, 'content/site.json'), 'utf8'));
  const resume = JSON.parse(readFileSync(join(root, 'content/resume.json'), 'utf8'));
  const posts = readdirSync(join(root, 'content/posts')).filter(f => f.endsWith('.md'))
    .map(file => parsePost(file.slice(0, -3), readFileSync(join(root, 'content/posts', file), 'utf8')))
    .filter(p => !p.draft).sort((a, b) => b.date.localeCompare(a.date));
  const routes = [
    { path: '', title: `${identity.shortName} (${identity.handle})`, description: identity.intro },
    { path: 'blog', title: `Field notes, ${identity.shortName}`, description: 'Writing on building things, minds, and what I learn along the way.' },
    { path: 'now', title: `Now, ${identity.shortName}`, description: identity.title },
    { path: 'resume', title: `Resume, ${identity.shortName}`, description: resume.title },
    ...posts.filter(p => !p.external).map(p => ({ path: `blog/${p.slug}`, title: `${p.title}, ${identity.shortName}`, description: p.summary })),
  ];
  const items = posts.map(p => {
    const url = p.external?.url ?? `${identity.url}/blog/${p.slug}`;
    return `<item><title>${escapeHtml(p.title)}</title><link>${escapeHtml(url)}</link><guid isPermaLink="true">${escapeHtml(url)}</guid><pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escapeHtml(p.summary)}</description></item>`;
  }).join('\n');
  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Field notes, ${escapeHtml(identity.shortName)}</title><description>Writing on building things, minds, and what ${escapeHtml(identity.handle)} learns along the way.</description><link>${escapeHtml(identity.url)}/blog</link><atom:link href="${escapeHtml(identity.url)}/rss.xml" rel="self" type="application/rss+xml"/><language>en-us</language>${items}</channel></rss>\n`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r => `<url><loc>${escapeHtml(identity.url)}/${r.path}</loc></url>`).join('')}</urlset>\n`;
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', name: identity.name,
    alternateName: [identity.handle, identity.shortName, identity.geezName], url: identity.url,
    homeLocation: { '@type': 'Place', name: identity.city }, jobTitle: identity.title,
    alumniOf: resume.education.filter(edu => edu.school !== 'Gap year').map(edu => ({ '@type': 'EducationalOrganization', name: edu.school })),
    knowsLanguage: resume.skills.find(s => s.group === 'Languages')?.items.map(lang => lang.split(' (')[0]),
    sameAs: socials.filter(s => s.href.startsWith('https://')).map(s => s.href),
  };
  return { identity, posts, routes, rss, sitemap, person };
}

export function renderPage(template, route, { identity, person }) {
  const url = `${identity.url}/${route.path}`;
  return template.replace(/<title>.*?<\/title>/s, () => `<title>${escapeHtml(route.title)}</title>`)
    .replace(/(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(route.description))
    .replace(/(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(route.title))
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(url))
    .replace(/(<meta\s+property="og:site_name"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(identity.shortName))
    .replace(/(<meta\s+property="og:image"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(`${identity.url}/og-image.svg`))
    .replace(/(<link rel="canonical" href=")[^"]*/g, (_, prefix) => prefix + escapeHtml(url))
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`);
}
