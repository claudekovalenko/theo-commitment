// Shared vocabulary + the scoring math behind the compass.

export const WEIGHTS = [
  { id: 'core', label: 'Non-negotiable', weight: 3, help: "I wouldn't join or stay where this is absent." },
  { id: 'conviction', label: 'Conviction', weight: 2, help: 'Settled for me. I would contend for it.' },
  { id: 'forming', label: 'Still forming', weight: 1, help: "I lean here, but I'm honestly still working it out." },
  { id: 'preference', label: 'Preference', weight: 0.5, help: 'I hold it with an open hand.' },
];

export const LEVELS = [
  { id: 'aligned', label: 'Aligned', score: 1, help: 'They hold it the way I hold it.' },
  { id: 'mostly', label: 'Mostly', score: 0.72, help: 'Same direction, different emphasis.' },
  { id: 'tension', label: 'Tension', score: 0.3, help: 'Real friction. I feel it.' },
  { id: 'conflict', label: 'Conflict', score: 0, help: "We're not running the same play." },
  { id: 'unknown', label: "Don't know yet", score: null, help: "I haven't seen enough to say." },
];

export const NOTE_KINDS = [
  { id: 'scripture', label: 'Scripture' },
  { id: 'book', label: 'Book / article' },
  { id: 'sermon', label: 'Sermon / teaching' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'question', label: 'Open question' },
  { id: 'correction', label: 'Where I was wrong' },
  { id: 'observation', label: 'Observation' },
  { id: 'prayer', label: 'Prayer / discernment' },
];

export const CONTEXT_KINDS = [
  { id: 'network', label: 'Network / sending org' },
  { id: 'church', label: 'Church' },
  { id: 'role', label: 'Role' },
  { id: 'opportunity', label: 'Opportunity' },
  { id: 'partner', label: 'Partner' },
];

export const CONTEXT_STATUS = [
  { id: 'considering', label: 'Considering' },
  { id: 'current', label: 'Current' },
  { id: 'watching', label: 'Watching' },
  { id: 'past', label: 'Past' },
];

export const PEOPLE_STAGES = [
  { id: 'praying', label: 'Praying for' },
  { id: 'conversation', label: 'In conversation' },
  { id: 'new', label: 'New believer' },
  { id: 'discipled', label: 'Being discipled' },
  { id: 'multiplying', label: 'Discipling someone else' },
];

export const byId = (list, id) => list.find((x) => x.id === id);
export const weightOf = (c) => (byId(WEIGHTS, c.weight) || WEIGHTS[1]).weight;
export const levelOf = (id) => byId(LEVELS, id) || byId(LEVELS, 'unknown');

/**
 * Score one alignment check.
 * Convictions rated "don't know yet" are left out of the score and counted
 * separately — an unknown is a question to go ask, not a mark against anyone.
 */
export function scoreCheck(check, convictions) {
  let got = 0;
  let possible = 0;
  const unknown = [];
  const friction = [];

  for (const c of convictions) {
    const rating = check.ratings?.[c.id];
    const level = levelOf(rating?.level);
    if (level.score === null) {
      unknown.push({ conviction: c, rating });
      continue;
    }
    const w = weightOf(c);
    got += level.score * w;
    possible += w;
    if (level.score < 0.7) friction.push({ conviction: c, rating, level, weight: w });
  }

  friction.sort((a, b) => b.weight * (1 - b.level.score) - a.weight * (1 - a.level.score));
  const pct = possible ? got / possible : null;
  return {
    pct,
    degrees: pct === null ? null : Math.round((1 - pct) * 180),
    rated: possible > 0,
    unknown,
    friction,
    dealbreakers: friction.filter((f) => f.conviction.weight === 'core' && f.level.score <= 0.3),
  };
}

/** Latest check per context, newest first. */
export function latestCheck(checks, contextId) {
  return checks
    .filter((k) => k.contextId === contextId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export function readingWord(pct) {
  if (pct === null) return 'Unrated';
  if (pct >= 0.9) return 'On heading';
  if (pct >= 0.75) return 'Close to heading';
  if (pct >= 0.55) return 'Drifting';
  if (pct >= 0.35) return 'Off heading';
  return 'Wrong heading';
}
