import photos from 'virtual:photos';

export function Photo({ src, alt, className = '', sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', eager = false }: { src: string; alt: string; className?: string; sizes?: string; eager?: boolean }) {
  const meta = photos[src];
  return <img src={src} srcSet={meta?.srcSet} sizes={meta ? sizes : undefined} width={meta?.width} height={meta?.height} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} className={className} />;
}
