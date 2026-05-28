const { chromium } = require('playwright');
const fs = require('fs');

async function dumpNetwork() {
    console.log('🕵️‍♀️ Analizando tráfico de red de FECAN...');

    const browser = await chromium.launch({ headless: false }); // Visible
    const page = await browser.newPage();

    const requests = [];

    // Escuchar peticiones
    page.on('response', async response => {
        const url = response.url();
        const type = response.request().resourceType();

        // Ignorar imágenes y estilos para no saturar
        if (type !== 'image' && type !== 'font' && type !== 'stylesheet') {
            requests.push({
                url,
                type,
                status: response.status()
            });

            // Si parece JSON o API, guardamos el contenido
            if (url.includes('json') || url.includes('api') || type === 'fetch' || type === 'xhr') {
                try {
                    const text = await response.text();
                    if (text.includes('Saski') || text.includes('PAS PIELAGOS')) {
                        console.log(`\n🎉 ¡EUREKA! Datos encontrados en: ${url}`);
                        fs.writeFileSync('fecan-data-found.json', text);
                    }
                } catch (e) { }
            }
        }
    });

    try {
        await page.goto('https://www.fecanbaloncesto.com/competicion/?id=1675&round=0', { timeout: 60000 });
        console.log('✅ Página cargada. Esperando 10 segundos...');
        await page.waitForTimeout(10000);

        fs.writeFileSync('network-log.json', JSON.stringify(requests, null, 2));
        console.log('✅ Log de red guardado en network-log.json');

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

dumpNetwork();
