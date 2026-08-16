// The board. One question, one screen: which ministry could I be planted with?
//
// Every option is a column. Everything that matters to me is a row. Tap a cell
// and mark it. Nothing here is a survey to complete — it's a thing to look at
// until the answer is obvious.

import * as store from './../store.js';
import { uid, today } from './../store.js';
import {
  LEVELS, KID_LEVELS, FORMATION_LEVELS, BARRIER_STATES, SETTLE_LEVELS, US_LEVELS,
  WEIGHTS, KINDS, byId, latestCheck, weightOf,
} from './../model.js';
import { h, frag, empty, openSheet, closeSheet, field, area, toast, daysBetween } from './../ui.js';
import { editGround, editCalling, editRequirement } from './../editors.js';
import { CHURCH_MODELS, MODEL_STANCES } from './../models.js';
import { openGround } from './land.js';

export const title = 'Where could I be planted?';

const GLYPH = { good: '✓', ok: '~', thin: '!', bad: '✕', unknown: '·' };

let showAll = false;

/* ---------- what's on the board ---------- */

/**
 * The options. Ministries, churches and communities — the things you could
 * actually be planted with. A city isn't one of them; the calling settled that.
 */
function options(state) {
  return state.contexts
    .filter((c) => c.kind !== 'place')
    .sort((a, b) => {
      const rank = (x) => (x.stage === 'built' ? 3 : x.stage === 'ruled-out' ? -1 : x.stage === 'running' ? 2 : 1);
      return rank(b) - rank(a);
    });
}

/** The rows: the two that decide it, the walls, then what I'm for. */
function rows(state) {
  const out = [
    { group: 'The two that decide it' },
    { id: 'kid', label: 'I\'d leave my kids with them, unsupervised', kind: 'kid', levels: KID_LEVELS },
    { id: 'formation', label: 'He\'d come back sharper, not softer', kind: 'formation', levels: FORMATION_LEVELS },
  ];

  if ((state.barriers || []).length) {
    out.push({ group: 'The lines I don\'t cross' });
    (state.barriers || []).forEach((b) => out.push({
      id: b.id, label: b.title, kind: 'barrier', levels: BARRIER_STATES, hard: b.hard,
    }));
  }

  const reqs = state.convictions.filter((c) => (showAll ? true : c.weight === 'core'));
  if (reqs.length) {
    out.push({ group: showAll ? 'Everything I said matters' : 'What I won\'t build without' });
    reqs.forEach((c) => out.push({
      id: c.id, label: c.title, kind: 'req', levels: LEVELS, req: c,
    }));
  }

  out.push({ group: 'Us, and staying' });
  out.push({ id: 'us', label: 'My wife and I are agreed', kind: 'us', levels: US_LEVELS });
  out.push({ id: 'settle', label: 'We could settle in with them completely', kind: 'settle', levels: SETTLE_LEVELS });
  return out;
}

/* ---------- reading a cell ---------- */

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

/** Marks a cell, making the option's record if this is the first mark on it. */
function mark(groundId, row, level, note) {
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

/* ---------- the read at the bottom of each column ---------- */

/**
 * One word per option, in the order that actually decides it: a wall you fail
 * beats everything, then the kid test, then how much you simply don't know.
 */
function read(state, ground) {
  const check = latestCheck(state.checks, ground.id);
  if (ground.stage === 'built') return { word: 'Planted', tone: 'good', why: 'You committed to them.' };
  if (ground.stage === 'ruled-out') return { word: 'Out', tone: 'bad', why: 'You ruled them out.' };
  if (!check) return { word: 'Blank', tone: 'unknown', why: 'Nothing marked yet.' };

  const rowList = rows(state).filter((r) => !r.group);
  const walls = (state.barriers || []).filter((b) => b.hard
    && check.barriers?.[b.id]?.state === 'fails');
  if (walls.length) {
    return { word: 'No', tone: 'bad', why: `Fails ${walls.map((b) => b.title.toLowerCase()).join(' and ')}. That's a wall.` };
  }

  const kid = check.kid?.level || 'unknown';
  if (kid === 'no' || kid === 'supervised') {
    return { word: 'No', tone: 'bad', why: 'You wouldn\'t leave your kids with them.' };
  }
  if (check.formation?.level === 'softer') {
    return { word: 'No', tone: 'bad', why: 'He\'d come back softer.' };
  }

  const unknown = rowList.filter((r) => {
    const v = cellValue(check, r);
    return v === 'unknown' || v === 'unclear' || v === 'na';
  });
  const bad = rowList.filter((r) => ['conflict', 'fails', 'no', 'apart', 'softer'].includes(cellValue(check, r)));

  if (bad.length) return { word: 'Not this', tone: 'bad', why: `${bad.length} hard no${bad.length > 1 ? 's' : ''}: ${bad.map((r) => r.label.toLowerCase()).slice(0, 2).join(', ')}.` };
  if (unknown.length > rowList.length / 2) {
    return { word: 'Too early', tone: 'unknown', why: `${unknown.length} of ${rowList.length} you can't answer yet.` };
  }
  if (unknown.length) return { word: 'Maybe', tone: 'thin', why: `${unknown.length} still unknown. Nothing failing.` };
  return { word: 'Yes', tone: 'good', why: 'Nothing in the way. This is a decision now.' };
}

/* ---------- marking a cell ---------- */

function openCell(ground, row) {
  const state = store.get();
  const check = latestCheck(state.checks, ground.id);
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
        onClick: () => { mark(ground.id, row, lv.id, note); closeSheet(); toast('Marked'); },
      },
      h('span', { class: `mark tone-${lv.tone || 'unknown'}` }, GLYPH[lv.tone || 'unknown']),
      ` ${lv.label}`))),

    field('What you actually saw', area({
      value: note, placeholder: 'The thing you\'d tell your wife, not the thing you\'d put in a report.',
      onInput: (e) => { note = e.target.value; },
    })),
    h('p', { class: 'tiny muted' }, 'The note is saved with whichever answer you pick.'),
  ));
}

/* ---------- the board ---------- */

function boardTable(state, opts) {
  const table = h('table', { class: 'board' });

  const head = h('tr', {}, h('th', { class: 'rowhead' }, ''));
  opts.forEach((g) => {
    const r = read(state, g);
    head.append(h('th', {},
      h('button', { class: 'colhead', onClick: () => openGround(g.id) },
        h('span', { class: 'name' }, g.name),
        h('span', { class: `verdict-chip tone-${r.tone}` }, r.word))));
  });
  table.append(h('thead', {}, head));

  const body = h('tbody', {});
  rows(state).forEach((row) => {
    if (row.group) {
      body.append(h('tr', { class: 'group' },
        h('th', { colspan: opts.length + 1, scope: 'colgroup' }, row.group)));
      return;
    }
    const tr = h('tr', {}, h('th', { class: 'rowhead', scope: 'row' }, row.label));
    opts.forEach((g) => {
      const check = latestCheck(state.checks, g.id);
      const v = cellValue(check, row);
      const lv = byId(row.levels, v) || { tone: 'unknown', label: 'Don\'t know' };
      const note = cellNote(check, row);
      tr.append(h('td', {},
        h('button', {
          class: `cell tone-${lv.tone || 'unknown'}${note ? ' noted' : ''}`,
          title: `${g.name} — ${row.label}: ${lv.label}${note ? ` (${note})` : ''}`,
          'aria-label': `${row.label}, ${g.name}: ${lv.label}. Tap to change.`,
          onClick: () => openCell(g, row),
        }, GLYPH[lv.tone || 'unknown'])));
    });
    body.append(tr);
  });
  table.append(body);
  return h('div', { class: 'scroll-x board-wrap' }, table);
}

export function render(state) {
  const view = h('div', {});
  const opts = options(state);

  view.append(h('p', { class: 'eyebrow' }, 'God first, continually'));
  view.append(h('h1', { style: 'margin:2px 0 6px' },
    state.calling?.place ? `Who could I be planted with in ${state.calling.place}?` : 'Who could I be planted with?'));

  const bits = [];
  if (state.calling?.place) bits.push(`${state.calling.place} is settled`);
  if (state.weighingSince) {
    const y = Math.floor(Math.max(0, daysBetween(state.weighingSince, today())) / 365);
    bits.push(y >= 1 ? `open ${y} year${y > 1 ? 's' : ''}` : 'open under a year');
  }
  view.append(h('p', { class: 'muted small' },
    bits.length ? `${bits.join(' · ')}. The only question left is who.` : 'Name the ministries you\'re actually weighing.'));

  if (!opts.length) {
    view.append(empty('No ministries on the board yet.', 'Add the first one',
      () => editGround(null, { kind: 'network' })));
    return view;
  }

  view.append(boardTable(state, opts));

  view.append(h('div', { class: 'row wrap', style: 'margin:12px 0 4px' },
    h('button', { class: `chip${showAll ? ' on' : ''}`, onClick: () => { showAll = !showAll; store.notify(); } },
      showAll ? 'Showing everything' : 'Must-haves only'),
    h('button', { class: 'chip', onClick: () => editGround(null, { kind: 'network' }) }, '+ Another option'),
    h('button', { class: 'chip', onClick: editCalling }, state.calling?.place ? 'The calling' : 'Name the calling')));

  /* ---- the read, spelled out ---- */
  view.append(h('h2', { class: 'plain-head' }, 'Where each one stands'));
  const readRows = h('div', { class: 'rows' });
  opts.forEach((g) => {
    const r = read(state, g);
    const model = CHURCH_MODELS.find((m) => m.id === g.modelId);
    const stance = model ? byId(MODEL_STANCES, state.modelStances?.[model.id]?.stance || 'unknown') : null;
    readRows.append(h('button', { class: 'card-tap', onClick: () => openGround(g.id) },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, g.name),
        h('span', { class: `small tone-${r.tone}` }, r.word)),
      h('div', { class: 'small muted' }, r.why),
      g.myPart ? h('div', { class: 'tiny', style: 'margin-top:4px' }, `My part: ${g.myPart}`) : null,
      model
        ? h('div', { class: 'tiny muted' }, `Runs on ${model.name.toLowerCase()}${stance && stance.id !== 'unknown' ? ` · you: ${stance.label.toLowerCase()}` : ''}`)
        : null));
  });
  view.append(readRows);

  return view;
}
