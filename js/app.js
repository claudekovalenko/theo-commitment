// Boot, lock screen, tab bar, render loop.

import * as store from './store.js';
import { $, h, clear, initSheet, closeSheet, toast } from './ui.js';
import { ROUTES, currentRoute, onRoute, go } from './router.js';
import { openSettings } from './views/settings.js';
import * as compass from './views/compass.js';
import * as convictions from './views/convictions.js';
import * as plays from './views/plays.js';
import * as log from './views/log.js';
import * as people from './views/people.js';
import * as followups from './views/followups.js';

const VIEWS = { compass, convictions, plays, log, people, do: followups };

const ICONS = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4 10.2 10.2 8.4 15.6l5.4-1.8z"/>',
  convictions: '<path d="M6 3h12v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8.5 3v18"/>',
  plays: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v-2M12 22.5v-2M3.5 12h-2M22.5 12h-2"/>',
  log: '<path d="M5 3.5h14v17H5z"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>',
  people: '<circle cx="9.5" cy="8" r="3.2"/><path d="M3.5 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6.4"/><path d="M17.5 14.6A6 6 0 0 1 21 20"/>',
  do: '<path d="M4 4.5h16v15H4z"/><path d="M8 12.2l3 3 5.2-6"/>',
};

const LABELS = { compass: 'Compass', convictions: 'Convictions', plays: 'Plays', log: 'Log', people: 'People', do: 'Do' };

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
}

function boot() {
  initSheet();
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

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => toast('Offline mode unavailable'));
    });
  }
}

boot();
