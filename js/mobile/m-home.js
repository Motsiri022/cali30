/* MOBILE HOME – "Figma: overview" */

function mHome() {
  const p = ui.program, list = listFor(p), nxt = nextWorkout(p), done = !nxt, w = nxt || list[list.length - 1];
  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  const completed = doneSessions(list), pct = Math.round((completed / list.length) * 100), streak = streakOf(list);
  const upcoming = list.slice(list.indexOf(w) + 1).filter(x => Store.status(x) !== 'completed').slice(0, 3);
  const where = p === 'beginner' ? `Day ${w.day} of 30` : `Month ${metaOf(w).month} of 3`;
  const unit = p === 'beginner' ? 'Day' : 'Session';

  const hero = `<div class="relative rounded-2xl overflow-hidden mt-6 min-h-[300px] border" style="border-color:var(--line)">
      ${mediaHTML(w.exercises[0], w, 'absolute inset-0')}
      <div class="absolute inset-0" style="background:linear-gradient(180deg,rgba(8,10,8,.10) 0%,rgba(8,10,8,.82) 100%)"></div>
      <div class="relative p-5 flex flex-col justify-end min-h-[300px] gap-3">
        <span class="self-start text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded accent-bg text-[#14210a]">${done ? 'Program complete' : 'Next workout'}</span>
        <h2 class="display text-[38px]">${done ? 'Program complete.<br>Keep going.' : `${esc(weekTitle(w))}.<br>Zero excuses.`}</h2>
        <p class="text-[13px]">${estMin(w)} min · ${w.exercises.length} exercises · ${levelOf(w)}</p>
        ${done ? `<a href="#/workouts" class="btn btn-primary w-full">View plan</a>`
               : `<button data-action="start" data-wid="${esc(w.id)}" class="btn btn-primary w-full !min-h-[56px] text-base">${icon('play', 'w-5 h-5')} Start workout</button>`}
      </div></div>`;

  const stats = mCard(`<div class="grid grid-cols-3 gap-3 p-5">
      <div><div class="display text-[34px]">${streak}</div><p class="text-[12px] muted">${unit} streak</p></div>
      <div><div class="display text-[34px]">${completed}</div><p class="text-[12px] muted">Completed</p></div>
      <div><div class="display text-[34px]">${pct}%</div><p class="text-[12px] muted">Plan complete</p></div></div>`, 'mt-4');

  const prog = `<a href="#/workouts" class="block rounded-2xl border p-5 mt-4" style="background:var(--panel);border-color:var(--accent)">
      <div class="flex justify-between"><span class="eyebrow accent">Your program</span><span class="text-[13px] muted">${where}</span></div>
      <h3 class="display text-[26px] mt-2 mb-3">${programName(p)}</h3>${mBar(pct)}
      <div class="flex justify-between items-center mt-3 text-[14px]"><span>Keep building. View your plan</span><span class="accent">${icon('arrow', 'w-4 h-4')}</span></div></a>`;

  const week = mSection('Your week, in motion', `<a href="#/schedule" class="text-[14px] accent min-h-[48px] inline-flex items-center">Schedule</a>`)
    + (upcoming.length ? upcoming.map(x => mDayRow(x, { chevron: true })).join('') : mCard(`<p class="p-5 text-[14px] muted">Nothing else scheduled. Nice work.</p>`));

  return mScreen({ active: 'overview', body:
    `${mEyebrow(esc(dateStr))}<h1 class="display text-[40px]">Show up.<br>Get stronger.</h1>${mSub(`${greet}, ${esc(Store.setting('name'))}. Let’s put in the work.`)}${hero}${stats}${prog}${week}` });
}
