// Baut aus src/ zwei Einzeldateien:
//   dist/epso-logiktrainer.html  – vollständiges HTML zum lokalen Öffnen (Doppelklick)
//   dist/artifact.html           – Fragment für die private claude.ai-Seite
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'src');
const dist = path.join(__dirname, '..', 'dist');
fs.mkdirSync(dist, { recursive: true });

const read = (f) => fs.readFileSync(path.join(src, f), 'utf8');
const verbalFiles = fs.readdirSync(path.join(src, 'data')).filter((f) => /^verbal-.*\.js$/.test(f)).sort();
const extraData = ['data/official-sample.js'];
const scripts = ['util.js', 'gen-numerical.js', 'gen-abstract.js', 'data/verbal-core.js']
  .concat(verbalFiles.filter((f) => f !== 'verbal-core.js').map((f) => 'data/' + f))
  .concat(extraData)
  .concat(['app.js']);
// Skript-Tags für die Entwicklungsversion aktualisieren
let index = read('index.html');
index = index.replace(/<!--VERBAL-->[\s\S]*?(?=<script src="app.js">)/, '<!--VERBAL-->\n' + scripts.filter((s) => s.startsWith('data/')).map((s) => '<script src="' + s + '"></script>').join('\n') + '\n');
fs.writeFileSync(path.join(src, 'index.html'), index);

const css = read('styles.css');
const js = scripts.map((f) => '/* ' + f + ' */\n' + read(f).replace(/<\/script/gi, '<\\/script')).join('\n');
const fonts = index.match(/<!--FONTS-->([\s\S]*?)<!--\/FONTS-->/)[1].trim();

const body = '<div id="app"></div>\n<script>\n' + js + '\n</script>\n';
const full = '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>EPSO Logiktrainer</title>\n' + fonts + '\n<style>\n' + css + '\n</style>\n</head>\n<body>\n' + body + '</body>\n</html>\n';
const fragment = '<title>EPSO Logiktrainer</title>\n' + fonts + '\n<style>\n' + css + '\n</style>\n' + body;
fs.writeFileSync(path.join(dist, 'epso-logiktrainer.html'), full);
fs.writeFileSync(path.join(dist, 'artifact.html'), fragment);
const n = (js.match(/\bid:\s*'v-/g) || []).length;
console.log('Gebaut: dist/epso-logiktrainer.html (' + Math.round(full.length / 1024) + ' KB)');
