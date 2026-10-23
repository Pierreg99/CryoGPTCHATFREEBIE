# Backup-Schema-Migration · v1.5

Diese Seite beschreibt **Backup-Schemaversionen**, nicht die veröffentlichte Anwendungsversion. Die Anwendung bleibt auf `1.0.0-rc.1` bis zur gesonderten WCAG-Abnahme.

## Unterstützte Quellen und Ergebnis

| Quell-Schema | Enthält | Import-Ergebnis mit aktueller App | Freigaben |
| --- | --- | --- | --- |
| 1 | Chats, Nachrichten, einfache Einstellungen, eventuell ältere Notizen | Schema 3 mit `projects: []` und `projectId: null` | Alte `shareProjectContext`-Felder werden **nicht** übernommen |
| 2 | Chats, chatbezogene Notizen und explizite Modellfreigaben | Schema 3 mit `projects: []` und `projectId: null` | Explizite v2-Freigaben bleiben erhalten |
| 3 | Bis zu 40 Projekte mit eigenen privaten Notizen, Chats mit `projectId` | Schema 3, referenzielle Integrität geprüft | Neue Projekt-Notizen bleiben **immer lokal**; nur separat freigegebenes Chatwissen darf als Kontext mitgesendet werden |

Die Testfixtures `tests/fixtures/backup-schema-v1.json`, `backup-schema-v2.json` und `backup-schema-v3.json` enthalten synthetische Daten ohne private Benutzerinformationen. `tests/schema-migration.test.js` validiert die Migration jeder unterstützten Version, Export-/Import-Roundtrips, verweigerte Zukunftsversionen, fehlerhafte Projektzuordnungen, redigierte Berichte und ein Restore/Undo-Szenario mit zwei Projekten. Das nodebasierte Fixture-Gate wird unter Node 20, 22 und 24 in CI ausgeführt.

## Sichere Upgrade-Reihenfolge

1. **Vor dem Upgrade** einen eigenen JSON-Export aus der bisher verwendeten App sichern und unverändert an einem sicheren Ort aufbewahren. Die Daten sind unverschlüsselt. Ein älterer Client kann das neue Schema 3 nicht lesen.
2. Den neuen Workspace öffnen und den aktuellen Stand prüfen. IndexedDB verwendet weiterhin dieselbe Datenbank und den Schlüssel `current`; der alte Zustand wird beim Einlesen normalisiert, aber eine vorhandene unlesbare Datei darf nicht still überschrieben werden.
3. Bei einem Import **Import → Vorschau/Dry-run** verwenden. Die Vorschau zeigt Quellversion, Zielversion, Zahl der Chats/Projekte, Nachrichten und Freigaben. Sie ersetzt ohne Zustimmung keine Daten.
4. Import erst ausdrücklich freigeben. In IndexedDB werden der bisherige Stand als `restore-checkpoint-v1` und der neue Stand als `current` in einer Transaktion gespeichert. Beim lokalen Storage-Fallback fehlt diese atomare Mehrschlüsselgarantie.
5. Danach exportieren und mit Tests oder einer Wiederherstellungsprobe kontrollieren, ob Projekte, Chats und Notizen vollständig sind. Bei Problemen den Import über **Letzten Import zurücksetzen** mit erneuter Vorschau zurücknehmen. Der Rücksetzpunkt wird beim Undo verbraucht; ein weiterer Import ersetzt den vorherigen Rücksetzpunkt.

## Grenzen des Rollbacks

- Das Rücksetzen eines **Imports innerhalb der neuen App** funktioniert über den lokalen Rücksetzpunkt, soweit dieser noch vorhanden und der Speicher funktionsfähig ist. Der Rücksetzpunkt ist kein dauerhaftes Archiv; die zuletzt importierten Daten gehen beim Undo wieder verloren.
- Ein Downgrade auf eine **ältere Anwendung**, die nur v1/v2 liest, kann **kein v3-Backup direkt laden**. Zuvor angelegte ältere Sicherungen sind der sichere Rückweg. Für v3-Projekte und ihre privaten Notizen gibt es **keinen verlustfreien v2-Downgrade**; weder manuelle JSON-Manipulation noch heimliches Weglassen der Projekte ist ein unterstützter Rückweg.
- Ein Rollback von Dateien/Serverprogramm migriert Browserdaten nicht automatisch zurück. Vor jedem Downgrade die Daten sichern und Kompatibilität explizit prüfen.
- Bei Quota-, Konflikt- oder beschädigten Daten erhält die Importvalidierung die bestehenden Daten; sie darf keine stillen Teilimporte oder automatische Cloud-Anfragen erzeugen.
- Private Projektnotizen und Rücksetzpunkte werden nicht verschlüsselt. Backup-Export, Browserprofil und etwaige alte externe Kopien müssen getrennt geschützt und gegebenenfalls gelöscht werden.

## Weiterführende Gates

[Backup-Wiederherstellung](backup-recovery.md) · [Release-Politik](RELEASE.md) · [Master-Roadmap](roadmap/ROADMAP-100.md) · [Release-Checkliste](RELEASE-CHECKLIST.md) · [Accessibility-Testmatrix](accessibility-report.md)

**v1.5 Exit-Gate:** Fixtures jeder unterstützten Quelle, automatisierte Roundtrip-/Undo- und Negativtests; zusätzlich manuelle Accessibility-Prüfung und ein realer Wiederherstellungstest mit echten Browserprofilen vor dem vollständigen Milestone-Abschluss. Automatisierte Tests allein sind kein manueller WCAG-Nachweis.
