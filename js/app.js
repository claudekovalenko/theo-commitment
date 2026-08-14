// Boot, lock screen, tab bar, render loop.

import * as store from './store.js';
import { $, h, clear, initSheet, closeSheet } from './ui.js';
import { ROUTES, currentRoute, onRoute, go } from './router.js';
import { openSettings } from './views/settings.js';
import * as target from './views/target.js';
import * as land from './views/land.js';
import * as soil from './views/soil.js';
import * as unsettled from './views/unsettled.js';
import * as journal from './views/journal.js';

const VIEWS = { target, land, soil, unsettled, journal };

const ICONS = {
  target: '<path d="M3.5 13h17"/><path d="M12 13v-5"/><circle cx="12" cy="5.5" r="2.8"/><path d="M12 13c0 4-3 5-4.5 7M12 13c0 4 3 5 4.5 7M12 13v7.5"/>',
  land: '<path d="M2.5 17.5 9 6l6.5 11.5z"/><path d="M13 17.5 17 10l4.5 7.5z"/><path d="M2 20.5h20"/>',
  soil: '<path d="M3.5 9h17"/><path d="M7 9v11M12 9v11M17 9v11"/><path d="M4 5.5c2.5-2 5-2 8 0s5.5 2 8 0"/>',
  unsettled: '<path d="M12 3.5 21 19H3z"/><path d="M12 10v4"/><circle cx="12" cy="16.6" r=".6" fill="currentColor"/>',
  journal: '<path d="M6 3h12v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8.5 3v18"/>',
};

const LABELS = { target: 'Ground', land: 'Land', soil: 'Soil', unsettled: 'In the way', journal: 'Journal' };

/* ---------- render ---------- */

function renderTabs(active) {
  const nav = clear($('#tabs'));
  ROUTES.forEach((r) => {
    const btn = h('button', { class: `tab${r === active ? ' active' : ''}`, onClick: () => go(r) });
    btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[r]}</svg><span>${LABELS[r]}</span>`;
    if (r === active) btn.setAttribute('aria-current', 'page');
    nav.append(btn);
  });
}

let rendering = false;
function render() {
  if (!store.isUnlocked() || rendering) return;
  rendering = true;
  const route = currentRoute();
  const state = store.get();
  const view = clear($('#view'));
  view.append(VIEWS[route].render(state));
  $('#view-title').textContent = VIEWS[route].title;
  renderTabs(route);
  rendering = false;
}

/* ---------- auto-lock ---------- */

let lastTouch = Date.now();
const touch = () => { lastTouch = Date.now(); };

function lockNow() {
  store.lock();
  closeSheet(true);
  $('#shell').hidden = true;
  clear($('#view'));
  showLock();
}

function watchIdle() {
  ['pointerdown', 'keydown', 'visibilitychange'].forEach((e) => document.addEventListener(e, touch, { passive: true }));
  setInterval(() => {
    if (!store.isUnlocked() || !store.isEncrypted()) return;
    const minutes = Number(store.get().settings.autoLockMinutes || 0);
    if (minutes > 0 && Date.now() - lastTouch > minutes * 60000) lockNow();
  }, 15000);
}

/* ---------- lock screen ---------- */

function showLock() {
  const lock = $('#lock');
  lock.hidden = false;
  $('#lock-error').hidden = true;
  const pin = $('#lock-pin');
  pin.value = '';
  setTimeout(() => pin.focus(), 60);
}

function wireLock() {
  $('#lock-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = $('#lock-pin').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Checking…';
    const ok = await store.unlock(pin);
    btn.disabled = false;
    btn.textContent = 'Unlock';
    if (!ok) {
      const err = $('#lock-error');
      err.textContent = 'That PIN didn\'t work.';
      err.hidden = false;
      $('#lock-pin').value = '';
      return;
    }
    $('#lock').hidden = true;
    start();
  });
}

/* ---------- start ---------- */

function start() {
  $('#shell').hidden = false;
  $('#btn-lock').hidden = !store.isEncrypted();
  touch();
  render();

  if (!store.isPersistent()) warnNotSaving();
}

function warnNotSaving() {
  const warn = $('#warn');
  warn.textContent = 'This browser is blocking storage here, so nothing is being saved. Open the app in its own '
    + 'tab (or install it to your home screen) and it will save normally.';
  warn.hidden = false;
}

function boot() {
  initSheet();

  // iOS in particular will kill a backgrounded tab before a debounced write lands.
  const flush = () => { store.flush(); };
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  store.onSaveStatus((st) => { if (!st.persistent) warnNotSaving(); });
  wireLock();
  watchIdle();

  onRoute(render);
  store.subscribe(() => {
    render();
    $('#btn-lock').hidden = !store.isEncrypted();
  });

  $('#btn-settings').addEventListener('click', openSettings);
  $('#btn-lock').addEventListener('click', lockNow);

  if (store.isEncrypted()) {
    showLock();
  } else {
    store.open();
    if (!location.hash) location.hash = '#/compass';
    start();
  }

  // The single-file build has no manifest and no sw.js to register.
  if ('serviceWorker' in navigator && document.querySelector('link[rel=manifest]')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

boot();
