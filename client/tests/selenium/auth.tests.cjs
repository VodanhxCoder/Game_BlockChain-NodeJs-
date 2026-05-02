const assert = require("assert");
const {
  buildDriver,
  openPath,
  waitForCss,
  findAllCss,
  isElementPresent,
  clickCss,
  typeCss,
  getCurrentPath,
  assertPath,
  formatPassMessage,
  formatFailMessage,
  formatErrorMessage,
} = require("./selenium.helpers.cjs");
const cases = [
  {
    id: "AUTH-001",
    title: "Sign-in page loads",
    run: async (driver) => {
      await openPath(driver, "/signin");
      await waitForCss(driver, ".auth-shell.is-signin");
    },
  },
  {
    id: "AUTH-002",
    title: "Sign-in logo shows BLK",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const el = await waitForCss(driver, ".auth-logo");
      const text = await el.getText();
      assert.strictEqual(text.trim(), "BLK");
    },
  },
  {
    id: "AUTH-003",
    title: "Sign-in header is visible",
    run: async (driver) => {
      await openPath(driver, "/signin");
      await waitForCss(driver, "#signin-title");
    },
  },
  {
    id: "AUTH-004",
    title: "Sign-in email input is visible",
    run: async (driver) => {
      await openPath(driver, "/signin");
      await waitForCss(driver, "input[type=\"email\"].field-input");
    },
  },
  {
    id: "AUTH-005",
    title: "Sign-in email input has maxLength 100",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const el = await waitForCss(driver, "input[type=\"email\"].field-input");
      const maxLen = await el.getAttribute("maxLength");
      assert.strictEqual(maxLen, "100");
    },
  },
  {
    id: "AUTH-006",
    title: "Sign-in password input is visible",
    run: async (driver) => {
      await openPath(driver, "/signin");
      await waitForCss(driver, "input[placeholder=\"********\"]");
    },
  },
  {
    id: "AUTH-007",
    title: "Sign-in password input has maxLength 50",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const el = await waitForCss(driver, "input[placeholder=\"********\"]");
      const maxLen = await el.getAttribute("maxLength");
      assert.strictEqual(maxLen, "50");
    },
  },
  {
    id: "AUTH-008",
    title: "Remember me checkbox is checked by default",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const el = await waitForCss(driver, ".auth-remember input[type=\"checkbox\"]");
      const checked = await el.isSelected();
      assert.strictEqual(checked, true);
    },
  },
  {
    id: "AUTH-009",
    title: "Forgot password link exists",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const links = await findAllCss(driver, "a.auth-link");
      const hrefs = await Promise.all(links.map((l) => l.getAttribute("href")));
      assert.ok(hrefs.some((h) => h && h.includes("/forgot-password")));
    },
  },
  {
    id: "AUTH-010",
    title: "Theme toggle flips data-mode",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const toggle = await waitForCss(driver, ".auth-theme-toggle");
      const before = await toggle.getAttribute("data-mode");
      await toggle.click();
      const after = await toggle.getAttribute("data-mode");
      assert.notStrictEqual(before, after);
    },
  },
  {
    id: "AUTH-011",
    title: "Show password toggle changes input type",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const input = await waitForCss(driver, "input[placeholder=\"********\"]");
      const before = await input.getAttribute("type");
      await clickCss(driver, ".password-toggle");
      const after = await input.getAttribute("type");
      assert.notStrictEqual(before, after);
    },
  },
  {
    id: "AUTH-012",
    title: "Sign-in shows error on empty submit",
    run: async (driver) => {
      await openPath(driver, "/signin");
      await clickCss(driver, ".auth-actions .btn.primary");
      await waitForCss(driver, ".auth-error");
    },
  },
  {
    id: "AUTH-013",
    title: "Create account button navigates to signup",
    run: async (driver) => {
      await openPath(driver, "/signin");
      await clickCss(driver, ".auth-actions .btn.btn-outline");
      await waitForCss(driver, ".auth-shell.is-signup");
    },
  },
  {
    id: "AUTH-014",
    title: "Preview button navigates to signup",
    run: async (driver) => {
      await openPath(driver, "/signin");
      await clickCss(driver, ".auth-preview-btn");
      await waitForCss(driver, ".auth-shell.is-signup");
    },
  },
  {
    id: "AUTH-015",
    title: "Social login buttons exist",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const buttons = await findAllCss(driver, ".auth-social-btn");
      assert.ok(buttons.length >= 2);
    },
  },
  {
    id: "AUTH-016",
    title: "Social login buttons have labels",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const buttons = await findAllCss(driver, ".auth-social-btn");
      const checks = await Promise.all(buttons.map(async (b) => {
        const text = await b.getText();
        const aria = await b.getAttribute("aria-label");
        return text.trim().length > 0 || (aria && aria.trim().length > 0);
      }));
      assert.ok(checks.every(Boolean));
    },
  },
  {
    id: "AUTH-017",
    title: "Sign-in shell uses aria-labelledby",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const shell = await waitForCss(driver, ".auth-shell.is-signin");
      const attr = await shell.getAttribute("aria-labelledby");
      assert.strictEqual(attr, "signin-title");
    },
  },
  {
    id: "AUTH-018",
    title: "Sign-in form uses noValidate",
    run: async (driver) => {
      await openPath(driver, "/signin");
      const form = await waitForCss(driver, "form.auth-form");
      const attr = await form.getAttribute("noValidate");
      assert.ok(attr !== null);
    },
  },
  {
    id: "AUTH-019",
    title: "Sign-up page loads",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await waitForCss(driver, ".auth-shell.is-signup");
    },
  },
  {
    id: "AUTH-020",
    title: "Sign-up display name input is visible",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await waitForCss(driver, "input[autocomplete=\"nickname\"]");
    },
  },
  {
    id: "AUTH-021",
    title: "Sign-up display name maxLength is 30",
    run: async (driver) => {
      await openPath(driver, "/signup");
      const el = await waitForCss(driver, "input[autocomplete=\"nickname\"]");
      const maxLen = await el.getAttribute("maxLength");
      assert.strictEqual(maxLen, "30");
    },
  },
  {
    id: "AUTH-022",
    title: "Sign-up email input is visible",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await waitForCss(driver, "input[type=\"email\"].field-input");
    },
  },
  {
    id: "AUTH-023",
    title: "Sign-up email maxLength is 100",
    run: async (driver) => {
      await openPath(driver, "/signup");
      const el = await waitForCss(driver, "input[type=\"email\"].field-input");
      const maxLen = await el.getAttribute("maxLength");
      assert.strictEqual(maxLen, "100");
    },
  },
  {
    id: "AUTH-024",
    title: "Sign-up password input is visible",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await waitForCss(driver, "input[autocomplete=\"new-password\"].field-input");
    },
  },
  {
    id: "AUTH-025",
    title: "Sign-up confirm password input is visible",
    run: async (driver) => {
      await openPath(driver, "/signup");
      const inputs = await findAllCss(driver, "input[autocomplete=\"new-password\"].field-input");
      assert.ok(inputs.length >= 2);
    },
  },
  {
    id: "AUTH-026",
    title: "Sign-up password toggle changes input type",
    run: async (driver) => {
      await openPath(driver, "/signup");
      const input = await waitForCss(driver, "input[autocomplete=\"new-password\"].field-input");
      const before = await input.getAttribute("type");
      await clickCss(driver, ".password-toggle");
      const after = await input.getAttribute("type");
      assert.notStrictEqual(before, after);
    },
  },
  {
    id: "AUTH-027",
    title: "Sign-up shows error on empty submit",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await clickCss(driver, ".auth-actions .btn.primary");
      await waitForCss(driver, ".auth-error");
    },
  },
  {
    id: "AUTH-028",
    title: "Already have account button navigates to signin",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await clickCss(driver, ".auth-actions .btn.btn-outline");
      await waitForCss(driver, ".auth-shell.is-signin");
    },
  },
  {
    id: "AUTH-029",
    title: "Preview button navigates to signin",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await clickCss(driver, ".auth-preview-btn");
      await waitForCss(driver, ".auth-shell.is-signin");
    },
  },
  {
    id: "AUTH-030",
    title: "Sign-up theme toggle flips data-mode",
    run: async (driver) => {
      await openPath(driver, "/signup");
      const toggle = await waitForCss(driver, ".auth-theme-toggle");
      const before = await toggle.getAttribute("data-mode");
      await toggle.click();
      const after = await toggle.getAttribute("data-mode");
      assert.notStrictEqual(before, after);
    },
  },
  {
    id: "AUTH-031",
    title: "Support email mailto link exists",
    run: async (driver) => {
      await openPath(driver, "/signup");
      const links = await findAllCss(driver, "a.auth-link");
      const hrefs = await Promise.all(links.map((l) => l.getAttribute("href")));
      assert.ok(hrefs.some((h) => h && h.startsWith("mailto:")));
    },
  },
  {
    id: "AUTH-032",
    title: "Sign-up shell uses aria-labelledby",
    run: async (driver) => {
      await openPath(driver, "/signup");
      const shell = await waitForCss(driver, ".auth-shell.is-signup");
      const attr = await shell.getAttribute("aria-labelledby");
      assert.strictEqual(attr, "signup-title");
    },
  },
  {
    id: "AUTH-033",
    title: "Sign-up create account button exists",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await waitForCss(driver, ".auth-actions .btn.primary");
    },
  },
  {
    id: "AUTH-034",
    title: "Sign-up recaptcha container is present",
    run: async (driver) => {
      await openPath(driver, "/signup");
      await waitForCss(driver, ".recaptcha-container");
    },
  },
  {
    id: "AUTH-035",
    title: "Sign-up form uses noValidate",
    run: async (driver) => {
      await openPath(driver, "/signup");
      const form = await waitForCss(driver, "form.auth-form");
      const attr = await form.getAttribute("noValidate");
      assert.ok(attr !== null);
    },
  },
];

async function run() {
  const driver = await buildDriver();
  let failures = 0;

  try {
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
