const assert = require("assert");
const {
  buildDriver,
  openPath,
  waitForCss,
  findAllCss,
  isElementPresent,
  clickCss,
  sendKeysToBody,
  ensureUserSession,
  getCurrentPath,
  formatPassMessage,
  formatFailMessage,
  formatErrorMessage,
} = require("./selenium.helpers.cjs");
const cases = [
  {
    id: "HOME-001",
    title: "Homepage loads",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, "main.space-game");
    },
  },
  {
    id: "HOME-002",
    title: "Game dashboard exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-dashboard");
    },
  },
  {
    id: "HOME-003",
    title: "HUD section is visible",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, "section.game-hud");
    },
  },
  {
    id: "HOME-004",
    title: "Game title is Space Raiders",
    run: async (driver) => {
      await openPath(driver, "/H");
      const el = await waitForCss(driver, ".game-hud__header h2");
      const text = await el.getText();
      assert.strictEqual(text.trim(), "Space Raiders");
    },
  },
  {
    id: "HOME-005",
    title: "Overlay panel is visible by default",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-overlay-panel");
    },
  },
  {
    id: "HOME-006",
    title: "Overlay has control list items",
    run: async (driver) => {
      await openPath(driver, "/H");
      const items = await findAllCss(driver, ".game-overlay-panel li");
      assert.ok(items.length >= 4);
    },
  },
  {
    id: "HOME-007",
    title: "Overlay hide button closes overlay",
    run: async (driver) => {
      await openPath(driver, "/H");
      await clickCss(driver, ".game-overlay-panel .ui-btn--ghost");
      const present = await isElementPresent(driver, ".game-overlay-panel");
      assert.strictEqual(present, false);
    },
  },
  {
    id: "HOME-008",
    title: "Header toggle button shows overlay",
    run: async (driver) => {
      await openPath(driver, "/H");
      await clickCss(driver, ".game-overlay-panel .ui-btn--ghost");
      await clickCss(driver, ".game-hud__header .ui-btn--ghost");
      await waitForCss(driver, ".game-overlay-panel");
    },
  },
  {
    id: "HOME-009",
    title: "Pressing T toggles overlay",
    run: async (driver) => {
      await openPath(driver, "/H");
      await sendKeysToBody(driver, "t");
      const hidden = await isElementPresent(driver, ".game-overlay-panel");
      await sendKeysToBody(driver, "t");
      const visible = await isElementPresent(driver, ".game-overlay-panel");
      assert.ok(hidden !== visible);
    },
  },
  {
    id: "HOME-010",
    title: "Game frame container exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-frame");
    },
  },
  {
    id: "HOME-011",
    title: "Game frame canvas area is labeled",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-frame__canvas[aria-label=\"Game area\"]");
    },
  },
  {
    id: "HOME-012",
    title: "Canvas surface element exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, "canvas.game-frame__surface");
    },
  },
  {
    id: "HOME-013",
    title: "HUD metrics container exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-hud__metrics");
    },
  },
  {
    id: "HOME-014",
    title: "Stat cards count is at least four",
    run: async (driver) => {
      await openPath(driver, "/H");
      const cards = await findAllCss(driver, ".game-hud__metrics .game-hud__card");
      assert.ok(cards.length >= 4);
    },
  },
  {
    id: "HOME-015",
    title: "Stat cards show label and value",
    run: async (driver) => {
      await openPath(driver, "/H");
      const cards = await findAllCss(driver, ".game-hud__metrics .game-hud__card");
      const checks = await Promise.all(cards.map(async (card) => {
        const label = await card.findElement({ css: "span" }).getText();
        const value = await card.findElement({ css: "strong" }).getText();
        return label.trim().length > 0 && value.trim().length > 0;
      }));
      assert.ok(checks.every(Boolean));
    },
  },
  {
    id: "HOME-016",
    title: "Recent drops card header exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-hud__card-header");
    },
  },
  {
    id: "HOME-017",
    title: "Recent drops total chip exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".chip.chip--accent");
    },
  },
  {
    id: "HOME-018",
    title: "Empty drops message shows when list is empty",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".metric-label");
    },
  },
  {
    id: "HOME-019",
    title: "Overlay header exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-overlay-panel .overlay-header");
    },
  },
  {
    id: "HOME-020",
    title: "Overlay hint text exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-overlay-panel small");
    },
  },
  {
    id: "HOME-021",
    title: "Header toggle button exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-hud__header .ui-btn--ghost");
    },
  },
  {
    id: "HOME-022",
    title: "Overlay has dialog role",
    run: async (driver) => {
      await openPath(driver, "/H");
      const overlay = await waitForCss(driver, ".game-overlay-panel");
      const role = await overlay.getAttribute("role");
      assert.strictEqual(role, "dialog");
    },
  },
  {
    id: "HOME-023",
    title: "Canvas container uses main role",
    run: async (driver) => {
      await openPath(driver, "/H");
      const el = await waitForCss(driver, ".game-frame__canvas");
      const role = await el.getAttribute("role");
      assert.strictEqual(role, "main");
    },
  },
  {
    id: "HOME-024",
    title: "Game HUD eyebrow exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-hud__eyebrow");
    },
  },
  {
    id: "HOME-025",
    title: "Overlay and header buttons are ghost style",
    run: async (driver) => {
      await openPath(driver, "/H");
      const buttons = await findAllCss(driver, ".ui-btn--ghost");
      assert.ok(buttons.length >= 2);
    },
  },
  {
    id: "HOME-026",
    title: "Game frame header exists",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-frame__header");
    },
  },
  {
    id: "HOME-027",
    title: "Game dashboard contains HUD and frame",
    run: async (driver) => {
      await openPath(driver, "/H");
      const sections = await findAllCss(driver, ".game-dashboard > section");
      assert.ok(sections.length >= 2);
    },
  },
  {
    id: "HOME-028",
    title: "Game title uses h2",
    run: async (driver) => {
      await openPath(driver, "/H");
      await waitForCss(driver, ".game-hud__header h2");
    },
  },
  {
    id: "HOME-029",
    title: "Overlay list items have text",
    run: async (driver) => {
      await openPath(driver, "/H");
      const items = await findAllCss(driver, ".game-overlay-panel li");
      const texts = await Promise.all(items.map((i) => i.getText()));
      assert.ok(texts.every((t) => t.trim().length > 0));
    },
  },
  {
    id: "HOME-030",
    title: "Recent drops list is absent when empty",
    run: async (driver) => {
      await openPath(driver, "/H");
      const listPresent = await isElementPresent(driver, ".game-hud__card ul");
      const emptyPresent = await isElementPresent(driver, ".metric-label");
      assert.ok(!listPresent || emptyPresent);
    },
  },
  {
    id: "HOME-031",
    title: "Overlay can be re-shown after hiding",
    run: async (driver) => {
      await openPath(driver, "/H");
      await clickCss(driver, ".game-overlay-panel .ui-btn--ghost");
      await clickCss(driver, ".game-hud__header .ui-btn--ghost");
      await waitForCss(driver, ".game-overlay-panel");
    },
  },
  {
    id: "HOME-032",
    title: "Header toggle button is a button element",
    run: async (driver) => {
      await openPath(driver, "/H");
      const button = await waitForCss(driver, ".game-hud__header button.ui-btn--ghost");
      const tag = await button.getTagName();
      assert.strictEqual(tag.toLowerCase(), "button");
    },
  },
  {
    id: "HOME-033",
    title: "Overlay hide button is a button element",
    run: async (driver) => {
      await openPath(driver, "/H");
      const button = await waitForCss(driver, ".game-overlay-panel button.ui-btn--ghost");
      const tag = await button.getTagName();
      assert.strictEqual(tag.toLowerCase(), "button");
    },
  },
  {
    id: "HOME-034",
    title: "Main element is a main tag",
    run: async (driver) => {
      await openPath(driver, "/H");
      const main = await waitForCss(driver, "main.space-game");
      const tag = await main.getTagName();
      assert.strictEqual(tag.toLowerCase(), "main");
    },
  },
  {
    id: "HOME-035",
    title: "Homepage path remains /H",
    run: async (driver) => {
      await openPath(driver, "/H");
      const path = await getCurrentPath(driver);
      assert.strictEqual(path, "/H");
    },
  },
];

async function run() {
  const driver = await buildDriver();
  let failures = 0;

  try {
    await ensureUserSession(driver);

    for (const testCase of cases) {
      try {
        await testCase.run(driver);
        console.log(formatPassMessage(testCase.id, testCase.title));
      } catch (err) {
        failures += 1;
        console.error(formatFailMessage(testCase.id, testCase.title));
        console.error(formatErrorMessage(err.message));
      }
    }
  } finally {
    await driver.quit();
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

run();
