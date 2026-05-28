const { scrapeLive } = require('./live-scraper');
console.log('Iniciando Test de Scraping para sp-rosa...');
scrapeLive('sp-rosa')
    .then(data => {
        console.log('--- TEST EXITOSO ---');
        console.log('Equipos en la clasificación:');
        data.clasificacion.forEach(t => console.log(`- [${t.position}] ${t.team_name}`));

        const ourTeam = data.clasificacion.find(t =>
            t.team_name.toLowerCase().includes('saski') ||
            t.team_name.toLowerCase().includes('penguins')
        );

        if (ourTeam) {
            console.log('✅ NUESTRO EQUIPO ENCONTRADO:', ourTeam);
        } else {
            console.log('❌ NUESTRO EQUIPO NO ENCONTRADO EN LA LISTA');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('--- TEST FALLIDO ---');
        console.error(err);
        process.exit(1);
    });
