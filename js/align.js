// Where I line up with them, and where I don't.
//
// A tick against a requirement says whether they satisfied me. It doesn't say
// what they actually believe. This puts the two side by side — my position in
// my words, theirs in theirs — because that gap is the thing I keep circling.

export const ALIGN = [
  { id: 'same', label: 'The same thing', tone: 'good', short: 'Same' },
  { id: 'close', label: 'Close enough to work', tone: 'ok', short: 'Close' },
  { id: 'different', label: 'Genuinely different', tone: 'thin', short: 'Different' },
  { id: 'opposed', label: 'Opposed', tone: 'bad', short: 'Opposed' },
  { id: 'unknown', label: 'Haven\'t asked them', tone: 'unknown', short: 'Not asked' },
];

/**
 * The things worth comparing: every line you don't cross, and everything filed
 * under theology and ministry. Not marriage or housing — those aren't doctrine.
 */
export function beliefs(state) {
  const out = (state.barriers || []).map((b) => ({
    id: b.id,
    kind: 'barrier',
    title: b.title,
    mine: b.position || '',
    watching: b.detail || '',
    hard: b.hard,
  }));
  state.convictions
    .filter((c) => c.domainId === 'ministry')
    .forEach((c) => out.push({
      id: c.id,
      kind: 'conviction',
      title: c.title,
      mine: c.settledStatement || c.summary || '',
      watching: c.practice || '',
      scriptures: c.scriptures || '',
      forming: !c.settledStatement && (c.weight === 'forming' || !!c.forming),
    }));
  return out;
}

export const theirsOn = (check, id) => check?.theirs?.[id] || null;

export function alignTally(state, check) {
  const list = beliefs(state);
  const counts = { same: 0, close: 0, different: 0, opposed: 0, unknown: 0 };
  list.forEach((b) => {
    const t = theirsOn(check, b.id);
    counts[t?.align && counts[t.align] !== undefined ? t.align : 'unknown'] += 1;
  });
  return { list, counts, total: list.length, asked: list.length - counts.unknown };
}

/** One line about the state of the comparison, in the order that matters. */
export function alignRead(t) {
  if (!t.total) return { word: 'Nothing to compare', tone: 'unknown', why: 'No barriers or theology written down yet.' };
  if (t.counts.opposed) {
    return {
      word: 'Opposed', tone: 'bad',
      why: `You're opposed on ${t.counts.opposed} of ${t.total}. That's not a gap you close by liking them.`,
    };
  }
  if (!t.asked) {
    return {
      word: 'Never asked', tone: 'unknown',
      why: `${t.total} things you hold, and you haven't asked them about any of it.`,
    };
  }
  if (t.counts.unknown) {
    return {
      word: `${t.asked} of ${t.total} asked`, tone: 'thin',
      why: `${t.counts.unknown} you still haven't put to them. The unasked ones are the work.`,
    };
  }
  if (t.counts.different) {
    return {
      word: 'Real differences', tone: 'thin',
      why: `Lined up on ${t.counts.same + t.counts.close}, genuinely different on ${t.counts.different}. Name what those cost.`,
    };
  }
  return { word: 'Lined up', tone: 'good', why: 'You asked about all of it and none of it divides you.' };
}
