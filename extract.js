const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to Framer site...');
  await page.goto('https://humorous-triceratops-223716.framer.app/', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  // Wait a bit more for lazy images
  await new Promise(r => setTimeout(r, 3000));

  // Scroll through the page to trigger lazy loading
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  await new Promise(r => setTimeout(r, 2000));

  // Extract all content
  const content = await page.evaluate(() => {
    // Get all text content by section
    const sections = [];
    document.querySelectorAll('section, [data-framer-name], main > div, main > section').forEach(el => {
      const text = el.innerText?.trim();
      if (text) sections.push({ tag: el.tagName, class: el.className?.substring(0, 60), text: text.substring(0, 300) });
    });

    // Get ALL images
    const images = [];
    document.querySelectorAll('img').forEach(img => {
      if (img.src) images.push({ src: img.src, alt: img.alt, width: img.naturalWidth, height: img.naturalHeight });
    });

    // Get background images from computed styles
    const bgImages = [];
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url') && !bg.includes('data:') && bg.includes('framer')) {
        bgImages.push(bg);
      }
    });

    // Full page text
    const fullText = document.body.innerText;

    // Nav links
    const navLinks = Array.from(document.querySelectorAll('nav a, header a')).map(a => ({ text: a.innerText, href: a.href }));

    // All links
    const allLinks = Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText?.trim(), href: a.href }));

    return { sections, images, bgImages: [...new Set(bgImages)], fullText: fullText.substring(0, 5000), navLinks, allLinks };
  });

  console.log('=== NAV LINKS ===');
  console.log(JSON.stringify(content.navLinks, null, 2));

  console.log('\n=== IMAGES ===');
  content.images.forEach(img => console.log(`SRC: ${img.src} | ALT: ${img.alt} | ${img.width}x${img.height}`));

  console.log('\n=== BACKGROUND IMAGES ===');
  content.bgImages.forEach(bg => console.log(bg));

  console.log('\n=== FULL TEXT ===');
  console.log(content.fullText);

  console.log('\n=== ALL LINKS ===');
  content.allLinks.forEach(l => { if (l.text) console.log(`${l.text} -> ${l.href}`); });

  // Take a screenshot of the Framer site for reference
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.resolve(__dirname, 'refs/framer_reference.png'), fullPage: true });
  console.log('\nFramer screenshot saved to refs/framer_reference.png');

  await browser.close();
})();
