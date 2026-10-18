/* SKILLS – dedicated trackers for Handstand, L-Sit and Muscle-up progressions.
   Each skill has ordered stages with a goal. Log a hold (seconds) or reps against the current stage;
   when your best at that stage reaches the goal, you can advance to the next stage. */

const SKILLS = {
  handstand: { name: 'Handstand', unit: 'sec', step: 5, verb: 'Log hold', stages: [
    { name: 'Wall plank hold', goal: 30 }, { name: 'Chest-to-wall handstand', goal: 30 },
    { name: 'Back-to-wall handstand', goal: 30 }, { name: 'Freestanding attempts', goal: 10 }, { name: 'Freestanding handstand', goal: 30 }] },
  lsit: { name: 'L-Sit', unit: 'sec', step: 1, verb: 'Log hold', stages: [
    { name: 'Tuck hold (L-sit prep)', goal: 15 }, { name: 'Tucked L-sit', goal: 15 },
    { name: 'One-leg L-sit', goal: 12 }, { name: 'Full L-sit', goal: 15 }] },
  muscleup: { name: 'Muscle-up', unit: 'reps', step: 1, verb: 'Log reps', stages: [
    { name: 'Negative pull-up', goal: 5 }, { name: 'Pull-up', goal: 5 }, { name: 'High pull-up', goal: 5 },
    { name: 'Transition drill', goal: 5 }, { name: 'Negative muscle-up', goal: 3 }, { name: 'Muscle-up', goal: 3 }] }
};
const skillKeys = Object.keys(SKILLS);
const fmtVal = (def, v) => (def.unit === 'sec' ? `${v}s` : `${v} rep${v === 1 ? '' : 's'}`);

function skillInfo(key) {
  const def = SKILLS[key], raw = Store.skill(key), logs = raw.logs;
  const stage = Math.min(raw.stage, def.stages.length - 1);
  const best = def.stages.map((_, i) => logs.filter(l => l.s === i).reduce((m, l) => Math.max(m, l.v), 0));
  return { def, stage, logs, best, goalMet: best[stage] >= def.stages[stage].goal, total: logs.reduce((n, l) => n + l.v, 0) };
}
function workoutSkillStats(key) {                       // sets of this skill done inside scheduled workouts
  let sets = 0, total = 0;
  WORKOUTS.forEach(w => w.exercises.forEach(ex => {
    if (ex.skill !== key) return;
    Store.getSets(w, ex).forEach(v => { if (v !== null) { sets++; total += v; } });
  }));
  return { sets, total };
}
function skillDraft(key, info) {
  if (ui.skillDraft[key] != null) return ui.skillDraft[key];
  const last = info.logs[info.logs.length - 1];
  return last ? last.v : info.def.stages[info.stage].goal;
}

function skillCard(key) {
  const info = skillInfo(key), { def, stage, logs, best, goalMet } = info;
  const cur = def.stages[stage], draft = skillDraft(key, info), isLast = stage === def.stages.length - 1;
  const pct = Math.min(100, Math.round((best[stage] / cur.goal) * 100)), wk = workoutSkillStats(key);
  const rows = def.stages.map((st, i) => {
    const done = best[i] >= st.goal, isCur = i === stage;
    return `<button data-action="skill-stage" data-skill="${key}" data-i="${i}" aria-pressed="${isCur}" aria-label="Stage ${i + 1}: ${st.name}"
      class="w-full min-h-[48px] flex items-center gap-3 px-3 py-2 rounded-xl border text-left ${isCur ? 'card-next' : ''}" style="${isCur ? '' : 'border-color:var(--line)'}">
      <span class="w-6 text-center ${done ? 'accent' : 'muted'}">${done ? icon('check', 'w-5 h-5 mx-auto') : `<span class="display text-lg">${i + 1}</span>`}</span>
      <span class="flex-1 min-w-0"><span class="block text-sm truncate">${st.name}</span>
        <span class="block text-[11px] muted">Goal ${fmtVal(def, st.goal)} · Best ${best[i] ? fmtVal(def, best[i]) : '–'}</span></span></button>`;
  }).join('');
  const recent = logs.map((l, i) => ({ l, i })).slice(-5).reverse().map(({ l, i }) => `
    <li class="flex items-center justify-between text-xs min-h-[48px] border-b" style="border-color:var(--line)">
      <span><span class="muted">${new Date(l.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> · ${def.stages[Math.min(l.s, def.stages.length - 1)].name}</span>
      <span class="flex items-center gap-1"><strong>${fmtVal(def, l.v)}</strong>
        <button data-action="skill-del" data-skill="${key}" data-i="${i}" aria-label="Delete this log" class="min-h-[48px] min-w-[48px] muted hover:text-red-300">✕</button></span></li>`).join('');
  const spark = logs.slice(-12), smax = Math.max(1, ...spark.map(l => l.v));

  return `<section class="panel p-5 flex flex-col gap-4">
    <div><p class="eyebrow accent">Stage ${stage + 1} of ${def.stages.length}</p>
      <h2 class="display text-3xl">${def.name}</h2><p class="text-sm muted">${cur.name}</p></div>

    <div><div class="flex justify-between text-xs mb-1.5"><span>Best ${best[stage] ? fmtVal(def, best[stage]) : '–'} / goal ${fmtVal(def, cur.goal)}</span><span class="${goalMet ? 'accent' : 'muted'}">${pct}%</span></div>
      <div class="h-2 rounded-full" style="background:var(--line)"><div class="h-full rounded-full accent-bg" style="width:${pct}%"></div></div>
      ${goalMet ? (isLast
        ? `<p class="text-xs accent mt-2">Final stage goal reached. Skill unlocked!</p>`
        : `<button data-action="skill-advance" data-skill="${key}" class="btn btn-primary w-full mt-3">Goal reached · Advance to stage ${stage + 2}</button>`) : ''}</div>

    <div class="rounded-xl p-3" style="background:var(--panel2)">
      <p class="eyebrow mb-2">${def.verb} for this stage</p>
      <div class="flex items-center gap-2">
        <button data-action="skill-adj" data-skill="${key}" data-d="-1" aria-label="Decrease" class="btn btn-ghost !px-0 w-12 text-xl">−</button>
        <div class="flex-1 text-center"><span id="draft-${key}" class="display text-4xl">${draft}</span> <span class="text-xs muted">${def.unit}</span></div>
        <button data-action="skill-adj" data-skill="${key}" data-d="1" aria-label="Increase" class="btn btn-ghost !px-0 w-12 text-xl">+</button>
      </div>
      <button data-action="skill-log" data-skill="${key}" class="btn btn-primary w-full mt-3">${icon('check', 'w-4 h-4')} ${def.verb}</button>
    </div>

    <div class="grid grid-cols-3 gap-2 text-center">
      <div><div class="display text-2xl">${logs.length}</div><p class="text-[11px] muted">Logs</p></div>
      <div><div class="display text-2xl">${info.total}</div><p class="text-[11px] muted">Total ${def.unit}</p></div>
      <div><div class="display text-2xl">${wk.sets}</div><p class="text-[11px] muted">Workout sets</p></div>
    </div>

    ${spark.length ? `<div><p class="eyebrow mb-2">Last ${spark.length} logs</p><div class="flex items-end gap-1 h-12" aria-hidden="true">${spark.map(l =>
      `<div class="flex-1 rounded-sm" title="${fmtVal(def, l.v)}" style="height:${Math.max(8, (l.v / smax) * 100)}%;background:color-mix(in srgb,var(--accent) 55%,var(--panel2))"></div>`).join('')}</div></div>` : ''}

    <div><p class="eyebrow mb-2">Progression</p><div class="flex flex-col gap-1.5">${rows}</div></div>
    ${recent ? `<div><p class="eyebrow mb-1">Recent logs</p><ul>${recent}</ul></div>` : ''}
  </section>`;
}

function skillsPage() {
  return `<header class="mb-6"><p class="eyebrow mb-2">Earn it, stage by stage</p><h1 class="display text-5xl">Skill trackers</h1>
      <p class="text-sm muted mt-2 max-w-xl">Log your best holds and reps for each skill. When your best at the current stage hits its goal, move up. “Workout sets” counts sets of that skill done inside your scheduled sessions.</p></header>
    <div class="grid gap-4 lg:grid-cols-3 items-start">${skillKeys.map(skillCard).join('')}</div>`;
}

function handleSkillAction(a, b) {
  if (!a.startsWith('skill-')) return false;
  const key = b.dataset.skill, def = SKILLS[key];
  if (!def) return true;
  const info = skillInfo(key);
  if (a === 'skill-stage') { Store.setSkillStage(key, +b.dataset.i); delete ui.skillDraft[key]; }
  else if (a === 'skill-advance') { Store.setSkillStage(key, Math.min(info.stage + 1, def.stages.length - 1)); delete ui.skillDraft[key]; toast(`Stage up! Now: ${def.stages[Math.min(info.stage + 1, def.stages.length - 1)].name}`); }
  else if (a === 'skill-adj') ui.skillDraft[key] = Math.max(0, Math.min(999, skillDraft(key, info) + (+b.dataset.d) * def.step));
  else if (a === 'skill-log') {
    const v = skillDraft(key, info);
    if (v <= 0) { toast('Enter a value above 0 first.'); return true; }
    const prev = info.best[info.stage];
    Store.addSkillLog(key, info.stage, v);
    const goal = def.stages[info.stage].goal;
    toast(v >= goal && prev < goal ? 'Goal reached! You can advance a stage.' : v > prev ? `New best: ${fmtVal(def, v)}` : `Logged ${fmtVal(def, v)}`);
  }
  else if (a === 'skill-del') Store.removeSkillLog(key, +b.dataset.i);
  render();
  return true;
}
