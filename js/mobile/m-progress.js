/* MOBILE PROGRESS – "Figma: progress". Date ranges use the completion date saved when a session is finished;
   sessions finished before that date was recorded only count under "All time". */

function inRange(w) {
  if (ui.prange === 'all') return true;
  const m = Store.meta(w.id);
  if (!m || !m.at) return false;
  const now = new Date();
  return ui.prange === 'month' ? m.at >= new Date(now.getFullYear(), now.getMonth(), 1).getTime() : m.at >= Date.now() - 90 * 86400000;
}
const RANGE_LABEL = { month: 'Workouts this month', '3m': 'Workouts in 3 months', all: 'Workouts completed' };

function mProgress() {
  const p = ui.program, list = listFor(p), nxt = nextWorkout(p), unit = p === 'beginner' ? 'Day' : 'Session';
  const completed = list.filter(w => Store.status(w) === 'completed'), inR = completed.filter(inRange).length;
  const pct = Math.round((completed.length / list.length) * 100), streak = streakOf(list);
  const groups = groupsFor(p), curKey = nxt ? metaOf(nxt).key : groups[groups.length - 1].key;
  const ci = groups.findIndex(g => g.key === curKey), from = groups.length <= 8 ? 0 : Math.max(0, Math.min(ci - 3, groups.length - 8)), view = groups.slice(from, from + 8);
  const cur = groups[ci].sets, prev = ci > 0 ? groups[ci - 1].sets : 0, max = Math.max(1, ...view.map(g => g.sets));
  const trend = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
  const where = !nxt ? 'Complete' : p === 'beginner' ? `Day ${nxt.day} of 30` : `Month ${metaOf(nxt).month} of 3`;
  const recent = completed.map(w => ({ w, at: (Store.meta(w.id) || {}).at || 0, i: list.indexOf(w) })).sort((a, b) => b.at - a.at || b.i - a.i);
  const rows = (ui.pall ? recent : recent.slice(0, 3)).map(({ w, at }) => {
    const m = Store.meta(w.id), d = at ? new Date(at) : null;
    const mins = m && m.ms ? Math.max(1, Math.round(m.ms / 60000)) : estMin(w), sets = Store.progress(w).total;
    return `<a href="#/plan/${esc(w.id)}" class="flex items-center gap-4 min-h-[68px] border-b" style="border-color:var(--line)"><span class="accent">${icon('check', 'w-6 h-6')}</span>
      <span class="flex-1 min-w-0"><span class="block font-semibold truncate">${esc(weekTitle(w))}</span><span class="block text-[13px] muted">${d ? `${MON[d.getMonth()]} ${d.getDate()}` : (w.program === 'beginner' ? `Day ${w.day}` : esc(w.subtitle.split(' · ').slice(0, 2).join(' · ')))} · ${mins} min · ${sets} sets</span></span><span class="muted">${icon('chev', 'w-4 h-4')}</span></a>`;
  }).join('');
  const skill = key => { const i = skillInfo(key); return `<div><p class="eyebrow" style="letter-spacing:.06em">${i.def.name}</p><p class="text-[14px] font-semibold mt-1">${i.stage + 1}/${i.def.stages.length}</p></div>`; };

  return mScreen({ active: 'progress', body:
    `${mEyebrow('The work is adding up')}<h1 class="display text-[40px]">Small reps.<br>Real progress.</h1>${mSub('Your only competition is yesterday’s you.')}
     <div class="mt-6">${mChips([['month', 'This month'], ['3m', '3 months'], ['all', 'All time']].map(([v, l]) => mChip(l, ui.prange === v, 'm-range', v)))}</div>
     <div class="rounded-2xl border p-5 mt-4 flex items-center gap-4" style="background:var(--hl);border-color:var(--accent)"><span class="accent">${icon('flame', 'w-9 h-9')}</span>
       <div><div class="display text-[34px]">${streak} ${unit} streak</div><p class="text-[13px] muted">${streak ? 'You’re making consistency a habit.' : 'Finish a workout to start your streak.'}</p></div></div>
     <div class="grid grid-cols-2 gap-3 mt-3">${mCard(`<div class="p-4"><div class="display text-[34px]">${inR}</div><p class="text-[13px] muted">${RANGE_LABEL[ui.prange]}</p></div>`)}${mCard(`<div class="p-4"><div class="display text-[34px]">${pct}%</div><p class="text-[13px] muted">Plan complete</p></div>`)}</div>
     ${mCard(`<div class="p-5"><div class="flex justify-between"><span class="eyebrow">Weekly training volume</span>${trend === null ? '' : `<span class="text-[13px] ${trend >= 0 ? 'accent' : 'muted'}">${trend >= 0 ? '↗' : '↘'} ${Math.abs(trend)}%</span>`}</div>
        <div class="mt-3"><span class="display text-[44px]">${cur}</span> <span class="text-[14px] muted">sets this week</span></div>
        <div class="flex items-end gap-2 h-28 mt-4" aria-hidden="true">${view.map(g => `<div class="flex-1 rounded-md" style="height:${Math.max(6, (g.sets / max) * 100)}%;background:${g.key === curKey ? 'var(--accent)' : 'color-mix(in srgb,var(--accent) 30%,var(--panel2))'}"></div>`).join('')}</div>
        <div class="flex justify-between eyebrow mt-2"><span>${p === 'beginner' ? 'Week 1' : 'Weeks ' + (from + 1) + '–' + (from + view.length)}</span><span>${p === 'beginner' ? 'Week ' + view.length : 'This week'}</span></div></div>`, 'mt-3')}
     ${mCard(`<a href="#/workouts" class="block p-5"><span class="eyebrow accent">${programName(p)}</span><div class="flex justify-between items-baseline mt-2"><span class="display text-[24px]">${where}</span><span class="text-[13px] muted">${pct}%</span></div><div class="mt-3">${mBar(pct)}</div><p class="text-[13px] muted mt-3">Keep building. Your foundation is getting stronger.</p></a>`, 'mt-3')}
     ${mSection('Recent work', recent.length > 3 ? `<button data-action="m-pall" class="text-[14px] accent min-h-[48px]">${ui.pall ? 'Show less' : 'View all'}</button>` : '')}
     ${rows || mCard(`<p class="p-5 text-[14px] muted">Finish a workout and it will show up here.</p>`)}
     ${mSection('Skill trackers', `<a href="#/skills" class="text-[14px] accent min-h-[48px] inline-flex items-center">Open</a>`)}
     ${mCard(`<a href="#/skills" class="grid grid-cols-3 gap-3 p-5">${skillKeys.map(skill).join('')}</a>`)}` });
}

Object.assign(ACTIONS, {
  'm-range': b => { if (['month', '3m', 'all'].includes(b.dataset.v)) { ui.prange = b.dataset.v; render(); } },
  'm-pall': () => { ui.pall = !ui.pall; render(); }
});

/* Skills reuse the desktop widgets inside the mobile shell */
function mSkills() { return mScreen({ active: 'progress', back: { href: '#/progress', label: 'Progress' }, body: skillsPage().replace('<h1 class="display text-5xl">', '<h1 class="display text-[40px]">').replace('lg:grid-cols-3', '') }); }
