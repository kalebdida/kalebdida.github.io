import { useEffect, useRef } from 'react';
import { type ProjectCaseFile } from '../data/siteData';

interface ProjectDrawerProps {
  project: ProjectCaseFile | null;
  onClose: () => void;
}

export function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (project) {
      const t = window.setTimeout(() => closeRef.current?.focus(), 30);
      document.body.style.overflow = 'hidden';
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [project]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-night/70 backdrop-blur-[2px] fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`case file: ${project.title}`}
        className="term-in w-full max-w-[600px] h-full bg-night border-l border-hair overflow-y-auto"
        data-lenis-prevent
      >
        <div className="px-6 sm:px-12 pt-6 pb-16">
          <div className="flex items-center justify-between h-10">
            <span className="font-mono text-[12px] text-ash">
              case file {project.id.padStart(3, '0')} // {project.slug}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="close case file"
              className="t-meta text-ash hover:text-bone transition-colors flex items-center gap-2"
            >
              close
              <kbd className="font-mono text-[11px] px-1.5 py-px rounded border border-hair">esc</kbd>
            </button>
          </div>

          <header className="mt-14">
            <p className="t-meta text-ash">
              {project.kind}
              {project.year ? `, ${project.year}` : ''}
            </p>
            <h2 className="t-title text-bone mt-3">{project.title}</h2>
            <p className="t-meta mt-4 inline-flex items-center gap-2 text-ash">
              <span
                aria-hidden="true"
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  project.status === 'done' || project.status === 'presented' ? 'bg-ash' : 'bg-signal'
                }`}
              />
              {project.status}
            </p>
          </header>

          <p className="t-lead text-bone/90 mt-10">{project.whatItIs}</p>

          <section className="mt-12">
            <h3 className="t-meta text-ash">what exists</h3>
            <ul className="mt-4 space-y-3">
              {project.built.map((point, i) => (
                <li key={i} className="t-body text-bone/90 pl-5 relative">
                  <span aria-hidden="true" className="absolute left-0 top-[0.7em] w-2 h-px bg-ash" />
                  {point}
                </li>
              ))}
            </ul>
          </section>

          {project.next && project.next.length > 0 && (
            <section className="mt-12">
              <h3 className="t-meta text-ash">what’s next</h3>
              <ul className="mt-4 space-y-2">
                {project.next.map((point, i) => (
                  <li key={i} className="t-body text-ash pl-5 relative">
                    <span aria-hidden="true" className="absolute left-0 top-[0.7em] w-2 h-px bg-hair" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(project.role || (project.stack && project.stack.length > 0)) && (
            <dl className="mt-12 pt-6 border-t border-hair grid grid-cols-[7rem_1fr] gap-y-3 gap-x-6">
              {project.role && (
                <>
                  <dt className="t-meta text-ash">role</dt>
                  <dd className="t-ui text-bone">{project.role}</dd>
                </>
              )}
              {project.stack && project.stack.length > 0 && (
                <>
                  <dt className="t-meta text-ash">built with</dt>
                  <dd className="t-ui text-bone">{project.stack.join(', ')}</dd>
                </>
              )}
            </dl>
          )}

          {project.links && project.links.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {project.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="t-ui link"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
