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

/**
 * The test that decides the ground. Not a requirement among others — a gate.
 * If you wouldn't leave your kids with these people, nothing else counts yet.
 */
export const KID_LEVELS = [
  { id: 'no', label: 'No', help: 'Not for an afternoon.', cap: 0.22, tone: 'bad' },
  { id: 'supervised', label: 'Only with me there', help: 'I\'d be watching the whole time.', cap: 0.45, tone: 'bad' },
  { id: 'some', label: 'A few of them', help: 'Certain households, not the room.', cap: 0.72, tone: 'thin' },
  { id: 'yes', label: 'Yes — gladly, for a week', help: 'Unsupervised, and glad about it.', cap: 1, tone: 'good' },
  { id: 'unknown', label: 'Haven\'t seen enough', help: 'No basis to answer yet.', cap: 0.55, tone: 'unknown' },
];

/** And the other half: he comes back formed. Formed which direction? */
export const FORMATION_LEVELS = [
  { id: 'softer', label: 'Softer, more comfortable', cap: 0.5, tone: 'bad' },
  { id: 'flat', label: 'About the same', cap: 0.8, tone: 'thin' },
  { id: 'sharper', label: 'Sharper, more on mission', cap: 1, tone: 'good' },
  { id: 'unknown', label: 'Don\'t know yet', cap: 0.75, tone: 'unknown' },
];

/** The commitment behind the commitment. */
export const HOME_LEVELS = [
  { id: 'no', label: 'No', tone: 'bad' },
  { id: 'maybe', label: 'Could see it', tone: 'thin' },
  { id: 'yes', label: 'Yes', tone: 'good' },
  { id: 'done', label: 'We already have', tone: 'good' },
  { id: 'unknown', label: 'Too early to say', tone: 'unknown' },
];

/** Where a community stands on a barrier of yours. */
export const BARRIER_STATES = [
  { id: 'clears', label: 'Clears it', tone: 'good', score: 1 },
  { id: 'mostly', label: 'Mostly', tone: 'ok', score: 0.7 },
  { id: 'unclear', label: 'Can\'t tell yet', tone: 'unknown', score: null },
  { id: 'fails', label: 'Fails it', tone: 'bad', score: 0 },
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
  { id: 'running', label: 'Running with them', blurb: 'Already in it — not yet settled in it.' },
  { id: 'ready', label: 'Ready to decide', blurb: 'Nothing left unsettled.' },
  { id: 'built', label: 'Building here', blurb: 'Stake in the ground.' },
  { id: 'ruled-out', label: 'Ruled out', blurb: 'Not this one.' },
];

export const KINDS = [
  { id: 'community', label: 'Community / households' },
  { id: 'church', label: 'Church' },
  { id: 'network', label: 'Ministry / network', rootless: true },
  { id: 'role', label: 'Role' },
  { id: 'place', label: 'Place / city' },
  { id: 'opportunity', label: 'Opportunity' },
];

/** A ministry isn't a location. The question is whether it travels. */
export const PLACE_MODES = [
  { id: 'in', label: 'It would put us there' },
  { id: 'anywhere', label: 'It runs from anywhere' },
  { id: 'elsewhere', label: 'It would take us away' },
  { id: 'unknown', label: 'Don\'t know yet' },
];

/** For anything that isn't land: could you settle in with them completely? */
export const SETTLE_LEVELS = [
  { id: 'no', label: 'No', tone: 'bad' },
  { id: 'notyet', label: 'Not yet', tone: 'thin' },
  { id: 'close', label: 'Close', tone: 'thin' },
  { id: 'yes', label: 'Yes, completely', tone: 'good' },
  { id: 'unknown', label: 'Too early to say', tone: 'unknown' },
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

/** The city you've said you're called to. Settled — the app stops asking. */
export const callingPlace = (state) => state.contexts.find((c) => c.id === state.calling?.placeId) || null;

/** Everything you're weighing inside the calling: who, not where. */
export const withinCalling = (state) => {
  const place = callingPlace(state);
  if (!place) return state.contexts.filter((c) => c.kind !== 'place');
  return state.contexts.filter((c) => c.kind !== 'place' && (c.placeId === place.id || !c.placeId));
};

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
  let depth = Math.max(0, Math.min(1, surveyed * (0.4 + 0.6 * (base.fit ?? 0)) - penalty));

  // The gate. Roots don't go deeper than the people you'd trust with your kids.
  base.kid = byId(KID_LEVELS, check?.kid?.level) || byId(KID_LEVELS, 'unknown');
  base.formation = byId(FORMATION_LEVELS, check?.formation?.level) || byId(FORMATION_LEVELS, 'unknown');
  base.home = byId(HOME_LEVELS, check?.home) || byId(HOME_LEVELS, 'unknown');
  base.settle = byId(SETTLE_LEVELS, check?.settle) || byId(SETTLE_LEVELS, 'unknown');
  base.kidNote = check?.kid?.note || '';
  base.formationNote = check?.formation?.note || '';

  base.household = state.people.filter((p) => p.groundId === ground.id);

  // Barriers: the doctrinal lines you don't cross. A hard one failed is a wall,
  // not a deduction.
  base.barriers = (state.barriers || []).map((b) => ({
    barrier: b,
    state: byId(BARRIER_STATES, check?.barriers?.[b.id]?.state || 'unclear'),
    note: check?.barriers?.[b.id]?.note || '',
  }));
  base.barriersFailed = base.barriers.filter((b) => b.barrier.hard && b.state.id === 'fails');
  base.barriersUnclear = base.barriers.filter((b) => b.barrier.hard && b.state.id === 'unclear');

  if (check) {
    const barrierCap = base.barriersFailed.length ? 0.2 : 1;
    const cap = Math.min(base.kid.cap, base.formation.cap, barrierCap);
    base.gate = depth > cap
      ? (base.barriersFailed.length
        ? `Blocked by ${base.barriersFailed.map((b) => b.barrier.title.toLowerCase()).join(' and ')}`
        : base.kid.cap <= base.formation.cap
          ? `Capped by the kid test: ${base.kid.label.toLowerCase()}`
          : `Capped by which way he'd be formed: ${base.formation.label.toLowerCase()}`)
      : '';
    depth = Math.min(depth, cap);
  } else {
    base.gate = '';
  }

  const decided = ground.stage === 'built' || ground.stage === 'ruled-out';
  base.running = ground.stage === 'running';
  base.kind = ground.kind;
  base.isPlace = ground.kind === 'place';
  const trusted = ['yes', 'some'].includes(base.kid.id);
  const gatedBy = check && base.barriersFailed.length
    ? `${base.barriersFailed.map((b) => b.barrier.title).join(' and ')} — a line you said you don't cross`
    : check && !trusted
    ? `You wouldn't leave your kids with these people yet (${base.kid.label.toLowerCase()})`
    : (check && base.formation.id === 'softer' ? 'He\'d come back softer, not sharper' : '');
  const ready = !decided && trusted && surveyed >= 0.8 && blocks.length === 0 && (base.fit ?? 0) >= 0.6;

  return {
    ...base,
    check,
    blocks,
    surveyed,
    depth,
    ready,
    stage: decided ? ground.stage : (ready ? 'ready' : (surveyed > 0.15 ? 'surveying' : 'scouting')),
    inTheWay: [
      ...(gatedBy ? [{ kind: 'gate', label: gatedBy }] : []),
      ...base.barriersUnclear.map((b) => ({ kind: 'barrier', label: `${b.barrier.title} — can't tell yet` })),
      ...blocks.map((b) => ({ kind: 'block', block: b, label: b.title })),
      ...base.unsurveyed.map((u) => ({ kind: 'unsurveyed', req: u.req, label: u.req.title })),
    ],
    gatedBy,
  };
}

/** One plain sentence about what stands between you and a decision. */
export function verdict(s) {
  if (s.stage === 'built') {
    return s.isPlace ? 'You broke ground here.' : 'You committed to them. The work now is keeping it.';
  }
  if (s.stage === 'ruled-out') return 'You ruled this one out.';
  if (!s.check) return 'Not surveyed yet. Walk the land.';
  if (s.barriersFailed?.length) {
    const names = s.barriersFailed.map((b) => b.barrier.title.toLowerCase()).join(' and ');
    return `This fails on ${names}. That's a wall, not a cost.`;
  }
  if (s.kid.id === 'no' || s.kid.id === 'supervised') {
    return 'You wouldn\'t leave your kids here unsupervised. Until that changes, nothing else counts.';
  }
  if (s.formation.id === 'softer') {
    return 'He\'d come back softer, not sharper. That\'s the thing to fix before anything else.';
  }
  if (s.kid.id === 'unknown') return 'You haven\'t been around these people enough to answer the only question that matters.';
  if (s.running && ['no', 'notyet', 'close'].includes(s.settle.id)) {
    return 'You\'re running with them. You haven\'t settled with them. Name the difference.';
  }
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
