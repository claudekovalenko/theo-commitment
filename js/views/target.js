// The target: one piece of ground, how deep you could root in it, and the
// finite list of things standing between you and saying "we're building here".

import * as store from './../store.js';
import { today } from './../store.js';
import {
  survey, verdict, rankGrounds, byId, HORIZONS, HOME_LEVELS, KINDS, PLACE_MODES, STAGES,
  callingPlace, withinCalling,
} from './../model.js';
import { h, empty, section, relDate, daysBetween, toast } from './../ui.js';
import {
  walkTheLand, editGround, editBlock, breakGround, captureHesitation, editNote, editPerson, editCalling,
} from './../editors.js';
import { plot, areaBars, usLine } from './parts.js';
import { CHURCH_MODELS, MODEL_STANCES } from './../models.js';
import { openGround } from './land.js';
import { openModel, showSoilTab } from './soil.js';
import { go } from './../router.js';

let focusId = null;

/**
 * Once a calling is held, the open question is who you'd build with there —
 * so the churches and household networks inside it come first, not the city.
 */
function candidates(state) {
  const inside = withinCalling(state);
  const pool = state.calling?.placeId && inside.length
    ? inside
    : state.contexts.filter((c) => c.kind === 'place');
  return pool
    .map((ground) => ({ ground, s: survey(state, ground) }))
    .sort((a, b) => {
      const rank = (x) => (x.ground.stage === 'built' ? 3 : x.ground.stage === 'ruled-out' ? -1 : (x.s.ready ? 2 : 1));
      return rank(b) - rank(a) || b.s.depth - a.s.depth;
    });
}

function pick(state) {
  const ranked = candidates(state);
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
    const called = state.calling?.place;
    view.append(h('h1', {}, called ? `Who in ${called}?` : 'Where is the land?'),
      h('p', { class: 'muted' },
        called
          ? 'The city is settled. Name the churches and household networks there you\'re actually looking at — then walk them.'
          : 'Put down the first place you\'d actually consider building on — where you are now counts.'),
      empty(called ? 'Nobody named yet.' : 'No ground yet.',
        called ? 'Add a community' : 'Add a place',
        () => editGround(null, { kind: called ? 'community' : 'place' })));
    return view;
  }

  const { ground, s } = target;
  const staked = ground.stage === 'built';

  view.append(h('p', { class: 'eyebrow' }, 'God first, continually'));

  /* ---- the calling, held ---- */
  const calling = state.calling || {};
  if (!calling.place) {
    view.append(h('div', { class: 'card', style: 'margin:12px 0 18px' },
      h('h3', { style: 'margin:0' }, 'Where are you called?'),
      h('p', { class: 'small muted', style: 'margin:6px 0 12px' },
        'If that\'s settled, say so once and the app will stop asking. The question becomes who you\'d build with there.'),
      h('button', { class: 'btn sm', onClick: editCalling }, 'Name it')));
  } else {
    view.append(h('button', { class: 'card card-tap', style: 'margin:12px 0 18px', onClick: editCalling },
      h('div', { class: 'row spread' },
        h('div', {},
          h('div', { class: 'eyebrow' }, 'Called to'),
          h('h2', { style: 'margin:2px 0 0' }, calling.place)),
        calling.by ? h('span', { class: 'tiny muted' }, calling.by) : null),
      calling.why ? h('p', { class: 'small muted', style: 'margin:8px 0 0' }, calling.why) : null,
      h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, 'Settled. Not re-decided every time you get nervous.')));
  }

  /* ---- how long this has been open ---- */
  if (state.weighingSince) {
    const years = Math.floor(Math.max(0, daysBetween(state.weighingSince, today())) / 365);
    const decided = state.contexts.filter((c) => c.stage === 'built' || c.stage === 'ruled-out').length;
    const hesitations = state.notes.filter((n) => n.kind === 'hesitation').length;
    view.append(h('button', { class: 'card card-tap', style: 'margin-bottom:18px', onClick: editCalling },
      h('div', { class: 'eyebrow' }, 'How long this has been open'),
      h('div', { class: 'row spread', style: 'margin-top:4px' },
        h('strong', {}, years >= 1 ? `${years} year${years > 1 ? 's' : ''}` : 'Under a year'),
        h('span', { class: 'tiny muted' },
          [`${decided} decided`, hesitations ? `${hesitations} hesitations written` : null]
            .filter(Boolean).join(' · '))),
      h('p', { class: 'tiny muted', style: 'margin:8px 0 0' },
        decided
          ? 'Some of it is settled. Keep going.'
          : 'Nothing ruled in or out yet. The length of that is itself worth looking at.')));
  }

  /* ---- settled in myself ---- */
  {
    const openInMe = state.convictions.filter((c) => !c.settledStatement && (c.weight === 'forming' || c.forming)).length
      + (state.barriers || []).filter((b) => !b.position).length;
    const settledInMe = state.convictions.filter((c) => c.settledStatement).length
      + (state.barriers || []).filter((b) => b.position && b.settledAt).length;
    if (openInMe || settledInMe) {
      view.append(h('button', { class: 'card card-tap', style: 'margin-bottom:18px', onClick: () => showSoilTab('settling') },
        h('div', { class: 'eyebrow' }, 'Settled in myself'),
        h('div', { class: 'row spread', style: 'margin-top:4px' },
          h('strong', {}, openInMe ? `${openInMe} still open in me` : `${settledInMe} settled`),
          settledInMe && openInMe ? h('span', { class: 'tiny muted' }, `${settledInMe} settled`) : null),
        h('p', { class: 'tiny muted', style: 'margin:8px 0 0' },
          openInMe
            ? 'Some of the waiting isn\'t about them. Settle one and date it.'
            : 'Everything you marked as forming has a position written on it now.')));
    }
  }

  view.append(h('div', { class: 'row spread', style: 'align-items:flex-end' },
    h('div', {},
      h('div', { class: 'eyebrow' },
        staked ? (ground.kind === 'place' ? 'Building here' : 'Committed to them')
          : ground.stage === 'running' ? 'Running with them, not settled'
            : (state.calling?.place && ground.kind !== 'place'
              ? `Who I'd build with in ${state.calling.place}`
              : 'The ground in front of me')),
      h('h1', { style: 'margin:2px 0 0' }, ground.name)),
    h('button', { class: 'icon-btn', onClick: () => openGround(ground.id) }, 'Open')));

  view.append(h('div', { style: 'margin:14px 0 10px' },
    plot(s.depth, {
      staked,
      label: staked
        ? `${ground.kind === 'place' ? 'Stake in the ground' : 'Committed'} ${relDate(ground.stakedAt || today(), today()).toLowerCase()}`
        : `${Math.round(s.depth * 100)}% rooted · ${Math.round(s.surveyed * 100)}% walked`,
    })));

  view.append(h('p', { class: 'verdict' }, verdict(s)));

  // The model it runs on, and where you already said you stand with that model.
  const model = CHURCH_MODELS.find((m) => m.id === ground.modelId);
  if (model) {
    const stance = byId(MODEL_STANCES, state.modelStances?.[model.id]?.stance || 'unknown');
    view.append(h('button', { class: 'card card-tap', style: 'margin-top:12px', onClick: () => go('soil') },
      h('div', { class: 'row spread' },
        h('span', { class: 'small' }, model.name),
        h('span', { class: `small tone-${stance.tone}` }, stance.label)),
      h('div', { class: 'tiny muted', style: 'margin-top:4px' }, model.asks)));
  }

  // What it produces here — the artefact, not the vision statement.
  if (s.fruit) {
    const outModel = CHURCH_MODELS.find((m) => m.id === s.fruit.modelId);
    const outStance = s.fruit.stanceId ? byId(MODEL_STANCES, s.fruit.stanceId) : null;
    view.append(h('div', { class: 'card', style: 'margin-top:12px' },
      h('div', { class: 'eyebrow' }, 'What it actually produces here'),
      h('p', { class: 'small', style: 'margin:6px 0 0' }, s.fruit.text),
      outModel
        ? h('div', { class: 'row spread', style: 'margin-top:8px' },
          h('span', { class: 'tiny muted' }, `That fruit is ${outModel.name.toLowerCase()}`),
          outStance ? h('span', { class: `tiny tone-${outStance.tone}` }, outStance.label) : null)
        : null,
      s.fruitTension
        ? h('p', { class: 'verdict', style: 'margin:10px 0 0; font-size:14px' },
          'You\'d be building the thing you\'re not sure about. That\'s the question, not a footnote.')
        : null,
      s.fruitTension && outModel
        ? h('button', { class: 'icon-btn', style: 'margin-top:8px', onClick: () => openModel(outModel.id) }, 'Look at that model')
        : null));
  }

  // Your own part in it — the heavier version of the same question.
  if (s.myPart) {
    const workModel = CHURCH_MODELS.find((m) => m.id === s.myPart.modelId);
    const workStance = s.myPart.stanceId ? byId(MODEL_STANCES, s.myPart.stanceId) : null;
    view.append(h('div', { class: 'card', style: 'margin-top:12px' },
      h('div', { class: 'eyebrow' }, 'What I\'d actually be doing'),
      h('p', { class: 'small', style: 'margin:6px 0 0' }, s.myPart.text),
      workModel
        ? h('div', { class: 'row spread', style: 'margin-top:8px' },
          h('span', { class: 'tiny muted' }, `That work is ${workModel.name.toLowerCase()}`),
          workStance ? h('span', { class: `tiny tone-${workStance.tone}` }, workStance.label) : null)
        : null,
      s.workTension
        ? h('p', { class: 'verdict', style: 'margin:10px 0 0; font-size:14px' },
          'This isn\'t a reservation about them any more. It\'s the job description.')
        : null,
      s.workTension && workModel
        ? h('button', { class: 'icon-btn', style: 'margin-top:8px', onClick: () => showSoilTab('settling') }, 'Settle where I stand on it')
        : null));
  }

  if (s.check && s.barriers.length) {
    view.append(h('div', { class: 'card', style: 'margin-top:12px' },
      h('div', { class: 'eyebrow' }, 'The lines I don\'t cross'),
      h('div', { class: 'rows' }, s.barriers.map((b) => h('div', {},
        h('div', { class: 'row spread' },
          h('span', { class: 'small' }, b.barrier.title),
          h('span', { class: `small tone-${b.state.tone}` }, b.state.label)),
        b.note ? h('div', { class: 'tiny muted' }, b.note) : null)))));
  }

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
      ground.kind === 'place'
        ? h('div', { class: 'row spread', style: 'margin-top:8px' },
          h('span', { class: 'small' }, 'Would we buy a home here'),
          h('span', { class: `small tone-${home.tone}` }, home.label))
        : h('div', { class: 'row spread', style: 'margin-top:8px' },
          h('span', { class: 'small' }, 'Could we settle in completely'),
          h('span', { class: `small tone-${s.settle.tone}` }, s.settle.label)),
      s.gate ? h('p', { class: 'tiny tone-thin', style: 'margin:10px 0 0' }, s.gate) : null,
      h('button', { class: 'icon-btn', style: 'margin-top:12px', onClick: () => walkTheLand(ground.id, s.check) }, 'Change my answer')));
  }

  // spiritual family, by name
  view.append(section('Spiritual family here', 'Add', () => editPerson(null, { groundId: ground.id })));
  if (!s.household.length) {
    if (!state.settings?.hushed?.family) {
      view.append(h('p', { class: 'muted small' },
        'No one named yet. Intertwined is people you could call at 11pm — if you can\'t name them, the ground isn\'t ready.'));
      view.append(h('button', {
        class: 'icon-btn',
        onClick: () => store.update((st) => {
          st.settings.hushed = { ...(st.settings.hushed || {}), family: true };
        }),
      }, 'Stop telling me'));
    }
  } else {
    const rows = h('div', { class: 'rows' });
    s.household.forEach((p) => rows.append(h('button', { class: 'card-tap', onClick: () => editPerson(p) },
      h('div', { class: 'row spread' },
        h('strong', {}, p.name),
        h('span', { class: 'tiny muted' }, p.lastMet ? `last met ${relDate(p.lastMet, today()).toLowerCase()}` : 'never logged')),
      p.nextStep ? h('div', { class: 'tiny muted' }, p.nextStep) : null)));
    view.append(rows);
  }

  if (staked && (ground.stakeNote || ground.stakeCost)) {
    view.append(h('div', { class: 'card' },
      ground.stakeNote ? h('p', { class: 'small', style: 'font-style:italic; margin:0' }, `"${ground.stakeNote}"`) : null,
      ground.stakeCost
        ? h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, `What died for it: ${ground.stakeCost}`)
        : null));
  }

  const verse = state.settings?.verse;
  if (verse?.text) {
    view.append(h('blockquote', { class: 'verse' },
      h('p', {}, verse.text),
      verse.ref ? h('cite', {}, verse.ref) : null));
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
            ground.kind === 'place'
              ? (s.inTheWay.length ? 'I\'m ready to build here' : 'Break ground here')
              : (s.inTheWay.length ? 'I\'m ready to commit to them' : 'Commit to them')),
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
  const others = candidates(state).filter((r) => r.ground.id !== ground.id)
    .filter((r) => r.ground.stage !== 'ruled-out');

  view.append(section(
    state.calling?.place ? 'The other options' : 'Other ground',
    others.length ? 'Compare' : 'Add one',
    () => (others.length ? go('land') : editGround(null, { kind: ground.kind === 'place' ? 'place' : 'community' })),
  ));

  if (!others.length && !state.settings?.hushed?.oneOption) {
    // One option on the table is a temptation, not a decision.
    view.append(h('div', { class: 'card' },
      h('strong', {}, `${ground.name} is the only thing on the table.`),
      h('p', { class: 'small muted', style: 'margin:6px 0 12px' },
        'One option isn\'t a decision — it\'s a yes or a no with nothing to weigh it against. '
        + 'Name two or three you\'d genuinely consider, even the ones you\'ve half dismissed.'),
      h('button', {
        class: 'btn sm',
        onClick: () => editGround(null, { kind: ground.kind === 'place' ? 'place' : 'community' }),
      }, 'Name another option'),
      h('button', {
        class: 'icon-btn', style: 'margin-left:8px',
        onClick: () => store.update((st) => {
          st.settings.hushed = { ...(st.settings.hushed || {}), oneOption: true };
        }),
      }, 'Stop telling me')));
  } else {
    const rows = h('div', { class: 'rows' });
    others.forEach(({ ground: g, s: gs }) => {
      const what = g.kind === 'place' ? (byId(HORIZONS, g.horizon) || HORIZONS[0]) : byId(KINDS, g.kind);
      rows.append(h('button', {
        class: 'card-tap', onClick: () => { focusId = g.id; go('target'); },
      },
      h('div', { class: 'row spread' },
        h('strong', {}, g.name),
        h('span', { class: 'tiny muted tnum' }, `${Math.round(gs.depth * 100)}% rooted`)),
      h('div', { class: 'tiny muted' },
        [what?.label, gs.check ? `kids: ${gs.kid.label.toLowerCase()}` : 'not walked',
          gs.inTheWay.length ? `${gs.inTheWay.length} in the way` : 'nothing in the way']
          .filter(Boolean).join(' · '))));
    });
    view.append(rows);
    view.append(h('button', {
      class: 'btn ghost block', style: 'margin-top:12px',
      onClick: () => editGround(null, { kind: ground.kind === 'place' ? 'place' : 'community' }),
    }, 'Name another option'));
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
