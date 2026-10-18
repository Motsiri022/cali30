/* STATE – shared mutable app state */

Store.load();
const ui = {
  program: Store.data.program, q: '', metric: 'sets', skillDraft: {},       // desktop: program tab, library search, chart metric, skill inputs
  wq: '', wfilter: 'all', wpanel: false, wall: false,                      // mobile Workouts: search, chip, filter panel, show-all
  lq: '', lfilter: 'all', lsaved: false, llimit: 24,                       // mobile Library: search, chip, saved-only, page size
  prange: 'month', pall: false,                                            // mobile Progress: range chip, recent-work expanded
  schedWeek: null, schedSel: null, schedEdit: false,                       // mobile Schedule: week index, selected day, edit panel
  editName: false                                                          // mobile Profile: name editor open
};
let sess = null, tickId = null, lastKey = '';                              // active workout session, timer handle, last route key
const ACTIONS = {};                                                        // data-action name -> handler(button); modules add their own

/* Mobile layout below Tailwind's lg breakpoint (1024px). Missing matchMedia (old browsers/tests) = desktop. */
const MQ = (typeof window.matchMedia === 'function') ? window.matchMedia('(max-width: 1023.98px)') : null;
const isMobile = () => !!(MQ && MQ.matches);
