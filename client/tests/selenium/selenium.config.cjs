const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const rootEnvPath = path.resolve(__dirname, "..", "..", "..", ".env");
const clientEnvPath = path.resolve(__dirname, "..", "..", ".env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

if (fs.existsSync(clientEnvPath)) {
  dotenv.config({ path: clientEnvPath });
}

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const BROWSER = process.env.SELENIUM_BROWSER || "chrome";

const CREDS = {
  user: {
    email: process.env.TEST_USER_EMAIL || "",
    password: process.env.TEST_USER_PASSWORD || "",
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || "",
    password: process.env.TEST_ADMIN_PASSWORD || "",
  },
};

module.exports = {
  BASE_URL,
  BROWSER,
  CREDS,
};
