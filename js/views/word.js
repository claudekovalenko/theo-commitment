// The Word tab: a library to study from, and an instrument to run on a decision.

import * as store from './../store.js';
import { today, uid } from './../store.js';
import { THREADS, DISCERN_ITEMS, DISCERN_STATES } from './../scripture.js';
import { byId } from './../model.js';
import {
  h, frag, empty, section, openSheet, closeSheet, field, input, area,
  segmented, relDate, fmtDate, toast,
} from './../ui.js';
import { editBlock, editNote } from './../editors.js';

const view = { tab: 'library', threadId: null };

const studyFor = (state, ref) => state.verses.find((v) => v.ref === ref);

/* ---------- studying one passage ---------- */

export function studyVerse(ref, note = '') {
  const state = store.get();
  const existing = studyFor(state, ref);
  const draft = existing
    ? { ...existing }
    : { id: uid(), ref, date: today(), says: '', asks: '', doing: '', text: '' };

  openSheet(ref, () => frag(
    note ? h('p', { class: 'small muted' }, note) : null,
    h('p', { class: 'tiny muted' }, 'Open your Bible to it. What follows is yours to write, and it\'s the part worth keeping.'),

    field('The text, in the translation you read', area({
      value: draft.text, style: 'min-height:110px',
      placeholder: 'Copy it out by hand if you can. It slows you down enough to see it.',
      onInput: (e) => { draft.text = e.target.value; },
    })),
    field('What it says', area({
      value: draft.says, placeholder: 'Plainly — what is actually being claimed or commanded?',
      onInput: (e) => { draft.says = e.target.value; },
    })),
    field('What it asks of me', area({
      value: draft.asks, placeholder: 'Applied to this decision, to this house, to this year.',
      onInput: (e) => { draft.asks = e.target.value; },
    })),
    field('What I\'d do differently', area({
      value: draft.doing, placeholder: 'One concrete thing. Vague obedience is disobedience with better manners.',
      onInput: (e) => { draft.doing = e.target.value; },
    })),

    h('div', { class: 'stack', style: 'margin-top:20px' },
      h('button', {
        class: 'btn primary block',
        onClick: () => {
          store.update((s) => {
            const i = s.verses.findIndex((v) => v.id === draft.id);
            draft.date = today();
            if (i < 0) s.verses.push({ ...draft, createdAt: new Date().toISOString() });
            else s.verses[i] = { ...s.verses[i], ...draft };
          });
          closeSheet();
          toast('Study saved');
        },
      }, 'Save the study'),
      h('button', {
        class: 'btn block',
        onClick: () => {
          closeSheet();
          editBlock(null, { title: `Settle what ${ref} means for this`, wouldSettle: draft.asks || '' });
        },
      }, 'Put it in the way'),
      existing ? h('button', {
        class: 'btn ghost danger block',
        onClick: () => {
          store.update((s) => { s.verses = s.verses.filter((v) => v.id !== draft.id); });
          closeSheet();
          toast('Deleted');
        },
      }, 'Delete this study') : null),
  ));
}

/* ---------- running the instrument on a decision ---------- */

export function runDiscernment(groundId, existing) {
  const state = store.get();
  const ground = state.contexts.find((c) => c.id === groundId);
  const run = existing
    ? { ...existing, items: JSON.parse(JSON.stringify(existing.items || {})) }
    : { id: uid(), groundId, date: today(), items: {}, summary: '' };

  openSheet(`Discernment — ${ground?.name || 'a decision'}`, () => {
    const tally = h('p', { class: 'small muted' });
    const paint = () => {
      const counts = DISCERN_ITEMS.reduce((acc, it) => {
        const st = run.items[it.id]?.state || 'unasked';
        acc[st] = (acc[st] || 0) + 1;
        return acc;
      }, {});
      const unasked = counts.unasked || 0;
      tally.textContent = unasked
        ? `${DISCERN_ITEMS.length - unasked} of ${DISCERN_ITEMS.length} asked. The unasked ones are the work.`
        : `All ${DISCERN_ITEMS.length} asked${counts.against ? ` — and ${counts.against} came back against.` : '.'}`;
    };

    const rows = DISCERN_ITEMS.map((it) => {
      const cell = run.items[it.id] || (run.items[it.id] = { state: 'unasked', note: '' });
      return h('div', { class: 'card' },
        h('div', { class: 'row spread' },
          h('strong', {}, it.label),
          h('span', { class: 'tiny muted' }, it.ref)),
        h('p', { class: 'small muted', style: 'margin:4px 0 8px' }, it.ask),
        segmented(DISCERN_STATES, cell.state, (v) => { cell.state = v; paint(); }),
        h('input', {
          type: 'text', value: cell.note || '', placeholder: 'What you actually found',
          style: 'margin-top:8px', onInput: (e) => { cell.note = e.target.value; },
        }));
    });

    paint();
    return frag(
      tally,
      field('Date', h('input', { type: 'date', value: run.date, onInput: (e) => { run.date = e.target.value || today(); } })),
      h('div', { class: 'stack' }, rows),
      h('div', { style: 'margin-top:16px' },
        field('Where this leaves me', area({
          value: run.summary, placeholder: 'One paragraph, written to your future self.',
          onInput: (e) => { run.summary = e.target.value; },
        }))),
      h('div', { class: 'stack', style: 'margin-top:16px' },
        h('button', {
          class: 'btn primary block',
          onClick: () => {
            store.update((s) => {
              const i = s.discernments.findIndex((d) => d.id === run.id);
              if (i < 0) s.discernments.push({ ...run, createdAt: new Date().toISOString() });
              else s.discernments[i] = run;
            });
            closeSheet();
            toast('Saved');
          },
        }, 'Save this run'),
        existing ? h('button', {
          class: 'btn ghost danger block',
          onClick: () => {
            store.update((s) => { s.discernments = s.discernments.filter((d) => d.id !== run.id); });
            closeSheet();
            toast('Deleted');
          },
        }, 'Delete') : null),
    );
  });
}

/* ---------- library ---------- */

function library(state, root) {
  const thread = THREADS.find((t) => t.id === view.threadId);

  if (!thread) {
    root.append(h('p', { class: 'muted small' },
      'Ten threads for the question you\'re actually asking. References and a note on why each belongs — you bring the text and the work.'));
    const rows = h('div', { class: 'rows' });
    THREADS.forEach((t) => {
      const studied = t.verses.filter((v) => studyFor(state, v.ref)).length;
      rows.append(h('button', { class: 'card-tap', onClick: () => { view.threadId = t.id; go(); } },
        h('div', { class: 'row spread' },
          h('strong', {}, t.title),
          h('span', { class: 'tiny muted tnum' }, `${studied}/${t.verses.length}`)),
        h('div', { class: 'tiny muted' }, t.blurb)));
    });
    root.append(rows);
    return;
  }

  root.append(h('button', { class: 'icon-btn', onClick: () => { view.threadId = null; go(); } }, '← All threads'));
  root.append(h('h1', { style: 'margin-top:12px' }, thread.title));
  root.append(h('p', { class: 'muted small' }, thread.blurb));

  const rows = h('div', { class: 'rows' });
  thread.verses.forEach((v) => {
    const study = studyFor(state, v.ref);
    rows.append(h('button', { class: 'card-tap', onClick: () => studyVerse(v.ref, v.note) },
      h('div', { class: 'row spread' },
        h('strong', {}, v.ref),
        h('span', { class: `tiny ${study ? 'tone-good' : 'muted'}` }, study ? `studied ${relDate(study.date, today()).toLowerCase()}` : 'not studied')),
      h('div', { class: 'tiny muted' }, v.note),
      study?.doing ? h('div', { class: 'small', style: 'margin-top:6px' }, `→ ${study.doing}`) : null));
  });
  root.append(rows);
}

/* ---------- studies ---------- */

function studies(state, root) {
  if (!state.verses.length) {
    root.append(empty('Nothing studied yet. Pick a thread and start with one passage.', 'Open the library', () => { view.tab = 'library'; go(); }));
    return;
  }
  root.append(h('p', { class: 'muted small' }, 'Everything you\'ve worked through, newest first.'));
  const rows = h('div', { class: 'rows' });
  [...state.verses].sort((a, b) => (a.date < b.date ? 1 : -1)).forEach((v) => {
    rows.append(h('button', { class: 'card-tap', onClick: () => studyVerse(v.ref) },
      h('div', { class: 'row spread' },
        h('strong', {}, v.ref),
        h('span', { class: 'tiny muted' }, relDate(v.date, today()))),
      v.says ? h('div', { class: 'tiny muted truncate' }, v.says) : null,
      v.doing ? h('div', { class: 'small', style: 'margin-top:4px' }, `→ ${v.doing}`) : null));
  });
  root.append(rows);
}

/* ---------- discernment runs ---------- */

function discernment(state, root) {
  root.append(h('p', { class: 'muted small' },
    'Ten questions with a scripture behind each one. Run it on a decision, date it, and run it again when something changes.'));

  const grounds = state.contexts;
  if (!grounds.length) {
    root.append(empty('Add something to weigh first.', null));
    return;
  }

  root.append(section('Run it on'));
  const pick = h('div', { class: 'rows' });
  grounds.forEach((g) => {
    const runs = state.discernments.filter((d) => d.groundId === g.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    pick.append(h('button', { class: 'card-tap', onClick: () => runDiscernment(g.id, runs[0]) },
      h('div', { class: 'row spread' },
        h('strong', {}, g.name),
        h('span', { class: 'tiny muted' }, runs.length ? `last run ${relDate(runs[0].date, today()).toLowerCase()}` : 'never run')),
      runs[0]?.summary ? h('div', { class: 'tiny muted truncate' }, runs[0].summary) : null));
  });
  root.append(pick);

  const all = [...state.discernments].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (all.length) {
    root.append(section('Every run'));
    const rows = h('div', { class: 'rows' });
    all.forEach((d) => {
      const g = grounds.find((x) => x.id === d.groundId);
      const asked = DISCERN_ITEMS.filter((it) => (d.items[it.id]?.state || 'unasked') !== 'unasked').length;
      const against = DISCERN_ITEMS.filter((it) => d.items[it.id]?.state === 'against').length;
      rows.append(h('button', { class: 'card-tap', onClick: () => runDiscernment(d.groundId, d) },
        h('div', { class: 'row spread' },
          h('strong', {}, `${g?.name || 'Gone'} · ${fmtDate(d.date)}`),
          h('span', { class: `tiny ${against ? 'tone-bad' : 'muted'}` },
            `${asked}/${DISCERN_ITEMS.length} asked${against ? `, ${against} against` : ''}`)),
        d.summary ? h('div', { class: 'tiny muted truncate' }, d.summary) : null));
    });
    root.append(rows);
  }
}

let rerender = () => {};
const go = () => rerender();

export function render(state) {
  const root = h('div', {});
  rerender = () => {
    const parent = root.parentNode;
    if (!parent) return;
    parent.replaceChild(render(store.get()), root);
  };

  const tabs = h('div', { class: 'row wrap', style: 'margin-bottom:16px' });
  [['library', 'Threads'], ['studies', 'My studies'], ['discern', 'Discernment']].forEach(([id, label]) => {
    tabs.append(h('button', {
      class: `chip${view.tab === id ? ' on' : ''}`,
      onClick: () => { view.tab = id; go(); },
    }, label));
  });
  root.append(tabs);

  if (view.tab === 'library') library(state, root);
  else if (view.tab === 'studies') studies(state, root);
  else discernment(state, root);

  root.append(h('button', {
    class: 'btn block', style: 'margin-top:22px',
    onClick: () => editNote(null, { kind: 'scripture' }),
  }, 'Write a journal entry from this'));

  return root;
}

export const title = 'The Word';
