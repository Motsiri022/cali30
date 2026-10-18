# Troubleshooting

## Where to look first (in this order)

1. **In the app: Profile → Help & feedback.** It runs a **self-check** (10 checks, each says what to try if it fails) and shows the **error log** (newest first). The avatar (top right) opens Profile. On desktop use *Help & feedback* in the sidebar.
2. **Tap "Copy report"** there. The report holds the browser, screen size, check results and log lines. It never contains your name or workouts, so it is safe to paste into a message or issue.
3. **Browser console** (F12 → Console): every log entry is also printed there with a `[Calis30]` prefix.
4. **Network tab** (F12 → Network, then reload): a red `404` row means a file is missing or in the wrong folder.
5. **Terminal:** `npm run verify` (needs `npm install` once) re-runs the security scan and all tests; `tests/last-run.txt` holds the last result.

If a screen itself crashes you will see **"This screen failed to load"** with the error text and buttons for diagnostics, Home and reload. Your saved progress is not affected.

## Symptom → cause → fix

| What you see | Likely cause | Fix |
|---|---|---|
| **Only "Calis30 / Your space" in the sidebar and an empty page, or a "Loading Calis30…" message that stays** | **No script ran: the files are not in the right folders** (for example everything saved into one folder) | Run `node scripts/folder-check.js` (it lists missing files and where they are), or unzip **`cali30.zip`**, which keeps the folders exactly right. Open `index.html` with Live Server. F12 → Console shows each missing file |
| Red bar at the top: **"Setup problem: …"** | A required file did not load | Read the bar: it names the check. Match it with the table in the next section |
| Page is unstyled, white, or text looks plain | `css/tailwind.css` or `css/styles.css` not found | Network tab → find the red 404. Files must be at `css/tailwind.css` and `css/styles.css` next to `index.html` |
| Layout is right but fonts look different | `fonts/` missing or renamed | Not fatal (fallback fonts are used). Restore the `fonts/` folder |
| Console: `X is not defined` | A script file is missing, misspelled or out of order | Compare the `<script>` list in `index.html` with the files in `js/` and `js/mobile/` |
| Nothing happens when you tap a button | A click handler threw an error | Check the log for `Action failed: …`; a toast also says "Something went wrong" |
| Your progress vanished | Different address or cleared data | Storage is **per address**: `localhost:5500`, `127.0.0.1:5500` and `file://` are separate. Also happens after "clear site data" or in private windows. Use the same address; keep backups (Profile → Account & privacy → Export) |
| Progress is not saved; toast says storage is unavailable | Private mode, blocked site data, or storage full | Allow site data for the page or leave private mode. The app still works until you close the tab |
| Toast: "Some saved data was repaired" | Saved data had invalid parts (edited, corrupted, or older) | Harmless: invalid parts were dropped. Details are in the log ("Discarded N invalid saved entries") |
| Self-check "Saved data was healthy" fails with "unreadable" | The saved JSON was corrupt | The app started fresh. A **backup of the bad text** is in LocalStorage key `calis30:corrupt-backup` (DevTools → Application → Local Storage). Copy it before it is overwritten |
| Rest timer ends silently | Sound & haptics is off, device muted, or the browser has not been "unlocked" by a tap | Turn *Sound & haptics* on (Profile). Tap once in the app first. iPhones do not support vibration |
| "Workouts this month" shows 0 after finishing old sessions | Date ranges only know sessions finished **after** v1.1.0 recorded the date | Use **All time**, or finish a new session |
| Elapsed time restarts at 00:00 after a reload mid-workout | By design: the elapsed clock is not saved (sets are) | Nothing to fix; the session summary uses the time since you last opened the session |
| Dates in Schedule are not what you expect | Dates follow the **start date** | Schedule → Adjust training days → set the date for Day 1 |
| New Tailwind classes have no effect | The stylesheet is compiled ahead of time | `npm install` (once), then `npm run build:css` |
| Desktop layout on a phone (or the reverse) | The switch happens at **1024px** window width | Resize the window; the screens re-draw automatically |
| Tests fail | A change broke behaviour | `npm run verify`; the failing line names the check. See `docs/TESTING.md` |

## Self-check dictionary

| Check | If it fails |
|---|---|
| Every file loaded | Names the files the browser could not find (wrong folder or name). Fix the folder layout |
| All script files loaded | The message lists missing names. Fix the `<script>` list or restore the file |
| Workout data complete (30 days, 36 roadmap sessions) | `js/data.js` was edited or is incomplete |
| Browser storage works | Storage blocked (private mode / site data blocked). Progress will not persist |
| Last save succeeded | Storage may be full. Export your data, free space, try again |
| Theme stylesheet loaded (css/styles.css) | File not found at that path |
| Layout stylesheet loaded (css/tailwind.css) | File not found, empty, or never built (`npm run build:css`) |
| Fonts available | `fonts/` files not found. Cosmetic only |
| Saved data was healthy on load | Data was repaired or reset; the hint says which |
| No errors recorded | The log holds errors; read them below the checks |

## Log message dictionary

| Message | Level | Meaning |
|---|---|---|
| `Saved data was corrupt JSON; starting fresh` | warn | Stored text could not be parsed; a backup copy was kept |
| `Saved data too large; ignored` | warn | Stored data over 2 MB was not loaded |
| `Discarded N invalid saved entries on load` | warn | Unknown ids or wrongly typed values were removed |
| `Storage is blocked in this browser; progress will not be saved` | warn | `localStorage` is not accessible |
| `Could not save progress (storage full or blocked)` | **error** | A save threw. The app keeps working in memory |
| `Screen failed to render: …` | **error** | A screen function crashed; the message is the cause |
| `Action failed: …` | **error** | A button handler crashed |
| `Search failed: …` | **error** | Typing in a search box crashed |
| `Unknown route "…"; went Home` | warn | A bad or old link was opened |
| `File failed to load: js/mobile/m-home.js` | **error** | The browser could not find that file (wrong folder or name) |
| `Startup check failed: …` | **error** | A critical self-check failed after load (also shown as the red bar) |
| `Startup check crashed` | **error** | The startup check itself failed |
| `Unhandled promise rejection: …` / script errors with `file:line` | **error** | Something threw outside a handler; the file and line are recorded |
| `Audio could not start`, `Beep failed` | warn | Sound is unavailable; the timer still works |
| `Clipboard blocked`, `Share failed`, `Export failed` | warn / error | The browser refused copy, share or download |

The log keeps the **latest 60 entries**, survives reloads, and can be cleared (Help & feedback → Clear log).

## Recovering data

* **Backups:** Profile → Account & privacy → *Export my data (JSON)*. The file is readable text (`{"app":"Calis30","data":{...}}`).
* **From the console:** `localStorage.getItem('calis30:v1')` shows the live data; `localStorage.getItem('calis30:corrupt-backup')` shows text saved from a failed load.
* **Start over:** Profile → *Clear data on this device* (asks for confirmation).

## Reporting a problem

Send: what you did, what you expected, what happened, and the **Copy report** text. If you can, add a screenshot and the browser name/version.
