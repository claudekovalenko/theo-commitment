// Disciple making, by name. A conviction you can't measure is a slogan.

import * as store from './../store.js';
import { today } from './../store.js';
import { PEOPLE_STAGES } from './../model.js';
import { h, empty, sectionHead, relDate, daysBetween, toast } from './../ui.js';
import { editPerson } from './../editors.js';

export function render(state) {
  const view = h('div', {});
  view.append(h('p', { class: 'muted small' }, 'Who you are actually walking with, and what the next real step is.'));

  if (!state.people.length) {
    view.append(empty('No names yet. Start with the one person you\'d say you\'re discipling right now.', 'Add someone', () => editPerson()));
    return view;
  }

  const multiplying = state.people.filter((p) => p.stage === 'multiplying').length;
  view.append(h('div', { class: 'card row spread' },
    h('div', {}, h('div', { class: 'small muted' }, 'Walking with'), h('strong', {}, String(state.people.length))),
    h('div', {}, h('div', { class: 'small muted' }, 'Discipling someone else'), h('strong', {}, String(multiplying)))));

  PEOPLE_STAGES.forEach((stage) => {
    const group = state.people.filter((p) => p.stage === stage.id);
    if (!group.length) return;
    view.append(sectionHead(stage.label));
    const card = h('div', { class: 'card' });
    group.forEach((p) => {
      const cold = p.lastMet ? daysBetween(p.lastMet, today()) : null;
      card.append(h('div', { class: 'list-item' },
        h('div', { class: 'grow' },
          h('button', { class: 'card-tap', onClick: () => editPerson(p) },
            h('div', { class: 'row spread' },
              h('strong', {}, p.name),
              cold !== null ? h('span', { class: `small ${cold > 30 ? 'lv-tension' : 'muted'}` }, `${cold}d`) : null),
            p.nextStep ? h('div', { class: 'small muted' }, `Next: ${p.nextStep}${p.nextDue ? ` · ${relDate(p.nextDue, today())}` : ''}`) : null),
          h('button', {
            class: 'icon-btn', style: 'margin-top:8px',
            onClick: () => {
              store.update((s) => { s.people.find((x) => x.id === p.id).lastMet = today(); });
              toast('Marked as met today');
            },
          }, 'Met today'))));
    });
    view.append(card);
  });

  view.append(h('button', { class: 'btn block', style: 'margin-top:18px', onClick: () => editPerson() }, 'Add someone'));
  return view;
}

export const title = 'People';
