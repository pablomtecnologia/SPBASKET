
// GET /api/fecan/clasificacion/:teamId - Obtener clasificación (PÚBLICO)
app.get('/api/fecan/clasificacion/:teamId', async (req, res) => {
    const teamId = req.params.teamId;

    try {
        const { rows } = await pool.query(`
            SELECT * FROM fecan_clasificacion
            WHERE team_id = $1
            ORDER BY position ASC
        `, [teamId]);

        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo clasificación:', error);
        res.status(500).json({ message: 'Error obteniendo clasificación' });
    }
});

// GET /api/fecan/partidos/:teamId - Obtener partidos (PÚBLICO)
app.get('/api/fecan/partidos/:teamId', async (req, res) => {
    const teamId = req.params.teamId;

    try {
        const { rows } = await pool.query(`
            SELECT * FROM fecan_partidos
            WHERE team_id = $1
            ORDER BY jornada ASC
        `, [teamId]);

        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo partidos:', error);
        res.status(500).json({ message: 'Error obteniendo partidos' });
    }
});

// GET /api/fecan/info/:teamId - Obtener info de competición (PÚBLICO)
app.get('/api/fecan/info/:teamId', async (req, res) => {
    const teamId = req.params.teamId;

    try {
        const { rows } = await pool.query(`
            SELECT * FROM fecan_competicion_info
            WHERE team_id = $1
        `, [teamId]);

        if (rows.length === 0) {
            return res.json({
                teamId,
                title: `Competición ${teamId.toUpperCase()}`,
                season: '2025/2026'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('❌ Error obteniendo info:', error);
        res.status(500).json({ message: 'Error obteniendo info' });
    }
});

// GET /api/fecan/complete/:teamId - Obtener TODO (clasificación + partidos + info)
app.get('/api/fecan/complete/:teamId', async (req, res) => {
    const teamId = req.params.teamId;

    try {
        const [clasificacion, partidos, info] = await Promise.all([
            pool.query('SELECT * FROM fecan_clasificacion WHERE team_id = $1 ORDER BY position ASC', [teamId]),
            pool.query('SELECT * FROM fecan_partidos WHERE team_id = $1 ORDER BY jornada ASC', [teamId]),
            pool.query('SELECT * FROM fecan_competicion_info WHERE team_id = $1', [teamId])
        ]);

        res.json({
            teamId,
            info: info.rows[0] || { title: `Competición ${teamId.toUpperCase()}`, season: '2025/2026' },
            clasificacion: clasificacion.rows,
            partidos: partidos.rows,
            stats: {
                totalEquipos: clasificacion.rows.length,
                totalPartidos: partidos.rows.length,
                partidosJugados: partidos.rows.filter(p => p.estado === 'played').length,
                proximosPartidos: partidos.rows.filter(p => {
                    return p.estado === 'upcoming' || (!p.resultado_local && !p.resultado_visitante);
                }).length
            }
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
        const cacheFile = path.join(CACHE_DIR, `${teamId}.json`);

        if (!force && fs.existsSync(cacheFile)) {
            const stats = fs.statSync(cacheFile);
            if (Date.now() - stats.mtimeMs < 86400000) {
                console.log(`📦 Cache hit: ${teamId}`);
                const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
                data.isCached = true;
                data.lastUpdate = stats.mtime;
                return res.json(data);
            }
        }

        console.log(`📡 Scrapeando fresh data para ${teamId}...`);
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
    const { teamId, clasificacionRaw, partidosRaw } = req.body;
    let equiposGuardados = 0;
    let partidosGuardados = 0;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (clasificacionRaw && clasificacionRaw.trim()) {
            await client.query('DELETE FROM fecan_clasificacion WHERE team_id = $1', [teamId]);
            const lines = clasificacionRaw.split('\n');
            let positionCounter = 1;
            for (const line of lines) {
                const parts = line.trim().split(/\t|\s{2,}/);
                if (parts.length >= 5 && !line.includes('PJ') && !line.includes('Equipo')) {
                    let name = parts[0];
                    let numbers = [];
                    if (/^\d+$/.test(parts[0]) && parts.length > 2) {
                        name = parts[1];
                        numbers = parts.slice(2).map(p => parseInt(p) || 0);
                    } else {
                        name = parts[0];
                        numbers = parts.slice(1).map(p => parseInt(p) || 0);
                    }
                    if (numbers.length >= 5) {
                        const diff = (numbers[3] || 0) - (numbers[4] || 0);
                        await client.query(`
                            INSERT INTO fecan_clasificacion
                            (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points)
                            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        `, [teamId, positionCounter++, name, numbers[0], numbers[1], numbers[2], numbers[3], numbers[4], diff, numbers[numbers.length - 1]]);
                        equiposGuardados++;
                    }
                }
            }
        }

        if (partidosRaw && partidosRaw.trim()) {
            await client.query('DELETE FROM fecan_partidos WHERE team_id = $1', [teamId]);
            const lines = partidosRaw.split('\n');
            for (const line of lines) {
                if (line.includes('-') && /\d+/.test(line)) {
                    const match = line.match(/^(.+?)(\d+)\s*-\s*(\d+)(.+)$/);
                    if (match) {
                        await client.query(`
                            INSERT INTO fecan_partidos
                            (team_id, jornada, fecha, equipo_local, equipo_visitante, resultado_local, resultado_visitante, estado, last_updated)
                            VALUES($1, '?', 'Reciente', $2, $3, $4, $5, 'played', CURRENT_TIMESTAMP)
                        `, [teamId, match[1].trim(), match[4].trim(), parseInt(match[2]), parseInt(match[3])]);
                        partidosGuardados++;
                    }
                }
            }
        }

        await client.query(`
            INSERT INTO fecan_competicion_info(team_id, title, season, last_updated) VALUES($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT(team_id) DO UPDATE SET last_updated = CURRENT_TIMESTAMP
        `, [teamId, teamId === 'sp-negro' ? 'SP NEGRO' : 'SP ROSA', '2025/2026']);

        await client.query('COMMIT');
        res.json({ success: true, equipos: equiposGuardados, partidos: partidosGuardados });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error manual import:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

console.log('✅ Endpoints FECAN públicos configurados');

/* ========== SERVER START ========== */
// SERVIR ASSETS (IMÁGENES) EXPLÍCITAMENTE
app.use('/assets', express.static(path.join(__dirname, '../dist/sp-basket/browser/assets')));

// SERVIR FRONTEND STATICO (ANGULAR)
const frontendPath = path.join(__dirname, '../dist/sp-basket/browser');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Usamos la variable PORT ya definida al inicio
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
