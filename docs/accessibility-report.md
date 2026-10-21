# Accessibility-Prüfbericht · 1.0.0-rc.1

Stand: 21. Oktober 2026. Roadmap v0.7, Kernflows des lokalen Einzelbenutzer-Workspace. Dieser Bericht dokumentiert technische Prüfungen gegen WCAG 2.2 A/AA; er ist keine vollständige Konformitätserklärung oder unabhängige Zertifizierung.

## Gegenstand und Methode

Geprüft werden Navigation, Chat/Stoppen, Modellwahl, Projektwissen, Agentenfreigaben, GitHub/Skills, Hyperfocus, Godot-Formulare, Roadmap und Backup-Wiederherstellung. Grundlage sind echte Chromium-Browserläufe, DOM-/Accessibility-Regeln mit axe, Tastatureingaben, Fokus-/Geometrieprüfungen und Fehler-Injektion. Externe Provider und Godot sind dabei simuliert. Viewports: 320, 360, 768 und 1440 CSS-Pixel. Die Tests stehen in `e2e/accessibility.spec.js`, `e2e/recovery.spec.js` und `e2e/workspace.spec.js`.

## Umgesetzte und technisch geprüfte Maßnahmen

| Kriterium / Risiko | Änderung und Nachweis |
| --- | --- |
| 1.1.1, 1.3.1, 4.1.2 – Namen und Semantik | Beschriftete Felder, Landmarken, native Dialoge und dekorative SVGs ohne redundante Ansage; axe über acht Ansichten und Importdialog. |
| 1.4.3 – Kontrast | axe prüft erfassbare Text-/Hintergrundkombinationen. Visuelle Sonderzustände bleiben Teil der manuellen Abnahme. |
| 1.4.10 – Reflow | Keine horizontale Seitennavigation bei 320 CSS-Pixeln in acht Ansichten; größere Desktop-/Tablet-Viewports ebenfalls geprüft. |
| 2.1.1, 2.1.2 – Tastatur | Alt+N erstellt einen Chat; Tab erreicht Modellwahl und Senden; Enter kann eine gestartete Antwort stoppen. Dialog und mobile Navigation verlassen sich mit Escape. |
| 2.2.1 – Lesedauer | Meldungen verschwinden nicht mehr nach acht Sekunden. Eine beschriftete Schließen-Schaltfläche gibt die Kontrolle zurück. |
| 2.2.2 – Bewegung | Animationen lassen sich unabhängig pausieren und lokal merken. Die Systemvorgabe für reduzierte Bewegung hat Vorrang. |
| 2.4.1, 2.4.3, 2.4.7 – Fokus | Sprunglink, Fokus bei Ansichtswechsel, native Dialogbegrenzung, geschlossene mobile Navigation außerhalb der Tab-Reihenfolge und Fokusrückgabe nach Stoppen/Schließen. |
| 2.4.11 – Nicht verdeckter Fokus | Meldungen reservieren Platz; überlagerte fokussierte Elemente werden sichtbar gescrollt. Geometrieprüfung im mobilen Browser-Test. |
| 2.5.8 – Ziele | axe-WCAG-2.2-Regeln ergänzen die vorhandenen Mindestgrößen. Kontrollbeschriftungen vergrößern auch die anklickbare Checkboxfläche. |
| 3.3.1, 3.3.2, 3.3.4 – Fehler und Datenverlust | Backup-Dry-run mit Fehlerpfaden, Vorschau, gesonderter Zustimmung und Rücksetzpunkt; fehlgeschlagene Speicherung wird nicht als Erfolg dargestellt. |
| 4.1.3 – Status | Separate, kurze Generierungsansagen und aria-busy; der gesamte Chatverlauf wird nicht bei jedem Rendern neu vorgelesen. |

## Reproduktion

```bash
npm ci
npx playwright install chromium
npm run test:e2e -- e2e/accessibility.spec.js e2e/recovery.spec.js
```

Die Browser-Suite verwendet die Tags `wcag2a`, `wcag2aa`, `wcag21aa` und `wcag22aa`. Die breitere Layout-Suite bleibt zusätzlich aktiv. Ein grüner Regelscan kann nicht die tatsächliche Bedienerfahrung mit Assistive Technology beweisen.

## Offene manuelle Abnahme – blockiert stabiles 1.0

Ein Mensch muss die folgenden Kernflows mit einer realen Screenreader-/Browserkombination protokollieren: Navigation einschließlich mobilem Drawer, Chat erstellen/senden/stoppen, Modell-/Cloud-Freigabe, Projektwissen speichern, Agentenplan freigeben sowie gültiges/ungültiges Backup prüfen, importieren und zurücksetzen. Zu dokumentieren sind Betriebssystem, Browser, Screenreader und Versionen, Datum, Ergebnis und Befunde. Zusätzlich sind Textvergrößerung/Zoom, Textabstände, Fokuskontrast in Sonderzuständen und tatsächliche Lesereihenfolge zu prüfen.

In dieser Umgebung wurden keine NVDA-, VoiceOver- oder Orca-Sprachausgaben gehört, keine physischen Mobilgeräte geprüft und keine unabhängige WCAG-Abnahme durchgeführt. Es werden dafür keine positiven Ergebnisse behauptet. Roadmap v0.7 bleibt **teilweise umgesetzt**, bis der manuelle Nachweis vorliegt. Die Release-Checkliste blockiert deshalb `1.0.0`; `1.0.0-rc.1` ist ein prüfbarer Kandidat.
