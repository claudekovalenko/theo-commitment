// Every add/edit form. Each opens in the sheet and writes straight to the store.

import * as store from './store.js';
import { uid, today } from './store.js';
import {
  WEIGHTS, LEVELS, NOTE_KINDS, KINDS, STAGES, PEOPLE_STAGES, US_LEVELS, HORIZONS,
  KID_LEVELS, FORMATION_LEVELS, HOME_LEVELS, byId, survey, verdict,
} from './model.js';
import {
  h, frag, field, input, area, segmented, chipPicker, openSheet, closeSheet,
  confirmSheet, toast,
} from './ui.js';

const opts = (list) => list.map((c) => ({ id: c.id, label: c.title || c.name || c.label }));

function saveBar(onSave, onDelete) {
  return h('div', { class: 'stack', style: 'margin-top:20px' },
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

/* ---------- area of life ---------- */

export function editDomain(existing) {
  const d = existing || { id: uid(), label: '', short: '', blurb: '', color: '#7a5a3c' };
  const draft = { ...d };

  openSheet(existing ? 'Edit area' : 'New area of life', () => frag(
    h('p', { class: 'small muted' }, 'Areas group what the soil has to hold, and each one is measured on its own.'),
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

/* ---------- a requirement: what the soil has to hold ---------- */

export function editRequirement(existing, defaults = {}) {
  const state = store.get();
  const c = existing || {
    id: uid(), domainId: state.domains[0]?.id, title: '', weight: 'conviction',
    summary: '', scriptures: '', practice: '', forming: '', ...defaults,
  };
  const draft = { ...c };

  openSheet(existing ? 'Edit requirement' : 'What does the soil need?', () => frag(
    field('Area of life', segmented(state.domains.map((d) => ({ id: d.id, label: d.short || d.label })), draft.domainId, (v) => { draft.domainId = v; })),
    field('What does the ground need to have?', input({ value: draft.title, placeholder: 'e.g. A church we could belong to for a decade', onInput: (e) => { draft.title = e.target.value; } })),
    field('How much does it matter?', segmented(WEIGHTS, draft.weight, (v) => { draft.weight = v; }),
      'Be honest — this is the weight it carries when you judge a place.'),
    field('In my own words', area({ value: draft.summary, placeholder: 'Say it the way you would say it out loud.', onInput: (e) => { draft.summary = e.target.value; } })),
    field('Scripture', input({ value: draft.scriptures, placeholder: 'Jeremiah 29:5-7', onInput: (e) => { draft.scriptures = e.target.value; } })),
    field('How I\'d know it\'s true of a place', area({ value: draft.practice, placeholder: 'The test you\'d actually apply.', onInput: (e) => { draft.practice = e.target.value; } })),
    field('Where I\'m still working it out', area({ value: draft.forming, placeholder: 'Blank is fine.', onInput: (e) => { draft.forming = e.target.value; } })),
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
    }, existing ? () => confirmDelete('requirement', (s) => {
      s.convictions = s.convictions.filter((x) => x.id !== draft.id);
      s.checks.forEach((k) => delete k.ratings[draft.id]);
    }) : null),
  ));
}

/* ---------- the calling: held, not re-litigated ---------- */

export function editCalling() {
  const state = store.get();
  const held = state.calling || {};
  const draft = { ...held };

  openSheet(held.place ? 'The calling' : 'Where are you called?', () => frag(
    h('p', { class: 'small muted' },
      'A calling is settled, not scored. Write it down once and the app will stop asking where — '
      + 'the open question becomes who you\'d build with there.'),
    field('The city', input({ value: draft.place || '', placeholder: 'e.g. Los Angeles', onInput: (e) => { draft.place = e.target.value; } })),
    field('Why there', area({
      value: draft.why || '', placeholder: 'The reason you\'d give someone who asked. Write it while it\'s clear.',
      onInput: (e) => { draft.why = e.target.value; },
    })),
    field('By when', input({ value: draft.by || '', placeholder: 'A year, a season, "as soon as we can"', onInput: (e) => { draft.by = e.target.value; } })),
    saveBar(() => {
      const name = (draft.place || '').trim();
      if (!name) return toast('Name the city');
      store.update((st) => {
        if (!st.calling) st.calling = { placeId: '', place: '', why: '', by: '' };
        // the calling city becomes a piece of ground, so everything else can hang off it
        let place = st.contexts.find((c) => c.id === st.calling.placeId);
        if (!place) {
          place = st.contexts.find((c) => c.kind === 'place' && c.name.toLowerCase() === name.toLowerCase());
        }
        if (!place) {
          place = {
            id: uid(), name, kind: 'place', stage: 'scouting', horizon: 'life',
            placeId: '', notes: '', createdAt: new Date().toISOString(),
          };
          st.contexts.push(place);
        }
        place.name = name;
        st.calling = { ...draft, place: name, placeId: place.id };
        // anything already being weighed belongs to the calling unless told otherwise
        st.contexts.forEach((c) => { if (c.kind !== 'place' && !c.placeId) c.placeId = place.id; });
      });
      closeSheet();
      toast('Held');
    }, held.place ? () => {
      store.update((st) => { st.calling = { placeId: '', place: '', why: '', by: '' }; });
      closeSheet();
      toast('Calling cleared');
    } : null),
  ));
}

/* ---------- a piece of ground ---------- */

export function editGround(existing, defaults = {}) {
  const state = store.get();
  const g = existing || {
    id: uid(), name: '', kind: state.calling?.placeId ? 'community' : 'place',
    stage: 'scouting', horizon: 'unknown',
    placeId: state.calling?.placeId || '', notes: '', ...defaults,
  };
  const draft = { ...g };
  const places = state.contexts.filter((p) => p.kind === 'place' && p.id !== draft.id);

  const placeField = h('div', {});
  const paintPlace = () => {
    placeField.replaceChildren();
    if (draft.kind === 'place') return;
    placeField.append(field(
      'If we said yes, where would we live?',
      segmented(
        [...places.map((p) => ({ id: p.id, label: p.name })), { id: '', label: 'Don\'t know yet' }],
        draft.placeId || '',
        (v) => { draft.placeId = v; },
      ),
      state.calling?.place
        ? `You're called to ${state.calling.place}. Anything that puts you somewhere else is a different conversation.`
        : (places.length ? 'An offer is only as good as the ground it puts you on.' : 'Add the land first, then link it.'),
    ));
  };
  paintPlace();

  openSheet(existing ? 'Edit' : 'Add ground', () => frag(
    field('Name', input({ value: draft.name, placeholder: 'A town, a church, an offer', onInput: (e) => { draft.name = e.target.value; } })),
    field('What is it?', segmented(KINDS, draft.kind, (v) => { draft.kind = v; paintPlace(); })),
    placeField,
    field('Could we still be here in ten years?', segmented(HORIZONS, draft.horizon, (v) => { draft.horizon = v; })),
    field('Notes', area({ value: draft.notes, placeholder: 'What you know, who you\'ve talked to, what you\'re watching for.', onInput: (e) => { draft.notes = e.target.value; } })),
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
    }, existing ? () => confirmDelete('ground', (s) => {
      s.contexts = s.contexts.filter((x) => x.id !== draft.id);
      s.checks = s.checks.filter((k) => k.contextId !== draft.id);
      s.blocks = s.blocks.filter((b) => b.groundId !== draft.id);
    }) : null),
  ));
}

/* ---------- walking the land: rate a ground against every requirement ---------- */

export function walkTheLand(groundId, existing) {
  const state = store.get();
  const ground = state.contexts.find((c) => c.id === groundId);
  const check = existing
    ? {
      ...existing,
      ratings: JSON.parse(JSON.stringify(existing.ratings || {})),
      us: { ...(existing.us || {}) },
      kid: { ...(existing.kid || {}) },
      formation: { ...(existing.formation || {}) },
    }
    : {
      id: uid(), contextId: groundId, date: today(), ratings: {},
      us: { level: 'na', note: '' }, kid: { level: 'unknown', note: '' },
      formation: { level: 'unknown', note: '' }, home: 'unknown', summary: '',
    };
  if (!check.us) check.us = { level: 'na', note: '' };
  if (!check.kid?.level) check.kid = { level: 'unknown', note: '' };
  if (!check.formation?.level) check.formation = { level: 'unknown', note: '' };
  if (!check.home) check.home = 'unknown';

  let only = null;

  openSheet(`Walking ${ground.name}`, () => {
    const readout = h('div', { class: 'card', style: 'margin-bottom:16px' });
    const paint = () => {
      const s = survey({ ...state, checks: [check] }, ground);
      readout.replaceChildren(
        h('div', { class: 'verdict' }, verdict(s)),
        h('div', { class: 'row spread small muted', style: 'margin-top:8px' },
          h('span', {}, `${Math.round(s.surveyed * 100)}% surveyed`),
          h('span', { class: 'tnum' }, s.rated ? `${Math.round(s.fit * 100)}% fit` : '')),
        s.gate ? h('p', { class: 'tiny tone-thin', style: 'margin:8px 0 0' }, s.gate) : null);
    };

    const rows = h('div', { class: 'stack' });
    const paintRows = () => {
      rows.replaceChildren();
      state.domains.forEach((domain) => {
        if (only && only !== domain.id) return;
        const own = state.convictions.filter((c) => c.domainId === domain.id);
        if (!own.length) return;

        const head = h('div', { class: 'section' }, h('h2', {}, domain.label));
        head.style.borderBottomColor = domain.color;
        rows.append(head);

        own.forEach((c) => {
          const rating = check.ratings[c.id] || (check.ratings[c.id] = { level: 'unknown', note: '' });
          rows.append(h('div', { class: 'card' },
            h('div', { class: 'row spread', style: 'margin-bottom:4px' },
              h('strong', { class: 'grow' }, c.title),
              h('span', { class: 'eyebrow' }, byId(WEIGHTS, c.weight)?.label || '')),
            c.practice ? h('p', { class: 'tiny muted' }, c.practice) : null,
            segmented(LEVELS, rating.level, (v) => { rating.level = v; paint(); }),
            h('input', {
              type: 'text', value: rating.note || '', placeholder: 'What did you actually see?',
              style: 'margin-top:8px', onInput: (e) => { rating.note = e.target.value; },
            })));
        });
      });
    };

    const filter = h('div', { class: 'row wrap', style: 'margin-bottom:14px' });
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

    const gate = h('div', { class: 'card', style: 'margin-bottom:16px' },
      h('div', { class: 'eyebrow' }, 'The test that decides it'),
      h('h3', { style: 'margin:6px 0 2px' }, 'Could I leave my kids with these people, unsupervised?'),
      h('p', { class: 'tiny muted' }, 'Not the leaders. The ordinary households you\'d actually be around.'),
      segmented(KID_LEVELS, check.kid.level, (v) => { check.kid.level = v; paint(); }),
      h('input', {
        type: 'text', value: check.kid.note || '', placeholder: 'Who, specifically — or what gives you pause',
        style: 'margin-top:8px', onInput: (e) => { check.kid.note = e.target.value; },
      }),
      h('h3', { style: 'margin:18px 0 2px' }, 'And he\'d come back formed — which way?'),
      h('p', { class: 'tiny muted' }, 'Safe and soft is still a no. You want him sent, not sheltered.'),
      segmented(FORMATION_LEVELS, check.formation.level, (v) => { check.formation.level = v; paint(); }),
      h('input', {
        type: 'text', value: check.formation.note || '', placeholder: 'What you\'ve actually watched happen to kids here',
        style: 'margin-top:8px', onInput: (e) => { check.formation.note = e.target.value; },
      }),
      h('h3', { style: 'margin:18px 0 6px' }, 'Would we buy a home here?'),
      segmented(HOME_LEVELS, check.home, (v) => { check.home = v; }));

    return frag(
      readout,
      field('Date walked', h('input', { type: 'date', value: check.date, onInput: (e) => { check.date = e.target.value || today(); } })),
      gate,
      filter,
      rows,
      h('div', { class: 'card', style: 'margin-top:18px' },
        h('strong', {}, 'Where the two of us land'),
        h('p', { class: 'small muted' }, 'Never scored. Just asked, every time.'),
        segmented(US_LEVELS, check.us.level, (v) => { check.us.level = v; }),
        h('input', {
          type: 'text', value: check.us.note || '', placeholder: 'What she said, in her words',
          style: 'margin-top:8px', onInput: (e) => { check.us.note = e.target.value; },
        })),
      h('div', { style: 'margin-top:16px' },
        field('What I\'d say about this place today', area({
          value: check.summary, placeholder: 'One honest paragraph.',
          onInput: (e) => { check.summary = e.target.value; },
        }))),
      saveBar(() => {
        store.update((s) => {
          const i = s.checks.findIndex((x) => x.id === check.id);
          if (i < 0) s.checks.push({ ...check, createdAt: new Date().toISOString() });
          else s.checks[i] = check;
        });
        closeSheet();
        toast('Survey saved');
      }, existing ? () => confirmDelete('survey', (s) => { s.checks = s.checks.filter((x) => x.id !== check.id); }) : null),
    );
  });
}

/* ---------- what's in the way ---------- */

export function editBlock(existing, defaults = {}) {
  const state = store.get();
  const b = existing || {
    id: uid(), groundId: '', title: '', wouldSettle: '', who: '', due: '',
    hard: false, status: 'open', ...defaults,
  };
  const draft = { ...b };
  const grounds = state.contexts;

  openSheet(existing ? 'Edit' : 'What\'s in the way?', () => frag(
    field('What\'s unsettled?', input({ value: draft.title, placeholder: 'Say it plainly', onInput: (e) => { draft.title = e.target.value; } })),
    field('What would settle it?', area({
      value: draft.wouldSettle, placeholder: 'The specific thing that would let you say yes or no.',
      onInput: (e) => { draft.wouldSettle = e.target.value; },
    }), 'If you can\'t name this, the block is really a feeling — and that\'s worth writing down too.'),
    field('Who could answer it?', input({ value: draft.who, placeholder: 'A person, not a category', onInput: (e) => { draft.who = e.target.value; } })),
    field('By when', h('input', { type: 'date', value: draft.due, onInput: (e) => { draft.due = e.target.value; } })),
    field('Which ground?', segmented(
      [...grounds.map((g) => ({ id: g.id, label: g.name })), { id: '', label: 'All of them' }],
      draft.groundId || '', (v) => { draft.groundId = v; },
    )),
    field('How heavy is it?', segmented(
      [{ id: 'no', label: 'Would like to know' }, { id: 'yes', label: 'Can\'t decide without it' }],
      draft.hard ? 'yes' : 'no', (v) => { draft.hard = v === 'yes'; },
    )),
    saveBar(() => {
      if (!draft.title.trim()) return toast('Name it first');
      store.update((s) => {
        const i = s.blocks.findIndex((x) => x.id === draft.id);
        draft.seeded = false;
        if (i < 0) s.blocks.push({ ...draft, createdAt: new Date().toISOString() });
        else s.blocks[i] = { ...s.blocks[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing ? () => confirmDelete('block', (s) => { s.blocks = s.blocks.filter((x) => x.id !== draft.id); }) : null),
  ));
}

/** The honest button: you looked at it and still didn't say yes. Why? */
export function captureHesitation(ground) {
  let text = '';
  let makeBlock = true;
  openSheet('Why not yet?', () => frag(
    h('p', { class: 'small muted' },
      `You've looked at ${ground.name} and haven't said yes. Name the actual reason — even if it's "I don't know, it just doesn't feel right."`),
    field('What\'s stopping you?', area({ style: 'min-height:120px', onInput: (e) => { text = e.target.value; } })),
    h('label', { class: 'check', style: 'margin-bottom:16px' },
      h('input', { type: 'checkbox', checked: true, onChange: (e) => { makeBlock = e.target.checked; } }),
      h('span', { class: 'small' }, 'Add it to what\'s in the way, so it has to get settled')),
    h('button', {
      class: 'btn primary block',
      onClick: () => {
        if (!text.trim()) return toast('Write it down first');
        store.update((s) => {
          s.notes.push({
            id: uid(), date: today(), kind: 'hesitation',
            title: `Hesitated on ${ground.name}`, body: text,
            convictionIds: [], contextIds: [ground.id], source: '',
            createdAt: new Date().toISOString(),
          });
          if (makeBlock) {
            s.blocks.push({
              id: uid(), groundId: ground.id, title: text.split('\n')[0].slice(0, 80),
              wouldSettle: '', who: '', due: '', hard: false, status: 'open',
              createdAt: new Date().toISOString(),
            });
          }
        });
        closeSheet();
        toast('Written down');
      },
    }, 'Write it down'),
  ));
}

/** The commitment. This is the thing the app exists to make possible. */
export function breakGround(ground) {
  const state = store.get();
  const s = survey(state, ground);
  let note = '';
  let date = today();

  openSheet(`Build on ${ground.name}?`, () => frag(
    s.gatedBy
      ? h('div', { class: 'card', style: 'margin-bottom:16px' },
        h('strong', { class: 'tone-bad' }, s.gatedBy),
        h('p', { class: 'small muted', style: 'margin:8px 0 0' },
          'This is the one you said decides it. Building here means deciding it doesn\'t.'))
      : null,
    s.inTheWay.length
      ? h('div', { class: 'card', style: 'margin-bottom:16px' },
        h('strong', { class: 'tone-thin' }, `${s.inTheWay.length} thing${s.inTheWay.length > 1 ? 's are' : ' is'} still unsettled`),
        h('div', { class: 'rows', style: 'margin-top:6px' },
          s.inTheWay.slice(0, 5).map((x) => h('div', { class: 'small' }, x.label))),
        h('p', { class: 'small muted', style: 'margin:10px 0 0' },
          'You can still say yes. Saying yes with your eyes open is different from drifting into it.'))
      : h('p', { class: 'verdict', style: 'margin-bottom:16px' }, 'Nothing is unsettled. This is a decision, not a discovery.'),

    field('What are you saying yes to?', area({
      placeholder: 'In one sentence, so you can read it back in five years.',
      onInput: (e) => { note = e.target.value; },
    })),
    field('Date', h('input', { type: 'date', value: date, onInput: (e) => { date = e.target.value || today(); } })),
    h('button', {
      class: 'btn primary block',
      onClick: () => {
        store.update((st) => {
          const g = st.contexts.find((x) => x.id === ground.id);
          g.stage = 'built';
          g.stakedAt = date;
          g.stakeNote = note;
          st.notes.push({
            id: uid(), date, kind: 'observation',
            title: `Broke ground in ${ground.name}`, body: note,
            convictionIds: [], contextIds: [ground.id], source: '',
            createdAt: new Date().toISOString(),
          });
        });
        closeSheet(true);
        toast('Stake in the ground');
      },
    }, 'Break ground here'),
    h('button', {
      class: 'btn ghost block', style: 'margin-top:10px',
      onClick: () => {
        store.update((st) => { st.contexts.find((x) => x.id === ground.id).stage = 'ruled-out'; });
        closeSheet(true);
        toast('Ruled out');
      },
    }, 'Rule it out instead'),
  ));
}

/* ---------- journal ---------- */

export function editNote(existing, defaults = {}) {
  const state = store.get();
  const n = existing || {
    id: uid(), date: today(), title: '', kind: 'observation', body: '', source: '',
    convictionIds: [], contextIds: [], ...defaults,
  };
  const draft = { ...n, convictionIds: [...(n.convictionIds || [])], contextIds: [...(n.contextIds || [])] };

  openSheet(existing ? 'Edit entry' : 'New entry', () => frag(
    field('Date', h('input', { type: 'date', value: draft.date, onInput: (e) => { draft.date = e.target.value || today(); } })),
    field('What kind?', segmented(NOTE_KINDS, draft.kind, (v) => { draft.kind = v; })),
    field('Headline', input({ value: draft.title, placeholder: 'The line you want to remember', onInput: (e) => { draft.title = e.target.value; } })),
    field('The entry', area({ value: draft.body, style: 'min-height:150px', onInput: (e) => { draft.body = e.target.value; } })),
    field('Source', input({ value: draft.source, placeholder: 'Passage, book, who said it', onInput: (e) => { draft.source = e.target.value; } })),
    field('Requirements it touches', chipPicker(opts(state.convictions), draft.convictionIds, (v) => { draft.convictionIds = v; })),
    field('Ground', chipPicker(opts(state.contexts), draft.contextIds, (v) => { draft.contextIds = v; })),
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

/* ---------- people ---------- */

export function editPerson(existing, defaults = {}) {
  const state = store.get();
  const p = existing || {
    id: uid(), name: '', stage: 'conversation', groundId: '', household: false,
    nextStep: '', nextDue: '', lastMet: '', notes: '', ...defaults,
  };
  const draft = { ...p };

  openSheet(existing ? 'Edit person' : 'Someone I\'m walking with', () => frag(
    field('Name', input({ value: draft.name, onInput: (e) => { draft.name = e.target.value; } })),
    field('Where they are', segmented(PEOPLE_STAGES, draft.stage, (v) => { draft.stage = v; })),
    field('Where are they?', segmented(
      [...state.contexts.filter((g) => g.kind === 'place').map((g) => ({ id: g.id, label: g.name })), { id: '', label: 'Nowhere yet' }],
      draft.groundId || '', (v) => { draft.groundId = v; },
    ), 'Spiritual family is countable. This is how a place stops being a feeling.'),
    field('Next step', input({ value: draft.nextStep, onInput: (e) => { draft.nextStep = e.target.value; } })),
    field('By when', h('input', { type: 'date', value: draft.nextDue, onInput: (e) => { draft.nextDue = e.target.value; } })),
    field('Last time we met', h('input', { type: 'date', value: draft.lastMet, onInput: (e) => { draft.lastMet = e.target.value; } })),
    field('Notes', area({ value: draft.notes, onInput: (e) => { draft.notes = e.target.value; } })),
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

export { STAGES };
