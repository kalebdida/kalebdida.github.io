import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import type { GalleryItem } from '../data/siteData';
import { useDialog } from '../utils/useDialog';
import { Photo } from './Photo';

export default function GalleryLightbox({ photos, initialIndex, onClose }: { photos: GalleryItem[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const dialog = useDialog(true, onClose);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const change = (by: number) => setIndex(current => (current + by + photos.length) % photos.length);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); change(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photos.length]);
  const photo = photos[index];
  return createPortal(<div className="lightbox-backdrop fade-in" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-label="Moments gallery" data-gallery-dialog data-lenis-prevent className="gallery-lightbox">
      <div className="lightbox-toolbar t-meta"><span>{index + 1} / {photos.length}</span><button type="button" onClick={onClose} className="link lightbox-close">Close <kbd>Esc</kbd></button></div>
      <figure onPointerDown={event => { touch.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={event => {
        if (!touch.current) return;
        const dx = event.clientX - touch.current.x, dy = event.clientY - touch.current.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) change(dx < 0 ? 1 : -1);
        touch.current = null;
      }} onPointerCancel={() => { touch.current = null; }}>
        <Photo key={photo.image} src={photo.image} alt={photo.caption || 'Gallery photograph'} sizes="100vw" eager className="lightbox-image" />
        <figcaption className="lightbox-caption" aria-live="polite"><p className="t-ui">{photo.caption}</p><p className="t-meta text-ash mt-2">{[photo.location, photo.date, photo.tag].filter(Boolean).join(' · ')}</p></figcaption>
      </figure>
      {photos.length > 1 && <div className="lightbox-navigation t-ui"><button type="button" className="pill-button" onClick={() => change(-1)}>Previous</button><span className="t-meta text-ash">Arrow keys or swipe</span><button type="button" className="pill-button" onClick={() => change(1)}>Next</button></div>}
    </div>
  </div>, document.body);
}
