import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'assets/css/style.css');
const outputPath = path.join(root, 'assets/css/style.min.css');
const source = await readFile(sourcePath, 'utf8');

const noSpaceBefore = new Set(['{', '}', ';', ',', '>', '~']);
const noSpaceAfter = new Set(['{', '}', ';', ',', '>', '~']);
let output = '/*! Adago Stay V21 */';
let pendingSpace = false;
let quote = '';

for (let index = 0; index < source.length; index += 1) {
  const current = source[index];
  const next = source[index + 1];

  if (quote) {
    output += current;
    if (current === '\\') {
      if (next !== undefined) output += source[++index];
    } else if (current === quote) {
      quote = '';
    }
    continue;
  }

  if (current === '"' || current === "'") {
    if (pendingSpace && !noSpaceAfter.has(output.at(-1))) output += ' ';
    pendingSpace = false;
    quote = current;
    output += current;
    continue;
  }

  if (current === '/' && next === '*') {
    const end = source.indexOf('*/', index + 2);
    if (end < 0) throw new Error('Niezamknięty komentarz CSS');
    pendingSpace = true;
    index = end + 1;
    continue;
  }

  if (/\s/.test(current)) {
    pendingSpace = true;
    continue;
  }

  if (pendingSpace) {
    const previous = output.at(-1);
    if (previous && !noSpaceAfter.has(previous) && !noSpaceBefore.has(current)) output += ' ';
    pendingSpace = false;
  }

  output += current;
}

if (quote) throw new Error('Niezamknięty ciąg znaków CSS');

let depth = 0;
let activeQuote = '';
for (let index = 0; index < output.length; index += 1) {
  const current = output[index];
  if (activeQuote) {
    if (current === '\\') index += 1;
    else if (current === activeQuote) activeQuote = '';
    continue;
  }
  if (current === '"' || current === "'") activeQuote = current;
  else if (current === '{') depth += 1;
  else if (current === '}') depth -= 1;
  if (depth < 0) throw new Error('Niepoprawne nawiasy klamrowe CSS');
}
if (depth !== 0) throw new Error('Niezrównoważone nawiasy klamrowe CSS');

await writeFile(outputPath, output.trim() + '\n');
console.log(JSON.stringify({
  sourceBytes: Buffer.byteLength(source),
  minifiedBytes: Buffer.byteLength(output),
  savedBytes: Buffer.byteLength(source) - Buffer.byteLength(output)
}, null, 2));
