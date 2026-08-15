// All the ground you're weighing, side by side — plus everything that would
// put you on one of them.

import * as store from './../store.js';
import { today } from './../store.js';
import {
  survey, verdict, rankGrounds, impliedPlace, byId, KINDS, STAGES, HORIZONS, PLACE_MODES,
  callingPlace, withinCalling,
} from './../model.js';
import { h, frag, empty, section, openSheet, relDate, fmtDate } from './../ui.js';
import { editGround, walkTheLand, editBlock, editNote, breakGround, editCalling } from './../editors.js';
import { plot, areaBars, usLine } from './parts.js';
import { CHURCH_MODELS, MODEL_STANCES } from './../models.js';

function compareTable(state, rows) {
  const table = h('table', { class: 'grid' });
  const head = h('tr', {}, h('th', {}, 'Ground'));
  state.domains.forEach((d) => {
    const th = h('th', { class: 'tnum' }, d.short || d.label);
    th.style.color = d.color;
    head.append(th);
  });
  head.append(h('th', { class: 'tnum' }, 'Rooted'));
  table.append(h('thead', {}, head));

  const body = h('tbody', {});
  rows.forEach(({ ground, s }) => {
    const tr = h('tr', {}, h('th', { scope: 'row' }, ground.name));
    state.domains.forEach((d) => {
      const cell = s.byArea.find((x) => x.domain.id === d.id);
      const td = h('td', { class: 'tnum' }, cell?.rated ? `${Math.round(cell.fit * 100)}` : '–');
      if (cell?.rated) {
        td.style.background = `color-mix(in srgb, ${d.color} ${Math.round(cell.fit * 42)}%, transparent)`;
        if (cell.missingMusts.length) td.classList.add('cell-alert');
      }
      tr.append(td);
    });
    tr.append(h('td', { class: 'tnum strong' }, `${Math.round(s.depth * 100)}`));
    body.append(tr);
  });
  table.append(body);
  return h('div', { class: 'scroll-x' }, table);
}

export function openGround(id) {
  const build = () => {
    const state = store.get();
    const ground = state.contexts.find((c) => c.id === id);
    if (!ground) return h('p', { class: 'muted' }, 'Gone.');
    const s = survey(state, ground);
    const checks = state.checks.filter((k) => k.contextId === id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const place = impliedPlace(state.contexts, ground);
    const brings = state.contexts.filter((c) => c.placeId === id);
    const notes = state.notes.filter((n) => (n.contextIds || []).includes(id))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return frag(
      h('div', { class: 'row wrap', style: 'margin-bottom:12px' },
        h('span', { class: 'chip' }, byId(KINDS, ground.kind)?.label || ''),
        h('span', { class: 'chip' }, byId(STAGES, s.stage)?.label || ''),
        h('button', { class: 'chip', onClick: () => editGround(ground) }, 'Edit')),

      ground.kind === 'place' ? plot(s.depth, { staked: ground.stage === 'built' }) : null,
      h('p', { class: 'verdict' }, verdict(s)),
      ground.notes ? h('p', { class: 'small muted' }, ground.notes) : null,

      (() => {
        const model = CHURCH_MODELS.find((m) => m.id === ground.modelId);
        if (!model) return null;
        const stance = byId(MODEL_STANCES, state.modelStances?.[model.id]?.stance || 'unknown');
        return h('div', { class: 'card' },
          h('div', { class: 'eyebrow' }, 'Runs on this model'),
          h('div', { class: 'row spread', style: 'margin-top:4px' },
            h('strong', {}, model.name),
            h('span', { class: `small tone-${stance.tone}` }, stance.label)),
          h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, model.asks));
      })(),

      ground.kind !== 'place'
        ? h('div', { class: 'card' },
          byId(KINDS, ground.kind)?.rootless
            ? frag(
              h('div', { class: 'eyebrow' }, state.calling?.place ? `Can this run from ${state.calling.place}?` : 'Does it tie you to a place?'),
              h('div', { class: 'row spread', style: 'margin-top:4px' },
                h('strong', {}, (byId(PLACE_MODES, ground.placeMode || 'unknown')).label),
                h('button', { class: 'icon-btn', onClick: () => editGround(ground) }, 'Change')),
              h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, 'A ministry is a relationship, not an address.'))
            : frag(
              h('div', { class: 'eyebrow' }, 'If we said yes, we\'d live in'),
              place
                ? h('div', { class: 'row spread', style: 'margin-top:4px' },
                  h('strong', {}, place.name),
                  h('button', { class: 'icon-btn', onClick: () => openGround(place.id) }, 'Open'))
                : frag(
                  h('strong', { class: 'tone-thin' }, 'Not answered yet'),
                  h('p', { class: 'small muted', style: 'margin:6px 0 10px' }, 'Until you know where it puts you, you can\'t weigh it.'),
                  h('button', { class: 'btn sm', onClick: () => editGround(ground) }, 'Answer it'))))
        : null,

      h('div', { class: 'stack', style: 'margin:16px 0' },
        h('button', { class: 'btn primary block', onClick: () => walkTheLand(id, s.check) },
          s.check ? 'Walk it again' : 'Walk the land'),
        ground.stage !== 'built' && ground.stage !== 'ruled-out'
          ? h('button', { class: 'btn block', onClick: () => breakGround(ground) },
            ground.kind === 'place' ? 'Decide on this ground' : 'Decide on them')
          : null),

      s.check ? frag(
        section('The test that decides it'),
        h('div', { class: 'card' },
          h('div', { class: 'row spread' },
            h('span', { class: 'small' }, 'Kids here, unsupervised'),
            h('span', { class: `small tone-${s.kid.tone}` }, s.kid.label)),
          s.kidNote ? h('div', { class: 'tiny muted' }, s.kidNote) : null,
          h('div', { class: 'row spread', style: 'margin-top:8px' },
            h('span', { class: 'small' }, 'He\'d come back'),
            h('span', { class: `small tone-${s.formation.tone}` }, s.formation.label)),
          h('div', { class: 'row spread', style: 'margin-top:8px' },
            h('span', { class: 'small' }, ground.kind === 'place' ? 'Buy a home here' : 'Settle in completely'),
            h('span', { class: `small tone-${ground.kind === 'place' ? s.home.tone : s.settle.tone}` },
              ground.kind === 'place' ? s.home.label : s.settle.label)),
          s.household.length
            ? h('div', { class: 'tiny muted', style: 'margin-top:10px' }, `Spiritual family here: ${s.household.map((p) => p.name).join(', ')}`)
            : h('div', { class: 'tiny tone-thin', style: 'margin-top:10px' }, 'No spiritual family named here yet')),
        section('The soil'),
        areaBars(s),
        h('div', { class: 'card', style: 'margin-top:14px' },
          h('div', { class: 'row spread' },
            h('span', { class: 'small muted' }, 'Could we still be here in ten years?'),
            h('span', { class: 'small' }, (byId(HORIZONS, ground.horizon) || HORIZONS[0]).label)),
          h('div', { style: 'margin-top:8px' }, usLine(s.check))),
        s.check.summary ? h('p', { class: 'small muted', style: 'font-style:italic; margin-top:12px' }, `"${s.check.summary}"`) : null,
      ) : null,

      s.thin.length ? frag(
        section('Thin soil'),
        h('div', { class: 'rows' }, s.thin.map((t) => h('div', {},
          h('div', { class: 'row spread' },
            h('strong', {}, t.req.title),
            h('span', { class: `small tone-${t.level.score === 0 ? 'bad' : 'thin'}` }, t.level.label)),
          t.rating?.note ? h('div', { class: 'tiny muted' }, t.rating.note) : null,
          h('button', {
            class: 'icon-btn', style: 'margin-top:8px',
            onClick: () => editBlock(null, { groundId: id, title: `${t.req.title} — ${ground.name}` }),
          }, 'Put it in the way')))),
      ) : null,

      s.blocks.length ? frag(
        section('In the way'),
        h('div', { class: 'rows' }, s.blocks.map((b) => h('button', { class: 'card-tap', onClick: () => editBlock(b) },
          h('div', {}, b.title),
          h('div', { class: 'tiny muted' }, [b.who, b.due ? relDate(b.due, today()) : null].filter(Boolean).join(' · '))))),
      ) : null,

      brings.length ? frag(
        section('What would put us here'),
        h('div', { class: 'rows' }, brings.map((b) => h('button', { class: 'card-tap', onClick: () => openGround(b.id) },
          h('div', { class: 'row spread' },
            h('strong', {}, b.name),
            h('span', { class: 'tiny muted' }, byId(KINDS, b.kind)?.label || ''))))),
      ) : null,

      checks.length > 1 ? frag(
        section('Every time I walked it'),
        h('div', { class: 'rows' }, checks.map((k) => h('button', { class: 'card-tap', onClick: () => walkTheLand(id, k) },
          h('div', { class: 'row spread' },
            h('strong', {}, fmtDate(k.date)),
            h('span', { class: 'tiny muted' }, k.summary ? '' : 'no note')),
          k.summary ? h('div', { class: 'tiny muted truncate' }, k.summary) : null))),
      ) : null,

      frag(
        section('Journal', 'Add', () => editNote(null, { contextIds: [id] })),
        notes.length
          ? h('div', { class: 'rows' }, notes.slice(0, 8).map((n) => h('div', {},
            h('div', { class: 'tiny muted' }, relDate(n.date, today())),
            h('div', { class: 'small' }, n.title || n.body.slice(0, 80)))))
          : h('p', { class: 'small muted' }, 'Nothing written about this one yet.')),
    );
  };

  openSheet(() => store.get().contexts.find((c) => c.id === id)?.name || 'Ground', build);
}

function groundRow(state, ground, s) {
  const hz = ground.kind === 'place'
    ? (byId(HORIZONS, ground.horizon) || HORIZONS[0])
    : byId(KINDS, ground.kind) || { label: '' };
  const brings = state.contexts.filter((c) => c.placeId === ground.id);
  return h('button', { class: 'card card-tap', onClick: () => openGround(ground.id) },
    h('div', { class: 'row spread' },
      h('div', { class: 'grow' },
        h('strong', {}, ground.name),
        h('div', { class: 'tiny muted' },
          [byId(STAGES, s.stage)?.label, hz.label].filter(Boolean).join(' · '))),
      h('div', { style: 'text-align:right' },
        h('div', { class: 'tnum', style: 'font-weight:600' }, `${Math.round(s.depth * 100)}%`),
        h('div', { class: 'tiny muted' }, 'rooted'))),
    h('div', { class: 'bar', style: 'margin-top:10px' },
      h('i', { style: `width:${Math.round(s.depth * 100)}%; background: var(--soil)` })),
    h('div', { class: 'small muted', style: 'margin-top:10px' }, verdict(s)),
    s.check ? h('div', { class: `tiny tone-${s.kid.tone}`, style: 'margin-top:4px' }, `Kids unsupervised: ${s.kid.label.toLowerCase()}`) : null,
    brings.length ? h('div', { class: 'tiny muted', style: 'margin-top:6px' }, `Would put us here: ${brings.map((b) => b.name).join(', ')}`) : null);
}

export function render(state) {
  const view = h('div', {});
  const place = callingPlace(state);

  if (place) {
    view.append(h('h1', {}, `Who in ${place.name}?`),
      h('p', { class: 'muted small' },
        'The city is settled. What\'s open is the people — which church, which households, which network you\'d actually build with.'));
  } else {
    view.append(h('h1', {}, 'The land'),
      h('p', { class: 'muted small' }, 'Every piece of ground you\'re weighing, and how deep you could root in each.'));
  }

  const inside = withinCalling(state).map((ground) => ({ ground, s: survey(state, ground) }))
    .sort((a, b) => b.s.depth - a.s.depth);

  if (place) {
    view.append(section(`In ${place.name}`, 'Add', () => editGround(null, { kind: 'community' })));
    if (!inside.length) {
      view.append(empty('Nobody named there yet. Start with one church or one family.', 'Add a community', () => editGround(null, { kind: 'community' })));
    } else {
      inside.forEach(({ ground, s }) => view.append(groundRow(state, ground, s)));
    }

    const surveyed = inside.filter((r) => r.s.check);
    if (surveyed.length > 1) {
      view.append(section('Side by side'));
      view.append(h('div', { class: 'card' },
        compareTable(state, surveyed),
        h('p', { class: 'tiny muted', style: 'margin:10px 0 0' }, 'Per cent of each area they actually hold. Last column is how deep you could root.')));
    }

    view.append(section('The city itself', 'Edit the calling', editCalling));
    view.append(groundRow(state, place, survey(state, place)));

    const elsewhere = state.contexts.filter((c) => c.kind === 'place' && c.id !== place.id);
    if (elsewhere.length) {
      view.append(section('Elsewhere'));
      view.append(h('p', { class: 'tiny muted' }, 'Kept for comparison. You said the city is settled.'));
      const rows = h('div', { class: 'rows' });
      elsewhere.forEach((g) => rows.append(h('button', { class: 'card-tap', onClick: () => openGround(g.id) },
        h('div', { class: 'row spread' },
          h('strong', {}, g.name),
          h('span', { class: 'tiny muted tnum' }, `${Math.round(survey(state, g).depth * 100)}% rooted`)))));
      view.append(rows);
    }
    return view;
  }

  const ranked = rankGrounds(state);
  view.append(section('Places', 'Add', () => editGround(null, { kind: 'place' })));
  if (!ranked.length) {
    view.append(empty('No land yet. Start with where you are.', 'Add a place', () => editGround(null, { kind: 'place' })));
  } else {
    ranked.forEach(({ ground, s }) => view.append(groundRow(state, ground, s)));
  }

  const surveyed = ranked.filter((r) => r.s.check);
  if (surveyed.length > 1) {
    view.append(section('Side by side'));
    view.append(h('div', { class: 'card' },
      compareTable(state, surveyed),
      h('p', { class: 'tiny muted', style: 'margin:10px 0 0' }, 'Per cent of each area the ground actually holds. Last column is how deep you could root.')));
  }

  view.append(section('Churches, networks, roles', 'Add', () => editGround(null, { kind: 'church' })));
  const others = state.contexts.filter((c) => c.kind !== 'place');
  if (!others.length) {
    view.append(h('p', { class: 'small muted' }, 'Anything that would move you goes here, tied to the ground it would put you on.'));
  } else {
    const rows = h('div', { class: 'rows' });
    others.forEach((c) => {
      const p = impliedPlace(state.contexts, c);
      const rootless = byId(KINDS, c.kind)?.rootless;
      const mode = byId(PLACE_MODES, c.placeMode || 'unknown');
      rows.append(h('button', { class: 'card-tap', onClick: () => openGround(c.id) },
        h('div', { class: 'row spread' },
          h('strong', {}, c.name),
          h('span', { class: 'tiny muted' }, byId(KINDS, c.kind)?.label || '')),
        h('div', { class: `tiny ${p || rootless ? 'muted' : 'tone-thin'}` },
          rootless ? mode.label : (p ? `Would put us in ${p.name}` : 'No ground attached yet'))));
    });
    view.append(rows);
  }

  return view;
}

export const title = 'The land';
