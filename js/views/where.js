// "Where are we going to raise our family?" — the question everything else
// serves. Places are the unit here; a network or a role is an answer to
// "what would bring us there", not a decision of its own.

import * as store from './../store.js';
import { today } from './../store.js';
import {
  scoreCheck, latestCheck, readingWord, byId, impliedPlace, placesByRoots,
  CONTEXT_KINDS, CONTEXT_STATUS, HORIZONS,
} from './../model.js';
import { h, frag, empty, sectionHead, openSheet, relDate, fmtDate } from './../ui.js';
import { editContext, runCheck, editNote, editAction } from './../editors.js';
import { domainBars, usLine, horizonLine } from './parts.js';

const scorer = (state) => (ctx) => {
  const check = latestCheck(state.checks, ctx.id);
  return check ? scoreCheck(check, state.convictions, state.domains) : null;
};

function sparkline(checks, state) {
  const pts = [...checks].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-10);
  if (pts.length < 2) return null;
  const bar = h('div', { class: 'spark' });
  pts.forEach((k) => {
    const r = scoreCheck(k, state.convictions, state.domains);
    bar.append(h('i', {
      style: `height:${Math.max(3, Math.round((r.pct || 0) * 26))}px`,
      title: `${fmtDate(k.date)} — ${Math.round((r.pct || 0) * 100)}%`,
    }));
  });
  return bar;
}

/** Places down the side, areas across the top. */
function compareTable(state, rows) {
  const table = h('table', { class: 'grid' });
  const head = h('tr', {}, h('th', {}, 'Where'));
  state.domains.forEach((d) => {
    const th = h('th', { class: 'tnum' }, d.short || d.label);
    th.style.color = d.color;
    head.append(th);
  });
  head.append(h('th', { class: 'tnum' }, 'All'));
  table.append(h('thead', {}, head));

  const body = h('tbody', {});
  rows.forEach(({ ctx, r }) => {
    const tr = h('tr', {}, h('th', { scope: 'row' }, ctx.name));
    state.domains.forEach((d) => {
      const cell = r.byDomain.find((x) => x.domain.id === d.id);
      const td = h('td', { class: 'tnum' }, cell?.rated ? `${Math.round(cell.pct * 100)}` : '–');
      if (cell?.rated) {
        td.style.background = `color-mix(in srgb, ${d.color} ${Math.round(cell.pct * 55)}%, transparent)`;
        if (cell.dealbreakers.length) td.classList.add('cell-alert');
      }
      tr.append(td);
    });
    tr.append(h('td', { class: 'tnum strong' }, r.rated ? `${Math.round(r.pct * 100)}` : '–'));
    body.append(tr);
  });
  table.append(body);
  return h('div', { class: 'scroll-x' }, table);
}

export function openContext(id) {
  const build = () => {
    const state = store.get();
    const ctx = state.contexts.find((c) => c.id === id);
    if (!ctx) return h('p', { class: 'muted' }, 'Gone.');
    const checks = state.checks.filter((k) => k.contextId === id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const latest = checks[0];
    const r = latest ? scoreCheck(latest, state.convictions, state.domains) : null;
    const place = impliedPlace(state.contexts, ctx);
    const placeResult = place && place.id !== ctx.id ? scorer(state)(place) : null;
    const placeRoots = placeResult?.byDomain.find((d) => d.domain.id === 'roots');

    const brings = state.contexts.filter((c) => c.placeId === id && c.kind !== 'place');
    const notes = state.notes.filter((n) => (n.contextIds || []).includes(id))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const acts = state.actions.filter((a) => (a.contextIds || []).includes(id) && !a.done);

    return frag(
      h('div', { class: 'row wrap', style: 'margin-bottom:10px' },
        h('span', { class: 'chip' }, byId(CONTEXT_KINDS, ctx.kind)?.label || ''),
        h('span', { class: 'chip' }, byId(CONTEXT_STATUS, ctx.status)?.label || ''),
        h('button', { class: 'chip', onClick: () => editContext(ctx) }, 'Edit')),

      ctx.notes ? h('p', { class: 'muted' }, ctx.notes) : null,

      // For anything that isn't a place: where would this actually land us?
      ctx.kind !== 'place'
        ? h('div', { class: 'card' },
          h('div', { class: 'small muted' }, 'If we said yes, we\'d live in'),
          place
            ? frag(
              h('div', { class: 'row spread' },
                h('strong', {}, place.name),
                h('span', { class: 'small muted tnum' }, placeRoots?.rated ? `${Math.round(placeRoots.pct * 100)}% roots` : 'not checked')),
              h('button', { class: 'icon-btn', style: 'margin-top:10px', onClick: () => openContext(place.id) }, 'Open the place'))
            : frag(
              h('strong', { class: 'lv-tension' }, 'Not answered yet'),
              h('p', { class: 'small muted', style: 'margin:6px 0 10px' },
                'This is the question under the question. Until you know where it puts you, you can\'t weigh it.'),
              h('button', { class: 'btn sm', onClick: () => editContext(ctx) }, 'Answer it')))
        : null,

      h('div', { class: 'card' },
        r?.rated
          ? frag(
            h('div', { class: 'row spread' },
              h('strong', { class: 'tnum' }, `${r.degrees}° off — ${readingWord(r.pct)}`),
              h('span', { class: 'small muted' }, relDate(latest.date, today()))),
            h('div', { style: 'margin-top:12px' }, domainBars(r)),
            latest.summary ? h('p', { class: 'small muted', style: 'margin:12px 0 0; font-style:italic' }, `"${latest.summary}"`) : null,
            (() => { const s = sparkline(checks, state); return s ? h('div', { style: 'margin-top:12px' }, s) : null; })(),
          )
          : h('p', { class: 'muted', style: 'margin:0' }, 'No reading yet.'),
        h('button', { class: 'btn primary block', style: 'margin-top:14px', onClick: () => runCheck(id, latest) },
          latest ? 'Run a new check' : 'Run the first check')),

      h('div', { class: 'card' },
        horizonLine(ctx),
        latest ? usLine(latest) : null),

      brings.length ? h('div', {},
        sectionHead('What would bring us here'),
        h('div', { class: 'card' }, brings.map((b) => {
          const br = scorer(state)(b);
          return h('button', { class: 'card-tap list-item', onClick: () => openContext(b.id) },
            h('div', { class: 'grow' },
              h('div', { class: 'row spread' },
                h('strong', {}, b.name),
                h('span', { class: 'small muted tnum' }, br?.rated ? `${br.degrees}°` : 'no check')),
              h('div', { class: 'small muted' }, byId(CONTEXT_KINDS, b.kind)?.label || '')));
        })),
      ) : null,

      r?.friction.length ? h('div', {},
        sectionHead('Friction'),
        h('div', { class: 'card' }, r.friction.map((f) => h('div', { class: 'list-item' },
          h('span', { class: `dot lv-${f.level.id}`, style: 'margin-top:7px' }),
          h('div', { class: 'grow' },
            h('div', { class: 'row spread' }, h('strong', {}, f.conviction.title), h('span', { class: `pill lv-${f.level.id}` }, f.level.label)),
            f.rating?.note ? h('div', { class: 'small muted' }, f.rating.note) : null,
            h('div', { class: 'row', style: 'margin-top:8px' },
              h('button', {
                class: 'icon-btn',
                onClick: () => editAction(null, { title: `Ask about ${f.conviction.title.toLowerCase()} — ${ctx.name}`, convictionIds: [f.conviction.id], contextIds: [id] }),
              }, 'Follow up')))))),
      ) : null,

      r?.unknown.length ? h('p', { class: 'small muted' },
        `Still unknown: ${r.unknown.map((u) => u.conviction.title).join(', ')}.`) : null,

      checks.length > 1 ? h('div', {},
        sectionHead('History'),
        h('div', { class: 'card' }, checks.map((k) => {
          const kr = scoreCheck(k, state.convictions, state.domains);
          return h('button', { class: 'card-tap list-item', onClick: () => runCheck(id, k) },
            h('div', { class: 'grow' },
              h('div', { class: 'row spread' },
                h('strong', {}, fmtDate(k.date)),
                h('span', { class: 'muted tnum' }, kr.rated ? `${kr.degrees}°` : '—')),
              k.summary ? h('div', { class: 'small muted truncate' }, k.summary) : null));
        })),
      ) : null,

      acts.length ? h('div', {},
        sectionHead('Open follow-ups'),
        h('div', { class: 'card' }, acts.map((a) => h('button', { class: 'card-tap list-item', onClick: () => editAction(a) },
          h('div', { class: 'grow' }, h('div', {}, a.title),
            a.due ? h('div', { class: 'small muted' }, relDate(a.due, today())) : null)))),
      ) : null,

      h('div', {},
        sectionHead('Log entries', 'Add', () => editNote(null, { contextIds: [id] })),
        notes.length
          ? h('div', { class: 'card' }, notes.slice(0, 8).map((n) => h('div', { class: 'list-item' },
            h('div', { class: 'grow' },
              h('div', { class: 'small muted' }, relDate(n.date, today())),
              h('div', {}, n.title || n.body.slice(0, 70))))))
          : h('p', { class: 'small muted' }, 'Nothing logged against this yet.')),
    );
  };

  openSheet(() => store.get().contexts.find((c) => c.id === id)?.name || 'Context', build);
}

function placeCard(state, { place, result, roots }) {
  const hz = byId(HORIZONS, place.horizon) || HORIZONS[0];
  const brings = state.contexts.filter((c) => c.placeId === place.id && c.kind !== 'place');
  const card = h('button', { class: 'card card-tap', onClick: () => openContext(place.id) },
    h('div', { class: 'row spread' },
      h('div', { class: 'grow' },
        h('strong', {}, place.name),
        h('div', { class: 'small muted' },
          [byId(CONTEXT_STATUS, place.status)?.label, hz.label].filter(Boolean).join(' · '))),
      h('div', { style: 'text-align:right' },
        h('div', { class: 'tnum', style: 'font-weight:600' }, roots?.rated ? `${Math.round(roots.pct * 100)}%` : '—'),
        h('div', { class: 'small muted' }, 'roots'))),
    result?.rated ? h('div', { style: 'margin-top:12px' }, domainBars(result)) : h('div', { class: 'small muted', style: 'margin-top:8px' }, 'No check yet'),
    brings.length
      ? h('div', { class: 'small muted', style: 'margin-top:10px' },
        `Would take us there: ${brings.map((b) => b.name).join(', ')}`)
      : null,
    result?.dealbreakers.length
      ? h('div', { class: 'small lv-conflict', style: 'margin-top:8px' },
        `${result.dealbreakers.length} non-negotiable${result.dealbreakers.length > 1 ? 's' : ''} in the red`)
      : null);
  return card;
}

export function render(state) {
  const view = h('div', {});
  const score = scorer(state);

  view.append(h('div', { class: 'card ask' },
    h('h2', { style: 'margin:0' }, 'Where are we going to raise our family?'),
    h('p', { class: 'small muted', style: 'margin:6px 0 0' },
      'Everything else is an answer to this one. A network, a church, a role — each one is a way of ending up somewhere.')));

  const places = placesByRoots(state, score);

  view.append(sectionHead('Places', 'Add', () => editContext(null, { kind: 'place' })));
  if (!places.length) {
    view.append(empty('No places yet. Put down where you are, and anywhere you\'d genuinely consider.', 'Add a place', () => editContext(null, { kind: 'place' })));
  } else {
    places.forEach((p) => view.append(placeCard(state, p)));
  }

  // Places first, then everything else that's been checked — you're choosing
  // between all of them, not just between towns.
  const rated = [
    ...places.filter((p) => p.result?.rated).map((p) => ({ ctx: p.place, r: p.result })),
    ...state.contexts.filter((c) => c.kind !== 'place')
      .map((ctx) => ({ ctx, r: score(ctx) }))
      .filter((x) => x.r?.rated),
  ];
  if (rated.length > 1) {
    view.append(sectionHead('Side by side'));
    view.append(h('div', { class: 'card' },
      compareTable(state, rated),
      h('p', { class: 'small muted', style: 'margin:10px 0 0' }, 'Percent aligned per area. Higher is closer to your heading.')));
  }

  // Everything that isn't a place, grouped by whether you've answered where it lands you.
  const others = state.contexts.filter((c) => c.kind !== 'place');
  const homeless = others.filter((c) => !impliedPlace(state.contexts, c));
  const placed = others.filter((c) => impliedPlace(state.contexts, c));

  if (homeless.length) {
    view.append(sectionHead('Where would these put us?'));
    const card = h('div', { class: 'card' });
    homeless.forEach((c) => {
      const r = score(c);
      card.append(h('button', { class: 'card-tap list-item', onClick: () => openContext(c.id) },
        h('div', { class: 'grow' },
          h('div', { class: 'row spread' },
            h('strong', {}, c.name),
            h('span', { class: 'small muted tnum' }, r?.rated ? `${r.degrees}°` : 'no check')),
          h('div', { class: 'small lv-tension' }, 'No place attached yet'))));
    });
    view.append(card);
  }

  if (placed.length) {
    view.append(sectionHead('Tied to a place'));
    const card = h('div', { class: 'card' });
    placed.forEach((c) => {
      const r = score(c);
      const place = impliedPlace(state.contexts, c);
      card.append(h('button', { class: 'card-tap list-item', onClick: () => openContext(c.id) },
        h('div', { class: 'grow' },
          h('div', { class: 'row spread' },
            h('strong', {}, c.name),
            h('span', { class: 'small muted tnum' }, r?.rated ? `${r.degrees}°` : 'no check')),
          h('div', { class: 'small muted' }, `${byId(CONTEXT_KINDS, c.kind)?.label} · would put us in ${place.name}`))));
    });
    view.append(card);
  }

  view.append(h('button', { class: 'btn block', style: 'margin-top:18px', onClick: () => editContext() }, 'Add something to weigh'));
  return view;
}

export const title = 'Where';
