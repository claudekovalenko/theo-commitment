// Add/edit forms. Each opens in the bottom sheet and writes straight to the store.

import * as store from './store.js';
import { uid, today } from './store.js';
import {
  WEIGHTS, LEVELS, NOTE_KINDS, CONTEXT_KINDS, CONTEXT_STATUS, PEOPLE_STAGES,
  US_LEVELS, HORIZONS, byId, scoreCheck, readingWord,
} from './model.js';
import {
  h, frag, field, input, area, segmented, chipPicker, openSheet, closeSheet,
  confirmSheet, toast,
} from './ui.js';

const opts = (list) => list.map((c) => ({ id: c.id, label: c.title || c.name || c.label }));

function saveBar(onSave, onDelete) {
  return h('div', { class: 'stack', style: 'margin-top:18px' },
    h('button', { class: 'btn primary block', onClick: onSave }, 'Save'),
    onDelete ? h('button', { class: 'btn ghost danger block', onClick: onDelete }, 'Delete') : null);
}

async function confirmDelete(what, run) {
  const ok = await confirmSheet({
    title: `Delete ${what}?`, message: 'This can\'t be undone from inside the app.',
    confirmLabel: 'Delete', danger: true,
  });
  if (!ok) return;
  store.update(run);
  closeSheet(true);
  toast('Deleted');
}

/* ---------- domain ---------- */

export function editDomain(existing) {
  const d = existing || { id: uid(), label: '', short: '', blurb: '', color: '#8ea2c8' };
  const draft = { ...d };

  openSheet(existing ? 'Edit area' : 'New area of life', () => frag(
    h('p', { class: 'small muted' },
      'Areas are the big buckets the compass reads separately — walking with God, marriage, family, roots, ministry.'),
    field('Name', input({ value: draft.label, onInput: (e) => { draft.label = e.target.value; } })),
    field('Short name', input({ value: draft.short || '', placeholder: 'For tight spaces', onInput: (e) => { draft.short = e.target.value; } })),
    field('What it covers', area({ value: draft.blurb || '', onInput: (e) => { draft.blurb = e.target.value; } })),
    field('Colour', h('input', { type: 'color', value: draft.color, onInput: (e) => { draft.color = e.target.value; } })),
    saveBar(() => {
      if (!draft.label.trim()) return toast('Give it a name first');
      store.update((s) => {
        const i = s.domains.findIndex((x) => x.id === draft.id);
        if (i < 0) s.domains.push(draft); else s.domains[i] = { ...s.domains[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing && store.get().domains.length > 1 ? () => confirmDelete('area', (s) => {
      const home = s.domains.find((x) => x.id !== draft.id);
      s.convictions.forEach((c) => { if (c.domainId === draft.id) c.domainId = home.id; });
      s.domains = s.domains.filter((x) => x.id !== draft.id);
    }) : null),
  ));
}

/* ---------- conviction ---------- */

export function editConviction(existing, defaults = {}) {
  const state = store.get();
  const c = existing || {
    id: uid(), domainId: state.domains[0]?.id, title: '', weight: 'conviction',
    summary: '', scriptures: '', practice: '', forming: '', ...defaults,
  };
  const draft = { ...c };

  openSheet(existing ? 'Edit conviction' : 'New conviction', () => frag(
    field('Which area of life?', segmented(state.domains.map((d) => ({ id: d.id, label: d.short || d.label })), draft.domainId, (v) => { draft.domainId = v; })),
    field('What is it?', input({ value: draft.title, placeholder: 'e.g. Somewhere long enough to be known', onInput: (e) => { draft.title = e.target.value; } })),
    field('How firmly do I hold it?', segmented(WEIGHTS, draft.weight, (v) => { draft.weight = v; }),
      'Be honest here — this is the weight the compass gives it.'),
    field('In my own words', area({ value: draft.summary, placeholder: 'Say it the way you would say it out loud.', onInput: (e) => { draft.summary = e.target.value; } })),
    field('Scripture', input({ value: draft.scriptures, placeholder: 'Jeremiah 29:5-7; Proverbs 27:10', onInput: (e) => { draft.scriptures = e.target.value; } })),
    field('What it looks like when it\'s true of me', area({ value: draft.practice, placeholder: 'The test you\'d actually apply to yourself.', onInput: (e) => { draft.practice = e.target.value; } })),
    field('Where I\'m still working it out', area({ value: draft.forming, placeholder: 'The honest edge of it. Blank is fine.', onInput: (e) => { draft.forming = e.target.value; } })),
    saveBar(() => {
      if (!draft.title.trim()) return toast('Give it a name first');
      store.update((s) => {
        const i = s.convictions.findIndex((x) => x.id === draft.id);
        draft.seeded = false;
        if (i < 0) s.convictions.push({ ...draft, createdAt: new Date().toISOString() });
        else s.convictions[i] = { ...s.convictions[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing ? () => confirmDelete('conviction', (s) => {
      s.convictions = s.convictions.filter((x) => x.id !== draft.id);
      s.checks.forEach((k) => delete k.ratings[draft.id]);
    }) : null),
  ));
}

/* ---------- context (a place, church, network, role) ---------- */

export function editContext(existing, defaults = {}) {
  const c = existing || {
    id: uid(), name: '', kind: 'place', status: 'considering', horizon: 'unknown', notes: '', ...defaults,
  };
  const draft = { ...c };

  openSheet(existing ? 'Edit' : 'What are you weighing?', () => frag(
    field('Name', input({ value: draft.name, placeholder: 'A town, a church, a network', onInput: (e) => { draft.name = e.target.value; } })),
    field('What kind?', segmented(CONTEXT_KINDS, draft.kind, (v) => { draft.kind = v; })),
    field('Where I stand with it', segmented(CONTEXT_STATUS, draft.status, (v) => { draft.status = v; })),
    field('Could we still be here in ten years?', segmented(HORIZONS, draft.horizon, (v) => { draft.horizon = v; }),
      'The roots question. Guessing is allowed — you can change it every time you learn something.'),
    field('Notes', area({ value: draft.notes, placeholder: 'What I know, who I\'ve talked to, what I\'m watching for.', onInput: (e) => { draft.notes = e.target.value; } })),
    saveBar(() => {
      if (!draft.name.trim()) return toast('Give it a name first');
      store.update((s) => {
        const i = s.contexts.findIndex((x) => x.id === draft.id);
        draft.seeded = false;
        if (i < 0) s.contexts.push({ ...draft, createdAt: new Date().toISOString() });
        else s.contexts[i] = { ...s.contexts[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing ? () => confirmDelete('context', (s) => {
      s.contexts = s.contexts.filter((x) => x.id !== draft.id);
      s.checks = s.checks.filter((k) => k.contextId !== draft.id);
    }) : null),
  ));
}

/* ---------- alignment check ---------- */

export function runCheck(contextId, existing) {
  const state = store.get();
  const ctx = state.contexts.find((c) => c.id === contextId);
  const check = existing
    ? { ...existing, ratings: JSON.parse(JSON.stringify(existing.ratings || {})), us: { ...(existing.us || {}) } }
    : { id: uid(), contextId, date: today(), ratings: {}, us: { level: 'na', note: '' }, summary: '' };
  if (!check.us) check.us = { level: 'na', note: '' };

  let only = null; // domain filter, so a 16-row check can be done in pieces

  openSheet(`${ctx.name} — check`, () => {
    const readout = h('div', { class: 'card', style: 'margin-bottom:14px' });
    const paint = () => {
      const r = scoreCheck(check, state.convictions, state.domains);
      readout.replaceChildren(
        h('div', { class: 'row spread' },
          h('strong', {}, r.rated ? readingWord(r.pct) : 'Not rated yet'),
          h('span', { class: 'muted small tnum' }, r.rated ? `${r.degrees}° off` : `${state.convictions.length} to go`)),
        h('div', { class: 'meter', style: 'margin-top:8px' }, h('i', { style: `width:${Math.round((r.pct || 0) * 100)}%` })),
        r.dealbreakers.length
          ? h('p', { class: 'small lv-conflict', style: 'margin:10px 0 0' },
            `${r.dealbreakers.length} non-negotiable${r.dealbreakers.length > 1 ? 's' : ''} in the red.`)
          : null,
      );
    };

    const rows = h('div', { class: 'stack' });
    const paintRows = () => {
      rows.replaceChildren();
      state.domains.forEach((domain) => {
        if (only && only !== domain.id) return;
        const own = state.convictions.filter((c) => c.domainId === domain.id);
        if (!own.length) return;

        const head = h('div', { class: 'section-head' }, h('h2', {}, domain.label));
        head.style.borderLeft = `3px solid ${domain.color}`;
        head.style.paddingLeft = '10px';
        rows.append(head);

        own.forEach((c) => {
          const rating = check.ratings[c.id] || (check.ratings[c.id] = { level: 'unknown', note: '' });
          rows.append(h('div', { class: 'card' },
            h('div', { class: 'row spread', style: 'margin-bottom:8px' },
              h('strong', { class: 'grow' }, c.title),
              h('span', { class: 'pill muted' }, byId(WEIGHTS, c.weight)?.label || '')),
            segmented(LEVELS, rating.level, (v) => { rating.level = v; paint(); }),
            h('input', {
              type: 'text', value: rating.note || '', placeholder: 'What did I actually see? (optional)',
              style: 'margin-top:8px', onInput: (e) => { rating.note = e.target.value; },
            })));
        });
      });
    };

    const filter = h('div', { class: 'row wrap', style: 'margin-bottom:12px' });
    const paintFilter = () => {
      filter.replaceChildren();
      filter.append(h('button', { class: `chip${only ? '' : ' on'}`, onClick: () => { only = null; paintFilter(); paintRows(); } }, 'All'));
      state.domains.forEach((d) => filter.append(h('button', {
        class: `chip${only === d.id ? ' on' : ''}`,
        onClick: () => { only = d.id; paintFilter(); paintRows(); },
      }, d.short || d.label)));
    };

    paint();
    paintFilter();
    paintRows();

    return frag(
      readout,
      field('Date', h('input', { type: 'date', value: check.date, onInput: (e) => { check.date = e.target.value || today(); } })),
      filter,
      rows,
      h('div', { class: 'card', style: 'margin-top:16px' },
        h('strong', {}, 'Where the two of us land'),
        h('p', { class: 'small muted' }, 'Not scored. Just asked, every single time.'),
        segmented(US_LEVELS, check.us.level, (v) => { check.us.level = v; }),
        h('input', {
          type: 'text', value: check.us.note || '', placeholder: 'What she said, in her words',
          style: 'margin-top:8px', onInput: (e) => { check.us.note = e.target.value; },
        })),
      h('div', { style: 'margin-top:14px' },
        field('Where I land today', area({
          value: check.summary, placeholder: 'One honest paragraph. What would I say if someone asked me right now?',
          onInput: (e) => { check.summary = e.target.value; },
        }))),
      saveBar(() => {
        store.update((s) => {
          const i = s.checks.findIndex((x) => x.id === check.id);
          if (i < 0) s.checks.push({ ...check, createdAt: new Date().toISOString() });
          else s.checks[i] = check;
        });
        closeSheet();
        toast('Check saved');
      }, existing ? () => confirmDelete('check', (s) => { s.checks = s.checks.filter((x) => x.id !== check.id); }) : null),
    );
  });
}

/* ---------- log entry ---------- */

export function editNote(existing, defaults = {}) {
  const state = store.get();
  const n = existing || {
    id: uid(), date: today(), title: '', kind: 'observation', body: '', source: '',
    convictionIds: [], contextIds: [], ...defaults,
  };
  const draft = { ...n, convictionIds: [...(n.convictionIds || [])], contextIds: [...(n.contextIds || [])] };

  openSheet(existing ? 'Edit entry' : 'New log entry', () => frag(
    field('Date', h('input', { type: 'date', value: draft.date, onInput: (e) => { draft.date = e.target.value || today(); } })),
    field('What kind?', segmented(NOTE_KINDS, draft.kind, (v) => { draft.kind = v; })),
    field('Headline', input({ value: draft.title, placeholder: 'The one line I want to remember', onInput: (e) => { draft.title = e.target.value; } })),
    field('The learning', area({ value: draft.body, style: 'min-height:150px', placeholder: 'What happened, what it taught me, what it changes.', onInput: (e) => { draft.body = e.target.value; } })),
    field('Source', input({ value: draft.source, placeholder: 'Passage, book, who said it', onInput: (e) => { draft.source = e.target.value; } })),
    field('Convictions this touches', chipPicker(opts(state.convictions), draft.convictionIds, (v) => { draft.convictionIds = v; })),
    field('Contexts', chipPicker(opts(state.contexts), draft.contextIds, (v) => { draft.contextIds = v; })),
    saveBar(() => {
      if (!draft.title.trim() && !draft.body.trim()) return toast('Write something first');
      store.update((s) => {
        const i = s.notes.findIndex((x) => x.id === draft.id);
        draft.seeded = false;
        if (i < 0) s.notes.push({ ...draft, createdAt: new Date().toISOString() });
        else s.notes[i] = { ...s.notes[i], ...draft };
      });
      closeSheet();
      toast('Logged');
    }, existing ? () => confirmDelete('entry', (s) => { s.notes = s.notes.filter((x) => x.id !== draft.id); }) : null),
  ));
}

/* ---------- follow-through ---------- */

export function editAction(existing, defaults = {}) {
  const state = store.get();
  const a = existing || {
    id: uid(), title: '', detail: '', due: '', done: false,
    convictionIds: [], contextIds: [], ...defaults,
  };
  const draft = { ...a, convictionIds: [...(a.convictionIds || [])], contextIds: [...(a.contextIds || [])] };

  openSheet(existing ? 'Edit follow-up' : 'New follow-up', () => frag(
    field('What am I going to do?', input({ value: draft.title, placeholder: 'Small enough to actually finish', onInput: (e) => { draft.title = e.target.value; } })),
    field('Detail', area({ value: draft.detail, onInput: (e) => { draft.detail = e.target.value; } })),
    field('By when', h('input', { type: 'date', value: draft.due, onInput: (e) => { draft.due = e.target.value; } })),
    field('Convictions', chipPicker(opts(state.convictions), draft.convictionIds, (v) => { draft.convictionIds = v; })),
    field('Contexts', chipPicker(opts(state.contexts), draft.contextIds, (v) => { draft.contextIds = v; })),
    saveBar(() => {
      if (!draft.title.trim()) return toast('Name it first');
      store.update((s) => {
        const i = s.actions.findIndex((x) => x.id === draft.id);
        draft.seeded = false;
        if (i < 0) s.actions.push({ ...draft, createdAt: new Date().toISOString() });
        else s.actions[i] = { ...s.actions[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing ? () => confirmDelete('follow-up', (s) => { s.actions = s.actions.filter((x) => x.id !== draft.id); }) : null),
  ));
}

/* ---------- people ---------- */

export function editPerson(existing) {
  const p = existing || { id: uid(), name: '', stage: 'conversation', nextStep: '', nextDue: '', lastMet: '', notes: '' };
  const draft = { ...p };

  openSheet(existing ? 'Edit person' : 'Someone I\'m walking with', () => frag(
    field('Name', input({ value: draft.name, onInput: (e) => { draft.name = e.target.value; } })),
    field('Where they are', segmented(PEOPLE_STAGES, draft.stage, (v) => { draft.stage = v; })),
    field('Next step', input({ value: draft.nextStep, placeholder: 'The next real thing', onInput: (e) => { draft.nextStep = e.target.value; } })),
    field('By when', h('input', { type: 'date', value: draft.nextDue, onInput: (e) => { draft.nextDue = e.target.value; } })),
    field('Last time we met', h('input', { type: 'date', value: draft.lastMet, onInput: (e) => { draft.lastMet = e.target.value; } })),
    field('Notes', area({ value: draft.notes, placeholder: 'What we\'re working through. Pray-fors.', onInput: (e) => { draft.notes = e.target.value; } })),
    saveBar(() => {
      if (!draft.name.trim()) return toast('Name first');
      store.update((s) => {
        const i = s.people.findIndex((x) => x.id === draft.id);
        if (i < 0) s.people.push({ ...draft, createdAt: new Date().toISOString() });
        else s.people[i] = { ...s.people[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing ? () => confirmDelete('person', (s) => { s.people = s.people.filter((x) => x.id !== draft.id); }) : null),
  ));
}
