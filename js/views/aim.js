// The target.
//
// One thing in the centre: what I'm going for. Everything I could say yes to is
// a shot at it, placed by how close it actually lands. Not a list of pros and
// cons — a picture of what I'm aiming at and how far off each option is.

import * as store from './../store.js';
import { uid, today } from './../store.js';
import {
  LEVELS, KID_LEVELS, FORMATION_LEVELS, BARRIER_STATES, SETTLE_LEVELS, US_LEVELS,
  byId, latestCheck, weightOf,
} from './../model.js';
import {
  h, frag, empty, openSheet, closeSheet, field, area, toast, daysBetween,
} from './../ui.js';
import { editGround, editCalling } from './../editors.js';
import { CHURCH_MODELS, MODEL_STANCES } from './../models.js';
import { openGround } from './land.js';

export const title = 'The target';

const GLYPH = { good: '✓', ok: '~', thin: '!', bad: '✕', unknown: '·' };

/** The rings, from the centre out. Where a shot lands is the whole answer. */
const RINGS = [
  { id: 'bullseye', at: 0.22, label: 'This is it', tone: 'good' },
  { id: 'close', at: 0.46, label: 'Close', tone: 'ok' },
  { id: 'wide', at: 0.70, label: 'Wide', tone: 'thin' },
  { id: 'edge', at: 0.94, label: 'Barely on it', tone: 'bad' },
];

/* ---------- what I'm going for ---------- */

const DEFAULT_AIM = 'A ministry I could be planted with — where I\'d leave my kids '
  + 'unsupervised, where my son comes back more on mission, that makes disciples and '
  + 'doesn\'t cross my lines.';

export function editAim() {
  const state = store.get();
  let text = state.aim || '';
  openSheet('What am I going for?', () => frag(
    h('p', { class: 'small muted' },
      'One sentence at the centre of the target. Not the job, not the city — the thing '
      + 'that would make you say yes. Everything else gets measured by how close it lands to this.'),
    field('The bullseye', area({
      value: text, style: 'min-height:120px', placeholder: DEFAULT_AIM,
      onInput: (e) => { text = e.target.value; },
    })),
    h('button', {
      class: 'btn ghost block', style: 'margin-bottom:10px',
      onClick: () => { text = DEFAULT_AIM; closeSheet(); store.update((st) => { st.aim = DEFAULT_AIM; }); toast('Set'); },
    }, 'Use the one built from my own words'),
    h('button', {
      class: 'btn primary block',
      onClick: () => {
        if (!text.trim()) return toast('Write what you\'re going for');
        store.update((st) => { st.aim = text.trim(); });
        closeSheet();
        toast('Saved');
      },
    }, 'Save'),
  ));
}

/* ---------- the shots ---------- */

function options(state) {
  return state.contexts.filter((c) => c.kind !== 'place');
}

/** Everything that decides it, in the order it decides it. */
function rows(state, { all = false } = {}) {
  const out = [
    { id: 'kid', label: 'I\'d leave my kids with them, unsupervised', kind: 'kid', levels: KID_LEVELS, weight: 4 },
    { id: 'formation', label: 'He\'d come back sharper, not softer', kind: 'formation', levels: FORMATION_LEVELS, weight: 4 },
  ];
  (state.barriers || []).forEach((b) => out.push({
    id: b.id, label: b.title, kind: 'barrier', levels: BARRIER_STATES, hard: b.hard, weight: 3,
  }));
  state.convictions
    .filter((c) => (all ? true : c.weight === 'core'))
    .forEach((c) => out.push({ id: c.id, label: c.title, kind: 'req', levels: LEVELS, req: c, weight: weightOf(c) }));
  out.push({ id: 'us', label: 'My wife and I are agreed', kind: 'us', levels: US_LEVELS, weight: 3 });
  out.push({ id: 'settle', label: 'We could settle in with them completely', kind: 'settle', levels: SETTLE_LEVELS, weight: 2 });
  return out;
}

function cellValue(check, row) {
  if (!check) return null;
  if (row.kind === 'kid') return check.kid?.level || 'unknown';
  if (row.kind === 'formation') return check.formation?.level || 'unknown';
  if (row.kind === 'us') return check.us?.level || 'na';
  if (row.kind === 'settle') return check.settle || 'unknown';
  if (row.kind === 'barrier') return check.barriers?.[row.id]?.state || 'unclear';
  return check.ratings?.[row.id]?.level || 'unknown';
}

function cellNote(check, row) {
  if (!check) return '';
  if (row.kind === 'kid') return check.kid?.note || '';
  if (row.kind === 'formation') return check.formation?.note || '';
  if (row.kind === 'us') return check.us?.note || '';
  if (row.kind === 'settle') return check.settleNote || '';
  if (row.kind === 'barrier') return check.barriers?.[row.id]?.note || '';
  return check.ratings?.[row.id]?.note || '';
}

const UNANSWERED = new Set(['unknown', 'unclear', 'na']);

/** A level's worth, 0–1. Null when it hasn't been answered. */
function worth(row, value) {
  const lv = byId(row.levels, value);
  if (!lv || UNANSWERED.has(value)) return null;
  if (typeof lv.score === 'number') return lv.score;
  if (typeof lv.cap === 'number') return lv.cap;
  return { good: 1, ok: 0.7, thin: 0.35, bad: 0 }[lv.tone] ?? null;
}

/**
 * Where this option's shot lands. 0 is dead centre; anything past 1 missed the
 * target altogether. Distance is earned two ways — by answering well and by
 * actually knowing. A place you haven't looked at can't land near the middle.
 */
export function shot(state, ground) {
  const check = latestCheck(state.checks, ground.id);
  const rowList = rows(state);

  if (ground.stage === 'ruled-out') {
    return { dist: 1.3, tone: 'bad', word: 'Off the target', why: 'You ruled them out.', check };
  }
  if (!check) {
    return { dist: 1.3, tone: 'unknown', word: 'Not taken', why: 'You haven\'t marked a single thing here.', check };
  }

  const walls = (state.barriers || []).filter((b) => b.hard && check.barriers?.[b.id]?.state === 'fails');
  if (walls.length) {
    return {
      dist: 1.3, tone: 'bad', word: 'Off the target',
      why: `Fails ${walls.map((b) => b.title.toLowerCase()).join(' and ')}. That's a wall, not a distance.`,
      check,
    };
  }

  let got = 0;
  let possible = 0;
  let answered = 0;
  rowList.forEach((r) => {
    const w = worth(r, cellValue(check, r));
    if (w === null) return;
    answered += 1;
    got += w * r.weight;
    possible += r.weight;
  });

  const known = rowList.length ? answered / rowList.length : 0;
  const fit = possible ? got / possible : 0;
  const closeness = fit * (0.45 + 0.55 * known);
  const dist = Math.max(0.05, Math.min(1.15, 1 - closeness));

  const kid = check.kid?.level || 'unknown';
  const missing = rowList.length - answered;
  let word = 'Wide';
  let why = '';
  // The gate doesn't average in with everything else. Fail it and the shot is
  // pushed to the outside ring no matter how well the rest marked up.
  let out = dist;
  if (kid === 'no' || kid === 'supervised' || check.formation?.level === 'softer') {
    out = Math.max(dist, RINGS[3].at);
  }
  if (kid === 'no' || kid === 'supervised') {
    word = 'Barely on it';
    why = 'You wouldn\'t leave your kids with them. Nothing else moves it in.';
  } else if (check.formation?.level === 'softer') {
    word = 'Barely on it';
    why = 'He\'d come back softer. That pushes everything out.';
  } else if (dist <= RINGS[0].at) {
    word = 'This is it';
    why = missing ? `${missing} still unanswered, and none of it is failing.` : 'Nothing in the way. This is a decision now.';
  } else if (dist <= RINGS[1].at) {
    word = 'Close';
    why = missing ? `${missing} of ${rowList.length} you still can't answer.` : 'Close, but something is short.';
  } else if (dist <= RINGS[2].at) {
    word = 'Wide';
    why = missing > answered
      ? `You've only answered ${answered} of ${rowList.length}. Mostly you don't know them yet.`
      : 'Real gaps, not just unknowns.';
  } else {
    word = 'Barely on it';
    why = missing > answered ? 'Almost nothing answered yet.' : 'Too much of it is short.';
  }

  const tone = out <= RINGS[0].at ? 'good' : out <= RINGS[1].at ? 'ok' : out <= RINGS[2].at ? 'thin' : 'bad';
  return { dist: out, tone, word, why, check, answered, missing, total: rowList.length };
}

/* ---------- drawing it ---------- */

function targetSvg(shots) {
  // Wider than tall, so a name sitting outside the rings still has room to print.
  const W = 340;
  const H = 250;
  const cx = W / 2;
  const cy = H / 2;
  const R = 96;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'target-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'The target: what I am going for, and how close each option lands.');
  const el = (name, attrs) => {
    const n = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    svg.append(n);
    return n;
  };

  // rings, outermost first so the centre sits on top
  [...RINGS].reverse().forEach((ring) => {
    el('circle', { cx, cy, r: R * ring.at, class: `ring ring-${ring.id}` });
  });
  el('circle', { cx, cy, r: 3.2, class: 'pin' });

  // the shots
  const n = shots.length;
  shots.forEach(({ ground, s }, i) => {
    const angle = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2 + (n > 1 ? 0.35 : 0);
    const r = R * Math.min(s.dist, 1.18);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `shot tone-${s.tone}`);
    svg.append(g);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    Object.entries({ cx: x, cy: y, r: 7, class: 'shot-dot' })
      .forEach(([k, v]) => dot.setAttribute(k, v));
    g.append(dot);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const right = Math.cos(angle) >= 0;
    Object.entries({
      x: x + (right ? 12 : -12), y: y + 4,
      'text-anchor': right ? 'start' : 'end', class: 'shot-label',
    }).forEach(([k, v]) => label.setAttribute(k, v));
    label.textContent = ground.name;
    g.append(label);
    g.append((() => {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      t.textContent = `${ground.name} — ${s.word}. ${s.why}`;
      return t;
    })());
  });

  return svg;
}

/* ---------- marking one option up ---------- */

function openCell(groundId, row) {
  const state = store.get();
  const ground = state.contexts.find((c) => c.id === groundId);
  const check = latestCheck(state.checks, groundId);
  let note = cellNote(check, row);
  const current = cellValue(check, row);

  openSheet(ground.name, () => frag(
    h('p', { class: 'eyebrow' }, row.hard ? 'A line I don\'t cross' : 'Where they stand'),
    h('h2', { style: 'margin:2px 0 10px' }, row.label),
    row.req?.practice ? h('p', { class: 'small muted' }, row.req.practice) : null,
    row.req?.scriptures ? h('p', { class: 'small', style: 'color:var(--moss)' }, row.req.scriptures) : null,

    h('div', { class: 'stack', style: 'margin:14px 0' },
      row.levels.map((lv) => h('button', {
        class: `btn block${lv.id === current ? ' primary' : ''}`,
        onClick: () => { markCell(groundId, row, lv.id, note); closeSheet(); toast('Marked'); },
      },
      h('span', { class: `mark tone-${lv.tone || 'unknown'}` }, GLYPH[lv.tone || 'unknown']),
      ` ${lv.label}`))),

    field('What you actually saw', area({
      value: note, placeholder: 'The thing you\'d tell your wife, not the thing you\'d put in a report.',
      onInput: (e) => { note = e.target.value; },
    })),
    h('p', { class: 'tiny muted' }, 'The note saves with whichever answer you pick.'),
  ));
}

function markCell(groundId, row, level, note) {
  store.update((st) => {
    let check = st.checks.filter((k) => k.contextId === groundId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (!check) {
      check = {
        id: uid(), contextId: groundId, date: today(), ratings: {}, barriers: {},
        us: { level: 'na', note: '' }, kid: { level: 'unknown', note: '' },
        formation: { level: 'unknown', note: '' }, home: 'unknown', settle: 'unknown', summary: '',
      };
      st.checks.push(check);
    }
    if (!check.barriers) check.barriers = {};
    if (!check.ratings) check.ratings = {};
    if (row.kind === 'kid') check.kid = { level, note };
    else if (row.kind === 'formation') check.formation = { level, note };
    else if (row.kind === 'us') check.us = { level, note };
    else if (row.kind === 'settle') { check.settle = level; check.settleNote = note; }
    else if (row.kind === 'barrier') check.barriers[row.id] = { state: level, note };
    else check.ratings[row.id] = { level, note };
    check.date = today();
  });
}

/** One option, opened: where its shot landed and every answer behind it. */
export function openShot(groundId, { all = false, replace = false } = {}) {
  const showAll = all;
  openSheet(() => store.get().contexts.find((c) => c.id === groundId)?.name || '', () => {
    const state = store.get();
    const ground = state.contexts.find((c) => c.id === groundId);
    if (!ground) return h('p', { class: 'muted' }, 'Gone.');
    const s = shot(state, ground);
    const check = latestCheck(state.checks, groundId);
    const model = CHURCH_MODELS.find((m) => m.id === ground.modelId);
    const stance = model ? byId(MODEL_STANCES, state.modelStances?.[model.id]?.stance || 'unknown') : null;

    const list = h('div', { class: 'rows' });
    rows(state, { all: showAll }).forEach((row) => {
      const v = cellValue(check, row);
      const lv = byId(row.levels, v) || { tone: 'unknown', label: 'Not answered' };
      const note = cellNote(check, row);
      list.append(h('button', { class: 'card-tap', onClick: () => openCell(groundId, row) },
        h('div', { class: 'row spread' },
          h('span', { class: 'grow' }, row.label),
          h('span', { class: `small tone-${lv.tone || 'unknown'}` },
            `${GLYPH[lv.tone || 'unknown']} ${lv.label}`)),
        note ? h('div', { class: 'tiny muted' }, note) : null));
    });

    return frag(
      h('p', { class: `eyebrow tone-${s.tone}` }, s.word),
      h('p', { class: 'verdict', style: 'margin-top:2px' }, s.why),
      ground.myPart ? h('p', { class: 'small' }, h('strong', {}, 'My part: '), ground.myPart) : null,
      ground.output ? h('p', { class: 'small' }, h('strong', {}, 'What it produces: '), ground.output) : null,
      model ? h('p', { class: 'small muted' },
        `Runs on ${model.name.toLowerCase()}${stance && stance.id !== 'unknown' ? ` — you: ${stance.label.toLowerCase()}` : ''}`) : null,

      h('div', { class: 'row wrap', style: 'margin:14px 0 6px' },
        h('button', { class: `chip${showAll ? ' on' : ''}`, onClick: () => openShot(groundId, { all: !showAll, replace: true }) },
          showAll ? 'Everything' : 'What decides it'),
        h('button', { class: 'chip', onClick: () => { closeSheet(true); openGround(groundId); } }, 'Full detail'),
        h('button', { class: 'chip', onClick: () => editGround(ground) }, 'Edit')),

      list,
    );
  }, { replace });
}

/* ---------- the screen ---------- */

export function render(state) {
  const view = h('div', {});
  const opts = options(state);
  const shots = opts.map((ground) => ({ ground, s: shot(state, ground) }))
    .sort((a, b) => a.s.dist - b.s.dist);

  view.append(h('p', { class: 'eyebrow' }, 'God first, continually'));

  /* ---- the bullseye, in words ---- */
  view.append(h('button', { class: 'card card-tap aim', onClick: editAim },
    h('div', { class: 'eyebrow' }, 'What I\'m going for'),
    state.aim
      ? h('p', { style: 'margin:6px 0 0' }, state.aim)
      : h('p', { class: 'muted', style: 'margin:6px 0 0' },
        'Not written down yet. One sentence — the thing that would make you say yes.'),
    (() => {
      const bits = [];
      if (state.calling?.place) bits.push(`${state.calling.place} is settled`);
      if (state.weighingSince) {
        const y = Math.floor(Math.max(0, daysBetween(state.weighingSince, today())) / 365);
        bits.push(y >= 1 ? `open ${y} year${y > 1 ? 's' : ''}` : 'open under a year');
      }
      return bits.length ? h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, bits.join(' · ')) : null;
    })()));

  if (!opts.length) {
    view.append(empty('Nothing on the target yet.', 'Add the first one',
      () => editGround(null, { kind: 'network' })));
    return view;
  }

  /* ---- the target ---- */
  const wrap = h('div', { class: 'target-wrap' });
  wrap.append(targetSvg(shots));
  view.append(wrap);

  view.append(h('div', { class: 'ring-key' },
    RINGS.map((r) => h('span', { class: `key tone-${r.tone}` }, r.label))));

  /* ---- closest first ---- */
  const list = h('div', { class: 'rows' });
  shots.forEach(({ ground, s }) => {
    list.append(h('button', { class: 'card-tap', onClick: () => openShot(ground.id) },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, ground.name),
        h('span', { class: `small tone-${s.tone}` }, s.word)),
      h('div', { class: 'small muted' }, s.why),
      ground.myPart ? h('div', { class: 'tiny', style: 'margin-top:4px' }, `My part: ${ground.myPart}`) : null));
  });
  view.append(list);

  view.append(h('div', { class: 'row wrap', style: 'margin-top:12px' },
    h('button', { class: 'chip', onClick: () => editGround(null, { kind: 'network' }) }, '+ Another option'),
    h('button', { class: 'chip', onClick: editCalling }, state.calling?.place ? 'The calling' : 'Name the calling')));

  return view;
}
