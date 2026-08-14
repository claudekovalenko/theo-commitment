// The target: one piece of ground, how deep you could root in it, and the
// finite list of things standing between you and saying "we're building here".

import * as store from './../store.js';
import { today } from './../store.js';
import { survey, verdict, rankGrounds, byId, HORIZONS, HOME_LEVELS } from './../model.js';
import { h, empty, section, relDate, toast } from './../ui.js';
import {
  walkTheLand, editGround, editBlock, breakGround, captureHesitation, editNote, editPerson,
} from './../editors.js';
import { plot, areaBars, usLine } from './parts.js';
import { openGround } from './land.js';
import { go } from './../router.js';

let focusId = null;

function pick(state) {
  const ranked = rankGrounds(state);
  if (focusId) {
    const found = ranked.find((r) => r.ground.id === focusId);
    if (found) return found;
  }
  return ranked.find((r) => r.ground.stage === 'built') || ranked[0] || null;
}

export function render(state) {
  const view = h('div', {});
  const target = pick(state);

  if (!target) {
    view.append(h('h1', {}, 'Where is the land?'),
      h('p', { class: 'muted' },
        'Put down the first place you\'d actually consider building on — where you are now counts.'),
      empty('No ground yet.', 'Add a place', () => editGround(null, { kind: 'place' })));
    return view;
  }

  const { ground, s } = target;
  const staked = ground.stage === 'built';

  view.append(h('p', { class: 'eyebrow', style: 'margin-bottom:14px' }, 'God first, continually'));

  view.append(h('div', { class: 'row spread', style: 'align-items:flex-end' },
    h('div', {},
      h('div', { class: 'eyebrow' }, staked ? 'Building here' : 'The ground in front of me'),
      h('h1', { style: 'margin:2px 0 0' }, ground.name)),
    h('button', { class: 'icon-btn', onClick: () => openGround(ground.id) }, 'Open')));

  view.append(h('div', { style: 'margin:14px 0 10px' },
    plot(s.depth, { staked, label: staked ? `Stake in the ground ${relDate(ground.stakedAt || today(), today()).toLowerCase()}` : `${Math.round(s.depth * 100)}% rooted · ${Math.round(s.surveyed * 100)}% of the land walked` })));

  view.append(h('p', { class: 'verdict' }, verdict(s)));

  if (s.check) {
    const home = byId(HOME_LEVELS, s.home?.id || 'unknown');
    view.append(h('div', { class: 'card', style: 'margin-top:12px' },
      h('div', { class: 'eyebrow' }, 'The test that decides it'),
      h('div', { class: 'row spread', style: 'margin-top:8px' },
        h('span', { class: 'small' }, 'Kids here, unsupervised'),
        h('span', { class: `small tone-${s.kid.tone}` }, s.kid.label)),
      s.kidNote ? h('div', { class: 'tiny muted' }, s.kidNote) : null,
      h('div', { class: 'row spread', style: 'margin-top:8px' },
        h('span', { class: 'small' }, 'He\'d come back'),
        h('span', { class: `small tone-${s.formation.tone}` }, s.formation.label)),
      s.formationNote ? h('div', { class: 'tiny muted' }, s.formationNote) : null,
      h('div', { class: 'row spread', style: 'margin-top:8px' },
        h('span', { class: 'small' }, 'Would we buy a home here'),
        h('span', { class: `small tone-${home.tone}` }, home.label)),
      s.gate ? h('p', { class: 'tiny tone-thin', style: 'margin:10px 0 0' }, s.gate) : null,
      h('button', { class: 'icon-btn', style: 'margin-top:12px', onClick: () => walkTheLand(ground.id, s.check) }, 'Change my answer')));
  }

  // spiritual family, by name
  view.append(section('Spiritual family here', 'Add', () => editPerson(null, { groundId: ground.id })));
  if (!s.household.length) {
    view.append(h('p', { class: 'muted small' },
      'No one named yet. Intertwined is people you could call at 11pm — if you can\'t name them, the ground isn\'t ready.'));
  } else {
    const rows = h('div', { class: 'rows' });
    s.household.forEach((p) => rows.append(h('button', { class: 'card-tap', onClick: () => editPerson(p) },
      h('div', { class: 'row spread' },
        h('strong', {}, p.name),
        h('span', { class: 'tiny muted' }, p.lastMet ? `last met ${relDate(p.lastMet, today()).toLowerCase()}` : 'never logged')),
      p.nextStep ? h('div', { class: 'tiny muted' }, p.nextStep) : null)));
    view.append(rows);
  }

  if (staked && ground.stakeNote) {
    view.append(h('p', { class: 'small muted', style: 'font-style:italic' }, `"${ground.stakeNote}"`));
  }

  /* ---- the decision ---- */
  if (!staked && ground.stage !== 'ruled-out') {
    // Before you've walked it there's nothing to decide — go look at it first.
    view.append(h('div', { class: 'stack', style: 'margin:16px 0 4px' },
      !s.check
        ? h('button', { class: 'btn primary block', onClick: () => walkTheLand(ground.id) }, 'Walk the land')
        : s.gatedBy
          // Don't invite a man to build where he wouldn't leave his son.
          ? h('button', {
            class: 'btn primary block',
            onClick: () => editBlock(null, { groundId: ground.id, hard: true, title: s.gatedBy }),
          }, 'Name what would have to change')
          : h('button', { class: 'btn primary block', onClick: () => breakGround(ground) },
            s.inTheWay.length ? 'I\'m ready to build here' : 'Break ground here'),
      h('button', { class: 'btn ghost block', onClick: () => captureHesitation(ground) }, 'Not yet — here\'s why'),
      s.gatedBy
        ? h('button', { class: 'btn ghost block small', onClick: () => breakGround(ground) }, 'Decide anyway')
        : null));
  }

  /* ---- what's in the way ---- */
  if (!staked) {
    view.append(section('Between me and yes', s.inTheWay.length ? 'All' : 'Add', () => (s.inTheWay.length ? go('unsettled') : editBlock(null, { groundId: ground.id }))));
    if (!s.inTheWay.length) {
      view.append(h('p', { class: 'muted small' },
        s.check ? 'Nothing. You have your answer — the rest is nerve.' : 'Walk the land first and this list fills itself in.'));
    } else {
      const rows = h('div', { class: 'rows' });
      s.inTheWay.slice(0, 6).forEach((item) => {
        if (item.kind === 'block') {
          const b = item.block;
          rows.append(h('div', { class: 'check' },
            h('input', {
              type: 'checkbox',
              onChange: () => {
                store.update((st) => {
                  const t = st.blocks.find((x) => x.id === b.id);
                  t.status = 'settled';
                  t.settledAt = today();
                });
                toast('Settled');
              },
            }),
            h('button', { class: 'card-tap grow', onClick: () => editBlock(b) },
              h('div', {}, b.title),
              h('div', { class: 'tiny muted' },
                [b.hard ? 'Can\'t decide without it' : null, b.who, b.due ? relDate(b.due, today()) : null]
                  .filter(Boolean).join(' · ') || 'No plan to settle it yet'))));
        } else if (item.kind === 'gate') {
          rows.append(h('button', { class: 'card-tap', onClick: () => walkTheLand(ground.id, s.check) },
            h('div', { class: 'row spread' },
              h('span', { class: 'grow tone-bad' }, item.label),
              h('span', { class: 'tiny muted' }, 'the gate'))));
        } else {
          rows.append(h('button', { class: 'card-tap', onClick: () => walkTheLand(ground.id, s.check) },
            h('div', { class: 'row spread' },
              h('span', { class: 'grow' }, item.label),
              h('span', { class: 'tiny muted' }, 'unsurveyed'))));
        }
      });
      view.append(rows);
    }
  }

  /* ---- the survey ---- */
  view.append(section('The soil', s.check ? 'Walk it again' : 'Walk the land', () => walkTheLand(ground.id, s.check)));
  if (!s.check) {
    view.append(h('p', { class: 'muted small' }, 'Nothing surveyed yet. An hour with this list is worth a month of wondering.'));
  } else {
    view.append(areaBars(s));
    view.append(h('div', { class: 'card', style: 'margin-top:14px' }, usLine(s.check)));
    if (s.missingMusts.length) {
      view.append(h('div', { class: 'card', style: 'margin-top:12px' },
        h('strong', { class: 'tone-bad' }, 'Missing must-haves'),
        h('div', { class: 'rows' }, s.missingMusts.map((m) => h('div', {},
          h('div', {}, m.req.title),
          m.rating?.note ? h('div', { class: 'tiny muted' }, m.rating.note) : null)))));
    }
  }

  /* ---- the other ground ---- */
  const others = rankGrounds(state).filter((r) => r.ground.id !== ground.id);
  if (others.length) {
    view.append(section('Other ground', 'Compare', () => go('land')));
    const rows = h('div', { class: 'rows' });
    others.forEach(({ ground: g, s: gs }) => {
      const hz = byId(HORIZONS, g.horizon) || HORIZONS[0];
      rows.append(h('button', {
        class: 'card-tap', onClick: () => { focusId = g.id; go('target'); },
      },
      h('div', { class: 'row spread' },
        h('strong', {}, g.name),
        h('span', { class: 'tiny muted tnum' }, `${Math.round(gs.depth * 100)}% rooted`)),
      h('div', { class: 'tiny muted' }, [hz.label, gs.inTheWay.length ? `${gs.inTheWay.length} in the way` : 'nothing in the way'].join(' · '))));
    });
    view.append(rows);
  }

  /* ---- the hesitations, said back to you ---- */
  const hesitations = state.notes.filter((n) => n.kind === 'hesitation')
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (hesitations.length) {
    view.append(section('Why I keep not deciding', 'All', () => go('journal')));
    const rows = h('div', { class: 'rows' });
    hesitations.slice(0, 3).forEach((n) => rows.append(h('button', { class: 'card-tap', onClick: () => editNote(n) },
      h('div', { class: 'tiny muted' }, relDate(n.date, today())),
      h('div', { class: 'small' }, n.body.slice(0, 120)))));
    view.append(rows);
    if (hesitations.length > 2) {
      view.append(h('p', { class: 'tiny muted', style: 'margin-top:10px' },
        `You've written this down ${hesitations.length} times. If it's the same reason each time, that's not hesitation — that's an answer.`));
    }
  }

  return view;
}

export const title = 'Good Ground';
