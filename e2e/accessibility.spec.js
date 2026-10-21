import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function providers(page) {
  await page.route("**/api/status", (r) =>
    r.fulfill({
      json: {
        online: true,
        models: ["qwen"],
        providers: {
          ollama: { models: ["qwen"] },
          openai: { enabled: false, models: [] },
        },
      },
    }),
  );
}
test("keyboard-only chat can start and stop a response without losing focus", async ({
  page,
}) => {
  await providers(page);
  await page.route("**/api/chat/stream", async (r) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await r
      .fulfill({ contentType: "application/x-ndjson", body: '{"done":true}\n' })
      .catch(() => {});
  });
  await page.goto("/");
  await expect(page.locator("#model option")).toHaveCount(2);
  await page.keyboard.press("Alt+n");
  await expect(page.locator("#prompt")).toBeFocused();
  await page.keyboard.type("Eine Frage");
  await page.keyboard.press("Shift+Enter");
  await page.keyboard.type("mit zweiter Zeile");
  await page.keyboard.press("Tab");
  await expect(page.locator("#model")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(page.locator("#send")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#stop")).toBeFocused();
  await expect(page.locator("#messages")).toHaveAttribute("aria-busy", "true");
  await expect(page.locator("#messages")).toHaveAttribute("aria-live", "off");
  await expect(page.locator("#generation-status")).toContainText(
    "Antwort wird erstellt",
  );
  await page.keyboard.press("Enter");
  await expect(page.locator("#prompt")).toBeFocused();
  await expect(page.locator("#messages")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#generation-status")).toContainText(
    "Antwort gestoppt",
  );
});
test("notifications stay readable, can be dismissed and do not cover focused controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 650 });
  await providers(page);
  await page.goto("/");
  await page.locator("#prompt").fill("Eine lokale Notiz");
  await page.locator("#send").click();
  await expect(page.locator("#notice-message")).toContainText("lokale Notiz");
  await page.clock.install();
  await page.clock.fastForward(20000);
  await expect(page.locator("#notice")).toBeVisible();
  await page.locator("#send").focus();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const a = document.activeElement.getBoundingClientRect(),
          b = document.querySelector("#notice").getBoundingClientRect();
        return (
          a.bottom <= b.top ||
          a.top >= b.bottom ||
          a.right <= b.left ||
          a.left >= b.right
        );
      }),
    )
    .toBeTruthy();
  await page.locator("#notice-dismiss").click();
  await expect(page.locator("#notice")).toBeHidden();
  await expect(page.locator("main")).toBeFocused();
});
test("motion can be paused and remembered independently of system preference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await providers(page);
  await page.goto("/");
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    await page
      .locator(".hero-orb")
      .evaluate((n) => getComputedStyle(n).animationName),
  ).toBe("none");
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/motion-paused/);
  await page.locator("#motion-toggle").click();
  await expect(page.locator("#motion-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#motion-toggle")).toBeDisabled();
  await expect(page.locator("#motion-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("core views reflow at 320 CSS pixels and pass the WCAG 2.2 rule set", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await providers(page);
  await page.goto("/");
  for (const view of [
    "chat",
    "knowledge",
    "focus",
    "agents",
    "skills",
    "godot",
    "models",
    "roadmap",
  ]) {
    await page.goto("/#" + view);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(scan.violations).toEqual([]);
  }
});

test("application version badge comes from the actual server package metadata", async ({
  page,
}) => {
  const response = await page.request.get("/api/status");
  const data = await response.json();
  expect(data.version).toMatch(/^1\.0\.0-rc\.\d+$/);
  await page.goto("/");
  await expect(page.locator("#app-version")).toHaveText("RC " + data.version);
});
