/* MOBILE LIBRARY + EXERCISE DETAIL – "Figma: exercise library" and "Figma: exercise detail" */

const LIB_CHIPS = { upper: ['PUSH', 'PULL'], lower: ['LEGS'], core: ['CORE'] };
function libItems() {
  const q = ui.lq.trim().toLowerCase();
  return [...EXERCISES.values()].filter(e =>
    e.name.toLowerCase().includes(q) &&
    (ui.lfilter === 'all' || (LIB_CHIPS[ui.lfilter] || []).includes(groupOf(e.sample, e.w))) &&
    (!ui.lsaved || Store.isSaved(e.id)));
}

function mLibrary() {
  const items = libItems(), shown = items.slice(0, ui.llimit);
  const card = e => `<a href="#/exercise/${esc(e.id)}" class="rounded-2xl border overflow-hidden block" style="background:var(--panel);border-color:var(--line)">
      <div class="relative">${mediaHTML(e.sample, e.w, 'h-[110px]')}${playBadge}</div>
      <div class="p-3"><p class="eyebrow" style="font-size:10px">${esc(GROUP_LABEL[groupOf(e.sample, e.w)])}</p>
        <h3 class="display text-[24px] mt-1 leading-[1]">${esc(e.name)}</h3>
        <p class="text-[12px] mt-2"><span class="accent">•</span> <span class="muted">${e.level}</span>${Store.isSaved(e.id) ? ` <span class="accent ml-1">${icon('bookmark', 'w-3 h-3 inline')}</span>` : ''}</p></div></a>`;
  return mScreen({ active: 'library', body:
    `${mEyebrow('Quality reps over everything')}${mTitle('Own the movement.')}${mSub('Find your form. Build your foundation. One movement at a time.')}
     <div class="mt-6">${mSearch('m-lq', 'lq', ui.lq, 'Search exercises', 'm-lsaved', ui.lsaved, 'Show saved exercises only')}</div>
     <div class="mt-4">${mChips([['all', 'All moves'], ['upper', 'Upper'], ['lower', 'Lower'], ['core', 'Core']].map(([v, l]) => mChip(l, ui.lfilter === v, 'm-lfilter', v)))}</div>
     ${mSection('The essentials', `<span class="text-[14px] accent">${items.length} move${items.length === 1 ? '' : 's'}${ui.lsaved ? ' · saved' : ''}</span>`)}
     ${shown.length ? `<div class="grid grid-cols-2 gap-3">${shown.map(card).join('')}</div>` : mCard(`<p class="p-5 text-[14px] muted">${ui.lsaved ? 'No saved exercises yet. Open one and tap the bookmark.' : 'No exercises match your search.'}</p>`)}
     ${items.length > shown.length ? `<button data-action="m-lmore" class="btn btn-ghost w-full mt-4">Show more moves</button>` : ''}
     <p class="text-center text-[13px] muted mt-8">Your space. Your body. No equipment.</p>` });
}

function mExercise(id) {
  const e = EXERCISES.get(id), g = groupOf(e.sample, e.w), v = variationsFor(id), saved = Store.isSaved(id);
  const nextW = [nextWorkout(ui.program), nextWorkout(ui.program === 'beginner' ? 'roadmap' : 'beginner')].find(w => w && w.exercises.some(x => x.id === id))
    || [...WORKOUTS.values()].find(w => Store.status(w) !== 'completed' && w.exercises.some(x => x.id === id));
  const level = (label, key, fallback) => {
    const target = v[key] && EXERCISES.get(v[key]);
    return target
      ? `<a href="#/exercise/${esc(target.id)}" class="rounded-2xl border p-4 block min-h-[72px]" style="background:var(--panel);border-color:var(--line)"><p class="eyebrow ${key === 'harder' ? 'accent' : ''}">${label}</p><p class="mt-2 font-semibold">${esc(target.name)}</p></a>`
      : `<div class="rounded-2xl border p-4 min-h-[72px]" style="background:var(--panel);border-color:var(--line)"><p class="eyebrow ${key === 'harder' ? 'accent' : ''}">${label}</p><p class="mt-2 text-[14px] muted">${fallback}</p></div>`;
  };
  return mScreen({ active: 'library', back: { href: '#/library', label: 'Exercise library' }, body:
    `<div class="flex items-center justify-between"><span class="eyebrow accent">${esc(GROUP_LABEL[g])}</span>
       <button data-action="m-bookmark" data-id="${esc(id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save exercise'}" class="w-12 h-12 grid place-items-center ${saved ? 'accent' : 'muted'}">${icon('bookmark', 'w-6 h-6')}</button></div>
     <h1 class="display text-[44px]">${esc(e.name)}</h1>
     <p class="muted text-[14px] mt-2">${e.level} · ${REGION[g]} · ${esc(equipmentOf(e.name))}</p>
     ${mediaHTML(e.sample, e.w, 'h-56 rounded-xl mt-5')}
     <button data-action="form-demo" class="btn btn-ghost w-full mt-3 !min-h-[56px]">${icon('play', 'w-4 h-4')} Watch form demo</button>
     <p class="text-[15px] muted mt-5">${esc(DESCRIPTIONS[g])}</p>
     ${mSection('Make every rep count')}
     <ol class="grid gap-4">${CUES[g].map((c, i) => `<li class="flex gap-4"><span class="display text-[30px] accent w-9 leading-none">${String(i + 1).padStart(2, '0')}</span><span><span class="block font-semibold">${esc(c[0])}</span><span class="block text-[14px] muted">${esc(c[1])}</span></span></li>`).join('')}</ol>
     ${mCard(`<div class="flex gap-3 p-4"><span class="accent mt-0.5">${icon('alert', 'w-5 h-5')}</span><div><p class="font-semibold text-[14px]">${esc(TIPS[g][0])}</p><p class="text-[14px] muted">${esc(TIPS[g][1])}</p></div></div>`, 'mt-6')}
     ${mSection('Meet your level')}
     <div class="grid grid-cols-2 gap-3">${level('Make it easier', 'easier', 'Slow the tempo and shorten the range.')}${level('Level it up', 'harder', 'Add a pause at the hardest point.')}</div>
     ${nextW ? `<a href="#/plan/${esc(nextW.id)}" class="btn btn-primary w-full !min-h-[56px] text-base mt-6">${icon('arrow', 'w-5 h-5')} View in ${nextW.id === (nextWorkout(ui.program) || {}).id ? 'today’s' : 'your next'} workout</a>`
             : `<a href="#/workouts" class="btn btn-ghost w-full mt-6">Browse workouts</a>`}` });
}

Object.assign(ACTIONS, {
  'm-lfilter': b => { if (['all', 'upper', 'lower', 'core'].includes(b.dataset.v)) { ui.lfilter = b.dataset.v; ui.llimit = 24; render(); } },
  'm-lsaved': () => { ui.lsaved = !ui.lsaved; ui.llimit = 24; render(); },
  'm-lmore': () => { ui.llimit += 24; render(); },
  'm-bookmark': b => { if (EXERCISES.has(b.dataset.id)) { Store.toggleSaved(b.dataset.id); toast(Store.isSaved(b.dataset.id) ? 'Saved to your library.' : 'Removed from saved.'); render(); } }
});
