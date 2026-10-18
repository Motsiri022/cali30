/* Test helpers: loads index.html into jsdom exactly as a browser would (same <script> order, no network),
   with a controllable matchMedia so the same code can be tested as "desktop" or "mobile". Run with: npm test */
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'calis30:v1';

function pageHtml() {
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  html = html.replace(/<link[^>]+rel="stylesheet"[^>]*>/g, '<style>:root{--accent:#bff368}.hidden{display:none}</style>');   // stand-in for the real CSS (jsdom has no layout)
  return html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => '<script>\n' + fs.readFileSync(path.join(ROOT, src), 'utf8') + '\n</script>');
}
const HTML = pageHtml();

function boot(opts = {}, storedArg) {
  if (typeof opts === 'string') opts = { hash: opts, stored: storedArg };           // boot('#/skills', savedText)
  const { hash = '', stored, mobile = false, blockStorage = false, failSaves = false, storage = {} } = opts;
  const errors = [], listeners = [], mq = { matches: mobile };
  const dom = new JSDOM(HTML, { url: 'http://localhost/' + hash, runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.addEventListener('error', e => errors.push(e.message));
      w.confirm = () => true; w.scrollTo = () => {};
      w.matchMedia = q => ({ get matches() { return mq.matches; }, media: q, addEventListener: (_, f) => listeners.push(f), removeEventListener() {}, addListener: f => listeners.push(f), removeListener() {} });
      if (blockStorage) Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
      else {
        for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
        if (stored !== undefined) w.localStorage.setItem(KEY, stored);
        if (failSaves) { const orig = w.Storage.prototype.setItem; w.Storage.prototype.setItem = function (k, v) { if (k === KEY) throw new DOMException('full', 'QuotaExceededError'); return orig.call(this, k, v); }; }
      }
    } });
  const w = dom.window, d = w.document;
  const X = {
    w, d, errors,
    click: el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })),
    input: (el, value) => { el.value = value; el.dispatchEvent(new w.Event('input', { bubbles: true })); },
    act(a, extra = '') { const el = d.querySelector(`[data-action="${a}"]${extra}`); if (!el) throw new Error('missing action ' + a + extra); X.click(el); },
    has: (a, extra = '') => !!d.querySelector(`[data-action="${a}"]${extra}`),
    go(h) { w.location.hash = h; w.dispatchEvent(new w.HashChangeEvent('hashchange')); },
    setMobile(v) { mq.matches = v; listeners.forEach(f => f({ matches: v })); },
    ev: c => w.eval(c),
    saved: () => JSON.parse(w.localStorage.getItem(KEY)),
    txt: s => (d.querySelector(s) || {}).textContent || '',
    app: () => d.getElementById('app').textContent,
    html: () => d.getElementById('app').innerHTML
  };
  return X;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* wait until fn() is true (jsdom fires hashchange asynchronously, like a browser), up to ms milliseconds */
async function waitFor(fn, ms = 1500) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return true; await sleep(10); } return !!fn(); }

/* tiny runner: t(name, ok) prints PASS/FAIL; done() prints the summary line that run-all.js reads */
function makeT() {
  let pass = 0, fail = 0;
  return { t: (n, ok) => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + n); },
           done: () => { console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); } };
}
module.exports = { boot, sleep, waitFor, makeT, ROOT, KEY, HTML };
