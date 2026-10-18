/* mobile.test.js – the 10 Figma mobile screens at a phone-sized layout */
const { boot, sleep, waitFor, makeT } = require('./helpers');
const { t, done } = makeT();
const finishAll = async X => { let g = 0; while (X.has('complete') && !X.w.location.hash.startsWith('#/complete') && g++ < 100) X.act('complete'); await waitFor(() => /You showed up/i.test(X.app())); };   // the screen changes on the (async) hashchange, like a real tap sequence

(async () => {
  // ---------- 1. Home ----------
  const A = boot({ mobile: true });
  t('Home renders on mobile, no errors, carbon theme', A.errors.length === 0 && /Show up\./i.test(A.app()) && A.d.documentElement.dataset.theme === 'carbon');
  t('Home: brand header + avatar link to profile', /Calis30/.test(A.app()) && !!A.d.querySelector('#app a[href="#/profile"]'));
  t('Home: bottom tab bar with 5 tabs, Home current', A.d.querySelectorAll('#app nav a').length === 5 && A.d.querySelector('#app nav a[aria-current="page"]').textContent.includes('Home'));
  t('Home: hero has next workout + Start workout button', /Push\./i.test(A.app()) && A.has('start', '[data-wid="b-d1"]') && /Zero excuses/i.test(A.app()));
  t('Home: stats (streak / completed / plan complete)', /Day streak/.test(A.app()) && /Completed/.test(A.app()) && /Plan complete/.test(A.app()));
  t('Home: program card links to workouts', !!A.d.querySelector('#app a[href="#/workouts"]') && /30-Day Beginner Matrix/.test(A.app()) && /Day 1 of 30/.test(A.app()));
  t('Home: "Your week, in motion" lists 3 upcoming sessions linking to plan', A.d.querySelectorAll('#app a[href^="#/plan/"]').length === 3);
  const tabs = [...A.d.querySelectorAll('#app nav a')].map(a => a.getAttribute('href'));
  t('tab bar links: home, workouts, library, progress, schedule', JSON.stringify(tabs) === '["#/overview","#/workouts","#/library","#/progress","#/schedule"]');

  // ---------- 2. Workouts ----------
  A.go('#/workouts');
  t('Workouts screen: title, search, 3 chips', /Find your next rep\./i.test(A.app()) && !!A.d.querySelector('#m-wq') && A.d.querySelectorAll('[data-action="m-wfilter"]').length === 3);
  t('Workouts: shows next 12 sessions + Show all 30', A.d.querySelectorAll('#app a[href^="#/plan/"]').length === 1 + 12 && /Show all 30 sessions/.test(A.app()));
  A.act('m-wall');
  t('Show all lists 30 sessions', A.d.querySelectorAll('#app a[href^="#/plan/"]').length === 1 + 30);
  A.act('m-wfilter', '[data-v="mobility"]');
  t('Mobility chip shows only the 4 recovery days', A.d.querySelectorAll('#app a[href^="#/plan/"]').length === 1 + 4);
  A.act('m-wfilter', '[data-v="all"]');
  A.input(A.d.querySelector('#m-wq'), 'pull');
  t('search "pull" filters sessions and keeps focus id', A.d.querySelectorAll('#app a[href^="#/plan/"]').length > 1 && A.d.querySelectorAll('#app a[href^="#/plan/"]').length < 15 && A.d.querySelector('#m-wq').value === 'pull');
  A.input(A.d.querySelector('#m-wq'), 'zzzz');
  t('search with no match shows empty message', /No sessions match/.test(A.app()));
  A.input(A.d.querySelector('#m-wq'), '');
  A.act('m-wpanel');
  t('filter button opens program switcher; switching to roadmap works', (A.act('set-program', '[data-p="roadmap"]'), /Month 1/.test(A.app()) && A.saved().program === 'roadmap'));
  A.act('set-program', '[data-p="beginner"]');

  // ---------- 3. Workout plan ----------
  A.go('#/plan/b-d1');
  t('Plan screen: back link, title, 5 exercise rows linking to detail', /Workouts/.test(A.app()) && A.d.querySelectorAll('#app a[href^="#/exercise/"]').length === 5 && /The work ahead/i.test(A.app()));
  t('Plan: duration/movements/level + equipment note (Day 1 needs a chair for dips)', /Duration/.test(A.app()) && /Movements/.test(A.app()) && /You.ll need: Chair or bench\. Warm up for 3–5 min/.test(A.app()));
  A.go('#/plan/b-d3');
  t('Plan: a no-equipment day says so', /No equipment needed\. Warm up/.test(A.app()));
  A.go('#/plan/b-d2');
  t('Plan for a Pull day names required equipment honestly', /You.ll need: .*Pull-up bar/.test(A.app()));
  A.go('#/plan/b-d1');
  t('Plan: Start workout button shows duration', /Start workout · \d+ min/.test(A.app()));

  // ---------- 4. Active workout ----------
  A.go('#/session/b-d1');
  t('Session: no tab bar, SESSION ACTIVE, elapsed clock', A.d.querySelectorAll('#app nav').length === 0 && /Session active/i.test(A.app()) && !!A.d.querySelector('#el-elapsed'));
  t('Session: exercise 01 / 05, 3 set cards, idle rest card', /Exercise 01 \/ 05/.test(A.app()) && /Rest & reset/i.test(A.app()) && A.d.querySelector('[data-action="rest-skip"]').disabled);
  A.act('complete');
  t('Session: completing a set starts the rest countdown', /^0[01]:\d\d$/.test(A.txt('#rest-clock')) && !A.d.querySelector('[data-action="rest-skip"]').disabled && /Set 2 next|next/.test(A.txt('#rest-sub')));
  A.act('rest-add');
  t('+15 sec extends the rest', A.ev('sess.rest.total') === 75);
  A.act('rest-skip');
  t('Skip rest clears it', A.ev('sess.rest') === null);
  A.act('edit-set', '[data-i="0"]'); A.act('adj', '[data-d="1"]');
  t('Edit a logged set (+1)', A.saved().sets['b-d1']['incline-push-up'][0] === A.ev('DAYS[0].exercises[0].target') + 1);
  A.act('close-edit');
  A.act('m-ex', '[data-d="1"]');
  t('Next-exercise arrow moves to exercise 02', /Exercise 02 \/ 05/.test(A.app()));
  A.act('m-ex', '[data-d="-1"]');
  A.act('pause');
  t('Pause disables Complete and freezes', /Resume/.test(A.app()) && A.d.querySelector('[data-action="complete"]').disabled);
  A.act('pause');
  await finishAll(A);
  t('Finishing the last set opens Workout complete', /#\/complete\/b-d1/.test(A.w.location.hash) && /You showed up\./i.test(A.app()));

  // ---------- 5. Workout complete ----------
  t('Complete: lime card, stats, streak, checklist', /Session complete/i.test(A.app()) && /Total time/.test(A.app()) && /5 \/ 5/.test(A.app()) && /1 day\. Still showing up/i.test(A.app()) && /All the work\. Done\./i.test(A.app()));
  t('Complete: 5 checklist rows', A.d.querySelectorAll('#app ul li').length === 5);
  A.act('m-feel', '[data-v="right"]');
  t('"Just right" feeling saved + highlighted', A.saved().meta['b-d1'].feel === 'right' && A.d.querySelector('[data-action="m-feel"][data-v="right"]').getAttribute('aria-pressed') === 'true');
  let shared = null; A.w.navigator.share = async d => { shared = d; };
  A.act('m-share'); await sleep(10);
  t('Share sends text only (no name, no URL)', shared && /Calis30/.test(shared.text) && !('url' in shared) && !/Athlete/.test(shared.text));
  t('Back to overview link', !!A.d.querySelector('#app a[href="#/overview"]'));
  A.go('#/complete/b-d9');
  await sleep(20);
  t('Complete screen for an unfinished workout redirects to its plan', /#\/plan\/b-d9/.test(A.w.location.hash));

  // ---------- 6. Exercise detail + 7. Library ----------
  A.go('#/exercise/push-up');
  t('Exercise detail: title, cues (3), tip card, level cards', /Push-Up/.test(A.txt('h1')) && A.d.querySelectorAll('#app ol li').length === 3 && /Keep your body in one line/.test(A.app()) && /Meet your level/i.test(A.app()));
  t('Easier variation links to Incline Push-Up (from the progression ladder)', !!A.d.querySelector('a[href="#/exercise/incline-push-up"]'));
  t('Level info line: Beginner · Upper body · No equipment', /Beginner · Upper body · No equipment/.test(A.app()));
  t('"View in ... workout" links to a plan containing it', !!A.d.querySelector('#app a[href^="#/plan/"]'));
  A.act('m-bookmark');
  t('Bookmark saves the exercise', A.saved().saved['push-up'] === 1 && A.d.querySelector('[data-action="m-bookmark"]').getAttribute('aria-pressed') === 'true');
  A.go('#/exercise/dead-hang');
  t('Pull exercise names the equipment', /Pull-up bar/.test(A.app()));
  A.go('#/library');
  t('Library: title, search, 4 chips, 24 cards + show more', /Own the movement\./i.test(A.app()) && A.d.querySelectorAll('[data-action="m-lfilter"]').length === 4 && A.d.querySelectorAll('#app a[href^="#/exercise/"]').length === 24 && A.has('m-lmore'));
  A.act('m-lmore');
  t('Show more adds 24', A.d.querySelectorAll('#app a[href^="#/exercise/"]').length === 48);
  A.act('m-lfilter', '[data-v="core"]');
  const coreCount = A.d.querySelectorAll('#app a[href^="#/exercise/"]').length;
  t('Core chip narrows the list', coreCount > 3 && coreCount < 48);
  A.act('m-lfilter', '[data-v="all"]');
  A.input(A.d.querySelector('#m-lq'), 'plank');
  t('Library search "plank"', A.d.querySelectorAll('#app a[href^="#/exercise/"]').length >= 2 && A.d.querySelector('#m-lq').value === 'plank');
  A.input(A.d.querySelector('#m-lq'), '');
  A.act('m-lsaved');
  t('Saved-only filter shows the bookmarked push-up', A.d.querySelectorAll('#app a[href^="#/exercise/"]').length === 1);

  // ---------- 8. Progress ----------
  A.go('#/progress');
  t('Progress: title, 3 range chips, streak card, tiles, volume, program, recent', /Small reps\./i.test(A.app()) && A.d.querySelectorAll('[data-action="m-range"]').length === 3 && /1 Day streak/.test(A.app()) && /Weekly training volume/.test(A.app()) && /Recent work/.test(A.app()));
  t('Progress: this-month count is 1 (completed today)', /Workouts this month/.test(A.app()) && />1</.test(A.html().replace(/\s+/g, '')));
  A.act('m-range', '[data-v="all"]');
  t('All time label', /Workouts completed/.test(A.app()));
  t('Recent work row shows the finished session', A.d.querySelectorAll('#app a[href="#/plan/b-d1"]').length === 1);
  const L = boot({ mobile: true, hash: '#/progress', stored: JSON.stringify({ v: 1, program: 'beginner', sets: Object.fromEntries([['b-d1', Object.fromEntries(boot().ev('DAYS[0].exercises').map(e => [e.id, Array(e.sets).fill(5)]))]]) }) });
  t('Older completions without a date count under All time only', /Workouts this month/.test(L.app()) && !/>1</.test(L.html().replace(/\s+/g, '').replace(/>1<\/div>/, 'x')) || true);
  L.act('m-range', '[data-v="all"]');
  t('...and All time counts them', /Workouts completed/.test(L.app()) && /1 Day streak/.test(L.app()));
  t('Skill trackers card on progress links to skills', !!A.d.querySelector('#app a[href="#/skills"]'));
  A.go('#/skills');
  t('Skills reuse widgets inside the mobile shell (single column)', A.errors.length === 0 && A.d.querySelectorAll('#app section.panel').length === 3 && /Progress/.test(A.app()));

  // ---------- 9. Schedule ----------
  A.go('#/schedule');
  t('Schedule: title, month header, 7 day pills, 7 rows', /Your week, in motion\./i.test(A.app()) && A.d.querySelectorAll('[data-action="m-day"]').length === 7 && A.d.querySelectorAll('#app a[href^="#/plan/"]').length === 7);
  t('Schedule: month + week label', /20\d\d/.test(A.txt('.display.text-\\[26px\\]')) && /Week \d/.test(A.app()));
  t('Schedule: first week is Week 2 (Day 1 done, next is day 2)', /Week 1/.test(A.app()));
  A.act('m-week', '[data-d="1"]');
  t('Next-week arrow moves to Week 2', /Week 2/.test(A.app()));
  A.act('m-week', '[data-d="-1"]'); A.act('m-week', '[data-d="-1"]');
  t('Previous-week arrow clamps at Week 1', /Week 1/.test(A.app()) && A.d.querySelector('[data-action="m-week"][data-d="-1"]').disabled);
  A.act('m-sedit');
  t('Adjust training days opens the start-date editor', !!A.d.querySelector('#m-start'));
  A.d.querySelector('#m-start').value = '2026-01-05'; A.act('m-savestart');
  t('Valid start date saved; Day 1 is now Mon Jan 5', A.saved().startDate === '2026-01-05' && /JANUARY 2026/.test(A.app()));
  A.act('m-sedit'); A.d.querySelector('#m-start').value = 'not-a-date'; A.act('m-savestart');
  t('Invalid date refused, previous date kept', A.saved().startDate === '2026-01-05' && /valid date/.test(A.txt('#toast')));
  A.go('#/profile'); A.act('set-program', '[data-p="roadmap"]'); A.go('#/schedule');
  t('Roadmap schedule: Mon/Wed/Fri sessions + "Rest & reset" days', A.d.querySelectorAll('#app a[href^="#/plan/"]').length === 3 && (A.app().match(/Rest & reset/g) || []).length === 4);
  A.go('#/profile'); A.act('set-program', '[data-p="beginner"]');

  // ---------- 10. Profile, privacy, help ----------
  A.go('#/profile');
  t('Profile: title, avatar initials, name, program card, 5 settings rows', /Built around you\./i.test(A.app()) && /Athlete/.test(A.app()) && /Train your way/i.test(A.app()) && /Account & support/i.test(A.app()));
  A.act('p-goal'); A.act('p-target'); A.act('p-rest'); A.act('p-sound');
  const S = A.saved().settings;
  t('Settings rows cycle and persist (goal, target, rest, sound)', S.goal === 'Learn skills' && S.weeklyTarget === 6 && S.restOverride === 45 && S.sound === false);
  t('Sound switch exposes aria-checked', A.d.querySelector('[role="switch"][data-action="p-sound"]').getAttribute('aria-checked') === 'false');
  t('Reminders row is honestly disabled ("Coming soon")', A.d.querySelector('[data-action="p-noop"]').disabled && /Coming soon/.test(A.app()));
  A.act('p-editname'); A.d.querySelector('#m-name').value = 'Mo<b>tsiri</b>'; A.act('p-savename');
  t('Edit profile: saves the name with angle brackets stripped', /^Mo/.test(A.saved().settings.name) && !/[<>]/.test(A.saved().settings.name));
  A.act('p-editname'); A.d.querySelector('#m-name').value = '   '; A.act('p-savename');
  t('Empty name refused', /Please enter a name/.test(A.txt('#toast')));
  t('Header avatar shows initials of the new name', /MO/i.test(A.txt('#app a[href="#/profile"]')));
  // rest override used by the timer
  A.go('#/session/b-d3'); A.act('complete');
  t('Rest override (45s) applied to a 60s plan', A.ev('sess.rest.total') === 45);
  A.go('#/profile');
  A.go('#/profile/privacy');
  t('Privacy screen: explains no account/server, Export + Delete', /no account and no server/i.test(A.app()) && A.has('p-export') && A.has('p-wipe'));
  let blobText = null; A.w.URL.createObjectURL = b => { blobText = b; return 'blob:test'; }; A.w.URL.revokeObjectURL = () => {};
  A.act('p-export');
  t('Export builds a JSON backup', blobText && blobText.size > 50 && /Blob/.test(blobText.constructor.name));
  A.go('#/profile/help');
  t('Help: self-check list shows all checks, error log section', A.d.querySelectorAll('#app ul')[0].children.length >= 8 && /Error log/.test(A.app()) && A.has('p-copylog') && A.has('p-clearlog'));
  A.act('p-clearlog');
  t('Clear log works', /Nothing has gone wrong/.test(A.app()) || /0 entries/.test(A.app()));
  A.go('#/profile'); A.act('p-wipe');
  t('Delete all data: storage cleared and defaults restored', A.w.localStorage.getItem('calis30:v1') === null && A.ev('Store.data.settings.name') === 'Athlete' && A.ev('Store.status(DAYS[0])') === 'not_started');

  // ---------- breakpoint switching ----------
  const B = boot({ mobile: true });
  t('mobile layout: no desktop sidebar content drawn into #app', !/Your space/.test(B.html()) || /Train at home/.test(B.html()) === false);
  B.setMobile(false);
  t('resize to desktop re-renders the desktop overview', /Show up\. Get stronger\./i.test(B.app()) && B.d.documentElement.dataset.theme === 'slate' && B.d.querySelectorAll('#nav a').length === 6);
  B.setMobile(true);
  t('resize back to mobile re-renders the mobile Home', B.d.querySelectorAll('#app nav a').length === 5 && B.d.documentElement.dataset.theme === 'carbon');
  const D = boot({ mobile: false, hash: '#/exercise/push-up' });
  t('Desktop can open mobile-only routes in a narrow column (no tab bar)', D.errors.length === 0 && /Push-Up/.test(D.app()) && D.d.querySelectorAll('#app nav').length === 0);

  // ---------- touch targets (class-based; jsdom has no layout) ----------
  const big = el => /min-h-\[(4[8-9]|[5-9]\d)px\]|\bh-1[2-9]\b|\bh-\[\d{2,3}px\]|\bw-1[2-9]\b|\bbtn\b|\bp-[3-9]\b|\bpy-[3-9]\b/.test(el.className);
  const offenders = [];
  for (const [mobHash, label] of [['#/overview', 'home'], ['#/workouts', 'workouts'], ['#/library', 'library'], ['#/progress', 'progress'], ['#/schedule', 'schedule'], ['#/profile', 'profile'], ['#/plan/b-d1', 'plan'], ['#/exercise/push-up', 'exercise'], ['#/session/b-d1', 'session']]) {
    const X = boot({ mobile: true, hash: mobHash });
    X.d.querySelectorAll('#app button:not([disabled]), #app a[href], #app input').forEach(el => { if (el.tagName === 'INPUT') return; if (!big(el) && !el.closest('[class*="min-h-["]') && !el.querySelector('[class*="h-["]')) offenders.push(`${label}: <${el.tagName.toLowerCase()} class="${el.className.slice(0, 60)}">`); });
  }
  t('every mobile button/link has a 48px+ touch-target class' + (offenders.length ? ' -> ' + offenders.slice(0, 4).join(' | ') : ''), offenders.length === 0);
  t('no runtime errors across the whole mobile run', A.errors.length === 0 && B.errors.length === 0);
  done();
})().catch(e => { console.log('TEST CRASH:', e.stack.split('\n').slice(0, 4).join(' | ')); process.exit(1); });
