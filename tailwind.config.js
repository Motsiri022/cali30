/** Tailwind scans these files for class names. Build classes are never created dynamically in JS (no 'grid-cols-' + n),
    because the compiler could not see them. */
module.exports = { content: ['./index.html', './js/**/*.js'], theme: { extend: {} }, plugins: [] };
