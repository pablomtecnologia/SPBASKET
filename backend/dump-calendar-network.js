const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1200, height: 800 });

    // Intercept requests
    await page.setRequestInterception(true);

    let requestsLog = [];

    page.on('request', request => {
        if (['xhr', 'fetch'].includes(request.resourceType())) {
            console.log(`REQ: ${request.url()}`);
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
    await page.waitForSelector('.owbasket-root', { timeout: 10000 });
    console.log('Widget loaded.');

    // Find and click "Calendario" tab
    // The text is inside a div with class ow-tabs-buttons
    const buttons = await page.$$('.ow-tabs-buttons');
    let calendarBtn;
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.trim() === 'Calendario') {
            calendarBtn = btn;
            break;
        }
    }

    if (calendarBtn) {
        console.log('Found Calendario button. Clicking...');
        await calendarBtn.click();
        // Wait for some network activity or timeout
        await new Promise(r => setTimeout(r, 5000));
    } else {
        console.log('Calendario button not found.');
    }

    fs.writeFileSync('network_requests_calendar.json', JSON.stringify(requestsLog, null, 2));
    console.log('Dumped network requests to network_requests_calendar.json');

    await browser.close();
})();
