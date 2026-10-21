# Optionale GitHub- und Cryo-Omega-Skill-Integration

**Status:** Diese GitHub-/Skill-Lesebrücke bleibt schreibgeschützt. Die separat aktivierbare Markdown-Ausgabe des Agenten-Workspace ist in [workspace.md](workspace.md) dokumentiert. Sie verbindet GitHub-Inhalte mit dem vorhandenen lokalen Projektwissen. Sie ist **kein** GitHub-Sync, Agentenbetrieb oder Skill-Executor.

## Aktivierung

Auf dem Rechner mit Node.js 20+:

```bash
CRYO_GITHUB_REPOS=Pierreg99/CryoGPTCHATFREEBIE,Pierreg99/cryo-omega-AI-Agentic-Learn-Packages npm start
```

Nur die durch Komma getrennt angegebenen öffentlichen Repositories können gelesen werden. Ohne `CRYO_GITHUB_REPOS` bleibt die Integration deaktiviert. Es gibt **keinen** automatischen API-Token- oder Credential-Import.

In der App:
1. Chat erstellen oder öffnen, dann **Projektwissen** aufklappen.
2. Unter **GitHub & Cryo-Omega Skills** ein freigegebenes Repository auswählen.
3. **README ansehen** oder über **Skills suchen** den Katalog `skills/catalog.json` durchsuchen (falls vorhanden).
4. Vorschau prüfen und bei Bedarf **Als privates Projektwissen übernehmen** wählen. Bestehende Notizen bleiben erhalten, soweit das 4000-Zeichen-Limit reicht.
5. Erst wenn gewünscht das Häkchen **Bei KI-Antworten berücksichtigen** explizit setzen und speichern. Ein Import setzt die Modellfreigabe vorsichtshalber zurück.

## Lokale API

- `GET /api/integrations`: aktivierte, freigegebene Repository-Namen; keine Netzwerkanfrage an GitHub.
- `GET /api/integrations/github?repo=OWNER/REPO&path=README.md`: textuelle Dateivorschau (maximal 3500 Zeichen).
- `GET /api/integrations/skills?repo=OWNER/REPO&q=design`: bis zu 12 Treffer aus `skills/catalog.json`; Skills werden **nicht ausgeführt**.

## Sicherheitsgrenzen

- Lesend und nur öffentliche GitHub-Repositories, keine OAuth-Tokens, keine Mutationen, keine GitHub-Webhooks.
- Feste Upstream-Domain `api.github.com`; kein generischer HTTP-Proxy. Allowlist aus `CRYO_GITHUB_REPOS`.
- Dateien nur mit `.md`, `.txt`, `.json`, `.yml` oder `.yaml`; maximal 256 KiB.
- GitHub-Dateien und Skill-Beschreibungen sind **nicht vertrauenswürdige Inhalte**. Die UI rendert nur Text. Übernommene Hinweise bleiben standardmäßig lokal und werden nicht als Systemanweisung an Ollama übermittelt.
- GitHubs anonyme API kann zeitweise Rate-Limits erreichen. Es werden keine API-Schlüssel im Browser gespeichert.
- Der Server bindet weiterhin ausschließlich an `127.0.0.1`. Nicht öffentlich deployen.

## Nächste Integrationsschritte

- Optionaler, explizit autorisierter Zugriff auf private Repositories (serverseitig verwaltete Credentials und Rechteprüfung).
- Vorschau und Diff vor jedem GitHub-Schreibzugriff, getrennte Berechtigungen.
- Erweiterbare Provider-Schnittstellen für weitere **lokale** und optionale externe Modellserver.
- Gefilterte Skill-Metadaten mit Schema-Validierung und später einer isolierten, zustimmungsbasierten Ausführungsumgebung.
- Browser-E2E-Tests, Caching/Rate-Limit-Anzeige, sichtbare Herkunftsnachweise.
