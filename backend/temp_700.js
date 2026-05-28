// backend/server.js - VersiÃ³n CON PostgreSQL (Supabase)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Carga .env asegurada
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const fs = require('fs');
const Stripe = require('stripe');
const cron = require('node-cron');
const { runAutoImport, importTeamMatches } = require('./fecan-auto-scraper');
const { getFecanMatches } = require('./scraper-fecan');


const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// -- SECURITY HEADERS --
app.use(helmet({
    contentSecurityPolicy: false, // Disabling CSP for now to avoid breaking Angular images/styles
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// -- RATE LIMITING --
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER');
const PORT = process.env.PORT || 80;

console.log(`ðŸ”Œ Iniciando servidor en PUERTO: ${PORT}`);
console.log(`ðŸ“‚ Directorio base: ${__dirname}`);
console.log(`ðŸš€ VERSION: FINAL EMAIL FIX (IONOS)`);


// ---------- CONFIG (Puede venir de .env o hardcoded) ----------
const JWT_SECRET = process.env.JWT_SECRET || 'MI_SECRETA_SUPER_SPBASKET_2024';

// Middlewares
app.use(cors()); // Permitir todas las conexiones para desarrollo y demos

// COMENTADO: ConfiguraciÃ³n CORS original que estaba rota
/*
app.use(cors({
    origin: '*', // Permitir todo temporalmente
    credentials: true
}));
*/

app.use(express.json());

// Servir archivos estÃ¡ticos (imÃ¡genes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== POSTGRESQL POOL ==========
// SYNCED WITH MANUAL RESET
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

// Inicializar Tablas (Schema Migration)
const initDB = async () => {
    try {
        const client = await pool.connect();
        try {
            console.log('ðŸ“¦ Conectado a PostgreSQL. Verificando tablas...');

            // TABLA USERS
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100),
                    nombre VARCHAR(100),
                    apellidos VARCHAR(100),
                    rol VARCHAR(20) DEFAULT 'user', 
                    licencia VARCHAR(50),
                    foto VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // TABLA NEWS (Noticias)
            await client.query(`
                CREATE TABLE IF NOT EXISTS news (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT,
                    image_url VARCHAR(255),
                    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // MIGRATION: Ensure image_url exists
            try {
                await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);`);
            } catch (e) {
                console.log('Column image_url check:', e.message);
            }

            // TABLA SITE_VISITS
            await client.query(`
                CREATE TABLE IF NOT EXISTS site_visits (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    path VARCHAR(255),
                    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                );
            `);

            console.log('âœ… Tablas verificadas/creadas correctamente.');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('âŒ Error conexiÃ³n DB:', err);
    }
};

initDB();

// Middleware Auth
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ message: 'Token requerido' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token invÃ¡lido' });
        req.user = decoded;
        next();
    });
};

// ================= RUTAS =================

// LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        const user = rows[0];
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'ContraseÃ±a incorrecta' });

        const token = jwt.sign({
            sub: user.id,
            username: user.username,
            rol: user.rol,
            nombre: user.nombre,
            apellidos: user.apellidos
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            id: user.id,
            username: user.username,
            rol: user.rol,
            nombre: user.nombre,
            apellidos: user.apellidos,
            licencia: user.licencia,
            foto: user.foto,
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error servidor' });
    }
});

// GET PERFIL
app.get('/api/users/profile', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, username, email, nombre, apellidos, rol, licencia, foto FROM users WHERE id = $1', [req.user.sub]);
        if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

// MIGRATION: Ensure user columns exist
(async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS nombre VARCHAR(100)');
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS apellidos VARCHAR(100)');
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS licencia VARCHAR(50)');
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS foto TEXT');
        } finally { client.release(); }
    } catch (e) { console.error('Migration Users Error:', e); }
})();

// UPDATE PERFIL
app.put('/api/users/profile', verifyToken, async (req, res) => {
    const { email, nombre, apellidos, licencia, foto } = req.body;
    // req.user.sub is the ID
    try {
        await pool.query(
            'UPDATE users SET email=$1, nombre=$2, apellidos=$3, licencia=$4, foto=$5 WHERE id=$6',
            [email, nombre, apellidos, licencia, foto, req.user.sub]
        );
        res.json({ message: 'Perfil actualizado' });
    } catch (err) {
        console.error('âŒ Error actualizando perfil:', err);
        res.status(500).json({ message: 'Error actualizando: ' + err.message });
    }
});

// ========== NOTICIAS ==========
// MIGRATION: Ensure all columns exist
(async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);`);
            await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS category VARCHAR(50);`);
            await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS author VARCHAR(100);`);
            await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS slug VARCHAR(255);`);
            await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS tags VARCHAR(255);`);
            await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;`);
            await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);`); // Just in case
        } finally {
            client.release();
        }
    } catch (e) {
        console.log('Error migrating news table:', e.message);
    }
})();

app.get('/api/noticias', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM news ORDER BY date DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener noticias' });
    }
});

// Get single news article by ID
app.get('/api/noticias/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Noticia no encontrada' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error obteniendo noticia:', err);
        res.status(500).json({ message: 'Error al obtener la noticia' });
    }
});

app.post('/api/noticias', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin requerido' });

    // Accept Spanish or English fields
    const {
        title, titulo,
        content, contenido,
        image, imagen_url,
        subtitle, subtitulo,
        category, categoria,
        tags, hashtags,
        is_featured, destacada
    } = req.body;

    const finalTitle = title || titulo;
    const finalContent = content || contenido;
    const finalImage = image || imagen_url;
    const finalSubtitle = subtitle || subtitulo || '';
    const finalCategory = category || categoria || 'General';
    const finalTags = tags || hashtags || '';
    const finalFeatured = is_featured || destacada || false;

    // Auto-generate author from user
    const author = req.user.username;

    // Simple slug generation
    const slug = finalTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    if (!finalTitle) return res.status(400).json({ message: 'El tÃ­tulo es obligatorio' });

    try {
        const { rows } = await pool.query(
            `INSERT INTO news (title, content, image_url, subtitle, category, author, slug, tags, is_featured) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [finalTitle, finalContent, finalImage, finalSubtitle, finalCategory, author, slug, finalTags, finalFeatured]
        );
        res.json({ message: 'Noticia creada', id: rows[0].id });
    } catch (err) {
        console.error('âŒ Error creando noticia:', err);
        res.status(500).json({ message: 'Error creando noticia' });
    }
});

app.put('/api/noticias/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin requerido' });

    const {
        title, titulo,
        content, contenido,
        image, imagen_url,
        subtitle, subtitulo,
        category, categoria,
        tags, hashtags,
        is_featured, destacada
    } = req.body;

    const finalTitle = title || titulo;
    const finalContent = content || contenido;
    const finalImage = image || imagen_url;
    const finalSubtitle = subtitle || subtitulo;
    const finalCategory = category || categoria;
    const finalTags = tags || hashtags;
    const finalFeatured = is_featured || destacada;

    try {
        // Build dynamic update query
        // This is a bit manual but safe
        await pool.query(
            `UPDATE news SET 
                title = COALESCE($1, title),
                content = COALESCE($2, content),
                image_url = COALESCE($3, image_url),
                subtitle = COALESCE($4, subtitle),
                category = COALESCE($5, category),
                tags = COALESCE($6, tags),
                is_featured = COALESCE($7, is_featured)
             WHERE id = $8`,
            [finalTitle, finalContent, finalImage, finalSubtitle, finalCategory, finalTags, finalFeatured, req.params.id]
        );
        res.json({ message: 'Noticia actualizada' });
    } catch (err) {
        console.error('âŒ Error actualizando noticia:', err);
        res.status(500).json({ message: 'Error actualizando noticia' });
    }
});

app.delete('/api/noticias/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin requerido' });
    try {
        await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
        res.json({ message: 'Noticia eliminada' });
    } catch (err) {
        res.status(500).json({ message: 'Error eliminando' });
    }
});

// ========== SETTINGS (Quiniela, MVP Voting, etc) ==========
// Migration: Ensure settings table exists
(async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS settings (
                    key VARCHAR(100) PRIMARY KEY,
                    value BOOLEAN NOT NULL DEFAULT FALSE,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Insert default settings if they don't exist - TEAM SPECIFIC
            await client.query(`
                INSERT INTO settings (key, value) VALUES 
                ('quiniela_rosa_open', FALSE),
                ('quiniela_negro_open', FALSE),
                ('mvp_rosa_open', FALSE),
                ('mvp_negro_open', FALSE)
                ON CONFLICT (key) DO NOTHING;
            `);

            console.log('âœ… Settings table initialized with team-specific settings');
        } finally {
            client.release();
        }
    } catch (e) {
        console.log('Error initializing settings table:', e.message);
    }
})();

// GET all settings
app.get('/api/settings', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM settings');
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);

        console.log('ðŸ“¤ Settings sent to client:', settings);
        // Prevent caching
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        res.json(settings);
    } catch (err) {
        console.error('âŒ Error getting settings:', err);
        res.status(500).json({ message: 'Error getting settings' });
    }
});

// UPDATE a setting (admin only)
app.put('/api/settings', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin required' });

    const { key, value } = req.body;
    console.log(`ðŸ”„ PUT /api/settings received: key=${key}, value=${value} (type: ${typeof value})`);

    // Validate key is one of the allowed settings
    const allowedKeys = ['quiniela_rosa_open', 'quiniela_negro_open', 'mvp_rosa_open', 'mvp_negro_open'];
    if (!allowedKeys.includes(key)) {
        console.warn(`âš ï¸ Invalid setting key attempt: ${key}`);
        return res.status(400).json({ message: 'Invalid setting key: ' + key });
    }

    if (typeof value !== 'boolean') {
        console.warn(`âš ï¸ Invalid setting value type: ${typeof value}`);
        return res.status(400).json({ message: 'Value must be boolean' });
    }

    try {
        // Use EXCLUDED.value for cleaner UPSERT semantics
        const result = await pool.query(`
            INSERT INTO settings (key, value, updated_at) 
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (key) 
            DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [key, value]);

        console.log(`âœ… Setting saved to DB:`, result.rows[0]);
        res.json({ message: 'Setting updated', key, value, db_record: result.rows[0] });
    } catch (err) {
        console.error('âŒ Error updating setting in DB:', err);
        res.status(500).json({ message: 'Error updating setting' });
    }
});

// ========== MATCHES (Quiniela/Partidos) ==========
// GET all matches
app.get('/api/matches', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                id,
                team_type,
                competition,
                home_team,
                visitor_team,
                match_date,
                logo_home,
                logo_visitor,
                result_home,
                result_visitor,
                CASE 
                    WHEN match_date > NOW() THEN true
                    ELSE false
                END as "isOpen"
            FROM matches
            ORDER BY match_date DESC
        `);

        console.log(`ðŸ“¤ Matches sent to client: ${rows.length} partidos`);
        res.json(rows);
    } catch (err) {
        console.error('âŒ Error getting matches:', err);
        res.status(500).json({ message: 'Error getting matches' });
    }
});


// ========== VOTING SYSTEM (Quiniela & MVP) ==========

// Init Voting Tables
(async () => {
    try {
        const client = await pool.connect();
        try {
            // Table: quinielas
            await client.query(`
                CREATE TABLE IF NOT EXISTS quinielas (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    match_id INTEGER REFERENCES matches(id),
                    home_score INTEGER,
                    visitor_score INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, match_id)
                );
            `);

            // Table: mvp_votes
            await client.query(`
                CREATE TABLE IF NOT EXISTS mvp_votes (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    match_id INTEGER REFERENCES matches(id),
                    player_name VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, match_id)
                );
            `);
            console.log('âœ… Voting tables (quinielas, mvp_votes) initialized');
        } finally {
            client.release();
        }
    } catch (e) {
        console.log('Error initializing voting tables:', e.message);
    }
})();

// POST /api/quiniela - Submit Match Prediction
app.post('/api/quiniela', verifyToken, async (req, res) => {
    const { match_id, home_score, visitor_score } = req.body;
    const user_id = req.user.sub;

    if (!match_id || home_score === undefined || visitor_score === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // 1. Check if already voted
        const existing = await pool.query('SELECT id FROM quinielas WHERE user_id = $1 AND match_id = $2', [user_id, match_id]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'âš ï¸ Ya has enviado tu pronÃ³stico para este partido. No se permiten ediciones.' });
        }

        // 2. Insert new vote
        await pool.query(`
            INSERT INTO quinielas (user_id, match_id, home_score, visitor_score, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [user_id, match_id, home_score, visitor_score]);

        console.log(`âœ… Quiniela submitted by user ${user_id} for match ${match_id}: ${home_score}-${visitor_score}`);
        res.json({ message: 'Quiniela guardada correctamente' });
    } catch (err) {
        console.error('âŒ Error saving quiniela:', err);
        res.status(500).json({ message: 'Error al guardar la quiniela' });
    }

});

// GET /api/quiniela/my-predictions - Get User's Predictions
app.get('/api/quiniela/my-predictions', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT match_id, home_score, visitor_score FROM quinielas WHERE user_id = $1', [req.user.sub]);
        res.json(rows);
    } catch (err) {
        console.error('âŒ Error getting user predictions:', err);
        res.status(500).json({ message: 'Error obteniendo predicciones' });
    }
});

// GET /api/mvp/my-votes - Get User's MVP Votes
app.get('/api/mvp/my-votes', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT match_id, player_name FROM mvp_votes WHERE user_id = $1', [req.user.sub]);
        res.json(rows);
    } catch (err) {
        console.error('âŒ Error getting user mvp votes:', err);
        res.status(500).json({ message: 'Error obteniendo votos MVP' });
    }
});

// POST /api/mvp - Submit MVP Vote
app.post('/api/mvp', verifyToken, async (req, res) => {
    const { match_id, player_name } = req.body;
    const user_id = req.user.sub;

    if (!match_id || !player_name) {
        return res.status(400).json({ message: 'Missing match_id or player_name' });
    }

    try {
        // 1. Check if already voted
        const existing = await pool.query('SELECT id FROM mvp_votes WHERE user_id = $1 AND match_id = $2', [user_id, match_id]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'âš ï¸ Ya has votado al MVP de este partido.' });
        }

        await pool.query(`
            INSERT INTO mvp_votes (user_id, match_id, player_name, created_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [user_id, match_id, player_name]);

        console.log(`âœ… MVP Vote by user ${user_id} for match ${match_id}: ${player_name}`);
        res.json({ message: 'Voto MVP guardado correctamente' });
    } catch (err) {
        console.error('âŒ Error saving MVP vote:', err);
        res.status(500).json({ message: 'Error al guardar voto MVP' });
    }
});

// GET /api/admin/votes - Get All Votes (Admin Only) with Real User Names
app.get('/api/admin/votes', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin required' });

    try {
        // Query to get Quinielas + User Info + Match Info
        const quinielasResult = await pool.query(`
            SELECT 
                q.match_id,
                q.home_score,
                q.visitor_score,
                u.username,
                u.nombre,
                u.apellidos,
                m.home_team,
                m.visitor_team,
                'Quiniela' as type
            FROM quinielas q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN matches m ON q.match_id = m.id
            ORDER BY q.created_at DESC
        `);

        // Query to get MVP Votes + User Info + Match Info
        const mvpResult = await pool.query(`
            SELECT 
                v.match_id,
                v.player_name as voted_value,
                u.username,
                u.nombre,
                u.apellidos,
                m.home_team,
                m.visitor_team,
                'MVP' as type
            FROM mvp_votes v
            LEFT JOIN users u ON v.user_id = u.id
            LEFT JOIN matches m ON v.match_id = m.id
            ORDER BY v.created_at DESC
        `);

        // Helper to format name
        const formatName = (row) => {
            // User requested explicit username
            return row.username || 'Usuario desconocido';
        };

        const quinielas = quinielasResult.rows.map(row => ({
            ...row,
            nombre_completo: formatName(row)
        }));

        const mvp_votes = mvpResult.rows.map(row => ({
            ...row,
            nombre_completo: formatName(row)
        }));

        res.json({ quinielas, mvp_votes });

    } catch (err) {
        console.error('âŒ Error getting admin votes:', err);
        res.status(500).json({ message: 'Error getting votes' });
    }
});


// ========== UPLOAD IMÃGENES (Multer) ==========
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'img-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No se subiÃ³ imagen' });
    // Devolvemos la URL pÃºblica (relativa o absoluta)
    // Como servimos /uploads estÃ¡tico:
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// ========== GESTIÃ“N USUARIOS (ADMIN) ==========
app.get('/api/admin/users', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
