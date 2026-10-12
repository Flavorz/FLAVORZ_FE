import { defineConfig } from '@playwright/test';

/**
 * E2E config. Tests run against the REAL static build — the same files that
 * would be uploaded to S3 — rather than a dev server.
 *
 * Astro 7's preview server is a managed background daemon: it detaches, so
 * the foreground process exits immediately. Playwright's `webServer` reads
 * that as the server dying and tears everything down. So the server is
 * started in globalSetup and stopped in globalTeardown instead.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: { baseURL: 'http://localhost:4321', trace: 'on-first-retry' },
});
