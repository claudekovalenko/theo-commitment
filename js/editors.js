// Every add/edit form. Each opens in the sheet and writes straight to the store.

import * as store from './store.js';
import { uid, today } from './store.js';
import {
  WEIGHTS, LEVELS, NOTE_KINDS, KINDS, STAGES, PEOPLE_STAGES, US_LEVELS, HORIZONS,
  KID_LEVELS, FORMATION_LEVELS, HOME_LEVELS, SETTLE_LEVELS, PLACE_MODES, BARRIER_STATES,
  byId, survey, verdict, latestCheck,
} from './model.js';
import { CHURCH_MODELS, MODEL_STANCES } from './models.js';
import { ALIGN, beliefs, theirsOn } from './align.js';
import { SELF_LEVELS, CHRIST_LEVELS } from './returns.js';
import { mergeInto } from './merge.js';
import { LOAD_KINDS, DEPTH, SERVES, HOLD, GIVING, AFTER } from './plate.js';
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

/* ---------- barriers: the lines you don't cross ---------- */

export function editBarrier(existing) {
  const b = existing || { id: uid(), title: '', position: '', detail: '', hard: true };
  const draft = { ...b };

  openSheet(existing ? 'Edit barrier' : 'A line I don\'t cross', () => frag(
    h('p', { class: 'small muted' },
      'Not a preference — a wall. If a community fails one of these, the app stops scoring it and says so.'),
    field('What is it?', input({ value: draft.title, placeholder: 'Baptism, leadership, the role of women…', onInput: (e) => { draft.title = e.target.value; } })),
    field('Where I stand', area({
      value: draft.position, placeholder: 'Your position, in your own words — the one you\'d say out loud to someone who disagreed.',
      onInput: (e) => { draft.position = e.target.value; },
    })),
    field('What I\'m actually watching for', area({
      value: draft.detail, placeholder: 'How you\'d tell whether a place clears it — practice, not just the statement of faith.',
      onInput: (e) => { draft.detail = e.target.value; },
    })),
    field('How hard is this line?', segmented(
      [{ id: 'yes', label: 'A wall — we couldn\'t join' }, { id: 'no', label: 'Heavy, but not a wall' }],
      draft.hard ? 'yes' : 'no', (v) => { draft.hard = v === 'yes'; },
    )),
    saveBar(() => {
      if (!draft.title.trim()) return toast('Name it first');
      store.update((st) => {
        if (!st.barriers) st.barriers = [];
        const i = st.barriers.findIndex((x) => x.id === draft.id);
        draft.seeded = false;
        if (i < 0) st.barriers.push({ ...draft, createdAt: new Date().toISOString() });
        else st.barriers[i] = { ...st.barriers[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing ? () => confirmDelete('barrier', (st) => {
      st.barriers = st.barriers.filter((x) => x.id !== draft.id);
      st.checks.forEach((k) => { if (k.barriers) delete k.barriers[draft.id]; });
    }) : null),
  ));
}

/* ---------- settling something of your own ---------- */

export function settleIt(kind, id) {
  const state = store.get();
  const item = kind === 'barrier'
    ? (state.barriers || []).find((x) => x.id === id)
    : state.convictions.find((x) => x.id === id);
  if (!item) return;

  let landed = kind === 'barrier' ? (item.position || '') : (item.settledStatement || '');
  let date = today();

  openSheet(`Settle: ${item.title}`, () => frag(
    h('p', { class: 'small muted' },
      kind === 'barrier'
        ? 'Write the position you\'d say out loud to someone who disagreed. Once it\'s written, it becomes the line every community gets measured against.'
        : 'You marked this one as still forming. Settling it doesn\'t mean closing your mind — it means writing down where you actually stand today, and dating it.'),

    item.summary ? h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'What you wrote before'), h('p', { class: 'small', style: 'margin:6px 0 0' }, item.summary)) : null,
    item.detail ? h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'What you\'re watching for'), h('p', { class: 'small', style: 'margin:6px 0 0' }, item.detail)) : null,
    item.scriptures ? h('p', { class: 'small', style: 'color:var(--moss)' }, item.scriptures) : null,
    item.forming ? h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'The open edge'), h('p', { class: 'small', style: 'margin:6px 0 0' }, item.forming)) : null,

    field('Where I\'ve landed', area({
      value: landed, style: 'min-height:130px',
      placeholder: 'Plainly, in your own words. Good enough to act on, not good enough to publish.',
      onInput: (e) => { landed = e.target.value; },
    })),
    field('Dated', h('input', { type: 'date', value: date, onInput: (e) => { date = e.target.value || today(); } })),

    h('div', { class: 'stack', style: 'margin-top:18px' },
      h('button', {
        class: 'btn primary block',
        onClick: () => {
          if (!landed.trim()) return toast('Write where you landed first');
          store.update((st) => {
            if (kind === 'barrier') {
              const b = st.barriers.find((x) => x.id === id);
              b.position = landed;
              b.settledAt = date;
            } else {
              const c = st.convictions.find((x) => x.id === id);
              c.settledStatement = landed;
              c.settledAt = date;
              if (c.weight === 'forming') c.weight = 'conviction';
            }
            st.notes.push({
              id: uid(), date, kind: 'observation',
              title: `Settled: ${item.title}`, body: landed,
              convictionIds: kind === 'barrier' ? [] : [id], contextIds: [], source: '',
              createdAt: new Date().toISOString(),
            });
          });
          closeSheet();
          toast('Settled');
        },
      }, 'Settle it'),
      h('button', {
        class: 'btn ghost block',
        onClick: () => { closeSheet(); editBlock(null, { title: `Settle where I stand on ${item.title.toLowerCase()}`, hard: true }); },
      }, 'Not yet — put it in the way')),
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
    field('Since when have I been weighing this?', h('input', {
      type: 'date', value: state.weighingSince || '',
      onInput: (e) => store.update((st) => { st.weighingSince = e.target.value; }),
    }), 'How long it\'s been open is part of the picture.'),
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
    stage: 'scouting', horizon: 'unknown', placeMode: 'unknown', modelId: '',
    output: '', outputModelId: '', myPart: '', myPartModelId: '',
    placeId: state.calling?.placeId || '', notes: '', ...defaults,
  };
  const draft = { ...g };
  const places = state.contexts.filter((p) => p.kind === 'place' && p.id !== draft.id);

  const placeField = h('div', {});
  const paintPlace = () => {
    placeField.replaceChildren();
    if (draft.kind === 'place') return;
    const rootless = byId(KINDS, draft.kind)?.rootless;
    const called = state.calling?.place;

    if (rootless) {
      // A ministry is a relationship, not an address. Ask whether it travels.
      placeField.append(field(
        called ? `Can this run from ${called}?` : 'Does this tie you to a place?',
        segmented(PLACE_MODES, draft.placeMode || 'unknown', (v) => {
          draft.placeMode = v;
          draft.placeId = v === 'in' ? (state.calling?.placeId || draft.placeId) : '';
        }),
        'A ministry you carry with you is a different question from a place that holds you.',
      ));
      return;
    }

    placeField.append(field(
      'If we said yes, where would we live?',
      segmented(
        [...places.map((p) => ({ id: p.id, label: p.name })), { id: '', label: 'Don\'t know yet' }],
        draft.placeId || '',
        (v) => { draft.placeId = v; },
      ),
      called
        ? `You're called to ${called}. Anything that puts you somewhere else is a different conversation.`
        : (places.length ? 'An offer is only as good as the ground it puts you on.' : 'Add the land first, then link it.'),
    ));
  };
  paintPlace();

  // Which model of church is this? Your stance on the model travels with it.
  const modelField = h('div', {});
  const paintModel = () => {
    modelField.replaceChildren();
    if (draft.kind === 'place' || draft.kind === 'role') return;
    const stance = byId(MODEL_STANCES, state.modelStances?.[draft.modelId]?.stance || 'unknown');
    modelField.append(field(
      'What model of church is this?',
      segmented(
        [...CHURCH_MODELS.map((m) => ({ id: m.id, label: m.name })), { id: '', label: 'Not sure' }],
        draft.modelId || '', (v) => { draft.modelId = v; paintModel(); },
      ),
      draft.modelId
        ? `You've marked that model: ${stance.label.toLowerCase()}. Change it in Soil → Models.`
        : 'The shape of the thing, before the name on the sign.',
    ));
  };
  paintModel();

  const stageField = h('div', {});
  const paintStage = () => {
    stageField.replaceChildren();
    stageField.append(field(
      'Where does this stand with you?',
      segmented(STAGES.filter((x) => x.id !== 'built' && x.id !== 'ready'), draft.stage, (v) => { draft.stage = v; }),
      byId(STAGES, draft.stage)?.blurb || '',
    ));
  };
  paintStage();

  openSheet(existing ? 'Edit' : 'Add ground', () => frag(
    field('Name', input({ value: draft.name, placeholder: 'A town, a church, an offer', onInput: (e) => { draft.name = e.target.value; } })),
    field('What is it?', segmented(KINDS, draft.kind, (v) => { draft.kind = v; paintPlace(); paintModel(); paintStage(); })),
    placeField,
    modelField,
    stageField,
    field('Could we still be here in ten years?', segmented(HORIZONS, draft.horizon, (v) => { draft.horizon = v; })),
    field('What does it actually produce here?', area({
      value: draft.output || '', placeholder: 'The measurable artefact. Not the vision statement — what exists because of them.',
      onInput: (e) => { draft.output = e.target.value; },
    }), 'Fruit you could count, in this city.'),
    field('And that fruit is which model?', segmented(
      [...CHURCH_MODELS.map((m) => ({ id: m.id, label: m.name })), { id: '', label: 'Not one of these' }],
      draft.outputModelId || '', (v) => { draft.outputModelId = v; },
    ), 'If what they produce is a model you\'re against, that\'s worth seeing plainly.'),
    field('And what would I actually be doing there?', area({
      value: draft.myPart || '', placeholder: 'Your part, in one line. Not the title — the work.',
      onInput: (e) => { draft.myPart = e.target.value; },
    }), 'What your week would be spent on if you said yes.'),
    field('And my work is which model?', segmented(
      [...CHURCH_MODELS.map((m) => ({ id: m.id, label: m.name })), { id: '', label: 'Not one of these' }],
      draft.myPartModelId || '', (v) => { draft.myPartModelId = v; },
    ), 'Weighing a model is one thing. Building it with your own hands is another.'),
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
  if (!check.settle) check.settle = 'unknown';
  if (!check.barriers) check.barriers = {};

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

    const barriers = (state.barriers || []).length
      ? h('div', { class: 'card', style: 'margin-bottom:16px' },
        h('div', { class: 'eyebrow' }, 'The lines I don\'t cross'),
        h('p', { class: 'tiny muted', style: 'margin:6px 0 12px' },
          'Practice, not the statement of faith. Fail one of these and nothing else counts.'),
        ...state.barriers.map((b) => {
          const cell = check.barriers[b.id] || (check.barriers[b.id] = { state: 'unclear', note: '' });
          return h('div', { style: 'margin-bottom:14px' },
            h('div', { class: 'row spread' },
              h('strong', {}, b.title),
              b.hard ? h('span', { class: 'tiny muted' }, 'a wall') : null),
            b.position ? h('p', { class: 'tiny muted', style: 'margin:2px 0 6px' }, b.position) : null,
            segmented(BARRIER_STATES, cell.state, (v) => { cell.state = v; paint(); }),
            h('input', {
              type: 'text', value: cell.note || '', placeholder: 'What you actually saw or were told',
              style: 'margin-top:8px', onInput: (e) => { cell.note = e.target.value; },
            }));
        }))
      : null;

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
      ground.kind === 'place'
        ? frag(
          h('h3', { style: 'margin:18px 0 6px' }, 'Would we buy a home here?'),
          segmented(HOME_LEVELS, check.home, (v) => { check.home = v; }))
        : frag(
          h('h3', { style: 'margin:18px 0 2px' }, 'Could we settle in with them completely?'),
          h('p', { class: 'tiny muted' }, 'Running with them and settling with them are not the same thing.'),
          segmented(SETTLE_LEVELS, check.settle, (v) => { check.settle = v; })));

    return frag(
      readout,
      field('Date walked', h('input', { type: 'date', value: check.date, onInput: (e) => { check.date = e.target.value || today(); } })),
      barriers,
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
  const isPlace = ground.kind === 'place';
  // A place gets built on. People get committed to. Same weight, different word.
  const word = {
    title: isPlace ? `Build on ${ground.name}?` : `Commit to ${ground.name}?`,
    go: isPlace ? 'Break ground here' : 'Commit to them',
    saying: isPlace ? 'What are you saying yes to?' : 'What are you committing to?',
    done: isPlace ? 'Stake in the ground' : 'Committed',
    log: isPlace ? `Broke ground in ${ground.name}` : `Committed to ${ground.name}`,
    out: isPlace ? 'Rule it out instead' : 'Walk away from them instead',
  };
  let note = '';
  let cost = '';
  let date = today();

  openSheet(word.title, () => frag(
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

    field(word.saying, area({
      placeholder: 'In one sentence, so you can read it back in five years.',
      onInput: (e) => { note = e.target.value; },
    })),
    field('What dies for this to live?', area({
      placeholder: 'Options you\'re closing, freedom you\'re giving up, doors you stop knocking on.',
      onInput: (e) => { cost = e.target.value; },
    }), 'A seed that keeps all its options open stays a seed.'),
    field('Date', h('input', { type: 'date', value: date, onInput: (e) => { date = e.target.value || today(); } })),
    h('button', {
      class: 'btn primary block',
      onClick: () => {
        store.update((st) => {
          const g = st.contexts.find((x) => x.id === ground.id);
          g.stage = 'built';
          g.stakedAt = date;
          g.stakeNote = note;
          g.stakeCost = cost;
          st.notes.push({
            id: uid(), date, kind: 'observation',
            title: word.log,
            body: [note, cost ? `What dies for this: ${cost}` : ''].filter(Boolean).join('\n\n'),
            convictionIds: [], contextIds: [ground.id], source: '',
            createdAt: new Date().toISOString(),
          });
        });
        closeSheet(true);
        toast(word.done);
      },
    }, word.go),
    h('button', {
      class: 'btn ghost block', style: 'margin-top:10px',
      onClick: () => {
        store.update((st) => { st.contexts.find((x) => x.id === ground.id).stage = 'ruled-out'; });
        closeSheet(true);
        toast('Ruled out');
      },
    }, word.out),
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


/* ---------- a goal: something to do that would make me at home here ---------- */

export function editGoal(existing, defaults = {}) {
  const g = existing || {
    id: uid(), groundId: '', title: '', why: '', due: '', done: false, doneAt: '', result: '',
    ...defaults,
  };
  const draft = { ...g };
  const state = store.get();
  const ground = state.contexts.find((c) => c.id === draft.groundId);

  openSheet(existing ? 'Edit step' : `A step toward being at home with ${ground?.name || 'them'}`, () => frag(
    h('p', { class: 'small muted' },
      'Something you do, not something you conclude. If it can\'t be done on a specific '
      + 'week, it isn\'t a step yet.'),
    field('What I\'ll do', input({
      value: draft.title, placeholder: 'e.g. Eat in three of their homes',
      onInput: (e) => { draft.title = e.target.value; },
    })),
    field('Why it moves me closer', area({
      value: draft.why || '', placeholder: 'What this would actually tell you.',
      onInput: (e) => { draft.why = e.target.value; },
    })),
    field('By when', h('input', { type: 'date', value: draft.due || '', onInput: (e) => { draft.due = e.target.value; } }),
      'A date makes it a step. No date makes it a wish.'),
    existing && draft.done
      ? field('What happened', area({
        value: draft.result || '', placeholder: 'What you actually found.',
        onInput: (e) => { draft.result = e.target.value; },
      }))
      : null,
    saveBar(() => {
      if (!draft.title.trim()) return toast('Say what you\'ll do');
      store.update((st) => {
        if (!st.goals) st.goals = [];
        const i = st.goals.findIndex((x) => x.id === draft.id);
        draft.seeded = false;
        if (i < 0) st.goals.push({ ...draft, createdAt: new Date().toISOString() });
        else st.goals[i] = { ...st.goals[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing ? () => confirmDelete('step', (st) => {
      st.goals = st.goals.filter((x) => x.id !== draft.id);
    }) : null),
  ));
}

/** Marking a step done asks the only question that matters: what happened. */
export function completeGoal(id) {
  const state = store.get();
  const goal = (state.goals || []).find((g) => g.id === id);
  if (!goal) return;
  if (goal.done) {
    store.update((st) => {
      const g = st.goals.find((x) => x.id === id);
      g.done = false;
      g.doneAt = '';
    });
    return toast('Back on the list');
  }
  let result = goal.result || '';
  let when = today();
  openSheet('Done — what happened?', () => frag(
    h('h2', { style: 'margin:0 0 4px' }, goal.title),
    goal.why ? h('p', { class: 'small muted' }, goal.why) : null,
    field('What I actually found', area({
      value: result, style: 'min-height:130px',
      placeholder: 'The honest version. This is the part you\'ll want in six months.',
      onInput: (e) => { result = e.target.value; },
    })),
    field('When', h('input', { type: 'date', value: when, onInput: (e) => { when = e.target.value || today(); } })),
    h('div', { class: 'stack', style: 'margin-top:16px' },
      h('button', {
        class: 'btn primary block',
        onClick: () => {
          store.update((st) => {
            const g = st.goals.find((x) => x.id === id);
            g.done = true;
            g.doneAt = when;
            g.result = result;
            st.notes.push({
              id: uid(), date: when, kind: 'visit',
              title: goal.title, body: result,
              convictionIds: [], contextIds: goal.groundId ? [goal.groundId] : [], source: '',
              createdAt: new Date().toISOString(),
            });
          });
          closeSheet();
          toast('Done');
        },
      }, 'Mark it done'),
      h('button', { class: 'btn ghost block', onClick: () => closeSheet() }, 'Not yet')),
  ));
}

/* ---------- my theology beside theirs ---------- */

/**
 * One belief, both sides. Mine on the left in my own words; theirs written down
 * as they'd say it, not as I'd summarise it — and where I heard it from.
 */
export function compareBelief(groundId, itemId) {
  const state = store.get();
  const ground = state.contexts.find((c) => c.id === groundId);
  const item = beliefs(state).find((b) => b.id === itemId);
  if (!item || !ground) return;
  const check = latestCheck(state.checks, groundId);
  const held = theirsOn(check, itemId) || {};

  let position = held.position || '';
  let align = held.align || 'unknown';
  let source = held.source || '';

  openSheet(item.title, () => frag(
    h('p', { class: 'eyebrow' }, item.hard ? 'A line I don\'t cross' : 'Theology & ministry'),

    h('div', { class: 'card' },
      h('div', { class: 'eyebrow' }, 'Where I stand'),
      item.mine
        ? h('p', { style: 'margin:6px 0 0' }, item.mine)
        : h('p', { class: 'tone-thin', style: 'margin:6px 0 0' },
          'You haven\'t written your own position on this yet. Settle it first — you can\'t '
          + 'compare theirs to a blank.'),
      item.forming ? h('p', { class: 'tiny tone-thin', style: 'margin:6px 0 0' }, 'Still forming') : null,
      item.scriptures ? h('p', { class: 'tiny', style: 'margin:6px 0 0; color:var(--moss)' }, item.scriptures) : null),

    field(`Where ${ground.name} stands`, area({
      value: position, style: 'min-height:130px',
      placeholder: 'In their words, as near as you can get them — not your summary of them. '
        + 'If you can\'t write it, you haven\'t asked properly yet.',
      onInput: (e) => { position = e.target.value; },
    })),
    field('How I know', input({
      value: source, placeholder: 'Who said it, or where you saw it practised.',
      onInput: (e) => { source = e.target.value; },
    })),
    field('So where does that leave us?', segmented(ALIGN, align, (v) => { align = v; }),
      item.watching ? `What you said you'd watch for: ${item.watching}` : null),

    h('div', { class: 'stack', style: 'margin-top:18px' },
      h('button', {
        class: 'btn primary block',
        onClick: () => {
          store.update((st) => {
            let k = st.checks.filter((x) => x.contextId === groundId)
              .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
            if (!k) {
              k = {
                id: uid(), contextId: groundId, date: today(), ratings: {}, barriers: {}, theirs: {},
                us: { level: 'na', note: '' }, kid: { level: 'unknown', note: '' },
                formation: { level: 'unknown', note: '' }, home: 'unknown', settle: 'unknown', summary: '',
              };
              st.checks.push(k);
            }
            if (!k.theirs) k.theirs = {};
            k.theirs[itemId] = { position, align, source, at: today() };
          });
          closeSheet();
          toast('Saved');
        },
      }, 'Save'),
      align === 'unknown'
        ? h('button', {
          class: 'btn ghost block',
          onClick: () => {
            closeSheet();
            editGoal(null, {
              groundId,
              title: `Ask ${ground.name} where they stand on ${item.title.toLowerCase()}`,
              why: item.watching || 'You hold this. You don\'t know what they hold.',
            });
          },
        }, 'Make it a step — go and ask them')
        : null),
  ));
}

/* ---------- who I was when I came back ---------- */

export function logReturn(groundId, existing) {
  const state = store.get();
  const ground = state.contexts.find((c) => c.id === groundId);
  if (!ground) return;
  const r = existing || {
    id: uid(), groundId, date: today(), self: '', christ: '', heldBack: '', performed: '', what: '',
  };
  const draft = { ...r };

  openSheet(`Back from ${ground.name}`, () => frag(
    h('p', { class: 'small muted' },
      'You ask this about your son every time — whether he\'d come back sharper or softer. '
      + 'This is the same question about you, and you\'re the only one who can answer it.'),

    field('What was it?', input({
      value: draft.what || '', placeholder: 'A weekend, a month with them, a gathering.',
      onInput: (e) => { draft.what = e.target.value; },
    })),
    field('When', h('input', { type: 'date', value: draft.date, onInput: (e) => { draft.date = e.target.value || today(); } })),

    field('Was I myself?', segmented(SELF_LEVELS, draft.self, (v) => { draft.self = v; }),
      'Not whether you enjoyed it. Whether the man who came back was the one who went.'),
    field('And which direction was I formed?', segmented(CHRIST_LEVELS, draft.christ, (v) => { draft.christ = v; }),
      'The same test you set for your son.'),

    field('What did I hold back?', area({
      value: draft.heldBack, placeholder: 'The conviction you didn\'t say. The question you swallowed. Name it — '
        + 'it\'s usually the same one each time.',
      onInput: (e) => { draft.heldBack = e.target.value; },
    })),
    field('What did I have to perform?', area({
      value: draft.performed, placeholder: 'The part of it you were acting rather than meaning.',
      onInput: (e) => { draft.performed = e.target.value; },
    })),

    saveBar(() => {
      if (!draft.self) return toast('Say whether you were yourself');
      store.update((st) => {
        if (!st.returns) st.returns = [];
        const i = st.returns.findIndex((x) => x.id === draft.id);
        if (i < 0) st.returns.push({ ...draft, createdAt: new Date().toISOString() });
        else st.returns[i] = { ...st.returns[i], ...draft };
        if (i < 0) {
          st.notes.push({
            id: uid(), date: draft.date, kind: 'observation',
            title: `Back from ${ground.name}${draft.what ? ` — ${draft.what}` : ''}`,
            body: [
              byId(SELF_LEVELS, draft.self)?.label,
              draft.christ ? byId(CHRIST_LEVELS, draft.christ)?.label : '',
              draft.heldBack ? `Held back: ${draft.heldBack}` : '',
              draft.performed ? `Performed: ${draft.performed}` : '',
            ].filter(Boolean).join('\n'),
            convictionIds: [], contextIds: [groundId], source: '',
            createdAt: new Date().toISOString(),
          });
        }
      });
      closeSheet();
      toast('Written down');
    }, existing ? () => confirmDelete('entry', (st) => {
      st.returns = st.returns.filter((x) => x.id !== draft.id);
    }) : null),
  ));
}

/* ---------- two names, one thing ---------- */

export function mergeGround(fromId) {
  const state = store.get();
  const from = state.contexts.find((c) => c.id === fromId);
  if (!from) return;
  const others = state.contexts.filter((c) => c.id !== fromId && c.kind !== 'place');

  openSheet(`${from.name} is the same as…`, () => frag(
    h('p', { class: 'small muted' },
      'Two names for one body. Everything written about this one moves across — surveys, '
      + 'steps, times back from them, notes. Nothing is thrown away, and the other name is '
      + 'kept on the survivor so it still reads as yours.'),
    others.length
      ? h('div', { class: 'rows' }, others.map((o) => h('button', {
        class: 'card-tap',
        onClick: async () => {
          const ok = await confirmSheet({
            title: `Fold ${from.name} into ${o.name}?`,
            message: `Everything about ${from.name} moves to ${o.name}, and ${from.name} comes off the target.`,
            confirmLabel: `Yes — they're the same`,
          });
          if (!ok) return;
          store.update((st) => { mergeInto(st, fromId, o.id); });
          closeSheet(true);
          toast(`Folded into ${o.name}`);
        },
      },
      h('strong', {}, o.name),
      o.myPart ? h('div', { class: 'tiny muted' }, o.myPart) : null)))
      : h('p', { class: 'muted small' }, 'Nothing else on the target to fold it into.'),
  ));
}

/* ---------- what I'm already carrying ---------- */

export function editCommitment(existing, defaults = {}) {
  const c = existing || {
    id: uid(), name: '', kind: 'ministry', depth: '', hours: '', started: '', ends: '',
    where: '', groundId: '', why: '', wellDone: '', serves: 'unsure', hold: 'unsure',
    giving: 'unsure', after: 'unsure', ended: false, ...defaults,
  };
  const draft = { ...c };

  openSheet(existing ? draft.name || 'This commitment' : 'Something I\'m already in', () => frag(
    field('What is it?', input({
      value: draft.name, placeholder: 'e.g. The leadership cohort',
      onInput: (e) => { draft.name = e.target.value; },
    })),
    field('What kind?', segmented(LOAD_KINDS, draft.kind, (v) => { draft.kind = v; })),
    field('How far in am I?', segmented(DEPTH, draft.depth, (v) => { draft.depth = v; }),
      'Involvement is a gradient. Being thin is usually about how many things you\'re near the middle of.'),
    field('Hours a week, honestly', input({
      type: 'number', min: '0', step: '0.5', value: draft.hours,
      placeholder: 'Including the prep and the drive',
      onInput: (e) => { draft.hours = e.target.value; },
    })),
    field('Where', input({
      value: draft.where || '', placeholder: 'e.g. Hawaii, Big Island, online',
      onInput: (e) => { draft.where = e.target.value; },
    }), 'Worth seeing next to the city you said you\'re called to.'),
    (() => {
      const ministries = store.get().contexts.filter((x) => x.kind !== 'place');
      if (!ministries.length) return null;
      return field('Is this with one of the ministries I\'m weighing?', segmented(
        [...ministries.map((m) => ({ id: m.id, label: m.name })), { id: '', label: 'No' }],
        draft.groundId || '', (v) => { draft.groundId = v; },
      ), 'If it is, being deep in it is already a kind of answer.');
    })(),
    field('Since', h('input', { type: 'date', value: draft.started || '', onInput: (e) => { draft.started = e.target.value; } })),
    field('Until', h('input', { type: 'date', value: draft.ends || '', onInput: (e) => { draft.ends = e.target.value; } }),
      'Blank means open-ended — worth noticing how many of these have no end.'),
    field('Does it feed what I\'m going for?', segmented(SERVES, draft.serves, (v) => { draft.serves = v; })),
    field('How am I holding it?', segmented(HOLD, draft.hold, (v) => { draft.hold = v; }),
      'Most of these you don\'t drop. The question is how you carry them.'),
    field('What is it actually getting from me?', segmented(GIVING, draft.giving, (v) => { draft.giving = v; }),
      'Stewarding something isn\'t carrying it — it\'s giving it what it needs.'),
    field('And when it ends?', segmented(AFTER, draft.after, (v) => { draft.after = v; })),
    field('What doing this one well looks like', area({
      value: draft.wellDone || '', placeholder: 'Concretely. The version of this you\'d be glad you gave it.',
      onInput: (e) => { draft.wellDone = e.target.value; },
    })),
    field('Why I\'m in it', area({
      value: draft.why, placeholder: 'The reason you said yes. Still true?',
      onInput: (e) => { draft.why = e.target.value; },
    })),
    existing
      ? h('button', {
        class: 'btn ghost block', style: 'margin-top:12px',
        onClick: () => {
          store.update((st) => {
            const g = st.commitments.find((x) => x.id === draft.id);
            g.ended = !g.ended;
            g.endedAt = g.ended ? today() : '';
          });
          closeSheet();
          toast(draft.ended ? 'Back on the plate' : 'Off the plate');
        },
      }, draft.ended ? 'Put it back on the plate' : 'I\'ve finished with this')
      : null,
    saveBar(() => {
      if (!draft.name.trim()) return toast('Name it first');
      store.update((st) => {
        if (!st.commitments) st.commitments = [];
        const i = st.commitments.findIndex((x) => x.id === draft.id);
        draft.seeded = false;
        if (i < 0) st.commitments.push({ ...draft, createdAt: new Date().toISOString() });
        else st.commitments[i] = { ...st.commitments[i], ...draft };
      });
      closeSheet();
      toast('Saved');
    }, existing ? () => confirmDelete('commitment', (st) => {
      st.commitments = st.commitments.filter((x) => x.id !== draft.id);
    }) : null),
  ));
}

export function editCapacity() {
  const state = store.get();
  let hours = state.settings?.capacityHours || '';
  openSheet('How many hours do I actually have?', () => frag(
    h('p', { class: 'small muted' },
      'Not the hours in a week — the hours left for the things you say yes to, after work, '
      + 'sleep, your wife and your kids. Your number, not a standard one.'),
    field('Hours a week', input({
      type: 'number', min: '0', step: '1', value: hours, placeholder: 'e.g. 15',
      onInput: (e) => { hours = e.target.value; },
    })),
    h('button', {
      class: 'btn primary block', style: 'margin-top:16px',
      onClick: () => {
        store.update((st) => { st.settings.capacityHours = Number(hours) || 0; });
        closeSheet();
        toast('Saved');
      },
    }, 'Save'),
  ));
}
