// Everything I'm already carrying.
//
// Not what I might say yes to — what I've already said yes to, how far into
// each one I am, and what it costs a week. Spread thin is a feeling until the
// list exists; then it's arithmetic you can act on.

import * as store from './../store.js';
import { today } from './../store.js';
import { byId } from './../model.js';
import { h, empty, section, relDate, fmtDate, daysBetween } from './../ui.js';
import { editCommitment, editCapacity } from './../editors.js';
import {
  LOAD_KINDS, DEPTH, SERVES, HOLD, GIVING, AFTER, WORTH, commitments, plateRead, matchesConviction,
} from './../plate.js';

export const title = 'What I\'m carrying';

/** The plate: one ring per commitment, thickest where you're furthest in. */
function plateRing(list) {
  const S = 200;
  const c = S / 2;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${S} ${S}`);
  svg.setAttribute('class', 'plate-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${list.length} commitments, drawn by how far into each one you are.`);

  const total = list.reduce((n, x) => n + Math.max(0.6, Number(x.hours) || 1), 0) || 1;
  let angle = -Math.PI / 2;
  const R = 78;
  const inner = 34;

  list.forEach((item) => {
    const share = Math.max(0.6, Number(item.hours) || 1) / total;
    const sweep = share * Math.PI * 2;
    const d = byId(DEPTH, item.depth) || { weight: 0.4, tone: 'unknown' };
    // How far in you are sets how far out the wedge reaches.
    const r = inner + (R - inner) * (0.3 + 0.7 * d.weight);
    const a0 = angle;
    const a1 = angle + sweep - 0.02;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pt = (rad, ang) => `${c + Math.cos(ang) * rad} ${c + Math.sin(ang) * rad}`;
    const large = sweep > Math.PI ? 1 : 0;
    p.setAttribute('d', [
      `M ${pt(inner, a0)}`,
      `L ${pt(r, a0)}`,
      `A ${r} ${r} 0 ${large} 1 ${pt(r, a1)}`,
      `L ${pt(inner, a1)}`,
      `A ${inner} ${inner} 0 ${large} 0 ${pt(inner, a0)}`,
      'Z',
    ].join(' '));
    p.setAttribute('class', `wedge tone-${d.tone}`);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    t.textContent = `${item.name} — ${(byId(DEPTH, item.depth) || {}).label || 'depth not set'}`;
    p.append(t);
    svg.append(p);
    angle += sweep;
  });

  const hole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  Object.entries({ cx: c, cy: c, r: inner - 2, class: 'plate-hole' })
    .forEach(([k, v]) => hole.setAttribute(k, v));
  svg.append(hole);

  const n = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  Object.entries({ x: c, y: c + 6, 'text-anchor': 'middle', class: 'plate-count' })
    .forEach(([k, v]) => n.setAttribute(k, v));
  n.textContent = String(list.length);
  svg.append(n);

  return svg;
}

export function render(state) {
  const view = h('div', {});
  const r = plateRead(state);

  view.append(h('h1', {}, 'What I\'m carrying'),
    h('p', { class: 'muted small' },
      'Everything you\'ve already said yes to, deepest first. Being spread thin isn\'t about '
      + 'how many things you\'re attached to — it\'s about how many you\'re near the middle of.'));

  view.append(h('p', { class: `eyebrow tone-${r.tone}`, style: 'margin-top:16px' }, r.word));
  view.append(h('p', { class: 'verdict', style: 'margin-top:2px' }, r.why));

  if (!r.list.length) {
    view.append(empty('Nothing on the plate yet.', 'Add the first one', () => editCommitment()));
    return view;
  }

  view.append(h('div', { class: 'plate-wrap' }, plateRing(r.list)));

  /* ---- the numbers ---- */
  const facts = h('div', { class: 'card' });
  const line = (label, value, tone) => h('div', { class: 'row spread' },
    h('span', { class: 'small' }, label),
    h('span', { class: `small ${tone ? `tone-${tone}` : 'muted'}` }, value));
  facts.append(h('button', { class: 'row spread', style: 'width:100%;background:none;border:0;font:inherit;color:inherit;cursor:pointer;padding:0', onClick: editCapacity },
    h('span', { class: 'small' }, 'Hours a week'),
    h('span', { class: `small tone-${r.capacity && r.hours > r.capacity ? 'bad' : 'good'}` },
      r.capacity ? `${r.hours} of ${r.capacity}` : `${r.hours} — no ceiling set`)));
  facts.append(line('Leading or holding up', String(r.deep.length), r.deep.length >= 3 ? 'bad' : 'ok'));
  if (r.competes.length) facts.append(line('Takes from what I\'m going for', String(r.competes.length), 'bad'));
  if (r.openEnded.length) facts.append(line('With no end date', String(r.openEnded.length), 'thin'));
  if (r.best.length) facts.append(line('Getting my best', String(r.best.length), 'good'));
  if (r.leftovers.length) facts.append(line('Getting my leftovers', String(r.leftovers.length), 'bad'));
  if (r.throughs.length) facts.append(line('Seeing through to the end', String(r.throughs.length), 'ok'));
  if (r.elsewhere.length) {
    facts.append(line(`Away from ${state.calling?.place}`, String(r.elsewhere.length), 'bad'));
  }
  view.append(facts);

  /* ---- the list, deepest first ---- */
  view.append(section('Deepest first', 'Add', () => editCommitment()));
  const rows = h('div', { class: 'rows' });
  r.list.forEach((c) => {
    const d = byId(DEPTH, c.depth);
    const sv = byId(SERVES, c.serves);
    const hd = byId(HOLD, c.hold);
    const gv = byId(GIVING, c.giving);
    const af = byId(AFTER, c.after);
    const wo = byId(WORTH, c.worth);
    const ministry = state.contexts.find((x) => x.id === c.groundId);
    rows.append(h('button', { class: 'card-tap', onClick: () => editCommitment(c) },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, c.name),
        h('span', { class: `small tone-${d?.tone || 'unknown'}` }, d?.short || 'Depth not set')),
      h('div', { class: 'tiny muted' },
        [byId(LOAD_KINDS, c.kind)?.label,
          c.where,
          Number(c.hours) ? `${c.hours}h a week` : 'hours not set',
          c.ends ? `until ${fmtDate(c.ends)}` : 'no end date',
        ].filter(Boolean).join(' · ')),
      ministry ? h('div', { class: 'tiny' }, `With ${ministry.name} — one you're weighing`) : null,
      c.worthKeeping
        ? h('div', { class: 'tiny tone-good', style: 'margin-top:4px' }, `Worth being there for: ${c.worthKeeping}`)
        : null,
      (() => {
        const conv = c.worthKeeping ? matchesConviction(state, c.worthKeeping) : null;
        return conv ? h('div', { class: 'tiny muted' }, `That's one of your convictions — ${conv.title.toLowerCase()}`) : null;
      })(),
      c.worthLess ? h('div', { class: 'tiny muted' }, `Less so: ${c.worthLess}`) : null,
      h('div', { class: 'row wrap', style: 'gap:2px 10px; margin-top:4px' },
        wo && wo.id !== 'unsure' ? h('span', { class: `tiny tone-${wo.tone}` }, wo.label) : null,
        gv && gv.id !== 'unsure' ? h('span', { class: `tiny tone-${gv.tone}` }, `Getting ${gv.label.toLowerCase()}`) : null,
        hd && hd.id !== 'unsure' ? h('span', { class: `tiny tone-${hd.tone}` }, hd.label) : null,
        af && af.id === 'finish' ? h('span', { class: 'tiny muted' }, 'then stop') : null,
        sv && sv.id !== 'unsure' ? h('span', { class: `tiny tone-${sv.tone}` }, sv.label) : null),
      c.wellDone ? h('div', { class: 'tiny muted', style: 'margin-top:4px' }, `Done well: ${c.wellDone}`) : null));
  });
  view.append(rows);

  /* ---- what's finished ---- */
  const done = (state.commitments || []).filter((c) => c.ended);
  if (done.length) {
    view.append(section(`Put down — ${done.length}`));
    const old = h('div', { class: 'rows' });
    done.forEach((c) => old.append(h('button', { class: 'card-tap', onClick: () => editCommitment(c) },
      h('div', { class: 'row spread' },
        h('span', { class: 'grow small' }, c.name),
        h('span', { class: 'tiny muted' }, c.endedAt ? fmtDate(c.endedAt) : '')))));
    view.append(old);
  }

  return view;
}
