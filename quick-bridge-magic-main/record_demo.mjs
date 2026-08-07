import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const videoDir = path.resolve('demo-video-output');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir);
}

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();
  console.log("Navigating to http://localhost:5000/video...");
  await page.goto('http://localhost:5000/video');

  console.log("Waiting for animations to complete (80 seconds)...");
  // 12 scenes, adding extra seconds just in case
  await page.waitForTimeout(80000);

  console.log("Closing context to save video...");
  await context.close();
  await browser.close();
  
  console.log(`Video has been successfully saved in the '${videoDir}' directory.`);
})();
