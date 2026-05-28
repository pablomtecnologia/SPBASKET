const scraper = require('./backend/live-scraper');
const fs = require('fs');
const path = require('path');

async function update() {
    const teams = ['sp-negro', 'sp-rosa'];
    for (const team of teams) {
        console.log(`Starting scrape for ${team}...`);
        try {
            const data = await scraper.scrapeLive(team);
            const cachePath = path.join(__dirname, 'backend', 'cache', `${team}.json`);
            fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
            console.log(`Successfully updated ${team}. Matches found: ${data.partidos.length}`);
        } catch (error) {
            console.error(`Error scraping ${team}:`, error);
        }
    }
}

update();
