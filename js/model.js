// Shared vocabulary + the scoring math behind the compass.
//
// The unit of measurement is a conviction. Every conviction belongs to a
// domain — walking with God, marriage, family, roots, ministry — because the
// decisions that matter (a move, a church, a role) touch all of them at once,
// and a good ministry score can quietly hide a bad roots cost.

export const DEFAULT_DOMAINS = [
  {
    id: 'god',
    label: 'Walking with God',
    short: 'God',
    blurb: 'He is the goal, not the means to the rest of it.',
    color: '#d6a854',
    primary: true,
  },
  {
    id: 'marriage',
    label: 'Marriage',
    short: 'Marriage',
    blurb: 'The covenant that comes before any calling.',
    color: '#dc8fa4',
  },
  {
    id: 'family',
    label: 'Family & home',
    short: 'Family',
    blurb: 'The first congregation I am responsible for.',
    color: '#7fc59c',
  },
  {
    id: 'roots',
    label: 'Roots & place',
    short: 'Roots',
    blurb: 'Somewhere long enough to be known and to be missed.',
    color: '#79b2d8',
  },
  {
    id: 'ministry',
    label: 'Theology & ministry',
    short: 'Ministry',
    blurb: 'What I teach, how I disciple, where I go.',
    color: '#b09ae0',
  },
];

export const WEIGHTS = [
  { id: 'core', label: 'Non-negotiable', weight: 3, help: "I wouldn't join or stay where this is absent." },
  { id: 'conviction', label: 'Conviction', weight: 2, help: 'Settled for me. I would contend for it.' },
  { id: 'forming', label: 'Still forming', weight: 1, help: "I lean here, but I'm honestly still working it out." },
  { id: 'preference', label: 'Preference', weight: 0.5, help: 'I hold it with an open hand.' },
];

export const LEVELS = [
  { id: 'aligned', label: 'Aligned', score: 1, help: 'It holds here the way I hold it.' },
  { id: 'mostly', label: 'Mostly', score: 0.72, help: 'Same direction, different emphasis.' },
  { id: 'tension', label: 'Tension', score: 0.3, help: 'Real friction. I feel it.' },
  { id: 'conflict', label: 'Conflict', score: 0, help: "We're not running the same play." },
  { id: 'unknown', label: "Don't know yet", score: null, help: "I haven't seen enough to say." },
];

/** Where the two of you land on a given context. Marriage is not a scored
 *  conviction here — it's a question the app keeps asking out loud. */
export const US_LEVELS = [
  { id: 'together', label: 'We\'re agreed', tone: 'aligned' },
  { id: 'leaning', label: 'Leaning together', tone: 'mostly' },
  { id: 'talking', label: 'Still talking it through', tone: 'tension' },
  { id: 'unspoken', label: "Haven't really talked", tone: 'tension' },
  { id: 'apart', label: 'Not in the same place', tone: 'conflict' },
  { id: 'na', label: 'Just me on this one', tone: 'unknown' },
];

/** How long you could see yourselves staying. The roots question, asked plainly. */
export const HORIZONS = [
  { id: 'unknown', label: 'No idea yet', years: null },
  { id: 'season', label: 'A season (1–2 yrs)', years: 1.5 },
  { id: 'chapter', label: 'A chapter (3–7 yrs)', years: 5 },
  { id: 'long', label: 'A long time (10+)', years: 10 },
  { id: 'life', label: 'For good', years: 25 },
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
  { id: 'place', label: 'Place / town' },
  { id: 'church', label: 'Church' },
  { id: 'network', label: 'Network / sending org' },
  { id: 'role', label: 'Role' },
  { id: 'opportunity', label: 'Opportunity' },
];

export const CONTEXT_STATUS = [
  { id: 'considering', label: 'Considering' },
  { id: 'current', label: 'Where we are' },
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
export const domainOf = (domains, c) => byId(domains, c.domainId) || domains[domains.length - 1];

/** Weighted score over any set of convictions. Unknowns sit out of the math. */
function tally(check, convictions) {
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

/**
 * Score one alignment check overall, and again for each domain, so a strong
 * showing in one area can't paper over a weak one somewhere else.
 */
export function scoreCheck(check, convictions, domains) {
  const overall = tally(check, convictions);
  overall.byDomain = domains
    .map((domain) => {
      const own = convictions.filter((c) => domainOf(domains, c).id === domain.id);
      return own.length ? { domain, count: own.length, ...tally(check, own) } : null;
    })
    .filter(Boolean);
  overall.weakest = [...overall.byDomain].filter((d) => d.rated).sort((a, b) => a.pct - b.pct)[0] || null;
  return overall;
}

/** Latest check per context, newest first. */
export function latestCheck(checks, contextId) {
  return checks
    .filter((k) => k.contextId === contextId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export function readingWord(pct) {
  if (pct === null || pct === undefined) return 'Unrated';
  if (pct >= 0.9) return 'On heading';
  if (pct >= 0.75) return 'Close to heading';
  if (pct >= 0.55) return 'Drifting';
  if (pct >= 0.35) return 'Off heading';
  return 'Wrong heading';
}
