
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
const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
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

// REGISTER
app.post('/api/register', async (req, res) => {
    console.log('📝 Intento de registro:', req.body.username, req.body.email);
    console.log('📝 Intento de registro BODY:', JSON.stringify(req.body));
    const { username, password, email, nombre, apellidos } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Faltan campos obligatorios: usuario, contraseña y email.' });
    }

    try {
        const check = await pool.query('SELECT username, email FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (check.rows.length > 0) {
            const hasUser = check.rows.some(r => r.username === username);
            const hasEmail = check.rows.some(r => r.email === email);

            if (hasUser && hasEmail) return res.status(400).json({ message: 'El usuario y el email ya están registrados.' });
            if (hasUser) return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
            if (hasEmail) return res.status(400).json({ message: 'El email ya está en uso.' });
        }

        const hash = bcrypt.hashSync(password, 10);
        const { rows } = await pool.query(
            'INSERT INTO users (username, password, email, nombre, apellidos, rol) VALUES ($1, $2, $3, $4, $5, \'user\') RETURNING id',
            [username, hash, email, nombre, apellidos]
        );
        console.log('✅ Usuario registrado:', rows[0].id);
        res.json({ message: 'Usuario registrado correctamente', id: rows[0].id });
    } catch (err) {
        console.error('❌ Error registrando usuario:', err);
        res.status(500).json({ message: 'Error interno en el servidor: ' + err.message });
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

            // Tabla de notificaciones para todos
            await client.query(`
                CREATE TABLE IF NOT EXISTS admin_notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NULL,
                    type VARCHAR(50) NOT NULL DEFAULT 'order',
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    reference_id INTEGER,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            // Asegurar que existe user_id si ya se creÃ³ antes sin Ã©l
            try { await client.query('ALTER TABLE admin_notifications ADD COLUMN user_id INTEGER NULL'); } catch (e) { }
            console.log('âœ… Tabla ADMIN_NOTIFICATIONS verificada');
        } finally { client.release(); }
    } catch (err) { console.warn('âš ï¸ Error init reservations:', err.message); }
})();

// ========== ADVANCED ANALYTICS & VISITS ==========
// Migration: Sessions & Events
(async () => {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS analytics_sessions (
                    session_id VARCHAR(50) PRIMARY KEY,
                    user_id INTEGER,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    referrer TEXT,
                    device_type VARCHAR(20),
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    total_duration INTEGER DEFAULT 0, -- seconds
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS analytics_events (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(50) NOT NULL,
                    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'click', 'heartbeat'
                    page_path TEXT,
                    event_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES analytics_sessions(session_id) ON DELETE CASCADE
                );

                -- Index for performance
                CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
                CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events(created_at);
            `);
            console.log('✅ Analytics Tables Verified');
        } finally { client.release(); }
    } catch (err) { console.error('❌ Analytics Migration Error:', err); }
})();

// Endpoint to track events / visits
app.post('/api/analytics/track', async (req, res) => {
    const { sessionId, eventType, path, userId, referrer } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || '';

    // Determine device type simple
    let device = 'Desktop';
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet/i.test(ua)) device = 'Tablet';

    try {
        // 1. Ensure/Update Session
        const sessionCheck = await pool.query('SELECT started_at, last_activity FROM analytics_sessions WHERE session_id = $1', [sessionId]);

        if (sessionCheck.rows.length === 0) {
            // New Session
            await pool.query(
                `INSERT INTO analytics_sessions (session_id, user_id, ip_address, user_agent, referrer, device_type) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [sessionId, userId || null, ip, ua, referrer || '', device]
            );
        } else {
            // Update Activity & Calculate Duration
            const now = new Date();
            const startedAt = new Date(sessionCheck.rows[0].started_at);
            const duration = Math.round((now - startedAt) / 1000);

            await pool.query(
                `UPDATE analytics_sessions SET last_activity = NOW(), total_duration = $1 WHERE session_id = $2`,
                [duration, sessionId]
            );
        }

        // 2. Log Specific Event
        if (eventType !== 'heartbeat') {
            await pool.query(
                `INSERT INTO analytics_events (session_id, event_type, page_path) VALUES ($1, $2, $3)`,
                [sessionId, eventType, path || '/']
            );
        }

        res.json({ ok: true });
    } catch (err) {
        console.error('Analytics Error:', err.message);
        res.status(500).json({ error: 'Internal error' });
    }
});

// Admin Stats Endpoint - COMPREHENSIVE
app.get('/api/admin/analytics/overview', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Admin only' });

    try {
        console.log('📊 COMPREHENSIVE Analytics request from:', req.user.username);
        const response = {};

        // ==================== TRÁFICO & AUDIENCIA ====================
        response.traffic = {};

        // Total de sesiones
        try {
            const r = await pool.query('SELECT COUNT(*) as total FROM analytics_sessions');
            response.traffic.totalSessions = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.traffic.totalSessions = 0; }

        // Total de vistas de página
        try {
            const r = await pool.query("SELECT COUNT(*) as total FROM analytics_events WHERE event_type = 'page_view'");
            response.traffic.totalPageViews = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.traffic.totalPageViews = 0; }

        // Usuarios activos (últimos 5 min)
        try {
            const r = await pool.query("SELECT COUNT(*) as active FROM analytics_sessions WHERE last_activity > NOW() - INTERVAL '5 minutes'");
            response.traffic.activeNow = parseInt(r.rows[0]?.active || 0);
        } catch (e) { response.traffic.activeNow = 0; }

        // Usuarios activos hoy
        try {
            const r = await pool.query("SELECT COUNT(*) as active FROM analytics_sessions WHERE started_at::date = CURRENT_DATE");
            response.traffic.activeToday = parseInt(r.rows[0]?.active || 0);
        } catch (e) { response.traffic.activeToday = 0; }

        // Duración media de sesión
        try {
            const r = await pool.query('SELECT AVG(total_duration) as avg FROM analytics_sessions WHERE total_duration > 0');
            response.traffic.avgDuration = Math.round(parseFloat(r.rows[0]?.avg || 0));
        } catch (e) { response.traffic.avgDuration = 0; }

        // Páginas por sesión
        try {
            const r = await pool.query(`
                SELECT AVG(page_count) as avg FROM (
                    SELECT session_id, COUNT(*) as page_count 
                    FROM analytics_events 
                    WHERE event_type = 'page_view' 
                    GROUP BY session_id
                ) subquery
            `);
            response.traffic.pagesPerSession = parseFloat(r.rows[0]?.avg || 0).toFixed(1);
        } catch (e) { response.traffic.pagesPerSession = 0; }

        // Visitas diarias (últimos 14 días)
        try {
            const r = await pool.query(`
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM analytics_events 
                WHERE event_type = 'page_view' AND created_at > NOW() - INTERVAL '14 days'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);
            response.traffic.dailyVisits = r.rows;
        } catch (e) { response.traffic.dailyVisits = []; }

        // Visitas por hora (hoy)
        try {
            const r = await pool.query(`
                SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
                FROM analytics_events
                WHERE event_type = 'page_view' AND created_at::date = CURRENT_DATE
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hour
            `);
            response.traffic.hourlyToday = r.rows;
        } catch (e) { response.traffic.hourlyToday = []; }

        // ==================== USUARIOS & REGISTROS ====================
        response.users = {};

        // Total usuarios registrados
        try {
            const r = await pool.query('SELECT COUNT(*) as total FROM users');
            response.users.totalRegistered = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.users.totalRegistered = 0; }

        // Nuevos hoy
        try {
            const r = await pool.query("SELECT COUNT(*) as total FROM users WHERE created_at::date = CURRENT_DATE");
            response.users.newToday = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.users.newToday = 0; }

        // Nuevos esta semana
        try {
            const r = await pool.query("SELECT COUNT(*) as total FROM users WHERE created_at > NOW() - INTERVAL '7 days'");
            response.users.newThisWeek = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.users.newThisWeek = 0; }

        // Por rol
        try {
            const r = await pool.query("SELECT rol, COUNT(*) as count FROM users GROUP BY rol");
            response.users.byRole = r.rows;
        } catch (e) { response.users.byRole = []; }

        // Usuarios con reconocimientos médicos
        try {
            const r = await pool.query("SELECT COUNT(DISTINCT user_id) as count FROM reconocimientos_medicos WHERE estado = 'validado'");
            response.users.withMedicalDocs = parseInt(r.rows[0]?.count || 0);
        } catch (e) { response.users.withMedicalDocs = 0; }

        // ==================== DISPOSITIVOS & TECNOLOGÍA ====================
        response.devices = {};

        // Por tipo (Mobile/Desktop/Tablet)
        try {
            const r = await pool.query("SELECT device_type, COUNT(*) as count FROM analytics_sessions GROUP BY device_type");
            response.devices.byType = r.rows;
        } catch (e) { response.devices.byType = []; }

        // Sesiones únicas por dispositivo
        try {
            const r = await pool.query("SELECT COUNT(DISTINCT session_id) as total FROM analytics_sessions");
            response.devices.uniqueSessions = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.devices.uniqueSessions = 0; }

        // ==================== PÁGINAS & CONTENIDO ====================
        response.content = {};

        // Top 10 páginas más visitadas
        try {
            const r = await pool.query(`
                SELECT page_path, COUNT(*) as views
                FROM analytics_events
                WHERE event_type = 'page_view'
                GROUP BY page_path
                ORDER BY views DESC
                LIMIT 10
            `);
            response.content.topPages = r.rows;
        } catch (e) { response.content.topPages = []; }

        // Total de noticias
        try {
            const r = await pool.query('SELECT COUNT(*) as total FROM noticias');
            response.content.totalNews = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.content.totalNews = 0; }

        // Noticias publicadas este mes
        try {
            const r = await pool.query(`
                SELECT COUNT(*) as total FROM noticias 
                WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
            `);
            response.content.newsThisMonth = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.content.newsThisMonth = 0; }

        // Total competiciones
        try {
            const r = await pool.query('SELECT COUNT(*) as total FROM competiciones');
            response.content.totalCompetitions = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.content.totalCompetitions = 0; }

        // Total productos
        try {
            const r = await pool.query('SELECT COUNT(*) as total FROM productos');
            response.content.totalProducts = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.content.totalProducts = 0; }

        // ==================== PAGOS & PAPELETAS ====================
        response.payments = {};

        // Total papeletas
        try {
            const r = await pool.query('SELECT COUNT(*) as total FROM papeletas');
            response.payments.totalTickets = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.payments.totalTickets = 0; }

        // Papeletas pagadas
        try {
            const r = await pool.query('SELECT COUNT(*) as total FROM papeletas WHERE pagado = true');
            response.payments.paidTickets = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.payments.paidTickets = 0; }

        // Papeletas pendientes
        try {
            const r = await pool.query("SELECT COUNT(*) as total FROM papeletas WHERE estado = 'pendiente'");
            response.payments.pendingTickets = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.payments.pendingTickets = 0; }

        // ==================== TIENDA ====================
        response.shop = { totalOrders: 0, pendingOrders: 0, approvedOrders: 0, completedOrders: 0, rejectedOrders: 0, totalProductsSold: 0, recentOrders: [] };

        try {
            const o1 = await pool.query('SELECT COUNT(*) as c FROM reservations_v2');
            response.shop.totalOrders = parseInt(o1.rows[0]?.c || 0);

            const o2 = await pool.query("SELECT COUNT(*) as c FROM reservations_v2 WHERE status = 'pending'");
            response.shop.pendingOrders = parseInt(o2.rows[0]?.c || 0);

            const o3 = await pool.query("SELECT COUNT(*) as c FROM reservations_v2 WHERE status = 'approved'");
            response.shop.approvedOrders = parseInt(o3.rows[0]?.c || 0);

            const o4 = await pool.query("SELECT COUNT(*) as c FROM reservations_v2 WHERE status = 'completed'");
            response.shop.completedOrders = parseInt(o4.rows[0]?.c || 0);

            const o5 = await pool.query("SELECT COUNT(*) as c FROM reservations_v2 WHERE status = 'rejected'");
            response.shop.rejectedOrders = parseInt(o5.rows[0]?.c || 0);

            // Total de productos vendidos
            try {
                const o6 = await pool.query("SELECT items FROM reservations_v2 WHERE status IN ('approved', 'completed', 'pending')");
                let totalProducts = 0;
                o6.rows.forEach(row => {
                    try {
                        const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
                        if (Array.isArray(items)) {
                            items.forEach(item => { totalProducts += (item.quantity || 1); });
                        }
                    } catch (e) { }
                });
                response.shop.totalProductsSold = totalProducts;
            } catch (e) { response.shop.totalProductsSold = 0; }

            // Últimos 5 pedidos
            const o7 = await pool.query('SELECT id, guest_name, status, items, created_at FROM reservations_v2 ORDER BY created_at DESC LIMIT 5');
            response.shop.recentOrders = o7.rows.map(r => ({
                id: r.id,
                name: r.guest_name,
                status: r.status,
                itemCount: (() => { try { const items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items; return Array.isArray(items) ? items.reduce((s, i) => s + (i.quantity || 1), 0) : 0; } catch (e) { return 0; } })(),
                date: r.created_at
            }));
        } catch (e) { }

        // ==================== SISTEMA & RENDIMIENTO ====================
        response.system = {};

        // Uptime del servidor (aproximado desde última sesión)
        try {
            const r = await pool.query('SELECT MIN(started_at) as first FROM analytics_sessions');
            if (r.rows[0]?.first) {
                const uptime = Math.floor((Date.now() - new Date(r.rows[0].first).getTime()) / 1000);
                response.system.uptimeSeconds = uptime;
            } else {
                response.system.uptimeSeconds = 0;
            }
        } catch (e) { response.system.uptimeSeconds = 0; }

        // Total registros en DB
        try {
            const r = await pool.query("SELECT COUNT(*) as total FROM analytics_events");
            response.system.totalEvents = parseInt(r.rows[0]?.total || 0);
        } catch (e) { response.system.totalEvents = 0; }

        console.log('✅ COMPREHENSIVE Analytics compiled successfully');
        res.json(response);
    } catch (err) {
        console.error('❌ Overview Error:', err);
        res.status(500).json({ error: 'Statistics error: ' + err.message });
    }
});

// Legacy /api/visits endpoints (for backward compatibility)
// Legacy /api/visits endpoints (RE-ACTIVATED FOR COMPATIBILITY)
app.post('/api/visits', async (req, res) => {
    const { path, userId } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || '';

    // Generate a simple session ID based on IP + UA + Date (daily session)
    // This allows basic tracking without changing the frontend code
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const crypto = require('crypto');
    const sessionId = crypto.createHash('md5').update(`${ip}-${ua}-${today}`).digest('hex');

    // Determine device type
    let device = 'Desktop';
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet/i.test(ua)) device = 'Tablet';

    try {
        // 1. Ensure Session Exists
        const sessionCheck = await pool.query('SELECT session_id FROM analytics_sessions WHERE session_id = $1', [sessionId]);

        if (sessionCheck.rows.length === 0) {
            // New Session
            await pool.query(
                `INSERT INTO analytics_sessions (session_id, user_id, ip_address, user_agent, referrer, device_type) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [sessionId, userId || null, ip, ua, 'Direct/Legacy', device]
            );
        } else {
            // Update Activity
            await pool.query(
                `UPDATE analytics_sessions SET last_activity = NOW(), user_id = COALESCE($1, user_id) WHERE session_id = $2`,
                [userId || null, sessionId]
            );
        }

        // 2. Log Page View Event
        await pool.query(
            `INSERT INTO analytics_events (session_id, event_type, page_path) VALUES ($1, $2, $3)`,
            [sessionId, 'page_view', path || '/']
        );

        res.json({ ok: true });
    } catch (err) {
        console.error('Visit logging error:', err.message);
        // Don't fail the request to the user
        res.json({ ok: true, error: 'Log failed' });
    }
});

app.get('/api/visits/count', async (req, res) => {
    try {
        // Return count of all page_view events
        const { rows } = await pool.query('SELECT COUNT(*) as total FROM analytics_events WHERE event_type = \'page_view\'');
        res.json({ total: parseInt(rows[0].total) || 0 });
    } catch (err) {
        res.json({ total: 0 });
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

        // CREAR NOTIFICACIÃ“N PARA ADMINS
        try {
            const totalItems = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
            await pool.query(
                `INSERT INTO admin_notifications (type, title, message, reference_id) 
                 VALUES ('order', $1, $2, $3)`,
                [
                    `Nuevo Pedido #${reservationId}`,
                    `${userName} ha realizado un pedido con ${totalItems} artÃ­culo(s). Tel: ${contact.phone}`,
                    reservationId
                ]
            );
            console.log(`ðŸ”” NotificaciÃ³n admin creada para pedido #${reservationId}`);
        } catch (notifErr) {
            console.error('âš ï¸ Error creando notificaciÃ³n admin:', notifErr.message);
        }

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

// ========== ADMIN ORDERS MANAGEMENT ==========
// GET all orders (admin only)
app.get('/api/admin/orders', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin required' });
    try {
        const { rows } = await pool.query(
            `SELECT id, user_id, guest_name, guest_phone, guest_email, message, items, status, created_at 
             FROM reservations_v2 ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('❌ Error getting orders:', err);
        res.status(500).json({ message: 'Error obteniendo pedidos' });
    }
});

// UPDATE order status (admin only)
app.put('/api/admin/orders/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin required' });
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Estado no válido' });
    try {
        const { rows } = await pool.query('UPDATE reservations_v2 SET status = $1 WHERE id = $2 RETURNING user_id', [status, req.params.id]);

        // Notificar al usuario del cambio
        if (rows[0]?.user_id) {
            const statusLabels = { approved: 'APROBADO ✅', rejected: 'RECHAZADO ❌', completed: 'COMPLETADO 🏁' };
            await pool.query(
                `INSERT INTO admin_notifications (user_id, type, title, message, reference_id) 
                 VALUES ($1, 'order_status', $2, $3, $4)`,
                [
                    rows[0].user_id,
                    `Pedido #${req.params.id} ${statusLabels[status] || status}`,
                    `Tu pedido ha sido ${statusLabels[status] || status} por la administración.`,
                    req.params.id
                ]
            );
        }
        res.json({ message: 'Pedido actualizado' });
    } catch (err) {
        console.error('❌ Error updating order:', err);
        res.status(500).json({ message: 'Error actualizando pedido' });
    }
});

// ========== ADMIN NOTIFICATIONS ==========
// GET notifications for current user (admin sees all without user_id, user sees theirs)
app.get('/api/admin/notifications', verifyToken, async (req, res) => {
    try {
        const query = req.user.rol === 'admin'
            ? 'SELECT * FROM admin_notifications WHERE user_id IS NULL ORDER BY created_at DESC LIMIT 50'
            : 'SELECT * FROM admin_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50';
        const params = req.user.rol === 'admin' ? [] : [req.user.id];
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('❌ Error getting notifications:', err);
        res.status(500).json({ message: 'Error obteniendo notificaciones' });
    }
});

// GET unread notification count
app.get('/api/admin/notifications/unread-count', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin required' });
    try {
        const { rows } = await pool.query('SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = FALSE');
        res.json({ count: parseInt(rows[0]?.count || 0) });
    } catch (err) {
        res.json({ count: 0 });
    }
});

// Mark notification as read
app.put('/api/admin/notifications/:id/read', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin required' });
    try {
        await pool.query('UPDATE admin_notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
        res.json({ message: 'Notificación marcada como leída' });
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

// Mark all notifications as read
app.put('/api/admin/notifications/read-all', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin required' });
    try {
        await pool.query('UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE');
        res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (err) {
        res.status(500).json({ message: 'Error' });
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
    const cacheFile = path.join(CACHE_DIR, teamId + '.json');

    try {
        // 1. PRIORIDAD ABSOLUTA: Cache (Instantáneo)
        if (fs.existsSync(cacheFile)) {
            const stats = fs.statSync(cacheFile);
            const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
            data.isCached = true;
            data.lastUpdate = stats.mtime;

            // Responder YA
            res.json(data);

            // Si es "viejo" (> 2h), refrescar en background pero el usuario ya tiene sus datos
            if (Date.now() - stats.mtimeMs > 7200000) {
                console.log('📡 Background refresh for /complete:', teamId);
                scrapeLive(teamId).then(fresh => {
                    if (!fresh.error) {
                        fs.writeFileSync(cacheFile, JSON.stringify(fresh, null, 2));
                        saveCompetitionDataToDB(teamId, fresh.clasificacion, fresh.partidos).catch(e => { });
                    }
                }).catch(e => { });
            }
            return;
        }

        // 2. Si no hay cache, tirar de DB (Segunda opción rápida)
        console.log('🗄️ Cache missing, check DB for:', teamId);
        const [clas, part, info] = await Promise.all([
            pool.query('SELECT * FROM competition_standings WHERE team_id = $1 ORDER BY position ASC', [teamId]),
            pool.query('SELECT * FROM competition_matches WHERE team_id = $1 ORDER BY round ASC', [teamId]),
            pool.query('SELECT * FROM competition_info WHERE team_id = $1', [teamId])
        ]);

        const dbData = {
            teamId,
            info: info.rows[0] || { title: 'Competición ' + teamId.toUpperCase(), season: '2025/2026' },
            clasificacion: clas.rows,
            partidos: part.rows
        };

        res.json(dbData);

        // Si la DB tiene datos, también disparamos un scrape para tener cache pronto
        if (clas.rows.length > 0) {
            scrapeLive(teamId).then(fresh => {
                if (!fresh.error) fs.writeFileSync(cacheFile, JSON.stringify(fresh, null, 2));
            }).catch(e => { });
        }
    } catch (error) {
        console.error('❌ Error obteniendo datos completos:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

/* --- LIVE SCRAPER CON CACHE (24h) --- */
let scrapeLive;
try {
    const scraperModule = require('./live-scraper');
    scrapeLive = scraperModule.scrapeLive;
} catch (e) {
    console.error('⚠️ No se pudo cargar live-scraper:', e.message);
    // Mock function that returns error
    scrapeLive = async () => ({ error: 'Scraper module not loaded: ' + e.message, clasificacion: [], partidos: [] });
}
// CACHE_DIR se definió arriba

app.get('/api/scrape-live/:teamId', async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const force = req.query.force === 'true';
        const cacheFile = path.join(CACHE_DIR, teamId + '.json');

        // Check Cache - NON-BLOCKING STRATEGY
        if (fs.existsSync(cacheFile)) {
            const stats = fs.statSync(cacheFile);
            const ageMs = Date.now() - stats.mtimeMs;

            // Si es muy reciente (< 24h) o no estamos forzando, devolvemos YA.
            if (!force && ageMs < 86400000) { // 24h
                console.log('📦 Cache hit (Sync):', teamId);
                const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
                data.isCached = true;
                data.lastUpdate = stats.mtime;
                res.json(data);

                // Si tiene más de 2h, disparamos refresco en background pero ya hemos respondido
                if (ageMs > 7200000) {
                    console.log('📡 Refrescando cache en background para', teamId);
                    scrapeLive(teamId).then(freshData => {
                        if (!freshData.error) {
                            fs.writeFileSync(cacheFile, JSON.stringify(freshData, null, 2));
                            saveCompetitionDataToDB(teamId, freshData.clasificacion, freshData.partidos).catch(e => { });
                            console.log('✅ Cache de background actualizada para', teamId);
                        }
                    }).catch(e => console.error('Error background scrape:', e));
                }
                return;
            }
        }

        // Si no hay cache o es force, scrapeamos bloqueando (pero esto sólo pasará la primerísima vez o si pulsa refresh)
        console.log('📡 Scrapeando fresh data (Blocking) para', teamId);
        const data = await scrapeLive(teamId);

        if (!data.error && (data.clasificacion.length > 0 || data.partidos.length > 0)) {
            fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));

            // Persistir también en DB para que /complete lo vea
            try {
                await saveCompetitionDataToDB(teamId, data.clasificacion, data.partidos);
                console.log(`✅ Scrape persistido en DB para ${teamId}`);

                // DISPARAR DESCARGA DE LOGOS LOCAL
                const { exec } = require('child_process');
                exec(`node ${path.join(__dirname, 'download-logos.js')}`, (err, stdout, stderr) => {
                    if (err) console.error('❌ Error ejecutando downloader:', err);
                    else console.log('🖼️ Downloader de logos finalizado');
                });

            } catch (dbErr) {
                console.error(`⚠️ Error persistiendo scrape en DB para ${teamId}:`, dbErr.message);
            }
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

// Helper para persistir datos de competición - SOPORTA LOGOS
async function saveCompetitionDataToDB(teamId, clasificacion, partidos) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Limpiar
        await client.query('DELETE FROM competition_standings WHERE team_id = $1', [teamId]);
        await client.query('DELETE FROM competition_matches WHERE team_id = $1', [teamId]);

        // Standings
        for (const s of (clasificacion || [])) {
            const pFor = parseInt(s.points_for) || 0;
            const pAgainst = parseInt(s.points_against) || 0;
            const pointsDiff = (pFor || 0) - (pAgainst || 0);
            const pos = parseInt(s.position) || 0;
            const played = parseInt(s.played) || 0;
            const won = parseInt(s.won) || 0;
            const lost = parseInt(s.lost) || 0;
            const pts = parseInt(s.points) || 0;

            await client.query(`
                INSERT INTO competition_standings 
                (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points, logo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                teamId, pos, s.team_name || '', played, won, lost,
                pFor, pAgainst, pointsDiff, pts,
                s.logo || ''
            ]);
        }

        // Matches
        for (const m of (partidos || [])) {
            const hScore = (m.home_score !== undefined && m.home_score !== null) ? parseInt(m.home_score) : (parseInt(m.resultado_local) || 0);
            const aScore = (m.away_score !== undefined && m.away_score !== null) ? parseInt(m.away_score) : (parseInt(m.resultado_visitante) || 0);
            const round = parseInt(m.round) || parseInt(m.jornada) || 0;

            await client.query(`
                INSERT INTO competition_matches 
                (team_id, round, match_date, match_time, home_team, away_team, home_score, away_score, location, status, home_team_logo, away_team_logo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                teamId,
                round,
                m.match_date || m.fecha || '',
                m.match_time || m.hora || '',
                m.home_team || m.equipo_local || '',
                m.away_team || m.equipo_visitante || '',
                isNaN(hScore) ? 0 : hScore,
                isNaN(aScore) ? 0 : aScore,
                m.location || m.pabellon || '',
                m.status || m.estado || 'upcoming',
                m.home_team_logo || m.logo_local || '',
                m.away_team_logo || m.logo_visitante || ''
            ]);
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error in saveCompetitionDataToDB:', err);
        throw err;
    } finally {
        client.release();
    }
}

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

        await saveCompetitionDataToDB(teamId, clasificacion, partidos);
        console.log(`✅ Datos actualizados manualmente para ${teamId} por ${req.user.username}`);

        res.json({
            message: 'Datos actualizados correctamente',
            teamId,
            clasificacionCount: (clasificacion || []).length,
            partidosCount: (partidos || []).length
        });
    } catch (error) {
        console.error('❌ Error actualizando competición:', error);
        res.status(500).json({
            message: 'Error actualizando datos',
            error: error.message
        });
    }
});


// SERVIR ENDPOINTS FINALES
app.use('/api/logos', express.static(path.join(__dirname, 'public/logos')));

// Solo intentar servir el frontend si existe la carpeta dist
const distPath = path.join(__dirname, '../dist/sp-basket/browser');
if (fs.existsSync(distPath)) {
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).json({ message: 'Frontend not built. Use ng serve for development.' });
        }
    });
} else {
    console.log('⚠️ Frontend dist folder not found. Serving API only.');
    app.get('/', (req, res) => res.json({ message: 'SP Basket API Running', mode: 'API Only' }));
}

// ========== ADMIN ANALYTICS (FIXED & RESTORED) ==========
app.get('/api/admin/analytics/overview', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Admin required' });

    try {
        const response = {
            traffic: { activeNow: 0, activeToday: 0, totalSessions: 0, avgDuration: 0, totalPageViews: 0, pagesPerSession: 0, dailyVisits: [], hourlyToday: [] },
            users: { totalRegistered: 0, newToday: 0, byRole: [] },
            devices: { byType: [], uniqueSessions: 0 },
            content: { totalNews: 0, newsThisMonth: 0, topPages: [] },
            payments: { totalTickets: 0, paidTickets: 0, pendingTickets: 0 },
            shop: { totalOrders: 0, pendingOrders: 0, approvedOrders: 0, completedOrders: 0, rejectedOrders: 0, totalProductsSold: 0, recentOrders: [] },
            system: { uptimeSeconds: process.uptime(), totalEvents: 0 }
        };

        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

        // 1. TRAFFIC
        try {
            const q1 = await pool.query('SELECT COUNT(DISTINCT session_id) as c FROM analytics_sessions WHERE last_activity >= $1', [fiveMinsAgo]);
            response.traffic.activeNow = parseInt(q1.rows[0]?.c || 0);

            const q2 = await pool.query('SELECT COUNT(DISTINCT session_id) as c FROM analytics_sessions WHERE last_activity >= $1', [todayStart]);
            response.traffic.activeToday = parseInt(q2.rows[0]?.c || 0);

            const q3 = await pool.query('SELECT COUNT(*) as c, AVG(total_duration) as dur FROM analytics_sessions');
            response.traffic.totalSessions = parseInt(q3.rows[0]?.c || 0);
            response.traffic.avgDuration = Math.round(parseFloat(q3.rows[0]?.dur || 0));

            const q4 = await pool.query("SELECT COUNT(*) as c FROM analytics_events WHERE event_type = 'page_view'");
            response.traffic.totalPageViews = parseInt(q4.rows[0]?.c || 0);

            if (response.traffic.totalSessions > 0) {
                response.traffic.pagesPerSession = (response.traffic.totalPageViews / response.traffic.totalSessions).toFixed(1);
            }

            const q5 = await pool.query("SELECT DATE(started_at) as d, COUNT(*) as c FROM analytics_sessions WHERE started_at >= NOW() - INTERVAL '14 days' GROUP BY d ORDER BY d");
            response.traffic.dailyVisits = q5.rows.map(r => ({ date: r.d, count: parseInt(r.c) }));

            const q6 = await pool.query("SELECT EXTRACT(HOUR FROM started_at) as h, COUNT(*) as c FROM analytics_sessions WHERE started_at >= CURRENT_DATE GROUP BY h ORDER BY h");
            response.traffic.hourlyToday = q6.rows.map(r => ({ hour: parseInt(r.h), count: parseInt(r.c) }));
        } catch (e) { }

        // 2. USERS
        try {
            const u1 = await pool.query('SELECT COUNT(*) as c FROM users');
            response.users.totalRegistered = parseInt(u1.rows[0]?.c || 0);

            const u2 = await pool.query('SELECT COUNT(*) as c FROM users WHERE created_at >= $1', [todayStart]);
            response.users.newToday = parseInt(u2.rows[0]?.c || 0);

            const u3 = await pool.query('SELECT rol, COUNT(*) as count FROM users GROUP BY rol');
            response.users.byRole = u3.rows;
        } catch (e) { }

        // 3. DEVICES
        try {
            const d1 = await pool.query('SELECT device_type, COUNT(*) as count FROM analytics_sessions GROUP BY device_type');
            response.devices.byType = d1.rows;
            response.devices.uniqueSessions = response.traffic.totalSessions;
        } catch (e) { }

        // 4. CONTENT (SAFE MODE: If fails, return 0 but don't crash)
        try {
            let n1 = 0, n1m = 0;
            try {
                const r = await pool.query('SELECT COUNT(*) as c FROM news'); // Legacy
                n1 = parseInt(r.rows[0]?.c || 0);
                const rM = await pool.query("SELECT COUNT(*) as c FROM news WHERE date >= date_trunc('month', CURRENT_DATE)");
                n1m = parseInt(rM.rows[0]?.c || 0);
            } catch (ignore) { }

            let n2 = 0, n2m = 0;
            try {
                const r = await pool.query('SELECT COUNT(*) as c FROM noticias'); // New
                n2 = parseInt(r.rows[0]?.c || 0);
                const rM = await pool.query("SELECT COUNT(*) as c FROM noticias WHERE fecha_creacion >= date_trunc('month', CURRENT_DATE)");
                n2m = parseInt(rM.rows[0]?.c || 0);
            } catch (ignore) { }

            response.content.totalNews = n1 + n2; // Sum both
            response.content.newsThisMonth = n1m + n2m;

            const p1 = await pool.query("SELECT page_path, COUNT(*) as views FROM analytics_events WHERE event_type = 'page_view' GROUP BY page_path ORDER BY views DESC LIMIT 10");
            response.content.topPages = p1.rows;
        } catch (e) { }

        // 5. PAYMENTS
        try {
            const pay1 = await pool.query('SELECT COUNT(*) as c FROM papeletas');
            const total = parseInt(pay1.rows[0]?.c || 0);
            const pay2 = await pool.query('SELECT COUNT(*) as c FROM papeletas WHERE pagado = true');
            const paid = parseInt(pay2.rows[0]?.c || 0);
            response.payments.totalTickets = total;
            response.payments.paidTickets = paid;
            response.payments.pendingTickets = total - paid;
        } catch (e) { }

        // 6. SHOP / TIENDA
        try {
            const o1 = await pool.query('SELECT COUNT(*) as c FROM reservations_v2');
            response.shop.totalOrders = parseInt(o1.rows[0]?.c || 0);

            const o2 = await pool.query("SELECT COUNT(*) as c FROM reservations_v2 WHERE status = 'pending'");
            response.shop.pendingOrders = parseInt(o2.rows[0]?.c || 0);

            const o3 = await pool.query("SELECT COUNT(*) as c FROM reservations_v2 WHERE status = 'approved'");
            response.shop.approvedOrders = parseInt(o3.rows[0]?.c || 0);

            const o4 = await pool.query("SELECT COUNT(*) as c FROM reservations_v2 WHERE status = 'completed'");
            response.shop.completedOrders = parseInt(o4.rows[0]?.c || 0);

            const o5 = await pool.query("SELECT COUNT(*) as c FROM reservations_v2 WHERE status = 'rejected'");
            response.shop.rejectedOrders = parseInt(o5.rows[0]?.c || 0);

            // Total de productos vendidos (sumar cantidades de items de todos los pedidos aprobados/completados)
            try {
                const o6 = await pool.query("SELECT items FROM reservations_v2 WHERE status IN ('approved', 'completed', 'pending')");
                let totalProducts = 0;
                o6.rows.forEach(row => {
                    try {
                        const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
                        if (Array.isArray(items)) {
                            items.forEach(item => { totalProducts += (item.quantity || 1); });
                        }
                    } catch (e) { }
                });
                response.shop.totalProductsSold = totalProducts;
            } catch (e) { response.shop.totalProductsSold = 0; }

            // Últimos 5 pedidos
            const o7 = await pool.query('SELECT id, guest_name, status, items, created_at FROM reservations_v2 ORDER BY created_at DESC LIMIT 5');
            response.shop.recentOrders = o7.rows.map(r => ({
                id: r.id,
                name: r.guest_name,
                status: r.status,
                itemCount: (() => { try { const items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items; return Array.isArray(items) ? items.reduce((s, i) => s + (i.quantity || 1), 0) : 0; } catch (e) { return 0; } })(),
                date: r.created_at
            }));
        } catch (e) { }

        // 7. SYSTEM
        try {
            const s1 = await pool.query('SELECT COUNT(*) as c FROM analytics_events');
            response.system.totalEvents = parseInt(s1.rows[0]?.c || 0);
        } catch (e) { }

        res.json(response);

    } catch (err) {
        console.error('Analytics RESTORED Error:', err);
        // Fallback: Return empty structure instead of crashing
        res.status(200).json({ traffic: {}, users: {}, devices: {}, content: {}, payments: {}, shop: {}, system: {} });
    }
});

// ========== PUBLIC NEWS ENDPOINT (Fallback) ==========
app.get('/api/noticias', async (req, res) => {
    try {
        // 1. Try 'news' table (Legacy/Production data)
        try {
            const r = await pool.query('SELECT * FROM news ORDER BY date DESC');
            if (r.rows && r.rows.length > 0) return res.json(r.rows);
        } catch (e) { }

        // 2. Try 'noticias' table (New schema)
        const r2 = await pool.query('SELECT * FROM noticias ORDER BY fecha_creacion DESC');
        res.json(r2.rows);
    } catch (e) {
        console.error('Error fetching news:', e.message);
        res.status(500).json([]);
    }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
