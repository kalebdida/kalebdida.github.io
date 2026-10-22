import { Arrow } from './Details';
import { type BlogPost } from '../data/siteData';

function meta(post: BlogPost): string {
  if (post.external) return `On ${post.external.platform === 'medium' ? 'Medium' : 'Substack'}`;
  if (post.status === 'outline') return 'Outline, not written yet';
  return `${post.readingTimeMin ?? 1} min read`;
}

export function NoteCard({ post, onOpen }: { post: BlogPost; onOpen: (slug: string) => void }) {
  const body = <>
    <span className="min-w-0">
      <span className="t-h3 text-bone group-hover:text-signal transition-colors">{post.title}{post.external && <Arrow className="inline-block ml-2 text-ash" />}</span>
      <span className="block t-body text-ash mt-2 max-w-[56ch]">{post.summary}</span>
      <span className="block t-meta text-ash mt-3">{meta(post)}</span>
    </span>
    <span className="note-cover" aria-hidden="true">
      {post.thumbnail ? <img src={post.thumbnail} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 transition duration-700 group-hover:opacity-100 group-hover:scale-[1.04]" /> : <>
        <span className="note-initials">{post.title.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}</span>
        <span className="note-tag">{post.tags[0]}</span>
      </>}
    </span>
  </>;
  const cls = 'note-card group w-full text-left py-8 flex items-start justify-between gap-6';
  return post.external ? <a href={post.external.url} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a> :
    <a href={`/blog/${post.slug}`} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onOpen(post.slug); } }} className={cls}>{body}</a>;
}
