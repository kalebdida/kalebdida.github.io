import { type BlogPost } from '../data/siteData';

function meta(post: BlogPost): string {
  if (post.external) return `on ${post.external.platform}`;
  if (post.status === 'outline') return 'outline, not written yet';
  return `${post.readingTimeMin ?? 1} min read`;
}

/** one field note: your own post (opens here) or a medium / substack piece (opens there) */
export function NoteCard({ post, onOpen }: { post: BlogPost; onOpen: (slug: string) => void }) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="t-h3 text-bone group-hover:text-signal transition-colors">
          {post.title}
          {post.external && (
            <span aria-hidden="true" className="ml-2 text-ash text-[0.8em] align-baseline">
              ↗
            </span>
          )}
        </span>
        <span className="block t-body text-ash mt-2 max-w-[56ch]">{post.summary}</span>
        <span className="block t-meta text-ash/80 mt-3">{meta(post)}</span>
      </span>
      {post.thumbnail && (
        <span className="hidden sm:block shrink-0 w-40 h-[6.5rem] overflow-hidden rounded-md border border-hair">
          <img
            src={post.thumbnail}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-80 grayscale-[35%] transition duration-700 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-[1.04]"
          />
        </span>
      )}
    </>
  );
  const cls = 'group w-full text-left py-7 flex items-start justify-between gap-6';
  return post.external ? (
    <a href={post.external.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={() => onOpen(post.slug)} className={cls}>
      {body}
    </button>
  );
}
