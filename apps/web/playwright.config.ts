import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test/visual",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3200", trace: "retain-on-failure" },
  projects: [
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "desktop-1920", use: { ...devices["Desktop Chrome HiDPI"], viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: { command: "pnpm dev --hostname 127.0.0.1 --port 3200", url: "http://127.0.0.1:3200/it-asset", reuseExistingServer: true, timeout: 120_000 },
});
