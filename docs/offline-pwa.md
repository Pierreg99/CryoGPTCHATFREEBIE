# Offline-PWA · Roadmap v1.7

**Status:** Auf Entwicklungsbranch implementiert; erfolgreiche PR-CI und manuelle Abnahme dürfen erst nach Prüfung am finalen Commit behauptet werden. Version bleibt `1.0.0-rc.1`.

## Erste Installation

1. Lokal `npm start` ausführen und im aktuellen Browser `http://127.0.0.1:4173` öffnen. Die erste vollständige Installation erfordert den laufenden lokalen Server.
2. Die App registriert ihren Service Worker und legt eine begrenzte Kopie ihrer statischen Shell im Browser-CacheStorage an. Je nach Browser/Plattform kann die App im Browsermenü installiert werden.
3. Nach erfolgreich abgeschlossenem Cache-Download die Verbindung unterbrechen oder den Server stoppen. Im selben Browserprofil lässt sich die App weiterhin öffnen und ohne Modell als lokales Notizbuch nutzen.
4. Chat- und Projektdaten liegen in IndexedDB bzw. im vorhandenen localStorage-Fallback. Eine gespeicherte Notiz bleibt nach einem Offline-Neustart erhalten.
5. Verfügbarkeitsabfrage, Ollama/OpenAI-Inferenz, GitHub und Godot benötigen weiterhin den lokalen Server und ggf. Netzwerkanbindung. Es gibt **keinen** automatischen Cloud-, Modell- oder Tool-Wiederholungsversuch.

## Sicherheitsmodell

- `service-worker.js` behandelt nur GET auf exakt erlaubte lokale Shell-Pfade ohne Suchparameter; `/api/*`, fremde Ursprünge, unbekannte Ressourcen und POSTs laufen direkt ans Netz und werden nicht zwischengespeichert.
- Während der Server erreichbar ist, bevorzugt der Worker echte Netzantworten. Bei Verbindungsfehlern werden ausschließlich vorher abgelegte Programmdateien verwendet.
- Bei einem Update können alte versionierte Shell-Caches entfernt werden; ein unvollständiger Precache darf keine vorher funktionierende Version ersetzen.
- Browserprofil-/Cache-Löschung entfernt unter Umständen die Offline-Shell. Die Service-Worker-Installation erfolgt nur auf dem kanonischen Loopback-Host oder HTTPS.
- **Keine Speicherverschlüsselung durch die PWA:** Nur ausdrücklich per v1.6 verschlüsselt exportierte Backup-Dateien sind passwortgeschützt. Lokale Chatdaten und Rücksetzpunkte bleiben nach bisherigem Vertrag im Browserprofil.
- Geräte- und Browserinstallierbarkeit variieren; ein SVG-Icon wird nicht in jedem Launcher als installierbares App-Symbol akzeptiert. Kein Garantieversprechen für iOS/Android-Installationsdialoge.

## Prüfungen

```bash
npm test
npm ci
npx playwright install chromium
npm run test:e2e
npm run release:verify
```

`tests/offline-shell.test.js` prüft den erlaubten Cache, die API-Ausschlüsse und Registrierung. `e2e/offline.spec.js` prüft die kontrollierte Installation, das Offline-Reload und den lokalen Notiz-Roundtrip. Manuelle Accessibility M20 bleibt offen.

Die stabile Version `1.0.0` ist zusätzlich durch [Issue #22](https://github.com/Pierreg99/CryoGPTCHATFREEBIE/issues/22) gesperrt.
