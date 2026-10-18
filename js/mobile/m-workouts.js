/* MOBILE WORKOUTS + PLAN – "Figma: workouts" and "Figma: workout plan" */

function workoutMatches() {
  const p = ui.program, list = listFor(p), nxt = nextWorkout(p), q = ui.wq.trim().toLowerCase();
  let ws = list.filter(w => ui.wfilter === 'all' || (ui.wfilter === 'strength' ? w.type !== 'rest' : w.type === 'rest'));
  if (q) ws = ws.filter(w => `${weekTitle(w)} ${w.subtitle} ${w.exercises.map(e => e.name).join(' ')}`.toLowerCase().includes(q));
  const all = ws;
  if (!q && !ui.wall && nxt) { const start = Math.max(0, ws.findIndex(w => list.indexOf(w) >= list.indexOf(nxt))); ws = ws.slice(start, start + 12); }
  else if (!q && !ui.wall) ws = ws.slice(0, 12);
  return { shown: ws, total: all.length };
}
function mWorkoutRow(w) {
  const st = Store.status(w);
  const label = w.program === 'beginner' ? `Day ${w.day}` : w.subtitle.split(' · ').slice(0, 2).join(' · ');
  return `<a href="#/plan/${esc(w.id)}" class="flex items-center gap-4 p-3 rounded-2xl border mb-3" style="background:var(--panel);border-color:var(--line)">
    ${mediaHTML(w.exercises[0], w, 'w-[84px] h-[84px] rounded-xl shrink-0')}
    <div class="flex-1 min-w-0"><h3 class="display text-[26px] truncate">${esc(weekTitle(w))}</h3>
      <p class="text-[13px] muted">${esc(label)} · ${estMin(w)} min · ${w.exercises.length} exercises</p><p class="text-[11px] muted mt-1">${kindOf(w)} · ${levelOf(w)}</p></div>
    <span class="${st === 'completed' ? 'accent' : 'muted'}">${icon(st === 'completed' ? 'check' : 'chev', 'w-5 h-5')}</span></a>`;
}

function mWorkouts() {
  const p = ui.program, nxt = nextWorkout(p), { shown, total } = workoutMatches();
  const next = nxt ? mCard(`<a href="#/plan/${esc(nxt.id)}" class="block p-4">
      ${mediaHTML(nxt.exercises[0], nxt, 'h-44 rounded-xl')}
      <div class="flex justify-between items-center mt-4"><span class="eyebrow accent" style="letter-spacing:.08em">${p === 'beginner' ? `Day ${nxt.day} of 30` : esc(nxt.subtitle.split(' · ').slice(0, 2).join(' / '))}</span><span class="accent">${icon('arrow', 'w-4 h-4')}</span></div>
      <h3 class="display text-[32px] mt-3">${esc(weekTitle(nxt))}. Zero excuses.</h3>
      <p class="text-[14px] muted mt-2">${estMin(nxt)} min · ${nxt.exercises.length} exercises · ${levelOf(nxt)}</p></a>`)
    : mCard(`<p class="p-5 text-[14px] muted">Every session in this program is complete.</p>`);
  const panel = ui.wpanel ? mCard(`<div class="p-4"><p class="eyebrow mb-2">Program</p><div class="grid grid-cols-2 gap-2">
      ${['beginner', 'roadmap'].map(id => `<button data-action="set-program" data-p="${id}" aria-pressed="${p === id}" class="min-h-[48px] rounded-xl border text-[13px] px-2 ${p === id ? 'accent' : 'muted'}" style="${p === id ? 'background:var(--hl);border-color:var(--accent)' : 'border-color:var(--line)'}">${programName(id)}</button>`).join('')}</div></div>`, 'mt-3') : '';
  const list = shown.length ? shown.map(mWorkoutRow).join('') : mCard(`<p class="p-5 text-[14px] muted">No sessions match your search.</p>`);
  const more = !ui.wq.trim() && total > shown.length ? `<button data-action="m-wall" class="btn btn-ghost w-full">Show all ${total} sessions</button>`
             : (!ui.wq.trim() && ui.wall && total > 12 ? `<button data-action="m-wall" class="btn btn-ghost w-full">Show fewer</button>` : '');
  return mScreen({ active: 'workouts', body:
    `${mEyebrow('Your space. Your pace.')}${mTitle('Find your next rep.')}${mSub('Purposeful sessions. No gym. No gear. Just you.')}
     <div class="mt-6">${mSearch('m-wq', 'wq', ui.wq, 'Search workouts', 'm-wpanel', ui.wpanel, 'Choose program')}${panel}</div>
     <div class="mt-4">${mChips([mChip('All workouts', ui.wfilter === 'all', 'm-wfilter', 'all'), mChip('Strength', ui.wfilter === 'strength', 'm-wfilter', 'strength'), mChip('Mobility', ui.wfilter === 'mobility', 'm-wfilter', 'mobility')])}</div>
     ${mSection('Pick up your program')}${next}
     ${mSection('Built for your body', `<span class="text-[14px] accent">${shown.length} session${shown.length === 1 ? '' : 's'}</span>`)}${list}${more}` });
}

function mPlan(wid) {
  const w = WORKOUTS.get(wid), st = Store.status(w), sets = w.exercises.reduce((n, e) => n + e.sets, 0);
  const where = w.program === 'beginner' ? `Day ${w.day} of 30` : `Month ${metaOf(w).month} · Week ${metaOf(w).week}`;
  const gear = [...new Set(w.exercises.map(e => equipmentOf(e.name)).filter(x => x !== 'No equipment'))];
  const note = (gear.length ? `You’ll need: ${gear.join(', ')}.` : 'No equipment needed.') + ' Warm up for 3–5 min before you begin.';
  const stat = (l, v) => `<div><p class="eyebrow mb-1" style="letter-spacing:.06em">${l}</p><p class="font-semibold">${v}</p></div>`;
  return mScreen({ active: 'workouts', tabs: true, back: { href: '#/workouts', label: 'Workouts' }, body:
    `${mEyebrow(`${programName(w.program)} · ${where}`.replace(/^(.*)$/, s => `<span class="accent">${esc(s)}</span>`))}
     <h1 class="display text-[44px]">${esc(weekTitle(w))}.<br>Zero excuses.</h1>
     ${mSub('Build real-world strength with nothing but your body. A little space. A lot of intent.')}
     ${mediaHTML(w.exercises[0], w, 'h-44 rounded-xl mt-6')}
     <div class="grid grid-cols-3 gap-3 mt-5">${stat('Duration', `${estMin(w)} min`)}${stat('Movements', `${w.exercises.length} exercises`)}${stat('Level', levelOf(w))}</div>
     ${mCard(`<div class="flex gap-3 p-4 text-[14px] muted"><span class="accent mt-0.5">${icon('home', 'w-5 h-5')}</span><span>${esc(note)}</span></div>`, 'mt-5')}
     ${mSection('The work ahead', `<span class="text-[14px] accent">${sets} sets</span>`)}
     <ul>${w.exercises.map((ex, i) => `<li class="border-b" style="border-color:var(--line)"><a href="#/exercise/${esc(ex.id)}" class="flex items-center gap-4 min-h-[80px] py-2">
        <span class="display text-[28px] muted w-9">${String(i + 1).padStart(2, '0')}</span>${mediaHTML(ex, w, 'w-14 h-14 rounded-lg shrink-0')}
        <span class="flex-1 min-w-0"><span class="block font-semibold truncate">${esc(ex.name)}</span><span class="block text-[13px] muted">${esc(targetText(ex))}</span></span><span class="muted">${icon('chev', 'w-4 h-4')}</span></a></li>`).join('')}</ul>
     <p class="text-[13px] muted mt-4">Rest ${restSeconds(w.exercises[0]) || 60} sec between sets. Quality reps over everything.</p>
     <button data-action="start" data-wid="${esc(w.id)}" class="btn btn-primary w-full !min-h-[56px] text-base mt-5">${icon('play', 'w-5 h-5')} ${st === 'completed' ? 'Review workout' : st === 'in_progress' ? 'Continue workout' : 'Start workout'} · ${estMin(w)} min</button>` });
}

Object.assign(ACTIONS, {
  'm-wfilter': b => { if (['all', 'strength', 'mobility'].includes(b.dataset.v)) { ui.wfilter = b.dataset.v; render(); } },
  'm-wpanel': () => { ui.wpanel = !ui.wpanel; render(); },
  'm-wall': () => { ui.wall = !ui.wall; render(); }
});
