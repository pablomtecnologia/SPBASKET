const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('🔍 Iniciando diagnóstico de estructura HTML...');
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Vamos a SP NEGRO
    await page.goto('https://www.fecanbaloncesto.com/competicion/?id=1675&round=0', { waitUntil: 'load' });

    console.log('⏳ Esperando 10 segundos para asegurar carga de datos...');
    await page.waitForTimeout(10000);

    // Extraer todo el HTML del body
    const content = await page.content();

    // Guardar en archivo para analizar
    fs.writeFileSync('fecan-visual-structure.html', content);
    console.log('✅ HTML guardado en fecan-visual-structure.html');

    // También vamos a intentar aislar tarjetas de partidos y filas para verlo más fácil
    const analysis = await page.evaluate(() => {
        // Buscar elementos que parezcan partidos (contienen fecha y nombres)
        const divs = Array.from(document.querySelectorAll('div'));

        // Filtramos divs que tengan texto de partidos
        const matchExamples = divs.filter(d =>
            d.innerText.match(/\d{2}:\d{2}/) && // Tiene hora
            d.innerText.match(/-/) && // Tiene guión
            d.innerText.length < 300 // No es todo el body
        ).slice(0, 3).map(d => d.outerHTML);

        // Buscar elementos que parezcan filas de tabla
        const rowExamples = divs.filter(d =>
            d.innerText.match(/^\d+/) && // Empieza por número (posición)
            d.innerText.length < 200 &&
            d.innerText.split('\n').length > 1 // Tiene saltos de línea (columnas)
        ).slice(0, 5).map(d => d.outerHTML);

        return { matches: matchExamples, rows: rowExamples };
    });

    fs.writeFileSync('fecan-snippets.json', JSON.stringify(analysis, null, 2));
    console.log('✅ Fragmentos guardados en fecan-snippets.json');

    await browser.close();
})();
