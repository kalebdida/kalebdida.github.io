import { DecodeLabel } from './DecodeLabel';

export function NotFound({ onHome }: { onHome: () => void }) {
  return <section className="not-found max-w-6xl mx-auto px-6 min-h-svh flex flex-col justify-center py-32">
    <p className="t-meta text-ash mb-6">A small detour.</p><h1 className="t-display"><DecodeLabel text="404" /></h1>
    <p className="t-lead mt-8 max-w-[28ch]">This page wandered off. Follow the particles home.</p>
    <a href="/" data-magnetic className="pill-button t-ui mt-10 w-fit" onClick={event => { event.preventDefault(); onHome(); }}>Back home</a>
  </section>;
}
