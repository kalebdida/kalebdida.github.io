import { useEffect, useMemo, useState } from 'react';
import { SITE_DATA, type BlogPost } from '../data/siteData';
import { filterAndGroupPosts } from '../utils/logic';
import { NoteCard } from './NoteCard';

interface BlogIndexProps {
  onSelectPost: (slug: string) => void;
  onNavigateHome: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
}

function postMeta(post: BlogPost): string {
  return post.status === 'outline' ? 'outline, not written yet' : `${post.readingTimeMin ?? 1} min read`;
}

export function BlogIndexView({ onSelectPost, onNavigateHome }: BlogIndexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    SITE_DATA.posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return ['all', ...Array.from(set)];
  }, []);

  const grouped = useMemo(
    () => filterAndGroupPosts(SITE_DATA.posts, searchQuery, activeTag),
    [searchQuery, activeTag],
  );

  return (
    <div className="max-w-3xl mx-auto px-6 pt-36 pb-28">
      <button type="button" onClick={onNavigateHome} className="t-meta link-quiet">
        kal
      </button>
      <h1 className="t-title text-bone mt-4">field notes</h1>
      <p className="t-lead text-ash mt-5 max-w-[40ch]">
        writing on building things, minds, and what i learn along the way. some live here, some on medium and substack.
      </p>

      <div className="mt-14 flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-hair">
        <label className="flex-1 max-w-sm">
          <span className="sr-only">search field notes</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search"
            className="w-full bg-transparent border-b border-hair focus:border-ash py-2 t-ui text-bone placeholder:text-ash/70 outline-none focus-visible:outline-none transition-colors"
          />
        </label>
        <div role="group" aria-label="filter by tag" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(tag)}
              className={`t-meta transition-colors ${
                activeTag === tag ? 'text-bone underline underline-offset-4 decoration-ash' : 'text-ash hover:text-bone'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="py-16">
          <p className="t-body text-ash">nothing matches that search.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTag('all');
            }}
            className="t-ui link mt-3"
          >
            clear the search
          </button>
        </div>
      ) : (
        <div className="mt-6">
          {grouped.map((group) => (
            <section key={group.year} aria-label={`posts from ${group.year}`} className="mt-8">
              <h2 className="t-meta text-ash">{group.year}</h2>
              <ul className="mt-2">
                {group.posts.map((post) => (
                  <li key={post.slug} className="border-t border-hair first:border-t-0">
                    <NoteCard post={post} onOpen={onSelectPost} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-16 pt-6 border-t border-hair t-meta text-ash">
        <a href="/rss.xml" className="link-quiet">
          subscribe with rss
        </a>
      </div>
    </div>
  );
}

interface BlogPostViewProps {
  post: BlogPost;
  onBackToIndex: () => void;
  onSelectPost: (slug: string) => void;
}

export function BlogPostView({ post, onBackToIndex, onSelectPost }: BlogPostViewProps) {
  const [readProgress, setReadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const postIndex = SITE_DATA.posts.findIndex((p) => p.slug === post.slug);
  const olderPost = postIndex < SITE_DATA.posts.length - 1 ? SITE_DATA.posts[postIndex + 1] : null;
  const newerPost = postIndex > 0 ? SITE_DATA.posts[postIndex - 1] : null;

  useEffect(() => {
    const updateProgress = () => {
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setReadProgress(Math.min(1, Math.max(0, window.scrollY / docHeight)));
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, [post.slug]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/blog/${post.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="max-w-3xl mx-auto px-6 pt-36 pb-28">
      <div aria-hidden="true" className="fixed top-16 left-0 right-0 h-px z-40 pointer-events-none">
        <div
          data-testid="reading-progress-bar"
          className="h-full bg-signal/70 origin-left"
          style={{ transform: `scaleX(${readProgress})` }}
        />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            datePublished: post.date,
            description: post.summary,
            author: { '@type': 'Person', name: SITE_DATA.identity.name, url: SITE_DATA.identity.url },
          }),
        }}
      />

      <button type="button" onClick={onBackToIndex} className="t-meta link-quiet">
        field notes
      </button>

      <h1 className="t-title text-bone mt-4">{post.title}</h1>
      <p className="t-lead text-ash mt-5 max-w-[40ch]">{post.summary}</p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 t-meta text-ash">
        <span>{formatDate(post.date)}</span>
        <span>{postMeta(post)}</span>
        <button type="button" onClick={handleCopyLink} className="link-quiet">
          {copied ? 'link copied' : 'copy link'}
        </button>
      </div>

      {post.status === 'outline' && (
        <p className="mt-12 t-ui text-ash border-l border-signal/50 pl-4 max-w-[52ch]">
          this note is still an outline. the full piece is coming.
        </p>
      )}

      {post.sections.length > 2 && (
        <nav aria-label="contents" className="mt-12">
          <h2 className="t-meta text-ash">contents</h2>
          <ol className="mt-3 space-y-1.5">
            {post.sections.map((sec) => (
              <li key={sec.id}>
                <a href={`#${sec.id}`} className="t-ui link-quiet">
                  {sec.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="prose-kal mt-14 space-y-12 text-bone">
        {post.sections.map((sec) => (
          <section key={sec.id} id={sec.id} className="scroll-mt-28">
            <h2 className="t-h2 text-bone">{sec.heading}</h2>
            <ul className="mt-5 space-y-2">
              {sec.outlinePoints.map((pt, idx) => (
                <li key={idx} className="pl-5 relative text-bone/85">
                  <span aria-hidden="true" className="absolute left-0 top-[0.8em] w-2 h-px bg-ash" />
                  {pt}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <nav aria-label="more field notes" className="mt-20 pt-8 border-t border-hair grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          {olderPost && (
            <button type="button" onClick={() => onSelectPost(olderPost.slug)} className="group text-left">
              <span className="t-meta text-ash block">older</span>
              <span className="font-serif text-[1.1875rem] text-bone group-hover:text-signal transition-colors mt-1 block">
                {olderPost.title}
              </span>
            </button>
          )}
        </div>
        <div className="sm:text-right">
          {newerPost && (
            <button type="button" onClick={() => onSelectPost(newerPost.slug)} className="group text-left sm:text-right">
              <span className="t-meta text-ash block">newer</span>
              <span className="font-serif text-[1.1875rem] text-bone group-hover:text-signal transition-colors mt-1 block">
                {newerPost.title}
              </span>
            </button>
          )}
        </div>
      </nav>
    </article>
  );
}
