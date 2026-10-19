<div align="center">
  <img src="../../assets/readme/banner-clean.svg" alt="Helles, minimalistisches CryoGPTCHATFREEBIE-Banner mit Chat-Oberfläche" width="100%" />
  <h1>CryoGPTCHATFREEBIE</h1>
  <p><strong>Deine Chats. Deine Modelle. Deine Kontrolle.</strong></p>
  <p>Ein schlanker, lokal betriebener KI-Chat mit optionalem Ollama-Modell.</p>
  <p><code>Alpha 0.1</code> · <code>Node.js ≥20</code> · <code>Local-first</code> · <code>ohne npm-Abhängigkeiten</code></p>
  <p><a href="#schnellstart">Schnellstart</a> · <a href="#funktionen">Funktionen</a> · <a href="#architektur">Architektur</a> · <a href="#sicherheit">Sicherheit</a></p>
</div>

---

### Überblick

CryoGPTCHATFREEBIE organisiert Gespräche in einem responsiven Browser-Workspace. Nachrichten bleiben im Browserprofil gespeichert. Wer ein lokal installiertes Ollama-Modell nutzt, kann echte Antworten generieren; ohne Modell dient die Anwendung als Chat-Notizbuch.

### Schnellstart

**Voraussetzung:** Node.js 20 oder neuer.

```bash
git clone https://github.com/Pierreg99/CryoGPTCHATFREEBIE.git
cd CryoGPTCHATFREEBIE
npm start
```

Anschließend [http://127.0.0.1:4173](http://127.0.0.1:4173) auf dem eigenen Rechner öffnen.

**Optional: Ollama aktivieren**

```bash
ollama pull qwen2.5:3b
```

Ollama installieren und lokal ausführen; danach in der App die Modellliste aktualisieren und ein Modell auswählen. Die Standardverbindung verwendet `127.0.0.1:11434`. Der Modellserver kann separat konfiguriert werden (`OLLAMA_URL`).

### Funktionen

| Bereich | Alpha 0.1 | Hinweise |
| :--- | :---: | :--- |
| Responsives Chat-Interface | ✅ | Desktop und Mobil |
| Chats erstellen, suchen, umbenennen, löschen | ✅ | Volltextsuche |
| Speicherung in `localStorage` | ✅ | Browserprofil, unverschlüsselt |
| JSON-Export und validierter Import | ✅ | Import nach Bestätigung |
| Ollama-Modellliste und Textantworten | ✅ | Optional lokal |
| Automatisierte Core-Tests | ✅ | `npm test` |
| Streaming, Abbrechen, Agenten & Skills | ⏳ | Geplant |

### Architektur

<img src="../../assets/readme/architecture.svg" alt="Architektur: Browser zu lokalem Node.js-Server zu optionalem Ollama" width="100%" />

- **`src/app.js`**: UI und Chat-Interaktionen.
- **`src/core.js`**: Nachrichten-/Store-Logik und Backup-Validierung.
- **`server.mjs`**: lokale API-Bridge, Eingabevalidierung und statische Dateiauslieferung.
- **`tests/core.test.js`**: automatische Core-Tests.

### Tests

```bash
npm test
```

Der aktuelle Stand ist eine Alpha. Browser-E2E-Tests und ein echter Modell-Inferenztest sind noch nicht abgedeckt.

### Sicherheit

> **Nur lokal betreiben.** Der Entwicklungsserver lauscht an `127.0.0.1` und bietet keine Authentifizierung. Er ist **nicht für öffentliches Hosting** ausgelegt.

Chats und JSON-Backups sind **nicht verschlüsselt**. Das lokale Ollama-Modell erhält Gesprächskontext für die Antwortgenerierung. Sensible Backups niemals in öffentliche Issues hochladen.

### Roadmap

- [x] Alpha 0.1 — Chat-Workspace, Suche, Backups und optionale Ollama-Anbindung
- [ ] Alpha 0.2 — Token-Streaming, Abbruch und Fehlerfeedback
- [ ] Alpha 0.3 — bessere Persistenz, Browser-End-to-End-Tests und Barrierefreiheit
- [ ] Zukunft — überprüfbare Cryo-Omega-Skill- und Agenten-Integrationen

---

<sub>**Designvariante 01 / Clean** · Minimale Farben, hohe Lesbarkeit, dokumentationsorientiert · [Zur Haupt-README](../../README.md)</sub>
