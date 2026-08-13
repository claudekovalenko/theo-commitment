// Local-only persistence with optional PIN encryption (AES-GCM / PBKDF2).
// Nothing here ever touches the network — the data lives in this browser only.

import { seedState } from './seed.js';

const KEY_PLAIN = 'tn.v1.data';
const KEY_ENC = 'tn.v1.enc';
const PBKDF2_ROUNDS = 310000;

let state = null;
let cryptoKey = null; // held in memory only, while unlocked
let saltB64 = null;

/* ---------- helpers ---------- */

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const today = () => new Date().toISOString().slice(0, 10);

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(pin, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ROUNDS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/* ---------- lifecycle ---------- */

export const isEncrypted = () => localStorage.getItem(KEY_ENC) !== null;
export const isUnlocked = () => state !== null;

/** Load plaintext data (or fresh seed). Throws if the vault is encrypted. */
export function open() {
  if (isEncrypted()) throw new Error('locked');
  const raw = localStorage.getItem(KEY_PLAIN);
  state = raw ? migrate(JSON.parse(raw)) : seedState();
  if (!raw) persist();
  return state;
}

/** Decrypt with a PIN. Returns false when the PIN is wrong. */
export async function unlock(pin) {
  const blob = JSON.parse(localStorage.getItem(KEY_ENC));
  const key = await deriveKey(pin, unb64(blob.salt));
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.ct),
    );
    state = migrate(JSON.parse(new TextDecoder().decode(plain)));
    cryptoKey = key;
    saltB64 = blob.salt;
    return true;
  } catch {
    return false;
  }
}

/** Drop the key and data from memory. The encrypted blob stays on disk. */
export function lock() {
  state = null;
  cryptoKey = null;
  saltB64 = null;
}

export async function enableLock(pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  cryptoKey = await deriveKey(pin, salt);
  saltB64 = b64(salt);
  await persist();
  localStorage.removeItem(KEY_PLAIN);
}

export async function disableLock() {
  cryptoKey = null;
  saltB64 = null;
  localStorage.removeItem(KEY_ENC);
  await persist();
}

/* ---------- read / write ---------- */

export function get() {
  if (!state) throw new Error('locked');
  return state;
}

let writeTimer = null;
async function persist() {
  const json = JSON.stringify(state);
  if (cryptoKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, new TextEncoder().encode(json));
    localStorage.setItem(KEY_ENC, JSON.stringify({ v: 1, salt: saltB64, iv: b64(iv), ct: b64(ct) }));
    localStorage.removeItem(KEY_PLAIN);
  } else {
    localStorage.setItem(KEY_PLAIN, json);
  }
}

/** Mutate state through a function, then save (debounced) and notify listeners. */
export function update(fn) {
  fn(state);
  state.updatedAt = new Date().toISOString();
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => persist().catch((e) => console.error('save failed', e)), 120);
  listeners.forEach((l) => l(state));
  return state;
}

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ---------- import / export ---------- */

export function exportJSON() {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function importJSON(text, { merge }) {
  const incoming = migrate(JSON.parse(text));
  if (!merge) {
    state = incoming;
  } else {
    for (const list of ['convictions', 'contexts', 'checks', 'notes', 'actions', 'people']) {
      const have = new Set(state[list].map((r) => r.id));
      state[list].push(...(incoming[list] || []).filter((r) => !have.has(r.id)));
    }
  }
  return update(() => {});
}

export function wipe() {
  localStorage.removeItem(KEY_PLAIN);
  localStorage.removeItem(KEY_ENC);
  lock();
}

/* ---------- schema ---------- */

function migrate(data) {
  const base = {
    version: 1,
    createdAt: new Date().toISOString(),
    convictions: [], contexts: [], checks: [], notes: [], actions: [], people: [],
    settings: { autoLockMinutes: 15, name: '' },
  };
  const merged = { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) } };
  merged.version = 1;
  return merged;
}
