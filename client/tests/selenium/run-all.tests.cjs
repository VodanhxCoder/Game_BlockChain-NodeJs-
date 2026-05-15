const { spawnSync } = require("child_process");
const path = require("path");

const scripts = [
  "auth.tests.cjs",
  "homepage.tests.cjs",
  "admin-dashboard.tests.cjs",
];

let failures = 0;

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    failures += 1;
    console.error(`Failed to run ${script}: ${result.error.message}`);
    continue;
  }

  if (result.status !== 0) {
    failures += 1;
  }
}

process.exitCode = failures > 0 ? 1 : 0;
