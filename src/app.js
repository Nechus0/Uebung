/* EPSO-Logiktrainer: Ablaufsteuerung, Darstellung, Speicherung.
   Die Testansicht bildet die EPSO-Testplattform (TAO) nach, wie sie der offizielle Beispieltest zeigt:
   Kopfzeile mit Pfad und Countdown, Werkzeuge oben rechts (Notizblock, Textmarker, Taschenrechner,
   Zeilenlineal, Einstellungen), Fragenleiste unten, Lesezeichen, Übersicht mit Abgabe. */
(function () {
  'use strict';
  const U = window.EPSO_UTIL;
  const esc = U.esc;
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];

  // Testformat laut Bekanntmachung EPSO/AD/427/26 (ABl. C/2026/711 vom 5.2.2026), Abschnitt 4.3.2 b, Tabelle 2
  const SECTIONS = {
    verbal: { title: 'Sprachlogisches Denken', short: 'Sprachlogik', n: 20, minutes: 35 },
    numerical: { title: 'Zahlenverständnis', short: 'Zahlen', n: 10, minutes: 20 },
    abstract: { title: 'Abstraktes Denken', short: 'Abstrakt', n: 10, minutes: 10 },
  };
  const SEC_ORDER = ['verbal', 'numerical', 'abstract'];
  const PASS = { verbal: 10, numAbs: 10 };
  const COMPETITION = 'EPSO/AD/427/26';
  const NOTICE_URL = 'https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=OJ:C_202600711';
  const SAMPLE_MINUTES = 30; // offizieller Beispieltest: 20 Fragen, ein Countdown von 30 Minuten

  // Fragestamm wie im offiziellen Beispieltest („zutreffend“); f/h nur im Übungsmodus
  const STEM_TRUE = 'Welche der folgenden Aussagen ist zutreffend?';
  const QTYPE = {
    r: STEM_TRUE,
    a: STEM_TRUE,
    f: 'Welche der folgenden Aussagen ist nicht zutreffend?',
    h: 'Welche Aussage gibt die Kernaussage des Textes am besten wieder?',
  };

  // ---------- Speicher ----------
  const KEY = 'epso-logiktrainer-v1';
  function blankStore() {
    return { history: [], wrong: {}, seen: {}, imported: [], settings: { scale: 1, elim: false } };
  }
  function loadStore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blankStore();
      const st = Object.assign(blankStore(), JSON.parse(raw));
      st.settings = Object.assign({ scale: 1, elim: false }, st.settings || {});
      return st;
    } catch (e) {
      return blankStore();
    }
  }
  function saveStore() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S.store));
    } catch (e) { /* Speicher nicht verfügbar: Sitzung läuft trotzdem */ }
  }

  const S = {
    store: loadStore(), session: null, view: 'home', timer: null, homeTab: null,
    tools: { notes: false, hl: false, calc: false, ruler: false, settings: false },
    overview: false, ovTab: 'all', confirm: false,
  };

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
      qtype: v.qtype,
      topic: v.topic,
      passage: v.passage,
      stem: QTYPE[v.qtype] || v.qtype,
      options: v.options,
      correct: v.correct,
      explanation: v.explanation,
    }));
  }
  function officialPool(section) {
    return (window.EPSO_OFFICIAL || []).filter((q) => !section || q.section === section);
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
    if (id.startsWith('off-')) return officialPool().find((q) => q.id === id) || null;
    if (id.startsWith('imp-')) return (S.store.imported || []).find((q) => q.id === id) || null;
    const v = verbalPool().find((q) => q.id === id);
    return v ? shuffleOptions(v) : null;
  }

  function pickQuestions(section, n, opts) {
    opts = opts || {};
    const src = opts.sources || { pool: true, generated: true, imported: true, official: false };
    const seen = S.store.seen || {};
    const extra = (src.imported ? importedPool(section) : []).concat(src.official ? officialPool(section) : []);
    let list = [];
    if (section === 'verbal') {
      let pool = src.pool ? verbalPool() : [];
      // Prüfungsnah: nur Fragen im Format des offiziellen Tests („Welche Aussage ist zutreffend?“)
      if (opts.examFormat) pool = pool.filter((q) => q.qtype === 'r' || q.qtype === 'a');
      const cand = pool.concat(extra);
      // Selten gesehene Fragen zuerst, innerhalb gleicher Häufigkeit zufällig
      const shuffled = cand.map((q) => ({ q, k: (seen[q.id] || 0) + Math.random() * 0.9 }));
      shuffled.sort((a, b) => a.k - b.k);
      list = shuffled.slice(0, n).map((x) => shuffleOptions(x.q));
    } else {
      const share = src.generated ? Math.min(extra.length, Math.round(n * 0.3)) : Math.min(extra.length, n);
      const sorted = extra.slice().sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0) + Math.random() - 0.5);
      list = sorted.slice(0, share);
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
  function makePart(section, questions, timed, feedback, minutesOverride, title) {
    const cfg = SECTIONS[section];
    return {
      section,
      title: title || (cfg ? cfg.title : 'Beispieltest'),
      questions,
      answers: questions.map(() => null),
      flags: questions.map(() => false),
      elim: questions.map(() => []),
      checked: questions.map(() => false),
      visited: questions.map((_, i) => i === 0),
      hl: questions.map(() => null),
      times: questions.map(() => 0),
      current: 0,
      timeLimit: timed ? (minutesOverride || cfg.minutes) * 60 : null,
      elapsed: 0,
      feedback,
      submitted: false,
      started: false,
    };
  }

  function newSession(mode, label, parts) {
    S.session = { mode, label, parts, pi: 0, notes: '' };
    S.overview = false;
    S.confirm = false;
    Object.keys(S.tools).forEach((k) => (S.tools[k] = false));
  }

  function startExam() {
    newSession('exam', 'Prüfungssimulation', SEC_ORDER.map((s) => makePart(s, pickQuestions(s, SECTIONS[s].n, { examFormat: true }), true, false)));
    go('intro');
  }

  function startSample(practice) {
    const qs = officialPool();
    newSession(practice ? 'practice' : 'sample', practice ? 'Beispieltest – Übungsmodus' : 'EPSO-Beispieltest',
      [makePart('mixed', qs, !practice, !!practice, SAMPLE_MINUTES, 'Beispieltest')]);
    if (practice) { go('test'); beginPart(); } else go('intro');
  }

  function startSingle(section, opts) {
    const n = opts.n || SECTIONS[section].n;
    const qs = pickQuestions(section, n, Object.assign({ examFormat: opts.mode === 'test' }, opts));
    if (!qs.length) {
      flash('Für diese Auswahl gibt es keine Fragen. Aktiviere eine weitere Quelle.');
      return;
    }
    const timed = opts.mode === 'test';
    const minutes = timed ? Math.max(1, Math.round((SECTIONS[section].minutes * qs.length) / SECTIONS[section].n)) : null;
    newSession(opts.mode, opts.mode === 'test' ? 'Einzeltest' : 'Übungsmodus', [makePart(section, qs, timed, opts.mode === 'practice', minutes)]);
    if (timed) go('intro');
    else { go('test'); beginPart(); }
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
    const parts = SEC_ORDER.filter((s) => bySec[s].length).map((s) => makePart(s, bySec[s].slice(0, 20), false, true));
    if (!parts.length) { flash('Die gespeicherten Fragen sind nicht mehr verfügbar.'); return; }
    newSession('wrong', 'Fehler wiederholen', parts);
    go('test');
    beginPart();
  }

  function part() {
    return S.session.parts[S.session.pi];
  }
  function curQ() {
    const p = part();
    return p.questions[p.current];
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
      el.classList.toggle('low', !!p.timeLimit && p.timeLimit - p.elapsed <= 120);
    }
  }

  // Anzeige wie in TAO: „29min 57s“
  function timerText(p) {
    const secs = p.timeLimit ? Math.max(0, Math.ceil(p.timeLimit - p.elapsed)) : Math.floor(p.elapsed);
    const m = Math.floor(secs / 60), s = secs % 60;
    return m + 'min ' + String(s).padStart(2, '0') + 's';
  }

  function submitPart(auto) {
    const p = part();
    p.submitted = true;
    p.autoSubmitted = !!auto;
    clearInterval(S.timer);
    S.confirm = false;
    S.overview = false;
    recordPart(p);
    if (S.session.pi < S.session.parts.length - 1) {
      S.session.pi++;
      if (S.session.mode === 'exam') go('intro');
      else { go('test'); beginPart(); }
    } else {
      Object.keys(S.tools).forEach((k) => (S.tools[k] = false));
      go('results');
    }
  }

  function recordPart(p) {
    const store = S.store;
    const bySec = {};
    p.questions.forEach((q, i) => {
      store.seen[q.id] = (store.seen[q.id] || 0) + 1;
      const ok = p.answers[i] === q.correct;
      const b = bySec[q.section] || (bySec[q.section] = { total: 0, correct: 0, answered: 0, seconds: 0 });
      b.total++;
      if (ok) b.correct++;
      if (p.answers[i] !== null) b.answered++;
      b.seconds += p.times[i];
      const counts = !ok && (p.answers[i] !== null || S.session.mode !== 'practice');
      if (counts) store.wrong[q.id] = { section: q.section, n: ((store.wrong[q.id] || {}).n || 0) + 1 };
      if (ok && store.wrong[q.id]) delete store.wrong[q.id];
    });
    Object.keys(bySec).forEach((sec) => {
      const b = bySec[sec];
      store.history.push({
        date: new Date().toISOString(), mode: S.session.mode, section: sec,
        total: b.total, correct: b.correct, answered: b.answered, seconds: Math.round(b.seconds), timed: !!p.timeLimit,
      });
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

  function gotoQ(i) {
    const p = part();
    if (i < 0 || i >= p.questions.length) return;
    p.current = i;
    p.visited[i] = true;
    S.overview = false;
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

  // ---------- Symbole ----------
  const SV = (d, extra) => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + d + '</svg>';
  const ICON = {
    notes: SV('<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5V2.5h6v1M8.5 9h7M8.5 12.5h7M8.5 16h4.5"/>'),
    hl: SV('<path d="M14.5 4.5l5 5L10 19H5v-5z"/><path d="M4 21.5h16" stroke-width="1.2"/>'),
    calc: SV('<rect x="5" y="2.5" width="14" height="19" rx="1.5"/><rect x="7.5" y="5" width="9" height="3.5"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 15.5h.01M12 15.5h.01M16 15.5h.01M8 19h.01M12 19h.01M16 19h.01" stroke-width="2.4"/>'),
    ruler: SV('<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M6.5 9h11M6.5 12.5h11M6.5 16h7"/>'),
    settings: SV('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>'),
    bookmark: SV('<path d="M7 3.5h10v17l-5-3.8-5 3.8z"/>'),
    bookmarkOn: SV('<path d="M7 3.5h10v17l-5-3.8-5 3.8z" fill="currentColor"/>'),
    prev: SV('<path d="M19 12H5.5M11 6l-6 6 6 6" stroke-width="2.2"/>'),
    next: SV('<path d="M5 12h13.5M13 6l6 6-6 6" stroke-width="2.2"/>'),
    up: SV('<path d="M6 15l6-6 6 6" stroke-width="2.2"/>'),
    close: SV('<path d="M5 5l14 14M19 5L5 19" stroke-width="1.8"/>'),
    back: SV('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-2"/>'),
    send: SV('<path d="M3 11.5L21 3l-6.5 18-3-7.5z"/><path d="M11.5 13.5L21 3"/>'),
    elim: SV('<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>'),
    min: SV('<path d="M5 12h14" stroke-width="2.2"/>'),
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
    document.body.classList.toggle('in-test', S.view === 'test');
    let html = '';
    if (S.view === 'home') html = viewHome();
    else if (S.view === 'intro') html = viewIntro();
    else if (S.view === 'test') html = viewTest();
    else if (S.view === 'results') html = viewResults();
    app.innerHTML = html + '<div id="flash" class="notice flash" hidden></div>';
    if (S.view === 'test') {
      mountFloating();
      // aktuelle Frage in der Leiste sichtbar halten (wichtig auf schmalen Bildschirmen)
      const tr = app.querySelector('.tao-track'), cur = tr && tr.querySelector('.tdot.current');
      if (tr && cur && tr.scrollWidth > tr.clientWidth) tr.scrollLeft = cur.offsetLeft - tr.clientWidth / 2 + cur.offsetWidth / 2;
    } else removeFloating();
  }

  // ----- Startseite -----
  function viewHome() {
    const st = sectionStats();
    const wrongN = Object.keys(S.store.wrong || {}).length;
    const pool = verbalPool().length;
    const imp = (S.store.imported || []).length;
    const off = officialPool().length;
    const tab = S.homeTab || 'start';
    let h = topbar('EPSO Logiktrainer', COMPETITION + ' · Tests zum logischen Denken', '<button class="tb-btn" data-act="theme">Hell/Dunkel</button>');
    h += '<main class="page">';
    h += '<section class="hero"><div class="eyebrow">Auswahlverfahren ' + COMPETITION + ' · Beamte AD 5</div><h1>Training für die drei Logiktests im Format der EPSO-Testplattform</h1>' +
      '<p>Wer die Mindestpunktzahlen verfehlt, scheidet aus. Das sprachlogische Denken zählt außerdem 40 % der vorläufigen und 35 % der endgültigen Gesamtpunktzahl. Übe unter Prüfungsbedingungen oder in Ruhe mit Lösungsweg.</p></section>';
    h += '<section class="facts">' + SEC_ORDER.map((s) => {
      const c = SECTIONS[s];
      const x = st[s];
      const acc = x.total ? Math.round((x.correct / x.total) * 100) : null;
      return '<div class="fact"><h3>' + c.title + '</h3><div class="small">' + c.n + ' Fragen · ' + c.minutes + ' Minuten · ' +
        (s === 'verbal' ? 'Mindestpunktzahl 10/20' : 'mit ' + (s === 'numerical' ? 'Abstraktem Denken' : 'Zahlenverständnis') + ' zusammen 10/20') + '</div>' +
        '<div class="big">' + (acc === null ? '–' : acc + ' %') + '</div><div class="small">' + (x.total ? x.correct + ' von ' + x.total + ' richtig in ' + x.sessions + ' Durchgängen' : 'Noch keine Durchgänge') + '</div></div>';
    }).join('') + '</section>';

    h += '<nav class="btnrow" aria-label="Bereiche">' + [['start', 'Training starten'], ['stats', 'Statistik'], ['import', 'Fragen importieren'], ['info', 'Testformat & Hinweise']]
      .map(([k, l]) => '<button class="btn' + (tab === k ? ' primary' : '') + '" data-act="tab" data-tab="' + k + '">' + l + '</button>').join('') + '</nav>';

    if (tab === 'start') {
      h += '<section class="panel"><h2>Prüfung simulieren</h2><p class="lead">Alle drei Tests nacheinander mit den Zeiten aus der Bekanntmachung: 20 Fragen Sprachlogik in 35 Minuten, 10 Fragen Zahlenverständnis in 20 Minuten, 10 Fragen Abstraktes Denken in 10 Minuten. Lösungen gibt es erst am Ende.</p>' +
        '<div class="btnrow"><button class="btn primary" data-act="exam">Prüfungssimulation starten (65 Minuten)</button>' +
        (wrongN ? '<button class="btn" data-act="wrong">Fehler wiederholen (' + wrongN + ')</button>' : '') + '</div></section>';

      h += '<section class="panel official-panel"><h2>Offizieller EPSO-Beispieltest</h2><p class="lead">Die ' + off + ' Aufgaben aus dem deutschen Beispieltest der EPSO-Website, im Original-Wortlaut: 10 Sprachlogik, 5 Zahlenverständnis, 5 Abstraktes Denken, wie dort mit einem gemeinsamen Countdown von 30 Minuten. Gut als Einstieg, um das Niveau der echten Fragen zu sehen.</p>' +
        '<div class="btnrow"><button class="btn primary" data-act="sample">Beispieltest starten (30 Minuten)</button><button class="btn" data-act="sample-practice">Mit Lösungen durchgehen</button></div></section>';

      h += '<section class="panel"><h2>Einzeln üben</h2><p class="lead">Im Übungsmodus prüfst du jede Antwort sofort und siehst den Lösungsweg. Im Einzeltest läuft die Zeit wie in der Prüfung, und es kommen nur Sprachlogik-Fragen im Prüfungsformat („zutreffend“) vor.</p>' +
        '<div class="form">' +
        field('f-section', 'Test', '<select id="f-section"><option value="verbal">Sprachlogisches Denken</option><option value="numerical">Zahlenverständnis</option><option value="abstract">Abstraktes Denken</option></select>') +
        field('f-mode', 'Modus', '<select id="f-mode"><option value="practice">Übungsmodus (mit Lösungen)</option><option value="test">Einzeltest (mit Zeitlimit)</option></select>') +
        field('f-n', 'Anzahl Fragen', '<select id="f-n"><option value="5">5</option><option value="10" selected>10</option><option value="20">20</option><option value="30">30</option></select>') +
        field('f-diff', 'Schwierigkeit (Abstrakt)', '<select id="f-diff"><option value="0">Gemischt wie in der Prüfung</option><option value="1">Leicht (eine Regel)</option><option value="2">Mittel (zwei Regeln)</option><option value="3">Schwer (drei Regeln)</option></select>') +
        '</div><fieldset class="srcset"><legend class="small">Fragenquellen</legend><div class="checks">' +
        '<label><input type="checkbox" id="src-pool" checked> Fragenpool Sprachlogik (' + pool + ' Texte)</label>' +
        '<label><input type="checkbox" id="src-gen" checked> Generierte Aufgaben (Zahlen/Abstrakt, unbegrenzt)</label>' +
        '<label><input type="checkbox" id="src-off"> Offizielle Beispielaufgaben (' + off + ')</label>' +
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
    SEC_ORDER.forEach((s) => (out[s] = { total: 0, correct: 0, sessions: 0, seconds: 0, answered: 0 }));
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
    let h = '<section class="panel"><h2>Statistik</h2><p class="lead">Die orangefarbene Markierung zeigt die Mindestpunktzahl von 50 %. Das Tempo vergleicht deine Zeit pro Frage mit der Zeit, die in der Prüfung pro Frage zur Verfügung steht.</p>';
    h += '<div class="data-wrap"><table class="stats-table"><thead><tr><th>Test</th><th class="num">Durchgänge</th><th class="num">Fragen</th><th class="num">Richtig</th><th>Trefferquote</th><th class="num">Ø Zeit/Frage</th><th class="num">Vorgabe</th></tr></thead><tbody>';
    SEC_ORDER.forEach((s) => {
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
        recent.map((r) => '<tr><td>' + new Date(r.date).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) + '</td><td>' + ((SECTIONS[r.section] || {}).short || r.section) + '</td><td>' + modeName(r.mode) + '</td><td class="num">' + r.correct + '/' + r.total + '</td><td class="num">' + fmtSec(r.seconds) + '</td></tr>').join('') +
        '</tbody></table></div>';
    }
    h += '<h3 style="font-size:1rem">Fortschritt sichern</h3><p class="lead">Dein Fortschritt liegt nur in diesem Browser. Kopiere den Text, um ihn auf einem anderen Gerät unter „Fragen importieren“ einzufügen.</p>' +
      '<div class="btnrow"><button class="btn" data-act="export">Fortschritt als Text anzeigen</button><button class="btn danger" data-act="reset">Statistik zurücksetzen</button></div>' +
      '<div id="export-box"></div></section>';
    return h;
  }

  function modeName(m) {
    return { exam: 'Simulation', test: 'Einzeltest', practice: 'Übung', wrong: 'Fehler', sample: 'Beispieltest' }[m] || m;
  }

  function fmtSec(s) {
    s = Math.round(s);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' min';
  }

  function viewImport() {
    return '<section class="panel"><h2>Fragen importieren</h2>' +
      '<p class="lead">Füge hier eigene Übungsfragen als JSON ein. Importierte Fragen erscheinen mit dem Etikett „Importiert“ und lassen sich als Quelle getrennt auswählen. Hier kannst du auch einen gesicherten Fortschritt wiederherstellen.</p>' +
      '<details><summary class="small" style="cursor:pointer;font-weight:600">Format anzeigen</summary><pre class="small" style="white-space:pre-wrap;background:var(--surface-2);padding:10px;border-radius:6px">[\n  {\n    "section": "verbal",\n    "source": "Webinar März",\n    "passage": "Text …",\n    "stem": "' + STEM_TRUE + '",\n    "options": ["…", "…", "…", "…"],\n    "correct": 2,\n    "explanation": "…"\n  },\n  {\n    "section": "numerical",\n    "data": "&lt;table&gt;…&lt;/table&gt; (HTML, optional)",\n    "stem": "…", "options": ["…", "…", "…", "…", "Keine der oben genannten"], "correct": 0\n  }\n]\n\ncorrect = Index der richtigen Antwort, beginnend bei 0.</pre></details>' +
      '<label for="imp-text" class="small" style="font-weight:600">JSON einfügen</label><textarea id="imp-text" placeholder="[ { &quot;section&quot;: &quot;verbal&quot;, … } ]"></textarea>' +
      '<div class="btnrow"><label class="btn" for="imp-file" style="display:inline-block">Datei wählen</label><input type="file" id="imp-file" accept=".json,application/json,text/plain" hidden>' +
      '<button class="btn primary" data-act="import">Importieren</button>' +
      ((S.store.imported || []).length ? '<button class="btn danger" data-act="clear-imp">Importierte Fragen löschen (' + S.store.imported.length + ')</button>' : '') + '</div></section>';
  }

  function viewInfo() {
    const a = (href, text) => '<a href="' + href + '" target="_blank" rel="noopener">' + text + '</a>';
    return '<section class="panel"><h2>Testformat ' + COMPETITION + '</h2>' +
      '<div class="data-wrap"><table class="stats-table"><thead><tr><th>Test (Sprache 1)</th><th class="num">Fragen</th><th class="num">Zeit</th><th>Mindestpunktzahl</th><th>Gewichtung</th></tr></thead><tbody>' +
      '<tr><td>Sprachlogisches Denken</td><td class="num">20</td><td class="num">35 min</td><td>10 von 20</td><td>40 % der vorläufigen, 35 % der endgültigen Gesamtpunktzahl</td></tr>' +
      '<tr><td>Zahlenverständnis</td><td class="num">10</td><td class="num">20 min</td><td rowspan="2">zusammen 10 von 20</td><td rowspan="2">fließt nicht in die Gesamtpunktzahl ein</td></tr>' +
      '<tr><td>Abstraktes Denken</td><td class="num">10</td><td class="num">10 min</td></tr></tbody></table></div>' +
      '<p class="small muted" style="margin:0">Quelle: Bekanntmachung des Auswahlverfahrens ' + COMPETITION + ', ' + a(NOTICE_URL, 'ABl. C/2026/711 vom 5.2.2026') + ', Abschnitt 4.3.2 Buchstabe b (Tabelle 2) und 4.3.3 (Tabelle 6). Die Tests werden online mit Fernbeaufsichtigung abgelegt. Wer die Mindestpunktzahl verfehlt, wird in den übrigen Tests nicht weiter bewertet.</p>' +
      '<h3 style="font-size:1rem">Die Testoberfläche (wie im offiziellen Beispieltest)</h3><ul class="small" style="margin:0;padding-left:1.2em;display:grid;gap:4px">' +
      '<li>Oben links stehen der Name des Tests, der Countdown und der aktuelle Abschnitt. Läuft die Zeit ab, wird automatisch abgegeben.</li>' +
      '<li>Oben rechts liegen die Werkzeuge: Notizblock, Textmarker, Taschenrechner (Grundrechenarten, Prozent, Vorzeichen), Zeilenlineal und Einstellungen. Der Taschenrechner steht in allen Abschnitten zur Verfügung.</li>' +
      '<li>„Antworten ausschließen“ ist eine Einstellung und standardmäßig ausgeschaltet. Eingeschaltet erscheint neben jeder Option ein Symbol zum Durchstreichen.</li>' +
      '<li>Unten sind alle Fragen als nummerierte Kreise aufgereiht. Mit dem Lesezeichen-Symbol rechts markierst du eine Frage.</li>' +
      '<li>„Übersicht“ zeigt alle Fragen nach Abschnitten, dazu die Filter „Markiert“ und „Unvollständig“. Von dort gibst du den Teil ab; danach lässt sich nichts mehr ändern.</li>' +
      '<li>Sprachlogik: vier Antwortoptionen (A–D), gefragt ist, welche Aussage zutreffend ist. Zahlenverständnis: fünf Optionen, E ist häufig „Keine der oben genannten“. Abstraktes Denken: fünf Bilder einer Reihe und fünf Figuren A–E.</li>' +
      '<li>Beantworte alle Fragen – eine unbeantwortete Frage bringt sicher keinen Punkt.</li></ul>' +
      '<h3 style="font-size:1rem">Tastatur</h3><p class="small muted" style="margin:0">A–E oder 1–5 wählen eine Antwort · ← → blättern · M setzt ein Lesezeichen · R öffnet den Taschenrechner · Esc schließt Fenster</p>' +
      '<h3 style="font-size:1rem">Offizielle Quellen</h3><ul class="small" style="margin:0;padding-left:1.2em;display:grid;gap:4px">' +
      '<li>' + a('https://selection.eu-careers.europa.eu/en/graduates-administrators-ad5', 'EPSO: Tests für AD 5 mit Beispieltests in allen 24 Sprachen') + '</li>' +
      '<li>' + a('https://selection.eu-careers.europa.eu/en/ad5-graduates-selection-process-how-you-are-assessed', 'EPSO: So wird im AD5-Verfahren bewertet') + '</li>' +
      '<li>Barrierefreie Fassungen (Englisch): ' + a('https://selection.eu-careers.europa.eu/system/files/2024-05/AD_Verbal_10Q_DA2.pdf', 'Verbal Reasoning (PDF)') + ', ' + a('https://selection.eu-careers.europa.eu/system/files/2024-05/AD_Numerical_5Q_DA2.pdf', 'Numerical Reasoning (PDF)') + '</li>' +
      '<li>' + a(NOTICE_URL, 'Bekanntmachung EPSO/AD/427/26 auf EUR-Lex') + '</li></ul></section>';
  }

  // ----- Einleitung vor jedem Test -----
  function viewIntro() {
    const p = part();
    const idx = S.session.pi + 1, tot = S.session.parts.length;
    const mixed = p.section === 'mixed';
    let h = topbar(COMPETITION + ' – ' + p.title, S.session.label + (tot > 1 ? ' · Test ' + idx + ' von ' + tot : ''));
    h += '<main class="page"><section class="panel"><div class="eyebrow">' + (tot > 1 ? 'Test ' + idx + ' von ' + tot : esc(S.session.label)) + '</div><h2 style="font-size:1.6rem">' + esc(mixed ? 'Offizieller EPSO-Beispieltest' : p.title) + '</h2>';
    h += '<p>Dieser Teil umfasst <strong>' + p.questions.length + ' Fragen</strong>. Du hast <strong>' + Math.round(p.timeLimit / 60) + ' Minuten</strong> Zeit.</p>';
    const hint = mixed
      ? 'Der Beispieltest besteht aus drei Abschnitten: 10 Fragen Sprachlogik, 5 Fragen Zahlenverständnis und 5 Fragen Abstraktes Denken. Alle Aufgaben stammen wörtlich aus dem deutschen EPSO-Beispieltest.'
      : {
        verbal: 'Lies jeden Text und wähle die Aussage, die zutreffend ist, also sich allein aus dem Text ergibt. Verwende kein Vorwissen. Achte auf Einschränkungen wie „einige“, „meist“, „nicht immer“ oder „nach eigenen Aussagen“.',
        numerical: 'Beantworte die Fragen anhand der Tabellen und Diagramme. Der Taschenrechner öffnet sich über das Symbol oben rechts oder mit der Taste R. Prüfe bei „Keine der oben genannten“, ob dein Ergebnis wirklich nicht unter A–D steht.',
        abstract: 'Jede Aufgabe zeigt fünf Bilder einer Reihe. Wähle unter A–E die Figur, die die Reihe fortsetzt. Oft laufen zwei Regeln gleichzeitig oder zwei Reihen verschränkt.',
      }[p.section];
    h += '<p class="muted">' + hint + '</p>';
    h += '<p class="small muted">Die Zeit läuft ab dem Klick auf „Test beginnen“. Wenn sie abläuft, wird automatisch abgegeben. Werkzeuge findest du oben rechts, die Fragen unten.</p>';
    h += '<div class="btnrow"><button class="btn primary" data-act="begin">Test beginnen</button>' + (S.session.pi === 0 ? '<button class="btn" data-act="home">Abbrechen</button>' : '') + '</div></section></main>';
    return h;
  }

  // ----- Testansicht (TAO) -----
  function secOf(q) {
    return SECTIONS[q.section] ? SECTIONS[q.section].title : q.section;
  }

  function viewTest() {
    const p = part();
    const q = curQ();
    const practice = p.feedback;
    const tot = S.session.parts.length;
    const T = S.tools;
    const tool = (k, label, icon) => '<button class="tao-tool" data-act="tool" data-tool="' + k + '" aria-pressed="' + !!T[k] + '" title="' + label + '" aria-label="' + label + '">' + icon + '</button>';

    let h = '<header class="tao-head">' +
      '<div class="tao-logo" aria-hidden="true">' + ICON.stars + '</div>' +
      '<nav class="tao-crumbs" aria-label="Position im Test">' +
      '<span class="crumb">' + esc(S.session.label) + '</span><span class="sep">/</span>' +
      '<span class="crumb stack"><span>Teil ' + (S.session.pi + 1) + '</span><span class="tao-timer' + (p.timeLimit && p.timeLimit - p.elapsed <= 120 ? ' low' : '') + '" id="timer-val" title="' + (p.timeLimit ? 'Verbleibende Zeit' : 'Verstrichene Zeit') + '">' + timerText(p) + '</span></span><span class="sep">/</span>' +
      '<span class="crumb">' + esc(secOf(q)) + '</span></nav>' +
      '<div class="tao-tools" role="toolbar" aria-label="Werkzeuge">' +
      tool('notes', 'Notizblock', ICON.notes) + tool('hl', 'Textmarker', ICON.hl) + tool('calc', 'Taschenrechner', ICON.calc) +
      tool('ruler', 'Zeilenlineal', ICON.ruler) + tool('settings', 'Einstellungen', ICON.settings) +
      '</div></header>';

    if (T.hl) h += '<div class="tao-hint">Textmarker aktiv: Text markieren zum Hervorheben, auf eine Markierung klicken zum Entfernen.</div>';

    h += '<main class="tao-stage' + (T.hl ? ' hl-on' : '') + '"><div class="sr-only" aria-live="polite">Frage ' + (p.current + 1) + ' von ' + p.questions.length + '</div>' + questionHtml(q, p, p.current, practice) + '</main>';

    h += '<button class="tao-bookmark" data-act="flag" aria-pressed="' + p.flags[p.current] + '" title="' + (p.flags[p.current] ? 'Lesezeichen entfernen' : 'Lesezeichen setzen') + '" aria-label="' + (p.flags[p.current] ? 'Lesezeichen entfernen' : 'Lesezeichen setzen') + '">' + (p.flags[p.current] ? ICON.bookmarkOn : ICON.bookmark) + '</button>';

    h += '<footer class="tao-nav">' +
      (p.current > 0 ? '<button class="tao-round" data-act="prev" aria-label="Vorherige Frage">' + ICON.prev + '</button>' : '<span class="tao-round-ph"></span>') +
      '<div class="tao-track" role="navigation" aria-label="Fragen">' + p.questions.map((qq, i) => dotHtml(p, qq, i, practice)).join('') + '</div>' +
      '<button class="tao-ovbtn" data-act="overview" aria-expanded="' + S.overview + '">' + ICON.up + '<span>Übersicht (' + p.questions.length + ')</span></button>' +
      '<button class="tao-round primary" data-act="next" aria-label="' + (p.current === p.questions.length - 1 ? 'Zur Übersicht' : 'Nächste Frage') + '">' + ICON.next + '</button>' +
      '</footer>';

    if (S.overview) h += overviewHtml(p);
    if (S.confirm) h += confirmHtml(p);
    if (T.settings) h += settingsHtml();
    return h;
  }

  function dotHtml(p, qq, i, practice) {
    let cls = 'tdot';
    if (practice && p.checked[i]) cls += p.answers[i] === qq.correct ? ' right' : ' wrong';
    else if (p.answers[i] !== null) cls += ' answered';
    else if (p.visited[i]) cls += ' seen';
    if (p.flags[i]) cls += ' flagged';
    if (i === p.current) cls += ' current';
    const state = p.answers[i] !== null ? 'beantwortet' : p.visited[i] ? 'nicht beantwortet' : 'noch nicht gesehen';
    return '<button class="' + cls + '" data-act="goto" data-i="' + i + '" aria-label="Frage ' + (i + 1) + ', ' + state + (p.flags[i] ? ', mit Lesezeichen' : '') + '"' + (i === p.current ? ' aria-current="step"' : '') + '>' + (i + 1) + '</button>';
  }

  function overviewHtml(p) {
    const flagged = p.flags.filter(Boolean).length;
    const open = p.answers.filter((a) => a === null).length;
    const tab = S.ovTab;
    const show = (i) => tab === 'all' || (tab === 'flag' && p.flags[i]) || (tab === 'open' && p.answers[i] === null);
    const groups = [];
    p.questions.forEach((q, i) => {
      let g = groups[groups.length - 1];
      if (!g || g.sec !== q.section) groups.push((g = { sec: q.section, items: [] }));
      g.items.push(i);
    });
    let h = '<section class="tao-overlay" role="dialog" aria-label="Übersicht">' +
      '<div class="tao-bar"><button class="tao-x" data-act="overview" aria-label="Übersicht schließen">' + ICON.close + '</button><h2>Übersicht – Teil ' + (S.session.pi + 1) + '</h2></div>' +
      '<div class="tao-ovbody"><div class="tao-tabs" role="tablist">' +
      [['all', 'Alle Fragen'], ['flag', 'Markiert (' + flagged + ')'], ['open', 'Unvollständig (' + open + ')']]
        .map(([k, l]) => '<button role="tab" class="tao-tab" data-act="ovtab" data-tab="' + k + '" aria-selected="' + (tab === k) + '">' + l + '</button>').join('') + '</div>';
    groups.forEach((g) => {
      const items = g.items.filter(show);
      if (!items.length) return;
      h += '<h3 class="tao-group">' + esc(SECTIONS[g.sec] ? SECTIONS[g.sec].title : g.sec) + '</h3><div class="tao-ovdots">' + items.map((i) => dotHtml(p, p.questions[i], i, p.feedback)).join('') + '</div>';
    });
    if (!groups.some((g) => g.items.some(show))) h += '<p class="muted">Keine Fragen in dieser Ansicht.</p>';
    h += '</div><div class="tao-ovfoot"><button class="tao-link" data-act="overview">' + ICON.back + 'Zurück zur Frage</button>' +
      '<button class="tao-pill" data-act="ask-submit">' + (p.feedback ? 'Beenden und auswerten' : 'Diesen Teil abgeben') + ICON.send + '</button></div></section>';
    return h;
  }

  function confirmHtml(p) {
    const open = p.answers.filter((a) => a === null).length;
    const last = S.session.pi === S.session.parts.length - 1;
    return '<div class="tao-modal-bg"><div class="tao-modal" role="alertdialog" aria-labelledby="cf-t">' +
      '<p id="cf-t"><strong>' + (last ? 'Du hast das Ende des Tests erreicht. Möchtest du ' + (p.feedback ? 'die Übung beenden?' : 'den Test wirklich zur Bewertung abgeben?') : 'Möchtest du diesen Teil wirklich abgeben? Danach beginnt der nächste Teil.') + '</strong></p>' +
      (open ? '<p>Du hast noch ' + open + ' unvollständige Frage' + (open === 1 ? '' : 'n') + '. ' + (p.feedback ? '' : 'Nach der Abgabe kannst du keine Antworten mehr ergänzen oder ändern.') + '</p>' : (p.feedback ? '' : '<p>Nach der Abgabe kannst du keine Antworten mehr ändern.</p>')) +
      '<div class="tao-modal-btns"><button class="tao-pill inv" data-act="submit">' + (p.feedback ? 'Beenden' : 'Test abgeben') + '</button><button class="tao-pill fill" data-act="cancel-submit" autofocus>Weiter beantworten</button></div></div></div>';
  }

  function settingsHtml() {
    const st = S.store.settings;
    return '<section class="tao-overlay" role="dialog" aria-label="Einstellungen">' +
      '<div class="tao-bar"><button class="tao-x" data-act="tool" data-tool="settings" aria-label="Einstellungen schließen">' + ICON.close + '</button><h2>Testkonfiguration</h2></div>' +
      '<div class="tao-ovbody narrow"><h3 class="tao-group">Meine Einstellungen</h3>' +
      '<div class="set-row"><div><strong>Antworten ausschließen</strong><p class="small muted">Blendet neben jeder Option ein Symbol ein, mit dem du Antworten durchstreichen kannst.</p></div>' +
      '<button class="switch" role="switch" aria-checked="' + !!st.elim + '" data-act="set-elim"><span class="knob"></span><span class="lbl">' + (st.elim ? 'An' : 'Aus') + '</span></button></div>' +
      '<div class="set-row"><div><strong>Schriftgröße</strong><p class="small muted">Aktuell ' + Math.round((st.scale || 1) * 100) + ' %</p></div><div class="btnrow"><button class="btn" data-act="zoom-out" aria-label="Schrift kleiner">A−</button><button class="btn" data-act="zoom-in" aria-label="Schrift größer">A+</button></div></div>' +
      '<div class="set-row"><div><strong>Darstellung</strong><p class="small muted">Hell oder dunkel (die Aufgaben selbst bleiben auf weißem Grund).</p></div><button class="btn" data-act="theme">Hell/Dunkel</button></div>' +
      '<div class="set-row"><div><strong>Test verlassen</strong><p class="small muted">Bricht den Durchgang ohne Wertung ab.</p></div><button class="btn danger" data-act="quit">Abbrechen</button></div>' +
      '</div></section>';
  }

  // Einspaltiges Layout wie im Beispieltest: Material oben, Frage, Antwortfelder darunter
  function questionHtml(q, p, i, practice) {
    const ans = p ? p.answers[i] : null;
    const checked = p ? p.checked[i] : true;
    const elim = p ? p.elim[i] : [];
    const showSol = practice && checked;
    const figs = !!q.optionsAreFigures;
    const elimOn = p && !showSol && S.store.settings.elim && S.view === 'test';
    const opts = '<ol class="tao-options" role="radiogroup" aria-label="Antwortmöglichkeiten">' + q.options.map((o, k) => {
      let cls = 'tao-opt';
      if (ans === k) cls += ' selected';
      if (elim.includes(k)) cls += ' eliminated';
      if (showSol && k === q.correct) cls += ' correct';
      if (showSol && ans === k && k !== q.correct) cls += ' incorrect';
      const content = figs ? LETTERS[k] : q.htmlOptions ? o : esc(o);
      const elimBtn = elimOn ? '<button class="elim" data-act="elim" data-k="' + k + '" title="Antwort ausschließen" aria-label="Antwort ' + LETTERS[k] + ' ausschließen" aria-pressed="' + elim.includes(k) + '">' + ICON.elim + '</button>' : '';
      return '<li class="' + cls + '" data-act="answer" data-k="' + k + '" role="radio" aria-checked="' + (ans === k) + '" tabindex="0"><span class="radio" aria-hidden="true"></span><span class="letter">' + LETTERS[k] + ')</span><span class="otext">' + content + '</span>' + elimBtn + '</li>';
    }).join('') + '</ol>';

    let fb = '';
    if (showSol) {
      const ok = ans === q.correct;
      fb = '<div class="feedback ' + (ok ? 'good' : 'badf') + '" role="status"><h3>' + (ok ? 'Richtig' : ans === null ? 'Nicht beantwortet' : 'Falsch') + ' – richtig ist ' + LETTERS[q.correct] + '</h3><p>' + esc(q.explanation || 'Keine Erklärung hinterlegt.') + '</p></div>';
    } else if (practice && p) {
      fb = '<div class="btnrow check-row"><button class="btn primary" data-act="check"' + (ans === null ? ' disabled' : '') + '>Antwort prüfen</button></div>';
    }
    const srcTag = q.source === 'official' ? '<span class="pill src">' + esc(q.sourceLabel) + (q.officialNo ? ', Aufgabe ' + q.officialNo : '') + '</span>'
      : q.source === 'import' ? '<span class="pill src">' + esc(q.sourceLabel || 'Importiert') + '</span>' : '';

    // Markierbarer Bereich (Textmarker): Text und Fragestellung
    let zone = '';
    if (q.section === 'verbal' || q.passage) zone += '<div class="passage">' + passageHtml(q.passage || '') + '</div>';
    if (q.stem) zone += '<p class="stem">' + esc(q.stem) + '</p>';
    const hl = p && p.hl ? p.hl[i] : null;
    const zoneHtml = zone ? '<div class="hl-zone" data-i="' + i + '">' + (hl || zone) + '</div>' : '';

    let material = '';
    if (q.section === 'numerical') material = '<div class="tao-data">' + (q.data || '') + '</div>';
    if (figs) {
      material = '<div class="tao-figs">' + (q.data || '') +
        '<div class="fig-options">' + q.options.map((o, k) => '<figure class="fig-opt' + (showSol && k === q.correct ? ' correct' : '') + (ans === k ? ' selected' : '') + '" data-act="answer" data-k="' + k + '"><figcaption>' + LETTERS[k] + '</figcaption>' + o.replace(/^<figure class="fig-cell">|<\/figure>$/g, '') + '</figure>').join('') + '</div></div>';
    } else if (q.section === 'abstract' && q.data) {
      material = '<div class="tao-figs">' + q.data + '</div>';
    }
    return '<div class="tao-q">' + (srcTag ? '<div class="srcline">' + srcTag + '</div>' : '') + material + zoneHtml + opts + fb + '</div>';
  }

  // Der offizielle Test zeigt jeden Text als einen Absatz im Blocksatz
  function passageHtml(text) {
    return '<p>' + esc(String(text).replace(/\s*\n\s*\n\s*/g, ' ').trim()) + '</p>';
  }

  // ----- Ergebnisse -----
  function viewResults() {
    const sess = S.session;
    let h = topbar('Ergebnis – ' + sess.label, COMPETITION, '<button class="tb-btn" data-act="home">Zur Startseite</button>');
    h += '<main class="page">';
    const score = {};
    sess.parts.forEach((p) => p.questions.forEach((q, i) => {
      const s = score[q.section] || (score[q.section] = { c: 0, n: 0 });
      s.n++;
      if (p.answers[i] === q.correct) s.c++;
    }));
    const sc = (k) => score[k] || { c: 0, n: 0 };
    if (sess.mode === 'exam') {
      const v = sc('verbal').c, na = sc('numerical').c + sc('abstract').c;
      const pv = v >= PASS.verbal, pn = na >= PASS.numAbs;
      h += '<section class="panel"><div class="eyebrow">Prüfungssimulation</div><h2 style="font-size:1.6rem">' + (pv && pn ? 'Mindestpunktzahlen erreicht' : 'Mindestpunktzahl nicht erreicht') + '</h2>' +
        '<div class="facts">' +
        '<div class="fact"><h3>Sprachlogisches Denken</h3><div class="big">' + v + '/20</div><div><span class="pill ' + (pv ? 'pass' : 'fail') + '">' + (pv ? 'bestanden' : 'nicht bestanden') + '</span> <span class="small muted">Mindestens 10/20</span></div></div>' +
        '<div class="fact"><h3>Zahlenverständnis + Abstraktes Denken</h3><div class="big">' + na + '/20</div><div><span class="pill ' + (pn ? 'pass' : 'fail') + '">' + (pn ? 'bestanden' : 'nicht bestanden') + '</span> <span class="small muted">Mindestens 10/20 zusammen</span></div></div>' +
        '<div class="fact"><h3>Einzelwerte</h3><div class="small">Zahlenverständnis ' + sc('numerical').c + '/10 · Abstrakt ' + sc('abstract').c + '/10</div><div class="small muted">In die Rangliste geht nur die Sprachlogik ein (40 % vorläufig, 35 % endgültig).</div></div>' +
        '</div></section>';
    } else if (sess.parts[0].section === 'mixed') {
      const tot = SEC_ORDER.reduce((a, k) => a + sc(k).c, 0);
      h += '<section class="panel"><div class="eyebrow">' + esc(sess.label) + '</div><h2 style="font-size:1.6rem">' + tot + ' von ' + sess.parts[0].questions.length + ' richtig</h2>' +
        '<div class="facts">' + SEC_ORDER.map((k) => '<div class="fact"><h3>' + SECTIONS[k].title + '</h3><div class="big">' + sc(k).c + '/' + sc(k).n + '</div><div class="small muted">' + Math.round((sc(k).c / Math.max(1, sc(k).n)) * 100) + ' %</div></div>').join('') + '</div>' +
        '<p class="small muted" style="margin:0">Zeit: ' + fmtSec(sess.parts[0].elapsed) + '. In der echten Prüfung hat jeder Test einen eigenen Countdown (35, 20 und 10 Minuten).</p></section>';
    } else {
      sess.parts.forEach((p) => {
        const s = sc(p.section);
        h += '<section class="panel"><div class="eyebrow">' + esc(sess.label) + '</div><h2 style="font-size:1.4rem">' + esc(p.title) + ': ' + s.c + ' von ' + s.n + ' richtig</h2>' +
          '<p class="lead">Trefferquote ' + Math.round((s.c / Math.max(1, s.n)) * 100) + ' % · Zeit ' + fmtSec(p.elapsed) + ' · im Schnitt ' + fmtSec(p.elapsed / Math.max(1, s.n)) + ' pro Frage (Vorgabe ' + fmtSec((SECTIONS[p.section].minutes * 60) / SECTIONS[p.section].n) + ')</p></section>';
      });
    }
    sess.parts.forEach((p) => {
      h += '<section class="panel"><h2>' + esc(p.title) + ' – Lösungen</h2>' + (p.autoSubmitted ? '<div class="notice">Die Zeit war abgelaufen. Der Test wurde automatisch abgegeben.</div>' : '') + '<div class="reslist">';
      p.questions.forEach((q, i) => {
        const a = p.answers[i];
        const ok = a === q.correct;
        const mk = a === null ? 'n' : ok ? 'r' : 'w';
        const label = q.section === 'verbal' ? (q.topic || 'Text') : q.section === 'abstract' ? 'Figurenreihe' : (q.stem.length > 90 ? q.stem.slice(0, 88) + '…' : q.stem);
        h += '<details class="resitem"><summary><span class="mark ' + mk + '">' + (mk === 'r' ? '✓' : mk === 'w' ? '✗' : '–') + '</span><strong>Frage ' + (i + 1) + '</strong><span class="muted small" style="min-width:0;flex:1">' + esc(label) + '</span><span class="small tabular">' + (a === null ? 'keine Antwort' : 'deine: ' + LETTERS[a]) + ' · richtig: ' + LETTERS[q.correct] + ' · ' + fmtSec(p.times[i]) + '</span></summary>' +
          '<div class="body">' + questionHtml(q, { answers: p.answers, checked: p.questions.map(() => true), elim: p.questions.map(() => []), hl: null }, i, true) + '</div></details>';
      });
      h += '</div></section>';
    });
    h += '<div class="btnrow"><button class="btn primary" data-act="home">Zur Startseite</button>' + (Object.keys(S.store.wrong).length ? '<button class="btn" data-act="wrong">Fehler wiederholen (' + Object.keys(S.store.wrong).length + ')</button>' : '') + '</div></main>';
    return h;
  }

  // ---------- Schwebende Werkzeuge: Taschenrechner, Notizblock, Zeilenlineal ----------
  const pos = {}; // gemerkte Fensterpositionen
  function panelShell(id, title, body, extraCls) {
    let el = document.getElementById(id);
    const fresh = !el;
    if (fresh) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'tao-float ' + (extraCls || '');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', title);
      document.body.appendChild(el);
    }
    el.innerHTML = '<header class="tao-float-head" data-drag="' + id + '"><button data-act="tool" data-tool="' + (id === 'calc' ? 'calc' : 'notes') + '" aria-label="' + title + ' schließen">' + ICON.min + '</button><span>' + title + '</span><span></span></header>' + body;
    if (pos[id]) Object.assign(el.style, { left: pos[id].x + 'px', top: pos[id].y + 'px', right: 'auto', bottom: 'auto' });
    return el;
  }

  function mountFloating() {
    const T = S.tools;
    // Taschenrechner
    if (T.calc) {
      const keys = [['AC', 'clear', 'fn'], ['±', 'neg', 'fn'], ['%', 'pct', 'fn'], ['÷', '/', 'op'], ['7'], ['8'], ['9'], ['×', '*', 'op'], ['4'], ['5'], ['6'], ['−', '-', 'op'], ['1'], ['2'], ['3'], ['+', '+', 'op'], ['0'], ['.', '.'], ['=', '=', 'eq']];
      panelShell('calc', 'Taschenrechner', '<div class="disp"><div class="expr" id="calc-expr">' + esc(calc.expr) + '</div><div class="val" id="calc-val">' + esc(fmtShown()) + '</div></div>' +
        '<div class="keys">' + keys.map(([l, k, c]) => '<button data-calc="' + (k || l) + '" class="' + (c || 'num') + '">' + l + '</button>').join('') + '</div>', 'calc');
    } else removeEl('calc');
    // Notizblock
    if (T.notes) {
      const el = panelShell('notes', 'Notizblock', '<textarea id="notes-ta" aria-label="Notizen" placeholder="Notizen für diesen Durchgang …"></textarea>', 'notes');
      el.querySelector('textarea').value = S.session ? S.session.notes || '' : '';
    } else removeEl('notes');
    // Zeilenlineal
    if (T.ruler) {
      if (!document.getElementById('ruler')) {
        const r = document.createElement('div');
        r.id = 'ruler';
        r.className = 'tao-ruler';
        r.style.top = (rulerY - 24) + 'px';
        document.body.appendChild(r);
      }
    } else removeEl('ruler');
  }
  function removeFloating() { ['calc', 'notes', 'ruler'].forEach(removeEl); }
  function removeEl(id) { const el = document.getElementById(id); if (el) el.remove(); }
  let rulerY = 260;

  // ---------- Taschenrechner (wie TAO: AC, ±, %, Grundrechenarten) ----------
  const calc = { expr: '', val: '0', fresh: true, acc: null, op: null };
  function fmtShown() {
    const v = parseFloat(calc.val);
    return isNaN(v) ? 'Fehler' : calc.fresh ? fmtCalc(v) : calc.val.replace('.', ',');
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
    const ev = document.getElementById('calc-val'), ee = document.getElementById('calc-expr');
    if (ev) ev.textContent = fmtShown();
    if (ee) ee.textContent = calc.expr;
  }
  function fmtCalc(v) {
    if (!isFinite(v)) return 'Fehler';
    const r = Math.round(v * 1e8) / 1e8;
    return String(r).replace('.', ',');
  }

  // ---------- Textmarker ----------
  function applyHighlight() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    const zone = (range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode).closest('.hl-zone');
    if (!zone) return false;
    const walker = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) { const n = walker.currentNode; if (range.intersectsNode(n) && n.nodeValue.length) nodes.push(n); }
    const sc = range.startContainer, so = range.startOffset, ec = range.endContainer, eo = range.endOffset;
    nodes.forEach((n) => {
      let s = 0, e = n.nodeValue.length;
      if (n === sc) s = so;
      if (n === ec) e = eo;
      if (e <= s || !n.nodeValue.slice(s, e).trim()) return;
      if (n.parentNode.closest('mark.hl')) return;
      const mid = n.splitText(s);
      mid.splitText(e - s);
      const m = document.createElement('mark');
      m.className = 'hl';
      mid.parentNode.insertBefore(m, mid);
      m.appendChild(mid);
    });
    sel.removeAllRanges();
    saveHighlight(zone);
    return true;
  }
  function saveHighlight(zone) {
    const p = part();
    p.hl[parseInt(zone.dataset.i, 10)] = zone.innerHTML;
  }

  // ---------- Ereignisse ----------
  function closeTransient() {
    if (S.confirm) { S.confirm = false; return true; }
    if (S.tools.settings) { S.tools.settings = false; return true; }
    if (S.overview) { S.overview = false; return true; }
    return false;
  }

  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-calc]');
    if (c) { calcPress(c.dataset.calc); return; }
    // Textmarker: Klick auf Markierung entfernt sie
    if (S.view === 'test' && S.tools.hl) {
      const m = e.target.closest('.hl-zone mark.hl');
      if (m && window.getSelection().isCollapsed) {
        const zone = m.closest('.hl-zone');
        m.replaceWith(...m.childNodes);
        zone.normalize();
        saveHighlight(zone);
        return;
      }
    }
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
      case 'sample': startSample(false); break;
      case 'sample-practice': startSample(true); break;
      case 'wrong': startWrongReview(); break;
      case 'single': {
        startSingle(val('f-section'), {
          mode: val('f-mode'),
          n: parseInt(val('f-n'), 10),
          difficulty: parseInt(val('f-diff'), 10) || 0,
          sources: { pool: chk('src-pool'), generated: chk('src-gen'), imported: chk('src-imp'), official: chk('src-off') },
        });
        break;
      }
      case 'begin': go('test'); beginPart(); break;
      case 'home': clearInterval(S.timer); S.session = null; go('home'); break;
      case 'quit': clearInterval(S.timer); S.session = null; Object.keys(S.tools).forEach((k) => (S.tools[k] = false)); go('home'); break;
      case 'answer': {
        if (!p || p.submitted || S.view !== 'test') return;
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
      case 'tool': {
        const k = t.dataset.tool;
        S.tools[k] = !S.tools[k];
        if (k === 'settings') S.overview = false;
        render();
        break;
      }
      case 'set-elim': S.store.settings.elim = !S.store.settings.elim; saveStore(); render(); break;
      case 'zoom-in': S.store.settings.scale = Math.min(1.4, Math.round(((S.store.settings.scale || 1) + 0.1) * 10) / 10); saveStore(); render(); break;
      case 'zoom-out': S.store.settings.scale = Math.max(0.8, Math.round(((S.store.settings.scale || 1) - 0.1) * 10) / 10); saveStore(); render(); break;
      case 'prev': gotoQ(p.current - 1); break;
      case 'next':
        if (p.current < p.questions.length - 1) gotoQ(p.current + 1);
        else { S.overview = true; S.ovTab = 'all'; render(); } // wie TAO: nach der letzten Frage öffnet die Übersicht
        break;
      case 'goto': gotoQ(parseInt(t.dataset.i, 10)); break;
      case 'check': p.checked[p.current] = true; render(); break;
      case 'overview': S.overview = !S.overview; S.tools.settings = false; S.ovTab = S.overview ? S.ovTab : 'all'; render(); break;
      case 'ovtab': S.ovTab = t.dataset.tab; render(); break;
      case 'ask-submit': S.confirm = true; render(); break;
      case 'cancel-submit': S.confirm = false; render(); break;
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
        if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(() => flash('Kopiert.'), () => { ta.select(); flash('Text markiert – bitte mit Strg+C kopieren.'); });
        else { ta.select(); flash('Text markiert – bitte mit Strg+C kopieren.'); }
        break;
      }
      case 'reset': {
        if (t.dataset.sure) { S.store.history = []; S.store.wrong = {}; S.store.seen = {}; saveStore(); flash('Statistik zurückgesetzt.'); render(); }
        else { t.dataset.sure = '1'; t.textContent = 'Wirklich zurücksetzen? Nochmals klicken'; }
        break;
      }
    }
  });

  document.addEventListener('mouseup', () => {
    if (S.view === 'test' && S.tools.hl) setTimeout(applyHighlight, 0);
  });
  document.addEventListener('touchend', () => {
    if (S.view === 'test' && S.tools.hl) setTimeout(applyHighlight, 250);
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'notes-ta' && S.session) S.session.notes = e.target.value;
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
    if (e.key === 'Escape') { if (closeTransient()) render(); return; }
    if (e.target.matches && e.target.matches('input, textarea, select')) return;
    if (e.target.closest && e.target.closest('#calc')) return;
    if (S.confirm || S.tools.settings) return;
    const p = part();
    const k = e.key.toLowerCase();
    const q = curQ();
    const idx = 'abcde'.indexOf(k) >= 0 ? 'abcde'.indexOf(k) : '12345'.indexOf(k);
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (idx >= 0 && idx < q.options.length && !(p.feedback && p.checked[p.current])) {
      p.answers[p.current] = idx;
      render();
    } else if (e.key === 'ArrowRight') { if (p.current < p.questions.length - 1) gotoQ(p.current + 1); }
    else if (e.key === 'ArrowLeft') { if (p.current > 0) gotoQ(p.current - 1); }
    else if (k === 'm') { p.flags[p.current] = !p.flags[p.current]; render(); }
    else if (k === 'r') { S.tools.calc = !S.tools.calc; render(); }
    else if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-act]')) e.target.click();
  });

  // Fenster verschieben (Taschenrechner, Notizblock) und Zeilenlineal führen
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const hd = e.target.closest('[data-drag]');
    if (!hd || e.target.closest('button')) return;
    const el = document.getElementById(hd.dataset.drag);
    const r = el.getBoundingClientRect();
    drag = { id: hd.dataset.drag, el, dx: e.clientX - r.left, dy: e.clientY - r.top };
    hd.setPointerCapture(e.pointerId);
  });
  document.addEventListener('pointermove', (e) => {
    if (S.tools.ruler) {
      const r = document.getElementById('ruler');
      rulerY = e.clientY;
      if (r) r.style.top = (e.clientY - r.offsetHeight / 2) + 'px';
    }
    if (!drag) return;
    const x = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - drag.dx));
    const y = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - drag.dy));
    pos[drag.id] = { x, y };
    Object.assign(drag.el.style, { left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' });
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
      S.store.settings = Object.assign({ scale: 1, elim: false }, S.store.settings || {});
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
        stem: q.stem || (q.section === 'abstract' ? '' : STEM_TRUE),
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
