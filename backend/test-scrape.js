const { scrapeLive } = require('./live-scraper');

async function test() {
    console.log('--- TEST ROSA ---');
    const rosa = await scrapeLive('sp-rosa');
    console.log('Clasificación (Largo):', rosa.clasificacion.length);
    if (rosa.clasificacion.length > 0) {
        console.log('Sample Clasif (Logo):', rosa.clasificacion[0].logo);
    }
    console.log('Partidos (Largo):', rosa.partidos.length);
    if (rosa.partidos.length > 0) {
        console.log('Sample Partido (Logo Local):', rosa.partidos[0].logo_local);
    }

    console.log('\n--- TEST NEGRO ---');
    const negro = await scrapeLive('sp-negro');
    console.log('Clasificación (Largo):', negro.clasificacion.length);
    console.log('Partidos (Largo):', negro.partidos.length);
}

test();
