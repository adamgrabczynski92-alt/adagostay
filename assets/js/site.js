
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

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
