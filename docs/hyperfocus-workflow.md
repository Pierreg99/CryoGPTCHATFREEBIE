# Hyperfocus Workflow

Der Hyperfocus-Workspace bündelt **Ziel → Planvorschau → Freigabe → begrenzten Lauf → Ergebnisprüfung**. Er erweitert den bisherigen Einzelaktions-Agenten; dieser bleibt unverändert verfügbar.

> **Wichtig:** „Autonom“ bedeutet in dieser Version **selbstständige Ausführung eines zuvor bestätigten, festen Ablaufplans** – nicht unbegrenzte Modellaktionen. Keine GitHub-Schreibzugriffe, keine Shell, keine Godot-Szenenerstellung und keine automatische Skill-Ausführung.

## 1. Lokal aktivieren

Node.js 20+ erforderlich. Optional kannst du Ollama mit einem bereits installierten Modell verwenden. Für die reine Offline-Zusammenfassung ist Ollama nicht notwendig.

~~~bash
export CRYO_GITHUB_REPOS=Pierreg99/CryoGPTCHATFREEBIE,Pierreg99/cryo-omega-AI-Agentic-Learn-Packages
npm start
~~~

Öffne http://127.0.0.1:4173, erstelle einen Chat und öffne **Hyperfocus** in der Navigation.

**OpenAI API wird vom Hyperfocus-Autopiloten niemals genutzt.** Selbst wenn OpenAI für normale Chats eingerichtet ist, bietet die Hyperfocus-Modellliste ausschließlich Ollama-Modelle an. Standardmäßig wird ein Offline-Plan **ohne** Modell generiert. Ein anderer (über OLLAMA_URL konfigurierter) Ollama-Server könnte extern sein; die Standardkonfiguration ist lokal.

## 2. Fokuslauf

1. Schreibe ein messbares Ziel zwischen 12 und 600 Zeichen.
2. Wähle aus serverseitig freigegebenen öffentlichen Repositories das Projekt und optional den Cryo-Omega-Katalog.
3. Optional: Skill-Suchwort wählen. Ohne Suchwort wird zunächst die Katalogübersicht gelesen; die Auswahl ist dann weniger relevant. Zeitbudget: **15 / 25 / 45 Minuten**.
4. Optional: ein lokal installiertes Ollama-Modell für die abschließende Textplanung auswählen.
5. Auf **Plan erstellen** klicken: Der Server überprüft Parameter und gibt einen Vorschau-Plan aus. **Noch kein Netzwerkzugriff auf GitHub oder KI-Modell**.
6. Auf **Prüfen & Autopilot starten** klicken und den Dialog bestätigen. Erst jetzt führt der Server die feste Aufgabenfolge selbstständig aus:
   - maximal einmal README.md des gewählten Projekts lesen;
   - optional einmal den freigegebenen Skill-Katalog schreibgeschützt durchsuchen;
   - einen Offline-Fokusbrief erstellen oder einmal Ollama um einen dreistufigen Plan bitten.
7. Das Ergebnis erscheint separat mit Schrittprotokoll. Mit **Ergebnis als Chat-Entwurf übernehmen** wird nur das Eingabefeld gefüllt; kein KI-Aufruf, kein automatisches Speichern in projektweites Wissen.

**Stoppen** beendet die Browseranfrage und signalisiert den Abbruch an den Server. Ein Ticket kann nur einmal verwendet werden. Es gibt weder wiederaufnehmbare Hintergrundläufe noch automatische Cron-Jobs. Der Lauf selbst hat ein Serverzeitlimit von 90 Sekunden. Die 15/25/45 Minuten sind das **vorgeschlagene menschliche Arbeitsbudget**, kein Countdown und keine Serverlaufzeit.

## 3. Technische Sicherheitsgrenzen

- **Feste Tool-Auswahl:** Das Modell kann keinen GitHub-Pfad, kein Tool, keinen Host und keine nächste Aktion auswählen. Die Reihenfolge wird aus einem vorab validierten Schema erzeugt.
- **Allowlist:** Nur CRYO_GITHUB_REPOS. Auf GitHub geht ausschließlich ein öffentlicher GET-Aufruf pro Quellenart (README und Katalog).
- **Freigabe:** Die Plan-API erstellt ein kryptografisch zufälliges, **120 Sekunden gültiges Einmal-Ticket**. Der Run-Endpunkt verlangt das Ticket plus Same-Origin und JSON; Modifikation des Plans ist in der Run-Anfrage nicht möglich.
- **Limits:** maximal zwei GitHub-Leseaktionen und eine lokale Synthese; höchstens ein aktiver Hyperfocus-Lauf pro Server; maximal 16 offene Vorschauen; keine rekursiven autonomen Schleifen.
- **Daten:** Der reine Offline-Modus schickt den Zieltext an keine KI. Für eine bewusst ausgewählte Ollama-Synthese sendet der Server Ziel und begrenzte öffentliche Referenzauszüge nur an OLLAMA_URL. Keine gespeicherten Chatverläufe oder privaten Projektnotizen werden automatisch einbezogen.
- **Unvertrauenswürdige Quellen:** GitHub-README und Skill-Beschreibungen werden nur als Daten in den lokalen Modellprompt übernommen; das Modell hat keine Tools oder Seiteneffekte. Ergebnisse bleiben überprüfbare Vorschläge.
- **Abbruch:** HTTP-Abbruch löst ein AbortSignal für die GitHub- und Modellaufrufe aus. Bereits erfolgte öffentliche Leseanfragen können nicht rückgängig gemacht werden.
- **Kein Cloud-Zwang:** Ein als OpenAI konfiguriertes Chat-Modell ist *keine* Hyperfocus-Auswahl.
- **Authentifizierung:** CryoGPTCHAT ist weiterhin ein reiner localhost-Einzelbenutzer-Prototyp ohne Multi-User-Authentifizierung.

## 4. API

- POST /api/hyperfocus/plan mit JSON-Feldern goal, repo, skillRepo (optional), query (optional), minutes (15|25|45), model (Ollama oder Leerstring). Antwort: ticket, expiresAt, preview.
- POST /api/hyperfocus/run mit JSON { "ticket": "..." }. Antwort: steps, mode, brief, readonly, writes. Reused/expired ticket: HTTP 409.

Beide POST-Endpunkte akzeptieren ausschließlich Origin http://127.0.0.1:<PORT> und Content-Type application/json.

## 5. Testen und weitere Meilensteine

~~~bash
npm test
~~~

Mock-basierte Tests prüfen Planung, Repo-Allowlist, Cloud-Ausschluss, begrenzte Toolaufrufe, Abbruch, Ollama-Modellvalidierung, API-Origin und Ticketformat. **Browser-E2E sind vorhanden.** Live-GitHub-Zugriff und echte lokale Ollama-Inferenz werden separat geprüft.

**Umgesetzt:** lokale Historie abgeschlossener Ergebnisse und Browser-E2E. **Weiterhin Roadmap:** wiederaufnehmbare Fokus-Sitzungen, optionaler Pausentimer, Skill-Relevanzranking, separate Freigabe für kontrollierte Schreibwerkzeuge nach Sandbox-/Undo-Konzept. Alles mit eigenständigem Consent und Rechteprüfung; keine implizite Hochstufung des Read-only MVP.
