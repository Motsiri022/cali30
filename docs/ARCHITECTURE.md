# Architecture

Calis30 is a **static site**: HTML + CSS + plain JavaScript. There is no server, no framework, no bundler and no runtime dependency. Everything runs in the browser and saves to `LocalStorage`.

## Folder map

```
cali30/
├── index.html            Page shell, Content Security Policy, <script> list (ORDER MATTERS)
├── _headers              Extra security headers for hosts that support them (Netlify, Cloudflare Pages)
├── package.json / -lock  Build + test tools only (nothing ships to the browser from here)
├── tailwind.config.js    Tells Tailwind which files to scan for class names
├── css/
│   ├── tailwind.src.css  Input for the Tailwind build
│   ├── tailwind.css      GENERATED layout utilities (do not edit; run `npm run build:css`)
│   ├── fonts.css         @font-face rules for the self-hosted fonts
│   └── styles.css        Theme colours (two themes), shared component classes
├── fonts/                Barlow Condensed + Inter (woff2, Latin subset) and their licences
├── js/                   Application code (see "Load order")
│   └── mobile/           The 10 mobile screens from the Figma file
├── scripts/              security-check.js (static scan), browser-check.py (real-browser check)
├── tests/                5 test suites + helpers + run-all.js
└── docs/                 You are here
```

## Load order (why it matters)

The scripts are plain (non-module) scripts, so they **share global names**. A file may only use, at load time, what an earlier file defined. Functions defined later can be called at run time.

| # | File | Lines | Responsibility |
|---|------|------:|----------------|
| 1 | `js/log.js` | 42 | `Log` (ring buffer of errors/warnings), global error capture, `APP` name/version |
| 2 | `js/security.js` | 20 | `esc`, `num`, `cleanText`, `safeImg`, date validators. The only way untrusted text reaches the page |
| 3 | `js/data.js` | 133 | **All workouts** (exercises, sets, reps, holds, rest) for both programs; builds `DAYS`, `MONTHS`, `WORKOUTS` |
| 4 | `js/store.js` | 180 | `Store`: LocalStorage load/save, validation (`sanitize`), sets, skills, settings, session summaries |
| 5 | `js/state.js` | 17 | `ui` (screen state), `sess` (active workout), `ACTIONS` registry, `isMobile()` |
| 6 | `js/icons.js` | 43 | Inline SVG icons |
| 7 | `js/utils.js` | 113 | Helpers, exercise grouping, placeholder pictures, cues, progression ladders, exercise index |
| 8 | `js/components.js` | 23 | Desktop cards and bar chart |
| 9 | `js/pages.js` | 152 | Desktop pages: Overview, Workouts, Library, Schedule, Settings |
| 10 | `js/analytics.js` | 103 | Desktop "My progress" page, volume metrics |
| 11 | `js/skills.js` | 117 | Handstand / L-Sit / Muscle-up trackers (used by desktop and mobile) |
| 12 | `js/diagnostics.js` | 46 | `selfCheck()` and `diagnosticsReport()` |
| 13–20 | `js/mobile/m-*.js` | 509 | Mobile shell + Home, Workouts/Plan, Library/Exercise, Progress, Schedule, Active workout/Complete, Profile/Privacy/Help |
| 21 | `js/session.js` | 198 | Active-workout logic and desktop session page: timers, rest, sets, sound, finishing |
| 22 | `js/main.js` | 148 | Router, render + error boundary, click/input handling, startup checks |

If you ever see `X is not defined`, a file is missing, misspelled or out of order. Open **Profile → Help & feedback**; the first self-check names the missing pieces.

## How a screen is drawn

1. The URL hash changes (`#/library`). `main.js` `route()` splits it; `validRoute()` checks every id against known workouts/exercises (unknown → Home, and a warning is logged).
2. `renderInner()` picks a page function from the **desktop** or **mobile** table (decided by `isMobile()`: width below 1024px) and sets the theme.
3. The page function returns an HTML string built from data, with every untrusted value passed through `esc()`. It is placed in `#app` with `innerHTML`.
4. Clicks are handled by **one** delegated listener. Buttons carry `data-action="name"`; the handler is looked up in `ACTIONS` (mobile modules register theirs) or in the short chain in `main.js`.
5. `render()` is wrapped in `try/catch`. A crashing screen shows a friendly panel and writes to the log; it never leaves a blank page.

There are **no inline event handlers and no inline scripts**, which is what lets the Content Security Policy forbid them.

## Routes

| Route | Mobile screen | Desktop |
|---|---|---|
| `#/overview` | Home (`mHome`) | Overview |
| `#/workouts` | Workouts (`mWorkouts`) | Workouts grid / roadmap |
| `#/plan/<workoutId>` | Workout plan (`mPlan`) | same screen, narrow column |
| `#/session/<workoutId>` | Active workout (`mSession`) | Session page with side panels |
| `#/complete/<workoutId>` | Workout complete (`mComplete`) | same, narrow column |
| `#/library` | Exercise library (`mLibrary`) | Library grid |
| `#/exercise/<exerciseId>` | Exercise detail (`mExercise`) | same, narrow column |
| `#/progress` | Progress (`mProgress`) | My progress |
| `#/skills` | Skill trackers inside the mobile shell | Skills |
| `#/schedule` | Schedule (`mSchedule`) | Schedule list |
| `#/profile`, `#/profile/privacy`, `#/profile/help` | Profile, Account & privacy, Help & feedback | same, narrow column |
| `#/settings` | redirects to Profile | Settings (reset) |

Workout ids look like `b-d12` (beginner day 12) or `r-m2-w3-b1` (roadmap month 2, week 3, block 1). Exercise ids are slugs of the name (`push-up`).

## What is saved (LocalStorage key `calis30:v1`)

```
{ v: 1, program, joined, startDate,
  sets:     { [workoutId]: { [exerciseId]: [null | number, ...] } },   // one entry per set; number = logged reps/seconds
  skills:   { handstand|lsit|muscleup: { stage, logs:[{ t, s, v }] } },
  meta:     { [workoutId]: { ms, at, feel } },                         // finished-session time, date, "how did it feel"
  saved:    { [exerciseId]: 1 },                                       // bookmarks
  settings: { name, goal, weeklyTarget, restOverride, sound } }
```

Other keys: `calis30:log` (error log, max 60 entries) and `calis30:corrupt-backup` (only if saved data was unreadable).
Workout **status** is never stored; it is derived from the sets (none = not started, all = completed).

## Dates and the schedule

There are no accounts or calendars. The plan starts on `startDate` (default: the day you first opened the app; change it under **Schedule → Adjust training days**). Beginner day *N* is *N−1* days later. Roadmap sessions fall on days 1, 3 and 5 of each week.

## Recipes

**Change a workout** → edit `js/data.js` (`BEGINNER` / `ROADMAP`). Arrays of four values are the weekly progression. Run `npm test`.

**Add your photos** → export them from Figma into `img/` (create the folder), then in `js/utils.js` add e.g. `PHOTOS['push-up'] = 'img/push-up.jpg'`. Only `img/<name>.jpg|jpeg|png|webp|avif` is accepted (see `safeImg`). Keep the CSP `img-src 'self'`.

**Add a screen** → write `mYourScreen()` in a new `js/mobile/` file that returns `mScreen({...})`; add the script tag before `session.js`; add the route to `validRoute()` and the table in `renderInner()`; escape every dynamic value with `esc()`; add tests; run `npm run verify`.

**Add a button action** → `Object.assign(ACTIONS, { 'my-action': b => { ... render(); } })` and `data-action="my-action"` in the markup.

**Change styles** → colours and fonts live in `css/styles.css` (CSS variables). If you add *new* Tailwind classes anywhere, run `npm run build:css` (needs `npm install` once), otherwise those classes will have no effect. Never build class names with string concatenation (`'grid-cols-' + n`): the compiler cannot see them.

## Design decisions

- **No framework / no bundler.** Smallest attack surface, nothing to break, easy to read. Cost: shared globals and a strict script order.
- **Tailwind compiled ahead of time**, not loaded from a CDN. Removes a third-party script, works offline, and allows a strict CSP.
- **Fonts self-hosted** for the same reasons (and no request leaves the device).
- **LocalStorage, no accounts.** Matches the offline-first requirement; the trade-offs are in `SECURITY.md`.
- **Two UIs, one logic.** Mobile and desktop screens differ only in markup; sets, timers, saving and validation are shared.
