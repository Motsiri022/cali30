/* COMPONENTS – reusable HTML builders */

/* ---------- shared components ---------- */
function weekCard(w, nextId) {
  const st = Store.status(w), isNext = w.id === nextId, pct = pctOf(w), m = metaOf(w);
  const ic = st === 'completed' ? 'check' : isNext ? 'play' : w.type === 'rest' ? 'leaf' : 'circle';
  const status = st === 'completed' ? 'Completed' : st === 'in_progress' ? 'In progress' : isNext ? 'Up next' : w.type === 'rest' ? 'Rest day' : 'Planned';
  const top = w.program === 'beginner' ? 'DAY' : `W${m.week}`;
  const big = w.program === 'beginner' ? pad(w.day) : `B${w.id.slice(-1)}`;
  return `<button data-action="start" data-wid="${w.id}" aria-label="${weekTitle(w)}, ${status}"
      class="panel text-left p-3 min-h-[112px] flex flex-col transition hover:border-[var(--accent)] ${isNext ? 'card-next' : ''}">
    <div class="flex items-start justify-between"><span class="eyebrow">${top}</span><span class="${st === 'completed' || isNext ? 'accent' : 'muted'}">${icon(ic, 'w-4 h-4')}</span></div>
    <div class="display text-3xl mt-0.5">${big}</div>
    <p class="text-[13px] mt-1 leading-tight">${weekTitle(w)}</p>
    <p class="text-[11px] muted">${estMin(w)} min · ${status}</p>
    <div class="mt-auto pt-2"><div class="h-[3px] rounded-full" style="background:var(--line)"><div class="h-full rounded-full accent-bg" style="width:${pct}%"></div></div></div>
  </button>`;
}
const barChart = (groups, curKey, h = 'h-24') => {
  const max = Math.max(1, ...groups.map(g => g.sets));
  return `<div class="flex items-end gap-1.5 ${h}">${groups.map(g =>
    `<div class="flex-1 rounded-sm" title="${g.sets} sets" style="height:${Math.max(6, (g.sets / max) * 100)}%;background:${g.key === curKey ? 'var(--accent)' : 'color-mix(in srgb,var(--accent) 28%,var(--panel2))'}"></div>`).join('')}</div>`;
};
