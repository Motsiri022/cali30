/* DATA – every exercise, set, rep, hold and rest time for both programs.
   Edit workouts here. Shape of one workout: { id, program, title, subtitle, type, exercises:[{ id, name, unit, target, sets, rest, skill }] } */

/* ---------------------------- DATA ---------------------------- */
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pick = (v, w) => (Array.isArray(v) ? v[w] : v);
// Slot = one exercise with per-week progression. name/target/sets may be scalar or 4-item arrays (week 1..4)
const S = (name, unit, target, sets, rest, skill) => ({ name, unit, target, sets, rest, skill });
const expand = (slots, w) => slots.map(s => {
  const name = pick(s.name, w);
  return { id: slug(name), name, unit: s.unit, target: s.unit.startsWith('max') ? null : pick(s.target, w),
           sets: pick(s.sets, w), rest: s.rest, skill: s.skill || null };
});

/* ---- 30-Day Beginner Matrix ---- */
const BEGINNER = {
  sessions: [
    { title: 'Push', slots: [
      S(['Incline Push-Up','Incline Push-Up','Push-Up','Push-Up'], 'reps', [8,10,8,10], [3,3,3,4], 60),
      S('Pike Push-Up', 'reps', [5,6,8,10], 3, 60),
      S('Bench Dip', 'reps', [8,10,12,12], 3, 60),
      S('Plank', 'sec', [20,30,40,45], 3, 60),
      S('Scapular Push-Up', 'reps', [8,10,12,15], 2, 60)] },
    { title: 'Pull', slots: [
      S(['Inverted Row (Knees Bent)','Inverted Row (Knees Bent)','Inverted Row','Inverted Row'], 'reps', [6,8,8,10], [3,3,4,4], 60),
      S('Negative Pull-Up', 'reps', [2,3,3,4], 3, 90),
      S('Superman Hold', 'sec', [15,20,25,30], 3, 60),
      S('Reverse Snow Angel', 'reps', [10,12,15,15], 3, 60),
      S('Hollow Body Hold', 'sec', [10,15,20,25], 3, 60)] },
    { title: 'Legs + Core', slots: [
      S('Bodyweight Squat', 'reps', [12,15,15,20], 3, 60),
      S('Reverse Lunge (per leg)', 'reps', [6,8,10,12], 3, 60),
      S('Glute Bridge', 'reps', [12,15,15,20], 3, 60),
      S('Calf Raise', 'reps', [15,20,25,30], 3, 60),
      S('Dead Bug', 'reps', [8,10,12,14], 3, 60)] }
  ],
  recovery: [
    S('Cat-Cow', 'reps', 10, 2, 30), S('Child\u2019s Pose Hold', 'sec', 30, 2, 30),
    S('Hip Flexor Stretch (per side)', 'sec', 30, 2, 30), S('Thread the Needle (per side)', 'reps', 8, 2, 30)],
  benchmark: [
    S('Max Push-Ups', 'max_reps', null, 1, 90), S('Max Inverted Rows', 'max_reps', null, 1, 90),
    S('Max Bodyweight Squats', 'max_reps', null, 1, 90), S('Max Plank Hold', 'max_sec', null, 1, 90)]
};
const REST_DAYS = [7, 14, 21, 28];

function buildBeginner() {
  let t = 0;
  return Array.from({ length: 30 }, (_, i) => {
    const n = i + 1, w = Math.min(Math.floor(i / 7), 3);
    const base = { id: `b-d${n}`, program: 'beginner', day: n, week: w + 1, subtitle: `Day ${n} · Week ${w + 1}` };
    if (n === 30) return { ...base, type: 'test', title: 'Benchmark Test', exercises: expand(BEGINNER.benchmark, w) };
    if (REST_DAYS.includes(n)) return { ...base, type: 'rest', title: 'Active Recovery', exercises: expand(BEGINNER.recovery, w) };
    const s = BEGINNER.sessions[t++ % 3];
    return { ...base, type: 'train', title: s.title, exercises: expand(s.slots, w) };
  });
}

/* ---- 3-Month Skill Roadmap: 3 months x 4 weeks x 3 blocks (Handstand+Push / Pull+Muscle-up / L-Sit+Legs) ---- */
const ROADMAP = [
  { id: 1, name: 'Foundation Strength', blurb: 'Build the strength base for every skill.', blocks: [
    { title: 'Handstand + Push', slots: [
      S(['Wall Plank Hold','Wall Plank Hold','Chest-to-Wall Handstand Hold','Chest-to-Wall Handstand Hold'], 'sec', [20,30,10,15], 4, 60, 'handstand'),
      S('Pike Push-Up', 'reps', [6,8,8,10], 3, 60),
      S('Push-Up', 'reps', [8,10,12,15], 3, 60),
      S('Scapular Push-Up', 'reps', [10,12,12,15], 2, 60)] },
    { title: 'Pull + Muscle-Up Prep', slots: [
      S('Negative Pull-Up', 'reps', [3,4,5,6], 4, 90, 'muscleup'),
      S('Inverted Row', 'reps', [8,10,10,12], 3, 60),
      S('Dead Hang', 'sec', [20,30,40,45], 3, 60),
      S('Hollow Body Hold', 'sec', [15,20,25,30], 3, 60)] },
    { title: 'L-Sit + Legs', slots: [
      S('Tuck Hold (L-Sit Prep)', 'sec', [8,10,12,15], 4, 60, 'lsit'),
      S('Reverse Lunge (per leg)', 'reps', [8,10,12,12], 3, 60),
      S(['Glute Bridge','Glute Bridge','Single-Leg Glute Bridge','Single-Leg Glute Bridge'], 'reps', [12,15,8,10], 3, 60),
      S(['Bent-Knee Leg Raise','Bent-Knee Leg Raise','Lying Leg Raise','Lying Leg Raise'], 'reps', [8,10,8,10], 3, 60)] }
  ]},
  { id: 2, name: 'Skill Development', blurb: 'Handstand, L-sit and muscle-up progressions begin.', blocks: [
    { title: 'Handstand + Push', slots: [
      S(['Chest-to-Wall Handstand Hold','Chest-to-Wall Handstand Hold','Back-to-Wall Handstand Hold','Back-to-Wall Handstand Hold'], 'sec', [25,35,20,30], 4, 60, 'handstand'),
      S(['Pike Push-Up','Pike Push-Up','Elevated Pike Push-Up','Elevated Pike Push-Up'], 'reps', [5,6,8,8], 4, 75),
      S('Diamond Push-Up', 'reps', [6,8,8,10], 3, 60),
      S('Wall Walk', 'reps', [3,4,5,6], 3, 60)] },
    { title: 'Pull + Muscle-Up', slots: [
      S(['Negative Pull-Up','Negative Pull-Up','Pull-Up','Explosive Pull-Up'], 'reps', [5,6,3,3], 4, 90, 'muscleup'),
      S('Dip (Bars or Chairs)', 'reps', [6,8,8,10], 3, 75),
      S('Muscle-Up Transition Drill', 'reps', [3,4,5,6], 3, 90, 'muscleup'),
      S('Hollow Body Hold', 'sec', [20,25,30,35], 3, 60)] },
    { title: 'L-Sit + Legs', slots: [
      S(['Tucked L-Sit','Tucked L-Sit','One-Leg L-Sit','One-Leg L-Sit'], 'sec', [10,15,8,10], 4, 60, 'lsit'),
      S('Bulgarian Split Squat (per leg)', 'reps', [6,8,8,10], 3, 75),
      S(['Tuck-Up','Tuck-Up','V-Up','V-Up'], 'reps', [8,10,8,10], 3, 60),
      S('Single-Leg Calf Raise', 'reps', [10,12,15,18], 3, 60)] }
  ]},
  { id: 3, name: 'Advanced Skills', blurb: 'Link skills together and test new benchmarks.', blocks: [
    { title: 'Handstand + Push', slots: [
      S(['Back-to-Wall Handstand Hold','Back-to-Wall Handstand Hold','Freestanding Handstand Attempts','Freestanding Handstand Attempts'], 'sec', [40,50,10,15], 5, 60, 'handstand'),
      S(['Elevated Pike Push-Up','Elevated Pike Push-Up','Wall Handstand Push-Up (Negative)','Wall Handstand Push-Up (Negative)'], 'reps', [8,10,3,4], 4, 90),
      S('Archer Push-Up', 'reps', [4,5,6,8], 3, 75),
      S('Pseudo-Planche Lean Hold', 'sec', [15,20,25,30], 3, 60)] },
    { title: 'Pull + Muscle-Up', slots: [
      S(['High Pull-Up','High Pull-Up','Negative Muscle-Up','Negative Muscle-Up'], 'reps', [4,5,3,4], 5, 90, 'muscleup'),
      S('Muscle-Up Transition Drill', 'reps', [5,6,6,8], 3, 90, 'muscleup'),
      S('Dip', 'reps', [8,10,10,12], 3, 75),
      S('Tuck Front Lever Hold', 'sec', [5,6,8,10], 3, 75)] },
    { title: 'L-Sit + Legs', slots: [
      S(['One-Leg L-Sit','L-Sit','L-Sit','L-Sit'], 'sec', [15,8,12,15], 4, 60, 'lsit'),
      S(['Assisted Shrimp Squat','Shrimp Squat','Shrimp Squat','Shrimp Squat'], 'reps', [4,3,4,5], 3, 90),
      S('V-Up', 'reps', [10,12,12,15], 3, 60),
      S('Hollow Body Hold', 'sec', [30,40,45,60], 3, 60)] }
  ]}
];
const WEEK_THEMES = ['Establish', 'Build', 'Intensify', 'Test & Consolidate'];

function buildRoadmap() {
  return ROADMAP.map(m => ({
    id: m.id, name: m.name, blurb: m.blurb,
    weeks: WEEK_THEMES.map((theme, w) => ({
      week: w + 1, theme,
      blocks: m.blocks.map((b, k) => ({
        id: `r-m${m.id}-w${w + 1}-b${k + 1}`, program: 'roadmap', type: 'block',
        title: b.title, subtitle: `Month ${m.id} · Week ${w + 1} · ${theme}`,
        exercises: expand(b.slots, w)
      }))
    }))
  }));
}

const DAYS = buildBeginner();
const MONTHS = buildRoadmap();
const WORKOUTS = new Map();
DAYS.forEach(d => WORKOUTS.set(d.id, d));
MONTHS.forEach(m => m.weeks.forEach(wk => wk.blocks.forEach(b => WORKOUTS.set(b.id, b))));
const monthBlocks = m => m.weeks.flatMap(wk => wk.blocks);
