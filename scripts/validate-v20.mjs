import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const files = await walk(root);
const htmlFiles = files.filter(file => file.endsWith('.html'));
const documents = await Promise.all(htmlFiles.map(async file => ({ file, html: await readFile(file, 'utf8') })));
const content = documents.filter(item => item.html.includes('<footer class="footer">'));

expect(htmlFiles.length === 149, `Oczekiwano 149 HTML, znaleziono ${htmlFiles.length}`);
expect(content.length === 110, `Oczekiwano 110 stron treści, znaleziono ${content.length}`);
expect(content.every(item => item.html.includes('data-social="facebook" data-placement="footer"')), 'Nie każda stopka zawiera Facebook');
expect(documents.filter(item => item.html.includes('data-social="facebook" data-placement="contact"')).length === 5, 'Niepoprawna liczba stron kontaktu z Facebookiem');
expect(documents.filter(item => item.html.includes('class="success-box') && item.html.includes('role="status"')).length === 11, 'Niepoprawna liczba dostępnych formularzy');
expect(documents.filter(item => item.html.includes('System rezerwacji IdoBooking') || item.html.includes('IdoBooking reservation system') || item.html.includes('Reservierungssystem IdoBooking') || item.html.includes('Rezervační systém IdoBooking') || item.html.includes('Система бронювання IdoBooking')).length === 10, 'Niepoprawna liczba polityk IdoBooking');

let jsonLdBlocks = 0;
let facebookSameAs = 0;
for (const { file, html } of documents) {
  const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), match => match[1]);
  expect(new Set(ids).size === ids.length, `Powielony identyfikator HTML: ${file}`);

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    jsonLdBlocks += 1;
    let data;
    try { data = JSON.parse(match[1]); }
    catch (error) { throw new Error(`Niepoprawny JSON-LD w ${file}: ${error.message}`); }
    const serialized = JSON.stringify(data);
    if (serialized.includes('"sameAs"') && serialized.includes('https://www.facebook.com/adagostay/')) facebookSameAs += 1;
  }
}
expect(facebookSameAs === 21, `Oczekiwano 21 schematów sameAs z Facebookiem, znaleziono ${facebookSameAs}`);

let apartmentPages = 0;
for (const lang of ['pl', 'en', 'de', 'cz', 'ua']) {
  for (const apartment of ['oaza', 'antracyt', 'gold']) {
    const file = path.join(root, lang, 'apartament', apartment, 'index.html');
    const html = await readFile(file, 'utf8');
    expect(html.includes(`?apartment=${apartment}#availability-search`), `Brak preselekcji ${apartment}: ${file}`);
    expect(!html.includes('href="/#availability-search"') || lang !== 'pl', `Pozostało ogólne CTA: ${file}`);
    apartmentPages += 1;
  }
}
expect(apartmentPages === 15, 'Niepoprawna liczba stron apartamentów');

const policyDates = [
  '6 września 2026 r.', '6 September 2026.', '6. September 2026.', '6. září 2026.', '6 вересня 2026 року.'
];
for (const lang of ['pl', 'en', 'de', 'cz', 'ua']) {
  for (const policy of ['polityka-prywatnosci', 'polityka-cookies']) {
    const html = await readFile(path.join(root, lang, policy, 'index.html'), 'utf8');
    expect(policyDates.some(date => html.includes(date)), `Brak aktualnej daty: ${lang}/${policy}`);
  }
}

let internalReferences = 0;
for (const { file, html } of documents) {
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const reference = match[1];
    if (!reference || reference === '/') {
      await access(path.join(root, 'index.html'));
      internalReferences += 1;
      continue;
    }
    const relative = reference.replace(/^\//, '');
    const target = reference.endsWith('/') ? path.join(root, relative, 'index.html') : path.join(root, relative);
    try { await access(target); }
    catch { throw new Error(`Uszkodzone odwołanie ${reference} w ${file}`); }
    internalReferences += 1;
  }
}

const siteJs = await readFile(path.join(root, 'assets/js/site.js'), 'utf8');
const bookingJs = await readFile(path.join(root, 'assets/js/idobooking-widget.js'), 'utf8');
const reviewsJs = await readFile(path.join(root, 'assets/js/reviews-carousel.js'), 'utf8');
expect(!siteJs.includes('alert('), 'Pozostały alerty blokujące w formularzach');
expect(siteJs.includes("domains: ['adagostay.pl', 'client60336.idobooking.com', 'engine60336.idobooking.com']"), 'Brak konfiguracji międzydomenowej GA4');
expect(siteJs.includes("adagoTrack('click_facebook'"), 'Brak pomiaru kliknięć Facebooka');
expect(siteJs.includes("encodeURIComponent(message)"), 'Brak bezpiecznego kodowania wiadomości WhatsApp');
expect(bookingJs.includes("['oaza', 'Oaza — Szczawno-Zdrój', '10']"), 'Brak mapowania Oazy');
expect(bookingJs.includes("['antracyt', 'Antracyt — Szczawno-Zdrój', '11']"), 'Brak mapowania Antracytu');
expect(bookingJs.includes("['gold', 'Gold — Wałbrzych', '12']"), 'Brak mapowania Gold');
expect(reviewsJs.includes('userPaused'), 'Brak trwałej pauzy opinii');

console.log(JSON.stringify({
  htmlFiles: htmlFiles.length,
  contentPages: content.length,
  jsonLdBlocks,
  facebookSameAs,
  apartmentPages,
  internalReferences,
  result: 'OK'
}, null, 2));
