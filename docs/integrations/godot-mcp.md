# Godot MCP – manuelle Anbindung an CryoGPTCHAT

**Upstream:** [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp) · **Lizenz:** MIT

## Was funktioniert?

Die Godot-Schaltfläche im Chat öffnet ein optionales Inspektionspanel. Es werden genau zwei ausdrücklich ausgelöste MCP-Tools unterstützt:

| Werkzeug | Zweck | Freigabe |
| --- | --- | --- |
| `get_godot_version` | Installierte Godot-Version auslesen | Nur Klick **und** Bestätigungsdialog |
| `get_project_info` | Metadaten zum fest konfigurierten Projekt auslesen | Nur Klick **und** Bestätigungsdialog |

**Keine automatische KI-Toolauswahl. Keine Mutationen über die CryoGPTCHAT-Oberfläche.** Szenen erstellen, Knoten ändern, Projekte starten, stoppen oder Dateien manipulieren sind **nicht** über diese Bridge verfügbar.

Auch reine Inspektion startet ausführbaren Fremdcode als separaten Node.js-Prozess und kann im Godot-Kontext Änderungen auslösen. Nur mit einem **vertrauenswürdigen und überprüften Checkout** und an einem **gesicherten Testprojekt** verwenden.

## Vorbereitung unter Linux

1. **Godot installieren** und im Terminal prüfen: `godot --version`. Manche Distributionen verwenden `godot4`; verwende dann den vorhandenen Befehl bzw. den absoluten Binärpfad.
2. **Node.js 20+** installieren. CryoGPTCHAT selbst benötigt Node.js 20+, upstream godot-mcp Node.js 18+.
3. Godot MCP **lokal herunterladen und überprüfen**. Beispiel für den geprüften Upstream-Commit mit der Sicherheitskorrektur gegen beliebige Skriptinstanziierung:

   ```bash
   git clone https://github.com/Coding-Solo/godot-mcp.git ~/tools/godot-mcp
   cd ~/tools/godot-mcp
   git checkout 1209744fad78f3998f98c7394fd0f6ef50da5281
   npm ci
   npm run build
   ```

   `npm ci` führt gegebenenfalls Installationsskripte externer Abhängigkeiten aus. Prüfe Repository und Lockfile vor der Ausführung.

4. Ein eigenes Godot-Testprojekt bereithalten, das eine **`project.godot`** enthält. Keine unbekannten Projekte oder fremde Plugins ungeprüft öffnen.

## CryoGPTCHAT starten

Im CryoGPTCHAT-Verzeichnis mit zwei **festen absoluten Pfaden**:

```bash
GODOT_MCP_ENTRY="$HOME/tools/godot-mcp/build/index.js" \
GODOT_PROJECT_PATH="$HOME/GodotProjects/MeinSpiel" \
GODOT_PATH="$(command -v godot)" \
npm start
```

- `GODOT_MCP_ENTRY`: Absoluter Pfad zur **lokal bereits installierten** MCP-Entrypoint-Datei. CryoGPTCHAT führt **kein `npx`**, kein Auto-Download und keinen Paketinstall aus.
- `GODOT_PROJECT_PATH`: Absoluter Pfad zu genau **einem** Projekt mit `project.godot`.
- `GODOT_PATH`: Optional der Pfad zum installierten Godot-Binary; wenn nicht gesetzt, kann Upstream die Installation selbst erkennen.

Öffne [http://127.0.0.1:4173](http://127.0.0.1:4173) lokal im Browser und wähle **🎮 Godot MCP**. Bei erfolgreicher Konfiguration werden beide Schaltflächen aktiv. Jede Abfrage erfordert eine zusätzliche Bestätigung. Ergebnisse werden nur **als Text angezeigt**; sie werden **nicht automatisch als Modellkontext gespeichert oder weitergeleitet**.

Die Integration funktioniert auch dann, wenn Ollama nicht installiert ist.

## Sicherheitsmodell

- Server bindet ausschließlich an `127.0.0.1`. Die Inspektions-API verlangt JSON und einen **genau passenden Origin-Header**.
- Werkzeugname und Projektpfad sind **nicht frei aus dem Browser steuerbar**. Das Projekt wird über eine Startvariable festgelegt.
- Es gibt keine generische Methode zum Ausführen beliebiger MCP-Werkzeuge.
- Ein frischer MCP-Unterprozess wird pro Abfrage gestartet, mit begrenzter Laufzeit und Ausgabelänge. Er erbt nur wenige notwendige Umgebungsvariablen.
- Alle Tool-Ergebnisse sind **nicht vertrauenswürdiger Text**, keine Anweisungen; die Chatoberfläche rendert sie über `textContent`.
- Externe MCP-Server und Godot-Projekt-Skripte können potentiell Code mit deinen Benutzerrechten ausführen. Für unbekannte Projekte sollte eine isolierte Testumgebung verwendet werden.
- Die Beispielkonfiguration pinnt den upstream commit `1209744f` vom **16. April 2026**, der eine bekannte Ausführung beliebiger GDScript-Klassen über Knotenparameter behebt. Dies ist **keine vollständige Sicherheitsgarantie**.
- Beim Fehlen der lokalen Konfiguration bleiben die Tools deaktiviert. Der normale Chat funktioniert unverändert weiter.

## Fehlerbehebung

- **„Nicht eingerichtet“:** Absoluten `GODOT_MCP_ENTRY`-Pfad, `GODOT_PROJECT_PATH` und `project.godot` prüfen; Chatserver nach dem Setzen der Umgebungsvariablen neu starten.
- **„Godot nicht gefunden“:** `godot --version` bzw. `godot4 --version` testen und `GODOT_PATH` explizit setzen.
- **Zeitüberschreitung:** MCP-Entrypoint, Godot-Prozess und Projektinhalt überprüfen. Keine automatischen Wiederholungen.
- **Node.js/TypeScript-Fehler im Upstream:** `npm ci` und `npm run build` im lokalen Godot-MCP-Verzeichnis mit einem überprüften Checkout ausführen.

## Weiterentwicklung

Eine spätere MCP-Tool-Integration mit Schreibzugriff benötigt zusätzlich: explizite Berechtigungen pro Werkzeug, überprüfte Projektverzeichnisse, gesicherte Preview/Diffs, Tests auf echten Godot-Versionen und eine Freigabe pro Dateiveränderung. Das ist **noch nicht implementiert**.
