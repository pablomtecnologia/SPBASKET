const { chromium } = require('playwright');

const URLS = {
    'sp-rosa': 'https://www.fecanbaloncesto.com/competicion/?id=1674&round=0',
    'sp-negro': 'https://www.fecanbaloncesto.com/competicion/?id=1675&round=0'
};

async function scrapeLive(teamId) {
    const url = URLS[teamId];
    if (!url) throw new Error('Equipo no válido');

    console.log(`\n🚀 Sincronizando ${teamId} (MODO ESTRICTO: Solo Datos Reales)`);

    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080', // Tamaño real para forzar layout desktop
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        ]
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Pipe console de la página a la consola de Node
    page.on('console', msg => {
        if (msg.type() === 'log') console.log(`[BROWSER] ${msg.text()}`);
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

        // --- FRANCOTIRADOR DE SCROLL ---
        // Hacemos scroll y esperamos a ver movimiento en la red o en el DOM
        console.log("📜 Buscando tabla de clasificación...");
        await page.evaluate(async () => {
            const delay = (ms) => new Promise(r => setTimeout(r, ms));
            // Bajamos poco a poco
            for (let i = 0; i < document.body.scrollHeight; i += 300) {
                window.scrollTo(0, i);
                await delay(50);
            }
            // Y volvemos a bajar al final del todo por si acaso creció
            window.scrollTo(0, document.body.scrollHeight);
        });

        // ESPERA ACTIVA: Esperamos a que aparezca la clase concreta de las filas
        try {
            await page.waitForSelector('.ow-table-row-data', { state: 'visible', timeout: 10000 });
            console.log("✅ ¡Tabla detectada en el DOM!");
        } catch (e) {
            console.log("⚠️ No se detectó la tabla tras el scroll. Intentando lectura igualmente...");
        }

        const data = await page.evaluate((currentTeamId) => {
            const res = {
                info: { title: '', category: '' },
                partidos: [],
                clasificacion: []
            };

            // 0. INFO DE LA COMPETICIÓN
            const titleEl = document.querySelector('.ow-section-title');
            const catEl = document.querySelector('.ow-section-subtitle');
            if (titleEl) res.info.title = titleEl.innerText.trim();
            if (catEl) res.info.category = catEl.innerText.trim();

            // 1. PARTIDOS (Iteramos por todos los elementos para capturar headers de Jornada)
            const matches = [];
            let currentJornada = '?';

            // Buscamos todos los elementos relevantes en el contenedor de partidos
            const elements = Array.from(document.querySelectorAll('.ow-match-group-title, h3, .ow-matchCard-container'));

            elements.forEach((el) => {
                if (el.classList.contains('ow-match-group-title') || el.tagName === 'H3') {
                    const found = el.innerText.match(/Jornada\s+(\d+)/i);
                    if (found) currentJornada = found[1];
                } else if (el.classList.contains('ow-matchCard-container')) {
                    try {
                        const card = el;
                        const teamEls = card.querySelectorAll('.ow-matchCard-container-teams-team-name');
                        const scoreEls = card.querySelectorAll('.ow-matchCard-container-teams-team-score');
                        const infoSpans = card.querySelectorAll('span, div');

                        let rawDate = '';
                        let pabellon = '';

                        infoSpans.forEach(s => {
                            const txt = s.innerText.trim();
                            if (txt.includes('/') && txt.includes(':')) rawDate = txt;
                            else if (txt.includes('|')) pabellon = txt.split('|')[0].trim();
                        });

                        const getLogoSrc = (container) => {
                            const img = container.querySelector('img');
                            if (!img) return '';
                            return img.src || img.getAttribute('data-src') || '';
                        };

                        if (teamEls.length >= 2) {
                            const sLocal = scoreEls[0] ? parseInt(scoreEls[0].innerText) : 0;
                            const sVis = scoreEls[1] ? parseInt(scoreEls[1].innerText) : 0;
                            const localLogo = getLogoSrc(card.querySelector('.ow-matchCard-container-teams-team:first-child'));
                            const visitorLogo = getLogoSrc(card.querySelector('.ow-matchCard-container-teams-team:last-child'));

                            matches.push({
                                jornada: currentJornada,
                                fecha: rawDate.split(' ')[0] || '?',
                                hora: rawDate.split(' ')[1] || '',
                                equipo_local: teamEls[0].innerText.trim(),
                                equipo_visitante: teamEls[1].innerText.trim(),
                                logo_local: localLogo,
                                logo_visitante: visitorLogo,
                                resultado_local: sLocal || 0,
                                resultado_visitante: sVis || 0,
                                pabellon: pabellon || 'Pabellón no especificado',
                                estado: (sLocal > 0 || sVis > 0) ? 'played' : 'upcoming'
                            });
                        }
                    } catch (e) { }
                }
            });

            res.partidos = matches.filter(m => {
                const home = m.equipo_local.toUpperCase();
                const away = m.equipo_visitante.toUpperCase();
                return home.includes('SP') || away.includes('SP') ||
                    home.includes('SASKI') || away.includes('SASKI') ||
                    home.includes('PENGUINS') || away.includes('PENGUINS');
            });

            // 2. CLASIFICACIÓN
            const rows = document.querySelectorAll('.ow-table-row-data');
            rows.forEach((row, i) => {
                const cells = row.querySelectorAll('.ow-table-row-data-content');
                if (cells.length > 8) {
                    const getTxt = (n) => cells[n]?.innerText.trim();
                    const getVal = (n) => parseInt(getTxt(n)) || 0;
                    const teamName = getTxt(2);
                    const played = getVal(3);

                    if (teamName && played > 0) {
                        // Selector robusto para logo en clasificación
                        const logo = row.querySelector('img')?.src || '';

                        res.clasificacion.push({
                            position: getVal(0) || i + 1,
                            team_name: teamName,
                            logo: logo,
                            played: played,
                            won: getVal(4),
                            lost: getVal(5),
                            points: getVal(9)
                        });
                    }
                }
            });

            return res;
        }, teamId);

        return {
            teamId,
            timestamp: new Date().toLocaleTimeString(),
            clasificacion: data.clasificacion,
            partidos: data.partidos
        };

    } catch (error) {
        console.error('❌ Error scraping:', error);
        return { error: error.message, clasificacion: [], partidos: [] };
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeLive };
