document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-gallery-root]').forEach(root => {
    const main = root.querySelector('[data-gallery-main]');
    const thumbs = [...root.querySelectorAll('[data-gallery-thumb]')];
    const thumbsWrap = root.querySelector('.gallery-thumbs');
    const overlay = root.querySelector('[data-lightbox]');
    const lightImg = root.querySelector('[data-lightbox-image]');
    const prevBtn = root.querySelector('[data-lightbox-prev]');
    const nextBtn = root.querySelector('[data-lightbox-next]');
    const counter = root.querySelector('[data-lightbox-counter]');
    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    function updateCounter() {
      if (counter) counter.textContent = `${currentIndex + 1} / ${thumbs.length}`;
    }

    function scrollThumbIntoView() {
      const btn = thumbs[currentIndex];
      if (btn && typeof btn.scrollIntoView === 'function') {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    function setSlide(index) {
      if (!thumbs.length) return;
      currentIndex = (index + thumbs.length) % thumbs.length;
      const btn = thumbs[currentIndex];
      thumbs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      main.src = btn.dataset.full;
      main.alt = btn.dataset.alt || '';
      if (lightImg) {
        lightImg.src = btn.dataset.full;
        lightImg.alt = btn.dataset.alt || '';
      }
      updateCounter();
      if (thumbsWrap) scrollThumbIntoView();
    }

    thumbs.forEach((btn, index) => {
      btn.addEventListener('click', () => setSlide(index));
    });

    function openLightbox() {
      setSlide(currentIndex);
      overlay.classList.add('open');
      document.body.classList.add('lightbox-open');
    }

    function closeLightbox() {
      overlay.classList.remove('open');
      document.body.classList.remove('lightbox-open');
    }

    if (main) main.addEventListener('click', openLightbox);

    root.querySelectorAll('[data-lightbox-close]').forEach(el => {
      el.addEventListener('click', closeLightbox);
    });

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-lightbox')) closeLightbox();
      });

      overlay.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      overlay.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const delta = touchEndX - touchStartX;
        if (Math.abs(delta) > 50) {
          if (delta < 0) setSlide(currentIndex + 1);
          else setSlide(currentIndex - 1);
        }
      }, { passive: true });
    }

    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); setSlide(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); setSlide(currentIndex + 1); });

    document.addEventListener('keydown', (e) => {
      if (!overlay || !overlay.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') setSlide(currentIndex - 1);
      if (e.key === 'ArrowRight') setSlide(currentIndex + 1);
    });

    setSlide(0);
  });
});