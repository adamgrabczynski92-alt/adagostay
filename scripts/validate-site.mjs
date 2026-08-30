import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const domain = 'https://adagostay.pl';
const errors = [];

async function walk(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target, predicate));
    else if (predicate(target)) files.push(target);
  }
  return files;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function isNoindex(html) {
  return /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*noindex)/i.test(html)
    || /<meta\b(?=[^>]*\bcontent=["'][^"']*noindex)(?=[^>]*\bname=["']robots["'])/i.test(html);
}

function publicUrl(file) {
  const directory = relative(path.dirname(file));
  return directory && directory !== '.' ? `${domain}/${directory}/` : `${domain}/`;
}

function hasMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<meta\\b(?=[^>]*\\bname=["']${escaped}["'])(?=[^>]*\\bcontent=["'][^"']+)[^>]*>`, 'i').test(html)
    || new RegExp(`<meta\\b(?=[^>]*\\bcontent=["'][^"']+)(?=[^>]*\\bname=["']${escaped}["'])[^>]*>`, 'i').test(html);
}

function resolveInternal(value) {
  if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value)) return null;
  const clean = value.split('#')[0].split('?')[0];
  if (!clean) return null;
  const normalized = clean.startsWith('/') ? clean.slice(1) : clean;
  if (!normalized) return path.join(root, 'index.html');
  if (normalized.endsWith('/')) return path.join(root, normalized, 'index.html');
  return path.join(root, normalized);
}

async function ensureExists(target, source, value) {
  if (!target) return;
  try {
    await access(target);
  } catch {
    errors.push(`${relative(source)}: missing internal resource ${value}`);
  }
}

const htmlFiles = await walk(root, file => file.endsWith('.html'));
const indexable = [];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const label = relative(file);
  if (path.basename(file) === 'index.html' && !isNoindex(html)) indexable.push(file);

  if (!isNoindex(html)) {
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    if (h1Count !== 1) errors.push(`${label}: expected exactly one H1, found ${h1Count}`);
    if (!/<title>\s*[^<]+\s*<\/title>/i.test(html)) errors.push(`${label}: missing non-empty title`);
    if (!hasMeta(html, 'description')) errors.push(`${label}: missing meta description`);
    if (!/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/adagostay\.pl\/[^"']*)[^>]*>/i.test(html)
      && !/<link\b(?=[^>]*\bhref=["']https:\/\/adagostay\.pl\/[^"']*)(?=[^>]*\brel=["']canonical["'])[^>]*>/i.test(html)) {
      errors.push(`${label}: missing canonical URL`);
    }
  }

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${label}: invalid JSON-LD (${error.message})`); }
  }

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) errors.push(`${label}: duplicate IDs: ${duplicates.join(', ')}`);

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    await ensureExists(resolveInternal(match[1]), file, match[1]);
  }
  for (const match of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(',').map(item => item.trim().split(/\s+/)[0])) {
      await ensureExists(resolveInternal(candidate), file, candidate);
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*\bsrc=["']\/assets\/img\/(?:oaza|antracyt|gold)\/(hero|\d+)(-v\d+)?\.webp["'][^>]*>/gi)) {
    const version = match[2] || '';
    const expected = match[1] === 'hero'
      ? `hero${version}-960.webp`
      : `${match[1]}${version}-640.webp`;
    if (!match[0].includes(expected)) errors.push(`${label}: responsive variant ${expected} is not declared`);
  }
}

const expectedUrls = indexable.map(publicUrl).sort();
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]).sort();
for (const url of expectedUrls.filter(url => !sitemapUrls.includes(url))) errors.push(`sitemap.xml: missing ${url}`);
for (const url of sitemapUrls.filter(url => !expectedUrls.includes(url))) errors.push(`sitemap.xml: unexpected ${url}`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) errors.push('sitemap.xml: duplicate URLs');

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} error(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Site validation passed: ${htmlFiles.length} HTML files, ${indexable.length} indexable URLs.`);
