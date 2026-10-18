#!/usr/bin/env node
/* Static security scan of the shipped files. Run: npm run check
   It fails (exit code 1) if anything risky appears. It does not need a browser or the network. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const walk = (d, out = []) => { for (const f of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const html = read('index.html');
const jsFiles = walk('js').filter(f => f.endsWith('.js'));
const js = jsFiles.map(f => [f, stripComments(read(f))]);
const offenders = re => js.filter(([, s]) => re.test(s)).map(([f]) => f.replace(/\\/g, '/'));

/* 1. Content Security Policy */
const csp = (html.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
const dir = n => (csp.match(new RegExp('(?:^|; )' + n + ' ([^;]+)')) || [])[1];
check('CSP meta tag present', !!csp);
check("CSP: default-src 'none'", dir('default-src') === "'none'");
check("CSP: script-src 'self' only (no inline, no eval, no CDN)", dir('script-src') === "'self'");
check('CSP: connect-src none (the app cannot make network requests)', dir('connect-src') === "'none'");
check("CSP: object-src/base-uri/form-action none", ['object-src', 'base-uri', 'form-action'].every(d => dir(d) === "'none'"));
check("CSP: no 'unsafe-eval' anywhere", !/unsafe-eval/.test(csp));
check("CSP: images limited to this site", dir('img-src') === "'self'");
const hdr = fs.existsSync(path.join(ROOT, '_headers')) ? read('_headers') : '';
check('_headers file adds frame-ancestors none + nosniff (for hosts that support it)', /frame-ancestors 'none'/.test(hdr) && /nosniff/.test(hdr));

/* 2. Page structure */
check('index.html: no inline <script> blocks', !/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(html));
check('index.html: no inline event-handler attributes', !/\son[a-z]+\s*=/i.test(html.replace(/<meta[^>]*>/g, '')));
check('index.html: no external URLs (no CDN, no tracking)', !/https?:\/\//.test(html));
const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
check('every <script src> exists and is a local file', srcs.length > 0 && srcs.every(s => !/^(https?:)?\/\//.test(s) && fs.existsSync(path.join(ROOT, s))), srcs.filter(s => !fs.existsSync(path.join(ROOT, s))).join(', '));
check('every js file is loaded exactly once (no orphans or duplicates)', jsFiles.every(f => srcs.filter(s => path.normalize(s) === path.normalize(f)).length === 1), jsFiles.filter(f => srcs.filter(s => path.normalize(s) === path.normalize(f)).length !== 1).join(', '));
const css = ['css/styles.css', 'css/fonts.css'].map(read).join('\n');
const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map(m => m[1]);
check('CSS url() references are local and exist', urls.every(u => !/^(https?:)?\/\//.test(u) && fs.existsSync(path.join(ROOT, 'css', u))), urls.filter(u => !fs.existsSync(path.join(ROOT, 'css', u))).join(', '));
check('compiled css/tailwind.css exists and is non-empty', fs.existsSync(path.join(ROOT, 'css/tailwind.css')) && read('css/tailwind.css').length > 5000);

/* 3. Dangerous JavaScript */
check('JS: no eval / new Function / document.write / string timers', offenders(/\beval\s*\(|new Function\s*\(|document\.write\s*\(|set(Timeout|Interval)\(\s*['"`]/).length === 0, offenders(/\beval\s*\(|new Function\s*\(|document\.write\s*\(/).join(', '));
check('JS: no network APIs (fetch, XHR, WebSocket, beacon)', offenders(/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/).length === 0);
check('JS: no javascript: URLs or inline handler strings', offenders(/javascript:|\son(click|error|load|mouseover|focus|submit)\s*=/i).filter(f => !f.endsWith('security.js')).length === 0);
check('JS: no hard-coded http(s) URLs', offenders(/https?:\/\/[a-z]/i).length === 0);
check('JS: no cookies, no sessionStorage, no IndexedDB, no service workers', offenders(/document\.cookie|sessionStorage|indexedDB|serviceWorker/).length === 0);
check('JS: localStorage only touched by log.js, store.js, diagnostics.js', offenders(/localStorage/).every(f => /(log|store|diagnostics)\.js$/.test(f)), offenders(/localStorage/).join(', '));

/* 4. Untrusted text must be escaped where it is drawn */
const TAINT = ["Store.setting('name')", 'S.name', 'ui.q', 'ui.wq', 'ui.lq', 'initials()', 'Store.data.startDate'];
const searchEscapes = /value="\$\{esc\(value\)\}"/.test(read('js/mobile/m-shell.js'));   // mSearch() escapes its value parameter itself
const unescaped = [];
js.forEach(([f, s]) => { for (const m of s.matchAll(/\$\{([^}]*)\}/g)) { const e = m[1].trim(); if (TAINT.some(t => e.includes(t)) && !/^esc\(/.test(e) && !/esc\(\s*[^)]*\)/.test(e) && !/\.length|\.value\s*=|\?\s*['`]/.test(e) && !(searchEscapes && /^mSearch\(/.test(e))) unescaped.push(`${f.replace(/\\/g, '/')}: \${${e.slice(0, 50)}}`); } });
check('untrusted values (name, search text, dates) are always passed through esc()', unescaped.length === 0, unescaped.slice(0, 3).join(' | '));
const unsafeHtmlOutsideApp = offenders(/\.outerHTML\s*=|insertAdjacentHTML/);
check('JS: no outerHTML= / insertAdjacentHTML', unsafeHtmlOutsideApp.length === 0, unsafeHtmlOutsideApp.join(', '));

/* 5. Supply chain */
const pkg = JSON.parse(read('package.json'));
check('no runtime dependencies (only build/test tools in devDependencies)', !pkg.dependencies || Object.keys(pkg.dependencies).length === 0);
check('dev dependencies are pinned to exact versions', Object.values(pkg.devDependencies || {}).every(v => /^\d+\.\d+\.\d+$/.test(v)));
check('package-lock.json present (reproducible installs)', fs.existsSync(path.join(ROOT, 'package-lock.json')));

/* report */
let failed = 0;
console.log('Calis30 security check\n');
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : '\n        -> ' + r.detail}`); }
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
