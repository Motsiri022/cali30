# Testing

## Run everything

```
npm install          # once (build + test tools only)
npm run verify       # = npm run check (security scan) + npm test (behaviour tests)
```

`npm test` runs each suite in its own process, prints a table and writes `tests/last-run.txt`.
The tests load the real `index.html` and the real scripts, in the real order, inside **jsdom** (a browser simulator), with a controllable screen width so the same code runs as "mobile" or "desktop". No network is used.

## Results at the time of writing (2026-10-18)

| Suite | Checks | Covers |
|---|---:|---|
| `desktop.test.js` | 45 | Desktop pages, 30-day and roadmap data, sets saving, status, reload persistence, session player, rest timer, pause, finishing a workout, benchmark day, hold-step editing |
| `mobile.test.js` | 82 | All 10 mobile screens and their actions (Home, Workouts, Plan, Active workout, Complete, Exercise detail, Library, Progress, Schedule, Profile/Privacy/Help), settings, start-date editing, breakpoint switching, 48px touch-target classes |
| `skills-analytics.test.js` | 36 | Skill trackers (stages, logs, advance, caps, corrupt data) and analytics numbers (sets, reps, hold time, groups) |
| `security.test.js` | 30 | Tampered storage on 26 screens, hostile URLs, injected typed text, `esc`/`num`/`safeImg`/`cleanText`, CSP and static code properties |
| `resilience.test.js` | 34 | Corrupt/oversized/repaired storage, blocked and full storage, error boundary, failing handlers, log ring buffer, diagnostics report privacy, rest override, sound safety |
| **Total** | **227** | |

`npm run check` adds a **26-point static scan** (CSP, inline code, external URLs, dangerous APIs, escaping, dependency hygiene).

## Real-browser checks (done, repeatable)

A flat-folder install (all files in one directory) and an install missing `js/mobile/` were also reproduced in Chromium, and the unzipped `cali30.zip` was loaded on desktop and phone widths with zero console errors.

`python3 scripts/browser-check.py` (needs `pip install playwright` and `playwright install chromium`) opens the app in **Chromium 141** at 320, 360, 390, 430 and 768 px wide, visits 12 screens and reports console errors, failed requests, CSP violations and horizontal overflow. **Result: no problems.** An earlier run found a search bar overflowing at 320 px; it was fixed and re-checked.

Screenshots of the result are in `docs/screenshots/` and were compared by eye with the Figma screens (see `FIGMA-MAPPING.md`).

## What is NOT covered (be aware)

* **Real phones and Safari/Firefox.** Only Chromium (desktop, mobile emulation) and jsdom were used. Please try it on your own phone.
* **Audio and vibration on real devices.** The code paths are exercised, but nobody has listened to the beeps. iOS does not support vibration.
* **Share sheet and file download dialogs.** Tested with stand-ins for `navigator.share` and `URL.createObjectURL`.
* **Visual pixel-perfection.** Layout was checked by eye against Figma. There are no automated screenshot comparisons.
* **Photos.** None are included, so real image loading is only tested for the path-safety rules.
* **Accessibility audit.** Touch targets, labels, `aria-pressed`/`aria-current`, and focus outlines are in place, but no screen-reader testing was done.
* **Performance on slow devices.** The library renders 24 cards at a time; nothing else is heavy, but it was not measured.

## Adding tests

Copy any `tests/*.test.js` as a template. Use `boot({ mobile: true, hash: '#/library' })` to open a screen, `X.act('action-name')` to press a `data-action` button, `X.input(el, 'text')` to type, `X.saved()` to read LocalStorage, `waitFor()` for anything that depends on the URL changing. End with `done()`.
