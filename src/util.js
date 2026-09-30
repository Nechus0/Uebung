/* Gemeinsame Hilfsfunktionen: Zufallszahlen mit Seed, Formatierung, Antwortoptionen. */
(function (root) {
  'use strict';

  // Mulberry32: kleiner, schneller PRNG. Gleicher Seed -> gleiche Aufgabe.
  function rng(seed) {
    let a = seed >>> 0;
    const next = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = (min, max) => min + Math.floor(next() * (max - min + 1));
    next.float = (min, max) => min + next() * (max - min);
    next.pick = (arr) => arr[Math.floor(next() * arr.length)];
    next.shuffle = (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    };
    next.sample = (arr, n) => next.shuffle(arr).slice(0, n);
    next.chance = (p) => next() < p;
    return next;
  }

  function newSeed() {
    return Math.floor(Math.random() * 2147483647) + 1;
  }

  function round(x, dec) {
    const f = Math.pow(10, dec);
    return Math.round(x * f) / f;
  }

  const nfCache = {};
  function fmt(x, dec) {
    dec = dec || 0;
    if (!nfCache[dec]) {
      nfCache[dec] = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
    }
    let s = nfCache[dec].format(x);
    if (/^-0(,0+)?$/.test(s)) s = s.slice(1);
    return s;
  }

  /**
   * Baut Antwortoptionen für eine Zahlenaufgabe.
   * correct: richtiger Wert; traps: typische Fehlerwerte; dec: Nachkommastellen;
   * n: Anzahl Optionen. Liefert { options: [string], correct: index }.
   */
  function numericOptions(r, correct, traps, dec, opts) {
    opts = opts || {};
    const n = opts.n || 5;
    const pre = opts.prefix || '';
    const suf = opts.suffix || '';
    const label = (v) => pre + fmt(v, dec) + suf;
    const cLabel = label(correct);
    const seen = new Set([cLabel]);
    const values = [];
    const tryAdd = (v) => {
      if (!isFinite(v)) return;
      if (opts.positive && v <= 0) return;
      const l = label(v);
      if (seen.has(l)) return;
      // Distraktoren sollen sich erkennbar unterscheiden, aber nicht trivial weit weg sein.
      const rel = Math.abs(v - correct) / Math.max(Math.abs(correct), 1e-9);
      if (rel < (opts.minRel || 0.012)) return;
      if (rel > (opts.maxRel || 1.8)) return;
      seen.add(l);
      values.push(v);
    };
    r.shuffle(traps).forEach(tryAdd);
    let guard = 0;
    const spreads = [0.03, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25];
    while (values.length < n - 1 && guard++ < 200) {
      const s = r.pick(spreads) * (r.chance(0.5) ? 1 : -1);
      tryAdd(correct * (1 + s) + (correct === 0 ? s * 10 : 0));
    }
    const chosen = values.slice(0, n - 1);
    chosen.push(correct);
    chosen.sort((a, b) => a - b);
    return {
      options: chosen.map(label),
      correct: chosen.indexOf(correct),
    };
  }

  // Optionen aus Texten (z. B. Ländernamen), zufällig angeordnet.
  function textOptions(r, correct, wrong, n) {
    const list = r.shuffle([correct].concat(r.sample(wrong, (n || 5) - 1)));
    return { options: list, correct: list.indexOf(correct) };
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  root.EPSO_UTIL = { rng, newSeed, round, fmt, numericOptions, textOptions, esc };
  if (typeof module !== 'undefined') module.exports = root.EPSO_UTIL;
})(typeof window !== 'undefined' ? window : globalThis);
