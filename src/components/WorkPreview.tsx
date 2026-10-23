import { forwardRef } from 'react';
import type { ProjectCaseFile } from '../data/siteData';
import { Photo } from './Photo';

export const WorkPreview = forwardRef<HTMLDivElement, { project: ProjectCaseFile | null }>(function WorkPreview({ project }, ref) {
  return <div ref={ref} className={`floating-preview ${project ? 'is-visible' : ''}`} aria-hidden="true">
    {project && <>{project.photo ? <Photo src={project.photo} alt="" sizes="280px" className="project-preview-photo" /> : <div className="project-generated-cover"><span>{project.title.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</span><svg viewBox="0 0 260 150" fill="none"><ellipse cx="130" cy="75" rx="82" ry="30" stroke="currentColor"/><ellipse cx="130" cy="75" rx="30" ry="62" stroke="currentColor"/><circle cx="130" cy="75" r="49" stroke="currentColor"/></svg></div>}
      <div className="preview-caption"><p className="t-ui">{project.title}</p><p className="t-meta text-ash mt-2">{[project.kind, project.year].filter(Boolean).join(' · ')}</p><span className="status-pill mt-3">{project.status}</span></div></>}
  </div>;
});
