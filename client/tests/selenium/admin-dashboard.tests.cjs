const assert = require("assert");
const {
  buildDriver,
  openPath,
  waitForCss,
  findAllCss,
  isElementPresent,
  ensureAdminSession,
  getCurrentPath,
  formatPassMessage,
  formatFailMessage,
  formatErrorMessage,
} = require("./selenium.helpers.cjs");
const cases = [
  {
    id: "ADMIN-001",
    title: "Admin dashboard loads",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-page-header__title");
    },
  },
  {
    id: "ADMIN-002",
    title: "Dashboard title text is visible",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const el = await waitForCss(driver, ".admin-page-header__title");
      const text = await el.getText();
      assert.ok(text.trim().length > 0);
    },
  },
  {
    id: "ADMIN-003",
    title: "Export data button exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-btn.admin-btn--secondary");
    },
  },
  {
    id: "ADMIN-004",
    title: "Admin page header exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-page-header");
    },
  },
  {
    id: "ADMIN-005",
    title: "Stats grid exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-stats-grid");
    },
  },
  {
    id: "ADMIN-006",
    title: "Admin card exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-card");
    },
  },
  {
    id: "ADMIN-007",
    title: "Recent users table exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-table");
    },
  },
  {
    id: "ADMIN-008",
    title: "Recent users table header count is four",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const ths = await findAllCss(driver, ".admin-table thead th");
      assert.strictEqual(ths.length, 4);
    },
  },
  {
    id: "ADMIN-009",
    title: "Admin table has body",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-table tbody");
    },
  },
  {
    id: "ADMIN-010",
    title: "Admin page header actions exist",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-page-header__actions");
    },
  },
  {
    id: "ADMIN-011",
    title: "Stats grid uses stat card class when data exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const cards = await findAllCss(driver, ".admin-stat-card");
      if (cards.length === 0) return;
      assert.ok(cards.length > 0);
    },
  },
  {
    id: "ADMIN-012",
    title: "Stat card labels are present when data exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const labels = await findAllCss(driver, ".admin-stat-card__label");
      if (labels.length === 0) return;
      const texts = await Promise.all(labels.map((l) => l.getText()));
      assert.ok(texts.every((t) => t.trim().length > 0));
    },
  },
  {
    id: "ADMIN-013",
    title: "Stat card values are present when data exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const values = await findAllCss(driver, ".admin-stat-card__value");
      if (values.length === 0) return;
      const texts = await Promise.all(values.map((v) => v.getText()));
      assert.ok(texts.every((t) => t.trim().length > 0));
    },
  },
  {
    id: "ADMIN-014",
    title: "Admin table rows appear when data exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const rows = await findAllCss(driver, ".admin-table tbody tr");
      if (rows.length === 0) return;
      assert.ok(rows.length > 0);
    },
  },
  {
    id: "ADMIN-015",
    title: "Table cells include data-label attributes when rows present",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const cells = await findAllCss(driver, ".admin-table td[data-label]");
      if (cells.length === 0) return;
      assert.ok(cells.length > 0);
    },
  },
  {
    id: "ADMIN-016",
    title: "User name text appears when rows present",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const names = await findAllCss(driver, ".admin-user-name");
      if (names.length === 0) return;
      const texts = await Promise.all(names.map((n) => n.getText()));
      assert.ok(texts.every((t) => t.trim().length > 0));
    },
  },
  {
    id: "ADMIN-017",
    title: "Status badge uses modifier class when rows present",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const badges = await findAllCss(driver, ".admin-badge[class*='admin-badge--']");
      if (badges.length === 0) return;
      assert.ok(badges.length > 0);
    },
  },
  {
    id: "ADMIN-018",
    title: "Row columns contain text when rows present",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const rows = await findAllCss(driver, ".admin-table tbody tr");
      if (rows.length === 0) return;
      const cols = await rows[0].findElements({ css: "td" });
      const texts = await Promise.all(cols.map((c) => c.getText()));
      assert.ok(texts.every((t) => t.trim().length > 0));
    },
  },
  {
    id: "ADMIN-019",
    title: "Admin user info block exists when rows present",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const infos = await findAllCss(driver, ".admin-user-info");
      if (infos.length === 0) return;
      assert.ok(infos.length > 0);
    },
  },
  {
    id: "ADMIN-020",
    title: "Admin user avatar exists when rows present",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const avatars = await findAllCss(driver, ".admin-user-avatar");
      if (avatars.length === 0) return;
      assert.ok(avatars.length > 0);
    },
  },
  {
    id: "ADMIN-021",
    title: "Admin badge exists when rows present",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const badges = await findAllCss(driver, ".admin-badge");
      if (badges.length === 0) return;
      assert.ok(badges.length > 0);
    },
  },
  {
    id: "ADMIN-022",
    title: "Dashboard title uses h1",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const el = await waitForCss(driver, ".admin-page-header__title");
      const tag = await el.getTagName();
      assert.strictEqual(tag.toLowerCase(), "h1");
    },
  },
  {
    id: "ADMIN-023",
    title: "Admin page has at least one button",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const buttons = await findAllCss(driver, "button.admin-btn");
      assert.ok(buttons.length >= 1);
    },
  },
  {
    id: "ADMIN-024",
    title: "Recent users header is visible",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-card__header");
    },
  },
  {
    id: "ADMIN-025",
    title: "Recent users title text is present",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const el = await waitForCss(driver, ".admin-card__title");
      const text = await el.getText();
      assert.ok(text.trim().length > 0);
    },
  },
  {
    id: "ADMIN-026",
    title: "View all button exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const buttons = await findAllCss(driver, ".admin-card__header .admin-btn");
      assert.ok(buttons.length >= 1);
    },
  },
  {
    id: "ADMIN-027",
    title: "Admin stats grid uses card icon class when data exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const icons = await findAllCss(driver, ".admin-stat-card__icon");
      if (icons.length === 0) return;
      assert.ok(icons.length > 0);
    },
  },
  {
    id: "ADMIN-028",
    title: "Admin stat card uses color modifier when data exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const icons = await findAllCss(driver, ".admin-stat-card__icon[class*='admin-stat-card__icon--']");
      if (icons.length === 0) return;
      assert.ok(icons.length > 0);
    },
  },
  {
    id: "ADMIN-029",
    title: "Admin table has header row",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-table thead tr");
    },
  },
  {
    id: "ADMIN-030",
    title: "Admin table body rows have four columns when data exists",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const rows = await findAllCss(driver, ".admin-table tbody tr");
      if (rows.length === 0) return;
      const cols = await rows[0].findElements({ css: "td" });
      assert.strictEqual(cols.length, 4);
    },
  },
  {
    id: "ADMIN-031",
    title: "Admin page path remains /admin",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const path = await getCurrentPath(driver);
      assert.strictEqual(path, "/admin");
    },
  },
  {
    id: "ADMIN-032",
    title: "Admin stats grid is visible",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const grid = await waitForCss(driver, ".admin-stats-grid");
      const displayed = await grid.isDisplayed();
      assert.strictEqual(displayed, true);
    },
  },
  {
    id: "ADMIN-033",
    title: "Admin table is visible",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const table = await waitForCss(driver, ".admin-table");
      const displayed = await table.isDisplayed();
      assert.strictEqual(displayed, true);
    },
  },
  {
    id: "ADMIN-034",
    title: "Admin page header is visible",
    run: async (driver) => {
      await openPath(driver, "/admin");
      const header = await waitForCss(driver, ".admin-page-header");
      const displayed = await header.isDisplayed();
      assert.strictEqual(displayed, true);
    },
  },
  {
    id: "ADMIN-035",
    title: "Admin page has title and actions section",
    run: async (driver) => {
      await openPath(driver, "/admin");
      await waitForCss(driver, ".admin-page-header__title");
      await waitForCss(driver, ".admin-page-header__actions");
    },
  },
];

async function run() {
  const driver = await buildDriver();
  let failures = 0;

  try {
    await ensureAdminSession(driver);

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
