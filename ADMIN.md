# Kal’s editing guide

Start at https://app.pagescms.org. Sign in with GitHub, authorize **kalebdida/kalebdida.github.io**, and choose the **source** branch. Bookmark https://app.pagescms.org/kalebdida/kalebdida.github.io/source.

Always check that the branch selector says **source** before saving. `main` is generated. A save on `source` starts a redeploy; the site usually updates in about a minute. Check the repository’s Actions tab if it takes longer.

## Write a blog post

1. Open **Posts: write or link**, the first item in the sidebar.
2. Choose **New**. Give the note a title and a stable filename with lowercase words separated by hyphens. The filename becomes its web address.
3. Set the actual publication date, write a short summary, and add a few tags.
4. Leave **External URL** and **External platform** empty.
5. Scroll to **Write your post**. Write the full piece there. Use **Heading 2** for section headings; these become the contents links. You can add paragraphs, lists, links, images and code blocks.
6. Add a thumbnail if you have one. Without a thumbnail, the site makes a patterned cover from the title.
7. While working, leave **Draft** on. Drafts are hidden from the site, feeds and generated pages.
8. When the piece is ready, set **Status** to **published**, turn **Draft** off, and save. Published notes can appear on the home page.

**Outline** means a public work in progress when Draft is off. It appears in the notes index with a gentle in-progress label and stays off the home page. Turn Draft on if you want to hide it from the rendered site.

## Add a Medium or Substack piece

1. Create an entry under **Posts: write or link**.
2. Add the title, date, summary, tags and optional thumbnail.
3. Paste the full HTTPS address of the original piece into **External URL**.
4. Choose **Medium** or **Substack** in **External platform**. The body can stay empty.
5. Set Status to published, turn Draft off, and save. The card opens the original article. No local article page is created.

## Add a portrait or project photo

- **Site → Identity → Dark-theme portrait:** the black-and-white cutout used in dark mode.
- **Site → Identity → Light-theme portrait:** the color cutout used in light mode.
- These portraits switch with the visitor’s theme in the opening and About sections, including the particle portrait.
- **Projects → an item → Project photo:** upload a real project image. It appears in the hover preview and inside the case file. With no image, the preview uses a generated graphic.

Uploads live in **public/uploads/** and are served at **/uploads/**. The upload buttons handle the paths. The build creates smaller WebP versions without changing the uploaded original.

## Edit links and the resume

- **Site → Off Screen → Writing:** edit Link and Link text for the Telegram channel.
- **Site → Socials:** edit contact links, including personal Telegram, LinkedIn and Instagram.
- **Resume** and **Recognition:** edit the resume content. Each build generates the downloadable **kaleb-dida-resume.pdf** from these fields and the Site identity. Full resume links download this file. The online version remains at **/resume**.

## Choose what shows on home

1. Open **Journey** or **Recognition**.
2. Turn **Show on home page** on or off for each item.
3. Write one short **home-page line/detail** if you want a shorter version there.
4. Save. The full resume keeps all its existing details, and the Full journey disclosure on /resume keeps the complete chronology. There are six selected Journey entries and two selected Recognition entries to start with; you can change the selection.

For projects, **Short home-page summary** controls the one-line introduction. The other project fields stay in the case file.

## Edit About

1. Open **Site → About**.
2. Edit **Lead**, the strong opening sentence.
3. Edit **About paragraph on home**, the short paragraph below it.
4. Edit the fact cards under **Facts**. Portraits are under **Site → Identity**.
5. Save. Keep it short and use only verified facts.

Use sentence case and correct proper nouns. Avoid em dashes. Leave unknown dates, achievements, counts and links out. Keep existing project IDs and published post filenames stable.

## Development

```sh
npm ci
npx tsc --noEmit
npx tsx --test src/utils/logic.test.ts
npm run build
npm run dev
```

The editable files live in `content/`. `.pages.yml` defines the editors. Pages CMS saves to the branch selected in its interface; there is no YAML setting that forces a branch. First-time GitHub authorization must be completed by Kal. No CMS server, website API key or new password is needed.
