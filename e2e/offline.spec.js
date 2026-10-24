import { test, expect } from "@playwright/test";

// Browser-offline mode preserves service workers and IndexedDB, but forbids network calls.
test("v1.7 cold offline reload preserves local note-mode writes and never caches API responses", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.locator("#app-version")).not.toBeEmpty();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise(resolve =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
  });
  const manifest = await page.evaluate(async () => (await fetch("/manifest.webmanifest")).json());
  expect(manifest.display).toBe("standalone");
  const cachePaths = await page.evaluate(async () =>
    (await caches.keys()).filter(x => x.startsWith("cryo-offline-shell-")));
  expect(cachePaths).toHaveLength(1);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#new-chat")).toBeVisible();
  await page.locator("#new-chat").click();
  await page.locator("#prompt").fill("Offline-Notiz ohne Modell");
  await page.locator("#send").click();
  await expect(page.locator(".message pre")).toHaveText("Offline-Notiz ohne Modell");
  await page.reload();
  await expect(page.locator(".message pre")).toHaveText("Offline-Notiz ohne Modell");
  const apiResult = await page.evaluate(async () =>
    fetch("/api/status").then(() => "network").catch(() => "offline"));
  expect(apiResult).toBe("offline");
  const urls = await page.evaluate(async () =>
    (await (await caches.open((await caches.keys()).find(x =>
      x.startsWith("cryo-offline-shell-")))).keys()).map(x => new URL(x.url).pathname));
  expect(urls).not.toContain("/api/status");
  await context.setOffline(false);
});
