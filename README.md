# True North

A private, offline PWA for weighing the decisions that touch your whole life at
once — a town, a church, a network, a role — against what you actually hold.

The icon is a compass needle. That's the whole idea: name your convictions,
then get an honest reading on the play you're running.

## The architecture: five areas, one needle

Every conviction belongs to an **area of life**, and the compass scores each
area separately as well as overall:

| Area | What it holds |
| --- | --- |
| **Walking with God** | He is the goal, not the means to the rest of it. Listed first, always. |
| **Marriage** | The covenant that comes before any calling. |
| **Family & home** | The first congregation you're responsible for. |
| **Roots & place** | Somewhere long enough to be known and to be missed. |
| **Theology & ministry** | What you teach, how you disciple, where you go. |

This is the point of the design: a strong ministry score can quietly hide a bad
roots cost, and a single blended number lets it. Five meters don't. The compass
also names the weakest area outright, so the thing you'd rather not look at is
the thing on the screen.

Areas are data, not hardcoded — rename them, recolour them, or add your own in
Settings, and every conviction can be moved between them.

### Two questions the app keeps asking

**Us.** Every check records where you and your wife land on it — agreed,
leaning together, still talking, haven't really talked, not in the same place.
It is deliberately *not* scored. It just gets asked every single time, and when
the answer is "haven't really talked", the compass says so and offers to make it
a follow-up.

**The ten-year test.** Every place, church or role carries one question: could
we still be here in ten years? It shows on the card, and you can revise it
every time you learn something.

## What's in it

**Compass** — one needle, one reading. It shows how far off your heading you
are with whichever context you're focused on, the friction points behind that
number, anything due today, and how long it's been since you last wrote
something down.

**Convictions** — grouped by area, then by how firmly you hold them:
non-negotiable, conviction, still forming, preference. Each one carries your own
wording, the scripture behind it, the test for when it's true of you, and the
edge you're still working out. The weight you assign is what the compass math
uses, so being honest about "still forming" actually changes the reading.

**Plays** — the places, churches, networks, roles and opportunities you're
weighing, grouped by kind. Run a *check*: rate it against every conviction
(aligned / mostly / tension / conflict / don't know yet), answer the "us"
question, write one honest paragraph, save it. Long checks can be done one area
at a time using the filter chips. Checks are dated, so re-checking shows drift
rather than a single snapshot, and anything rated "don't know yet" stays out of
the score and gets listed separately — an unknown is a question to go ask, not a
mark against anyone.

Once two things have been checked, a **side-by-side table** appears: contexts
down the left, areas across the top. That's the view for "which of these places
could we actually put down roots in".

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
needle swings `(1 − percentage) × 180°` off north. The same math runs again per
area, which is what the five meters show. Non-negotiables rated tension or
conflict are called out separately, because a good average can hide one thing
you'd never actually live with.

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

The app ships pre-filled with sixteen convictions across the five areas —
abiding before usefulness, one flesh before one calling, somewhere long enough
to be known, a church we could belong to for a decade, disciple making that
multiplies, and the rest — plus "Where we are now" and E3 as things to check
against. All of it is editable, and **Settings → Clear the starter content**
removes anything you haven't touched while keeping what you've written yourself.

Upgrading from v1 keeps everything: your convictions get filed into the right
areas, your checks and log entries are untouched, and the areas that didn't
exist before get stocked with starters so they aren't empty shells.

## Layout

```
index.html            shell, lock screen, sheet container
styles.css            all styling
sw.js                 offline cache
manifest.webmanifest  install metadata
js/store.js           persistence, encryption, schema migrations
js/model.js           areas, vocabulary + the scoring math
js/seed.js            starter content
js/ui.js              DOM helpers, sheet, toasts, form controls
js/editors.js         every add/edit form
js/router.js          hash routing
js/views/*.js         one file per tab, plus settings and shared parts
tools/make_icons.py   regenerates icons/ (no dependencies)
tools/build_single.mjs  bundles dist/true-north.html for single-page hosts
```

No build step, no framework, no package dependencies. Edit a file, reload.
