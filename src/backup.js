import {
  VERSION,
  MAX_CHATS,
  MAX_MESSAGES,
  MAX_MESSAGE_LENGTH,
  MAX_PROJECT_CONTEXT,
  parseBackup,
} from "./core.js";
export const MAX_BACKUP_BYTES = 3 * 1024 * 1024;
const validDate = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));
// Error reports contain locations and reasons, never private message/notes contents.
export function inspectBackup(raw) {
  const errors = [],
    warnings = [];
  const issue = (path, message) => {
    if (errors.length < 50) errors.push({ path, message });
  };
  if (typeof raw !== "string")
    return {
      ok: false,
      errors: [{ path: "$", message: "Eine JSON-Textdatei wird erwartet." }],
      warnings,
    };
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES)
    return {
      ok: false,
      errors: [
        { path: "$", message: "Backups dürfen maximal 3 MiB groß sein." },
      ],
      warnings,
    };
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      errors: [{ path: "$", message: "Die Datei enthält kein gültiges JSON." }],
      warnings,
    };
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    issue("$", "Ein Backup-Objekt wird erwartet.");
  else {
    if (![1, VERSION].includes(value.version))
      issue("version", "Unterstützt werden Backup-Version 1 und 2.");
    if (!Array.isArray(value.chats) || value.chats.length > MAX_CHATS)
      issue(
        "chats",
        `Eine Liste mit höchstens ${MAX_CHATS} Chats wird erwartet.`,
      );
    else {
      const seen = new Set();
      value.chats.forEach((chat, i) => {
        const at = `chats[${i}]`;
        if (!chat || typeof chat !== "object") {
          issue(at, "Ein Chat-Objekt wird erwartet.");
          return;
        }
        if (
          typeof chat.id !== "string" ||
          !chat.id ||
          chat.id.length > 200 ||
          seen.has(chat.id)
        )
          issue(
            at + ".id",
            "Chat-ID fehlt, ist zu lang oder doppelt vorhanden.",
          );
        seen.add(chat.id);
        if (typeof chat.title !== "string")
          issue(at + ".title", "Ein Texttitel wird erwartet.");
        else if (chat.title.length > 100)
          warnings.push({
            path: at + ".title",
            message: "Der Titel wird auf 100 Zeichen gekürzt.",
          });
        for (const key of ["createdAt", "updatedAt"])
          if (!validDate(chat[key]))
            warnings.push({
              path: at + "." + key,
              message:
                "Ungültiges oder fehlendes Chatdatum wird durch den Importzeitpunkt ersetzt.",
            });
        if (
          chat.projectContext !== undefined &&
          (typeof chat.projectContext !== "string" ||
            chat.projectContext.length > MAX_PROJECT_CONTEXT)
        )
          issue(
            at + ".projectContext",
            `Projektwissen darf höchstens ${MAX_PROJECT_CONTEXT} Zeichen enthalten.`,
          );
        if (
          !Array.isArray(chat.messages) ||
          chat.messages.length > MAX_MESSAGES
        )
          issue(
            at + ".messages",
            `Eine Liste mit höchstens ${MAX_MESSAGES} Nachrichten wird erwartet.`,
          );
        else
          chat.messages.forEach((message, j) => {
            const loc = at + `.messages[${j}]`;
            if (!message || typeof message !== "object") {
              issue(loc, "Ein Nachrichtenobjekt wird erwartet.");
              return;
            }
            if (typeof message.id !== "string" || !message.id)
              issue(loc + ".id", "Eine Nachrichten-ID wird erwartet.");
            if (!["user", "assistant"].includes(message.role))
              issue(loc + ".role", "Erlaubt sind user und assistant.");
            if (
              typeof message.content !== "string" ||
              !message.content.trim() ||
              message.content.length > MAX_MESSAGE_LENGTH
            )
              issue(
                loc + ".content",
                `Nachricht muss 1 bis ${MAX_MESSAGE_LENGTH} Zeichen enthalten.`,
              );
            if (!validDate(message.createdAt))
              issue(
                loc + ".createdAt",
                "Ein gültiges Nachrichtendatum wird erwartet.",
              );
          });
      });
    }
  }
  if (errors.length)
    return { ok: false, errors, warnings: warnings.slice(0, 50) };
  let backup;
  try {
    backup = parseBackup(value);
  } catch {
    return {
      ok: false,
      errors: [
        {
          path: "$",
          message: "Backup entspricht nicht dem unterstützten Datenformat.",
        },
      ],
      warnings: warnings.slice(0, 50),
    };
  }
  if (value.version === 1)
    warnings.unshift({
      path: "version",
      message:
        "Version 1 wird nach Version 2 migriert. Modellfreigaben aus Altformaten werden nicht aktiviert.",
    });
  if (backup.activeChatId !== value.activeChatId)
    warnings.push({
      path: "activeChatId",
      message:
        "Die aktive Unterhaltung wird auf einen vorhandenen Chat gesetzt.",
    });
  const shared = backup.chats.filter((c) => c.shareProjectContext).length;
  if (shared)
    warnings.push({
      path: "chats",
      message: `${shared} Chat(s) enthalten freigegebenes Projektwissen. Diese Freigaben werden übernommen; der Import sendet nichts an ein Modell.`,
    });
  return {
    ok: true,
    errors: [],
    warnings: warnings.slice(0, 50),
    backup,
    summary: {
      sourceVersion: value.version,
      targetVersion: VERSION,
      chats: backup.chats.length,
      messages: backup.chats.reduce((n, c) => n + c.messages.length, 0),
      notes: backup.chats.filter((c) => c.projectContext).length,
      sharedContexts: shared,
    },
  };
}
export function backupReport(inspection) {
  return {
    reportVersion: 1,
    ok: inspection.ok,
    summary: inspection.summary || null,
    errors: inspection.errors,
    warnings: inspection.warnings,
  };
}
