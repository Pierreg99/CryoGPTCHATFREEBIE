import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  createChat,
  appendMessage,
  emptyStore,
  setProjectContext,
} from "../src/core.js";
import { readFile } from "node:fs/promises";
const time = "2026-10-21T10:00:00.000Z";
const incoming = () =>
  appendMessage(
    createChat(emptyStore(), "incoming", "Importierter Chat", time),
    "incoming",
    "user",
    "Nachricht aus dem Backup",
    "import-message",
    time,
  );
async function providers(page) {
  await page.route("**/api/status", (r) =>
    r.fulfill({
      json: {
        online: false,
        models: [],
        providers: {
          ollama: { models: [] },
          openai: { enabled: false, models: [] },
        },
      },
    }),
  );
  await page.route("**/api/integrations", (r) =>
    r.fulfill({ json: { github: { repositories: ["allowed/repo"] } } }),
  );
}
async function original(page) {
  await providers(page);
  await page.goto("/");
  await expect(page.locator("#status")).toContainText("lokale Notizen");
  await page.keyboard.press("Alt+n");
  await page.locator("#prompt").fill("Original bleibt erhalten");
  await page.locator("#send").click();
  await expect(page.locator(".message pre")).toHaveText(
    "Original bleibt erhalten",
  );
}
async function preview(page, backup = incoming()) {
  await page.locator("#import-file").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator("#restore-status")).toContainText(
    "Prüfung abgeschlossen",
  );
}
async function commit(page) {
  await page.locator("#restore-approve").check();
  await page.locator("#restore-apply").click();
  await expect(page.locator("#restore-dialog")).toHaveCount(0);
}
test("dry-run is non-mutating, committed restore survives reload, undo restores the exact previous data", async ({
  page,
}) => {
  await original(page);
  await preview(page);
  await expect(page.locator("#restore-apply")).toBeDisabled();
  await expect(page.locator(".message pre")).toHaveText(
    "Original bleibt erhalten",
  );
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".message pre")).toHaveText(
    "Original bleibt erhalten",
  );
  await preview(page);
  await commit(page);
  await expect(page.locator(".message pre")).toHaveText(
    "Nachricht aus dem Backup",
  );
  await page.reload();
  await expect(page.locator(".message pre")).toHaveText(
    "Nachricht aus dem Backup",
  );
  await expect(page.locator("#restore-checkpoint")).toBeEnabled();
  await page.locator("#restore-checkpoint").click();
  await expect(page.locator("#restore-status")).toContainText(
    "Prüfung abgeschlossen",
  );
  await commit(page);
  await page.reload();
  await expect(page.locator(".message pre")).toHaveText(
    "Original bleibt erhalten",
  );
  await expect(page.locator("#restore-checkpoint")).toBeDisabled();
});
test("v1 migration is previewed and does not reactivate old project consent", async ({
  page,
}) => {
  await original(page);
  const backup = setProjectContext(
    incoming(),
    "incoming",
    "Private Altformat-Notizen",
    true,
    time,
  );
  backup.version = 1;
  await preview(page, backup);
  await expect(page.locator("#restore-issues")).toContainText(
    "Version 1 wird nach Version 2 migriert",
  );
  await commit(page);
  await page.goto("/#knowledge");
  await expect(page.locator("#project-context")).toHaveValue(
    "Private Altformat-Notizen",
  );
  await expect(page.locator("#project-share")).not.toBeChecked();
});
test("corrupt backups expose field errors and a redacted report while leaving stored chats untouched", async ({
  page,
}) => {
  await original(page);
  const backup = incoming();
  backup.chats[0].messages[0].role = "system";
  backup.chats[0].messages[0].content = "CONFIDENTIAL_MUST_NOT_APPEAR";
  await page.locator("#import-file").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator("#restore-status")).toContainText(
    "kann nicht importiert",
  );
  await expect(page.locator("#restore-apply")).toBeDisabled();
  await expect(page.locator("#restore-issues")).toContainText(
    "chats[0].messages[0].role",
  );
  const pending = page.waitForEvent("download");
  await page.locator("#restore-report").click();
  const report = await pending;
  const raw = await readFile(await report.path(), "utf8");
  expect(raw).not.toContain("CONFIDENTIAL_MUST_NOT_APPEAR");
  expect(JSON.parse(raw).ok).toBe(false);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".message pre")).toHaveText(
    "Original bleibt erhalten",
  );
});
test("failed IndexedDB write keeps the current snapshot and cannot enable a false undo point", async ({
  page,
}) => {
  await original(page);
  await preview(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (key === "current" && value?.chats?.some((c) => c.id === "incoming"))
        throw new DOMException("Test quota failure", "QuotaExceededError");
      return put.call(this, value, key);
    };
  });
  await page.locator("#restore-approve").check();
  await page.locator("#restore-apply").click();
  await expect(page.locator("#restore-status")).toContainText(
    "nicht gespeichert",
  );
  await expect(page.locator(".message pre")).toHaveText(
    "Original bleibt erhalten",
  );
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".message pre")).toHaveText(
    "Original bleibt erhalten",
  );
  await expect(page.locator("#restore-checkpoint")).toBeDisabled();
});
test("a changed persisted snapshot invalidates the restore instead of overwriting another tab", async ({
  page,
}) => {
  await original(page);
  await preview(page);
  const external = appendMessage(
    createChat(emptyStore(), "external", "Anderes Tab", time),
    "external",
    "user",
    "Änderung aus anderem Tab",
    "external-m",
    time,
  );
  await page.evaluate(
    (value) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("cryogptchatfreebie");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction("snapshots", "readwrite");
          tx.objectStore("snapshots").put(value, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => reject(tx.error);
        };
      }),
    external,
  );
  await page.locator("#restore-approve").check();
  await page.locator("#restore-apply").click();
  await expect(page.locator("#restore-status")).toContainText(
    "zwischenzeitlich geändert",
  );
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".message pre")).toHaveText(
    "Änderung aus anderem Tab",
  );
});

async function browserSnapshot(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("cryogptchatfreebie");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result,
            r = db
              .transaction("snapshots", "readonly")
              .objectStore("snapshots")
              .get("current");
          r.onsuccess = () => {
            db.close();
            resolve(r.result);
          };
          r.onerror = () => reject(r.error);
        };
      }),
  );
}
test("restore invalidates planned agent actions even when chat IDs stay the same", async ({
  page,
}) => {
  await original(page);
  await page.goto("/#agents");
  await page.locator("#flow-add").click();
  await expect(page.locator("#flow-list li")).toHaveCount(1);
  const backup = await browserSnapshot(page);
  backup.chats[0].title = "Ersetzter Kontext, gleiche ID";
  await preview(page, backup);
  await commit(page);
  await expect(page.locator("#flow-list li")).toHaveCount(0);
  await expect(page.locator("#flow-draft")).toBeDisabled();
});
test("checkpoint protects prior focus history and discarding it purges only orphaned history", async ({
  page,
}) => {
  await original(page);
  const before = await browserSnapshot(page);
  const id = before.activeChatId;
  await page.evaluate(
    (chatId) =>
      localStorage.setItem(
        "cryo-focus-v1",
        JSON.stringify({
          version: 1,
          results: [
            {
              id: "old-focus",
              chatId,
              goal: "Geschütztes Ergebnis",
              brief: "Bleibt beim Undo erhalten",
              createdAt: Date.now(),
            },
          ],
        }),
      ),
    id,
  );
  await page.reload();
  await preview(page);
  await commit(page);
  await page.reload();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("cryo-focus-v1")).results.some(
        (x) => x.id === "old-focus",
      ),
    ),
  ).toBeTruthy();
  await page.locator("#restore-checkpoint").click();
  await expect(page.locator("#restore-status")).toContainText(
    "Prüfung abgeschlossen",
  );
  await commit(page);
  await page.goto("/#focus");
  await expect(page.locator(".focus-history summary")).toContainText(
    "Geschütztes Ergebnis",
  );
  await preview(page);
  await commit(page);
  await page.locator("#restore-forget").click();
  await page.locator("#cryo-dialog-confirm").click();
  await expect(page.locator("#restore-checkpoint")).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("cryo-focus-v1")).results.length,
      ),
    )
    .toBe(0);
  await page.goto("/#chat");
  await expect(page.locator(".message pre")).toHaveText(
    "Nachricht aus dem Backup",
  );
});

test("restore of the same chat ID resets the viewed window even when message count is unchanged", async ({ page }) => {
  await providers(page);
  const createdAt = "2026-10-21T10:00:00.000Z";
  const mk = prefix => ({
    version: 2, activeChatId: "same", settings: { model: "" },
    chats: [{
      id: "same", title: "Gleiche ID", createdAt, updatedAt: createdAt,
      projectContext: "", shareProjectContext: false,
      messages: Array.from({ length: 160 }, (_, i) => ({
        id: prefix + i, role: "user", content: prefix + " Inhalt " + i, createdAt,
      })),
    }],
  });
  await page.addInitScript(backup =>
    localStorage.setItem("crygptchat.alpha.v1", JSON.stringify(backup)), mk("vorher-"));
  await page.goto("/");
  await page.locator('[data-page="older"]').click();
  await expect(page.locator('.message[data-message-id="vorher-0"]')).toHaveCount(1);
  await preview(page, mk("danach-"));
  await commit(page);
  await expect(page.locator('.message[data-message-id="danach-159"]')).toHaveCount(1);
  await expect(page.locator('.message[data-message-id="danach-0"]')).toHaveCount(0);
});
