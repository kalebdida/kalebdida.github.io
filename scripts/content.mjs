import { parse } from 'yaml';
import { fromMarkdown } from 'mdast-util-from-markdown';

export function headingId(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
}

/** Shared by Vite, route generation and tests. Markdown never enables raw HTML. */
export function parsePost(slug, raw) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid post slug: ${slug}`);
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${slug}: Markdown needs YAML frontmatter`);
  const data = parse(match[1], { maxAliasCount: 20 });
  for (const field of ['title', 'summary']) {
    if (typeof data?.[field] !== 'string' || !data[field].trim()) throw new Error(`${slug}: missing ${field}`);
  }
  const date = data.date ?? '';
  if (typeof date !== 'string' || (!date && !data.external_url) || (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date))) throw new Error(`${slug}: use a valid YYYY-MM-DD date`);
  if (!['outline', 'published'].includes(data.status)) throw new Error(`${slug}: invalid status`);
  if (typeof data.draft !== 'boolean') throw new Error(`${slug}: draft must be a boolean`);
  if (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string')) throw new Error(`${slug}: tags must be a list of strings`);
  if (data.external_url && (!/^https:\/\//i.test(data.external_url) || !['medium', 'substack'].includes(data.external_platform))) throw new Error(`${slug}: external posts need an HTTPS URL and platform`);
  if (data.external_url) new URL(data.external_url);
  const body = match[2].trim();
  const usedIds = new Map();
  const textContent = node => node.value ?? node.children?.map(textContent).join('') ?? '';
  const sections = fromMarkdown(body).children.filter(node => node.type === 'heading' && node.depth === 2).map(node => {
    const heading = textContent(node);
    const base = headingId(heading);
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    return { id: count ? `${base}-${count + 1}` : base, heading, outlinePoints: [] };
  });
  return {
    slug, title: data.title, date, year: date ? date.slice(0, 4) : data.external_platform === 'substack' ? 'On Substack' : 'On Medium', summary: data.summary,
    tags: data.tags, draft: data.draft, status: data.status, thumbnail: data.thumbnail || undefined,
    external: data.external_url ? { url: data.external_url, platform: data.external_platform } : undefined,
    body, sections, readingTimeMin: Math.max(1, Math.ceil(body.split(/\s+/).length / 200)),
  };
}
