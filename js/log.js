/* LOG – captures every error and warning so problems are easy to see.
   Entries live in a small ring buffer saved in LocalStorage (key "calis30:log"); the Help & feedback > Diagnostics
   screen shows them. Nothing is ever sent anywhere. Entries hold technical messages only, never workout data or your name. */

const APP = { name: 'Calis30', version: '1.1.0' };

const Log = (() => {
  const KEY = 'calis30:log', MAX = 60;
  let entries = [], listener = null, lastNotify = 0;
  const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, n);
  const valid = e => e && typeof e === 'object' && ['info', 'warn', 'error'].includes(e.lvl) && Number.isFinite(e.t) && typeof e.msg === 'string';

  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(raw)) entries = raw.filter(valid).slice(-MAX).map(e => ({ t: e.t, lvl: e.lvl, msg: clip(e.msg, 300), where: clip(e.where, 120) }));
  } catch (e) { /* unreadable log: start empty */ }

  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch (e) { /* storage full or blocked: keep in memory */ } };

  function add(lvl, msg, where) {
    entries.push({ t: Date.now(), lvl, msg: clip(msg, 300), where: clip(where, 120) });
    if (entries.length > MAX) entries = entries.slice(-MAX);
    persist();
    if (typeof console !== 'undefined') (console[lvl === 'info' ? 'log' : lvl] || console.log).call(console, `[${APP.name}] ${msg}`, where || '');
    if (lvl === 'error' && listener && Date.now() - lastNotify > 5000) { lastNotify = Date.now(); try { listener(msg); } catch (e) { /* ignore */ } }
  }
  const whereOf = err => (err && err.stack ? clip(String(err.stack).split('\n').slice(0, 2).join(' | '), 120) : '');

  return {
    info: (m) => add('info', m),
    warn: (m, err) => add('warn', m + (err && err.message ? ': ' + err.message : ''), whereOf(err)),
    error: (m, err) => add('error', m, whereOf(err)),
    entries: () => entries.slice(),
    errorCount: () => entries.filter(e => e.lvl === 'error').length,
    clear: () => { entries = []; persist(); },
    onError: fn => { listener = fn; }
  };
})();

/* A script or stylesheet that fails to load (wrong folder, 404) raises 'error' on its own element and does not bubble,
   so it is listened for in the capture phase. The list feeds the self-check and the red setup bar. */
const failedFiles = [];
window.addEventListener('error', e => {
  const t = e.target;
  if (t && t !== window && (t.src || t.href)) {
    const f = String(t.src || t.href).split('/').slice(-3).join('/');
    if (!failedFiles.includes(f)) { failedFiles.push(f); Log.error('File failed to load: ' + f); }
  }
}, true);

/* Catch anything that slips through */
window.addEventListener('error', e => Log.error(e.message || 'Script error', { stack: `${String(e.filename || '').split('/').pop()}:${e.lineno}:${e.colno}` }));
window.addEventListener('unhandledrejection', e => Log.error('Unhandled promise rejection: ' + String((e.reason && e.reason.message) || e.reason)));
