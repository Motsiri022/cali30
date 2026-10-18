/* STORE – LocalStorage persistence (key "calis30:v1").
   EVERYTHING read back from LocalStorage is treated as untrusted: it is validated and rebuilt field by field in
   sanitize(), so tampered or corrupted data can never reach the page as markup or crash the app.
   Saved shape:
     { v:1, program, joined, startDate,
       sets:{ [workoutId]:{ [exerciseId]:[null|number,...] } },
       skills:{ [handstand|lsit|muscleup]:{ stage, logs:[{t,s,v}] } },
       meta:{ [workoutId]:{ ms, at, feel } },  saved:{ [exerciseId]:1 },
       settings:{ name, goal, weeklyTarget, restOverride, sound } } */

const SKILL_KEYS = ['handstand', 'lsit', 'muscleup'];
const GOALS = ['Build strength', 'Learn skills', 'Stay active'];
const FEELS = ['easy', 'right', 'tough'];
const REST_CHOICES = [0, 45, 60, 90];                  // 0 = use each exercise's planned rest
const DEFAULT_SETTINGS = { name: 'Athlete', goal: GOALS[0], weeklyTarget: 5, restOverride: 0, sound: true };

const Store = {
  KEY: 'calis30:v1',
  data: null,
  available: true,          // false = storage blocked/unavailable (app still works in memory)
  saveFailed: false,        // true = the last save threw (e.g. storage full)
  loadNotes: [],            // human-readable notes about anything repaired or discarded on load

  load() {
    let txt = null;
    this.loadNotes = [];
    try { txt = localStorage.getItem(this.KEY); }
    catch (e) { this.available = false; Log.warn('Storage is blocked in this browser; progress will not be saved', e); }
    let raw = null;
    if (txt) {
      if (txt.length > 2000000) { this.loadNotes.push('Saved data was far too large and was ignored.'); Log.warn('Saved data too large; ignored'); }
      else {
        try { raw = JSON.parse(txt); }
        catch (e) {
          this.loadNotes.push('Saved data was unreadable. A backup copy was kept (key calis30:corrupt-backup).');
          Log.warn('Saved data was corrupt JSON; starting fresh', e);
          try { localStorage.setItem('calis30:corrupt-backup', txt.slice(0, 200000)); } catch (e2) { /* ignore */ }
        }
      }
    }
    const { out, dropped } = this.sanitize(raw);
    if (dropped) { this.loadNotes.push(`${dropped} invalid saved entr${dropped === 1 ? 'y was' : 'ies were'} discarded.`); Log.warn(`Discarded ${dropped} invalid saved entries on load`); }
    this.data = out;
  },

  /* Rebuild a clean data object from untrusted input. Returns { out, dropped }. */
  sanitize(raw) {
    const out = { v: 1, program: 'beginner', joined: Date.now(), startDate: todayISO(), sets: {}, skills: {}, meta: {}, saved: {}, settings: { ...DEFAULT_SETTINGS } };
    let dropped = 0;
    if (!isPlainObject(raw) || raw.v !== 1) return { out, dropped: raw ? 1 : 0 };

    if (['beginner', 'roadmap'].includes(raw.program)) out.program = raw.program;
    if (Number.isFinite(raw.joined) && raw.joined > 1.5e12 && raw.joined < 4.2e12) out.joined = raw.joined;
    if (isoDateOk(raw.startDate)) out.startDate = raw.startDate;

    if (isPlainObject(raw.sets)) for (const [wid, byEx] of Object.entries(raw.sets)) {
      const w = WORKOUTS.get(wid);
      if (!w || !isPlainObject(byEx)) { dropped++; continue; }
      for (const [exId, arr] of Object.entries(byEx)) {
        const ex = w.exercises.find(e => e.id === exId);
        if (!ex || !Array.isArray(arr)) { dropped++; continue; }
        const clean = Array.from({ length: ex.sets }, (_, i) => {
          const v = arr[i];
          if (v === null || v === undefined) return null;
          if (typeof v === 'number' && Number.isFinite(v)) return num(v, 0, 9999);
          dropped++; return null;
        });
        if (clean.some(v => v !== null)) (out.sets[wid] = out.sets[wid] || {})[exId] = clean;
      }
    }

    if (isPlainObject(raw.skills)) for (const key of SKILL_KEYS) {
      const s = raw.skills[key]; if (!isPlainObject(s)) continue;
      const logs = (Array.isArray(s.logs) ? s.logs : []).filter(l => isPlainObject(l) && Number.isFinite(l.t) && Number.isFinite(l.v) && Number.isInteger(l.s) && l.s >= 0 && l.s < 20 && l.v >= 0 && l.v <= 999);
      dropped += (Array.isArray(s.logs) ? s.logs.length : 0) - logs.length;
      out.skills[key] = { stage: Number.isInteger(s.stage) && s.stage >= 0 && s.stage < 20 ? s.stage : 0, logs: logs.slice(-200).map(l => ({ t: l.t, s: l.s, v: Math.round(l.v) })) };
    }

    if (isPlainObject(raw.meta)) for (const [wid, m] of Object.entries(raw.meta)) {
      if (!WORKOUTS.has(wid) || !isPlainObject(m)) { dropped++; continue; }
      const e = { ms: num(m.ms, 0, 86400000), at: Number.isFinite(m.at) ? m.at : 0 };
      if (FEELS.includes(m.feel)) e.feel = m.feel;
      out.meta[wid] = e;
    }
    if (isPlainObject(raw.saved)) for (const k of Object.keys(raw.saved)) { if (/^[a-z0-9-]{1,80}$/.test(k)) out.saved[k] = 1; else dropped++; }

    if (isPlainObject(raw.settings)) {
      const s = raw.settings, d = out.settings;
      const name = cleanText(s.name, 30); if (name) d.name = name;
      if (GOALS.includes(s.goal)) d.goal = s.goal;
      if (Number.isInteger(s.weeklyTarget) && s.weeklyTarget >= 1 && s.weeklyTarget <= 7) d.weeklyTarget = s.weeklyTarget;
      if (REST_CHOICES.includes(s.restOverride)) d.restOverride = s.restOverride;
      if (typeof s.sound === 'boolean') d.sound = s.sound;
    }
    return { out, dropped };
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); this.saveFailed = false; }
    catch (e) { this.saveFailed = true; this.available = false; Log.error('Could not save progress (storage full or blocked)', e); }
  },
  setProgram(p) { if (!['beginner', 'roadmap'].includes(p)) return; this.data.program = p; this.save(); },

  /* ---- workout sets: one entry per set, null = not done, number = logged reps/seconds ---- */
  getSets(w, ex) {
    const saved = (this.data.sets[w.id] || {})[ex.id] || [];
    return Array.from({ length: ex.sets }, (_, i) => (saved[i] === undefined ? null : saved[i]));
  },
  setSet(w, ex, i, value) {                                       // value null => un-complete
    if (!Number.isInteger(i) || i < 0 || i >= ex.sets) return;
    const arr = this.getSets(w, ex);
    arr[i] = value === null ? null : num(value, 0, 9999);
    const wk = (this.data.sets[w.id] = this.data.sets[w.id] || {});
    if (arr.every(v => v === null)) delete wk[ex.id]; else wk[ex.id] = arr;
    if (!Object.keys(wk).length) delete this.data.sets[w.id];
    this.save();
  },
  toggleSet(w, ex, i) {
    const cur = this.getSets(w, ex)[i];
    this.setSet(w, ex, i, cur === null ? (ex.target ?? 0) : null);
  },
  progress(w) {
    let done = 0, total = 0;
    w.exercises.forEach(ex => { total += ex.sets; done += this.getSets(w, ex).filter(v => v !== null).length; });
    return { done, total };
  },
  status(w) {
    const { done, total } = this.progress(w);
    return done === 0 ? 'not_started' : done === total ? 'completed' : 'in_progress';
  },

  /* ---- skill trackers ---- */
  skill(key) {
    if (!SKILL_KEYS.includes(key)) return { stage: 0, logs: [] };
    const all = this.data.skills;
    return (all[key] = all[key] || { stage: 0, logs: [] });
  },
  setSkillStage(key, i) { if (SKILL_KEYS.includes(key)) { this.skill(key).stage = num(i, 0, 19); this.save(); } },
  addSkillLog(key, stage, v) {
    if (!SKILL_KEYS.includes(key)) return;
    const o = this.skill(key);
    o.logs.push({ t: Date.now(), s: num(stage, 0, 19), v: num(v, 0, 999) });
    if (o.logs.length > 200) o.logs = o.logs.slice(-200);
    this.save();
  },
  removeSkillLog(key, i) { if (SKILL_KEYS.includes(key)) { this.skill(key).logs.splice(i, 1); this.save(); } },

  /* ---- session summaries, saved exercises, settings ---- */
  meta(wid) { return this.data.meta[wid] || null; },
  setMeta(wid, patch) {
    if (!WORKOUTS.has(wid)) return;
    const cur = this.data.meta[wid] || { ms: 0, at: 0 };
    const next = { ...cur };
    if ('ms' in patch) next.ms = num(patch.ms, 0, 86400000);
    if ('at' in patch) next.at = Number.isFinite(patch.at) ? patch.at : 0;
    if (FEELS.includes(patch.feel)) next.feel = patch.feel;
    this.data.meta[wid] = next; this.save();
  },
  isSaved(id) { return !!this.data.saved[id]; },
  toggleSaved(id) { if (!/^[a-z0-9-]{1,80}$/.test(id)) return; if (this.data.saved[id]) delete this.data.saved[id]; else this.data.saved[id] = 1; this.save(); },
  setting(k) { return this.data.settings[k]; },
  setSetting(k, v) {
    const s = this.data.settings;
    if (k === 'name') { const n = cleanText(v, 30); if (!n) return false; s.name = n; }
    else if (k === 'goal' && GOALS.includes(v)) s.goal = v;
    else if (k === 'weeklyTarget' && Number.isInteger(v) && v >= 1 && v <= 7) s.weeklyTarget = v;
    else if (k === 'restOverride' && REST_CHOICES.includes(v)) s.restOverride = v;
    else if (k === 'sound' && typeof v === 'boolean') s.sound = v;
    else return false;
    this.save(); return true;
  },
  setStartDate(iso) { if (!isoDateOk(iso)) return false; this.data.startDate = iso; this.save(); return true; },

  /* Everything the app has saved, as JSON text (for the Export button) */
  exportJSON() { return JSON.stringify({ app: APP.name, version: APP.version, exportedAt: new Date().toISOString(), data: this.data }, null, 2); },

  reset() { const keep = { program: this.data.program, joined: this.data.joined, startDate: this.data.startDate, settings: this.data.settings, saved: this.data.saved };
            this.data = { v: 1, sets: {}, skills: {}, meta: {}, ...keep }; this.save(); },
  wipeAll() { this.data = this.sanitize(null).out; try { localStorage.removeItem(this.KEY); } catch (e) { /* ignore */ } }
};
