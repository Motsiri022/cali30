# Calis30

Progressive calisthenics: a **30-Day Beginner Matrix** and a **3-Month Skill Roadmap**, with a workout player, rest timer, skill trackers and progress charts. Phone-first design (from the Figma file) with a desktop layout. Plain HTML, CSS and JavaScript. **No server, no accounts, no network requests, no runtime dependencies.** Progress is saved in your browser.

## Run it
* **Easiest:** unzip `cali30.zip` (keeps `css/`, `fonts/`, `js/`, `js/mobile/` exactly right). If the page stays on "Loading Calis30…", the folders are wrong: run `node scripts/folder-check.js`.
* Open the folder in VS Code → right-click `index.html` → **Open with Live Server** (or double-click `index.html`; a real server isolates storage better).
* On a phone: open the same address over your Wi-Fi from Live Server, or host the folder on any static host.

## Check it
```
npm install          # once; build and test tools only
npm run verify       # security scan + 227 behaviour checks
npm run build:css    # only after adding new Tailwind classes
python3 scripts/browser-check.py   # optional: real Chromium at 5 widths
```

## If something looks wrong
Open **Profile → Help & feedback**: 10-point self-check, error log, and a **Copy report** button. Then see `docs/TROUBLESHOOTING.md`.

## Documentation
| File | What it explains |
|---|---|
| `docs/ARCHITECTURE.md` | Files, load order, routes, saved data, how to change things |
| `docs/SECURITY.md` | Threat model, every control, audit status, limitations |
| `docs/TROUBLESHOOTING.md` | Symptoms → fixes, error and self-check dictionary, data recovery |
| `docs/TESTING.md` | What is tested, results, what is *not* covered |
| `docs/FIGMA-MAPPING.md` | Each Figma screen → code, and every difference from the design |
| `docs/CHANGELOG.md` | What changed, problems found and fixed, known limitations |
| `docs/screenshots/` | How each mobile screen looks (Chromium, 390 px) |

## Quick facts
* Folders: `css/` (styles), `fonts/` (self-hosted), `js/` + `js/mobile/` (code), `scripts/`, `tests/`, `docs/`.
* Edit workouts in `js/data.js`. Edit colours in `css/styles.css`.
* Your photos: put files in `img/` and map them in `js/utils.js` (`PHOTOS`). See `docs/ARCHITECTURE.md`.
