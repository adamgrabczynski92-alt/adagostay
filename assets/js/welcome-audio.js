(function () {
  'use strict';

  const messages = {
    pl: {
      play: 'Odtwórz powitanie',
      pause: 'Wstrzymaj nagranie',
      replay: 'Odtwórz ponownie',
      unavailable: 'Nagranie niedostępne'
    },
    en: {
      play: 'Play welcome message',
      pause: 'Pause recording',
      replay: 'Play again',
      unavailable: 'Recording unavailable'
    },
    de: {
      play: 'Begrüßung abspielen',
      pause: 'Aufnahme pausieren',
      replay: 'Erneut abspielen',
      unavailable: 'Aufnahme nicht verfügbar'
    },
    cs: {
      play: 'Přehrát uvítání',
      pause: 'Pozastavit nahrávku',
      replay: 'Přehrát znovu',
      unavailable: 'Nahrávka není dostupná'
    },
    uk: {
      play: 'Відтворити привітання',
      pause: 'Призупинити запис',
      replay: 'Відтворити ще раз',
      unavailable: 'Запис недоступний'
    }
  };

  function pageLanguage() {
    const lang = (document.documentElement.lang || 'pl').toLowerCase();
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('cs') || lang.startsWith('cz')) return 'cs';
    if (lang.startsWith('uk') || lang.startsWith('ua')) return 'uk';
    return 'pl';
  }

  function initWelcomeAudio() {
    if (!document.body.classList.contains('page-home')) return;

    const copy = messages[pageLanguage()] || messages.pl;
    const audio = document.createElement('audio');
    const button = document.createElement('button');
    const icon = document.createElement('span');
    const label = document.createElement('span');
    let unlockEventsBound = false;

    audio.id = 'adago-welcome-audio';
    audio.src = '/assets/audio/adago-welcome.mp3';
    audio.preload = 'auto';
    audio.autoplay = true;
    audio.playsInline = true;
    audio.setAttribute('aria-hidden', 'true');

    button.type = 'button';
    button.className = 'adago-audio-control';
    button.dataset.state = 'ready';
    button.setAttribute('aria-controls', audio.id);
    button.setAttribute('aria-pressed', 'false');

    icon.className = 'adago-audio-control__icon';
    icon.setAttribute('aria-hidden', 'true');
    label.className = 'adago-audio-control__label';
    button.append(icon, label);
    document.body.append(audio, button);

    function setState(state) {
      button.dataset.state = state;

      if (state === 'playing') {
        label.textContent = copy.pause;
        button.setAttribute('aria-label', copy.pause);
        button.setAttribute('aria-pressed', 'true');
        return;
      }

      if (state === 'ended') {
        label.textContent = copy.replay;
        button.setAttribute('aria-label', copy.replay);
        button.setAttribute('aria-pressed', 'false');
        return;
      }

      if (state === 'error') {
        label.textContent = copy.unavailable;
        button.setAttribute('aria-label', copy.unavailable);
        button.setAttribute('aria-pressed', 'false');
        button.disabled = true;
        return;
      }

      label.textContent = copy.play;
      button.setAttribute('aria-label', copy.play);
      button.setAttribute('aria-pressed', 'false');
    }

    function removeUnlockEvents() {
      if (!unlockEventsBound) return;
      unlockEventsBound = false;
      document.removeEventListener('pointerdown', unlockOnInteraction, true);
      document.removeEventListener('keydown', unlockOnInteraction, true);
    }

    function playAudio() {
      if (audio.ended) audio.currentTime = 0;
      const attempt = audio.play();
      if (attempt && typeof attempt.then === 'function') {
        return attempt.then(removeUnlockEvents).catch(() => {
          setState('blocked');
          throw new Error('Autoplay blocked');
        });
      }
      return Promise.resolve();
    }

    function unlockOnInteraction(event) {
      if (event.target instanceof Element && event.target.closest('.adago-audio-control')) return;
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      playAudio().catch(() => {});
    }

    function bindUnlockEvents() {
      if (unlockEventsBound) return;
      unlockEventsBound = true;
      document.addEventListener('pointerdown', unlockOnInteraction, true);
      document.addEventListener('keydown', unlockOnInteraction, true);
    }

    button.addEventListener('click', () => {
      if (!audio.paused && !audio.ended) {
        audio.pause();
        removeUnlockEvents();
        return;
      }
      playAudio().catch(bindUnlockEvents);
    });

    audio.addEventListener('playing', () => setState('playing'));
    audio.addEventListener('pause', () => {
      if (!audio.ended) setState('paused');
    });
    audio.addEventListener('ended', () => {
      removeUnlockEvents();
      setState('ended');
    });
    audio.addEventListener('error', () => {
      removeUnlockEvents();
      setState('error');
    });

    setState('ready');
    playAudio().catch(bindUnlockEvents);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWelcomeAudio, { once: true });
  } else {
    initWelcomeAudio();
  }
})();
