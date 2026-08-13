import { test, expect } from '@playwright/test';
import { setupDualSession, teardownAllSessions } from '../helpers/session';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { getFileSha256, getFixturePath } from '../helpers/hashing';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

test.describe('Gate 3: Critical Journey A', () => {
  test.afterEach(async () => { await teardownAllSessions(); });

  let file1Path: string;
  
  test.beforeAll(() => {
    file1Path = getFixturePath('test_1MB.bin');
  });

  test('Standard E2E Transfer', async ({ browser, baseURL }) => {
    // 1. Create -> Join -> Connect -> Verify Symbols
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Wait for symbols to appear
    const hostEmoji = hostPage.locator('[aria-label="Security verification code"]').first();
    const guestEmoji = guestPage.locator('[aria-label="Security verification code"]').first();
    await expect(hostEmoji).toBeVisible();
    await expect(guestEmoji).toBeVisible();
    expect(await hostEmoji.textContent()).toEqual(await guestEmoji.textContent());

    // 2. Messaging
    await hostPage.fill('input[placeholder="Send a message or URL…"]', 'Hello from host!');
    await hostPage.click('button[title="Send message"]');
    
    // Verify Guest received it
    await expect(guestPage.locator('text="Hello from host!"')).toBeVisible();

    await guestPage.fill('input[placeholder="Send a message or URL…"]', 'Hello from guest!');
    await guestPage.click('button[title="Send message"]');
    
    // Verify Host received it
    await expect(hostPage.locator('text="Hello from guest!"')).toBeVisible();

    // 3. Send File (Host -> Guest)
    // Click the attach button and set the input file. 
    // In this app, setting the input file immediately queues and starts the transfer.
    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);

    // 4. Receive -> Write -> Verify SHA-256 -> Completed
    // Wait for the download button to appear on the guest side
    const downloadPromise = guestPage.waitForEvent('download');
    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 60000 });
    await downloadButton.click();
    
    const download = await downloadPromise;
    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_1MB.bin');
    await download.saveAs(downloadPath);

    // Verify SHA-256
    const sentSha256 = getFileSha256(file1Path);
    const receivedSha256 = getFileSha256(downloadPath);
    expect(receivedSha256).toEqual(sentSha256);

    // Wait for completed state on Host
    await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible();

    // 5. Send 2nd File (Guest -> Host)
    await guestPage.locator('input[type="file"]').setInputFiles(file1Path);

    const hostDownloadPromise = hostPage.waitForEvent('download');
    const hostDownloadButton = hostPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(hostDownloadButton).toBeVisible({ timeout: 60000 });
    await hostDownloadButton.click();

    const hostDownload = await hostDownloadPromise;
    const hostDownloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_host_1MB.bin');
    await hostDownload.saveAs(hostDownloadPath);

    expect(getFileSha256(hostDownloadPath)).toEqual(sentSha256);

    // 6. Clean
    if (existsSync(downloadPath)) rmSync(downloadPath);
    if (existsSync(hostDownloadPath)) rmSync(hostDownloadPath);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });

  test('Journey C: Cancellation Recovery', async ({ browser, baseURL }) => {
    // 1. Setup
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const file20Path = join(process.cwd(), 'tests', 'fixtures', '100mb.bin');
    
    // 2. Host sends a file
    await hostPage.locator('input[type="file"]').setInputFiles(file20Path);
    
    // 3. Immediately cancel on Host
    const cancelButton = hostPage.locator('button[title="Cancel transfer"]');
    await cancelButton.waitFor({ state: 'visible', timeout: 5000 });
    await cancelButton.click();
    
    // Verify Host sees cancelled
    await expect(hostPage.locator('text=/Cancelled/i').first()).toBeVisible();
    
    // Verify Guest sees cancelled
    await expect(guestPage.locator('text=/Cancelled by sender/i').first()).toBeVisible();
    
    // 4. Send a second file to verify engine is still sane
    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);
    
    // Wait for the download button to appear on the guest side
    const downloadPromise = guestPage.waitForEvent('download');
    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 60000 });
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_c_1MB.bin');
    await download.saveAs(downloadPath);

    // Verify SHA-256
    const sentSha256 = getFileSha256(file1Path);
    const receivedSha256 = getFileSha256(downloadPath);
    expect(receivedSha256).toEqual(sentSha256);

    // Wait for completed state on Host
    await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible();

    if (existsSync(downloadPath)) rmSync(downloadPath);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /Error: Cancelled/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /Error: Cancelled/i]);
  });

  test('Journey B: Failure Recovery', async ({ browser, baseURL }) => {
    test.setTimeout(90000); // Allow extra time for WebRTC disconnection timeouts
    const { hostPage, guestPage, hostContext, guestContext } = await setupDualSession(browser, baseURL, { disableFSA: true });
    
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const file20Path = join(process.cwd(), 'tests', 'fixtures', '20mb.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file20Path);

    // Give it a moment to start transferring (20ms is too short for ICE connection)
    await hostPage.waitForTimeout(1000);

    // Disable network for guest to interrupt WebRTC signaling and ICE
    await guestContext.setOffline(true);
    await hostPage.waitForTimeout(1000); 

    // Re-enable network
    await guestContext.setOffline(false);
    
    // Monkey-patch RTCDataChannel.send to drop 'session-ended' messages during unload
    // This perfectly simulates an abrupt disconnect (crash or hard network drop)
    await guestPage.evaluate(() => {
      const originalSend = RTCDataChannel.prototype.send;
      RTCDataChannel.prototype.send = function(data: string | Blob | ArrayBuffer | ArrayBufferView) {
        if (typeof data === 'string' && data.includes('session-ended')) return;
        return originalSend.call(this, data);
      };
      
      const origWsSend = WebSocket.prototype.send;
      WebSocket.prototype.send = function(data: string | ArrayBuffer | Blob | ArrayBufferView) {
        if (typeof data === 'string' && data.includes('session-ended')) return;
        return origWsSend.call(this, data);
      };
    });

    // Wait for the guest to fully realize it's disconnected and begin reconnecting
    await guestPage.waitForTimeout(1000);
    await expect(guestPage.locator('input[type="file"]')).toBeAttached({ timeout: 15000 });
    await guestPage.waitForTimeout(500); // Give WebRTC a moment to stabilize

    // We don't click the retry button manually because the app has an auto-resume feature
    // that should kick in 750ms after the connection is re-established.
    
    // Expect it to auto resume and complete
    await expect(hostPage.locator('text=/Sent in/')).toBeVisible({ timeout: 60000 });

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /internet disconnected/i, /connection/i]);
    // Guest page might have more network errors because it was offline
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i, /internet disconnected/i, /connection/i, /Target closed/i]);
  });
});
