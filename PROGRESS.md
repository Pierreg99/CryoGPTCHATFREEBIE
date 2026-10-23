# PROGRESS · Verifizierbarer Projektfortschritt

Stand: 23. Oktober 2026. Die Workbench wurde mit PR #24 nach `main` integriert. Die Fehlerzentrale v1.1 wurde mit PR #25 nach `main` integriert; die zugehörige CI war wegen einer veralteten Roadmap-Zählung rot. PR #26 wurde gemergt; die CI auf dem neuen main-Commit `e7087138` ist erfolgreich ([Run 40015621693](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/runs/40015621693)).

| Bereich | Stand | Nachweis |
| --- | --- | --- |
| Paket | `1.0.0-rc.1`, weiterhin Release Candidate | [Paket](package.json), [Release-Gates](docs/RELEASE-CHECKLIST.md) |
| Workbench | Neue Startansicht, tatsächliche Statistiken, gruppierte Navigation, acht konsistent gestaltete Ansichten | [Shell](src/workbench.js), [Design](src/workbench.css) |
| Bedienung | Befehlssuche, Gesprächssuche, Fokusmodus, Zeichenzähler | [Browser-Tests](e2e/workbench.spec.js) |
| Screenshots | Aktuelle Offline-Ansichten mit frischem Profil; reproduzierbarer Capture-Befehl | [Galerie](docs/screenshots/), [Script](scripts/screenshots.mjs) |
| Historische Workbench-Tests | Früher 86 Node-Tests und 34 Browser-Tests; aktueller Projektstand erfordert pro Commit neue CI-Prüfung | [Workbench-Nachweis](docs/workbench-overhaul.md), [Testquellen](e2e/) |
| Fehlerzentrale v1.1 | Temporäre lokale Diagnose mit explizitem Modell- und Speicher-Retry in `main` via PR #25; manuelle Abnahme offen | [PR #25](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/pull/25) |
| CI | Nach PR #26 ist `main` erfolgreich ([Run 40015621693](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions/runs/40015621693)); v1.2/v1.3-Branch muss separat validiert werden | [GitHub Actions](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/actions) |
| v1.2/v1.3 | Branch: Fensterdarstellung, Volltextsuche unabhängig vom DOM, kombinierte lokale Filter und neue Testfälle; noch nicht gemergt | [PLAN](PLAN.md) · [Workbench](docs/workbench-overhaul.md) |
| Accessibility | M01–M16 und X01–X10 noch manuell zu prüfen | [Accessibility-Bericht](docs/accessibility-report.md), [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22) |
| Roadmap | 100 dokumentierte Entwicklungsmeilensteine, keine 100 veröffentlichten Releases | [Master-Roadmap](docs/roadmap/ROADMAP-100.md) |

[README](README.md) · [AUDIT](AUDIT.md) · [PLAN](PLAN.md)

## v1.4 · Lokale Projekt-Arbeitsräume

Feature-Branch ergänzt Projektliste, Chatzuordnung, getrennte private Notizebenen, Projektfilter und Schema-3-Migration. Tests für zwei Projekte, Importvalidierung und Browser-Export. **Noch nicht durch CI oder manuelle Accessibility abgenommen.** Keine Cloud-Anfragen oder automatischen Agentenwrites ergänzt.

## v1.5 · Migrationsmatrix (in Entwicklung)

Test-Fixtures für jedes unterstützte JSON-Backup-Schema 1/2/3 und eigene Node-Regressionssuite für Freigaberegeln, v3-Projektreferenzen, redigierte Berichte und Restore/Undo sind als Branch-Änderung vorbereitet. Neue Downgrade-Dokumentation unter `docs/schema-migration.md`. Stand: **CI und reale Accessibility-Abnahme müssen noch geprüft werden**. Bestehende Stable-1.0-Sperre aus Issue #22 bleibt unverändert.

## v1.6 · Verschlüsselte Backups

Code und Tests auf Entwicklungsbranch vorbereitet: WebCrypto PBKDF2-SHA-256/AES-GCM, lokaler Export/Import mit ausdrücklich eingegebenem Passwort, bestehender Restore-/Undo-Gate, Testfälle für falsches Passwort, Manipulation und Browser-Roundtrip. **CI und manuelle Abnahme sind nicht mit dieser Implementierung belegt**; Status erst nach tatsächlichen GitHub-Checks aktualisieren. [Anleitung](docs/encrypted-backups.md).
