# Release-Gates für 1.0

## Automatisch pro Commit geprüft

- Node-Tests unter Node 20, 22 und 24.
- Chromium-E2E einschließlich Backup-Fehlerfälle, Tastatur, Mobile-Reflow und axe.
- Kein Dirty-Checkout beim Paketbau; Versionseintrag im Changelog vorhanden; leere oder fehlerhafte REQUIRED-Checklisten werden abgewiesen.
- Zwei unabhängige `git archive`-Pakete desselben Commits sind bytegleich; SHA-256 und Herkunftsmanifest werden erzeugt.
- Release-Tag muss exakt zur Paketversion passen; Veröffentlichung erst nach dem wiederverwendeten Qualitätsworkflow.

## Manuelle Voraussetzung für die stabile Freigabe

- [ ] **REQUIRED**: Manuelle WCAG-2.2-AA-Abnahme der Kernflows mit realer Assistive Technology und dokumentiertem Prüfnachweis in [docs/accessibility-report.md](accessibility-report.md).

**Tracking:** [Issue #22 · P0 Manual WCAG 2.2 AA release audit for 1.0](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22)

### Exit-Kriterien für dieses REQUIRED-Gate

- Alle definierten Kernflows wurden mit dokumentierter OS-/Browser-/Screenreader-Kombination manuell ausgeführt.
- Tastatur-only, tatsächliche Screenreader-Ausgabe, Lesereihenfolge, Zoom/Reflow, Textabstände, Fokus-Sichtbarkeit und relevante Pointer-Zielgrößen wurden protokolliert.
- Blocker- und Major-Befunde sind behoben und erneut getestet.
- Befunde und Nachweise stehen im Accessibility-Bericht oder sind dort eindeutig auf Issues/PRs verlinkt.
- Node-Matrix, Browser-E2E und Release-Check sind nach den letzten Accessibility-Fixes erneut grün.

Der Paketbau für eine stabile `1.0.0` oder spätere Hauptversion bricht bei offenen REQUIRED-Zeilen ab. Ein Release-Candidate darf gebaut werden und enthält alle offenen Gates im Manifest. Die Checkbox ist erst nach dem tatsächlichen Nachweis zu schließen; ein grüner axe-Scan ersetzt ihn nicht.
