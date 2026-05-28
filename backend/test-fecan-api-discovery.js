const axios = require('axios');
const fs = require('fs');

const API_BASE = 'https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI';
const TEAM_ID = 4046;

async function testEndpoints() {
    const endpoints = [
        `${API_BASE}/team/${TEAM_ID}/matches`,
        `${API_BASE}/team/${TEAM_ID}/calendar`,
        `${API_BASE}/team/${TEAM_ID}/schedule`,
        `${API_BASE}/team/${TEAM_ID}/games`,
        `${API_BASE}/matches/team/${TEAM_ID}`,
        `${API_BASE}/calendar/team/${TEAM_ID}`,
        `${API_BASE}/team-matches/team/${TEAM_ID}`,
        // Try adding season
        `${API_BASE}/team/${TEAM_ID}/matches/season/2025`,
        `${API_BASE}/team/${TEAM_ID}?season=2025`
    ];

    let log = '';

    console.log(`Testing ESB Base: ${API_BASE}`);

    for (const url of endpoints) {
        try {
            const res = await axios.get(url, {
                headers: {
                    'Origin': 'https://www.fecanbaloncesto.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            log += `✅ ${url} -> ${res.status}\n`;
            log += JSON.stringify(res.data, null, 2).substring(0, 1000) + '\n\n';
        } catch (err) {
            log += `❌ ${url} -> ${err.response ? err.response.status : err.message}\n`;
        }
    }
    fs.writeFileSync('api_results_log.txt', log);
    console.log('Done.');
}

testEndpoints();
