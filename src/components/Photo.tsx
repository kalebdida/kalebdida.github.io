import photos from 'virtual:photos';

export function Photo({ src, alt, className = '', sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', eager = false }: { src: string; alt: string; className?: string; sizes?: string; eager?: boolean }) {
  const meta = photos[src];
  const best = meta?.srcSet.split(', ').at(-1)?.split(' ')[0];
  return <img src={best ?? src} srcSet={meta?.srcSet} sizes={meta ? sizes : undefined} width={meta?.width} height={meta?.height} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" draggable={false} className={className} />;
}
