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

  var errorMessages = {
    1: 'Kalendarz nie załadował się. Odśwież stronę albo skontaktuj się z nami telefonicznie lub przez WhatsApp.',
    2: 'The booking calendar did not load. Refresh the page or contact us by phone or WhatsApp.',
    3: 'Der Buchungskalender konnte nicht geladen werden. Laden Sie die Seite neu oder kontaktieren Sie uns per Telefon oder WhatsApp.',
    37: 'Rezervační kalendář se nenačetl. Obnovte stránku nebo nás kontaktujte telefonicky či přes WhatsApp.',
    171: 'Календар бронювання не завантажився. Оновіть сторінку або зв’яжіться з нами телефоном чи через WhatsApp.'
  };

  document.addEventListener('DOMContentLoaded', function () {
    var status = document.querySelector('[data-idobooking-status]');
    var documentLanguage = (document.documentElement.lang || 'pl').toLowerCase();
    var languageId = languageIds[documentLanguage] || languageIds[documentLanguage.split('-')[0]] || 1;

    if (typeof window.iai_booking_search !== 'function') {
      if (status) {
        status.textContent = errorMessages[languageId];
        status.classList.add('is-error');
      }
      return;
    }

    try {
      window.iai_booking_search({
        showPersons: 1,
        label3: {
          1: 'Osoby',
          2: 'Guests',
          3: 'Gäste',
          37: 'Hosté',
          171: 'Гості'
        },
        showRooms: 0,
        showLocation: 1,
        icon: 'bed',
        button: {
          1: 'Sprawdź dostępność',
          2: 'Check availability',
          3: 'Verfügbarkeit prüfen',
          37: 'Ověřit dostupnost',
          171: 'Перевірити наявність'
        },
        mode: 'horizontal',
        langNew: String(languageId),
        locationUrl: 'https://client60336.idobooking.com/locations.js',
        clientId: '60336',
        langIdCodes: {
          1: 'pl',
          pl: 1,
          2: 'en',
          en: 2,
          3: 'de',
          de: 3,
          37: 'cs',
          cs: 37,
          171: 'uk',
          uk: 171
        },
        literalsInLang: {
          1: {
            label1: 'Przyjazd',
            label2: 'Wyjazd',
            label3: 'Osoby',
            label4: null,
            label5: 'Lokalizacje',
            button: 'Sprawdź dostępność',
            days: ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'],
            months: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
            trigger: 'Rezerwacja online'
          },
          2: {
            label1: 'Arrival',
            label2: 'Departure',
            label3: 'Guests',
            label4: null,
            label5: 'Locations',
            button: 'Check availability',
            days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            trigger: 'Book online'
          },
          3: {
            label1: 'Anreise',
            label2: 'Abreise',
            label3: 'Gäste',
            label4: null,
            label5: 'Standorte',
            button: 'Verfügbarkeit prüfen',
            days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            trigger: 'Online buchen'
          },
          37: {
            label1: 'Příjezd',
            label2: 'Odjezd',
            label3: 'Hosté',
            label4: null,
            label5: 'Lokality',
            button: 'Ověřit dostupnost',
            days: ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'],
            months: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
            trigger: 'Online rezervace'
          },
          171: {
            label1: 'Заїзд',
            label2: 'Виїзд',
            label3: 'Гості',
            label4: null,
            label5: 'Локації',
            button: 'Перевірити наявність',
            days: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            months: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
            trigger: 'Онлайн-бронювання'
          }
        }
      });

      if (status) {
        status.hidden = true;
      }
    } catch (error) {
      if (status) {
        status.textContent = errorMessages[languageId];
        status.classList.add('is-error');
      }
    }
  });
})();
