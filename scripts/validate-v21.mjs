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
let homeSchemas = 0;
let forbiddenRatingSchemas = 0;
let providerOnApartment = 0;
let lodgingBusinessSchemas = 0;
let normalizedInformationPages = 0;
let normalizedOrganizations = 0;
let normalizedBusinessPages = 0;
const stableApartmentCounts = new Map();
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
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    if (/"(?:AggregateRating|Review|ratingValue|reviewRating)"/.test(serialized)) forbiddenRatingSchemas += 1;
    if (/"LodgingBusiness"/.test(serialized)) lodgingBusinessSchemas += 1;
    for (const node of graph) {
      if (node['@type'] === 'Organization') {
        expect(node['@id'] === 'https://adagostay.pl/#organization', `Niestabilne @id Organization: ${file}`);
        expect(node.legalName === 'Adam Grabczyński Adago Apartamenty' && node.taxID === '6922479250', `Niepełna identyfikacja firmy: ${file}`);
        expect(node.brand?.['@id'] === 'https://adagostay.pl/#brand', `Brak spójnej marki: ${file}`);
        expect(Array.isArray(node.sameAs) && node.sameAs.includes('https://www.facebook.com/adagostay/'), `Brak Facebooka w Organization: ${file}`);
        expect(!node.sameAs.includes('https://wa.me/48786207695') && node.contactPoint?.[0]?.url === 'https://wa.me/48786207695', `WhatsApp powinien być ContactPoint: ${file}`);
        normalizedOrganizations += 1;
      }
      if (node['@type'] === 'Apartment') {
        if (Object.hasOwn(node, 'provider')) providerOnApartment += 1;
        const count = stableApartmentCounts.get(node['@id']) || 0;
        stableApartmentCounts.set(node['@id'], count + 1);
        expect(node.identifier === `adago-${node['@id'].split('-').at(-1)}`, `Niepoprawny identifier apartamentu: ${file}`);
        expect(node.occupancy?.minValue === 1 && node.occupancy?.unitCode === 'C62', `Niepełna occupancy: ${file}`);
        expect(node.petsAllowed === false && node.smokingAllowed === false, `Brak zasad pets/smoking w schema: ${file}`);
        expect(String(node.tourBookingPage || '').includes('?apartment='), `Brak tourBookingPage: ${file}`);
      }
    }
    if (['index.html', 'en/index.html', 'de/index.html', 'cz/index.html', 'ua/index.html'].includes(path.relative(root, file).replaceAll(path.sep, '/'))) {
      const types = new Set(graph.map(node => node['@type']));
      for (const type of ['Organization', 'Brand', 'ImageObject', 'WebSite', 'WebPage', 'ItemList']) {
        expect(types.has(type), `Brak ${type} w schema strony głównej: ${file}`);
      }
      expect(!types.has('LodgingBusiness'), `Strona główna nadal łączy trzy lokale jako LodgingBusiness: ${file}`);
      homeSchemas += 1;
    }
    const relativeSchemaFile = path.relative(root, file).replaceAll(path.sep, '/');
    if (/^(pl|en|de|cz|ua)\/(kontakt|polityka-cookies|polityka-prywatnosci|regulamin|rezerwacja-i-anulacja)\/index\.html$/.test(relativeSchemaFile)) {
      const types = new Set(graph.map(node => node['@type']));
      const page = graph.find(node => node['@type'] === 'WebPage');
      expect(['Organization', 'Brand', 'ImageObject', 'WebSite', 'WebPage'].every(type => types.has(type)), `Niepełny schemat strony informacyjnej: ${file}`);
      expect(page?.about?.['@id'] === 'https://adagostay.pl/#organization', `Błędne about strony informacyjnej: ${file}`);
      normalizedInformationPages += 1;
    }
    if (/^(pl\/dla-firm|en\/for-companies|de\/fuer-firmen|cz\/pro-firmy|ua\/dlia-kompanii)\/index\.html$/.test(relativeSchemaFile)) {
      const types = new Set(graph.map(node => node['@type']));
      expect(['Organization', 'Brand', 'ImageObject', 'WebSite', 'WebPage', 'Service'].every(type => types.has(type)), `Niepełny schemat strony firmowej: ${file}`);
      normalizedBusinessPages += 1;
    }
  }

  for (const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    const rel = link[0].match(/rel="([^"]+)"/)?.[1] || '';
    expect(rel.includes('noopener') && rel.includes('noreferrer'), `Brak bezpiecznego rel przy target=_blank: ${file}`);
  }
}
expect(facebookSameAs >= 20, `Zbyt mało schematów sameAs z Facebookiem: ${facebookSameAs}`);
expect(homeSchemas === 5, `Oczekiwano 5 nowych schematów stron głównych, znaleziono ${homeSchemas}`);
expect(forbiddenRatingSchemas === 0, 'Oceny lub cudze recenzje nie mogą być deklarowane w JSON-LD');
expect(lodgingBusinessSchemas === 0, 'Marka nadal jest błędnie przedstawiana jako jeden LodgingBusiness');
expect(normalizedInformationPages === 25, `Oczekiwano 25 spójnych schematów stron informacyjnych, znaleziono ${normalizedInformationPages}`);
expect(normalizedBusinessPages === 5, `Oczekiwano 5 spójnych schematów stron firmowych, znaleziono ${normalizedBusinessPages}`);
expect(normalizedOrganizations === 50, `Oczekiwano 50 spójnych encji Organization, znaleziono ${normalizedOrganizations}`);
expect(providerOnApartment === 0, 'Niedozwolona właściwość provider pozostała przy Apartment');
expect(stableApartmentCounts.size === 3, `Oczekiwano 3 stabilnych encji apartamentów, znaleziono ${stableApartmentCounts.size}`);
for (const apartment of ['oaza', 'antracyt', 'gold']) {
  const id = `https://adagostay.pl/#apartment-${apartment}`;
  expect(stableApartmentCounts.get(id) === 5, `Encja ${apartment} nie występuje w 5 językach`);
}

let apartmentPages = 0;
for (const lang of ['pl', 'en', 'de', 'cz', 'ua']) {
  for (const apartment of ['oaza', 'antracyt', 'gold']) {
    const file = path.join(root, lang, 'apartament', apartment, 'index.html');
    const html = await readFile(file, 'utf8');
    expect(html.includes(`?apartment=${apartment}#availability-search`), `Brak preselekcji ${apartment}: ${file}`);
    expect(!html.includes('href="/#availability-search"') || lang !== 'pl', `Pozostało ogólne CTA: ${file}`);
    const decimal = lang === 'en' ? '.' : ',';
    const expectedScore = { oaza: `9${decimal}3`, antracyt: `8${decimal}5`, gold: `9${decimal}2` }[apartment];
    expect(html.includes(expectedScore), `Zmieniła się lub zniknęła ocena ${apartment}: ${file}`);
    if (apartment === 'gold' && lang !== 'pl') {
      const unsupportedParking = /Free parking|Kostenloser Parkplatz|Parkování zdarma|Безкоштовне паркування|free parking|kostenloser Parkplatz|parkování zdarma|безкоштовне паркування/i;
      expect(!unsupportedParking.test(html), `Niepotwierdzony parking Gold pozostał w ${file}`);
    }
    apartmentPages += 1;
  }
}
expect(apartmentPages === 15, 'Niepoprawna liczba stron apartamentów');

const homepage = await readFile(path.join(root, 'index.html'), 'utf8');
expect(homepage.includes('9,6 Booking'), 'Ocena Booking 9,6 na stronie głównej miała pozostać bez zmian');
expect(homepage.includes('<strong>Apartamenty w Szczawnie-Zdroju i Wałbrzychu.</strong>'), 'Brak lokalnej frazy przy H1');
expect(!homepage.includes('Zaufanie przed decyzją'), 'Pozostała powtórzona sekcja opinii na stronie głównej');

const directBooking = [
  ['index.html', '/language/1'],
  ['en/index.html', '/language/2'],
  ['de/index.html', '/language/3'],
  ['cz/index.html', '/language/37'],
  ['ua/index.html', '/language/171']
];
for (const [relative, languageToken] of directBooking) {
  const html = await readFile(path.join(root, relative), 'utf8');
  const match = html.match(/<a[^>]*data-idobooking-direct[^>]*href="([^"]+)"[^>]*>/);
  expect(match && match[1].includes(languageToken), `Brak poprawnego bezpośredniego IdoBooking: ${relative}`);
}

const splitForms = [
  ['index.html', 'home-main'],
  ['pl/apartament/oaza/index.html', 'apt-oaza'],
  ['pl/apartament/antracyt/index.html', 'apt-antracyt'],
  ['pl/apartament/gold/index.html', 'apt-gold']
];
expect(content.every(item => !item.html.includes('name="contact"')), 'Pozostało niejednoznaczne pole Telefon lub e-mail');
for (const [relative, prefix] of splitForms) {
  const html = await readFile(path.join(root, relative), 'utf8');
  expect(new RegExp(`id="${prefix}-email"[^>]*name="email"[^>]*required`).test(html), `Brak wymaganego e-maila: ${relative}`);
  expect(new RegExp(`id="${prefix}-phone"[^>]*name="phone"[^>]*type="tel"`).test(html), `Brak opcjonalnego telefonu: ${relative}`);
}

const styledDocuments = documents.filter(item => item.html.includes('/assets/css/'));
const scriptedDocuments = documents.filter(item => item.html.includes('/assets/js/site.js'));
expect(styledDocuments.every(item => item.html.includes('/assets/css/style.min.css?v=20260906-21') && !item.html.includes('/assets/css/style.css?')), 'Niespójny plik lub token CSS V21');
expect(scriptedDocuments.every(item => item.html.includes('/assets/js/site.js?v=20260906-21')), 'Niespójny token site.js V21');
await access(path.join(root, 'assets/css/style.min.css'));

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
expect(bookingJs.includes("booking_mode: 'top_level'"), 'Brak pomiaru rezerwacji w pełnym oknie');
expect(bookingJs.includes("booking_mode: 'embedded'"), 'Brak pomiaru osadzonej rezerwacji');
expect(bookingJs.includes("document.querySelectorAll('[data-idobooking-direct]')"), 'Brak synchronizacji bezpośrednich linków IdoBooking');
expect(reviewsJs.includes('userPaused'), 'Brak trwałej pauzy opinii');

console.log(JSON.stringify({
  htmlFiles: htmlFiles.length,
  contentPages: content.length,
  jsonLdBlocks,
  facebookSameAs,
  homeSchemas,
  normalizedInformationPages,
  normalizedBusinessPages,
  normalizedOrganizations,
  stableApartmentEntities: stableApartmentCounts.size,
  apartmentPages,
  directBookingLinks: directBooking.length,
  splitContactForms: splitForms.length,
  styledDocuments: styledDocuments.length,
  internalReferences,
  result: 'OK'
}, null, 2));
