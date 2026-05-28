const { chromium } = require('playwright');
const URLS = {
    'sp-rosa': 'https://www.fecanbaloncesto.com/competicion/?id=1674&round=0',
    'sp-negro': 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0'
};
async function test() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    for (const teamId of ['sp-rosa', 'sp-negro']) {
        console.log(`\n--- TEAM: ${teamId} ---`);
        await page.goto(URLS[teamId], { waitUntil: 'networkidle' });
        const images = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src,
                class: img.className,
                parent: img.parentElement.className
            }));
            return imgs.slice(0, 50); // First 50 images
        });
        console.log(JSON.stringify(images, null, 2));
    }
    await browser.close();
}
test();
