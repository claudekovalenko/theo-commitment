// What you're learning, and who you're walking with.

import * as store from './../store.js';
import { today } from './../store.js';
import { NOTE_KINDS, PEOPLE_STAGES, byId } from './../model.js';
import { h, frag, empty, section, openSheet, closeSheet, relDate, fmtDate, fmtMonth, toast, daysBetween } from './../ui.js';
import { editNote, editPerson, editBlock, logReturn } from './../editors.js';
import { SELF_LEVELS, CHRIST_LEVELS, returnRead, returnsFor } from './../returns.js';
import { corpus, recurring, acrossMinistries, selfSpread } from './../patterns.js';
import { go } from './../router.js';

const view = { tab: 'entries', kind: null, q: '' };

export function openNote(id) {
  const build = () => {
    const state = store.get();
    const n = state.notes.find((x) => x.id === id);
    if (!n) return h('p', { class: 'muted' }, 'Gone.');
    const names = (ids, list, key) => (ids || []).map((i) => list.find((x) => x.id === i)?.[key]).filter(Boolean);

    return frag(
      h('div', { class: 'row wrap', style: 'margin-bottom:12px' },
        h('span', { class: 'chip' }, byId(NOTE_KINDS, n.kind)?.label || 'Note'),
        h('span', { class: 'chip' }, fmtDate(n.date)),
        h('button', { class: 'chip', onClick: () => editNote(n) }, 'Edit')),
      n.body ? h('p', { style: 'white-space:pre-wrap' }, n.body) : null,
      n.source ? h('p', { class: 'small', style: 'color:var(--moss)' }, n.source) : null,
      h('div', { class: 'row wrap' },
        names(n.convictionIds, state.convictions, 'title').map((t) => h('span', { class: 'chip' }, t)),
        names(n.contextIds, state.contexts, 'name').map((t) => h('span', { class: 'chip' }, t))),
      h('button', {
        class: 'btn block', style: 'margin-top:20px',
        onClick: () => { closeSheet(); editBlock(null, { title: n.title || n.body.slice(0, 60), groundId: (n.contextIds || [])[0] || '' }); },
      }, 'Put this in the way'),
    );
  };
  openSheet(() => store.get().notes.find((x) => x.id === id)?.title || 'Entry', build);
}

function entries(state, root) {
  const list = h('div', {});
  const search = h('input', {
    type: 'text', value: view.q, placeholder: 'Search the journal',
    onInput: (e) => { view.q = e.target.value; paint(); },
  });

  const chips = h('div', { class: 'row wrap', style: 'margin:12px 0 4px' });
  const setKind = (k) => { view.kind = k; paintChips(); paint(); };
  const paintChips = () => {
    chips.replaceChildren();
    chips.append(h('button', { class: `chip${view.kind ? '' : ' on'}`, onClick: () => setKind(null) }, 'All'));
    NOTE_KINDS.forEach((k) => {
      if (!state.notes.some((n) => n.kind === k.id)) return;
      chips.append(h('button', { class: `chip${view.kind === k.id ? ' on' : ''}`, onClick: () => setKind(k.id) }, k.label));
    });
  };
  paintChips();

  function paint() {
    const q = view.q.trim().toLowerCase();
    const rows = state.notes
      .filter((n) => !view.kind || n.kind === view.kind)
      .filter((n) => !q || `${n.title} ${n.body} ${n.source}`.toLowerCase().includes(q))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    list.replaceChildren();
    if (!rows.length) {
      list.append(empty(state.notes.length ? 'Nothing matches.' : 'Empty. Write the first honest thing.', 'New entry', () => editNote()));
      return;
    }
    let month = null;
    let bucket = null;
    rows.forEach((n) => {
      const m = n.date.slice(0, 7);
      if (m !== month) {
        month = m;
        list.append(h('div', { class: 'section' }, h('h2', {}, fmtMonth(m))));
        bucket = h('div', { class: 'rows' });
        list.append(bucket);
      }
      bucket.append(h('button', { class: 'card-tap', onClick: () => openNote(n.id) },
        h('div', { class: 'row spread' },
          h('strong', { class: 'grow truncate' }, n.title || '(untitled)'),
          h('span', { class: 'tiny muted' }, relDate(n.date, today()))),
        h('div', { class: 'tiny muted truncate' },
          [byId(NOTE_KINDS, n.kind)?.label, n.source, n.body].filter(Boolean).join(' · '))));
    });
  }
  paint();

  root.append(search, chips, list,
    h('button', { class: 'btn primary block', style: 'margin-top:20px', onClick: () => editNote() }, 'New entry'));
}

function people(state, root) {
  if (!state.people.length) {
    root.append(empty('No names yet. Start with the one person you\'d say you\'re discipling.', 'Add someone', () => editPerson()));
    return;
  }
  PEOPLE_STAGES.forEach((stage) => {
    const group = state.people.filter((p) => p.stage === stage.id);
    if (!group.length) return;
    root.append(section(stage.label));
    const rows = h('div', { class: 'rows' });
    group.forEach((p) => {
      const cold = p.lastMet ? daysBetween(p.lastMet, today()) : null;
      rows.append(h('div', {},
        h('button', { class: 'card-tap', onClick: () => editPerson(p) },
          h('div', { class: 'row spread' },
            h('strong', {}, p.name),
            cold !== null ? h('span', { class: `tiny ${cold > 30 ? 'tone-thin' : 'muted'}` }, `${cold}d`) : null),
          p.nextStep ? h('div', { class: 'tiny muted' }, `Next: ${p.nextStep}`) : null),
        h('button', {
          class: 'icon-btn', style: 'margin-top:8px',
          onClick: () => {
            store.update((s) => { s.people.find((x) => x.id === p.id).lastMet = today(); });
            toast('Marked as met today');
          },
        }, 'Met today')));
    });
    root.append(rows);
  });
  root.append(h('button', { class: 'btn block', style: 'margin-top:20px', onClick: () => editPerson() }, 'Add someone'));
}

/** One entry from the corpus, with the phrase that matched it lit up. */
function corpusRow(e, phrase) {
  const body = h('div', { class: 'small' });
  if (phrase) {
    const rx = new RegExp(`(${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    String(e.text).split(rx).forEach((bit, i) => {
      body.append(i % 2 ? h('mark', {}, bit) : document.createTextNode(bit));
    });
  } else {
    body.textContent = e.text;
  }
  return h('div', { class: 'card' },
    h('div', { class: 'row spread' },
      h('span', { class: 'eyebrow' }, [e.ground, e.kind].filter(Boolean).join(' · ')),
      h('span', { class: 'tiny muted' }, e.date ? fmtDate(e.date) : '')),
    e.what ? h('div', { class: 'tiny muted' }, e.what) : null,
    body);
}

/**
 * Everything I've written in my own words, read back to me: what I keep
 * saying, and whether it follows me from one of these to the next.
 */
function pattern(state, root) {
  const entries = corpus(state);
  const across = acrossMinistries(state);
  const spread = selfSpread(state);

  root.append(h('h1', {}, 'What keeps coming up'),
    h('p', { class: 'muted small' },
      'Read back from what you actually wrote — the times back from them, the hesitations, '
      + 'and what happened when you took a step. Nothing here leaves this device, and every '
      + 'line shows the entries behind it so you can disagree with it.'));

  if (!entries.length) {
    root.append(empty('Nothing written down yet.',
      'Write a time back from one of them', () => go('aim')));
    return;
  }

  /* ---- is it them, or is it every room ---- */
  if (across.word) {
    root.append(h('div', { class: 'card', style: 'margin-top:14px' },
      h('div', { class: 'eyebrow' }, 'Them, or everywhere?'),
      h('h3', { style: 'margin:4px 0 6px' }, across.word),
      h('p', { class: 'small muted', style: 'margin:0' }, across.why),
      h('div', { class: 'rows', style: 'margin-top:10px' },
        across.per.map((p) => h('div', { class: 'row spread' },
          h('span', { class: 'small' }, p.ground.name),
          h('span', { class: `small tone-${p.everOff ? (p.allOff ? 'bad' : 'thin') : 'good'}` },
            `${p.off} of ${p.total} not myself`))))));
  }

  if (spread.total) {
    root.append(h('div', { class: 'card' },
      h('div', { class: 'eyebrow' }, `Across all ${spread.total} times back`),
      h('div', { class: 'rows', style: 'margin-top:6px' },
        SELF_LEVELS.filter((l) => spread.counts[l.id]).map((l) => h('div', { class: 'row spread' },
          h('span', { class: 'small' }, l.label),
          h('span', { class: `small tone-${l.tone}` }, String(spread.counts[l.id])))))));
  }

  /* ---- what I keep saying ---- */
  const phrases = recurring(entries);
  root.append(h('h2', { class: 'plain-head' }, 'Words I keep using'));
  if (!phrases.length) {
    root.append(h('p', { class: 'muted small' },
      `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} so far, and nothing repeats yet. `
      + 'Patterns need a few more.'));
  } else {
    root.append(h('p', { class: 'muted small' },
      'Counted across separate entries, not repeats inside one. Tap to read them together.'));
    const rows = h('div', { class: 'rows' });
    phrases.forEach((p) => {
      rows.append(h('button', {
        class: 'card-tap',
        onClick: () => openSheet(`"${p.phrase}"`, () => frag(
          h('p', { class: 'small muted' },
            `In ${p.count} separate entries${p.grounds.length > 1 ? `, across ${p.grounds.join(' and ')}` : (p.grounds[0] ? `, all about ${p.grounds[0]}` : '')}.`),
          p.entries.map((e) => corpusRow(e, p.phrase)),
        )),
      },
      h('div', { class: 'row spread' },
        h('strong', { class: 'grow' }, p.phrase),
        h('span', { class: 'small muted' }, `${p.count} entries`)),
      p.grounds.length
        ? h('div', { class: `tiny ${p.grounds.length > 1 ? 'tone-bad' : 'muted'}` },
          p.grounds.length > 1 ? `Comes up with ${p.grounds.join(' and ')}` : p.grounds[0])
        : null));
    });
    root.append(rows);
  }

  /* ---- everything, in my own words ---- */
  root.append(h('h2', { class: 'plain-head' }, `In my own words — ${entries.length}`));
  entries.forEach((e) => root.append(corpusRow(e, null)));
}

export function render(state) {
  const root = h('div', {});
  const tabs = h('div', { class: 'row', style: 'margin-bottom:16px' });
  [['entries', 'Entries'], ['pattern', 'What keeps coming up'], ['people', 'People']].forEach(([id, label]) => {
    tabs.append(h('button', {
      class: `chip${view.tab === id ? ' on' : ''}`,
      onClick: () => { view.tab = id; go('journal'); },
    }, label));
  });
  root.append(tabs);

  if (view.tab === 'entries') entries(state, root);
  else if (view.tab === 'pattern') pattern(state, root);
  else people(state, root);
  return root;
}

export const title = 'Journal';
