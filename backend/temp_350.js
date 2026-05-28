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
