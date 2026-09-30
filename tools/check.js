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
  // Offizielle deutsche Beispieltexte haben 63–129 Wörter
  if (words < 55 || words > 280) err('Textlänge ' + words + ' Wörter');
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

// Offizieller Beispieltest: Lösungsschlüssel laut Auswertungsansicht der TAO-Plattform (DE, Aufgaben 1–20)
const O = require(path.join(src, 'data', 'official-sample.js'));
const KEY = 'BCACDCCBAADCDDBDCDDC';
let offBad = 0;
if (O.length !== 20) { offBad++; console.log('Beispieltest: erwartet 20 Aufgaben, gefunden', O.length); }
O.forEach((q, i) => {
  const L = 'ABCDE'[q.correct];
  if (L !== KEY[i]) { offBad++; console.log(q.id, 'Lösung', L, 'statt', KEY[i]); }
  const n = q.section === 'verbal' ? 4 : 5;
  if (q.options.length !== n) { offBad++; console.log(q.id, 'Optionen', q.options.length); }
  if (new Set(q.options).size !== n) { offBad++; console.log(q.id, 'doppelte Option'); }
});
// Zahlenaufgaben nachrechnen
const gdp = (rd, pct) => rd / (pct / 100);
const nlfi = gdp(6075, 1.82) / gdp(3725, 3.34), defr = gdp(41100, 2.45) / gdp(24075, 2.15);
const de = (1.02 * (2.52 / 2.45) * (31.2 / 31.4) - 1) * 100, be = (1.03 * (1.89 / 1.97) * (23.5 / 22.9) - 1) * 100;
const checks = [[Math.round(nlfi), 3], [Math.round(defr * 2), 3], [de.toFixed(2), '4.25'], [be.toFixed(2), '1.41'], [24256000 + 17819000, 42075000]];
checks.forEach(([got, want], i) => { if (String(got) !== String(want)) { offBad++; console.log('Zahlenaufgabe', 11 + i, 'ergibt', got, 'erwartet', want); } });
console.log('Beispieltest: 20 Aufgaben, Abweichungen vom offiziellen Schlüssel:', offBad);
bad += offBad;
process.exit(problems || bad ? 1 : 0);
