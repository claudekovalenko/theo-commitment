// Everything standing between you and a decision, in one list. Hesitation with
// a name on it stops being hesitation.

import * as store from './../store.js';
import { today } from './../store.js';
import { survey } from './../model.js';
import { h, empty, section, relDate, toast } from './../ui.js';
import { editBlock, walkTheLand } from './../editors.js';

function blockRow(state, b) {
  const ground = state.contexts.find((g) => g.id === b.groundId);
  const overdue = b.due && b.status === 'open' && b.due <= today();
  return h('div', { class: 'check' },
    h('input', {
      type: 'checkbox', checked: b.status === 'settled',
      onChange: (e) => {
        const settled = e.target.checked;
        store.update((s) => {
          const t = s.blocks.find((x) => x.id === b.id);
          t.status = settled ? 'settled' : 'open';
          t.settledAt = settled ? today() : '';
        });
        toast(settled ? 'Settled' : 'Back in the way');
      },
    }),
    h('button', { class: 'card-tap grow', onClick: () => editBlock(b) },
      h('div', { style: b.status === 'settled' ? 'opacity:.55' : '' },
        b.hard ? h('span', { class: 'tone-bad' }, '● ') : null, b.title),
      h('div', { class: `tiny ${overdue ? 'tone-thin' : 'muted'}` },
        [ground ? ground.name : 'Everywhere', b.who, b.due ? relDate(b.due, today()) : null]
          .filter(Boolean).join(' · ')),
      b.wouldSettle ? h('div', { class: 'tiny muted' }, `Settled by: ${b.wouldSettle}`) : null));
}

export function render(state) {
  const view = h('div', {});
  const open = state.blocks.filter((b) => b.status === 'open');
  const settled = state.blocks.filter((b) => b.status === 'settled')
    .sort((a, b) => ((a.settledAt || '') < (b.settledAt || '') ? 1 : -1));

  view.append(h('h1', {}, 'In the way'),
    h('p', { class: 'muted small' },
      open.length
        ? 'Name it, say what would settle it, and it stops being a feeling.'
        : 'Nothing named. Either the road is clear, or you haven\'t said the quiet part yet.'));

  const hard = open.filter((b) => b.hard);
  const soft = open.filter((b) => !b.hard);

  if (hard.length) {
    view.append(section('Can\'t decide without these'));
    view.append(h('div', { class: 'rows' }, hard.map((b) => blockRow(state, b))));
  }
  if (soft.length) {
    view.append(section('Would like to know'));
    view.append(h('div', { class: 'rows' }, soft.map((b) => blockRow(state, b))));
  }

  // unsurveyed requirements are also in the way, just of a different kind
  const gaps = state.contexts
    .filter((g) => g.kind === 'place' && g.stage !== 'ruled-out')
    .map((g) => ({ g, s: survey(state, g) }))
    .filter((x) => x.s.check && x.s.unsurveyed.length);
  if (gaps.length) {
    view.append(section('Still unsurveyed'));
    const rows = h('div', { class: 'rows' });
    gaps.forEach(({ g, s }) => rows.append(h('button', { class: 'card-tap', onClick: () => walkTheLand(g.id, s.check) },
      h('div', { class: 'row spread' },
        h('strong', {}, g.name),
        h('span', { class: 'tiny muted tnum' }, `${s.unsurveyed.length} unanswered`)),
      h('div', { class: 'tiny muted truncate' }, s.unsurveyed.slice(0, 3).map((u) => u.req.title).join(', ')))));
    view.append(rows);
  }

  if (!open.length && !gaps.length) {
    view.append(empty('Nothing in the way. That means the next move is a decision, not more research.', 'Add something anyway', () => editBlock()));
  }

  if (settled.length) {
    view.append(section(`Settled (${settled.length})`));
    view.append(h('div', { class: 'rows' }, settled.slice(0, 10).map((b) => blockRow(state, b))));
  }

  view.append(h('button', { class: 'btn primary block', style: 'margin-top:20px', onClick: () => editBlock() }, 'Add something in the way'));
  return view;
}

export const title = 'In the way';
