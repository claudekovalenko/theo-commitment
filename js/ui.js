// Small DOM helpers: element building, the bottom sheet, toasts, form controls.

export const $ = (sel, root = document) => root.querySelector(sel);

/** h('div', {class: 'card', onClick: fn}, child, 'text') */
export function h(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in node && k !== 'list' && typeof v !== 'boolean') node[k] = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(3)) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export const frag = (...kids) => {
  const f = document.createDocumentFragment();
  kids.flat(3).filter((k) => k !== null && k !== undefined && k !== false)
    .forEach((k) => f.append(k.nodeType ? k : document.createTextNode(String(k))));
  return f;
};

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/* ---------- toast ---------- */

let toastTimer = null;
export function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

/* ---------- sheet (with a small back-stack) ---------- */

const stack = [];

export function openSheet(title, build, { replace = false } = {}) {
  if (replace) stack.pop();
  stack.push({ title, build });
  renderSheet();
}

export function closeSheet(all = false) {
  if (all) stack.length = 0; else stack.pop();
  renderSheet();
}

function renderSheet() {
  const sheet = $('#sheet');
  const top = stack[stack.length - 1];
  if (!top) {
    sheet.hidden = true;
    document.body.style.overflow = '';
    return;
  }
  $('#sheet-title').textContent = typeof top.title === 'function' ? top.title() : top.title;
  const body = clear($('#sheet-body'));
  body.append(top.build());
  body.scrollTop = 0;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
}

export function initSheet() {
  $('#sheet').addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeSheet();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stack.length) closeSheet();
  });
}

export function confirmSheet({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    openSheet(title, () => {
      const done = (v) => { closeSheet(); resolve(v); };
      return frag(
        h('p', { class: 'muted', text: message }),
        h('div', { class: 'stack' },
          h('button', { class: `btn block ${danger ? 'danger' : 'primary'}`, onClick: () => done(true) }, confirmLabel),
          h('button', { class: 'btn block ghost', onClick: () => done(false) }, 'Cancel')),
      );
    });
  });
}

/* ---------- form controls ---------- */

export function field(labelText, control, hint) {
  return h('label', { class: 'field' },
    h('span', {}, labelText),
    control,
    hint ? h('div', { class: 'small muted', style: 'margin-top:5px' }, hint) : null);
}

export function input(props = {}) {
  return h('input', { type: 'text', ...props });
}

export function area(props = {}) {
  return h('textarea', props);
}

export function segmented(options, value, onChange) {
  const wrap = h('div', { class: 'seg' });
  const paint = (v) => [...wrap.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === v)));
  options.forEach((o) => wrap.append(h('button', {
    type: 'button', dataset: { id: o.id }, title: o.help || '',
    onClick: () => { paint(o.id); onChange(o.id); },
  }, o.label)));
  paint(value);
  return wrap;
}

export function chipPicker(options, selected, onChange) {
  const chosen = new Set(selected);
  const wrap = h('div', { class: 'row wrap' });
  options.forEach((o) => {
    const b = h('button', { type: 'button', class: `chip${chosen.has(o.id) ? ' on' : ''}` }, o.label);
    b.addEventListener('click', () => {
      if (chosen.has(o.id)) chosen.delete(o.id); else chosen.add(o.id);
      b.className = `chip${chosen.has(o.id) ? ' on' : ''}`;
      onChange([...chosen]);
    });
    wrap.append(b);
  });
  return options.length ? wrap : h('p', { class: 'small muted' }, 'Nothing to tag yet.');
}

/* ---------- misc ---------- */

export function empty(text, actionLabel, onAction) {
  return h('div', { class: 'empty' },
    h('p', { style: 'margin-bottom:12px' }, text),
    actionLabel ? h('button', { class: 'btn sm', onClick: onAction }, actionLabel) : null);
}

export function section(title, actionLabel, onAction) {
  return h('div', { class: 'section' },
    h('h2', {}, title),
    actionLabel ? h('button', { class: 'icon-btn', onClick: onAction }, actionLabel) : null);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}${y === new Date().getFullYear() ? '' : `, ${y}`}`;
}

export function fmtMonth(iso) {
  const [y, m] = iso.slice(0, 7).split('-').map(Number);
  return `${MONTHS[m - 1]}${y === new Date().getFullYear() ? '' : ` ${y}`}`;
}

export function daysBetween(isoA, isoB) {
  return Math.round((Date.parse(`${isoB}T00:00:00`) - Date.parse(`${isoA}T00:00:00`)) / 86400000);
}

export function relDate(iso, todayIso) {
  const d = daysBetween(iso, todayIso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d === -1) return 'Tomorrow';
  if (d > 1 && d < 7) return `${d} days ago`;
  if (d < -1 && d > -7) return `in ${-d} days`;
  return fmtDate(iso);
}
