// Astro Content Collection schema definition for src/content/posts
export interface PostFrontmatter {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft?: boolean;
  cover?: string;
}

export const collections = {
  posts: {
    type: 'content' as const,
  },
};
