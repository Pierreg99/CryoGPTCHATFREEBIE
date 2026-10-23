# PLAN · CryoGPTCHATFREEBIE

Stand: 23. Oktober 2026.

## Workbench-Meilenstein

| Aufgabe | Akzeptanzkriterium | Umsetzung |
| --- | --- | --- |
| Oberfläche umfassend überarbeiten | Konsistente acht Ansichten, gruppierte Navigation, responsive Startansicht und echter Modus-/Speicherstatus | `src/workbench.js`, `src/workbench.css` |
| Schneller navigieren | Befehlssuche per Strg+K/Cmd+K, Filter, Pfeiltasten, Escape und Fokusrückgabe | `e2e/workbench.spec.js` |
| Gespräche bearbeiten | Nachrichtensuche mit Trefferwechsel, Desktop-Fokusmodus und Zeichenzähler | Browser-Regressionstests |
| Bestehende Funktionen absichern | Chat/Streaming, Backup/Undo, Modellwahl, Skills-/Agentenfreigaben weiter funktionsfähig | Vollständige Node- und Browser-Suiten |
| Dokumentation synchronisieren | Aktuelle Screenshots, reproduzierbarer Capture-Befehl, README, Audit und Übergaben | `docs/workbench-overhaul.md` |

## Offene Qualitätsgates

1. PR-CI mit Node 20/22/24, regulärem Playwright-Chromium und reproduzierbarem Paketbau prüfen.
2. PR-Diff und GitHub-Regeln vor einer Integration prüfen.
3. Manuelle WCAG-2.2-AA-Abnahme einschließlich neuer Fälle M11–M13 mit realer Assistive Technology durchführen. [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22) bleibt offen; Stable-1.0 bleibt blockiert.

[Workbench](docs/workbench-overhaul.md) · [PROGRESS](PROGRESS.md) · [Release-Gates](docs/RELEASE-CHECKLIST.md) · [Workflow-Referenz](https://github.com/Pierreg99/Workflows)

## Roadmap v1.1 · Fehlerzentrale (PR #25)

| Arbeit | Stand | Gate |
| --- | --- | --- |
| Fehler aus Speicher, Modellstatus, KI-Anfragen und Aktionen bündeln | In `main` über PR #25; CI-Nachbesserung in PR #26 | [src/error-center.js](src/error-center.js) |
| Speicherversuch/Modellstatus ausdrücklich wiederholen | Entwicklungsbranch | Keine impliziten Cloud- oder Schreiboperationen |
| Kontextsichere Fehleranzeige, Fokusrückgabe und Begrenzung | Entwicklungsbranch | Node- und Browser-Tests auf exaktem PR-Head |
| Realer Screenreader-Test der Fehlerzentrale | offen | M14 im [Accessibility-Bericht](docs/accessibility-report.md) |

PR #25 wurde trotz roter Roadmap-Assertion nach `main` integriert. Die angepasste Statuszählung und Dokumentation müssen im Reparatur-PR #26 auf dem finalen Head unter Node 20/22/24 und Chromium geprüft werden. Das REQUIRED-Gate aus Issue #22 bleibt unverändert offen. Danach v1.2 Performance und v1.3 Suche priorisieren.
