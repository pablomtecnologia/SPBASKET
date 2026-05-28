const fs = require('fs');
const path = require('path');

// 1. Leer BASE (Imports y Config)
const base = fs.readFileSync('server.js', 'utf8');
// Cortar antes de las rutas temporales
const baseCut = base.split('// SERVE FRONTEND (TEMP)')[0];

const verifyTokenCode = `
// Middleware Auth
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ message: 'Token requerido' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token inválido' });
        req.user = decoded;
        next();
    });
};
`;

// 2. Leer CORE (Rutas antiguas recuperadas)
const core = fs.readFileSync('core_routes.js', 'utf8');

// 3. Definir FECAN (Nuevo código)
const fecanPart = `
// ========== FECAN SCRAPING ENDPOINTS ==========

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
    res.status(501).json({message: 'Endpoint en mantenimiento'}); 
});
`;

// 4. Footer (Listen + Static)
const footer = `
// SERVIR ENDPOINTS FINALES
app.use('/assets', express.static(path.join(__dirname, '../dist/sp-basket/browser/assets')));
app.use(express.static(path.join(__dirname, '../dist/sp-basket/browser')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/sp-basket/browser/index.html')));

app.listen(PORT, () => console.log('Server running on port ' + PORT));
`;

// 5. UNIFICAR
const final = baseCut + '\n' + verifyTokenCode + '\n' + core + '\n' + fecanPart + '\n' + footer;

fs.writeFileSync('server.js', final, 'utf8');
console.log('✅ SERVER ASSEMBLED SUCCESSFULLY');
