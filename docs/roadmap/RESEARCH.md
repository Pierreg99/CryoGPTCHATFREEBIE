# Rechercheprotokoll · CryoGPTCHATFREEBIE Roadmap (2026-10-21)

## Aktualisierung nach PR #13

Der folgende Recherchebericht dokumentiert den historischen Stand vor dem Workspace-Umbau. Seit [PR #13](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/13) gibt es Browser-E2E und axe-Prüfungen, ein responsives Designsystem, Modellfavoriten, Hyperfocus-Historie, freizugebende Agentenfolgen und separat aktivierbare Markdown-Ausgabe. Node 20/22 und Chromium auf Node 24 wurden in CI erfolgreich geprüft. Externe Modell-/Godot-/GitHub-Schreibdienste bleiben in Tests simuliert.

Die Roadmap wird jetzt zusätzlich als browsbare Ansicht aus derselben Markdown-Datei dargestellt. v0.6 ist umgesetzt; v0.7 und v6.1 sind teilweise umgesetzt. Die übrigen offenen Gates sind weiterhin Planung und keine Release-Tags. Aktuelle Bedienung und Grenzen: [Workspace-Dokumentation](../workspace.md).

## Historischer Recherchebericht

## Untersuchungsumfang

Die Bewertung basiert auf dem öffentlich verbundenen Repository [Pierreg99/CryoGPTCHATFREEBIE](https://github.com/Pierreg99/CryoGPTCHATFREEBIE) (Branch `main` vor Erstellung dieses Dokumentationsbranches). Einbezogen wurden README, Dokumentationsdateien, Quellcode, CI und die Pull-Request-Historie. Dies ist ein **Code-/Dokumentations-Audit**, kein ausgelieferter Penetrationstest, kein vollständiger Browser-E2E-Test und keine Gewähr, dass optionale Provider/Godot lokal eingerichtet sind.

## Nachgewiesener Ist-Zustand

| Bereich | Beleg im Repository | Aussage |
| :--- | :--- | :--- |
| App-Bootstrap | [`package.json`](../../package.json), [`server.mjs`](../../server.mjs) | Node.js ab 20; HTTP nur `127.0.0.1`; Testscript `node --test`; keine Runtime-npm-Abhängigkeiten |
| Chat und Speicherung | [`src/core.js`](../../src/core.js), [`src/storage.js`](../../src/storage.js), [`tests/storage.test.js`](../../tests/storage.test.js) | Chat-Core, versioniertes JSON-Backup, IndexedDB und Fallback; bisher nicht verschlüsselt; Projektwissen mit explizitem Share-Flag |
| Ollama | [`server.mjs`](../../server.mjs), [`src/stream.js`](../../src/stream.js), [`tests/server-stream.test.js`](../../tests/server-stream.test.js) | Lokales Modell optional; Streaming und Stop; echte Modellinferenz nicht in der CI garantiert |
| Optionale Cloud | [`src/providers.mjs`](../../src/providers.mjs), [`docs/model-providers-and-agents.md`](../model-providers-and-agents.md) | Serverseitiger OpenAI-API-Schlüssel + Modell-Allowlist; Cloud-Nutzung ausdrücklich konfigurierbar und bestätigungspflichtig |
| GitHub / Skills | [`src/github-integration.mjs`](../../src/github-integration.mjs), [`docs/integrations.md`](../integrations.md), [`tests/github-integration.test.js`](../../tests/github-integration.test.js) | Nur freigegebene öffentliche GitHub-Repositories; README-Preview und Skill-Katalog als Textdaten; keine automatische Skill-Ausführung |
| Bestätigte Agentenaktion | [`src/agent-ui.js`](../../src/agent-ui.js), [`server.mjs`](../../server.mjs) | Genau ein manuell bestätigter READ-ONLY-Schritt; keine freien Modelltools oder autonome Schreibaktionen |
| Godot MCP | [`src/godot-mcp-client.mjs`](../../src/godot-mcp-client.mjs), [`src/godot-scene-plan.mjs`](../../src/godot-scene-plan.mjs), [`docs/integrations/godot-mcp.md`](../integrations/godot-mcp.md) | Manuelle Projektinspektion und optional neue Szenen nach gesonderter Freigabe; Fremd-MCP ist ausführbarer lokaler Code |
| CI | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | GitHub Actions führt Node.js-Tests unter Node 20/22 aus; keine umfassenden Browser-E2E/Live-Godot/GPU-Matrizen |
| README-Branding | [`README.md`](../../README.md), [`assets/readme`](../../assets/readme) | Cryo-Neon-Header, Übersicht der vier Module und Schema-Architektur als editierbare SVGs |

## Nachgewiesene GitHub-Historie

In GitHub wurden die Pull Requests [#1](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/1) bis [#9](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/9) als **merged** gefunden, einschließlich v0.1 Bootstrap, v0.2 Streaming, v0.3 Speicher, Godot (#5/#6), GitHub-/Skills (#7), Provider-/Agenten (#8) und README-Redesign (#9). Es wurden **keine GitHub Releases** gefunden. Deshalb beschreiben v0.1–v0.4 in der Roadmap **historische Entwicklungsphasen**, nicht überprüfte Release-Tags.

Bei der Untersuchung waren in der öffentlichen Issues-Liste **keine offenen, regulären Issues** sichtbar. Das ist keine Garantie, dass kein weiterer interner Backlog existiert.

## Laufender Ausbau

Hyperfocus v0.5 wurde über [PR #10](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/10) in `main` gemergt. Ein Test zur Schreibweise von „15 Minuten“ wurde danach über [PR #12](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/12) behoben; dessen Node-CI war erfolgreich. **Noch offen:** Browser-End-to-End, Live-GitHub-Probelauf und echter Ollama-Durchstich. Der Autopilot führt ohne eigenes Tool-Reasoning ausschließlich öffentliche README-/Skill-Lesevorgänge und optional eine einmalige lokale Ollama-Planung durch. Die Ziele 15/25/45 Minuten bezeichnen Arbeitsblöcke, keine länger laufenden Serverprozesse.

## Einordnung der Risiken

- **Vertraulichkeit:** Browserdaten und JSON-Backups sind aktuell unverschlüsselt. Auch eine lokale App kann Daten über explizit konfiguriertes OpenAI oder remote Ollama übertragen.
- **Externe Texte:** README/Skills sind untrusted; sie dürfen keine privilegierten Systeminstruktionen oder Tool-Rechte erzeugen.
- **MCP-Sicherheit:** Eine Read-only-Werkzeugliste begrenzt *Aufrufe*, isoliert aber den externen Godot-MCP-Prozess nicht. Sandbox, Allowlist und lokale Testprojekte bleiben zentrale Gates.
- **Autonomie:** Schreibende Agenten, freie Shell, private GitHub-Integrationen und Multi-User-/Sync-Funktionen sind nicht als Ist-Zustand belegt.
- **Qualität:** Das Vorhandensein grüner Node-Tests reicht nicht für eine produktionsreife Sicherheits-/Usability-Aussage. Browser-E2E, echte Modell-/Godot-Tests und unabhängige Audits sind zukünftige Arbeit.

## Methode für alle 100 Versionsschritte

Die 100 Einträge in [`ROADMAP-100.md`](ROADMAP-100.md) enthalten je **ein Lieferobjekt und einen testbaren Abnahmepunkt**. Die Themen sind so gestaffelt, dass erst Datensicherung, Tests, sichere Berechtigungen und Isolation folgen, bevor GitHub-Schreibzugriff, Plugins, Sync und breitere Agentenrechte möglich werden. Versionen **v0.6–v10.0** sind ausdrücklich Planung, keine bereits ausgelieferten Features oder zugesagten Daten.

## Nächster überprüfbarer Schritt

- Für v0.5: bereits gemergten MVP im echten Browser testen, insbesondere Abbruch, Quelle und Consent vor dem Live-Einsatz.
- Für v0.6: echte Browser-E2E-Abdeckung priorisieren; vor neuen Agentenrechten den Aufruf-/Berechtungsplan härten.
- Änderungen an Scope oder Priorität in GitHub-Issues/PRs nachhalten statt unbelegte Erfolgsmeldungen in die README zu schreiben.
