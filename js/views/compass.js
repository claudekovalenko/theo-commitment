// Home: one needle for the whole life, then the five domains underneath it,
// because a strong ministry reading can hide a bad roots reading.

import * as store from './../store.js';
import { today } from './../store.js';
import {
  scoreCheck, latestCheck, readingWord, byId, impliedPlace, placesByRoots, HORIZONS, US_LEVELS,
} from './../model.js';
import { h, frag, empty, sectionHead, relDate, daysBetween, toast } from './../ui.js';
import { runCheck, editNote, editAction, editContext } from './../editors.js';
import { openContext } from './where.js';
import { openNote } from './log.js';
import { domainBars } from './parts.js';
import { go } from './../router.js';

let focusId = null; // which context the needle is reading

function compassSvg(degrees) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', degrees === null ? 'Compass, no reading yet' : `${degrees} degrees off true north`);
  const make = (tag, attrs) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  svg.append(make('circle', { cx: 100, cy: 100, r: 93, fill: '#151a28', stroke: '#27304a', 'stroke-width': 2 }));
  svg.append(make('circle', { cx: 100, cy: 100, r: 78, fill: 'none', stroke: '#1f2740', 'stroke-width': 1 }));

  for (let a = 0; a < 360; a += 15) {
    const major = a % 45 === 0;
    const r1 = major ? 72 : 78;
    const rad = ((a - 90) * Math.PI) / 180;
    svg.append(make('line', {
      x1: 100 + Math.cos(rad) * r1, y1: 100 + Math.sin(rad) * r1,
      x2: 100 + Math.cos(rad) * 86, y2: 100 + Math.sin(rad) * 86,
      stroke: major ? '#3a4460' : '#27304a', 'stroke-width': major ? 2 : 1,
    }));
  }

  const n = make('text', { x: 100, y: 32, 'text-anchor': 'middle', fill: '#98a0bb', 'font-size': 13, 'letter-spacing': 2 });
  n.textContent = 'N';
  svg.append(n);

  const g = make('g', { class: 'needle' });
  g.style.transform = `rotate(${degrees ?? 0}deg)`; // set via CSSOM: the CSP forbids style attributes
  g.append(make('path', { d: 'M100 26 L124 132 L100 114 Z', fill: '#d6a854' }));
  g.append(make('path', { d: 'M100 26 L76 132 L100 114 Z', fill: '#927036' }));
  g.append(make('circle', { cx: 100, cy: 114, r: 7, fill: '#0e111b', stroke: '#27304a', 'stroke-width': 2 }));
  svg.append(g);
  return svg;
}

function pickFocus(state) {
  const rated = state.contexts.filter((c) => latestCheck(state.checks, c.id));
  const pool = rated.length ? rated : state.contexts;
  if (focusId && pool.some((c) => c.id === focusId)) return pool.find((c) => c.id === focusId);
  // Nothing rated yet? Point at where you already are — that's the baseline
  // every other place gets compared against.
  return pool.find((c) => c.status === 'current')
    || pool.find((c) => c.status === 'considering')
    || pool[0] || null;
}

export function render(state) {
  const ctx = pickFocus(state);
  const check = ctx ? latestCheck(state.checks, ctx.id) : null;
  const result = check ? scoreCheck(check, state.convictions, state.domains) : null;
  const view = h('div', {});

  /* ---- the reading ---- */
  const hero = h('div', { class: 'card' });
  hero.append(h('div', { class: 'compass' }, compassSvg(result?.rated ? result.degrees : null)));

  if (!state.contexts.length) {
    hero.append(h('div', { class: 'compass-read' },
      h('p', { class: 'muted' }, 'Add what you\'re weighing — a town, a church, a network — and the needle has something to read.'),
      h('button', { class: 'btn primary', onClick: () => editContext() }, 'Add the first one')));
  } else if (!check) {
    hero.append(h('div', { class: 'compass-read' },
      h('div', { class: 'big' }, ctx.name),
      h('p', { class: 'muted' }, 'No check run yet. Rate it across all five domains and see where you actually stand.'),
      h('button', { class: 'btn primary', onClick: () => runCheck(ctx.id) }, 'Run a check')));
  } else {
    hero.append(h('div', { class: 'compass-read' },
      h('div', { class: 'big tnum' }, result.rated ? `${result.degrees}°` : '—'),
      h('div', {}, readingWord(result.pct), ' with ', h('strong', {}, ctx.name)),
      h('div', { class: 'small muted', style: 'margin-top:4px' }, `Last read ${relDate(check.date, today())}`)));

    const place = impliedPlace(state.contexts, ctx);
    if (ctx.kind !== 'place') {
      const pr = place ? scoreCheck(latestCheck(state.checks, place.id) || { ratings: {} }, state.convictions, state.domains) : null;
      const prRoots = pr?.byDomain.find((d) => d.domain.id === 'roots');
      hero.append(h('p', { class: 'small center', style: 'margin:10px 0 0' },
        place
          ? frag(h('span', { class: 'muted' }, 'Would put us in '), h('strong', {}, place.name),
            prRoots?.rated ? h('span', { class: 'muted tnum' }, ` · ${Math.round(prRoots.pct * 100)}% roots`) : null)
          : h('span', { class: 'lv-tension' }, 'Where would this put us? Not answered yet.')));
    }

    if (result.weakest) {
      hero.append(h('p', { class: 'small muted center', style: 'margin:10px 0 0' },
        'Weakest: ', h('strong', { class: 'lv-tension' }, result.weakest.domain.label)));
    }
    hero.append(h('div', { class: 'row', style: 'margin-top:14px' },
      h('button', { class: 'btn sm grow', onClick: () => runCheck(ctx.id, check) }, 'Update this check'),
      h('button', { class: 'btn sm grow', onClick: () => openContext(ctx.id) }, 'Open')));
  }

  if (state.contexts.length > 1) {
    const row = h('div', { class: 'row wrap', style: 'margin-top:14px' });
    state.contexts.forEach((c) => row.append(h('button', {
      class: `chip${c.id === ctx?.id ? ' on' : ''}`,
      onClick: () => { focusId = c.id; go('compass'); },
    }, c.name)));
    hero.append(row);
  }
  view.append(hero);

  /* ---- the question under the others ---- */
  const places = placesByRoots(state, (p) => {
    const k = latestCheck(state.checks, p.id);
    return k ? scoreCheck(k, state.convictions, state.domains) : null;
  });

  view.append(h('div', { class: 'card ask', style: 'margin-top:22px' },
    h('h2', { style: 'margin:0' }, 'Where are we going to raise our family?'),
    h('p', { class: 'small muted', style: 'margin:6px 0 0' },
      'The question under all the others. Everything else is a way of ending up somewhere.')));

  if (!places.length) {
    view.append(empty('No places on the board yet. Put down where you are, and anywhere you\'d genuinely consider.', 'Add a place', () => editContext(null, { kind: 'place' })));
  } else {
    const card = h('div', { class: 'card' });
    places.forEach(({ place, roots }) => {
      const hz = byId(HORIZONS, place.horizon) || HORIZONS[0];
      const brings = state.contexts.filter((c) => c.placeId === place.id);
      card.append(h('button', { class: 'card-tap list-item', onClick: () => openContext(place.id) },
        h('div', { class: 'grow' },
          h('div', { class: 'row spread' },
            h('strong', {}, place.name),
            h('span', { class: 'small muted tnum' }, roots?.rated ? `${Math.round(roots.pct * 100)}% roots` : 'no check')),
          h('div', { class: 'small muted' },
            [hz.label, brings.length ? `via ${brings.map((b) => b.name).join(', ')}` : null].filter(Boolean).join(' · ')))));
    });
    view.append(card);
    view.append(h('button', { class: 'btn ghost block', style: 'margin-top:10px', onClick: () => go('where') }, 'Compare them'));
  }


  /* ---- the five domains ---- */
  if (result?.byDomain.length) {
    view.append(sectionHead('Across the whole life'));
    view.append(h('div', { class: 'card' }, domainBars(result)));
  }

  /* ---- where the two of you are ---- */
  if (check) {
    const us = byId(US_LEVELS, check.us?.level) || byId(US_LEVELS, 'na');
    const nudge = ['unspoken', 'talking', 'apart'].includes(us.id);
    view.append(h('div', { class: 'card', style: 'margin-top:12px' },
      h('div', { class: 'row spread' },
        h('div', { class: 'grow' },
          h('strong', {}, 'Us'),
          h('div', { class: `small ${nudge ? 'lv-tension' : 'muted'}` }, us.label),
          check.us?.note ? h('div', { class: 'small muted' }, check.us.note) : null),
        h('button', { class: 'btn sm', onClick: () => runCheck(ctx.id, check) }, 'Update')),
      nudge
        ? h('button', {
          class: 'icon-btn', style: 'margin-top:10px',
          onClick: () => editAction(null, { title: `Talk through ${ctx.name} together`, contextIds: [ctx.id] }),
        }, 'Put it on the calendar')
        : null));
  }

  /* ---- friction ---- */
  if (result?.friction.length) {
    view.append(sectionHead('Where the friction is'));
    const list = h('div', { class: 'card' });
    result.friction.slice(0, 4).forEach((f) => {
      const domain = state.domains.find((d) => d.id === f.conviction.domainId);
      const dot = h('span', { class: `dot lv-${f.level.id}`, style: 'margin-top:7px' });
      list.append(h('div', { class: 'list-item' },
        dot,
        h('div', { class: 'grow' },
          h('div', { class: 'row spread' },
            h('strong', {}, f.conviction.title),
            h('span', { class: `pill lv-${f.level.id}` }, f.level.label)),
          h('div', { class: 'small muted' }, [domain?.label, f.rating?.note].filter(Boolean).join(' · ')),
          h('div', { class: 'row', style: 'margin-top:8px' },
            h('button', {
              class: 'icon-btn',
              onClick: () => editNote(null, {
                title: `${f.conviction.title} — ${ctx.name}`,
                kind: 'question',
                convictionIds: [f.conviction.id],
                contextIds: [ctx.id],
              }),
            }, 'Log it'),
            h('button', {
              class: 'icon-btn',
              onClick: () => editAction(null, {
                title: `Ask about ${f.conviction.title.toLowerCase()} with ${ctx.name}`,
                convictionIds: [f.conviction.id],
                contextIds: [ctx.id],
              }),
            }, 'Make it a follow-up')))));
    });
    view.append(list);
  }

  if (result?.unknown.length) {
    view.append(h('div', { class: 'card', style: 'margin-top:12px' },
      h('div', { class: 'row spread' },
        h('div', { class: 'grow' },
          h('strong', {}, `${result.unknown.length} still unknown`),
          h('div', { class: 'small muted' }, 'Not a mark against anyone — just things you haven\'t seen enough of yet.')),
        h('button', { class: 'btn sm', onClick: () => runCheck(ctx.id, check) }, 'Update'))));
  }

  /* ---- what's due ---- */
  const due = state.actions
    .filter((a) => !a.done && a.due && a.due <= today())
    .sort((a, b) => (a.due < b.due ? -1 : 1));
  if (due.length) {
    view.append(sectionHead('Due now', 'All', () => go('do')));
    const card = h('div', { class: 'card' });
    due.slice(0, 4).forEach((a) => card.append(h('div', { class: 'check' },
      h('input', {
        type: 'checkbox',
        onChange: () => { store.update((s) => { const t = s.actions.find((x) => x.id === a.id); t.done = true; t.doneAt = today(); }); toast('Done'); },
      }),
      h('div', { class: 'grow' },
        h('div', {}, a.title),
        h('div', { class: 'small muted' }, relDate(a.due, today()))))));
    view.append(card);
  }

  /* ---- rhythm ---- */
  const lastNote = [...state.notes].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const last30 = state.notes.filter((n) => daysBetween(n.date, today()) <= 30).length;
  view.append(sectionHead('Rhythm'));
  view.append(h('div', { class: 'card row spread' },
    h('div', {},
      h('div', { class: 'small muted' }, 'Last entry'),
      h('strong', {}, lastNote ? relDate(lastNote.date, today()) : 'Never')),
    h('div', {},
      h('div', { class: 'small muted' }, 'Last 30 days'),
      h('strong', {}, `${last30} entr${last30 === 1 ? 'y' : 'ies'}`)),
    h('button', { class: 'btn sm', onClick: () => editNote() }, 'Log')));

  /* ---- recent ---- */
  const recent = [...state.notes].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  if (recent.length) {
    view.append(sectionHead('Recent learnings', 'All', () => go('log')));
    const card = h('div', { class: 'card' });
    recent.forEach((n) => card.append(h('button', { class: 'card-tap list-item', onClick: () => openNote(n.id) },
      h('div', { class: 'grow' },
        h('div', { class: 'small muted' }, relDate(n.date, today())),
        h('div', {}, n.title || n.body.slice(0, 60))))));
    view.append(card);
  } else {
    view.append(sectionHead('Recent learnings'));
    view.append(empty('Nothing logged yet. The first one is usually the honest one.', 'Write it', () => editNote()));
  }

  return view;
}

export const title = 'Compass';
