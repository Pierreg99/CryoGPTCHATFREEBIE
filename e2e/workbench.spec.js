import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function offline(page) {
  await page.route("**/api/status", (route) =>
    route.fulfill({
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
}

test("command search filters, opens routes, restores focus and makes no AI requests", async ({
  page,
}) => {
  await offline(page);
  let inference = 0;
  await page.route("**/api/chat/**", (route) => {
    inference++;
    return route.abort();
  });
  await page.goto("/");
  await page.locator("#command-open").focus();
  await page.keyboard.press("Control+k");
  await expect(page.locator("#command-search")).toBeFocused();
  await page.locator("#command-search").fill("keine solche aktion");
  await expect(page.locator(".command-empty")).toBeVisible();
  await page.locator("#command-search").fill("Modellzentrale");
  await expect(page.locator("#command-results button")).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#models$/);
  await expect(page.locator("#view-title")).toBeFocused();
  await page.locator("#command-open").click();
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.locator("#command-open")).toBeFocused();
  expect(inference).toBe(0);
});

test("palette starts a chat, prompt cards remain drafts and overview reflects real storage", async ({
  page,
}) => {
  await offline(page);
  await page.goto("/");
  await expect(page.locator("#metric-chats")).toHaveText("0");
  await page.locator("#command-open").click();
  await page.locator("#command-search").fill("Neuer Chat");
  await page.keyboard.press("Enter");
  await expect(page.locator("#prompt")).toBeFocused();
  await expect(page.locator("#metric-chats")).toHaveText("1");
  await page.locator(".prompt-grid button").first().click();
  await expect(page.locator(".message")).toHaveCount(0);
  await expect(page.locator("#prompt-count")).not.toHaveText("0 / 12.000");
  await page.locator("#send").click();
  await expect(page.locator(".message")).toHaveCount(1);
  await page.reload();
  await page.locator("#new-chat").click();
  await expect(page.locator("#metric-chats")).toHaveText("2");
  await expect(page.locator("#metric-messages")).toHaveText("1");
  await expect(page.locator("#prompt-count")).toHaveText("0 / 12.000");
});

test("conversation search cycles matching messages, treats HTML as text and resets on chat switch", async ({
  page,
}) => {
  await offline(page);
  await page.goto("/");
  for (const text of [
    "Alpha <img src=x onerror=alert(1)>",
    "Beta",
    "alpha zwei",
  ]) {
    await page.locator("#prompt").fill(text);
    await page.locator("#send").click();
  }
  await page.locator("#conversation-find").click();
  await page.locator("#conversation-query").fill("alpha");
  await expect(page.locator("#conversation-matches")).toHaveText(
    "1 / 2 Nachrichten",
  );
  await page.locator("#conversation-next").click();
  await expect(page.locator(".search-current pre")).toHaveText("alpha zwei");
  await page.locator("#conversation-next").click();
  await expect(page.locator(".search-current pre")).toContainText("<img");
  await expect(page.locator("#messages img")).toHaveCount(0);
  await page.locator("#conversation-query").fill("unbekannt");
  await expect(page.locator("#conversation-matches")).toHaveText(
    "Keine Treffer",
  );
  await expect(page.locator("#conversation-next")).toBeDisabled();
  await page.locator("#conversation-query").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#conversation-find")).toBeFocused();
  await page.locator("#conversation-find").click();
  await page.locator("#new-chat").click();
  await expect(page.locator("#conversation-search")).toBeHidden();
  await expect(page.locator("#conversation-query")).toHaveValue("");
});

test("desktop focus survives reload, releases navigation on tools and leaves mobile drawer usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await offline(page);
  await page.goto("/");
  await page.locator("#workspace-focus").click();
  await expect(page.locator("#sidebar")).toBeHidden();
  await expect(page.locator("#workspace-focus")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(page.locator("#sidebar")).toBeHidden();
  await page.locator("#command-open").click();
  await page.locator("#command-search").fill("Roadmap");
  await page.keyboard.press("Enter");
  await expect(page.locator("#sidebar")).toBeVisible();
  await page.locator('.workspace-nav a[href="#chat"]').click();
  await expect(page.locator("#sidebar")).toBeHidden();
  await page.setViewportSize({ width: 360, height: 740 });
  await expect(page.locator("#workspace-focus")).toBeHidden();
  await page.locator("#nav-toggle").click();
  await expect(page.locator("#sidebar")).toBeVisible();
  await page.locator('.workspace-nav a[href="#models"]').click();
  await expect(page.locator("#view-title")).toHaveText("Modellzentrale");
  expect(await page.locator("main").evaluate((node) => node.inert)).toBe(false);
});

for (const width of [320, 390, 1440])
  test(`workbench and command dialog reflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 });
    await offline(page);
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator("#command-open").click();
    const box = await page.locator("#command-dialog").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(page.locator("#command-open")).toBeFocused();
  });
