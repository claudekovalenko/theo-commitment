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

export function seedState() {
  const convictions = seedConvictions();

  const e3 = {
    id: uid(),
    name: 'E3',
    kind: 'network',
    stage: 'scouting',
    placeId: '',
    horizon: 'unknown',
    notes: 'What I keep circling back to. Run a check whenever I learn something new about how they actually operate.',
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
    domains: DEFAULT_DOMAINS.map((d) => ({ ...d })),
    convictions,
    contexts: [here, e3],
    checks: [],
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
        title: 'I don\'t know where E3 would actually put us',
        wouldSettle: 'A straight answer about location, and whether we\'d get to choose it.',
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
    calling: { placeId: '', place: '', why: '', by: '' },
    settings: { autoLockMinutes: 15, name: '' },
  };
}
