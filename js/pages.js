/* PAGES – Overview, Workouts, Library, Progress, Schedule, Settings (each returns an HTML string) */

/* ---------- pages ---------- */
function overviewPage() {
  const p = ui.program, list = listFor(p), nxt = nextWorkout(p), w = nxt || list[list.length - 1], done = !nxt;
  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const completed = list.filter(x => Store.status(x) === 'completed').length;
  const groups = groupsFor(p), strip = weekStrip(p, w), streak = streakOf(list);
  const unit = p === 'beginner' ? 'Day' : 'Session';
  const first = w.exercises[0];
  return `
  <header class="flex items-start justify-between gap-4 mb-6">
    <div>
      <p class="eyebrow mb-3">Train at home. Build anywhere.</p>
      <h1 class="display text-5xl sm:text-6xl">Show up. Get stronger.</h1>
      <p class="muted text-sm mt-2">${greet}, athlete. Your only competition is who you were yesterday.</p>
    </div>
    <div class="hidden sm:flex flex-col items-end gap-3 shrink-0">
      <div class="flex items-center gap-3 text-sm muted"><span>${dateStr}</span>${icon('bell', 'w-4 h-4')}</div>
      <span class="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style="border:1px solid var(--line);background:var(--panel)">${icon('home', 'w-3.5 h-3.5')} Your space. Your body. No equipment.</span>
    </div>
  </header>

  <section class="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
    <div class="panel relative overflow-hidden min-h-[340px]">
      ${mediaHTML(first, w, 'absolute inset-0')}
      <div class="absolute inset-0" style="background:linear-gradient(90deg,rgba(6,14,18,.88) 0%,rgba(6,14,18,.55) 55%,rgba(6,14,18,.15) 100%)"></div>
      <span class="absolute top-4 right-5 eyebrow z-10">${position(w)}</span>
      <div class="relative z-10 p-6 sm:p-8 h-full flex flex-col justify-center items-start gap-4">
        <span class="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded accent-bg text-[#14210a]">${done ? 'Program complete' : 'Today’s workout'}</span>
        <h2 class="display text-5xl sm:text-6xl">${done ? 'Program complete.<br>Keep going.' : `${weekTitle(w)}.<br>Zero excuses.`}</h2>
        <p class="text-sm muted max-w-sm">Build real-world strength with nothing but your body. A little space. A lot of intent.</p>
        <div class="flex flex-wrap gap-x-5 gap-y-1 text-xs muted">
          <span class="inline-flex items-center gap-1.5">${icon('clock', 'w-3.5 h-3.5 accent')} ${estMin(w)} min</span>
          <span class="inline-flex items-center gap-1.5">${icon('layers', 'w-3.5 h-3.5 accent')} ${w.exercises.length} exercises</span>
          <span class="inline-flex items-center gap-1.5">${icon('bars', 'w-3.5 h-3.5 accent')} ${levelOf(w)}</span>
        </div>
        <div class="flex flex-wrap gap-3">
          ${done ? '' : `<button data-action="start" data-wid="${w.id}" class="btn btn-primary">Start workout ${icon('play', 'w-4 h-4')}</button>`}
          <a href="#/workouts" class="btn btn-ghost">View plan ${icon('arrow', 'w-4 h-4')}</a>
        </div>
      </div>
    </div>

    <div class="panel p-5 flex flex-col">
      <div class="flex items-center justify-between"><span class="eyebrow">The work is adding up</span><span class="muted">${icon('arrow', 'w-4 h-4')}</span></div>
      <div class="flex items-center gap-4 mt-4 pb-4 border-b" style="border-color:var(--line)">
        <span class="w-12 h-12 rounded-xl grid place-items-center accent" style="background:var(--hl)">${icon('flame', 'w-6 h-6')}</span>
        <div><div class="display text-4xl">${streak} ${unit} streak</div><p class="text-xs muted">${streak ? 'You’re making consistency a habit.' : 'Finish a workout to start your streak.'}</p></div>
      </div>
      <div class="grid grid-cols-2 gap-4 py-4">
        <div><div class="display text-4xl">${completed}</div><p class="text-xs muted">Workouts completed</p></div>
        <div><div class="display text-4xl">${Math.round((completed / list.length) * 100)}%</div><p class="text-xs muted">Plan complete</p></div>
      </div>
      <div class="mt-auto"><div class="flex items-center justify-between mb-2"><span class="eyebrow">Weekly training volume</span><span class="text-[11px] accent">${setsDone(list)} sets logged</span></div>
        ${barChart(groups, metaOf(w).key)}
        <div class="flex justify-between eyebrow mt-1.5"><span>${p === 'beginner' ? 'Week 1' : 'Month 1'}</span><span>This week</span></div></div>
    </div>
  </section>

  <section class="mt-8">
    <div class="flex items-end justify-between mb-3">
      <h3 class="display text-2xl">Your week, in motion <span class="eyebrow ml-2 align-middle">${p === 'beginner' ? `Days ${strip[0].day}–${strip[strip.length - 1].day}` : `Month ${metaOf(w).month} · Week ${metaOf(w).week}`}</span></h3>
      <a href="#/schedule" class="text-xs muted hover:text-white">Manage schedule</a>
    </div>
    <div class="grid gap-3 grid-cols-2 sm:grid-cols-4 ${strip.length >= 7 ? 'lg:grid-cols-7' : strip.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}">${strip.map(x => weekCard(x, nxt && nxt.id)).join('')}</div>
  </section>

  <section class="mt-8">
    <div class="flex items-end justify-between mb-3">
      <h3 class="display text-2xl">The moves that move you</h3>
      <button data-action="start" data-wid="${w.id}" class="text-xs muted hover:text-white inline-flex items-center gap-1">View all ${w.exercises.length} exercises ${icon('arrow', 'w-3 h-3')}</button>
    </div>
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      ${w.exercises.slice(0, 4).map(ex => `
        <div class="panel overflow-hidden">
          ${mediaHTML(ex, w, 'h-40')}
          <div class="p-4"><p class="eyebrow">${GROUP_LABEL[groupOf(ex, w)]}</p>
            <h4 class="display text-2xl mt-1">${ex.name}</h4>
            <div class="flex items-center justify-between text-xs mt-2"><span>${targetText(ex)}</span><span class="muted"><span class="accent">•</span> ${levelOf(w)}</span></div></div>
        </div>`).join('')}
    </div>
  </section>
  <footer class="flex items-center justify-between text-[11px] muted mt-6 pt-2">
    <span class="inline-flex items-center gap-2">${icon('timer', 'w-3.5 h-3.5')} Rest 60 sec between sets. Quality reps over everything.</span>
    <span class="hidden sm:inline tracking-widest uppercase">No gym. No gear. Just you.</span>
  </footer>`;
}

const programToggle = () => `
  <div role="tablist" aria-label="Program" class="inline-grid grid-cols-2 gap-1 p-1 rounded-xl" style="background:var(--panel);border:1px solid var(--line)">
    ${[['beginner', '30-Day Beginner Matrix'], ['roadmap', '3-Month Skill Roadmap']].map(([id, label]) =>
      `<button role="tab" aria-selected="${ui.program === id}" data-action="set-program" data-p="${id}"
        class="min-h-[48px] px-4 rounded-lg text-sm font-semibold transition ${ui.program === id ? 'accent-bg text-[#14210a]' : 'muted hover:text-white'}">${label}</button>`).join('')}
  </div>`;

function workoutsPage() {
  const p = ui.program, nxt = nextWorkout(p);
  const body = p === 'beginner'
    ? `<div class="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">${DAYS.map(d => weekCard(d, nxt && nxt.id)).join('')}</div>`
    : MONTHS.map(m => {
        const bl = monthBlocks(m), n = bl.filter(b => Store.status(b) === 'completed').length;
        return `<div class="panel p-5 mb-4">
          <div class="flex items-end justify-between mb-4"><div><p class="eyebrow accent">Month ${m.id}</p><h3 class="display text-3xl">${m.name}</h3><p class="text-sm muted">${m.blurb}</p></div>
            <span class="text-xs muted">${n}/${bl.length} sessions</span></div>
          ${m.weeks.map(wk => `<p class="eyebrow mb-2 mt-3">Week ${wk.week} · ${wk.theme}</p>
            <div class="grid gap-3 grid-cols-1 sm:grid-cols-3">${wk.blocks.map(b => weekCard(b, nxt && nxt.id)).join('')}</div>`).join('')}
        </div>`; }).join('');
  return `<header class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div><p class="eyebrow mb-2">Pick a session</p><h1 class="display text-5xl">Workouts</h1></div>${programToggle()}</header>${body}`;
}

function libraryPage() {
  const map = new Map();
  [...WORKOUTS.values()].forEach(w => w.exercises.forEach(ex => {
    const e = map.get(ex.name) || { ex, w, count: 0 }; e.count++; map.set(ex.name, e);
  }));
  const q = ui.q.trim().toLowerCase();
  const items = [...map.values()].filter(e => e.ex.name.toLowerCase().includes(q))
    .sort((a, b) => groupOf(a.ex, a.w).localeCompare(groupOf(b.ex, b.w)) || a.ex.name.localeCompare(b.ex.name));
  return `<header class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div><p class="eyebrow mb-2">${map.size} movements</p><h1 class="display text-5xl">Exercise library</h1></div>
      <input id="lib-search" type="search" value="${esc(ui.q)}" data-bind="q" maxlength="60" placeholder="Search exercises…" class="min-h-[48px] px-4 rounded-xl text-sm w-full sm:w-72 outline-none" style="background:var(--panel);border:1px solid var(--line)" />
    </header><div id="lib-grid">${libraryGrid(items)}</div>`;
}
const libraryGrid = items => items.length
  ? `<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">${items.map(({ ex, w, count }) => `
      <div class="panel overflow-hidden">${mediaHTML(ex, w, 'h-28')}
        <div class="p-4"><p class="eyebrow">${GROUP_LABEL[groupOf(ex, w)]}</p><h4 class="display text-xl mt-1">${ex.name}</h4>
        <p class="text-xs muted mt-1">${ex.unit.includes('sec') ? 'Isometric hold' : 'Reps'} · in ${count} workout${count > 1 ? 's' : ''}${ex.skill ? ` · <span class="accent">${ex.skill}</span>` : ''}</p></div></div>`).join('')}</div>`
  : '<p class="muted text-sm">No exercises match your search.</p>';

function schedulePage() {
  const p = ui.program, list = listFor(p), nxt = nextWorkout(p), start = nxt ? list.indexOf(nxt) : 0, up = list.slice(start, start + 7);
  return `<header class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div><p class="eyebrow mb-2">Next ${up.length} sessions</p><h1 class="display text-5xl">Schedule</h1></div>${programToggle()}</header>
    <div class="grid gap-3">${up.map((w, i) => `
      <button data-action="start" data-wid="${w.id}" class="panel p-4 flex items-center gap-4 text-left min-h-[64px] hover:border-[var(--accent)] ${i === 0 ? 'card-next' : ''}">
        <span class="display text-3xl w-16 shrink-0 ${i === 0 ? 'accent' : ''}">${w.program === 'beginner' ? 'Day ' + w.day : 'B' + w.id.slice(-1)}</span>
        <span class="flex-1"><span class="block font-medium">${weekTitle(w)}</span><span class="block text-xs muted">${w.subtitle} · ${estMin(w)} min · ${w.exercises.length} exercises</span></span>
        <span class="text-xs ${i === 0 ? 'accent' : 'muted'}">${i === 0 ? 'Up next' : Store.status(w).replace('_', ' ')}</span></button>`).join('') || '<p class="muted">All sessions complete.</p>'}</div>`;
}

function settingsPage() {
  return `<header class="mb-6"><p class="eyebrow mb-2">Your space</p><h1 class="display text-5xl">Settings</h1></header>
    <div class="panel p-5 max-w-xl">
      <p class="font-medium">Your progress</p>
      <p class="text-sm muted mt-1">${Store.available ? 'Saved automatically in this browser (LocalStorage). No account needed.' : 'Storage is blocked in this browser, so progress is not being saved.'}</p>
      <button data-action="reset" class="btn btn-ghost mt-4 hover:!border-red-400 hover:text-red-300">Reset all progress</button>
    </div>`;
}
