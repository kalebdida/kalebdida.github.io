import { lazy, Suspense, useState, type PointerEvent } from 'react';
import { SITE_DATA } from '../data/siteData';
import { Photo } from './Photo';
import { Arrow } from './Details';
const Lightbox = lazy(() => import('./GalleryLightbox'));

function tilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--tilt-x', `${(event.clientY - rect.top - rect.height / 2) / rect.height * -5}deg`);
  event.currentTarget.style.setProperty('--tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 5}deg`);
}

export function Gallery() {
  const [active, setActive] = useState<number | null>(null);
  const photos = SITE_DATA.gallery;
  if (!photos.length) return <div className="gallery-empty" data-testid="gallery-empty" data-reveal="up">
    <div className="empty-photo-stack" aria-hidden="true"><i /><i /><i /><svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor"><rect x="9" y="12" width="46" height="40" rx="2"/><circle cx="23" cy="25" r="4"/><path d="m10 46 14-13 10 8 9-13 12 18"/></svg></div>
    <p className="t-h3">A space for moments.</p><p className="t-body text-ash mt-3">Photographs will find their way here.</p>
  </div>;
  return <>
    <div className="gallery-grid" data-testid="gallery-grid">
      {photos.map((photo, index) => <figure className="gallery-card" data-reveal="up" key={`${photo.image}-${index}`}>
        <button type="button" className="gallery-photo" data-cursor="Open" onPointerMove={tilt} onPointerLeave={event => { event.currentTarget.style.setProperty('--tilt-x', '0deg'); event.currentTarget.style.setProperty('--tilt-y', '0deg'); }} onClick={() => setActive(index)} aria-label={`View photo${photo.caption ? `: ${photo.caption}` : ` ${index + 1}`}`}>
          <Photo src={photo.image} alt={photo.caption || 'Gallery photograph'} />
          <span className="photo-open t-meta" aria-hidden="true">View photo <Arrow className="inline-block ml-2 align-middle" /></span>
        </button>
        {(photo.caption || photo.location) && <figcaption className="mt-4"><p className="t-ui">{photo.caption}</p>{photo.location && <p className="t-meta text-ash mt-1">{photo.location}</p>}</figcaption>}
      </figure>)}
    </div>
    {active !== null && <Suspense fallback={<p role="status" className="copy-toast t-ui">Opening photograph…</p>}><Lightbox photos={photos} initialIndex={active} onClose={() => setActive(null)} /></Suspense>}
  </>;
}
