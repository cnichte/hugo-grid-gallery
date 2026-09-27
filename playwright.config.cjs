const path = require("node:path");
const { defineConfig } = require("@playwright/test");

const root = __dirname;
const themesDir = path.dirname(root);
const baseURL = "http://127.0.0.1:4174";

module.exports = defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}-{projectName}{ext}",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `hugo server --source exampleSite --themesDir "${themesDir}" --baseURL ${baseURL} --port 4174 --disableFastRender --disableLiveReload --noHTTPCache`,
    cwd: root,
    url: baseURL,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "desktop-light",
      use: { viewport: { width: 1280, height: 900 }, colorScheme: "light" },
    },
    {
      name: "desktop-dark",
      use: { viewport: { width: 1280, height: 900 }, colorScheme: "dark" },
    },
    {
      name: "mobile-light",
      use: { viewport: { width: 390, height: 844 }, colorScheme: "light" },
    },
    {
      name: "mobile-dark",
      use: { viewport: { width: 390, height: 844 }, colorScheme: "dark" },
    },
  ],
});
