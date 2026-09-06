import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = '20260906-21';
const bookingBase = 'https://client60336.idobooking.com/book-now/booking/defaultchoice';
const ratingPattern = /(?:4[,.]9|9[,.]6|9[,.]3|8[,.]5|9[,.]2)(?:\s*\/\s*(?:5|10))?/g;

const homepages = {
  pl: {
    file: 'index.html',
    url: 'https://adagostay.pl/',
    languageId: 1,
    inLanguage: 'pl',
    lead: '<strong>Apartamenty w Szczawnie-Zdroju i Wałbrzychu.</strong> Oaza, Antracyt i Gold — trzy dopracowane wnętrza. Zobacz prawdziwe zdjęcia, wybierz termin i zarezerwuj bez prowizji.',
    direct: 'Otwórz bezpieczną rezerwację w pełnym oknie',
    listName: 'Apartamenty Adago Stay'
  },
  en: {
    file: 'en/index.html',
    url: 'https://adagostay.pl/en/',
    languageId: 2,
    inLanguage: 'en',
    lead: '<strong>Apartments in Szczawno-Zdrój and Wałbrzych.</strong> Oaza, Antracyt and Gold are three distinctive interiors. See real photos, choose your dates and book without intermediary fees.',
    direct: 'Open secure booking in a full window',
    listName: 'Adago Stay apartments'
  },
  de: {
    file: 'de/index.html',
    url: 'https://adagostay.pl/de/',
    languageId: 3,
    inLanguage: 'de',
    lead: '<strong>Apartments in Szczawno-Zdrój und Wałbrzych.</strong> Oaza, Antracyt und Gold bieten drei unverwechselbare Wohnwelten. Sehen Sie echte Fotos, wählen Sie Ihren Termin und buchen Sie ohne Vermittlungsgebühr.',
    direct: 'Sichere Buchung im Vollbild öffnen',
    listName: 'Adago Stay Apartments'
  },
  cs: {
    file: 'cz/index.html',
    url: 'https://adagostay.pl/cz/',
    languageId: 37,
    inLanguage: 'cs',
    lead: '<strong>Apartmány v lokalitách Szczawno-Zdrój a Wałbrzych.</strong> Oaza, Antracyt a Gold nabízejí tři odlišné interiéry. Prohlédněte si skutečné fotografie, vyberte termín a rezervujte bez provize.',
    direct: 'Otevřít bezpečnou rezervaci v plném okně',
    listName: 'Apartmány Adago Stay'
  },
  uk: {
    file: 'ua/index.html',
    url: 'https://adagostay.pl/ua/',
    languageId: 171,
    inLanguage: 'uk',
    lead: '<strong>Апартаменти у Szczawno-Zdrój та Wałbrzych.</strong> Oaza, Antracyt і Gold — три різні інтер’єри. Перегляньте справжні фотографії, оберіть дати та бронюйте без комісії.',
    direct: 'Відкрити безпечне бронювання у повному вікні',
    listName: 'Апартаменти Adago Stay'
  }
};

const localizedApartmentUrls = {
  pl: ['https://adagostay.pl/pl/apartament/oaza/', 'https://adagostay.pl/pl/apartament/antracyt/', 'https://adagostay.pl/pl/apartament/gold/'],
  en: ['https://adagostay.pl/en/apartament/oaza/', 'https://adagostay.pl/en/apartament/antracyt/', 'https://adagostay.pl/en/apartament/gold/'],
  de: ['https://adagostay.pl/de/apartament/oaza/', 'https://adagostay.pl/de/apartament/antracyt/', 'https://adagostay.pl/de/apartament/gold/'],
  cs: ['https://adagostay.pl/cz/apartament/oaza/', 'https://adagostay.pl/cz/apartament/antracyt/', 'https://adagostay.pl/cz/apartament/gold/'],
  uk: ['https://adagostay.pl/ua/apartament/oaza/', 'https://adagostay.pl/ua/apartament/antracyt/', 'https://adagostay.pl/ua/apartament/gold/']
};

function organization() {
  return {
    '@type': 'Organization',
    '@id': 'https://adagostay.pl/#organization',
    name: 'Adago Stay',
    legalName: 'Adam Grabczyński Adago Apartamenty',
    url: 'https://adagostay.pl/',
    taxID: '6922479250',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ul. Górna 5',
      postalCode: '58-310',
      addressLocality: 'Szczawno-Zdrój',
      addressCountry: 'PL'
    },
    logo: { '@id': 'https://adagostay.pl/#logo' },
    brand: { '@id': 'https://adagostay.pl/#brand' },
    telephone: '+48 786 207 695',
    email: 'adagostay@gmail.com',
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+48 786 207 695',
      url: 'https://wa.me/48786207695',
      availableLanguage: ['Polish', 'English', 'German', 'Czech', 'Ukrainian']
    }],
    sameAs: [
      'https://www.google.com/maps?cid=9439642969662825551',
      'https://www.facebook.com/adagostay/'
    ]
  };
}

function brand() {
  return {
    '@type': 'Brand',
    '@id': 'https://adagostay.pl/#brand',
    name: 'Adago Stay',
    logo: { '@id': 'https://adagostay.pl/#logo' }
  };
}

function logo() {
  return {
    '@type': 'ImageObject',
    '@id': 'https://adagostay.pl/#logo',
    url: 'https://adagostay.pl/assets/img/logo.svg',
    contentUrl: 'https://adagostay.pl/assets/img/logo.svg'
  };
}

function website() {
  return {
    '@type': 'WebSite',
    '@id': 'https://adagostay.pl/#website',
    url: 'https://adagostay.pl/',
    name: 'Adago Stay',
    publisher: { '@id': 'https://adagostay.pl/#organization' },
    inLanguage: ['pl', 'en', 'de', 'cs', 'uk']
  };
}

function titleOf(html) {
  const match = html.match(/<title>([^<]+)<\/title>/);
  if (!match) throw new Error('Brak title');
  return match[1].replaceAll('&amp;', '&');
}

function descriptionOf(html) {
  const match = html.match(/<meta content="([^"]+)" name="description">/);
  if (!match) throw new Error('Brak meta description');
  return match[1].replaceAll('&amp;', '&');
}

function homeSchema(config, html) {
  const apartments = localizedApartmentUrls[config.inLanguage];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      brand(),
      logo(),
      website(),
      {
        '@type': 'WebPage',
        '@id': config.url + '#webpage',
        url: config.url,
        name: titleOf(html),
        description: descriptionOf(html),
        inLanguage: config.inLanguage,
        isPartOf: { '@id': 'https://adagostay.pl/#website' },
        about: { '@id': 'https://adagostay.pl/#organization' },
        mainEntity: { '@id': config.url + '#apartments' }
      },
      {
        '@type': 'ItemList',
        '@id': config.url + '#apartments',
        name: config.listName,
        numberOfItems: 3,
        itemListElement: ['Oaza', 'Antracyt', 'Gold'].map((name, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name,
          url: apartments[index],
          item: { '@id': `https://adagostay.pl/#apartment-${name.toLowerCase()}` }
        }))
      }
    ]
  };
}

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

function replaceJsonLd(html, transform) {
  let replaced = false;
  const output = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (whole, raw) => {
    const current = JSON.parse(raw);
    const next = transform(current);
    replaced = true;
    return `<script type="application/ld+json">${JSON.stringify(next)}</script>`;
  });
  if (!replaced) throw new Error('Brak JSON-LD do zmiany');
  return output;
}

function ratingSignature(html) {
  return [...new Set(html.match(ratingPattern) || [])].sort().join('|');
}

function splitContactField(html, prefix) {
  const current = `<div><label for="${prefix}-contact">Telefon lub e-mail</label><input id="${prefix}-contact" name="contact" placeholder="+48 ... lub e-mail" required="" type="text" autocomplete="on"></div>\n</div>\n<div><label for="${prefix}-message">`;
  if (!html.includes(current)) return html;
  const replacement = `<div><label for="${prefix}-email">E-mail</label><input id="${prefix}-email" name="email" placeholder="np. imie@domena.pl" required="" type="email" autocomplete="email"></div>\n</div>\n<div><label for="${prefix}-phone">Telefon (opcjonalnie)</label><input id="${prefix}-phone" name="phone" placeholder="+48 ..." type="tel" autocomplete="tel" inputmode="tel"></div>\n<div><label for="${prefix}-message">`;
  return html.replace(current, replacement);
}

function transformApartmentSchema(schema, language, apartment, pageUrl) {
  const graph = schema['@graph'];
  if (!Array.isArray(graph)) throw new Error(`Brak @graph: ${pageUrl}`);
  const stableId = `https://adagostay.pl/#apartment-${apartment}`;
  const page = graph.find(node => node['@type'] === 'WebPage');
  const lodging = graph.find(node => node['@type'] === 'Apartment');
  const orgIndex = graph.findIndex(node => node['@type'] === 'Organization');
  if (!page || !lodging || orgIndex < 0) throw new Error(`Niepełny schemat apartamentu: ${pageUrl}`);

  graph[orgIndex] = organization();
  if (!graph.some(node => node['@type'] === 'Brand')) graph.splice(orgIndex + 1, 0, brand(), logo());
  page.mainEntity = { '@id': stableId };
  page.publisher = { '@id': 'https://adagostay.pl/#organization' };

  lodging['@id'] = stableId;
  lodging.identifier = `adago-${apartment}`;
  lodging.mainEntityOfPage = { '@id': page['@id'] };
  lodging.occupancy = {
    '@type': 'QuantitativeValue',
    minValue: 1,
    maxValue: Number(lodging.occupancy?.maxValue || (apartment === 'antracyt' ? 2 : 4)),
    unitCode: 'C62'
  };
  lodging.petsAllowed = false;
  lodging.smokingAllowed = false;
  lodging.tourBookingPage = `${homepages[language].url}?apartment=${apartment}#availability-search`;
  if (apartment === 'oaza' || apartment === 'gold') lodging.numberOfBedrooms = 1;
  else delete lodging.numberOfBedrooms;
  delete lodging.provider;

  if (apartment === 'gold' && language !== 'pl') {
    const selfCheckIn = {
      en: 'Self check-in', de: 'Self Check-in', cs: 'Self check-in', uk: 'Self check-in'
    }[language];
    lodging.amenityFeature = (lodging.amenityFeature || []).map(feature => {
      if (/parking|parkplatz|parkování|паркування/i.test(feature.name || '')) {
        return { ...feature, name: selfCheckIn };
      }
      return feature;
    });
  }
  return schema;
}

function transformInformationPageSchema(schema) {
  if (schema['@type'] !== 'WebPage' || schema.about?.['@type'] !== 'LodgingBusiness') return schema;
  const page = { ...schema };
  page['@id'] = `${page.url}#webpage`;
  page.isPartOf = { '@id': 'https://adagostay.pl/#website' };
  page.about = { '@id': 'https://adagostay.pl/#organization' };
  page.publisher = { '@id': 'https://adagostay.pl/#organization' };
  return {
    '@context': 'https://schema.org',
    '@graph': [organization(), brand(), logo(), website(), page]
  };
}

function transformBusinessPageSchema(schema) {
  const graph = schema['@graph'];
  if (!Array.isArray(graph)) return schema;
  const orgIndex = graph.findIndex(node => node['@type'] === 'Organization');
  if (orgIndex < 0) return schema;
  graph[orgIndex] = organization();
  if (!graph.some(node => node['@type'] === 'Brand')) graph.splice(orgIndex + 1, 0, brand(), logo(), website());
  const page = graph.find(node => node['@type'] === 'WebPage');
  if (page) {
    page.isPartOf = { '@id': 'https://adagostay.pl/#website' };
    page.about = { '@id': 'https://adagostay.pl/#organization' };
    page.publisher = { '@id': 'https://adagostay.pl/#organization' };
  }
  return schema;
}

const htmlFiles = (await walk(root)).filter(file => file.endsWith('.html'));
let changedFiles = 0;
let contactForms = 0;
let apartmentSchemas = 0;
let informationPageSchemas = 0;
let businessPageSchemas = 0;

for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const original = html;
  const beforeRatings = ratingSignature(html);

  html = html
    .replace(/\/assets\/css\/style(?:\.min)?\.css\?v=[^"']+/g, `/assets/css/style.min.css?v=${version}`)
    .replace(/\/assets\/js\/site\.js\?v=[^"']+/g, `/assets/js/site.js?v=${version}`)
    .replace(/\/assets\/js\/idobooking-widget\.js(?:\?v=[^"']+)?/g, `/assets/js/idobooking-widget.js?v=${version}`)
    .replace(/\/assets\/js\/reviews-carousel\.js(?:\?v=[^"']+)?/g, `/assets/js/reviews-carousel.js?v=${version}`);

  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const homeEntry = Object.entries(homepages).find(([, config]) => config.file === relative);
  if (homeEntry) {
    const [language, config] = homeEntry;
    html = html.replace(/<p class="conversion-home-lead">[\s\S]*?<\/p>/, `<p class="conversion-home-lead">${config.lead}</p>`);
    if (!html.includes('data-idobooking-direct')) {
      const directUrl = `${bookingBase}/currency/0/language/${config.languageId}?transparentbackground=1&amp;from_own_button=1`;
      const directLink = `<a class="idobooking-external-cta idobooking-direct-cta" data-idobooking-direct href="${directUrl}" rel="noopener noreferrer" target="_blank">${config.direct}</a>`;
      html = html.replace(/<span class="conversion-home-engine-link">[\s\S]*?<\/span>/, directLink);
    }
    html = replaceJsonLd(html, () => homeSchema(config, html));

    if (language === 'pl') {
      html = html.replace(/<section class="ultra-section light">\s*<div class="container ultra-proof-grid">[\s\S]*?<\/section>\s*(<section class="guest-reviews-section)/, '$1');
    }

    if (language !== 'pl') {
      const parkingLabels = {
        en: '<span class="tag">Free parking</span>',
        de: '<span class="tag">Kostenloser Parkplatz</span>',
        cs: '<span class="tag">Parkování zdarma</span>',
        uk: '<span class="tag">Безкоштовне паркування</span>'
      };
      html = html.replace(/(<article class="card apartment-card apartment-gold-card">[\s\S]*?<\/article>)/, card => card.replace(parkingLabels[language], ''));
    }
  }

  for (const prefix of ['home-main', 'apt-oaza', 'apt-antracyt', 'apt-gold']) {
    const before = html;
    html = splitContactField(html, prefix);
    if (html !== before) contactForms += 1;
  }

  const apartmentMatch = relative.match(/^(pl|en|de|cz|ua)\/apartament\/(oaza|antracyt|gold)\/index\.html$/);
  if (apartmentMatch) {
    const languageMap = { pl: 'pl', en: 'en', de: 'de', cz: 'cs', ua: 'uk' };
    const language = languageMap[apartmentMatch[1]];
    const apartment = apartmentMatch[2];
    const pageUrl = `https://adagostay.pl/${apartmentMatch[1]}/apartament/${apartment}/`;
    html = replaceJsonLd(html, schema => transformApartmentSchema(schema, language, apartment, pageUrl));
    apartmentSchemas += 1;

    if (apartment === 'gold' && language !== 'pl') {
      const labels = {
        en: ['<span class="tag">Free parking</span>', 'Self check-in and free parking'],
        de: ['<span class="tag">Kostenloser Parkplatz</span>', 'Self Check-in und kostenloser Parkplatz'],
        cs: ['<span class="tag">Parkování zdarma</span>', 'Self check-in a parkování zdarma'],
        uk: ['<span class="tag">Безкоштовне паркування</span>', 'Self check-in і безкоштовне паркування']
      }[language];
      html = html.replace(labels[0], '').replaceAll(labels[1], language === 'de' ? 'Self Check-in' : 'Self check-in');
    }
  }

  if (/"@type"\s*:\s*"LodgingBusiness"/.test(html)) {
    const before = html;
    html = replaceJsonLd(html, transformInformationPageSchema);
    if (html !== before) informationPageSchemas += 1;
  }

  if (/^(pl\/dla-firm|en\/for-companies|de\/fuer-firmen|cz\/pro-firmy|ua\/dlia-kompanii)\/index\.html$/.test(relative)) {
    const before = html;
    html = replaceJsonLd(html, transformBusinessPageSchema);
    if (html !== before) businessPageSchemas += 1;
  }

  if (ratingSignature(html) !== beforeRatings) throw new Error(`Nieplanowana zmiana ocen: ${relative}`);
  if (html !== original) {
    await writeFile(file, html);
    changedFiles += 1;
  }
}

if (contactForms !== 4 && contactForms !== 0) throw new Error(`Oczekiwano 4 lub 0 zmian formularzy, wykonano ${contactForms}`);
if (apartmentSchemas !== 15) throw new Error(`Oczekiwano 15 schematów apartamentów, wykonano ${apartmentSchemas}`);
if (informationPageSchemas !== 25 && informationPageSchemas !== 0) throw new Error(`Oczekiwano 25 lub 0 schematów stron informacyjnych, wykonano ${informationPageSchemas}`);
if (businessPageSchemas !== 5 && businessPageSchemas !== 0) throw new Error(`Oczekiwano 5 lub 0 schematów stron firmowych, wykonano ${businessPageSchemas}`);

console.log(JSON.stringify({ version, htmlFiles: htmlFiles.length, changedFiles, contactForms, apartmentSchemas, informationPageSchemas, businessPageSchemas }, null, 2));
