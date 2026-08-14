export const ROUTES = ['compass', 'convictions', 'where', 'log', 'people', 'do'];

let handler = null;

export function currentRoute() {
  const r = location.hash.replace(/^#\/?/, '');
  if (r === 'plays') return 'where'; // the tab this used to be called
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
