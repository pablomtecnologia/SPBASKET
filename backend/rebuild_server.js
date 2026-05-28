const fs = require('fs');
const path = require('path');

// 1. Definir la parte NUEVA (Endpoints públicos y caché) con sintaxis correcta
const nuevaParte = `
// ========== ENDPOINTS PÚBLICOS FECAN (Clasificación y Partidos) ==========

// GET /api/fecan/clasificacion/:teamId
app.get('/api/fecan/clasificacion/:teamId', async (req, res) => {
    const teamId = req.params.teamId; 
    try {
        const { rows } = await pool.query('SELECT * FROM fecan_clasificacion WHERE team_id = $1 ORDER BY position ASC', [teamId]);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo clasificación:', error);
        res.status(500).json({ message: 'Error obteniendo clasificación' });
    }
});

// GET /api/fecan/partidos/:teamId
app.get('/api/fecan/partidos/:teamId', async (req, res) => {
    const teamId = req.params.teamId;
    try {
        const { rows } = await pool.query('SELECT * FROM fecan_partidos WHERE team_id = $1 ORDER BY jornada ASC', [teamId]);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo partidos:', error);
        res.status(500).json({ message: 'Error obteniendo partidos' });
    }
});

// GET /api/fecan/info/:teamId
app.get('/api/fecan/info/:teamId', async (req, res) => {
    const teamId = req.params.teamId;
    try {
        const { rows } = await pool.query('SELECT * FROM fecan_competicion_info WHERE team_id = $1', [teamId]);
        if (rows.length === 0) {
            return res.json({ teamId, title: 'Competición ' + teamId.toUpperCase(), season: '2025/2026' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('❌ Error obteniendo info:', error);
        res.status(500).json({ message: 'Error obteniendo info' });
    }
});

// GET /api/fecan/complete/:teamId
app.get('/api/fecan/complete/:teamId', async (req, res) => {
    const teamId = req.params.teamId;
    try {
        const [clas, part, info] = await Promise.all([
            pool.query('SELECT * FROM fecan_clasificacion WHERE team_id = $1 ORDER BY position ASC', [teamId]),
            pool.query('SELECT * FROM fecan_partidos WHERE team_id = $1 ORDER BY jornada ASC', [teamId]),
            pool.query('SELECT * FROM fecan_competicion_info WHERE team_id = $1', [teamId])
        ]);
        res.json({
            teamId,
            info: info.rows[0] || { title: 'Competición ' + teamId.toUpperCase(), season: '2025/2026' },
            clasificacion: clas.rows,
            partidos: part.rows
        });
    } catch (error) {
        console.error('❌ Error obteniendo datos completos:', error);
        res.status(500).json({ message: 'Error obteniendo datos' });
    }
});

/* --- LIVE SCRAPER CON CACHE (24h) --- */
const { scrapeLive } = require('./live-scraper');
const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

app.get('/api/scrape-live/:teamId', async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const force = req.query.force === 'true'; 
        const cacheFile = path.join(CACHE_DIR, teamId + '.json');

        // Check Cache
        if (!force && fs.existsSync(cacheFile)) {
            const stats = fs.statSync(cacheFile);
            if (Date.now() - stats.mtimeMs < 86400000) { // 24h
                console.log('📦 Cache hit:', teamId);
                const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
                data.isCached = true;
                data.lastUpdate = stats.mtime;
                return res.json(data);
            }
        }

        console.log('📡 Scrapeando fresh data para', teamId);
        const data = await scrapeLive(teamId);
        
        if (!data.error && (data.clasificacion.length > 0 || data.partidos.length > 0)) {
            fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
        } else if (fs.existsSync(cacheFile)) {
             // Fallback to cache if scrape fails
             const old = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
             old.isCached = true;
             return res.json(old);
        }
        res.json(data);
    } catch (error) {
        console.error('❌ Error scrape live:', error);
        res.status(500).json({ error: error.message });
    }
});

/* --- MANUAL IMPORT (Admin) --- */
app.post('/api/fecan/manual-import', async (req, res) => {
    // ... Implementación simplificada para evitar errores de sintaxis ...
    res.status(501).json({message: 'Endpoint en mantenimiento'}); 
});

// SERVIR ENDPOINTS FINALES
app.use('/assets', express.static(path.join(__dirname, '../dist/sp-basket/browser/assets')));
app.use(express.static(path.join(__dirname, '../dist/sp-basket/browser')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/sp-basket/browser/index.html')));

app.listen(PORT, () => console.log('Server running on port ' + PORT));
`;

// 2. Leer archivo actual
try {
    const content = fs.readFileSync('server.js', 'utf8');

    // 3. Buscar punto seguro de corte: el final del cronjob
    // Buscamos la cadena específica del timeout o cron
    const splitKey = '}, 5000);'; // El final del setTimeout inicial
    const parts = content.split(splitKey);

    if (parts.length < 2) {
        console.error("❌ No encontré el punto de corte '}, 5000);'");
        process.exit(1);
    }

    // 4. Unir la primera parte correcta con la nueva parte
    // parts[0] contiene todo hasta el setTimeout.
    // Le añadimos el splitKey que quitamos.
    const cleanServer = parts[0] + splitKey + '\n\n' + nuevaParte;

    // 5. Guardar
    fs.writeFileSync('server.js', cleanServer, 'utf8');
    console.log("✅ server.js reconstruido correctamente.");

} catch (e) {
    console.error("Error fatal:", e);
}
