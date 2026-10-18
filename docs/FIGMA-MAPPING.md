# Figma → app mapping

Source: Figma file `ic8J3ANQlKRSkBdcxas9Qo` (10 mobile screens, 390 px wide) plus the two desktop screenshots (Overview, Workout activity).
Screenshots of what was built are in `docs/screenshots/` (taken in Chromium at 390 px). They were compared by eye; there is no automated pixel comparison.

## Screens

| Figma screen | Route | Code | Status |
|---|---|---|---|
| Overview (Home) | `#/overview` | `js/mobile/m-home.js` | Built. Hero, stats, program card, upcoming sessions |
| Workouts | `#/workouts` | `js/mobile/m-workouts.js` | Built. Search, chips, "pick up your program", session list |
| Workout plan | `#/plan/<id>` | `js/mobile/m-workouts.js` | Built. Stats, equipment note, numbered exercise list, start button |
| Active workout | `#/session/<id>` | `js/mobile/m-session.js` + `js/session.js` | Built and working: sets, rest timer, edit, pause, end |
| Workout complete | `#/complete/<id>` | `js/mobile/m-session.js` | Built. Time, exercises, sets, streak, checklist, feeling, share |
| Exercise detail | `#/exercise/<id>` | `js/mobile/m-library.js` | Built. Cues, tip, easier/harder, bookmark |
| Exercise library | `#/library` | `js/mobile/m-library.js` | Built. Search, chips, 2-column grid (57 movements) |
| Progress | `#/progress` | `js/mobile/m-progress.js` | Built. Range chips, streak, tiles, volume chart, program, recent work |
| Schedule | `#/schedule` | `js/mobile/m-schedule.js` | Built. Week navigation, day pills, plan rows, start-date editor |
| Profile and settings | `#/profile` | `js/mobile/m-profile.js` | Built. Name, program, settings, privacy, help |
| Desktop Overview / Workout activity | `#/overview`, `#/session/<id>` | `js/pages.js`, `js/session.js` | Built earlier; unchanged in look |

Not in Figma, added because the app needs them: **Account & privacy**, **Help & feedback** (self-check and error log), **Skill trackers** (reused inside the mobile shell, reached from Progress), and a **program switcher** (Workouts filter button and Profile).

## Where the build differs from the design (on purpose or by necessity)

| Design shows | Built | Why |
|---|---|---|
| Photographs of people exercising | Tinted gradient with the muscle group as a watermark | No image files were available to the build. Add yours: see `docs/ARCHITECTURE.md` → "Add your photos" |
| "FORM" brand | "Calis30" | This app's name |
| "Week 3 of 6", "3 week streak" | "Day 15 of 30" / "Month 2 of 3", "N day streak" | The program is 30 days or 3 months, and streaks are counted in days (or sessions on the roadmap) |
| Levels "Intermediate" | "Beginner" / "Advanced" | Those are the only two levels in the plans |
| Sessions "Upper body / Core & control / Lower body" | "Push / Pull / Legs + Core", roadmap block names | These are the actual sessions in `js/data.js` |
| "Start set 3" | "Complete set 3" | A set is logged when it is completed (the rest timer starts then) |
| Watch form demo 0:24 | Button shows "Form demo videos are coming soon" | No videos exist |
| Weekly volume in minutes | In sets | Sets are what is recorded per week; minutes are only known for sessions finished after v1.1.0 |
| "Plan consistency 86%" | "Plan complete N%" | There is no calendar-based attendance to compute a consistency from |
| "Workout reminders" toggle | Shown, disabled, "Coming soon" | Real reminders need notifications and a background service. A fake toggle would be dishonest |
| "Sign out", "Free athlete", "Alex Johnson" | "Clear data on this device", "Local athlete", your own display name | There are no accounts |
| "No equipment" on every move | The real equipment is named (pull-up bar, sturdy table, chair or bench) | Several moves do need something |
| "The Essential Six" | "The essentials" (all 57 movements) | The app has more than six moves |
| Monday-first weeks with real calendar | Weeks start on the program's start date | The plan is day-numbered; dates follow the start date you choose |
| Active workout has no exercise navigation | Small ‹ › arrows next to the exercise number | So any exercise can be revisited |
| 8 weekly bars | 4 bars (30-day plan) or an 8-week window (roadmap) | The 30-day plan has 4 weeks |
