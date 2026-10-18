/* MAIN – router, rendering (with an error boundary), toast, event handling and startup checks.
   Hash routes:  #/overview  #/workouts  #/library  #/progress  #/skills  #/schedule  #/settings
                 #/plan/<workoutId>  #/exercise/<exerciseId>  #/session/<workoutId>  #/complete/<workoutId>
                 #/profile  #/profile/privacy  #/profile/help
   Every route argument is checked against known ids before anything is drawn. */

const NAV = [['overview', 'Overview'], ['workouts', 'Workouts'], ['library', 'Exercise library'], ['progress', 'My progress'], ['skills', 'Skills'], ['schedule', 'Schedule']];
const PAGES = ['overview', 'workouts', 'library', 'progress', 'skills', 'schedule', 'settings'];
const CARBON_PAGES = ['session', 'plan', 'exercise', 'complete', 'profile'];       // always the near-black Figma theme
const DESKTOP_CLASS = 'max-w-[1180px] mx-auto px-4 sm:px-8 py-6';

function route() {
  const [page = 'overview', arg, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  return { page: page || 'overview', arg: arg ? decodeURIComponent(arg).slice(0, 80) : undefined, extra: rest.length };
}
function validRoute({ page, arg, extra }) {
  if (extra) return false;
  if (['plan', 'session', 'complete'].includes(page)) return WORKOUTS.has(arg);
  if (page === 'exercise') return EXERCISES.has(arg);
  if (page === 'profile') return !arg || ['privacy', 'help'].includes(arg);
  return !arg && PAGES.includes(page);
}

const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

function renderChrome(page) {                       // desktop sidebar only (hidden on mobile)
  const active = CARBON_PAGES.includes(page) ? (page === 'session' || page === 'plan' || page === 'complete' ? 'workouts' : page === 'exercise' ? 'library' : '') : page;
  setHtml('nav', NAV.map(([id, l]) => `<a href="#/${id}" data-nav="${id}" class="nav-link ${active === id ? 'active' : ''}">${icon(id, 'w-4 h-4')}${l}</a>`).join(''));
  setHtml('nav-settings', `${icon('settings', 'w-4 h-4')}Settings`);
  setHtml('nav-help', `${icon('help', 'w-4 h-4')}Help &amp; feedback`);
  setHtml('s-logo', icon('arrow', 'w-5 h-5'));
  setHtml('side-user', `<span class="w-9 h-9 rounded-full grid place-items-center text-xs font-semibold" style="background:var(--panel2)">${esc(initials())}</span><span class="leading-tight"><span class="block text-sm font-medium">${esc(Store.setting('name'))}</span><span class="block text-xs muted">Saved on this device</span></span>`);
  const p = ui.program, list = listFor(p), n = doneSessions(list), nxt = nextWorkout(p);
  const where = !nxt ? 'Complete' : p === 'beginner' ? `Day ${nxt.day} of 30` : `Month ${metaOf(nxt).month} of 3`;
  setHtml('side-program', `<p class="eyebrow accent">Your program</p><p class="display text-2xl mt-1">${programName(p)}</p>
    <p class="text-[11px] muted mt-1">${where} · ${n}/${list.length} done</p>
    <div class="h-1 rounded-full my-3" style="background:var(--line)"><div class="h-full rounded-full accent-bg" style="width:${Math.round(n / list.length * 100)}%"></div></div>
    <a href="#/workouts" class="text-xs muted hover:text-white inline-flex items-center gap-1 min-h-[32px]">View program ${icon('arrow', 'w-3 h-3')}</a>`);
}

function showFatal(err) {
  const app = document.getElementById('app'); if (!app) return;
  app.className = 'max-w-md mx-auto px-5 py-10';
  app.innerHTML = `<div class="panel p-6" role="alert"><p class="eyebrow accent">Something went wrong</p><h1 class="display text-4xl mt-2">This screen failed to load.</h1>
    <p class="text-sm muted mt-3">Your saved progress is safe. Details were recorded in the error log.</p>
    <pre class="text-xs mt-4 p-3 rounded-lg overflow-x-auto" style="background:var(--panel2)">${esc(err && err.message ? err.message : err)}</pre>
    <div class="grid gap-3 mt-5"><a href="#/profile/help" class="btn btn-primary">Open diagnostics</a><a href="#/overview" class="btn btn-ghost">Go to Home</a><button data-action="p-reload" class="btn btn-ghost">Reload app</button></div></div>`;
}

function render() {
  try { renderInner(); }
  catch (e) { Log.error('Screen failed to render: ' + (e && e.message), e); showFatal(e); }
}
function renderInner() {
  const r = route();
  if (tickId) { clearInterval(tickId); tickId = null; }
  if (!validRoute(r)) { Log.warn(`Unknown route "${String(location.hash).slice(0, 60)}"; went Home`); sess = null; location.replace('#/overview'); return; }
  const { page, arg } = r;
  if (page === 'complete' && Store.status(WORKOUTS.get(arg)) !== 'completed') { location.replace('#/plan/' + arg); return; }
  if (page === 'session') { if (!sess || sess.wid !== arg) startSession(arg); tickId = setInterval(tick, 250); } else sess = null;

  const mobile = isMobile(), narrow = mobile || ['plan', 'exercise', 'complete', 'profile'].includes(page);
  document.documentElement.dataset.theme = mobile || CARBON_PAGES.includes(page) ? 'carbon' : 'slate';
  const DESKTOP = { overview: overviewPage, workouts: workoutsPage, library: libraryPage, progress: progressPage, skills: skillsPage, schedule: schedulePage, settings: settingsPage, session: sessionPage, plan: mPlan, exercise: mExercise, complete: mComplete, profile: mProfile };
  const MOBILE = { overview: mHome, workouts: mWorkouts, library: mLibrary, progress: mProgress, skills: mSkills, schedule: mSchedule, settings: mProfile, session: mSession, plan: mPlan, exercise: mExercise, complete: mComplete, profile: mProfile };
  const app = document.getElementById('app');
  app.className = narrow ? '' : DESKTOP_CLASS;
  app.innerHTML = (mobile ? MOBILE : DESKTOP)[page](arg);
  const key = `${page}/${arg || ''}/${mobile}`;
  if (key !== lastKey) { window.scrollTo(0, 0); lastKey = key; }
  renderChrome(page);
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast'); if (!el) return;
  el.textContent = msg; el.classList.remove('opacity-0');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('opacity-0'), 2800);
}

/* ---------- events (one delegated click handler; no inline handlers anywhere) ---------- */
const SESSION_ACTIONS = ['complete', 'select-ex', 'edit-set', 'close-edit', 'adj', 'undo-set', 'rest-add', 'rest-skip', 'pause', 'end', 'm-ex'];
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function handleClick(e) {
  const b = e.target.closest('[data-action]'); if (!b) return;
  const a = b.dataset.action;
  if (SESSION_ACTIONS.includes(a) && !sess) return;
  if (has(ACTIONS, a)) { ACTIONS[a](b); return; }
  if (handleSkillAction(a, b) || handleMetricAction(a, b)) return;
  const w = sess ? WORKOUTS.get(sess.wid) : null, ex = w ? w.exercises[sess.exIdx] : null;
  if (a === 'start') { if (WORKOUTS.has(b.dataset.wid)) { Sound.unlock(); location.hash = '#/session/' + b.dataset.wid; } }
  else if (a === 'set-program') { if (['beginner', 'roadmap'].includes(b.dataset.p)) { ui.program = b.dataset.p; Store.setProgram(ui.program); ui.schedWeek = null; ui.schedSel = null; ui.wall = false; render(); } }
  else if (a === 'complete') completeSet();
  else if (a === 'select-ex') { sess.exIdx = num(b.dataset.i, 0, w.exercises.length - 1); sess.editing = null; render(); }
  else if (a === 'edit-set') { sess.editing = num(b.dataset.i, 0, ex.sets - 1); render(); }
  else if (a === 'close-edit') { sess.editing = null; render(); }
  else if (a === 'adj') { const i = sess.editing, v = i === null ? null : Store.getSets(w, ex)[i]; if (v === null || v === undefined) return; const step = unitWord(ex) === 'sec' ? 5 : 1; Store.setSet(w, ex, i, Math.max(0, v + (+b.dataset.d === -1 ? -step : step))); render(); }
  else if (a === 'undo-set') { if (sess.editing !== null) { Store.setSet(w, ex, sess.editing, null); sess.editing = null; sess.rest = null; render(); } }
  else if (a === 'rest-add') { if (sess.rest) { if (sess.rest.left != null) sess.rest.left += 15000; else sess.rest.endsAt += 15000; sess.rest.total += 15; sess.rest.notified = false; render(); } }
  else if (a === 'rest-skip') { sess.rest = null; render(); }
  else if (a === 'pause') togglePause();
  else if (a === 'end') { if (Store.status(w) === 'completed' || confirm('End workout? Your logged sets are saved.')) location.hash = '#/overview'; }
  else if (a === 'form-demo') toast('Form demo videos are coming soon.');
  else if (a === 'help') location.hash = '#/profile/help';
  else if (a === 'reset') { if (confirm('Reset all progress? This cannot be undone.')) { Store.reset(); render(); toast('Progress reset.'); } }
}
document.addEventListener('click', e => {
  try { handleClick(e); }
  catch (err) { Log.error('Action failed: ' + (err && err.message), err); toast('Something went wrong. See Help & feedback for details.'); }
});

/* Search boxes: <input data-bind="q|wq|lq"> writes into ui[...] (max 60 chars) and redraws, keeping focus */
document.addEventListener('input', e => {
  const t = e.target, key = t && t.dataset && t.dataset.bind;
  if (!['q', 'wq', 'lq'].includes(key)) return;
  try {
    ui[key] = String(t.value).slice(0, 60);
    if (key === 'lq') ui.llimit = 24;
    render();
    const el = t.id && document.getElementById(t.id);
    if (el) { el.focus(); try { el.setSelectionRange(ui[key].length, ui[key].length); } catch (e2) { /* ignore */ } }
  } catch (err) { Log.error('Search failed: ' + (err && err.message), err); }
});

window.addEventListener('hashchange', render);
if (MQ) (MQ.addEventListener ? MQ.addEventListener('change', render) : MQ.addListener && MQ.addListener(render));
Log.onError(() => toast('Something went wrong. Details: Profile → Help & feedback.'));

/* ---------- startup ---------- */
render();
if (Store.loadNotes.length) toast('Some saved data was repaired. See Help & feedback.');
else if (!Store.available) toast('Storage is unavailable here, so progress will not be saved.');

/* After everything has loaded: if a critical check fails, say so on screen instead of leaving a broken page */
window.addEventListener('load', () => {
  try {
    const bad = selfCheck().filter(c => !c.ok && /loaded|complete|Theme|Layout|Browser storage/.test(c.name));
    if (!bad.length) return;
    const bar = document.createElement('div');
    bar.setAttribute('role', 'alert');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:50;padding:12px 16px;background:#7f1d1d;color:#fff;font:14px system-ui,sans-serif';
    bar.textContent = 'Setup problem: ' + bad.map(c => `${c.name} — ${c.hint}`).join(' | ') + '  (More: Profile → Help & feedback, or docs/TROUBLESHOOTING.md)';
    document.body.appendChild(bar);
    Log.error('Startup check failed: ' + bad.map(c => c.name).join('; '));
  } catch (e) { Log.error('Startup check crashed', e); }
});
