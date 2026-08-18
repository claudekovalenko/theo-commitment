// What I'm actually carrying right now.
//
// The target is about what I might say yes to. This is about what I've already
// said yes to — every standing commitment, what it costs a week, and whether it
// feeds the thing I'm going for or quietly competes with it. Spread thin is a
// feeling until you write the list; then it's arithmetic.

export const LOAD_KINDS = [
  { id: 'ministry', label: 'Ministry' },
  { id: 'cohort', label: 'Cohort / training' },
  { id: 'church', label: 'Church' },
  { id: 'work', label: 'Work' },
  { id: 'family', label: 'Family' },
  { id: 'study', label: 'Study' },
  { id: 'other', label: 'Other' },
];

/**
 * How far in am I? Involvement is a gradient, not a yes or no — and being thin
 * is usually about how many things you're near the middle of, not how many
 * things you're attached to at all.
 */
export const DEPTH = [
  { id: 'leading', label: 'I\'m running it', tone: 'bad', weight: 1, short: 'Leading' },
  { id: 'core', label: 'One of the ones holding it up', tone: 'bad', weight: 0.8, short: 'Core' },
  { id: 'committed', label: 'In it, regularly', tone: 'thin', weight: 0.55, short: 'Committed' },
  { id: 'showing', label: 'I show up', tone: 'ok', weight: 0.3, short: 'Showing up' },
  { id: 'edge', label: 'Loosely attached', tone: 'good', weight: 0.12, short: 'On the edge' },
];

/** Does it feed what I'm going for, or take from it? */
export const SERVES = [
  { id: 'serves', label: 'Feeds it', tone: 'good' },
  { id: 'neutral', label: 'Neither', tone: 'thin' },
  { id: 'competes', label: 'Takes from it', tone: 'bad' },
  { id: 'unsure', label: 'Not sure', tone: 'unknown' },
];

/** How I'm holding it. Not whether to drop it — most of these you don't drop. */
export const HOLD = [
  { id: 'through', label: 'Seeing it through to the end', tone: 'good' },
  { id: 'must', label: 'Ongoing, no end in view', tone: 'thin' },
  { id: 'could', label: 'Could hand it on well', tone: 'ok' },
  { id: 'should', label: 'Should have ended already', tone: 'bad' },
  { id: 'unsure', label: 'Haven\'t thought about it', tone: 'unknown' },
];

/** And when it ends? Finishing something isn't the same as renewing it. */
export const AFTER = [
  { id: 'finish', label: 'Finish it and stop', tone: 'ok' },
  { id: 'renew', label: 'Sign on again', tone: 'good' },
  { id: 'unsure', label: 'Don\'t know yet', tone: 'unknown' },
];

/** What it's actually getting from me — the stewardship question. */
export const GIVING = [
  { id: 'best', label: 'My best', tone: 'good' },
  { id: 'enough', label: 'Enough to do it properly', tone: 'ok' },
  { id: 'leftovers', label: 'My leftovers', tone: 'bad' },
  { id: 'unsure', label: 'Not sure', tone: 'unknown' },
];

const depthWeight = (c) => (DEPTH.find((d) => d.id === c.depth)?.weight ?? 0.4);

// Deepest first — how far in you are matters more than how long it takes.
export const commitments = (state) => (state.commitments || [])
  .filter((c) => !c.ended)
  .sort((a, b) => depthWeight(b) - depthWeight(a) || (Number(b.hours) || 0) - (Number(a.hours) || 0));

/**
 * The arithmetic. Hours against the number of hours you said you have, plus the
 * three things that make a plate feel heavier than the total suggests: work
 * that doesn't feed what you're for, things with no end, and things you're
 * carrying that somebody else could.
 */
export function plateRead(state) {
  const list = commitments(state);
  const capacity = Number(state.settings?.capacityHours) || 0;
  const hours = list.reduce((n, c) => n + (Number(c.hours) || 0), 0);
  const unpriced = list.filter((c) => !Number(c.hours)).length;

  const competes = list.filter((c) => c.serves === 'competes');
  const openEnded = list.filter((c) => !c.ends && c.hold !== 'through');
  const throughs = list.filter((c) => c.hold === 'through');
  const overdue = list.filter((c) => c.hold === 'should');
  const deep = list.filter((c) => c.depth === 'leading' || c.depth === 'core');
  const leftovers = list.filter((c) => c.giving === 'leftovers');
  const best = list.filter((c) => c.giving === 'best');
  // Being spread thin is your own weight divided across things, not a count.
  const spread = list.reduce((n, c) => n + depthWeight(c), 0);

  const called = (state.calling?.place || '').trim().toLowerCase();
  const elsewhere = called
    ? list.filter((c) => c.where && !c.where.toLowerCase().includes(called))
    : [];

  const base = { list, hours, capacity, competes, openEnded, throughs, droppable: [], overdue,
    unpriced, deep, leftovers, best, spread, elsewhere };

  if (!list.length) {
    return { ...base, word: 'Nothing written down', tone: 'unknown',
      why: 'Spread thin is a feeling until the list exists. Put down everything you\'ve said yes to — '
        + 'the question isn\'t what to drop, it\'s how to carry it well.' };
  }

  let word;
  let tone;
  let why;

  if (leftovers.length >= 2) {
    word = 'Getting my leftovers';
    tone = 'bad';
    why = `${leftovers.length} of these are getting your leftovers: ${leftovers.map((c) => c.name).join(', ')}. `
      + 'Stewarding something isn\'t carrying it — it\'s giving it what it needs.';
  } else if (overdue.length) {
    word = 'Carrying something finished';
    tone = 'bad';
    why = `${overdue.length} of these you said should have ended already. Finishing well is stewardship too.`;
  } else if (deep.length >= 3) {
    word = 'Spread thin';
    tone = 'bad';
    why = `You're leading or holding up ${deep.length} at once: ${deep.map((c) => c.name).join(', ')}. `
      + 'Depth is the thing that doesn\'t divide.';
  } else if (capacity && hours > capacity) {
    word = 'Over';
    tone = 'bad';
    why = `${hours} hours a week against the ${capacity} you said you had. That's ${hours - capacity} you don't have — `
      + 'so something is getting less than you think.';
  } else if (elsewhere.length >= 2 && called) {
    word = 'Held somewhere else';
    tone = 'thin';
    why = `${elsewhere.length} of these are in ${[...new Set(elsewhere.map((c) => c.where))].join(' and ')}, `
      + `and you say you're called to ${state.calling.place}. Worth naming, not necessarily worth changing.`;
  } else if (competes.length >= 2) {
    word = 'Pulled apart';
    tone = 'thin';
    why = `${competes.length} of ${list.length} take from what you're going for rather than feed it.`;
  } else if (capacity && hours > capacity * 0.85) {
    word = 'At the edge';
    tone = 'thin';
    why = `${hours} of ${capacity} hours. It works until one week goes wrong.`;
  } else if (unpriced > list.length / 2) {
    word = 'Unpriced';
    tone = 'unknown';
    why = `${unpriced} of ${list.length} have no hours on them. You can't steward what you haven't costed.`;
  } else if (!capacity) {
    word = 'No ceiling set';
    tone = 'unknown';
    why = `${list.length} things, ${hours} hours a week. Say how many hours you actually have and this becomes an answer.`;
  } else {
    word = 'Carrying it well';
    tone = 'good';
    why = `${hours} of ${capacity} hours across ${list.length} things`
      + `${best.length ? `, and ${best.length} getting your best` : ''}.`;
  }

  return { ...base, word, tone, why };
}
