const { chromium } = require('playwright');

async function checkLogos() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const url = 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0';

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Scroll a bit
    await page.evaluate(async () => {
        window.scrollBy(0, 1000);
        await new Promise(r => setTimeout(r, 2000));
    });

    const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            className: img.className,
            parent: img.parentElement.className
        }));
    });

    console.log(`Found ${images.length} images.`);
    images.slice(0, 50).forEach((img, i) => {
        console.log(`[${i}] SRC: ${img.src} | CLASS: ${img.className} | PARENT: ${img.parent}`);
    });

    await browser.close();
}

checkLogos();
