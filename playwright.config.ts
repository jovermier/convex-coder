import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/e2e/**/*.spec.ts", "**/game-*.spec.ts", "**/debug-*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [
      "html",
      {
        open: process.env.CI ? "never" : "on-failure",
        outputFolder: "playwright-report",
      },
    ],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["line"], // Better console output
    ...(process.env.CI ? [["github"] as const] : []), // GitHub Actions integration
  ],
  use: {
    baseURL: "http://localhost:5173",
    // Enhanced trace settings - capture more debugging info
    trace: process.env.CI ? "on-first-retry" : "on", // Always on locally, on-retry in CI
    // Enhanced screenshot settings
    screenshot: {
      mode: process.env.CI ? "only-on-failure" : "on", // More screenshots locally
      fullPage: true, // Capture full page instead of just viewport
    },
    // Enhanced video settings
    video: {
      mode: process.env.CI ? "retain-on-failure" : "on", // Always record locally
      size: { width: 1280, height: 720 }, // Standard HD resolution
    },
    // Additional debugging options
    actionTimeout: 2000, // 2 second timeout for actions
    navigationTimeout: 10000, // 10 second timeout for navigation
    // Context options for better testing
    viewport: { width: 1280, height: 720 }, // Consistent viewport
    ignoreHTTPSErrors: true, // Ignore SSL errors in development
    // Performance and reliability
    launchOptions: {
      slowMo: process.env.CI ? 0 : 100, // Slow down actions locally for debugging
    },
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Enhanced Chrome settings
        launchOptions: {
          args: [
            "--disable-web-security", // For local development testing
            "--disable-features=VizDisplayCompositor",
            "--disable-dev-shm-usage", // Overcome limited resource problems
          ],
        },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        // Enhanced Firefox settings
        launchOptions: {
          firefoxUserPrefs: {
            "media.navigator.streams.fake": true, // Allow fake media streams
          },
        },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        // Enhanced Safari settings
      },
    },
    // Mobile testing configurations
    ...(process.env.INCLUDE_MOBILE
      ? [
          {
            name: "mobile-chrome",
            use: { ...devices["Pixel 5"] },
          },
          {
            name: "mobile-safari",
            use: { ...devices["iPhone 12"] },
          },
        ]
      : []),
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
