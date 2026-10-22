import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { defineConfig } from 'vite';
import { parsePost } from './scripts/content.mjs';
import { siteArtifacts, renderPage } from './scripts/site-content.mjs';

export default defineConfig(() => ({
  plugins: [
    {
      name: 'cms-markdown',
      enforce: 'pre',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split('?')[0];
          if (path !== '/rss.xml' && path !== '/sitemap.xml') return next();
          try {
            const data = siteArtifacts(import.meta.dirname);
            res.setHeader('Content-Type', path === '/rss.xml' ? 'application/rss+xml' : 'application/xml');
            res.end(path === '/rss.xml' ? data.rss : data.sitemap);
          } catch (error) { next(error); }
        });
      },
      transformIndexHtml(html, ctx) {
        const data = siteArtifacts(import.meta.dirname);
        const path = ctx.path.replace(/^\/|\/$/g, '');
        return renderPage(html, data.routes.find(route => route.path === path) ?? data.routes[0], data);
      },
      // Parse YAML at build time, keeping the parser out of the browser bundle.
      load(id) {
        if (!id.endsWith('.md?post')) return;
        const file = id.slice(0, -5);
        this.addWatchFile(file);
        const post = parsePost(basename(file, '.md'), readFileSync(file, 'utf8'));
        return `export default ${JSON.stringify(post.draft ? null : post)};`;
      },
    },
    react(), tailwindcss(),
  ],
  resolve: { alias: { '@': import.meta.dirname } },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
