<div align="center">
  <img src="../../assets/readme/banner-product.svg" alt="CryoGPTCHATFREEBIE Produkt-Landingpage mit illustrierter Chat-App" width="100%" />

  # Dein AI-Workspace. Auf deinem Rechner.
  **CryoGPTCHATFREEBIE · Alpha 0.1**

  Ein Chat-Workspace für Ideen, Fragen und Code — mit optionaler lokaler KI über Ollama.  
  **Ohne verpflichtenden Cloud-Account oder API-Schlüssel.**

  <p><a href="#-jetzt-starten"><strong>▶ Jetzt starten</strong></a> · <a href="#-was-drin-steckt">Features entdecken</a> · <a href="#-fragen-und-antworten">FAQ</a></p>
</div>

---

## ✨ Was drin steckt

| 💬 Gespräche | 🧠 Lokale KI | 📦 Deine Daten |
| :--- | :--- | :--- |
| Unterhaltungen anlegen, verwalten und durchsuchen | Optional Ollama-Modell auswählen und echte Antworten abrufen | Chats im Browserprofil sichern und als JSON exportieren/importieren |

**Für Kreative, Entwickler und Experimentierende:** Ideen sammeln, Chatverläufe organisieren und die KI-Schicht nach Bedarf zuschalten. Die Oberfläche ist für Desktop und Mobilgeräte ausgelegt.

## 🚀 Jetzt starten

**Node.js 20+** benötigt. Keine externen npm-Abhängigkeiten.

```bash
git clone https://github.com/Pierreg99/CryoGPTCHATFREEBIE.git
cd CryoGPTCHATFREEBIE
npm start
```

Danach lokal besuchen: **[http://127.0.0.1:4173](http://127.0.0.1:4173)**

### In drei Schritten zum lokalen Modell

1. [Ollama](https://ollama.com/) installieren.
2. Ein Modell herunterladen, z. B. `ollama pull qwen2.5:3b`.
3. In CryoGPTCHATFREEBIE die Modellliste aktualisieren und das Modell wählen.

*Ohne Ollama bleibt die Chat-App als lokaler Notiz-Workspace verwendbar.*

## 🖥️ So funktioniert es

<img src="../../assets/readme/architecture.svg" alt="Architekturillustration: Browser-Workspace, Node.js-Bridge, optionales Ollama" width="100%" />

Die Chat-Daten liegen im Browser (`localStorage`). Der Node.js-Server stellt die lokale Verbindung zum optionalen Ollama-Modell her.

Die Grafik im Header ist eine **Produktillustration, kein echter Screenshot**.

## ❓ Fragen und Antworten

<details><summary><strong>Brauche ich ein bezahltes KI-Abo?</strong></summary><p>Nein. Der Chat benötigt keine verpflichtende Cloud-API. Für KI-Antworten kann ein kostenlos lokal betriebenes Ollama-Modell genutzt werden.</p></details>

<details><summary><strong>Funktioniert der Chat ohne Modell?</strong></summary><p>Ja, als lokales Notizbuch für Nachrichten und Gesprächsverläufe. Er erzeugt dann ausdrücklich keine KI-Antworten.</p></details>

<details><summary><strong>Werden meine Chats verschlüsselt?</strong></summary><p>Noch nicht. Der Browser speichert sie unverschlüsselt; das gilt auch für JSON-Exporte. Verwende daher keine besonders sensiblen Inhalte.</p></details>

<details><summary><strong>Kann ich die App öffentlich hosten?</strong></summary><p>Nicht in dieser Alpha. Der Entwicklungsserver ist an localhost gebunden und hat weder Login noch Multiuser-Zugriffskontrolle.</p></details>

<details><summary><strong>Was kommt als Nächstes?</strong></summary><p>Streaming, Antwort-Stopp, verbesserte Datenpersistenz, Browser-E2E-Tests und später optional die Cryo-Omega-Skill-Registry.</p></details>

## 🛣️ Roadmap

- [x] **0.1** Local chat, Volltextsuche, Backups, Ollama-Integration
- [ ] **0.2** Streaming und Antwortsteuerung
- [ ] **0.3** Persistenz und Testabdeckung verbessern
- [ ] **Später** Erweiterbare Skill- und Agentenfunktionen

## 🤝 Unterstützen und mitbauen

Bug gefunden oder eine gute Idee? Eröffne ein [Issue](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues) oder reiche einen Pull Request ein. Vor Änderungen am Core: `npm test`. Keine privaten Chat-Backups in Issues veröffentlichen.

<div align="center"><sub>CRYO GPT CHAT FREEBIE · LOCAL FIRST · MADE TO EXPERIMENT</sub></div>

<sub>**Designvariante 03 / Produkt-Landingpage** · Nutzenversprechen, CTAs, FAQ und Produktstory · [Zur Haupt-README](../../README.md)</sub>
