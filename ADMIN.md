# Edit Kal’s site with Pages CMS

1. Go to https://app.pagescms.org and sign in with GitHub as an account that can write to `kalebdida/kalebdida.github.io`. Authorize Pages CMS for this repository if prompted.
2. Open **kalebdida/kalebdida.github.io** and choose the **source** branch. Bookmark https://app.pagescms.org/kalebdida/kalebdida.github.io/source. Check the branch selector before saving. `main` is generated and must never be edited.
3. Choose an editor: **Site** (identity, About, disciplines, socials, Now, off-screen), **Projects**, **Journey**, **Recognition**, **Resume**, or **Field notes**.
4. Edit and save. Pages CMS commits to the branch selected in its interface. A commit on `source` starts `.github/workflows/deploy.yml`; it builds and publishes to `main`. Changes normally appear at https://kalebdida.github.io in about a minute; check the repository’s Actions tab if they take longer.

## Field notes and images

Create a note with a title, date, summary and tags. Keep **Draft** on while writing; drafts are excluded from the site, static post routes, RSS and sitemap. Choose **outline** for an unfinished piece or **published** for a complete one. These are independent of Draft: a public outline has Draft off and Status outline. Write the body using the rich text editor; it saves Markdown. Level-two headings become the post’s contents links. Raw HTML is disabled and unsafe Markdown links are filtered by the renderer.

Upload thumbnails in the image field or Media. Files live in `public/uploads/` and are served as `/uploads/filename`. A note without an image gets a patterned cover using its title initials and first tag.

For a Medium or Substack link, set **External URL** to the full HTTPS address and select **External platform**. Its card and RSS entry link to the original; no local post page is generated. Leave both fields empty to publish a local article. The filename determines the URL slug; use lowercase words separated by hyphens, and keep published filenames stable to preserve links.

## Content rules

Use sentence case and correct proper nouns. Add only verified facts. Omit unknown dates, numbers and links. Avoid em dashes. Keep existing project and journey IDs stable. The collections preserve list order, except notes, which sort newest first.

`.pages.yml` is read from the selected branch. Pages CMS has no configuration setting that forces a branch: selecting **source** in the interface is what directs edits to `source`. No server, CMS password, or site API key is needed; first-time GitHub authorization must be completed by Kal in Pages CMS.

## Development and publishing

```sh
npm ci
npx tsc --noEmit
npx tsx --test src/utils/logic.test.ts
npm run build
npm run dev
```

Editable content is in `content/`. `src/data/siteData.ts` is the typed Vite loader. Build-generated RSS, sitemap and direct-entry routes use that same content. Do not edit `dist/` or the `main` branch. Push code and content changes to `source`.
