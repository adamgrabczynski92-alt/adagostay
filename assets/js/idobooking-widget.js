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

    var fields = document.createElement('div');
    fields.className = 'idobooking-quick-fields';
    fields.appendChild(createField(text.arrival, arrival));
    fields.appendChild(createField(text.departure, departure));
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
      status.setAttribute('aria-live', 'polite');
    }

    arrival.addEventListener('change', function () {
      departure.min = nextDay(arrival.value);
      if (!departure.value || departure.value <= arrival.value) {
        departure.value = nextDay(arrival.value);
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!arrival.value || !departure.value || departure.value <= arrival.value) {
        if (status) {
          status.hidden = false;
          status.classList.add('is-error');
          status.classList.remove('is-ready');
          status.textContent = text.invalid;
        }
        return;
      }

      var bookingUrl = 'https://client60336.idobooking.com/book-now/booking/defaultchoice' +
        '/currency/0/language/' + languageId +
        '/start_date/' + encodeURIComponent(arrival.value) +
        '/end_date/' + encodeURIComponent(departure.value) +
        '/persons-adult/' + encodeURIComponent(guests.value) +
        '?transparentbackground=1&from_own_button=1';

      bookingSection.hidden = false;
      bookingSection.classList.add('is-open', 'is-loading');
      submit.setAttribute('aria-expanded', 'true');
      if (engineCard) {
        engineCard.setAttribute('data-loading-label', text.loading);
      }
      iframe.src = bookingUrl;

      var fallback = bookingSection.querySelector('.idobooking-engine-fallback a');
      if (fallback) {
        fallback.href = bookingUrl;
      }

      if (status) {
        status.hidden = false;
        status.classList.remove('is-error');
        status.classList.add('is-ready');
        status.textContent = text.ready;
      }

      window.requestAnimationFrame(function () {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    iframe.addEventListener('load', function () {
      bookingSection.classList.remove('is-loading');
    });
  });
}());
