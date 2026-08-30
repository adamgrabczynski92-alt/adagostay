import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const widths = {
  'antracyt/1': 1044, 'antracyt/2': 1024, 'antracyt/3': 1024,
  'antracyt/4': 1024, 'antracyt/5': 1024, 'antracyt/6': 1023,
  'antracyt/7': 1013, 'antracyt/8': 1105, 'antracyt/9': 1024,
  'antracyt/hero': 1672,
  'gold/1': 1024, 'gold/2': 1096, 'gold/3': 1068, 'gold/4': 1023,
  'gold/5': 1024, 'gold/6': 1023, 'gold/7': 1036, 'gold/hero': 1672,
  'oaza/1': 1063, 'oaza/2': 1024, 'oaza/3': 1023, 'oaza/4': 1024,
  'oaza/5': 1138, 'oaza/6': 1024, 'oaza/7': 1023, 'oaza/hero': 1672,
};

async function htmlFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}

let changed = 0;
for (const file of await htmlFiles(root)) {
  const source = await readFile(file, 'utf8');
  const updated = source.replace(/<img\b[^>]*\bsrc="\/assets\/img\/(oaza|antracyt|gold)\/(hero|[1-9])\.webp"[^>]*>/g, (tag, apartment, image) => {
    if (/\bsrcset=/.test(tag)) return tag;
    const key = `${apartment}/${image}`;
    const originalWidth = widths[key];
    if (!originalWidth) return tag;
    const responsiveWidth = image === 'hero' ? 960 : 640;
    const sizes = image === 'hero'
      ? '100vw'
      : '(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw';
    const marker = `src="/assets/img/${key}.webp"`;
    const attrs = `srcset="/assets/img/${key}-${responsiveWidth}.webp ${responsiveWidth}w, /assets/img/${key}.webp ${originalWidth}w" sizes="${sizes}"`;
    return tag.replace(marker, `${marker} ${attrs}`);
  });
  if (updated !== source) {
    await writeFile(file, updated);
    changed += 1;
  }
}

console.log(`Responsive image markup updated in ${changed} HTML files.`);
