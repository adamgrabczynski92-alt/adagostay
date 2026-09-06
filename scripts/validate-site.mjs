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

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return tag.match(new RegExp(`\\b${escaped}=["']([^"']*)["']`, 'i'))?.[1] || '';
}

function resolveInternal(value, source) {
  if (!value || /^(?:mailto:|tel:|data:|javascript:|#)/i.test(value)) return null;
  let clean = value.split('#')[0].split('?')[0];
  if (/^https?:/i.test(clean)) {
    const url = new URL(clean);
    if (url.origin !== domain) return null;
    clean = url.pathname;
  }
  if (!clean) return null;
  const base = clean.startsWith('/') ? root : path.dirname(source);
  const normalized = clean.startsWith('/') ? clean.slice(1) : clean;
  if (!normalized) return path.join(root, 'index.html');
  if (normalized.endsWith('/')) return path.resolve(base, normalized, 'index.html');
  return path.resolve(base, normalized);
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
const pages = new Map();

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const label = relative(file);
  const noindex = isNoindex(html);
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]);
  const canonicalUrls = linkTags
    .filter(tag => attribute(tag, 'rel').split(/\s+/).includes('canonical'))
    .map(tag => attribute(tag, 'href'));
  const alternates = linkTags
    .filter(tag => attribute(tag, 'rel').split(/\s+/).includes('alternate') && attribute(tag, 'hreflang'))
    .map(tag => ({ language: attribute(tag, 'hreflang').toLowerCase(), href: attribute(tag, 'href') }));

  if (path.basename(file) === 'index.html' && !noindex) {
    indexable.push(file);
    pages.set(publicUrl(file), { file, html, alternates });
  }

  if (!noindex) {
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    if (h1Count !== 1) errors.push(`${label}: expected exactly one H1, found ${h1Count}`);
    if (!/<title>\s*[^<]+\s*<\/title>/i.test(html)) errors.push(`${label}: missing non-empty title`);
    if (!hasMeta(html, 'description')) errors.push(`${label}: missing meta description`);
    if (canonicalUrls.length !== 1) errors.push(`${label}: expected exactly one canonical URL, found ${canonicalUrls.length}`);
    else if (path.basename(file) === 'index.html' && canonicalUrls[0] !== publicUrl(file)) {
      errors.push(`${label}: canonical ${canonicalUrls[0]} does not match ${publicUrl(file)}`);
    }
  } else {
    const refresh = html.match(/<meta\b[^>]*http-equiv=["']refresh["'][^>]*>/i)?.[0]
      || html.match(/<meta\b[^>]*content=["'][^"']*url=[^"']+["'][^>]*http-equiv=["']refresh["'][^>]*>/i)?.[0];
    const refreshTarget = refresh ? attribute(refresh, 'content').match(/url\s*=\s*(.+)$/i)?.[1]?.trim() : '';
    if (refreshTarget && canonicalUrls.length === 1) {
      const expected = new URL(refreshTarget, domain).href;
      if (canonicalUrls[0] !== expected) errors.push(`${label}: redirect target ${expected} differs from canonical ${canonicalUrls[0]}`);
    }
  }

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${label}: invalid JSON-LD (${error.message})`); }
  }

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) errors.push(`${label}: duplicate IDs: ${duplicates.join(', ')}`);

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    await ensureExists(resolveInternal(match[1], file), file, match[1]);
  }
  for (const match of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(',').map(item => item.trim().split(/\s+/)[0])) {
      await ensureExists(resolveInternal(candidate, file), file, candidate);
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

for (const [url, page] of pages) {
  if (!page.alternates.length) continue;
  const htmlLanguage = page.html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1]?.toLowerCase().split('-')[0] || '';
  if (htmlLanguage && !page.alternates.some(alternate => alternate.language === htmlLanguage && alternate.href === url)) {
    errors.push(`${relative(page.file)}: hreflang cluster is missing its ${htmlLanguage} self-reference`);
  }
  for (const alternate of page.alternates) {
    if (!alternate.href.startsWith(`${domain}/`)) {
      errors.push(`${relative(page.file)}: hreflang points outside the canonical domain (${alternate.href})`);
      continue;
    }
    const target = pages.get(alternate.href);
    if (!target) {
      errors.push(`${relative(page.file)}: hreflang target is missing or noindex (${alternate.href})`);
      continue;
    }
    if (alternate.language !== 'x-default' && !target.alternates.some(back => back.href === url)) {
      errors.push(`${relative(page.file)}: hreflang target does not link back (${alternate.href})`);
    }
  }
}

const expectedUrls = indexable.map(publicUrl).sort();
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]).sort();
for (const url of expectedUrls.filter(url => !sitemapUrls.includes(url))) errors.push(`sitemap.xml: missing ${url}`);
for (const url of sitemapUrls.filter(url => !expectedUrls.includes(url))) errors.push(`sitemap.xml: unexpected ${url}`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) errors.push('sitemap.xml: duplicate URLs');

const redirectSource = await readFile(path.join(root, '_redirects'), 'utf8');
const redirectRules = redirectSource.split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'))
  .map(line => line.split(/\s+/));
const cloudflareCsv = await readFile(path.join(root, 'CLOUDFLARE_REDIRECTS.csv'), 'utf8');
const cloudflareRows = new Set(cloudflareCsv.trim().split(/\r?\n/));
if (/SOURCE_URL|TARGET_URL/i.test(cloudflareCsv.split(/\r?\n/, 1)[0])) errors.push('CLOUDFLARE_REDIRECTS.csv: header row is not allowed');
for (const [sourcePath, targetValue, status] of redirectRules) {
  const expected = [
    `adagostay.pl${sourcePath}`,
    new URL(targetValue, domain).href,
    status,
    'TRUE',
    'FALSE',
    'FALSE',
    'FALSE'
  ].join(',');
  if (!cloudflareRows.has(expected)) errors.push(`CLOUDFLARE_REDIRECTS.csv: missing ${sourcePath}`);
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} error(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Site validation passed: ${htmlFiles.length} HTML files, ${indexable.length} indexable URLs.`);
