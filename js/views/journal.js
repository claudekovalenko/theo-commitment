// What you're learning, and who you're walking with.

import * as store from './../store.js';
import { today } from './../store.js';
import { NOTE_KINDS, PEOPLE_STAGES, byId } from './../model.js';
import { h, frag, empty, section, openSheet, closeSheet, relDate, fmtDate, fmtMonth, toast, daysBetween } from './../ui.js';
import { editNote, editPerson, editBlock } from './../editors.js';
import { go } from './../router.js';

const view = { tab: 'entries', kind: null, q: '' };

export function openNote(id) {
  const build = () => {
    const state = store.get();
    const n = state.notes.find((x) => x.id === id);
    if (!n) return h('p', { class: 'muted' }, 'Gone.');
    const names = (ids, list, key) => (ids || []).map((i) => list.find((x) => x.id === i)?.[key]).filter(Boolean);

    return frag(
      h('div', { class: 'row wrap', style: 'margin-bottom:12px' },
        h('span', { class: 'chip' }, byId(NOTE_KINDS, n.kind)?.label || 'Note'),
        h('span', { class: 'chip' }, fmtDate(n.date)),
        h('button', { class: 'chip', onClick: () => editNote(n) }, 'Edit')),
      n.body ? h('p', { style: 'white-space:pre-wrap' }, n.body) : null,
      n.source ? h('p', { class: 'small', style: 'color:var(--moss)' }, n.source) : null,
      h('div', { class: 'row wrap' },
        names(n.convictionIds, state.convictions, 'title').map((t) => h('span', { class: 'chip' }, t)),
        names(n.contextIds, state.contexts, 'name').map((t) => h('span', { class: 'chip' }, t))),
      h('button', {
        class: 'btn block', style: 'margin-top:20px',
        onClick: () => { closeSheet(); editBlock(null, { title: n.title || n.body.slice(0, 60), groundId: (n.contextIds || [])[0] || '' }); },
      }, 'Put this in the way'),
    );
  };
  openSheet(() => store.get().notes.find((x) => x.id === id)?.title || 'Entry', build);
}

function entries(state, root) {
  const list = h('div', {});
  const search = h('input', {
    type: 'text', value: view.q, placeholder: 'Search the journal',
    onInput: (e) => { view.q = e.target.value; paint(); },
  });

  const chips = h('div', { class: 'row wrap', style: 'margin:12px 0 4px' });
  const setKind = (k) => { view.kind = k; paintChips(); paint(); };
  const paintChips = () => {
    chips.replaceChildren();
    chips.append(h('button', { class: `chip${view.kind ? '' : ' on'}`, onClick: () => setKind(null) }, 'All'));
    NOTE_KINDS.forEach((k) => {
      if (!state.notes.some((n) => n.kind === k.id)) return;
      chips.append(h('button', { class: `chip${view.kind === k.id ? ' on' : ''}`, onClick: () => setKind(k.id) }, k.label));
    });
  };
  paintChips();

  function paint() {
    const q = view.q.trim().toLowerCase();
    const rows = state.notes
      .filter((n) => !view.kind || n.kind === view.kind)
      .filter((n) => !q || `${n.title} ${n.body} ${n.source}`.toLowerCase().includes(q))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    list.replaceChildren();
    if (!rows.length) {
      list.append(empty(state.notes.length ? 'Nothing matches.' : 'Empty. Write the first honest thing.', 'New entry', () => editNote()));
      return;
    }
    let month = null;
    let bucket = null;
    rows.forEach((n) => {
      const m = n.date.slice(0, 7);
      if (m !== month) {
        month = m;
        list.append(h('div', { class: 'section' }, h('h2', {}, fmtMonth(m))));
        bucket = h('div', { class: 'rows' });
        list.append(bucket);
      }
      bucket.append(h('button', { class: 'card-tap', onClick: () => openNote(n.id) },
        h('div', { class: 'row spread' },
          h('strong', { class: 'grow truncate' }, n.title || '(untitled)'),
          h('span', { class: 'tiny muted' }, relDate(n.date, today()))),
        h('div', { class: 'tiny muted truncate' },
          [byId(NOTE_KINDS, n.kind)?.label, n.source, n.body].filter(Boolean).join(' · '))));
    });
  }
  paint();

  root.append(search, chips, list,
    h('button', { class: 'btn primary block', style: 'margin-top:20px', onClick: () => editNote() }, 'New entry'));
}

function people(state, root) {
  if (!state.people.length) {
    root.append(empty('No names yet. Start with the one person you\'d say you\'re discipling.', 'Add someone', () => editPerson()));
    return;
  }
  PEOPLE_STAGES.forEach((stage) => {
    const group = state.people.filter((p) => p.stage === stage.id);
    if (!group.length) return;
    root.append(section(stage.label));
    const rows = h('div', { class: 'rows' });
    group.forEach((p) => {
      const cold = p.lastMet ? daysBetween(p.lastMet, today()) : null;
      rows.append(h('div', {},
        h('button', { class: 'card-tap', onClick: () => editPerson(p) },
          h('div', { class: 'row spread' },
            h('strong', {}, p.name),
            cold !== null ? h('span', { class: `tiny ${cold > 30 ? 'tone-thin' : 'muted'}` }, `${cold}d`) : null),
          p.nextStep ? h('div', { class: 'tiny muted' }, `Next: ${p.nextStep}`) : null),
        h('button', {
          class: 'icon-btn', style: 'margin-top:8px',
          onClick: () => {
            store.update((s) => { s.people.find((x) => x.id === p.id).lastMet = today(); });
            toast('Marked as met today');
          },
        }, 'Met today')));
    });
    root.append(rows);
  });
  root.append(h('button', { class: 'btn block', style: 'margin-top:20px', onClick: () => editPerson() }, 'Add someone'));
}

export function render(state) {
  const root = h('div', {});
  const tabs = h('div', { class: 'row', style: 'margin-bottom:16px' });
  [['entries', 'Entries'], ['people', 'People']].forEach(([id, label]) => {
    tabs.append(h('button', {
      class: `chip${view.tab === id ? ' on' : ''}`,
      onClick: () => { view.tab = id; go('journal'); },
    }, label));
  });
  root.append(tabs);

  if (view.tab === 'entries') entries(state, root); else people(state, root);
  return root;
}

export const title = 'Journal';
