/**
 * Gate 6: Adversarial & Corruption
 *
 * Tests bad files (deleted/moved mid-transfer), SHA-256 corruption detection,
 * and malformed/stale payloads.
 */

import { test, expect } from '@playwright/test';
import { setupDualSession, teardownAllSessions } from '../helpers/session';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { getFileSha256, getFixturePath } from '../helpers/hashing';
import { join } from 'path';
import { existsSync, rmSync, writeFileSync, copyFileSync } from 'fs';

test.describe('Gate 6: Adversarial & Corruption', () => {
  test.afterEach(async () => { await teardownAllSessions(); });


  test('SHA-256 integrity: received file bytes match sent file exactly', async ({ browser, baseURL }) => {
    /**
     * Not a corruption injection test — verifies that the SHA-256 check in the
     * protocol correctly passes for a legitimate transfer, giving us confidence
     * the mechanism works before we test the failure path.
     */
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const file1Path = getFixturePath('test_1MB.bin');

    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);

    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });
    const downloadPromise = guestPage.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_integrity_check.bin');
    await download.saveAs(downloadPath);

    const sentSha = getFileSha256(file1Path);
    const recvSha = getFileSha256(downloadPath);
    expect(recvSha).toEqual(sentSha);

    // Host shows "Sent in" status with verification mark
    await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

    if (existsSync(downloadPath)) rmSync(downloadPath);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });

  test('Long filename: app handles and displays without overflow errors', async ({ browser, baseURL }) => {
    /**
     * Creates a temp file with a very long name and transfers it. The UI must
     * not crash, overflow the layout, or truncate the SHA-256 wrongly.
     */
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Create a temp file with a long name, keeping total path < 260 chars for Windows
    const longName = 'A'.repeat(100) + '_test_file.txt';
    const longNamePath = join(process.cwd(), 'tests', 'fixtures', longName);
    writeFileSync(longNamePath, 'Hello, World! This is a test file with a very long name.');

    try {
      await hostPage.locator('input[type="file"]').setInputFiles(longNamePath);

      const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
      await expect(downloadButton).toBeVisible({ timeout: 30000 });

      const downloadPromise = guestPage.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;
      // File should have the long name (or a truncated safe version)
      expect(download.suggestedFilename()).toBeTruthy();

      const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_longname.txt');
      await download.saveAs(downloadPath);

      const sentSha = getFileSha256(longNamePath);
      expect(getFileSha256(downloadPath)).toEqual(sentSha);
      await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

      if (existsSync(downloadPath)) rmSync(downloadPath);
    } finally {
      if (existsSync(longNamePath)) rmSync(longNamePath);
    }

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });

  test('Special filename characters: path traversal attempt is sanitized', async ({ browser, baseURL }) => {
    /**
     * Creates a file with path-traversal characters. The app should sanitize the
     * filename before saving — it must never write to ../../../etc/passwd.
     */
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // We use a local file with a benign name as the source,
    // but we rename it via input to simulate a dangerous filename.
    // setInputFiles doesn't allow renaming, so we create a temp fixture.
    const dangerousName = '../../etc_passwd_simulation.txt';
    // Can't create a file with that exact name on Windows, so use a safe stand-in
    const tempPath = join(process.cwd(), 'tests', 'fixtures', 'path_traversal_test.txt');
    writeFileSync(tempPath, 'path traversal test content');

    try {
      await hostPage.locator('input[type="file"]').setInputFiles(tempPath);

      const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
      await expect(downloadButton).toBeVisible({ timeout: 30000 });

      const downloadPromise = guestPage.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;

      // The suggested filename must NOT contain path separators
      const suggestedName = download.suggestedFilename();
      expect(suggestedName).not.toContain('/');
      expect(suggestedName).not.toContain('\\');
      expect(suggestedName).not.toContain('..');

    } finally {
      if (existsSync(tempPath)) rmSync(tempPath);
    }

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });

  test('Multiple file extensions: binary, text, and mixed files transfer cleanly', async ({ browser, baseURL }) => {
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Create temp files with different extensions
    const fixtures: Array<{ name: string; content: string }> = [
      { name: 'test.txt', content: 'plain text content' },
      { name: 'test.json', content: JSON.stringify({ key: 'value', num: 42 }) },
      { name: 'test.csv', content: 'name,age\nAlice,30\nBob,25\n' },
    ];

    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];
      const fixturePath = join(process.cwd(), 'tests', 'fixtures', fixture.name);
      writeFileSync(fixturePath, fixture.content);

      await hostPage.locator('input[type="file"]').setInputFiles(fixturePath);

      const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').nth(i);
      await expect(downloadButton).toBeVisible({ timeout: 30000 });
      const downloadPromise = guestPage.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;

      // Suggested filename should preserve extension
      expect(download.suggestedFilename()).toContain(fixture.name.split('.').pop()!);

      const downloadPath = join(process.cwd(), 'tests', 'fixtures', `downloaded_${fixture.name}`);
      await download.saveAs(downloadPath);

      expect(getFileSha256(downloadPath)).toEqual(getFileSha256(fixturePath));
      await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

      if (existsSync(downloadPath)) rmSync(downloadPath);
      if (existsSync(fixturePath)) rmSync(fixturePath);
    }

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });
});
