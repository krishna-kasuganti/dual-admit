const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://humorous-triceratops-223716.framer.app/', {
    waitUntil: 'networkidle0', timeout: 60000
  });
  await new Promise(r => setTimeout(r, 3000));

  // Scroll to load all content
  await page.evaluate(async () => {
    for (let i = 0; i < 20; i++) {
      window.scrollBy(0, 600);
      await new Promise(r => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 2000));

  // Extract testimonials: find text nodes near images
  const testimonials = await page.evaluate(() => {
    const results = [];
    // Look for elements containing testimonial names
    const names = ['Panshul', 'Tianxi', 'Dylan', 'Aarush', 'Ibrahim', 'Shaurya'];

    names.forEach(name => {
      // Find all elements that contain this name
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes(name)) {
          // Go up to a reasonable parent and find nearest image
          let el = node.parentElement;
          for (let i = 0; i < 10; i++) {
            if (!el) break;
            const img = el.querySelector('img');
            if (img) {
              results.push({ name, img: img.src, naturalW: img.naturalWidth, naturalH: img.naturalHeight });
              break;
            }
            el = el.parentElement;
          }
          break; // only first occurrence
        }
      }
    });
    return results;
  });

  console.log('=== TESTIMONIAL NAME→IMAGE MAPPING ===');
  testimonials.forEach(t => console.log(`${t.name}: ${t.img} (${t.naturalW}x${t.naturalH})`));

  // Screenshot the testimonials section
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('*'));
    const el = headings.find(e => e.textContent?.includes('Successful Students') || e.textContent?.includes('Sucessful Students'));
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'framer_testimonials.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // Also screenshot the hero to identify main photos
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'framer_hero.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });

  // Get hero images specifically
  const heroImages = await page.evaluate(() => {
    const images = [];
    document.querySelectorAll('img').forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top < 700 && rect.width > 50) {
        images.push({ src: img.src, top: Math.round(rect.top), left: Math.round(rect.left), w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    return images;
  });
  console.log('\n=== HERO IMAGES (visible in first viewport) ===');
  heroImages.forEach(i => console.log(`top:${i.top} left:${i.left} size:${i.w}x${i.h} → ${i.src}`));

  await browser.close();
})();
