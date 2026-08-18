// Starter content: your own words, roughed in so the app isn't empty on day one.
// Everything here is editable or deletable — Settings has a one-tap clear.

import { uid, today } from './store.js';
import { DEFAULT_DOMAINS } from './model.js';

const conviction = (domainId, title, weight, summary, scriptures, practice, forming = '') => ({
  id: uid(), domainId, title, weight, summary, scriptures, practice, forming,
  seeded: true, createdAt: new Date().toISOString(),
});

export function seedConvictions() {
  return [
    /* ---- walking with God ---- */
    conviction('god',
      'Abiding before usefulness',
      'core',
      'God himself is the goal — not the ministry I could build for him. If the work grows and I don\'t know him better, I\'ve lost the thing I was after.',
      'John 15:4-5; Psalm 27:4; Philippians 3:8',
      'I have time with God that isn\'t sermon prep.'),
    conviction('god',
      'Decisions get prayed before they get pitched',
      'conviction',
      'The big calls go through prayer and counsel first, not after I\'ve already made up my mind and want it blessed.',
      'Luke 6:12-13; James 1:5; Proverbs 15:22',
      'I can name who I prayed with before I decided.'),

    /* ---- marriage ---- */
    conviction('marriage',
      'One flesh before one calling',
      'core',
      'My wife is not a stakeholder in my ministry — she is my first ministry. No opportunity is worth taking that we aren\'t agreed on.',
      'Genesis 2:24; Ephesians 5:25-33; 1 Peter 3:7',
      'She could tell you exactly what I\'m weighing right now, in my words, and she\'d say she had a real say in it.'),
    conviction('marriage',
      'Leading by serving first',
      'conviction',
      'Headship that looks like Christ: first to serve, first to repent, last to demand. Her flourishing is the measure of my leadership.',
      'Ephesians 5:25-30; 1 Peter 3:7; Colossians 3:19',
      'She is more herself, not less, for being married to me.'),

    /* ---- family & home ---- */
    conviction('family',
      'Healthy families',
      'conviction',
      'The home is the first congregation. Ministry that costs me my family is not ministry I want.',
      'Deuteronomy 6:4-9; Ephesians 6:4; 1 Timothy 3:4-5',
      'My family would say they get my best, not my leftovers.'),
    conviction('family',
      'A home with an open table',
      'conviction',
      'Hospitality isn\'t separate from the ministry — our table is part of it, and the kids get to see it up close.',
      'Romans 12:13; 1 Peter 4:9; Acts 2:46',
      'People who aren\'t like us have eaten at our table this month.'),

    /* ---- roots & place ---- */
    conviction('roots',
      'Somewhere long enough to be known',
      'core',
      'Depth takes years. I want to be in a place long enough that people know my kids\' names and can tell when I\'m off.',
      'Jeremiah 29:5-7; Proverbs 27:10',
      'I can picture us here in ten years without flinching.'),
    conviction('roots',
      'A church we could belong to for a decade',
      'core',
      'Not a church I could serve at — a church we could be members of, be pastored by, and grow old in.',
      'Hebrews 10:24-25; Acts 2:42-47',
      'If my role ended tomorrow, we\'d still want to be there on Sunday.'),
    conviction('roots',
      'Spiritual family, not just a congregation',
      'core',
      'Households we are actually intertwined with — in each other\'s homes, in each other\'s business. People I could name, not a service I attend.',
      'Acts 2:44-47; Romans 12:10; 1 Thessalonians 2:8',
      'I can name the households, and my kids know their kitchens.'),
    conviction('roots',
      'People I\'d leave my kids with',
      'core',
      'Ordinary families here — not the leaders on stage — that I would trust with my son unsupervised, and he\'d come home more on mission, not less.',
      'Titus 2:3-8; Deuteronomy 6:6-9; Proverbs 13:20',
      'I could drop him off for a week and not think twice.'),
    conviction('roots',
      'Community that stays',
      'core',
      'The same faces over years, not a rotating cast. Consistency is what turns people into family — you can\'t be known by a crowd that keeps changing.',
      'Acts 2:46; Hebrews 10:24-25; Proverbs 27:10',
      'The people who were here three years ago are still here, and still close.'),
    conviction('roots',
      'Community my wife and kids actually have',
      'conviction',
      'Not my network — theirs. Friendships that don\'t depend on my title and don\'t leave when I do.',
      'Romans 12:10; Galatians 6:2',
      'She has two or three people she\'d call at 11pm, and they live close.'),
    conviction('roots',
      'We could afford to stay',
      'conviction',
      'Housing, work and cost of living that don\'t quietly force a move in three years. Roots need soil we can pay for.',
      'Luke 14:28-30; 1 Timothy 5:8',
      'The math works for ten years, not just for the first one.'),
    conviction('roots',
      'Near enough to family',
      'forming',
      'How close do we need to be to parents and siblings? I honestly don\'t know my own answer yet.',
      '1 Timothy 5:4; Exodus 20:12',
      '',
      'Talk this through and land on an actual number of hours.'),

    /* ---- theology & ministry ---- */
    conviction('ministry',
      'Disciple making that multiplies',
      'core',
      'Not programs and not crowds — named people I am walking with, who will go and do the same with someone else.',
      'Matthew 28:18-20; 2 Timothy 2:2',
      'I can name who I am discipling right now, and who they are discipling.'),
    conviction('ministry',
      'Healthy theology',
      'core',
      'Doctrine held carefully and taught plainly. Sound teaching is pastoral care, not an academic hobby.',
      'Titus 1:9; 1 Timothy 4:16',
      'I can say what I believe and why, and where the line is between a conviction and a preference.'),
    conviction('ministry',
      'Complementarian conviction',
      'conviction',
      'Biblical submission and distinct, God-given roles in the home and in the church.',
      'Ephesians 5:22-33; 1 Timothy 2:11-13; 1 Peter 3:1-7',
      'I can state this positively and pastorally, not just as a boundary.',
      'Sharpen the wording until it is exactly how I would say it out loud to someone who disagrees.'),
    conviction('ministry',
      'Strong preaching',
      'conviction',
      'Text-driven preaching that lets the passage set the agenda, aimed at the heart and at the street.',
      '2 Timothy 4:1-2; Nehemiah 8:8; Acts 20:27',
      'The point of my message is the point of the passage.'),
    conviction('ministry',
      'Highly missional',
      'conviction',
      'Sent, not settled. Oriented toward people and places that do not have it yet.',
      'Acts 1:8; Romans 15:20; 1 Corinthians 9:19-23',
      'My week has real contact with people far from Jesus in it.'),
  ];
}

/** The three he named: what he's already carrying, in his own words. */
function seedCommitments(antiochId) {
  const mk = (o) => ({
    id: uid(), name: '', kind: 'other', depth: '', hours: '', where: '', groundId: '',
    started: '', ends: '', why: '', wellDone: '', serves: 'unsure', hold: 'unsure',
    giving: 'unsure', after: 'unsure', ended: false, seeded: true,
    createdAt: new Date().toISOString(), ...o,
  });
  return [
    mk({
      name: 'Leadership cohort with Antioch',
      kind: 'cohort',
      where: 'Hawaii',
      groundId: antiochId,
      hold: 'through',
      after: 'finish',
      why: 'Not looking to drop it — seeing it through to the end. Not eager to go back to Hawaii '
        + 'right now, which is worth saying out loud: finishing it isn\'t the same as renewing it.',
    }),
    mk({
      name: 'Seminary — OTS',
      kind: 'study',
      hold: 'through',
      why: 'A long obedience. Finishing it is the point.',
    }),
    mk({
      name: 'Shorebreak — Big Island crew',
      kind: 'ministry',
      where: 'Big Island',
      why: 'People, not a programme.',
    }),
  ];
}

export function seedState() {
  const convictions = seedConvictions();

  // Both live options in LA run on house churches — one produces them, the other
  // would have him starting them — so this is the conviction the decision waits on.
  convictions.push({
    id: uid(),
    domainId: 'ministry',
    title: 'Where I actually stand on house churches',
    weight: 'forming',
    summary: 'Not a preference any more. Both live options in LA either produce house '
      + 'churches or would have me starting them, so this is the conviction the decision '
      + 'is waiting on.',
    scriptures: 'Acts 2:46; Acts 20:20; 1 Timothy 3:1-7; Titus 1:5; Hebrews 13:17',
    practice: 'I could say where I stand out loud to someone who plants them, and name '
      + 'the specific thing that would change my mind.',
    forming: 'I lean against the model — thin on teaching depth and real oversight. But my '
      + 'part in LA would be starting them. I can\'t hold both for another four years.',
    seeded: true,
    createdAt: new Date().toISOString(),
  });

  const e3 = {
    id: uid(),
    name: 'E3',
    kind: 'network',
    stage: 'running',
    placeId: '',
    placeMode: 'unknown',
    horizon: 'unknown',
    aka: ['NPL'],
    output: 'Healthy house churches started in LA.',
    outputModelId: 'house',
    myPart: 'Start house churches.',
    myPartModelId: 'house',
    notes: 'A ministry, not a location. Been running with them for a while — the open question is whether I could settle in with them completely.',
    createdAt: new Date().toISOString(),
    seeded: true,
  };

  const antioch = {
    id: uid(),
    name: 'Antioch',
    kind: 'network',
    stage: 'scouting',
    placeId: '',
    placeMode: 'unknown',
    modelId: '',
    horizon: 'unknown',
    notes: 'A church-planting movement with a strong sending and discipleship culture. '
      + 'Weigh the specific congregation, not the movement — networks vary church to church, '
      + 'and the kid test is answered by the households in the room, not the brand.',
    createdAt: new Date().toISOString(),
    seeded: true,
  };

  const here = {
    id: uid(),
    name: 'Where we are now',
    kind: 'place',
    stage: 'scouting',
    horizon: 'unknown',
    notes: 'Walk this one first. Without a baseline, every other place is just a feeling.',
    createdAt: new Date().toISOString(),
    seeded: true,
  };

  const noteId = uid();

  return {
    version: 3,
    createdAt: new Date().toISOString(),
    seeded: true,
    // He's been carrying this question for about four years.
    weighingSince: new Date(new Date().getFullYear() - 4, 0, 1).toISOString().slice(0, 10),
    aim: 'A ministry I could be planted with — where I\'d leave my kids unsupervised, '
      + 'where my son comes back more on mission, that makes disciples and doesn\'t cross my lines.',
    appliedSeeds: ['antioch', 'consistent-community', 'weighing-since', 'e3-fruit', 'npl-house-churches', 'the-aim', 'npl-is-e3', 'carrying'],
    domains: DEFAULT_DOMAINS.map((d) => ({ ...d })),
    convictions,
    contexts: [here, e3, antioch],
    checks: [],
    goals: [],
    returns: [],
    commitments: seedCommitments(antioch.id),
    blocks: [
      {
        id: uid(),
        groundId: '',
        title: 'I don\'t know what she\'d need to feel rooted somewhere',
        wouldSettle: 'Her list, in her words, written down before I react to any of it.',
        who: 'Ask her',
        due: '',
        hard: true,
        status: 'open',
        seeded: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        groundId: e3.id,
        title: 'I don\'t know if I could settle in with E3 completely',
        wouldSettle: 'Name the specific thing I\'m holding back on, and what would have to be true to let it go.',
        who: '',
        due: '',
        hard: true,
        status: 'open',
        seeded: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        groundId: e3.id,
        title: 'Sit in the house churches E3 has actually started here',
        wouldSettle: 'Three of them, on ordinary weeks, not a showcase. Who teaches, who corrects, who\'s still there after two years.',
        who: '',
        due: '',
        hard: true,
        status: 'open',
        seeded: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        groundId: e3.id,
        title: 'Where does oversight come from in an E3 house church?',
        wouldSettle: 'A name and a structure — who has authority to correct a leader, and what happened the last time one needed correcting.',
        who: '',
        due: '',
        hard: true,
        status: 'open',
        seeded: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        groundId: e3.id,
        title: 'Am I against the house church model, or against the ones I\'ve seen?',
        wouldSettle: 'One sentence I\'d say out loud, and the specific thing that would change my mind.',
        who: '',
        due: '',
        hard: true,
        status: 'open',
        seeded: true,
        createdAt: new Date().toISOString(),
      },
    ],
    notes: [{
      id: noteId,
      date: today(),
      title: 'What I actually want is ground I can build on',
      kind: 'hesitation',
      body:
        'The stress isn\'t which network to join. It\'s that I keep not saying "we\'re building here". '
        + 'I want a place with real community, where my family grows well, where we could still be in ten years. '
        + 'Every offer has to be weighed against that ground, not the other way around.',
      convictionIds: [],
      contextIds: [],
      source: '',
      seeded: true,
      createdAt: new Date().toISOString(),
    }],
    people: [],
    verses: [],
    discernments: [],
    modelStances: {
      house: {
        stance: 'against',
        note: 'Drawn to the intertwining, but I can\'t see where strong preaching, real eldership and correction come from.',
      },
    },
    barriers: [
      {
        id: uid(),
        title: 'Baptism',
        position: '',
        detail: 'Who gets baptised, what it means, and whether we\'d be at peace with how they practise it.',
        hard: true,
        seeded: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'Leadership and oversight',
        position: '',
        detail: 'Who leads, how they\'re appointed, who they answer to, and whether there\'s real correction.',
        hard: true,
        seeded: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: 'The role of women',
        position: 'Complementarian — biblical submission and distinct, God-given roles in the home and in the church.',
        detail: 'How it\'s taught, how it\'s practised, and whether it\'s held pastorally or as a slogan.',
        hard: true,
        seeded: true,
        createdAt: new Date().toISOString(),
      },
    ],
    calling: { placeId: '', place: '', why: '', by: '' },
    settings: {
      autoLockMinutes: 15,
      name: '',
      verse: {
        text: 'Unless a grain of wheat falls into the ground and dies, it remains alone; but if it dies, it produces much grain.',
        ref: 'John 12:24',
      },
    },
  };
}
