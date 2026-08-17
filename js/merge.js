// Two names, one thing.
//
// Kept on its own so both the store (which folds NPL into E3 on upgrade) and
// the editors (which let you do it yourself) can use it without importing each
// other in a circle.

/**
 * Folds one ministry into another. Everything written about the one being
 * folded in moves across — nothing is thrown away, because a mistake about
 * which name belongs to which body shouldn't cost you four years of notes.
 */
export function mergeInto(st, fromId, intoId) {
  const from = st.contexts.find((c) => c.id === fromId);
  const into = st.contexts.find((c) => c.id === intoId);
  if (!from || !into || fromId === intoId) return false;

  // Fill blanks on the survivor; never overwrite something already written.
  ['myPart', 'myPartModelId', 'output', 'outputModelId', 'modelId', 'homeMeans',
    'placeMode', 'horizon', 'placeId'].forEach((k) => {
    if (!into[k] && from[k]) into[k] = from[k];
  });
  if (from.notes) into.notes = [into.notes, from.notes].filter(Boolean).join('\n\n');
  into.aka = [...new Set([...(into.aka || []), from.name, ...(from.aka || [])].filter(Boolean))];

  // Surveys: keep the survivor's latest and fill its gaps from the other's.
  const newest = (id) => st.checks.filter((k) => k.contextId === id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  // Fill the newer survey from the older one, whichever side each came from —
  // the newest check is the one everything else reads, so it must end up whole.
  const a = newest(intoId);
  const b = newest(fromId);
  const target = !a ? b : !b ? a : ((a.date || '') >= (b.date || '') ? a : b);
  const source = target === a ? b : a;
  if (target && source) {
    ['ratings', 'barriers', 'theirs'].forEach((map) => {
      if (!source[map]) return;
      if (!target[map]) target[map] = {};
      Object.entries(source[map]).forEach(([k, v]) => { if (!target[map][k]) target[map][k] = v; });
    });
    ['kid', 'formation', 'us'].forEach((k) => {
      const unset = !target[k] || ['unknown', 'na'].includes(target[k].level);
      if (unset && source[k]) target[k] = source[k];
    });
    ['home', 'settle'].forEach((k) => {
      if ((!target[k] || target[k] === 'unknown') && source[k]) target[k] = source[k];
    });
  }
  st.checks.forEach((k) => { if (k.contextId === fromId) k.contextId = intoId; });

  ['goals', 'returns', 'blocks', 'people'].forEach((list) => {
    (st[list] || []).forEach((r) => { if (r.groundId === fromId) r.groundId = intoId; });
  });
  (st.notes || []).forEach((n) => {
    if (!(n.contextIds || []).includes(fromId)) return;
    n.contextIds = [...new Set(n.contextIds.map((i) => (i === fromId ? intoId : i)))];
  });
  st.contexts.forEach((c) => { if (c.placeId === fromId) c.placeId = intoId; });
  if (st.calling?.placeId === fromId) st.calling.placeId = intoId;

  st.contexts = st.contexts.filter((c) => c.id !== fromId);
  return true;
}
