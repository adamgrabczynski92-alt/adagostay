const adagoPendingAnalyticsEvents = [];

function adagoTrack(eventName, payload = {}) {
  try {
    document.dispatchEvent(new CustomEvent('adago:' + eventName, { detail: payload }));
    if (window.__adagoAnalyticsConsent === 'granted' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    } else if (window.__adagoAnalyticsConsent !== 'denied') {
      adagoPendingAnalyticsEvents.push({ eventName, payload });
      if (adagoPendingAnalyticsEvents.length > 20) adagoPendingAnalyticsEvents.shift();
    }
  } catch (e) {}
}
window.adagoTrack = adagoTrack;

const ADAGO_GA_ID = 'G-CR12PM6B8M';
const ADAGO_CONSENT_KEY = 'adago_analytics_consent_v1';
const ADAGO_MINIMUM_STAY_NIGHTS = 2;

function adagoLoadAnalytics() {
  if (window.__adagoAnalyticsLoaded) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
    return;
  }
  window.__adagoAnalyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('js', new Date());
  window.gtag('config', ADAGO_GA_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    linker: {
      domains: ['adagostay.pl', 'client60336.idobooking.com', 'engine60336.idobooking.com']
    }
  });
  while (adagoPendingAnalyticsEvents.length) {
    const event = adagoPendingAnalyticsEvents.shift();
    window.gtag('event', event.eventName, event.payload);
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ADAGO_GA_ID);
  document.head.appendChild(script);
}

function adagoConsentCopy() {
  const lang = adagoLanguage();
  const copy = {
    pl: { title: 'Analityka i prywatność', text: 'Za zgodą używamy Google Analytics do ulepszania strony. Odmowa nie wpływa na rezerwację.', accept: 'Akceptuję', reject: 'Odrzucam', settings: 'Ustawienia cookies', policy: '/pl/polityka-cookies/' },
    en: { title: 'Analytics and privacy', text: 'With your consent, we use Google Analytics to improve the website. Refusal does not affect booking.', accept: 'Accept', reject: 'Reject', settings: 'Cookie settings', policy: '/en/polityka-cookies/' },
    de: { title: 'Analyse und Datenschutz', text: 'Mit Ihrer Einwilligung nutzen wir Google Analytics zur Verbesserung der Website. Eine Ablehnung hat keinen Einfluss auf die Buchung.', accept: 'Akzeptieren', reject: 'Ablehnen', settings: 'Cookie-Einstellungen', policy: '/de/polityka-cookies/' },
    cs: { title: 'Analytika a soukromí', text: 'S vaším souhlasem používáme Google Analytics ke zlepšení webu. Odmítnutí nemá vliv na rezervaci.', accept: 'Přijmout', reject: 'Odmítnout', settings: 'Nastavení cookies', policy: '/cz/polityka-cookies/' },
    uk: { title: 'Аналітика та конфіденційність', text: 'За згодою ми використовуємо Google Analytics для покращення сайту. Відмова не впливає на бронювання.', accept: 'Прийняти', reject: 'Відхилити', settings: 'Налаштування cookies', policy: '/ua/polityka-cookies/' }
  };
  return copy[lang] || copy.pl;
}

function adagoSaveConsent(value) {
  try { localStorage.setItem(ADAGO_CONSENT_KEY, value); } catch (e) {}
  window.__adagoAnalyticsConsent = value;
  if (value === 'denied' && typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
  if (value === 'denied') adagoPendingAnalyticsEvents.length = 0;
  document.querySelector('.adago-consent')?.remove();
  if (value === 'granted') adagoLoadAnalytics();
}

function adagoShowConsent() {
  document.querySelector('.adago-consent')?.remove();
  const copy = adagoConsentCopy();
  const banner = document.createElement('section');
  banner.className = 'adago-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', copy.title);
  banner.innerHTML = '<div class="adago-consent__copy"><strong>' + copy.title + '</strong><p>' + copy.text + ' <a href="' + copy.policy + '">' + copy.settings + '</a></p></div><div class="adago-consent__actions"><button type="button" data-consent="denied">' + copy.reject + '</button><button type="button" class="is-primary" data-consent="granted">' + copy.accept + '</button></div>';
  banner.addEventListener('click', function (event) {
    const button = event.target.closest('[data-consent]');
    if (button) adagoSaveConsent(button.dataset.consent);
  });
  document.body.appendChild(banner);
}

function adagoInitConsent() {
  let consent = '';
  try { consent = localStorage.getItem(ADAGO_CONSENT_KEY) || ''; } catch (e) {}
  window.__adagoAnalyticsConsent = consent;
  if (consent === 'granted') adagoLoadAnalytics();
  else if (consent !== 'denied') adagoShowConsent();

  const footer = document.querySelector('.footer .container') || document.querySelector('footer');
  if (footer && !document.querySelector('.adago-cookie-settings')) {
    const copy = adagoConsentCopy();
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'adago-cookie-settings';
    settings.textContent = copy.settings;
    settings.addEventListener('click', adagoShowConsent);
    footer.appendChild(settings);
  }
}

window.adagoShowConsent = adagoShowConsent;

function adagoDecorateBookingUrl(url) {
  if (
    window.__adagoAnalyticsConsent !== 'granted' ||
    typeof window.gtag !== 'function'
  ) return Promise.resolve(url);

  return new Promise(resolve => {
    let settled = false;
    let clientId = '';
    let sessionId = '';
    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        const decorated = new URL(url);
        if (clientId) decorated.searchParams.set('gClientId', clientId);
        if (sessionId) decorated.searchParams.set('gSessionId', sessionId);
        resolve(decorated.toString());
      } catch (e) {
        resolve(url);
      }
    };
    const done = () => {
      if (clientId && sessionId) finish();
    };
    window.gtag('get', ADAGO_GA_ID, 'client_id', value => {
      clientId = String(value || '');
      done();
    });
    window.gtag('get', ADAGO_GA_ID, 'session_id', value => {
      sessionId = String(value || '');
      done();
    });
    window.setTimeout(finish, 800);
  });
}
window.adagoDecorateBookingUrl = adagoDecorateBookingUrl;

function adagoLanguage() {
  const lang = (document.documentElement.lang || 'pl').toLowerCase();
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('cs') || lang.startsWith('cz')) return 'cs';
  if (lang.startsWith('uk') || lang.startsWith('ua')) return 'uk';
  return 'pl';
}

const adagoMessages = {
  pl: { required: 'Uzupełnij wymagane pola.', dates: 'Minimalny pobyt to 2 noce. Wybierz późniejszą datę wyjazdu.', guests: 'Apartament Antracyt jest przeznaczony dla maksymalnie 2 osób.', error: 'Nie udało się wysłać formularza automatycznie. Zadzwoń lub napisz do nas na WhatsApp.', success: 'Dziękujemy. Odezwiemy się możliwie szybko.' },
  en: { required: 'Please complete the required fields.', dates: 'The minimum stay is 2 nights. Choose a later check-out date.', guests: 'Antracyt Apartment accommodates a maximum of 2 guests.', error: 'The form could not be sent automatically. Please call or contact us on WhatsApp.', success: 'Thank you. We will reply as soon as possible.' },
  de: { required: 'Bitte füllen Sie die Pflichtfelder aus.', dates: 'Der Mindestaufenthalt beträgt 2 Nächte. Wählen Sie ein späteres Abreisedatum.', guests: 'Das Apartment Antracyt ist für maximal 2 Gäste geeignet.', error: 'Das Formular konnte nicht automatisch gesendet werden. Bitte rufen Sie an oder schreiben Sie uns über WhatsApp.', success: 'Vielen Dank. Wir melden uns so bald wie möglich.' },
  cs: { required: 'Vyplňte prosím povinná pole.', dates: 'Minimální délka pobytu jsou 2 noci. Zvolte pozdější datum odjezdu.', guests: 'Apartmán Antracyt je určen maximálně pro 2 hosty.', error: 'Formulář se nepodařilo automaticky odeslat. Zavolejte nám nebo napište přes WhatsApp.', success: 'Děkujeme. Ozveme se co nejdříve.' },
  uk: { required: 'Будь ласка, заповніть обов’язкові поля.', dates: 'Мінімальний термін проживання — 2 ночі. Виберіть пізнішу дату виїзду.', guests: 'Апартаменти Antracyt розраховані максимум на 2 гостей.', error: 'Не вдалося автоматично надіслати форму. Зателефонуйте або напишіть нам у WhatsApp.', success: 'Дякуємо. Ми відповімо якнайшвидше.' }
};

const adagoWhatsAppMessages = {
  pl: {
    general: 'Dzień dobry, interesuje mnie pobyt w Adago Stay. Apartament: ___. Termin: od ___ do ___. Liczba gości: ___. Proszę o informację o dostępności i cenie.',
    business: 'Dzień dobry, interesuje mnie pobyt firmowy w Adago Stay. Termin: od ___ do ___. Liczba gości: ___. Potrzebuję faktury VAT. Proszę o informację o dostępności i ofercie.'
  },
  en: {
    general: 'Hello, I am interested in a stay at Adago Stay. Apartment: ___. Dates: from ___ to ___. Number of guests: ___. Please let me know about availability and price.',
    business: 'Hello, I am interested in a corporate stay at Adago Stay. Dates: from ___ to ___. Number of guests: ___. I need a VAT invoice. Please let me know about availability and the offer.'
  },
  de: {
    general: 'Guten Tag, ich interessiere mich für einen Aufenthalt bei Adago Stay. Apartment: ___. Zeitraum: von ___ bis ___. Anzahl der Gäste: ___. Bitte teilen Sie mir Verfügbarkeit und Preis mit.',
    business: 'Guten Tag, ich interessiere mich für einen Firmenaufenthalt bei Adago Stay. Zeitraum: von ___ bis ___. Anzahl der Gäste: ___. Ich benötige eine MwSt.-Rechnung. Bitte senden Sie mir Verfügbarkeit und Angebot.'
  },
  cs: {
    general: 'Dobrý den, mám zájem o pobyt v Adago Stay. Apartmán: ___. Termín: od ___ do ___. Počet hostů: ___. Prosím o informaci o dostupnosti a ceně.',
    business: 'Dobrý den, mám zájem o firemní pobyt v Adago Stay. Termín: od ___ do ___. Počet hostů: ___. Potřebuji fakturu s DPH. Prosím o informaci o dostupnosti a nabídce.'
  },
  uk: {
    general: 'Добрий день, мене цікавить проживання в Adago Stay. Апартаменти: ___. Дати: з ___ до ___. Кількість гостей: ___. Будь ласка, повідомте про наявність і ціну.',
    business: 'Добрий день, мене цікавить корпоративне проживання в Adago Stay. Дати: з ___ до ___. Кількість гостей: ___. Потрібен рахунок-фактура з ПДВ. Будь ласка, повідомте про наявність і пропозицію.'
  }
};

function adagoApartmentFromPath() {
  const match = location.pathname.toLowerCase().match(/\/apartament\/(oaza|antracyt|gold)\//);
  return match ? match[1] : '';
}

function adagoInitWhatsAppLinks() {
  const lang = adagoLanguage();
  const copy = adagoWhatsAppMessages[lang] || adagoWhatsAppMessages.pl;
  const apartment = adagoApartmentFromPath();
  const isBusiness = document.body.classList.contains('page-business');
  let message = isBusiness ? copy.business : copy.general;
  if (apartment) {
    const label = apartment.charAt(0).toUpperCase() + apartment.slice(1);
    message = message.replace('___', label);
  }
  document.querySelectorAll('a[href^="https://wa.me/48786207695"]').forEach(link => {
    link.href = 'https://wa.me/48786207695?text=' + encodeURIComponent(message);
    if (!link.dataset.placement) {
      link.dataset.placement = link.closest('.footer') ? 'footer'
        : link.classList.contains('floating-whatsapp') ? 'floating'
          : link.closest('.mobile-cta-bar') ? 'mobile_bar' : 'content';
    }
  });
}

function adagoFormError(form) {
  let box = form.querySelector('.form-error');
  if (box) return box;
  box = document.createElement('div');
  box.className = 'form-error full';
  box.id = (form.id || 'adago-form') + '-error';
  box.hidden = true;
  box.setAttribute('role', 'alert');
  box.setAttribute('aria-live', 'assertive');
  box.setAttribute('aria-atomic', 'true');
  box.tabIndex = -1;
  form.appendChild(box);
  return box;
}

function localISODate(date) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

function numericGuestValue(option) {
  const raw = option?.value || option?.textContent || '';
  const match = String(raw).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function apartmentGuestLimit(form) {
  const explicit = Number(form.dataset.maxGuests || 0);
  if (explicit) return explicit;
  const apartment = form.querySelector('select[name="apartment"], select[data-original-name="apartment"]');
  const hiddenApartment = form.querySelector('input[type="hidden"][name="apartment"]');
  const value = String(hiddenApartment?.value || apartment?.value || apartment?.selectedOptions?.[0]?.textContent || '').toLowerCase();
  return value.includes('antracyt') ? 2 : 4;
}

function refreshCustomSelect(select) {
  const wrapper = select.closest('.custom-select');
  if (wrapper && typeof wrapper.adagoRefresh === 'function') wrapper.adagoRefresh();
}

function applyGuestLimit(form) {
  const guests = form.querySelector('select[name="guests"], select[data-original-name="guests"]');
  if (!guests) return;
  const limit = apartmentGuestLimit(form);
  let selectedValue = numericGuestValue(guests.selectedOptions?.[0]);
  Array.from(guests.options).forEach(option => {
    const number = numericGuestValue(option);
    const overLimit = number > limit;
    option.disabled = overLimit;
    option.hidden = overLimit;
  });
  if (selectedValue > limit) {
    const fallback = Array.from(guests.options).find(option => numericGuestValue(option) === limit && !option.disabled)
      || Array.from(guests.options).find(option => !option.disabled && option.value);
    if (fallback) {
      guests.value = fallback.value;
      guests.selectedIndex = Array.from(guests.options).indexOf(fallback);
    }
  }
  refreshCustomSelect(guests);
}

function initDateRules(form) {
  if (typeof form.adagoSyncDates === 'function') {
    form.adagoSyncDates();
    return;
  }
  const dateInputs = Array.from(form.querySelectorAll('input[type="date"]'));
  if (!dateInputs.length) return;
  const today = localISODate(new Date());
  dateInputs.forEach(input => { if (!input.min || input.min < today) input.min = today; });
  const checkIn = form.querySelector('input[name="check_in"]');
  const checkOut = form.querySelector('input[name="check_out"]');
  if (!checkIn || !checkOut) return;

  const sync = () => {
    const base = checkIn.value ? new Date(checkIn.value + 'T12:00:00') : new Date();
    base.setDate(base.getDate() + ADAGO_MINIMUM_STAY_NIGHTS);
    const minCheckout = localISODate(base);
    checkOut.min = minCheckout;
    if (checkOut.value && checkOut.value < minCheckout) checkOut.value = '';
  };
  form.adagoSyncDates = sync;
  checkIn.addEventListener('change', sync);
  sync();
}

function validateDates(form) {
  const checkIn = form.querySelector('input[name="check_in"]');
  const checkOut = form.querySelector('input[name="check_out"]');
  if (!checkIn || !checkOut || !checkIn.value || !checkOut.value) return true;
  const minimumCheckout = new Date(checkIn.value + 'T12:00:00');
  minimumCheckout.setDate(minimumCheckout.getDate() + ADAGO_MINIMUM_STAY_NIGHTS);
  return checkOut.value >= localISODate(minimumCheckout);
}

function validateGuestLimit(form) {
  const hidden = form.querySelector('input[type="hidden"][name="guests"]');
  const guests = form.querySelector('select[name="guests"], select[data-original-name="guests"]');
  const value = Number(String(hidden?.value || guests?.value || '').match(/\d+/)?.[0] || 0);
  return !value || value <= apartmentGuestLimit(form);
}

document.addEventListener('DOMContentLoaded', () => {
  adagoInitConsent();
  adagoInitWhatsAppLinks();
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const contactForms = Array.from(document.querySelectorAll('form[data-form-type]'));
  contactForms.forEach(form => {
    initDateRules(form);
    applyGuestLimit(form);
    const apartment = form.querySelector('select[name="apartment"]');
    apartment?.addEventListener('change', () => applyGuestLimit(form));
  });

  document.querySelectorAll('a[href^="https://wa.me"], a[href*="whatsapp"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_whatsapp', {
    page_path: location.pathname,
    placement: link.dataset.placement || 'unknown',
    apartment: adagoApartmentFromPath() || 'unspecified'
  })));
  document.querySelectorAll('[data-social="facebook"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_facebook', {
    page_path: location.pathname,
    placement: link.dataset.placement || 'unknown'
  })));
  document.querySelectorAll('a[href^="tel:"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_phone', { href: link.getAttribute('href') || '' })));
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_email', { href: link.getAttribute('href') || '' })));
  document.querySelectorAll('a[href*="#availability-search"], a[href*="#booking-widget"], a[href*="idobooking.com/book-now"]').forEach(link => link.addEventListener('click', () => adagoTrack('booking_cta_click', { link_url: link.href, page_path: location.pathname })));
  if (location.pathname.includes('/apartament/')) adagoTrack('view_apartment', { path: location.pathname });

  contactForms.forEach(form => {
    const successBox = form.parentElement?.querySelector('.success-box') || form.querySelector('.success-box');
    const errorBox = adagoFormError(form);
    if (successBox) {
      successBox.setAttribute('role', 'status');
      successBox.setAttribute('aria-live', 'polite');
      successBox.setAttribute('aria-atomic', 'true');
      successBox.tabIndex = -1;
    }
    const clearStatus = field => {
      errorBox.hidden = true;
      errorBox.textContent = '';
      if (successBox) successBox.style.display = 'none';
      if (field) {
        field.removeAttribute('aria-invalid');
        if (field.getAttribute('aria-describedby') === errorBox.id) field.removeAttribute('aria-describedby');
      }
    };
    const showError = (message, field) => {
      errorBox.textContent = message;
      errorBox.hidden = false;
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', errorBox.id);
      }
      errorBox.focus();
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lang = adagoLanguage();
      const msg = adagoMessages[lang] || adagoMessages.pl;
      const submit = form.querySelector('button[type="submit"]');
      clearStatus();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!validateDates(form)) {
        showError(msg.dates, form.querySelector('input[name="check_out"]'));
        return;
      }
      if (!validateGuestLimit(form)) {
        showError(msg.guests, form.querySelector('select[name="guests"], select[data-original-name="guests"]'));
        applyGuestLimit(form);
        return;
      }
      const formData = new FormData(form);
      const filledHoney = String(formData.get('_honey') || '').trim();
      if (filledHoney) return;
      if (!formData.has('_subject')) formData.append('_subject', form.dataset.subject || 'New enquiry from adagostay.pl');
      if (!formData.has('_captcha')) formData.append('_captcha', 'false');
      form.setAttribute('aria-busy', 'true');
      if (submit) {
        if (!submit.dataset.default) submit.dataset.default = submit.textContent;
        submit.disabled = true;
        submit.textContent = submit.dataset.loading || 'Sending...';
      }
      try {
        const res = await fetch('https://formsubmit.co/ajax/adagostay@gmail.com', {
          method: 'POST', headers: { Accept: 'application/json' }, body: formData
        });
        let data = {};
        try { data = await res.json(); } catch (e) {}
        if (!res.ok) throw new Error(data.message || 'Form error');
        const formType = form.dataset.formType || 'contact';
        adagoTrack('form_submit', { form_type: formType });
        adagoTrack('generate_lead', { form_type: formType });
        form.reset();
        form.querySelectorAll('select').forEach(sel => sel.dispatchEvent(new Event('change', { bubbles: true })));
        applyGuestLimit(form);
        form.adagoSyncDates?.();
        if (successBox) {
          if (!successBox.textContent.trim()) successBox.textContent = form.dataset.alertSuccess || msg.success;
          successBox.style.display = 'block';
          successBox.focus();
        } else {
          const fallbackSuccess = document.createElement('div');
          fallbackSuccess.className = 'success-box full';
          fallbackSuccess.setAttribute('role', 'status');
          fallbackSuccess.setAttribute('aria-live', 'polite');
          fallbackSuccess.tabIndex = -1;
          fallbackSuccess.textContent = form.dataset.alertSuccess || msg.success;
          form.appendChild(fallbackSuccess);
          fallbackSuccess.focus();
        }
      } catch (err) {
        showError(form.dataset.errorMessage || msg.error);
      } finally {
        form.removeAttribute('aria-busy');
        if (submit) {
          submit.disabled = false;
          submit.textContent = submit.dataset.default || submit.textContent;
        }
      }
    });
    form.addEventListener('input', event => clearStatus(event.target));
    form.addEventListener('change', event => clearStatus(event.target));
  });
});
