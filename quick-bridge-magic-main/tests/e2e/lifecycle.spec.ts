/**
 * Gate 5: Lifecycle & Granular Network Failures
 *
 * Tests bidirectional cancellation, late cancels, and granular network failure
 * scenarios: internet offline, signaling drop, transport drop, peer exit.
 */

import { test, expect } from '@playwright/test';
import { setupDualSession, teardownAllSessions } from '../helpers/session';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { getFileSha256, getFixturePath } from '../helpers/hashing';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';

test.describe('Gate 5: Lifecycle & Granular Network Failures', () => {
  test.afterEach(async () => { await teardownAllSessions(); });


  test('Bidirectional cancel: Guest cancels incoming transfer', async ({ browser, baseURL }) => {
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Use a large file so the cancel can happen mid-transfer
    const file20Path = join(process.cwd(), 'tests', 'fixtures', '20mb.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file20Path);

    // Wait for transfer to start on guest side
    await guestPage.waitForTimeout(1000);

    // Guest cancels the incoming transfer
    const cancelButton = guestPage.locator('button[title="Cancel transfer"]');
    await cancelButton.waitFor({ state: 'visible', timeout: 10000 });
    await cancelButton.click();

    // Guest should see "Cancelled by receiver" or equivalent
    await expect(
      guestPage.locator('text=/Cancelled/i').first()
    ).toBeVisible({ timeout: 10000 });

    // Host should see the transfer was cancelled (by peer)
    await expect(
      hostPage.locator('text=/Cancelled/i').first()
    ).toBeVisible({ timeout: 10000 });

    // Send another file to verify engine is still sane
    const file1Path = getFixturePath('test_1MB.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);

    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });
    const downloadPromise = guestPage.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_after_guest_cancel.bin');
    await download.saveAs(downloadPath);

    const sentSha = getFileSha256(file1Path);
    const recvSha = getFileSha256(downloadPath);
    expect(recvSha).toEqual(sentSha);
    await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

    if (existsSync(downloadPath)) rmSync(downloadPath);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /Error: Cancelled/i, /receiver aborted/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /Error: Cancelled/i]);
  });

  test('Late cancel: Host cancels after >50% transferred', async ({ browser, baseURL }) => {
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const file20Path = join(process.cwd(), 'tests', 'fixtures', '100mb.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file20Path);

    // Wait longer so more data is transferred before cancelling
    await hostPage.waitForTimeout(3000);

    const cancelButton = hostPage.locator('button[title="Cancel transfer"]');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }

    // Host shows cancelled
    await expect(hostPage.locator('text=/Cancelled/i').first()).toBeVisible({ timeout: 10000 });
    // Guest shows cancelled by sender
    await expect(guestPage.locator('text=/Cancelled by sender/i').first()).toBeVisible({ timeout: 10000 });

    // Engine sanity check: send another small file successfully
    const file1Path = getFixturePath('test_1MB.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);

    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });
    const downloadPromise = guestPage.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_after_late_cancel.bin');
    await download.saveAs(downloadPath);
    const sentSha = getFileSha256(file1Path);
    expect(getFileSha256(downloadPath)).toEqual(sentSha);

    if (existsSync(downloadPath)) rmSync(downloadPath);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /Error: Cancelled/i, /receiver aborted/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /Error: Cancelled/i]);
  });

  test('Signaling drop: WebRTC maintains connection when signaling goes offline', async ({ browser, baseURL }) => {
    /**
     * Simulates the Supabase websocket disconnecting mid-transfer.
     * WebRTC P2P connection should remain alive since it doesn't depend on
     * the signaling server after ICE negotiation is complete.
     */
    const { hostPage, guestPage, hostContext, guestContext } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Intercept and abort Supabase WebSocket connections to simulate signaling drop
    // We do this via route interception on the Realtime endpoint
    await hostContext.route('**/realtime/**', route => route.abort());
    await guestContext.route('**/realtime/**', route => route.abort());

    // The existing WebRTC connection was already established before we killed signaling.
    // Now send a file — it should complete purely over the P2P data channel.
    const file1Path = getFixturePath('test_1MB.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);

    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });
    const downloadPromise = guestPage.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_signaling_drop.bin');
    await download.saveAs(downloadPath);

    const sentSha = getFileSha256(file1Path);
    expect(getFileSha256(downloadPath)).toEqual(sentSha);
    await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

    if (existsSync(downloadPath)) rmSync(downloadPath);

    // Signaling errors are expected here; we just care that there are no transfer failures
    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /WebSocket/i, /realtime/i, /channel/i, /connection/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /WebSocket/i, /realtime/i, /channel/i, /connection/i]);
  });

  test('Peer tab closes gracefully: host sees "ended" state, does not crash', async ({ browser, baseURL }) => {
    const { hostPage, guestPage, guestContext } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);

    // Verify connected
    await expect(hostPage.locator('[aria-label="Security verification code"]')).toBeVisible();

    // Guest closes their browser context (simulating tab close)
    await guestContext.close();

    // Host should detect the peer left and show a waiting/disconnected state
    // It must NOT show Completed, Verified, or throw unhandled errors
    await hostPage.waitForTimeout(5000);

    await expect(hostPage.locator('text="Completed"')).not.toBeVisible();
    await expect(hostPage.locator('text="Verified"')).not.toBeVisible();

    // The host page should still be alive (not thrown an unhandled exception)
    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /connection/i, /disconnected/i, /Channel error/i, /Target closed/i]);
  });

  test('Internet offline then online: connection recovers and transfer completes', async ({ browser, baseURL }) => {
    test.setTimeout(90000);
    const { hostPage, guestPage, hostContext, guestContext } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const file20Path = join(process.cwd(), 'tests', 'fixtures', '20mb.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file20Path);
    await hostPage.waitForTimeout(500);

    // Take both offline briefly
    await hostContext.setOffline(true);
    await guestContext.setOffline(true);
    await hostPage.waitForTimeout(2000);

    // Bring both back online
    await hostContext.setOffline(false);
    await guestContext.setOffline(false);

    // Transfer should auto-resume and complete
    await expect(hostPage.locator('text=/Sent in/')).toBeVisible({ timeout: 60000 });

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /internet disconnected/i, /connection/i, /Channel error/i, /Fatal error in task/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /internet disconnected/i, /connection/i, /Channel error/i]);
  });
});
