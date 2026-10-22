# kalebdida.github.io

kal's personal site: projects, journey and field notes. live at **https://kalebdida.github.io**

- react + vite + tailwind, with a three.js particle scene that changes shape as you scroll
- everything about kal lives in `src/data/siteData.ts`
- particle shapes live in `src/three/formations.ts`

## run it

```
npm install
npm run dev
```

## publish

push to `main`. the github action in `.github/workflows/deploy.yml` builds the site and puts it on github pages.
