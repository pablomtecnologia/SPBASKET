const { scrapeLive } = require('./live-scraper');
scrapeLive('sp-rosa').then(data => {
    console.log('--- CLASIFICACIÓN ---');
    data.clasificacion.forEach(t => console.log(`${t.position}. ${t.team_name}`));
    console.log('\n--- PARTIDOS ---');
    data.partidos.forEach(p => console.log(`${p.fecha} ${p.hora}: ${p.equipo_local} vs ${p.equipo_visitante}`));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
