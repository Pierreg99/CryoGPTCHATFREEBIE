# HANDOFF · Roadmap v1.2/v1.3

Stand: 23. Oktober 2026.

## Nachweisbarer Ausgangspunkt

- PR #24 und #25 wurden integriert; Fehlerzählungs-Fix [PR #26](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/26) wurde nach vollständig erfolgreichen PR-Checks integriert.
- Der `main`-Lauf für `e7087138` bestand Node 20/22/24, Chromium und Release-Check: [Run 40015621693](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/runs/40015621693).
- Der aktuelle Entwicklungsbranch ergänzt v1.2 und v1.3; die neuen Checks gelten erst nach einem eigenen grünen Lauf.

## Implementiert auf Entwicklungsbranch

- Maximal 80 Chat-Nachrichten gleichzeitig im DOM, 600 bleiben im Store/JSON-Backup. Bewusste ältere/neuere Navigation.
- Gesprächssuche durch alle lokal gespeicherten Nachrichten mit gezieltem Sprung zum Treffer, auch außerhalb des sichtbaren Fensters.
- Kombinierbare Sidebar-Filter für Gespräch, Änderungsdatum (UTC-Tag), lokale Projekt-Notizen und Rolle.
- Regressionssuite: 600-Nachrichten-Fall, 2500-ms-Seitenbudget auf Chromium, Suche alter Nachrichten, Filterkombinationen.

## Nächste Gates

1. Exakte PR-Head SHA prüfen: Node.js-Matrix, Playwright/axe, reproduzierbares Release, Differenzen und Security.
2. Bei roten Checks reparieren und erneut am finalen Commit testen, kein Merge unter Fehlern.
3. Manuelle WCAG-2.2-AA-Testfälle M01–M16, insbesondere Paging und Filter mit echtem Screenreader, ausführen. [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22) blockiert stabile 1.0.
4. Nach erfolgreichem Integrationsgate v1.4 lokale Projekt-Arbeitsräume mit Backup- und Migrationsgate vorbereiten.

[PLAN](PLAN.md) · [PROGRESS](PROGRESS.md) · [AUDIT](AUDIT.md) · [HANDOVER](HANDOVER.md) · [ROADMAP](docs/roadmap/ROADMAP-100.md)

## Weiterarbeit v1.4

1. PR #28 vollständig prüfen und nur bei grünen Node-, Browser- und Release-Checks integrieren.
2. v1.4 gegen Schema 1/2/3 sowie Recovery-Rollback testen, Testbefunde beheben und nur nach CI auf finalem Head integrieren.
3. M17 (Projekt erstellen, zuordnen, Notizen, Fokus, mobile Ansicht) mit echtem Screenreader prüfen; Issue #22 blockiert stabile 1.0.
4. v1.5 Migration/Downgrade-Pfade danach weiter ausbauen.

## v1.5 · Nächster Operator-Schritt

1. Den vollständigen PR-Head samt Node 20/22/24, Chromium/axe und Release-Check prüfen und alle echten Fehler reparieren; nur mit grünem Gate mergen.
2. Das Schema-Migrationshandbuch und die synthetischen `tests/fixtures/backup-schema-v*.json` gegen Parser/Restore-Tests prüfen.
3. Eine reale manuelle Wiederherstellungsprobe unter M18 sowie das übergreifende WCAG-2.2-AA-Issue #22 bleiben separat offen.
4. Danach v1.6 (optionale Backup-Verschlüsselung mit KDF) als eigener Sicherheitsmeilenstein mit Bedrohungsmodell angehen; keinesfalls ungeprüfte Kryptographie shippen.

## v1.6 · Nächster Integrationsschritt

1. Neuen PR für `src/encrypted-backup.js`, Export-/Unlock-UI, Node- und Browser-Tests auf dem exakten Head prüfen.
2. Kritische Regressionen: falsches Passwort / Ciphertext-Manipulation ersetzt niemals gespeicherte Daten; erlaubte Restore-Vorschau und Undo sind weiterhin manuell.
3. Alle Pflichtjobs, Review-Anforderungen und Branch-Policy prüfen, dann erst mergen; CI-Fehler reparieren statt umgehen.
4. M19 sowie Issue #22 bleiben echte menschliche Prüfungen. Kein Stable-1.0-Tag.
