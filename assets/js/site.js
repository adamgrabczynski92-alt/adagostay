function adagoTrack(eventName, payload = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, payload));
    document.dispatchEvent(new CustomEvent('adago:' + eventName, { detail: payload }));
  } catch (e) {}
}
window.adagoTrack = adagoTrack;

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

  initCustomSelects(document);
  contactForms.forEach(form => applyGuestLimit(form));

  document.querySelectorAll('a[href^="https://wa.me"], a[href*="whatsapp"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_whatsapp', { href: link.getAttribute('href') || '' })));
  document.querySelectorAll('a[href^="tel:"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_phone', { href: link.getAttribute('href') || '' })));
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => link.addEventListener('click', () => adagoTrack('click_email', { href: link.getAttribute('href') || '' })));
  if (location.pathname.includes('/apartament/')) adagoTrack('view_apartment', { path: location.pathname });

  contactForms.forEach(form => {
    const successBox = form.parentElement?.querySelector('.success-box') || form.querySelector('.success-box');
    form.dataset.loadedAt = String(Date.now());
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lang = adagoLanguage();
      const msg = adagoMessages[lang] || adagoMessages.pl;
      const submit = form.querySelector('button[type="submit"]');
      const invalidCustomSelect = Array.from(form.querySelectorAll('.custom-select select[required]')).find(select => {
        const hidden = select.closest('.custom-select')?.querySelector('input[type="hidden"]');
        return !hidden?.value;
      });
      if (invalidCustomSelect) {
        alert(form.dataset.validationMessage || msg.required);
        invalidCustomSelect.closest('.custom-select')?.querySelector('.custom-select-trigger')?.focus();
        return;
      }
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
      const guestField = form.querySelector('input[type="hidden"][name="guests"], select[name="guests"], select[data-original-name="guests"]');
      const guestValue = String(guestField?.value || '');
      const guestCount = Number(guestValue.match(/\d+/)?.[0] || 0);
      const guestLimit = apartmentGuestLimit(form);
      if (guestCount > guestLimit) {
        alert(msg.guests);
        applyGuestLimit(form);
        return;
      }
      if (guestValue) formData.set('guests', guestValue);
      formData.set('guest_limit', String(guestLimit));
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
        initDateRules(form);
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

function initCustomSelects(scope = document) {
  const nativeSelects = scope.querySelectorAll('select:not([data-customized])');
  nativeSelects.forEach((select, selectIndex) => {
    select.dataset.customized = 'true';
    select.dataset.originalName = select.name;

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = select.name;
    hiddenInput.value = select.value;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const uniqueId = 'adago-select-' + selectIndex + '-' + Math.random().toString(36).slice(2, 8);
    trigger.id = uniqueId + '-trigger';
    const fieldLabel = select.getAttribute('aria-label') || select.closest('div')?.querySelector('label')?.textContent?.trim() || select.name || 'Select';
    trigger.setAttribute('aria-label', fieldLabel);
    if (select.required) trigger.setAttribute('aria-required', 'true');

    const triggerText = document.createElement('span');
    triggerText.className = 'custom-select-text';
    const triggerIcon = document.createElement('span');
    triggerIcon.className = 'custom-select-icon';
    triggerIcon.setAttribute('aria-hidden', 'true');
    triggerIcon.innerHTML = '&#9662;';
    trigger.append(triggerText, triggerIcon);

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    menu.id = uniqueId + '-listbox';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-labelledby', trigger.id);
    menu.tabIndex = -1;
    trigger.setAttribute('aria-controls', menu.id);

    const optionButtons = () => Array.from(menu.querySelectorAll('.custom-select-option:not(:disabled)'));

    function closeSelect(returnFocus = false) {
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.removeAttribute('aria-activedescendant');
      if (returnFocus) trigger.focus();
    }

    function closeOtherSelects() {
      document.querySelectorAll('.custom-select.open').forEach(el => {
        if (el === wrapper) return;
        el.classList.remove('open');
        el.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
        el.querySelector('.custom-select-menu')?.removeAttribute('aria-activedescendant');
      });
    }

    function focusOption(preference = 'selected') {
      const enabled = optionButtons();
      if (!enabled.length) return;
      let target = enabled[0];
      if (preference === 'last') target = enabled[enabled.length - 1];
      if (preference === 'selected') target = enabled.find(item => item.classList.contains('active')) || target;
      target.focus();
      menu.setAttribute('aria-activedescendant', target.id);
    }

    function openSelect(preference = 'selected') {
      closeOtherSelects();
      wrapper.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => focusOption(preference));
    }

    const updateFromSelect = () => {
      hiddenInput.value = select.value;
      triggerText.textContent = select.options[select.selectedIndex]?.textContent || select.options[0]?.textContent || '';
      Array.from(menu.querySelectorAll('.custom-select-option')).forEach(el => {
        const optionIndex = Number(el.dataset.index);
        const active = optionIndex === select.selectedIndex;
        el.classList.toggle('active', active);
        el.setAttribute('aria-selected', String(active));
      });
    };

    const chooseOption = item => {
      if (!item || item.disabled) return;
      const index = Number(item.dataset.index);
      const option = select.options[index];
      if (!option || option.disabled || option.hidden) return;
      select.selectedIndex = index;
      select.value = option.value;
      updateFromSelect();
      closeSelect(true);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const renderOptions = () => {
      const wasOpen = wrapper.classList.contains('open');
      menu.innerHTML = '';
      Array.from(select.options).forEach((option, index) => {
        if (option.hidden) return;
        const item = document.createElement('button');
        item.type = 'button';
        item.id = uniqueId + '-option-' + index;
        item.className = 'custom-select-option';
        item.setAttribute('role', 'option');
        item.dataset.value = option.value;
        item.dataset.index = String(index);
        item.textContent = option.textContent;
        item.disabled = option.disabled;
        item.setAttribute('aria-disabled', String(option.disabled));
        item.addEventListener('click', () => chooseOption(item));
        item.addEventListener('focus', () => menu.setAttribute('aria-activedescendant', item.id));
        menu.appendChild(item);
      });
      updateFromSelect();
      if (wasOpen) requestAnimationFrame(() => focusOption('selected'));
    };
    wrapper.adagoRefresh = renderOptions;

    trigger.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (wrapper.classList.contains('open')) closeSelect();
      else openSelect('selected');
    });

    trigger.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        openSelect('selected');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        openSelect('last');
      } else if (e.key === 'Home') {
        e.preventDefault();
        openSelect('first');
      } else if (e.key === 'End') {
        e.preventDefault();
        openSelect('last');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSelect();
      }
    });

    menu.addEventListener('keydown', e => {
      const enabled = optionButtons();
      if (!enabled.length) return;
      const currentIndex = Math.max(0, enabled.indexOf(document.activeElement));
      let nextIndex = currentIndex;
      if (e.key === 'ArrowDown') nextIndex = (currentIndex + 1) % enabled.length;
      else if (e.key === 'ArrowUp') nextIndex = (currentIndex - 1 + enabled.length) % enabled.length;
      else if (e.key === 'Home') nextIndex = 0;
      else if (e.key === 'End') nextIndex = enabled.length - 1;
      else if (e.key === 'Escape') {
        e.preventDefault();
        closeSelect(true);
        return;
      } else if (e.key === 'Tab') {
        closeSelect();
        return;
      } else if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList.contains('custom-select-option')) {
        e.preventDefault();
        chooseOption(document.activeElement);
        return;
      } else {
        return;
      }
      e.preventDefault();
      enabled[nextIndex].focus();
      menu.setAttribute('aria-activedescendant', enabled[nextIndex].id);
    });

    select.addEventListener('change', updateFromSelect);
    select.form?.addEventListener('reset', () => setTimeout(() => { renderOptions(); }, 0));

    select.classList.add('is-hidden-native-select');
    select.removeAttribute('name');
    select.disabled = true;
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;

    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    wrapper.appendChild(hiddenInput);
    wrapper.appendChild(select);
    renderOptions();
  });

  if (!document.body.dataset.customSelectGlobalBound) {
    document.body.dataset.customSelectGlobalBound = 'true';
    document.addEventListener('click', e => {
      if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select.open').forEach(el => {
          el.classList.remove('open');
          el.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
          el.querySelector('.custom-select-menu')?.removeAttribute('aria-activedescendant');
        });
      }
    });
  }
}
