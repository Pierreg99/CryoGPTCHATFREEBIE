<div align="center">

<img src="assets/readme/hero-v2.svg" alt="CryoGPTCHATFREEBIE – lokaler KI-Workspace im Cryo-Neon-Design" width="100%" />

# ❄️ CryoGPTCHATFREEBIE

**Deine Chats · Deine Modelle · Deine Kontrolle**

Lokaler, datenschutzbewusster KI-Workspace mit optionalen Modellen und explizit freigegebenen Entwickler-Workflows.

[![CI](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/workflows/ci.yml/badge.svg)](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Pierreg99/CryoGPTCHATFREEBIE?include_prereleases&label=GitHub%20Release)](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/releases)
[![Issues](https://img.shields.io/github/issues/Pierreg99/CryoGPTCHATFREEBIE)](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/Pierreg99/CryoGPTCHATFREEBIE)](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/Pierreg99/CryoGPTCHATFREEBIE/main)](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/commits/main)
[![License](https://img.shields.io/github/license/Pierreg99/CryoGPTCHATFREEBIE)](https://github.com/Pierreg99/CryoGPTCHATFREEBIE)

**Anwendungsversion: `1.0.0-rc.1` · LOCAL FIRST · PROVIDER OPT-IN**

[🚀 Schnellstart](#schnellstart) · [✨ Funktionen](#funktionen) · [🎨 Designs](#drei-designwelten) · [🏗 Architektur](#systemarchitektur) · [🧪 Qualität](#tests-und-release-prüfung) · [🛡 Sicherheit](#datenschutz-und-grenzen) · [🗺 Roadmap](#roadmap) · [📊 Projektzentrale](#projektzentrale)

</div>

> [!IMPORTANT]
> **Release Candidate, keine stabile 1.0.** Die manuelle WCAG-2.2-AA-Abnahme mit assistiver Technik ist noch offen. CI-Badges zeigen den tatsächlichen GitHub-Workflowstatus, nicht eine zugesicherte Produktfreigabe.

## Aktueller Stand

**1.0.0-rc.1 ist ein Release Candidate.** Die stabile 1.0 wartet auf die dokumentierte manuelle WCAG-2.2-AA-Abnahme mit echter assistiver Technik. Offene Gates blockieren den stabilen Paketbau. [Release-Politik](docs/RELEASE.md) · [Release-Checkliste](docs/RELEASE-CHECKLIST.md) · [Changelog](CHANGELOG.md)

Der Cryo-Neon-Workspace bietet acht Ansichten: Chat, Projektwissen, Hyperfocus, Agenten, GitHub & Skills, Godot MCP, Roadmap und Modellzentrale. Die Oberfläche nutzt einheitliche SVG-Icons, mobile Navigation, Tastaturbedienung und pausierbare Animationen. Ohne ausgewähltes Modell dient sie als lokales Chat-Notizbuch.

![Aktueller Cryo-Neon-Workspace auf Desktop](docs/screenshots/workspace-desktop.png)

[Mobile Ansicht](docs/screenshots/workspace-mobile.png) · [Bedienung und Konfiguration](docs/workspace.md)

## Schnellstart

**Empfohlen:** Node.js 22.12+ oder Node 24, Linux x64 und aktuelles Chromium. Die Node-Tests prüfen weiterhin Kompatibilität mit Node 20. Andere Plattformen und Browser sind experimentell; Details stehen in der [Kompatibilitätspolitik](docs/RELEASE.md).

```bash
git clone https://github.com/Pierreg99/CryoGPTCHATFREEBIE.git
cd CryoGPTCHATFREEBIE
npm start
```

Öffne **[http://127.0.0.1:4173](http://127.0.0.1:4173)** auf demselben Rechner. Der Start benötigt keine npm-Laufzeitabhängigkeiten. `npm ci` wird für Browser-Tests benötigt. Der Server akzeptiert die kanonische Loopback-Adresse; verwende diese auch anstelle von `localhost`.

### Optional: Ollama verbinden

1. [Ollama installieren](https://ollama.com/) und lokal starten.
2. Ein Modell herunterladen, beispielsweise `ollama pull qwen2.5:3b`.
3. Ollama unter `127.0.0.1:11434` bereitstellen.
4. In der Modellzentrale die Liste aktualisieren und das Modell ausdrücklich auswählen.

`OLLAMA_URL` kann einen anderen Modellserver festlegen. Bei einem externen Server verlässt der übermittelte Kontext deinen Rechner. Ohne Modell werden keine KI-Antworten simuliert.

## Funktionen

Die [vollständige Feature-Checkliste im Changelog](CHANGELOG.md) hakt abgeschlossene Funktionen ab und führt noch offene Release-Abnahmen getrennt auf.

<img src="assets/readme/capabilities.svg" alt="Vier Bereiche: lokaler Chat, optionale Modellanbieter, geprüfte GitHub-/Skill-Referenzen und manuell freigegebene Godot-Werkzeuge" width="100%" />

| Bereich | Aktuelles Verhalten |
| :--- | :--- |
| Chat | Unterhaltungen erstellen, durchsuchen, umbenennen und löschen; Antworten streamen, stoppen und kopieren |
| Daten | IndexedDB mit localStorage-Fallback; JSON-Export und Import für Backup-Schema 1/2 mit Dry-run, Fehlerbericht und Rücksetzpunkt |
| Projektwissen | Bis zu 4.000 Zeichen je Chat; Übergabe an ein Modell erst nach gespeicherter Freigabe |
| Modelle | Ollama und optional OpenAI; manuelle Auswahl, Suche und lokal gespeicherte Favoriten |
| Hyperfocus | Ein freigegebener, begrenzter Rechercheplan; optional Ollama-Zusammenfassung und lokale Historie |
| Agenten | Bis zu fünf einzeln bestätigte Leseaktionen; optionale Markdown-Ausgabe nach separater Aktivierung und Vorschau |
| GitHub & Skills | Öffentliche freigegebene README-, Datei-, Struktur- und Skill-Referenzen prüfen und bewusst übernehmen |
| Godot MCP | Lokale Versions-/Projektprüfung; neue Szenen nur mit Opt-in, Vorschau und Bestätigung |
| Roadmap | Alle 100 Meilensteine mit Suche, Phasen-/Statusfilter, Lieferobjekt und Abnahmekriterium |

### Modelle und kontrollierte Agenten

OpenAI benötigt serverseitig `OPENAI_API_KEY` und die Modellfreigabeliste `CRYO_OPENAI_MODELS`. Jede Cloud-Anfrage verlangt eine Bestätigung und kann API-Kosten verursachen. Der Browser speichert keine API-Schlüssel. [Modellanbieter und Agentenschritte](docs/model-providers-and-agents.md)

Die GitHub-Leseintegration wird mit einer expliziten Liste öffentlicher Repositories aktiviert:

```bash
CRYO_GITHUB_REPOS=Pierreg99/CryoGPTCHATFREEBIE,Pierreg99/cryo-omega-AI-Agentic-Learn-Packages npm start
```

Öffne **GitHub & Skills** in der Navigation. Skills werden als Referenzdaten behandelt und nicht automatisch ausgeführt. Hyperfocus verwendet einen festen, zuvor bestätigten Ablauf. [Integrationen](docs/integrations.md) · [Hyperfocus](docs/hyperfocus-workflow.md)

Markdown-Ausgabe ist standardmäßig gesperrt. Lokale Ausgabe benötigt `CRYO_LOCAL_WRITES=true` und einen vorhandenen `CRYO_OUTPUT_DIR`; sie erstellt ausschließlich neue `.md`-Dateien und verwendet Linux `/proc/self/fd`. GitHub-Ausgabe benötigt eigene Schreibfreigaben und erzeugt neue Branches und Pull Requests. Sie ändert `main` nicht direkt und führt keinen Merge durch. [Vollständige Konfiguration und Grenzen](docs/workspace.md)

### Backup-Wiederherstellung

**Import** prüft die Datei vor jeder Änderung. Der Assistent zeigt Format, Umfang, Kontextfreigaben und Fehler und bietet einen Export des bisherigen Stands. Nach ausdrücklicher Zustimmung werden neuer Stand und Rücksetzpunkt in IndexedDB atomar gespeichert. **Letzten Import zurücksetzen** stellt die vorherigen Chats wieder her; **Rücksetzpunkt löschen** entfernt die zusätzliche lokale Kopie. [Backup-Anleitung und Fallback-Grenzen](docs/backup-recovery.md)

### Godot MCP

Eine manuell konfigurierte Verbindung zu [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp) unterstützt `get_godot_version` und `get_project_info`. Jede Abfrage benötigt eine Freigabe.

Optional erstellt der Szenenassistent neue `Node2D`-, `Node3D`- oder `Control`-Szenen in `scenes/cryogptchat/`. Er benötigt `GODOT_SCENE_WRITES=true`, eine Vorschau und die Bestätigung `ERSTELLEN`. Tickets sind einmalig und zwei Minuten gültig; bestehende Szenen werden nicht überschrieben. Das externe MCP-Programm ist ausführbarer Fremdcode und bleibt auf ein geprüftes lokales Projekt zu beschränken. [Installation und Sicherheitsgrenzen](docs/integrations/godot-mcp.md)

## Drei Designwelten

Clean, Neon und Produktansicht verwenden dieselben aktuellen Funktions- und Release-Angaben. Ihre Banner bleiben editierbare SVG-Illustrationen; sie sind keine Live-Screenshots.

| Clean | Neon | Produkt |
| :---: | :---: | :---: |
| [![Helles, ruhiges Clean-Design](assets/readme/banner-clean.svg)](docs/readme-variants/01-clean.md) | [![Neon-Design mit holografischem Kristall](assets/readme/banner-neon.svg)](docs/readme-variants/02-neon.md) | [![Produktillustration des Chat-Workspace](assets/readme/banner-product.svg)](docs/readme-variants/03-product.md) |
| [Professional / Clean](docs/readme-variants/01-clean.md) | [Futuristic / Neon](docs/readme-variants/02-neon.md) | [App / Landing Page](docs/readme-variants/03-product.md) |

Alle Grafiken liegen in [assets/readme](assets/readme/); externe Bild-CDNs sind nicht erforderlich.

## Systemarchitektur

<img src="assets/readme/architecture-v2.svg" alt="Browser mit IndexedDB und Rücksetzpunkt, lokaler Node.js-Server und ausdrücklich konfigurierte Modell-, GitHub- und Godot-Verbindungen" width="100%" />

| Schicht | Einstieg | Aufgabe |
| :--- | :--- | :--- |
| Oberfläche | [index.html](index.html), [Workspace](src/workspace.js), [Designsystem](src/interface.css) | Acht Ansichten, SVG-Icons, mobile Navigation und Fokusführung |
| Chat und Speicher | [Core](src/core.js), [Speicherung](src/storage.js), [Recovery](src/recovery-storage.js) | Schema, Migration, atomare Snapshots und Wiederherstellung |
| Server und Modelle | [Server](server.mjs), [Provider](src/providers.mjs), [Request-Grenzen](src/security.mjs) | Loopback-API, Streaming, Validierung und Limits |
| Entwickler-Werkzeuge | [GitHub](src/github-integration.mjs), [Agenten-Ausgabe](src/agent-workspace.mjs), [Godot MCP](src/godot-mcp-client.mjs) | Explizite Freigaben und begrenzte Zugriffe |
| Qualität und Release | [Tests](tests/), [Browser-Tests](e2e/), [CI](.github/workflows/ci.yml), [Paketbau](scripts/release.mjs) | Node-/Browser-Prüfungen und reproduzierbare Quellarchive |

## Tests und Release-Prüfung

```bash
npm test
npm ci
npx playwright install chromium
npm run test:e2e
# Aus einem sauberen, committed Checkout:
npm run release:verify
```

Für die Browser-Entwicklung Node 24 verwenden. CI prüft Node 20/22/24, Chromium bei mobilen und Desktop-Breiten, Tastatur, axe-Regeln, Wiederherstellungsfehler und reproduzierbare Pakete. Externe Dienste werden simuliert; echte Modellinferenz, Live-Godot und eine vollständige manuelle Accessibility-Abnahme werden dadurch nicht belegt. [Accessibility-Prüfbericht](docs/accessibility-report.md)

## Datenschutz und Grenzen

- Chats, Projektwissen, Rücksetzpunkt und JSON-Exporte sind **unverschlüsselt**. Favoriten, Bewegungseinstellungen und Hyperfocus-Historie liegen ebenfalls lokal; sie gehören nicht zum Chat-JSON-Backup.
- Ein ausgewähltes Modell erhält Gesprächskontext. Gespeichertes Projektwissen wird nur nach chatbezogener Freigabe mitgegeben. OpenAI und externes Ollama können Daten vom Rechner übertragen.
- Der Server bindet an `127.0.0.1`. Es gibt keine Anmeldung, Mehrbenutzerverwaltung oder Freigabe für öffentliches Hosting.
- Shell-Ausführung, autonome Skill-Ausführung, verschlüsselter Speicher und Cloud-Sync sind nicht implementiert. Optionale Markdown-Ausgabe ist getrennt freizugeben.
- JSON-Exporte regelmäßig sichern. Wer Daten endgültig entfernt, muss Rücksetzpunkt und externe Exportdateien berücksichtigen.

[Bedrohungsmodell und geprüfte Sicherheitsgrenzen](docs/security/THREAT-MODEL.md)

## Roadmap

Die [Master-Roadmap mit Checkboxen pro Meilenstein](docs/roadmap/ROADMAP-100.md) ist die gemeinsame Quelle für Dokumentation und GUI. Sie enthält 100 Meilensteine von v0.1 bis v10.0, jeweils mit Lieferobjekt und Abnahmekriterium. [Recherche und Statusbelege](docs/roadmap/RESEARCH.md)

| Entwicklungsmeilensteine | Status |
| :--- | :--- |
| v0.1–v0.6, v0.8, v0.9 | Im Code umgesetzt; historische Nummern sind keine Release-Tags |
| v0.7 | Technische Accessibility-Prüfungen vorhanden; manuelle Abnahme offen |
| v1.0 | Release Candidate vorhanden; stabile Freigabe wartet auf das manuelle Gate |
| v6.1 | Designsystem und responsive Oberfläche teilweise umgesetzt |
| Übrige Meilensteine | Geplant; keine Zusage fester Termine oder 100 veröffentlichter Releases |

![Aktuelle Roadmap mit ausgeschriebenen Statusangaben](docs/screenshots/roadmap.png)

[Roadmap auf Mobile](docs/screenshots/roadmap-mobile.png). Die Clean-, Neon- und Produkt-README verweisen auf diese gemeinsame Roadmap und führen keinen separaten Versionsplan.

## Projektzentrale

> Die Links führen zu den jeweils aktuellen Quellen. Roadmap-Checkboxen sind Entwicklungsstände und keine veröffentlichten Releases.

| Bereich | Live-Quelle / Dokument |
| :--- | :--- |
| 🔄 CI und Testläufe | [GitHub Actions](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/workflows/ci.yml) |
| 🧩 Aufgaben | [Offene Issues](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues) |
| 🔀 Änderungen | [Pull Requests](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pulls) |
| 📦 Veröffentlichungen | [Releases](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/releases) |
| 🗺 Meilensteine | [100er-Master-Roadmap](docs/roadmap/ROADMAP-100.md) |
| 🧭 Ausführungsplan | [PLAN.md](PLAN.md) |
| 📊 Fortschritt und Nachweise | [PROGRESS.md](PROGRESS.md) |
| 🔍 Qualitätsaudit | [AUDIT.md](AUDIT.md) |
| 🤝 Übergabe | [HANDOFF.md](HANDOFF.md) · [HANDOVER.md](HANDOVER.md) |

<details>
<summary><strong>🧱 Architektur als interaktives Diagramm öffnen</strong></summary>

```mermaid
flowchart TD
    UI["Browser · Cryo-Neon Workspace"] --> DB["IndexedDB / lokaler Fallback"]
    UI --> API["Node.js · 127.0.0.1"]
    API --> O["Ollama · optional"]
    API --> C["OpenAI · explizite Cloud-Freigabe"]
    API --> G["GitHub / Skills · Allowlist"]
    API --> M["Godot MCP · manuelle Freigabe"]
```

Alle externen Integrationen sind optional und haben dokumentierte Freigabegrenzen.

</details>

<details>
<summary><strong>🧪 Release-Gates und Prüfnachweise anzeigen</strong></summary>

- [x] Node-Testmatrix und Browser-E2E als CI-Workflows konfiguriert
- [x] Reproduzierbarer Quellpaket-Check als Workflow konfiguriert
- [ ] Manuelle WCAG-2.2-AA-Abnahme nachweisen
- [ ] Stabile Version 1.0 erst nach abgeschlossenen REQUIRED-Gates freigeben

[Release-Checkliste](docs/RELEASE-CHECKLIST.md) · [Accessibility-Bericht](docs/accessibility-report.md)

</details>

## Mitmachen

[Issue öffnen](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues) oder einen Pull Request einreichen. Relevante Node- und Browser-Tests vor dem Einreichen ausführen. API-Schlüssel und private Chat-Backups gehören nicht in öffentliche Issues.

<div align="center">
  <img src="assets/logo.svg" alt="CryoGPTCHAT Logo" width="58" />
  <p><sub>CRYO GPT CHAT FREEBIE · BUILD LOCAL · THINK BIG</sub></p>
</div>
