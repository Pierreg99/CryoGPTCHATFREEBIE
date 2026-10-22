# HANDOVER · Projektkontext

CryoGPTCHATFREEBIE ist ein lokaler Einzelbenutzer-KI-Workspace mit optionalen Ollama-/OpenAI-Modellen und explizit bestätigten Entwickler-Integrationen. Der aktuelle Paketstand ist `1.0.0-rc.1`.

## Technischer Einstieg

- `npm start` startet den lokalen Server unter `127.0.0.1:4173`.
- `npm test` führt Node-Tests aus.
- `npm ci && npx playwright install chromium && npm run test:e2e` prüft Browser-Flows.
- `npm run release:verify` prüft den reproduzierbaren Paketbau aus sauberem Checkout.

## Grenzen und Entscheidungen

Cloud- und Schreibzugriffe benötigen ausdrückliche Freigaben. Die stabile 1.0 bleibt durch die manuelle Accessibility-Abnahme blockiert. Kein automatischer Merge ungeprüfter Änderungen.

[README](README.md) · [Release-Politik](docs/RELEASE.md) · [Master-Roadmap](docs/roadmap/ROADMAP-100.md)
