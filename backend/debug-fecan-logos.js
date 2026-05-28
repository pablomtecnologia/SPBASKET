const { chromium } = require('playwright');

async function debugLogos() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const url = 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0';
    console.log(`🚀 Navigating to ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // Scroll and wait
    await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 3000));
    });

    const results = await page.evaluate(() => {
        const data = { standings: [], matches: [] };

        // Standings
        const rows = document.querySelectorAll('.ow-table-row-data');
        rows.forEach(row => {
            const teamEl = row.querySelector('.ow-table-row-data-content:nth-child(3)');
            const img = row.querySelector('img');
            if (teamEl) {
                data.standings.push({
                    team: teamEl.innerText.trim(),
                    logo: img ? img.src : 'NO LOGO'
                });
            }
        });

        // Matches
        const cards = document.querySelectorAll('.ow-matchCard-container');
        cards.forEach(card => {
            const teamEls = card.querySelectorAll('.ow-matchCard-container-teams-team-name');
            const imgEls = card.querySelectorAll('img');
            if (teamEls.length >= 2) {
                data.matches.push({
                    home: teamEls[0].innerText.trim(),
                    away: teamEls[1].innerText.trim(),
                    logo_local: imgEls[0] ? imgEls[1]?.src : 'NO LOGO', // Usually 0 is something else? Let's check all imgs
                    all_imgs: Array.from(card.querySelectorAll('img')).map(i => i.src)
                });
            }
        });

        return data;
    });

    console.log('--- STANDINGS LOGOS ---');
    results.standings.forEach(s => console.log(`${s.team}: ${s.logo}`));

    console.log('\n--- MATCHES LOGOS (First 5) ---');
    results.matches.slice(0, 5).forEach(m => {
        console.log(`${m.home} vs ${m.away}`);
        console.log(`Images found: ${m.all_imgs.join(', ')}`);
    });

    await browser.close();
}

debugLogos();
