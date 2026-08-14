// The drawing that carries the whole app: a piece of ground, and how deep you
// could actually root in it. Depth is earned by surveying the land and by
// settling what's in the way — it isn't a mood.

import { US_LEVELS, byId } from './../model.js';
import { h } from './../ui.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
};

const GROUND_Y = 58;
const MAX_DEPTH = 104;
const ENOUGH = 0.8; // roots past this line are deep enough to stay

/**
 * @param depth 0..1
 * @param opts.staked  true once you've committed — the sapling becomes a home
 */
export function plot(depth, { staked = false, label = '' } = {}) {
  const svg = el('svg', {
    class: 'plot', viewBox: '0 0 320 176', role: 'img',
    'aria-label': `${Math.round(depth * 100)} per cent rooted${staked ? ', built on' : ''}`,
  });

  // soil below the line
  svg.append(el('rect', { x: 0, y: GROUND_Y, width: 320, height: 118, fill: 'var(--sunk)', rx: 6 }));
  for (let i = 0; i < 7; i++) {
    svg.append(el('line', {
      x1: 14 + i * 46, y1: GROUND_Y + 16 + (i % 3) * 22, x2: 44 + i * 46, y2: GROUND_Y + 16 + (i % 3) * 22,
      stroke: 'var(--line)', 'stroke-width': 2, 'stroke-linecap': 'round',
    }));
  }

  // the "deep enough" line
  const enoughY = GROUND_Y + MAX_DEPTH * ENOUGH;
  svg.append(el('line', {
    x1: 8, y1: enoughY, x2: 312, y2: enoughY,
    stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '3 5', opacity: .55,
  }));
  const cap = el('text', {
    x: 312, y: enoughY - 6, 'text-anchor': 'end',
    fill: 'var(--muted)', 'font-size': 10, 'letter-spacing': .5,
  });
  cap.textContent = 'deep enough to stay';
  svg.append(cap);

  // the ground line itself
  svg.append(el('rect', { x: 6, y: GROUND_Y - 4, width: 308, height: 8, rx: 4, fill: 'var(--soil)' }));

  // roots
  const d = Math.max(0.04, Math.min(1, depth));
  const strands = [
    { x: 160, len: 1, w: 7 },
    { x: 96, len: 0.78, w: 4.5 },
    { x: 224, len: 0.78, w: 4.5 },
    { x: 54, len: 0.5, w: 2.6 },
    { x: 266, len: 0.5, w: 2.6 },
  ];
  strands.forEach((s) => {
    const end = GROUND_Y + MAX_DEPTH * d * s.len;
    const midY = (GROUND_Y + end) / 2;
    const bend = (s.x - 160) * 0.25;
    svg.append(el('path', {
      d: `M160 ${GROUND_Y} Q ${160 + bend} ${midY} ${s.x} ${end}`,
      fill: 'none', stroke: 'var(--soil)', 'stroke-width': s.w, 'stroke-linecap': 'round', opacity: .92,
    }));
  });

  // what stands above the line
  if (staked) {
    svg.append(el('path', { d: 'M160 8 L196 34 L196 58 L124 58 L124 34 Z', fill: 'var(--moss)' }));
    svg.append(el('rect', { x: 152, y: 40, width: 16, height: 18, fill: 'var(--paper)' }));
  } else {
    const grow = 0.4 + d * 0.6;
    const trunkTop = GROUND_Y - 22 - 20 * grow;
    svg.append(el('path', {
      d: `M160 ${GROUND_Y} L160 ${trunkTop}`,
      stroke: 'var(--moss)', 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none',
    }));
    // two boughs and a modest crown — a sapling, not a lollipop
    [-1, 1].forEach((side) => {
      svg.append(el('path', {
        d: `M160 ${trunkTop + 16} q ${side * 12} -4 ${side * 20} -14`,
        stroke: 'var(--moss)', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none',
      }));
      svg.append(el('circle', { cx: 160 + side * (20 + 4 * grow), cy: trunkTop + 2 - 2 * grow, r: 8 + 4 * grow, fill: 'var(--moss)' }));
    });
    svg.append(el('circle', { cx: 160, cy: trunkTop - 4, r: 11 + 7 * grow, fill: 'var(--moss)' }));
  }

  if (!label) return svg;
  return h('figure', { style: 'margin:0' }, svg, h('figcaption', { class: 'tiny muted center', style: 'margin-top:6px' }, label));
}

/** One bar per area of life. */
export function areaBars(s) {
  const wrap = h('div', { class: 'areas' });
  s.byArea.forEach((a) => {
    const pct = a.rated ? Math.round(a.fit * 100) : null;
    const row = h('div', { class: 'area-row' },
      h('div', { class: 'row spread' },
        h('span', { class: 'row', style: 'gap:7px' },
          h('span', { class: 'dot' }),
          h('span', { class: 'small' }, a.domain.label)),
        h('span', { class: 'tiny muted tnum' }, pct === null ? 'unsurveyed' : `${pct}%`)),
      h('div', { class: 'bar' }, h('i', { style: `width:${pct ?? 0}%` })));
    row.querySelector('.dot').style.color = a.domain.color;
    const fill = row.querySelector('.bar > i');
    fill.style.background = a.domain.color;
    if (!a.rated) fill.style.opacity = '.2';
    wrap.append(row);
  });
  return wrap;
}

export function usLine(check) {
  const level = byId(US_LEVELS, check?.us?.level) || byId(US_LEVELS, 'na');
  return h('div', { class: 'row spread' },
    h('span', { class: 'small muted' }, 'Where the two of us land'),
    h('span', { class: `small tone-${level.tone}` }, level.label));
}
