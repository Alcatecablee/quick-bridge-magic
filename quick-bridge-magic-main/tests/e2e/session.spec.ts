import { test, expect } from '@playwright/test';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { setupDualSession, teardownAllSessions } from '../helpers/session';

test.describe('Gate 2: Session Integrity & Isolation', () => {
  test.afterEach(async () => { await teardownAllSessions(); });

  test('Presence sync: Sender and Receiver symbols match', async ({ browser, baseURL }) => {
    // We use the helper to create a session between two browsers
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL);
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Wait for the verification code on both sides
    const hostEmojiCode = hostPage.locator('[aria-label="Security verification code"]');
    const guestEmojiCode = guestPage.locator('[aria-label="Security verification code"]');

    await expect(hostEmojiCode).toBeVisible();
    await expect(guestEmojiCode).toBeVisible();

    const hostEmojiText = await hostEmojiCode.textContent();
    const guestEmojiText = await guestEmojiCode.textContent();

    expect(hostEmojiText).toBeTruthy();
    expect(hostEmojiText).toEqual(guestEmojiText);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /WebSocket connection/i, /Failed to load resource/i, /ERR_ABORTED/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /WebSocket connection/i, /Failed to load resource/i, /ERR_ABORTED/i]);
  });

  test('Session Isolation (Device C): Third device joining same session is rejected or isolated', async ({ browser, baseURL }) => {
    // Start a dual session
    const { hostPage, guestPage, sessionId, guestContext } = await setupDualSession(browser, baseURL);
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);
    
    // Now create a third device
    const deviceCContext = await browser.newContext();
    const deviceCPage = await deviceCContext.newPage();
    const deviceCDiag = attachDiagnostics(deviceCPage);

    // Device C attempts to join the exact same session URL
    await deviceCPage.goto(`${baseURL || 'http://localhost:4173'}/s/${sessionId}`);
    
    // WebRTC connections are strictly 1-to-1 in this design.
    // The implementation either creates a split-brain session (Device C enters an empty room)
    // or rejects it entirely. We assert that Device C does NOT interrupt Host/Guest.
    
    // Check that Host and Guest still see each other
    await expect(hostPage.locator('[aria-label="Security verification code"]')).toBeVisible();
    await expect(guestPage.locator('[aria-label="Security verification code"]')).toBeVisible();
    
    // Device C should NOT be in a "Direct" connection with anyone, or if they are, they shouldn't
    // share the same SAS badge as Host/Guest. Let's verify Device C does not disrupt the session.
    // Even if Device C connects, it should not affect the Host and Guest connection state.
    
    // Let's assert Device C doesn't show the exact same symbol (which is virtually impossible due to 
    // key mismatch, or because the host ignores the third connection).
    // Or we simply assert Device C stays in "Waiting for..." state or gets a PIN lookup failure.
    await expect(
      deviceCPage.locator('text="Waiting for the other device…"')
      .or(deviceCPage.locator('text="Waiting for the host…"'))
      .or(deviceCPage.locator('text="PIN lookup unavailable"'))
      .first()
    ).toBeVisible();

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i]);
    assertNoCriticalErrors(deviceCDiag, [/Missing Supabase/i, /WebSocket connection/i, /Failed to load resource/i, /ERR_ABORTED/i]);
  });

  test('Refresh grid: Sender refresh does not accidentally trigger success', async ({ browser, baseURL }) => {
    const { hostPage, guestPage, sessionId } = await setupDualSession(browser, baseURL);
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Initial state: Connected
    await expect(hostPage.locator('[aria-label="Security verification code"]')).toBeVisible();

    // Perform a refresh on the host page
    await hostPage.reload();

    // The session should either be completely reset/waiting, or reconnect.
    // What it MUST NEVER do is spontaneously jump to "Completed" or "Verified".
    
    // Ensure "Completed" or "Verified" or "Success" is NOT visible
    await expect(hostPage.locator('text="Completed"')).not.toBeVisible();
    await expect(hostPage.locator('text="Verified"')).not.toBeVisible();
    await expect(hostPage.locator('text="Success"')).not.toBeVisible();

    // The host should momentarily drop into "Waiting" or "Reconnecting" 
    // and then potentially recover.
    await expect(hostPage.locator('text="Waiting for the other device…"')
      .or(hostPage.locator('text="Waiting for the host…"'))
      .or(hostPage.locator('text="Reconnecting…"'))
      .or(hostPage.locator('[aria-label="Security verification code"]'))
      .first()
    ).toBeVisible({ timeout: 10000 });

    // Try a few more refreshes in rapid succession
    for (let i = 0; i < 3; i++) {
      await hostPage.reload();
      await expect(hostPage.locator('text="Completed"')).not.toBeVisible();
    }

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i]);
  });
});
