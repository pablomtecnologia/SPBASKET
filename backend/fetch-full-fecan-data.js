const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI';
const TEAM_ID = 4046;
const HEADERS = {
    'Origin': 'https://www.fecanbaloncesto.com',
    'Referer': 'https://www.fecanbaloncesto.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

function decodeBase64JSON(data) {
    if (typeof data === 'string' && !data.trim().startsWith('{')) {
        try {
            const decoded = Buffer.from(data.trim().replace(/^"|"$/g, ''), 'base64').toString('utf8');
            return JSON.parse(decoded);
        } catch (e) {
            console.error('Failed to decode base64 JSON', e);
            return data;
        }
    }
    return data;
}

async function fetchFullData() {
    console.log('Fetching Team Data...');
    const fullData = {};

    try {
        // 1. Team Card
        const cardRes = await axios.get(`${BASE_URL}/FCBQWeb/getTeamCard/${TEAM_ID}`, { headers: HEADERS });
        fullData.teamCard = decodeBase64JSON(cardRes.data);
        console.log('✅ Team Card Fetched');

        // 2. Matches for all months (Sep-May usually)
        fullData.matches = [];
        const months = [9, 10, 11, 12, 1, 2, 3, 4, 5];

        for (const m of months) {
            try {
                const matchRes = await axios.get(`${BASE_URL}/Match/getByTeamAndMonth/${TEAM_ID}/${m}`, { headers: HEADERS });
                const decodedMatches = decodeBase64JSON(matchRes.data);

                if (decodedMatches.messageData && Array.isArray(decodedMatches.messageData)) {
                    fullData.matches.push(...decodedMatches.messageData);
                    console.log(`✅ Matches for Month ${m}: ${decodedMatches.messageData.length} found`);
                } else {
                    console.log(`ℹ️ No matches for Month ${m}`);
                }
            } catch (err) {
                console.log(`❌ Error fetching Month ${m}: ${err.message}`);
            }
        }

        fs.writeFileSync('fecan-data.json', JSON.stringify(fullData, null, 2));
        console.log('Successfully saved all data to fecan-data.json');

    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
    }
}

fetchFullData();
