/* MOBILE WORKOUT ACTIVITY + WORKOUT COMPLETE – "Figma: active workout" and "Figma: workout complete".
   Timers, set logging and saving are the same code as desktop (session.js); this file is only the layout. */

function mSession() {
  const w = WORKOUTS.get(sess.wid), ex = w.exercises[sess.exIdx], pr = Store.progress(w), pct = pctOf(w);
  const finished = Store.status(w) === 'completed';
  const sets = Store.getSets(w, ex), nextI = sets.findIndex(v => v === null), exDone = nextI === -1;
  const g = groupOf(ex, w), rv = restView(ex, nextI), uw = unitWord(ex), cue = CUES[g][0][0];
  const label = finished ? 'Finish workout' : exDone ? 'Next exercise' : `Complete set ${nextI + 1}`;
  const segs = Array.from({ length: pr.total }, (_, i) => `<span class="h-1 flex-1 rounded-full" style="background:${i < pr.done ? 'var(--accent)' : 'var(--line)'}"></span>`).join('');

  const setCards = sets.map((v, i) => {
    const isDone = v !== null, isNext = i === nextI, editing = sess.editing === i && isDone;
    const inner = editing
      ? `<div class="flex items-center justify-between gap-1 mt-1"><button data-action="adj" data-d="-1" aria-label="Decrease" class="btn btn-ghost !px-0 w-12 text-xl">−</button><span class="display text-[32px]">${v}</span><button data-action="adj" data-d="1" aria-label="Increase" class="btn btn-ghost !px-0 w-12 text-xl">+</button></div>
         <div class="flex justify-between text-[12px]"><button data-action="undo-set" class="min-h-[48px] px-1 text-red-300">Undo</button><button data-action="close-edit" class="min-h-[48px] px-1 accent">Done</button></div>`
      : `<div class="display text-[34px] mt-2 leading-none">${isDone ? v : (ex.target ?? 'Max')} <span class="text-[15px]" style="font-family:var(--font-b);text-transform:none;font-weight:600">${uw}</span></div>
         <div class="text-[12px] muted mt-2 min-h-[48px] flex items-start">${isDone ? `<span>Logged · </span><button data-action="edit-set" data-i="${i}" class="underline underline-offset-2 min-h-[48px] -mt-3 px-1">Edit</button>` : (isNext ? '<span class="accent">Up next</span>' : 'Pending')}</div>`;
    return `<div class="rounded-xl border p-3 ${isNext ? 'card-next' : ''}" style="border-color:var(--line);background:var(--panel2)"><div class="flex justify-between eyebrow" style="font-size:10px"><span>Set ${i + 1}</span><span class="${isDone ? 'accent' : ''}">${icon(isDone ? 'check' : 'circle', 'w-4 h-4')}</span></div>${inner}</div>`;
  }).join('');

  return mScreen({ tabs: false, back: { href: '#/overview', label: 'Overview' }, body:
    `<div class="flex items-center justify-between text-[12px] mt-2"><span class="tracking-widest uppercase ${finished ? 'accent' : ''}"><span class="accent">●</span> <span class="accent">${finished ? 'Session complete' : 'Session active'}</span></span><span>Elapsed <span id="el-elapsed">${fmtClock(elapsedMs())}</span></span></div>
     <h1 class="display text-[28px] mt-3">${esc(weekTitle(w))}. Zero excuses.</h1>
     <div class="flex justify-between text-[13px] muted mt-2 mb-2"><span>${pr.done} of ${pr.total} sets completed</span><span class="accent">${pct}%</span></div>
     <div class="flex gap-1" aria-hidden="true">${segs}</div>
     <div class="flex items-center justify-between mt-5"><span class="eyebrow accent">Exercise ${String(sess.exIdx + 1).padStart(2, '0')} / ${String(w.exercises.length).padStart(2, '0')}</span>
       <span class="flex items-center gap-1 text-[13px] muted"><button data-action="m-ex" data-d="-1" aria-label="Previous exercise" class="w-12 h-12 grid place-items-center ${sess.exIdx === 0 ? 'opacity-30' : ''}" ${sess.exIdx === 0 ? 'disabled' : ''}>${icon('back', 'w-5 h-5')}</button>${levelOf(w)}<button data-action="m-ex" data-d="1" aria-label="Next exercise" class="w-12 h-12 grid place-items-center ${sess.exIdx === w.exercises.length - 1 ? 'opacity-30' : ''}" ${sess.exIdx === w.exercises.length - 1 ? 'disabled' : ''}>${icon('chev', 'w-5 h-5')}</button></span></div>
     <h2 class="display text-[36px] -mt-1">${esc(ex.name)}</h2>
     <div class="relative mt-3">${mediaHTML(ex, w, 'h-[190px] rounded-2xl')}<button data-action="form-demo" class="absolute left-3 bottom-3 inline-flex items-center gap-2 px-3 min-h-[48px] rounded-xl text-[13px]" style="background:rgba(10,12,10,.75);border:1px solid var(--line)">${icon('play', 'w-3.5 h-3.5')} Form demo</button></div>
     <p class="text-[14px] muted mt-3">${esc(targetText(ex))} · ${esc(cue)}.</p>
     <p class="eyebrow mt-6 mb-3">Your sets · ${sets.filter(v => v !== null).length} logged</p>
     <div class="grid grid-cols-3 gap-2">${setCards}</div>
     <section class="rounded-2xl border p-5 mt-5" style="background:var(--hl);border-color:var(--accent)" aria-label="Rest timer">
       <div class="flex justify-between"><span class="eyebrow accent">Rest &amp; reset</span><span class="accent">${icon('timer', 'w-5 h-5')}</span></div>
       <div class="flex items-center gap-5 mt-3"><div id="rest-clock" class="display text-[72px] leading-none ${sess.rest ? 'accent' : 'muted'} ${rv.expired ? 'pulse-soft' : ''}">${rv.clock}</div>
         <div class="text-[14px]"><p>of ${rv.total} seconds</p><p id="rest-sub" class="text-[13px] muted mt-1">${esc(rv.short)}</p></div></div>
       <div class="grid grid-cols-2 gap-3 mt-4"><button data-action="rest-add" class="btn btn-ghost !min-h-[56px]" ${sess.rest ? '' : 'disabled'}>+15 sec</button><button data-action="rest-skip" class="btn btn-ghost !min-h-[56px]" ${sess.rest ? '' : 'disabled'}>Skip rest</button></div></section>
     <button data-action="complete" class="btn btn-primary w-full !min-h-[60px] text-base mt-5" ${sess.paused ? 'disabled' : ''}>${icon('play', 'w-5 h-5')} ${label}</button>
     <div class="grid grid-cols-2 gap-3 mt-3"><button data-action="pause" class="btn btn-ghost !min-h-[56px]">${icon(sess.paused ? 'play' : 'pause', 'w-4 h-4')} ${sess.paused ? 'Resume' : 'Pause'}</button><button data-action="end" class="btn btn-ghost !min-h-[56px]">End workout</button></div>
     <p class="text-center text-[12px] muted mt-4">Progress saved automatically. Stay focused on the work.</p>` });
}

function mComplete(wid) {
  const w = WORKOUTS.get(wid), m = Store.meta(wid) || { ms: 0, at: 0 }, d = m.at ? new Date(m.at) : new Date(), pr = Store.progress(w);
  const exDone = w.exercises.filter(e => Store.getSets(w, e).every(v => v !== null)).length, streak = streakOf(listFor(w.program));
  const where = w.program === 'beginner' ? `Day ${w.day} of 30` : `Month ${metaOf(w).month} / Week ${metaOf(w).week}`;
  const stat = (v, l) => `<div><div class="display text-[34px]">${v}</div><p class="text-[12px] muted">${l}</p></div>`;
  const feel = m.feel;
  return mScreen({ active: 'workouts', tabs: true, back: { href: '#/overview', label: 'Overview' }, body:
    `<div class="rounded-2xl p-5 mt-2 accent-bg text-[#14210a]"><div class="flex justify-between items-start"><span class="text-[11px] font-semibold tracking-widest uppercase">Session complete</span>${icon('check', 'w-7 h-7')}</div>
       <h1 class="display text-[56px] mt-6" style="line-height:.92">You showed up. You got stronger.</h1><p class="text-[14px] mt-5">Every rep is a deposit. This one’s in the bank, ${esc(Store.setting('name'))}.</p></div>
     <p class="eyebrow mt-6">${WD[d.getDay()]}, ${MON[d.getMonth()].toUpperCase()} ${d.getDate()} · ${esc(where)}</p>
     <h2 class="display text-[30px] mt-2">${esc(weekTitle(w))}. Zero excuses.</h2>
     ${mCard(`<div class="grid grid-cols-3 gap-3 p-5 mt-0">${stat(fmtMin(m.ms), 'Total time')}${stat(`${exDone} / ${w.exercises.length}`, 'Exercises')}${stat(`${pr.done} / ${pr.total}`, 'Sets done')}</div>`, 'mt-3')}
     ${mCard(`<div class="flex items-center gap-4 p-4"><span class="accent">${icon('flame', 'w-8 h-8')}</span><div><p class="display text-[24px]">${streak} ${w.program === 'beginner' ? 'day' : 'session'}${streak === 1 ? '' : 's'}. Still showing up.</p><p class="text-[13px] muted">Your training streak stays alive.</p></div></div>`, 'mt-3')}
     ${mSection('All the work. Done.')}
     <ul class="grid gap-3">${w.exercises.map(e => `<li class="flex items-center gap-3 text-[14px]"><span class="accent">${icon('check', 'w-4 h-4')}</span><span class="flex-1">${esc(e.name)}</span><span class="muted text-[13px]">${esc(shortTarget(e))}</span></li>`).join('')}</ul>
     ${mSection('How did that feel?')}
     <div class="grid grid-cols-3 gap-2">${[['easy', 'Easy'], ['right', 'Just right'], ['tough', 'Tough']].map(([v, l]) => `<button data-action="m-feel" data-wid="${esc(wid)}" data-v="${v}" aria-pressed="${feel === v}" class="min-h-[56px] rounded-xl border text-[14px] ${feel === v ? 'accent' : 'muted'}" style="${feel === v ? 'background:var(--hl);border-color:var(--accent)' : 'border-color:var(--line)'}">${l}</button>`).join('')}</div>
     <a href="#/overview" class="btn btn-primary w-full !min-h-[56px] text-base mt-5">Back to overview</a>
     <button data-action="m-share" data-wid="${esc(wid)}" class="btn btn-ghost w-full !min-h-[56px] mt-3">${icon('share', 'w-5 h-5')} Share your session</button>` });
}

Object.assign(ACTIONS, {
  'm-ex': b => { const d = +b.dataset.d, w = WORKOUTS.get(sess.wid); if (d !== 1 && d !== -1) return; sess.exIdx = Math.max(0, Math.min(w.exercises.length - 1, sess.exIdx + d)); sess.editing = null; render(); },
  'm-feel': b => { if (WORKOUTS.has(b.dataset.wid) && FEELS.includes(b.dataset.v)) { Store.setMeta(b.dataset.wid, { feel: b.dataset.v }); render(); } },
  'm-share': async b => {
    const w = WORKOUTS.get(b.dataset.wid); if (!w) return;
    const m = Store.meta(w.id) || { ms: 0 }, pr = Store.progress(w);
    const text = `I finished ${weekTitle(w)} on Calis30: ${pr.done} sets${m.ms ? ' in ' + fmtClock(m.ms) : ''}. No gym. No gear. Just me.`;   // text only: no name, no link, no data
    try {
      if (navigator.share) await navigator.share({ title: 'Calis30 workout', text });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); toast('Copied to your clipboard.'); }
      else toast('Sharing is not available in this browser.');
    } catch (e) { if (e && e.name !== 'AbortError') { Log.warn('Share failed', e); toast('Could not share. Try again.'); } }
  }
});
