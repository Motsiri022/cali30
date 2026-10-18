/* UTILS – formatting helpers, exercise grouping/media/cues, derived stats */

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const fmtClock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
const listFor = p => (p === 'beginner' ? DAYS : MONTHS.flatMap(monthBlocks));
const nextWorkout = p => listFor(p).find(w => Store.status(w) !== 'completed') || null;
const pctOf = w => { const p = Store.progress(w); return p.total ? Math.round((p.done / p.total) * 100) : 0; };
const levelOf = w => (w.program === 'beginner' ? 'Beginner' : 'Advanced');
const metaOf = w => {
  if (w.program === 'beginner') return { month: 0, week: w.week, key: `w${w.week}` };
  const m = w.id.match(/^r-m(\d)-w(\d)-b(\d)$/);
  return { month: +m[1], week: +m[2], key: `m${m[1]}w${m[2]}` };
};
const position = w => (w.program === 'beginner' ? `Week ${pad(w.week)} / Day ${pad(w.day)}` : `Month ${metaOf(w).month} / Week ${metaOf(w).week}`);
const estMin = w => Math.max(5, Math.round(3 + w.exercises.reduce((t, ex) =>
  t + ex.sets * ((ex.unit === 'sec' ? ex.target : ex.unit === 'reps' ? (ex.target || 0) * 3 : 45) + ex.rest), 0) / 60));
const targetText = ex => ex.target === null ? `1 set × max ${ex.unit === 'max_sec' ? 'hold' : 'reps'}` : `${ex.sets} sets × ${ex.target} ${ex.unit === 'sec' ? 'sec' : 'reps'}`;
const unitWord = ex => (ex.unit === 'sec' || ex.unit === 'max_sec' ? 'sec' : 'reps');
const setsDone = ws => ws.reduce((n, w) => n + Store.progress(w).done, 0);
const weekTitle = w => (w.type === 'rest' ? 'Active recovery' : w.type === 'test' ? 'Benchmark test' : w.title);

/* ---------- exercise grouping, media placeholders, cues ---------- */
const groupOf = (ex, w) =>
  /plank|hollow|dead bug|l-sit|leg raise|v-up|tuck-up|tuck hold|reverse crunch|body saw/i.test(ex.name) ? 'CORE'
  : /squat|lunge|bridge|calf|shrimp|pistol|step-up/i.test(ex.name) ? 'LEGS'
  : /row|pull|hang|superman|snow angel|lever|muscle-up|curl/i.test(ex.name) ? 'PULL'
  : /push|dip|planche|handstand|pike|scapular|wall walk/i.test(ex.name) ? 'PUSH'
  : (w && w.type === 'rest') ? 'MOBILITY' : 'FULL';
const GROUP_LABEL = { PUSH: 'Chest · Shoulders · Triceps', PULL: 'Back · Biceps', LEGS: 'Quads · Glutes', CORE: 'Core · Stability', MOBILITY: 'Mobility', FULL: 'Full body' };
const HUES = { PUSH: 200, PULL: 165, LEGS: 110, CORE: 80, MOBILITY: 260, FULL: 190 };
const CUES = {
  PUSH: [['Stack your wrists', 'Hands under shoulders, ribs down, glutes tight.'], ['Lower with control', 'Elbows about 45° from your body, chest toward the floor.'], ['Press the floor away', 'Finish each rep with full lockout, no shrugging.']],
  PULL: [['Set your shoulder blades', 'Pull them down and back before you bend your arms.'], ['Lead with the elbows', 'Drive elbows toward your hips, chest to your hands.'], ['Lower slowly', 'Take 2–3 seconds to return to the start.']],
  LEGS: [['Find your stance', 'Feet shoulder-width apart, toes slightly turned out.'], ['Sit back and down', 'Keep your chest up and knees tracking over your toes.'], ['Drive through heels', 'Stand tall and squeeze your glutes at the top.']],
  CORE: [['Brace first', 'Ribs down, lower back gently pressed toward the floor.'], ['Breathe steadily', 'Exhale on effort and never hold your breath.'], ['Quality over time', 'End the set when your form starts to break.']],
  MOBILITY: [['Move slowly', 'Ease into each position with no bouncing.'], ['Breathe deep', 'Long exhales help the muscle release.'], ['Stay pain-free', 'You should feel mild tension, never sharp pain.']],
  FULL: [['Warm up first', 'Move your joints through easy ranges before you start.'], ['Control the tempo', 'Smooth reps beat fast, sloppy ones.'], ['Rest fully', 'Use the full rest so every set stays strong.']]
};
// Optional: drop in your own photos, e.g. PHOTOS['push-up'] = 'img/push-up.jpg'
const PHOTOS = {};
function mediaHTML(ex, w, cls = '') {
  const g = groupOf(ex, w), h = HUES[g], img = safeImg(PHOTOS[ex.id]);   // only local img/ files are ever used
  const style = img ? `background:url('${img}') center/cover` : `background:linear-gradient(135deg,hsl(${h} 42% 30%),hsl(${h} 34% 9%))`;
  const large = /\bh-(44|56|60|80)\b|h-\[(1[5-9]\d|2\d\d)px\]|absolute inset-0/.test(cls);   // watermark scales with the picture
  return `<div class="relative overflow-hidden ${cls}" style="${style}">${img ? '' :
    `<span class="display absolute ${large ? '-right-3 -bottom-6 text-[7rem] opacity-[.13]' : '-right-1 -bottom-2 text-[3.4rem] opacity-[.16]'} leading-none select-none" aria-hidden="true">${g}</span>`}</div>`;
}

/* ---------- derived stats ---------- */
function streakOf(list) {
  let last = -1; list.forEach((w, i) => { if (Store.status(w) === 'completed') last = i; });
  let n = 0; for (let i = last; i >= 0 && Store.status(list[i]) === 'completed'; i--) n++;
  return n;
}
function groupsFor(p) {
  const list = listFor(p), map = new Map();
  list.forEach(w => { const k = metaOf(w).key; if (!map.has(k)) map.set(k, []); map.get(k).push(w); });
  return [...map.entries()].map(([key, ws]) => ({ key, ws, sets: setsDone(ws) }));
}
function weekStrip(p, w) {
  if (p === 'beginner') { const start = Math.min(7 * Math.floor((w.day - 1) / 7) + 1, 24); return DAYS.slice(start - 1, start + 6); }
  return listFor(p).filter(x => metaOf(x).key === metaOf(w).key);
}


/* ---------- exercise index, progressions and copy used by the exercise screens ---------- */
const EXERCISES = new Map();                      // exerciseId -> { id, name, unit, sample, w, workouts:[ids], level, skill }
WORKOUTS.forEach(w => w.exercises.forEach(ex => {
  let e = EXERCISES.get(ex.id);
  if (!e) { e = { id: ex.id, name: ex.name, unit: ex.unit, sample: ex, w, workouts: [], level: 'Advanced', skill: ex.skill }; EXERCISES.set(ex.id, e); }
  e.workouts.push(w.id);
  if (w.program === 'beginner') e.level = 'Beginner';
}));

/* Easier / harder variations come from the progression ladders already in data.js (never invented) */
const LADDERS = [];
const addLadder = names => { const ids = [...new Set(names.map(slug))]; if (ids.length > 1) LADDERS.push(ids); };
BEGINNER.sessions.forEach(s => s.slots.forEach(sl => Array.isArray(sl.name) && addLadder(sl.name)));
ROADMAP.forEach(m => m.blocks.forEach(b => b.slots.forEach(sl => Array.isArray(sl.name) && addLadder(sl.name))));
function variationsFor(id) {
  const L = LADDERS.find(l => l.includes(id));
  if (!L) return { easier: null, harder: null };
  const i = L.indexOf(id);
  return { easier: L[i - 1] || null, harder: L[i + 1] || null };
}

const REGION = { PUSH: 'Upper body', PULL: 'Upper body', LEGS: 'Lower body', CORE: 'Core', MOBILITY: 'Mobility', FULL: 'Full body' };
const DESCRIPTIONS = {
  PUSH: 'A pressing movement that builds the chest, shoulders and triceps. Keep your body in one line and press with control.',
  PULL: 'A pulling movement that builds the back and biceps. Start with the shoulder blades, then bend the arms.',
  LEGS: 'A foundational movement for strong legs and everyday strength. Move slowly, stay balanced, and make every rep count.',
  CORE: 'A trunk-stability movement. Brace, breathe, and keep quality high for the whole set.',
  MOBILITY: 'A gentle movement that restores range and helps you recover. Go slowly and breathe.',
  FULL: 'A full-body movement. Keep a steady rhythm and good form from the first rep to the last.'
};
const TIPS = {
  PUSH: ['Keep your body in one line', 'Avoid sagging hips or flared elbows. Raise your hands if you lose form.'],
  PULL: ['Pull with your back', 'Avoid swinging. Reduce the range or slow down if you lose control.'],
  LEGS: ['Keep your heels grounded', 'Avoid knees caving inward. Reduce depth if you lose control.'],
  CORE: ['Protect your lower back', 'Keep your ribs down and end the set when your back starts to arch.'],
  MOBILITY: ['Never force a stretch', 'Mild tension is fine. Sharp pain means ease off.'],
  FULL: ['Warm up first', 'Take 3–5 minutes of easy movement before you start.']
};
function equipmentOf(name) {                      // honest about what an exercise needs
  if (/pull-up|muscle-up|dead hang|flexed-arm|front lever|scapular pull|chin-up/i.test(name)) return 'Pull-up bar';
  if (/inverted row/i.test(name)) return 'Sturdy table';
  if (/dip|bench|step-up|box/i.test(name)) return 'Chair or bench';
  return 'No equipment';
}
const programName = p => (p === 'beginner' ? '30-Day Beginner Matrix' : '3-Month Skill Roadmap');
const kindOf = w => (w.type === 'rest' ? 'Mobility' : w.type === 'test' ? 'Benchmark' : 'Strength');
