export const ROUTES = ['target', 'land', 'soil', 'unsettled', 'journal'];

// what these tabs were called in earlier versions
const OLD = { compass: 'target', where: 'land', plays: 'land', convictions: 'soil', do: 'unsettled', log: 'journal', people: 'journal' };

let handler = null;

export function currentRoute() {
  const r = location.hash.replace(/^#\/?/, '');
  if (OLD[r]) return OLD[r];
  return ROUTES.includes(r) ? r : 'target';
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
