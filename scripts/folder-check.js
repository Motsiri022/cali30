#!/usr/bin/env node
/* "Is my folder set up right?"  Run:  node scripts/folder-check.js            (from the project folder)
                              or:  node folder-check.js C:\path\to\cali30   (give the folder that holds index.html)
   Lists every file index.html needs, which ones are missing, and spots files that were dropped into the wrong place. */
const fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const idx = path.join(root, 'index.html');
if (!fs.existsSync(idx)) { console.log(`No index.html found in ${root}\nGive the folder that contains index.html:  node folder-check.js <folder>`); process.exit(1); }
const html = fs.readFileSync(idx, 'utf8');
const need = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => m[1]);
const cssTxt = ['css/fonts.css'].map(f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch (e) { return ''; } }).join('');
const fonts = [...cssTxt.matchAll(/url\('\.\.\/(fonts\/[^']+)'\)/g)].map(m => m[1]);
const all = [...new Set([...need, ...fonts])];
const missing = all.filter(f => !fs.existsSync(path.join(root, f)));
console.log(`Folder: ${root}\nFiles index.html needs: ${all.length}   found: ${all.length - missing.length}   missing: ${missing.length}\n`);
if (!missing.length) { console.log('OK: every required file is in the right place.\nOpen index.html with Live Server (right-click > Open with Live Server).'); process.exit(0); }
missing.forEach(f => {
  const name = path.basename(f), hit = [];
  const look = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const p = path.join(d, e.name); e.isDirectory() ? look(p) : (e.name === name && hit.push(path.relative(root, p))); } };
  look(root);
  console.log(`MISSING  ${f}` + (hit.length ? `\n         but "${name}" is at: ${hit.join(', ')}  -> move it to ${path.dirname(f)}/` : '\n         not found anywhere in this folder'));
});
console.log('\nFix: make the folders css/, fonts/, js/ and js/mobile/ next to index.html and put each file in its folder (see README.md), or unzip cali30.zip.');
process.exit(1);
