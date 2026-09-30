# EPSO Logiktrainer (AD/427/26)

Übungsprogramm für die drei Logiktests der ersten Testphase des Concours EPSO/AD/427/26:
Sprachlogisches Denken, Zahlenverständnis und Abstraktes Denken. Die Oberfläche bildet die EPSO-Testplattform (TAO) nach, wie sie der offizielle Beispieltest zeigt.

## Nutzung

- **Im Browser (empfohlen):** private claude.ai-Seite (Link im Chat).
- **Lokal/offline:** `dist/epso-logiktrainer.html` herunterladen und doppelklicken. Es wird nichts installiert.

Der Fortschritt (Statistik, falsch beantwortete Fragen, importierte Fragen) wird im jeweiligen Browser gespeichert.
Unter *Statistik → Fortschritt als Text anzeigen* lässt er sich kopieren und auf einem anderen Gerät unter *Fragen importieren* wiederherstellen.

## Testformat (Bekanntmachung EPSO/AD/427/26, ABl. C/2026/711 vom 5.2.2026)

| Test | Fragen | Zeit | Mindestpunktzahl | Gewichtung |
|---|---|---|---|---|
| Sprachlogisches Denken | 20 | 35 min | 10/20 | 40 % der vorläufigen, 35 % der endgültigen Gesamtpunktzahl |
| Zahlenverständnis | 10 | 20 min | zusammen mit Abstrakt 10/20 | fließt nicht in die Gesamtpunktzahl ein |
| Abstraktes Denken | 10 | 10 min | siehe oben | fließt nicht in die Gesamtpunktzahl ein |

Quelle: Abschnitt 4.3.2 b (Tabelle 2) und 4.3.3 (Tabelle 6) der Bekanntmachung, abgerufen am 30.09.2026 über EUR-Lex.

## Funktionen

- **Offizieller EPSO-Beispieltest:** die 20 Aufgaben des deutschen TAO-Beispieltests im Wortlaut (10 Sprachlogik, 5 Zahlen, 5 Abstrakt), 30 Minuten wie dort, oder im Übungsmodus mit Lösungsweg
- Prüfungssimulation: alle drei Tests nacheinander mit den Zeiten der Bekanntmachung, automatische Abgabe, Auswertung gegen die Mindestpunktzahlen
- Einzeltest mit Zeitlimit oder Übungsmodus mit sofortiger Lösung und Erklärung
- Oberfläche wie die EPSO-Testplattform (nachgebaut nach dem Beispieltest): Pfad mit Countdown oben links; Notizblock, Textmarker, Taschenrechner, Zeilenlineal und Einstellungen oben rechts; nummerierte Fragenleiste unten; Lesezeichen; Übersicht mit „Alle Fragen / Markiert / Unvollständig“ und Abgabe-Dialog; nach der letzten Frage öffnet „Weiter“ die Übersicht
- „Antworten ausschließen“ ist wie im Original eine Einstellung (standardmäßig aus)
- Fehler wiederholen, Statistik mit Zeit pro Frage, Import eigener Fragen als JSON
- Tastatur: A–E oder 1–5 wählen, ← → blättern, M Lesezeichen, R Taschenrechner, Esc schließt Fenster

## Fragenquellen

| Quelle | Umfang | Hinweis |
|---|---|---|
| Offizieller EPSO-Beispieltest | 20 Aufgaben | Texte und Optionen wörtlich aus dem deutschen Beispieltest; Tabellen als HTML nachgesetzt, Figuren als SVG nachgezeichnet; Lösungen aus der Auswertungsansicht und den PDF-Fassungen, per `tools/check.js` abgesichert; Erklärungen selbst verfasst |
| Fragenpool Sprachlogik | 292 Texte (Deutsch) | selbst verfasst im EPSO-Stil; im Einzeltest und in der Simulation nur Fragen im Prüfungsformat „Welche der folgenden Aussagen ist zutreffend?“ |
| Generator Zahlenverständnis | unbegrenzt | 8 Vorlagen mit typischen Rechenfallen; wie im Beispieltest ist Option E bei gut der Hälfte der Aufgaben „Keine der oben genannten“ (manchmal richtig) |
| Generator Abstraktes Denken | unbegrenzt | wie im Original fünf Bilder und fünf Figuren A–E, ohne Fragetext; 1–3 Regeln |
| Importierte Fragen | beliebig | JSON, Format im Programm |

Was der Abgleich mit den offiziellen Unterlagen ergeben hat: Sprachlogik hat vier Optionen und fragt nach der „zutreffenden“ Aussage; Texte sind ein Absatz mit 60–130 Wörtern; Zahlenaufgaben haben fünf Optionen, oft mit „Keine der oben genannten“; der Taschenrechner (AC, ±, %, Grundrechenarten) steht in allen Abschnitten zur Verfügung.

Offizielle Unterlagen: [EPSO-Seite AD 5 mit Beispieltests](https://selection.eu-careers.europa.eu/en/graduates-administrators-ad5),
[Bewertungsschema](https://selection.eu-careers.europa.eu/en/ad5-graduates-selection-process-how-you-are-assessed),
[Verbal Reasoning (PDF)](https://selection.eu-careers.europa.eu/system/files/2024-05/AD_Verbal_10Q_DA2.pdf),
[Numerical Reasoning (PDF)](https://selection.eu-careers.europa.eu/system/files/2024-05/AD_Numerical_5Q_DA2.pdf),
[Bekanntmachung auf EUR-Lex](https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=OJ:C_202600711).

## Aufbau

```
src/
  index.html          Entwicklungsversion (lädt die Einzeldateien)
  styles.css          Oberfläche im TAO-Stil, Hell/Dunkel
  util.js             Zufallszahlen mit Seed, Zahlenformat, Antwortoptionen
  gen-numerical.js    Generator Zahlenlogik
  gen-abstract.js     Generator Abstraktes Denken (SVG)
  app.js              Ablauf, Timer, TAO-Oberfläche, Werkzeuge, Auswertung, Speicherung
  data/verbal-*.js    Fragenpool Sprachlogik (Blöcke A–L)
  data/official-sample.js  offizieller EPSO-Beispieltest (20 Aufgaben)
tools/
  build.js            baut dist/epso-logiktrainer.html (eine Datei, offline nutzbar)
  check.js            prüft Fragenpool, Generatoren und den Lösungsschlüssel des Beispieltests
```

```
node tools/check.js   # Prüfung
node tools/build.js   # Einzeldatei bauen
```

Neue Sprachlogik-Aufgaben: eine Datei `src/data/verbal-x.js` nach dem Muster der vorhandenen anlegen und neu bauen.
