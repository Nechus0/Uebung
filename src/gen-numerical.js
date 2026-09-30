/* Generator für Aufgaben zum Zahlenlogischen Denken im EPSO-Stil.
   Jede Aufgabe: Tabelle oder Diagramm + Frage + 5 Antwortoptionen.
   Alle Lösungen werden aus den angezeigten (gerundeten) Werten berechnet. */
(function (root) {
  'use strict';
  const U = root.EPSO_UTIL || (typeof require !== 'undefined' ? require('./util.js') : null);
  const { fmt, round, numericOptions, textOptions, esc } = U;

  // Länder mit plausiblen Basiswerten (Bevölkerung Mio., BIP Mrd. EUR, Stromerzeugung TWh)
  const COUNTRIES = [
    { n: 'Deutschland', pop: 83.4, gdp: 4120, twh: 510, exp: 1600 },
    { n: 'Frankreich', pop: 68.2, gdp: 2800, twh: 490, exp: 650 },
    { n: 'Italien', pop: 58.9, gdp: 2090, twh: 270, exp: 620 },
    { n: 'Spanien', pop: 48.3, gdp: 1460, twh: 270, exp: 390 },
    { n: 'Polen', pop: 36.7, gdp: 750, twh: 165, exp: 350 },
    { n: 'Rumänien', pop: 19.0, gdp: 320, twh: 57, exp: 95 },
    { n: 'Niederlande', pop: 17.9, gdp: 1030, twh: 120, exp: 710 },
    { n: 'Belgien', pop: 11.8, gdp: 580, twh: 90, exp: 430 },
    { n: 'Tschechien', pop: 10.9, gdp: 300, twh: 75, exp: 210 },
    { n: 'Schweden', pop: 10.6, gdp: 540, twh: 165, exp: 190 },
    { n: 'Portugal', pop: 10.5, gdp: 265, twh: 50, exp: 80 },
    { n: 'Griechenland', pop: 10.4, gdp: 220, twh: 50, exp: 55 },
    { n: 'Ungarn', pop: 9.6, gdp: 195, twh: 35, exp: 140 },
    { n: 'Österreich', pop: 9.1, gdp: 475, twh: 72, exp: 200 },
    { n: 'Bulgarien', pop: 6.4, gdp: 95, twh: 45, exp: 45 },
    { n: 'Dänemark', pop: 5.9, gdp: 390, twh: 33, exp: 140 },
    { n: 'Finnland', pop: 5.6, gdp: 275, twh: 80, exp: 80 },
    { n: 'Slowakei', pop: 5.4, gdp: 130, twh: 30, exp: 110 },
    { n: 'Irland', pop: 5.3, gdp: 510, twh: 32, exp: 230 },
    { n: 'Kroatien', pop: 3.9, gdp: 78, twh: 15, exp: 25 },
    { n: 'Litauen', pop: 2.9, gdp: 72, twh: 5, exp: 40 },
    { n: 'Slowenien', pop: 2.1, gdp: 63, twh: 15, exp: 50 },
    { n: 'Lettland', pop: 1.9, gdp: 40, twh: 6, exp: 20 },
    { n: 'Estland', pop: 1.4, gdp: 38, twh: 8, exp: 20 },
  ];


  // Präpositionen mit Artikel für Länder und Regionen
  const ART = {
    'Niederlande': ['in den Niederlanden', 'der Niederlande'],
    'Schweiz': ['in der Schweiz', 'der Schweiz'],
    'Slowakei': ['in der Slowakei', 'der Slowakei'],
    'Vereinigtes Königreich': ['im Vereinigten Königreich', 'des Vereinigten Königreichs'],
    'Balearen': ['auf den Balearen', 'der Balearen'],
    'Kreta': ['auf Kreta', 'von Kreta'],
    'Toskana': ['in der Toskana', 'der Toskana'],
    'Provence': ['in der Provence', 'der Provence'],
    'Algarve': ['an der Algarve', 'der Algarve'],
  };
  const IN = (n) => (ART[n] ? ART[n][0] : 'in ' + n);
  const VON = (n) => (ART[n] ? ART[n][1] : 'von ' + n);


  function table(caption, head, rows, note) {
    let h = '<div class="data-wrap"><table class="data"><caption>' + caption + '</caption><thead><tr>';
    head.forEach((c, i) => (h += '<th' + (i === 0 ? ' class="rowhead"' : '') + '>' + c + '</th>'));
    h += '</tr></thead><tbody>';
    rows.forEach((r) => {
      h += '<tr>';
      r.forEach((c, i) => (h += i === 0 ? '<th class="rowhead" scope="row">' + c + '</th>' : '<td>' + c + '</td>'));
      h += '</tr>';
    });
    h += '</tbody></table>';
    if (note) h += '<p class="data-note">' + note + '</p>';
    return h + '</div>';
  }

  // Gruppiertes Balkendiagramm als SVG (Werte stehen über den Balken).
  function barChart(title, groups, series, values, unit, dec) {
    // values[g][s]
    const W = 620, H = 300, padL = 50, padR = 10, padT = 34, padB = 58;
    const all = values.flat();
    const maxV = Math.max.apply(null, all);
    const step = niceStep(maxV / 5);
    const top = Math.ceil(maxV / step) * step;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const gw = plotW / groups.length;
    const bw = Math.min(34, (gw * 0.8) / series.length);
    const y = (v) => padT + plotH - (v / top) * plotH;
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + '">';
    s += '<text x="' + W / 2 + '" y="16" text-anchor="middle" class="ch-title">' + esc(title) + '</text>';
    for (let v = 0; v <= top + 1e-9; v += step) {
      s += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="ch-grid"/>';
      s += '<text x="' + (padL - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" class="ch-axis">' + fmt(v, step < 1 ? 1 : 0) + '</text>';
    }
    groups.forEach((g, gi) => {
      const gx = padL + gi * gw + (gw - bw * series.length) / 2;
      series.forEach((_, si) => {
        const v = values[gi][si];
        const x = gx + si * bw;
        s += '<rect x="' + (x + 1) + '" y="' + y(v) + '" width="' + (bw - 2) + '" height="' + (y(0) - y(v)) + '" class="ch-s' + si + '"/>';
        s += '<text x="' + (x + bw / 2) + '" y="' + (y(v) - 4) + '" text-anchor="middle" class="ch-val">' + fmt(v, dec) + '</text>';
      });
      s += '<text x="' + (padL + gi * gw + gw / 2) + '" y="' + (H - padB + 16) + '" text-anchor="middle" class="ch-axis">' + esc(g) + '</text>';
    });
    // Legende
    let lx = padL;
    series.forEach((se, si) => {
      s += '<rect x="' + lx + '" y="' + (H - 18) + '" width="12" height="12" class="ch-s' + si + '"/>';
      s += '<text x="' + (lx + 16) + '" y="' + (H - 8) + '" class="ch-axis">' + esc(se) + '</text>';
      lx += 26 + se.length * 7;
    });
    s += '<text x="8" y="' + (padT - 10) + '" class="ch-axis">' + esc(unit) + '</text>';
    return '<div class="data-wrap">' + s + '</svg></div>';
  }

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }

  function pct(a, b) {
    return (b / a - 1) * 100;
  }

  function q(section, stem, data, opt, explanation, meta) {
    return Object.assign(
      {
        section: 'numerical',
        stem,
        data,
        options: opt.options,
        correct: opt.correct,
        explanation,
      },
      meta || {}
    );
  }

  // ---------- Vorlage 1: Bevölkerungsentwicklung ----------
  function tplPopulation(r) {
    const cs = r.sample(COUNTRIES.slice(0, 20), 5);
    const y0 = r.int(2018, 2021);
    const years = [y0, y0 + 1, y0 + 2, y0 + 3];
    const data = cs.map((c) => {
      let v = c.pop * r.float(0.97, 1.02);
      const g = r.float(-0.012, 0.016);
      return years.map(() => {
        const cur = round(v, 1);
        v = v * (1 + g + r.float(-0.004, 0.004));
        return cur;
      });
    });
    const tbl = table(
      'Bevölkerung ausgewählter EU-Mitgliedstaaten (in Millionen, jeweils zum 1. Januar)',
      ['Land'].concat(years.map(String)),
      cs.map((c, i) => [c.n].concat(data[i].map((v) => fmt(v, 1))))
    );
    const type = r.int(0, 4);
    const i = r.int(0, 4);
    const C = cs[i].n;
    if (type === 0) {
      const a = data[i][0], b = data[i][3];
      const c = pct(a, b);
      if (Math.abs(c) < 0.8) return tplPopulation(r);
      const opt = numericOptions(r, round(c, 1), [((b - a) / b) * 100, c * 3, -c, (b / a) * 10, c / 3, c + 1], 1, { suffix: ' %', minRel: 0.05 });
      return q('numerical', 'Um wie viel Prozent hat sich die Bevölkerung ' + VON(C) + ' zwischen ' + years[0] + ' und ' + years[3] + ' verändert?', tbl, opt,
        '(' + fmt(b, 1) + ' − ' + fmt(a, 1) + ') ÷ ' + fmt(a, 1) + ' × 100 = ' + fmt(c, 2) + ' % ≈ ' + fmt(round(c, 1), 1) + ' %. Bezugsgröße ist immer der Ausgangswert (' + years[0] + ').');
    }
    if (type === 1) {
      const yi = r.int(0, 3);
      const tot = data.reduce((s, row) => s + row[yi], 0);
      const c = (data[i][yi] / tot) * 100;
      const others = tot - data[i][yi];
      const opt = numericOptions(r, round(c, 1), [(data[i][yi] / others) * 100, (data[i][(yi + 1) % 4] / tot) * 100, 100 / 5, c * 1.1, c * 0.9], 1, { suffix: ' %' });
      return q('numerical', 'Welcher Anteil an der Gesamtbevölkerung der fünf aufgeführten Länder entfiel ' + years[yi] + ' auf ' + C + '?', tbl, opt,
        'Summe ' + years[yi] + ': ' + fmt(tot, 1) + ' Mio. Anteil ' + C + ': ' + fmt(data[i][yi], 1) + ' ÷ ' + fmt(tot, 1) + ' × 100 = ' + fmt(c, 2) + ' %.');
    }
    if (type === 2) {
      const a = data[i][2], b = data[i][3];
      const g = b / a;
      const c = b * g * g;
      const opt = numericOptions(r, round(c, 2), [b * g, b + 2 * (b - a), b * g * g * g, a * g * g, b * (1 + 2 * (g - 1)) + 0.01], 2, { suffix: ' Mio.', minRel: 0.0015, maxRel: 0.2 });
      return q('numerical', 'Angenommen, die Bevölkerung ' + VON(C) + ' verändert sich ab ' + years[3] + ' jedes Jahr um denselben Prozentsatz wie zwischen ' + years[2] + ' und ' + years[3] + '. Wie hoch wäre sie dann am 1. Januar ' + (years[3] + 2) + '?', tbl, opt,
        'Wachstumsfaktor: ' + fmt(b, 1) + ' ÷ ' + fmt(a, 1) + ' = ' + fmt(g, 5) + '. Zwei weitere Jahre: ' + fmt(b, 1) + ' × ' + fmt(g, 5) + '² = ' + fmt(c, 3) + ' Mio.');
    }
    if (type === 3) {
      const growth = data.map((row) => pct(row[0], row[3]));
      const sorted = growth.slice().sort((x, y) => y - x);
      if (sorted[0] - sorted[1] < 0.25) return tplPopulation(r);
      const best = growth.indexOf(sorted[0]);
      const opt = { options: cs.map((c) => c.n), correct: best };
      return q('numerical', 'Welches Land verzeichnete zwischen ' + years[0] + ' und ' + years[3] + ' das stärkste relative Bevölkerungswachstum (bzw. den geringsten Rückgang)?', tbl, opt,
        'Veränderungen ' + years[0] + '→' + years[3] + ': ' + cs.map((c, k) => c.n + ' ' + fmt(growth[k], 2) + ' %').join('; ') + '. Maßgeblich ist die relative, nicht die absolute Veränderung.');
    }
    // type 4: Differenz von zwei Ländern in Prozentpunkten
    let j = (i + r.int(1, 4)) % 5;
    const gi = pct(data[i][0], data[i][3]), gj = pct(data[j][0], data[j][3]);
    if (Math.abs(gi - gj) < 0.3) return tplPopulation(r);
    const c = Math.abs(gi - gj);
    const absDiff = Math.abs((data[i][3] - data[i][0]) - (data[j][3] - data[j][0]));
    const opt = numericOptions(r, round(c, 1), [absDiff, c * 2, Math.abs(gi + gj), c / 2, Math.abs(gi) + 1], 1, { suffix: ' Prozentpunkte', positive: true, minRel: 0.06, maxRel: 3 });
    return q('numerical', 'Um wie viele Prozentpunkte unterschied sich die relative Bevölkerungsveränderung zwischen ' + years[0] + ' und ' + years[3] + ' ' + IN(C) + ' von der ' + IN(cs[j].n) + '?', tbl, opt,
      C + ': ' + fmt(gi, 2) + ' %; ' + cs[j].n + ': ' + fmt(gj, 2) + ' %. Differenz: ' + fmt(c, 2) + ' Prozentpunkte.');
  }

  // ---------- Vorlage 2: Außenhandel ----------
  function tplTrade(r) {
    const cs = r.sample(COUNTRIES, 4);
    const y1 = r.int(2019, 2024), y2 = y1 + 1;
    const rows = cs.map((c) => {
      const e1 = round(c.exp * r.float(0.85, 1.1), 1);
      const i1 = round(e1 * r.float(0.82, 1.12), 1);
      const e2 = round(e1 * r.float(0.93, 1.12), 1);
      const i2 = round(i1 * r.float(0.93, 1.12), 1);
      return { c: c.n, e1, i1, e2, i2 };
    });
    const tbl = table(
      'Warenausfuhren und -einfuhren (in Mrd. EUR)',
      ['Land', 'Ausfuhren ' + y1, 'Einfuhren ' + y1, 'Ausfuhren ' + y2, 'Einfuhren ' + y2],
      rows.map((x) => [x.c, fmt(x.e1, 1), fmt(x.i1, 1), fmt(x.e2, 1), fmt(x.i2, 1)]),
      'Handelsbilanz = Ausfuhren − Einfuhren'
    );
    const t = r.int(0, 3);
    const k = r.int(0, 3);
    const x = rows[k];
    if (t === 0) {
      const c = x.e2 / x.i2;
      const opt = numericOptions(r, round(c, 2), [x.i2 / x.e2, x.e1 / x.i1, x.e2 / x.i1, x.e1 / x.i2], 2, { minRel: 0.01, maxRel: 0.5 });
      return q('numerical', 'Wie hoch war ' + y2 + ' ' + IN(x.c) + ' das Verhältnis von Ausfuhren zu Einfuhren?', tbl, opt,
        fmt(x.e2, 1) + ' ÷ ' + fmt(x.i2, 1) + ' = ' + fmt(c, 3) + '.');
    }
    if (t === 1) {
      const tot = rows.reduce((s, z) => s + z.e2, 0);
      const c = (x.e2 / tot) * 100;
      const totAll = rows.reduce((s, z) => s + z.e2 + z.i2, 0);
      const opt = numericOptions(r, round(c, 1), [(x.e1 / rows.reduce((s, z) => s + z.e1, 0)) * 100, ((x.e2 + x.i2) / totAll) * 100, (x.e2 / (tot - x.e2)) * 100, c + 2.5], 1, { suffix: ' %' });
      return q('numerical', 'Welchen Anteil hatten die Ausfuhren ' + VON(x.c) + ' im Jahr ' + y2 + ' an den gesamten Ausfuhren der vier aufgeführten Länder?', tbl, opt,
        'Summe der Ausfuhren ' + y2 + ': ' + fmt(tot, 1) + ' Mrd. EUR. ' + fmt(x.e2, 1) + ' ÷ ' + fmt(tot, 1) + ' × 100 = ' + fmt(c, 2) + ' %.');
    }
    if (t === 2) {
      // Veränderung der Handelsbilanz in Mrd. EUR
      const b1 = x.e1 - x.i1, b2 = x.e2 - x.i2;
      const c = b2 - b1;
      if (Math.abs(c) < 0.5) return tplTrade(r);
      const opt = numericOptions(r, round(c, 1), [(x.e2 - x.e1) + (x.i2 - x.i1), -(c), b2, b1, (x.e2 - x.e1), c + (c > 0 ? 5 : -5)], 1, { suffix: ' Mrd. EUR', minRel: 0.03, maxRel: 6 });
      return q('numerical', 'Um wie viel hat sich die Handelsbilanz ' + VON(x.c) + ' zwischen ' + y1 + ' und ' + y2 + ' verändert?', tbl, opt,
        'Bilanz ' + y1 + ': ' + fmt(x.e1, 1) + ' − ' + fmt(x.i1, 1) + ' = ' + fmt(b1, 1) + '. Bilanz ' + y2 + ': ' + fmt(x.e2, 1) + ' − ' + fmt(x.i2, 1) + ' = ' + fmt(b2, 1) + '. Veränderung: ' + fmt(c, 1) + ' Mrd. EUR (negativ = Verschlechterung).');
    }
    // Projektion mit vorgegebener Rate
    const g = r.pick([2.5, 3, 3.5, 4, 4.5, 5, 6]);
    const n = r.pick([2, 3]);
    const c = x.e2 * Math.pow(1 + g / 100, n);
    const opt = numericOptions(r, round(c, 1), [x.e2 * (1 + (g * n) / 100), x.e2 * Math.pow(1 + g / 100, n - 1), x.e1 * Math.pow(1 + g / 100, n), x.e2 * Math.pow(1 + g / 100, n + 1)], 1, { suffix: ' Mrd. EUR', minRel: 0.002, maxRel: 0.3 });
    return q('numerical', 'Angenommen, die Ausfuhren ' + VON(x.c) + ' steigen ab ' + y2 + ' jährlich um ' + fmt(g, 1) + ' %. Wie hoch wären sie im Jahr ' + (y2 + n) + '?', tbl, opt,
      fmt(x.e2, 1) + ' × ' + fmt(1 + g / 100, 3) + '^' + n + ' = ' + fmt(c, 2) + ' Mrd. EUR. Achtung: Zinseszinseffekt, nicht einfach ' + n + ' × ' + fmt(g, 1) + ' % addieren.');
  }

  // ---------- Vorlage 3: Strommix (Prozentanteile × Gesamtwert) ----------
  function tplEnergy(r) {
    const cs = r.sample(COUNTRIES.slice(0, 18), 4);
    const src = ['Wind', 'Solar', 'Wasserkraft', 'Kernenergie', 'Fossile'];
    const year = r.int(2021, 2025);
    const rows = cs.map((c) => {
      const tot = round(c.twh * r.float(0.9, 1.1), 0);
      let w = src.map(() => r.float(2, 30));
      const sum = w.reduce((a, b) => a + b, 0);
      let sh = w.map((v) => Math.round((v / sum) * 100));
      sh[4] += 100 - sh.reduce((a, b) => a + b, 0);
      if (sh[4] < 1) return null;
      return { c: c.n, tot, sh };
    });
    if (rows.some((x) => !x)) return tplEnergy(r);
    const tbl = table(
      'Bruttostromerzeugung ' + year + ' nach Energieträgern',
      ['Land', 'Gesamt (TWh)'].concat(src.map((s) => s + ' (%)')),
      rows.map((x) => [x.c, fmt(x.tot, 0)].concat(x.sh.map((v) => fmt(v, 0))))
    );
    const t = r.int(0, 3);
    const a = r.int(0, 3);
    let b = (a + r.int(1, 3)) % 4;
    const si = r.int(0, 3);
    const A = rows[a], B = rows[b];
    if (t === 0) {
      const va = (A.tot * A.sh[si]) / 100, vb = (B.tot * B.sh[si]) / 100;
      const c = va - vb;
      if (Math.abs(c) < 1) return tplEnergy(r);
      const opt = numericOptions(r, round(Math.abs(c), 1), [Math.abs(A.sh[si] - B.sh[si]), Math.abs(((A.sh[si] - B.sh[si]) * (A.tot + B.tot)) / 200), Math.abs(c) * 1.2, Math.abs(va + vb) / 2], 1, { suffix: ' TWh', maxRel: 5 });
      return q('numerical', 'Wie viele TWh Strom wurden ' + year + ' ' + IN(A.c) + ' ' + (c > 0 ? 'mehr' : 'weniger') + ' aus ' + src[si] + ' erzeugt als ' + IN(B.c) + '?', tbl, opt,
        A.c + ': ' + fmt(A.tot, 0) + ' × ' + A.sh[si] + ' % = ' + fmt(va, 2) + ' TWh. ' + B.c + ': ' + fmt(B.tot, 0) + ' × ' + B.sh[si] + ' % = ' + fmt(vb, 2) + ' TWh. Differenz: ' + fmt(Math.abs(c), 2) + ' TWh. Prozentanteile verschiedener Gesamtmengen dürfen nicht direkt verglichen werden.');
    }
    if (t === 1) {
      const va = (A.tot * A.sh[si]) / 100, vb = (B.tot * B.sh[si]) / 100;
      const c = (va / vb) * 100;
      const opt = numericOptions(r, round(c, 1), [(A.sh[si] / B.sh[si]) * 100, (vb / va) * 100, (A.tot / B.tot) * 100, c - 100], 1, { suffix: ' %', maxRel: 3 });
      return q('numerical', 'Die Stromerzeugung aus ' + src[si] + ' ' + IN(A.c) + ' entsprach wie viel Prozent der Stromerzeugung aus ' + src[si] + ' ' + IN(B.c) + '?', tbl, opt,
        fmt(va, 2) + ' TWh ÷ ' + fmt(vb, 2) + ' TWh × 100 = ' + fmt(c, 2) + ' %.');
    }
    if (t === 2) {
      const p = r.pick([5, 8, 10, 12, 15]);
      const newShare = A.sh[si] + r.pick([3, 4, 5, 6]);
      const c = (A.tot * (1 + p / 100) * newShare) / 100;
      const opt = numericOptions(r, round(c, 1), [(A.tot * newShare) / 100, (A.tot * (1 + p / 100) * A.sh[si]) / 100, (A.tot * (A.sh[si] + p)) / 100, c * 1.08], 1, { suffix: ' TWh' });
      return q('numerical', 'Angenommen, die Gesamtstromerzeugung ' + VON(A.c) + ' steigt im Folgejahr um ' + p + ' % und der Anteil ' + VON(src[si]) + ' erhöht sich auf ' + newShare + ' %. Wie viel Strom würde dann aus ' + src[si] + ' erzeugt?', tbl, opt,
        fmt(A.tot, 0) + ' × ' + fmt(1 + p / 100, 2) + ' = ' + fmt(A.tot * (1 + p / 100), 2) + ' TWh; davon ' + newShare + ' % = ' + fmt(c, 2) + ' TWh.');
    }
    // Erneuerbare gesamt (Wind+Solar+Wasser) der vier Länder
    const ren = rows.map((x) => (x.tot * (x.sh[0] + x.sh[1] + x.sh[2])) / 100);
    const tot = rows.reduce((s, x) => s + x.tot, 0);
    const c = (ren.reduce((s, v) => s + v, 0) / tot) * 100;
    const naive = rows.reduce((s, x) => s + x.sh[0] + x.sh[1] + x.sh[2], 0) / 4;
    if (Math.abs(naive - c) < 0.6) return tplEnergy(r);
    const opt = numericOptions(r, round(c, 1), [naive, c + (c - naive), c * 0.9, c * 1.1], 1, { suffix: ' %' });
    return q('numerical', 'Wie hoch war ' + year + ' der Anteil von Wind, Solar und Wasserkraft zusammen an der gesamten Stromerzeugung aller vier Länder?', tbl, opt,
      'Erneuerbare je Land in TWh: ' + rows.map((x, k) => x.c + ' ' + fmt(ren[k], 2)).join('; ') + '. Summe ' + fmt(ren.reduce((s, v) => s + v, 0), 2) + '  von ' + fmt(tot, 0) + ' TWh = ' + fmt(c, 2) + ' %. Der einfache Durchschnitt der Prozentsätze (' + fmt(naive, 2) + ' %) ist falsch, weil die Länder unterschiedlich viel Strom erzeugen.');
  }

  // ---------- Vorlage 4: EU-Programme (Balkendiagramm) ----------
  function tplBudget(r) {
    const progs = r.sample(['Horizont Europa', 'Erasmus+', 'Digitales Europa', 'LIFE', 'CEF Verkehr', 'EU4Health', 'Kreatives Europa', 'InvestEU'], 4);
    const y0 = r.int(2021, 2024);
    const years = [y0, y0 + 1, y0 + 2];
    const vals = progs.map(() => {
      let v = r.int(8, 60) * 50;
      return years.map(() => {
        const cur = v;
        v = Math.round((v * r.float(0.94, 1.15)) / 10) * 10;
        return cur;
      });
    });
    // values[g][s]: Gruppen = Programme, Serien = Jahre
    const chart = barChart('Mittelbindungen ausgewählter EU-Programme (in Mio. EUR)', progs, years.map(String), vals, 'Mio. EUR', 0);
    const t = r.int(0, 2);
    const k = r.int(0, 3);
    if (t === 0) {
      const tot = vals.reduce((s, row) => s + row[2], 0);
      const c = (vals[k][2] / tot) * 100;
      const opt = numericOptions(r, round(c, 1), [(vals[k][2] / (tot - vals[k][2])) * 100, (vals[k][0] / vals.reduce((s, row) => s + row[0], 0)) * 100, 25, c * 1.12], 1, { suffix: ' %' });
      return q('numerical', 'Welchen Anteil hatte ' + progs[k] + ' ' + years[2] + ' an den gesamten Mittelbindungen der vier dargestellten Programme?', chart, opt,
        'Summe ' + years[2] + ': ' + fmt(tot, 0) + ' Mio. EUR. ' + fmt(vals[k][2], 0) + ' ÷ ' + fmt(tot, 0) + ' × 100 = ' + fmt(c, 2) + ' %.');
    }
    if (t === 1) {
      const c = pct(vals[k][0], vals[k][2]);
      if (Math.abs(c) < 1) return tplBudget(r);
      const avg = (pct(vals[k][0], vals[k][1]) + pct(vals[k][1], vals[k][2]));
      const opt = numericOptions(r, round(c, 1), [((vals[k][2] - vals[k][0]) / vals[k][2]) * 100, avg * 1.15, c / 2, -c], 1, { suffix: ' %', maxRel: 3 });
      return q('numerical', 'Um wie viel Prozent veränderten sich die Mittelbindungen für ' + progs[k] + ' ' + VON(years[0]) + ' bis ' + years[2] + '?', chart, opt,
        '(' + fmt(vals[k][2], 0) + ' − ' + fmt(vals[k][0], 0) + ') ÷ ' + fmt(vals[k][0], 0) + ' × 100 = ' + fmt(c, 2) + ' %.');
    }
    // Welche Steigerung wäre nötig, um Programm X im nächsten Jahr um Y% zu übertreffen
    const tot1 = vals.reduce((s, row) => s + row[1], 0), tot2 = vals.reduce((s, row) => s + row[2], 0);
    const c = pct(tot1, tot2);
    const tot0 = vals.reduce((s, row) => s + row[0], 0);
    if (Math.abs(c) < 0.5) return tplBudget(r);
    const opt = numericOptions(r, round(c, 1), [pct(tot0, tot2), pct(tot0, tot1), ((tot2 - tot1) / tot2) * 100, c * 1.5], 1, { suffix: ' %', maxRel: 3 });
    return q('numerical', 'Um wie viel Prozent veränderten sich die gesamten Mittelbindungen der vier Programme zwischen ' + years[1] + ' und ' + years[2] + '?', chart, opt,
      'Summe ' + years[1] + ': ' + fmt(tot1, 0) + '; Summe ' + years[2] + ': ' + fmt(tot2, 0) + '. Veränderung: ' + fmt(c, 2) + ' %.');
  }

  // ---------- Vorlage 5: Preise und Wechselkurse ----------
  function tplCurrency(r) {
    const cur = r.sample([
      { c: 'Polen', cur: 'PLN', rate: 4.3 },
      { c: 'Tschechien', cur: 'CZK', rate: 25.0 },
      { c: 'Ungarn', cur: 'HUF', rate: 395 },
      { c: 'Schweden', cur: 'SEK', rate: 11.3 },
      { c: 'Dänemark', cur: 'DKK', rate: 7.46 },
      { c: 'Rumänien', cur: 'RON', rate: 4.98 },
      { c: 'Vereinigtes Königreich', cur: 'GBP', rate: 0.85 },
      { c: 'Schweiz', cur: 'CHF', rate: 0.94 },
      { c: 'Norwegen', cur: 'NOK', rate: 11.6 },
    ], 4);
    const item = r.pick([
      { n: 'Monatsfahrkarte ÖPNV', eur: 60 },
      { n: 'Liter Milch', eur: 1.1 },
      { n: 'Kinokarte', eur: 11 },
      { n: 'Laptop (Standardmodell)', eur: 850 },
      { n: 'Hotelübernachtung (Mittelklasse)', eur: 110 },
    ]);
    const dec = item.eur < 5 ? 2 : 0;
    const rows = cur.map((x) => {
      const rate = round(x.rate * r.float(0.97, 1.03), x.rate > 100 ? 1 : x.rate > 10 ? 2 : 3);
      const price = round(item.eur * r.float(0.75, 1.3) * rate, x.rate > 100 ? -1 : dec);
      return Object.assign({}, x, { rate, price });
    });
    const rateDec = (v) => (v > 100 ? 1 : v > 10 ? 2 : 3);
    const tbl = table(
      'Preis für: ' + item.n,
      ['Land', 'Preis (Landeswährung)', 'Wechselkurs (1 EUR = …)'],
      rows.map((x) => [x.c, fmt(x.price, x.rate > 100 ? 0 : dec) + ' ' + x.cur, fmt(x.rate, rateDec(x.rate)) + ' ' + x.cur])
    );
    const eur = rows.map((x) => x.price / x.rate);
    const t = r.int(0, 2);
    const a = r.int(0, 3);
    const b = (a + r.int(1, 3)) % 4;
    if (t === 0) {
      const c = (eur[a] / eur[b] - 1) * 100;
      if (Math.abs(c) < 2) return tplCurrency(r);
      const opt = numericOptions(r, round(c, 1), [(1 - eur[b] / eur[a]) * 100, (rows[a].price / rows[b].price - 1) * 100, -c, c * 1.3], 1, { suffix: ' %', maxRel: 3 });
      return q('numerical', 'Um wie viel Prozent ist der Artikel ' + IN(rows[a].c) + ' teurer bzw. billiger (negativ) als ' + IN(rows[b].c) + ', wenn beide Preise in Euro umgerechnet werden?', tbl, opt,
        rows[a].c + ': ' + fmt(eur[a], 2) + ' EUR; ' + rows[b].c + ': ' + fmt(eur[b], 2) + ' EUR. (' + fmt(eur[a], 2) + ' ÷ ' + fmt(eur[b], 2) + ' − 1) × 100 = ' + fmt(c, 2) + ' %.');
    }
    if (t === 1) {
      const n = r.pick([3, 4, 5, 6, 8, 12]);
      const c = eur.reduce((s, v) => s + v, 0) / 4 * n;
      const opt = numericOptions(r, round(c, 2), [(rows.reduce((s, x) => s + x.price * x.rate, 0) / 4 / 100) * n, eur.reduce((s, v) => s + v, 0) / 4 * (n - 1), c * 1.07, eur[a] * n], 2, { suffix: ' EUR', maxRel: 1 });
      return q('numerical', 'Wie viel kosten ' + n + ' Einheiten des Artikels zum durchschnittlichen Euro-Preis der vier Länder?', tbl, opt,
        'Euro-Preise: ' + rows.map((x, k) => x.c + ' ' + fmt(eur[k], 2)).join('; ') + '. Durchschnitt ' + fmt(eur.reduce((s, v) => s + v, 0) / 4, 3) + ' EUR × ' + n + ' = ' + fmt(c, 2) + ' EUR.');
    }
    // Wechselkursänderung
    const ch = r.pick([-8, -6, -5, -4, 4, 5, 6, 8, 10]);
    const newRate = rows[a].rate * (1 + ch / 100);
    const c = rows[a].price / newRate;
    const opt = numericOptions(r, round(c, 2), [rows[a].price / rows[a].rate * (1 + ch / 100), eur[a], rows[a].price / (rows[a].rate * (1 - ch / 100)), c * 1.1], 2, { suffix: ' EUR', minRel: 0.005, maxRel: 0.5 });
    return q('numerical', 'Angenommen, der Kurs ' + VON(rows[a].cur) + ' verändert sich so, dass man für 1 EUR ' + Math.abs(ch) + ' % ' + (ch > 0 ? 'mehr' : 'weniger') + ' ' + rows[a].cur + ' erhält. Der Preis in Landeswährung bleibt gleich. Wie viel kostet der Artikel ' + IN(rows[a].c) + ' dann in Euro?', tbl, opt,
      'Neuer Kurs: ' + fmt(rows[a].rate, 3) + ' × ' + fmt(1 + ch / 100, 2) + ' = ' + fmt(newRate, 4) + '. Preis: ' + fmt(rows[a].price, dec) + ' ÷ ' + fmt(newRate, 4) + ' = ' + fmt(c, 2) + ' EUR.');
  }

  // ---------- Vorlage 6: Personal nach Direktionen ----------
  function tplStaff(r) {
    const dirs = r.sample(['Direktion A – Haushalt', 'Direktion B – Recht', 'Direktion C – Personal', 'Direktion D – Politik', 'Direktion E – Kommunikation', 'Direktion F – IT'], 4);
    const rows = dirs.map((d) => {
      const n = r.int(12, 60) * 5;
      const w = r.int(30, 70);
      return { d, n, w, ad: r.int(35, 70) };
    });
    const year = r.int(2022, 2026);
    const tbl = table(
      'Personal einer EU-Agentur am 31.12.' + year,
      ['Direktion', 'Beschäftigte', 'davon Frauen (%)', 'davon Funktionsgruppe AD (%)'],
      rows.map((x) => [x.d, fmt(x.n, 0), fmt(x.w, 0), fmt(x.ad, 0)])
    );
    const t = r.int(0, 2);
    const k = r.int(0, 3);
    const x = rows[k];
    if (t === 0) {
      const women = rows.reduce((s, z) => s + (z.n * z.w) / 100, 0);
      const tot = rows.reduce((s, z) => s + z.n, 0);
      const c = (women / tot) * 100;
      const naive = rows.reduce((s, z) => s + z.w, 0) / 4;
      if (Math.abs(c - naive) < 0.5) return tplStaff(r);
      const opt = numericOptions(r, round(c, 1), [naive, c + (c - naive) * 1.5, 100 - c, c * 1.1], 1, { suffix: ' %', maxRel: 1.5 });
      return q('numerical', 'Wie hoch war der Frauenanteil am gesamten Personal der vier Direktionen?', tbl, opt,
        'Frauen: ' + rows.map((z) => fmt((z.n * z.w) / 100, 1)).join(' + ') + ' = ' + fmt(women, 1) + '  von ' + fmt(tot, 0) + ' = ' + fmt(c, 2) + ' %. Einfacher Durchschnitt der Prozentsätze (' + fmt(naive, 2) + ' %) wäre falsch.');
    }
    if (t === 1) {
      const leave = r.int(2, 8) * 5;
      const men = x.n * (1 - x.w / 100);
      if (men <= leave + 5) return tplStaff(r);
      const women = (x.n * x.w) / 100;
      const c = (women / (x.n - leave)) * 100;
      const opt = numericOptions(r, round(c, 1), [x.w + (leave / x.n) * 100, (women / x.n) * 100 + 1.5, ((women + leave) / x.n) * 100, c * 1.08], 1, { suffix: ' %', minRel: 0.005, maxRel: 0.5 });
      return q('numerical', 'Angenommen, ' + IN(x.d) + ' scheiden ' + leave + ' Männer aus und werden nicht ersetzt. Wie hoch wäre danach der Frauenanteil in dieser Direktion?', tbl, opt,
        'Frauen: ' + fmt(x.n, 0) + ' × ' + x.w + ' % = ' + fmt(women, 1) + '. Neue Gesamtzahl: ' + fmt(x.n - leave, 0) + '. Anteil: ' + fmt(c, 2) + ' %.');
    }
    const other = rows[(k + r.int(1, 3)) % 4];
    const a1 = (x.n * x.ad) / 100, a2 = (other.n * other.ad) / 100;
    const c = a1 - a2;
    if (Math.abs(c) < 2) return tplStaff(r);
    const opt = numericOptions(r, round(Math.abs(c), 0), [Math.abs(x.n - other.n), Math.abs(x.ad - other.ad), Math.abs(((x.ad - other.ad) * (x.n + other.n)) / 200), Math.abs(c) + 6], 0, { positive: true, minRel: 0.04, maxRel: 4 });
    return q('numerical', 'Wie viele Beschäftigte der Funktionsgruppe AD hatte ' + x.d + ' ' + (c > 0 ? 'mehr' : 'weniger') + ' als ' + other.d + '? (auf ganze Personen gerundet)', tbl, opt,
      fmt(x.n, 0) + ' × ' + x.ad + ' % = ' + fmt(a1, 1) + '; ' + fmt(other.n, 0) + ' × ' + other.ad + ' % = ' + fmt(a2, 1) + '. Differenz ≈ ' + fmt(Math.abs(c), 0) + '.');
  }

  // ---------- Vorlage 7: Tourismus (zwei verknüpfte Größen) ----------
  function tplTourism(r) {
    const regs = r.sample(['Tirol', 'Algarve', 'Bayern', 'Balearen', 'Toskana', 'Kreta', 'Provence', 'Dalmatien', 'Andalusien', 'Südtirol'], 4);
    const y1 = r.int(2019, 2024), y2 = y1 + 1;
    const rows = regs.map((g) => {
      const n1 = round(r.float(8, 60), 1);
      const n2 = round(n1 * r.float(0.9, 1.14), 1);
      const s1 = r.int(70, 160);
      const s2 = Math.round(s1 * r.float(0.95, 1.1));
      return { g, n1, n2, s1, s2 };
    });
    const tbl = table(
      'Übernachtungen und durchschnittliche Ausgaben von Touristen',
      ['Region', 'Übernachtungen ' + y1 + ' (Mio.)', 'Übernachtungen ' + y2 + ' (Mio.)', 'Ausgaben pro Nacht ' + y1 + ' (EUR)', 'Ausgaben pro Nacht ' + y2 + ' (EUR)'],
      rows.map((x) => [x.g, fmt(x.n1, 1), fmt(x.n2, 1), fmt(x.s1, 0), fmt(x.s2, 0)])
    );
    const k = r.int(0, 3);
    const x = rows[k];
    const t = r.int(0, 1);
    if (t === 0) {
      const e1 = x.n1 * x.s1, e2 = x.n2 * x.s2;
      const c = pct(e1, e2);
      if (Math.abs(c) < 1) return tplTourism(r);
      const opt = numericOptions(r, round(c, 1), [pct(x.n1, x.n2) + pct(x.s1, x.s2) + 1.3, pct(x.n1, x.n2), pct(x.s1, x.s2), ((e2 - e1) / e2) * 100], 1, { suffix: ' %', minRel: 0.02, maxRel: 4 });
      return q('numerical', 'Um wie viel Prozent veränderten sich die gesamten Touristenausgaben ' + IN(x.g) + ' ' + VON(y1) + ' auf ' + y2 + '?', tbl, opt,
        'Ausgaben ' + y1 + ': ' + fmt(x.n1, 1) + ' Mio. × ' + x.s1 + ' EUR = ' + fmt(e1, 1) + ' Mio. EUR. ' + y2 + ': ' + fmt(x.n2, 1) + ' × ' + x.s2 + ' = ' + fmt(e2, 1) + ' Mio. EUR. Veränderung: ' + fmt(c, 2) + ' %.');
    }
    const tot = rows.reduce((s, z) => s + z.n2 * z.s2, 0);
    const c = tot / 1000;
    const opt = numericOptions(r, round(c, 2), [rows.reduce((s, z) => s + z.n2, 0) * rows.reduce((s, z) => s + z.s2, 0) / 4 / 1000, rows.reduce((s, z) => s + z.n1 * z.s1, 0) / 1000, c * 1.1, c / 1.1], 2, { suffix: ' Mrd. EUR', minRel: 0.01, maxRel: 0.5 });
    return q('numerical', 'Wie hoch waren ' + y2 + ' die gesamten Touristenausgaben in den vier Regionen zusammen?', tbl, opt,
      rows.map((z) => fmt(z.n2, 1) + ' × ' + z.s2).join(' + ') + ' = ' + fmt(tot, 1) + ' Mio. EUR = ' + fmt(c, 2) + ' Mrd. EUR.');
  }

  // ---------- Vorlage 8: BIP pro Kopf (Kombination zweier Größen) ----------
  function tplGdpPerCapita(r) {
    const cs = r.sample(COUNTRIES.slice(0, 22), 5);
    const year = r.int(2021, 2025);
    const rows = cs.map((c) => ({ c: c.n, gdp: round(c.gdp * r.float(0.92, 1.08), 0), pop: round(c.pop * r.float(0.99, 1.01), 1), gr: round(r.float(-1.5, 4.5), 1) }));
    const tbl = table(
      'Wirtschaftsdaten ' + year,
      ['Land', 'BIP (Mrd. EUR)', 'Bevölkerung (Mio.)', 'Reales BIP-Wachstum ggü. Vorjahr (%)'],
      rows.map((x) => [x.c, fmt(x.gdp, 0), fmt(x.pop, 1), fmt(x.gr, 1)])
    );
    const t = r.int(0, 2);
    const k = r.int(0, 4);
    const x = rows[k];
    if (t === 0) {
      const c = (x.gdp / x.pop) * 1000;
      const opt = numericOptions(r, round(c, -2), [(x.pop / x.gdp) * 1e6, c / 10, c * 1.15, c * 0.85], 0, { suffix: ' EUR', maxRel: 20 });
      return q('numerical', 'Wie hoch war ' + year + ' das BIP pro Kopf ' + IN(x.c) + ' (auf 100 EUR gerundet)?', tbl, opt,
        fmt(x.gdp, 0) + ' Mrd. EUR ÷ ' + fmt(x.pop, 1) + ' Mio. = ' + fmt(c, 0) + ' EUR ≈ ' + fmt(round(c, -2), 0) + ' EUR. Einheiten beachten: Mrd. ÷ Mio. = Tausend.');
    }
    if (t === 1) {
      const c = x.gdp / (1 + x.gr / 100);
      const opt = numericOptions(r, round(c, 1), [x.gdp * (1 - x.gr / 100), x.gdp, x.gdp * (1 + x.gr / 100), c - (x.gdp - c)], 1, { suffix: ' Mrd. EUR', minRel: 0.0005, maxRel: 0.2 });
      if (Math.abs(x.gr) < 0.8) return tplGdpPerCapita(r);
      return q('numerical', 'Wie hoch war das (reale) BIP ' + VON(x.c) + ' im Jahr ' + (year - 1) + ', ausgedrückt in Preisen ' + VON(year) + '?', tbl, opt,
        fmt(x.gdp, 0) + ' ÷ ' + fmt(1 + x.gr / 100, 3) + ' = ' + fmt(c, 2) + ' Mrd. EUR. Beim Rückrechnen wird durch den Wachstumsfaktor geteilt, nicht der Prozentsatz abgezogen.');
    }
    const pc = rows.map((z) => z.gdp / z.pop);
    const best = pc.indexOf(Math.max.apply(null, pc));
    const sortedPc = pc.slice().sort((p1, p2) => p2 - p1);
    if (sortedPc[0] / sortedPc[1] < 1.03) return tplGdpPerCapita(r);
    return q('numerical', 'Welches Land hatte ' + year + ' das höchste BIP pro Kopf?', tbl, { options: rows.map((z) => z.c), correct: best },
      'BIP pro Kopf (Tsd. EUR): ' + rows.map((z, i2) => z.c + ' ' + fmt(pc[i2], 1)).join('; ') + '.');
  }

  const TEMPLATES = [tplPopulation, tplTrade, tplEnergy, tplBudget, tplCurrency, tplStaff, tplTourism, tplGdpPerCapita];

  function valid(q) {
    return q && q.options.length === 5 && q.correct >= 0 && new Set(q.options).size === 5;
  }

  function generate(seed) {
    let out = null;
    for (let k = 0; k < 10 && !valid(out); k++) {
      const r = U.rng(seed + k * 1000003);
      const tpl = TEMPLATES[r.int(0, TEMPLATES.length - 1)];
      out = tpl(r);
    }
    out.id = 'num-' + seed;
    out.seed = seed;
    out.source = 'generiert';
    return withNone(out, seed);
  }

  // Im EPSO-Beispieltest ist Option E oft „Keine der oben genannten“. Bei gut der Hälfte der
  // Zahlenaufgaben wird E dadurch ersetzt; in etwa jedem fünften dieser Fälle ist E die Lösung,
  // weil der richtige Wert dann nicht unter A–D steht.
  const NONE = 'Keine der oben genannten';
  function withNone(q, seed) {
    if (!q.options.every((o) => /\d/.test(o))) return q; // nur bei Zahlenantworten
    const r = U.rng(seed * 7 + 13);
    if (!r.chance(0.55)) return q;
    const keep = q.options.map((o, i) => i);
    let correct;
    if (r.chance(0.2)) {
      // Lösung entfernen: E ist richtig
      keep.splice(q.correct, 1);
      correct = 4;
    } else {
      const wrong = keep.filter((i) => i !== q.correct);
      keep.splice(keep.indexOf(r.pick(wrong)), 1);
      correct = keep.indexOf(q.correct);
    }
    const options = keep.map((i) => q.options[i]).concat([NONE]);
    let explanation = q.explanation;
    if (correct === 4) explanation += ' Dieser Wert steht nicht unter A–D, deshalb ist E („' + NONE + '“) richtig.';
    return Object.assign({}, q, { options, correct, explanation, fixedOrder: true });
  }

  const API = { generate, count: TEMPLATES.length };
  root.EPSO_NUMERICAL = API;
  if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
