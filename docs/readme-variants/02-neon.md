<div align="center">
  <img src="../../assets/readme/banner-neon.svg" alt="Futuristisches Neon-Cyber-Banner mit holografischem Cryo-Kristall" width="100%" />
  <h1>❄️ CRYO GPT CHAT FREEBIE</h1>
  <p><strong>LOCAL AI. MAXIMUM POSSIBILITY.</strong></p>
  <p><code>⚡ ALPHA 0.1</code> · <code>❄️ LOCAL-FIRST</code> · <code>🧠 OLLAMA OPTIONAL</code></p>
  <p><a href="#-boot-sequence">BOOT</a> · <a href="#-systeme-online">SYSTEMS</a> · <a href="#-core-architecture">ARCHITECTURE</a> · <a href="#-next-evolution">EVOLUTION</a></p>
</div>

---

## ⚡ Die Idee

Ein futuristisches Chat-Cockpit, in dem du **Gespräche**, **lokale KI-Modelle** und später **Skills** unter einer Oberfläche bündeln kannst. **Kein obligatorischer Cloud-Dienst. Keine simulierten KI-Antworten.** Der Kern bleibt nachvollziehbar und testbar.

> **MISSION / 001** — Die nächste Generation deines AI-Workspace beginnt mit einer kleinen, funktionierenden Basis.

## 🚀 Boot Sequence

Node.js **20+** installieren, anschließend:

```bash
git clone https://github.com/Pierreg99/CryoGPTCHATFREEBIE.git
cd CryoGPTCHATFREEBIE
npm start
```

**Browser öffnen:** `http://127.0.0.1:4173`

Optional ein lokales Modell über [Ollama](https://ollama.com/) bereitstellen:

```bash
ollama pull qwen2.5:3b
```

Modell in der Oberfläche aktualisieren und auswählen. Wenn kein Modell bereitsteht, bleibt die App im ehrlichen **Notizmodus**.

## 🟢 Systeme online

| Modul | Status |
| :--- | :--- |
| 💬 Neon Chat UI + mobile Ansicht | **LIVE** |
| 🔎 Gesprächsverwaltung und Volltextsuche | **LIVE** |
| 🗃️ Lokaler Browser-Speicher | **LIVE** |
| 📦 JSON Backup/Restore | **LIVE** |
| 🧠 Ollama-Verbindung und Antwortanzeige | **OPTIONAL** |
| 🧪 Node.js-Core-Tests | **LIVE** |
| 🌊 Antwort-Streaming und Stopp-Schaltfläche | **GEPLANT** |
| 🛰️ Cryo-Omega-Skill-Registry | **GEPLANT** |

## 🧬 Core Architecture

<img src="../../assets/readme/architecture.svg" alt="Local-first Simulationsdiagramm für Browser, Node.js-Bridge und Ollama" width="100%" />

Der Browser speichert Chats in `localStorage`; `server.mjs` stellt eine auf localhost beschränkte API-Bridge bereit; Ollama kann lokal echte Modellantworten generieren. Die Gesprächslogik liegt testbar in `src/core.js`.

## 🧪 Verify the Core

```bash
npm test
```

Core-Tests sind vorhanden. Browser-E2E und reale Ollama-Inferenz bleiben gesonderte Aufgaben.

## 🔮 Next Evolution

- [x] **ALPHA 0.1** — Startfähige Browser-App und lokale Modell-Bridge
- [ ] **ALPHA 0.2** — Streaming-Antworten, Abbrechen, bessere Fehlermeldungen
- [ ] **ALPHA 0.3** — robuste größere Chatverläufe und End-to-End-Tests
- [ ] **OMEGA** — Freigabe-kontrollierte Skills, Agenten und Projektwissen

> 🔐 **LOCAL DOES NOT AUTOMATICALLY MEAN ENCRYPTED.** Gespräche und exportierte JSON-Backups sind aktuell unverschlüsselt. Der Server hat keinen Login und ist nicht für öffentliche Internetbereitstellung geeignet.

<div align="center">
  <sub>❄️ CRYO GPT CHAT / BUILD DIFFERENT / STAY IN CONTROL ❄️</sub>
</div>

<sub>**Designvariante 02 / Neon** · Spektakuläre Bildsprache und markantes Branding · [Zur Haupt-README](../../README.md)</sub>
