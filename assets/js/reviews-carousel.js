(() => {
  'use strict';

  const section = document.querySelector('#guest-reviews');
  const carousel = section?.querySelector('[data-review-carousel]');
  const grid = carousel?.querySelector('.guest-reviews-grid');
  const cards = grid ? Array.from(grid.querySelectorAll('.guest-review-card')) : [];
  if (!section || !carousel || !grid || cards.length < 2) return;

  const prevButton = carousel.querySelector('[data-review-prev]');
  const nextButton = carousel.querySelector('[data-review-next]');
  const toggleButton = carousel.querySelector('[data-review-toggle]');
  const status = carousel.querySelector('[data-review-status]');
  const interval = Math.max(6500, Number(carousel.dataset.interval) || 9000);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  cards.forEach((card, index) => {
    card.dataset.reviewIndex = String(index);
    card.setAttribute('aria-hidden', 'true');
  });

  const authorOf = index =>
    cards[index].querySelector('.guest-review-author strong')?.textContent.trim() || String(index);

  const shuffle = array => {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const visibleCount = () => {
    if (window.matchMedia('(max-width: 640px)').matches) return 1;
    if (window.matchMedia('(max-width: 980px)').matches) return 2;
    return 3;
  };

  let deck = [];
  let lastVisible = [];
  let history = [];
  let historyPosition = -1;
  let timer = null;
  let resizeTimer = null;
  let expanded = false;

  function createDeck(avoidAtStart = []) {
    const remaining = shuffle(cards.map((_, index) => index));
    const ordered = [];
    const batchSize = 3;

    while (remaining.length) {
      const batchAuthors = new Set();
      for (let slot = 0; slot < batchSize && remaining.length; slot += 1) {
        const isFirstBatch = ordered.length < batchSize;
        let candidates = remaining
          .map((index, position) => ({ index, position }))
          .filter(item => !batchAuthors.has(authorOf(item.index)))
          .filter(item => !isFirstBatch || !avoidAtStart.includes(item.index));

        if (!candidates.length) {
          candidates = remaining
            .map((index, position) => ({ index, position }))
            .filter(item => !batchAuthors.has(authorOf(item.index)));
        }
        if (!candidates.length) {
          candidates = remaining.map((index, position) => ({ index, position }));
        }

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        const [index] = remaining.splice(selected.position, 1);
        ordered.push(index);
        batchAuthors.add(authorOf(index));
      }
    }
    return ordered;
  }

  function nextUniqueBatch(count) {
    const batch = [];
    const authors = new Set();
    let safety = cards.length * 3;

    while (batch.length < count && safety > 0) {
      safety -= 1;
      if (!deck.length) deck = createDeck(lastVisible);
      const index = deck.shift();
      const author = authorOf(index);

      if (authors.has(author) && deck.length) {
        deck.push(index);
        continue;
      }
      if (lastVisible.includes(index) && deck.length) {
        deck.push(index);
        continue;
      }
      batch.push(index);
      authors.add(author);
    }

    while (batch.length < count) {
      if (!deck.length) deck = createDeck(lastVisible);
      const index = deck.shift();
      if (!batch.includes(index)) batch.push(index);
    }
    return batch;
  }

  function render(indices, announce = false) {
    cards.forEach(card => {
      card.classList.remove('is-active');
      card.setAttribute('aria-hidden', 'true');
    });

    indices.forEach(index => {
      const card = cards[index];
      card.classList.add('is-active');
      card.setAttribute('aria-hidden', 'false');
    });

    lastVisible = indices.slice();
    if (status) {
      status.textContent = indices.length === 1
        ? `Opinia ${indices[0] + 1} z ${cards.length}`
        : `${indices.length} różne opinie z ${cards.length}`;
      if (!announce) status.setAttribute('aria-live', 'off');
      else status.setAttribute('aria-live', 'polite');
    }
    restartProgress();
  }

  function showNext(manual = false) {
    const count = visibleCount();
    if (historyPosition < history.length - 1) {
      historyPosition += 1;
      render(history[historyPosition], manual);
      return;
    }
    const batch = nextUniqueBatch(count);
    history.push(batch);
    if (history.length > 30) history.shift();
    historyPosition = history.length - 1;
    render(batch, manual);
  }

  function showPrevious() {
    if (historyPosition > 0) {
      historyPosition -= 1;
      render(history[historyPosition], true);
    } else {
      const batch = nextUniqueBatch(visibleCount());
      history.unshift(batch);
      render(batch, true);
    }
  }

  function restartProgress() {
    const progress = carousel.querySelector('.guest-carousel-progress span');
    if (!progress) return;
    progress.style.animation = 'none';
    void progress.offsetWidth;
    progress.style.animation = '';
    progress.style.animationDuration = `${interval}ms`;
  }

  function stopAutoplay() {
    if (timer) window.clearInterval(timer);
    timer = null;
    section.classList.add('is-paused');
  }

  function startAutoplay() {
    stopAutoplay();
    if (
      expanded ||
      reduceMotion.matches ||
      document.hidden ||
      carousel.matches(':hover') ||
      carousel.contains(document.activeElement)
    ) return;
    section.classList.remove('is-paused');
    timer = window.setInterval(() => showNext(false), interval);
    restartProgress();
  }

  function resetForViewport() {
    deck = createDeck(lastVisible);
    history = [];
    historyPosition = -1;
    showNext(false);
    startAutoplay();
  }

  prevButton?.addEventListener('click', () => {
    showPrevious();
    startAutoplay();
  });

  nextButton?.addEventListener('click', () => {
    showNext(true);
    startAutoplay();
  });

  toggleButton?.addEventListener('click', () => {
    expanded = !expanded;
    section.classList.toggle('is-expanded', expanded);
    toggleButton.setAttribute('aria-expanded', String(expanded));
    toggleButton.firstChild.textContent = expanded ? 'Wróć do zmieniających się opinii ' : 'Zobacz wszystkie opinie ';

    if (expanded) {
      cards.forEach(card => {
        card.classList.add('is-active');
        card.setAttribute('aria-hidden', 'false');
      });
      stopAutoplay();
    } else {
      render(lastVisible);
      startAutoplay();
      section.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
  });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', event => {
    if (!carousel.contains(event.relatedTarget)) startAutoplay();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  reduceMotion.addEventListener?.('change', startAutoplay);
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resetForViewport, 180);
  }, { passive: true });

  section.classList.add('is-carousel-ready');
  deck = createDeck();
  showNext(false);
  startAutoplay();
})();
