const { scrapeLive } = require('./live-scraper');

async function debugScraper() {
    console.log('🧐 Debugging SP Negro scraper...');
    const data = await scrapeLive('sp-negro');

    if (data.error) {
        console.error('❌ Scraper error:', data.error);
        return;
    }

    console.log('\n--- CLASIFICACION LOGOS ---');
    data.clasificacion.forEach(t => {
        console.log(`${t.team_name}: ${t.logo}`);
    });

    console.log('\n--- PARTIDOS LOGOS ---');
    data.partidos.slice(0, 5).forEach(m => {
        console.log(`${m.equipo_local} (${m.logo_local}) vs ${m.equipo_visitante} (${m.logo_visitante})`);
    });
}

debugScraper();
