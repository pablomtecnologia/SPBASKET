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

    // Intercept requests
    await page.setRequestInterception(true);

    let requestsLog = [];

    page.on('request', request => {
        if (['xhr', 'fetch'].includes(request.resourceType())) {
            requestsLog.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData()
            });
        }
        request.continue();
    });

    const url = 'https://www.fecanbaloncesto.com/equipo/?id=4046';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for widget
    try {
        await page.waitForSelector('.owbasket-root', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
        console.log('Timeout waiting for selector.');
    }

    fs.writeFileSync('network_requests.json', JSON.stringify(requestsLog, null, 2));
    console.log('Dumped network requests to network_requests.json');

    await browser.close();
})();
