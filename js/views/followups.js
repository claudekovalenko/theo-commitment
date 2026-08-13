// Follow-through. Convictions that never become a next step stay theoretical.

import * as store from './../store.js';
import { today } from './../store.js';
import { h, empty, sectionHead, relDate, toast } from './../ui.js';
import { editAction } from './../editors.js';

const byDue = (a, b) => {
  if (!a.due) return 1;
  if (!b.due) return -1;
  return a.due < b.due ? -1 : 1;
};

function row(a) {
  const overdue = a.due && !a.done && a.due < today();
  return h('div', { class: 'check' },
    h('input', {
      type: 'checkbox', checked: !!a.done,
      onChange: (e) => {
        const done = e.target.checked;
        store.update((s) => {
          const t = s.actions.find((x) => x.id === a.id);
          t.done = done;
          t.doneAt = done ? today() : '';
        });
        toast(done ? 'Done' : 'Reopened');
      },
    }),
    h('button', { class: 'card-tap grow', onClick: () => editAction(a) },
      h('div', { style: a.done ? 'opacity:.55' : '' }, a.title),
      h('div', { class: `small ${overdue ? 'lv-tension' : 'muted'}` },
        [a.due ? relDate(a.due, today()) : null, a.detail].filter(Boolean).join(' · '))));
}

export function render(state) {
  const view = h('div', {});
  const open = state.actions.filter((a) => !a.done).sort(byDue);
  const done = state.actions.filter((a) => a.done)
    .sort((a, b) => ((a.doneAt || '') < (b.doneAt || '') ? 1 : -1));

  if (!state.actions.length) {
    view.append(empty('Nothing outstanding. When something in the log needs an actual next step, it lands here.', 'Add a follow-up', () => editAction()));
    return view;
  }

  const overdue = open.filter((a) => a.due && a.due <= today());
  if (overdue.length) {
    view.append(sectionHead('Due'));
    view.append(h('div', { class: 'card' }, overdue.map(row)));
  }

  const rest = open.filter((a) => !overdue.includes(a));
  if (rest.length) {
    view.append(sectionHead('Open'));
    view.append(h('div', { class: 'card' }, rest.map(row)));
  }

  if (!open.length) view.append(h('div', { class: 'card center muted' }, 'Nothing open. Good.'));

  if (done.length) {
    view.append(sectionHead(`Done (${done.length})`));
    view.append(h('div', { class: 'card' }, done.slice(0, 12).map(row)));
  }

  view.append(h('button', { class: 'btn primary block', style: 'margin-top:18px', onClick: () => editAction() }, 'Add a follow-up'));
  return view;
}

export const title = 'Follow-through';
