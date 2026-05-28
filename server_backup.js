
// backend/server.js - CLEAN REBUILD
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// -- RATE LIMITING --
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests from this IP.'
});
app.use('/api/', limiter);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER');
const PORT = process.env.PORT || 80;

console.log(`🔌 INIT SERVER PORT: ${PORT}`);

// CONFIG
const JWT_SECRET = process.env.JWT_SECRET || 'MI_SECRETA_SUPER_SPBASKET_2024';

// Middlewares
app.use(cors());
app.use(express.json());

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB POOL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:PinguinoBasket123!@localhost:5432/spbasket'
});

// Init DB Tables
const initDB = async () => {
    try {
        const client = await pool.connect();
        try {
            console.log('📦 PG Connected. Checking tables...');
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
            console.log('✅ Tables verified.');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ DB Error:', err);
    }
};

initDB();



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
    try {
        const { rows } = await pool.query('SELECT id, username, email, rol, nombre, apellidos FROM users ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

app.post('/api/admin/users', verifyToken, async (req, res) => {
    // Crear usuario desde admin
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
    const { username, password, rol, email, nombre, apellidos } = req.body;
    try {
        const hash = bcrypt.hashSync(password, 10);
        await pool.query(
            'INSERT INTO users (username, password, rol, email, nombre, apellidos) VALUES ($1, $2, $3, $4, $5, $6)',
            [username, hash, rol || 'user', email, nombre, apellidos]
        );
        res.json({ message: 'Usuario creado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creando usuario' });
    }
});

app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: 'Usuario eliminado' });
    } catch (error) { res.status(500).json({ message: 'Error' }); }
});

app.put('/api/admin/users/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
    const { rol, email, nombre, apellidos } = req.body; // se podrÃ­an editar mÃ¡s cosas
    try {
        await pool.query(
            'UPDATE users SET rol=$1, email=$2, nombre=$3, apellidos=$4 WHERE id=$5',
            [rol, email, nombre, apellidos, req.params.id]
        );
        res.json({ message: 'Usuario actualizado' });
    } catch (error) { res.status(500).json({ message: 'Error' }); }
});

// ========== RESERVAS DE PRODUCTOS (CARRITO) ==========
(async () => {
    try {
        const client = await pool.connect();
        try {
            // CHEQUEO DE SEGURIDAD: TABLA RESERVATIONS V2 (Nueva tabla para asegurar schema limpio)
            await client.query(`
                CREATE TABLE IF NOT EXISTS reservations_v2 (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    guest_name VARCHAR(255),
                    guest_phone VARCHAR(50),
                    guest_email VARCHAR(255),
                    message TEXT,
                    items JSONB NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                )
            `);
            console.log('âœ… Tabla RESERVATIONS V2 verificada');
        } finally { client.release(); }
    } catch (err) { console.warn('âš ï¸ Error init reservations:', err.message); }
})();

// ========== VISITAS ==========
app.post('/api/visits', async (req, res) => {
    try {
        const { userId, path } = req.body;
        // Obtener IP (considerando proxies)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        // Si userId viene y es vÃ¡lido/parseable, lo usamos, si no NULL
        const validUserId = (userId && !isNaN(userId)) ? parseInt(userId) : null;

        await pool.query(
            'INSERT INTO site_visits (user_id, ip_address, user_agent, path) VALUES ($1, $2, $3, $4)',
            [validUserId, ip, userAgent, path || '/']
        );
        res.json({ message: 'Visit recorded' });
    } catch (err) {
        // No fallar visiblemente si el log de visita falla
        console.error('Error logging visit:', err.message);
        res.json({ ok: false });
    }
});

app.get('/api/visits/count', async (req, res) => {
    try {
        // Ejemplo simple: contar total
        const { rows } = await pool.query('SELECT COUNT(*) as total FROM site_visits');
        res.json({ total: parseInt(rows[0].total) });
    } catch (err) {
        res.status(500).json({ message: 'Error getting visits' });
    }
});

// ========== EMAIL TRANSPORTER (Global) ==========
const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.es',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'comunicacion@saskipenguins.com',
        pass: 'Saskipenguins2o24@'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify SMTP connection on startup
transporter.verify(function (error, success) {
    if (error) {
        console.error('âŒ Error SMTP al inicio:', error);
    } else {
        console.log('âœ… Servidor SMTP listo para enviar correos (comunicacion@saskipenguins.com)');
    }
});

// ROUTE: TEST EMAIL (Debug)
app.get('/api/test-email', async (req, res) => {
    try {
        console.log('ðŸ§ª Testing Email via Endpoint...');
        const info = await transporter.sendMail({
            from: '"Test Debug" <comunicacion@saskipenguins.com>',
            to: 'comunicacion@saskipenguins.com',
            subject: 'Test Email Server SP Basket',
            text: 'Si recibes esto, el servidor puede enviar correos correctamente desde la IP de despliegue.'
        });
        res.json({ success: true, message: 'Email enviado', info });
    } catch (err) {
        console.error('âŒ Test Email Failed:', err);
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

// ========== MEDICAL RECOGNITION (RECONOCIMIENTOS) ==========
// 1. Table Init (Merged)
(async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS reconocimientos_medicos (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    nombre VARCHAR(100),
                    apellido VARCHAR(100),
                    email VARCHAR(255),
                    licencia VARCHAR(100),
                    archivo_url VARCHAR(255),
                    estado VARCHAR(50) DEFAULT 'pendiente',
                    mensaje_admin TEXT,
                    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    fecha_validacion TIMESTAMP,
                    validado_por INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                
                CREATE TABLE IF NOT EXISTS system_settings (
                    key VARCHAR(50) PRIMARY KEY,
                    value JSONB NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                -- Insert default if not exists
                INSERT INTO system_settings (key, value) VALUES ('medical_active', 'false') ON CONFLICT DO NOTHING;

                CREATE TABLE IF NOT EXISTS club_documents (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(150),
                    description TEXT,
                    file_url VARCHAR(255),
                    is_active BOOLEAN DEFAULT false,
                    coming_soon BOOLEAN DEFAULT false,
                    position INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- SEED DATA (Only if empty to avoid duplicates on restart)
                INSERT INTO club_documents (title, description, is_active, coming_soon, position)
                SELECT * FROM (VALUES 
                    ('ActuaciÃ³n ante Lesiones', 'Protocolo de actuaciÃ³n en caso de lesiones durante entrenamientos y partidos.', true, true, 1),
                    ('Pago Ficha Deportiva', 'InformaciÃ³n sobre el proceso de pago de la ficha deportiva y cuotas mensuales.', true, true, 2),
                    ('Normativa Interna', 'Reglamento interno del club y normas de conducta para jugadores y familias.', true, true, 3),
                    ('Calendario de Entrenamientos', 'Horarios y ubicaciones de los entrenamientos de todos los equipos.', true, true, 4),
                    ('AutorizaciÃ³n Menores', 'Formulario de autorizaciÃ³n para menores de edad.', true, true, 5),
                    ('Seguro Deportivo', 'InformaciÃ³n sobre la cobertura del seguro deportivo del club.', true, true, 6)
                ) AS v(t, d, a, c, p)
                WHERE NOT EXISTS (SELECT 1 FROM club_documents);
            `);
            console.log('âœ… Tablas Reconocimientos y Settings verificadas');
        } finally { client.release(); }
    } catch (err) { console.warn('âš ï¸ Error init reconocimientos:', err.message); }
})();

// 2. Upload Storage
const storageRecon = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads/reconocimientos');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Safe filename with timestamp
        cb(null, `recon-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    }
});
const uploadRecon = multer({
    storage: storageRecon,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Solo se permiten archivos PDF'));
    }
});

// Storage for Club Documents
const storageDocs = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads/documentacion');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `doc-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    }
});
const uploadDocs = multer({
    storage: storageDocs,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});


// ========== SETTINGS ROUTES (New) ==========
app.get('/api/settings/:key', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT value FROM system_settings WHERE key = $1', [req.params.key]);
        if (rows.length === 0) return res.json({ value: null });
        res.json({ value: rows[0].value });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving setting' });
    }
});

app.post('/api/settings/:key', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Only admin' });
    try {
        const { value } = req.body; // Expect raw value (boolean/string/obj)
        // Store as boolean/jsonb properly
        await pool.query(
            'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            [req.params.key, JSON.stringify(value)]
        );
        res.json({ message: 'Setting updated', value });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating setting' });
    }
});


// ========== CLUB DOCUMENTS ROUTES ==========
// GET - List all documents
app.get('/api/documents', async (req, res) => {
    try {
        let query = 'SELECT * FROM club_documents ORDER BY position ASC, created_at DESC';
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error loading documents' });
    }
});

// POST - Upload Document (Admin)
app.post('/api/documents', verifyToken, uploadDocs.single('file'), async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Only admin' });

    const { title, description, coming_soon, is_active } = req.body;
    // file might be optional if "coming_soon" is true
    const fileUrl = req.file ? `/uploads/documentacion/${req.file.filename}` : null;

    try {
        await pool.query(
            `INSERT INTO club_documents (title, description, file_url, is_active, coming_soon) 
             VALUES ($1, $2, $3, $4, $5)`,
            [title, description, fileUrl, is_active === 'true', coming_soon === 'true']
        );
        res.json({ message: 'Documento creado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creando documento' });
    }
});

// PUT - Update Status/Details (Admin)
app.put('/api/documents/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Only admin' });

    const { id } = req.params;
    const { is_active, coming_soon } = req.body;

    try {
        await pool.query(
            `UPDATE club_documents SET is_active = $1, coming_soon = $2 WHERE id = $3`,
            [is_active, coming_soon, id]
        );
        res.json({ message: 'Estado actualizado' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating document' });
    }
});

// DELETE - Remove Document (Admin)
app.delete('/api/documents/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Only admin' });
    try {
        await pool.query('DELETE FROM club_documents WHERE id = $1', [req.params.id]);
        res.json({ message: 'Documento eliminado' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting document' });
    }
});

// 3. POST - Upload Recognition
app.post('/api/reconocimientos', verifyToken, uploadRecon.single('archivo'), async (req, res) => {
    // Check if active (ignore for admin)
    if (req.user.rol !== 'admin') {
        const { rows } = await pool.query("SELECT value FROM system_settings WHERE key = 'medical_active'");
        let isActive = false;
        if (rows.length > 0) {
            isActive = (rows[0].value === true || rows[0].value === 'true');
        }

        if (!isActive) return res.status(403).json({ message: 'El periodo de envÃ­o de reconocimientos mÃ©dicos estÃ¡ cerrado.' });
    }

    if (!req.file) return res.status(400).json({ message: 'No se subiÃ³ ningÃºn archivo PDF' });

    const { nombre, apellido, email, licencia } = req.body;
    const userId = req.user.sub;
    const fileUrl = `/uploads/reconocimientos/${req.file.filename}`;

    try {
        // Save to DB
        await pool.query(
            `INSERT INTO reconocimientos_medicos (user_id, nombre, apellido, email, licencia, archivo_url)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, nombre, apellido, email, licencia, fileUrl]
        );

        // Notify Admin (Email)
        const emailBody = `
            NUEVO RECONOCIMIENTO MÃ‰DICO SUBIDO
            ------------------------------------------------
            Usuario: ${nombre} ${apellido} (ID: ${userId})
            Email: ${email}
            Licencia: ${licencia || 'N/A'}
            
            Puedes revisarlo en la secciÃ³n de administraciÃ³n de la web.
        `;

        transporter.sendMail({
            from: '"SP Basket Sistema" <comunicacion@saskipenguins.com>',
            to: 'comunicacion@saskipenguins.com',
            subject: `ðŸ¥ Nuevo Reconocimiento MÃ©dico - ${nombre} ${apellido}`,
            text: emailBody
        }).catch(e => console.error('Error email admin recon:', e));

        res.json({ message: 'Reconocimiento subido correctamente' });

    } catch (err) {
        console.error('Error saving reconocimiento:', err);
        res.status(500).json({ message: 'Error al guardar el reconocimiento' });
    }
});

// 4. GET - List Recognitions
app.get('/api/reconocimientos', verifyToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM reconocimientos_medicos';
        let params = [];

        // If not admin, only show own records
        if (req.user.rol !== 'admin') {
            query += ' WHERE user_id = $1';
            params.push(req.user.sub);
        }

        query += ' ORDER BY fecha_subida DESC';

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error listing reconocimientos:', err);
        res.status(500).json({ message: 'Error obteniendo lista' });
    }
});

// 5. PUT - Update Status (Admin)
app.put('/api/reconocimientos/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });

    const { estado, mensaje } = req.body; // estado: 'validado' | 'rechazado'
    const reconId = req.params.id;

    try {
        // Get user email first
        const reconResult = await pool.query('SELECT * FROM reconocimientos_medicos WHERE id = $1', [reconId]);
        if (reconResult.rows.length === 0) return res.status(404).json({ message: 'No encontrado' });
        const recon = reconResult.rows[0];

        // Update DB
        await pool.query(
            `UPDATE reconocimientos_medicos 
             SET estado = $1, mensaje_admin = $2, fecha_validacion = CURRENT_TIMESTAMP, validado_por = $3
             WHERE id = $4`,
            [estado, mensaje, req.user.sub, reconId]
        );

        // Notify User (Email)
        const isApproved = estado === 'validado';
        const subject = isApproved
            ? `âœ… Reconocimiento MÃ©dico Validado - SP Basket`
            : `âŒ Reconocimiento MÃ©dico Rechazado - SP Basket`;

        const emailBody = `
            Hola ${recon.nombre},

            Tu reconocimiento mÃ©dico ha sido ${isApproved ? 'VALIDADO' : 'RECHAZADO'} por el administrador.

            ${isApproved ? 'Todo estÃ¡ correcto. Â¡Gracias!' : 'Motivo del rechazo:\n' + mensaje}

            ------------------------------------------------
            Saski Penguins Basket
        `;

        transporter.sendMail({
            from: '"SP Basket Admin" <comunicacion@saskipenguins.com>',
            to: recon.email,
            subject: subject,
            text: emailBody
        }).catch(e => console.error('Error email user recon:', e));

        res.json({ message: `Reconocimiento ${estado}` });

    } catch (err) {
        console.error('Error updating reconocimiento:', err);
        res.status(500).json({ message: 'Error actualizando estado' });
    }
});


// ========== RESERVAS ----------
app.post('/api/products/reserve', async (req, res) => {
    try {
        const { cart, contact } = req.body;

        // Validar
        if (!cart || cart.length === 0) return res.status(400).json({ message: 'El carrito estÃ¡ vacÃ­o' });
        if (!contact || !contact.phone) return res.status(400).json({ message: 'El telÃ©fono es obligatorio' });

        // Identificar usuario (opcional)
        let userId = null;
        let userName = contact.name;
        let userEmail = contact.email || 'No especificado';

        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.sub;
                if (!userName) userName = decoded.username;
            } catch (e) { }
        }

        console.log(`ðŸ“ Creando reserva para: ${userName}`);
        const itemsJson = JSON.stringify(cart);

        const { rows } = await pool.query(
            `INSERT INTO reservations_v2 (user_id, guest_name, guest_phone, guest_email, message, items, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
            [userId, userName, contact.phone, userEmail, contact.message, itemsJson]
        );

        const reservationId = rows[0].id;
        console.log(`âœ… Reserva creada ID: ${reservationId}`);

        // FORMATO EMAIL
        const emailBody = `
            NUEVO PEDIDO #${reservationId}
            ------------------------------------------------
            DATOS CLIENTE:
            Nombre: ${userName}
            TelÃ©fono: ${contact.phone}
            Email: ${userEmail}
            Mensaje: ${contact.message || 'Sin mensaje'}
            
            PRODUCTOS:
            ${cart.map(i => {
            let details = `â€¢ ${i.name} (x${i.quantity}) - Talla: ${i.size || 'Ãšnica'}`;
            const extras = [];
            if (i.customNumber) extras.push(`Dorsal: ${i.customNumber}`);
            if (i.customName) extras.push(`Nombre: ${i.customName}`);
            if (extras.length > 0) details += `\n   â†ª PersonalizaciÃ³n: ${extras.join(', ')}`;
            return details;
        }).join('\n')}
            
            ------------------------------------------------
            TOTAL ARTÃCULOS: ${cart.length}
        `;

        // ENVIAR EMAIL ASÃNCRONO (No bloquea respuesta)
        transporter.sendMail({
            from: '"SP Basket Tienda" <comunicacion@saskipenguins.com>',
            to: 'comunicacion@saskipenguins.com', // Envia a tienda
            cc: userEmail !== 'No especificado' ? userEmail : null, // Copia al cliente si hay email
            subject: `ðŸ€ Nuevo Pedido #${reservationId} - ${userName}`,
            text: emailBody
        }).then(info => {
            console.log(`ðŸ“§ Email enviado exitosamente: ${info.messageId}`);
        }).catch(err => {
            console.error(`âŒ Fallo envÃ­o email pedido #${reservationId}:`, err);
        });

        res.json({
            message: 'Pedido realizado con Ã©xito. Te contactaremos pronto.',
            id: reservationId
        });

    } catch (e) {
        console.error('Error reserving:', e);
        res.status(500).json({ message: 'Error procesando la reserva' });
    }
});

// ========== CONTACT FORM ==========
// ========== CONTACT FORM ==========
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, age, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Todos los campos requeridos (nombre, email, mensaje) son obligatorios.' });
        }

        console.log(`ðŸ“¨ Recibido mensaje de contacto:`, { name, email, age });

        const emailBody = `
            NUEVO MENSAJE DE CONTACTO
            ------------------------------------------------
            Nombre: ${name}
            Email: ${email}
            Edad: ${age || 'No especificada'}
            
            Mensaje:
            ${message}
            ------------------------------------------------
        `;

        console.log('ðŸ“¤ Intentando enviar email a comunicacion@saskipenguins.com via transporter...');

        // Send Email (Async pattern matching products)
        transporter.sendMail({
            from: '"Formulario Contacto" <comunicacion@saskipenguins.com>',
            to: 'comunicacion@saskipenguins.com',
            cc: email, // Optional: send copy to user like in products? Maybe just to keep consistent
            subject: `ðŸ“© Nuevo Mensaje de Contacto - ${name}`,
            text: emailBody
        }).then(info => {
            console.log(`âœ… Contact form email sent: ${info.messageId}`);
        }).catch(err => {
            console.error('âŒ Error sending contact email:', err);
        });

        // Respond immediately
        res.json({ message: 'Mensaje enviado correctamente' });

    } catch (err) {
        console.error('âŒ Error in contact endpoint:', err);
        res.status(500).json({ message: 'Error al procesar el mensaje.' });
    }
});

// ========== VISIT TRACKING ==========
// Store active users (simple in-memory tracking)
const activeUsers = new Map(); // sessionId -> { lastSeen: timestamp, ip: string }
const ACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// Clean up inactive users every minute
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, data] of activeUsers.entries()) {
        if (now - data.lastSeen > ACTIVE_THRESHOLD) {
            activeUsers.delete(sessionId);
        }
    }
}, 60 * 1000);

// Register/update visit
app.post('/api/visits', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        // Update active users
        if (sessionId) {
            activeUsers.set(sessionId, {
                lastSeen: Date.now(),
                ip: ip
            });
        }

        // Increment total visits in database
        await pool.query(`
            INSERT INTO site_visits (ip_address, visited_at) 
            VALUES ($1, NOW())
        `, [ip]);

        res.json({ success: true });
    } catch (err) {
        console.error('Error logging visit:', err);
        res.status(500).json({ message: 'Error logging visit' });
    }
});

// Get total visits count
app.get('/api/visits/count', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT COUNT(*) as total FROM site_visits');
        res.json({ total: parseInt(rows[0].total) || 0 });
    } catch (err) {
        console.error('Error getting visits:', err);
        res.status(500).json({ message: 'Error getting visits' });
    }
});

// Get active users count
app.get('/api/visits/active', (req, res) => {
    try {
        res.json({ active: activeUsers.size });
    } catch (err) {
        console.error('Error getting active users:', err);
        res.status(500).json({ message: 'Error getting active users' });
    }
});


// ========== COMPETITION DATA ENDPOINTS ==========

// GET /api/competition/clasificacion/:teamId
app.get('/api/competition/clasificacion/:teamId', async (req, res) => {
    const teamId = req.params.teamId.toLowerCase().replace(/ /g, '-').trim();
    try {
        const { rows } = await pool.query('SELECT * FROM competition_standings WHERE team_id = $1 ORDER BY position ASC', [teamId]);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo clasificación:', error);
        res.status(500).json({ message: 'Error obteniendo clasificación' });
    }
});

// GET /api/competition/partidos/:teamId
app.get('/api/competition/partidos/:teamId', async (req, res) => {
    const teamId = req.params.teamId.toLowerCase().replace(/ /g, '-').trim();
    try {
        const { rows } = await pool.query('SELECT * FROM competition_matches WHERE team_id = $1 ORDER BY round ASC', [teamId]);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo partidos:', error);
        res.status(500).json({ message: 'Error obteniendo partidos' });
    }
});

// GET /api/competition/info/:teamId
app.get('/api/competition/info/:teamId', async (req, res) => {
    const teamId = req.params.teamId.toLowerCase().replace(/ /g, '-').trim();
    try {
        const { rows } = await pool.query('SELECT * FROM competition_info WHERE team_id = $1', [teamId]);
        if (rows.length === 0) {
            return res.json({ teamId, title: 'Competición ' + teamId.toUpperCase(), season: '2025/2026' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('❌ Error obteniendo info:', error);
        res.status(500).json({ message: 'Error obteniendo info' });
    }
});

// GET /api/competition/complete/:teamId
app.get('/api/competition/complete/:teamId', async (req, res) => {
    const teamId = req.params.teamId.toLowerCase().replace(/ /g, '-').trim();
    try {
        const [clas, part, info] = await Promise.all([
            pool.query('SELECT * FROM competition_standings WHERE team_id = $1 ORDER BY position ASC', [teamId]),
            pool.query('SELECT * FROM competition_matches WHERE team_id = $1 ORDER BY round ASC', [teamId]),
            pool.query('SELECT * FROM competition_info WHERE team_id = $1', [teamId])
        ]);
        res.json({
            teamId,
            info: info.rows[0] || { title: 'Competición ' + teamId.toUpperCase(), season: '2025/2026' },
            clasificacion: clas.rows,
            partidos: part.rows
        });
    } catch (error) {
        console.error('❌ Error obteniendo datos completos:', error);
        res.status(500).json({
            message: 'Error obteniendo datos',
            error: error.message,
            detail: error.detail
        });
    }
});

/* --- LIVE SCRAPER CON CACHE (24h) --- */
let scrapeLive;
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

// GET /api/competition/sync
app.post('/api/competition/sync', async (req, res) => {
    res.status(501).json({ message: 'Endpoint en mantenimiento' });
});

// POST /api/admin/update-competition - Actualizar datos manualmente
app.post('/api/admin/update-competition', verifyToken, async (req, res) => {
    try {
        const { teamId, clasificacion, partidos } = req.body;

        if (!teamId || !clasificacion || !partidos) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        // Verificar que es admin
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Limpiar datos antiguos
            await client.query('DELETE FROM competition_standings WHERE team_id = $1', [teamId]);
            await client.query('DELETE FROM competition_matches WHERE team_id = $1', [teamId]);

            // Insertar clasificación
            for (const standing of clasificacion) {
                const pointsDiff = standing.points_for - standing.points_against;
                await client.query(`
                    INSERT INTO competition_standings 
                    (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    teamId,
                    standing.position,
                    standing.team_name,
                    standing.played,
                    standing.won,
                    standing.lost,
                    standing.points_for,
                    standing.points_against,
                    pointsDiff,
                    standing.points
                ]);
            }

            // Insertar partidos
            for (const match of partidos) {
                await client.query(`
                    INSERT INTO competition_matches 
                    (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    teamId,
                    match.round,
                    match.match_date,
                    match.match_time,
                    match.home_team,
                    match.away_team,
                    match.home_score,
                    match.away_score,
                    match.location,
                    match.status
                ]);
            }

            await client.query('COMMIT');
            console.log(`✅ Datos actualizados manualmente para ${teamId} por ${req.user.username}`);

            res.json({
                message: 'Datos actualizados correctamente',
                teamId,
                clasificacionCount: clasificacion.length,
                partidosCount: partidos.length
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error actualizando competición:', error);
        res.status(500).json({
            message: 'Error actualizando datos',
            error: error.message
        });
    }
});


// SERVIR ENDPOINTS FINALES
app.use('/assets', express.static(path.join(__dirname, '../dist/sp-basket/browser/assets')));
app.use(express.static(path.join(__dirname, '../dist/sp-basket/browser')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/sp-basket/browser/index.html')));

app.listen(PORT, () => console.log('Server running on port ' + PORT));
