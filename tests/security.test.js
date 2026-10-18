/* security.test.js – hostile input must never become markup, script, or a crash */
const fs = require('fs'), path = require('path');
const { boot, sleep, waitFor, makeT, ROOT } = require('./helpers');
const { t, done } = makeT();
const XSS = '"><img src=x onerror=alert(1)><svg onload=alert(2)><script>alert(3)</script>';

/* No injected elements, no event-handler attributes, no extra scripts anywhere in the document */
const clean = X => {
  const d = X.d;
  const handlers = [...d.querySelectorAll('*')].filter(el => [...el.attributes].some(a => /^on/i.test(a.name)));
  return d.querySelectorAll('img, svg[onload], iframe, object, embed, link[rel=import]').length === 0 && handlers.length === 0
      && d.querySelectorAll('script').length === d.querySelectorAll('script:not([data-injected])').length && !/javascript:/i.test(d.getElementById('app').innerHTML);
};
const scriptCount = X => X.d.querySelectorAll('script').length;

(async () => {
  // ---------- 1. tampered LocalStorage ----------
  const ex = id => id;
  const evil = { v: 1, program: XSS, joined: 'x', startDate: '<script>', __proto__: { polluted: true },
    sets: { 'b-d1': { 'incline-push-up': [XSS, 5, null], '<svg onload=1>': [1] }, [XSS]: {}, '__proto__': { a: [1] } },
    skills: { handstand: { stage: XSS, logs: [{ t: 1, v: XSS, s: 0 }, { t: 1700000000000, v: 12, s: 0 }] }, lsit: 'x', '__proto__': { x: 1 } },
    meta: { 'b-d1': { ms: XSS, at: 'y', feel: XSS } }, saved: { [XSS]: 1, 'push-up': 1 },
    settings: { name: XSS + 'Bob', goal: XSS, weeklyTarget: '9', restOverride: 7777, sound: 'yes' } };
  const stored = JSON.stringify(evil).replace('"__proto__":{"polluted":true},', '"__proto__":{"polluted":true},');
  const routes = ['#/overview', '#/workouts', '#/library', '#/progress', '#/skills', '#/schedule', '#/settings', '#/profile', '#/profile/privacy', '#/profile/help', '#/plan/b-d1', '#/exercise/push-up', '#/session/b-d1'];
  let allClean = true, allNoErr = true, bad = [];
  for (const mobile of [true, false]) for (const r of routes) {
    const X = boot({ mobile, hash: r, stored });
    const base = scriptCount(X);
    if (!clean(X)) { allClean = false; bad.push((mobile ? 'm' : 'd') + r); }
    if (X.errors.length) { allNoErr = false; bad.push('ERR ' + r + ': ' + X.errors[0]); }
    X.go('#/complete/b-d1');                                                        // not completed in tampered data -> redirected, must not crash
    await sleep(5);
  }
  t('tampered storage: no injected elements/handlers on any of 26 screens' + (bad.length ? ' -> ' + bad.slice(0, 3) : ''), allClean);
  t('tampered storage: no runtime errors on any screen', allNoErr);
  const T = boot({ mobile: true, stored });
  t('sanitize: bad program -> default, bad date -> today', T.ev('Store.data.program') === 'beginner' && /^\d{4}-\d{2}-\d{2}$/.test(T.ev('Store.data.startDate')));
  t('sanitize: string set values dropped, numeric kept', T.ev('Store.getSets(WORKOUTS.get("b-d1"), DAYS[0].exercises[0])').join(',') === ',5,'.replace(/^,/, 'null,').replace(',,', ',null,').replace(/,$/, ',null') || JSON.stringify(T.ev('Store.getSets(WORKOUTS.get("b-d1"), DAYS[0].exercises[0])')) === '[null,5,null]');
  t('sanitize: unknown workout/exercise ids dropped', Object.keys(T.ev('Store.data.sets')).join() === 'b-d1' && Object.keys(T.ev('Store.data.sets["b-d1"]')).join() === 'incline-push-up');
  t('sanitize: skill log with text value dropped, valid kept', T.ev('Store.skill("handstand").logs.length') === 1 && T.ev('Store.skill("handstand").stage') === 0);
  t('sanitize: settings clamped (name has no < >, weekly 5, rest 0, sound true)', !/[<>]/.test(T.ev('Store.setting("name")')) && T.ev('Store.setting("weeklyTarget")') === 5 && T.ev('Store.setting("restOverride")') === 0 && T.ev('Store.setting("sound")') === true);
  t('sanitize: meta fields typed, saved keys restricted', T.ev('Store.meta("b-d1").ms') === 0 && T.ev('Store.meta("b-d1").feel') === undefined && JSON.stringify(Object.keys(T.ev('Store.data.saved'))) === '["push-up"]');
  t('no prototype pollution', T.ev('({}).polluted') === undefined && T.ev('Object.prototype.polluted') === undefined && T.ev('({}).a') === undefined);
  t('repairs are reported (load notes + log)', T.ev('Store.loadNotes.length') > 0 && T.ev('Log.entries().some(e => /Discarded/.test(e.msg))'));

  // ---------- 2. hostile URLs ----------
  const hashes = ['#/session/' + encodeURIComponent(XSS), '#/exercise/..%2f..%2fetc%2fpasswd', '#/plan/__proto__', '#/plan/constructor', '#/profile/%3Cscript%3E', '#/' + 'a'.repeat(10000), '#/session/b-d1/extra', '#/overview/x', '#/exercise/', '#//', '#/%E0%A4%A'];
  let urlOk = true;
  for (const h of hashes) {
    const X = boot({ mobile: true, hash: h });
    await waitFor(() => /overview/.test(X.w.location.hash) && /Show up\./i.test(X.app()), 400);
    const onHome = /overview/.test(X.w.location.hash) || /Show up\./i.test(X.app());          // '#//' is a harmless variant of Home
    if (!clean(X) || X.errors.length || !onHome) { urlOk = false; console.log('  bad hash:', h.slice(0, 50), X.w.location.hash.slice(0, 40), X.errors[0] || ''); }
  }
  t('hostile/invalid URLs fall back to Home safely (11 cases)', urlOk);

  // ---------- 3. hostile typed input ----------
  for (const [label, mobile, hash, id] of [['mobile workouts search', true, '#/workouts', '#m-wq'], ['mobile library search', true, '#/library', '#m-lq'], ['desktop library search', false, '#/library', '#lib-search']]) {
    const X = boot({ mobile, hash }); X.input(X.d.querySelector(id), XSS);
    t(`${label}: payload shown as text, never as markup`, clean(X) && X.d.querySelector(id).value === XSS.slice(0, 60) && X.errors.length === 0);
  }
  const P = boot({ mobile: true, hash: '#/profile' });
  P.act('p-editname'); P.d.querySelector('#m-name').value = XSS; P.act('p-savename');
  t('profile name payload: stripped of < >, stored safely, nothing injected', clean(P) && !/[<>]/.test(P.saved().settings.name) && P.saved().settings.name.length <= 30);
  const S = boot({ mobile: true, hash: '#/schedule' }); S.act('m-sedit'); S.d.querySelector('#m-start').value = XSS; S.act('m-savestart');
  t('start-date payload refused', clean(S) && /^\d{4}-\d{2}-\d{2}$/.test(S.ev('Store.data.startDate')));
  const L = boot({ mobile: true, hash: '#/library' }); L.input(L.d.querySelector('#m-lq'), 'x'.repeat(5000));
  t('over-long search input is capped at 60 characters', L.ev('ui.lq.length') === 60);

  // ---------- 4. helper unit tests ----------
  const H = boot({});
  t('esc() escapes & < > " \' `', H.ev('esc(`&<>"\'\\``)') === '&amp;&lt;&gt;&quot;&#39;&#96;' && H.ev('esc(null)') === '' && H.ev('esc(5)') === '5');
  t('num() clamps and rejects non-numbers', H.ev('num("12.6")') === 13 && H.ev('num("x")') === 0 && H.ev('num(-5)') === 0 && H.ev('num(1e9, 0, 10)') === 10 && H.ev('num(Infinity)') === 0);
  const imgs = { 'img/push-up.jpg': true, 'img/a-b_c.webp': true, 'http://evil/x.jpg': false, 'https://evil/x.png': false, 'javascript:alert(1)': false, '../x.png': false, 'img/../../x.png': false, 'img/x.svg': false, "img/a'b.jpg": false, 'img/x.jpg"onerror="1': false, '//evil/x.jpg': false, 'data:image/png;base64,AAAA': false, '/img/x.jpg': false, 'img/': false, 5: false };
  t('safeImg() only allows local img/*.jpg|png|webp|avif (14 cases)', Object.entries(imgs).every(([p, ok]) => (H.ev(`safeImg(${JSON.stringify(p)})`) !== null) === ok));
  t('cleanText() strips control chars and brackets, caps length', H.ev('cleanText("a\\u0000b<c>\\n d", 30)') === 'abc d' && H.ev('cleanText("x".repeat(99), 10)').length === 10);
  H.ev('PHOTOS["push-up"] = "javascript:alert(1)"; PHOTOS["plank"] = "img/plank.jpg"');
  H.go('#/exercise/push-up'); const urlStyle = H.html();
  t('photo hook: unsafe path ignored, safe path used', !/javascript:/.test(urlStyle) && (H.go('#/exercise/plank'), /img\/plank\.jpg/.test(H.html())));

  // ---------- 5. static properties of the shipped files ----------
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const csp = (html.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
  const dir = n => (csp.match(new RegExp(n + ' ([^;]+)')) || [])[1] || '';
  t('CSP present: default-src none, script-src self only', /default-src 'none'/.test(csp) && dir('script-src') === "'self'");
  t('CSP: no unsafe-eval anywhere, no unsafe-inline for scripts', !/unsafe-eval/.test(csp) && !/unsafe-inline/.test(dir('script-src')));
  t('CSP: no network (connect-src none), no objects, no base/form targets', /connect-src 'none'/.test(csp) && /object-src 'none'/.test(csp) && /base-uri 'none'/.test(csp) && /form-action 'none'/.test(csp));
  t('index.html: no inline scripts, no inline event handlers, no external URLs', !/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(html) && !/\son[a-z]+\s*=/i.test(html.replace(/<meta[^>]*>/g, '')) && !/https?:\/\//.test(html));
  const js = fs.readdirSync(path.join(ROOT, 'js'), { recursive: true }).filter(f => f.endsWith('.js')).map(f => [f, fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')]);
  const hit = re => js.filter(([, s]) => re.test(s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''))).map(([f]) => f);
  t('JS: no eval / new Function / document.write / setTimeout(string)', hit(/\beval\s*\(|new Function\s*\(|document\.write\s*\(|setTimeout\(\s*['"`]/).length === 0);
  t('JS: no network APIs (fetch, XHR, WebSocket, sendBeacon, EventSource)', hit(/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/).length === 0);
  t('JS: no inline-handler strings or javascript: URLs', hit(/\son(click|error|load|mouseover|focus|submit)\s*=|javascript:/i).filter(f => f !== 'security.js').length === 0);
  t('JS: no http(s) URLs (nothing is fetched or linked externally)', hit(/https?:\/\/[a-z]/i).length === 0);
  done();
})().catch(e => { console.log('TEST CRASH:', e.stack.split('\n').slice(0, 4).join(' | ')); process.exit(1); });
