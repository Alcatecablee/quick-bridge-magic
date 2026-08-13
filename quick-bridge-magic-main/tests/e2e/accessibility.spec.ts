import { test, expect } from '@playwright/test';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { setupDualSession, teardownAllSessions } from '../helpers/session';

test.describe('Gate 7: UI, UX, & Accessibility - Keyboard', () => {
  test.afterEach(async () => { await teardownAllSessions(); });


  test('Keyboard-only critical journey: host and guest can chat', async ({ browser, baseURL }) => {
    const { hostPage, guestPage, hostContext, guestContext } = await setupDualSession(browser, baseURL);
    
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Host uses keyboard to send a message
    // Fill the chat input and submit via keyboard Enter
    await hostPage.locator('input[placeholder="Send a message or URL…"]').fill('Keyboard test message');
    await hostPage.waitForTimeout(500);
    await hostPage.keyboard.press('Enter');

    // Verify guest receives message
    await expect(guestPage.locator('text="Keyboard test message"')).toBeVisible();

    // Guest uses keyboard to reply
    await guestPage.locator('input[placeholder="Send a message or URL…"]').fill('Reply via keyboard');
    await guestPage.waitForTimeout(500);
    await guestPage.keyboard.press('Enter');

    // Verify host receives reply
    await expect(hostPage.locator('text="Reply via keyboard"')).toBeVisible();

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);

    await hostContext.close();
    await guestContext.close();
  });
});

