import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

export function VisitorCount({ relayUrl, siteUrl }: { relayUrl: string; siteUrl: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const liveSite = window.location.hostname === new URL(siteUrl).hostname;
  useEffect(() => {
    if (!relayUrl || !liveSite) return;
    setCount(null); setFailed(false);
    let mounted = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    fetch(`${relayUrl.replace(/\/$/, '')}/visits`, { signal: controller.signal, credentials: 'omit' })
      .then(async response => {
        if (!response.ok) throw new Error('Counter unavailable');
        const data = await response.json();
        if (!Number.isSafeInteger(data.count) || data.count < 0) throw new Error('Invalid count');
        if (mounted) setCount(data.count);
      }).catch(() => { if (mounted) setFailed(true); })
      .finally(() => clearTimeout(timeout));
    return () => { mounted = false; controller.abort(); clearTimeout(timeout); };
  }, [relayUrl, liveSite]);
  const status = !relayUrl ? 'Not connected yet' : !liveSite ? 'Available on the live site' : failed ? 'Count unavailable' : 'Loading…';
  return <div className="contact-card visitor-count-card" title="Page views, not unique people. Counting started October 24, 2026.">
    <dt className="t-meta text-ash flex items-center gap-2"><Eye size={19} strokeWidth={1.5} aria-hidden="true" />Page visits</dt>
    <dd className={`mt-2 ${count === null ? 't-ui text-ash' : 't-h3 text-bone'}`} aria-live="polite">{count === null ? status : count.toLocaleString()}</dd>
  </div>;
}
