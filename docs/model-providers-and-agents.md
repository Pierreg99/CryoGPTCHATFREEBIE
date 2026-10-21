# CryoGPTCHATFREEBIE: Modellanbieter und bestätigte Agentenschritte

## 1. Datenschutz zuerst

Standard: lokaler Chat-Notizmodus oder Ollama auf dem eigenen Rechner. Ein Cloud-Modell wird nur angezeigt, wenn die Servervariablen OPENAI_API_KEY und CRYO_OPENAI_MODELS gesetzt sind. Die App wechselt nie selbst in die Cloud. Vor **jeder** Cloud-Anfrage erscheint ein ausdrücklicher Bestätigungsdialog.

Bis zu 24 Chat-Nachrichten werden an das ausgewählte Modell übermittelt. Projektwissen wird nur nach chatbezogener Freigabe berücksichtigt. Der Browser speichert keine API-Schlüssel. Backups und IndexedDB sind weiterhin **unverschlüsselt**.

**OpenAI API wird separat abgerechnet; ChatGPT Plus schließt API-Kosten nicht automatisch ein.** Der Server ist nur für lokale Einzelbenutzer gedacht und besitzt keine Mehrbenutzer-Authentifizierung.

## 2. OpenAI optional aktivieren

Node.js 20+ im Repository-Verzeichnis:

~~~sh
# API-Schlüssel verdeckt eingeben, niemals ins Repository schreiben:
read -rsp 'OpenAI API key: ' OPENAI_API_KEY; echo
export OPENAI_API_KEY
export CRYO_OPENAI_MODELS=gpt-4.1-mini
npm start
~~~

In der Oberfläche Modelle aktualisieren und explizit **OpenAI / gpt-4.1-mini** auswählen. Die App listet nur die serverseitig zugelassenen Modelle auf. Andere Modelle müssen die OpenAI Chat-Completions-API unterstützen und ausdrücklich in CRYO_OPENAI_MODELS aufgeführt sein. Keine automatische Modellwahl.

Für reine Offline-Nutzung: OPENAI_API_KEY und CRYO_OPENAI_MODELS nicht setzen, Ollama wie bisher verwenden.

Die Cloud-Bridge spricht ausschließlich https://api.openai.com/v1/chat/completions an, setzt store:false, hält Schlüssel auf dem Server und normalisiert SSE in das vorhandene NDJSON-Streamingformat. Maximal 24 Nachrichten und 12.000 Antwortzeichen pro Anfrage; nach 120 Sekunden wird abgebrochen. Die Stopp-Schaltfläche bricht auch Cloud-Anfragen ab.

## 3. Kontrollierte Agentenschritte

GitHub-Integration separat einschalten:

~~~sh
export CRYO_GITHUB_REPOS=Pierreg99/CryoGPTCHATFREEBIE,Pierreg99/cryo-omega-AI-Agentic-Learn-Packages
npm start
~~~

Im Chat **Projektwissen → Agenten-Workspace** öffnen. Freigegebenes Repository wählen, Aktion **README lesen** oder **Skills suchen** einstellen und zuerst **Schritt planen** anklicken. Danach kann mit **Prüfen und freigeben** genau ein schreibgeschützter GitHub-Schritt ausgeführt werden. Anschließend lässt sich das Ergebnis **als Nachrichtenentwurf** übernehmen; kein automatischer Modellaufruf.

Dieses MVP ist bewusst ein **zustimmungsbasierter, einzelner Werkzeugschritt**, kein autonomer Agent. Keine Shell-Befehle, keine GitHub-Mutationen, kein automatisches Tool-Looping. Der Server lässt ausschließlich die zwei definierten Aktionen auf freigegebene öffentliche Repositories zu.

Fremde GitHub-Dateien können irreführende Anweisungen enthalten und werden deshalb als Daten, nicht als Systeminstruktionen behandelt.

## 4. Tests, Grenzen und nächster Ausbau

~~~sh
npm test
~~~

Tests verwenden lokale Mock-Daten; keine kostenpflichtigen Cloud-Abfragen. Noch nicht enthalten: OAuth, GitHub-Schreibzugriffe, KI-gesteuerte autonome Planung, Agenten-Sandbox, Cloud-Sync, verschlüsselte Chat-Backups, mobile Browser-E2E. Weitere Endpunkte dokumentiert in [integrations.md](integrations.md).
