import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const facebook = 'https://www.facebook.com/adagostay/';
const facebookFooter = '<li><a href="https://www.facebook.com/adagostay/" data-social="facebook" data-placement="footer" target="_blank" rel="noopener noreferrer">Facebook</a></li>';

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

const htmlFiles = (await walk(root)).filter(file => file.endsWith('.html'));
const contentFiles = [];
let footerAdditions = 0;
let schemaAdditions = 0;
let successUpgrades = 0;
let footerFinal = 0;
let schemaFinal = 0;
let successFinal = 0;

for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const original = html;

  if (html.includes('<footer class="footer">')) {
    contentFiles.push(file);
    if (!html.includes('data-social="facebook" data-placement="footer"')) {
      const footerStart = html.indexOf('<footer class="footer">');
      const before = html.slice(0, footerStart);
      let footer = html.slice(footerStart);
      const whatsappItem = /<li>\s*<a href="https:\/\/wa\.me\/48786207695">WhatsApp<\/a>\s*<\/li>/;
      if (!whatsappItem.test(footer)) throw new Error(`Brak oczekiwanego WhatsApp w stopce: ${file}`);
      footer = footer.replace(whatsappItem, match => match + facebookFooter);
      html = before + footer;
      footerAdditions += 1;
    }
    if (html.slice(html.indexOf('<footer class="footer">')).includes('data-social="facebook" data-placement="footer"')) footerFinal += 1;
  }

  html = html.replace(/"sameAs":\[([^\]]*)\]/g, (whole, items) => {
    if (items.includes(facebook)) return whole;
    schemaAdditions += 1;
    return `"sameAs":[${items},"${facebook}"]`;
  });

  html = html.replace(/<div class="success-box([^>]*)>/g, (whole, attributes) => {
    if (whole.includes('role="status"')) return whole;
    successUpgrades += 1;
    return `<div class="success-box${attributes} role="status" aria-live="polite" aria-atomic="true" tabindex="-1">`;
  });
  schemaFinal += Array.from(html.matchAll(/"sameAs":\[([^\]]*)\]/g)).filter(match => match[1].includes(facebook)).length;
  successFinal += Array.from(html.matchAll(/<div class="success-box[^>]*role="status"/g)).length;

  html = html
    .replace(/\/assets\/css\/style\.css\?v=[^"']+/g, '/assets/css/style.css?v=20260906-20')
    .replace(/\/assets\/js\/site\.js\?v=[^"']+/g, '/assets/js/site.js?v=20260906-20')
    .replace(/\/assets\/js\/idobooking-widget\.js(?:\?v=[^"']+)?/g, '/assets/js/idobooking-widget.js?v=20260906-20')
    .replace(/\/assets\/js\/reviews-carousel\.js(?:\?v=[^"']+)?/g, '/assets/js/reviews-carousel.js?v=20260906-20');

  if (html !== original) await writeFile(file, html);
}

if (contentFiles.length !== 110) throw new Error(`Oczekiwano 110 stron treści, znaleziono ${contentFiles.length}`);
if (footerFinal !== 110) throw new Error(`Oczekiwano 110 stopek z FB, znaleziono ${footerFinal}`);
if (schemaFinal !== 21) throw new Error(`Oczekiwano 21 tablic sameAs z FB, znaleziono ${schemaFinal}`);
if (successFinal !== 11) throw new Error(`Oczekiwano 11 statusów formularzy, znaleziono ${successFinal}`);

const contactFiles = ['pl', 'en', 'de', 'cz', 'ua'].map(lang => path.join(root, lang, 'kontakt', 'index.html'));
let contactAdditions = 0;
let contactFinal = 0;
for (const file of contactFiles) {
  let html = await readFile(file, 'utf8');
  if (!html.includes('data-placement="contact"')) {
    const whatsappRow = /<div><strong>WhatsApp:<\/strong>\s*<a href="https:\/\/wa\.me\/48786207695">(?:\+48 786 207 695|WhatsApp)<\/a><\/div>/;
    if (!whatsappRow.test(html)) throw new Error(`Brak oczekiwanego wiersza kontaktu: ${file}`);
    const facebookRow = '<div><strong>Facebook:</strong> <a href="https://www.facebook.com/adagostay/" data-social="facebook" data-placement="contact" target="_blank" rel="noopener noreferrer">Adago Stay</a></div>';
    html = html.replace(whatsappRow, match => match + facebookRow);
    contactAdditions += 1;
    await writeFile(file, html);
  }
  if (html.includes('data-placement="contact"')) contactFinal += 1;
}
if (contactFinal !== 5) throw new Error(`Oczekiwano 5 stron kontaktu z FB, znaleziono ${contactFinal}`);

const apartmentRoutes = {
  pl: '/', en: '/en/', de: '/de/', cz: '/cz/', ua: '/ua/'
};
let apartmentPages = 0;
let apartmentLinks = 0;
for (const [lang, home] of Object.entries(apartmentRoutes)) {
  for (const apartment of ['oaza', 'antracyt', 'gold']) {
    const file = path.join(root, lang, 'apartament', apartment, 'index.html');
    let html = await readFile(file, 'utf8');
    const current = `href="${home}#availability-search"`;
    const target = `href="${home}?apartment=${apartment}#availability-search" data-booking-apartment="${apartment}"`;
    const matches = html.split(current).length - 1;
    if (!matches && !html.includes(target)) throw new Error(`Brak CTA rezerwacji na stronie: ${file}`);
    if (matches) {
      html = html.replaceAll(current, target);
      apartmentLinks += matches;
      await writeFile(file, html);
    } else {
      apartmentLinks += html.split(target).length - 1;
    }
    apartmentPages += 1;
  }
}
if (apartmentPages !== 15) throw new Error(`Oczekiwano 15 stron apartamentów, zmieniono ${apartmentPages}`);

const privacy = {
  pl: {
    before: '<h2>Przekazywanie poza EOG</h2>',
    block: '<h2>System rezerwacji IdoBooking</h2><p>Po wybraniu terminu i uruchomieniu kalendarza nawiązywane jest połączenie z zewnętrznym systemem IdoBooking. Dostawca systemu może przetwarzać dane techniczne niezbędne do działania usługi oraz dane podane podczas rezerwacji, w szczególności dane kontaktowe, informacje o pobycie i — zależnie od wybranej metody — dane potrzebne do zainicjowania lub obsługi płatności. Przetwarzanie służy sprawdzeniu dostępności, zawarciu i obsłudze rezerwacji oraz realizacji płatności. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=1" target="_blank" rel="noopener noreferrer">Więcej informacji zawiera polityka prywatności i bezpieczeństwa IdoBooking</a>.</p>',
    oldDate: '<p><strong>Ostatnia aktualizacja:</strong> 26 sierpnia 2026 r.</p>',
    newDate: '<p><strong>Ostatnia aktualizacja:</strong> 6 września 2026 r.</p>'
  },
  en: {
    before: '<h2>Transfers outside the EEA</h2>',
    block: '<h2>IdoBooking reservation system</h2><p>When a visitor selects dates and opens the booking calendar, a connection is made to the external IdoBooking system. The service provider may process technical data required to operate the service and information entered during the booking process, in particular contact details, stay details and — depending on the method selected — data required to initiate or handle a payment. This processing supports availability checks, conclusion and management of the booking, and payment processing. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=2" target="_blank" rel="noopener noreferrer">More information is available in the IdoBooking privacy and security policy</a>.</p>',
    oldDate: '<p><strong>Last updated:</strong> 26 August 2026.</p>',
    newDate: '<p><strong>Last updated:</strong> 6 September 2026.</p>'
  },
  de: {
    before: '<h2>Übermittlung außerhalb des EWR</h2>',
    block: '<h2>Reservierungssystem IdoBooking</h2><p>Wenn ein Nutzer Reisedaten auswählt und den Buchungskalender öffnet, wird eine Verbindung zum externen IdoBooking-System hergestellt. Der Anbieter kann technische Daten verarbeiten, die für den Betrieb des Dienstes erforderlich sind, sowie Angaben, die während der Buchung eingegeben werden, insbesondere Kontakt- und Aufenthaltsdaten und — je nach gewählter Methode — Daten, die zur Einleitung oder Abwicklung einer Zahlung erforderlich sind. Die Verarbeitung dient der Prüfung der Verfügbarkeit, dem Abschluss und der Abwicklung der Buchung sowie der Zahlungsabwicklung. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=3" target="_blank" rel="noopener noreferrer">Weitere Informationen enthält die Datenschutz- und Sicherheitsrichtlinie von IdoBooking</a>.</p>',
    oldDate: '<p><strong>Letzte Aktualisierung:</strong> 26. August 2026.</p>',
    newDate: '<p><strong>Letzte Aktualisierung:</strong> 6. September 2026.</p>'
  },
  cz: {
    before: '<h2>Předávání mimo EHP</h2>',
    block: '<h2>Rezervační systém IdoBooking</h2><p>Po výběru termínu a otevření rezervačního kalendáře se naváže spojení s externím systémem IdoBooking. Poskytovatel může zpracovávat technické údaje nezbytné pro fungování služby a údaje zadané během rezervace, zejména kontaktní údaje, údaje o pobytu a — podle zvolené metody — údaje potřebné k zahájení nebo zpracování platby. Zpracování slouží k ověření dostupnosti, uzavření a správě rezervace a provedení platby. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=37" target="_blank" rel="noopener noreferrer">Další informace jsou uvedeny v zásadách ochrany soukromí a bezpečnosti IdoBooking</a>.</p>',
    oldDate: '<p><strong>Poslední aktualizace:</strong> 18. srpna 2026.</p>',
    newDate: '<p><strong>Poslední aktualizace:</strong> 6. září 2026.</p>'
  },
  ua: {
    before: '<h2>Передача за межі ЄЕЗ</h2>',
    block: '<h2>Система бронювання IdoBooking</h2><p>Після вибору дат і відкриття календаря бронювання встановлюється з’єднання із зовнішньою системою IdoBooking. Постачальник може обробляти технічні дані, необхідні для роботи сервісу, а також дані, введені під час бронювання, зокрема контактні дані, відомості про проживання та — залежно від вибраного способу — дані, необхідні для ініціювання або обробки платежу. Обробка потрібна для перевірки наявності, укладення й виконання бронювання та проведення оплати. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=171" target="_blank" rel="noopener noreferrer">Докладніша інформація наведена в політиці конфіденційності та безпеки IdoBooking</a>.</p>',
    oldDate: '<p><strong>Останнє оновлення:</strong> 26 серпня 2026 року.</p>',
    newDate: '<p><strong>Останнє оновлення:</strong> 6 вересня 2026 року.</p>'
  }
};

const cookies = {
  pl: { before: '<h2>Mapa Google</h2>', block: '<h2>System rezerwacji IdoBooking</h2><p>Po wybraniu dat i kliknięciu „Sprawdź dostępność” ładowany jest zewnętrzny kalendarz IdoBooking. Dostawca może wtedy zapisywać lub odczytywać własne cookies albo inne informacje w pamięci przeglądarki, jeżeli są one niezbędne do działania kalendarza, rezerwacji lub płatności. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=1" target="_blank" rel="noopener noreferrer">Informacje o ewentualnych dodatkowych mechanizmach stosowanych w systemie udostępnia IdoBooking</a>.</p>' },
  en: { before: '<h2>Google Maps</h2>', block: '<h2>IdoBooking reservation system</h2><p>After dates are selected and “Check availability” is pressed, the external IdoBooking calendar is loaded. The provider may then store or access its own cookies or other information in the browser where this is necessary for the booking calendar, reservation or payment flow to function. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=2" target="_blank" rel="noopener noreferrer">Information about any additional mechanisms used within the system is provided by IdoBooking</a>.</p>' },
  de: { before: '<h2>Google Maps</h2>', block: '<h2>Reservierungssystem IdoBooking</h2><p>Nach Auswahl der Reisedaten und Klick auf „Verfügbarkeit prüfen“ wird der externe IdoBooking-Kalender geladen. Der Anbieter kann dann eigene Cookies oder andere Informationen im Browser speichern oder auslesen, soweit dies für die Funktion des Kalenders, der Buchung oder der Zahlung erforderlich ist. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=3" target="_blank" rel="noopener noreferrer">Informationen über etwaige weitere im System eingesetzte Mechanismen stellt IdoBooking bereit</a>.</p>' },
  cz: { before: '<h2>Google Maps</h2>', block: '<h2>Rezervační systém IdoBooking</h2><p>Po výběru termínu a kliknutí na „Ověřit dostupnost“ se načte externí kalendář IdoBooking. Poskytovatel pak může v prohlížeči ukládat nebo číst vlastní cookies či jiné informace, pokud jsou nezbytné pro fungování kalendáře, rezervace nebo platby. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=37" target="_blank" rel="noopener noreferrer">Informace o případných dalších mechanismech používaných v systému poskytuje IdoBooking</a>.</p>' },
  ua: { before: '<h2>Google Maps</h2>', block: '<h2>Система бронювання IdoBooking</h2><p>Після вибору дат і натискання «Перевірити наявність» завантажується зовнішній календар IdoBooking. Після цього постачальник може зберігати або зчитувати власні cookies чи іншу інформацію в браузері, якщо це необхідно для роботи календаря, бронювання або оплати. <a href="https://client60336.idobooking.com/book-now/index.php?module=cookies&amp;displayOnToplayer=true&amp;language=171" target="_blank" rel="noopener noreferrer">Інформацію про інші механізми, які можуть використовуватися в системі, надає IdoBooking</a>.</p>' }
};

for (const lang of Object.keys(privacy)) {
  const privacyFile = path.join(root, lang, 'polityka-prywatnosci', 'index.html');
  let privacyHtml = await readFile(privacyFile, 'utf8');
  if (!privacyHtml.includes(privacy[lang].block)) {
    if (!privacyHtml.includes(privacy[lang].before)) throw new Error(`Brak kotwicy polityki prywatności: ${privacyFile}`);
    privacyHtml = privacyHtml.replace(privacy[lang].before, privacy[lang].block + '\n' + privacy[lang].before);
  }
  if (privacyHtml.includes(privacy[lang].oldDate)) privacyHtml = privacyHtml.replace(privacy[lang].oldDate, privacy[lang].newDate);
  else if (!privacyHtml.includes(privacy[lang].newDate)) throw new Error(`Brak właściwej daty polityki prywatności: ${privacyFile}`);
  await writeFile(privacyFile, privacyHtml);

  const cookieFile = path.join(root, lang, 'polityka-cookies', 'index.html');
  let cookieHtml = await readFile(cookieFile, 'utf8');
  if (!cookieHtml.includes(cookies[lang].block)) {
    if (!cookieHtml.includes(cookies[lang].before)) throw new Error(`Brak kotwicy polityki cookies: ${cookieFile}`);
    cookieHtml = cookieHtml.replace(cookies[lang].before, cookies[lang].block + '\n' + cookies[lang].before);
  }
  if (cookieHtml.includes(privacy[lang].oldDate)) cookieHtml = cookieHtml.replace(privacy[lang].oldDate, privacy[lang].newDate);
  else if (!cookieHtml.includes(privacy[lang].newDate)) throw new Error(`Brak właściwej daty polityki cookies: ${cookieFile}`);
  await writeFile(cookieFile, cookieHtml);
}

const generatorFile = path.join(root, 'scripts', 'generate-i18n-pages.mjs');
let generator = await readFile(generatorFile, 'utf8');
generator = generator
  .replace(/style\.css\?v=\d+-\d+/g, 'style.css?v=20260906-20')
  .replace(/site\.js\?v=\d+-\d+/g, 'site.js?v=20260906-20')
  .replace('<div class="success-box full" style="display:none">${c.fields.success}</div>', '<div class="success-box full" style="display:none" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">${c.fields.success}</div>');
await writeFile(generatorFile, generator);

console.log(JSON.stringify({
  contentPages: contentFiles.length,
  footerAdditions,
  contactAdditions,
  schemaAdditions,
  successUpgrades,
  apartmentPages,
  apartmentLinks,
  privacyPages: Object.keys(privacy).length,
  cookiePages: Object.keys(cookies).length
}, null, 2));
