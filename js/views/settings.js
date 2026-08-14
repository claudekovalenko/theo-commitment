// Settings: the PIN lock, backups, and getting rid of the starter content.

import * as store from './../store.js';
import {
  h, frag, field, input, area, openSheet, closeSheet, confirmSheet, toast, section,
} from './../ui.js';
import { editDomain } from './../editors.js';

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- PIN ---------- */

function setPin() {
  let pin = '';
  let again = '';
  openSheet('Set a PIN', () => frag(
    h('p', { class: 'muted small' },
      'Your entries get encrypted on this device with this PIN. Nothing is sent anywhere — which also means '
      + 'nobody can recover it for you. Export a backup before you turn this on.'),
    field('PIN', h('input', { type: 'password', inputmode: 'numeric', autocomplete: 'new-password', onInput: (e) => { pin = e.target.value; } })),
    field('Again', h('input', { type: 'password', inputmode: 'numeric', autocomplete: 'new-password', onInput: (e) => { again = e.target.value; } })),
    h('button', {
      class: 'btn primary block',
      onClick: async () => {
        if (pin.length < 4) return toast('At least 4 characters');
        if (pin !== again) return toast('Those don\'t match');
        await store.enableLock(pin);
        closeSheet(true);
        toast('Lock is on');
      },
    }, 'Turn on the lock'),
  ));
}

/* ---------- import / export ---------- */

function exportSheet() {
  const json = store.exportJSON();
  openSheet('Backup', () => frag(
    h('p', { class: 'muted small' }, 'A plain-text copy of everything. Keep it somewhere you trust — it is not encrypted.'),
    h('button', {
      class: 'btn primary block',
      onClick: () => download(`good-ground-${new Date().toISOString().slice(0, 10)}.json`, json),
    }, 'Download file'),
    h('button', {
      class: 'btn block', style: 'margin-top:10px',
      onClick: async () => {
        try { await navigator.clipboard.writeText(json); toast('Copied'); } catch { toast('Copy failed — use the text below'); }
      },
    }, 'Copy to clipboard'),
    h('div', { style: 'margin-top:14px' }, area({ value: json, readonly: true, style: 'min-height:160px; font-size:.75rem' })),
  ));
}

function importSheet() {
  let text = '';
  const load = (t) => { text = t; toast('Loaded — now pick how to apply it'); };
  openSheet('Restore', () => frag(
    h('p', { class: 'muted small' }, 'Bring a backup back in. "Merge" keeps what\'s here and adds anything missing.'),
    h('input', {
      type: 'file', accept: 'application/json,.json',
      onChange: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => load(String(reader.result));
        reader.readAsText(file);
      },
    }),
    h('div', { style: 'margin-top:12px' },
      field('…or paste it', area({ placeholder: '{ "version": 1, … }', onInput: (e) => { text = e.target.value; } }))),
    h('div', { class: 'stack' },
      h('button', {
        class: 'btn primary block',
        onClick: () => apply(true),
      }, 'Merge into what I have'),
      h('button', { class: 'btn danger block', onClick: () => apply(false) }, 'Replace everything')),
  ));

  async function apply(merge) {
    if (!text.trim()) return toast('Nothing to restore');
    if (!merge) {
      const ok = await confirmSheet({
        title: 'Replace everything?', message: 'Your current entries on this device will be gone.',
        confirmLabel: 'Replace', danger: true,
      });
      if (!ok) return;
    }
    try {
      store.importJSON(text, { merge });
      closeSheet(true);
      toast(merge ? 'Merged' : 'Restored');
    } catch {
      toast('That file didn\'t parse');
    }
  }
}

/* ---------- main sheet ---------- */

export function openSettings() {
  const build = () => {
    const state = store.get();
    const locked = store.isEncrypted();

    return frag(
      field('What should this call you?', input({
        value: state.settings.name || '', placeholder: 'Optional',
        onInput: (e) => store.update((s) => { s.settings.name = e.target.value; }),
      })),

      section('Is it saving?'),
      (() => {
        const st = store.saveStatus();
        return h('div', { class: 'card' },
          h('div', { class: 'row spread' },
            h('span', { class: 'small' }, 'Storage on this device'),
            h('span', { class: `small tone-${st.persistent ? 'good' : 'bad'}` },
              st.persistent ? 'Working' : 'Blocked')),
          h('div', { class: 'row spread', style: 'margin-top:8px' },
            h('span', { class: 'small' }, 'Last saved'),
            h('span', { class: 'small muted' }, st.lastSaved ? new Date(st.lastSaved).toLocaleString() : 'not yet')),
          h('p', { class: 'tiny muted', style: 'margin:10px 0 0' },
            st.persistent
              ? 'Entries live in this browser only. A different browser — or Safari versus the home-screen app — is a different notebook.'
              : 'Nothing you write here is being kept. Open the page in its own browser tab, or install it to the home screen.'));
      })(),

      section('Privacy'),
      h('div', { class: 'card' },
        h('p', { class: 'small muted', style: 'margin-bottom:12px' },
          locked
            ? 'Your data is encrypted on this device and unlocks with your PIN.'
            : 'Right now anyone holding this device can open it.'),
        locked
          ? frag(
            field('Lock again after', h('select', {
              onChange: (e) => store.update((s) => { s.settings.autoLockMinutes = Number(e.target.value); }),
            }, [0, 1, 5, 15, 60].map((m) => h('option', {
              value: m, selected: Number(state.settings.autoLockMinutes) === m,
            }, m === 0 ? 'Never' : `${m} minute${m === 1 ? '' : 's'} idle`)))),
            h('button', {
              class: 'btn ghost danger block',
              onClick: async () => {
                const ok = await confirmSheet({
                  title: 'Turn the lock off?', message: 'Your entries go back to plain storage on this device.',
                  confirmLabel: 'Turn it off', danger: true,
                });
                if (!ok) return;
                await store.disableLock();
                closeSheet(true);
                toast('Lock is off');
              },
            }, 'Turn off the PIN lock'))
          : h('button', { class: 'btn primary block', onClick: setPin }, 'Set a PIN')),

      field('The verse you want in front of you', area({
        value: state.settings.verse?.text || '',
        onInput: (e) => store.update((st) => {
          st.settings.verse = { ...(st.settings.verse || {}), text: e.target.value };
        }),
      })),
      field('Reference', input({
        value: state.settings.verse?.ref || '',
        onInput: (e) => store.update((st) => {
          st.settings.verse = { ...(st.settings.verse || {}), ref: e.target.value };
        }),
      })),

      section('Areas of life'),
      h('div', { class: 'card' },
        h('p', { class: 'small muted', style: 'margin-bottom:12px' },
          'Each area is measured on its own, so strong ground in one place can\'t hide thin soil somewhere else.'),
        h('div', { class: 'stack' },
          state.domains.map((d) => {
            const row = h('button', { class: 'card-tap row spread', onClick: () => editDomain(d) },
              h('span', { class: 'row', style: 'gap:8px' }, h('span', { class: 'dot' }), h('span', {}, d.label)),
              h('span', { class: 'small muted' },
                `${state.convictions.filter((c) => c.domainId === d.id).length}`));
            row.querySelector('.dot').style.color = d.color;
            return row;
          }),
          h('button', { class: 'btn sm', onClick: () => editDomain() }, 'Add an area'))),

      section('Your data'),
      h('div', { class: 'card stack' },
        h('button', { class: 'btn block', onClick: exportSheet }, 'Back up'),
        h('button', { class: 'btn block', onClick: importSheet }, 'Restore from a backup'),
        state.seeded
          ? h('button', {
            class: 'btn ghost block',
            onClick: async () => {
              const ok = await confirmSheet({
                title: 'Clear the starter content?',
                message: 'Removes only the examples that came pre-filled. Anything you edited or wrote yourself stays.',
                confirmLabel: 'Clear it',
              });
              if (!ok) return;
              store.update((s) => {
                for (const list of ['convictions', 'contexts', 'notes', 'blocks']) {
                  s[list] = s[list].filter((r) => !r.seeded);
                }
                s.checks = s.checks.filter((k) => s.contexts.some((c) => c.id === k.contextId));
                s.seeded = false;
              });
              closeSheet(true);
              toast('Starter content cleared');
            },
          }, 'Clear the starter content')
          : null,
        h('button', {
          class: 'btn danger block',
          onClick: async () => {
            const ok = await confirmSheet({
              title: 'Erase everything?',
              message: 'Every conviction, check, entry and follow-up on this device. There is no undo.',
              confirmLabel: 'Erase it all', danger: true,
            });
            if (!ok) return;
            store.wipe();
            location.reload();
          },
        }, 'Erase everything')),

      section('About'),
      h('p', { class: 'small muted' },
        'Good Ground keeps everything in this browser\'s local storage on this device. There is no account, no sync '
        + 'and no server — the app never makes a network request. That also means a backup is the only copy that '
        + 'survives clearing your browser data.'),
      h('p', { class: 'small muted' },
        'To install: open this page in Safari or Chrome, then Share → Add to Home Screen (iOS), or the install '
        + 'icon in the address bar (desktop / Android).'),
    );
  };

  openSheet('Settings', build);
}
