// The vocabulary and the math.
//
// One question runs the app: is this ground I could build on? A piece of land
// is judged by what the soil has to hold (requirements, grouped by area of
// life), by how much of it you've actually surveyed, and by what is still
// unsettled. Hesitation isn't a mood here — it's a finite list.

export const DEFAULT_DOMAINS = [
  {
    id: 'god',
    label: 'Walking with God',
    short: 'God',
    blurb: 'He is the goal, not the means to the rest of it.',
    color: '#c8963e',
    primary: true,
  },
  {
    id: 'marriage',
    label: 'Marriage',
    short: 'Marriage',
    blurb: 'The covenant that comes before any calling.',
    color: '#b5637a',
  },
  {
    id: 'family',
    label: 'Family & home',
    short: 'Family',
    blurb: 'The first congregation I am responsible for.',
    color: '#4a7a45',
  },
  {
    id: 'roots',
    label: 'The ground itself',
    short: 'Ground',
    blurb: 'Community, church, cost, staying power. What makes land worth building on.',
    color: '#7a5a3c',
  },
  {
    id: 'ministry',
    label: 'Theology & ministry',
    short: 'Ministry',
    blurb: 'What I teach, how I disciple, where I go.',
    color: '#4d7d94',
  },
];

export const WEIGHTS = [
  { id: 'core', label: 'Must have', weight: 3, help: "I wouldn't build where this is missing." },
  { id: 'conviction', label: 'Strongly want', weight: 2, help: 'Settled for me. I would contend for it.' },
  { id: 'forming', label: 'Still forming', weight: 1, help: "I lean here, but I'm honestly still working it out." },
  { id: 'preference', label: 'Nice to have', weight: 0.5, help: 'I hold it with an open hand.' },
];

export const LEVELS = [
  { id: 'aligned', label: 'Yes', score: 1, help: 'The ground has it.' },
  { id: 'mostly', label: 'Mostly', score: 0.72, help: 'Close enough to work with.' },
  { id: 'tension', label: 'Thin', score: 0.3, help: 'Real friction. I feel it.' },
  { id: 'conflict', label: 'No', score: 0, help: "It isn't here and won't be." },
  { id: 'unknown', label: 'Unsurveyed', score: null, help: "I haven't looked hard enough to say." },
];

export const US_LEVELS = [
  { id: 'together', label: 'We\'re agreed', tone: 'good' },
  { id: 'leaning', label: 'Leaning together', tone: 'ok' },
  { id: 'talking', label: 'Still talking', tone: 'thin' },
  { id: 'unspoken', label: "Haven't really talked", tone: 'thin' },
  { id: 'apart', label: 'Not in the same place', tone: 'bad' },
  { id: 'na', label: 'Just me on this one', tone: 'unknown' },
];

export const HORIZONS = [
  { id: 'unknown', label: 'No idea yet' },
  { id: 'season', label: 'A season (1–2 yrs)' },
  { id: 'chapter', label: 'A chapter (3–7 yrs)' },
  { id: 'long', label: 'A long time (10+)' },
  { id: 'life', label: 'For good' },
];

/** Where a piece of ground stands with you. */
export const STAGES = [
  { id: 'scouting', label: 'Scouting', blurb: 'Barely looked at it.' },
  { id: 'surveying', label: 'Surveying', blurb: 'Actively digging into it.' },
  { id: 'ready', label: 'Ready to decide', blurb: 'Nothing left unsettled.' },
  { id: 'built', label: 'Building here', blurb: 'Stake in the ground.' },
  { id: 'ruled-out', label: 'Ruled out', blurb: 'Not this one.' },
];

export const KINDS = [
  { id: 'place', label: 'Land / town' },
  { id: 'church', label: 'Church' },
  { id: 'network', label: 'Network' },
  { id: 'role', label: 'Role' },
  { id: 'opportunity', label: 'Opportunity' },
];

export const NOTE_KINDS = [
  { id: 'hesitation', label: 'Why I hesitated' },
  { id: 'scripture', label: 'Scripture' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'visit', label: 'Visit' },
  { id: 'question', label: 'Open question' },
  { id: 'correction', label: 'Where I was wrong' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'observation', label: 'Observation' },
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

export function latestCheck(checks, groundId) {
  return checks
    .filter((k) => k.contextId === groundId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export const impliedPlace = (grounds, g) => {
  if (!g) return null;
  if (g.kind === 'place') return g;
  return grounds.find((x) => x.id === g.placeId && x.kind === 'place') || null;
};

function tally(check, reqs) {
  let got = 0;
  let possible = 0;
  const unsurveyed = [];
  const thin = [];

  for (const c of reqs) {
    const rating = check?.ratings?.[c.id];
    const level = levelOf(rating?.level);
    if (level.score === null) {
      unsurveyed.push({ req: c, rating });
      continue;
    }
    const w = weightOf(c);
    got += level.score * w;
    possible += w;
    if (level.score < 0.7) thin.push({ req: c, rating, level, weight: w });
  }

  thin.sort((a, b) => b.weight * (1 - b.level.score) - a.weight * (1 - a.level.score));
  return {
    fit: possible ? got / possible : null,
    rated: possible > 0,
    unsurveyed,
    thin,
    missingMusts: thin.filter((t) => t.req.weight === 'core' && t.level.score <= 0.3),
  };
}

/**
 * Everything the app knows about one piece of ground:
 * how much of it you've surveyed, how well it fits, and what's still in the way.
 */
export function survey(state, ground) {
  const check = latestCheck(state.checks, ground.id);
  const reqs = state.convictions;
  const base = tally(check, reqs);

  base.byArea = state.domains
    .map((domain) => {
      const own = reqs.filter((c) => c.domainId === domain.id);
      return own.length ? { domain, count: own.length, ...tally(check, own) } : null;
    })
    .filter(Boolean);
  base.weakest = [...base.byArea].filter((a) => a.rated).sort((a, b) => a.fit - b.fit)[0] || null;

  const blocks = state.blocks.filter((b) => b.groundId === ground.id && b.status === 'open');
  const surveyed = reqs.length ? (reqs.length - base.unsurveyed.length) / reqs.length : 0;

  // Depth of the root drawing: how far down you could actually go here.
  const penalty = Math.min(0.35, blocks.filter((b) => b.hard).length * 0.12 + blocks.length * 0.03);
  const depth = Math.max(0, Math.min(1, surveyed * (0.4 + 0.6 * (base.fit ?? 0)) - penalty));

  const decided = ground.stage === 'built' || ground.stage === 'ruled-out';
  const ready = !decided && surveyed >= 0.8 && blocks.length === 0 && (base.fit ?? 0) >= 0.6;

  return {
    ...base,
    check,
    blocks,
    surveyed,
    depth,
    ready,
    stage: decided ? ground.stage : (ready ? 'ready' : (surveyed > 0.15 ? 'surveying' : 'scouting')),
    inTheWay: [
      ...blocks.map((b) => ({ kind: 'block', block: b, label: b.title })),
      ...base.unsurveyed.map((u) => ({ kind: 'unsurveyed', req: u.req, label: u.req.title })),
    ],
  };
}

/** One plain sentence about what stands between you and a decision. */
export function verdict(s) {
  if (s.stage === 'built') return 'You broke ground here.';
  if (s.stage === 'ruled-out') return 'You ruled this one out.';
  if (!s.check) return 'Not surveyed yet. Walk the land.';
  if (s.missingMusts.length) {
    return `${s.missingMusts.length} must-have${s.missingMusts.length > 1 ? 's are' : ' is'} missing here.`;
  }
  const q = s.unsurveyed.length;
  const b = s.blocks.length;
  if (!q && !b) return 'Nothing is unsettled. This is a decision now, not a discovery.';
  const parts = [];
  if (q) parts.push(`${q} question${q > 1 ? 's' : ''} unanswered`);
  if (b) parts.push(`${b} thing${b > 1 ? 's' : ''} unsettled`);
  return `${parts.join(' and ')} between you and a yes.`;
}

export function rankGrounds(state) {
  return state.contexts
    .filter((g) => g.kind === 'place')
    .map((ground) => ({ ground, s: survey(state, ground) }))
    .sort((a, b) => {
      const rank = (x) => (x.ground.stage === 'built' ? 3 : x.ground.stage === 'ruled-out' ? -1 : (x.s.ready ? 2 : 1));
      return rank(b) - rank(a) || b.s.depth - a.s.depth;
    });
}
