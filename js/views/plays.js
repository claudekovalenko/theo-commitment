// Places, churches, networks and roles — and how each one reads across every
// domain, side by side, over time.

import * as store from './../store.js';
import { today } from './../store.js';
import {
  scoreCheck, latestCheck, readingWord, byId, CONTEXT_KINDS, CONTEXT_STATUS, HORIZONS,
} from './../model.js';
import { h, frag, empty, sectionHead, openSheet, relDate, fmtDate } from './../ui.js';
import { editContext, runCheck, editNote, editAction } from './../editors.js';
import { domainBars, usLine, horizonLine } from './parts.js';

const readingOf = (state, ctx) => {
  const check = latestCheck(state.checks, ctx.id);
  return { check, r: check ? scoreCheck(check, state.convictions, state.domains) : null };
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

/** Contexts down the side, domains across the top. The comparison view. */
function compareTable(state, rated) {
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
  rated.forEach(({ ctx, r }) => {
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

    const notes = state.notes.filter((n) => (n.contextIds || []).includes(id))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const acts = state.actions.filter((a) => (a.contextIds || []).includes(id) && !a.done);

    return frag(
      h('div', { class: 'row wrap', style: 'margin-bottom:10px' },
        h('span', { class: 'chip' }, byId(CONTEXT_KINDS, ctx.kind)?.label || ''),
        h('span', { class: 'chip' }, byId(CONTEXT_STATUS, ctx.status)?.label || ''),
        h('button', { class: 'chip', onClick: () => editContext(ctx) }, 'Edit')),

      ctx.notes ? h('p', { class: 'muted' }, ctx.notes) : null,

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

function contextCard(state, ctx) {
  const { r } = readingOf(state, ctx);
  const hz = byId(HORIZONS, ctx.horizon) || HORIZONS[0];
  const card = h('button', { class: 'card card-tap', onClick: () => openContext(ctx.id) },
    h('div', { class: 'row spread' },
      h('div', { class: 'grow' },
        h('strong', {}, ctx.name),
        h('div', { class: 'small muted' },
          [byId(CONTEXT_KINDS, ctx.kind)?.label, byId(CONTEXT_STATUS, ctx.status)?.label].filter(Boolean).join(' · '))),
      h('div', { style: 'text-align:right' },
        h('div', { class: 'tnum', style: 'font-weight:600' }, r?.rated ? `${r.degrees}°` : '—'),
        h('div', { class: 'small muted' }, r?.rated ? readingWord(r.pct) : 'No check'))),
    r?.rated ? h('div', { style: 'margin-top:12px' }, domainBars(r)) : null,
    ctx.kind === 'place' ? h('div', { class: 'small muted', style: 'margin-top:10px' }, `Ten-year test: ${hz.label.toLowerCase()}`) : null,
    r?.dealbreakers.length
      ? h('div', { class: 'small lv-conflict', style: 'margin-top:8px' },
        `${r.dealbreakers.length} non-negotiable${r.dealbreakers.length > 1 ? 's' : ''} in the red`)
      : null);
  return card;
}

export function render(state) {
  const view = h('div', {});
  view.append(h('p', { class: 'muted small' },
    'Everything you\'re weighing, read across all five areas of life. A check is just you, rating it honestly.'));

  if (!state.contexts.length) {
    view.append(empty('Nothing here yet. Start with the town you\'re in and one you\'d consider.', 'Add one', () => editContext()));
    return view;
  }

  const rated = state.contexts.map((ctx) => ({ ctx, ...readingOf(state, ctx) })).filter((x) => x.r?.rated);
  if (rated.length > 1) {
    view.append(sectionHead('Side by side'));
    view.append(h('div', { class: 'card' },
      compareTable(state, rated),
      h('p', { class: 'small muted', style: 'margin:10px 0 0' }, 'Percent aligned per area. Higher is closer to your heading.')));
  }

  const groups = [
    ['place', 'Places'],
    ['church', 'Churches'],
    ['network', 'Networks'],
    ['role', 'Roles'],
    ['opportunity', 'Opportunities'],
  ];
  const order = { considering: 0, current: 1, watching: 2, past: 3 };
  groups.forEach(([kind, label]) => {
    const group = state.contexts.filter((c) => c.kind === kind)
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name));
    if (!group.length) return;
    view.append(sectionHead(label, 'Add', () => editContext(null, { kind })));
    group.forEach((c) => view.append(contextCard(state, c)));
  });

  view.append(h('button', { class: 'btn block', style: 'margin-top:14px', onClick: () => editContext() }, 'Add something to weigh'));
  return view;
}

export const title = 'Plays';
