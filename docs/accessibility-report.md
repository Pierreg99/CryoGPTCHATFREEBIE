# Accessibility-Prüfbericht · 1.0.0-rc.1

Stand: 22. Oktober 2026. Roadmap v0.7, Kernflows des lokalen Einzelbenutzer-Workspace. Dieser Bericht dokumentiert technische Prüfungen gegen WCAG 2.2 A/AA und den Plan für die noch ausstehende manuelle Abnahme. Er ist keine vollständige Konformitätserklärung oder unabhängige Zertifizierung.

**P0-Tracking:** [Issue #22 · Manual WCAG 2.2 AA release audit for 1.0](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22)

## Gegenstand und Methode

Geprüft werden Navigation, Chat/Stoppen, Modellwahl, Projektwissen, Agentenfreigaben, GitHub/Skills, Hyperfocus, Godot-Formulare, Roadmap und Backup-Wiederherstellung. Grundlage der automatisierten Evidenz sind echte Chromium-Browserläufe, DOM-/Accessibility-Regeln mit axe, Tastatureingaben, Fokus-/Geometrieprüfungen und Fehler-Injektion. Externe Provider und Godot sind dabei simuliert. Viewports: 320, 360, 768 und 1440 CSS-Pixel. Die Tests stehen in `e2e/accessibility.spec.js`, `e2e/recovery.spec.js` und `e2e/workspace.spec.js`.

Für die stabile Freigabe muss zusätzlich ein Mensch die Kernflows mit realer Assistive Technology prüfen. Automatisierte Regeln bleiben unterstützende Evidenz und ersetzen weder tatsächliche Screenreader-Ausgabe noch eine manuelle Beurteilung von Lesereihenfolge, Fokus, Textvergrößerung oder Bedienbarkeit.

## Umgesetzte und technisch geprüfte Maßnahmen

| Kriterium / Risiko | Änderung und Nachweis |
| --- | --- |
| 1.1.1, 1.3.1, 4.1.2 – Namen und Semantik | Beschriftete Felder, Landmarken, native Dialoge und dekorative SVGs ohne redundante Ansage; axe über acht Ansichten und Importdialog. |
| 1.4.3 – Kontrast | axe prüft erfassbare Text-/Hintergrundkombinationen. Visuelle Sonderzustände bleiben Teil der manuellen Abnahme. |
| 1.4.10 – Reflow | Keine horizontale Seitennavigation bei 320 CSS-Pixeln in acht Ansichten; größere Desktop-/Tablet-Viewports ebenfalls geprüft. |
| 1.4.12 – Textabstände | Wird manuell mit Benutzer-Overrides auf Verlust von Inhalt/Funktion geprüft. |
| 2.1.1, 2.1.2 – Tastatur | Alt+N erstellt einen Chat; Tab erreicht Modellwahl und Senden; Enter kann eine gestartete Antwort stoppen. Dialog und mobile Navigation lassen sich mit Escape verlassen. |
| 2.2.1 – Lesedauer | Meldungen verschwinden nicht mehr nach acht Sekunden. Eine beschriftete Schließen-Schaltfläche gibt die Kontrolle zurück. |
| 2.2.2 – Bewegung | Animationen lassen sich unabhängig pausieren und lokal merken. Die Systemvorgabe für reduzierte Bewegung hat Vorrang. |
| 2.4.1, 2.4.3, 2.4.7 – Fokus | Sprunglink, Fokus bei Ansichtswechsel, native Dialogbegrenzung, geschlossene mobile Navigation außerhalb der Tab-Reihenfolge und Fokusrückgabe nach Stoppen/Schließen. |
| 2.4.11 – Nicht verdeckter Fokus | Meldungen reservieren Platz; überlagerte fokussierte Elemente werden sichtbar gescrollt. Geometrieprüfung im mobilen Browser-Test; reale Sonderzustände bleiben manuell zu prüfen. |
| 2.5.7 – Dragging Movements | Manuell prüfen, ob irgendeine Produktfunktion Dragging voraussetzt; falls ja, muss eine einfache Pointer-Alternative existieren. |
| 2.5.8 – Zielgröße | axe-WCAG-2.2-Regeln ergänzen die vorhandenen Mindestgrößen. Kontrollbeschriftungen vergrößern auch die anklickbare Checkboxfläche; reale Sonderfälle werden manuell geprüft. |
| 3.3.1, 3.3.2, 3.3.4 – Fehler und Datenverlust | Backup-Dry-run mit Fehlerpfaden, Vorschau, gesonderter Zustimmung und Rücksetzpunkt; fehlgeschlagene Speicherung wird nicht als Erfolg dargestellt. |
| 4.1.3 – Status | Separate, kurze Generierungsansagen und aria-busy; der gesamte Chatverlauf wird nicht bei jedem Rendern neu vorgelesen. |

## Reproduktion der automatisierten Evidenz

```bash
npm ci
npx playwright install chromium
npm run test:e2e -- e2e/accessibility.spec.js e2e/recovery.spec.js
```

Die Browser-Suite verwendet die Tags `wcag2a`, `wcag2aa`, `wcag21aa` und `wcag22aa`. Die breitere Layout-Suite bleibt zusätzlich aktiv. Ein grüner Regelscan kann nicht die tatsächliche Bedienerfahrung mit Assistive Technology beweisen.

## Manuelle WCAG-2.2-AA-Testmatrix

### Testumgebung protokollieren

| Feld | Eintrag |
| --- | --- |
| Commit-SHA | offen |
| Datum / Tester | offen |
| Betriebssystem + Version | offen |
| Browser + Version | offen |
| Screenreader + Version | offen |
| Eingabemethoden | Tastatur-only plus relevante Pointer-Eingabe |
| Zoom / Reflow | 100 %, 200 %, 400 % bzw. 320-CSS-px-Äquivalent |
| Reduced Motion | normal und reduzierte Bewegung |

### Kernflows

| ID | Flow | Manuell prüfen | Ergebnis |
| --- | --- | --- | --- |
| M01 | Navigation | Skip-Link, Desktop-Navigation, mobile Drawer-Navigation, Fokusreihenfolge, Escape, Fokusrückgabe | offen |
| M02 | Chat | Chat erstellen, Eingabe/Senden, Generierungsstatus, Stoppen, Umbenennen/Löschen | offen |
| M03 | Modelle | Modellzentrale, lokale Auswahl, Cloud-Freigabe, Ablehnung, Statuskommunikation | offen |
| M04 | Projektwissen | Speichern/Ändern, Freigabestatus, verständliche Rückmeldung | offen |
| M05 | Agenten | Plan lesen, Einzelschritte verstehen, Freigabe/Abbruch, Dialogfokus | offen |
| M06 | Backup | Gültige/ungültige Datei, Dry-run, Import, Rücksetzpunkt, Löschen, Fehlerzustände | offen |
| M07 | Hyperfocus | Navigation, Status, Historie, Fokus und Ansagen | offen |
| M08 | GitHub & Skills | Suche/Übernahme, Status, Freigabegrenzen, Lesereihenfolge | offen |
| M09 | Godot MCP | Formulare, Freigabe, Vorschau, Bestätigung, Fehlermeldungen | offen |
| M10 | Roadmap | Suche, Filter, Karten/Details, Lesereihenfolge, Zoom/Reflow | offen |

### Querschnittsprüfungen

| ID | Prüfung | Abnahmekriterium | Ergebnis |
| --- | --- | --- | --- |
| X01 | Tastatur-only | Alle Kernfunktionen erreichbar; kein Keyboard Trap | offen |
| X02 | Screenreader | Namen, Rollen, Werte, Status und Reihenfolge verständlich | offen |
| X03 | Fokus sichtbar | Fokussiertes Element sichtbar und nicht vollständig verdeckt | offen |
| X04 | Reflow | Kein Verlust von Information/Funktion bei 320 CSS px bzw. äquivalentem 400-%-Zoom | offen |
| X05 | Textabstände | Kein Verlust bei 1.5 Zeilenhöhe, 2x Absatzabstand, 0.12em Buchstaben- und 0.16em Wortabstand | offen |
| X06 | Kontrast/Sonderzustände | Text, Controls, Fehler, Auswahl und Fokus ausreichend unterscheidbar | offen |
| X07 | Hover/Focus-Zusatzinhalt | Falls vorhanden: dismissible, hoverable und persistent | offen |
| X08 | Zielgrößen | Relevante Pointer-Ziele erfüllen WCAG 2.2 AA oder dokumentierte Ausnahme | offen |
| X09 | Dragging | Keine notwendige Dragging-only-Funktion; sonst einfache Pointer-Alternative | offen |
| X10 | Bewegung | Reduced-Motion respektiert; pausierbare Animationen bleiben kontrollierbar | offen |

## Befundvorlage

Jeder echte Befund erhält eine eindeutige ID und wird hier oder in einem verlinkten Issue/PR dokumentiert.

| Feld | Inhalt |
| --- | --- |
| ID | A11Y-001 usw. |
| Flow / Screen | betroffener Bereich |
| WCAG | Erfolgskriterium |
| Umgebung | OS / Browser / Screenreader |
| Schritte | reproduzierbare Schritte |
| Erwartet | gewünschtes Verhalten |
| Tatsächlich | beobachtetes Verhalten |
| Schweregrad | blocker / major / minor |
| Status | open / fixed / retested |
| Nachweis | Screenshot, Video, Log, Issue oder PR |

## Exit-Kriterien für stabile 1.0

- [ ] Alle M01–M10-Kernflows in mindestens einer dokumentierten realen Screenreader-/Browser-Kombination geprüft.
- [ ] X01–X10 vollständig bewertet; nicht anwendbare Punkte begründet.
- [ ] Blocker und Major-Befunde behoben und erneut getestet.
- [ ] Automatisierte Node-, Browser- und Release-Checks nach den letzten Fixes erfolgreich.
- [ ] Prüfumgebung, Befunde und Retests nachvollziehbar dokumentiert.
- [ ] Erst danach REQUIRED-Zeile in [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md) abhaken.

## Aktueller Gate-Status

In dieser Umgebung wurden keine NVDA-, VoiceOver- oder Orca-Sprachausgaben gehört, keine physischen Mobilgeräte geprüft und keine unabhängige WCAG-Abnahme durchgeführt. Es werden dafür keine positiven Ergebnisse behauptet. Roadmap v0.7 bleibt **teilweise umgesetzt**, bis der manuelle Nachweis vorliegt. Die Release-Checkliste blockiert deshalb `1.0.0`; `1.0.0-rc.1` bleibt der aktuelle prüfbare Kandidat.

## Referenzen

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI How to Meet WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI: What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
