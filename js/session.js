/* SESSION – workout activity screen: timers, set logging, rest countdown */

const elapsedMs = () => sess.base + (sess.paused ? 0 : Date.now() - sess.since);
const restLeftMs = () => !sess.rest ? 0 : (sess.paused && sess.rest.left != null ? sess.rest.left : Math.max(0, sess.rest.endsAt - Date.now()));
const firstIncomplete = w => { const i = w.exercises.findIndex(ex => Store.getSets(w, ex).some(v => v === null)); return i === -1 ? 0 : i; };

function startSession(wid) {
  const w = WORKOUTS.get(wid);
  sess = { wid, exIdx: firstIncomplete(w), base: 0, since: Date.now(), paused: false, rest: null, editing: null, startedComplete: Store.status(w) === 'completed' };
}
/* Beeps + vibration when a rest ends. The AudioContext is created from a tap (browsers block sound otherwise). */
const Sound = {
  ctx: null,
  unlock() {
    try {
      if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { Log.warn('Audio could not start', e); }
  },
  beep(n = 3) {
    if (!Store.setting('sound') || !this.ctx) return;
    try {
      for (let i = 0; i < n; i++) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime + i * 0.22;
        o.type = 'sine'; o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + 0.18);
      }
    } catch (e) { Log.warn('Beep failed', e); }
  },
  buzz(pattern) { if (Store.setting('sound') && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { /* ignore */ } } }
};
/* Rest length: the plan's value, unless the user chose a fixed rest in Settings (never for 0s stretches) */
const restSeconds = ex => (ex.rest > 0 && Store.setting('restOverride') > 0 ? Store.setting('restOverride') : ex.rest);

function startRest(sec) {
  sess.rest = sec > 0 ? { total: sec, endsAt: Date.now() + sec * 1000, left: null, notified: false } : null;
}
function restView(ex, nextI) {
  const total = sess.rest ? sess.rest.total : restSeconds(ex), left = restLeftMs();
  if (!sess.rest) return { clock: fmtClock(total * 1000), pct: 0, expired: false, sub: 'Rest timer starts when you complete a set', short: 'Starts when you complete a set', total };
  const expired = left <= 0;
  const up = nextI >= 0 ? `Set ${nextI + 1} is up next` : 'Next exercise is up';
  return { clock: fmtClock(left), pct: Math.min(100, (1 - left / (total * 1000)) * 100), expired, total,
    sub: expired ? 'Rest over — start your next set' : `of ${total} seconds · ${up}`,
    short: expired ? 'Rest over — start your next set' : (nextI >= 0 ? `${nextI === ex.sets - 1 ? 'Final set' : 'Set ' + (nextI + 1)} · ${ex.target === null ? 'max' : ex.target} ${unitWord(ex)} next` : 'Next exercise is up') };
}

function sessionPage() {
  const w = WORKOUTS.get(sess.wid), ex = w.exercises[sess.exIdx], pr = Store.progress(w), pct = pctOf(w);
  const finished = Store.status(w) === 'completed';
  const sets = Store.getSets(w, ex), nextI = sets.findIndex(v => v === null), exDone = nextI === -1;
  const g = groupOf(ex, w), rv = restView(ex, nextI), uw = unitWord(ex);
  const setsWord = (ex.target === null ? 'max' : ex.target);
  const btnLabel = finished ? 'Finish workout' : exDone ? 'Next exercise' : `Complete set ${nextI + 1}`;
  const readyLine = finished ? 'All sets logged' : exDone ? 'Exercise complete' : `${nextI === sets.length - 1 ? 'Final set' : `Set ${nextI + 1} of ${sets.length}`} · ${setsWord} ${uw}`;
  const cues = CUES[g];
  const aheadNext = w.exercises.findIndex((e, i) => i !== sess.exIdx && Store.getSets(w, e).some(v => v === null));

  const segs = Array.from({ length: pr.total }, (_, i) => `<span class="h-1 flex-1 rounded-full" style="background:${i < pr.done ? 'var(--accent)' : 'var(--line)'}"></span>`).join('');

  const setCards = sets.map((v, i) => {
    const isDone = v !== null, isNext = i === nextI, editing = sess.editing === i && isDone;
    const inner = editing ? `
      <div class="flex items-center justify-between gap-2 mt-1">
        <button data-action="adj" data-d="-1" aria-label="Decrease" class="btn btn-ghost !px-0 w-12 text-xl">−</button>
        <span class="display text-4xl">${v}</span>
        <button data-action="adj" data-d="1" aria-label="Increase" class="btn btn-ghost !px-0 w-12 text-xl">+</button>
      </div>
      <div class="flex justify-between text-xs mt-1"><button data-action="undo-set" class="min-h-[48px] px-1 text-red-300">Undo set</button><button data-action="close-edit" class="min-h-[48px] px-1 accent">Done</button></div>`
    : `<div class="display text-4xl mt-2">${isDone ? v : (ex.target ?? 'Max')} <span class="text-xs font-normal muted normal-case" style="font-family:var(--font-b)">${uw} ${isDone ? 'logged' : 'target'}</span></div>
      <div class="flex justify-between items-center text-xs mt-1"><span class="muted">${isDone ? 'Completed' : isNext ? 'Up next' : 'Pending'}</span>
        ${isDone ? `<button data-action="edit-set" data-i="${i}" class="min-h-[48px] px-1 inline-flex items-center gap-1 muted hover:text-white">${icon('edit', 'w-3 h-3')} Edit ${uw}</button>` : ''}</div>`;
    return `<div class="rounded-xl p-3 border ${isNext ? 'card-next' : ''}" style="border-color:var(--line);background:var(--panel2)">
      <div class="flex justify-between eyebrow"><span>Set ${i + 1}</span><span class="${isDone ? 'accent' : ''}">${icon(isDone ? 'check' : 'circle', 'w-4 h-4')}</span></div>${inner}</div>`;
  }).join('');

  const ahead = w.exercises.map((e, i) => {
    const s = Store.getSets(w, e), d = s.filter(v => v !== null).length, full = d === s.length, cur = i === sess.exIdx;
    const tag = cur ? `<span class="text-[10px] accent tracking-wider">${full ? 'COMPLETE' : `IN PROGRESS · ${d} / ${s.length} SETS`}</span>` : i === aheadNext ? '<span class="text-[10px] muted tracking-wider">UP NEXT</span>' : '';
    return `<button data-action="select-ex" data-i="${i}" class="w-full min-h-[56px] flex items-center gap-3 p-2.5 rounded-xl border text-left ${cur ? 'card-next' : ''}" style="border-color:${cur ? '' : 'transparent'}">
      <span class="w-8 text-center ${full ? 'accent' : 'muted'} display text-xl">${full ? icon('check', 'w-5 h-5 mx-auto') : pad(i + 1)}</span>
      <span class="flex-1 min-w-0"><span class="block text-sm font-medium truncate ${full && !cur ? 'muted' : ''}">${e.name}</span><span class="block text-[11px] muted">${targetText(e)}</span>${tag}</span>
      ${mediaHTML(e, w, 'w-11 h-11 rounded-lg shrink-0')}</button>`;
  }).join('');

  return `
  <a href="#/overview" class="inline-flex items-center gap-1 text-xs muted hover:text-white min-h-[48px]">${icon('back', 'w-3.5 h-3.5')} Back to overview</a>
  <header class="flex items-start justify-between gap-4 mb-4">
    <div>
      <p class="text-[11px] tracking-widest uppercase mb-2"><span class="accent">●</span> <span class="accent">${finished ? 'Session complete' : 'Session active'}</span> <span class="muted ml-2">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
      <h1 class="display text-4xl sm:text-5xl">${weekTitle(w)}. Zero excuses.</h1>
      <p class="text-xs muted mt-2">${position(w)} · ${estMin(w)} min · ${w.exercises.length} exercises · ${levelOf(w)}</p>
    </div>
    <div class="panel px-4 py-3 shrink-0 flex items-center gap-3"><span class="accent">${icon('clock', 'w-5 h-5')}</span>
      <div><p class="eyebrow">Elapsed time</p><p id="el-elapsed" class="display text-3xl">${fmtClock(elapsedMs()).replace(/^/, '')}</p></div></div>
  </header>
  <div class="flex gap-1.5 mb-1.5" aria-hidden="true">${segs}</div>
  <div class="flex justify-between text-[11px] mb-5"><span class="muted">${pr.done} of ${pr.total} sets completed</span><span class="accent tracking-wider">${pct}% COMPLETE</span></div>

  <div class="grid gap-4 lg:grid-cols-[1fr_340px]">
    <section class="panel overflow-hidden">
      <div class="p-5 flex items-start justify-between gap-3">
        <div><p class="eyebrow accent">Exercise ${pad(sess.exIdx + 1)} / ${pad(w.exercises.length)}</p><h2 class="display text-4xl mt-1">${ex.name}</h2></div>
        <div class="text-right"><p class="eyebrow">${GROUP_LABEL[g]}</p><span class="inline-block mt-1 text-[11px] px-2 py-1 rounded-md" style="background:var(--panel2);border:1px solid var(--line)">${levelOf(w)}</span></div>
      </div>
      <div class="relative">${mediaHTML(ex, w, 'h-60 sm:h-80')}
        <button data-action="form-demo" class="btn absolute left-4 bottom-4 !min-h-[48px] text-xs" style="background:rgba(10,12,10,.75);border:1px solid var(--line)">${icon('play', 'w-3.5 h-3.5')} Watch form demo</button></div>
      <div class="p-5 border-b" style="border-color:var(--line)">
        <div class="flex items-center justify-between mb-3"><p class="eyebrow">Make every rep count</p><p class="text-sm font-semibold">${targetText(ex)}</p></div>
        <div class="grid gap-4 sm:grid-cols-3">${cues.map((c, i) => `<div class="flex gap-3"><span class="accent display text-xl">${pad(i + 1)}</span><div><p class="text-sm font-medium">${c[0]}</p><p class="text-xs muted">${c[1]}</p></div></div>`).join('')}</div>
      </div>
      <div class="p-5"><div class="flex justify-between eyebrow mb-3"><span>Your sets</span><span>${sets.filter(v => v !== null).length} logged${ex.rest ? ` · Rest ${ex.rest}s between sets` : ''}</span></div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${setCards}</div></div>
    </section>

    <div class="flex flex-col gap-4">
      <section class="panel p-5" style="background:var(--hl)">
        <div class="flex justify-between items-center"><span class="eyebrow">Rest &amp; reset</span><span class="accent">${icon('timer', 'w-4 h-4')}</span></div>
        <div id="rest-clock" class="display text-7xl text-center my-4 ${sess.rest ? 'accent' : 'muted'} ${rv.expired ? 'pulse-soft' : ''}">${rv.clock}</div>
        <p id="rest-sub" class="text-center text-xs muted mb-3">${rv.sub}</p>
        <div class="h-1.5 rounded-full mb-4" style="background:rgba(0,0,0,.35)"><div id="rest-bar" class="h-full rounded-full accent-bg" style="width:${rv.pct}%"></div></div>
        <div class="grid grid-cols-2 gap-2">
          <button data-action="rest-add" class="btn btn-ghost" ${sess.rest ? '' : 'disabled'}>+15 sec</button>
          <button data-action="rest-skip" class="btn btn-ghost" ${sess.rest ? '' : 'disabled'}>${icon('skip', 'w-4 h-4')} Skip rest</button></div>
        <p class="text-center text-[11px] muted mt-4">Breathe. Shake it out. Quality reps over everything.</p>
      </section>
      <section class="panel p-4">
        <div class="flex justify-between items-center mb-2 px-1"><h3 class="display text-2xl">The work ahead</h3><span class="text-[11px] muted">${w.exercises.filter(e => Store.getSets(w, e).every(v => v !== null)).length} / ${w.exercises.length} done</span></div>
        <div class="flex flex-col gap-1 max-h-[420px] overflow-y-auto">${ahead}</div>
        <p class="text-[11px] muted mt-3 px-1 inline-flex items-center gap-1.5">${icon('home', 'w-3 h-3')} Your space. Your body. No equipment.</p>
      </section>
    </div>
  </div>

  <div class="panel mt-4 p-3 flex flex-wrap items-center gap-3">
    <button data-action="pause" class="btn btn-ghost">${icon(sess.paused ? 'play' : 'pause', 'w-4 h-4')} ${sess.paused ? 'Resume session' : 'Pause session'}</button>
    <button data-action="end" class="btn btn-ghost">End workout</button>
    <div class="ml-auto flex items-center gap-4"><div class="text-right hidden sm:block"><p class="eyebrow">Ready when you are</p><p class="text-sm font-semibold">${readyLine}</p></div>
      <button data-action="complete" class="btn btn-primary" ${sess.paused ? 'disabled' : ''}>${icon('play', 'w-4 h-4')} ${btnLabel}</button></div>
  </div>
  <p class="text-[11px] muted mt-3 inline-flex items-center gap-1.5">${icon('timer', 'w-3 h-3')} Progress saved automatically. Stay focused on the work.</p>`;
}

/* live updates without re-rendering (elapsed clock + rest countdown) */
function tick() {
  if (!sess) return;
  const el = $('#el-elapsed'); if (el) el.textContent = fmtClock(elapsedMs());
  if (!sess.rest) return;
  const w = WORKOUTS.get(sess.wid), ex = w.exercises[sess.exIdx], nextI = Store.getSets(w, ex).findIndex(v => v === null);
  const rv = restView(ex, nextI);
  const clock = $('#rest-clock'), bar = $('#rest-bar'), sub = $('#rest-sub');
  if (clock) clock.textContent = rv.clock;
  if (bar) bar.style.width = rv.pct + '%';
  if (sub) sub.textContent = isMobile() ? rv.short : rv.sub;
  if (rv.expired && !sess.rest.notified) {
    sess.rest.notified = true;
    if (clock) clock.classList.add('pulse-soft');
    Sound.beep(3); Sound.buzz([200, 100, 200]);
  }
}

function nextIncompleteIdx(w, from) {
  const n = w.exercises.length;
  for (let k = 1; k <= n; k++) { const i = (from + k) % n; if (Store.getSets(w, w.exercises[i]).some(v => v === null)) return i; }
  return -1;
}
function completeSet() {
  const w = WORKOUTS.get(sess.wid), ex = w.exercises[sess.exIdx], sets = Store.getSets(w, ex), i = sets.findIndex(v => v === null);
  Sound.unlock();
  if (Store.status(w) === 'completed') { finishWorkout(); return; }
  if (i === -1) { const nx = nextIncompleteIdx(w, sess.exIdx); if (nx !== -1) { sess.exIdx = nx; sess.editing = null; } render(); return; }
  Store.setSet(w, ex, i, ex.target ?? 0);
  sess.editing = ex.target === null ? i : null;                    // max tests: let the user enter their result
  if (Store.status(w) === 'completed') {
    sess.rest = null;
    if (ex.target === null) { toast('Enter your result, then tap Finish workout.'); render(); return; }   // max test: let the user type the result first
    finishWorkout(); return;
  } else {
    startRest(restSeconds(ex));
    if (Store.getSets(w, ex).every(v => v !== null) && ex.target !== null) { const nx = nextIncompleteIdx(w, sess.exIdx); if (nx !== -1) sess.exIdx = nx; }
  }
  render();
}
/* Save the session summary (time + date) once, then show the Workout complete screen */
function finishWorkout() {
  if (sess.finishing) return;                         // a second tap before the screen changes must not run this twice
  sess.finishing = true;
  const w = WORKOUTS.get(sess.wid);
  if (!sess.startedComplete || !Store.meta(w.id)) Store.setMeta(w.id, { ms: elapsedMs(), at: Date.now() });
  Sound.beep(2);
  location.hash = '#/complete/' + w.id;
}
function togglePause() {
  if (!sess.paused) { sess.base = elapsedMs(); sess.paused = true; if (sess.rest) sess.rest.left = restLeftMs(); }
  else { sess.since = Date.now(); sess.paused = false; if (sess.rest && sess.rest.left != null) { sess.rest.endsAt = Date.now() + sess.rest.left; sess.rest.left = null; } }
  render();
}
