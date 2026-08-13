// Starter content: your own words, roughed in so the app isn't empty on day one.
// Everything here is editable or deletable — Settings has a one-tap clear.

import { uid, today } from './store.js';

const conviction = (title, weight, summary, scriptures, practice, forming) => ({
  id: uid(), title, weight, summary, scriptures, practice, forming,
  seeded: true, createdAt: new Date().toISOString(),
});

export function seedState() {
  const convictions = [
    conviction(
      'Disciple making that multiplies',
      'core',
      'Not programs and not crowds — named people I am walking with, who will go and do the same with someone else.',
      'Matthew 28:18-20; 2 Timothy 2:2',
      'I can name who I am discipling right now, and who they are discipling.',
      '',
    ),
    conviction(
      'Healthy theology',
      'core',
      'Doctrine held carefully and taught plainly. Sound teaching is pastoral care, not an academic hobby.',
      'Titus 1:9; 1 Timothy 4:16',
      'I can say what I believe and why, and where the line is between a conviction and a preference.',
      '',
    ),
    conviction(
      'Complementarian conviction',
      'conviction',
      'Biblical submission and distinct, God-given roles in the home and in the church.',
      'Ephesians 5:22-33; 1 Timothy 2:11-13; 1 Peter 3:1-7',
      'I can state this positively and pastorally, not just as a boundary.',
      'Sharpen the wording here until it is exactly how I would say it out loud to someone who disagrees.',
    ),
    conviction(
      'Healthy families',
      'conviction',
      'The home is the first congregation. Ministry that costs me my family is not ministry I want.',
      'Deuteronomy 6:4-9; Ephesians 6:4; 1 Timothy 3:4-5',
      'My family would say they get my best, not my leftovers.',
      '',
    ),
    conviction(
      'Strong preaching',
      'conviction',
      'Text-driven preaching that lets the passage set the agenda, aimed at the heart and at the street.',
      '2 Timothy 4:1-2; Nehemiah 8:8; Acts 20:27',
      'The point of my message is the point of the passage.',
      '',
    ),
    conviction(
      'Highly missional',
      'conviction',
      'Sent, not settled. Oriented toward people and places that do not have it yet.',
      'Acts 1:8; Romans 15:20; 1 Corinthians 9:19-23',
      'My week has real contact with people far from Jesus in it.',
      '',
    ),
  ];

  const e3 = {
    id: uid(),
    name: 'E3',
    kind: 'network',
    status: 'considering',
    notes: 'What I keep circling back to. Run a check whenever I learn something new about how they actually operate.',
    createdAt: new Date().toISOString(),
    seeded: true,
  };

  const noteId = uid();

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    seeded: true,
    convictions,
    contexts: [e3],
    checks: [],
    notes: [{
      id: noteId,
      date: today(),
      title: 'Being honest about where I actually am',
      kind: 'observation',
      body:
        "I don't feel totally comfortable or totally in line with just tools right now, and I want to say that plainly "
        + "instead of talking myself out of it. That's not a verdict on anybody — it's a reading. "
        + "The work is to name what the discomfort is actually about, one conviction at a time.",
      convictionIds: [],
      contextIds: [e3.id],
      source: '',
      seeded: true,
      createdAt: new Date().toISOString(),
    }],
    actions: [{
      id: uid(),
      title: 'Name the three questions I need answered before I could say yes',
      detail: 'Specific enough that someone could actually answer them.',
      due: '',
      done: false,
      convictionIds: [],
      contextIds: [e3.id],
      fromNoteId: noteId,
      seeded: true,
      createdAt: new Date().toISOString(),
    }],
    people: [],
    settings: { autoLockMinutes: 15, name: '' },
  };
}
