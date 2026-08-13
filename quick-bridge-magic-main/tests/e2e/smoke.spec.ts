import { test, expect } from '@playwright/test';
import { attachDiagnostics, assertNoCriticalErrors } from '../helpers/diagnostics';

test.describe('Gate 1: Product Smoke', () => {
  test('Landing page loads and renders branding', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.goto('/');

    await expect(page).toHaveTitle(/QuickBridge/i);
    const content = await page.content();
    try {
      await expect(page).toHaveTitle(/QuickBridge/i);
      // Check for the logo image
      await expect(page.getByAltText('QuickBridge').first()).toBeVisible();
    } finally {
      assertNoCriticalErrors(diag, [
        /Missing Supabase/i,
        /WebSocket connection/i,
        /Failed to load resource/i,
        /ERR_ABORTED/i
      ]);
    }
  });

  test('Invalid session input handles gracefully', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.goto('/');


    // QuickBridge generates a session dynamically. We just check if it recovers or shows an error.
    await page.goto('/?s=');
    
    try {
      // It should render the page without crashing
      await expect(page.getByAltText('QuickBridge').first()).toBeVisible();
    } finally {
      assertNoCriticalErrors(diag, [
        /Missing Supabase/i,
        /WebSocket connection/i,
        /Failed to load resource/i,
        /ERR_ABORTED/i
      ]);
    }
  });

  test('Session generation works automatically', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.goto('/');

    try {
      // Session is generated on load. Wait for the URL to contain a valid session hash if applicable,
      // or wait for the QR code to render.
      // The canvas is the QR code.
      await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 }); 
      
      // Check for the "Join with PIN" link to confirm the page rendered completely
      await expect(page.locator('a', { hasText: 'Join with PIN' }).first()).toBeVisible();
    } finally {
      assertNoCriticalErrors(diag, [
        /Missing Supabase/i,
        /WebSocket connection/i,
        /Failed to load resource/i,
        /ERR_ABORTED/i
      ]);
    }
  });
});
