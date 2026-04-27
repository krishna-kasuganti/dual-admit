const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const filePath = path.resolve(__dirname, 'index.html');
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: path.resolve(__dirname, 'screenshot.png'), fullPage: true });
  await browser.close();
  console.log('Screenshot saved.');
})();
