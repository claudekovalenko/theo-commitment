// What the soil has to hold: every requirement, by area of life.

import { WEIGHTS, byId, levelOf, latestCheck } from './../model.js';
import { h, frag, empty, section, openSheet, closeSheet, relDate } from './../ui.js';
import { today } from './../store.js';
import * as store from './../store.js';
import { editRequirement, editDomain, editNote, editBarrier, settleIt } from './../editors.js';
import { CHURCH_MODELS, MODEL_STANCES } from './../models.js';
import { segmented, area, field, toast } from './../ui.js';
import { go } from './../router.js';

const tab = { at: 'requirements' };

/** Jump straight to one of the soil tabs from elsewhere in the app. */
export function showSoilTab(id) {
  tab.at = id;
  go('soil');
}

function barriers(state, view) {
  view.append(h('h1', {}, 'The lines I don\'t cross'),
    h('p', { class: 'muted small' },
      'Not preferences — walls. A community that fails one of these stops being scored: the app says so and stops asking you to weigh it.'));

  const list = state.barriers || [];
  if (!list.length) {
    view.append(empty('None named yet.', 'Add a barrier', () => editBarrier()));
    return;
  }

  const rows = h('div', { class: 'rows' });
  list.forEach((b) => {
    const failing = state.contexts.filter((c) => {
      const check = latestCheck(state.checks, c.id);
      return check?.barriers?.[b.id]?.state === 'fails';
    });
    rows.append(h('button', { class: 'card-tap', onClick: () => editBarrier(b) },
      h('div', { class: 'row spread' },
        h('strong', {}, b.title),
        h('span', { class: `tiny ${b.hard ? 'tone-bad' : 'muted'}` }, b.hard ? 'a wall' : 'heavy')),
      b.position
        ? h('div', { class: 'small muted' }, b.position)
        : h('div', { class: 'tiny tone-thin' }, 'You haven\'t written where you stand yet'),
      failing.length ? h('div', { class: 'tiny tone-bad', style: 'margin-top:4px' }, `Fails here: ${failing.map((c) => c.name).join(', ')}`) : null));
  });
  view.append(rows);
  view.append(h('button', { class: 'btn block', style: 'margin-top:18px', onClick: () => editBarrier() }, 'Add a barrier'));
}

/**
 * Settling. Four years of weighing is partly four years of convictions left at
 * "still forming" — so they get their own list, one at a time, dated when they
 * land. Nothing here is closing your mind; it's writing down where you stand
 * today so you can stop re-arguing it with yourself.
 */
function settling(state, view) {
  const unsettledReqs = state.convictions.filter((c) => !c.settledStatement && (c.weight === 'forming' || c.forming));
  const unsettledBarriers = (state.barriers || []).filter((b) => !b.position);
  const settledReqs = state.convictions.filter((c) => c.settledStatement)
    .sort((a, b) => ((a.settledAt || '') < (b.settledAt || '') ? 1 : -1));
  const settledBarriers = (state.barriers || []).filter((b) => b.position && b.settledAt);
  const open = unsettledReqs.length + unsettledBarriers.length;
  const done = settledReqs.length + settledBarriers.length;

  view.append(h('h1', {}, 'Settling'),
    h('p', { class: 'muted small' },
      'You don\'t need more options. You need fewer open questions in yourself. '
      + 'Each one below is something you\'ve left at "still working it out" — settle it in a sentence, and date it.'));

  view.append(h('p', { class: 'verdict' },
    open === 0 && done === 0
      ? 'Nothing marked as forming. Mark what you\'re genuinely still working out and it comes here.'
      : open === 0
        ? `All ${done} settled. That's what settled looks like — written down and dated.`
        : `${done} settled, ${open} still open in you.`));

  if (open) {
    view.append(section('Still open in me'));
    const rows = h('div', { class: 'rows' });
    unsettledBarriers.forEach((b) => rows.append(h('button', { class: 'card-tap', onClick: () => settleIt('barrier', b.id) },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, b.title),
        h('span', { class: 'tiny tone-bad' }, b.hard ? 'a wall' : 'heavy')),
      h('div', { class: 'tiny tone-thin' }, 'A line you don\'t cross, with no position written on it'))));
    unsettledReqs.forEach((c) => rows.append(h('button', { class: 'card-tap', onClick: () => settleIt('requirement', c.id) },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, c.title),
        h('span', { class: 'eyebrow' }, byId(WEIGHTS, c.weight)?.label || '')),
      c.forming
        ? h('div', { class: 'small muted' }, c.forming)
        : h('div', { class: 'tiny tone-thin' }, 'Marked still forming'))));
    view.append(rows);
  }

  if (done) {
    view.append(section('Settled'));
    const rows = h('div', { class: 'rows' });
    settledBarriers.forEach((b) => rows.append(h('button', { class: 'card-tap', onClick: () => settleIt('barrier', b.id) },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, b.title),
        h('span', { class: 'tiny muted' }, relDate(b.settledAt, today()))),
      h('div', { class: 'small muted' }, b.position))));
    settledReqs.forEach((c) => rows.append(h('button', { class: 'card-tap', onClick: () => settleIt('requirement', c.id) },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, c.title),
        h('span', { class: 'tiny muted' }, c.settledAt ? relDate(c.settledAt, today()) : '')),
      h('div', { class: 'small muted' }, c.settledStatement))));
    view.append(rows);
  }
}

/** One model, opened up: what it is, what it costs, and where you stand. */
export function openModel(id) {
  const build = () => {
    const state = store.get();
    const m = CHURCH_MODELS.find((x) => x.id === id);
    const held = state.modelStances?.[id] || { stance: 'unknown', note: '' };
    const draft = { ...held };
    const running = state.contexts.filter((c) => c.modelId === id);

    const list = (label, items) => h('div', { class: 'card' },
      h('div', { class: 'eyebrow' }, label),
      h('ul', { style: 'margin:8px 0 0; padding-left:18px' }, items.map((x) => h('li', { class: 'small' }, x))));

    return frag(
      h('p', { class: 'muted' }, m.blurb),
      list('What it looks like', m.marks),
      list('What it tends to do well', m.strengths),
      list('What it tends to cost', m.costs),
      h('div', { class: 'card' },
        h('div', { class: 'eyebrow' }, 'The question it puts to you'),
        h('p', { class: 'verdict', style: 'margin:6px 0 0' }, m.asks)),

      h('div', { style: 'margin-top:18px' },
        field('Where do I stand with this model?',
          segmented(MODEL_STANCES, draft.stance, (v) => { draft.stance = v; }))),
      field('Why', area({
        value: draft.note, placeholder: 'What draws you to it, and what you\'d have to make peace with.',
        onInput: (e) => { draft.note = e.target.value; },
      })),

      running.length
        ? h('p', { class: 'small muted' }, `You're weighing ${running.map((c) => c.name).join(', ')} on this model.`)
        : null,

      h('button', {
        class: 'btn primary block', style: 'margin-top:12px',
        onClick: () => {
          store.update((st) => {
            if (!st.modelStances) st.modelStances = {};
            st.modelStances[id] = draft;
          });
          closeSheet();
          toast('Saved');
        },
      }, 'Save where I stand'),
    );
  };
  openSheet(() => CHURCH_MODELS.find((x) => x.id === id).name, build);
}

function models(state, view) {
  view.append(h('h1', {}, 'What model could I work in?'),
    h('p', { class: 'muted small' },
      'The shape of the thing, before the name on the sign. Mark where you stand and it travels with every community you weigh that runs on it.'));

  const stanceOf = (id) => byId(MODEL_STANCES, state.modelStances?.[id]?.stance || 'unknown');
  const order = ['home', 'workable', 'unknown', 'friction', 'no'];
  const sorted = [...CHURCH_MODELS].sort((a, b) => order.indexOf(stanceOf(a.id).id) - order.indexOf(stanceOf(b.id).id));

  const decided = CHURCH_MODELS.filter((m) => stanceOf(m.id).id !== 'unknown').length;
  view.append(h('p', { class: 'tiny muted' }, `${decided} of ${CHURCH_MODELS.length} marked.`));

  const rows = h('div', { class: 'rows' });
  sorted.forEach((m) => {
    const st = stanceOf(m.id);
    const note = state.modelStances?.[m.id]?.note;
    const on = state.contexts.filter((c) => c.modelId === m.id);
    rows.append(h('button', { class: 'card-tap', onClick: () => openModel(m.id) },
      h('div', { class: 'row spread' },
        h('strong', {}, m.name),
        h('span', { class: `small tone-${st.tone}` }, st.label)),
      h('div', { class: 'tiny muted' }, m.blurb),
      note ? h('div', { class: 'tiny muted', style: 'margin-top:4px' }, note) : null,
      on.length ? h('div', { class: 'tiny', style: 'margin-top:4px' }, `→ ${on.map((c) => c.name).join(', ')}`) : null));
  });
  view.append(rows);
}

export function openRequirement(id) {
  const build = () => {
    const state = store.get();
    const c = state.convictions.find((x) => x.id === id);
    if (!c) return h('p', { class: 'muted' }, 'Gone.');
    const domain = state.domains.find((d) => d.id === c.domainId);

    const across = state.contexts.map((g) => {
      const check = latestCheck(state.checks, g.id);
      const rating = check?.ratings?.[id];
      return rating && rating.level !== 'unknown' ? { g, level: levelOf(rating.level), note: rating.note } : null;
    }).filter(Boolean);

    const notes = state.notes.filter((n) => (n.convictionIds || []).includes(id))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const chip = h('span', { class: 'chip' }, domain?.label || '');
    if (domain) chip.style.color = domain.color;

    return frag(
      h('div', { class: 'row wrap', style: 'margin-bottom:12px' },
        chip,
        h('span', { class: 'chip on' }, byId(WEIGHTS, c.weight)?.label || ''),
        h('button', { class: 'chip', onClick: () => editRequirement(c) }, 'Edit'),
        h('button', { class: 'chip', onClick: () => editNote(null, { convictionIds: [id] }) }, 'Write about it'),
        h('button', { class: 'chip', onClick: () => settleIt('requirement', id) }, c.settledStatement ? 'Restate where I stand' : 'Settle it')),

      c.settledStatement
        ? h('div', { class: 'card' },
          h('div', { class: 'eyebrow' }, `Where I landed${c.settledAt ? ` · ${relDate(c.settledAt, today())}` : ''}`),
          h('div', {}, c.settledStatement))
        : null,
      c.summary ? h('p', {}, c.summary) : null,
      c.scriptures ? h('p', { class: 'small', style: 'color:var(--moss)' }, c.scriptures) : null,
      c.practice ? h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'How I\'d know'), h('div', {}, c.practice)) : null,
      c.forming ? h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'Still working out'), h('div', {}, c.forming)) : null,

      across.length ? frag(
        section('Where it holds'),
        h('div', { class: 'rows' }, across.map((a) => h('div', {},
          h('div', { class: 'row spread' },
            h('strong', {}, a.g.name),
            h('span', { class: `small tone-${a.level.score === null ? 'unknown' : a.level.score >= 0.7 ? 'good' : a.level.score > 0 ? 'thin' : 'bad'}` }, a.level.label)),
          a.note ? h('div', { class: 'tiny muted' }, a.note) : null))),
      ) : null,

      notes.length ? frag(
        section('Journal'),
        h('div', { class: 'rows' }, notes.slice(0, 8).map((n) => h('div', {},
          h('div', { class: 'tiny muted' }, relDate(n.date, today())),
          h('div', { class: 'small' }, n.title || n.body.slice(0, 80))))),
      ) : null,
    );
  };
  openSheet(() => store.get().convictions.find((x) => x.id === id)?.title || 'Requirement', build);
}

const ORDER = WEIGHTS.map((w) => w.id);

export function render(state) {
  const view = h('div', {});

  const tabs = h('div', { class: 'row wrap', style: 'margin-bottom:16px' });
  [['requirements', 'Requirements'], ['settling', 'Settling'], ['barriers', 'Barriers'], ['models', 'Church models']].forEach(([id, label]) => {
    tabs.append(h('button', {
      class: `chip${tab.at === id ? ' on' : ''}`,
      onClick: () => { tab.at = id; go('soil'); },
    }, label));
  });
  view.append(tabs);

  if (tab.at === 'models') {
    models(state, view);
    return view;
  }
  if (tab.at === 'barriers') {
    barriers(state, view);
    return view;
  }
  if (tab.at === 'settling') {
    settling(state, view);
    return view;
  }

  view.append(h('h1', {}, 'What the soil needs'),
    h('p', { class: 'muted small' }, 'The things that have to be true of a place before you\'d build on it. Weight them honestly — this is what every survey is scored against.'));

  if (!state.convictions.length) {
    view.append(empty('Nothing yet. Start with the one thing you wouldn\'t build without.', 'Add a requirement', () => editRequirement()));
    return view;
  }

  state.domains.forEach((domain) => {
    const group = state.convictions.filter((c) => c.domainId === domain.id)
      .sort((a, b) => ORDER.indexOf(a.weight) - ORDER.indexOf(b.weight));

    const head = h('div', { class: 'section' },
      h('h2', {}, domain.label),
      h('button', { class: 'icon-btn', onClick: () => editRequirement(null, { domainId: domain.id }) }, 'Add'));
    head.style.borderBottomColor = domain.color;
    view.append(head);
    if (domain.blurb) view.append(h('p', { class: 'tiny muted' }, domain.blurb));

    if (!group.length) {
      view.append(h('p', { class: 'small muted' }, 'Nothing here yet.'));
      return;
    }
    const rows = h('div', { class: 'rows' });
    group.forEach((c) => rows.append(h('button', { class: 'card-tap', onClick: () => openRequirement(c.id) },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, c.title),
        h('span', { class: 'eyebrow' }, byId(WEIGHTS, c.weight)?.label || '')),
      c.summary ? h('div', { class: 'small muted' }, c.summary) : null,
      c.settledStatement
        ? h('div', { class: 'tiny tone-good', style: 'margin-top:4px' }, `settled${c.settledAt ? ` ${relDate(c.settledAt, today()).toLowerCase()}` : ''}`)
        : c.forming ? h('div', { class: 'tiny muted', style: 'margin-top:4px' }, 'still working this one out') : null)));
    view.append(rows);
  });

  view.append(h('div', { class: 'stack', style: 'margin-top:24px' },
    h('button', { class: 'btn block', onClick: () => editRequirement() }, 'Add a requirement'),
    h('button', { class: 'btn ghost block', onClick: () => editDomain() }, 'Add an area of life')));
  return view;
}

export const title = 'The soil';
