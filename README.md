<div align="center">
  <img src="assets/readme/banner-product.svg" alt="CryoGPTCHATFREEBIE – lokale KI-Chat-App im futuristischen Produktdesign (Illustration)" width="100%" />

  # ❄️ CryoGPTCHATFREEBIE

  **Deine Chats. Deine Modelle. Deine Kontrolle.**

  Ein responsiver Chat-Workspace mit **lokaler Speicherung**, **JSON-Backups** und optionaler **Ollama-KI**.  
  Für Ideen, Code und Gespräche – ohne verpflichtenden Cloud-Dienst.

  <p>
    <code>ALPHA 0.2</code> ·
    <code>LOCAL-FIRST</code> ·
    <code>NODE.JS 20+</code> ·
    <code>OLLAMA OPTIONAL</code>
  </p>

  <p>
    <a href="#-in-60-sekunden-starten"><strong>▶ Jetzt starten</strong></a> ·
    <a href="#-was-dich-erwartet">Features</a> ·
    <a href="#-drei-designwelten">Designvarianten</a> ·
    <a href="#-roadmap">Roadmap</a>
  </p>
</div>

---

## ✨ Was dich erwartet

| 💬 **Gesprächszentrale** | 🧠 **Echte lokale KI** | 💾 **Deine Daten** |
| :--- | :--- | :--- |
| Chats anlegen, umbenennen, löschen und durchsuchen | Ollama-Modelle auf dem eigenen Rechner auswählen und ansprechen | Speicherung im Browser, JSON-Export und validierter Import |

**Alpha 0.2 kann bereits:** responsive Neon-UI, Volltextsuche, lokale Chat-Verwaltung, Backups, Ollama-Erkennung, echte tokenweise Streaming-Antworten und eine Stopp-Schaltfläche bei angeschlossenem Modell. **Ohne Modell** wird die App zum lokalen Chat-Notizbuch; sie erfindet keine Antworten.

> 🎨 **Designhinweis:** Die Illustrationen dieser README zeigen die Gestaltungsidee – keine unbearbeiteten Screenshots der laufenden App.

## 🚀 In 60 Sekunden starten

**Voraussetzung:** [Node.js](https://nodejs.org/) 20 oder neuer. Keine externen npm-Abhängigkeiten.

```bash
git clone https://github.com/Pierreg99/CryoGPTCHATFREEBIE.git
cd CryoGPTCHATFREEBIE
npm start
```

Öffne danach **[http://127.0.0.1:4173](http://127.0.0.1:4173)** auf demselben Rechner.

### Optional: Ollama verbinden

1. [Ollama installieren](https://ollama.com/).
2. Ein kompaktes lokales Modell herunterladen: `ollama pull qwen2.5:3b`.
3. Ollama lokal unter `127.0.0.1:11434` betreiben.
4. In CryoGPTCHATFREEBIE die Modellliste aktualisieren und dein Modell auswählen.

Der Modellserver ist über `OLLAMA_URL` konfigurierbar. Eine Internetverbindung ist möglicherweise einmalig nötig, um das Modell herunterzuladen; **KI-Antworten benötigen danach keine obligatorische Cloud-API**.

## 🎨 Drei Designwelten

Hier stehen **drei vollständige, editierbare README-Alternativen** bereit. Jede hat ihren eigenen, lokal versionierten SVG-Header. Die Haupt-README kombiniert deren stärkste Elemente: Produktfokus, gute Lesbarkeit und Cryo-Neon-Identität.

<table>
<tr>
<td width="33%" align="center">
<a href="docs/readme-variants/01-clean.md"><img src="assets/readme/banner-clean.svg" alt="Clean Design – helles und ruhiges Branding" width="100%"></a>
<br><strong>01 · Professional / Clean</strong>
<br>Minimalistisch, technisch, gut lesbar.
<br><a href="docs/readme-variants/01-clean.md">Variante öffnen →</a>
</td>
<td width="33%" align="center">
<a href="docs/readme-variants/02-neon.md"><img src="assets/readme/banner-neon.svg" alt="Neon Design – futuristische Cyber-Kristall-Grafik" width="100%"></a>
<br><strong>02 · Futuristic / Neon</strong>
<br>Holografisch, kontrastreich, cineastisch.
<br><a href="docs/readme-variants/02-neon.md">Variante öffnen →</a>
</td>
<td width="33%" align="center">
<a href="docs/readme-variants/03-product.md"><img src="assets/readme/banner-product.svg" alt="Produkt-Design – Chat-App als Produktillustration" width="100%"></a>
<br><strong>03 · App / Landing Page</strong>
<br>Produktnutzen, Einstieg und FAQ.
<br><a href="docs/readme-variants/03-product.md">Variante öffnen →</a>
</td>
</tr>
</table>

**Alle Grafiken liegen im Repository:** [`assets/readme/`](assets/readme/). Keine externen Bild-CDNs notwendig.

## 🧩 So arbeitet CryoGPTCHAT

<img src="assets/readme/architecture.svg" alt="Lokale Architektur: Browser, Node.js-Server, optionaler Ollama-Modellserver" width="100%" />

| Schicht | Dateien | Aufgabe |
| :--- | :--- | :--- |
| **Browser** | [`index.html`](index.html), [`src/app.js`](src/app.js), [`src/styles.css`](src/styles.css) | Chat-Oberfläche, Nachrichten, Sitzungen, Suche |
| **Chat-Core** | [`src/core.js`](src/core.js) | Testbare Datenlogik, Backup-Validierung |
| **Local Server** | [`server.mjs`](server.mjs) | Localhost-Bridge und validierte Modell-Anfragen |
| **Tests & CI** | [`tests/core.test.js`](tests/core.test.js), [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Automatische Core-Tests |

### 🧪 Testen

```bash
npm test
```

Automatisierte Core-Tests sowie Tests für NDJSON-Streaming, Fehlerfälle und einen simulierten Ollama-Server sind enthalten. **Nicht vollständig abgedeckt:** Browser-End-to-End-Flows und echte Ollama-Inferenz auf unterschiedlichen Endgeräten.

## 🔐 Datenschutz & Grenzen

- Chats liegen **unverschlüsselt in `localStorage`** des jeweiligen Browserprofils. Auch JSON-Exporte sind unverschlüsselt.
- Beim Einsatz von Ollama wird Gesprächskontext an den konfigurierten Modellserver gesendet. Standardmäßig ist das der eigene Rechner.
- Der Node.js-Server bindet an `127.0.0.1`; es gibt **keine Authentifizierung und keinen Mehrbenutzerbetrieb**.
- **Nicht unverändert öffentlich ins Internet stellen.** Dies ist ein lokales Experiment, keine produktionsreife SaaS-Lösung.
- Vor einem JSON-Import ein Backup exportieren; bestätigter Import ersetzt den aktuellen Datenbestand.

## 🛣️ Roadmap

- [x] **Alpha 0.2:** Chat-UI, Gesprächsverwaltung, Suche, JSON-Backups, optionale Ollama-Integration und Tests.
- [ ] **Alpha 0.2:** Token-Streaming, Generierung abbrechen und robustes Fehlermanagement.
- [ ] **Alpha 0.3:** größere Chatverläufe, bessere Persistenz, Accessibility und Browser-E2E.
- [ ] **Zukunft:** Kontrollierte Cryo-Omega-Skill-Registry, Projektwissen und Agenten-Workflows.

## 🤝 Mitmachen

Für Bugs, Ideen und Verbesserungsvorschläge: [Issues öffnen](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues). Bitte keine API-Schlüssel oder Chat-Backups in öffentlichen Issues teilen. Pull Requests sollten `npm test` bestehen.

---

<div align="center">
  <img src="assets/logo.svg" alt="CryoGPTCHAT Logo" width="58" />
  <p><sub>CRYO GPT CHAT FREEBIE · BUILD LOCAL · THINK BIG</sub></p>
</div>
