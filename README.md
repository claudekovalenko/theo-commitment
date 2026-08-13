# True North

A private, offline PWA for keeping track of where your theological convictions
actually sit, how the ministry you're weighing lines up with them, and what
you're learning along the way.

The icon is a compass needle. That's the whole idea of the app: name your
convictions, then get an honest reading on the play you're running.

## What's in it

**Compass** — one needle, one reading. It shows how far off your heading you
are with whichever context you're focused on, the friction points behind that
number, anything due today, and how long it's been since you last wrote
something down.

**Convictions** — what you hold, and how firmly: non-negotiable, conviction,
still forming, preference. Each one carries your own wording, the scripture
behind it, the test for when it's true of you, and the edge you're still
working out. The weight you assign is what the compass math uses, so being
honest about "still forming" actually changes the reading.

**Plays** — the networks, churches, roles and opportunities you're weighing.
Run a *check*: rate the context against every conviction (aligned / mostly /
tension / conflict / don't know yet), write one honest paragraph, save it.
Checks are dated, so re-checking over time shows drift rather than a single
snapshot. Anything you rate "don't know yet" is kept out of the score and
listed separately — an unknown is a question to go ask, not a mark against
anyone.

**Log** — learnings, dated and tagged: scripture, books, sermons,
conversations, open questions, places you were wrong. Any entry can become a
follow-up in one tap.

**People** — disciple-making by name, with the next real step and how long it's
been since you last met.

**Do** — the follow-ups, with what's due surfaced first.

### How the reading is calculated

Each conviction's weight (non-negotiable 3, conviction 2, still forming 1,
preference 0.5) is multiplied by the level you rated (aligned 1.0, mostly 0.72,
tension 0.3, conflict 0). The weighted total becomes a percentage, and the
needle swings `(1 − percentage) × 180°` off north. Non-negotiables rated
tension or conflict are called out separately, because a good average can hide
one thing you'd never actually live with.

## Privacy

- Everything lives in this browser's local storage on your device. No account,
  no sync, no server, no analytics.
- The app makes **zero** network requests. Its Content-Security-Policy blocks
  outbound connections outright, so nothing can leak even by accident.
- Optional PIN lock: turning it on encrypts all your data at rest with AES-GCM,
  using a key derived from your PIN (PBKDF2-SHA256, 310k rounds). The key only
  ever exists in memory while the app is unlocked, and it re-locks after an idle
  timeout you choose.
- Nobody can recover that PIN for you — not even by rebuilding the app. Take a
  backup (Settings → Back up) before you turn the lock on.
- A backup file is plain JSON and is *not* encrypted. Keep it somewhere you
  trust.

## Running it

Any static host works. Locally:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

To install it on your phone, it needs to be served over HTTPS. The simplest
route is GitHub Pages: repo **Settings → Pages → Deploy from a branch**, pick
this branch and the root folder. Then open the page in Safari or Chrome and use
**Share → Add to Home Screen** (iOS) or the install icon in the address bar
(Android / desktop). Once installed it runs offline and looks like any other
app on the home screen — no browser chrome, no obvious label about what it is.

## Starter content

The app ships pre-filled with the convictions you described — disciple making,
healthy theology, complementarian conviction, healthy families, strong
preaching, highly missional — plus E3 as a context to check against. All of it
is editable, and **Settings → Clear the starter content** removes anything you
haven't touched while keeping what you've written yourself.

## Layout

```
index.html            shell, lock screen, sheet container
styles.css            all styling
sw.js                 offline cache
manifest.webmanifest  install metadata
js/store.js           persistence, encryption, import/export
js/model.js           vocabulary + the scoring math
js/seed.js            starter content
js/ui.js              DOM helpers, sheet, toasts, form controls
js/editors.js         every add/edit form
js/router.js          hash routing
js/views/*.js         one file per tab, plus settings
tools/make_icons.py   regenerates icons/ (no dependencies)
```

No build step, no framework, no package dependencies. Edit a file, reload.
