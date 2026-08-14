// What the soil has to hold: every requirement, by area of life.

import { WEIGHTS, byId, levelOf, latestCheck } from './../model.js';
import { h, frag, empty, section, openSheet, relDate } from './../ui.js';
import { today } from './../store.js';
import * as store from './../store.js';
import { editRequirement, editDomain, editNote } from './../editors.js';

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
        h('button', { class: 'chip', onClick: () => editNote(null, { convictionIds: [id] }) }, 'Write about it')),

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
      c.forming ? h('div', { class: 'tiny muted', style: 'margin-top:4px' }, 'still working this one out') : null)));
    view.append(rows);
  });

  view.append(h('div', { class: 'stack', style: 'margin-top:24px' },
    h('button', { class: 'btn block', onClick: () => editRequirement() }, 'Add a requirement'),
    h('button', { class: 'btn ghost block', onClick: () => editDomain() }, 'Add an area of life')));
  return view;
}

export const title = 'The soil';
