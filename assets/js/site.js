
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  initCustomSelects(document);

  const forms = document.querySelectorAll('form[data-form-type="contact"]');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const successBox = form.parentElement.querySelector('.success-box') || form.querySelector('.success-box');
      const submit = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);
      formData.append('_subject', form.dataset.subject || 'New enquiry from adagostay.pl');
      formData.append('_captcha', 'false');
      if (submit) {
        submit.disabled = true;
        submit.textContent = submit.dataset.loading || 'Sending...';
      }
      try {
        const res = await fetch('https://formsubmit.co/ajax/adagostay@gmail.com', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Form error');
        form.reset();
        if (successBox) {
          successBox.style.display = 'block';
          successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          alert('Thank you! We will reply as soon as possible.');
        }
      } catch (err) {
        alert('Unable to send the form automatically right now. Please call or write on WhatsApp.');
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = submit.dataset.default || submit.textContent;
        }
      }
    });
  });
});



function initCustomSelects(scope = document) {
  const nativeSelects = scope.querySelectorAll('select:not([data-customized])');
  nativeSelects.forEach((select) => {
    select.dataset.customized = 'true';
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const triggerText = document.createElement('span');
    triggerText.className = 'custom-select-text';
    triggerText.textContent = select.options[select.selectedIndex]?.textContent || select.options[0]?.textContent || '';
    const triggerIcon = document.createElement('span');
    triggerIcon.className = 'custom-select-icon';
    triggerIcon.innerHTML = '&#9662;';
    trigger.append(triggerText, triggerIcon);

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    menu.setAttribute('role', 'listbox');

    const renderOptions = () => {
      menu.innerHTML = '';
      Array.from(select.options).forEach((option, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'custom-select-option';
        item.setAttribute('role', 'option');
        item.dataset.value = option.value;
        item.textContent = option.textContent;
        if (select.selectedIndex === index) {
          item.classList.add('active');
          item.setAttribute('aria-selected', 'true');
        }
        item.addEventListener('click', () => {
          select.value = option.value;
          select.selectedIndex = index;
          triggerText.textContent = option.textContent;
          menu.querySelectorAll('.custom-select-option').forEach(el => {
            el.classList.remove('active');
            el.removeAttribute('aria-selected');
          });
          item.classList.add('active');
          item.setAttribute('aria-selected', 'true');
          closeSelect();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        menu.appendChild(item);
      });
    };

    function closeSelect() {
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = wrapper.classList.contains('open');
      document.querySelectorAll('.custom-select.open').forEach(el => {
        if (el !== wrapper) {
          el.classList.remove('open');
          el.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
      wrapper.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });

    select.addEventListener('change', () => {
      triggerText.textContent = select.options[select.selectedIndex]?.textContent || '';
      renderOptions();
    });

    select.classList.add('is-hidden-native-select');
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    wrapper.appendChild(select);
    renderOptions();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select')) {
      document.querySelectorAll('.custom-select.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

function initLightboxGallery(root) {
  const main = root.querySelector('[data-gallery-main]');
  const count = root.querySelector('[data-gallery-count]');
  const lightbox = root.querySelector('[data-lightbox]');
  const lightboxImg = root.querySelector('[data-lightbox-image]');
  const lightboxCount = root.querySelector('[data-lightbox-count]');
  const thumbs = Array.from(root.querySelectorAll('[data-gallery-thumb]'));
  if (!main || !thumbs.length || !lightbox || !lightboxImg) return;
  let current = Math.max(0, thumbs.findIndex(btn => btn.classList.contains('active')));
  let startX = null;

  const images = thumbs.map(btn => ({ src: btn.dataset.src, alt: btn.dataset.alt || '' }));

  function render(index, updateLightbox = true) {
    current = (index + images.length) % images.length;
    main.src = images[current].src;
    main.alt = images[current].alt;
    thumbs.forEach((btn, i) => btn.classList.toggle('active', i === current));
    if (count) count.textContent = `${current + 1} / ${images.length}`;
    if (updateLightbox) {
      lightboxImg.src = images[current].src;
      lightboxImg.alt = images[current].alt;
      if (lightboxCount) lightboxCount.textContent = `${current + 1} / ${images.length}`;
    }
  }

  thumbs.forEach((btn, i) => btn.addEventListener('click', () => render(i)));

  function openLightbox() {
    render(current);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  root.querySelectorAll('[data-open-lightbox]').forEach(el => el.addEventListener('click', openLightbox));
  root.querySelector('[data-lightbox-close]')?.addEventListener('click', closeLightbox);
  root.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => render(current - 1));
  root.querySelector('[data-lightbox-next]')?.addEventListener('click', () => render(current + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') render(current - 1);
    if (e.key === 'ArrowRight') render(current + 1);
  });
  lightbox.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].clientX; }, {passive:true});
  lightbox.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const endX = e.changedTouches[0].clientX;
    const delta = endX - startX;
    if (Math.abs(delta) > 45) {
      if (delta > 0) render(current - 1);
      else render(current + 1);
    }
    startX = null;
  }, {passive:true});

  render(current);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-gallery]').forEach(initLightboxGallery);
});
