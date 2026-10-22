import { SITE_DATA } from '../data/siteData';

interface ExtraPageProps {
  onNavigateHome: () => void;
}

export function NowView({ onNavigateHome }: ExtraPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-36 pb-28">
      <button type="button" onClick={onNavigateHome} className="t-meta link-quiet">
        kal
      </button>
      <h1 className="t-title text-bone mt-4">now</h1>
      <p className="t-lead text-ash mt-5">what i’m doing this season: {SITE_DATA.now.season}.</p>
      <p className="t-meta text-ash mt-3">updated {SITE_DATA.now.updated}</p>

      <dl className="mt-14 border-b border-hair">
        {SITE_DATA.now.items.map((item) => (
          <div
            key={item.category}
            className="border-t border-hair py-6 grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-8 gap-y-1 items-baseline"
          >
            <dt className="t-meta text-ash">{item.category}</dt>
            <dd className="t-body text-bone">{item.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ResumeHeading({ children }: { children: string }) {
  return <h2 className="t-meta text-ash print:text-black/60">{children}</h2>;
}

export function ResumeView({ onNavigateHome }: ExtraPageProps) {
  const { identity, resume, recognition } = SITE_DATA;

  return (
    <div className="max-w-3xl mx-auto px-6 pt-36 pb-28 print:pt-0 print:pb-0 print:text-black">
      <div className="flex items-center justify-between print:hidden">
        <button type="button" onClick={onNavigateHome} className="t-meta link-quiet">
          kal
        </button>
        <button type="button" onClick={() => window.print()} className="t-ui link">
          save as pdf
        </button>
      </div>

      <header className="mt-6 pb-10 border-b border-hair print:border-black/20 print:mt-0">
        <h1 className="t-title text-bone print:text-black">
          {identity.name.toLowerCase()}
          <span className="t-geez text-ash text-[1.1875rem] ml-4 align-middle print:text-black/60">
            {identity.geezName}
          </span>
        </h1>
        <p className="t-lead text-bone mt-4 print:text-black">{resume.title}</p>
        <p className="t-ui text-ash mt-3 print:text-black/70">
          {identity.city} · {identity.email} · kalebdida.github.io · github.com/kalebdida
        </p>
      </header>

      <section className="mt-10">
        <ResumeHeading>education</ResumeHeading>
        <div className="mt-4 space-y-5">
          {resume.education.map((edu) => (
            <div key={edu.school}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="font-serif text-[1.25rem] text-bone print:text-black">
                  {edu.school}
                  <span className="text-ash print:text-black/60">, {edu.place}</span>
                </h3>
                <span className="t-meta text-ash print:text-black/60">{edu.period}</span>
              </div>
              {edu.notes && <p className="t-ui text-ash mt-1 print:text-black/80">{edu.notes}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 pt-8 border-t border-hair print:border-black/20">
        <ResumeHeading>activities and experience</ResumeHeading>
        <div className="mt-4 space-y-6">
          {resume.experience.map((exp) => (
            <div key={exp.org + exp.role} className="break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="font-serif text-[1.25rem] text-bone print:text-black">
                  {exp.org}
                  <span className="text-ash print:text-black/60">, {exp.role}</span>
                </h3>
                <span className="t-meta text-ash print:text-black/60">{exp.when}</span>
              </div>
              {exp.notes && <p className="t-ui text-ash mt-1 leading-relaxed print:text-black/80">{exp.notes}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 pt-8 border-t border-hair print:border-black/20">
        <ResumeHeading>honors and awards</ResumeHeading>
        <ul className="mt-4 space-y-2">
          {recognition.map((r) => (
            <li key={r.detail} className="t-ui text-bone print:text-black">
              {r.title}
              <span className="text-ash print:text-black/70">
                , {r.detail}
                {r.scope ? ` (${r.scope})` : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 pt-8 border-t border-hair print:border-black/20">
        <ResumeHeading>skills and languages</ResumeHeading>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-[7rem_1fr] gap-x-8 gap-y-3">
          {resume.skills.map((sg) => (
            <div key={sg.group} className="contents">
              <dt className="t-meta text-ash print:text-black/60 sm:pt-0.5">{sg.group}</dt>
              <dd className="t-ui text-bone print:text-black">{sg.items.join(', ')}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
