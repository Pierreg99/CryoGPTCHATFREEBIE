# Geprüfte Backup-Wiederherstellung

Roadmap v0.8 ist für das bestehende Chat-/Projektwissen-Format umgesetzt. Die App unterstützt jetzt Sicherungen der Schemas 1, 2 und 3. [Fixtures, Versionsregeln und Downgrade-Grenzen](schema-migration.md) sind separat dokumentiert. Bestehende v1/v2-Backups bleiben importierbar. Die App prüft eine Datei lokal; kein Backup wird dafür an einen Server oder ein Modell übertragen.

## Ablauf

1. **Import** wählen und JSON-Datei bis 3 MiB auswählen. Alternativ ein verschlüsseltes Backup bis 4 MiB: Passwort zuerst lokal eingeben, dann erfolgt die normale Vorschau. [Verschlüsselungsanleitung](encrypted-backups.md).
2. Der Assistent führt einen Dry-run durch. Er zeigt Quell-/Zielformat, aktuelle und importierte Chatanzahl, Nachrichten, Notizen, vorhandene Kontextfreigaben, Fehlerpfade und Normalisierungen. Bis hierhin wird nichts ersetzt.
3. Bei Bedarf den aktuellen Stand und einen redigierten Prüfbericht herunterladen. Der Bericht enthält keine Nachrichten oder Projektnotizen.
4. Die Vorschau ausdrücklich bestätigen und **Backup importieren** wählen. Version 1 und 2 werden nach Version 3 migriert; alte Freigaben aus Version 1 werden nicht aktiviert. In Version 2 vorhandene explizite Kontextfreigaben werden angezeigt und erhalten. Der Import selbst erzeugt keine Modellanfrage.
5. Nach erfolgreichem Import steht **Letzten Import zurücksetzen** bereit. Auch das Zurücksetzen verlangt eine Vorschau und Zustimmung. Nach erfolgreichem Rücksetzen wird der Rücksetzpunkt verbraucht. Mit **Rücksetzpunkt löschen** kann die zusätzliche Kopie auch ohne Rücksetzen entfernt werden.

Nachrichten, Projektwissen, private Arbeitsraum-Notizen, Projektzuordnungen, aktive Chat-ID und Modellauswahl werden wiederhergestellt; das gewählte Modell muss weiterhin beim Provider verfügbar und serverseitig erlaubt sein. Favoriten und Bewegungseinstellungen gehören nicht zum Chat-Backup und bleiben unverändert. Vorhandene Hyperfocus-Ergebnisse für Chats im Rücksetzpunkt werden bis zur Rücksetzung oder Löschung dieses Punkts vor der normalen Bereinigung geschützt; die Historie unterliegt weiterhin ihrem globalen Größenlimit.

## Aktuelle Oberfläche

[Desktop-Vorschau](screenshots/backup-restore.png) · [Mobile-Vorschau](screenshots/backup-restore-mobile.png). Die Aufnahmen zeigen den lokal laufenden Release-Candidate mit einer synthetischen Beispieldatei.

## Speicherung und Fehler

IndexedDB speichert den bisherigen Stand als `restore-checkpoint-v1` und den neuen Stand als `current` in **einer** Transaktion im bestehenden Object Store. Scheitert ein Schreibvorgang, bleiben beide vorherigen Einträge unverändert. Erst nach erfolgreichem Commit ersetzt die App ihren sichtbaren Zustand. Ein Vergleich des erwarteten bisherigen Stands verhindert, dass der Assistent unbemerkte Änderungen eines anderen Tabs überschreibt; bei Konflikten muss neu geladen werden.

Im localStorage-Fallback gibt es keine atomare Mehrschlüsseltransaktion. Dort wird zuerst die bisherige Kopie gesichert und erst danach der aktuelle Stand ersetzt. Bei Fehlern bleibt der aktuelle Chatstand erhalten; die Wiederherstellung eines älteren Rücksetzpunkts erfolgt bestmöglich. Bei nicht zugänglichem Browser-Speicher bleibt der Import gesperrt.

Der Rücksetzpunkt enthält private Daten **unverschlüsselt**, genau wie der bisherige Chat-Speicher. Es bleibt höchstens ein Punkt erhalten; ein weiterer erfolgreicher Import ersetzt ihn. Wer Daten dauerhaft entfernen will, muss auch diesen Punkt und externe JSON-Exporte berücksichtigen. Der Assistent ersetzt keine geräteunabhängige Datensicherung.

Bereits geplante Agenten-/Hyperfocus-/GitHub-Vorschauen werden beim Restore auch dann verworfen, wenn die importierte Chat-ID gleich bleibt. Bereits ausdrücklich gestartete externe Schreibaktionen können durch einen lokalen Restore nicht zurückgenommen werden.

## Nachweise

`tests/backup-recovery.test.js` und `tests/schema-migration.test.js` prüfen v1/v2/v3 anhand versionierter Fixtures, UTF-8-Größenlimits, redigierte Fehlerberichte, atomaren Commit/Rollback, Quota-Fehler, konkurrierende Änderungen, Fallback und Löschen des Punkts. `e2e/recovery.spec.js` führt echte IndexedDB-/Browser-Flows aus: Vorschau ohne Mutation, Import/Reload/Undo, Altformat, kaputte Datei und Schreibfehler. Weitere Restore-E2E prüfen das Verwerfen alter Freigaben und die geschützte Hyperfocus-Historie.

## Passwortgeschützte Backups v1.6

Die zusätzlich angebotene Export-Schaltfläche erzeugt eine verschlüsselte JSON-Datei. Die Passwortabfrage geschieht lokal im Browser; eine Datei mit Verschlüsselungsformat wird beim Import zuerst entsperrt und erst anschließend wie bisher im Dry-run geprüft. Ein falsches Passwort oder veränderte Daten führen zu keiner Wiederherstellung. Der bestehende Standardexport und der lokale Speicher sind **nicht** verschlüsselt. Der Rücksetzpunkt bleibt wie bisher im Browserprofil unverschlüsselt. [Format, Schutzumfang und Risiken](encrypted-backups.md).
