/* SECURITY helpers – the ONLY way untrusted text may reach the page is through these.
   Rules: (1) esc() every string that did not come from data.js, (2) numbers go through num(),
   (3) image paths go through safeImg(), (4) user text goes through cleanText() before it is saved. */

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"'`]/g, c => ESC_MAP[c]);

/* Clamp to a whole number in [min, max]; anything that is not a number becomes min */
const num = (v, min = 0, max = 9999) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };

/* Strip control characters and angle brackets, trim and cap the length */
const cleanText = (s, max = 60) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

/* Photos must be local files in img/ with an image extension. Anything else is refused. */
const SAFE_IMG = /^img\/[a-z0-9][a-z0-9._-]{0,80}\.(?:jpe?g|png|webp|avif)$/i;
const safeImg = p => (typeof p === 'string' && SAFE_IMG.test(p) && !p.includes('..') ? p : null);

const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isoDateOk = s => { if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const [y, m, d] = s.split('-').map(Number); const t = new Date(y, m - 1, d); return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d && y >= 2020 && y <= 2100; };
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
