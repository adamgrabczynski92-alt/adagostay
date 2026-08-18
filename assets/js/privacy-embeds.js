(function () {
  function loadMap(container) {
    if (!container || container.dataset.loaded === 'true') return;
    const src = container.dataset.mapSrc;
    if (!src) return;

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = container.dataset.mapTitle || 'Google Maps';
    iframe.width = '600';
    iframe.height = '450';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;

    container.dataset.loaded = 'true';
    container.replaceChildren(iframe);
    try {
      window.adagoTrack && window.adagoTrack('load_map', { path: location.pathname });
    } catch (e) {}
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-load-map]');
    if (!button) return;
    loadMap(button.closest('[data-map-embed]'));
  });
})();
