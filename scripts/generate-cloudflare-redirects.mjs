import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const domain = 'https://adagostay.pl';
const redirectsFile = path.join(root, '_redirects');
const outputFile = path.join(root, 'CLOUDFLARE_REDIRECTS.csv');

const source = await readFile(redirectsFile, 'utf8');
const rows = [
  ['www.adagostay.pl/', `${domain}/`, '301', 'TRUE', 'FALSE', 'TRUE', 'TRUE'],
];

for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;

  const [sourcePath, targetValue, status, ...extra] = line.split(/\s+/);
  if (!sourcePath?.startsWith('/') || !targetValue || !/^30[1278]$/.test(status) || extra.length) {
    throw new Error(`Nieprawidłowa reguła w _redirects, wiersz ${index + 1}: ${rawLine}`);
  }

  const sourceUrl = `adagostay.pl${sourcePath}`;
  const targetUrl = new URL(targetValue, domain).href;
  rows.push([sourceUrl, targetUrl, status, 'TRUE', 'FALSE', 'FALSE', 'FALSE']);
}

const csv = `${rows.map(row => row.join(',')).join('\n')}\n`;
await writeFile(outputFile, csv, 'utf8');
console.log(`Wygenerowano ${rows.length} reguł w ${path.basename(outputFile)}.`);
