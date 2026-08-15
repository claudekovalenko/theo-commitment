// Models of church — the shape of the thing, before the name on the sign.
//
// Described as fairly as I can: what each one is, what it tends to do well,
// what it tends to cost, and the question it puts to you specifically. Your
// stance on each is yours to set, and it travels with every community you
// weigh that runs on that model.

export const CHURCH_MODELS = [
  {
    id: 'established',
    name: 'Established congregation',
    blurb: 'An existing local church with history, formal membership and settled governance.',
    marks: ['Sunday gathering at its centre', 'Elders or elders and deacons', 'Inherited building and budget', 'Members who were here before you'],
    strengths: ['Continuity and accountability', 'Preaching has a real pulpit', 'Older saints your kids can know', 'Hard to run it on personality alone'],
    costs: ['Change is slow and costly', 'Culture already set before you arrive', 'Programmes can absorb the disciple-making'],
    asks: 'Could you submit to a table you didn\'t build — and stay long enough to be trusted at it?',
  },
  {
    id: 'plant',
    name: 'Church plant',
    blurb: 'A new work started from a small sending core.',
    marks: ['Small, high-ownership core team', 'Everything decided for the first time', 'Bivocational or externally funded early', 'Identity still forming'],
    strengths: ['You set the DNA', 'Disciple-making is the only option', 'Fast to mobilise', 'Everyone carries weight'],
    costs: ['Fragile — a few families leaving is a crisis', 'Founder-dependence is the standing temptation', 'Hard on a wife and small children', 'Few older saints in the room'],
    asks: 'Is your family in a season that can carry the first three years of one?',
  },
  {
    id: 'house',
    name: 'House church / simple church',
    blurb: 'Church in homes, lay-led, multiplying by division rather than addition.',
    marks: ['Homes, not buildings', 'Meal and table at the centre', 'Lay-led, low overhead', 'Multiplies when it outgrows a room'],
    strengths: ['Intertwined by design — hard to hide', 'Kids see adult faith up close', 'Cheap to plant, easy to multiply', 'Every member has to carry something'],
    costs: ['Teaching depth depends entirely on who\'s in the room', 'Thin on qualified eldership and correction', 'Can drift or splinter without outside accountability', 'Little room for a preaching ministry as such'],
    asks: 'Where does sound teaching and real oversight come from when the room is small?',
  },
  {
    id: 'missional',
    name: 'Missional communities',
    blurb: 'Mid-size communities (20–50) on mission together, gathering centrally less often.',
    marks: ['Mid-size community is the primary unit', 'Each one aimed at a place or people', 'Central gathering supports, doesn\'t replace', 'Leaders raised from within'],
    strengths: ['Mission and family life run together', 'Big enough for real teaching, small enough to be known', 'Natural place for kids to be around adults on mission'],
    costs: ['Leader-hungry — quality varies community to community', 'Can burn people out in the name of mission', 'Central teaching can thin out'],
    asks: 'Could you hand your household to whoever leads the community you\'re placed in?',
  },
  {
    id: 'cell',
    name: 'Cell church',
    blurb: 'Small groups as the church\'s basic unit, with a larger celebration gathering.',
    marks: ['Cells meet weekly, celebration regularly', 'Clear multiplication targets', 'Coaching structure over the cells', 'Membership runs through the cell'],
    strengths: ['Everyone is in a small group by default', 'Clear pathway from new believer to leader', 'Pastoral care distributed'],
    costs: ['Can become mechanical — the system over the people', 'Multiplication targets can strain friendships', 'Depends on the quality of coaching'],
    asks: 'Does the structure serve the relationships, or the other way around?',
  },
  {
    id: 'multisite',
    name: 'Multi-site / attractional',
    blurb: 'One church in several locations, usually with central teaching and strong programming.',
    marks: ['Central preaching, often on video', 'Campus pastors on the ground', 'Strong systems, kids and student programmes', 'Reach measured in attendance'],
    strengths: ['Excellent teaching resources', 'Real reach into a city', 'Age-specific ministry is well-run', 'Easy for an outsider to walk into'],
    costs: ['Easy to attend for years and be unknown', 'Kids formed by a programme more than by households', 'Distance between the pulpit and your kitchen table'],
    asks: 'Could your family be genuinely known here, or only well served?',
  },
  {
    id: 'family',
    name: 'Family-integrated',
    blurb: 'Households worship together; little or no age segregation.',
    marks: ['Kids in the service, not in a separate programme', 'Fathers held responsible for household discipleship', 'Multi-generational by design'],
    strengths: ['Formation runs through the home', 'Your kids see you worship', 'Strong on household catechesis'],
    costs: ['Can shade into an ideology about family', 'Harder for those without intact households', 'Outreach can narrow'],
    asks: 'Does it disciple households, or does it make family the point?',
  },
  {
    id: 'network',
    name: 'Sending network / parachurch team',
    blurb: 'Not a congregation — a team or network you run with, alongside a local church.',
    marks: ['Mission-focused rather than gathered', 'Training, sending, shared method', 'Membership is in a church elsewhere', 'Often crosses cities and countries'],
    strengths: ['Sharpens method and urgency', 'Peers doing the same work', 'Portable — travels with you'],
    costs: ['Not a church, and can\'t pastor your family like one', 'Loyalty can quietly outrun your local church', 'Accountability is thinner than it looks'],
    asks: 'Where does your family actually belong on Sunday, and does this strengthen that or compete with it?',
  },
];

export const MODEL_STANCES = [
  { id: 'home', label: 'At home here', tone: 'good', weight: 1 },
  { id: 'workable', label: 'Could work', tone: 'ok', weight: 0.7 },
  { id: 'friction', label: 'Real friction', tone: 'thin', weight: 0.35 },
  { id: 'no', label: 'Not for us', tone: 'bad', weight: 0 },
  { id: 'unknown', label: 'Haven\'t decided', tone: 'unknown', weight: null },
];
