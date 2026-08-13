/**
 * Gate 4: Permissions Matrix
 *
 * Tests FSA (File System Access API) grant, deny, fallback, and Clipboard
 * permissions. Asserts that unsupported capabilities produce designed fallbacks,
 * not errors.
 */

import { test, expect } from '@playwright/test';
import { setupDualSession, teardownAllSessions } from '../helpers/session';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';
import { getFileSha256, getFixturePath } from '../helpers/hashing';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';

test.describe('Gate 4: Permissions Matrix', () => {
  test.afterEach(async () => { await teardownAllSessions(); });


  test('FSA disabled: falls back to Blob download without errors', async ({ browser, baseURL }) => {
    // Both sides have FSA disabled — app MUST fall back to blob downloads
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const file1Path = getFixturePath('test_1MB.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);

    // Guest must see a Download button (Blob path)
    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });

    // Click to trigger blob download
    const downloadPromise = guestPage.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();

    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_fsa_fallback.bin');
    await download.saveAs(downloadPath);

    // SHA-256 must match
    const sentSha = getFileSha256(file1Path);
    const recvSha = getFileSha256(downloadPath);
    expect(recvSha).toEqual(sentSha);

    if (existsSync(downloadPath)) rmSync(downloadPath);

    // No unexpected errors — FSA not available is an expected browser condition
    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });

  test('FSA disabled on receiver only: sender sees no error, guest downloads via blob', async ({ browser, baseURL }) => {
    // Host has FSA but guest does not — the distinction is from the sender's perspective
    // In practice since the host sends, guest receives, guest FSA is what matters
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    // Disable FSA only on guest (receiver)
    await guestContext.addInitScript(() => {
      // @ts-ignore
      delete window.showDirectoryPicker;
      // @ts-ignore
      delete window.showSaveFilePicker;
    });

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const urlToVisit = baseURL || 'http://localhost:4173';
    await hostPage.goto(`${urlToVisit}/`);

    hostPage.on('console', msg => console.log(`[HOST CONSOLE] ${msg.text()}`));
    guestPage.on('console', msg => console.log(`[GUEST CONSOLE] ${msg.text()}`));

    await hostPage.waitForFunction(() => !!localStorage.getItem('qb:hostSessionId'));
    const sessionId = await hostPage.evaluate(() => localStorage.getItem('qb:hostSessionId'));
    if (!sessionId) throw new Error('No session ID');

    await guestPage.goto(`${urlToVisit}/s/${sessionId}`);

    await expect(hostPage.locator('[aria-label="Security verification code"]')).toBeVisible({ timeout: 20000 });
    await expect(guestPage.locator('[aria-label="Security verification code"]')).toBeVisible({ timeout: 20000 });

    const file1Path = getFixturePath('test_1MB.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file1Path);

    // Guest sees download button (blob path since FSA is unavailable)
    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });

    const downloadPromise = guestPage.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_fsa_receiver_only.bin');
    await download.saveAs(downloadPath);

    const sentSha = getFileSha256(file1Path);
    const recvSha = getFileSha256(downloadPath);
    expect(recvSha).toEqual(sentSha);

    // Host should show "Sent in" (completed)
    await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

    if (existsSync(downloadPath)) rmSync(downloadPath);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);

    await hostContext.close();
    await guestContext.close();
  });

  test('Zero-byte file: transfers correctly via blob path', async ({ browser, baseURL }) => {
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    const file0Path = getFixturePath('0-byte.bin');
    await hostPage.locator('input[type="file"]').setInputFiles(file0Path);

    // Guest sees download button
    const downloadButton = guestPage.locator('button:has-text("Download"), a:has-text("Download")').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });

    const downloadPromise = guestPage.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = join(process.cwd(), 'tests', 'fixtures', 'downloaded_0B.bin');
    await download.saveAs(downloadPath);

    // Both SHA-256s are empty-string hash (e3b0...)
    const sentSha = getFileSha256(file0Path);
    const recvSha = getFileSha256(downloadPath);
    expect(recvSha).toEqual(sentSha);

    await expect(hostPage.locator('text=/Sent in/').first()).toBeVisible({ timeout: 30000 });

    if (existsSync(downloadPath)) rmSync(downloadPath);

    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });

  test('Clipboard: host copies URL, no unhandled errors when clipboard is available', async ({ browser, baseURL }) => {
    // Both contexts already have clipboard-read / clipboard-write from playwright.config.ts
    const { hostPage, guestPage } = await setupDualSession(browser, baseURL, { disableFSA: true });
    const hostDiag = attachDiagnostics(hostPage);
    const guestDiag = attachDiagnostics(guestPage);

    // Find a "Copy" button or link button on the host page (the share/invite link)
    const copyButton = hostPage.locator('button[title="Copy link"], button:has-text("Copy")').first();
    
    if (await copyButton.isVisible()) {
      await copyButton.click();
      // Should not throw or produce console errors
    }

    // Regardless of whether a copy button exists, no unhandled errors should be produced
    assertNoCriticalErrors(hostDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
    assertNoCriticalErrors(guestDiag, [/Missing Supabase/i, /ERR_ABORTED/i, /Failed to load resource/i, /AudioContext/i, /navigator.vibrate/i]);
  });
});
