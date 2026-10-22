import type { BlogPost } from '../data/siteData';
import { CTF } from '../data/constants';
import site from '../../content/site.json';

/**
 * live time in adama + today's date in the ethiopian calendar,
 * e.g. { time: '7:55 pm', ethDate: 'tekemt 12, 2019' }
 */
export function adamaClock(now: Date = new Date()): { time: string; ethDate: string } {
  const tz = site.identity.timeZone;
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(now);

  let ethDate = '';
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-ethiopic', {
      timeZone: tz,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const month = get('month');
    const day = get('day');
    const year = get('year');
    if (month && day && year) ethDate = `${month} ${day}, ${year}`;
  } catch {
    ethDate = '';
  }
  return { time, ethDate };
}

/** true when the text is the full 3-piece ctf flag */
export function verifyCtfFlag(input: string): boolean {
  return input.trim() === CTF.fullFlag;
}

/**
 * Filters blog posts by search query and optional tag, returning posts grouped by year descending.
 */
export function filterAndGroupPosts(
  posts: BlogPost[],
  searchQuery: string,
  activeTag: string | null,
): { year: string; posts: BlogPost[] }[] {
  const q = searchQuery.trim().toLowerCase();

  const filtered = posts.filter((post) => {
    if (post.draft) return false;
    if (activeTag && activeTag !== 'all' && !post.tags.includes(activeTag)) return false;
    if (!q) return true;
    return (
      post.title.toLowerCase().includes(q) ||
      post.summary.toLowerCase().includes(q) ||
      post.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const groups = new Map<string, BlogPost[]>();
  for (const post of sorted) {
    const list = groups.get(post.year) ?? [];
    list.push(post);
    groups.set(post.year, list);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, yearPosts]) => ({ year, posts: yearPosts }));
}

export type KeystrokeTrigger = 'siuuu' | 'flag' | null;

/**
 * rolling buffer of what the visitor types anywhere on the page.
 * "siuuu" shows a tiny toast; typing the full ctf flag unlocks the thank-you note.
 */
export function updateKeystrokeBuffer(
  currentBuffer: string,
  key: string,
): { nextBuffer: string; triggered: KeystrokeTrigger } {
  if (key.length !== 1) return { nextBuffer: currentBuffer, triggered: null };
  const nextBuffer = (currentBuffer + key.toLowerCase()).slice(-64);
  if (nextBuffer.endsWith(CTF.fullFlag)) return { nextBuffer: '', triggered: 'flag' };
  if (nextBuffer.endsWith('siuuu')) return { nextBuffer: '', triggered: 'siuuu' };
  return { nextBuffer, triggered: null };
}
