import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const domain = 'https://adagostay.pl';
const today = new Date().toISOString().slice(0, 10);

async function findIndexFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findIndexFiles(target));
    else if (entry.name === 'index.html') files.push(target);
  }
  return files;
}

function isNoindex(html) {
  return /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex)/i.test(html)
    || /<meta\b(?=[^>]*\bcontent=["'][^"']*noindex)(?=[^>]*\bname=["']robots["'])/i.test(html);
}

function publicUrl(file) {
  const relativeDirectory = path.relative(root, path.dirname(file)).split(path.sep).join('/');
  return relativeDirectory ? `${domain}/${relativeDirectory}/` : `${domain}/`;
}

function lastModified(file) {
  const relative = path.relative(root, file);
  try {
    const status = execFileSync('git', ['status', '--porcelain', '--', relative], { cwd: root, encoding: 'utf8' }).trim();
    if (status) return today;
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', relative], { cwd: root, encoding: 'utf8' }).trim() || today;
  } catch {
    return today;
  }
}

const pages = [];
for (const file of await findIndexFiles(root)) {
  const html = await readFile(file, 'utf8');
  if (!isNoindex(html)) pages.push({ loc: publicUrl(file), lastmod: lastModified(file) });
}
pages.sort((a, b) => a.loc.localeCompare(b.loc, 'en'));

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(({ loc, lastmod }) => `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n');

await writeFile(path.join(root, 'sitemap.xml'), xml);
console.log(`Generated sitemap.xml with ${pages.length} indexable URLs.`);
