import { defineConfig } from "@playwright/test";

const PORTAL_BASE_URL =
  process.env.E2E_PORTAL_URL ?? "http://localhost:80";
const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: PORTAL_BASE_URL,
    extraHTTPHeaders: {
      Accept: "application/json",
    },
  },
  projects: [
    {
      name: "api",
      testMatch: /api\..*\.spec\.ts$/,
      use: { baseURL: API_BASE_URL },
    },
    {
      name: "ui",
      testMatch: /ui\..*\.spec\.ts$/,
      use: {
        launchOptions: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? { executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE }
          : undefined,
      },
    },
  ],
});
