/**
 * everything on the site that is about kal lives in this one file.
 * source of truth: kal's college resume (google doc "COLLEGERESUME").
 *
 * rule: only true things go in here. unknown details are left out
 * (optional fields don't render) instead of guessed.
 *
 * not on the public site on purpose: phone number.
 */

export type ProjectStatus = 'in use, still building' | 'building' | 'done' | 'presented';

export interface ProjectCaseFile {
  id: string; // "01", "02"...
  slug: string;
  title: string;
  year?: string;
  status: ProjectStatus;
  kind: string;
  summary: string;
  whatItIs: string;
  built: string[];
  next?: string[];
  stack?: string[];
  role?: string;
  links?: { label: string; href: string }[];
}

export interface JourneyMilestone {
  id: string;
  when: string;
  title: string;
  place?: string;
  note?: string;
}

export interface RecognitionItem {
  title: string;
  detail: string;
  scope?: string;
}

export interface OffScreenNote {
  id: string;
  label: string;
  text: string;
}

export interface BlogPostSection {
  id: string;
  heading: string;
  outlinePoints: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  year: string;
  summary: string;
  tags: string[];
  draft: boolean;
  status: 'outline' | 'published';
  readingTimeMin?: number;
  sections: BlogPostSection[];
}

export const SITE_DATA = {
  identity: {
    name: 'Kaleb Dida Abera',
    shortName: 'kaleb dida',
    handle: 'kal',
    geezName: 'ካሌብ ዲዳ',
    url: 'https://kalebdida.github.io',
    email: 'kalebdida@gmail.com',
    city: 'adama, ethiopia',
    timeZone: 'Africa/Addis_Ababa',
    title: 'aspiring cognitive scientist. human-centered ai and software.',
    tagline: 'minds, machines, and the locks between them.',
    intro:
      "i'm kal, an aspiring cognitive scientist from adama. i build human-centered software, play ctfs, and want to become an ai engineer.",
  },

  about: {
    lead: 'i care about three things that turn out to be one thing: how minds work, how to build machines that think, and how to keep those machines safe.',
    paragraphs: [
      'i graduated from adama science and technology university special school (astu sps) in july 2026, first in my section every year. this is my gap year before studying cognitive science: i’m building logbook, competing in ctfs, and teaching weekly bible lessons to kids in my neighborhood.',
      'logbook is what i’m building right now. it’s a private, offline-first journal with an ai companion that asks me a question every day and remembers past entries and photos. it’s how i’ve been exploring whether software can support memory and self-reflection.',
      'before that came a summer of neuroscience research with thinkneuro, the insa cyber talent program, a four-person robotics team i led, and a peace club i founded that grew to 63 members.',
    ],
    facts: [
      { key: 'based in', value: 'adama, ethiopia' },
      { key: 'studying next', value: 'cognitive science' },
      { key: 'into', value: 'human-centered ai, cybersecurity, robotics' },
      { key: 'speaks', value: 'amharic, english, afaan oromoo' },
    ],
  },

  disciplines: [
    {
      id: 'mind',
      title: 'ai and cognitive science',
      text: 'how minds remember, and how software can help. logbook’s companion is my experiment in autobiographical memory. thinkneuro was my first research.',
    },
    {
      id: 'security',
      title: 'cybersecurity',
      text: 'selected for the insa cyber talent program in grade 10. three ctf contests so far, best finish 9th of 53 teams.',
    },
    {
      id: 'embedded',
      title: 'robotics',
      text: 'in 2023 i led a team of four building a robot that senses and steers around obstacles. my first look at the perception-action loop.',
    },
  ],

  projects: [
    {
      id: '01',
      slug: 'logbook',
      title: 'logbook',
      year: '2026',
      status: 'in use, still building',
      kind: 'personal os',
      summary:
        'a private, offline-first journal with an ai companion that asks a daily question and remembers past entries and photos.',
      whatItIs:
        'a private, offline-first journaling platform that links daily entries, moods, habits and an ai companion. i’m using it to explore how software can support autobiographical memory and self-reflection.',
      built: [
        'daily entries, mood tracking and habits, all linked together.',
        'an ai companion that asks a question each day and recalls past entries and photos.',
        'logging from telegram, and spotify listening history pulled into each day.',
        'offline sync, so it works without a connection.',
        'goals, a pomodoro focus space, and a “density map” of how my time splits across coding, fitness, faith, work and rest.',
        'a python fastapi backend serving a modular vanilla js frontend, with a crt look and two mt. fuji themes.',
      ],
      next: ['a hosted database', 'invite-only accounts for a few friends, each with a private logbook', 'an android app'],
      stack: ['javascript', 'python', 'fastapi', 'sql'],
      role: 'founder and developer, three months of work so far',
      links: [{ label: 'source on github', href: 'https://github.com/kalebdida/logbook' }],
    },
    {
      id: '02',
      slug: 'thinkneuro',
      title: 'thinkneuro research',
      year: 'grade 11',
      status: 'presented',
      kind: 'neuroscience research',
      summary:
        'a bibliometric review of the 100 most-cited papers on detecting adolescent depression and anxiety with wearable nanotechnology and biofeedback.',
      whatItIs:
        'my summer research internship at thinkneuro. our team reviewed the 100 most-cited papers on using wearable nanotechnology and biofeedback to detect depression and anxiety in adolescents.',
      built: [
        'co-authored the bibliometric review.',
        'ran a keyword-trend analysis on research from the 1980s to 2022 to map how neuroscience and psychiatry themes shifted.',
        'helped build the data visualizations for the team poster.',
        'presented at the thinkneuro research symposium.',
      ],
      role: 'summer research intern, co-author',
    },
    {
      id: '03',
      slug: 'obstacle-robot',
      title: 'obstacle-avoidance robot',
      year: '2023',
      status: 'done',
      kind: 'robotics',
      summary: 'a sensor-based robot that detects and steers around obstacles, built by a team of four that i led.',
      whatItIs:
        'a sensor-based robot that detects obstacles and steers around them. we built it to put our classroom robotics into practice.',
      built: [
        'wired the sensors to the motor control.',
        'debugged both the hardware and the code.',
        'tested a working prototype.',
      ],
      role: 'project lead, team of four',
    },
    {
      id: '04',
      slug: 'church-finder',
      title: 'church finder',
      status: 'building',
      kind: 'maps app',
      summary: 'find the churches near you, starting with every church in addis ababa.',
      whatItIs: 'an app that shows nearby churches and every church in addis ababa. addis first, then other cities.',
      built: ['early build in progress, made with ai coding agents (claude and codex) working on the same repo.'],
    },
  ] as ProjectCaseFile[],

  journey: [
    {
      id: 'saint-joseph',
      when: 'middle school',
      title: 'saint joseph catholic school',
      place: 'adama',
    },
    {
      id: 'pj-masks',
      when: 'grades 7 to 10',
      title: 'part-time at pj masks playground',
      place: 'adama',
      note: 'waiter, cashier and children’s play attendant, mostly on saturdays, for four years.',
    },
    {
      id: 'debate',
      when: 'grades 9 to 12',
      title: 'debate club',
      note: 'researched and argued three team rounds on school systems. we won.',
    },
    {
      id: 'robot',
      when: '2023',
      title: 'led a robotics team',
      note: 'four of us built a robot that detects and steers around obstacles.',
    },
    {
      id: 'insa',
      when: 'grade 10',
      title: 'insa cyber talent program',
      note: 'selected trainee in the national program for young technical talent. studied how systems fail, how attackers think, and how to defend.',
    },
    {
      id: 'ctf',
      when: 'grade 10 to now',
      title: 'capture the flag',
      note: 'three contests so far, solo and on teams. best finish: 9th of 53 teams.',
    },
    {
      id: 'bible',
      when: 'grade 10 to now',
      title: 'volunteer bible teacher',
      note: 'weekly sunday lessons for 12 neighborhood children.',
    },
    {
      id: 'thinkneuro',
      when: 'grade 11',
      title: 'research intern at thinkneuro',
      note: 'a bibliometric review on adolescent depression and anxiety, presented at the thinkneuro research symposium.',
    },
    {
      id: 'peace-club',
      when: 'grade 12',
      title: 'founded the peace club',
      note: 'ymca-affiliated, at my school. grew it to 63 members and led two sessions a week on gender-based violence and peacekeeping.',
    },
    {
      id: 'summer-program',
      when: 'grade 12',
      title: 'organized a summer school',
      note: 'a two-month program for 36 students, over 90% of them girls, most from families who couldn’t afford tutoring. prepared grade 6 and 8 students for national exams.',
    },
    {
      id: 'graduated',
      when: 'july 2026',
      title: 'graduated from astu sps',
      note: 'first in my section every year.',
    },
    {
      id: 'gap-year',
      when: '2026 to 2027',
      title: 'gap year',
      note: 'building logbook, competing in ctfs, teaching bible lessons.',
    },
  ] as JourneyMilestone[],

  recognition: [
    { title: '1st place', detail: 'the world in us writing competition, for a piece on teaching discipline in the digital age', scope: 'international' },
    { title: '2nd place', detail: 'stempower program', scope: 'citywide' },
    { title: '4th place', detail: 'national online english competition', scope: 'national' },
    { title: 'stage 4 of 6', detail: 'national mathematics olympiad', scope: 'national' },
    { title: '9th of 53', detail: 'best team finish in a capture the flag contest' },
  ] as RecognitionItem[],

  posts: [
    {
      slug: 'building-logbook',
      title: 'building logbook: a personal os in vanilla js',
      date: '2026-10-22',
      year: '2026',
      summary: 'how a journaling app turned into the place my whole day lives.',
      tags: ['building', 'logbook'],
      draft: false,
      status: 'outline',
      sections: [
        { id: 'why', heading: 'why build my own', outlinePoints: ['what i wanted from a journal', 'why offline-first'] },
        {
          id: 'companion',
          heading: 'a companion that remembers',
          outlinePoints: ['the daily question', 'recalling old entries and photos', 'memory and self-reflection'],
        },
        { id: 'pipes', heading: 'everything flows in', outlinePoints: ['telegram logging', 'spotify history', 'offline sync'] },
      ],
    },
    {
      slug: 'obstacle-avoiding-robot-2023',
      title: 'what an obstacle-avoiding robot taught me in 2023',
      date: '2026-10-22',
      year: '2026',
      summary: 'notes from leading a team of four building an obstacle-avoiding robot.',
      tags: ['robotics'],
      draft: false,
      status: 'outline',
      sections: [
        { id: 'build', heading: 'the build', outlinePoints: ['sensors to motor control', 'the prototype'] },
        { id: 'debug', heading: 'debugging two worlds', outlinePoints: ['when it’s the hardware', 'when it’s the code'] },
        { id: 'loop', heading: 'the perception-action loop', outlinePoints: ['what a robot and a mind have in common'] },
      ],
    },
    {
      slug: 'why-cognitive-science',
      title: 'why cognitive science',
      date: '2026-10-22',
      year: '2026',
      summary: 'why i chose cognitive science, and where i want it to take me.',
      tags: ['cognitive science'],
      draft: false,
      status: 'outline',
      sections: [
        { id: 'question', heading: 'the question', outlinePoints: ['the moment it clicked', 'why not just computer science'] },
        { id: 'memory', heading: 'memory', outlinePoints: ['what building logbook taught me about remembering'] },
        { id: 'later', heading: 'where it leads', outlinePoints: ['human-centered ai'] },
      ],
    },
  ] as BlogPost[],

  offScreen: [
    {
      id: 'music',
      label: 'keyboard and guitar',
      text: 'i play both. turn the sound on and the keys a to k on your keyboard play soft notes.',
    },
    { id: 'football', label: 'football', text: 'cristiano ronaldo and portugal. always.' },
    {
      id: 'writing',
      label: 'writing',
      text: 'lowercase journals on my telegram channel. a piece on discipline in the digital age won an international prize.',
    },
    {
      id: 'teaching',
      label: 'teaching',
      text: 'sunday lessons for 12 kids in my neighborhood, and a summer school for 36 students.',
    },
  ] as OffScreenNote[],

  now: {
    updated: 'october 2026',
    season: 'gap year',
    items: [
      { category: 'building', detail: 'logbook, and church finder for addis ababa.' },
      { category: 'competing', detail: 'capture the flag contests.' },
      { category: 'teaching', detail: 'weekly sunday lessons for 12 neighborhood kids.' },
      { category: 'applying', detail: 'university applications, to study cognitive science.' },
    ],
  },

  resume: {
    title: 'aspiring cognitive scientist. human-centered ai and software development.',
    education: [
      {
        school: 'adama science and technology university special school',
        place: 'adama, ethiopia',
        period: 'graduated july 2026',
        notes: 'high school diploma. ranked first in my section every year. intended field: cognitive science.',
      },
      {
        school: 'gap year',
        place: '2026 to 2027',
        period: 'now',
        notes: 'developing logbook, competing in ctfs, teaching weekly bible lessons.',
      },
    ],
    experience: [
      {
        role: 'founder and developer',
        org: 'logbook',
        when: '2026',
        notes: 'a private, offline-first journaling platform with an ai companion that asks a daily question and recalls past entries and photos. telegram logging, spotify history and offline sync, over three months of development.',
      },
      {
        role: 'summer research intern',
        org: 'thinkneuro',
        when: 'grade 11',
        notes: 'co-authored a bibliometric review of the 100 most-cited papers on wearable nanotechnology and biofeedback for detecting adolescent depression and anxiety. ran keyword-trend analysis (1980s to 2022), helped build the poster’s data visualizations, presented at the research symposium.',
      },
      {
        role: 'founder and president',
        org: 'peace club, ymca-affiliated',
        when: 'grade 12',
        notes: 'grew it to 63 registered members. led two sessions a week on gender-based violence and peacekeeping.',
      },
      {
        role: 'summer tutor and program organizer',
        org: 'community education initiative',
        when: 'grade 12',
        notes: 'organized and taught a two-month program for 36 students, over 90% girls. three classes a week, national exam prep for grades 6 and 8.',
      },
      {
        role: 'selected trainee',
        org: 'insa cyber talent program',
        when: 'grade 10',
        notes: 'national cybersecurity program for young technical talent.',
      },
      {
        role: 'project lead',
        org: 'obstacle-avoidance robot',
        when: '2023',
        notes: 'led a team of four. wired sensors to motor control, debugged hardware and code, tested a working prototype.',
      },
      {
        role: 'ctf competitor',
        org: 'independent and team competitions',
        when: 'grade 10 to now',
        notes: 'three contests, best finish 9th of 53 teams.',
      },
      {
        role: 'debater',
        org: 'debate club',
        when: 'grades 9 to 12',
        notes: 'argued three team rounds on school systems; won with my team.',
      },
      {
        role: 'volunteer bible teacher',
        org: 'local community',
        when: 'grade 10 to now',
        notes: 'weekly sunday lessons for 12 neighborhood children.',
      },
      {
        role: 'part-time employee',
        org: 'pj masks playground adama',
        when: 'grades 7 to 10',
        notes: 'waiter, cashier and children’s play attendant on weekends for four years.',
      },
    ],
    skills: [
      { group: 'programming', items: ['python', 'javascript', 'html', 'css', 'sql'] },
      { group: 'software', items: ['web apps', 'offline-first design', 'debugging', 'prototyping'] },
      { group: 'ai', items: ['llm integration', 'human-centered interface design'] },
      { group: 'research', items: ['literature review', 'bibliometrics', 'data visualization'] },
      { group: 'engineering', items: ['ctf problem-solving', 'robotics', 'sensors'] },
      { group: 'creative', items: ['writing', 'keyboard', 'guitar'] },
      { group: 'languages', items: ['amharic (native)', 'english (fluent)', 'afaan oromoo (fluent)'] },
    ],
  },

  socials: [
    { label: 'email', handle: 'kalebdida@gmail.com', href: 'mailto:kalebdida@gmail.com' },
    { label: 'github', handle: 'kalebdida', href: 'https://github.com/kalebdida' },
    { label: 'telegram', handle: '@kalebdida', href: 'https://t.me/kalebdida' },
    { label: 'rss', handle: 'field notes feed', href: '/rss.xml' },
  ],

  // three pieces hidden around the site. typing the whole flag anywhere unlocks a note.
  ctf: {
    part1Base64: 'ZmxhZ3tzdGlsbF9jdXJpb3VzXw==', // flag{still_curious_
    part2Console: 'after_all_',
    part3Robots: 'these_years}',
    fullFlag: 'flag{still_curious_after_all_these_years}',
  },
};
