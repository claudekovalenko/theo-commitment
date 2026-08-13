export const ROUTES = ['compass', 'convictions', 'plays', 'log', 'people', 'do'];

let handler = null;

export function currentRoute() {
  const r = location.hash.replace(/^#\/?/, '');
  return ROUTES.includes(r) ? r : 'compass';
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
