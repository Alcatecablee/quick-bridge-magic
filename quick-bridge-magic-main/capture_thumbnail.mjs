import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:5000/video');
  await page.waitForTimeout(1600);
  await page.screenshot({
    path: path.resolve('public/og-video.png'),
    type: 'png',
  });
  await browser.close();
  console.log('Thumbnail saved to public/og-video.png');
})();
