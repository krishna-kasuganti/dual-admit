const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`file://${path.resolve(__dirname, 'index.html')}`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.resolve(__dirname, 'refs/screenshot_hero.png'), clip: { x: 0, y: 0, width: 1440, height: 620 } });
  await browser.close();
  console.log('done');
})();
