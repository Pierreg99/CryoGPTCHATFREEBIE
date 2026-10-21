# Code- und Dokumentationsabgleich der Roadmap

Stand: 21. Oktober 2026. Grundlage ist der über [PR #16](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/16) gemergte Release Candidate **1.0.0-rc.1**, ergänzt um den Abgleich der README-Varianten und die Emoji-freie Oberfläche. Die Bewertung ist ein Code-/Dokumentationsabgleich und kein Penetrationstest oder Nachweis echter Modell-/Godot-Installationen.

## Gemeinsame Quelle

[ROADMAP-100.md](ROADMAP-100.md) enthält alle 100 Meilensteine von v0.1 bis v10.0. Haupt-README sowie Clean-, Neon- und Produktvariante verweisen auf diese Quelle. Die GUI liest dieselbe Markdown-Datei über `GET /api/roadmap`; es existiert kein gesonderter Neon-Versionsplan.

Status wird aus den ausgeschriebenen Bezeichnungen „Historisch implementiert“, „MVP im Code“, „Implementiert“, „Teilweise umgesetzt“ und „Geplant“ ermittelt. Unbekannte Bezeichnungen, fehlende Abnahmekriterien und unvollständige Versionsreihen werden abgewiesen. Farbe und Icons bestimmen keinen Umsetzungsstatus.

## Nachgewiesener Stand

| Bereich | Beleg | Aussage |
| :--- | :--- | :--- |
| Start und Provider | [Server](../../server.mjs), [Provider](../../src/providers.mjs) | Loopback-Einzelbenutzerbetrieb; Ollama optional, OpenAI nur mit Schlüssel, Modellfreigabeliste und Bestätigung pro Anfrage |
| Chat und Speicherung | [Core](../../src/core.js), [Storage](../../src/storage.js) | Streaming, Abbruch, versionierte Backups, IndexedDB-Migration und localStorage-Fallback |
| Wiederherstellung | [Recovery](../backup-recovery.md), [Browser-Nachweise](../../e2e/recovery.spec.js) | Dry-run, redigierter Bericht, expliziter Import und atomarer IndexedDB-Rücksetzpunkt; Fallback-Grenzen dokumentiert |
| Workspace und Accessibility | [Bedienung](../workspace.md), [Prüfbericht](../accessibility-report.md) | Acht responsive Ansichten, SVG-Icons, Tastatur-/Fokusführung, reduzierte Bewegung und axe; manuelle Assistive-Technology-Abnahme offen |
| GitHub und Skills | [Integration](../../src/github-integration.mjs), [Agenten-Ausgabe](../../src/agent-workspace.mjs) | Freigegebene öffentliche Lesequellen; gesondert aktivierbare Markdown-Ausgabe mit Vorschau, Branch und PR; keine autonome Skill-Ausführung |
| Hyperfocus | [Workflow](../hyperfocus-workflow.md), [Browser-Tests](../../e2e/workspace.spec.js) | Begrenzter bestätigter Rechercheplan, optionale Ollama-Synthese und lokale Historie |
| Godot MCP | [Client](../../src/godot-mcp-client.mjs), [Anleitung](../integrations/godot-mcp.md) | Manuelle Inspektion und optional neue Szenen; externer MCP-Prozess ist weiterhin nicht sandboxed |
| Sicherheitsgrenzen | [Threat Model](../security/THREAT-MODEL.md), [HTTP-Tests](../../tests/security.test.js) | Host-/Origin-/CSP-Prüfungen, Request-/Zeit-/Parallelitätslimits und negative API-Tests |
| CI und Paketbau | [CI](../../.github/workflows/ci.yml), [Release-Politik](../RELEASE.md) | Node 20/22/24, Chromium-/Accessibility-/Recovery-Tests und bytegleiche Quellarchive mit Herkunftsmanifest |

## Versionsstatus

- **Umgesetzt:** v0.1–v0.6, v0.8 und v0.9; insgesamt acht Entwicklungsmeilensteine.
- **Teilweise umgesetzt:** v0.7, v1.0 und v6.1. Die technische Accessibility-Abdeckung und das responsive Design sind vorhanden; vollständige Abnahmen bleiben offen.
- **Geplant:** die übrigen 89 Meilensteine. Keine Zusage von 100 Releases, festen Terminen oder bereits verfügbaren Zukunftsfunktionen.

Es werden keine Release-Tags aus den Roadmap-Nummern abgeleitet. Die tatsächliche Anwendungsversion stammt aus [package.json](../../package.json). **1.0.0-rc.1 ist keine stabile 1.0.0.** Die [Release-Checkliste](../RELEASE-CHECKLIST.md) blockiert stabile Pakete bis zum dokumentierten manuellen Accessibility-Nachweis.

## Historische Belege

Die ursprünglichen PRs [#1](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/1) bis [#9](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/9) führten Chat, Streaming, Speicherung, Godot, GitHub/Skills, Provider und Branding ein. [PR #10](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/10) ergänzte Hyperfocus; [PR #12](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/12) korrigierte einen zugehörigen Test. [PR #13](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/13) brachte Workspace, Agenten-Erweiterungen und Browser-E2E. [PR #15](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/15) ergänzte Interface-Feinschliff und die browsbare Roadmap. PR #16 lieferte Recovery, Security-Baseline und Release-Gates.

Frühere README-Varianten beschrieben Alpha 0.1, localStorage als Hauptspeicher und Streaming/Browser-E2E als Zukunft. Diese Angaben sind durch den heutigen Code überholt und wurden in allen drei Varianten ersetzt.

## Offene Nachweise und nächster Schritt

Die stabile 1.0 benötigt die im [Accessibility-Bericht](../accessibility-report.md) aufgeführten realen Screenreader-/Browser-Flows sowie dokumentierte Ergebnisse zu Zoom, Textabständen, Fokus und Lesereihenfolge. Automatische axe-Prüfungen ersetzen diese Abnahme nicht.

Echte Modellinferenz, Live-GitHub-/Godot-Betrieb, physische Mobilgeräte, Sandbox, verschlüsselter Speicher, Multi-User und Sync bleiben gesonderte Nachweise beziehungsweise zukünftige Gates. Bereits vorhandene bestätigte Markdown-Ausgabe ist keine allgemeine autonome Schreibberechtigung. Änderungen werden mit Code, Tests und PR-Belegen abgeglichen; nur danach wird der zugehörige Meilenstein aktualisiert.
