import { test, expect } from '@playwright/test';
import { setupDualSession, teardownAllSessions } from '../helpers/session';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { getFixturePath } from '../helpers/hashing';

test.describe('Gate 7: UI, UX, & Accessibility - Responsive', () => {
  test.afterEach(async () => { await teardownAllSessions(); });

  // Setup a common viewport for mobile testing
  const mobileViewport = { width: 375, height: 667 }; // iPhone SE/8 dimensions

  test('Session UI is usable on mobile portrait', async ({ browser, baseURL }) => {
    const hostContext = await browser.newContext({ viewport: mobileViewport });
    const guestContext = await browser.newContext({ viewport: mobileViewport });
    await hostContext.addInitScript(() => {
      (window as any).__QB_TEST_DISABLE_FSA = true;
    });
    await guestContext.addInitScript(() => {
      (window as any).__QB_TEST_DISABLE_FSA = true;
    });

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const urlToVisit = baseURL || 'http://localhost:4173';
    await hostPage.goto(`${urlToVisit}/`);

    hostPage.on('console', msg => console.log(`[HOST CONSOLE] ${msg.text()}`));
    guestPage.on('console', msg => console.log(`[GUEST CONSOLE] ${msg.text()}`));

    await hostPage.waitForFunction(() => !!localStorage.getItem('qb:hostSessionId'));
    const sessionId = await hostPage.evaluate(() => localStorage.getItem('qb:hostSessionId'));

    await guestPage.goto(`${urlToVisit}/s/${sessionId}`);

    // Wait for connection
    await expect(hostPage.locator('[aria-label="Security verification code"]')).toBeVisible({ timeout: 20000 });
    
    // Verify key UI elements are visible and within viewport
    const sendButton = hostPage.locator('input[type="file"]');
    await expect(sendButton).toBeAttached();

    // Verify chat input is accessible
    const chatInput = hostPage.locator('input[placeholder="Send a message or URL…"]');
    await expect(chatInput).toBeVisible();

    // Transfer a small file to ensure the transfer UI works on mobile
    const file1Path = getFixturePath('test_1MB.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);

    // Wait for the transfer to show progress and complete
    await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });

    await hostContext.close();
    await guestContext.close();
  });
});
