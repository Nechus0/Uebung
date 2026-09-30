// Prüft Fragenpool und Generatoren: node tools/check.js
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', 'src');
require(path.join(src, 'util.js'));
require(path.join(src, 'data', 'verbal-core.js'));
fs.readdirSync(path.join(src, 'data')).filter(f => /^verbal-.*\.js$/.test(f) && f !== 'verbal-core.js').sort()
  .forEach(f => require(path.join(src, 'data', f)));
const V = globalThis.EPSO_VERBAL;
let problems = 0;
const ids = new Set(), pos = [0, 0, 0, 0], types = {};
V.forEach(q => {
  const err = (m) => { problems++; console.log(q.id, m); };
  if (ids.has(q.id)) err('doppelte ID'); ids.add(q.id);
  if (!Array.isArray(q.options) || q.options.length !== 4) err('nicht 4 Optionen');
  if (!(q.correct >= 0 && q.correct < 4)) err('ungültiger Index');
  if (!'rfah'.includes(q.qtype)) err('Fragetyp');
  const words = q.passage.split(/\s+/).length;
  if (words < 70 || words > 280) err('Textlänge ' + words + ' Wörter');
  const L = 'ABCD'[q.correct];
  const first = (q.explanation.match(/\b([A-D])\b/) || [])[1];
  if (q.qtype !== 'f' && first !== L) err('Erklärung nennt zuerst ' + first + ', richtig ist ' + L);
  if (q.qtype === 'f' && !new RegExp('\\b' + L + '\\b').test(q.explanation)) err('Erklärung nennt ' + L + ' nicht');
  if (new Set(q.options).size !== 4) err('doppelte Option');
  pos[q.correct]++; types[q.qtype] = (types[q.qtype] || 0) + 1;
});
console.log('Sprachlogik-Aufgaben:', V.length, '| Positionen A-D:', pos.join('/'), '| Typen:', JSON.stringify(types));
const N = require(path.join(src, 'gen-numerical.js')), A = require(path.join(src, 'gen-abstract.js'));
let bad = 0;
for (let s = 1; s <= 2000; s++) {
  const q = N.generate(s), a = A.generate(s);
  [q, a].forEach(x => { if (x.options.length !== 5 || x.correct < 0 || new Set(x.options).size !== 5) bad++; });
}
console.log('Generatoren: 4000 Aufgaben geprüft, fehlerhaft:', bad);
process.exit(problems || bad ? 1 : 0);
