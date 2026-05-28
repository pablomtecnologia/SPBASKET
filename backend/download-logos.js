const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

const LOGO_DIR = path.join(__dirname, 'public/logos');
if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });

async function downloadImage(url, filename) {
    if (!url || !url.startsWith('http')) return null;
    try {
        console.log(`🌍 Downloading: ${url}`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });

        const writer = fs.createWriteStream(path.join(LOGO_DIR, filename));
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Saved: ${filename}`);
                resolve(true);
            });
            writer.on('error', reject);
        });
    } catch (e) {
        console.error(`❌ Error downloading ${url}:`, e.message);
        return null;
    }
}

async function run() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting logo downloader...');

        // 1. Logos de clasificación
        const standings = await client.query('SELECT DISTINCT logo FROM competition_standings WHERE logo LIKE \'http%\'');
        console.log(`📋 Standings: Found ${standings.rows.length} remote logos.`);
        for (const row of standings.rows) {
            const url = row.logo;
            const filename = 'team_' + Math.abs(url.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)).toString(16) + path.extname(url.split('?')[0]) || '.png';
            const success = await downloadImage(url, filename);
            if (success) {
                const localPath = `/api/logos/${filename}`;
                await client.query('UPDATE competition_standings SET logo = $1 WHERE logo = $2', [localPath, url]);
            }
        }

        // 2. Logos de partidos (Local)
        const homeLogos = await client.query('SELECT DISTINCT home_team_logo FROM competition_matches WHERE home_team_logo LIKE \'http%\'');
        console.log(`📋 Matches (Home): Found ${homeLogos.rows.length} remote logos.`);
        for (const row of homeLogos.rows) {
            const url = row.home_team_logo;
            const filename = 'match_' + Math.abs(url.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)).toString(16) + path.extname(url.split('?')[0]) || '.png';
            const success = await downloadImage(url, filename);
            if (success) {
                const localPath = `/api/logos/${filename}`;
                await client.query('UPDATE competition_matches SET home_team_logo = $1 WHERE home_team_logo = $2', [localPath, url]);
            }
        }

        // 3. Logos de partidos (Visitante)
        const awayLogos = await client.query('SELECT DISTINCT away_team_logo FROM competition_matches WHERE away_team_logo LIKE \'http%\'');
        console.log(`📋 Matches (Away): Found ${awayLogos.rows.length} remote logos.`);
        for (const row of awayLogos.rows) {
            const url = row.away_team_logo;
            const filename = 'match_' + Math.abs(url.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)).toString(16) + path.extname(url.split('?')[0]) || '.png';
            const success = await downloadImage(url, filename);
            if (success) {
                const localPath = `/api/logos/${filename}`;
                await client.query('UPDATE competition_matches SET away_team_logo = $1 WHERE away_team_logo = $2', [localPath, url]);
            }
        }

        console.log('\n✨ Download process finished.');
    } catch (err) {
        console.error('❌ General Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
