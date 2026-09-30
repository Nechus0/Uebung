# EPSO Logiktrainer (AD/427/26)

Übungsprogramm für die drei Logiktests der ersten Testphase des Concours EPSO/AD/427/26:
Sprachlogisches Denken, Zahlenlogisches Denken und Abstraktes Denken. Die Oberfläche orientiert sich an der Testumgebung TAO.

## Nutzung

- **Im Browser (empfohlen):** private claude.ai-Seite (Link im Chat).
- **Lokal/offline:** `dist/epso-logiktrainer.html` herunterladen und doppelklicken. Es wird nichts installiert.

Der Fortschritt (Statistik, falsch beantwortete Fragen, importierte Fragen) wird im jeweiligen Browser gespeichert.
Unter *Statistik → Fortschritt als Text anzeigen* lässt er sich kopieren und auf einem anderen Gerät unter *Fragen importieren* wiederherstellen.

## Testformat (Stand: Vorbereitungsunterlagen AD/427/26)

| Test | Fragen | Zeit | Mindestpunktzahl |
|---|---|---|---|
| Sprachlogisches Denken | 20 | 35 min | 10/20, zählt 35 % der Gesamtpunkte |
| Zahlenlogisches Denken | 10 | 20 min | zusammen mit Abstrakt 10/20 (nur bestanden/nicht bestanden) |
| Abstraktes Denken | 10 | 10 min | siehe oben |

Maßgeblich ist die Bekanntmachung im ABl. C/2026/00711 und die Einladung im Candidate Portal.

## Funktionen

- Prüfungssimulation: alle drei Tests nacheinander mit Originalzeiten, automatische Abgabe bei Zeitablauf, Auswertung gegen die Mindestpunktzahlen
- Einzeltest mit Zeitlimit oder Übungsmodus mit sofortiger Lösung und Erklärung
- TAO-Werkzeuge: Fragen-Navigationsleiste, „Zur Überprüfung markieren“, Antworten ausschließen, Taschenrechner (Zahlenlogik), Schriftgröße, Übersicht vor der Abgabe
- Fehler wiederholen: Falsch beantwortete Fragen werden gesammelt, bis sie richtig beantwortet sind
- Statistik: Trefferquote und Zeit pro Frage im Vergleich zur Prüfungsvorgabe
- Import eigener oder offizieller Beispielfragen als JSON (Format im Programm unter *Fragen importieren*)
- Tastatur: A–E oder 1–5 wählen eine Antwort, ← → blättern, M markiert, R öffnet den Taschenrechner

## Fragenquellen

| Quelle | Umfang | Hinweis |
|---|---|---|
| Fragenpool Sprachlogik | rund 290 Texte (Deutsch) | selbst verfasst im EPSO-Stil, 12 Themenblöcke, mit Erklärungen; die Antwortreihenfolge wird bei jeder Anzeige gemischt |
| Generator Zahlenlogik | unbegrenzt | 8 Vorlagen (Bevölkerung, Außenhandel, Strommix, EU-Haushalt als Diagramm, Wechselkurse, Personal, Tourismus, BIP pro Kopf) mit typischen Rechenfallen als falschen Antworten |
| Generator Abstraktes Denken | unbegrenzt | Figurenreihen mit 1–3 Regeln (Drehung, Wanderung, Anzahl, Farbe, Form, Eckenzahl); jede falsche Option verletzt genau eine Regel |
| Importierte Fragen | beliebig | z. B. EPSO-Beispieltest, euphorum-Demo, Webinar-Unterlagen |

Offizielle Beispielfragen (EPSO-TAO-Beispieltest, euphorum, eu-karriere.org, jobboerse.gv.at, TAO-Anleitung) konnten beim Bau nicht
heruntergeladen werden, weil die Netzwerkrichtlinie der Cloud-Umgebung diese Domains blockiert. Sobald die Domains freigegeben sind
oder die Dateien im Repository liegen, können sie über die Importfunktion bzw. als weitere Datendatei ergänzt werden.

## Aufbau

```
src/
  index.html          Entwicklungsversion (lädt die Einzeldateien)
  styles.css          Oberfläche im TAO-Stil, Hell/Dunkel
  util.js             Zufallszahlen mit Seed, Zahlenformat, Antwortoptionen
  gen-numerical.js    Generator Zahlenlogik
  gen-abstract.js     Generator Abstraktes Denken (SVG)
  app.js              Ablauf, Timer, Navigation, Auswertung, Speicherung
  data/verbal-*.js    Fragenpool Sprachlogik (Blöcke A–L)
tools/
  build.js            baut dist/epso-logiktrainer.html (eine Datei, offline nutzbar)
  check.js            prüft Fragenpool und Generatoren
```

```
node tools/check.js   # Prüfung
node tools/build.js   # Einzeldatei bauen
```

Neue Sprachlogik-Aufgaben: eine Datei `src/data/verbal-x.js` nach dem Muster der vorhandenen anlegen und neu bauen.
