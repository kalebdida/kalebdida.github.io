/** Typed content adapter. Edit content/ through Pages CMS. */
import site from '../../content/site.json';
import projects from '../../content/projects.json';
import journey from '../../content/journey.json';
import recognition from '../../content/recognition.json';
import resume from '../../content/resume.json';
import { CTF } from './constants';

export type ProjectStatus = 'In use, still building' | 'Building' | 'Done' | 'Presented';

export interface ProjectCaseFile {
  id: string; // "01", "02"...
  slug: string;
  title: string;
  year?: string;
  status: ProjectStatus;
  kind: string;
  summary: string;
  whatItIs: string;
  homeSummary?: string;
  photo?: string;
  built: string[];
  next?: string[];
  stack?: string[];
  role?: string;
  links?: { label: string; href: string }[];
}

export interface JourneyMilestone {
  id: string;
  when: string;
  showOnHome: boolean;
  homeSummary?: string;
  title: string;
  place?: string;
  note?: string;
}

export interface RecognitionItem {
  showOnHome: boolean;
  homeDetail?: string;
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
  body: string;
  sections: BlogPostSection[];
  /** optional preview image, e.g. '/uploads/my-post.jpg' (put the file in public/uploads/) or a full https url */
  thumbnail?: string;
  /** set this for posts that live on medium / substack: the card opens the original there */
  external?: { url: string; platform: 'medium' | 'substack' };
}


const files = import.meta.glob('/content/posts/*.md', { query: '?post', import: 'default', eager: true });
const posts: BlogPost[] = Object.entries(files)
  .map(([, post]) => post as BlogPost | null)
  .filter((post): post is BlogPost => post !== null)
  .sort((a, b) => b.date.localeCompare(a.date));

export const SITE_DATA = {
  ...site,
  projects: projects as ProjectCaseFile[],
  journey: journey as JourneyMilestone[],
  recognition: recognition as RecognitionItem[],
  resume,
  posts,
  ctf: CTF,
};
