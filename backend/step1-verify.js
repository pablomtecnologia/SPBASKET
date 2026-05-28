const { chromium } = require('playwright');

(async () => {
    console.log('Abriendo navegador...');
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.fecanbaloncesto.com/competicion/?id=1675&round=0');
    console.log('✅ Navegador abierto. La página debería estar cargando...');
    console.log('NO cierres esta ventana negra. NO cierres el navegador.');

    // Mantenemos vivo el proceso 1 hora
    await new Promise(r => setTimeout(r, 3600000));
})();
