// Local-only persistence with optional PIN encryption (AES-GCM / PBKDF2).
// Nothing here ever touches the network — the data lives in this browser only.

import { seedState, seedConvictions } from './seed.js';
import { mergeInto } from './merge.js';
import { DEFAULT_DOMAINS } from './model.js';

// Some hosts (private windows, sandboxed frames) throw on localStorage. Fall
// back to memory so the app still runs, and let the UI say so plainly.
const mem = new Map();
let persistent = true;
const LS = {
  get(k) {
    if (!persistent) return mem.get(k) ?? null;
    try { return localStorage.getItem(k); } catch { persistent = false; return mem.get(k) ?? null; }
  },
  set(k, v) {
    if (persistent) {
      try { localStorage.setItem(k, v); return true; } catch { persistent = false; }
    }
    mem.set(k, v);
    return false;
  },
  remove(k) {
    if (persistent) {
      try { localStorage.removeItem(k); return; } catch { persistent = false; }
    }
    mem.delete(k);
  },
};

export const isPersistent = () => persistent;

// Anything that wants to know whether writes are actually landing.
let lastSaved = null;
const statusWatchers = new Set();
export const saveStatus = () => ({ persistent, lastSaved });
export function onSaveStatus(fn) {
  statusWatchers.add(fn);
  return () => statusWatchers.delete(fn);
}

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

export const isEncrypted = () => LS.get(KEY_ENC) !== null;
export const isUnlocked = () => state !== null;

/** Load plaintext data (or fresh seed). Throws if the vault is encrypted. */
export function open() {
  if (isEncrypted()) throw new Error('locked');
  const raw = LS.get(KEY_PLAIN);
  const parsed = raw ? JSON.parse(raw) : null;
  state = parsed ? migrate(parsed) : seedState();
  lastSaved = state.updatedAt || null; // so "last saved" is true across restarts
  // Write straight back when we seeded or upgraded, so the new shape is durable
  // even if the next thing that happens is the browser being closed.
  const changed = state.__seeded;
  delete state.__seeded;
  if (!parsed || parsed.version !== state.version || changed) persist();
  return state;
}

/** Decrypt with a PIN. Returns false when the PIN is wrong. */
export async function unlock(pin) {
  const blob = JSON.parse(LS.get(KEY_ENC));
  const key = await deriveKey(pin, unb64(blob.salt));
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.ct),
    );
    const parsed = JSON.parse(new TextDecoder().decode(plain));
    state = migrate(parsed);
    lastSaved = state.updatedAt || null;
    cryptoKey = key;
    saltB64 = blob.salt;
    const changed = state.__seeded;
    delete state.__seeded;
    if (parsed.version !== state.version || changed) await persist();
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
  LS.remove(KEY_PLAIN);
}

export async function disableLock() {
  cryptoKey = null;
  saltB64 = null;
  LS.remove(KEY_ENC);
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
  let landed;
  if (cryptoKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, new TextEncoder().encode(json));
    landed = LS.set(KEY_ENC, JSON.stringify({ v: 1, salt: saltB64, iv: b64(iv), ct: b64(ct) }));
    LS.remove(KEY_PLAIN);
  } else {
    landed = LS.set(KEY_PLAIN, json);
  }
  if (landed) lastSaved = new Date().toISOString();
  statusWatchers.forEach((fn) => fn(saveStatus()));
  return landed;
}

/** Write immediately — used when the app is about to be backgrounded or closed. */
export function flush() {
  if (!state) return Promise.resolve(false);
  clearTimeout(writeTimer);
  return persist().catch(() => false);
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

/** Re-render without changing anything — for view state that isn't saved. */
export function notify() {
  listeners.forEach((l) => l(state));
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
    for (const list of ['domains', 'convictions', 'contexts', 'checks', 'blocks', 'notes', 'people', 'verses', 'discernments', 'barriers', 'goals', 'returns', 'commitments']) {
      const have = new Set(state[list].map((r) => r.id));
      state[list].push(...(incoming[list] || []).filter((r) => !have.has(r.id)));
    }
  }
  return update(() => {});
}

export function wipe() {
  LS.remove(KEY_PLAIN);
  LS.remove(KEY_ENC);
  lock();
}

/* ---------- schema ---------- */

// v1 shipped with ministry convictions only. v2 introduced domains, so v1 data
// gets its convictions filed into the domain each one actually belongs to.
const V1_DOMAINS = {
  'healthy families': 'family',
  'disciple making that multiplies': 'ministry',
  'healthy theology': 'ministry',
  'complementarian conviction': 'ministry',
  'strong preaching': 'ministry',
  'highly missional': 'ministry',
};

function migrate(data) {
  const base = {
    version: 3,
    createdAt: new Date().toISOString(),
    domains: [], convictions: [], contexts: [], checks: [], blocks: [], notes: [], people: [],
    verses: [], discernments: [], modelStances: {}, barriers: [], goals: [], returns: [], commitments: [],
    aim: '', weighingSince: '', appliedSeeds: [],
    calling: { placeId: '', place: '', why: '', by: '' },
    settings: {
      autoLockMinutes: 15,
      name: '',
      hushed: {},
      verse: {
        text: 'Unless a grain of wheat falls into the ground and dies, it remains alone; but if it dies, it produces much grain.',
        ref: 'John 12:24',
      },
    },
  };
  const s = {
    ...base, ...data,
    modelStances: { ...base.modelStances, ...(data.modelStances || {}) },
    calling: { ...base.calling, ...(data.calling || {}) },
    settings: {
      ...base.settings,
      ...(data.settings || {}),
      hushed: { ...base.settings.hushed, ...((data.settings || {}).hushed || {}) },
      verse: { ...base.settings.verse, ...((data.settings || {}).verse || {}) },
    },
  };

  if (!s.domains.length) s.domains = DEFAULT_DOMAINS.map((d) => ({ ...d }));

  const known = new Set(s.domains.map((d) => d.id));
  const fallback = known.has('ministry') ? 'ministry' : s.domains[s.domains.length - 1].id;
  s.convictions.forEach((c) => {
    if (!c.domainId || !known.has(c.domainId)) {
      c.domainId = V1_DOMAINS[(c.title || '').trim().toLowerCase()] || fallback;
    }
  });

  // A v1 vault only ever held ministry convictions. Stock the domains that
  // came with v2 so they aren't empty shells — all marked seeded, so
  // "Clear the starter content" still removes anything untouched.
  const starters = seedConvictions();
  s.domains.forEach((d) => {
    if (s.convictions.some((c) => c.domainId === d.id)) return;
    s.convictions.push(...starters.filter((c) => c.domainId === d.id));
  });

  s.contexts.forEach((c) => {
    if (!c.horizon) c.horizon = 'unknown';
    if (!c.stage) c.stage = 'scouting';
    if (!c.placeMode) c.placeMode = c.placeId ? 'in' : 'unknown';
  });
  s.checks.forEach((k) => {
    if (!k.barriers) k.barriers = {};
    if (!k.us) k.us = { level: 'na', note: '' };
    if (!k.kid) k.kid = { level: 'unknown', note: '' };
    if (!k.formation) k.formation = { level: 'unknown', note: '' };
    if (!k.home) k.home = 'unknown';
    if (!k.settle) k.settle = 'unknown';
  });
  s.people.forEach((p) => { if (p.groundId === undefined) p.groundId = ''; });

  // v2 kept follow-ups in `actions`. In v3 anything outstanding is a thing
  // standing between you and a decision, so they become blocks.
  if (Array.isArray(data.actions) && data.actions.length) {
    s.blocks = s.blocks.concat(data.actions.map((a) => ({
      id: a.id,
      groundId: (a.contextIds || [])[0] || '',
      title: a.title,
      wouldSettle: a.detail || '',
      who: '',
      due: a.due || '',
      hard: false,
      status: a.done ? 'settled' : 'open',
      settledAt: a.doneAt || '',
      seeded: a.seeded || false,
      createdAt: a.createdAt || new Date().toISOString(),
    })));
  }
  delete s.actions;

  s.blocks.forEach((b) => { if (!b.status) b.status = 'open'; });

  s.__seeded = applyLateSeeds(s);

  s.version = 3;
  return s;
}

/**
 * Things added to the app after someone already had data. Each runs once and
 * is remembered by id, so deleting one doesn't bring it back next launch.
 */
function applyLateSeeds(s) {
  const done = new Set(s.appliedSeeds || []);
  const before = done.size;
  const mark = (id) => { done.add(id); };

  if (!done.has('weighing-since') && !s.weighingSince) {
    s.weighingSince = new Date(new Date().getFullYear() - 4, 0, 1).toISOString().slice(0, 10);
    mark('weighing-since');
  }

  if (!done.has('consistent-community')
    && !s.convictions.some((c) => (c.title || '').toLowerCase() === 'community that stays')) {
    s.convictions.push({
      id: uid(),
      domainId: s.domains.some((d) => d.id === 'roots') ? 'roots' : s.domains[0]?.id,
      title: 'Community that stays',
      weight: 'core',
      summary: 'The same faces over years, not a rotating cast. Consistency is what turns people into '
        + 'family — you can\'t be known by a crowd that keeps changing.',
      scriptures: 'Acts 2:46; Hebrews 10:24-25; Proverbs 27:10',
      practice: 'The people who were here three years ago are still here, and still close.',
      forming: '',
      seeded: true,
      createdAt: new Date().toISOString(),
    });
    mark('consistent-community');
  }

  if (!done.has('antioch') && !s.contexts.some((c) => (c.name || '').toLowerCase().includes('antioch'))) {
    s.contexts.push({
      id: uid(),
      name: 'Antioch',
      kind: 'network',
      stage: 'scouting',
      placeId: '',
      placeMode: 'unknown',
      modelId: '',
      horizon: 'unknown',
      notes: 'A church-planting movement with a strong sending and discipleship culture. '
        + 'Weigh the specific congregation, not the movement — networks vary church to church, '
        + 'and the kid test is answered by the households in the room, not the brand.',
      seeded: true,
      createdAt: new Date().toISOString(),
    });
    mark('antioch');
  }

  // What E3 measurably produces in LA is healthy house churches — which is the
  // model he leans against. That tension is the decision, so the app records it
  // as fruit and puts the three things worth going and looking at in the way.
  if (!done.has('e3-fruit')) {
    const e3 = s.contexts.find((c) => /\be3\b/i.test(c.name || ''));
    if (e3 && !e3.output) {
      e3.output = 'Healthy house churches started in LA.';
      e3.outputModelId = 'house';
      [
        ['Sit in the house churches E3 has actually started here',
          'Three of them, on ordinary weeks, not a showcase. Who teaches, who corrects, who\'s still there after two years.'],
        ['Where does oversight come from in an E3 house church?',
          'A name and a structure — who has authority to correct a leader, and what happened the last time one needed correcting.'],
        ['Am I against the house church model, or against the ones I\'ve seen?',
          'One sentence I\'d say out loud, and the specific thing that would change my mind.'],
      ].forEach(([title, wouldSettle]) => {
        if (s.blocks.some((b) => b.title === title)) return;
        s.blocks.push({
          id: uid(), groundId: e3.id, title, wouldSettle, who: '', due: '',
          hard: true, status: 'open', seeded: true, createdAt: new Date().toISOString(),
        });
      });
      mark('e3-fruit');
    }
  }

  // If the job is starting house churches, the model stops being something you
  // weigh from outside. Put the option on the board and make the house-church
  // question a conviction to settle, not a preference to hold loosely.
  if (!done.has('the-aim') && !s.aim) {
    s.aim = 'A ministry I could be planted with — where I\'d leave my kids unsupervised, '
      + 'where my son comes back more on mission, that makes disciples and doesn\'t cross my lines.';
    mark('the-aim');
  }

  if (!done.has('npl-house-churches')) {
    if (!s.contexts.some((c) => /\bnpl\b/i.test(c.name || ''))) {
      s.contexts.push({
        id: uid(),
        name: 'NPL',
        kind: 'network',
        stage: 'scouting',
        placeId: '',
        placeMode: 'unknown',
        modelId: 'house',
        horizon: 'unknown',
        output: '',
        outputModelId: '',
        myPart: 'Start house churches.',
        myPartModelId: 'house',
        notes: 'Rename this if the name came through wrong. The point is the part: '
          + 'if you\'re in it, your week is spent starting house churches — the one model '
          + 'you\'ve marked yourself as leaning against.',
        seeded: true,
        createdAt: new Date().toISOString(),
      });
    }
    if (!s.convictions.some((c) => /house church/i.test(c.title || ''))) {
      s.convictions.push({
        id: uid(),
        domainId: s.domains.some((d) => d.id === 'ministry') ? 'ministry' : s.domains[0]?.id,
        title: 'Where I actually stand on house churches',
        weight: 'forming',
        summary: 'Not a preference any more. Both live options in LA either produce house '
          + 'churches or would have me starting them, so this is the conviction the decision '
          + 'is waiting on.',
        scriptures: 'Acts 2:46; Acts 20:20; 1 Timothy 3:1-7; Titus 1:5; Hebrews 13:17',
        practice: 'I could say where I stand out loud to someone who plants them, and name '
          + 'the specific thing that would change my mind.',
        forming: 'I lean against the model — thin on teaching depth and real oversight. But my '
          + 'part in LA would be starting them. I can\'t hold both for another four years.',
        seeded: true,
        createdAt: new Date().toISOString(),
      });
    }
    mark('npl-house-churches');
  }

  // NPL and E3 turned out to be two names for one body. Fold them together
  // rather than leave the board showing three options where there are two.
  if (!done.has('npl-is-e3')) {
    const npl = s.contexts.find((c) => /\bnpl\b/i.test(c.name || ''));
    const e3 = s.contexts.find((c) => /\be3\b/i.test(c.name || ''));
    if (npl && e3) mergeInto(s, npl.id, e3.id);
    mark('npl-is-e3');
  }

  // What he's already carrying — named in his own words, so the plate isn't empty
  // the first time he opens it.
  if (!done.has('carrying')) {
    if (!s.commitments) s.commitments = [];
    const antioch = s.contexts.find((c) => /antioch/i.test(c.name || ''));
    const mk = (o) => ({
      id: uid(), name: '', kind: 'other', depth: '', hours: '', where: '', groundId: '',
      started: '', ends: '', why: '', wellDone: '', serves: 'unsure', hold: 'unsure',
      giving: 'unsure', after: 'unsure', ended: false, seeded: true,
      createdAt: new Date().toISOString(), ...o,
    });
    [
      { name: 'Leadership cohort with Antioch', kind: 'cohort', where: 'Hawaii',
        groundId: antioch?.id || '', hold: 'through', after: 'finish',
        worth: 'mixed', worthKeeping: 'The preaching.',
        why: 'Not looking to drop it — seeing it through to the end. Not amazing all the way, but '
          + 'the preaching part is worth being there for. Not eager to go back to Hawaii right now: '
          + 'finishing it isn\'t the same as renewing it.' },
      { name: 'Seminary — OTS', kind: 'study', hold: 'through',
        why: 'A long obedience. Finishing it is the point.' },
      { name: 'Shorebreak — Big Island crew', kind: 'ministry', where: 'Big Island',
        why: 'People, not a programme.' },
    ].forEach((c) => {
      if (s.commitments.some((x) => x.name === c.name)) return;
      s.commitments.push(mk(c));
    });
    mark('carrying');
  }

  s.appliedSeeds = [...done];
  return done.size !== before;
}
