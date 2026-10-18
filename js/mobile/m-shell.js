/* MOBILE SHELL – header, bottom tab bar, shared components and plan dates for the mobile screens (the Figma mobile file).
   On a desktop-width window, the screens that have no desktop version (plan, exercise, complete, profile) reuse these
   components inside a narrow column without the header or tab bar. */

const TABS = [['overview', 'Home'], ['workouts', 'Workouts'], ['library', 'Library'], ['progress', 'Progress'], ['schedule', 'Schedule']];

const initials = () => {
  const parts = Store.setting('name').split(' ').filter(Boolean);
  const a = (parts[0] || 'A')[0], b = parts.length > 1 ? parts[1][0] : ((parts[0] || 'A')[1] || '');
  return (a + b).toUpperCase();
};
const avatarLink = () => `<a href="#/profile" aria-label="Profile and settings" class="w-12 h-12 rounded-full grid place-items-center text-sm font-semibold accent border" style="background:var(--hl);border-color:var(--line)">${esc(initials())}</a>`;

function mHeader(back) {
  const left = back
    ? `<a href="${esc(back.href)}" class="inline-flex items-center gap-2 min-h-[48px] text-[15px]">${icon('arrowleft', 'w-5 h-5')}${esc(back.label)}</a>`
    : `<a href="#/overview" class="inline-flex items-center gap-2 min-h-[48px]"><span class="w-9 h-9 rounded-lg accent-bg grid place-items-center text-[#14210a]">${icon('arrow', 'w-5 h-5')}</span><span class="display text-[28px]">Calis30</span></a>`;
  return `<header class="flex items-center justify-between pt-3 pb-2">${left}${avatarLink()}</header>`;
}

function mTabbar(active) {
  return `<nav aria-label="Main" class="fixed bottom-0 inset-x-0 z-20 border-t" style="border-color:var(--line);background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(8px)">
    <div class="max-w-[480px] mx-auto grid grid-cols-5 px-2 pt-2" style="padding-bottom:max(12px,env(safe-area-inset-bottom))">${TABS.map(([id, l]) =>
      `<a href="#/${id}" ${active === id ? 'aria-current="page"' : ''} class="min-h-[56px] rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] ${active === id ? 'accent' : 'muted'}" style="${active === id ? 'background:var(--hl)' : ''}">${icon(id, 'w-6 h-6')}<span>${l}</span></a>`).join('')}
    </div></nav>`;
}

/* One screen: optional header with back link, body HTML, optional tab bar */
function mScreen({ active = '', back = null, body = '', tabs = true }) {
  const chrome = isMobile();
  const head = chrome ? mHeader(back)
    : (back ? `<a href="${esc(back.href)}" class="inline-flex items-center gap-2 min-h-[48px] text-sm muted hover:text-white">${icon('arrowleft', 'w-4 h-4')}${esc(back.label)}</a>` : '');
  return `<div class="mx-auto w-full ${chrome ? 'max-w-[480px]' : 'max-w-md'} px-5 ${chrome ? '' : 'pt-6'} ${chrome && tabs ? 'pb-32' : 'pb-10'}">${head}<div class="pt-2">${body}</div></div>${chrome && tabs ? mTabbar(active) : ''}`;
}

/* ---- small components (callers escape any dynamic text they pass in) ---- */
const mEyebrow = t => `<p class="eyebrow mb-3">${t}</p>`;
const mTitle = t => `<h1 class="display text-[40px] sm:text-[44px]">${t}</h1>`;
const mSub = t => `<p class="muted text-[15px] mt-3">${t}</p>`;
const mSection = (title, right = '') => `<div class="flex items-end justify-between mt-8 mb-3"><h2 class="display text-[26px]">${title}</h2>${right}</div>`;
const mChip = (label, on, action, val) => `<button data-action="${action}" data-v="${esc(val)}" aria-pressed="${on}" class="min-h-[48px] px-4 rounded-xl text-sm border whitespace-nowrap ${on ? 'accent' : 'muted'}" style="${on ? 'background:var(--hl);border-color:var(--accent)' : 'border-color:var(--line)'}">${esc(label)}</button>`;
const mChips = items => `<div class="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">${items.join('')}</div>`;
const mCard = (inner, extra = '', style = '') => `<div class="rounded-2xl border ${extra}" style="background:var(--panel);border-color:var(--line);${style}">${inner}</div>`;
const mBar = pct => `<div class="h-1.5 rounded-full" style="background:var(--line)"><div class="h-full rounded-full accent-bg" style="width:${num(pct, 0, 100)}%"></div></div>`;
const playBadge = `<span class="absolute right-2 bottom-2 w-8 h-8 rounded-full grid place-items-center" style="background:rgba(10,12,10,.7);border:1px solid var(--line)">${icon('play', 'w-3.5 h-3.5')}</span>`;
function mSearch(id, bind, value, placeholder, filterAction, filterOn, filterLabel) {
  return `<div class="flex gap-2"><label class="flex-1 min-w-0 flex items-center gap-3 px-4 min-h-[56px] rounded-2xl border" style="background:var(--panel);border-color:var(--line)">
      <span class="muted">${icon('search', 'w-5 h-5')}</span>
      <input id="${id}" data-bind="${bind}" type="search" maxlength="60" autocomplete="off" value="${esc(value)}" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" class="flex-1 w-full bg-transparent outline-none text-[15px] min-w-0" /></label>
    <button data-action="${filterAction}" aria-pressed="${filterOn}" aria-label="${esc(filterLabel)}" class="w-14 min-h-[56px] rounded-2xl border grid place-items-center ${filterOn ? 'accent' : 'muted'}" style="background:var(--panel);border-color:${filterOn ? 'var(--accent)' : 'var(--line)'}">${icon('sliders', 'w-5 h-5')}</button></div>`;
}
const shortTarget = ex => (ex.target === null ? `1 × max ${ex.unit === 'max_sec' ? 'hold' : 'reps'}` : `${ex.sets} × ${ex.target} ${ex.unit === 'sec' ? 'sec' : 'reps'}`);
const fmtMin = ms => (ms > 0 ? fmtClock(ms) : '--:--');

/* ---- plan dates: the program starts on Store.data.startDate; day N is N-1 days later ---- */
const WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const planStart = () => { const [y, m, d] = Store.data.startDate.split('-').map(Number); return new Date(y, m - 1, d); };
const ROADMAP_OFFSETS = [0, 2, 4];                       // roadmap sessions land on days 1, 3 and 5 of each week
function offsetOf(w) {
  if (w.program === 'beginner') return w.day - 1;
  const m = w.id.match(/^r-m(\d)-w(\d)-b(\d)$/);
  return ((+m[1] - 1) * 4 + (+m[2] - 1)) * 7 + ROADMAP_OFFSETS[+m[3] - 1];
}
const dateOf = w => addDays(planStart(), offsetOf(w));
const planWeeks = p => Math.ceil((Math.max(...listFor(p).map(offsetOf)) + 1) / 7);
function planWeek(p, wi) {
  const byOff = new Map(listFor(p).map(w => [offsetOf(w), w]));
  return Array.from({ length: 7 }, (_, i) => ({ off: wi * 7 + i, date: addDays(planStart(), wi * 7 + i), w: byOff.get(wi * 7 + i) || null }));
}
function whenText(w) {
  const st = Store.status(w);
  if (st === 'completed') return 'Completed';
  if (st === 'in_progress') return 'In progress';
  const diff = Math.round((dateOf(w) - startOfToday()) / 86400000);
  return diff === 0 ? 'Today' : diff === 1 ? 'Planned for tomorrow' : 'Planned';
}
/* a row used on Home and Schedule: date block, title, meta, trailing icon */
function mDayRow(w, opts = {}) {
  const d = dateOf(w), st = Store.status(w), isNext = !!opts.next;
  const ic = st === 'completed' ? 'check' : isNext ? 'play' : w.type === 'rest' ? 'leaf' : 'circle';
  return `<a href="#/plan/${esc(w.id)}" class="flex items-center gap-4 px-4 min-h-[76px] rounded-2xl border mb-3 ${isNext ? 'card-next' : ''}" style="background:var(--panel);border-color:var(--line)">
    <span class="w-10 text-left"><span class="eyebrow block">${WD[d.getDay()]}</span><span class="display text-[28px] block">${d.getDate()}</span></span>
    <span class="flex-1 min-w-0"><span class="block font-semibold text-[16px] truncate">${esc(weekTitle(w))}</span><span class="block text-[13px] ${isNext ? 'accent' : 'muted'}">${estMin(w)} min · ${isNext ? 'Up next' : whenText(w)}</span></span>
    <span class="${st === 'completed' || isNext ? 'accent' : 'muted'}">${icon(opts.chevron ? 'chev' : ic, 'w-5 h-5')}</span></a>`;
}
