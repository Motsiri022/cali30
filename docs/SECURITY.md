# Security

## What this app is, and what that means

A static, offline-first site with **no accounts, no server, no network requests and no runtime dependencies**. The only data is workout progress the user types, stored in the browser's LocalStorage. That removes most of the usual risks (server breaches, stolen passwords, API abuse, supply-chain attacks through CDN scripts). The remaining risks are in the browser, and they are what the controls below address.

## Threat model

| Threat | How it could happen here | Control |
|---|---|---|
| **Cross-site scripting (XSS)** | Text typed by the user (name, search) or stored data/URL reaching the page as markup | `esc()` on every untrusted value; validation of all stored data; route-id whitelisting; CSP blocks inline/foreign scripts even if something slipped through |
| **Tampered or corrupted storage** | Another script, a browser extension, a manual edit, or disk corruption changes `calis30:v1` | `Store.sanitize()` rebuilds every field by type and range; unknown ids dropped; size cap; corrupt text backed up; repairs reported |
| **Hostile links** | `#/session/<img onerror=...>`, `../` paths, `__proto__`, 10 000-character hashes | Every route argument checked against known ids; anything else goes Home and is logged |
| **Third-party script / supply chain** | A compromised CDN or library | **No third-party code runs.** Tailwind is compiled at build time; fonts are local; CSP `script-src 'self'` |
| **Data leaving the device** | Tracking, analytics, fonts from Google | None present. CSP `connect-src 'none'` makes network requests impossible; `referrer: no-referrer` |
| **Malicious image paths** | `PHOTOS` pointing at a remote or script URL | `safeImg()` only accepts `img/<name>.jpg\|jpeg\|png\|webp\|avif` |
| **Prototype pollution** | Keys such as `__proto__` in saved JSON | Only known ids are copied into new objects; tested |
| **Denial of service by data size** | Huge saved data or search text | 2 MB read cap, 200 logs per skill, 60 log entries, search capped at 60 characters |
| **Clickjacking** | Page framed by another site | `frame-ancestors 'none'` in `_headers` (needs a host that applies it; see below) |
| **Leaking diagnostics** | Sharing a bug report | The report contains technical info only (browser, size, checks, errors); never name or workouts. Tested |

## Controls in detail

**Content Security Policy** (in `index.html`, mirrored in `_headers`):

```
default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self';
font-src 'self'; connect-src 'none'; media-src 'none'; object-src 'none';
base-uri 'none'; form-action 'none'          (+ frame-ancestors 'none' in _headers)
```

* No `unsafe-eval`, no inline scripts, no remote origins of any kind.
* **Known trade-off:** `style-src 'unsafe-inline'` is needed because screens use `style="..."` attributes (theme variables, computed widths). Injected CSS is far less dangerous than injected script, and all text is escaped, but it is a relaxation. Removing it would mean moving every inline style into classes.
* A `<meta>` CSP cannot set `frame-ancestors`. Hosts that read `_headers` (Netlify, Cloudflare Pages) apply the full set. **GitHub Pages cannot set headers**, so there the meta CSP applies but framing is not blocked. Impact is low: there are no accounts and no sensitive one-click actions.

**Output escaping.** `esc()` escapes `& < > " ' \``. Numbers pass through `num()`. The static scanner fails the build if a known user-controlled value (name, search text, start date, initials) is drawn without `esc()`.

**Input validation.** `cleanText()` removes control characters and `<>`, caps length (name: 30). Settings accept only enumerated values (goal, rest 0/45/60/90, weekly target 1–7). Dates must be real calendar dates 2020–2100. Set values are whole numbers 0–9999; skill values 0–999.

**Storage hygiene.** Only `localStorage` is used (no cookies, no IndexedDB, no service workers, no sessionStorage). Only `log.js`, `store.js` and `diagnostics.js` touch it (enforced by the scanner).

**Privacy.** Nothing is sent anywhere. *Share* uses the browser share sheet with a text-only message (no name, no link). *Export* downloads a JSON file you keep. *Delete* removes saved data.

## How to verify (one command)

```
npm install        # once: build and test tools only
npm run verify     # security scan (26 checks) + all tests (227 checks)
python3 scripts/browser-check.py   # optional: real Chromium, 5 screen widths, CSP/console/overflow
```

`scripts/security-check.js` fails if it finds: a missing/weak CSP, inline scripts or handlers, external URLs, `eval`/`new Function`/`document.write`, network APIs, cookies, unexpected `localStorage` use, unescaped user values, runtime dependencies, unpinned dev dependencies, or orphaned/duplicated script files.

## Dependency audit (honest status)

* **Runtime dependencies: none.** Nothing from `node_modules` is shipped to the browser.
* **Build/test tools (devDependencies, pinned):** `tailwindcss 3.4.17`, `jsdom 30.1.3`, `@fontsource/*` (font files, copied once).
* `npm audit` on 2026-10-18 reports **7 findings (5 high, 2 moderate)**, all in Tailwind 3's own dependency chain: `braces`/`micromatch`/`fast-glob`/`chokidar` (a stack-exhaustion denial-of-service on deeply nested glob patterns) and `postcss-selector-parser`/`postcss-nested` (slow parsing of crafted selectors).
  * **Exposure:** only when *you* run `npm run build:css` on *your own* files. They cannot affect users of the app.
  * **Mitigation:** the compiled `css/tailwind.css` is already included, so you do not have to run the build to use the app. Only build from files you trust.
  * **Fix path:** upgrade to Tailwind 4 (a breaking change: class and config differences need a visual re-check). Re-run `npm audit` after.

## Known limitations (not fixed, by design or by environment)

1. **LocalStorage is not encrypted.** Anyone with access to the device's browser profile can read the progress. There is no sensitive data (no passwords, payment or health records), but treat it as plain text.
2. **No sign-in, so no protection between people sharing one browser profile.**
3. **`style-src 'unsafe-inline'`** (explained above).
4. **`frame-ancestors`** only applies where `_headers` is honoured.
5. **Opening the file directly (`file://`)** shares storage across files in some browsers. Serve it from a real origin (Live Server, GitHub Pages, Netlify) for best isolation.
6. **Not penetration-tested by a third party.** The checks here are automated and by design review.

## Checklist when changing code

- [ ] Every string not from `data.js` goes through `esc()`; every number through `num()`.
- [ ] New saved fields are added to `Store.sanitize()` with type and range checks.
- [ ] New route arguments are validated in `validRoute()`.
- [ ] No inline handlers, no `eval`, no external URLs, no `fetch`.
- [ ] `npm run verify` passes.
