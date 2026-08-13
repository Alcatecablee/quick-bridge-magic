import { Browser, Page, expect, BrowserContext } from '@playwright/test';

export interface DualSession {
  hostPage: Page;
  guestPage: Page;
  hostContext: BrowserContext;
  guestContext: BrowserContext;
  sessionId: string;
}

const activeContexts: BrowserContext[] = [];

export async function teardownAllSessions() {
  for (const ctx of activeContexts) {
    await ctx.close().catch(() => {});
  }
  activeContexts.length = 0;
}

export async function setupDualSession(browser: Browser, baseURL: string | undefined, options?: { disableFSA?: boolean }): Promise<DualSession> {
  const isChromium = browser.browserType().name() === 'chromium';
  const permissions = isChromium ? ['clipboard-read', 'clipboard-write'] : [];
  const hostContext = await browser.newContext({ permissions });
  const guestContext = await browser.newContext({ permissions });
  
  activeContexts.push(hostContext, guestContext);
  
  if (options?.disableFSA) {
    await hostContext.addInitScript(() => {
      (window as any).__QB_TEST_DISABLE_FSA = true;
    });
    await guestContext.addInitScript(() => {
      (window as any).__QB_TEST_DISABLE_FSA = true;
    });
  }
  
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const urlToVisit = baseURL || 'http://localhost:4173';
  // 1. Host creates session using the UI
  await hostPage.goto(`${urlToVisit}/`);
  
  hostPage.on('console', msg => console.log(`[HOST CONSOLE] ${msg.text()}`));
  guestPage.on('console', msg => console.log(`[GUEST CONSOLE] ${msg.text()}`));

  // Wait for the host page to initialize and generate a session ID
  await hostPage.waitForFunction(() => !!localStorage.getItem('qb:hostSessionId'));
  const actualSessionId = await hostPage.evaluate(() => localStorage.getItem('qb:hostSessionId'));

  if (!actualSessionId) {
    throw new Error('Host failed to generate a session ID');
  }
  
  // 2. Guest joins session
  await guestPage.goto(`${urlToVisit}/s/${actualSessionId}`);

  // Both should reach a state where they show the peer device.
  // Wait for the security verification code.
  await expect(hostPage.locator('[aria-label="Security verification code"]')).toBeVisible({ timeout: 20000 });
  await expect(guestPage.locator('[aria-label="Security verification code"]')).toBeVisible({ timeout: 20000 });

  // WebRTC Stabilization: Wait for initial strict-mode presence sync flurries to resolve 
  // before returning, which ensures the connection doesn't flap exactly as tests begin interacting.
  await hostPage.waitForTimeout(2000);

  return { hostPage, guestPage, hostContext, guestContext, sessionId: actualSessionId };
}
