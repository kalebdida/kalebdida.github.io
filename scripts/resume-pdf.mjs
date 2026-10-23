import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/** Generate the downloadable resume from the same CMS files as the website. */
export async function createResumePdf(root) {
  const readJson = async name => JSON.parse(await readFile(join(root, 'content', `${name}.json`), 'utf8'));
  const [site, resume, recognition] = await Promise.all(['site', 'resume', 'recognition'].map(readJson));
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${site.identity.name} - Resume`);
  pdf.setAuthor(site.identity.name);
  pdf.setSubject(resume.title);
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(await readFile(join(root, 'scripts/fonts/geist-regular.ttf')), { subset: true });
  const heading = await pdf.embedFont(await readFile(join(root, 'scripts/fonts/geist-bold.ttf')), { subset: true });
  const ink = rgb(.09, .1, .12), muted = rgb(.32, .35, .39), accent = rgb(0, .35, .47);
  const width = 595.28, height = 841.89, margin = 46, usable = width - margin * 2;
  const plain = text => String(text).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\u00a0/g, ' ');
  let page, y;
  const wrap = (text, font, size, maxWidth = usable) => {
    const lines = []; let line = '';
    for (const word of plain(text).split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next, size) > maxWidth) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const newPage = () => {
    page = pdf.addPage([width, height]); y = height - margin;
    if (pdf.getPageCount() > 1) {
      page.drawText(site.identity.name, { x: margin, y, font: heading, size: 11, color: ink });
      y -= 24;
    }
  };
  const ensure = space => { if (y - space < margin + 18) newPage(); };
  const lines = (items, { font = regular, size = 10, color = ink, leading = 14 } = {}) => {
    for (const text of items) {
      ensure(leading);
      page.drawText(text, { x: margin, y, font, size, color }); y -= leading;
    }
  };
  const paragraph = (text, options = {}) => lines(wrap(text, options.font ?? regular, options.size ?? 10), options);
  const section = title => {
    ensure(70); y -= 10;
    lines([title.toUpperCase()], { font: heading, size: 11, color: accent, leading: 17 });
    page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, color: rgb(.8, .83, .84), thickness: .5 });
    y -= 6;
  };
  const entry = (title, meta, body) => {
    const titleLines = wrap(title, heading, 12), metaLines = wrap(meta, regular, 9), bodyLines = wrap(body, regular, 10);
    ensure((titleLines.length + bodyLines.length) * 14 + metaLines.length * 12 + 13);
    lines(titleLines, { font: heading, size: 12 });
    lines(metaLines, { size: 9, color: muted, leading: 12 });
    lines(bodyLines); y -= 10;
  };
  newPage();
  paragraph(site.identity.name, { font: heading, size: 26, leading: 32 });
  paragraph(resume.title, { size: 11, color: muted, leading: 16 });
  y -= 5;
  paragraph(`${site.identity.city}  |  ${site.identity.email}`, { size: 9, color: muted, leading: 13 });
  paragraph(`${site.identity.url}  |  github.com/kalebdida`, { size: 9, color: accent, leading: 13 });
  section('Education');
  for (const item of resume.education) entry(item.school, `${item.period} | ${item.place}`, item.notes);
  section('Activities and experience');
  for (const item of resume.experience) entry(item.org, `${item.role} | ${item.when}`, item.notes);
  section('Honors and awards');
  for (const item of recognition) {
    const text = `${item.title}: ${item.detail}${item.scope ? ` (${item.scope})` : ''}`;
    ensure(wrap(text, regular, 10).length * 14 + 7);
    paragraph(text); y -= 7;
  }
  section('Skills and languages');
  for (const group of resume.skills) {
    const text = `${group.group}: ${group.items.join(', ')}`;
    ensure(wrap(text, regular, 10).length * 14 + 5);
    paragraph(text); y -= 5;
  }
  const pages = pdf.getPages();
  pages.forEach((sheet, index) => {
    sheet.drawText(`${site.identity.shortName}  |  Resume`, { x: margin, y: 28, font: regular, size: 8, color: muted });
    sheet.drawText(`${index + 1} / ${pages.length}`, { x: width - margin - 30, y: 28, font: regular, size: 8, color: muted });
  });
  return pdf.save();
}
