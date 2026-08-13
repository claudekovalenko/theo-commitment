// "Plays" — the organizations, churches and roles you're weighing, and how
// each one reads against your convictions over time.

import * as store from './../store.js';
import { today } from './../store.js';
import { scoreCheck, latestCheck, readingWord, byId, CONTEXT_KINDS, CONTEXT_STATUS } from './../model.js';
import { h, frag, empty, sectionHead, openSheet, relDate, fmtDate } from './../ui.js';
import { editContext, runCheck, editNote, editAction } from './../editors.js';

function sparkline(checks, convictions) {
  const pts = [...checks].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-10);
  if (pts.length < 2) return null;
  const bar = h('div', { class: 'spark' });
  pts.forEach((k) => {
    const r = scoreCheck(k, convictions);
    bar.append(h('i', { style: `height:${Math.max(3, Math.round((r.pct || 0) * 26))}px`, title: `${fmtDate(k.date)} — ${Math.round((r.pct || 0) * 100)}%` }));
  });
  return bar;
}

function readingRow(state, ctx) {
  const check = latestCheck(state.checks, ctx.id);
  const r = check ? scoreCheck(check, state.convictions) : null;
  return h('div', {},
    h('div', { class: 'row spread' },
      h('div', { class: 'grow' },
        h('strong', {}, ctx.name),
        h('div', { class: 'small muted' },
          [byId(CONTEXT_KINDS, ctx.kind)?.label, byId(CONTEXT_STATUS, ctx.status)?.label].filter(Boolean).join(' · '))),
      h('div', { style: 'text-align:right' },
        h('div', { style: 'font-weight:600' }, r?.rated ? `${r.degrees}°` : '—'),
        h('div', { class: 'small muted' }, r?.rated ? readingWord(r.pct) : 'No check'))),
    r?.rated ? h('div', { class: 'meter', style: 'margin-top:10px' }, h('i', { style: `width:${Math.round(r.pct * 100)}%` })) : null,
    r?.dealbreakers.length
      ? h('div', { class: 'small lv-conflict', style: 'margin-top:8px' },
        `${r.dealbreakers.length} non-negotiable${r.dealbreakers.length > 1 ? 's' : ''} in the red`)
      : null);
}

export function openContext(id) {
  const build = () => {
    const state = store.get();
    const ctx = state.contexts.find((c) => c.id === id);
    if (!ctx) return h('p', { class: 'muted' }, 'Gone.');
    const checks = state.checks.filter((k) => k.contextId === id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const latest = checks[0];
    const r = latest ? scoreCheck(latest, state.convictions) : null;

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
              h('strong', {}, `${r.degrees}° off — ${readingWord(r.pct)}`),
              h('span', { class: 'small muted' }, relDate(latest.date, today()))),
            h('div', { class: 'meter', style: 'margin-top:8px' }, h('i', { style: `width:${Math.round(r.pct * 100)}%` })),
            latest.summary ? h('p', { class: 'small muted', style: 'margin:10px 0 0; font-style:italic' }, `"${latest.summary}"`) : null,
            (() => { const s = sparkline(checks, state.convictions); return s ? h('div', { style: 'margin-top:12px' }, s) : null; })(),
          )
          : h('p', { class: 'muted', style: 'margin:0' }, 'No reading yet.'),
        h('button', { class: 'btn primary block', style: 'margin-top:14px', onClick: () => runCheck(id) }, latest ? 'Run a new check' : 'Run the first check')),

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
                onClick: () => editAction(null, { title: `Ask ${ctx.name} about ${f.conviction.title.toLowerCase()}`, convictionIds: [f.conviction.id], contextIds: [id] }),
              }, 'Follow up')))))),
      ) : null,

      r?.unknown.length ? h('p', { class: 'small muted' },
        `Still unknown: ${r.unknown.map((u) => u.conviction.title).join(', ')}.`) : null,

      checks.length > 1 ? h('div', {},
        sectionHead('History'),
        h('div', { class: 'card' }, checks.map((k) => {
          const kr = scoreCheck(k, state.convictions);
          return h('button', { class: 'card-tap list-item', onClick: () => runCheck(id, k) },
            h('div', { class: 'grow' },
              h('div', { class: 'row spread' },
                h('strong', {}, fmtDate(k.date)),
                h('span', { class: 'muted' }, kr.rated ? `${kr.degrees}°` : '—')),
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

export function render(state) {
  const view = h('div', {});
  view.append(h('p', { class: 'muted small' },
    'The plays you\'re weighing. A check is just you, rating them honestly against your own convictions.'));

  if (!state.contexts.length) {
    view.append(empty('Nothing here yet. Add the network, church or role you\'re actually weighing.', 'Add a context', () => editContext()));
    return view;
  }

  const order = { current: 0, considering: 1, watching: 2, past: 3 };
  [...state.contexts]
    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.name.localeCompare(b.name))
    .forEach((c) => view.append(h('button', { class: 'card card-tap', onClick: () => openContext(c.id) }, readingRow(state, c))));

  view.append(h('button', { class: 'btn block', style: 'margin-top:14px', onClick: () => editContext() }, 'Add a context'));
  return view;
}

export const title = 'Plays';
