/* ANALYTICS – "My progress" page: overall progress bars + training-volume charts (sets / reps / hold time) */

const METRICS = {
  sets: { label: 'Sets',      fmt: n => String(n) },
  reps: { label: 'Reps',      fmt: n => String(n) },
  hold: { label: 'Hold time', fmt: s => (s >= 60 ? (Math.round(s / 6) / 10) + 'm' : s + 's') }
};

/* Volume of one workout for a metric, optionally limited to one muscle group */
function metricOf(w, m, group) {
  let t = 0;
  w.exercises.forEach(ex => {
    if (group && groupOf(ex, w) !== group) return;
    Store.getSets(w, ex).forEach(v => {
      if (v === null) return;
      if (m === 'sets') t++;
      else if (m === 'reps' && unitWord(ex) === 'reps') t += v;
      else if (m === 'hold' && unitWord(ex) === 'sec') t += v;
    });
  });
  return t;
}
const sumMetric = (ws, m, group) => ws.reduce((n, w) => n + metricOf(w, m, group), 0);
const plannedSets = ws => ws.reduce((n, w) => n + w.exercises.reduce((k, ex) => k + ex.sets, 0), 0);
const doneSessions = ws => ws.filter(w => Store.status(w) === 'completed').length;

const segmentsFor = p => p === 'beginner'
  ? [1, 2, 3, 4].map(wk => ({ label: `Week ${wk}`, ws: DAYS.filter(d => d.week === wk) }))
  : MONTHS.map(m => ({ label: `Month ${m.id} · ${m.name}`, ws: monthBlocks(m) }));

const progRow = (label, done, total, unit) => {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div><div class="flex justify-between text-xs mb-1.5"><span>${label}</span><span class="muted">${done}/${total} ${unit} · ${pct}%</span></div>
    <div class="h-2 rounded-full" style="background:var(--line)"><div class="h-full rounded-full accent-bg" style="width:${pct}%"></div></div></div>`;
};

/* Bar chart with a value above and a label under each bar */
function labeledBars(items, fmt, curKey) {
  const max = Math.max(1, ...items.map(i => i.value));
  return `<div class="flex items-end gap-1.5 sm:gap-2">${items.map(i => `
    <div class="flex-1 min-w-0 flex flex-col items-center">
      <span class="text-[10px] muted h-4">${i.value ? fmt(i.value) : ''}</span>
      <div class="w-full h-36 flex items-end"><div class="w-full rounded-sm" title="${i.label}: ${fmt(i.value)}" style="height:${i.value ? Math.max(4, (i.value / max) * 100) : 2}%;background:${i.key === curKey ? 'var(--accent)' : 'color-mix(in srgb,var(--accent) 30%,var(--panel2))'}"></div></div>
      <span class="eyebrow mt-1.5 max-w-full truncate" style="letter-spacing:.04em">${i.label}</span></div>`).join('')}</div>`;
}

function progressPage() {
  const p = ui.program, list = listFor(p), m = ui.metric, M = METRICS[m], nxt = nextWorkout(p);
  const groups = groupsFor(p);
  const items = groups.map((g, i) => ({
    key: g.key, value: sumMetric(g.ws, m),
    label: p === 'beginner' ? `W${i + 1}` : `M${g.ws[0].id.match(/m(\d)/)[1]}·W${g.ws[0].id.match(/w(\d)/)[1]}`
  }));
  const tile = (v, l) => `<div class="panel p-5"><div class="display text-4xl">${v}</div><p class="text-xs muted mt-1">${l}</p></div>`;
  const MG = ['PUSH', 'PULL', 'LEGS', 'CORE', 'MOBILITY'];
  const mgVals = MG.map(g => ({ g, v: sumMetric(list, m, g) })), mgMax = Math.max(1, ...mgVals.map(x => x.v));
  const skillLine = key => { const i = skillInfo(key); return `<div><p class="eyebrow">${i.def.name}</p><p class="text-sm mt-1">Stage ${i.stage + 1}/${i.def.stages.length}</p><p class="text-xs muted">${i.def.stages[i.stage].name}</p></div>`; };

  return `<header class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div><p class="eyebrow mb-2">The work is adding up</p><h1 class="display text-5xl">My progress</h1></div>${programToggle()}</header>

    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
      ${tile(doneSessions(list), 'Workouts completed')}${tile(sumMetric(list, 'sets'), 'Sets logged')}
      ${tile(sumMetric(list, 'reps'), 'Total reps')}${tile(METRICS.hold.fmt(sumMetric(list, 'hold')) || '0s', 'Total hold time')}
    </div>

    <section class="panel p-5 mb-6">
      <h3 class="display text-2xl mb-4">Overall progress</h3>
      <div class="grid gap-4 md:grid-cols-2 mb-5">
        ${progRow('Sessions completed', doneSessions(list), list.length, 'sessions')}
        ${progRow('Sets completed', sumMetric(list, 'sets'), plannedSets(list), 'sets')}
      </div>
      <div class="grid gap-4 md:grid-cols-2 pt-4 border-t" style="border-color:var(--line)">
        ${segmentsFor(p).map(s => progRow(s.label, doneSessions(s.ws), s.ws.length, 'sessions')).join('')}
      </div>
    </section>

    <section class="panel p-5 mb-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 class="display text-2xl">Training volume</h3>
        <div role="tablist" aria-label="Volume metric" class="inline-grid grid-cols-3 gap-1 p-1 rounded-xl" style="background:var(--panel2)">
          ${Object.entries(METRICS).map(([id, x]) => `<button role="tab" aria-selected="${m === id}" data-action="metric" data-m="${id}" class="min-h-[48px] px-4 rounded-lg text-sm font-semibold ${m === id ? 'accent-bg text-[#14210a]' : 'muted hover:text-white'}">${x.label}</button>`).join('')}
        </div>
      </div>
      <p class="eyebrow mb-2">${M.label} per ${p === 'beginner' ? 'week' : 'week (12 weeks)'}</p>
      ${labeledBars(items, M.fmt, nxt ? metaOf(nxt).key : null)}
      <p class="eyebrow mt-6 mb-3">${M.label} by muscle group</p>
      <div class="grid gap-3">${mgVals.map(x => `<div class="flex items-center gap-3"><span class="w-24 text-xs muted">${x.g[0] + x.g.slice(1).toLowerCase()}</span>
        <div class="flex-1 h-2.5 rounded-full" style="background:var(--line)"><div class="h-full rounded-full accent-bg" style="width:${(x.v / mgMax) * 100}%"></div></div>
        <span class="w-14 text-right text-xs">${M.fmt(x.v)}</span></div>`).join('')}</div>
    </section>

    <a href="#/skills" class="panel p-5 block hover:border-[var(--accent)] transition">
      <div class="flex items-center justify-between mb-3"><h3 class="display text-2xl">Skill trackers</h3><span class="text-xs accent inline-flex items-center gap-1">Open ${icon('arrow', 'w-3 h-3')}</span></div>
      <div class="grid gap-4 sm:grid-cols-3">${skillKeys.map(skillLine).join('')}</div>
    </a>`;
}

function handleMetricAction(a, b) {
  if (a !== 'metric') return false;
  ui.metric = b.dataset.m; render();
  return true;
}
