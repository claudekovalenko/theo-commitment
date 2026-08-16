export const ROUTES = ['board', 'soil', 'unsettled', 'word', 'journal'];

// what these tabs were called in earlier versions
const OLD = {
  compass: 'board', target: 'board', where: 'board', land: 'board', plays: 'board',
  convictions: 'soil', do: 'unsettled', log: 'journal', people: 'journal',
};

let handler = null;

export function currentRoute() {
  const r = location.hash.replace(/^#\/?/, '');
  if (OLD[r]) return OLD[r];
  return ROUTES.includes(r) ? r : 'board';
}

export function onRoute(fn) {
  handler = fn;
  window.addEventListener('hashchange', () => fn(currentRoute()));
}

export function go(route) {
  const target = `#/${route}`;
  if (location.hash === target) handler?.(route);
  else location.hash = target;
}
