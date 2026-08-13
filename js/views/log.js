// The log: what you're learning, where it came from, what it touches.

import * as store from './../store.js';
import { today } from './../store.js';
import { NOTE_KINDS, byId } from './../model.js';
import { h, frag, empty, openSheet, closeSheet, relDate, fmtDate, fmtMonth } from './../ui.js';
import { editNote, editAction } from './../editors.js';
import { go } from './../router.js';

const filter = { kind: null, q: '' };

export function openNote(id) {
  const build = () => {
    const state = store.get();
    const n = state.notes.find((x) => x.id === id);
    if (!n) return h('p', { class: 'muted' }, 'Gone.');
    const names = (ids, list, key) => (ids || [])
      .map((i) => list.find((x) => x.id === i)?.[key]).filter(Boolean);

    return frag(
      h('div', { class: 'row wrap', style: 'margin-bottom:12px' },
        h('span', { class: 'chip' }, byId(NOTE_KINDS, n.kind)?.label || 'Note'),
        h('span', { class: 'chip' }, fmtDate(n.date)),
        h('button', { class: 'chip', onClick: () => editNote(n) }, 'Edit')),

      n.body ? h('p', { style: 'white-space:pre-wrap' }, n.body) : null,
      n.source ? h('p', { class: 'small', style: 'color:var(--gold)' }, n.source) : null,

      h('div', { class: 'row wrap' },
        names(n.convictionIds, state.convictions, 'title').map((t) => h('span', { class: 'chip on' }, t)),
        names(n.contextIds, state.contexts, 'name').map((t) => h('span', { class: 'chip' }, t))),

      h('button', {
        class: 'btn block',
        style: 'margin-top:18px',
        onClick: () => { closeSheet(); editAction(null, { title: n.title, detail: n.body.slice(0, 200), convictionIds: n.convictionIds, contextIds: n.contextIds, fromNoteId: n.id }); },
      }, 'Turn this into a follow-up'),
    );
  };
  openSheet(() => store.get().notes.find((x) => x.id === id)?.title || 'Entry', build);
}

export function render(state) {
  const view = h('div', {});

  view.append(h('input', {
    type: 'text', value: filter.q, placeholder: 'Search the log',
    onInput: (e) => { filter.q = e.target.value; paint(); },
  }));

  const chips = h('div', { class: 'row wrap', style: 'margin:10px 0 4px' });
  const setKind = (k) => { filter.kind = k; go('log'); };
  chips.append(h('button', { class: `chip${filter.kind ? '' : ' on'}`, onClick: () => setKind(null) }, 'All'));
  NOTE_KINDS.forEach((k) => {
    if (!state.notes.some((n) => n.kind === k.id)) return;
    chips.append(h('button', { class: `chip${filter.kind === k.id ? ' on' : ''}`, onClick: () => setKind(k.id) }, k.label));
  });
  view.append(chips);

  const list = h('div', {});
  view.append(list);

  function paint() {
    const q = filter.q.trim().toLowerCase();
    const rows = state.notes
      .filter((n) => (!filter.kind || n.kind === filter.kind))
      .filter((n) => !q || `${n.title} ${n.body} ${n.source}`.toLowerCase().includes(q))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    list.replaceChildren();
    if (!rows.length) {
      list.append(empty(state.notes.length ? 'Nothing matches.' : 'The log is empty. Write down the first thing you\'re actually chewing on.', 'New entry', () => editNote()));
      return;
    }

    let month = null;
    const card = () => { const c = h('div', { class: 'card' }); list.append(c); return c; };
    let bucket = null;
    rows.forEach((n) => {
      const m = n.date.slice(0, 7);
      if (m !== month) {
        month = m;
        list.append(h('div', { class: 'section-head' }, h('h2', {}, fmtMonth(m))));
        bucket = card();
      }
      bucket.append(h('button', { class: 'card-tap list-item', onClick: () => openNote(n.id) },
        h('div', { class: 'grow' },
          h('div', { class: 'row spread' },
            h('strong', { class: 'grow truncate' }, n.title || '(untitled)'),
            h('span', { class: 'small muted' }, relDate(n.date, today()))),
          h('div', { class: 'small muted truncate' },
            [byId(NOTE_KINDS, n.kind)?.label, n.source, n.body].filter(Boolean).join(' · ')))));
    });
  }
  paint();

  view.append(h('button', { class: 'btn primary block', style: 'margin-top:18px', onClick: () => editNote() }, 'New entry'));
  return view;
}

export const title = 'Log';
