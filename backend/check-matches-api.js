const axios = require('axios');
const fs = require('fs');

const API_BASE = 'https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI';
const TEAM_ID = 4046;

async function testMatches(month) {
    const url = `${API_BASE}/Match/getByTeamAndMonth/${TEAM_ID}/${month}`;
    console.log(`Testing ${url}...`);
    try {
        const res = await axios.get(url, {
            headers: {
                'Origin': 'https://www.fecanbaloncesto.com',
                'Referer': 'https://www.fecanbaloncesto.com/',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        console.log(`Status: ${res.status}`);

        // Save to file (handling potential base64)
        let data = res.data;
        if (typeof data === 'string' && !data.trim().startsWith('{')) {
            data = Buffer.from(data.trim().replace(/^"|"$/g, ''), 'base64').toString('utf8');
        } else {
            console.log('Data does not look like base64, saving as is.');
            data = JSON.stringify(data, null, 2);
        }

        fs.writeFileSync(`matches_month_${month}.json`, data);
        console.log(`Saved matches_month_${month}.json`);

    } catch (err) {
        console.error('Error:', err.message);
    }
}

async function run() {
    await testMatches(1); // January
    await testMatches(2); // February
}

run();
