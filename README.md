# Übung

## Branches in GitHub – Kurzübersicht

Ein **Branch** ist eine unabhängige Entwicklungslinie innerhalb eines Repositorys. Man kann darauf Änderungen vornehmen, ohne den Hauptstand zu beeinflussen.

### Grundbegriffe

- **Default-Branch** (meist `main`): der stabile Hauptzweig, aus dem neue Branches erstellt werden.
- **Feature-Branch**: kurzlebiger Branch für eine Änderung, ein Feature oder einen Bugfix.
- **Commit**: gespeicherter Änderungsstand; ein Branch ist im Kern ein Zeiger auf einen Commit.
- **HEAD**: der Branch bzw. Commit, auf dem man gerade arbeitet.

### Typischer Ablauf

1. **Branch erstellen**
   `git switch -c mein-feature`
2. **Änderungen committen**
   `git add . && git commit -m "Beschreibung"`
3. **Branch hochladen**
   `git push -u origin mein-feature`
4. **Pull Request (PR) öffnen**: Die Änderungen werden auf GitHub vorgestellt, diskutiert und geprüft (Review, automatische Checks).
5. **Mergen**: Nach der Freigabe wird der Branch in den Default-Branch übernommen.
6. **Aufräumen**: Den nicht mehr benötigten Branch löschen.

### Merge-Varianten auf GitHub

| Variante | Wirkung |
| --- | --- |
| Merge commit | Alle Commits bleiben erhalten, dazu kommt ein Merge-Commit. |
| Squash and merge | Alle Commits des Branches werden zu einem einzigen zusammengefasst. |
| Rebase and merge | Die Commits werden einzeln und linear auf den Zielbranch gesetzt. |

### Nützliche Befehle

```bash
git branch                 # lokale Branches anzeigen
git branch -a              # inkl. Remote-Branches
git switch <branch>        # Branch wechseln
git fetch origin           # Stand vom Remote holen
git merge <branch>         # Branch in den aktuellen Branch mergen
git branch -d <branch>     # lokalen Branch löschen
git push origin --delete <branch>   # Remote-Branch löschen
```

### Tipps

- Aussagekräftige Namen wählen, z. B. `feature/login` oder `fix/typo-readme`.
- Branches klein und kurzlebig halten.
- Den Default-Branch mit **Branch Protection Rules** schützen (Reviews und Checks erforderlich).
- Bei Konflikten beim Mergen: Dateien manuell anpassen, dann erneut committen.

## Claude Cowork vs. Claude Code

Beide Produkte von Anthropic basieren auf derselben Agenten-Technik, richten sich aber an unterschiedliche Aufgaben.

| | Claude Code | Claude Cowork |
| --- | --- | --- |
| Zielgruppe | Entwickler:innen | Wissensarbeit allgemein (Dokumente, Recherche, Dateien, Office-Aufgaben) |
| Typische Aufgaben | Code schreiben, Fehler beheben, Tests, Git/Branches, Pull Requests | Berichte, Tabellen, Präsentationen, Dateien ordnen, Zusammenfassungen |
| Arbeitsumgebung | Repository und Terminal | Ordner und Dateien, die man freigibt, plus verbundene Dienste (Connectoren) |
| Oberflächen | Terminal (CLI), IDE-Erweiterungen, Desktop-App, Web (claude.ai/code) | Claude-Desktop-App |

### Ist Claude Code jetzt die Cloud-Version?

Nein, nicht ausschließlich. Claude Code läuft **lokal** (Terminal, IDE, Desktop-App) und **in der Cloud** (Claude Code im Web). Die Cloud-Variante ist nur eine von mehreren Möglichkeiten, Claude Code zu nutzen:

- **Lokal**: Claude arbeitet direkt auf dem eigenen Rechner mit den dortigen Dateien.
- **Cloud (Web)**: Claude arbeitet in einem isolierten Container, in dem das Repository frisch geklont wird. Das ist praktisch für Aufgaben im Hintergrund, auch vom Handy aus. Änderungen müssen gepusht werden (z. B. auf einen Branch), da der Container nach der Sitzung verworfen wird.

Cowork ist also nicht die „Desktop-Version" und Claude Code nicht die „Cloud-Version": Der eigentliche Unterschied liegt im Einsatzzweck (Wissensarbeit vs. Softwareentwicklung), nicht im Ausführungsort.
