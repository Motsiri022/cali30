/* skills-analytics.test.js – ported from the earlier steps; runs the DESKTOP layout. */
const { boot, sleep, makeT } = require('./helpers');
const { t, done } = makeT();

(async () => {
  const A = boot('#/skills');
  t('skills page renders 3 trackers, no errors', A.errors.length === 0 && A.d.querySelectorAll('#app section.panel').length === 3 && /Handstand/.test(A.txt('#app')) && /L-Sit/.test(A.txt('#app')) && /Muscle-up/.test(A.txt('#app')));
  t('Skills is in nav (6 items, active on skills page)', A.d.querySelectorAll('#nav a').length === 6 && A.d.querySelector('#nav a[data-nav="skills"]').classList.contains('active'));
  t('stage counts: handstand 5, L-sit 4, muscle-up 6', A.ev('SKILLS.handstand.stages.length') === 5 && A.ev('SKILLS.lsit.stages.length') === 4 && A.ev('SKILLS.muscleup.stages.length') === 6);
  t('all skill-stage buttons are >= 48px class', [...A.d.querySelectorAll('[data-action^="skill-"]')].every(b => /min-h-\[48px\]|btn/.test(b.className)));
  t('draft defaults to stage goal (30s)', A.txt('#draft-handstand') === '30');

  // adjust + log
  A.act('skill-adj', '[data-skill="handstand"][data-d="-1"]'); A.act('skill-adj', '[data-skill="handstand"][data-d="-1"]');
  t('handstand stepper moves in 5s steps (30 -> 20)', A.txt('#draft-handstand') === '20');
  A.act('skill-log', '[data-skill="handstand"]');
  let s = A.saved().skills.handstand;
  t('log saved to LocalStorage with stage 0 and value 20', s.logs.length === 1 && s.logs[0].v === 20 && s.logs[0].s === 0);
  t('best shows 20s / goal 30s and 67%', /Best 20s \/ goal 30s/.test(A.txt('#app')) && /67%/.test(A.txt('#app')));
  t('goal not met: no Advance button yet', !A.d.querySelector('[data-action="skill-advance"]'));
  A.act('skill-adj', '[data-skill="handstand"][data-d="1"]'); A.act('skill-adj', '[data-skill="handstand"][data-d="1"]');
  A.act('skill-log', '[data-skill="handstand"]');
  t('log 30s reaches goal -> Advance button + toast', !!A.d.querySelector('[data-action="skill-advance"]') && /Goal reached/.test(A.txt('#toast')));
  A.act('skill-advance', '[data-skill="handstand"]');
  t('advance moves to stage 2 and persists', A.saved().skills.handstand.stage === 1 && /Stage 2 of 5/.test(A.txt('#app')));
  t('stage 1 shows a check (goal met) in ladder', /Chest-to-wall handstand/.test(A.txt('#app')) && A.d.querySelector('[data-skill="handstand"][data-i="0"] svg'));
  t('draft after stage change falls back to last log (30)', A.txt('#draft-handstand') === '30');

  // L-sit: step 1, stage select
  A.act('skill-adj', '[data-skill="lsit"][data-d="1"]');
  t('L-sit stepper steps by 1 (15 -> 16)', A.txt('#draft-lsit') === '16');
  A.act('skill-stage', '[data-skill="lsit"][data-i="2"]');
  t('tapping a stage makes it current (3 of 4)', A.saved().skills.lsit.stage === 2 && /Stage 3 of 4/.test(A.txt('#app')));
  A.act('skill-log', '[data-skill="lsit"]');
  t('log goes against the selected stage (s=2)', A.saved().skills.lsit.logs[0].s === 2);

  // muscle-up reps + delete
  A.act('skill-log', '[data-skill="muscleup"]');
  t('muscle-up logs reps (default goal 5)', A.saved().skills.muscleup.logs[0].v === 5 && /5 reps/.test(A.txt('#app')));
  A.act('skill-del', '[data-skill="muscleup"]');
  t('delete a log removes it', A.saved().skills.muscleup.logs.length === 0);
  A.act('skill-adj', '[data-skill="muscleup"][data-d="-1"]'); for (let i = 0; i < 6; i++) A.act('skill-adj', '[data-skill="muscleup"][data-d="-1"]');
  t('stepper clamps at 0 and log refuses 0', A.txt('#draft-muscleup') === '0' && (A.act('skill-log', '[data-skill="muscleup"]'), A.saved().skills.muscleup.logs.length === 0) && /above 0/.test(A.txt('#toast')));
  // final stage
  A.act('skill-stage', '[data-skill="muscleup"][data-i="5"]'); A.act('skill-adj', '[data-skill="muscleup"][data-d="1"]'); A.act('skill-log', '[data-skill="muscleup"]');
  t('final stage goal -> "Skill unlocked", no advance button', /Skill unlocked/.test(A.txt('#app')) && !A.d.querySelector('[data-action="skill-advance"][data-skill="muscleup"]'));
  // log cap
  for (let i = 0; i < 210; i++) A.ev('Store.addSkillLog("handstand",0,10)');
  t('logs capped at 200', A.ev('Store.skill("handstand").logs.length') === 200);

  // reload persistence
  const B = boot('#/skills', JSON.stringify(A.saved()));
  t('RELOAD restores stages and logs', B.errors.length === 0 && B.ev('Store.skill("lsit").stage') === 2 && B.ev('Store.skill("handstand").stage') === 1);
  // corrupted skills data
  for (const bad of [{ v: 1, program: 'beginner', sets: {}, skills: 'x' }, { v: 1, program: 'beginner', sets: {}, skills: { handstand: { stage: -4, logs: [null, { v: 'a' }, { t: 1, v: 5, s: 0 }] } } }, { v: 1, program: 'beginner', sets: {}, skills: { lsit: { stage: 99, logs: 'no' } } }]) {
    const C = boot('#/skills', JSON.stringify(bad));
    t('corrupt skills data handled: ' + JSON.stringify(bad.skills).slice(0, 40), C.errors.length === 0 && C.d.querySelectorAll('#app section.panel').length === 3);
  }
  // reset clears skills but keeps program
  A.go('#/settings'); A.act('reset');
  t('reset clears skill logs + stages', Object.keys(A.saved().skills).length === 0 && A.saved().program);

  // ---------- analytics ----------
  const D = boot('#/session/b-d1');
  let guard = 0; while (D.has('complete') && guard++ < 60) D.act('complete');
  D.go('#/progress');
  t('progress page renders, no errors', D.errors.length === 0 && /Overall progress/.test(D.txt('#app')) && /Training volume/.test(D.txt('#app')));
  const exp = { sets: D.ev('DAYS[0].exercises.reduce((n,e)=>n+e.sets,0)') };
  t('tiles: 1 workout, N sets logged match day 1 sets', new RegExp(`>1<`).test(D.d.querySelector('#app .grid').innerHTML) && D.d.querySelector('#app .grid').textContent.includes(String(exp.sets)));
  t('overall bars: sessions 1/30, sets match', /1\/30 sessions · 3%/.test(D.txt('#app')) && new RegExp(`${exp.sets}/\\d+ sets`).test(D.txt('#app')));
  t('segment rows: Week 1..4 with Week 1 = 1/7', /Week 1[\s\S]*1\/7 sessions · 14%/.test(D.txt('#app')) && /Week 4/.test(D.txt('#app')));
  const barsFor = () => [...D.d.querySelectorAll('#app section.panel:nth-of-type(2) .h-36 > div')].map(x => x.getAttribute('title'));
  t('volume chart: 4 weekly bars, W1 holds all sets', barsFor().length === 4 && barsFor()[0] === `W1: ${exp.sets}` && barsFor()[1] === 'W2: 0');
  D.act('metric', '[data-m="reps"]');
  const repsExpected = D.ev('DAYS[0].exercises.filter(e=>unitWord(e)==="reps").reduce((n,e)=>n+e.sets*e.target,0)');
  t('metric toggle -> reps shows rep volume', barsFor()[0] === `W1: ${repsExpected}` && D.ev('ui.metric') === 'reps');
  D.act('metric', '[data-m="hold"]');
  const holdExpected = D.ev('DAYS[0].exercises.filter(e=>unitWord(e)==="sec").reduce((n,e)=>n+e.sets*e.target,0)');
  t('metric toggle -> hold time (seconds) correct', holdExpected > 0 && barsFor()[0].startsWith('W1: ') && D.ev('sumMetric(DAYS,"hold")') === holdExpected);
  t('muscle-group bars sum to total sets', (D.act('metric', '[data-m="sets"]'), true) && D.ev('["PUSH","PULL","LEGS","CORE","MOBILITY","FULL"].reduce((n,g)=>n+sumMetric(DAYS,"sets",g),0)') === exp.sets);
  t('skills teaser on progress page', /Skill trackers/.test(D.txt('#app')) && /Stage 1\/5/.test(D.txt('#app')) && D.d.querySelector('a[href="#/skills"]'));
  D.act('set-program', '[data-p="roadmap"]');
  t('roadmap: 3 month rows + 12 weekly bars', /Month 1 · Foundation Strength/.test(D.txt('#app')) && D.d.querySelectorAll('#app .h-36 > div').length === 12 && D.errors.length === 0);

  done();
})().catch(e => { console.log('TEST CRASH:', e.stack.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
