(function () {
  'use strict';

  var languageIds = {
    pl: 1,
    en: 2,
    de: 3,
    cs: 37,
    cz: 37,
    uk: 171,
    ua: 171
  };

  var translations = {
    1: {
      formLabel: 'Szybkie sprawdzanie dostępności',
      arrival: 'Przyjazd',
      departure: 'Wyjazd',
      apartment: 'Apartament',
      allApartments: 'Wszystkie apartamenty',
      guests: 'Goście',
      button: 'Sprawdź dostępność',
      loading: 'Ładowanie bezpiecznego kalendarza…',
      invalid: 'Data wyjazdu musi być późniejsza niż data przyjazdu.',
      ready: 'Terminy zostały przekazane do kalendarza poniżej.'
    },
    2: {
      formLabel: 'Quick availability search',
      arrival: 'Arrival',
      departure: 'Departure',
      apartment: 'Apartment',
      allApartments: 'All apartments',
      guests: 'Guests',
      button: 'Check availability',
      loading: 'Loading the secure booking calendar…',
      invalid: 'The departure date must be later than the arrival date.',
      ready: 'Your dates have been sent to the booking calendar below.'
    },
    3: {
      formLabel: 'Schnelle Verfügbarkeitssuche',
      arrival: 'Anreise',
      departure: 'Abreise',
      apartment: 'Apartment',
      allApartments: 'Alle Apartments',
      guests: 'Gäste',
      button: 'Verfügbarkeit prüfen',
      loading: 'Der sichere Buchungskalender wird geladen…',
      invalid: 'Das Abreisedatum muss nach dem Anreisedatum liegen.',
      ready: 'Ihre Termine wurden an den Buchungskalender unten übergeben.'
    },
    37: {
      formLabel: 'Rychlé ověření dostupnosti',
      arrival: 'Příjezd',
      departure: 'Odjezd',
      apartment: 'Apartmán',
      allApartments: 'Všechny apartmány',
      guests: 'Hosté',
      button: 'Ověřit dostupnost',
      loading: 'Načítá se zabezpečený rezervační kalendář…',
      invalid: 'Datum odjezdu musí být pozdější než datum příjezdu.',
      ready: 'Termín byl předán do rezervačního kalendáře níže.'
    },
    171: {
      formLabel: 'Швидка перевірка наявності',
      arrival: 'Заїзд',
      departure: 'Виїзд',
      apartment: 'Апартаменти',
      allApartments: 'Усі апартаменти',
      guests: 'Гості',
      button: 'Перевірити наявність',
      loading: 'Завантажується безпечний календар бронювання…',
      invalid: 'Дата виїзду має бути пізнішою за дату заїзду.',
      ready: 'Дати передано до календаря бронювання нижче.'
    }
  };

  function localDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function nextDay(value) {
    var parts = value.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + 1);
    return localDate(date);
  }

  function createField(labelText, control) {
    var label = document.createElement('label');
    label.className = 'idobooking-quick-field';

    var text = document.createElement('span');
    text.textContent = labelText;
    label.appendChild(text);
    label.appendChild(control);
    return label;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.querySelector('.conversion-home-search .iai-search');
    var status = document.querySelector('[data-idobooking-status]');
    var iframe = document.querySelector('.idobooking-engine-frame');
    var bookingSection = document.getElementById('booking-widget');
    var engineCard = bookingSection && bookingSection.querySelector('.idobooking-engine-card');
    var directLinks = document.querySelectorAll('[data-idobooking-direct]');

    if (!mount || !iframe || !bookingSection) {
      return;
    }

    var documentLanguage = (document.documentElement.lang || 'pl').toLowerCase();
    var languageId = languageIds[documentLanguage] || languageIds[documentLanguage.split('-')[0]] || 1;
    var text = translations[languageId];
    var tomorrow = new Date();
    tomorrow.setHours(12, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    var form = document.createElement('form');
    form.className = 'idobooking-quick-form';
    form.setAttribute('aria-label', text.formLabel);

    var arrival = document.createElement('input');
    arrival.type = 'date';
    arrival.name = 'arrival';
    arrival.required = true;
    arrival.min = localDate(new Date());
    arrival.value = localDate(tomorrow);

    var departure = document.createElement('input');
    departure.type = 'date';
    departure.name = 'departure';
    departure.required = true;
    departure.min = localDate(dayAfterTomorrow);
    departure.value = localDate(dayAfterTomorrow);

    var guests = document.createElement('select');
    guests.name = 'guests';
    guests.setAttribute('aria-label', text.guests);
    for (var guestCount = 1; guestCount <= 4; guestCount += 1) {
      var option = document.createElement('option');
      option.value = String(guestCount);
      option.textContent = String(guestCount);
      option.selected = guestCount === 2;
      guests.appendChild(option);
    }

    var apartment = document.createElement('select');
    apartment.name = 'apartment';
    apartment.setAttribute('aria-label', text.apartment);
    [
      ['', text.allApartments, ''],
      ['oaza', 'Oaza — Szczawno-Zdrój', '10'],
      ['antracyt', 'Antracyt — Szczawno-Zdrój', '11'],
      ['gold', 'Gold — Wałbrzych', '12']
    ].forEach(function (item) {
      var option = document.createElement('option');
      option.value = item[0];
      option.textContent = item[1];
      option.dataset.objectId = item[2];
      apartment.appendChild(option);
    });

    var requestedApartment = new URLSearchParams(window.location.search).get('apartment') || '';
    if (['oaza', 'antracyt', 'gold'].includes(requestedApartment)) {
      apartment.value = requestedApartment;
    }

    var fields = document.createElement('div');
    fields.className = 'idobooking-quick-fields';
    fields.appendChild(createField(text.arrival, arrival));
    fields.appendChild(createField(text.departure, departure));
    fields.appendChild(createField(text.apartment, apartment));
    fields.appendChild(createField(text.guests, guests));

    var submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'idobooking-quick-submit';
    submit.textContent = text.button;
    submit.setAttribute('aria-controls', 'booking-widget');
    submit.setAttribute('aria-expanded', 'false');

    form.appendChild(fields);
    form.appendChild(submit);
    mount.replaceChildren(form);

    if (status) {
      status.hidden = true;
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      status.tabIndex = -1;
    }

    arrival.addEventListener('change', function () {
      departure.min = nextDay(arrival.value);
      if (!departure.value || departure.value <= arrival.value) {
        departure.value = nextDay(arrival.value);
      }
    });

    function applyApartmentGuestLimit() {
      var maxGuests = apartment.value === 'antracyt' ? 2 : 4;
      Array.from(guests.options).forEach(function (option) {
        var overLimit = Number(option.value) > maxGuests;
        option.disabled = overLimit;
        option.hidden = overLimit;
      });
      if (Number(guests.value) > maxGuests) guests.value = String(maxGuests);
    }
    apartment.addEventListener('change', applyApartmentGuestLimit);
    applyApartmentGuestLimit();

    function validDates() {
      return Boolean(arrival.value && departure.value && departure.value > arrival.value);
    }

    function showInvalidDates() {
      if (!status) return;
      status.setAttribute('role', 'alert');
      status.hidden = false;
      status.classList.add('is-error');
      status.classList.remove('is-ready');
      status.textContent = text.invalid;
      status.focus?.({ preventScroll: true });
    }

    function buildBookingUrl() {
      var bookingUrl = 'https://client60336.idobooking.com/book-now/booking/defaultchoice' +
        '/currency/0/language/' + languageId +
        '/start_date/' + encodeURIComponent(arrival.value) +
        '/end_date/' + encodeURIComponent(departure.value) +
        '/persons-adult/' + encodeURIComponent(guests.value) +
        '?transparentbackground=1&from_own_button=1';
      var objectId = apartment.selectedOptions[0] && apartment.selectedOptions[0].dataset.objectId;
      if (objectId) {
        bookingUrl += '&ob%5B' + encodeURIComponent(objectId) + '%5D=&showOtherOffers=0';
      }
      return { bookingUrl: bookingUrl, objectId: objectId || '' };
    }

    function syncDirectLinks() {
      var booking = buildBookingUrl();
      directLinks.forEach(function (link) {
        link.href = booking.bookingUrl;
      });
    }

    [arrival, departure, apartment, guests].forEach(function (control) {
      control.addEventListener('change', syncDirectLinks);
    });
    syncDirectLinks();

    directLinks.forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (!validDates()) {
          event.preventDefault();
          showInvalidDates();
          return;
        }
        var booking = buildBookingUrl();
        link.href = booking.bookingUrl;
        if (typeof window.adagoTrack === 'function') {
          window.adagoTrack('booking_start', {
            link_url: booking.bookingUrl,
            page_path: window.location.pathname,
            guests: Number(guests.value),
            apartment: apartment.value || 'all',
            item_id: booking.objectId || 'all',
            booking_mode: 'top_level'
          });
        }
      });
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!validDates()) {
        showInvalidDates();
        return;
      }

      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');

      var booking = buildBookingUrl();
      var bookingUrl = booking.bookingUrl;
      var objectId = booking.objectId;
      if (typeof window.adagoDecorateBookingUrl === 'function') {
        bookingUrl = await window.adagoDecorateBookingUrl(bookingUrl);
      }
      submit.disabled = false;
      form.removeAttribute('aria-busy');

      bookingSection.hidden = false;
      bookingSection.classList.add('is-open', 'is-loading');
      submit.setAttribute('aria-expanded', 'true');
      if (engineCard) {
        engineCard.setAttribute('data-loading-label', text.loading);
      }
      iframe.src = bookingUrl;

      document.querySelectorAll('.idobooking-engine-fallback a, .idobooking-external-cta, [data-idobooking-direct]').forEach(function (link) {
        link.href = bookingUrl;
      });

      if (typeof window.adagoTrack === 'function') {
        window.adagoTrack('booking_start', {
          link_url: bookingUrl,
          page_path: window.location.pathname,
          guests: Number(guests.value),
          apartment: apartment.value || 'all',
          item_id: objectId || 'all',
          booking_mode: 'embedded'
        });
      }

      if (status) {
        status.setAttribute('role', 'status');
        status.hidden = false;
        status.classList.remove('is-error');
        status.classList.add('is-ready');
        status.textContent = text.ready;
      }

      window.requestAnimationFrame(function () {
        window.setTimeout(function () {
          var scrollTarget = engineCard || bookingSection;
          var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          scrollTarget.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start'
          });
        }, 120);
      });
    });

    iframe.addEventListener('load', function () {
      bookingSection.classList.remove('is-loading');
    });
  });
}());
