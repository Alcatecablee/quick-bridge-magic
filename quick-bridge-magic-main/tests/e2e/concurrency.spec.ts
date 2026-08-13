import { test, expect } from '@playwright/test';
import { setupDualSession, teardownAllSessions } from '../helpers/session';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { getFileSha256, getFixturePath } from '../helpers/hashing';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';

test.describe('Gate 3: Concurrency', () => {
  test.afterEach(async () => { await teardownAllSessions(); });


  test('Simultaneous Bidirectional transfer: Host and Guest send to each other simultaneously', async ({ browser, baseURL }) => {
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const hostFile = getFixturePath('test_1MB.bin');
    const guestFile = getFixturePath('test_1MB.bin'); // We can reuse the same file

    // Both initiate sends at roughly the same time
    await Promise.all([
      hostPage.locator('input[type="file"]').setInputFiles(hostFile),
      guestPage.locator('input[type="file"]').setInputFiles(guestFile)
    ]);

    // Both should see download buttons
    const hostDownloadButton = hostPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    const guestDownloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();

    await expect(hostDownloadButton).toBeVisible({ timeout: 30000 });
    await expect(guestDownloadButton).toBeVisible({ timeout: 30000 });

    const hostDownloadPromise = hostPage.waitForEvent('download');
    const guestDownloadPromise = guestPage.waitForEvent('download');

    await hostDownloadButton.click();
    await guestDownloadButton.click();

    const hostDownload = await hostDownloadPromise;
    const guestDownload = await guestDownloadPromise;

    const hostDownloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_bi_host.bin');
    const guestDownloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_bi_guest.bin');

    await hostDownload.saveAs(hostDownloadPath);
    await guestDownload.saveAs(guestDownloadPath);

    const sentSha = getFileSha256(hostFile);
    expect(getFileSha256(hostDownloadPath)).toEqual(sentSha);
    expect(getFileSha256(guestDownloadPath)).toEqual(sentSha);

    if (existsSync(hostDownloadPath)) rmSync(hostDownloadPath);
    if (existsSync(guestDownloadPath)) rmSync(guestDownloadPath);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });

  test('Multi-file queue: Sending multiple files rapidly', async ({ browser, baseURL }) => {
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const file1 = getFixturePath('0-byte.bin');
    const file2 = getFixturePath('1kb.bin');
    const file3 = getFixturePath('test_1MB.bin');

    // Send three files in rapid succession
    const fileInput = hostPage.locator('input[type="file"]');
    await fileInput.setInputFiles(file1);
    await fileInput.setInputFiles(file2);
    await fileInput.setInputFiles(file3);

    // Guest should eventually see three download buttons
    const downloadButtons = guestPage.locator('button:has-text("Download"), a:has-text("Download")');
    await expect(downloadButtons).toHaveCount(3, { timeout: 30000 });

    // Host should see three "Sent in" texts eventually
    const sentTexts = hostPage.locator('text=/Sent in/');
    await expect(sentTexts).toHaveCount(3, { timeout: 30000 });

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });
});
