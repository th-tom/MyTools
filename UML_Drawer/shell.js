(() => {
  'use strict';

  const MODE_KEY = 'classo.mode';
  const classWorkspace = document.getElementById('classWorkspace');
  const sequenceWorkspace = document.getElementById('sequenceWorkspace');
  const classControls = document.getElementById('classControls');
  const sequenceControls = document.getElementById('seqControls');
  const switchEl = document.querySelector('.mode-switch');
  const tabs = [...document.querySelectorAll('.mode-tab')];

  let current = null;

  function readMode() {
    try {
      return localStorage.getItem(MODE_KEY) === 'sequence' ? 'sequence' : 'class';
    } catch (error) {
      return 'class';
    }
  }

  function closeMenus() {
    document.querySelectorAll('.menu').forEach((menu) => {
      menu.hidden = true;
    });
    document.querySelectorAll('[aria-haspopup="menu"]').forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
    });
  }

  function setMode(mode, options = {}) {
    const next = mode === 'sequence' ? 'sequence' : 'class';
    if (next === current && !options.force) return;

    current = next;
    const classActive = next === 'class';

    document.body.dataset.mode = next;
    classWorkspace.classList.toggle('is-inactive', !classActive);
    sequenceWorkspace.classList.toggle('is-inactive', classActive);
    classWorkspace.setAttribute('aria-hidden', String(!classActive));
    sequenceWorkspace.setAttribute('aria-hidden', String(classActive));

    classControls.hidden = !classActive;
    sequenceControls.hidden = classActive;

    tabs.forEach((tab) => {
      const active = tab.dataset.mode === next;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    closeMenus();

    try {
      localStorage.setItem(MODE_KEY, next);
    } catch (error) {
      /* 忽略存储不可用的情况 */
    }

    window.dispatchEvent(new CustomEvent('classo:modechange', { detail: { mode: next } }));
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  if (switchEl) {
    switchEl.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const index = tabs.findIndex((tab) => tab.dataset.mode === current);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(index + direction + tabs.length) % tabs.length];
      if (!next) return;
      setMode(next.dataset.mode);
      next.focus();
    });
  }

  setMode(readMode(), { force: true });

  window.ClassoShell = {
    get mode() {
      return current;
    },
    setMode
  };
})();
