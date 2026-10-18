#!/usr/bin/env node
/* Runs every *.test.js in its own process and prints one summary table. Also saves tests/last-run.txt. Run: npm test */
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).sort();
let totalPass = 0, totalFail = 0;
const lines = [`Calis30 test run – ${new Date().toISOString()}`, `Node ${process.version}`, ''];
for (const f of files) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(dir, f)], { encoding: 'utf8', timeout: 240000, env: process.env });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/(\d+) passed, (\d+) failed/);
  const pass = m ? +m[1] : 0, fail = m ? +m[2] : 1;
  totalPass += pass; totalFail += fail + (m ? 0 : 0);
  const status = m && fail === 0 && r.status === 0 ? 'OK  ' : 'FAIL';
  lines.push(`${status} ${f.padEnd(28)} ${String(pass).padStart(3)} passed, ${fail} failed  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (status === 'FAIL') out.split('\n').filter(l => /^FAIL|CRASH|Error/.test(l)).slice(0, 12).forEach(l => lines.push('       ' + l.slice(0, 220)));
}
lines.push('', `TOTAL: ${totalPass} passed, ${totalFail} failed`);
const text = lines.join('\n');
console.log(text);
try { fs.writeFileSync(path.join(dir, 'last-run.txt'), text + '\n'); } catch (e) { /* read-only folder: ignore */ }
process.exit(totalFail ? 1 : 0);
