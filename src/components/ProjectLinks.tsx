import { ArrowUpRight, Github, Globe } from 'lucide-react';
import type { ProjectCaseFile } from '../data/siteData';

export function ProjectLinks({ project }: { project: ProjectCaseFile }) {
  return <div className="project-links">{project.links?.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="t-ui link">{link.href.startsWith('https://github.com/') ? <Github size={17} aria-hidden="true" /> : <Globe size={17} aria-hidden="true" />}{link.label}<ArrowUpRight size={15} aria-hidden="true" /></a>)}</div>;
}
