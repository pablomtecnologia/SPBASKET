const { chromium } = require('playwright');

const URLS = {
    'sp-rosa': 'https://www.fecanbaloncesto.com/competicion/?id=1674&round=0',
    'sp-negro': 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0'
};

async function test() {
    console.log('🚀 Debugging HTML on server...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const teamId of ['sp-rosa', 'sp-negro']) {
        console.log(`\n--- TEAM: ${teamId} ---`);
        await page.goto(URLS[teamId], { waitUntil: 'networkidle' });

        await page.evaluate(async () => {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, 2000));
        });

        const debugData = await page.evaluate(() => {
            const firstCard = document.querySelector('.ow-matchCard-container');
            const firstRow = document.querySelector('.ow-table-row-data');

            return {
                cardHtml: firstCard ? firstCard.outerHTML.substring(0, 1000) : 'NOT FOUND',
                rowHtml: firstRow ? firstRow.outerHTML.substring(0, 1000) : 'NOT FOUND'
            };
        });

        console.log('Card HTML:', debugData.cardHtml);
        console.log('Row HTML:', debugData.rowHtml);
    }

    await browser.close();
}

test();
