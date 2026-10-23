# Release- und Kompatibilitätspolitik

Ziel ist **1.0.0**. Der aktuelle Stand **1.0.0-rc.1** ist ein prüfbarer Release-Candidate, keine vorzeitig freigegebene stabile Version. Die offenen Bedingungen stehen in [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md). Es werden in diesem Arbeitsschritt weder stabile Tags noch GitHub-Releases erzeugt.

## Unterstützte und geprüfte Umgebung

Der geprüfte Zielbetrieb ist ein lokaler Einzelbenutzer-Workspace auf Linux x64, aktuelles Chromium, Node 22.12+ oder Node 24. Die Kompatibilitätstests für Node 20 bleiben erhalten. Die Browser-Suite prüft 320/360/768/1440 CSS-Pixel; das ist kein Nachweis auf physischem Android/iOS oder für Safari/Firefox. Andere Plattformen bleiben experimentell. Lokale Markdown-Ausgabe benötigt ausdrücklich Linux `/proc/self/fd`; GitHub-Ausgabe ist davon getrennt.

Der Notiz-/Chat-Speicher benötigt keine npm-Laufzeitabhängigkeiten. Ollama, OpenAI, GitHub-Write und Godot bleiben optionale, konfigurierte Integrationen. CI prüft deren Protokolle mit kontrollierten Diensten/Mocks; eine echte Modellinferenz oder Godot-Installation wird nicht behauptet. Öffentliche Bereitstellung, Multi-User, Auth, Sync und Sandbox sind nicht Teil dieses Releases.

## Datenmigration und Rollback

Das Anwendungsversionierungsschema ist von Backup-Versionen getrennt. Backups der Schemas 1 und 2 werden durch die neuere App nach Schema 3 migriert. Explizite chatbezogene Freigaben aus Schema 2 bleiben erhalten, während Freigaben aus Schema 1 nicht automatisch aktiviert werden. Projekte und Projektzuordnungen werden nur in Schema 3 transportiert. Unbekannte Backup-Versionen werden vor einer Mutation abgewiesen. Die aktuelle IndexedDB-Struktur und der Schlüssel `current` bleiben erhalten; der zusätzliche Rücksetzpunkt verwendet einen eigenen Schlüssel.

Vor einem Upgrade einen JSON-Export erzeugen. Schema-3-Exporte können von älteren Clients mit Schema-1/2-Unterstützung nicht direkt importiert werden. Vor dem Upgrade einen separaten Schema-2-Export aufbewahren. Ein alter Client darf Schema-3-Daten nicht ungeprüft überschreiben. Die alte Version bietet den neuen Undo-Assistenten nicht. Ein Dateisystem-/Serverrollback ändert nicht automatisch Browserdaten. Wiederherstellungspunkt und externe Exporte sind unverschlüsselte Kopien und müssen bei endgültiger Löschung berücksichtigt werden.

## Reproduzierbares Paket

```bash
npm test
npm ci
npx playwright install chromium
npm run test:e2e
# Erst aus einem sauberen, committed Checkout:
npm run release:verify
```

`dist/` enthält ein TAR-Quellpaket, `SHA256SUMS` und `manifest.json` mit Anwendungsversion, Commit, Größe, Hash, Kanal und offenen Gates. `git archive` packt ausschließlich den committed Git-Baum. Untracked/ignorierte `.env`, `node_modules` und `dist` sind ausgeschlossen. Das TAR verwendet Git-Metadaten, keine aktuelle Build-Uhrzeit; derselbe Commit ergibt beim Wiederholungsbau identische Bytes. Das Artefakt ist ein Quellpaket mit Start über `node server.mjs`, kein nativer Installer.

CI baut und lädt den Kandidaten als prüfbares Workflow-Artefakt hoch. Eine spätere ausdrückliche Tag-Erstellung `v<package-version>` startet den Release-Workflow. Dieser führt zunächst denselben Qualitätsworkflow aus, prüft Tag-/Paketgleichheit und die Release-Gates und veröffentlicht anschließend nur die geprüften Dateien. RC-Tags werden als Pre-release veröffentlicht; offene manuelle Gates blockieren eine stabile Version.
