// analyze-fecan-structure.js - Analiza la estructura real de FECAN
const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeStructure() {
    console.log('🔍 Analizando estructura de FECAN...\n');

    const browser = await chromium.launch({ headless: false }); // NO headless para ver
    const page = await browser.newPage();

    await page.goto('https://www.fecanbaloncesto.com/competicion/?id=1675&round=0');
    console.log('✅ Página cargada, esperando contenido...\n');

    // Esperar a que cargue
    await page.waitForTimeout(5000);

    // Capturar screenshot
    await page.screenshot({ path: 'fecan-screenshot.png', fullPage: true });
    console.log('📸 Screenshot guardado: fecan-screenshot.png\n');

    // Analizar estructura
    const analysis = await page.evaluate(() => {
        const result = {
            tables: [],
            divClasses: new Set(),
            allText: []
        };

        // Buscar todas las tablas
        document.querySelectorAll('table').forEach((table, i) => {
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
            const rows = table.querySelectorAll('tbody tr').length;
            result.tables.push({
                index: i,
                headers: headers,
                rowCount: rows,
                firstRowText: table.querySelector('tbody tr')?.textContent.trim().substring(0, 100)
            });
        });

        // Buscar divs con clases interesantes
        document.querySelectorAll('[class]').forEach(el => {
            const classes = el.className.toString().split(' ');
            classes.forEach(c => {
                if (c.includes('partido') || c.includes('match') || c.includes('game') ||
                    c.includes('clasificacion') || c.includes('standing') || c.includes('tabla') ||
                    c.includes('jornada') || c.includes('equipo') || c.includes('team')) {
                    result.divClasses.add(c);
                }
            });
        });

        result.divClasses = Array.from(result.divClasses);

        // Capturar texto visible
        const mainContent = document.querySelector('main, .content, #content, body');
        if (mainContent) {
            result.allText = mainContent.textContent.trim().substring(0, 2000);
        }

        return result;
    });

    console.log('📊 ANÁLISIS DE ESTRUCTURA:\n');
    console.log(`📋 Tablas encontradas: ${analysis.tables.length}`);
    analysis.tables.forEach(table => {
        console.log(`\n  Tabla ${table.index}:`);
        console.log(`    Headers: ${table.headers.join(', ')}`);
        console.log(`    Filas: ${table.rowCount}`);
        if (table.firstRowText) {
            console.log(`    Primera fila: ${table.firstRowText}`);
        }
    });

    console.log(`\n🎨 Clases CSS relevantes: ${analysis.divClasses.length}`);
    console.log(analysis.divClasses.join(', '));

    console.log('\n📄 Primeros 500 caracteres del texto:');
    console.log(analysis.allText.substring(0, 500));

    // Guardar HTML completo
    const html = await page.content();
    fs.writeFileSync('fecan-full.html', html);
    console.log('\n💾 HTML completo guardado: fecan-full.html');

    console.log('\n⏸️  El navegador quedará abierto para que veas la página.');
    console.log('Presiona ENTER para cerrar...');

    // Esperar input del usuario
    await new Promise(resolve => {
        process.stdin.once('data', resolve);
    });

    await browser.close();
}

analyzeStructure().catch(console.error);
