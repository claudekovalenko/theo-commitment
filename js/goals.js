// Goals: what I'd actually have to do to feel at home with one of these.
//
// Not criteria to rate them against — steps to take, dated, that you either did
// or didn't. Feeling at home isn't something you conclude from a distance; it
// happens by eating in their houses and being corrected by them.

/**
 * The ten that actually make someone at home somewhere. Offered per ministry,
 * editable and deletable — a starting plan, not a syllabus.
 */
export const GOAL_TEMPLATES = [
  {
    title: 'Eat in three of their homes, on ordinary weeks',
    why: 'Not an event they put on. A Tuesday. You learn a people by their kitchens.',
  },
  {
    title: 'Bring my wife, and hear her read on it first',
    why: 'She sees what I miss, and her yes is not optional.',
  },
  {
    title: 'Leave my son with one of their families for a day',
    why: 'The test I said decides it. Small version of it, taken on purpose.',
  },
  {
    title: 'Ask their leader the three barriers straight out',
    why: 'Baptism, leadership and oversight, the role of women. Their practice, not their statement.',
  },
  {
    title: 'Watch how they correct someone',
    why: 'Every group looks healthy until someone is wrong. Find out what happens then.',
  },
  {
    title: 'Do their actual work for a month — not observe it',
    why: 'Running with them for a season tells you what a hundred conversations won\'t.',
  },
  {
    title: 'Teach once, and get real feedback',
    why: 'Whether they want strong preaching is answered by what they say afterwards.',
  },
  {
    title: 'Name three households here I\'d call at 11pm',
    why: 'Spiritual family is names, not a feeling. If you can\'t name them, you\'re not home yet.',
  },
  {
    title: 'Ask who\'s still here after three years — and why the ones who left, left',
    why: 'Consistency is the thing you said you needed. This is how you measure it.',
  },
  {
    title: 'Sit with someone who left on bad terms',
    why: 'The only account nobody will volunteer, and the one that tells you the most.',
  },
];

export const goalsFor = (state, groundId) => (state.goals || [])
  .filter((g) => g.groundId === groundId)
  .sort((a, b) => {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1;
    return (a.due || '9999') < (b.due || '9999') ? -1 : 1;
  });

export function progressFor(state, groundId) {
  const list = goalsFor(state, groundId);
  const done = list.filter((g) => g.done).length;
  return { list, done, total: list.length, ratio: list.length ? done / list.length : 0 };
}

/** The next thing to actually do here. */
export const nextGoal = (state, groundId) => goalsFor(state, groundId).find((g) => !g.done) || null;
