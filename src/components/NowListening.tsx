import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';

interface Track { name: string; artist: string; url: string; image: string | null; playing: boolean; at: number | null }

function ago(at: number) {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Live from Last.fm through the relay. Renders nothing until it has a real track. */
export function NowListening({ relayUrl, className = '' }: { relayUrl: string; className?: string }) {
  const [track, setTrack] = useState<Track | null>(null);
  useEffect(() => {
    if (!relayUrl || window.location.hostname !== 'kalebdida.github.io') return;
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      fetch(`${relayUrl.replace(/\/$/, '')}/listening`, { credentials: 'omit' })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (alive && data?.ok && data.track?.name) setTrack(data.track); })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 60000);
    document.addEventListener('visibilitychange', load);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', load); };
  }, [relayUrl]);
  if (!track) return null;
  return <div className={`contact-card listening-card ${className}`}>
    <dt className="t-meta text-ash flex items-center gap-2">
      {track.playing ? <span className="listening-bars" aria-hidden="true"><i /><i /><i /></span> : <Music size={19} strokeWidth={1.5} aria-hidden="true" />}
      {track.playing ? 'Listening now' : `Last played${track.at ? `, ${ago(track.at)}` : ''}`}
    </dt>
    <dd className="mt-2 flex items-center gap-3 min-w-0">
      {track.image && <img src={track.image} alt="" width={40} height={40} loading="lazy" className="w-10 h-10 rounded-[4px] object-cover shrink-0" />}
      <a href={track.url} target="_blank" rel="noopener noreferrer" className="t-ui link min-w-0 truncate" title={`${track.name} by ${track.artist}`}>
        {track.name} <span className="text-ash">· {track.artist}</span>
      </a>
    </dd>
  </div>;
}
