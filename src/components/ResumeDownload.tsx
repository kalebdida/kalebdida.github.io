import type { ReactNode } from 'react';

export function ResumeDownload({ className = 'link t-ui', children = 'Full resume' }: { className?: string; children?: ReactNode }) {
  return <a href="/kaleb-dida-resume.pdf" download="Kaleb-Dida-Resume.pdf" className={className}>{children}</a>;
}
