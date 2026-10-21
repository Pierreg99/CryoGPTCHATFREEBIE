# Cryo-Neon-Workspace

## Ausgangslage

Die ursprüngliche Oberfläche verschachtelte GitHub und Agenten im Projektwissen oberhalb des Chatverlaufs. Mehrere große Formulare teilten sich damit denselben Arbeitsbereich; die Modellauswahl war ausschließlich im Composer erreichbar. Die vorhandenen 58 Node-Tests bestanden vor dem Umbau. Der neue Aufbau trennt diese Aufgaben und erhält Datenformat, Modellfreigaben und Godot-Grenzen.

## Bedienung und Gestaltung

Die neue Navigation trennt Chat, Projektwissen, Hyperfocus, Agenten, GitHub/Skills, Godot, Roadmap und Modelle. Jede Ansicht hat einen Hash-Link (`#chat`, `#knowledge`, `#focus`, `#agents`, `#skills`, `#godot`, `#roadmap`, `#models`); Browser-Zurück/Vorwärts bleibt verfügbar. Ergebnisse aus Agenten und Hyperfocus gelangen ausschließlich auf ausdrücklichen Wunsch als Entwurf in den Chat.

Das Design verwendet dunkles Navy, Eis-Cyan und violette Akzente. Gemeinsame CSS-Tokens definieren Grundfarben, Oberflächen, Radius und Bewegung. Neon-Ringe, dezente Einblendungen, transparente Flächen und Statusanzeigen strukturieren die Oberfläche. Systemschriften und lokale Assets benötigen keine externen CDNs. `prefers-reduced-motion` schaltet dekorative Animationen aus. Die mobile Navigation unterstützt Escape, Fokusbegrenzung, Rückgabe des Fokus und ausgeblendeten Hintergrund; native HTML-Dialoge übernehmen die modale Tastaturbedienung.

Modelle lassen sich suchen, merken und explizit auswählen. Favoriten werden versioniert unter `cryo-ui-v1` in localStorage gespeichert. Der Notizmodus bleibt wählbar, Cloud-Anfragen benötigen weiterhin jede einzelne Bestätigung. Es gibt keine Modellinstallation oder Modelllöschung aus der App.

Hyperfocus bleibt eine begrenzte, schreibgeschützte Recherche mit optionaler lokaler Ollama-Zusammenfassung. Abgeschlossene Ergebnisse werden pro Chat gespeichert: höchstens 20 je Chat und 200 insgesamt, längere Zusammenfassungen auf 30.000 Zeichen begrenzt. Ergebnisse sind einzeln löschbar; beim Löschen beziehungsweise Ersetzen eines Chats werden verwaiste Einträge bereinigt. `cryo-focus-v1` liegt lokal im Browser. Favoriten und Fokus-Historie gehören nicht zum bestehenden Chat-JSON-Backup; dessen Format bleibt unverändert.

## Agentenabläufe

Eine Schrittfolge umfasst bis zu fünf Leseaktionen. Jeder Schritt zeigt Werkzeug, Repository und Parameter und benötigt eine eigene Freigabe. Ein Abbruch löscht den Ablauf und verhindert weitere Schritte; laufende schreibgeschützte HTTP-Anfragen werden abgebrochen. Ein Chatwechsel verwirft alte Vorschauen und Ergebnisse.

Werkzeuge:

- `read-readme`: bestehende öffentliche README-Vorschau.
- `search-skills`: bestehender Katalogfilter; Skills sind Referenzen, kein ausführbarer Code.
- `list-tree`: maximal 100 Einträge im Repository-Wurzelverzeichnis, ohne rekursive Traversierung oder Submodule.
- `read-file`: einzelne `.md`, `.txt`, `.json`, `.yaml` oder `.yml` Textdateien, höchstens 100 KiB; optionaler Branch, Tag oder Commit. Binärdaten und Pfadüberschreitungen werden abgewiesen.

Die letzten beiden Aktionen erweitern `POST /api/agent/execute` um `path` und `ref`. Zulässige Repositories stammen weiterhin aus `CRYO_GITHUB_REPOS`; es gibt keinen beliebigen URL-Zugriff. Die vorhandene Einzelaktion bleibt als aufklappbare Option erhalten.

## Optionale Markdown-Ausgabe

Schreiben ist standardmäßig aus. Es gibt weder Shell-Ausführung noch autonome Werkzeugketten. Inhalte stammen aus einem editierbaren Markdown-Entwurf; die App erzeugt keine erfundenen Modellantworten. Entwürfe dürfen maximal 100 KiB umfassen.

### Lokal (Linux)

Ein bereits vorhandener Ausgabeordner und ein ausdrückliches Opt-in sind erforderlich:

```bash
mkdir -p "$PWD/agent-output"
CRYO_LOCAL_WRITES=true CRYO_OUTPUT_DIR="$PWD/agent-output" npm start
```

Die Ausgabe erstellt nur neue `.md`-Dateien direkt in diesem Ordner, ohne Unterordner oder Überschreibungen. Symlink-Ordner und ersetzte Verzeichnisse werden abgewiesen. Die Datei wird exklusiv mit Modus `0600` über einen gepinnten Verzeichnisdeskriptor geöffnet. Diese Absicherung verwendet Linux `/proc/self/fd`; auf anderen Systemen bleibt lokale Ausgabe deaktiviert. GitHub-Ausgabe ist davon unabhängig.

### GitHub

Serverseitig konfigurieren:

| Variable | Bedeutung |
| --- | --- |
| `CRYO_GITHUB_WRITES=true` | Ausdrückliches GitHub-Schreib-Opt-in |
| `CRYO_GITHUB_WRITE_REPOS=owner/repo` | Separate, kommagetrennte Schreibfreigabeliste |
| `CRYO_GITHUB_TOKEN` | Serverseitiger Token mit Contents- und Pull-requests-Schreibrechten für diese Repositories |

Token über eine lokale Secret-Verwaltung oder die Prozessumgebung setzen; niemals im Browser, Repository oder Screenshot hinterlegen. Die vorhandene Leseintegration benötigt weiterhin keinen Token. Die Schreibfunktion erlaubt ausschließlich öffentliche freigegebene Repositories.

Ein geprüfter Entwurf erzeugt einen neuen Branch `cryo/markdown-*`, einen Commit und einen Pull Request. Bestehende Markdown-Dateien dürfen im PR geändert werden; Dateien werden weder gelöscht noch direkt auf dem Basisbranch geändert. Pfade beginnen mit normalen alphanumerischen Segmenten; versteckte Ordner wie `.github` sind ausgeschlossen. Kein Merge aus Produkt-Agenten.

### Vorschau und Wiederholung

`GET /api/agent/capabilities` liefert ausschließlich Aktivierungszustände und Schreibrepositories. `POST /api/agent/write/preview` akzeptiert `{ target, path, content, repo? }` und liefert ein zwei Minuten gültiges Ticket sowie vollständige Vorher-/Nachher-Inhalte. Die Oberfläche zeigt eine vollständige Entfernen-/Hinzufügen-Ansicht. `POST /api/agent/write/execute` akzeptiert ausschließlich `{ ticket }`.

Tickets binden die Änderung an Inhalt, Ziel und Ausgangsstand; geänderte Formulare benötigen neue Vorschauen. Erfolgreiche und wegen Konflikten abgelehnte Freigaben sind verbraucht. Bis zu 25 offene Vorgänge werden im Arbeitsspeicher gehalten und nach Ablauf bereinigt; Serverneustart verwirft sie.

Bei einem GitHub-Teilfehler zeigt die Oberfläche den bereits erzeugten Branch. Innerhalb der ursprünglichen Gültigkeit kann dieselbe Aktion erneut freigegeben werden. Der Server gleicht Branch, Dateiinhalte, den einzelnen freigegebenen Commit und vorhandenen offenen PR ab, um doppelte Commits/PRs nach unterbrochenen Antworten zu vermeiden. Nach Ablauf den vorhandenen Branch prüfen; eine neue Vorschau beginnt einen neuen Vorgang und räumt alte Branches nicht automatisch auf. Es gibt keine Hintergrundfortsetzung. Bereits angestoßene Schreibaktionen werden beim Navigieren nicht rückgängig gemacht.

## Prüfung und Grenzen

```bash
npm test
npm ci
npx playwright install chromium
npm run test:e2e
```

Der Server benötigt Node 20+. Browser-Tests verwenden Node 24 in CI; aktuelle axe-Entwicklungsabhängigkeiten benötigen mindestens Node 22.12. Die Laufzeit hat weiterhin keine npm-Abhängigkeiten.

Node-Tests prüfen bestehende Funktionen sowie Markdown-Validierung, exklusive lokale Ausgabe, Symlink-Schutz, Ablauf/Wiederverwendung, geänderten Basisbranch und GitHub-Teilfehler. Playwright prüft acht Ansichten bei 360/768/1440 Pixeln mit axe, Tastatur-/Dialogbedienung, Chats, Streaming/Abbruch, Projektwissen, Backup-Import/Export, Modelle, Skills, Hyperfocus, Agenten und Godot. CI prüft Node 20/22/24 und ergänzt einen Chromium-Job mit Fehler-Screenshots und Traces.

Externe Dienste werden in Tests simuliert. Echte kostenpflichtige Cloud-Anfragen, reale Godot-Installationen und Schreibaktionen in fremden GitHub-Repositories werden nicht durch die Tests ausgeführt. Automatische axe-Prüfungen ersetzen keinen vollständigen Screenreader-Test.

Echte Screenshots der lokal laufenden Oberfläche: [Desktop](screenshots/workspace-desktop.png), [Mobile](screenshots/workspace-mobile.png), [Agenten](screenshots/agents.png). Der [vorherige Chat](screenshots/before.png) zeigt die ursprüngliche Oberfläche. Weitere Ansichten liegen im Screenshot-Ordner; sie zeigen den Zustand ohne konfigurierte externe Dienste.

## Interaktive Roadmap und Interface-Feinschliff

`#roadmap` erschließt alle 100 Versionen von v0.1 bis v10.0 über zehn Phasen. Suche, Status- und Phasenfilter sowie Seiten mit je zehn Einträgen führen zu vollständigen Versionsdetails mit Lieferobjekt und Abnahmekriterium. Auf Desktop stehen Liste und Details nebeneinander; auf Mobile werden Details oberhalb der Liste angezeigt und nach Auswahl fokussiert.

`GET /api/roadmap` liest die bestehende Markdown-Roadmap serverseitig über `src/roadmap.mjs`. Die Dokumentation bleibt die einzige Datenquelle; es gibt keine separat zu pflegende JSON-Kopie. Der Parser prüft alle 100 aufeinanderfolgenden Versionsnummern, zehn Phasen und vollständige Abnahmekriterien. Ungültige Quelldaten erzeugen einen Fehler mit Wiederholungsaktion in der Oberfläche. Es werden keine Releases oder Implementierungen aus Versionsnummern abgeleitet.

Statusabgleich zum 1.0-Release-Candidate: v0.1–v0.6, v0.8 und v0.9 sind Entwicklungsmeilensteine im Code; v0.7, v1.0 und v6.1 sind teilweise umgesetzt. Eine vollständige manuelle WCAG-2.2-AA-Abnahme bleibt offen. Weitere Ziele behalten ihren Planungsstatus, bis ihre Gates belegt sind.

Der Interface-Feinschliff ergänzt einheitliche SVG-Symbole, kompakte mobile Vorschläge, eine Kontextleiste, zweispaltige Agentenformulare, einen Notizeditor mit Zeichen-/Änderungsanzeige und erklärten Freigaben, Hyperfocus-Phasen und aufklappbare Godot-Szenenoptionen. Leere Modelllisten unterscheiden fehlende Verbindung und erfolglose Suche mit passenden Aktionen. Der Notiz-Leerzustand erstellt einen Chat und kehrt direkt zum Werkzeug zurück. Bestehende Freigaben und Backups bleiben erhalten.

Die aktuelle Testabdeckung umfasst Node- und Browser-Suiten, einschließlich sämtlicher 100 Roadmap-Versionen, Filter, Mobile-Composer und Kontext-Leerzustand. [Roadmap auf Desktop](screenshots/roadmap.png) · [Roadmap auf Mobile](screenshots/roadmap-mobile.png).

## 1.0-Release-Candidate

Der aktuelle Roadmap-Ausbau implementiert Backup-Dry-run und Restore-Wizard mit Rücksetzpunkt sowie die dokumentierte Security-Baseline. [Backup-Bedienung](backup-recovery.md), [Accessibility-Bericht](accessibility-report.md), [Threat Model](security/THREAT-MODEL.md) und [Release-Politik](RELEASE.md) enthalten die prüfbaren Grenzen. Die stabile 1.0-Freigabe bleibt bis zum manuellen Accessibility-Nachweis blockiert. Aktuelle Aufnahmen: [Backup-Vorschau auf Desktop](screenshots/backup-restore.png) und [auf Mobile](screenshots/backup-restore-mobile.png).
