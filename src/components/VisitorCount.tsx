import { useState } from 'react';

// A real shared counter; no locally generated or invented visitor numbers.
const BADGE = 'https://hits.dwyl.com/kalebdida/portfolio-site-20261024.svg?style=flat-square';

export function VisitorCount({ siteUrl }: { siteUrl: string }) {
  const [failed, setFailed] = useState(false);
  // Local previews must not inflate the public counter.
  if (window.location.hostname !== new URL(siteUrl).hostname) return null;
  return <span className="visitor-count" title="Page views counted from October 24, 2026. This is not a unique-person count.">
    <span>Page visits</span>
    {failed ? <span className="t-meta">Count unavailable</span> : <a href={BADGE} target="_blank" rel="noopener noreferrer" aria-label="Open live page-visit count"><img src={BADGE} alt="Live site visit count" width="88" height="24" referrerPolicy="no-referrer" onError={() => setFailed(true)} /></a>}
  </span>;
}
