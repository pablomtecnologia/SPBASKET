const { scrapeLive } = require('./live-scraper');
scrapeLive('sp-rosa').then(data => {
    data.clasificacion.forEach(t => console.log(`TEAM: ${t.team_name}`));
    process.exit(0);
});
