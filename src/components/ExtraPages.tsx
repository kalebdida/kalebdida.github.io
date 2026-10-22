import { SITE_DATA } from '../data/siteData';
import { Arrow, RevealWords } from './Details';

interface ExtraPageProps { onNavigateHome: () => void; }

export function NowView({ onNavigateHome }: ExtraPageProps) {
  return <div className="max-w-3xl mx-auto px-6 pt-36 pb-28">
    <button type="button" onClick={onNavigateHome} className="t-meta link-quiet">Kal</button>
    <h1 data-reveal="words" className="t-title text-bone mt-4"><RevealWords text="Now" /></h1>
    <p data-reveal="words" className="t-lead text-ash mt-5"><RevealWords text={`What I’m doing this season: ${SITE_DATA.now.season.toLowerCase()}.`} /></p>
    <p data-reveal="up" className="t-meta text-ash mt-4"><span className="now-dot" aria-hidden="true" />Updated {SITE_DATA.now.updated}</p>
    <dl className="mt-14 space-y-4">
      {SITE_DATA.now.items.map(item => <div key={item.category} data-reveal="up" className="now-row grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-8 gap-y-3 items-baseline">
        <dt className="t-meta text-ash">{item.category}</dt><dd className="t-body text-bone">{item.detail}</dd>
      </div>)}
    </dl>
  </div>;
}

function ResumeHeading({ children }: { children: string }) {
  return <h2 data-reveal="words" className="resume-heading t-ui text-ash"><RevealWords text={children} /></h2>;
}

export function ResumeView({ onNavigateHome }: ExtraPageProps) {
  const { identity, resume, recognition } = SITE_DATA;
  return <div className="max-w-6xl mx-auto px-6 pt-32 pb-28 print:pt-0 print:pb-0">
    <div className="flex flex-wrap gap-4 items-center justify-between print:hidden">
      <button type="button" onClick={onNavigateHome} className="t-meta link-quiet">Kal</button>
      <button type="button" onClick={() => window.print()} className="pdf-button t-ui">Save as PDF <Arrow className="inline-block ml-2 align-middle" /></button>
    </div>
    <div className="resume-layout">
      <aside className="resume-sidebar"><div className="resume-sidebar-inner" data-lenis-prevent role="region" aria-label="Profile, contact, skills and languages" tabIndex={0}>
        <h1 data-reveal="words" className="t-title text-bone"><RevealWords text={identity.name} /></h1>
        <p lang="am" className="t-geez text-ash text-[1.5rem] mt-4">{identity.geezName}</p>
        <p data-reveal="up" className="t-lead text-bone mt-6">{resume.title}</p>
        <div className="resume-contact mt-6 space-y-2 t-ui text-ash">
          <p>{identity.city}</p>
          <p><a className="link" href={`mailto:${identity.email}`}>{identity.email}</a></p>
          <p><a className="link-quiet" href={identity.url}>kalebdida.github.io</a></p>
          {SITE_DATA.socials.filter(s => s.label === 'GitHub').map(s => <p key={s.href}><a className="link-quiet" href={s.href}>github.com/{s.handle}</a></p>)}
        </div>
        <section className="resume-skills">
          <ResumeHeading>Skills and languages</ResumeHeading>
          <dl className="space-y-5">{resume.skills.map(group => <div key={group.group} data-reveal="up">
            <dt className="t-meta text-ash">{group.group}</dt><dd className="t-ui text-bone mt-1">{group.items.join(', ')}</dd>
          </div>)}</dl>
        </section>
      </div></aside>
      <div>
        <section className="resume-section">
          <ResumeHeading>Education</ResumeHeading>
          {resume.education.map(edu => <div data-reveal="up" className="resume-item" key={edu.school}>
            <p className="t-meta text-ash mb-3">{edu.period}</p><h3 className="t-h3 text-bone">{edu.school}</h3>
            <p className="t-meta text-ash mt-2">{edu.place}</p><p className="t-ui text-ash mt-4 leading-relaxed">{edu.notes}</p>
          </div>)}
        </section>
        <section className="resume-section">
          <ResumeHeading>Activities and experience</ResumeHeading>
          {resume.experience.map(exp => <div data-reveal="up" className="resume-item" key={exp.org + exp.role}>
            <p className="t-meta text-ash mb-3"><span className="period-chip">{exp.when}</span></p>
            <h3 className="t-h3 text-bone">{exp.org}</h3><p className="t-ui text-bone mt-2">{exp.role}</p>
            <p className="t-ui text-ash mt-4 leading-relaxed">{exp.notes}</p>
          </div>)}
        </section>
        <section className="resume-section">
          <ResumeHeading>Honors and awards</ResumeHeading>
          <ul>{recognition.map(item => <li key={item.detail} data-reveal="up" className="resume-item t-ui">
            <span className="text-bone">{item.title}</span><p className="text-ash mt-2">{item.detail}</p>{item.scope && <span className="scope-pill mt-3">{item.scope}</span>}
          </li>)}</ul>
        </section>
      </div>
    </div>
  </div>;
}
