/* Generator für Aufgaben zum abstrakten Denken im EPSO-Stil:
   Fünf Figuren folgen einer oder mehreren Regeln. Gesucht ist die sechste Figur.
   Die richtige Antwort ergibt sich zwingend aus den Regeln; Distraktoren verletzen genau eine Regel. */
(function (root) {
  'use strict';
  const U = root.EPSO_UTIL || (typeof require !== 'undefined' ? require('./util.js') : null);

  const FILL = { k: '#1a1a1a', w: '#ffffff', g: '#9c9c9c' };
  const FILL_NAME = { k: 'schwarz', w: 'weiß', g: 'grau' };
  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'star', 'cross'];
  const SHAPE_NAME = { circle: 'Kreis', square: 'Quadrat', triangle: 'Dreieck', diamond: 'Raute', pentagon: 'Fünfeck', hexagon: 'Sechseck', star: 'Stern', cross: 'Kreuz' };
  const mod = (a, m) => ((a % m) + m) % m;

  // ---------- Zeichnen ----------
  function poly(n, cx, cy, r, rotDeg) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = ((rotDeg - 90 + (360 / n) * i) * Math.PI) / 180;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }

  function shapeSvg(name, cx, cy, r, fill, rot) {
    const st = ' fill="' + FILL[fill] + '" stroke="#1a1a1a" stroke-width="1.6"';
    rot = rot || 0;
    switch (name) {
      case 'circle':
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r * 0.9 + '"' + st + '/>';
      case 'square':
        return '<polygon points="' + poly(4, cx, cy, r * 1.05, 45 + rot) + '"' + st + '/>';
      case 'diamond':
        return '<polygon points="' + poly(4, cx, cy, r * 1.05, rot) + '"' + st + '/>';
      case 'triangle':
        return '<polygon points="' + poly(3, cx, cy + r * 0.12, r * 1.1, rot) + '"' + st + '/>';
      case 'pentagon':
        return '<polygon points="' + poly(5, cx, cy, r, rot) + '"' + st + '/>';
      case 'hexagon':
        return '<polygon points="' + poly(6, cx, cy, r, rot) + '"' + st + '/>';
      case 'star': {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const rr = i % 2 ? r * 0.45 : r * 1.05;
          const a = ((rot - 90 + 36 * i) * Math.PI) / 180;
          pts.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2));
        }
        return '<polygon points="' + pts.join(' ') + '"' + st + '/>';
      }
      case 'cross': {
        const w = r * 0.36;
        const d = 'M' + (cx - w) + ',' + (cy - r) + 'h' + 2 * w + 'v' + (r - w) + 'h' + (r - w) + 'v' + 2 * w + 'h' + -(r - w) + 'v' + (r - w) + 'h' + -2 * w + 'v' + -(r - w) + 'h' + -(r - w) + 'v' + -2 * w + 'h' + (r - w) + 'z';
        return '<path d="' + d + '"' + st + ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"/>';
      }
      default: {
        // n-Eck mit n Seiten (sides:N)
        const n = parseInt(String(name).split(':')[1], 10);
        return '<polygon points="' + poly(n, cx, cy, r, rot) + '"' + st + '/>';
      }
    }
  }

  const ORBIT = [];
  for (let i = 0; i < 8; i++) {
    const a = ((-90 + 45 * i) * Math.PI) / 180;
    ORBIT.push([50 + 37 * Math.cos(a), 50 + 37 * Math.sin(a)]);
  }

  function renderLayer(L, s) {
    switch (L.type) {
      case 'arrow': {
        const a = s.angle * 45;
        return '<g transform="rotate(' + a + ' 50 50)"><line x1="50" y1="64" x2="50" y2="26" stroke="#1a1a1a" stroke-width="3.2"/>' +
          '<polygon points="50,17 42,29 58,29" fill="' + FILL[s.fill || 'k'] + '" stroke="#1a1a1a" stroke-width="1.6"/>' +
          '<circle cx="50" cy="68" r="4" fill="#1a1a1a"/></g>';
      }
      case 'center':
        return shapeSvg(s.shape, 50, 50, 19, s.fill, s.rot ? s.rot * 45 : 0);
      case 'sides':
        return shapeSvg('sides:' + s.sides, 50, 50, 20, s.fill, 0);
      case 'orbit': {
        const p = ORBIT[s.pos];
        return shapeSvg(s.shape, p[0], p[1], 7.5, s.fill, 0);
      }
      case 'corner': {
        const c = [[4, 4, 1, 1], [96, 4, -1, 1], [96, 96, -1, -1], [4, 96, 1, -1]][s.pos];
        const d = 22;
        return '<polygon points="' + c[0] + ',' + c[1] + ' ' + (c[0] + c[2] * d) + ',' + c[1] + ' ' + c[0] + ',' + (c[1] + c[3] * d) + '" fill="' + FILL[s.fill] + '" stroke="#1a1a1a" stroke-width="1.4"/>';
      }
      case 'count': {
        let out = '';
        const n = s.n;
        const sp = 8.5;
        const x0 = 50 - ((n - 1) * sp) / 2;
        for (let i = 0; i < n; i++) out += shapeSvg(s.shape || 'circle', x0 + i * sp, 89, 3.4, s.fill || 'k', 0);
        return out;
      }
    }
    return '';
  }

  function renderFigure(layers, states, label) {
    let s = '<svg class="fig" viewBox="0 0 100 100" aria-hidden="true"><rect x="1" y="1" width="98" height="98" fill="#ffffff" stroke="#8a8f99" stroke-width="1"/>';
    layers.forEach((L, i) => (s += renderLayer(L, states[i])));
    s += '</svg>';
    return '<figure class="fig-cell">' + s + (label ? '<figcaption>' + label + '</figcaption>' : '') + '</figure>';
  }

  // ---------- Regeln ----------
  // Jede Regel: value(t) für t = 0..5, wrong(): plausible falsche Werte für t = 5, text: Beschreibung.
  function ruleLinear(r, m, stepChoices, v0, what, unitText) {
    const s = r.pick(stepChoices);
    return {
      value: (t) => mod(v0 + s * t, m),
      wrong: () => [mod(v0 + s * 4, m), mod(v0 + s * 6, m), mod(v0 + s * 5 + 1, m), mod(v0 + s * 5 - 1, m), mod(v0 - s * 5, m)],
      text: what + ' ' + unitText(s),
    };
  }

  function ruleAlternating(r, m, v0, what, unitText) {
    const a = r.pick([1, 2]), b = r.pick([a === 1 ? 2 : 1, 3]);
    const val = (t) => mod(v0 + Math.ceil(t / 2) * a + Math.floor(t / 2) * b, m);
    return {
      value: val,
      wrong: () => [val(4), val(6), mod(val(4) + b, m), mod(val(5) + 1, m), mod(val(5) - 1, m)],
      text: what + ' ' + unitText(a) + ' und ' + unitText(b) + ' im Wechsel',
    };
  }

  function ruleCycle(r, list, i0, what, names) {
    const k = list.length;
    return {
      value: (t) => list[mod(i0 + t, k)],
      wrong: () => list.concat(),
      text: what + ' wechselt zyklisch: ' + list.map((x) => names[x] || x).join(' → '),
    };
  }

  function ruleConst(v) {
    return { value: () => v, wrong: () => [], text: null, constant: true };
  }

  const dirText = (s) => {
    const deg = Math.abs(s) * 45;
    return 'um ' + deg + '° ' + (s > 0 ? 'im Uhrzeigersinn' : 'gegen den Uhrzeigersinn');
  };
  const posText = (s) => 'um ' + Math.abs(s) + ' Position' + (Math.abs(s) > 1 ? 'en' : '') + ' ' + (s > 0 ? 'im Uhrzeigersinn' : 'gegen den Uhrzeigersinn');

  // ---------- Ebenen (Layer) mit Attributen ----------
  function makeArrow(r, vary) {
    const v0 = r.int(0, 7);
    const angle = r.chance(0.7)
      ? ruleLinear(r, 8, [1, -1, 2, 3, -3], v0, 'Der Pfeil dreht sich pro Schritt', dirText)
      : ruleAlternating(r, 8, v0, 'Der Pfeil dreht sich abwechselnd', (s) => 'um ' + s * 45 + '°');
    const fillList = r.shuffle(['k', 'w', 'g']).slice(0, r.pick([2, 3]));
    const fill = vary > 1 ? ruleCycle(r, fillList, 0, 'Die Farbe der Pfeilspitze', FILL_NAME) : ruleConst('k');
    return { type: 'arrow', attrs: { angle, fill } };
  }

  function makeCenter(r, vary) {
    const shapes = r.sample(SHAPES, r.pick([3, 4]));
    const fills = r.shuffle(['k', 'w', 'g']).slice(0, r.pick([2, 3]));
    const options = ['shape', 'fill', 'rot'];
    const chosen = r.sample(options, vary);
    const attrs = {};
    attrs.shape = chosen.includes('shape') ? ruleCycle(r, shapes, 0, 'Die zentrale Form', SHAPE_NAME) : ruleConst(chosen.includes('rot') ? r.pick(['triangle', 'pentagon', 'star']) : r.pick(SHAPES));
    attrs.fill = chosen.includes('fill') ? ruleCycle(r, fills, 0, 'Die Füllung der zentralen Form', FILL_NAME) : ruleConst(r.pick(['w', 'g']));
    if (chosen.includes('rot')) {
      if (!chosen.includes('shape')) attrs.shape = ruleConst(r.pick(['triangle', 'pentagon']));
      attrs.rot = ruleLinear(r, 8, [1, -1, 3], 0, 'Die zentrale Form dreht sich pro Schritt', dirText);
      if (chosen.includes('shape')) attrs.shape = ruleCycle(r, r.sample(['triangle', 'pentagon', 'star'], 2), 0, 'Die zentrale Form', SHAPE_NAME);
    } else attrs.rot = ruleConst(0);
    return { type: 'center', attrs };
  }

  function makeSides(r, vary) {
    const start = r.int(3, 4);
    const d = r.pick([1, 1, 2]);
    const maxT5 = start + 5 * d;
    const sides = {
      value: (t) => start + d * t,
      wrong: () => [start + d * 4, start + d * 6, start + d * 5 + 1, start + d * 5 - 1],
      text: 'Die Anzahl der Seiten der zentralen Figur nimmt pro Schritt um ' + d + ' zu (' + start + ' → ' + maxT5 + ')',
    };
    const fills = r.shuffle(['k', 'w', 'g']).slice(0, 2);
    const fill = vary > 1 ? ruleCycle(r, fills, 0, 'Die Füllung', FILL_NAME) : ruleConst('w');
    return { type: 'sides', attrs: { sides, fill } };
  }

  function makeOrbit(r, vary) {
    const v0 = r.int(0, 7);
    const pos = r.chance(0.75)
      ? ruleLinear(r, 8, [1, -1, 2, 3, -2], v0, 'Das kleine Element wandert pro Schritt', posText)
      : ruleAlternating(r, 8, v0, 'Das kleine Element wandert abwechselnd', (s) => 'um ' + s + ' Position' + (s > 1 ? 'en' : ''));
    const shapes = r.sample(['circle', 'square', 'triangle', 'star'], 2);
    const fills = r.shuffle(['k', 'w', 'g']).slice(0, 2);
    const second = vary > 1 ? r.pick(['shape', 'fill']) : null;
    return {
      type: 'orbit',
      attrs: {
        pos,
        shape: second === 'shape' ? ruleCycle(r, shapes, 0, 'Das kleine Element', SHAPE_NAME) : ruleConst(shapes[0]),
        fill: second === 'fill' ? ruleCycle(r, fills, 0, 'Die Farbe des kleinen Elements', FILL_NAME) : ruleConst('k'),
      },
    };
  }

  function makeCorner(r, vary) {
    const v0 = r.int(0, 3);
    const s = r.pick([1, -1, 2]);
    const pos = {
      value: (t) => mod(v0 + s * t, 4),
      wrong: () => [mod(v0 + s * 4, 4), mod(v0 + s * 6, 4), mod(v0 + s * 5 + 1, 4), mod(v0 + s * 5 + 2, 4)],
      text: 'Das Eckdreieck springt pro Schritt ' + (Math.abs(s) === 2 ? 'in die gegenüberliegende Ecke' : 'eine Ecke weiter ' + (s > 0 ? 'im Uhrzeigersinn' : 'gegen den Uhrzeigersinn')),
    };
    const fills = r.shuffle(['k', 'g', 'w']).slice(0, 2);
    const fill = vary > 1 ? ruleCycle(r, fills, 0, 'Die Farbe des Eckdreiecks', FILL_NAME) : ruleConst('k');
    return { type: 'corner', attrs: { pos, fill } };
  }

  function makeCount(r, vary) {
    const kind = r.pick(['lin', 'lin', 'down', 'alt']);
    let value, wrong, text;
    if (kind === 'lin') {
      const s0 = r.int(0, 1);
      value = (t) => s0 + 1 + t;
      wrong = () => [s0 + 5, s0 + 7, s0 + 4, s0 + 8];
      text = 'Die Anzahl der Punkte unten nimmt pro Schritt um 1 zu';
    } else if (kind === 'down') {
      const s0 = r.int(6, 7);
      value = (t) => s0 - t;
      wrong = () => [s0 - 4, s0 - 6, s0 - 3, s0 - 5 + 2].filter((x) => x > 0);
      text = 'Die Anzahl der Punkte unten nimmt pro Schritt um 1 ab';
    } else {
      const a = r.int(1, 2), b = a === 1 ? r.int(3, 4) : r.pick([4, 5]);
      value = (t) => (t % 2 === 0 ? a : b) + (t >= 4 ? 0 : 0);
      wrong = () => [b, a + 1, b - 1, b + 1];
      text = 'Die Anzahl der Punkte unten wechselt zwischen ' + a + ' und ' + b;
    }
    const n = { value, wrong, text };
    const shapes = r.sample(['circle', 'square', 'triangle'], 2);
    const shape = vary > 1 ? ruleCycle(r, shapes, 0, 'Die Form der Punkte unten', SHAPE_NAME) : ruleConst('circle');
    return { type: 'count', attrs: { n, shape, fill: ruleConst('k') } };
  }

  const CENTER = [makeArrow, makeCenter, makeSides];
  const RING = [makeOrbit, makeCorner];

  function buildLayers(r, difficulty) {
    if (difficulty === 1) {
      const f = r.pick([makeArrow, makeCenter, makeSides, makeOrbit, makeCorner]);
      return [f(r, r.chance(0.35) ? 2 : 1)];
    }
    if (difficulty === 2) {
      const combo = r.pick(['cr', 'cs', 'rs', 'cr']);
      if (combo === 'cr') return [r.pick(CENTER)(r, 1), r.pick(RING)(r, r.chance(0.4) ? 2 : 1)];
      if (combo === 'cs') return [r.pick(CENTER)(r, r.chance(0.4) ? 2 : 1), makeCount(r, 1)];
      return [makeCorner(r, 1), makeCount(r, r.chance(0.3) ? 2 : 1)];
    }
    // schwer: drei Ebenen oder zwei Ebenen mit je zwei Regeln
    if (r.chance(0.5)) return [r.pick(CENTER)(r, 2), makeCorner(r, 1), makeCount(r, 1)];
    return [r.pick(CENTER)(r, 2), r.pick(RING)(r, 2)];
  }

  function stateAt(layers, t) {
    return layers.map((L) => {
      const s = {};
      Object.keys(L.attrs).forEach((k) => (s[k] = L.attrs[k].value(t)));
      return s;
    });
  }

  function key(states) {
    return JSON.stringify(states);
  }

  function validState(layers, st) {
    return layers.every((L, i) => {
      const s = st[i];
      if (L.type === 'count') return s.n >= 1 && s.n <= 8;
      if (L.type === 'sides') return s.sides >= 3 && s.sides <= 12;
      return true;
    });
  }

  function generate(seed, difficulty) {
    let out = null;
    for (let k = 0; k < 10; k++) {
      out = generateOnce(seed, difficulty, k);
      if (out.options.length === 5 && out.correct >= 0 && new Set(out.options).size === 5) break;
    }
    return out;
  }

  function generateOnce(seed, difficulty, k) {
    const r = U.rng(seed + k * 1000003);
    difficulty = difficulty || r.pick([1, 2, 2, 3, 3]);
    let layers, seq, answer;
    for (let tries = 0; tries < 20; tries++) {
      layers = buildLayers(r, difficulty);
      seq = [0, 1, 2, 3, 4].map((t) => stateAt(layers, t));
      answer = stateAt(layers, 5);
      // Die Folge muss sich sichtbar verändern und gültig sein.
      const distinct = new Set(seq.map(key)).size;
      if (distinct >= 2 && seq.concat([answer]).every((s) => validState(layers, s))) break;
    }

    // Distraktoren: je genau ein Attribut falsch
    const wrongs = [];
    const seen = new Set([key(answer)]);
    const varying = [];
    layers.forEach((L, li) => Object.keys(L.attrs).forEach((k) => { if (!L.attrs[k].constant) varying.push([li, k]); }));
    const pool = [];
    varying.forEach(([li, k]) => {
      L_wrong(layers[li].attrs[k]).forEach((w) => pool.push([li, k, w]));
    });
    r.shuffle(pool).forEach(([li, k, w]) => {
      if (wrongs.length >= 4) return;
      const st = JSON.parse(JSON.stringify(answer));
      st[li][k] = w;
      const kk = key(st);
      if (seen.has(kk) || !validState(layers, st)) return;
      seen.add(kk);
      wrongs.push(st);
    });
    // Falls zu wenige: zwei Attribute gleichzeitig verfälschen oder Konstante ändern
    let guard = 0;
    while (wrongs.length < 4 && guard++ < 100) {
      const st = JSON.parse(JSON.stringify(answer));
      const li = r.int(0, layers.length - 1);
      const L = layers[li];
      const ks = Object.keys(L.attrs).filter((a) => a !== 'rot' || !L.attrs[a].constant);
      const k = r.pick(ks);
      const cur = st[li][k];
      if (k === 'fill') st[li][k] = r.pick(['k', 'w', 'g'].filter((f) => f !== cur));
      else if (k === 'shape') st[li][k] = r.pick(SHAPES.filter((f) => f !== cur));
      else if (typeof cur === 'number') st[li][k] = cur + r.pick([1, -1, 2]);
      if (L.type === 'arrow' && k === 'angle') st[li][k] = mod(st[li][k], 8);
      if ((L.type === 'orbit') && k === 'pos') st[li][k] = mod(st[li][k], 8);
      if ((L.type === 'corner') && k === 'pos') st[li][k] = mod(st[li][k], 4);
      if (L.type === 'center' && k === 'rot') st[li][k] = mod(st[li][k], 8);
      const kk = key(st);
      if (seen.has(kk) || !validState(layers, st)) continue;
      seen.add(kk);
      wrongs.push(st);
    }

    const all = r.shuffle(wrongs.concat([answer]));
    const correct = all.findIndex((s) => key(s) === key(answer));
    const letters = ['A', 'B', 'C', 'D', 'E'];

    const seriesHtml = '<div class="fig-series">' + seq.map((s, i) => renderFigure(layers, s, String(i + 1))).join('') +
      '<figure class="fig-cell fig-q"><svg class="fig" viewBox="0 0 100 100" aria-hidden="true"><rect x="1" y="1" width="98" height="98" fill="#ffffff" stroke="#8a8f99" stroke-dasharray="4 3"/><text x="50" y="62" text-anchor="middle" font-size="34" fill="#4a5261" font-family="Arial, sans-serif">?</text></svg><figcaption>6</figcaption></figure></div>';

    const rules = [];
    layers.forEach((L) => Object.keys(L.attrs).forEach((k) => { const a = L.attrs[k]; if (!a.constant && a.text) rules.push(a.text + '.'); }));

    return {
      id: 'abs-' + seed + '-' + difficulty,
      seed,
      difficulty,
      section: 'abstract',
      source: 'generiert',
      stem: 'Welche Figur setzt die Reihe fort?',
      data: seriesHtml,
      options: all.map((s) => renderFigure(layers, s, '')),
      optionsAreFigures: true,
      correct,
      explanation: 'Regeln: ' + rules.join(' ') + ' Die richtige Antwort ist ' + letters[correct] + '. Jede falsche Option verletzt mindestens eine dieser Regeln.',
    };

    function L_wrong(attr) {
      const w = attr.wrong();
      return Array.isArray(w) ? w : [];
    }
  }

  const API = { generate };
  root.EPSO_ABSTRACT = API;
  if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
