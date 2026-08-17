// Who I am when I come back.
//
// The app asks whether my son would come home sharper or softer. It never asked
// the same thing about me. If I come back from these people less myself — less
// the heart I actually want — that isn't a mood to talk myself out of. Written
// down and dated, it's the most honest evidence in here.

export const SELF_LEVELS = [
  { id: 'fully', label: 'Fully myself', tone: 'good', worth: 1 },
  { id: 'mostly', label: 'Mostly, with edges tucked in', tone: 'ok', worth: 0.7 },
  { id: 'version', label: 'A version of myself', tone: 'thin', worth: 0.3 },
  { id: 'not', label: 'Not myself', tone: 'bad', worth: 0 },
];

export const CHRIST_LEVELS = [
  { id: 'more', label: 'More like Christ', tone: 'good' },
  { id: 'same', label: 'About the same', tone: 'thin' },
  { id: 'less', label: 'Less like Christ', tone: 'bad' },
];

export const returnsFor = (state, groundId) => (state.returns || [])
  .filter((r) => r.groundId === groundId)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

/**
 * What the pattern says. One off day is a day; the same answer three times is
 * an answer, and it doesn't get outvoted by how well they line up on paper.
 */
export function returnRead(list) {
  if (!list.length) {
    return {
      word: 'Never asked', tone: 'unknown', pattern: false,
      why: 'You haven\'t written down who you were when you came back from them.',
    };
  }
  const off = list.filter((r) => r.self === 'version' || r.self === 'not');
  const less = list.filter((r) => r.christ === 'less');
  const n = list.length;

  if (off.length >= 2 && off.length >= n / 2) {
    return {
      word: 'Not yourself here', tone: 'bad', pattern: true,
      why: `${off.length} of ${n} times back from them, you weren't yourself. That many times isn't a mood.`,
    };
  }
  if (less.length >= 2 && less.length >= n / 2) {
    return {
      word: 'Formed the wrong way', tone: 'bad', pattern: true,
      why: `${less.length} of ${n} times you came back less like Christ, not more.`,
    };
  }
  if (off.length) {
    return {
      word: 'Once, off', tone: 'thin', pattern: false,
      why: `${off.length} of ${n} times you weren't quite yourself. Worth watching, not deciding on.`,
    };
  }
  if (n === 1) {
    return { word: 'Once, and yourself', tone: 'ok', pattern: false, why: 'One time back, and you were yourself. Do it again before you trust it.' };
  }
  return {
    word: 'Yourself here', tone: 'good', pattern: false,
    why: `${n} times back from them, and you were yourself every time.`,
  };
}
