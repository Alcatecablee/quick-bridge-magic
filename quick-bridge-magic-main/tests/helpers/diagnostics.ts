import { Page } from '@playwright/test';

export interface Diagnostics {
  pageErrors: Error[];
  consoleErrors: string[];
  failedRequests: string[];
}

export function attachDiagnostics(page: Page): Diagnostics {
  const diag: Diagnostics = {
    pageErrors: [],
    consoleErrors: [],
    failedRequests: []
  };

  page.on('pageerror', error => {
    diag.pageErrors.push(error);
    console.error(`[Browser Page Error]: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      diag.consoleErrors.push(msg.text());
      console.error(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    // Ignore expected failures or tracking telemetry
    if (!url.includes('google-analytics') && !url.includes('clarity')) {
      const errorText = `${url} ${request.failure()?.errorText || 'Unknown'}`;
      diag.failedRequests.push(errorText);
      console.error(`[Browser Network Error]: ${errorText}`);
    }
  });

  return diag;
}

export function assertNoCriticalErrors(diag: Diagnostics, allowList: (string | RegExp)[] = []) {
  // Page errors are always critical
  if (diag.pageErrors.length > 0) {
    throw new Error(`Unexpected page errors: ${diag.pageErrors.map(e => e.message).join(', ')}`);
  }

  const globalAllowList = [
    /AudioContext was not allowed to start/,
    /An AudioContext was prevented from starting automatically/,
    /Blocked call to navigator\.vibrate/,
    /\/_vercel\/insights\/script\.js/,
    /Failed to load resource: the server responded with a status of 404/,
    /WebRTC: Using five or more STUN\/TURN servers slows down discovery/,
    /Cookie “__cf_bm” has been rejected for invalid domain/,
    /Cookie '__cf_bm' has been rejected for invalid domain/,
    /Error: tried to push 'presence' to 'realtime.*before joining/
  ];
  
  const combinedAllowList = [...globalAllowList, ...allowList];

  // Filter console errors against allow list
  const unexpectedConsole = diag.consoleErrors.filter(err => {
    for (const allowed of combinedAllowList) {
      if (typeof allowed === 'string' && err.includes(allowed)) return false;
      if (allowed instanceof RegExp && allowed.test(err)) return false;
    }
    return true; // Not in allow list
  });

  if (unexpectedConsole.length > 0) {
    throw new Error(`Unexpected console errors: ${unexpectedConsole.join(', ')}`);
  }

  // Failed requests (except allowed ones like missing favicons)
  const unexpectedRequests = diag.failedRequests.filter(req => {
    if (req.includes('favicon.ico')) return false;
    for (const allowed of combinedAllowList) {
      if (typeof allowed === 'string' && req.includes(allowed)) return false;
      if (allowed instanceof RegExp && allowed.test(req)) return false;
    }
    return true;
  });
  if (unexpectedRequests.length > 0) {
    throw new Error(`Unexpected failed network requests: ${unexpectedRequests.join(', ')}`);
  }
}
