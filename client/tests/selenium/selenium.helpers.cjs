const assert = require("assert");
const { Builder, By, Key, until } = require("selenium-webdriver");
const { BASE_URL, BROWSER, CREDS } = require("./selenium.config.cjs");

const DEFAULT_TIMEOUT = 10000;
const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

function colorize(text, color) {
  const code = ANSI[color];
  return code ? `${code}${text}${ANSI.reset}` : text;
}

function formatPassMessage(id, title) {
  return colorize(`PASS ${id} ${title}`, "green");
}

function formatFailMessage(id, title) {
  return colorize(`FAIL ${id} ${title}`, "red");
}

function formatErrorMessage(message) {
  return colorize(message, "yellow");
}

async function buildDriver() {
  return new Builder().forBrowser(BROWSER).build();
}

async function openPath(driver, path) {
  await driver.get(`${BASE_URL}${path}`);
}

async function waitForCss(driver, selector, timeout = DEFAULT_TIMEOUT) {
  const locator = By.css(selector);
  await driver.wait(until.elementLocated(locator), timeout);
  const el = await driver.findElement(locator);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

async function findAllCss(driver, selector) {
  return driver.findElements(By.css(selector));
}

async function isElementPresent(driver, selector) {
  const items = await driver.findElements(By.css(selector));
  return items.length > 0;
}

async function clickCss(driver, selector) {
  const el = await waitForCss(driver, selector);
  await el.click();
}

async function typeCss(driver, selector, value) {
  const el = await waitForCss(driver, selector);
  await el.clear();
  await el.sendKeys(value);
}

async function getCurrentPath(driver) {
  const url = await driver.getCurrentUrl();
  const u = new URL(url);
  return u.pathname;
}

async function assertPath(driver, expectedPath) {
  const path = await getCurrentPath(driver);
  assert.strictEqual(path, expectedPath);
}

async function ensureSignedIn(driver, role) {
  const creds = CREDS[role];
  if (!creds || !creds.email || !creds.password) {
    throw new Error(`Missing credentials for ${role}. Set TEST_${role.toUpperCase()}_EMAIL and TEST_${role.toUpperCase()}_PASSWORD.`);
  }

  const path = await getCurrentPath(driver);
  if (path === "/signin") {
    const captchaVisible = await isElementPresent(driver, ".recaptcha-container");
    if (captchaVisible) {
      throw new Error("Captcha is visible. Disable captcha for E2E or use a test key.");
    }

    await typeCss(driver, "input[type=\"email\"].field-input", creds.email);
    await typeCss(driver, "input[type=\"password\"].field-input", creds.password);
    await clickCss(driver, ".auth-actions .btn.primary");

    await driver.wait(async () => {
      const current = await getCurrentPath(driver);
      return current !== "/signin";
    }, DEFAULT_TIMEOUT);
  }
}

async function ensureUserSession(driver) {
  await openPath(driver, "/H");
  const path = await getCurrentPath(driver);
  if (path === "/signin") {
    await ensureSignedIn(driver, "user");
  }
}

async function ensureAdminSession(driver) {
  await openPath(driver, "/admin");
  const path = await getCurrentPath(driver);
  if (path === "/signin") {
    await ensureSignedIn(driver, "admin");
  }
}

async function sendKeysToBody(driver, keys) {
  const body = await waitForCss(driver, "body");
  await body.sendKeys(keys);
}

module.exports = {
  buildDriver,
  openPath,
  waitForCss,
  findAllCss,
  isElementPresent,
  clickCss,
  typeCss,
  getCurrentPath,
  assertPath,
  ensureUserSession,
  ensureAdminSession,
  sendKeysToBody,
  formatPassMessage,
  formatFailMessage,
  formatErrorMessage,
  Key,
};
