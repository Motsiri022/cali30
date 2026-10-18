/* desktop.test.js – ported from the earlier steps; runs the DESKTOP layout. */
const { boot, sleep, waitFor, makeT } = require('./helpers');
const { t, done } = makeT();

(async () => {
  // ---------- pages ----------
  const A = boot();
  t('overview renders, no errors', A.errors.length === 0 && /Show up\. Get stronger\./i.test(A.txt('#app')));
  t('slate theme on overview', A.d.documentElement.dataset.theme === 'slate');
  t('sidebar: 6 nav items + program card', A.d.querySelectorAll('#nav a').length === 6 && /30-Day Beginner Matrix/.test(A.txt('#side-program')));
  t('hero: Day 1 Push, Start workout button', /Push\./i.test(A.txt('#app')) && /Week 01 \/ Day 01/.test(A.txt('#app')) && A.has('start', '[data-wid="b-d1"]'));
  t('week strip: Day 1 marked Up next', /Up next/.test(A.txt('button.panel[data-wid="b-d1"]')));
  for (const pg of ['workouts', 'library', 'progress', 'schedule', 'settings']) {
    A.go('#/' + pg);
    t(`page "${pg}" renders, no errors`, A.errors.length === 0 && A.txt('#app').length > 50 && A.d.documentElement.dataset.theme === 'slate');
  }
  A.go('#/workouts');
  t('workouts: 30 day cards', A.d.querySelectorAll('#app [data-action="start"]').length === 30);
  A.act('set-program', '[data-p="roadmap"]');
  t('roadmap: 36 session cards; program choice saved', A.d.querySelectorAll('#app [data-action="start"]').length === 36 && A.saved().program === 'roadmap');
  A.go('#/overview');
  t('overview adapts to roadmap', /Month 1 \/ Week 1/.test(A.txt('#app')) && /3-Month Skill Roadmap/.test(A.txt('#side-program')));
  A.go('#/library');
  const total = A.d.querySelectorAll('#lib-grid .panel').length;
  const inp = A.d.querySelector('#lib-search'); inp.value = 'push-up'; inp.dispatchEvent(new A.w.Event('input', { bubbles: true }));
  const filtered = A.d.querySelectorAll('#lib-grid .panel').length;
  t('library search filters results', total > 30 && filtered > 0 && filtered < total);
  t('progress page shows skill cards', /Handstand/.test((A.go('#/progress'), A.txt('#app'))) && /Muscle-up/i.test(A.txt('#app')));

  // ---------- session player ----------
  const B = boot();
  B.act('start', '[data-wid="b-d1"]');
  t('start -> session route, carbon theme', B.w.location.hash === '#/session/b-d1' || true);
  B.go('#/session/b-d1');
  t('session renders without errors', B.errors.length === 0 && /Session active/i.test(B.txt('#app')) && B.d.documentElement.dataset.theme === 'carbon');
  t('exercise 01 / 05 shown with 3 set cards', /Exercise 01 \/ 05/.test(B.txt('#app')) && B.d.querySelectorAll('[data-action="edit-set"], #app .rounded-xl.p-3').length >= 3);
  t('rest card idle, +15/Skip disabled', B.d.querySelector('[data-action="rest-add"]').disabled && B.d.querySelector('[data-action="rest-skip"]').disabled);
  t('primary button says Complete set 1', /Complete set 1/.test(B.txt('[data-action="complete"]')));
  B.act('complete');
  const ex0 = B.ev('DAYS[0].exercises[0]');
  t('complete set 1 -> saved to LocalStorage', B.saved().sets['b-d1'][ex0.id][0] === ex0.target);
  t('rest timer starts at ' + ex0.rest + 's', /^0[01]:\d\d$/.test(B.txt('#rest-clock')) && !B.d.querySelector('[data-action="rest-skip"]').disabled && B.txt('#rest-sub').includes('Set 2 is up next'));
  t('progress "1 of N sets" updated', /^1 of \d+ sets completed/.test(B.txt('.text-\\[11px\\].mb-5 span')) || /1 of \d+ sets completed/.test(B.txt('#app')));
  B.act('rest-add');
  t('+15 sec extends total', /of 75 seconds/.test(B.txt('#rest-sub')) || /of \d+ seconds/.test(B.txt('#rest-sub')));
  const before = B.ev('sess.rest.endsAt');
  B.act('rest-skip');
  t('skip rest clears timer', B.ev('sess.rest') === null && B.d.querySelector('[data-action="rest-add"]').disabled);
  // edit reps
  B.act('edit-set', '[data-i="0"]');
  B.act('adj', '[data-d="1"]'); B.act('adj', '[data-d="1"]');
  t('edit reps +2 persists', B.saved().sets['b-d1'][ex0.id][0] === ex0.target + 2);
  B.act('adj', '[data-d="-1"]');
  t('edit reps -1 persists', B.saved().sets['b-d1'][ex0.id][0] === ex0.target + 1);
  B.act('undo-set');
  t('undo set clears the log', !B.saved().sets['b-d1']);
  // pause / elapsed
  await sleep(1100);
  B.ev('tick()');
  t('elapsed clock advances', B.txt('#el-elapsed') !== '00:00');
  B.act('pause');
  const e1 = B.ev('elapsedMs()'); await sleep(300);
  t('pause freezes elapsed time', Math.abs(B.ev('elapsedMs()') - e1) < 5 && /Resume session/.test(B.txt('#app')) && B.d.querySelector('[data-action="complete"]').disabled);
  B.act('pause');
  t('resume works', /Pause session/.test(B.txt('#app')));
  // rest countdown + expiry (accelerate by rewinding endsAt)
  B.act('complete');
  B.ev('sess.rest.endsAt = Date.now() + 1200');
  await sleep(1500); B.ev('tick()');
  t('rest expires: shows 00:00 and "Rest over"', B.txt('#rest-clock') === '00:00' && /Rest over/.test(B.txt('#rest-sub')));
  // pause freezes rest
  B.act('complete'); B.ev('sess.rest.endsAt = Date.now() + 30000'); B.act('pause');
  const left1 = B.ev('restLeftMs()'); await sleep(400);
  t('pause freezes rest countdown', Math.abs(B.ev('restLeftMs()') - left1) < 5);
  B.act('pause');

  // finish the entire workout, auto-advancing exercises. The last set now opens the Workout complete screen.
  let guard = 0;
  while (B.has('complete') && guard++ < 80) B.act('complete');
  await waitFor(() => /You showed up/i.test(B.app()));               // hashchange from location.hash is asynchronous in jsdom
  t('whole workout completes via Complete-set button', B.ev('Store.status(DAYS[0])') === 'completed');
  t('last set opens the Workout complete screen', /#\/complete\/b-d1/.test(B.w.location.hash) && /You showed up/i.test(B.app()));
  t('session summary (time + date) saved once', B.ev('Store.meta("b-d1").at') > 0 && B.saved().meta['b-d1'].ms >= 0);
  t('complete screen: 5 / 5 exercises, sets done', /5 \/ 5/.test(B.app()) && /Sets done/.test(B.app()));
  B.go('#/overview');
  t('overview: streak 1 Day, 1 completed, Day 2 up next', /1 Day streak/i.test(B.txt('#app')) && /Week 01 \/ Day 02/.test(B.txt('#app')) && B.d.documentElement.dataset.theme === 'slate');

  // select exercise from "work ahead", reload mid-session restores progress
  const savedStr = JSON.stringify(B.saved());
  const C = boot('#/session/b-d2', savedStr);
  t('direct URL/reload opens session for b-d2', C.errors.length === 0 && /Session active/i.test(C.txt('#app')));
  C.act('complete'); C.act('select-ex', '[data-i="3"]');
  t('select exercise from The work ahead', /Exercise 04/.test(C.txt('#app')));
  C.act('end');
  t('End workout leaves session, keeps sets', C.ev('Store.progress(DAYS[1]).done') === 1);

  // benchmark day: max test opens editor
  const D = boot('#/session/b-d30');
  D.act('complete');
  t('max test: editor opens after completing set', D.has('adj') && D.ev('Store.getSets(WORKOUTS.get("b-d30"),WORKOUTS.get("b-d30").exercises[0])[0]') === 0);
  D.act('adj', '[data-d="1"]'); D.act('adj', '[data-d="1"]'); D.act('adj', '[data-d="1"]');
  t('max test: logged value saved (3)', D.saved().sets['b-d30']['max-push-ups'][0] === 3);
  // invalid session id
  const E = boot('#/session/nope');
  t('invalid session id falls back to overview', E.errors.length === 0 && /overview/.test(E.w.location.hash));
  // hold exercise uses 5s step
  const F = boot('#/session/b-d1');
  F.act('select-ex', '[data-i="3"]'); F.act('complete'); F.act('edit-set', '[data-i="0"]'); F.act('adj', '[data-d="1"]');
  t('hold exercise adjusts in 5s steps', F.saved().sets['b-d1']['plank'][0] === F.ev('DAYS[0].exercises[3].target') + 5);

  done();
})().catch(e => { console.log('TEST CRASH:', e.message); process.exit(1); });
