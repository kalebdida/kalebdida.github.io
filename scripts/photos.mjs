import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

/** Build-only image processing: original uploads remain untouched. */
export async function preparePhotos(root) {
  const readJson = async name => JSON.parse(await readFile(resolve(root, 'content', `${name}.json`), 'utf8'));
  const [site, projects] = await Promise.all(['site', 'projects'].map(readJson));
  const refs = [...new Set([site.identity.portraitDark, site.identity.portraitLight, ...projects.map(p => p.photo)].filter(Boolean))];
  const manifest = {}, assets = new Map();
  const uploads = resolve(root, 'public/uploads');
  // Bound native work: two photos at a time, three responsive variants at most.
  for (let offset = 0; offset < refs.length; offset += 2) {
    await Promise.all(refs.slice(offset, offset + 2).map(async ref => {
      if (!ref.startsWith('/uploads/')) return;
      const source = resolve(uploads, ref.slice('/uploads/'.length));
      if (!source.startsWith(uploads + sep)) throw new Error('Photo paths must stay within public/uploads');
      const bytes = await readFile(source);
      const meta = await sharp(bytes).metadata();
      const rotated = (meta.orientation ?? 1) >= 5;
      const width = (rotated ? meta.height : meta.width) ?? 1600;
      const height = (rotated ? meta.width : meta.height) ?? 1200;
      const key = createHash('sha256').update(bytes).update('kal-webp-v1-q82').digest('hex').slice(0, 16);
      const widths = [...new Set([480, 960, 1600].map(w => Math.min(w, width)))];
      const variants = [];
      for (const w of widths) {
        const name = `uploads/responsive/${key}-${w}.webp`;
        const buffer = await sharp(bytes).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
        assets.set('/' + name, buffer);
        variants.push(`/${name} ${w}w`);
      }
      manifest[ref] = { width, height, srcSet: variants.join(', ') };
    }));
  }
  return { manifest, assets };
}
