// A working library for the question in front of you.
//
// References and a plain note on why each one belongs here — not the text
// itself. You read the text in your own Bible and write down what you saw;
// that's the part worth keeping, and it's the part the app stores.

export const THREADS = [
  {
    id: 'will',
    title: 'How God guides',
    blurb: 'What Scripture actually claims about knowing his will — which is less about a hidden answer and more about a changed man.',
    verses: [
      { ref: 'Proverbs 3:5-6', note: 'Trust with the whole heart; lean not on your own understanding. The promise is direction, not a preview.' },
      { ref: 'Psalm 25:4-5', note: 'Show me your ways — the prayer of someone who wants to be taught, not just told.' },
      { ref: 'Psalm 32:8', note: 'God takes responsibility for instructing you. Guidance is his job before it is your skill.' },
      { ref: 'James 1:5', note: 'Ask for wisdom, given without reproach. The asking is not a last resort.' },
      { ref: 'Romans 12:1-2', note: 'A renewed mind proves what the will of God is. Discernment is downstream of surrender.' },
      { ref: 'Ephesians 5:15-17', note: 'Understand what the will of the Lord is — set against foolishness and wasted time.' },
      { ref: 'Colossians 1:9-10', note: 'Filled with the knowledge of his will, so as to walk worthy. Knowing is aimed at walking.' },
      { ref: '1 Thessalonians 4:3', note: 'Named plainly: your sanctification. Much of "God\'s will" is already published.' },
      { ref: 'Micah 6:8', note: 'What the Lord requires — justice, mercy, humility. The floor under every specific decision.' },
      { ref: 'Psalm 37:3-5', note: 'Trust, do good, dwell in the land, commit your way. Notice that dwelling is part of the instruction.' },
    ],
  },
  {
    id: 'counsel',
    title: 'Counsel and the church',
    blurb: 'God rarely sends a man by himself. Who is weighing this with you?',
    verses: [
      { ref: 'Proverbs 11:14', note: 'In the multitude of counsellors there is safety.' },
      { ref: 'Proverbs 15:22', note: 'Without counsel purposes are disappointed.' },
      { ref: 'Proverbs 20:18', note: 'Every purpose is established by counsel.' },
      { ref: 'Acts 13:1-4', note: 'The sending happened in a worshipping, fasting church — not in a private impression.' },
      { ref: 'Acts 15:22-29', note: 'A hard question settled together, with the whole church, in writing.' },
      { ref: 'Proverbs 27:17', note: 'Iron sharpens iron. Sharpening is friction, not agreement.' },
    ],
  },
  {
    id: 'sent',
    title: 'Calling and being sent',
    blurb: 'How sending actually happens in Scripture — and how open and closed doors get read.',
    verses: [
      { ref: 'Isaiah 6:8', note: 'Here am I, send me. Willingness before assignment.' },
      { ref: 'Acts 16:6-10', note: 'Forbidden in one direction, called in another. Closed doors were part of the guidance.' },
      { ref: 'Romans 15:20', note: 'Ambition to build where no one else has laid a foundation.' },
      { ref: 'Matthew 9:36-38', note: 'The compassion that precedes the sending, and the prayer he tells you to pray.' },
      { ref: '1 Corinthians 7:17', note: 'Walk as God has called each one. Not every move is a promotion.' },
      { ref: 'Acts 17:26-27', note: 'He appointed the times and the boundaries of their dwelling — so that they would seek him.' },
    ],
  },
  {
    id: 'land',
    title: 'Land, roots and staying',
    blurb: 'Scripture on putting down roots, and on leaving. Both are commanded somewhere.',
    verses: [
      { ref: 'Jeremiah 29:4-7', note: 'Build houses, plant gardens, seek the peace of the city — in a place they did not choose.' },
      { ref: 'Genesis 12:1-3', note: 'Go from your country to a land I will show you. Leaving as obedience.' },
      { ref: 'Hebrews 11:8-10', note: 'He went out not knowing where; he looked for a city with foundations.' },
      { ref: 'Psalm 16:5-6', note: 'The lines are fallen to me in pleasant places. Contentment with an assigned portion.' },
      { ref: 'Proverbs 27:8', note: 'A man that wanders from his place is like a bird that wanders from her nest.' },
      { ref: '1 Thessalonians 4:11-12', note: 'Study to be quiet, mind your own business, work with your hands. An unglamorous rootedness.' },
    ],
  },
  {
    id: 'household',
    title: 'Household and children',
    blurb: 'Who is forming your kids when you are not in the room.',
    verses: [
      { ref: 'Deuteronomy 6:4-9', note: 'Teach them diligently — sitting, walking, lying down, rising. Formation is ordinary and constant.' },
      { ref: 'Psalm 127:3-5', note: 'Children are a heritage and a reward; arrows aimed somewhere.' },
      { ref: 'Proverbs 22:6', note: 'Train up a child in the way he should go.' },
      { ref: 'Ephesians 6:4', note: 'Do not provoke them; bring them up in the nurture and admonition of the Lord.' },
      { ref: '1 Timothy 3:4-5', note: 'A man who cannot rule his own house — how will he take care of the church of God?' },
      { ref: 'Proverbs 13:20', note: 'Walk with wise men and be wise; a companion of fools is destroyed. The company question, directly.' },
      { ref: '1 Corinthians 15:33', note: 'Evil company corrupts good habits. Environment forms, whatever you intend.' },
      { ref: '3 John 4', note: 'No greater joy than to hear that my children walk in truth. Name your actual measure of success.' },
    ],
  },
  {
    id: 'family',
    title: 'Spiritual family',
    blurb: 'What being intertwined with people actually looked like.',
    verses: [
      { ref: 'Acts 2:42-47', note: 'Devoted to teaching, fellowship, bread, prayer — house to house, daily.' },
      { ref: 'Romans 12:10', note: 'Kindly affectioned one to another with brotherly love; in honour preferring one another.' },
      { ref: 'Hebrews 10:24-25', note: 'Consider one another; do not forsake the assembling. Provoking each other to love.' },
      { ref: 'Galatians 6:2', note: 'Bear one another\'s burdens, and so fulfil the law of Christ.' },
      { ref: '1 Thessalonians 2:8', note: 'We imparted not the gospel only, but our own souls, because you were dear to us.' },
      { ref: 'Mark 10:29-30', note: 'Whoever left houses or family receives a hundredfold now, in this time — houses and brothers, with persecutions.' },
    ],
  },
  {
    id: 'seed',
    title: 'The seed falling into the ground',
    blurb: 'The cost side. Nothing takes root without something dying first.',
    verses: [
      { ref: 'John 12:24-26', note: 'Unless a grain of wheat falls into the ground and dies, it remains alone.' },
      { ref: 'Luke 9:23-24', note: 'Deny himself, take up his cross daily. Whoever loses his life will save it.' },
      { ref: 'Galatians 2:20', note: 'I am crucified with Christ, nevertheless I live.' },
      { ref: 'Philippians 3:7-8', note: 'What things were gain to me, those I counted loss.' },
      { ref: 'Luke 14:28-33', note: 'Count the cost before you build the tower. Jesus recommends the arithmetic.' },
    ],
  },
  {
    id: 'wait',
    title: 'Waiting and timing',
    blurb: 'For the stretch where nothing is settled yet.',
    verses: [
      { ref: 'Psalm 27:14', note: 'Wait on the Lord; be of good courage. Waiting is commanded, not merely endured.' },
      { ref: 'Isaiah 40:31', note: 'They that wait upon the Lord shall renew their strength.' },
      { ref: 'Habakkuk 2:1-3', note: 'Write the vision; it is for an appointed time. Though it tarry, wait for it.' },
      { ref: 'Psalm 37:7', note: 'Rest in the Lord and wait patiently for him.' },
      { ref: 'Ecclesiastes 3:1-8', note: 'A time to plant and a time to pluck up. Seasons, not one right answer forever.' },
    ],
  },
  {
    id: 'test',
    title: 'Testing a church or a teacher',
    blurb: 'Before you hand your family to a community, weigh it the way Scripture says to.',
    verses: [
      { ref: 'Acts 17:11', note: 'They searched the scriptures daily to see whether those things were so. Nobility, not suspicion.' },
      { ref: '1 Timothy 3:1-13', note: 'The qualifications — mostly character, mostly household, barely gifting.' },
      { ref: 'Titus 1:5-9', note: 'Holding fast the faithful word, able to exhort and convince the gainsayers.' },
      { ref: 'Matthew 7:15-20', note: 'By their fruits you shall know them. Watch the fruit over time, not the platform.' },
      { ref: '1 John 4:1', note: 'Believe not every spirit; test them.' },
      { ref: '2 Timothy 4:3-4', note: 'The season when men will not endure sound doctrine but heap up teachers.' },
    ],
  },
  {
    id: 'peace',
    title: 'Peace, provision and contentment',
    blurb: 'How to read the settledness — and how not to over-read it.',
    verses: [
      { ref: 'Colossians 3:15-17', note: 'Let the peace of God rule — literally, umpire — in your hearts.' },
      { ref: 'Philippians 4:6-7', note: 'Peace that passes understanding guards heart and mind. Given after the asking.' },
      { ref: 'Isaiah 30:21', note: 'You shall hear a word behind you: this is the way, walk in it.' },
      { ref: 'Matthew 6:31-33', note: 'Seek first the kingdom; these things will be added.' },
      { ref: '1 Timothy 6:6-8', note: 'Godliness with contentment is great gain.' },
      { ref: 'Philippians 4:11-13', note: 'I have learned, in whatsoever state I am, to be content. Learned — not felt.' },
    ],
  },
];

/**
 * A practical instrument for a specific decision. Nine questions, each with
 * a scripture behind it. Run it on one piece of ground, dated, and run it
 * again when something changes.
 */
export const DISCERN_ITEMS = [
  { id: 'scripture', label: 'Scripture', ask: 'Does the word settle any part of this outright?', ref: 'Psalm 119:105; 1 Thessalonians 4:3' },
  { id: 'prayer', label: 'Prayer', ask: 'Have I actually asked, and waited long enough to hear?', ref: 'James 1:5; Luke 6:12-13' },
  { id: 'counsel', label: 'Counsel', ask: 'Who wise has weighed in — by name?', ref: 'Proverbs 11:14; 15:22' },
  { id: 'church', label: 'The church', ask: 'Do the people who know me best affirm this?', ref: 'Acts 13:1-3' },
  { id: 'wife', label: 'My wife', ask: 'Where do we land together, in her words?', ref: 'Genesis 2:24; 1 Peter 3:7' },
  { id: 'doors', label: 'Open and closed doors', ask: 'What has actually opened or shut, apart from my effort?', ref: 'Acts 16:6-10; Revelation 3:8' },
  { id: 'desire', label: 'Desire', ask: 'Has God shaped what I want, or am I baptising a preference?', ref: 'Psalm 37:4; Philippians 2:13' },
  { id: 'peace', label: 'Peace', ask: 'Is there settled peace here, or dread I keep talking myself out of?', ref: 'Colossians 3:15' },
  { id: 'fruit', label: 'Fruit', ask: 'What has this already produced in me and my family?', ref: 'Matthew 7:16-20' },
  { id: 'cost', label: 'Cost', ask: 'Have I counted it out loud, and am I willing?', ref: 'Luke 14:28-33; John 12:24' },
];

export const DISCERN_STATES = [
  { id: 'unasked', label: 'Not asked yet', tone: 'unknown' },
  { id: 'unclear', label: 'Asked, still unclear', tone: 'thin' },
  { id: 'leaning', label: 'Leaning', tone: 'ok' },
  { id: 'clear', label: 'Clear', tone: 'good' },
  { id: 'against', label: 'Clearly against', tone: 'bad' },
];
