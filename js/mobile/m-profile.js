/* MOBILE PROFILE, PRIVACY, HELP – "Figma: profile and settings". There are no accounts: everything is stored on this device. */

function mProfile(sub) {
  if (sub === 'privacy') return mPrivacy();
  if (sub === 'help') return mHelp();
  const p = ui.program, list = listFor(p), done = doneSessions(list), pct = Math.round((done / list.length) * 100), nxt = nextWorkout(p);
  const where = !nxt ? 'Complete' : p === 'beginner' ? `Day ${nxt.day} of 30` : `Month ${metaOf(nxt).month} of 3`;
  const joined = new Date(Store.data.joined), S = Store.data.settings;
  const rest = S.restOverride ? `${S.restOverride} sec` : 'Plan default';
  const row = (ic, title, value, action, hint) => `<button data-action="${action}" aria-label="${esc(title)}: ${esc(value)}. ${hint}" class="w-full min-h-[64px] flex items-center gap-4 text-left border-b" style="border-color:var(--line)"><span class="muted">${icon(ic, 'w-5 h-5')}</span><span class="flex-1 text-[16px]">${title}</span><span class="text-[13px] muted">${esc(value)}</span><span class="muted">${icon('chev', 'w-4 h-4')}</span></button>`;
  const toggle = (ic, title, sub2, on, action, disabled) => `<div class="min-h-[64px] flex items-center gap-4 border-b" style="border-color:var(--line)"><span class="muted">${icon(ic, 'w-5 h-5')}</span><span class="flex-1"><span class="block text-[16px]">${esc(title)}</span><span class="block text-[13px] muted">${sub2}</span></span>
      <button role="switch" aria-checked="${on}" aria-label="${esc(title)}" data-action="${action}" ${disabled ? 'disabled' : ''} class="w-14 h-8 rounded-full relative shrink-0 ${disabled ? 'opacity-40' : ''}" style="background:${on ? 'var(--accent)' : 'var(--line)'}"><span class="absolute top-1 w-6 h-6 rounded-full transition-all" style="left:${on ? '28px' : '4px'};background:${on ? '#14210a' : '#8e9887'}"></span></button></div>`;
  const nav = (ic, title, href) => `<a href="${href}" class="w-full min-h-[64px] flex items-center gap-4 border-b" style="border-color:var(--line)"><span class="muted">${icon(ic, 'w-5 h-5')}</span><span class="flex-1 text-[16px]">${esc(title)}</span><span class="muted">${icon('chev', 'w-4 h-4')}</span></a>`;
  const nameBlock = ui.editName
    ? `<div class="flex-1"><label for="m-name" class="eyebrow block mb-2">Display name</label><input id="m-name" maxlength="30" value="${esc(S.name)}" autocomplete="off" class="w-full min-h-[48px] px-3 rounded-xl text-[16px] outline-none" style="background:var(--panel2);border:1px solid var(--line)" />
         <div class="flex gap-2 mt-2"><button data-action="p-savename" class="btn btn-primary">Save</button><button data-action="p-editname" class="btn btn-ghost">Cancel</button></div></div>`
    : `<div><h2 class="display text-[34px]">${esc(S.name)}</h2><p class="text-[13px] muted">Local athlete · Joined ${MON[joined.getMonth()]} ${joined.getFullYear()}</p><button data-action="p-editname" class="text-[14px] accent min-h-[48px] inline-flex items-center gap-1">Edit profile ${icon('arrow', 'w-3.5 h-3.5')}</button></div>`;
  return mScreen({ active: '', body:
    `${mEyebrow('Your space')}${mTitle('Built around you.')}
     <div class="flex items-center gap-4 mt-5"><span class="w-20 h-20 rounded-full grid place-items-center text-2xl font-semibold accent shrink-0" style="background:var(--hl);border:1px solid var(--line)">${esc(initials())}</span>${nameBlock}</div>
     <div class="rounded-2xl border p-5 mt-5" style="background:var(--panel);border-color:var(--line)"><span class="eyebrow accent">Your program</span><h3 class="display text-[26px] mt-2">${programName(p)}</h3>
       <div class="flex justify-between text-[13px] muted mt-2 mb-2"><span>${where}</span><a href="#/workouts" class="accent inline-flex items-center gap-1 min-h-[32px]">View program ${icon('arrow', 'w-3 h-3')}</a></div>${mBar(pct)}
       <div class="grid grid-cols-2 gap-2 mt-4">${['beginner', 'roadmap'].map(id => `<button data-action="set-program" data-p="${id}" aria-pressed="${p === id}" class="min-h-[48px] rounded-xl border text-[12px] px-2 ${p === id ? 'accent' : 'muted'}" style="${p === id ? 'background:var(--hl);border-color:var(--accent)' : 'border-color:var(--line)'}">${programName(id)}</button>`).join('')}</div></div>
     ${mSection('Train your way')}
     ${row('target', 'Training goal', S.goal, 'p-goal', 'Tap to change')}${row('schedule', 'Weekly target', `${S.weeklyTarget} workouts`, 'p-target', 'Tap to change')}${row('timer', 'Rest between sets', rest, 'p-rest', 'Tap to change')}
     ${toggle('bell', 'Workout reminders', 'Coming soon', false, 'p-noop', true)}${toggle('volume', 'Sound & haptics', 'Timer alerts and set feedback', S.sound, 'p-sound', false)}
     ${mSection('Account &amp; support')}
     ${nav('shield', 'Account & privacy', '#/profile/privacy')}${nav('help', 'Help & feedback', '#/profile/help')}
     <button data-action="p-wipe" class="w-full min-h-[64px] flex items-center gap-4 text-left border-b" style="border-color:var(--line)"><span class="muted">${icon('trash', 'w-5 h-5')}</span><span class="flex-1 text-[16px]">Clear data on this device</span><span class="muted">${icon('chev', 'w-4 h-4')}</span></button>
     <p class="text-center text-[11px] muted tracking-widest uppercase mt-6">${APP.name} v${APP.version} · No gym. No gear. Just you.</p>` });
}

function mPrivacy() {
  return mScreen({ active: '', back: { href: '#/profile', label: 'Profile' }, body:
    `${mEyebrow('Your data, your device')}${mTitle('Account &amp; privacy')}
     ${mCard(`<div class="p-5 text-[15px] grid gap-3 muted"><p><strong class="text-white">There is no account and no server.</strong> Everything you log is saved only in this browser on this device.</p>
       <p>Nothing is sent anywhere: no analytics, no cookies, no third-party scripts or fonts.</p><p>Clearing your browser’s site data erases your progress, so export a backup now and then.</p></div>`, 'mt-5')}
     <button data-action="p-export" class="btn btn-primary w-full !min-h-[56px] mt-5">${icon('download', 'w-5 h-5')} Export my data (JSON)</button>
     <button data-action="p-wipe" class="btn btn-ghost w-full !min-h-[56px] mt-3 hover:!border-red-400">${icon('trash', 'w-5 h-5')} Delete all data on this device</button>` });
}

function mHelp() {
  const checks = selfCheck(), bad = checks.filter(c => !c.ok).length, logs = Log.entries().slice().reverse();
  return mScreen({ active: '', back: { href: '#/profile', label: 'Profile' }, body:
    `${mEyebrow('When something looks wrong')}${mTitle('Help &amp; feedback')}
     ${mSection('Self-check', `<span class="text-[14px] ${bad ? 'text-red-300' : 'accent'}">${bad ? bad + ' problem' + (bad > 1 ? 's' : '') : 'All good'}</span>`)}
     <ul class="grid gap-2">${checks.map(c => `<li class="rounded-xl border p-3 text-[14px]" style="background:var(--panel);border-color:${c.ok ? 'var(--line)' : '#7f1d1d'}"><span class="${c.ok ? 'accent' : 'text-red-300'}">${c.ok ? '✓' : '✕'}</span> ${esc(c.name)}${c.ok ? '' : `<p class="text-[13px] muted mt-1">${esc(c.hint)}</p>`}</li>`).join('')}</ul>
     ${mSection('Error log', `<span class="text-[13px] muted">${logs.length} entr${logs.length === 1 ? 'y' : 'ies'}</span>`)}
     ${logs.length ? `<ul class="grid gap-2">${logs.slice(0, 30).map(e => `<li class="rounded-xl border p-3 text-[12px]" style="background:var(--panel);border-color:var(--line)"><span class="${e.lvl === 'error' ? 'text-red-300' : e.lvl === 'warn' ? 'text-amber-300' : 'muted'} uppercase">${esc(e.lvl)}</span> <span class="muted">${esc(new Date(e.t).toLocaleString())}</span><p class="mt-1 break-words">${esc(e.msg)}</p>${e.where ? `<p class="muted break-words mt-1">${esc(e.where)}</p>` : ''}</li>`).join('')}</ul>` : mCard(`<p class="p-4 text-[14px] muted">Nothing has gone wrong.</p>`)}
     <div class="grid grid-cols-2 gap-3 mt-4"><button data-action="p-copylog" class="btn btn-primary">${icon('copy', 'w-4 h-4')} Copy report</button><button data-action="p-clearlog" class="btn btn-ghost">Clear log</button></div>
     <button data-action="p-reload" class="btn btn-ghost w-full mt-3">Reload app</button>
     <p class="text-[12px] muted mt-4">The report holds technical details only (browser, screen size, checks and errors). It never includes your workouts or name. See docs/TROUBLESHOOTING.md for fixes.</p>` });
}

const cycle = (arr, cur) => arr[(arr.indexOf(cur) + 1) % arr.length];
Object.assign(ACTIONS, {
  'p-goal': () => { Store.setSetting('goal', cycle(GOALS, Store.setting('goal'))); render(); },
  'p-target': () => { Store.setSetting('weeklyTarget', Store.setting('weeklyTarget') % 7 + 1); render(); },
  'p-rest': () => { Store.setSetting('restOverride', cycle(REST_CHOICES, Store.setting('restOverride'))); render(); },
  'p-sound': () => { Store.setSetting('sound', !Store.setting('sound')); render(); },
  'p-noop': () => toast('Reminders are coming soon.'),
  'p-editname': () => { ui.editName = !ui.editName; render(); },
  'p-savename': () => { const el = $('#m-name'); if (el && Store.setSetting('name', el.value)) { ui.editName = false; toast('Profile updated.'); } else toast('Please enter a name.'); render(); },
  'p-export': () => {
    try {
      const url = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `calis30-backup-${todayISO()}.json`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Backup downloaded.');
    } catch (e) { Log.error('Export failed', e); toast('Could not export your data.'); }
  },
  'p-wipe': () => { if (confirm('Delete ALL your progress and settings on this device? This cannot be undone.')) { Store.wipeAll(); sess = null; Object.assign(ui, { program: 'beginner', schedWeek: null, schedSel: null }); location.hash = '#/overview'; render(); toast('All data deleted.'); } },
  'p-copylog': async () => { try { await navigator.clipboard.writeText(diagnosticsReport()); toast('Report copied.'); } catch (e) { Log.warn('Clipboard blocked', e); toast('Could not copy. Select the text in the log instead.'); } },
  'p-clearlog': () => { Log.clear(); render(); toast('Log cleared.'); },
  'p-reload': () => location.reload()
});
