# HANDOVER · Projektkontext

CryoGPTCHATFREEBIE ist ein lokaler Einzelbenutzer-KI-Workspace mit optionalen Ollama-/OpenAI-Modellen und ausdrücklich bestätigten Entwickler-Integrationen. Paketstand: `1.0.0-rc.1`.

## Einstieg

- `npm start`: Server unter `127.0.0.1:4173`.
- `npm test`: Node-Tests einschließlich Sicherheits- und Dokumentationschecks.
- `npm ci && npx playwright install chromium && npm run test:e2e`: Browser-Regressionen.
- `npm run release:verify`: Reproduzierbarer Paketbau aus sauberem Commit.
- `npm run screenshots`: Offline-Galerie mit frischem Profil aktualisieren.

## Architektur und Darstellung

`src/app.js` verwaltet Store und Modell-/Chat-Lebenszyklus. `src/workspace.js` verwaltet die acht Ansichten. `src/workbench.js` ergänzt Startbereich, Befehlssuche, Gesprächssuche und Fokusmodus über bestehende Aktionen und Events. `src/workbench.css` wird als abschließende Shell-Schicht nach den vorhandenen Komponentenstyles geladen. Seit PR #25 ergänzt `src/error-center.js` eine flüchtige Fehlerwarteschlange (maximal 20, `textContent`-Darstellung) und sichere, nur manuell ausgeführte Retry-Aktionen. Keine neue Laufzeitabhängigkeit.

Die Befehlssuche startet keine KI-Anfragen. Fokuspräferenz: `cryo-focus-v1` in localStorage, nicht im Chat-Backup. Suchtext bleibt im Arbeitsspeicher. [Details und Prüfumgebung](docs/workbench-overhaul.md).

## Dokumentation

README mit lokalen SVG-Kacheln, echten Screenshots, Details und Mermaid. Keine Emojis in README-Varianten. Das Hero-SVG ist eine Illustration, die PNG-Galerie zeigt den echten Offline-Workspace. Statusaussagen bleiben an den jeweiligen Commit und dessen CI gebunden.

## Offene Abnahme

Cloud- und Schreibzugriffe bleiben ausdrücklich freizugeben. Stable-1.0 wartet auf die reale manuelle WCAG-2.2-AA-Abnahme einschließlich Workbench-Fällen M11–M13 und der neuen Fehlerzentrale M14. [Release-Gates](docs/RELEASE-CHECKLIST.md) · [Accessibility-Bericht](docs/accessibility-report.md) · [HANDOFF](HANDOFF.md).
