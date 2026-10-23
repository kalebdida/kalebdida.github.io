import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { defineConfig } from 'vite';
import { parsePost } from './scripts/content.mjs';
import { siteArtifacts, renderPage } from './scripts/site-content.mjs';
import { preparePhotos } from './scripts/photos.mjs';
import { createResumePdf } from './scripts/resume-pdf.mjs';

export default defineConfig(() => ({
  plugins: [
    {
      name: 'downloadable-resume',
      async generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'kaleb-dida-resume.pdf', source: await createResumePdf(import.meta.dirname) });
      },
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== '/kaleb-dida-resume.pdf') return next();
          try {
            res.setHeader('Content-Type', 'application/pdf');
            res.end(Buffer.from(await createResumePdf(import.meta.dirname)));
          } catch (error) { next(error); }
        });
      },
    },
    (() => {
      let prepared: Awaited<ReturnType<typeof preparePhotos>> | undefined;
      const id = '\0virtual:photos';
      return {
        name: 'responsive-photos',
        resolveId(source: string) { if (source === 'virtual:photos') return id; },
        async load(source: string) {
          if (source !== id) return;
          prepared = await preparePhotos(import.meta.dirname);
          if (this.environment.config.command === 'build') for (const [path, bytes] of prepared.assets) this.emitFile({ type: 'asset', fileName: path.slice(1), source: bytes });
          return `export default ${JSON.stringify(prepared.manifest)};`;
        },
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const asset = prepared?.assets.get(req.url?.split('?')[0] ?? '');
            if (!asset) return next();
            res.setHeader('Content-Type', 'image/webp'); res.end(asset);
          });
        },
        handleHotUpdate(ctx) {
          if (!ctx.file.includes('/content/') && !ctx.file.includes('/public/uploads/')) return;
          const module = ctx.server.moduleGraph.getModuleById(id);
          if (module) ctx.server.moduleGraph.invalidateModule(module);
          ctx.server.ws.send({ type: 'full-reload' });
        },
      };
    })(),
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
