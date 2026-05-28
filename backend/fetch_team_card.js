const axios = require('axios');
const fs = require('fs');

const URL = 'https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI/FCBQWeb/getTeamCard/4046';

async function test() {
    try {
        const res = await axios.get(URL, {
            headers: {
                'Origin': 'https://www.fecanbaloncesto.com',
                'Referer': 'https://www.fecanbaloncesto.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log('Status:', res.status);
        fs.writeFileSync('team_card.json', JSON.stringify(res.data, null, 2));
        console.log('Saved to team_card.json');
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response:', err.response.status, err.response.data);
        }
    }
}

test();
