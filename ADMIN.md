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

## Anonymous notes and visits

The note form is inside **Say hi**, below the contact cards. It uses FormSubmit
to deliver private notes to the email in **Site → Identity → Email**. Visitors
do not enter a name or email address, and messages are not published on the site.

**One-time activation:** send a note using the live form. If delivery is not yet
confirmed, choose **Try direct delivery in a new tab**. This opens FormSubmit’s
normal submission and activation flow. Open its activation email in the destination
inbox and click **Activate Form**. Check Spam if it does not arrive. Send a second
note after activation to confirm receipt. The site
shows success only when the provider confirms delivery; it keeps the text if
delivery fails or cannot be confirmed. Changing the destination email requires
activating the new address too.

FormSubmit supplies delivery and spam filtering; the form also includes a
honeypot. Notes are sent through a third-party service, whose privacy policy is
linked below the form. There is no website database or browser-readable secret.

The footer badge uses **dwyl Hits** with the separate counter
`kalebdida/portfolio-site-20261024`. It counts page views from this addition, not
historical visitors or unique people. It loads on the home page, and local previews
are excluded. Refreshes may add views. It never displays
an invented number; a failed badge request shows **Count unavailable**. The badge
service may receive normal request data such as IP address and browser user agent.

**Send a spark** triggers a brief ripple in the existing contact particles. It is
hidden for visitors who prefer reduced motion.

## Development commands

```sh
npm ci
npx tsc --noEmit
npx tsx --test src/utils/logic.test.ts
npx tsx --test src/utils/anonymousNotes.test.ts
npm run build
npm run dev
```

The editable files live in `content/`. `.pages.yml` defines the editors. Pages CMS saves to the branch selected in its interface; there is no YAML setting that forces a branch. First-time GitHub authorization must be completed by Kal. No CMS server, website API key or new password is needed.
