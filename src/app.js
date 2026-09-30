/* EPSO-Logiktrainer: Ablaufsteuerung, Darstellung, Speicherung. */
(function () {
  'use strict';
  const U = window.EPSO_UTIL;
  const esc = U.esc;
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];

  // Testformat AD/427/26 (Quelle: EPSO-Unterlagen zur ersten Testphase, siehe README)
  const SECTIONS = {
    verbal: { title: 'Sprachlogisches Denken', short: 'Sprachlogik', n: 20, minutes: 35 },
    numerical: { title: 'Zahlenlogisches Denken', short: 'Zahlenlogik', n: 10, minutes: 20 },
    abstract: { title: 'Abstraktes Denken', short: 'Abstrakte Logik', n: 10, minutes: 10 },
  };
  const PASS = { verbal: 10, numAbs: 10 };
  const COMPETITION = 'EPSO/AD/427/26';

  const QTYPE = {
    r: 'Welche der folgenden Aussagen ist richtig?',
    f: 'Welche der folgenden Aussagen ist falsch?',
    a: 'Welche der folgenden Aussagen lässt sich aus dem Text ableiten?',
    h: 'Welche Aussage gibt die Kernaussage des Textes am besten wieder?',
  };

  // ---------- Speicher ----------
  const KEY = 'epso-logiktrainer-v1';
  function blankStore() {
    return { history: [], wrong: {}, seen: {}, imported: [], settings: { scale: 1 } };
  }
  function loadStore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blankStore();
      return Object.assign(blankStore(), JSON.parse(raw));
    } catch (e) {
      return blankStore();
    }
  }
  function saveStore() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S.store));
    } catch (e) { /* Speicher nicht verfügbar: Sitzung läuft trotzdem */ }
  }

  const S = { store: loadStore(), session: null, view: 'home', timer: null, calcOpen: false, confirmEnd: false, homeTab: null };

  // ---------- Fragenquellen ----------
  // Antwortreihenfolge mischen; Buchstabenverweise in der Erklärung werden mit umgestellt.
  function shuffleOptions(q) {
    if (q.optionsAreFigures || q.fixedOrder) return q;
    const n = q.options.length;
    const perm = shuffleArr(Array.from({ length: n }, (_, i) => i));
    const newPos = perm.map((_, oldIdx) => perm.indexOf(oldIdx));
    const out = Object.assign({}, q, {
      options: perm.map((i) => q.options[i]),
      correct: newPos[q.correct],
    });
    if (q.explanation) {
      out.explanation = q.explanation.replace(/\b([A-E])\b/g, (m, L) => {
        const old = LETTERS.indexOf(L);
        return old < n ? LETTERS[newPos[old]] : m;
      });
    }
    return out;
  }

  function verbalPool() {
    return (window.EPSO_VERBAL || []).map((v) => ({
      id: v.id,
      section: 'verbal',
      source: 'pool',
      topic: v.topic,
      passage: v.passage,
      stem: QTYPE[v.qtype] || v.qtype,
      options: v.options,
      correct: v.correct,
      explanation: v.explanation,
    }));
  }

  function importedPool(section) {
    return (S.store.imported || []).filter((q) => q.section === section);
  }

  function questionById(id) {
    if (id.startsWith('num-')) return window.EPSO_NUMERICAL.generate(parseInt(id.slice(4), 10));
    if (id.startsWith('abs-')) {
      const p = id.split('-');
      return window.EPSO_ABSTRACT.generate(parseInt(p[1], 10), parseInt(p[2], 10));
    }
    if (id.startsWith('imp-')) return (S.store.imported || []).find((q) => q.id === id) || null;
    const v = verbalPool().find((q) => q.id === id);
    return v ? shuffleOptions(v) : null;
  }

  function pickQuestions(section, n, opts) {
    opts = opts || {};
    const src = opts.sources || { pool: true, generated: true, imported: true };
    let list = [];
    const imp = src.imported ? importedPool(section) : [];
    if (section === 'verbal') {
      const pool = src.pool || src.generated ? verbalPool() : [];
      const cand = pool.concat(imp);
      // Selten gesehene Fragen zuerst, innerhalb gleicher Häufigkeit zufällig
      const seen = S.store.seen || {};
      const shuffled = cand.map((q) => ({ q, k: (seen[q.id] || 0) + Math.random() * 0.9 }));
      shuffled.sort((a, b) => a.k - b.k);
      list = shuffled.slice(0, n).map((x) => shuffleOptions(x.q));
    } else {
      const impShare = src.generated ? Math.min(imp.length, Math.round(n * 0.3)) : Math.min(imp.length, n);
      const seen = S.store.seen || {};
      const impSorted = imp.slice().sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0) + Math.random() - 0.5);
      list = impSorted.slice(0, impShare);
      if (src.generated) {
        while (list.length < n) {
          const seed = U.newSeed();
          const q = section === 'numerical'
            ? window.EPSO_NUMERICAL.generate(seed)
            : window.EPSO_ABSTRACT.generate(seed, opts.difficulty || difficultyMix(list.length, n));
          list.push(q);
        }
      }
      list = shuffleArr(list);
    }
    return list;
  }

  function difficultyMix(i, n) {
    // Prüfungsähnliche Mischung: etwa 30 % leicht, 40 % mittel, 30 % schwer
    const f = i / n;
    return f < 0.3 ? 1 : f < 0.7 ? 2 : 3;
  }

  function shuffleArr(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  // ---------- Sitzungen ----------
  function makePart(section, questions, timed, feedback, minutesOverride) {
    const cfg = SECTIONS[section];
    return {
      section,
      title: cfg.title,
      questions,
      answers: questions.map(() => null),
      flags: questions.map(() => false),
      elim: questions.map(() => []),
      checked: questions.map(() => false),
      times: questions.map(() => 0),
      current: 0,
      timeLimit: timed ? (minutesOverride || cfg.minutes) * 60 : null,
      elapsed: 0,
      feedback,
      submitted: false,
      started: false,
    };
  }

  function startExam() {
    S.session = {
      mode: 'exam',
      label: 'Prüfungssimulation',
      parts: ['verbal', 'numerical', 'abstract'].map((s) => makePart(s, pickQuestions(s, SECTIONS[s].n), true, false)),
      pi: 0,
    };
    go('intro');
  }

  function startSingle(section, opts) {
    const n = opts.n || SECTIONS[section].n;
    const qs = pickQuestions(section, n, opts);
    if (!qs.length) {
      flash('Für diese Auswahl gibt es keine Fragen. Aktiviere eine weitere Quelle.');
      return;
    }
    const timed = opts.mode === 'test';
    const minutes = timed ? Math.max(1, Math.round((SECTIONS[section].minutes * qs.length) / SECTIONS[section].n)) : null;
    S.session = {
      mode: opts.mode,
      label: opts.mode === 'test' ? 'Einzeltest' : 'Übungsmodus',
      parts: [makePart(section, qs, timed, opts.mode === 'practice', minutes)],
      pi: 0,
    };
    go(timed ? 'intro' : 'test');
    if (!timed) beginPart();
  }

  function startWrongReview() {
    const ids = Object.keys(S.store.wrong || {});
    if (!ids.length) {
      flash('Noch keine falsch beantworteten Fragen gespeichert.');
      return;
    }
    const bySec = { verbal: [], numerical: [], abstract: [] };
    shuffleArr(ids).forEach((id) => {
      const q = questionById(id);
      if (q && bySec[q.section]) bySec[q.section].push(q);
    });
    const parts = Object.keys(bySec)
      .filter((s) => bySec[s].length)
      .map((s) => makePart(s, bySec[s].slice(0, 20), false, true));
    S.session = { mode: 'wrong', label: 'Fehler wiederholen', parts, pi: 0 };
    go('test');
    beginPart();
  }

  function part() {
    return S.session.parts[S.session.pi];
  }

  let lastTick = 0;
  function beginPart() {
    const p = part();
    p.started = true;
    lastTick = Date.now();
    clearInterval(S.timer);
    S.timer = setInterval(tick, 500);
    render();
  }

  function tick() {
    if (!S.session || S.view !== 'test') return;
    const p = part();
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    p.elapsed += dt;
    p.times[p.current] += dt;
    if (p.timeLimit && p.elapsed >= p.timeLimit) {
      p.elapsed = p.timeLimit;
      submitPart(true);
      return;
    }
    const el = document.getElementById('timer-val');
    if (el) {
      el.textContent = timerText(p);
      const box = document.getElementById('timer');
      if (box && p.timeLimit) box.classList.toggle('low', p.timeLimit - p.elapsed <= 120);
    }
  }

  function timerText(p) {
    const secs = p.timeLimit ? Math.max(0, Math.ceil(p.timeLimit - p.elapsed)) : Math.floor(p.elapsed);
    const m = Math.floor(secs / 60), s = secs % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function submitPart(auto) {
    const p = part();
    p.submitted = true;
    p.autoSubmitted = !!auto;
    clearInterval(S.timer);
    S.confirmEnd = false;
    recordPart(p);
    if (S.session.pi < S.session.parts.length - 1) {
      S.session.pi++;
      if (S.session.mode === 'exam') go('intro');
      else {
        go('test');
        beginPart();
      }
    } else {
      go('results');
    }
  }

  function recordPart(p) {
    const store = S.store;
    let correct = 0;
    p.questions.forEach((q, i) => {
      store.seen[q.id] = (store.seen[q.id] || 0) + 1;
      const ok = p.answers[i] === q.correct;
      if (ok) correct++;
      if (!ok && p.answers[i] !== null) store.wrong[q.id] = { section: q.section, n: ((store.wrong[q.id] || {}).n || 0) + 1 };
      if (!ok && p.answers[i] === null && S.session.mode !== 'practice') store.wrong[q.id] = { section: q.section, n: ((store.wrong[q.id] || {}).n || 0) + 1 };
      if (ok && store.wrong[q.id]) delete store.wrong[q.id];
    });
    store.history.push({
      date: new Date().toISOString(),
      mode: S.session.mode,
      section: p.section,
      total: p.questions.length,
      correct,
      answered: p.answers.filter((a) => a !== null).length,
      seconds: Math.round(p.elapsed),
      timed: !!p.timeLimit,
    });
    if (store.history.length > 500) store.history = store.history.slice(-500);
    // Generierte Aufgaben nicht dauerhaft als "gesehen" sammeln – Pool bleibt klein
    Object.keys(store.seen).forEach((k) => { if (k.startsWith('num-') || k.startsWith('abs-')) delete store.seen[k]; });
    saveStore();
  }

  // ---------- Navigation ----------
  function go(view) {
    S.view = view;
    render();
    window.scrollTo(0, 0);
  }

  function flash(msg) {
    const el = document.getElementById('flash');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(flash.t);
    flash.t = setTimeout(() => (el.hidden = true), 4200);
  }

  // ---------- Darstellung ----------
  const ICON = {
    flag: '<svg viewBox="0 0 16 16" aria-hidden="true"><path class="flagicon" d="M3 1h10v14l-5-3.6L3 15z"/></svg>',
    calc: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.5" y="1.5" width="11" height="13" rx="1.5"/><rect x="4.5" y="3.5" width="7" height="3"/><path d="M5 9h1M8 9h1M11 9h.5M5 12h1M8 12h1M11 12h.5"/></svg>',
    elim: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M3.8 12.2 12.2 3.8"/></svg>',
    zoomIn: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5M5 7h4M7 5v4"/></svg>',
    zoomOut: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5M5 7h4"/></svg>',
    list: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4h9M5 8h9M5 12h9M2 4h.5M2 8h.5M2 12h.5"/></svg>',
    stars: '<svg class="stars" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">' +
      Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return '<circle cx="' + (15 + 11 * Math.sin(a)).toFixed(1) + '" cy="' + (15 - 11 * Math.cos(a)).toFixed(1) + '" r="1.6" fill="#ffcc00"/>';
      }).join('') + '</svg>',
  };

  function topbar(title, sub, right) {
    return '<header class="topbar"><div class="brand">' + ICON.stars + '<div style="min-width:0"><div class="title">' + esc(title) + '</div>' +
      (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div></div><div class="spacer"></div>' + (right || '') + '</header>';
  }

  function render() {
    const app = document.getElementById('app');
    document.documentElement.style.setProperty('--text-scale', S.store.settings.scale || 1);
    let html = '';
    if (S.view === 'home') html = viewHome();
    else if (S.view === 'intro') html = viewIntro();
    else if (S.view === 'test') html = viewTest();
    else if (S.view === 'review') html = viewReview();
    else if (S.view === 'results') html = viewResults();
    app.innerHTML = html + '<div id="flash" class="notice" hidden style="position:fixed;left:16px;right:16px;bottom:80px;z-index:40;max-width:520px;margin:0 auto"></div>';
    if (S.view === 'test' && S.calcOpen && part().section === 'numerical') mountCalc();
  }

  // ----- Startseite -----
  function viewHome() {
    const st = sectionStats();
    const wrongN = Object.keys(S.store.wrong || {}).length;
    const pool = verbalPool().length;
    const imp = (S.store.imported || []).length;
    const tab = S.homeTab || 'start';
    let h = topbar('EPSO Logiktrainer', COMPETITION + ' · Erste Testphase', '<button class="tb-btn" data-act="theme">Hell/Dunkel</button>');
    h += '<main class="page">';
    h += '<section class="hero"><div class="eyebrow">Concours 2026 · Logiktests im November</div><h1>Training für die drei Logiktests im TAO-Format</h1>' +
      '<p>Sprachlogik zählt allein 35 % der Gesamtpunkte. Übe unter echten Zeitbedingungen oder in Ruhe mit Lösungsweg. Alle Tests laufen auf Deutsch.</p></section>';
    h += '<section class="facts">' + ['verbal', 'numerical', 'abstract'].map((s) => {
      const c = SECTIONS[s];
      const x = st[s];
      const acc = x.total ? Math.round((x.correct / x.total) * 100) : null;
      return '<div class="fact"><h3>' + c.title + '</h3><div class="small">' + c.n + ' Fragen · ' + c.minutes + ' Minuten · ' +
        (s === 'verbal' ? 'bestanden ab 10/20' : 'mit ' + (s === 'numerical' ? 'Abstraktem Denken' : 'Zahlenlogik') + ' zusammen ab 10/20') + '</div>' +
        '<div class="big">' + (acc === null ? '–' : acc + ' %') + '</div><div class="small">' + (x.total ? x.correct + ' von ' + x.total + ' richtig in ' + x.sessions + ' Durchgängen' : 'Noch keine Durchgänge') + '</div></div>';
    }).join('') + '</section>';

    h += '<nav class="btnrow" aria-label="Bereiche">' + [['start', 'Training starten'], ['stats', 'Statistik'], ['import', 'Fragen importieren'], ['info', 'Testformat & Hinweise']]
      .map(([k, l]) => '<button class="btn' + (tab === k ? ' primary' : '') + '" data-act="tab" data-tab="' + k + '">' + l + '</button>').join('') + '</nav>';

    if (tab === 'start') {
      h += '<section class="panel"><h2>Prüfung simulieren</h2><p class="lead">Alle drei Tests nacheinander mit Originalzeiten: 20 Fragen Sprachlogik in 35 Minuten, 10 Fragen Zahlenlogik in 20 Minuten und 10 Fragen Abstraktes Denken in 10 Minuten. Die Lösungen siehst du erst nach dem Ende.</p>' +
        '<div class="btnrow"><button class="btn primary" data-act="exam">Prüfungssimulation starten (65 Minuten)</button>' +
        (wrongN ? '<button class="btn" data-act="wrong">Fehler wiederholen (' + wrongN + ')</button>' : '') + '</div></section>';

      h += '<section class="panel"><h2>Einzeln üben</h2><p class="lead">Im Übungsmodus prüfst du jede Antwort sofort und siehst den Lösungsweg. Im Einzeltest läuft die Zeit wie in der Prüfung.</p>' +
        '<div class="form">' +
        field('f-section', 'Test', '<select id="f-section"><option value="verbal">Sprachlogisches Denken</option><option value="numerical">Zahlenlogisches Denken</option><option value="abstract">Abstraktes Denken</option></select>') +
        field('f-mode', 'Modus', '<select id="f-mode"><option value="practice">Übungsmodus (mit Lösungen)</option><option value="test">Einzeltest (mit Zeitlimit)</option></select>') +
        field('f-n', 'Anzahl Fragen', '<select id="f-n"><option value="5">5</option><option value="10" selected>10</option><option value="20">20</option><option value="30">30</option></select>') +
        field('f-diff', 'Schwierigkeit (Abstrakt)', '<select id="f-diff"><option value="0">Gemischt wie in der Prüfung</option><option value="1">Leicht (eine Regel)</option><option value="2">Mittel (zwei Regeln)</option><option value="3">Schwer (drei Regeln)</option></select>') +
        '</div><fieldset style="border:none;padding:0;margin:0;display:grid;gap:6px"><legend class="small" style="font-weight:600;padding:0;margin-bottom:4px">Fragenquellen</legend><div class="checks">' +
        '<label><input type="checkbox" id="src-pool" checked> Fragenpool Sprachlogik (' + pool + ' Texte)</label>' +
        '<label><input type="checkbox" id="src-gen" checked> Generierte Aufgaben (Zahlen/Abstrakt, unbegrenzt)</label>' +
        '<label><input type="checkbox" id="src-imp"' + (imp ? ' checked' : '') + '> Importierte Fragen (' + imp + ')</label></div></fieldset>' +
        '<div class="btnrow"><button class="btn primary" data-act="single">Starten</button></div></section>';
    }
    if (tab === 'stats') h += viewStats();
    if (tab === 'import') h += viewImport();
    if (tab === 'info') h += viewInfo();
    h += '</main>';
    return h;
  }

  function field(id, label, control) {
    return '<div class="field"><label for="' + id + '">' + label + '</label>' + control + '</div>';
  }

  function sectionStats() {
    const out = {};
    ['verbal', 'numerical', 'abstract'].forEach((s) => (out[s] = { total: 0, correct: 0, sessions: 0, seconds: 0, answered: 0 }));
    (S.store.history || []).forEach((h) => {
      const o = out[h.section];
      if (!o) return;
      o.total += h.total;
      o.correct += h.correct;
      o.sessions++;
      o.seconds += h.seconds;
      o.answered += h.answered;
    });
    return out;
  }

  function viewStats() {
    const st = sectionStats();
    let h = '<section class="panel"><h2>Statistik</h2><p class="lead">Die orangefarbene Markierung zeigt die Bestehensgrenze von 50 %. Das Tempo vergleicht deine Zeit pro Frage mit der Zeit, die in der Prüfung pro Frage zur Verfügung steht.</p>';
    h += '<div class="data-wrap"><table class="stats-table"><thead><tr><th>Test</th><th class="num">Durchgänge</th><th class="num">Fragen</th><th class="num">Richtig</th><th>Trefferquote</th><th class="num">Ø Zeit/Frage</th><th class="num">Vorgabe</th></tr></thead><tbody>';
    ['verbal', 'numerical', 'abstract'].forEach((s) => {
      const x = st[s];
      const acc = x.total ? (x.correct / x.total) * 100 : 0;
      const per = x.total ? x.seconds / x.total : 0;
      const target = (SECTIONS[s].minutes * 60) / SECTIONS[s].n;
      h += '<tr><td>' + SECTIONS[s].title + '</td><td class="num">' + x.sessions + '</td><td class="num">' + x.total + '</td><td class="num">' + x.correct + '</td>' +
        '<td><div style="display:flex;align-items:center;gap:8px"><div class="bar" style="flex:1"><i style="width:' + acc.toFixed(1) + '%"></i><b style="left:50%"></b></div><span class="tabular">' + (x.total ? Math.round(acc) + ' %' : '–') + '</span></div></td>' +
        '<td class="num">' + (x.total ? fmtSec(per) : '–') + '</td><td class="num">' + fmtSec(target) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    const recent = (S.store.history || []).slice(-15).reverse();
    if (recent.length) {
      h += '<h3 style="font-size:1rem">Letzte Durchgänge</h3><div class="data-wrap"><table class="stats-table"><thead><tr><th>Datum</th><th>Test</th><th>Modus</th><th class="num">Ergebnis</th><th class="num">Zeit</th></tr></thead><tbody>' +
        recent.map((r) => '<tr><td>' + new Date(r.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) + '</td><td>' + SECTIONS[r.section].short + '</td><td>' + modeName(r.mode) + '</td><td class="num">' + r.correct + '/' + r.total + '</td><td class="num">' + fmtSec(r.seconds) + '</td></tr>').join('') +
        '</tbody></table></div>';
    }
    h += '<h3 style="font-size:1rem">Fortschritt sichern</h3><p class="lead">Dein Fortschritt liegt nur in diesem Browser. Kopiere den Text, um ihn auf einem anderen Gerät unter „Fragen importieren“ einzufügen.</p>' +
      '<div class="btnrow"><button class="btn" data-act="export">Fortschritt als Text anzeigen</button><button class="btn danger" data-act="reset">Statistik zurücksetzen</button></div>' +
      '<div id="export-box"></div></section>';
    return h;
  }

  function modeName(m) {
    return { exam: 'Simulation', test: 'Einzeltest', practice: 'Übung', wrong: 'Fehler' }[m] || m;
  }

  function fmtSec(s) {
    s = Math.round(s);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' min';
  }

  function viewImport() {
    return '<section class="panel"><h2>Fragen importieren</h2>' +
      '<p class="lead">Füge hier eigene oder offizielle Beispielfragen als JSON ein, etwa aus dem EPSO-Beispieltest, den euphorum-Unterlagen oder Webinaren. Importierte Fragen erscheinen mit dem Etikett „Importiert“ und lassen sich als Quelle getrennt auswählen. Hier kannst du auch einen gesicherten Fortschritt wiederherstellen.</p>' +
      '<details><summary class="small" style="cursor:pointer;font-weight:600">Format anzeigen</summary><pre class="small" style="white-space:pre-wrap;background:var(--surface-2);padding:10px;border-radius:6px">[\n  {\n    "section": "verbal",\n    "source": "EPSO-Beispieltest",\n    "passage": "Text …",\n    "stem": "Welche der folgenden Aussagen ist richtig?",\n    "options": ["…", "…", "…", "…"],\n    "correct": 2,\n    "explanation": "…"\n  },\n  {\n    "section": "numerical",\n    "data": "&lt;table&gt;…&lt;/table&gt; (HTML, optional)",\n    "stem": "…", "options": ["…"], "correct": 0\n  }\n]\n\ncorrect = Index der richtigen Antwort, beginnend bei 0.</pre></details>' +
      '<label for="imp-text" class="small" style="font-weight:600">JSON einfügen</label><textarea id="imp-text" placeholder="[ { &quot;section&quot;: &quot;verbal&quot;, … } ]"></textarea>' +
      '<div class="btnrow"><label class="btn" for="imp-file" style="display:inline-block">Datei wählen</label><input type="file" id="imp-file" accept=".json,application/json,text/plain" hidden>' +
      '<button class="btn primary" data-act="import">Importieren</button>' +
      ((S.store.imported || []).length ? '<button class="btn danger" data-act="clear-imp">Importierte Fragen löschen (' + S.store.imported.length + ')</button>' : '') + '</div></section>';
  }

  function viewInfo() {
    return '<section class="panel"><h2>Testformat ' + COMPETITION + '</h2>' +
      '<div class="data-wrap"><table class="stats-table"><thead><tr><th>Test</th><th class="num">Fragen</th><th class="num">Zeit</th><th>Mindestpunktzahl</th><th>Gewichtung</th></tr></thead><tbody>' +
      '<tr><td>Sprachlogisches Denken</td><td class="num">20</td><td class="num">35 min</td><td>10/20</td><td>35 % der Gesamtpunkte</td></tr>' +
      '<tr><td>Zahlenlogisches Denken</td><td class="num">10</td><td class="num">20 min</td><td rowspan="2">zusammen 10/20</td><td rowspan="2">nur bestanden/nicht bestanden</td></tr>' +
      '<tr><td>Abstraktes Denken</td><td class="num">10</td><td class="num">10 min</td></tr></tbody></table></div>' +
      '<div class="notice">Die Zahlen stammen aus Vorbereitungsunterlagen zu AD/427/26. Maßgeblich ist die Bekanntmachung des Auswahlverfahrens (ABl. C/2026/00711). Prüfe sie dort und in deiner Einladung im Candidate Portal.</div>' +
      '<h3 style="font-size:1rem">So funktioniert die Oberfläche (wie in TAO)</h3><ul class="small" style="margin:0;padding-left:1.2em;display:grid;gap:4px">' +
      '<li>Jeder Test hat einen eigenen Countdown. Wenn die Zeit abläuft, wird der Test automatisch abgegeben.</li>' +
      '<li>Über die Navigationsleiste springst du direkt zu jeder Frage. Ausgefüllte Kreise sind beantwortet, das orange Fähnchen markiert Fragen zur Überprüfung.</li>' +
      '<li>Mit dem Durchstreich-Symbol neben einer Antwort schließt du Optionen aus.</li>' +
      '<li>In der Zahlenlogik gibt es einen einfachen Taschenrechner auf dem Bildschirm, keinen wissenschaftlichen.</li>' +
      '<li>Vor der Abgabe siehst du eine Übersicht mit unbeantworteten und markierten Fragen. Abgegebene Tests lassen sich nicht mehr öffnen.</li>' +
      '<li>Falsche Antworten geben keinen Punktabzug. Beantworte deshalb immer alle Fragen.</li></ul>' +
      '<h3 style="font-size:1rem">Tastatur</h3><p class="small muted" style="margin:0">A–E oder 1–5 wählen eine Antwort · ← → blättern · M markiert die Frage · R öffnet den Taschenrechner</p>' +
      '<h3 style="font-size:1rem">Offizielle Übungsquellen</h3><ul class="small" style="margin:0;padding-left:1.2em;display:grid;gap:4px">' +
      '<li><a href="https://eu-careers.europa.eu/de/sample-tests/reasoning-tests-ad" target="_blank" rel="noopener">EPSO-Beispieltest in TAO (20 Fragen)</a></li>' +
      '<li><a href="https://www.euphorum.org/" target="_blank" rel="noopener">European Career Portal 2.0 (euphorum), Demobereich</a></li>' +
      '<li><a href="https://eu-karriere.org/veranstaltungen/logiktest" target="_blank" rel="noopener">Webinare des Seminarbüros</a></li></ul></section>';
  }

  // ----- Einleitung vor jedem Test -----
  function viewIntro() {
    const p = part();
    const cfg = SECTIONS[p.section];
    const idx = S.session.pi + 1, tot = S.session.parts.length;
    let h = topbar(COMPETITION + ' – ' + cfg.title, S.session.label + (tot > 1 ? ' · Test ' + idx + ' von ' + tot : ''));
    h += '<main class="page"><section class="panel"><div class="eyebrow">' + (tot > 1 ? 'Test ' + idx + ' von ' + tot : 'Einzeltest') + '</div><h2 style="font-size:1.6rem">' + cfg.title + '</h2>';
    h += '<p>Dieser Test umfasst <strong>' + p.questions.length + ' Fragen</strong>. Du hast <strong>' + Math.round(p.timeLimit / 60) + ' Minuten</strong> Zeit.</p>';
    const hint = {
      verbal: 'Lies jeden Text und wähle die Aussage, die sich allein aus dem Text ergibt. Verwende kein Vorwissen. Achte auf Einschränkungen wie „einige“, „meist“ oder „bisher“.',
      numerical: 'Beantworte die Fragen anhand der Tabellen und Diagramme. Der Taschenrechner öffnet sich über das Symbol in der Werkzeugleiste oder mit der Taste R.',
      abstract: 'Jede Reihe folgt einer oder mehreren Regeln. Wähle die Figur, die die Reihe fortsetzt.',
    }[p.section];
    h += '<p class="muted">' + hint + '</p>';
    h += '<p class="small muted">Die Zeit läuft ab dem Klick auf „Test beginnen“. Wenn sie abläuft, wird der Test automatisch abgegeben. Für falsche Antworten gibt es keinen Punktabzug.</p>';
    h += '<div class="btnrow"><button class="btn primary" data-act="begin">Test beginnen</button>' + (S.session.pi === 0 ? '<button class="btn" data-act="home">Abbrechen</button>' : '') + '</div></section></main>';
    return h;
  }

  // ----- Testansicht -----
  function viewTest() {
    const p = part();
    const q = p.questions[p.current];
    const cfg = SECTIONS[p.section];
    const practice = p.feedback;
    const timerHtml = '<div class="timer' + (p.timeLimit && p.timeLimit - p.elapsed <= 120 ? ' low' : '') + '" id="timer" title="' + (p.timeLimit ? 'Verbleibende Zeit' : 'Verstrichene Zeit') + '">' +
      '<span class="small" style="font-weight:400">' + (p.timeLimit ? 'Verbleibend' : 'Zeit') + '</span><span id="timer-val">' + timerText(p) + '</span></div>';
    const endBtn = '<button class="tb-btn" data-act="to-review">' + (practice ? 'Beenden' : 'Test beenden') + '</button>';
    let h = topbar(COMPETITION + ' – ' + cfg.title, S.session.label + (S.session.parts.length > 1 ? ' · Test ' + (S.session.pi + 1) + ' von ' + S.session.parts.length : ''), timerHtml + endBtn);

    h += '<div class="navbar"><div class="qnav" role="navigation" aria-label="Fragen">' + p.questions.map((qq, i) => {
      let cls = 'qdot';
      if (practice && p.checked[i]) cls += p.answers[i] === qq.correct ? ' right' : ' wrong';
      else if (p.answers[i] !== null) cls += ' answered';
      if (p.flags[i]) cls += ' flagged';
      if (i === p.current) cls += ' current';
      return '<button class="' + cls + '" data-act="goto" data-i="' + i + '" aria-label="Frage ' + (i + 1) + (p.answers[i] !== null ? ', beantwortet' : '') + (p.flags[i] ? ', markiert' : '') + '"' + (i === p.current ? ' aria-current="true"' : '') + '>' + (i + 1) + '</button>';
    }).join('') + '</div><div class="legend"><span><i></i>offen</span><span><i class="fill"></i>beantwortet</span><span><i class="flag"></i>markiert</span></div></div>';

    h += '<div class="toolbar">' +
      '<button class="tool" data-act="flag" aria-pressed="' + p.flags[p.current] + '">' + ICON.flag + (p.flags[p.current] ? 'Markierung entfernen' : 'Zur Überprüfung markieren') + '</button>' +
      (p.section === 'numerical' ? '<button class="tool" data-act="calc" aria-pressed="' + S.calcOpen + '">' + ICON.calc + 'Taschenrechner</button>' : '') +
      '<button class="tool" data-act="zoom-out" aria-label="Schrift kleiner">' + ICON.zoomOut + '</button><button class="tool" data-act="zoom-in" aria-label="Schrift größer">' + ICON.zoomIn + '</button>' +
      (!practice ? '<button class="tool" data-act="to-review">' + ICON.list + 'Übersicht</button>' : '') +
      (q.source && q.source !== 'generiert' && q.source !== 'pool' ? '<span class="pill src">' + esc(q.sourceLabel || q.source) + '</span>' : '') +
      '<span class="qcounter">Frage ' + (p.current + 1) + ' von ' + p.questions.length + '</span></div>';

    h += '<main class="stage">' + questionHtml(q, p, p.current, practice) + '</main>';

    const isLast = p.current === p.questions.length - 1;
    let right = '';
    if (practice && !p.checked[p.current]) right = '<button class="btn primary" data-act="check"' + (p.answers[p.current] === null ? ' disabled' : '') + '>Antwort prüfen</button>';
    else if (isLast) right = '<button class="btn primary" data-act="to-review">' + (practice ? 'Auswertung' : 'Zur Übersicht') + '</button>';
    else right = '<button class="btn primary" data-act="next">Weiter</button>';
    h += '<footer class="footer"><button class="btn" data-act="prev"' + (p.current === 0 ? ' disabled' : '') + '>Zurück</button>' + right + '</footer>';
    return h;
  }

  function passageHtml(text) {
    return String(text).split(/\n\s*\n/).map((para) => '<p>' + esc(para.trim()) + '</p>').join('');
  }

  function questionHtml(q, p, i, practice) {
    const ans = p ? p.answers[i] : null;
    const checked = p ? p.checked[i] : true;
    const elim = p ? p.elim[i] : [];
    const showSol = practice && checked;
    const figs = !!q.optionsAreFigures;
    const opts = '<ol class="options' + (figs ? ' figs' : '') + '" role="radiogroup" aria-label="Antwortmöglichkeiten">' + q.options.map((o, k) => {
      let cls = 'opt';
      if (ans === k) cls += ' selected';
      if (elim.includes(k)) cls += ' eliminated';
      if (showSol && k === q.correct) cls += ' correct';
      if (showSol && ans === k && k !== q.correct) cls += ' incorrect';
      const content = figs || q.htmlOptions ? o : esc(o);
      const elimBtn = p && !showSol ? '<button class="elim" data-act="elim" data-k="' + k + '" title="Antwort ausschließen" aria-label="Antwort ' + LETTERS[k] + ' ausschließen">' + ICON.elim + '</button>' : '<span></span>';
      if (figs) {
        return '<li class="' + cls + '" data-act="answer" data-k="' + k + '" role="radio" aria-checked="' + (ans === k) + '" tabindex="0"><span class="otext">' + content + '</span><span class="optfoot"><span class="letter">' + LETTERS[k] + '</span>' + elimBtn + '</span></li>';
      }
      return '<li class="' + cls + '" data-act="answer" data-k="' + k + '" role="radio" aria-checked="' + (ans === k) + '" tabindex="0"><span class="letter">' + LETTERS[k] + '</span><span class="otext">' + content + '</span>' + elimBtn + '</li>';
    }).join('') + '</ol>';

    let fb = '';
    if (showSol) {
      const ok = ans === q.correct;
      fb = '<div class="feedback ' + (ok ? 'good' : 'badf') + '" role="status"><h3>' + (ok ? 'Richtig' : ans === null ? 'Nicht beantwortet' : 'Falsch') + ' – richtig ist ' + LETTERS[q.correct] + '</h3><p>' + esc(q.explanation || 'Keine Erklärung hinterlegt.') + '</p></div>';
    }

    const stem = '<p class="stem">' + esc(q.stem) + '</p>';
    if (q.section === 'verbal') {
      return '<div class="split"><article class="pane material"><div class="passage">' + passageHtml(q.passage) + '</div></article><section class="pane">' + stem + opts + fb + '</section></div>';
    }
    if (q.section === 'numerical') {
      return '<div class="split"><article class="pane material">' + (q.data || '') + (q.passage ? '<div class="passage">' + passageHtml(q.passage) + '</div>' : '') + '</article><section class="pane">' + stem + opts + fb + '</section></div>';
    }
    return '<div class="split single"><section class="pane" style="display:grid;gap:16px">' + (q.data || '') + stem + opts + fb + '</section></div>';
  }

  // ----- Übersicht vor Abgabe -----
  function viewReview() {
    const p = part();
    const cfg = SECTIONS[p.section];
    const unanswered = p.answers.filter((a) => a === null).length;
    const flagged = p.flags.filter(Boolean).length;
    const timerHtml = '<div class="timer' + (p.timeLimit && p.timeLimit - p.elapsed <= 120 ? ' low' : '') + '" id="timer"><span class="small" style="font-weight:400">' + (p.timeLimit ? 'Verbleibend' : 'Zeit') + '</span><span id="timer-val">' + timerText(p) + '</span></div>';
    let h = topbar(COMPETITION + ' – ' + cfg.title, 'Übersicht vor der Abgabe', timerHtml);
    h += '<main class="page"><section class="panel"><h2>Übersicht</h2><p class="lead">' + (p.questions.length - unanswered) + ' von ' + p.questions.length + ' Fragen beantwortet · ' + flagged + ' markiert. Klicke auf eine Frage, um zu ihr zurückzukehren.</p>';
    h += '<div class="review-grid">' + p.questions.map((q, i) => '<button class="review-cell' + (p.answers[i] === null ? ' unanswered' : '') + '" data-act="goto" data-i="' + i + '"><span>Frage ' + (i + 1) + (p.flags[i] ? ' <span style="color:var(--flag)">⚑</span>' : '') + '</span><span class="st">' + (p.answers[i] === null ? 'offen' : 'Antwort ' + LETTERS[p.answers[i]]) + '</span></button>').join('') + '</div>';
    if (S.confirmEnd) {
      h += '<div class="confirm" role="alert"><strong>Test wirklich abgeben?</strong><span class="small">' + (unanswered ? unanswered + ' Frage(n) sind noch unbeantwortet. ' : '') + 'Danach kannst du nichts mehr ändern.</span><div class="btnrow"><button class="btn primary" data-act="submit">Ja, abgeben</button><button class="btn" data-act="cancel-submit">Weiter bearbeiten</button></div></div>';
    }
    h += '<div class="btnrow"><button class="btn" data-act="back-to-test">Zurück zum Test</button><button class="btn primary" data-act="ask-submit">Test abgeben</button>' +
      (S.session.mode !== 'exam' ? '' : '') + '</div></section></main>';
    return h;
  }

  // ----- Ergebnisse -----
  function viewResults() {
    const sess = S.session;
    let h = topbar('Ergebnis – ' + sess.label, COMPETITION, '<button class="tb-btn" data-act="home">Zur Startseite</button>');
    h += '<main class="page">';
    const score = {};
    sess.parts.forEach((p) => (score[p.section] = { c: p.answers.filter((a, i) => a === p.questions[i].correct).length, n: p.questions.length }));
    if (sess.mode === 'exam') {
      const v = score.verbal.c, na = score.numerical.c + score.abstract.c;
      const pv = v >= PASS.verbal, pn = na >= PASS.numAbs;
      h += '<section class="panel"><div class="eyebrow">Prüfungssimulation</div><h2 style="font-size:1.6rem">' + (pv && pn ? 'Mindestpunktzahlen erreicht' : 'Mindestpunktzahl nicht erreicht') + '</h2>' +
        '<div class="facts">' +
        '<div class="fact"><h3>Sprachlogisches Denken</h3><div class="big">' + v + '/20</div><div><span class="pill ' + (pv ? 'pass' : 'fail') + '">' + (pv ? 'bestanden' : 'nicht bestanden') + '</span> <span class="small muted">Grenze 10/20</span></div></div>' +
        '<div class="fact"><h3>Zahlen- + Abstraktes Denken</h3><div class="big">' + na + '/20</div><div><span class="pill ' + (pn ? 'pass' : 'fail') + '">' + (pn ? 'bestanden' : 'nicht bestanden') + '</span> <span class="small muted">Grenze 10/20 zusammen</span></div></div>' +
        '<div class="fact"><h3>Einzelwerte</h3><div class="small">Zahlenlogik ' + score.numerical.c + '/10 · Abstrakt ' + score.abstract.c + '/10</div><div class="small muted">In der Rangliste zählt nur die Sprachlogik (35 % der Gesamtpunkte).</div></div>' +
        '</div></section>';
    } else {
      sess.parts.forEach((p) => {
        const s = score[p.section];
        h += '<section class="panel"><div class="eyebrow">' + esc(sess.label) + '</div><h2 style="font-size:1.4rem">' + p.title + ': ' + s.c + ' von ' + s.n + ' richtig</h2>' +
          '<p class="lead">Trefferquote ' + Math.round((s.c / s.n) * 100) + ' % · Zeit ' + fmtSec(p.elapsed) + ' · im Schnitt ' + fmtSec(p.elapsed / s.n) + ' pro Frage (Vorgabe ' + fmtSec((SECTIONS[p.section].minutes * 60) / SECTIONS[p.section].n) + ')</p></section>';
      });
    }
    sess.parts.forEach((p) => {
      h += '<section class="panel"><h2>' + p.title + ' – Lösungen</h2>' + (p.autoSubmitted ? '<div class="notice">Die Zeit war abgelaufen. Der Test wurde automatisch abgegeben.</div>' : '') + '<div class="reslist">';
      p.questions.forEach((q, i) => {
        const a = p.answers[i];
        const ok = a === q.correct;
        const mk = a === null ? 'n' : ok ? 'r' : 'w';
        const label = q.section === 'verbal' ? (q.topic || 'Text') : (q.stem.length > 90 ? q.stem.slice(0, 88) + '…' : q.stem);
        h += '<details class="resitem"><summary><span class="mark ' + mk + '">' + (mk === 'r' ? '✓' : mk === 'w' ? '✗' : '–') + '</span><strong>Frage ' + (i + 1) + '</strong><span class="muted small" style="min-width:0;flex:1">' + esc(label) + '</span><span class="small tabular">' + (a === null ? 'keine Antwort' : 'deine: ' + LETTERS[a]) + ' · richtig: ' + LETTERS[q.correct] + ' · ' + fmtSec(p.times[i]) + '</span></summary>' +
          '<div class="body">' + questionHtml(q, { answers: p.answers, checked: p.questions.map(() => true), elim: p.questions.map(() => []) }, i, true).replace('pane material', 'pane') + '</div></details>';
      });
      h += '</div></section>';
    });
    h += '<div class="btnrow"><button class="btn primary" data-act="home">Zur Startseite</button>' + (Object.keys(S.store.wrong).length ? '<button class="btn" data-act="wrong">Fehler wiederholen (' + Object.keys(S.store.wrong).length + ')</button>' : '') + '</div></main>';
    return h;
  }

  // ---------- Taschenrechner ----------
  const calc = { expr: '', val: '0', fresh: true, acc: null, op: null, x: null, y: null };
  function mountCalc() {
    let el = document.getElementById('calc');
    if (!el) {
      el = document.createElement('div');
      el.id = 'calc';
      el.className = 'calc';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Taschenrechner');
      document.getElementById('app').appendChild(el);
    }
    const keys = [['C', 'clear'], ['←', 'back'], ['%', 'pct'], ['÷', '/'], ['7'], ['8'], ['9'], ['×', '*'], ['4'], ['5'], ['6'], ['−', '-'], ['1'], ['2'], ['3'], ['+', '+'], ['±', 'neg'], ['0'], [',', '.'], ['=', '=']];
    el.innerHTML = '<header data-drag="1"><span>Taschenrechner</span><button data-act="calc" aria-label="Taschenrechner schließen">×</button></header>' +
      '<div class="disp"><div class="expr" id="calc-expr">' + esc(calc.expr) + '</div><div class="val" id="calc-val">' + esc(calc.val.replace('.', ',')) + '</div></div>' +
      '<div class="keys">' + keys.map(([l, k]) => '<button data-calc="' + (k || l) + '" class="' + (['/', '*', '-', '+', 'pct'].includes(k) ? 'op' : k === '=' ? 'eq' : '') + '">' + l + '</button>').join('') + '</div>';
    if (calc.x !== null) { el.style.left = calc.x + 'px'; el.style.top = calc.y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; }
  }

  function calcPress(k) {
    const num = () => parseFloat(calc.val);
    const apply = (a, b, op) => (op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : op === '/' ? (b === 0 ? NaN : a / b) : b);
    const sym = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    if (/^[0-9]$/.test(k)) {
      if (calc.fresh) { calc.val = k; calc.fresh = false; } else if (calc.val.length < 16) calc.val = calc.val === '0' ? k : calc.val + k;
    } else if (k === '.') {
      if (calc.fresh) { calc.val = '0.'; calc.fresh = false; } else if (!calc.val.includes('.')) calc.val += '.';
    } else if (k === 'clear') {
      Object.assign(calc, { expr: '', val: '0', fresh: true, acc: null, op: null });
    } else if (k === 'back') {
      if (!calc.fresh) calc.val = calc.val.length > 1 ? calc.val.slice(0, -1) : '0';
    } else if (k === 'neg') {
      calc.val = String(-num());
    } else if (k === 'pct') {
      // wie ein Tischrechner: 200 + 5 % = 210; allein: Wert / 100
      calc.val = String(calc.acc !== null && (calc.op === '+' || calc.op === '-') ? (calc.acc * num()) / 100 : num() / 100);
      calc.fresh = true;
    } else if (['+', '-', '*', '/'].includes(k)) {
      if (calc.acc !== null && calc.op && !calc.fresh) calc.acc = apply(calc.acc, num(), calc.op);
      else if (calc.acc === null || !calc.op) calc.acc = num();
      calc.op = k;
      calc.expr = fmtCalc(calc.acc) + ' ' + sym[k];
      calc.val = String(calc.acc);
      calc.fresh = true;
    } else if (k === '=') {
      if (calc.op && calc.acc !== null) {
        const b = num();
        const r = apply(calc.acc, b, calc.op);
        calc.expr = fmtCalc(calc.acc) + ' ' + sym[calc.op] + ' ' + fmtCalc(b) + ' =';
        calc.val = String(r);
        calc.acc = null;
        calc.op = null;
        calc.fresh = true;
      }
    }
    const v = parseFloat(calc.val);
    const shown = isNaN(v) ? 'Fehler' : calc.fresh ? fmtCalc(v) : calc.val.replace('.', ',');
    const ev = document.getElementById('calc-val'), ee = document.getElementById('calc-expr');
    if (ev) ev.textContent = shown;
    if (ee) ee.textContent = calc.expr;
  }
  function fmtCalc(v) {
    if (!isFinite(v)) return 'Fehler';
    const r = Math.round(v * 1e10) / 1e10;
    return String(r).replace('.', ',');
  }

  // ---------- Ereignisse ----------
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-calc]');
    if (c) { calcPress(c.dataset.calc); return; }
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    const p = S.session ? part() : null;
    switch (act) {
      case 'theme': {
        const cur = document.documentElement.getAttribute('data-theme');
        const dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
        break;
      }
      case 'tab': S.homeTab = t.dataset.tab; render(); break;
      case 'exam': startExam(); break;
      case 'wrong': startWrongReview(); break;
      case 'single': {
        const section = val('f-section');
        const mode = val('f-mode');
        startSingle(section, {
          mode,
          n: parseInt(val('f-n'), 10),
          difficulty: parseInt(val('f-diff'), 10) || 0,
          sources: { pool: chk('src-pool'), generated: chk('src-gen'), imported: chk('src-imp') },
        });
        break;
      }
      case 'begin': go('test'); beginPart(); break;
      case 'home': clearInterval(S.timer); S.session = null; S.calcOpen = false; go('home'); break;
      case 'answer': {
        if (!p || p.submitted) return;
        if (e.target.closest('.elim')) return;
        if (p.feedback && p.checked[p.current]) return;
        const k = parseInt(t.dataset.k, 10);
        p.answers[p.current] = k;
        p.elim[p.current] = p.elim[p.current].filter((x) => x !== k);
        render();
        break;
      }
      case 'elim': {
        e.stopPropagation();
        const k = parseInt(t.dataset.k, 10);
        const list = p.elim[p.current];
        p.elim[p.current] = list.includes(k) ? list.filter((x) => x !== k) : list.concat([k]);
        if (p.answers[p.current] === k) p.answers[p.current] = null;
        render();
        break;
      }
      case 'flag': p.flags[p.current] = !p.flags[p.current]; render(); break;
      case 'calc': S.calcOpen = !S.calcOpen; if (!S.calcOpen) { const el = document.getElementById('calc'); if (el) el.remove(); } render(); break;
      case 'zoom-in': S.store.settings.scale = Math.min(1.4, (S.store.settings.scale || 1) + 0.1); saveStore(); render(); break;
      case 'zoom-out': S.store.settings.scale = Math.max(0.8, (S.store.settings.scale || 1) - 0.1); saveStore(); render(); break;
      case 'prev': if (p.current > 0) { p.current--; render(); window.scrollTo(0, 0); } break;
      case 'next': if (p.current < p.questions.length - 1) { p.current++; render(); window.scrollTo(0, 0); } break;
      case 'goto': p.current = parseInt(t.dataset.i, 10); if (S.view !== 'test') S.view = 'test'; render(); window.scrollTo(0, 0); break;
      case 'check': p.checked[p.current] = true; render(); break;
      case 'to-review':
        if (p.feedback) { submitPart(false); break; }
        S.confirmEnd = false; go('review'); break;
      case 'back-to-test': go('test'); break;
      case 'ask-submit': S.confirmEnd = true; render(); break;
      case 'cancel-submit': S.confirmEnd = false; render(); break;
      case 'submit': submitPart(false); break;
      case 'import': doImport(); break;
      case 'clear-imp': S.store.imported = []; saveStore(); flash('Importierte Fragen gelöscht.'); render(); break;
      case 'export': {
        const box = document.getElementById('export-box');
        box.innerHTML = '<textarea id="export-text" readonly>' + esc(JSON.stringify({ epsoTrainerBackup: 1, store: S.store })) + '</textarea><div class="btnrow"><button class="btn" data-act="copy-export">Kopieren</button></div>';
        break;
      }
      case 'copy-export': {
        const ta = document.getElementById('export-text');
        navigator.clipboard && navigator.clipboard.writeText(ta.value).then(() => flash('Kopiert.'), () => { ta.select(); flash('Text markiert – bitte mit Strg+C kopieren.'); });
        if (!navigator.clipboard) { ta.select(); flash('Text markiert – bitte mit Strg+C kopieren.'); }
        break;
      }
      case 'reset': {
        if (t.dataset.sure) { S.store.history = []; S.store.wrong = {}; S.store.seen = {}; saveStore(); flash('Statistik zurückgesetzt.'); render(); }
        else { t.dataset.sure = '1'; t.textContent = 'Wirklich zurücksetzen? Nochmals klicken'; }
        break;
      }
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'imp-file' && e.target.files[0]) {
      const fr = new FileReader();
      fr.onload = () => { document.getElementById('imp-text').value = fr.result; flash('Datei geladen – jetzt auf „Importieren“ klicken.'); };
      fr.readAsText(e.target.files[0]);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (S.view !== 'test' || !S.session) {
      if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-act]')) e.target.click();
      return;
    }
    if (e.target.matches && e.target.matches('input, textarea, select')) return;
    const p = part();
    const k = e.key.toLowerCase();
    if (S.calcOpen && p.section === 'numerical' && e.target.closest && e.target.closest('#calc')) {
      return;
    }
    const idx = 'abcde'.indexOf(k) >= 0 ? 'abcde'.indexOf(k) : '12345'.indexOf(k);
    if (idx >= 0 && idx < p.questions[p.current].options.length && !(p.feedback && p.checked[p.current])) {
      p.answers[p.current] = idx;
      render();
    } else if (e.key === 'ArrowRight' && p.current < p.questions.length - 1) { p.current++; render(); }
    else if (e.key === 'ArrowLeft' && p.current > 0) { p.current--; render(); }
    else if (k === 'm') { p.flags[p.current] = !p.flags[p.current]; render(); }
    else if (k === 'r' && p.section === 'numerical') { S.calcOpen = !S.calcOpen; if (!S.calcOpen) { const el = document.getElementById('calc'); if (el) el.remove(); } render(); }
    else if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-act]')) e.target.click();
  });

  // Taschenrechner verschieben
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const hd = e.target.closest('[data-drag]');
    if (!hd || e.target.closest('button')) return;
    const el = document.getElementById('calc');
    const r = el.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    hd.setPointerCapture(e.pointerId);
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const el = document.getElementById('calc');
    calc.x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - drag.dx));
    calc.y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - drag.dy));
    Object.assign(el.style, { left: calc.x + 'px', top: calc.y + 'px', right: 'auto', bottom: 'auto' });
  });
  document.addEventListener('pointerup', () => (drag = null));

  function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
  function chk(id) { const el = document.getElementById(id); return !!(el && el.checked); }

  function doImport() {
    const text = val('imp-text').trim();
    if (!text) { flash('Füge zuerst JSON-Text ein oder wähle eine Datei.'); return; }
    let data;
    try { data = JSON.parse(text); } catch (err) { flash('Das ist kein gültiges JSON: ' + err.message); return; }
    if (data && data.epsoTrainerBackup && data.store) {
      S.store = Object.assign(blankStore(), data.store);
      saveStore();
      flash('Fortschritt wiederhergestellt.');
      render();
      return;
    }
    if (!Array.isArray(data)) data = [data];
    let ok = 0, bad = 0;
    data.forEach((q, i) => {
      if (!q || !SECTIONS[q.section] || !Array.isArray(q.options) || q.options.length < 2 || typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) { bad++; return; }
      const id = 'imp-' + Date.now().toString(36) + '-' + i;
      S.store.imported.push({
        id,
        section: q.section,
        source: 'import',
        sourceLabel: q.source || 'Importiert',
        topic: q.topic || q.source || 'Importiert',
        passage: q.passage || '',
        data: q.data || '',
        stem: q.stem || (q.section === 'abstract' ? 'Welche Figur setzt die Reihe fort?' : QTYPE.r),
        options: q.options,
        htmlOptions: !!q.htmlOptions,
        optionsAreFigures: !!q.optionsAreFigures,
        correct: q.correct,
        explanation: q.explanation || '',
      });
      ok++;
    });
    saveStore();
    flash(ok + ' Fragen importiert' + (bad ? ', ' + bad + ' übersprungen (Pflichtfelder fehlen)' : '') + '.');
    render();
  }

  render();
})();
