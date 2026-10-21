<div align="center">
  <img src="../../assets/readme/banner-clean.svg" alt="CryoGPTCHATFREEBIE – Professional / Clean, editierbare Produktillustration" width="100%" />
  <h1>CryoGPTCHATFREEBIE</h1>
  <p><strong>Deine Chats. Deine Modelle. Deine Kontrolle.</strong></p>
  <p><code>1.0.0-rc.1</code> · <code>LOCAL FIRST</code> · <code>PROVIDER: OPT-IN</code></p>
  <p><a href="#schnellstart">Schnellstart</a> · <a href="#funktionen">Funktionen</a> · <a href="#roadmap">Roadmap</a> · <a href="../../README.md">Haupt-README</a></p>
</div>

## Überblick

Ein übersichtlicher lokaler Workspace für Gespräche, Projektwissen und bewusst freigegebene Entwickler-Werkzeuge. Ohne ausgewähltes Modell bleibt die App ein lokales Chat-Notizbuch; sie simuliert keine KI-Antworten. Die Banner sind Illustrationen. [Echte Desktop-Ansicht](../screenshots/workspace-desktop.png) · [Mobile Ansicht](../screenshots/workspace-mobile.png)

**Release Candidate, noch keine stabile 1.0:** Die manuelle WCAG-2.2-AA-Abnahme mit echter assistiver Technik ist offen. [Release-Politik](../RELEASE.md) und [Release-Checkliste](../RELEASE-CHECKLIST.md) benennen das blockierende Gate.

## Schnellstart

Empfohlen sind Node.js 22.12+ oder Node 24, Linux x64 und aktuelles Chromium. Node 20 bleibt in den Kompatibilitätstests; andere Plattformen/Browser sind experimentell.

```bash
git clone https://github.com/Pierreg99/CryoGPTCHATFREEBIE.git
cd CryoGPTCHATFREEBIE
npm start
```

Öffne [http://127.0.0.1:4173](http://127.0.0.1:4173) auf demselben Rechner. Der Start benötigt keine npm-Laufzeitabhängigkeiten; Browser-Tests verwenden Entwicklungsabhängigkeiten.

Optional [Ollama](https://ollama.com/) lokal starten, beispielsweise `ollama pull qwen2.5:3b` ausführen und in der Modellzentrale die Liste aktualisieren. Das Modell muss ausdrücklich ausgewählt werden. Standardziel ist `127.0.0.1:11434`; `OLLAMA_URL` kann einen anderen Server festlegen.

## Funktionen

| Bereich | Aktueller Stand |
| :--- | :--- |
| Chat | Responsive Oberfläche, Gesprächsverwaltung, Volltextsuche, Streaming, Antwort-Stopp und Kopieren |
| Daten und Backup | IndexedDB mit localStorage-Fallback; Schema-1/2-Import mit Dry-run, Fehlerbericht und Rücksetzpunkt |
| Projektwissen | Lokale Notizen je Chat; Modellkontext erst nach gespeicherter Freigabe |
| Modelle | Ollama lokal, OpenAI optional; manuelle Auswahl, Suche und Favoriten |
| Hyperfocus | Bestätigter, begrenzter Rechercheablauf; optional Ollama-Zusammenfassung und lokale Historie |
| Agenten und GitHub | Bis zu fünf einzeln bestätigte Leseaktionen; Markdown-Ausgabe nur mit getrenntem serverseitigem Opt-in und Vorschau |
| Skills | Öffentliche freigegebene Referenzen suchen und prüfen; keine automatische Skill-Ausführung |
| Godot MCP | Manuelle Projektinspektion; neue Szenen nach Opt-in, Vorschau und Bestätigung |
| Roadmap | 100 Meilensteine mit Suche, Phasen-/Statusfilter und Abnahmekriterien |

OpenAI benötigt einen serverseitigen Schlüssel und eine Modellfreigabeliste. Jede Cloud-Anfrage verlangt eine Bestätigung und kann Kosten verursachen. GitHub-Lesezugriffe benötigen `CRYO_GITHUB_REPOS`; die gesondert aktivierte GitHub-Ausgabe erstellt Branches und PRs, ohne direkte Änderungen oder Merges auf `main`. [Provider und Agenten](../model-providers-and-agents.md) · [Vollständige Workspace-Konfiguration](../workspace.md) · [Godot-Einrichtung](../integrations/godot-mcp.md)

## Architektur und Daten

<img src="../../assets/readme/architecture-v2.svg" alt="Browser mit IndexedDB, lokaler Node.js-Server und ausdrücklich konfigurierte Provider-, GitHub- und Godot-Verbindungen" width="100%" />

Der Browser speichert Chats und Projektwissen in IndexedDB; localStorage ist der Fallback. Der lokale Node.js-Server validiert Anfragen und verbindet konfigurierte Dienste. Alle Daten und JSON-Exporte bleiben unverschlüsselt. Vor dem Import bietet der Assistent Vorschau, Export des aktuellen Stands und ausdrückliche Freigabe. IndexedDB speichert Import und Rücksetzpunkt atomar. [Backup-Wiederherstellung und Grenzen](../backup-recovery.md)

Favoriten, Bewegungseinstellungen und Hyperfocus-Historie gehören nicht zum Chat-JSON-Backup. Externe Exporte bleiben für eine geräteunabhängige Sicherung notwendig.

## Tests und Qualität

```bash
npm test
npm ci
npx playwright install chromium
npm run test:e2e
# Nur aus einem sauberen, committed Checkout:
npm run release:verify
```

Für Browser-Entwicklung Node 24 verwenden. CI prüft Node 20/22/24, Chromium, mobile Layouts, Tastatur, axe-Regeln, Recovery-Fehler und reproduzierbare Quellpakete. Externe Dienste werden simuliert; echte Modellinferenz und Live-Godot sind nicht dadurch belegt. [Accessibility-Bericht](../accessibility-report.md)

## Sicherheit

Der Server bindet an `127.0.0.1` und besitzt keine Anmeldung oder Mehrbenutzerverwaltung. Er ist für den lokalen Einzelbenutzerbetrieb vorgesehen. Chats, Projektnotizen, Rücksetzpunkte und JSON-Backups sind unverschlüsselt. Modelle erhalten den ausdrücklich freigegebenen Kontext; OpenAI und extern konfiguriertes Ollama können Daten vom Rechner übertragen.

Shell-Ausführung, autonome Skill-Ausführung, verschlüsselter Speicher und Cloud-Sync sind nicht implementiert. Lokale Markdown-Ausgabe benötigt Linux und eine eigene Freigabe. Godot MCP bleibt ausführbarer Fremdcode in einem geprüften lokalen Testprojekt. [Bedrohungsmodell](../security/THREAT-MODEL.md)

## Roadmap

Alle Designvarianten verwenden die [Master-Roadmap mit 100 Meilensteinen](../roadmap/ROADMAP-100.md) und deren [Statusbelege](../roadmap/RESEARCH.md). Es gibt keinen separaten Neon-, Clean- oder Produkt-Versionsplan.

v0.1–v0.6, v0.8 und v0.9 sind im Code umgesetzt. v0.7, v1.0 und v6.1 sind teilweise umgesetzt; die übrigen Meilensteine sind geplant. Diese Nummern beschreiben Entwicklungsziele und sind keine Release-Tags oder Lieferzusagen. Der nächste Schritt zur stabilen 1.0 ist die dokumentierte manuelle Accessibility-Abnahme.

[Interaktive Roadmap auf Desktop](../screenshots/roadmap.png) · [auf Mobile](../screenshots/roadmap-mobile.png)

## Mitmachen

[Issue öffnen](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues) oder einen Pull Request einreichen. Relevante Tests ausführen; API-Schlüssel und private Chat-Backups nicht veröffentlichen.

---

**Designvariante: Professional / Clean** · [Zur Haupt-README](../../README.md) · [Changelog](../../CHANGELOG.md)
