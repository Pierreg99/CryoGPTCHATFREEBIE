import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function mock(page) {
  await page.route("**/api/status", (r) =>
    r.fulfill({
      json: {
        online: true,
        models: ["qwen2.5:3b"],
        providers: {
          ollama: { models: ["qwen2.5:3b"] },
          openai: { enabled: true, models: ["test-cloud"] },
        },
      },
    }),
  );
  await page.route("**/api/integrations", (r) =>
    r.fulfill({ json: { github: { repositories: ["allowed/repo"] } } }),
  );
  await page.route("**/api/godot/status", (r) =>
    r.fulfill({ json: { configured: false } }),
  );
}
for (const width of [360, 768, 1440])
  test(`navigation, layout and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await mock(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator(".workspace-nav a")).toHaveCount(8);
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
      await expect(
        page.locator(".workspace-nav a[aria-current=page]"),
      ).toHaveAttribute("href", "#" + view);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      if (view === "agents")
        await page
          .locator(".advanced-options")
          .evaluateAll((nodes) => nodes.forEach((n) => (n.open = true)));
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(scan.violations).toEqual([]);
    }
    expect(errors).toEqual([]);
    if (width < 850) {
      await page.locator("#nav-toggle").click();
      await expect(page.locator("#nav-toggle")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await page.keyboard.press("Escape");
      await expect(page.locator("#nav-toggle")).toBeFocused();
      expect(
        await page.locator("#sidebar").evaluate((n) => n.inert),
      ).toBeTruthy();
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        expect(
          await page.evaluate(() =>
            Boolean(document.activeElement?.closest("#sidebar")),
          ),
        ).toBeFalsy();
      }
    }
  });
test("local chat, context, backup and model favorites survive reload", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/");
  await page.locator("#new-chat").click();
  await page.locator("#prompt").fill("Mein lokaler Test");
  await page.locator("#send").click();
  await expect(page.locator(".message pre")).toHaveText("Mein lokaler Test");
  await page.goto("/#knowledge");
  await page.locator("#project-context").fill("Privates Projektwissen");
  await page.locator("#save-project-notes").click();
  await expect(page.locator("#project-share")).not.toBeChecked();
  await page.goto("/#models");
  await page.getByRole("button", { name: "☆ Merken" }).first().click();
  await page.reload();
  await expect(page.getByRole("button", { name: "★ Favorit" })).toHaveCount(1);
  await page.locator("#model-search").fill("unavailable");
  await expect(page.locator("#model-cards")).toContainText(
    "Keine Modelle gefunden",
  );
  const download = page.waitForEvent("download");
  await page.locator("#export").click();
  expect((await download).suggestedFilename()).toMatch(/backup.*json/);
  await page.goto("/#knowledge");
  await expect(page.locator("#project-context")).toHaveValue(
    "Privates Projektwissen",
  );
});
test("streaming response renders received text", async ({ page }) => {
  await mock(page);
  await page.route("**/api/chat/stream", async (r) => {
    await r.fulfill({
      contentType: "application/x-ndjson",
      body: '{"message":{"content":"Hallo Welt"},"done":false}\n{"done":true}\n',
    });
  });
  await page.goto("/");
  await page.locator("#model").selectOption("qwen2.5:3b");
  await page.locator("#prompt").fill("Hallo");
  await page.locator("#send").click();
  await expect(page.locator(".message.assistant pre")).toHaveText("Hallo Welt");
});
test("agent queue requires individual approval and resets when chat changes", async ({
  page,
}) => {
  await mock(page);
  let calls = 0;
  await page.route("**/api/agent/execute", (r) => {
    calls++;
    return r.fulfill({ json: { result: { text: "Reviewed reference" } } });
  });
  await page.goto("/");
  await page.locator("#new-chat").click();
  await page.goto("/#agents");
  await page.locator("#flow-add").click();
  await page.locator("#flow-add").click();
  await expect(page.locator("#flow-list li")).toHaveCount(2);
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Diesen Schritt freigeben" }).click();
  await page.locator("#cryo-dialog-confirm").click();
  await expect(page.locator("#flow-status")).toContainText("Schritt fertig");
  expect(calls).toBe(1);
  await expect(
    page.getByRole("button", { name: "Diesen Schritt freigeben" }),
  ).toHaveCount(1);
  await page.locator("#new-chat").click();
  await page.goto("/#agents");
  await expect(page.locator("#flow-list li")).toHaveCount(0);
  await expect(page.locator("#write-preview")).toBeDisabled();
});
test("Hyperfocus history is per-chat and removable, skills remain explicitly imported", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/hyperfocus/plan", (r) =>
    r.fulfill({
      json: {
        ticket: "test",
        expiresAt: Date.now() + 120000,
        preview: {
          goal: "Testziel",
          minutes: 15,
          actions: [],
          permissions: [],
        },
      },
    }),
  );
  await page.route("**/api/hyperfocus/run", (r) =>
    r.fulfill({
      json: {
        goal: "Testziel",
        mode: "offline",
        steps: [],
        brief: "Ein klarer nächster Schritt",
        sourceNote: "Quelle",
        writes: 0,
      },
    }),
  );
  await page.route("**/api/integrations/skills?*", (r) =>
    r.fulfill({
      json: {
        matches: 1,
        total: 1,
        results: [
          { name: "Design", slug: "design", description: "Geprüfter Skill" },
        ],
      },
    }),
  );
  await page.goto("/");
  await page.locator("#new-chat").click();
  await page.goto("/#focus");
  await page.locator("#focus-goal").fill("Testziel");
  await page.locator("#focus-plan").click();
  await page.locator("#focus-run").click();
  await page.locator("#cryo-dialog-confirm").click();
  await expect(page.locator(".focus-history summary")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".focus-history summary")).toHaveCount(1);
  await page.locator(".focus-history summary").click();
  await page.getByRole("button", { name: "Ergebnis löschen" }).click();
  await expect(page.locator(".focus-history summary")).toHaveCount(0);
  await page.goto("/#skills");
  await page.locator("#integration-skills").click();
  await expect(page.locator(".skill-card")).toHaveCount(1);
  await page.locator("#integration-import").click();
  await page.goto("/#knowledge");
  await expect(page.locator("#project-context")).toHaveValue(/Design/);
  await expect(page.locator("#project-share")).not.toBeChecked();
});

test("Markdown preview binds exact content and confirmation can be cancelled", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/agent/capabilities", (r) =>
    r.fulfill({
      json: { localWrites: true, githubWrites: false, writeRepositories: [] },
    }),
  );
  let writes = 0;
  await page.route("**/api/agent/write/preview", (r) =>
    r.fulfill({
      json: {
        ticket: "reviewed",
        expiresAt: Date.now() + 120000,
        target: "local",
        path: "report.md",
        before: "",
        after: "# Reviewed",
      },
    }),
  );
  await page.route("**/api/agent/write/execute", (r) => {
    writes++;
    return r.fulfill({ json: { target: "local", path: "report.md" } });
  });
  await page.goto("/");
  await page.locator("#new-chat").click();
  await page.goto("/#agents");
  await page.locator(".write-options > summary").click();
  await page.locator("#write-path").fill("report.md");
  await page.locator("#write-content").fill("# Reviewed");
  await page.locator("#write-preview").click();
  await expect(page.locator("#write-execute")).toBeEnabled();
  await page.locator("#write-content").fill("# Changed");
  await expect(page.locator("#write-execute")).toBeDisabled();
  await page.locator("#write-content").fill("# Reviewed");
  await page.locator("#write-preview").click();
  await page.locator("#write-execute").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  const chatsBefore = await page.locator("#chat-count").textContent();
  await page.keyboard.press("Alt+n");
  await expect(page.locator("#chat-count")).toHaveText(chatsBefore);
  await page.keyboard.press("Escape");
  expect(writes).toBe(0);
  await expect(page.locator("#write-execute")).toBeFocused();
  await page.locator("#write-execute").click();
  await page.locator("#cryo-dialog-confirm").click();
  await expect(page.locator("#write-status")).toContainText(
    "Lokale Datei erstellt",
  );
  expect(writes).toBe(1);
});
test("import remains confirmed, generation can stop, Godot keeps preview before creation", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/godot/status", (r) =>
    r.fulfill({ json: { configured: true, canCreateScenes: true } }),
  );
  await page.route("**/api/godot/inspect", (r) =>
    r.fulfill({ json: { output: "Godot 4.4" } }),
  );
  await page.route("**/api/godot/scene/preview", (r) =>
    r.fulfill({
      json: {
        ticket: "scene",
        expiresAt: Date.now() + 120000,
        summary: "Neue Szene: Demo",
      },
    }),
  );
  await page.route("**/api/godot/scene/create", (r) =>
    r.fulfill({
      json: {
        scenePath: "scenes/cryogptchat/Demo.tscn",
        rootNodeType: "Node2D",
        output: "Created",
      },
    }),
  );
  await page.goto("/");
  await page.locator("#new-chat").click();
  await page.locator("#prompt").fill("Backup-Nachricht");
  await page.locator("#send").click();
  // Use a real export as the import fixture so schema compatibility is exercised.
  const download = page.waitForEvent("download");
  await page.locator("#export").click();
  const file = await download;
  const filePath = await file.path();
  await page.locator("#import-file").setInputFiles(filePath);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator("#cryo-dialog-confirm").click();
  await expect(page.locator("#notice")).toContainText("Backup importiert");
  await page.route("**/api/chat/stream", async (r) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await r
      .fulfill({ contentType: "application/x-ndjson", body: '{"done":true}\n' })
      .catch(() => {});
  });
  await page.locator("#model").selectOption("qwen2.5:3b");
  await page.locator("#prompt").fill("Stopptest");
  await page.locator("#send").click();
  await expect(page.locator("#stop")).toBeVisible();
  await page.locator("#stop").click();
  await expect(page.locator("#notice")).toContainText("gestoppt");
  await page.goto("/#godot");
  await page.locator("#godot-version").click();
  await page.locator("#cryo-dialog-confirm").click();
  await expect(page.locator("#godot-output")).toContainText("Godot 4.4");
  await expect(page.locator("#scene-create")).toBeDisabled();
  await page.locator(".godot-scene-disclosure > summary").click();
  await page.locator("#scene-name").fill("Demo");
  await page.locator("#scene-preview").click();
  await expect(page.locator("#scene-create")).toBeEnabled();
  await page.locator("#scene-create").click();
  await page.locator("#cryo-dialog-input").fill("ERSTELLEN");
  await page.locator("#cryo-dialog-confirm").click();
  await expect(page.locator("#scene-summary")).toContainText("Demo.tscn");
});

test("skip link preserves selected view and browser history restores views", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/#models");
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#models$/);
  await expect(page.locator("main")).toBeFocused();
  await page.locator('.workspace-nav a[href="#skills"]').click();
  await page.goBack();
  await expect(
    page.locator('.workspace-nav a[aria-current="page"]'),
  ).toHaveAttribute("href", "#models");
});

test("all 100 roadmap versions are browsable with phase/status filters and full details", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/#roadmap");
  await expect(page.locator("#roadmap-list button")).toHaveCount(10);
  const versions = [];
  for (let i = 0; i < 10; i++) {
    versions.push(
      ...(await page
        .locator("#roadmap-list button")
        .evaluateAll((buttons) => buttons.map((b) => b.dataset.version))),
    );
    if (i < 9) await page.locator("#roadmap-next").click();
  }
  expect(versions).toHaveLength(100);
  expect(new Set(versions).size).toBe(100);
  await page.locator('button[data-version="10.0"]').click();
  await expect(page.locator("#roadmap-detail-title")).toContainText("v10.0");
  await expect(page.locator("#roadmap-detail-content")).toContainText(
    "Abnahmekriterium",
  );
  await page.locator("#roadmap-search").fill("v0.6");
  await expect(page.locator("#roadmap-list button")).toHaveCount(1);
  await expect(page.locator("#roadmap-detail-title")).toContainText(
    "Browser-End-to-End",
  );
  await page.locator("#roadmap-search").fill("");
  await page.locator("#roadmap-status").selectOption("implemented");
  await expect(page.locator("#roadmap-list button")).toHaveCount(6);
  await page.locator("#roadmap-status").selectOption("");
  await page.locator("#roadmap-phase").selectOption("10");
  await expect(page.locator("#roadmap-list button")).toHaveCount(10);
  await expect(page.locator("#roadmap-list")).toContainText("Vision 10.0");
  await page.locator("#roadmap-search").fill("no-such-feature");
  await expect(page.locator("#roadmap-result-count")).toHaveText(
    "0 passende Meilensteine",
  );
  await expect(page.locator(".roadmap-detail")).toBeHidden();
});
test("knowledge empty state creates a chat without losing the selected tool", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/#knowledge");
  await expect(
    page.getByRole("button", { name: "Chat erstellen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Chat erstellen", exact: true })
    .click();
  await expect(page).toHaveURL(/#knowledge$/);
  await expect(page.locator("#project-context")).toBeEnabled();
  await page.locator("#project-context").fill("Ein präziser Kontext");
  await expect(page.locator("#context-dirty")).toHaveText(
    "Ungespeicherte Änderungen",
  );
  await page.locator("#save-project-notes").click();
  await expect(page.locator("#context-dirty")).toHaveText("Lokal gespeichert");
});
test("mobile welcome makes the composer reachable without a long introductory scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 850 });
  await mock(page);
  await page.goto("/");
  await expect(page.locator(".workspace-nav a")).toHaveCount(8);
  const top = await page
    .locator("#composer")
    .evaluate((n) => n.getBoundingClientRect().top);
  expect(top).toBeLessThan(760);
  await page.goto("/#models");
  await page.locator("#model-search").fill("no-such-model");
  await expect(
    page.getByRole("button", { name: "Suche zurücksetzen" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Suche zurücksetzen" }).click();
  await expect(page.locator("#model-search")).toHaveValue("");
  await expect(page.locator(".model-card")).toHaveCount(2);
});

test("roadmap loading failure offers recovery without duplicate summary data", async ({
  page,
}) => {
  let requests = 0;
  await mock(page);
  await page.route("**/api/roadmap", (r) =>
    ++requests === 1
      ? r.fulfill({ status: 503, json: { error: "temporary" } })
      : r.continue(),
  );
  await page.goto("/#roadmap");
  await expect(page.locator("#roadmap-result-count")).toHaveText(
    "Roadmap nicht erreichbar.",
  );
  await page.getByRole("button", { name: "Erneut laden", exact: true }).click();
  await expect(page.locator("#roadmap-list button")).toHaveCount(10);
  await expect(page.locator(".roadmap-counts > div")).toHaveCount(3);
});
