// Build-time HTML for every route, so search engines, link previews and AI readers
// (ChatGPT, Gemini, Perplexity) see real text without running JavaScript.
// React replaces this markup on load, so visitors still get the full interactive site.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { escapeHtml as e } from './site-content.mjs';

const md = text => toHtml(toHast(fromMarkdown(text)));
const link = (href, label) => `<a href="${e(href)}"${href.startsWith('http') ? ' rel="me noopener"' : ''}>${e(label)}</a>`;
const list = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

export function loadContent(root) {
  const read = name => JSON.parse(readFileSync(join(root, 'content', `${name}.json`), 'utf8'));
  return { site: read('site'), projects: read('projects'), journey: read('journey'), recognition: read('recognition'), resume: read('resume') };
}

function nav() {
  return `<nav aria-label="Primary"><a href="/">Kaleb Dida</a> · <a href="/projects">Projects</a> · <a href="/blog">Field notes</a> · <a href="/now">Now</a> · <a href="/resume">Resume</a></nav>`;
}

function contact(site) {
  return `<section id="contact"><h2>Say hi</h2>${list(site.socials.map(s => `${e(s.label)}: ${link(s.href, s.handle)}`))}</section>`;
}

function postList(posts) {
  return list(posts.map(p => {
    const href = p.external?.url ?? `/blog/${p.slug}`;
    const where = p.external ? ` (on ${p.external.platform === 'medium' ? 'Medium' : 'Substack'})` : '';
    return `${link(href, p.title)}${where}. ${e(p.summary)}`;
  }));
}

export function prerender(route, { site, projects, journey, recognition, resume }, posts) {
  const { identity, about } = site;
  const head = `${nav()}`;
  let body = '';
  if (route.path === '') {
    body = `<header><h1>${e(identity.name)} <span lang="am">${e(identity.geezName)}</span></h1>
<p>${e(identity.tagline)}</p><p>${e(identity.intro)}</p></header>
<section id="about"><h2>About</h2><p>${e(about.lead)}</p>${about.paragraphs.map(p => `<p>${e(p)}</p>`).join('')}
<dl>${about.facts.map(f => `<dt>${e(f.key)}</dt><dd>${e(f.value)}</dd>`).join('')}</dl></section>
<section id="work"><h2>Work</h2>${list(projects.map(p => `<h3>${e(p.title)}</h3><p>${e(p.kind)}${p.year ? `, ${e(p.year)}` : ''}. ${e(p.summary)}</p>${p.stack?.length ? `<p>Built with ${e(p.stack.join(', '))}.</p>` : ''}${(p.links ?? []).map(l => link(l.href, l.label)).join(' ')}`))}</section>
<section id="journey"><h2>Journey</h2>${list(journey.map(j => `<strong>${e(j.when)}</strong>: ${e(j.title)}${j.place ? `, ${e(j.place)}` : ''}${j.note ? `. ${e(j.note)}` : ''}`))}</section>
<section id="recognition"><h2>Recognition</h2>${list(recognition.map(r => `<strong>${e(r.title)}</strong>, ${e(r.detail)}${r.scope ? ` (${e(r.scope)})` : ''}`))}</section>
<section id="field-notes"><h2>Field notes</h2>${postList(posts.slice(0, 6))}</section>${contact(site)}`;
  } else if (route.path === 'blog') {
    body = `<h1>Field notes</h1><p>${e(route.description)}</p>${postList(posts)}`;
  } else if (route.path === 'projects') {
    body = `<h1>Projects</h1>${projects.map(p => `<article><h2>${e(p.title)}</h2><p>${e(p.kind)}${p.year ? `, ${e(p.year)}` : ''}, ${e(p.status)}</p><p>${e(p.whatItIs)}</p>${p.built?.length ? `<h3>What exists</h3>${list(p.built.map(e))}` : ''}${p.next?.length ? `<h3>What's next</h3>${list(p.next.map(e))}` : ''}${p.role ? `<p>Role: ${e(p.role)}</p>` : ''}${(p.links ?? []).map(l => link(l.href, l.label)).join(' ')}</article>`).join('')}`;
  } else if (route.path === 'now') {
    body = `<h1>Now</h1><p>${e(site.now.season)}, updated ${e(site.now.updated)}.</p><dl>${site.now.items.map(i => `<dt>${e(i.category)}</dt><dd>${e(i.detail)}</dd>`).join('')}</dl>`;
  } else if (route.path === 'resume') {
    body = `<h1>${e(identity.name)}, resume</h1><p>${e(resume.title)}</p>
<h2>Education</h2>${list(resume.education.map(x => `<strong>${e(x.school)}</strong>, ${e(x.place)}. ${e(x.period)}. ${e(x.notes ?? '')}`))}
<h2>Activities and experience</h2>${list(resume.experience.map(x => `<strong>${e(x.org)}</strong>, ${e(x.role)} (${e(x.when)}). ${e(x.notes ?? '')}`))}
<h2>Honors and awards</h2>${list(recognition.map(r => `${e(r.title)}, ${e(r.detail)}`))}
<h2>Skills and languages</h2><dl>${resume.skills.map(s => `<dt>${e(s.group)}</dt><dd>${e(s.items.join(', '))}</dd>`).join('')}</dl>`;
  } else if (route.post) {
    const p = route.post;
    body = `<article><h1>${e(p.title)}</h1><p><time datetime="${e(p.date)}">${e(p.date)}</time> · ${e(p.tags.join(', '))}</p><p>${e(p.summary)}</p>${md(p.body)}</article>`;
  } else {
    body = `<h1>Page not found</h1><p>${link('/', 'Back to the home page')}</p>`;
  }
  return `<div class="prerender">${head}<main>${body}</main><footer><p>© ${new Date().getFullYear()} ${e(identity.name)} · ${link('/rss.xml', 'RSS')} · ${link('/llms.txt', 'llms.txt')}</p></footer></div>`;
}

/** plain-text summary for AI readers: https://llmstxt.org */
export function llmsTxt({ site, projects, journey, recognition }, posts) {
  const { identity, about } = site;
  return `# ${identity.name} (${identity.handle})

> ${identity.title} Based in ${identity.city}. ${identity.tagline}

${identity.intro}

${about.lead}

${about.paragraphs.join('\n\n')}

## Projects
${projects.map(p => `- [${p.title}](${identity.url}/projects): ${p.summary}`).join('\n')}

## Journey
${journey.map(j => `- ${j.when}: ${j.title}${j.note ? `. ${j.note}` : ''}`).join('\n')}

## Recognition
${recognition.map(r => `- ${r.title}, ${r.detail}${r.scope ? ` (${r.scope})` : ''}`).join('\n')}

## Field notes
${posts.map(p => `- [${p.title}](${p.external?.url ?? `${identity.url}/blog/${p.slug}`}): ${p.summary}`).join('\n')}

## Pages
- [Home](${identity.url}/)
- [Projects](${identity.url}/projects)
- [Field notes](${identity.url}/blog)
- [Now](${identity.url}/now)
- [Resume](${identity.url}/resume)

## Contact
${site.socials.filter(s => !s.href.startsWith('mailto:')).map(s => `- ${s.label}: ${s.href}`).join('\n')}
`;
}
