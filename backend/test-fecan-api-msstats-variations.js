const axios = require('axios');
const fs = require('fs');

const TEAM_ID = 4046;
const MSSTATS_BASE = 'https://msstats.optimalwayconsulting.com/v1/fecan';

async function testEndpoints() {
    const paths = [
        `/team-matches/team/${TEAM_ID}/season/2025`,
        `/matches/team/${TEAM_ID}/season/2025`,
        `/calendar/team/${TEAM_ID}/season/2025`,
        `/games/team/${TEAM_ID}/season/2025`,
        `/schedule/team/${TEAM_ID}/season/2025`,
        `/competitions/team/${TEAM_ID}/season/2025`
    ];

    const configs = [
        { name: 'No Headers', headers: {} },
        { name: 'User-Agent Only', headers: { 'User-Agent': 'Mozilla/5.0' } },
        { name: 'Origin', headers: { 'Origin': 'https://www.fecanbaloncesto.com', 'User-Agent': 'Mozilla/5.0' } },
        { name: 'Referer', headers: { 'Referer': 'https://www.fecanbaloncesto.com/', 'User-Agent': 'Mozilla/5.0' } }
    ];

    let log = '';

    console.log(`Testing MSSTATS Variations`);

    for (const path of paths) {
        const url = `${MSSTATS_BASE}${path}`;
        for (const config of configs) {
            try {
                const res = await axios.get(url, { headers: config.headers });
                log += `✅ ${url} [${config.name}] -> ${res.status}\n`;
                // log += JSON.stringify(res.data).substring(0, 200) + '\n\n';
            } catch (err) {
                log += `❌ ${url} [${config.name}] -> ${err.response ? err.response.status : err.message}\n`;
            }
        }
    }
    fs.writeFileSync('api_results_log.txt', log);
    console.log('Done.');
}

testEndpoints();
