function adagoTrack(eventName, payload = {}) {
  try {
    document.dispatchEvent(new CustomEvent('adago:' + eventName, { detail: payload }));
    if (window.__adagoAnalyticsConsent === 'granted' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  } catch (e) {}
}
window.adagoTrack = adagoTrack;

const ADAGO_GA_ID = 'G-CR12PM6B8M';
const ADAGO_CONSENT_KEY = 'adago_analytics_consent_v1';

function adagoLoadAnalytics() {
  if (window.__adagoAnalyticsLoaded) return;
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
    allow_ad_personalization_signals: false
  });
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

function adagoLanguage() {
  const lang = (document.documentElement.lang || 'pl').toLowerCase();
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('cs') || lang.startsWith('cz')) return 'cs';
  if (lang.startsWith('uk') || lang.startsWith('ua')) return 'uk';
  return 'pl';
}

const adagoMessages = {
  pl: { required: 'Uzupełnij wymagane pola.', dates: 'Data wyjazdu musi być późniejsza niż data przyjazdu.', guests: 'Apartament Antracyt jest przeznaczony dla maksymalnie 2 osób.' },
  en: { required: 'Please complete the required fields.', dates: 'The check-out date must be later than the check-in date.', guests: 'Antracyt Apartment accommodates a maximum of 2 guests.' },
  de: { required: 'Bitte füllen Sie die Pflichtfelder aus.', dates: 'Das Abreisedatum muss nach dem Anreisedatum liegen.', guests: 'Das Apartment Antracyt ist für maximal 2 Gäste geeignet.' },
  cs: { required: 'Vyplňte prosím povinná pole.', dates: 'Datum odjezdu musí být pozdější než datum příjezdu.', guests: 'Apartmán Antracyt je určen maximálně pro 2 hosty.' },
  uk: { required: 'Будь ласка, заповніть обов’язкові поля.', dates: 'Дата виїзду має бути пізнішою за дату заїзду.', guests: 'Апартаменти Antracyt розраховані максимум на 2 гостей.' }
};

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
    base.setDate(base.getDate() + 1);
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
  return checkOut.value > checkIn.value;
}

function validateGuestLimit(form) {
  const hidden = form.querySelector('input[type="hidden"][name="guests"]');
  const guests = form.querySelector('select[name="guests"], select[data-original-name="guests"]');
  const value = Number(String(hidden?.value || guests?.value || '').match(/\d+/)?.[0] || 0);
  return !value || value <= apartmentGuestLimit(form);
}

document.addEventListener('DOMContentLoaded', () => {
  adagoInitConsent();
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

  document.querySelectorAll('a[href^="https://wa.me"], a[href*="whatsapp"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_whatsapp', { href: link.getAttribute('href') || '' })));
  document.querySelectorAll('a[href^="tel:"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_phone', { href: link.getAttribute('href') || '' })));
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_email', { href: link.getAttribute('href') || '' })));
  document.querySelectorAll('a[href*="#availability-search"], a[href*="#booking-widget"], a[href*="idobooking.com/book-now"]').forEach(link => link.addEventListener('click', () => adagoTrack('booking_start', { link_url: link.href, page_path: location.pathname })));
  if (location.pathname.includes('/apartament/')) adagoTrack('view_apartment', { path: location.pathname });

  contactForms.forEach(form => {
    const successBox = form.parentElement?.querySelector('.success-box') || form.querySelector('.success-box');
    form.dataset.loadedAt = String(Date.now());
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lang = adagoLanguage();
      const msg = adagoMessages[lang] || adagoMessages.pl;
      const submit = form.querySelector('button[type="submit"]');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!validateDates(form)) {
        alert(msg.dates);
        form.querySelector('input[name="check_out"]')?.focus();
        return;
      }
      if (!validateGuestLimit(form)) {
        alert(msg.guests);
        applyGuestLimit(form);
        return;
      }
      const formData = new FormData(form);
      const loadedAt = Number(form.dataset.loadedAt || Date.now());
      const filledHoney = String(formData.get('_honey') || '').trim();
      if (filledHoney || (Date.now() - loadedAt) < 2500) return;
      if (!formData.has('_subject')) formData.append('_subject', form.dataset.subject || 'New enquiry from adagostay.pl');
      if (!formData.has('_captcha')) formData.append('_captcha', 'false');
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
        adagoTrack('form_submit', { form_type: form.dataset.formType || 'contact' });
        form.reset();
        form.querySelectorAll('select').forEach(sel => sel.dispatchEvent(new Event('change', { bubbles: true })));
        applyGuestLimit(form);
        form.adagoSyncDates?.();
        if (successBox) {
          successBox.style.display = 'block';
          successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          alert(form.dataset.alertSuccess || 'Thank you! We will reply as soon as possible.');
        }
      } catch (err) {
        alert(form.dataset.errorMessage || 'Unable to send the form automatically right now. Please call or write on WhatsApp.');
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = submit.dataset.default || submit.textContent;
        }
      }
    });
    form.addEventListener('input', () => { if (successBox) successBox.style.display = 'none'; });
    form.addEventListener('change', () => { if (successBox) successBox.style.display = 'none'; });
  });
});
