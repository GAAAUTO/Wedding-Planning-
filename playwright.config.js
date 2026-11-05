import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.js', fullyParallel: false, workers: 1, timeout: 90000,
  use: { baseURL: process.env.PREVIEW_TEST_URL || 'http://localhost:4173', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] } },
  webServer: process.env.PREVIEW_TEST_URL ? undefined : { command: 'npm run preview -- --port 4173', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
