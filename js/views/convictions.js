// Your convictions: what you hold, how firmly, and how each one is faring
// across every context you've checked.

import * as store from './../store.js';
import { today } from './../store.js';
import { WEIGHTS, byId, levelOf, latestCheck } from './../model.js';
import { h, frag, empty, sectionHead, openSheet, relDate } from './../ui.js';
import { editConviction, editNote } from './../editors.js';

export function openConviction(id) {
  const build = () => {
    const state = store.get();
    const c = state.convictions.find((x) => x.id === id);
    if (!c) return h('p', { class: 'muted' }, 'Gone.');

    const across = state.contexts.map((ctx) => {
      const check = latestCheck(state.checks, ctx.id);
      const rating = check?.ratings?.[id];
      return rating ? { ctx, level: levelOf(rating.level), note: rating.note, date: check.date } : null;
    }).filter(Boolean).filter((x) => x.level.id !== 'unknown');

    const notes = state.notes.filter((n) => (n.convictionIds || []).includes(id))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return frag(
      h('div', { class: 'row wrap', style: 'margin-bottom:12px' },
        h('span', { class: 'chip on' }, byId(WEIGHTS, c.weight)?.label || ''),
        h('button', { class: 'chip', onClick: () => editConviction(c) }, 'Edit'),
        h('button', { class: 'chip', onClick: () => editNote(null, { convictionIds: [id], kind: 'observation' }) }, 'Log a learning')),

      c.summary ? h('p', {}, c.summary) : null,
      c.scriptures ? h('p', { class: 'small', style: 'color:var(--gold)' }, c.scriptures) : null,

      c.practice ? h('div', { class: 'card' },
        h('div', { class: 'small muted' }, 'True of me when'),
        h('div', {}, c.practice)) : null,

      c.forming ? h('div', { class: 'card' },
        h('div', { class: 'small muted' }, 'Still working out'),
        h('div', {}, c.forming)) : null,

      across.length ? h('div', {},
        sectionHead('How it fares'),
        h('div', { class: 'card' }, across.map((a) => h('div', { class: 'list-item' },
          h('span', { class: `dot lv-${a.level.id}`, style: 'margin-top:7px' }),
          h('div', { class: 'grow' },
            h('div', { class: 'row spread' },
              h('strong', {}, a.ctx.name),
              h('span', { class: `pill lv-${a.level.id}` }, a.level.label)),
            a.note ? h('div', { class: 'small muted' }, a.note) : null))))) : null,

      h('div', {},
        sectionHead('Learnings'),
        notes.length
          ? h('div', { class: 'card' }, notes.slice(0, 10).map((n) => h('div', { class: 'list-item' },
            h('div', { class: 'grow' },
              h('div', { class: 'small muted' }, relDate(n.date, today())),
              h('div', {}, n.title || n.body.slice(0, 70))))))
          : h('p', { class: 'small muted' }, 'Nothing logged against this one yet.')),
    );
  };

  openSheet(() => store.get().convictions.find((x) => x.id === id)?.title || 'Conviction', build);
}

export function render(state) {
  const view = h('div', {});

  if (!state.convictions.length) {
    view.append(empty('Start with one. What would you not budge on?', 'Add a conviction', () => editConviction()));
    return view;
  }

  const counts = WEIGHTS.map((w) => ({ w, n: state.convictions.filter((c) => c.weight === w.id).length }));
  view.append(h('div', { class: 'card row wrap' }, counts.filter((x) => x.n).map((x) => h('div', { class: 'grow' },
    h('div', { class: 'small muted' }, x.w.label),
    h('strong', {}, String(x.n))))));

  WEIGHTS.forEach((w) => {
    const group = state.convictions.filter((c) => c.weight === w.id);
    if (!group.length) return;
    view.append(sectionHead(w.label));
    view.append(h('p', { class: 'small muted', style: 'margin-top:-4px' }, w.help));
    group.forEach((c) => view.append(h('button', { class: 'card card-tap', onClick: () => openConviction(c.id) },
      h('strong', {}, c.title),
      c.summary ? h('div', { class: 'small muted', style: 'margin-top:4px' }, c.summary) : null,
      c.scriptures ? h('div', { class: 'small', style: 'margin-top:6px; color:var(--gold-dim)' }, c.scriptures) : null,
      c.forming ? h('div', { class: 'small muted', style: 'margin-top:6px' }, '● still working this one out') : null)));
  });

  view.append(h('button', { class: 'btn block', style: 'margin-top:18px', onClick: () => editConviction() }, 'Add a conviction'));
  return view;
}

export const title = 'Convictions';
