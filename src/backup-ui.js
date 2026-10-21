import { confirmAction } from "./dialogs.js";
import { inspectBackup, backupReport, MAX_BACKUP_BYTES } from "./backup.js";
function download(name, value) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function restoreFocus(previous) {
  const target =
    previous?.isConnected &&
    !previous.closest("[inert]") &&
    !previous.disabled &&
    previous.getClientRects().length
      ? previous
      : document.querySelector("main");
  target?.focus({ preventScroll: true });
}
export function setupBackupRestore({
  el,
  getStore,
  getPersistence,
  isGenerating,
  closeSidebar,
  apply,
  notice,
}) {
  const undo = document.createElement("button");
  undo.id = "restore-checkpoint";
  undo.type = "button";
  undo.textContent = "Letzten Import zurücksetzen";
  undo.disabled = true;
  el("import-file").after(undo);
  const forget = document.createElement("button");
  forget.id = "restore-forget";
  forget.type = "button";
  forget.textContent = "Rücksetzpunkt löschen";
  forget.disabled = true;
  undo.after(forget);
  forget.addEventListener("click", async () => {
    if (
      !(await confirmAction(
        "Lokalen Wiederherstellungspunkt dauerhaft löschen? Die aktuellen Chats bleiben erhalten.",
      ))
    )
      return;
    try {
      await getPersistence()?.clearCheckpoint();
      await updateCheckpoint();
      notice("Wiederherstellungspunkt gelöscht.");
    } catch (error) {
      notice(error.message);
    }
  });
  let opened = false;
  async function updateCheckpoint() {
    try {
      const checkpoint = await getPersistence()?.readCheckpoint();
      undo.disabled = !checkpoint;
      forget.disabled = !checkpoint;
      document.dispatchEvent(
        new CustomEvent("workspace:recovery", {
          detail: checkpoint?.chats.map((chat) => chat.id) || [],
        }),
      );
    } catch {
      undo.disabled = true;
      forget.disabled = !getPersistence();
    }
  }
  async function show({ file, checkpoint }) {
    if (opened || document.querySelector("dialog[open]")) return;
    if (isGenerating()) {
      notice("Bitte die laufende Antwort zuerst stoppen.");
      return;
    }
    opened = true;
    const previous = document.activeElement;
    closeSidebar();
    const dialog = document.createElement("dialog");
    dialog.id = "restore-dialog";
    dialog.className = "cryo-dialog restore-dialog";
    dialog.setAttribute("aria-labelledby", "restore-title");
    dialog.setAttribute("aria-describedby", "restore-description");
    dialog.innerHTML = `<div class="eyebrow">LOKALE DATEN / VORSCHAU</div><h2 id="restore-title">${checkpoint ? "Import zurücksetzen" : "Backup wiederherstellen"}</h2><p id="restore-description">Prüfung ohne Änderungen. Erst deine Bestätigung ersetzt gespeicherte Chats.</p><p id="restore-status" role="status" aria-live="polite">Backup wird geprüft …</p><div id="restore-summary"></div><div id="restore-issues"></div><div class="restore-actions"><button id="restore-export-current" type="button">Aktuellen Stand exportieren</button><button id="restore-report" type="button" disabled>Prüfbericht herunterladen</button></div><label class="restore-approval" hidden><input id="restore-approve" type="checkbox">Ich habe die Vorschau geprüft. Die aktuellen Chats dürfen ersetzt werden.</label><div class="dialog-actions"><button id="restore-cancel" type="button">Abbrechen</button><button id="restore-apply" type="button" disabled>${checkpoint ? "Wiederherstellung freigeben" : "Backup importieren"}</button></div>`;
    document.body.append(dialog);
    const find = (id) => dialog.querySelector("#" + id);
    let inspection,
      busy = false,
      done = false;
    const close = () => {
      if (!busy) dialog.close();
    };
    find("restore-cancel").addEventListener("click", close);
    dialog.addEventListener("cancel", (event) => {
      if (busy) event.preventDefault();
    });
    dialog.addEventListener(
      "close",
      () => {
        opened = false;
        el("import-file").value = "";
        dialog.remove();
        restoreFocus(previous);
        updateCheckpoint();
      },
      { once: true },
    );
    find("restore-export-current").addEventListener("click", () =>
      download("cryogptchat-before-restore.json", getStore()),
    );
    find("restore-report").addEventListener("click", () =>
      download("cryogptchat-backup-report.json", backupReport(inspection)),
    );
    find("restore-approve").addEventListener("change", () => {
      find("restore-apply").disabled =
        !inspection?.ok || !find("restore-approve").checked || busy;
    });
    find("restore-apply").addEventListener("click", async () => {
      if (busy || done || !inspection?.ok || !find("restore-approve").checked)
        return;
      if (isGenerating()) {
        find("restore-status").textContent =
          "Eine Antwort läuft. Bitte abbrechen und die Antwort zuerst stoppen.";
        return;
      }
      busy = true;
      dialog.setAttribute("aria-busy", "true");
      for (const button of dialog.querySelectorAll("button"))
        button.disabled = true;
      find("restore-approve").disabled = true;
      find("restore-status").textContent =
        "Wiederherstellung wird sicher gespeichert …";
      try {
        await apply(inspection.backup, Boolean(checkpoint));
        done = true;
        busy = false;
        dialog.close();
        notice(
          checkpoint
            ? "Import zurückgesetzt. Die vorherigen Chats sind wiederhergestellt."
            : "Backup importiert. Ein lokaler Wiederherstellungspunkt für den vorherigen Stand wurde gespeichert.",
        );
      } catch (error) {
        busy = false;
        dialog.removeAttribute("aria-busy");
        find("restore-status").textContent =
          "Wiederherstellung nicht gespeichert: " + error.message;
        find("restore-cancel").disabled = false;
        find("restore-report").disabled = false;
        find("restore-export-current").disabled = false;
        find("restore-approve").checked = false;
        find("restore-approve").disabled = false;
        find("restore-cancel").focus();
      }
    });
    dialog.showModal();
    find("restore-cancel").focus();
    try {
      inspection =
        file?.size > MAX_BACKUP_BYTES
          ? {
              ok: false,
              errors: [
                {
                  path: "$",
                  message: "Backups dürfen maximal 3 MiB groß sein.",
                },
              ],
              warnings: [],
            }
          : inspectBackup(
              checkpoint ? JSON.stringify(checkpoint) : await file.text(),
            );
      if (!dialog.open) return;
      const list = document.createElement("ul");
      list.className = "restore-issue-list";
      for (const issue of [...inspection.errors, ...inspection.warnings]) {
        const item = document.createElement("li");
        const path = document.createElement("code");
        path.textContent = issue.path;
        item.append(path, document.createTextNode(" · " + issue.message));
        list.append(item);
      }
      find("restore-issues").append(list);
      find("restore-report").disabled = false;
      if (inspection.ok) {
        const { summary } = inspection;
        const grid = document.createElement("dl");
        grid.className = "restore-counts";
        for (const [label, value] of [
          [
            "Backup-Version",
            summary.sourceVersion + " → " + summary.targetVersion,
          ],
          ["Aktuelle Chats", getStore().chats.length],
          ["Chats im Backup", summary.chats],
          ["Nachrichten", summary.messages],
          ["Chats mit Notizen", summary.notes],
          ["Kontextfreigaben", summary.sharedContexts],
        ]) {
          const term = document.createElement("dt"),
            description = document.createElement("dd");
          term.textContent = label;
          description.textContent = String(value);
          grid.append(term, description);
        }
        find("restore-summary").append(grid);
        find("restore-status").textContent =
          "Prüfung abgeschlossen. Noch keine Daten geändert.";
        dialog.querySelector(".restore-approval").hidden = false;
        if (!getPersistence())
          find("restore-status").textContent =
            "Backup ist lesbar, aber lokales Speichern ist gesperrt. Bitte den bestehenden Speicherfehler zuerst beheben.";
        find("restore-approve").disabled = !getPersistence();
      } else {
        find("restore-status").textContent =
          "Backup kann nicht importiert werden. Bisherige Chats bleiben unverändert.";
        find("restore-status").setAttribute("role", "alert");
      }
    } catch {
      if (dialog.open) {
        inspection = {
          ok: false,
          errors: [
            { path: "$", message: "Datei konnte nicht gelesen werden." },
          ],
          warnings: [],
        };
        find("restore-status").textContent = inspection.errors[0].message;
        find("restore-report").disabled = false;
      }
    }
  }
  el("import").addEventListener("click", () => {
    if (isGenerating()) {
      notice("Bitte die laufende Antwort zuerst stoppen.");
      return;
    }
    el("import-file").click();
  });
  el("import-file").addEventListener("change", () => {
    const file = el("import-file").files?.[0];
    if (file) show({ file });
  });
  undo.addEventListener("click", async () => {
    try {
      const checkpoint = await getPersistence()?.readCheckpoint();
      if (checkpoint) await show({ checkpoint });
      else await updateCheckpoint();
    } catch (error) {
      notice(error.message);
    }
  });
  updateCheckpoint();
}
