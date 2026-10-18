/* DIAGNOSTICS – self-check and the text report behind Help & feedback > Diagnostics.
   Run it any time something looks wrong; each check says what it tested and, if it failed, what to try. */

function selfCheck() {
  const checks = [];
  const add = (name, ok, hint) => checks.push({ name, ok: !!ok, hint: ok ? '' : hint });

  // 1. Code loaded: every module exposes what the others expect
  const needed = { Log: typeof Log, Store: typeof Store, WORKOUTS: typeof WORKOUTS, esc: typeof esc, render: typeof render, sessionPage: typeof sessionPage, mHome: typeof mHome };
  const missing = Object.entries(needed).filter(([, t]) => t === 'undefined').map(([n]) => n);
  add('All script files loaded', !missing.length, `Missing: ${missing.join(', ')}. Check the <script> list and order in index.html and that every file exists in js/.`);

  add('Every file loaded', !failedFiles.length, `Not found: ${failedFiles.join(', ')}. Check the folder layout (css/, fonts/, js/, js/mobile/ next to index.html).`);

  // 2. Data integrity
  add('Workout data complete (30 days, 36 roadmap sessions)', typeof DAYS !== 'undefined' && DAYS.length === 30 && [...WORKOUTS.keys()].filter(k => k.startsWith('r-')).length === 36, 'js/data.js was edited or is incomplete.');

  // 3. Storage works (write, read, delete a probe key)
  let storageOk = false;
  try { localStorage.setItem('calis30:probe', '1'); storageOk = localStorage.getItem('calis30:probe') === '1'; localStorage.removeItem('calis30:probe'); } catch (e) { /* blocked */ }
  add('Browser storage works', storageOk, 'Storage is blocked (private mode, or site data blocked). Progress will not be saved.');
  add('Last save succeeded', !Store.saveFailed, 'The last save failed: storage may be full. Export your data, then free up space.');

  // 4. Styles applied: theme variables + compiled Tailwind present
  const hasVars = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() !== '';
  add('Theme stylesheet loaded (css/styles.css)', hasVars, 'css/styles.css not found. It must sit at css/styles.css next to index.html.');
  const probe = document.createElement('div'); probe.className = 'hidden'; document.body.appendChild(probe);
  const twOk = getComputedStyle(probe).display === 'none'; probe.remove();
  add('Layout stylesheet loaded (css/tailwind.css)', twOk, 'css/tailwind.css not found or empty. Run "npm run build:css" or copy the file from the delivery.');
  let fontsOk = true; try { fontsOk = !document.fonts || document.fonts.check('700 16px "Barlow Condensed"'); } catch (e) { fontsOk = true; }
  add('Fonts available', fontsOk, 'Font files in fonts/ were not found. The app still works with fallback fonts.');

  // 5. Saved data health
  add('Saved data was healthy on load', !Store.loadNotes.length, Store.loadNotes.join(' '));
  add('No errors recorded', Log.errorCount() === 0, `${Log.errorCount()} error(s) are in the log below. Copy the report when asking for help.`);
  return checks;
}

function diagnosticsReport() {
  const checks = selfCheck();
  const L = [];
  L.push(`${APP.name} v${APP.version} diagnostics`, `Time: ${new Date().toISOString()}`, `Viewport: ${window.innerWidth}x${window.innerHeight} (${isMobile() ? 'mobile' : 'desktop'} layout)`, `Browser: ${navigator.userAgent}`, `Route: ${location.hash || '#/'}`, `Storage available: ${Store.available}`, '');
  L.push('Checks:'); checks.forEach(c => L.push(`  [${c.ok ? 'OK ' : 'FAIL'}] ${c.name}${c.ok ? '' : ' -> ' + c.hint}`));
  L.push('', 'Log (oldest first):');
  const es = Log.entries(); if (!es.length) L.push('  (empty)');
  es.forEach(e => L.push(`  ${new Date(e.t).toISOString()} ${e.lvl.toUpperCase()} ${e.msg}${e.where ? ' @ ' + e.where : ''}`));
  return L.join('\n');
}
