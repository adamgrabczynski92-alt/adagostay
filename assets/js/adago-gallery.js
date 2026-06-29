
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const galleries = Array.from(document.querySelectorAll('[data-adago-gallery]'));
    if (!galleries.length) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'adago-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Galeria zdjęć apartamentu');
    lightbox.innerHTML = `
      <div class="adago-lightbox__dialog">
        <button class="adago-lightbox__close" type="button" aria-label="Zamknij galerię">×</button>
        <div class="adago-lightbox__image-wrap">
          <button class="adago-lightbox__prev" type="button" aria-label="Poprzednie zdjęcie">‹</button>
          <img class="adago-lightbox__image" alt="" />
          <button class="adago-lightbox__next" type="button" aria-label="Następne zdjęcie">›</button>
        </div>
        <div class="adago-lightbox__caption"><span class="adago-lightbox__title"></span><span class="adago-lightbox__counter"></span></div>
        <div class="adago-lightbox__thumbs" aria-label="Miniatury zdjęć"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    const img = lightbox.querySelector('.adago-lightbox__image');
    const title = lightbox.querySelector('.adago-lightbox__title');
    const counter = lightbox.querySelector('.adago-lightbox__counter');
    const thumbs = lightbox.querySelector('.adago-lightbox__thumbs');
    const closeBtn = lightbox.querySelector('.adago-lightbox__close');
    const prevBtn = lightbox.querySelector('.adago-lightbox__prev');
    const nextBtn = lightbox.querySelector('.adago-lightbox__next');

    let items = [];
    let index = 0;
    let lastFocus = null;
    let touchStartX = 0;

    function renderThumbs() {
      thumbs.innerHTML = '';
      items.forEach((item, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'adago-lightbox__thumb' + (i === index ? ' active' : '');
        b.setAttribute('aria-label', 'Pokaż zdjęcie ' + (i + 1));
        b.innerHTML = '<img src="' + item.src + '" alt="">';
        b.addEventListener('click', () => {
          index = i;
          setImage();
        });
        thumbs.appendChild(b);
      });
    }

    function updateThumbs() {
      Array.from(thumbs.children).forEach((el, i) => {
        el.classList.toggle('active', i === index);
        if (i === index) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      });
    }

    function setImage() {
      const item = items[index];
      if (!item) return;
      img.src = item.src;
      img.alt = item.alt || 'Zdjęcie apartamentu';
      title.textContent = item.caption || item.alt || 'Zdjęcie apartamentu';
      counter.textContent = ' ' + (index + 1) + '/' + items.length;
      prevBtn.style.display = items.length > 1 ? '' : 'none';
      nextBtn.style.display = items.length > 1 ? '' : 'none';
      updateThumbs();
    }

    function open(gallery, startIndex) {
      const buttons = Array.from(gallery.querySelectorAll('[data-gallery-src]'));
      items = buttons.map(btn => ({
        src: btn.getAttribute('data-gallery-src'),
        alt: btn.getAttribute('data-gallery-alt') || btn.querySelector('img')?.alt || '',
        caption: btn.getAttribute('data-gallery-caption') || btn.querySelector('img')?.alt || ''
      })).filter(item => item.src);
      if (!items.length) return;

      index = Math.max(0, Math.min(startIndex, items.length - 1));
      lastFocus = document.activeElement;
      renderThumbs();
      setImage();
      lightbox.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
      closeBtn.focus();

      try {
        window.adagoTrack && window.adagoTrack('open_gallery', { count: items.length, index: index + 1 });
      } catch (e) {}
    }

    function close() {
      lightbox.classList.remove('open');
      document.documentElement.style.overflow = '';
      img.removeAttribute('src');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function move(delta) {
      if (!items.length) return;
      index = (index + delta + items.length) % items.length;
      setImage();
    }

    galleries.forEach(gallery => {
      Array.from(gallery.querySelectorAll('[data-gallery-src]')).forEach((btn, i) => {
        btn.addEventListener('click', () => open(gallery, i));
      });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => move(-1));
    nextBtn.addEventListener('click', () => move(1));
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    });
    lightbox.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0]?.clientX || 0;
    }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const touchEndX = e.changedTouches[0]?.clientX || 0;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 45) move(diff > 0 ? -1 : 1);
    }, { passive: true });
  });
})();
