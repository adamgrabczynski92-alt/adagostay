
// === CONVERSION BOOST: sticky CTA ===
(function () {
  var path = (location.pathname || "/").toLowerCase();

  function getLocale() {
    if (path.indexOf('/en/') === 0) return 'en';
    if (path.indexOf('/de/') === 0) return 'de';
    if (path.indexOf('/cz/') === 0) return 'cz';
    if (path.indexOf('/ua/') === 0) return 'ua';
    return 'pl';
  }

  var locale = getLocale();
  var labels = {
    pl: { text: 'Zarezerwuj pobyt', mobile: 'Zarezerwuj pobyt', href: '/pl/kontakt/' },
    en: { text: 'Book your stay', mobile: 'Book your stay', href: '/en/kontakt/' },
    de: { text: 'Aufenthalt buchen', mobile: 'Aufenthalt buchen', href: '/de/kontakt/' },
    cz: { text: 'Rezervovat pobyt', mobile: 'Rezervovat pobyt', href: '/cz/kontakt/' },
    ua: { text: 'Забронювати проживання', mobile: 'Забронювати проживання', href: '/ua/kontakt/' }
  };
  var cfg = labels[locale] || labels.pl;

  if (document.querySelector('.sticky-cta') || document.querySelector('.sticky-cta-bar')) return;
  var hasNativeMobileBar = !!document.querySelector('.mobile-cta-bar');

  var desktop = document.createElement('a');
  desktop.className = 'sticky-cta';
  desktop.href = cfg.href;
  desktop.setAttribute('aria-label', cfg.text);
  desktop.innerHTML = '<span class="sticky-cta__dot"></span><span>' + cfg.text + '</span>';

  var mobile = document.createElement('a');
  mobile.className = 'sticky-cta-bar';
  mobile.href = cfg.href;
  mobile.setAttribute('aria-label', cfg.mobile);
  mobile.textContent = cfg.mobile;

  document.body.appendChild(desktop);
  if (!hasNativeMobileBar) document.body.appendChild(mobile);
})();
