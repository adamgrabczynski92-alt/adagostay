import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const languages = {
  en: { reviews: '/en/reviews/', business: '/en/for-companies/' },
  de: { reviews: '/de/bewertungen/', business: '/de/fuer-firmen/' },
  cz: { reviews: '/cz/recenze/', business: '/cz/pro-firmy/' },
  ua: { reviews: '/ua/vidhuky/', business: '/ua/dlia-kompanii/' },
};

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(target));
    else if (entry.name.endsWith('.html')) files.push(target);
  }
  return files;
}

for (const [dir, routes] of Object.entries(languages)) {
  for (const file of await htmlFiles(path.join(root, dir))) {
    const before = await readFile(file, 'utf8');
    const after = before
      .replaceAll(`href="/${dir}/#reviews"`, `href="${routes.reviews}"`)
      .replaceAll(`href="/${dir}/#benefits"`, `href="${routes.business}"`);
    if (after !== before) await writeFile(file, after);
  }
}

const pageFamilies = {
  'pl/dla-firm/index.html': {
    alternates: '<link rel="alternate" hreflang="pl" href="https://adagostay.pl/pl/dla-firm/"><link rel="alternate" hreflang="en" href="https://adagostay.pl/en/for-companies/"><link rel="alternate" hreflang="de" href="https://adagostay.pl/de/fuer-firmen/"><link rel="alternate" hreflang="cs" href="https://adagostay.pl/cz/pro-firmy/"><link rel="alternate" hreflang="uk" href="https://adagostay.pl/ua/dlia-kompanii/"><link rel="alternate" hreflang="x-default" href="https://adagostay.pl/pl/dla-firm/">',
    switcher: '<div class="lang-switch"><a class="active" aria-current="page" href="/pl/dla-firm/">PL</a><a href="/en/for-companies/">EN</a><a href="/de/fuer-firmen/">DE</a><a href="/cz/pro-firmy/">CZ</a><a href="/ua/dlia-kompanii/">UA</a></div>',
    oldAlternates: /<link rel="alternate" hreflang="pl" href="https:\/\/adagostay\.pl\/pl\/dla-firm\/">(?:<link rel="alternate" hreflang="(?:en|de|cs|uk)" href="[^"]+">)*<link rel="alternate" hreflang="x-default" href="https:\/\/adagostay\.pl\/pl\/dla-firm\/">/,
    oldSwitcher: /<div class="lang-switch"><a class="active" aria-current="page" href="\/pl\/dla-firm\/">PL<\/a><a href="\/(?:en\/for-companies\/|en\/)">EN<\/a><a href="\/(?:de\/fuer-firmen\/|de\/)">DE<\/a><a href="\/(?:cz\/pro-firmy\/|cz\/)">CZ<\/a><a href="\/(?:ua\/dlia-kompanii\/|ua\/)">UA<\/a><\/div>/,
  },
  'pl/opinie/index.html': {
    alternates: '<link href="https://adagostay.pl/pl/opinie/" hreflang="pl" rel="alternate"><link href="https://adagostay.pl/en/reviews/" hreflang="en" rel="alternate"><link href="https://adagostay.pl/de/bewertungen/" hreflang="de" rel="alternate"><link href="https://adagostay.pl/cz/recenze/" hreflang="cs" rel="alternate"><link href="https://adagostay.pl/ua/vidhuky/" hreflang="uk" rel="alternate"><link href="https://adagostay.pl/pl/opinie/" hreflang="x-default" rel="alternate">',
    switcher: '<div class="lang-switch"><a class="active" aria-current="page" href="/pl/opinie/">PL</a><a href="/en/reviews/">EN</a><a href="/de/bewertungen/">DE</a><a href="/cz/recenze/">CZ</a><a href="/ua/vidhuky/">UA</a></div>',
    oldAlternates: /<link href="https:\/\/adagostay\.pl\/pl\/opinie\/" hreflang="pl" rel="alternate">(?:<link href="[^"]+" hreflang="(?:en|de|cs|uk)" rel="alternate">)*<link href="https:\/\/adagostay\.pl\/pl\/opinie\/" hreflang="x-default" rel="alternate">/,
    oldSwitcher: /<div class="lang-switch"><a class="active" aria-current="page" href="\/(?:pl\/opinie\/)?">PL<\/a><a href="\/(?:en\/reviews\/|en\/)">EN<\/a><a href="\/(?:de\/bewertungen\/|de\/)">DE<\/a><a href="\/(?:cz\/recenze\/|cz\/)">CZ<\/a><a href="\/(?:ua\/vidhuky\/|ua\/)">UA<\/a><\/div>/,
  },
};

for (const [relative, config] of Object.entries(pageFamilies)) {
  const file = path.join(root, relative);
  const before = await readFile(file, 'utf8');
  const after = before
    .replace(config.oldAlternates, config.alternates)
    .replace(config.oldSwitcher, config.switcher);
  if (after === before) throw new Error(`Expected family links were not found in ${relative}`);
  await writeFile(file, after);
}

console.log('Updated navigation and language-family links.');
