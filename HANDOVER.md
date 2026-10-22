# HANDOVER · Projektkontext

CryoGPTCHATFREEBIE ist ein lokaler Einzelbenutzer-KI-Workspace mit optionalen Ollama-/OpenAI-Modellen und ausdrücklich bestätigten Entwickler-Integrationen. Der aktuelle Paketstand ist `1.0.0-rc.1`.

## Technischer Einstieg

- `npm start` startet den lokalen Server unter `127.0.0.1:4173`.
- `npm test` führt Node-Tests einschließlich Dokumentationsvertragsprüfung aus.
- `npm ci && npx playwright install chromium && npm run test:e2e` prüft Browser-Flows.
- `npm run release:verify` prüft den reproduzierbaren Paketbau aus sauberem Checkout.

## README-Designsystem

- Hero, Banner und Architekturzeichnungen: [assets/readme](assets/readme/).
- Interaktive Navigation über sechs lokale SVG-Icons in [assets/readme/icons](assets/readme/icons/).
- Galerie: reale, versionierte [Screenshots](docs/screenshots/) aus dem Repository.
- Nativ aufklappbare GitHub-`<details>`, interne Anker und Mermaid für Architektur und Review-Ablauf.
- Kein JavaScript im README, keine Emojis in README-Varianten: [Dokumentationsvertrag](tests/documentation.test.js).
- Statusbadges basieren auf GitHub; keine erfundenen Fortschrittsprozente.
- Die Vorlage orientiert sich an [Pierreg99/Workflows](https://github.com/Pierreg99/Workflows), ohne dortige Ausführungsmöglichkeiten als lokale Features auszugeben.

## Grenzen und Entscheidungen

Cloud- und Schreibzugriffe benötigen ausdrückliche Freigaben. Die stabile 1.0 bleibt durch die manuelle WCAG-2.2-AA-Abnahme blockiert. Kein automatischer Merge ungeprüfter Änderungen.

[README](README.md) · [Release-Politik](docs/RELEASE.md) · [Master-Roadmap](docs/roadmap/ROADMAP-100.md) · [HANDOFF](HANDOFF.md)
