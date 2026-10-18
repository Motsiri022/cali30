/* resilience.test.js – when things go wrong the app must keep working AND say what happened */
const { boot, sleep, waitFor, makeT } = require('./helpers');
const { t, done } = makeT();

(async () => {
  // ---------- corrupt / oversized / repaired storage ----------
  const C = boot({ mobile: true, hash: '#/profile/help', stored: '{this is not json' });
  t('corrupt JSON: app starts fresh, no crash', C.errors.length === 0 && C.ev('Store.status(DAYS[0])') === 'not_started');
  t('corrupt JSON: a backup copy of the bad text was kept', C.w.localStorage.getItem('calis30:corrupt-backup') === '{this is not json');
  t('corrupt JSON: shown in Help self-check + logged', /Saved data was healthy/.test(C.app()) && /unreadable/.test(C.app()) && C.ev('Log.entries().some(e => e.lvl === "warn")'));
  t('corrupt JSON: user told with a toast', /repaired/.test(C.txt('#toast')));
  const big = boot({ stored: '{"v":1,"pad":"' + 'x'.repeat(2100000) + '"}' });
  t('oversized saved data is ignored (not parsed)', big.errors.length === 0 && /too large|ignored/i.test(big.ev('Store.loadNotes.join(" ")')));
  const bad = boot({ stored: JSON.stringify({ v: 1, sets: { 'nope-1': { x: [1] }, 'b-d1': { 'zzz': [1] } } }) });
  t('unknown ids dropped and counted', /2 invalid saved entries were discarded/.test(bad.ev('Store.loadNotes.join(" ")')));
  t('wrong version is treated as fresh', boot({ stored: JSON.stringify({ v: 2, sets: { 'b-d1': {} } }) }).ev('Store.data.v') === 1);

  // ---------- storage blocked / full ----------
  const B = boot({ mobile: true, blockStorage: true, hash: '#/session/b-d1' });
  t('blocked storage: app still runs and warns', B.errors.length === 0 && /unavailable/.test(B.txt('#toast')) && B.ev('Store.available') === false);
  B.act('complete');
  t('blocked storage: sets still work in memory', B.ev('Store.progress(DAYS[0]).done') === 1 && B.errors.length === 0);
  B.go('#/profile/help');
  t('blocked storage: Help names the problem', /Browser storage works/.test(B.app()) && /blocked/i.test(B.app()));
  const Q = boot({ failSaves: true, mobile: true, hash: '#/session/b-d1' });
  Q.act('complete');
  t('storage full: saveFailed flagged, error logged, user told', Q.ev('Store.saveFailed') === true && Q.ev('Log.errorCount()') >= 1 && /Something went wrong/.test(Q.txt('#toast')));
  t('storage full: app keeps working in memory', Q.ev('Store.progress(DAYS[0]).done') === 1 && Q.errors.length === 0);
  Q.go('#/profile/help');
  t('storage full: Help shows "Last save succeeded" failing', /Last save succeeded/.test(Q.app()) && /may be full/.test(Q.app()));

  // ---------- error boundary ----------
  const E = boot({ mobile: true, hash: '#/overview' });
  E.w.eval('mHome = function () { throw new Error("boom from test"); }');
  E.go('#/workouts'); E.go('#/overview');
  t('a screen that throws shows a friendly error panel, not a blank page', /This screen failed to load/.test(E.app()) && /boom from test/.test(E.app()) && !!E.d.querySelector('[role="alert"]'));
  t('the failure was logged', E.ev('Log.entries().some(e => /Screen failed to render/.test(e.msg))'));
  t('panel links to diagnostics, home and reload', !!E.d.querySelector('#app a[href="#/profile/help"]') && !!E.d.querySelector('#app a[href="#/overview"]') && E.has('p-reload'));
  E.go('#/profile/help');
  t('other screens still work, and the log shows the failure', /Screen failed to render/.test(E.app()) && /boom from test/.test(E.app()));
  E.w.eval('window.__ok = true');
  // a button handler that throws
  E.w.eval('ACTIONS["boom"] = () => { throw new Error("handler boom"); }');
  const btn = E.d.createElement('button'); btn.dataset.action = 'boom'; E.d.body.appendChild(btn); E.click(btn);
  t('a throwing click handler is caught, logged and toasted', /Action failed: handler boom|Something went wrong/.test(E.txt('#toast')) && E.ev('Log.entries().some(e => /Action failed: handler boom/.test(e.msg))'));
  const U = boot({ mobile: true, hash: '#/nope/nothing' });
  await waitFor(() => /overview/.test(U.w.location.hash));
  t('unknown route: back to Home, noted as a warning', /overview/.test(U.w.location.hash) && U.ev('Log.entries().some(e => /Unknown route/.test(e.msg))'));
  t('global errors and promise rejections are captured', (() => { const X = boot({}); X.w.dispatchEvent(new X.w.ErrorEvent('error', { message: 'x-test-error', filename: 'a.js', lineno: 3, colno: 4 })); X.w.dispatchEvent(Object.assign(new X.w.Event('unhandledrejection'), { reason: new Error('x-reject') })); return X.ev('Log.entries().some(e => /x-test-error/.test(e.msg))') && X.ev('Log.entries().some(e => /x-reject/.test(e.msg))'); })());

  // ---------- log behaviour ----------
  const G = boot({});
  for (let i = 0; i < 100; i++) G.ev(`Log.info("entry ${i}")`);
  t('log keeps only the newest 60 entries', G.ev('Log.entries().length') === 60 && G.ev('Log.entries()[59].msg') === 'entry 99');
  const G2 = boot({ storage: { 'calis30:log': G.w.localStorage.getItem('calis30:log') } });
  t('log survives a reload (saved in storage)', G2.ev('Log.entries().length') === 60);
  const G3 = boot({ storage: { 'calis30:log': JSON.stringify([{ t: 1, lvl: 'x', msg: '<img>' }, { t: 'a' }, 5, { t: 5, lvl: 'warn', msg: 'ok' }]) } });
  t('corrupt log entries are filtered out on load', G3.ev('Log.entries().filter(e => e.msg === "ok").length') === 1 && G3.ev('Log.entries().every(e => e.lvl !== "x")'));
  G.ev('Log.clear()');
  t('clear empties the log', G.ev('Log.entries().length') === 0 && JSON.parse(G.w.localStorage.getItem('calis30:log')).length === 0);

  // ---------- diagnostics report ----------
  const R = boot({ mobile: true, hash: '#/overview' });
  R.act('start', '[data-wid="b-d1"]'); R.ev('Store.setSetting("name", "Zed Tester")'); R.ev('Log.warn("a test warning")');
  const rep = R.ev('diagnosticsReport()');
  t('report has version, viewport, checks and log', /Calis30 v1\.1\.0/.test(rep) && /Viewport:/.test(rep) && /Checks:/.test(rep) && /a test warning/.test(rep));
  t('report never contains the user\'s name or workout data', !/Zed|Tester/.test(rep) && !/Push-Up|reps/i.test(rep));
  t('self-check passes on a healthy page', R.ev('selfCheck().every(c => c.ok)'));

  // ---------- behaviours that protect data ----------
  const F = boot({ mobile: true, hash: '#/session/b-d1' });
  let g = 0; while (F.has('complete') && !F.w.location.hash.startsWith('#/complete') && g++ < 100) F.act('complete');
  await waitFor(() => /#\/complete/.test(F.w.location.hash));
  const t1 = F.saved().meta['b-d1'].at;
  F.go('#/session/b-d1'); F.act('complete');                                       // reviewing a finished workout must not overwrite its summary
  await waitFor(() => /#\/complete/.test(F.w.location.hash));
  t('re-opening a finished workout keeps the original time/date', F.saved().meta['b-d1'].at === t1);
  t('double tap on the last set does not break anything', F.errors.length === 0);
  const Ov = boot({ stored: JSON.stringify({ v: 1, settings: { restOverride: 90 } }), mobile: true, hash: '#/session/b-d7' });
  Ov.act('complete');
  t('rest override applies to stretches too, but only when the plan has rest', Ov.ev('sess.rest.total') === 90);
  const Z = boot({ mobile: true, hash: '#/session/b-d30' });
  Z.act('complete'); Z.act('adj', '[data-d="1"]'); Z.act('adj', '[data-d="1"]');
  t('benchmark: typed result is saved before moving on', Z.saved().sets['b-d30']['max-push-ups'][0] === 2);
  const Snd = boot({}); Snd.ev('Store.setSetting("sound", false)');
  t('sound off: beep and vibration do nothing, never throw', (() => { try { Snd.ev('Sound.beep(3); Sound.buzz([100])'); return true; } catch (e) { return false; } })());
  const Sn2 = boot({}); 
  t('sound on without audio support: beep is a safe no-op', (() => { try { Sn2.ev('Sound.beep(3)'); return Sn2.errors.length === 0; } catch (e) { return false; } })());
  const W = boot({ mobile: true, hash: '#/profile' });
  W.act('p-wipe');
  t('delete-all removes saved data, keeps the app usable', W.w.localStorage.getItem('calis30:v1') === null && W.errors.length === 0 && W.ev('Store.setting("name")') === 'Athlete');
  done();
})().catch(e => { console.log('TEST CRASH:', e.stack.split('\n').slice(0, 4).join(' | ')); process.exit(1); });
