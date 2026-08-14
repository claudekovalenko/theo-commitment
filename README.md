# Good Ground

A private, offline app for one question:

> **Is this ground I could build on?**

Not a compass, not a scorecard. You already know roughly what you want. What
you keep not doing is saying *we're building here* — so this app treats that
hesitation as the thing to work on, and turns it into a finite list.

## The calling

If the city is settled, you say so once — **Called to Los Angeles**, why, and by
when — and the app stops asking *where*. It holds the calling as decided ("not
re-decided every time you get nervous"), turns the city into a piece of ground
everything else hangs off, and changes the question to **who in Los Angeles?**

After that, the things you weigh are churches, household networks and
communities inside the calling, not towns. Anything that would put you somewhere
else says so plainly. Places you'd already looked at stay under *Elsewhere*, for
comparison.

## The gate

Two questions decide a piece of ground, and they sit above everything else:

1. **Could I leave my kids with these people, unsupervised?** Not the leaders on
   stage — the ordinary households you'd actually be around.
2. **He'd come back formed. Which direction — sharper and more on mission, or
   softer and more comfortable?**

Safe-but-soft is still a no. Both answers cap how deep the roots can grow, no
matter how well the place scores on everything else: *only with me there* caps
it at 45%, *softer* caps it at 50%. When the gate is red the app won't invite
you to build — the primary button becomes **Name what would have to change**,
and the verdict says it plainly: *You wouldn't leave your kids here
unsupervised. Until that changes, nothing else counts.* You can still decide
anyway; it just makes you look at what you're overriding first.

Under the two questions sits a third: **would we buy a home here?**

And **spiritual family is counted by name.** Every person you're walking with
belongs to a piece of ground, so a place either has households you could name or
it doesn't. "Intertwined" is people, not a feeling.

Above all of it, on every screen: **God first, continually.** He's listed first
because he's the goal, not because he scores highest.

## How it thinks

**Ground.** A town, a church, an offer, a role. Anything that isn't a town
carries one required question — *if we said yes, where would we live?* — because
an offer is only as good as the land it puts you on.

**The soil.** What has to be true of a place before you'd build there, grouped
by area of life: walking with God, marriage, family & home, the ground itself
(community, church, cost, staying power), theology & ministry. Each one is
weighted from *must have* down to *nice to have*, and that weight is what every
survey is scored against.

**Walking the land.** Rate a place against every requirement: yes / mostly /
thin / no / unsurveyed. Unsurveyed is a real answer — it stays out of the score
and turns into something to go find out. Every walk is dated, so you can see a
place change as you learn it.

**Roots.** The drawing on the home screen is the whole model in one picture: how
deep you could actually root here. Depth is earned by walking the land and by
settling what's in the way — never by wanting it badly. There's a dashed line
marked *deep enough to stay*; either your roots reach it or they don't.

**In the way.** Everything unsettled, in one list. Each one names what would
settle it and who could answer. When you look at a place and still don't say
yes, the app asks why and writes it down — and if the same reason comes back
three times, it says so. That isn't hesitation any more; it's an answer.

**Breaking ground.** The point of the app. When you commit, you write one
sentence about what you're saying yes to, and the sapling becomes a house. You
can commit with things still unsettled — the app will show you exactly what
they are first, because saying yes with your eyes open is different from
drifting into it.

## The two questions it always asks

**Us.** Every survey records where you and your wife land on it — agreed,
leaning together, still talking, haven't really talked, not in the same place.
Never scored. Just asked, every time.

**Ten years.** Every piece of ground carries one question: could we still be
here in ten years?

## Tabs

| | |
| --- | --- |
| **Ground** | The one place in front of you, and what stands between you and yes |
| **Land** | Every piece of ground, ranked and compared area by area |
| **Soil** | What the ground has to hold, by area of life |
| **In the way** | Everything unsettled, and what would settle it |
| **Journal** | What you're learning, and the people you're walking with |

## Privacy

- Everything lives in this browser's local storage on this device. No account,
  no sync, no server, no analytics.
- The app makes **zero** network requests. Its Content-Security-Policy blocks
  outbound connections outright.
- Optional PIN lock encrypts everything at rest (AES-GCM, key derived with
  PBKDF2-SHA256, 310k rounds), held in memory only while unlocked, with an idle
  auto-lock. Nobody can recover the PIN for you — back up first.
- A backup file is plain JSON and is *not* encrypted.

## Running it

Any static host. Locally:

```sh
python3 -m http.server 8000
```

For your phone it needs HTTPS — GitHub Pages off this branch works: repo
**Settings → Pages → Deploy from a branch → root**. Then Share → Add to Home
Screen (iOS) or the install icon (Android / desktop). It runs offline once
installed.

## Upgrading

Old data migrates in place. Convictions become requirements, contexts become
ground, checks become surveys, and anything that was an open follow-up becomes
something in the way. Nothing you wrote is discarded.

## Layout

```
index.html            shell, lock screen, sheet container
styles.css            the whole visual system
sw.js                 offline cache
js/store.js           persistence, encryption, migrations
js/model.js           vocabulary, survey math, verdicts
js/seed.js            starter content
js/ui.js              DOM helpers, sheet, form controls
js/editors.js         every add/edit form, plus breaking ground
js/views/parts.js     the root drawing and area bars
js/views/*.js         one file per tab, plus settings
tools/make_icons.py   regenerates icons/ (no dependencies)
tools/build_single.mjs  bundles dist/good-ground.html for single-page hosts
```

No build step, no framework, no dependencies. Edit a file, reload.
