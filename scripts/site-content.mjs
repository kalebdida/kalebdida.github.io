import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parsePost } from './content.mjs';
import { prerender, loadContent } from './prerender.mjs';

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
    { path: 'projects', title: `Projects, ${identity.shortName}`, description: 'Apps, experiments, and research, with case files, live previews and source code.' },
    { path: 'now', title: `Now, ${identity.shortName}`, description: identity.title },
    { path: 'resume', title: `Resume, ${identity.shortName}`, description: resume.title },
    ...posts.filter(p => !p.external).map(p => ({ path: `blog/${p.slug}`, title: `${p.title}, ${identity.shortName}`, description: p.summary, post: p })),
  ];
  const items = posts.map(p => {
    const url = p.external?.url ?? `${identity.url}/blog/${p.slug}`;
    const published = p.date ? `<pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>` : '';
    return `<item><title>${escapeHtml(p.title)}</title><link>${escapeHtml(url)}</link><guid isPermaLink="true">${escapeHtml(url)}</guid>${published}<description>${escapeHtml(p.summary)}</description></item>`;
  }).join('\n');
  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Field notes, ${escapeHtml(identity.shortName)}</title><description>Writing on building things, minds, and what ${escapeHtml(identity.handle)} learns along the way.</description><link>${escapeHtml(identity.url)}/blog</link><atom:link href="${escapeHtml(identity.url)}/rss.xml" rel="self" type="application/rss+xml"/><language>en-us</language>${items}</channel></rss>\n`;
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r => `<url><loc>${escapeHtml(identity.url)}/${r.path}</loc><lastmod>${r.post?.date || today}</lastmod><priority>${r.path === '' ? '1.0' : r.post ? '0.6' : '0.8'}</priority></url>`).join('')}</urlset>\n`;
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', name: identity.name,
    alternateName: [identity.handle, identity.shortName, identity.geezName], url: identity.url,
    homeLocation: { '@type': 'Place', name: identity.city }, jobTitle: identity.title,
    alumniOf: resume.education.filter(edu => edu.school !== 'Gap year').map(edu => ({ '@type': 'EducationalOrganization', name: edu.school })),
    knowsLanguage: resume.skills.find(s => s.group === 'Languages')?.items.map(lang => lang.split(' (')[0]),
    sameAs: socials.filter(s => s.href.startsWith('https://')).map(s => s.href),
  };
  const content = loadContent(root);
  return { identity, posts, routes, rss, sitemap, person, content };
}

export function renderPage(template, route, { identity, person, content, posts }) {
  const url = `${identity.url}/${route.path}`.replace(/\/404\.html$/, '/404');
  const image = `${identity.url}/og-image.png`;
  const p = route.post;
  const graph = [
    { '@type': 'WebSite', '@id': `${identity.url}/#website`, url: `${identity.url}/`, name: identity.shortName, alternateName: [identity.name, `${identity.shortName} (${identity.handle})`], inLanguage: 'en' },
    { ...person, '@context': undefined, '@id': `${identity.url}/#person`, image: `${identity.url}${identity.portraitDark}` },
    route.path === ''
      ? { '@type': 'ProfilePage', '@id': `${url}#page`, url, name: route.title, mainEntity: { '@id': `${identity.url}/#person` }, isPartOf: { '@id': `${identity.url}/#website` } }
      : { '@type': 'WebPage', '@id': `${url}#page`, url, name: route.title, description: route.description, isPartOf: { '@id': `${identity.url}/#website` },
          breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [{ name: identity.shortName, item: `${identity.url}/` }, ...(p ? [{ name: 'Field notes', item: `${identity.url}/blog` }] : []), { name: route.title.split(',')[0], item: url }].map((b, i) => ({ '@type': 'ListItem', position: i + 1, ...b })) } },
    ...(p ? [{ '@type': 'BlogPosting', headline: p.title, description: p.summary, datePublished: p.date || undefined, keywords: p.tags.join(', '), url, mainEntityOfPage: url, author: { '@id': `${identity.url}/#person` }, image }] : []),
  ];
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  const extraMeta = [
    `<meta name="author" content="${escapeHtml(identity.name)}" />`,
    `<meta name="robots" content="${route.path === '404.html' ? 'noindex' : 'index, follow, max-image-preview:large'}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(`${identity.shortName}: ${identity.tagline}`)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<link rel="me" href="https://github.com/kalebdida" />`,
    `<link rel="author" href="/humans.txt" />`,
    ...(p ? [`<meta property="article:published_time" content="${escapeHtml(p.date)}" />`, ...p.tags.map(t => `<meta property="article:tag" content="${escapeHtml(t)}" />`)] : []),
  ].join('\n    ');
  // idempotent: Vite renders the template once, then the route script renders each page again
  return template.replace(/\n?\s*<!--seo-->[\s\S]*?<!--\/seo-->/g, '').replace(/<!--pre-->[\s\S]*?<!--\/pre-->/g, '')
    .replace(/<title>.*?<\/title>/s, () => `<title>${escapeHtml(route.title)}</title>`)
    .replace(/(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(route.description))
    .replace(/(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(route.title))
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(url))
    .replace(/(<meta\s+property="og:type"\s+content=")[^"]*/g, (_, prefix) => prefix + (p ? 'article' : route.path === '' ? 'profile' : 'website'))
    .replace(/(<meta\s+property="og:site_name"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(identity.shortName))
    .replace(/(<meta\s+property="og:image"\s+content=")[^"]*/g, (_, prefix) => prefix + escapeHtml(image))
    .replace(/(<link rel="canonical" href=")[^"]*/g, (_, prefix) => prefix + escapeHtml(url))
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${jsonLd}</script>\n    <!--seo-->${extraMeta}<!--/seo-->`)
    .replace(/<div id="root"><\/div>/, () => `<div id="root"><!--pre-->${prerender(route, content, posts)}<!--/pre--></div>`);
}
