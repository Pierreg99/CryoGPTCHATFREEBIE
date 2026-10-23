# Optionale lokal verschlüsselte Backups · Roadmap v1.6

**Status:** Technisch auf einem Entwicklungsbranch umgesetzt, automatische und manuelle Abnahme getrennt nachweisen. Anwendungsversion bleibt `1.0.0-rc.1`; die stabile Freigabe erfordert weiterhin die [WCAG-2.2-AA-Abnahme](RELEASE-CHECKLIST.md).

## Bedienung

1. In der Seitenleiste **Passwortgeschütztes Backup exportieren** wählen.
2. Ein einzigartiges, langes Passwort mit mindestens 12 Zeichen zweimal eingeben und die verschlüsselte JSON-Datei herunterladen.
3. Das Passwort getrennt von der Datei sicher verwahren. **Ein vergessenes Passwort kann nicht zurückgesetzt werden.**
4. Zur Wiederherstellung **Import** wählen und die verschlüsselte JSON-Datei auswählen (maximal 4 MiB).
5. Passwort eingeben, um das Backup **ausschließlich im Browser** zu entschlüsseln. Ein falsches Passwort oder eine veränderte Datei wird zurückgewiesen.
6. Erst nach erfolgreicher Entschlüsselung erscheint die bestehende **unverändernde Dry-run-Vorschau**. Daten werden ausschließlich nach expliziter Checkbox-Freigabe und Klick auf **Backup importieren** ersetzt.
7. Der bestehende lokale Rücksetzpunkt kann den vorherigen Stand nach der gleichen manuellen Bestätigung wiederherstellen.

Der Standardbutton **Export** erstellt weiterhin **unverschlüsseltes JSON**. Auch die Schaltfläche **Aktuellen Stand unverschlüsselt exportieren** im Restore-Dialog ist unverschlüsselt.

## Technisches Datei-Format

```json
{
  "format": "cryogptchat-encrypted-backup",
  "version": 1,
  "kdf": "PBKDF2-SHA-256",
  "iterations": 600000,
  "salt": "<Base64: 16 zufällige Bytes>",
  "cipher": "AES-256-GCM",
  "iv": "<Base64: 12 zufällige Bytes>",
  "ciphertext": "<Base64: AES-GCM-Ciphertext plus 16-Byte-Tag>"
}
```

Die KDF- und Cipher-Parameter werden beim Import fest geprüft, nicht aus beliebigen Dateiwerten übernommen. Salt (128 Bit) und IV (96 Bit) sind bei jedem Export neu. AES-256-GCM authentifiziert den Inhalt; KDF PBKDF2-HMAC-SHA-256 mit 600.000 Iterationen schützt die Passwortableitung gegen einfache Offline-Ratenversuche, ersetzt aber kein starkes, einzigartiges Passwort. Die Datei selbst enthält **keinen gespeicherten Schlüssel**, keine Nachricht im Klartext und kein Passwort. Ihr Header verrät das Format und die verwendeten Verfahren.

**Kompatibilität:** Die verschlüsselte Hülle ist getrennt von den bestehenden Backup-Schemata 1, 2 und 3. Nach Entschlüsselung prüft der bestehende Importer diese Schemata und die Zustimmung zu geteilten Kontexten weiterhin. Ältere Programmversionen ohne v1.6-Unterstützung können den verschlüsselten Umschlag nicht importieren.

## Grenzen

- **Nur exportierte Dateien sind verschlüsselt.** Chats, Projektwissen, Agentendaten und Recovery-Checkpoints liegen im aktuellen Browserprofil weiterhin gemäß bestehender Architektur unverschlüsselt.
- Die KDF schützt nicht zuverlässig bei kurzen, häufig verwendeten Passwörtern. Das Minimum von zwölf Zeichen ist keine Qualitätsgarantie.
- Ein kompromittierter Rechner, bösartiges Browser-Plugin oder ein manipuliertes Programm kann Klartext/Passwort beim Verarbeiten sehen.
- Passwort und entschlüsselter Inhalt befinden sich während der Verarbeitung kurzzeitig im Arbeitsspeicher; JavaScript garantiert keine sichere physische Speicherlöschung.
- Keine Key-Escrow, Cloud-Synchronisation, Wiederherstellungsphrase oder Passwortzurücksetzung.
- Kryptografie benötigt eine sichere Browser-Kontextumgebung mit WebCrypto, etwa `http://127.0.0.1:4173`.
- Maximale Klartext-JSON-Größe 3 MiB, verschlüsselter Umschlag maximal 4 MiB; die App lädt keine Backups zu einem Server hoch.
- Vor der Stable-Freigabe echte Screenreader- und Tastatur-Abnahme M19 durchführen. Automatische Browser-/Krypto-Tests allein ersetzen diese nicht.

## Prüfplan

`tests/encrypted-backup.test.js` prüft Roundtrips, zweimalige Zufallsauswahl, falsches Passwort, veränderte Ciphertexte, Formatparameter und Größenbegrenzung.

`e2e/recovery.spec.js` prüft den Download mit Passwort, falsche Eingabe (ohne Mutation), erfolgreichen Unlock, expliziten Restore, Browser-Neustart und Undo. Bestehende Backup-, Migrations- und Security-Regressionen bleiben Bestandteil der CI unter Node 20/22/24 und Chromium.

[Backup und Restore](backup-recovery.md) · [Schema-Migration](schema-migration.md) · [Roadmap](roadmap/ROADMAP-100.md) · [Accessibility](accessibility-report.md)
