# Changelog and build log

## 1.1.0 — mobile redesign, hardening, diagnostics (2026-10-18)

### Added
* **Ten mobile screens** matching the Figma file (see `FIGMA-MAPPING.md`), with a header, avatar, and 5-tab bottom bar. Desktop keeps its sidebar layout; the switch is at 1024 px and re-draws live.
* **Workout complete** screen (saves total time and date, "how did it feel", share), **Workout plan**, **Exercise detail** (cues, tip, easier/harder from the real progression ladders, bookmark), **Profile**, **Account & privacy** (export / delete), **Help & feedback** (self-check, error log, copy report).
* **Schedule with dates** from an editable start date. **Progress** with date ranges (month / 3 months / all time) using the saved completion date.
* **Settings that do something:** display name, training goal, weekly target, fixed rest between sets (45/60/90 s), sound and haptics.
* **Rest-timer beeps and vibration** (Web Audio, unlocked by a tap; respects the Sound & haptics switch).
* **Diagnostics:** `js/log.js` (error log), `js/diagnostics.js` (10 self-checks), on-screen error panel, toasts for failures, red setup bar if a critical file is missing.
* **Tests:** 227 behaviour checks in 5 suites + 26-point static security scan + optional real-browser check.
* **Docs:** this folder.

### Security hardening
* **No third-party code at all.** Tailwind is compiled ahead of time (was loaded from a CDN); fonts are self-hosted (were loaded from Google).
* **Content Security Policy**: scripts from this site only, no network requests, no inline scripts. `_headers` file for hosts that support headers.
* **Everything read from LocalStorage is validated** and rebuilt (`Store.sanitize`); corrupt data is backed up and reported.
* **Escaping** on every untrusted value; route ids whitelisted; photo paths restricted to `img/`.
* Dev dependencies pinned with a lockfile. `npm audit` findings (build tools only) are documented in `SECURITY.md`.

### Added after first delivery (user report: blank page)
* A page that stays on **"Loading Calis30…"** with a plain-HTML checklist if no script runs (the symptom when files are not in `css/`, `js/`, `js/mobile/`, `fonts/`). Cause reproduced: all files in one folder.
* `Log` now records **every file that fails to load**; new self-check **"Every file loaded"** (10 checks now); `scripts/folder-check.js`; and **`cali30.zip`** so the folder structure cannot get mixed up.

### Changed
* Finishing the last set now opens the **Workout complete** screen (before: a toast and a Finish button).
* `Store.reset()` now also keeps settings and bookmarks; "Clear data on this device" wipes everything.
* Desktop library search is bound through `data-bind` (shared with mobile).
* Dynamic Tailwind class names removed (a compiled stylesheet cannot see them).

### Problems found while building, and fixed
| Found by | Problem | Fix |
|---|---|---|
| Real-browser run | Search bar overflowed the screen at 320 px | `min-w-0` on the search box |
| Real-browser run | Progress chart drew one giant bar in week 1 | Chart now shows the whole 4-week plan (or an 8-week window on the roadmap) |
| Real-browser run | "REPS" drawn in the heading font on set cards; picture watermark clipped | Body font for the unit; watermark scales with the picture |
| Tests | Schedule header showed "JAN" instead of "JANUARY" | Full month name |
| Tests | Tapping the last set twice before the screen changed could save the summary twice | `finishing` guard |
| Tests | Benchmark day: the last exercise (a max test) jumped to "complete" before the result could be typed | Stays on the exercise with the editor open until "Finish workout" |
| Tests | Test timing flake (page change is asynchronous) | `waitFor()` helper instead of fixed sleeps |
| Review | A weekly chart label and several screens relied on dynamic class names | Replaced with fixed classes |

### Known limitations
1. **No photos** (placeholders). Form-demo videos and workout reminders are not implemented.
2. **Not tested on real phones, Safari or Firefox**, and not listened to on real audio hardware.
3. **Elapsed time** is not saved across a reload mid-workout (sets are).
4. **Progress date ranges** only know sessions finished after this version; older ones count under "All time".
5. **Schedule weekdays** follow your start date, not Monday-first. Roadmap sessions sit on days 1/3/5 of each week. The 30-day plan has two bonus days in a fifth week.
6. **`style-src 'unsafe-inline'`** remains in the CSP (inline `style=` attributes). See `SECURITY.md`.
7. **7 `npm audit` findings** in the Tailwind 3 build toolchain (not shipped to the browser).
8. **Adding new Tailwind classes requires rebuilding the CSS** (`npm run build:css`).
9. **LocalStorage is per browser, per address, and unencrypted.** Export backups.

## 1.0.0 — earlier steps (summary)
1. Shell, program switcher, 30-day and 3-month grids.
2. Full workout data engine and LocalStorage saving.
3. Interactive session player with rest timer (desktop design from the Figma screenshots).
4. Skill trackers (Handstand, L-Sit, Muscle-up) and analytics (volume by week, muscle group, overall progress).
Code was split into modules (`data`, `store`, `pages`, `session`, `skills`, `analytics`, …).
