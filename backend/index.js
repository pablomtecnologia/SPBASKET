// backend/index.js - Nueva entrada principal (Fix bloqueo archivo server.js)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const PORT = process.env.PORT || 10000; // Render usa PORT 10000 por defecto a veces

// ---------- CONFIG ----------
const JWT_SECRET = process.env.JWT_SECRET || 'MI_SECRETA_SUPER_SPBASKET_2024';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

['noticias', 'reconocimientos', 'papeletas'].forEach(dir => {
    const p = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// --- MULTER CONFIG ---
const storageNoticias = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_DIR, 'noticias')),
    filename: (req, file, cb) => cb(null, `noticia-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`)
});
const uploadNoticias = multer({
    storage: storageNoticias,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Solo se permiten imágenes o PDF'));
    }
});
const upload = uploadNoticias;

const storageReconocimientos = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_DIR, 'reconocimientos')),
    filename: (req, file, cb) => cb(null, `reconocimiento-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`)
});
const uploadReconocimientos = multer({
    storage: storageReconocimientos,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => { if (file.mimetype === 'application/pdf') return cb(null, true); cb(new Error('Solo PDF')); }
});

const storagePapeletas = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_DIR, 'papeletas')),
    filename: (req, file, cb) => {
        const userId = req.user ? req.user.sub : 'unknown';
        cb(null, `papeleta-${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const uploadPapeletas = multer({
    storage: storagePapeletas,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        if (allowedTypes.test(path.extname(file.originalname).toLowerCase())) return cb(null, true);
        cb(new Error('Solo imágenes válidas'));
    }
});

// ---------- MIDDLEWARE ----------
app.use(cors({
    origin: [
        'http://localhost:4200', 'http://localhost:4201', 'http://localhost:3001',
        'https://saskipenguins.es', 'https://www.saskipenguins.es',
        'https://spbasket-rrui.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((req, res, next) => { console.log(`📨 ${req.method} ${req.path}`); next(); });

// ---------- DB POOL ----------
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ---------- INIT DB ----------
(async () => {
    try {
        const client = await pool.connect();
        try {
            console.log('🔌 Conectado a PostgreSQL (Init Script)');

            await client.query(`CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL, nombre VARCHAR(255), apellidos VARCHAR(255),
                rol VARCHAR(50) DEFAULT 'usuario', licencia VARCHAR(100), foto VARCHAR(255),
                avatar VARCHAR(255), telefono VARCHAR(50), reset_token VARCHAR(255), reset_expires TIMESTAMP
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS noticias (
                id SERIAL PRIMARY KEY, titulo VARCHAR(255) NOT NULL, contenido TEXT NOT NULL,
                imagen_url VARCHAR(255), enlace VARCHAR(255), autor VARCHAR(100),
                destacada BOOLEAN DEFAULT FALSE, hashtags VARCHAR(255), categoria VARCHAR(100) DEFAULT 'General',
                slug VARCHAR(255), meta_descripcion TEXT, fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS reconocimientos_medicos (
                id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, nombre VARCHAR(100), apellido VARCHAR(100),
                email VARCHAR(255), licencia VARCHAR(100), archivo_url VARCHAR(255),
                estado VARCHAR(50) DEFAULT 'pendiente', mensaje_admin TEXT, fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_validacion TIMESTAMP, validado_por INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS papeletas (
                id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, foto_url VARCHAR(255) NOT NULL,
                estado VARCHAR(50) DEFAULT 'pendiente', pagado BOOLEAN DEFAULT FALSE,
                fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP, fecha_resolucion TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS pagos (
                id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, concepto VARCHAR(255) NOT NULL,
                monto DECIMAL(10, 2) NOT NULL, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS product_votes (
                id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE (product_id, user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);

            await client.query(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE, subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            console.log('✅ Todas las tablas verificadas.');

            // ADMIN USER
            const pass = bcrypt.hashSync('spbasket2024', 10);
            await client.query(`
                INSERT INTO users (username, email, password, nombre, apellidos, rol, licencia)
                VALUES ('admin', 'admin@spbasket.es', '${pass}', 'Admin', 'Principal', 'admin', 'LICENCIA-ADM')
                ON CONFLICT (username) DO NOTHING
            `);
            console.log('👤 Usuario Admin verificado: admin / spbasket2024');

        } finally { client.release(); }
    } catch (err) { console.error('⚠️ DB Init Error:', err.message); }
})();

// ---------- HELPERS ----------
function generateToken(payload) { return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }); }
function verifyToken(req, res, next) {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ message: 'No auth token' });
    const t = h.split(' ')[1];
    if (!t) return res.status(401).json({ message: 'Token invalid' });
    try { req.user = jwt.verify(t, JWT_SECRET); next(); }
    catch (e) { res.status(401).json({ message: 'Token expired' }); }
}

// ---------- ROUTES ----------
app.get('/', (req, res) => res.send('🏀 SP BASKET API - LATEST VERSION (pg)'));

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (rows.length === 0) return res.status(401).json({ message: 'Credenciales incorrectas' });
        const user = rows[0];
        if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: 'Password incorrecto' });

        res.json({
            id: user.id, token: generateToken({ sub: user.id, username: user.username, email: user.email, rol: user.rol }),
            username: user.username, email: user.email, nombre: user.nombre, apellidos: user.apellidos,
            rol: user.rol, licencia: user.licencia, foto: user.foto, avatar: user.avatar
        });
    } catch (e) {
        console.error("Login Error:", e);
        res.status(500).json({ message: 'Error en servidor (Login)' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password, email, nombre, apellidos } = req.body;
    try {
        const check = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'Usuario/Email ya existe' });

        const hash = bcrypt.hashSync(password, 10);
        const { rows } = await pool.query(
            'INSERT INTO users (username, password, email, nombre, apellidos, rol) VALUES ($1, $2, $3, $4, $5, \'usuario\') RETURNING id',
            [username, hash, email, nombre, apellidos]
        );
        res.json({ message: 'Registrado', id: rows[0].id });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Error registro' }); }
});

app.get('/api/noticias', async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM noticias ORDER BY fecha_creacion DESC'); res.json(rows); }
    catch (e) { res.status(500).json({ message: 'Error noticias' }); }
});
app.get('/api/noticias/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM noticias WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'No found' });
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ message: 'Error noticia' }); }
});

// Start
app.listen(PORT, async () => {
    console.log(`🚀 Server started on ${PORT}`);
    try {
        const { rows } = await pool.query('SELECT NOW()');
        console.log(`✅ DB Connected at ${rows[0].now}`);
    } catch (e) { console.error('❌ DB Connection Failed:', e.message); }
});
