/* MOBILE SCHEDULE – "Figma: schedule". Dates come from the program start date (change it with "Adjust training days"). */

function schedState() {
  const p = ui.program, weeks = planWeeks(p), nxt = nextWorkout(p);
  if (ui.schedWeek === null || ui.schedWeek >= weeks) ui.schedWeek = nxt ? Math.min(weeks - 1, Math.floor(offsetOf(nxt) / 7)) : 0;
  const days = planWeek(p, ui.schedWeek), today = startOfToday().getTime();
  const sel = days.some(d => d.off === ui.schedSel) ? ui.schedSel : ((days.find(d => d.date.getTime() === today) || days.find(d => d.w && nxt && d.w.id === nxt.id) || days[0]).off);
  return { p, weeks, nxt, days, sel };
}

function mSchedule() {
  const { p, weeks, nxt, days, sel } = schedState(), wi = ui.schedWeek, a = days[0].date, z = days[6].date;
  const range = a.getMonth() === z.getMonth() ? `${MON[a.getMonth()]} ${a.getDate()} – ${z.getDate()}` : `${MON[a.getMonth()]} ${a.getDate()} – ${MON[z.getMonth()]} ${z.getDate()}`;
  const pills = days.map(d => {
    const on = d.off === sel, done = d.w && Store.status(d.w) === 'completed';
    return `<button data-action="m-day" data-off="${d.off}" aria-pressed="${on}" aria-label="${WD[d.date.getDay()]} ${d.date.getDate()}" class="min-h-[72px] rounded-xl flex flex-col items-center justify-center gap-1 ${on ? 'accent-bg text-[#14210a]' : ''}" style="${on ? '' : 'background:var(--panel);border:1px solid var(--line)'}">
      <span class="text-[10px] tracking-wider ${on ? '' : 'muted'}">${WD[d.date.getDay()]}</span><span class="display text-[24px]">${d.date.getDate()}</span>
      <span class="w-1.5 h-1.5 rounded-full" style="background:${done ? (on ? '#14210a' : 'var(--accent)') : (on ? '#14210a' : 'var(--line)')}"></span></button>`;
  }).join('');
  const rows = days.map(d => d.w ? mDayRow(d.w, { next: !!(nxt && d.w.id === nxt.id) })
    : `<div class="flex items-center gap-4 px-4 min-h-[76px] rounded-2xl border mb-3" style="background:var(--panel);border-color:var(--line)"><span class="w-10"><span class="eyebrow block">${WD[d.date.getDay()]}</span><span class="display text-[28px] block">${d.date.getDate()}</span></span>
        <span class="flex-1"><span class="block font-semibold">Rest &amp; reset</span><span class="block text-[13px] muted">You’ve earned it</span></span><span class="muted">${icon('leaf', 'w-5 h-5')}</span></div>`).join('');
  const edit = ui.schedEdit ? mCard(`<div class="p-4"><label for="m-start" class="eyebrow block mb-2">Program start date (day 1)</label>
      <div class="flex gap-2"><input id="m-start" type="date" value="${esc(Store.data.startDate)}" min="2020-01-01" max="2100-12-31" class="flex-1 min-h-[48px] px-3 rounded-xl text-[15px] outline-none" style="background:var(--panel2);border:1px solid var(--line);color-scheme:dark" />
      <button data-action="m-savestart" class="btn btn-primary">Save</button></div><p class="text-[12px] muted mt-2">Every session’s date follows from this day.</p></div>`, 'mb-3') : '';
  return mScreen({ active: 'schedule', body:
    `${mEyebrow('Make time for yourself')}${mTitle('Your week, in motion.')}${mSub('A plan that fits your life. Show up, then build from there.')}
     <div class="grid grid-cols-[56px_1fr_56px] items-center gap-3 mt-6">
       <button data-action="m-week" data-d="-1" aria-label="Previous week" class="min-h-[56px] rounded-xl border grid place-items-center ${wi === 0 ? 'opacity-40' : ''}" style="border-color:var(--line)" ${wi === 0 ? 'disabled' : ''}>${icon('back', 'w-5 h-5')}</button>
       <div class="text-center"><p class="display text-[26px]">${a.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()} ${a.getFullYear()}</p><p class="text-[12px] muted">${range} · Week ${wi + 1}${p === 'beginner' && wi === weeks - 1 ? ' (bonus days)' : ''}</p></div>
       <button data-action="m-week" data-d="1" aria-label="Next week" class="min-h-[56px] rounded-xl border grid place-items-center ${wi >= weeks - 1 ? 'opacity-40' : ''}" style="border-color:var(--line)" ${wi >= weeks - 1 ? 'disabled' : ''}>${icon('chev', 'w-5 h-5')}</button></div>
     <div class="grid grid-cols-7 gap-1.5 mt-4">${pills}</div>
     ${mSection('Your training plan', `<button data-action="m-sedit" class="text-[14px] accent min-h-[48px]">Edit week</button>`)}${edit}${rows}
     <button data-action="m-sedit" class="btn btn-ghost w-full mt-2 !min-h-[56px]">${icon('schedule', 'w-5 h-5')} Adjust training days</button>` });
}

Object.assign(ACTIONS, {
  'm-week': b => { const d = +b.dataset.d; if (d !== 1 && d !== -1) return; const { weeks } = schedState(); ui.schedWeek = Math.max(0, Math.min(weeks - 1, ui.schedWeek + d)); ui.schedSel = null; render(); },
  'm-day': b => { ui.schedSel = num(b.dataset.off, 0, 400); render(); },
  'm-sedit': () => { ui.schedEdit = !ui.schedEdit; render(); },
  'm-savestart': () => {
    const el = $('#m-start');
    if (el && Store.setStartDate(el.value)) { ui.schedEdit = false; ui.schedWeek = null; ui.schedSel = null; toast('Start date updated.'); }
    else toast('Please choose a valid date.');
    render();
  }
});
