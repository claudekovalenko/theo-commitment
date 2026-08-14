// Pieces shared between the compass and a context's detail sheet.

import { US_LEVELS, HORIZONS, byId, readingWord } from './../model.js';
import { h } from './../ui.js';

/** One meter per domain — the whole point of the app in six rows. */
export function domainBars(result, { onPick } = {}) {
  const wrap = h('div', { class: 'domains' });
  result.byDomain.forEach((d) => {
    const pct = d.rated ? Math.round(d.pct * 100) : null;
    const row = h(onPick ? 'button' : 'div', {
      class: `domain-row${onPick ? ' card-tap' : ''}`,
      onClick: onPick ? () => onPick(d) : null,
    },
    h('div', { class: 'row spread' },
      h('span', { class: 'row', style: 'gap:7px' },
        h('span', { class: 'dot' }),
        h('span', {}, d.domain.label),
        d.domain.primary ? h('span', { class: 'small muted' }, '· first') : null),
      h('span', { class: 'small muted tnum' }, pct === null ? 'not rated' : `${pct}%`)),
    h('div', { class: 'meter' }, h('i', { style: `width:${pct ?? 0}%` })));

    row.querySelector('.dot').style.color = d.domain.color;
    const fill = row.querySelector('.meter > i');
    fill.style.background = d.domain.color;
    if (!d.rated) fill.style.opacity = '.25';
    if (d.dealbreakers.length) row.classList.add('domain-alert');
    wrap.append(row);
  });
  return wrap;
}

/** Marriage isn't scored — it's asked. */
export function usLine(check, { compact = false } = {}) {
  const level = byId(US_LEVELS, check?.us?.level) || byId(US_LEVELS, 'na');
  if (level.id === 'na' && compact) return null;
  return h('div', { class: 'row spread us-line' },
    h('span', { class: 'small muted' }, 'Us'),
    h('span', { class: `small pill lv-${level.tone}` }, level.label));
}

export function horizonLine(ctx) {
  const hz = byId(HORIZONS, ctx.horizon) || HORIZONS[0];
  return h('div', { class: 'row spread' },
    h('span', { class: 'small muted' }, 'Could we still be here in ten years?'),
    h('span', { class: 'small' }, hz.label));
}

export function readingLine(result) {
  return `${result.rated ? `${result.degrees}° off — ` : ''}${readingWord(result.pct)}`;
}
