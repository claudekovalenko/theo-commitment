// Reading back what I've written.
//
// Four years of entries is only useful if something reads across them. Nothing
// here leaves the device and nothing guesses at meaning — it counts what I
// actually keep saying, and it always shows the entries behind a claim so I can
// disagree with it.

import { SELF_LEVELS, returnsFor } from './returns.js';

const STOP = new Set(`a about after again all also am an and any are around as at back be because been
before being both but by came can cant come could did didnt do does doesnt doing dont down each even
ever every felt feel feeling for from get got had has have having he her here hers him his how i id if
ill im in into is isnt it its ive just keep kept know knew like ll me might more most much must my
myself never no nor not now of off on once one only or other our out over own re really said same say
saying see seem seemed she should since so some still such than that thats the their them then there
these they thing things think this those though through to too us ve very was wasnt way we well went
were what when where whether which while who why will with would wouldnt yet you your`.split(/\s+/));

const words = (text) => String(text || '')
  .toLowerCase()
  .replace(/['’]/g, '')
  .split(/[^a-z]+/)
  .filter((w) => w.length > 2 && !STOP.has(w));

/**
 * Everything I've written in my own voice about how these have actually gone.
 * Not the ratings — the sentences.
 */
export function corpus(state) {
  const nameOf = (id) => state.contexts.find((c) => c.id === id)?.name || '';
  const out = [];

  (state.returns || []).forEach((r) => {
    const base = { date: r.date, groundId: r.groundId, ground: nameOf(r.groundId), source: 'return', what: r.what || '' };
    if (r.heldBack) out.push({ ...base, id: `${r.id}-h`, kind: 'What I held back', text: r.heldBack });
    if (r.performed) out.push({ ...base, id: `${r.id}-p`, kind: 'What I performed', text: r.performed });
  });

  (state.notes || []).filter((n) => n.kind === 'hesitation' && n.body).forEach((n) => out.push({
    id: n.id, date: n.date, groundId: (n.contextIds || [])[0] || '',
    ground: nameOf((n.contextIds || [])[0]), source: 'note', kind: 'Why I hesitated',
    what: n.title || '', text: n.body,
  }));

  (state.goals || []).filter((g) => g.done && g.result).forEach((g) => out.push({
    id: g.id, date: g.doneAt || '', groundId: g.groundId, ground: nameOf(g.groundId),
    source: 'goal', kind: 'What happened', what: g.title, text: g.result,
  }));

  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * What I keep saying. Single words and pairs that turn up in more than one
 * entry, ranked by how many separate entries carry them — repetition across
 * occasions, not repetition inside one paragraph.
 */
export function recurring(entries, { min = 2, limit = 10 } = {}) {
  const hits = new Map(); // phrase -> Set of entry ids

  entries.forEach((e) => {
    const w = words(e.text);
    const seen = new Set();
    w.forEach((word, i) => {
      seen.add(word);
      if (i + 1 < w.length) seen.add(`${word} ${w[i + 1]}`);
    });
    seen.forEach((phrase) => {
      if (!hits.has(phrase)) hits.set(phrase, new Set());
      hits.get(phrase).add(e.id);
    });
  });

  const byId = new Map(entries.map((e) => [e.id, e]));
  const rows = [...hits.entries()]
    .filter(([, ids]) => ids.size >= min)
    .map(([phrase, ids]) => {
      const list = [...ids].map((id) => byId.get(id)).filter(Boolean);
      return {
        phrase,
        count: ids.size,
        pair: phrase.includes(' '),
        entries: list,
        grounds: [...new Set(list.map((e) => e.ground).filter(Boolean))],
      };
    });

  // A pair beats the words inside it — "house church" is worth more than either
  // half, so drop a single word when a pair containing it says the same thing.
  const pairs = rows.filter((r) => r.pair);
  const kept = rows.filter((r) => {
    if (r.pair) return true;
    return !pairs.some((p) => p.count >= r.count && p.phrase.split(' ').includes(r.phrase));
  });

  return kept
    .sort((a, b) => b.count - a.count || b.grounds.length - a.grounds.length || (a.phrase < b.phrase ? -1 : 1))
    .slice(0, limit);
}

/**
 * Is it them, or is it every room I walk into? The only way to tell is whether
 * it happens with one of them or with all of them.
 */
export function acrossMinistries(state) {
  const ministries = state.contexts.filter((c) => c.kind !== 'place');
  const per = ministries
    .map((g) => {
      const list = returnsFor(state, g.id);
      if (!list.length) return null;
      const off = list.filter((r) => r.self === 'version' || r.self === 'not');
      return { ground: g, total: list.length, off: off.length, everOff: off.length > 0, allOff: off.length === list.length };
    })
    .filter(Boolean);

  const withEntries = per.length;
  const offSomewhere = per.filter((p) => p.everOff).length;

  if (!withEntries) {
    return { per, word: '', why: '' };
  }
  if (withEntries === 1) {
    const one = per[0];
    return {
      per,
      word: one.everOff ? 'One ministry, one pattern' : 'One ministry so far',
      why: one.everOff
        ? `You've only written this down for ${one.ground.name}. Until there's a second, you can't tell whether it's them or the room you bring with you.`
        : `Only ${one.ground.name} so far. Write down another and the comparison starts to mean something.`,
    };
  }
  if (offSomewhere === withEntries) {
    return {
      per,
      word: 'It follows you',
      why: `You weren't yourself with ${offSomewhere} of ${withEntries} — all of them. When it happens everywhere, the thing to look at is what you keep holding back, not who you were with.`,
    };
  }
  if (offSomewhere === 0) {
    return { per, word: 'Yourself everywhere', why: `You were yourself with all ${withEntries}. That's worth knowing too.` };
  }
  const bad = per.filter((p) => p.everOff).map((p) => p.ground.name);
  const good = per.filter((p) => !p.everOff).map((p) => p.ground.name);
  return {
    per,
    word: 'It\'s them, not everywhere',
    why: `Not yourself with ${bad.join(' and ')} — but you were with ${good.join(' and ')}. That's a difference in the room, not in you.`,
  };
}

/** Which answer I give most often, across everything I've written down. */
export function selfSpread(state) {
  const all = state.returns || [];
  const counts = {};
  SELF_LEVELS.forEach((l) => { counts[l.id] = all.filter((r) => r.self === l.id).length; });
  return { total: all.length, counts };
}
