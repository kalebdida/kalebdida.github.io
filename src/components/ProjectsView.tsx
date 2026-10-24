import { useState } from 'react';
import { ArrowUpRight, Github, Play, X } from 'lucide-react';
import { SITE_DATA, type ProjectCaseFile } from '../data/siteData';
import { Photo } from './Photo';
import { ProjectLinks } from './ProjectLinks';

function ProjectCard({ project, onOpen }: { project: ProjectCaseFile; onOpen: () => void }) {
  const [preview, setPreview] = useState(false);
  return <article className="project-overview-card" data-reveal="up">
    <div className="project-window-bar t-meta text-ash"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>{project.liveUrl ? new URL(project.liveUrl).hostname : project.kind}</span></div>
    <div className="project-window">
      {project.liveUrl && preview ? <iframe title={`${project.title} live homepage preview`} src={project.liveUrl} loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms" referrerPolicy="no-referrer" /> : project.photo ? <Photo src={project.photo} alt={`${project.title} project preview`} /> : <div className={`project-cover project-cover-${project.slug}`} aria-hidden="true"><span className="project-cover-orbit" /><span className="project-cover-orbit orbit-two" /><span className="project-cover-initials">{project.title.split(/\s+/).slice(0, 2).map(word => word[0]).join('')}</span><span className="project-cover-caption t-meta">{project.kind}</span></div>}
    </div>
    {project.liveUrl && <div className="project-preview-controls"><button type="button" className="t-meta link-quiet" onClick={() => setPreview(value => !value)}>{preview ? <X size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{preview ? 'Close preview' : 'Preview homepage'}</button><span className="t-meta text-ash">{preview ? 'Live site · may take a moment to load' : 'Load the actual app here'}</span></div>}
    <div className="project-card-copy"><p className="t-meta text-ash">{project.id} / {project.status}</p><h2 className="t-h2 mt-3">{project.title}</h2><p className="t-ui text-ash mt-4">{project.summary}</p><button type="button" className="t-ui link mt-6" onClick={onOpen}>Read case file <ArrowUpRight size={16} aria-hidden="true" /></button><ProjectLinks project={project} /></div>
  </article>;
}

export default function ProjectsView({ onHome, onOpen }: { onHome: () => void; onOpen: (project: ProjectCaseFile) => void }) {
  return <div className="max-w-6xl mx-auto px-6 pt-32 pb-28">
    <button type="button" className="t-meta link-quiet" onClick={onHome}>← Back to Kal</button>
    <header className="projects-heading"><div><p className="t-meta text-ash">The things I’m making</p><h1 className="t-title mt-4">Projects</h1><p className="t-lead text-ash mt-5 max-w-[40ch]">Apps, experiments, and research. A look inside the work, with links to try it or read the code.</p></div><a href="https://github.com/kalebdida?tab=repositories" target="_blank" rel="noopener noreferrer" className="t-ui link"><Github size={18} aria-hidden="true" />All repositories <ArrowUpRight size={16} aria-hidden="true" /></a></header>
    <div className="projects-grid">{SITE_DATA.projects.map(project => <ProjectCard key={project.id} project={project} onOpen={() => onOpen(project)} />)}</div>
  </div>;
}
