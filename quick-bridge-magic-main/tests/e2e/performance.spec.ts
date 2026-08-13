import { test, expect } from '@playwright/test';
import { setupDualSession, teardownAllSessions } from '../helpers/session';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { getFileSha256 } from '../helpers/hashing';
import { join } from 'path';
import { existsSync, rmSync, writeFileSync } from 'fs';

test.describe('Gate 8: Performance', () => {
  test.afterEach(async () => { await teardownAllSessions(); });


  test('100MB stress tracking: Large file transfers reliably without memory crash', async ({ browser, baseURL }) => {
    test.setTimeout(120000); // Allow 2 minutes for 100MB transfer

    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Create a 100MB file filled with random data (or just zeroes to be fast)
    // We use a pseudo-random pattern so it's not highly compressible by underlying network layers
    const fileSize = 100 * 1024 * 1024;
    const buffer = Buffer.alloc(fileSize);
    for (let i = 0; i < fileSize; i += 1024) {
      buffer.writeUInt32LE(Math.random() * 0xFFFFFFFF, i);
    }
    const file100Path = join(process.cwd(), 'tests', 'fixtures', '100mb_stress.bin');
    writeFileSync(file100Path, buffer);

    try {
      await hostPage.locator('input[type="file"]').setInputFiles(file100Path);

      // Wait for the download button to appear on the guest side
      const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
      await expect(downloadButton).toBeVisible({ timeout: 120000 });

      const downloadPromise = guestPage.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;

      const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_100mb.bin');
      await download.saveAs(downloadPath);

      const sentSha = getFileSha256(file100Path);
      const recvSha = getFileSha256(downloadPath);
      expect(recvSha).toEqual(sentSha);

      await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

      if (existsSync(downloadPath)) rmSync(downloadPath);
    } finally {
      if (existsSync(file100Path)) rmSync(file100Path);
    }

    // No unhandled promise rejections or out-of-memory errors
    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });
});
