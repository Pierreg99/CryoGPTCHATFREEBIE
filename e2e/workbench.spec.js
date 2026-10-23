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


test("model failure enters the local error center and explicit retry resolves it", async ({ page }) => {
  await page.route("**/api/status", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#error-center-count")).toHaveText("1");
  await page.locator("#error-center-open").click();
  await expect(page.locator("#error-center-dialog")).toBeVisible();
  await expect(page.locator("#error-center-list")).toContainText("Modellverbindung");
  await page.unroute("**/api/status");
  await offline(page);
  await page.locator('[data-retry="models"]').click();
  await expect(page.locator("#error-center-count")).toHaveText("0");
  await expect(page.locator("#error-center-dialog")).toBeHidden();
});
test("error center never executes a model request on open or dismiss", async ({ page }) => {
  await page.route("**/api/status", (route) => route.abort());
  let inference = 0;
  await page.route("**/api/chat/**", (route) => { inference++; return route.abort(); });
  await page.goto("/");
  await page.locator("#error-center-open").click();
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(scan.violations).toEqual([]);
  await page.locator("#error-center-clear").click();
  await expect(page.locator("#error-center-list section")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#error-center-open")).toBeFocused();
  expect(inference).toBe(0);
});

function largeBackup() {
  const createdAt = "2026-10-20T12:00:00.000Z";
  const messages = Array.from({ length: 600 }, (_, i) => ({
    id: "m-" + i, role: i % 2 ? "assistant" : "user",
    content: "archive-entry-" + String(i).padStart(3, "0"), createdAt,
  }));
  return {
    version: 2,
    activeChatId: "large",
    settings: { model: "" },
    chats: [{ id: "large", title: "Grosses Archiv", createdAt, updatedAt: createdAt,
      messages, projectContext: "Cryo Projekt", shareProjectContext: false }],
  };
}
test("v1.2 windows 600 messages and can find text outside the current DOM page", async ({ page }) => {
  await offline(page);
  await page.addInitScript(backup =>
    localStorage.setItem("crygptchat.alpha.v1", JSON.stringify(backup)), largeBackup());
  await page.goto("/");
  await expect(page.locator("#metric-messages")).toHaveText("600");
  await expect(page.locator(".message")).toHaveCount(80);
  const duration = await page.evaluate(() => {
    const start = performance.now();
    document.querySelector('[data-page="older"]').click();
    return performance.now() - start;
  });
  expect(duration).toBeLessThan(2500);
  await expect(page.locator(".message")).toHaveCount(80);
  await expect(page.locator('.message[data-message-id="m-440"]')).toHaveCount(1);
  await page.locator("#conversation-find").click();
  await page.locator("#conversation-query").fill("archive-entry-005");
  await expect(page.locator("#conversation-matches")).toHaveText("1 / 1 Nachrichten");
  await expect(page.locator(".search-current pre")).toHaveText("archive-entry-005");
  await expect(page.locator(".message")).toHaveCount(80);
  await expect(page.locator("#metric-messages")).toHaveText("600");
});
test("v1.3 filters combine local project, date, role and exact chat", async ({ page }) => {
  await offline(page);
  const now = "2026-10-21T12:00:00.000Z";
  const earlier = "2026-10-20T12:00:00.000Z";
  const mk = (id, title, createdAt, role, project) => ({
    id, title, createdAt, updatedAt: createdAt,
    projectContext: project, shareProjectContext: false,
    messages: [{ id: id + "-m", content: "findable", role, createdAt }],
  });
  await page.addInitScript(backup =>
    localStorage.setItem("crygptchat.alpha.v1", JSON.stringify(backup)), {
      version: 2, settings: { model: "" }, activeChatId: "a",
      chats: [mk("a", "Alpha", earlier, "user", "Cryo Projekt"),
        mk("b", "Beta", now, "assistant", "andere"),
        mk("c", "Gamma", now, "user", "Cryo Projekt")],
    });
  await page.goto("/");
  await page.locator("#chat-filter-panel summary").click();
  await page.locator("#chat-filter-project").fill("Cryo");
  await expect(page.locator("#chat-filter-summary")).toHaveText("2 von 3 Gesprächen");
  await page.locator("#chat-filter-role").selectOption("assistant");
  await expect(page.locator("#chat-filter-summary")).toHaveText("0 von 3 Gesprächen");
  await page.locator("#chat-filter-role").selectOption("user");
  await page.locator("#chat-filter-from").fill("2026-10-21");
  await expect(page.locator("#chat-filter-summary")).toHaveText("1 von 3 Gesprächen");
  await page.locator("#chat-filter-chat").selectOption("c");
  await expect(page.locator("#chat-list .chat-link")).toHaveCount(1);
  await page.locator("#chat-filter-reset").click();
  await expect(page.locator("#chat-filter-summary")).toHaveText("3 von 3 Gesprächen");
  await expect(page.locator("#chat-list .chat-link")).toHaveCount(3);
});

test('paging keeps visible keyboard focus after re-render', async ({ page }) => {
  await offline(page);
  await page.addInitScript(backup =>
    localStorage.setItem("crygptchat.alpha.v1", JSON.stringify(backup)), largeBackup());
  await page.goto("/");
  const older = page.locator('[data-page="older"]');
  await older.focus();
  await page.keyboard.press("Enter");
  await expect(older).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(older).toBeFocused();
  await expect(page.locator('.message[data-message-id="m-360"]')).toHaveCount(1);
  await page.locator('[data-page="newer"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-page="newer"]')).toBeFocused();
});

test("v1.4 creates isolated projects, assigns chats and preserves notes through refresh and backup export", async ({ page }) => {
  await offline(page);
  await page.goto("/");
  await page.locator("#new-chat").click();
  await page.locator("#notes-toggle").click();
  await page.locator("#create-project").click();
  await page.locator("#cryo-dialog-input").fill("Cryo Alpha");
  await page.locator("#cryo-dialog-confirm").click();
  await expect(page.locator("#chat-project")).toHaveValue(/.+/);
  await page.locator("#workspace-notes").fill("Only locally stored alpha notes");
  await page.locator("#save-workspace-notes").click();
  await page.locator("#new-chat").click();
  // A chat switch collapses the details panel; explicitly open it for the next chat.
  await page.locator("#notes-toggle").click();
  await page.locator("#create-project").click();
  await page.locator("#cryo-dialog-input").fill("Cryo Beta");
  await page.locator("#cryo-dialog-confirm").click();
  await page.locator("#workspace-notes").fill("Independent beta notes");
  await page.locator("#save-workspace-notes").click();
  // Drafts are retained by project until explicitly saved, never sent to a model.
  await page.locator("#workspace-notes").fill("Unsaved beta draft");
  await page.locator("#chat-project").selectOption({ label: "Cryo Alpha" });
  await page.locator("#chat-project").selectOption({ label: "Cryo Beta" });
  await expect(page.locator("#workspace-notes")).toHaveValue("Unsaved beta draft");
  await page.locator("#workspace-notes").fill("Independent beta notes");
  await page.locator("#save-workspace-notes").click();
  await page.reload();
  await page.locator("#notes-toggle").click();
  await expect(page.locator("#workspace-notes")).toHaveValue("Independent beta notes");
  await page.locator("#chat-project").selectOption({ label: "Cryo Alpha" });
  await expect(page.locator("#workspace-notes")).toHaveValue("Only locally stored alpha notes");
  await expect(page.locator("#project-share")).not.toBeChecked();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await downloadPromise;
  const saved = JSON.parse(await (await import("node:fs/promises")).readFile(await download.path(), "utf8"));
  expect(saved.version).toBe(3);
  expect(saved.projects).toHaveLength(2);
  expect(saved.projects.map(project => project.notes).sort()).toEqual(["Independent beta notes", "Only locally stored alpha notes"]);
  expect(saved.chats.every(chat => saved.projects.some(project => project.id === chat.projectId))).toBe(true);
  await page.locator("#chat-filter-panel summary").click();
  await page.locator("#chat-filter-workspace").selectOption({ label: "Cryo Alpha" });
  await expect(page.locator("#chat-list .chat-link")).toHaveCount(2);
});

test('pointer paging does not steal focus after replacing the page', async ({ page }) => {
  await offline(page);
  await page.addInitScript(backup =>
    localStorage.setItem("crygptchat.alpha.v1", JSON.stringify(backup)), largeBackup());
  await page.goto("/");
  await page.locator('[data-page="older"]').click();
  await expect(page.locator('[data-page="older"]')).not.toBeFocused();
  await expect(page.locator('.message[data-message-id="m-440"]')).toHaveCount(1);
});
