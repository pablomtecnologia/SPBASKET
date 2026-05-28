const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set a real user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const url = 'https://www.fecanbaloncesto.com/equipo/?id=4046';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('Waiting for widget to load...');
    // Wait for something that looks like content. 
    // Based on owbasket.js, maybe .owbasket-root or .match-row
    try {
        await page.waitForSelector('.owbasket-root', { timeout: 10000 });
        // Wait a bit more for React to render
        await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
        console.log('Timeout waiting for selector, dumping anyway.');
    }

    const content = await page.content();
    fs.writeFileSync('rendered_page.html', content);
    console.log('Dumped rendered HTML to rendered_page.html');

    await browser.close();
})();
