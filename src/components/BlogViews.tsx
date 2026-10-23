import { useEffect, useMemo, useState } from 'react';
import { SITE_DATA, type BlogPost } from '../data/siteData';
import { filterAndGroupPosts } from '../utils/logic';
import ReactMarkdown from 'react-markdown';
import { RevealWords } from './Details';
import { NoteCard } from './NoteCard';

interface BlogIndexProps {
  onSelectPost: (slug: string) => void;
  onNavigateHome: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function postMeta(post: BlogPost): string {
  return post.status === 'outline' ? 'Note in progress' : `${post.readingTimeMin ?? 1} min read`;
}

export function BlogIndexView({ onSelectPost, onNavigateHome }: BlogIndexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    SITE_DATA.posts.filter(p => !p.draft).forEach((p) => p.tags.forEach((t) => set.add(t)));
    return ['all', ...Array.from(set)];
  }, []);

  const grouped = useMemo(
    () => filterAndGroupPosts(SITE_DATA.posts, searchQuery, activeTag),
    [searchQuery, activeTag],
  );

  return (
    <div className="max-w-3xl mx-auto px-6 pt-36 pb-28">
      <button type="button" onClick={onNavigateHome} className="t-meta link-quiet">
        Kal
      </button>
      <h1 data-reveal="words" className="t-title text-bone mt-4"><RevealWords text="Field notes" /></h1>
      <p className="t-lead text-ash mt-5 max-w-[40ch]">
        Writing on building things, minds, and what I learn along the way. Some live here, some on Medium and Substack.
      </p>

      <div className="mt-14 flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-hair">
        <label className="flex-1 max-w-sm">
          <span className="sr-only">Search field notes</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent border-b border-hair focus:border-ash py-2 t-ui text-bone placeholder:text-ash transition-colors"
          />
        </label>
        <div role="group" aria-label="Filter by tag" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {allTags.map((tag) => (
            <button
              key={tag === 'all' ? 'All' : tag}
              type="button"
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(tag)}
              className={`t-meta transition-colors ${
                activeTag === tag ? 'text-bone underline underline-offset-4 decoration-ash' : 'text-ash hover:text-bone'
              }`}
            >
              {tag === 'all' ? 'All' : tag}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="py-16">
          <p className="t-body text-ash">{searchQuery || activeTag !== 'all' ? 'Nothing matches that search.' : 'New notes coming soon.'}</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTag('all');
            }}
            className="t-ui link mt-3"
          >
            Clear the search
          </button>
        </div>
      ) : (
        <div className="mt-6">
          {grouped.map((group) => (
            <section key={group.year} aria-label={`Posts from ${group.year}`} className="mt-8">
              <h2 className="t-meta text-ash">{group.year}</h2>
              <ul className="mt-2">
                {group.posts.map((post) => (
                  <li key={post.slug} data-reveal="up" className="border-t border-hair first:border-t-0">
                    <NoteCard post={post} onOpen={onSelectPost} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

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

  const localPosts = SITE_DATA.posts.filter(p => !p.draft && !p.external);
  const postIndex = localPosts.findIndex((p) => p.slug === post.slug);
  const olderPost = postIndex < localPosts.length - 1 ? localPosts[postIndex + 1] : null;
  const newerPost = postIndex > 0 ? localPosts[postIndex - 1] : null;

  useEffect(() => {
    const updateProgress = () => {
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setReadProgress(Math.min(1, Math.max(0, window.scrollY / docHeight)));
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, [post.slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };
  let headingIndex = 0;

  return (
    <article className="max-w-3xl mx-auto px-6 pt-36 pb-28">
      <div aria-hidden="true" className="fixed top-16 left-0 right-0 h-px z-40 pointer-events-none">
        <div
          data-testid="reading-progress-bar"
          className="h-full bg-signal/70 origin-left"
          style={{ width: `${readProgress * 100}%` }}
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
          }).replace(/</g, '\u003c'),
        }}
      />

      <button type="button" onClick={onBackToIndex} className="t-meta link-quiet">
        Field notes
      </button>

      <h1 data-reveal="words" className="t-title text-bone mt-4"><RevealWords text={post.title} /></h1>
      <p data-reveal="words" className="t-lead text-ash mt-5 max-w-[40ch]"><RevealWords text={post.summary} /></p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 t-meta text-ash">
        <span>{formatDate(post.date)}</span>
        <span>{postMeta(post)}</span>
        <button type="button" onClick={handleCopyLink} className="link-quiet">
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>

      {post.status === 'outline' && (
        <p data-reveal="up" className="outline-callout mt-12 t-ui text-ash max-w-[52ch]">
          New notes coming soon. Here’s what I’m thinking about.
        </p>
      )}

      {post.sections.length > 2 && (
        <nav aria-label="Contents" className="mt-12">
          <h2 className="t-meta text-ash">Contents</h2>
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

      <div className="prose-kal mt-14 text-bone">
        <ReactMarkdown skipHtml components={{
          h2: ({ children }) => <h2 data-reveal="up" id={post.sections[headingIndex++]?.id}>{children}</h2>,
          a: ({ href, children }) => <a href={href} target={href?.startsWith('https://') ? '_blank' : undefined} rel={href?.startsWith('https://') ? 'noopener noreferrer' : undefined}>{children}</a>,
          img: ({ src, alt }) => <img src={src} alt={alt ?? ''} loading="lazy" />,
        }}>{post.body}</ReactMarkdown>
      </div>

      <nav aria-label="More field notes" className="mt-20 pt-8 border-t border-hair grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          {olderPost && (
            <button type="button" onClick={() => onSelectPost(olderPost.slug)} className="group text-left">
              <span className="t-meta text-ash block">Older</span>
              <span className="font-serif text-[1.1875rem] text-bone group-hover:text-signal transition-colors mt-1 block">
                {olderPost.title}
              </span>
            </button>
          )}
        </div>
        <div className="sm:text-right">
          {newerPost && (
            <button type="button" onClick={() => onSelectPost(newerPost.slug)} className="group text-left sm:text-right">
              <span className="t-meta text-ash block">Newer</span>
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
