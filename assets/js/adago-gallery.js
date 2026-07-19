(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  const translations = {
    pl: {
      dialog: 'Galeria zdjęć apartamentu', close: 'Zamknij galerię', prev: 'Poprzednie zdjęcie', next: 'Następne zdjęcie',
      thumbs: 'Miniatury zdjęć', show: 'Pokaż zdjęcie', image: 'Zdjęcie apartamentu', gallery: 'Przewijana galeria zdjęć apartamentu',
      scrollLeft: 'Przewiń galerię w lewo', scrollRight: 'Przewiń galerię w prawo', hint: 'Przewiń galerię →'
    },
    en: {
      dialog: 'Apartment photo gallery', close: 'Close gallery', prev: 'Previous photo', next: 'Next photo',
      thumbs: 'Photo thumbnails', show: 'Show photo', image: 'Apartment photo', gallery: 'Scrollable apartment photo gallery',
      scrollLeft: 'Scroll gallery left', scrollRight: 'Scroll gallery right', hint: 'Scroll gallery →'
    },
    de: {
      dialog: 'Fotogalerie des Apartments', close: 'Galerie schließen', prev: 'Vorheriges Foto', next: 'Nächstes Foto',
      thumbs: 'Fotominiaturen', show: 'Foto anzeigen', image: 'Foto des Apartments', gallery: 'Scrollbare Fotogalerie des Apartments',
      scrollLeft: 'Galerie nach links scrollen', scrollRight: 'Galerie nach rechts scrollen', hint: 'Galerie scrollen →'
    },
    cs: {
      dialog: 'Fotogalerie apartmánu', close: 'Zavřít galerii', prev: 'Předchozí fotografie', next: 'Další fotografie',
      thumbs: 'Náhledy fotografií', show: 'Zobrazit fotografii', image: 'Fotografie apartmánu', gallery: 'Posuvná fotogalerie apartmánu',
      scrollLeft: 'Posunout galerii doleva', scrollRight: 'Posunout galerii doprava', hint: 'Posunout galerii →'
    },
    uk: {
      dialog: 'Фотогалерея апартаментів', close: 'Закрити галерею', prev: 'Попереднє фото', next: 'Наступне фото',
      thumbs: 'Мініатюри фотографій', show: 'Показати фото', image: 'Фото апартаментів', gallery: 'Галерея фотографій із прокруткою',
      scrollLeft: 'Прокрутити галерею ліворуч', scrollRight: 'Прокрутити галерею праворуч', hint: 'Прокрутити галерею →'
    }
  };

  function currentLanguage() {
    const lang = (document.documentElement.lang || 'pl').toLowerCase();
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('cs') || lang.startsWith('cz')) return 'cs';
    if (lang.startsWith('uk') || lang.startsWith('ua')) return 'uk';
    return 'pl';
  }

  ready(function () {
    const galleries = Array.from(document.querySelectorAll('[data-adago-gallery]'));
    if (!galleries.length) return;
    const t = translations[currentLanguage()] || translations.pl;
    document.querySelectorAll('.ultra-gallery-intro').forEach(el => el.setAttribute('data-gallery-hint', t.hint));

    const lightbox = document.createElement('div');
    lightbox.className = 'adago-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', t.dialog);
    lightbox.innerHTML = `
      <div class="adago-lightbox__dialog">
        <button class="adago-lightbox__close" type="button" aria-label="${t.close}">×</button>
        <div class="adago-lightbox__image-wrap">
          <button class="adago-lightbox__prev" type="button" aria-label="${t.prev}">‹</button>
          <img class="adago-lightbox__image" alt="" />
          <button class="adago-lightbox__next" type="button" aria-label="${t.next}">›</button>
        </div>
        <div class="adago-lightbox__caption"><span class="adago-lightbox__title"></span><span class="adago-lightbox__counter"></span></div>
        <div class="adago-lightbox__thumbs" aria-label="${t.thumbs}"></div>
      </div>`;
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
        b.setAttribute('aria-label', t.show + ' ' + (i + 1));
        const thumb = document.createElement('img');
        thumb.src = item.src;
        thumb.alt = '';
        b.appendChild(thumb);
        b.addEventListener('click', () => { index = i; setImage(); });
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
      img.alt = item.alt || t.image;
      title.textContent = item.caption || item.alt || t.image;
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
      try { window.adagoTrack && window.adagoTrack('open_gallery', { count: items.length, index: index + 1 }); } catch (e) {}
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
      gallery.setAttribute('tabindex', '0');
      gallery.setAttribute('aria-label', gallery.getAttribute('aria-label') || t.gallery);
      if (!gallery.previousElementSibling || !gallery.previousElementSibling.classList.contains('ultra-gallery-scroll-controls')) {
        const controls = document.createElement('div');
        controls.className = 'ultra-gallery-scroll-controls';
        controls.innerHTML = `<button type="button" aria-label="${t.scrollLeft}">‹</button><button type="button" aria-label="${t.scrollRight}">›</button>`;
        gallery.parentNode.insertBefore(controls, gallery);
        const [prev, next] = controls.querySelectorAll('button');
        prev.addEventListener('click', () => gallery.scrollBy({ left: -Math.max(280, gallery.clientWidth * 0.72), behavior: 'smooth' }));
        next.addEventListener('click', () => gallery.scrollBy({ left: Math.max(280, gallery.clientWidth * 0.72), behavior: 'smooth' }));
      }
      gallery.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); gallery.scrollBy({ left: -Math.max(240, gallery.clientWidth * 0.62), behavior: 'smooth' }); }
        if (e.key === 'ArrowRight') { e.preventDefault(); gallery.scrollBy({ left: Math.max(240, gallery.clientWidth * 0.62), behavior: 'smooth' }); }
      });
      Array.from(gallery.querySelectorAll('[data-gallery-src]')).forEach((btn, i) => btn.addEventListener('click', () => open(gallery, i)));
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => move(-1));
    nextBtn.addEventListener('click', () => move(1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    });
    lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0]?.clientX || 0; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const touchEndX = e.changedTouches[0]?.clientX || 0;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 45) move(diff > 0 ? -1 : 1);
    }, { passive: true });
  });
})();
