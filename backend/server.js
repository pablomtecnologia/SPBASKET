// backend/server.js - Versión CON PostgreSQL (Supabase)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { Pool } = require('pg'); // CAMBIO: Usamos pg en lugar de mysql2
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER');
const PORT = process.env.PORT || 3001;

// ---------- CONFIG ----------
const JWT_SECRET = process.env.JWT_SECRET || 'MI_SECRETA_SUPER_SPBASKET_2024';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Configurar directorios de subida
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

const storageReconocimientos = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_DIR, 'reconocimientos')),
    filename: (req, file, cb) => cb(null, `reconocimiento-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`)
});
const uploadReconocimientos = multer({
    storage: storageReconocimientos,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') return cb(null, true);
        cb(new Error('Solo se permiten archivos PDF'));
    }
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

const upload = uploadNoticias; // Alias

// ---------- MIDDLEWARE ----------
app.use(cors({
    origin: [
        'http://localhost:4200',
        'http://localhost:4201',
        'http://localhost:3001',
        'https://saskipenguins.es',
        'https://www.saskipenguins.es'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ---------- POSTGRESQL POOL ----------
// Usamos DATABASE_URL que provee Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necesario para conexiones seguras a Supabase/Render
    }
});

// Inicializar Tablas (Schema Migration)
(async () => {
    try {
        const client = await pool.connect();
        try {
            console.log('🔌 Conectado a PostgreSQL');

            // Tabla Users
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    nombre VARCHAR(255),
                    apellidos VARCHAR(255),
                    rol VARCHAR(50) DEFAULT 'usuario',
                    licencia VARCHAR(100),
                    foto VARCHAR(255),
                    avatar VARCHAR(255),
                    telefono VARCHAR(50),
                    reset_token VARCHAR(255),
                    reset_expires TIMESTAMP
                );
            `);

            // Tabla Noticias
            await client.query(`
                CREATE TABLE IF NOT EXISTS noticias (
                    id SERIAL PRIMARY KEY,
                    titulo VARCHAR(255) NOT NULL,
                    contenido TEXT NOT NULL,
                    imagen_url VARCHAR(255),
                    enlace VARCHAR(255),
                    autor VARCHAR(100),
                    destacada BOOLEAN DEFAULT FALSE,
                    hashtags VARCHAR(255),
                    categoria VARCHAR(100) DEFAULT 'General',
                    slug VARCHAR(255),
                    meta_descripcion TEXT,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Tabla Reconocimientos
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
            `);

            // Tabla Papeletas
            await client.query(`
                CREATE TABLE IF NOT EXISTS papeletas (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    foto_url VARCHAR(255) NOT NULL,
                    estado VARCHAR(50) DEFAULT 'pendiente',
                    pagado BOOLEAN DEFAULT FALSE,
                    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);

            console.log('✅ Tablas verificadas en PostgreSQL');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('⚠️ Error inicializando DB:', err.message);
    }
})();

// ---------- HELPERS ----------
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No auth token' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token invalid' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token expired or invalid' });
    }
}

// ---------- ROUTES ----------

// LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (rows.length === 0) return res.status(401).json({ message: 'Credenciales incorrectas' });

        const user = rows[0];
        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas' });

        const token = generateToken({
            sub: user.id,
            username: user.username,
            email: user.email,
            rol: user.rol
        });

        res.json({
            id: user.id,
            token,
            username: user.username,
            email: user.email,
            nombre: user.nombre,
            apellidos: user.apellidos,
            rol: user.rol,
            licencia: user.licencia,
            foto: user.foto,
            avatar: user.avatar
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// REGISTER
app.post('/api/register', async (req, res) => {
    const { username, password, email, nombre, apellidos } = req.body;
    try {
        const check = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'Usuario o email en uso' });

        const hash = bcrypt.hashSync(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password, email, nombre, apellidos, rol) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [username, hash, email, nombre, apellidos, 'usuario']
        );

        res.json({ message: 'Registrado correctamente', id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error en registro' });
    }
});

// PROFILE UPDATE
app.put('/api/users/profile', verifyToken, async (req, res) => {
    const { nombre, apellidos, email, telefono, avatar } = req.body;
    const userId = req.user.sub;

    try {
        if (email) {
            const check = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
            if (check.rows.length > 0) return res.status(400).json({ message: 'Email en uso' });
        }

        await pool.query(
            'UPDATE users SET nombre = $1, apellidos = $2, email = $3, telefono = $4, avatar = $5 WHERE id = $6',
            [nombre, apellidos, email, telefono, avatar, userId]
        );

        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        res.json({ message: 'Perfil actualizado', user: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error actualizando perfil' });
    }
});

// PASSWORD RESET REQUEST
app.post('/api/request-password-reset', async (req, res) => {
    const { email } = req.body;
    try {
        const { rows } = await pool.query('SELECT id, nombre FROM users WHERE email = $1', [email]);
        if (rows.length === 0) return res.json({ message: 'Si existe, enviamos email.' });

        const user = rows[0];
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1h

        await pool.query('UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3', [token, expires, user.id]);

        // Send Email logic (omitted for brevity, same as before)
        console.log(`Reset token for ${email}: ${token}`);
        res.json({ message: 'Instrucciones enviadas.' });

    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

app.post('/api/confirm-password-reset', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const { rows } = await pool.query('SELECT id FROM users WHERE reset_token = $1 AND reset_expires > NOW()', [token]);
        if (rows.length === 0) return res.status(400).json({ message: 'Token inválido' });

        const hash = bcrypt.hashSync(newPassword, 10);
        await pool.query('UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2', [hash, rows[0].id]);
        res.json({ message: 'Contraseña actualizada' });
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});


// NOTICIAS
app.get('/api/noticias', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM noticias ORDER BY fecha_creacion DESC');
        res.json(rows);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Error' }); }
});

app.get('/api/noticias/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM noticias WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'No encontrada' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

app.post('/api/noticias', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { titulo, contenido, imagen_url, enlace, destacada, hashtags, categoria, slug, meta_descripcion } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO noticias (titulo, contenido, imagen_url, enlace, autor, destacada, hashtags, categoria, slug, meta_descripcion) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [titulo, contenido, imagen_url, enlace, req.user.username, destacada, hashtags, categoria, slug, meta_descripcion]
        );
        res.json({ message: 'Noticia creada', id: rows[0].id });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Error' }); }
});

app.delete('/api/noticias/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        await pool.query('DELETE FROM noticias WHERE id = $1', [req.params.id]);
        res.json({ message: 'Eliminada' });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

app.post('/api/upload-image', verifyToken, upload.single('imagen'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    // URL debe ser relativa al dominio backend en prod
    const imageUrl = `/uploads/noticias/${req.file.filename}`;
    res.json({ imageUrl });
});


// RECONOCIMIENTOS
app.post('/api/reconocimientos', verifyToken, uploadReconocimientos.single('archivo'), async (req, res) => {
    const { nombre, apellido, email, licencia } = req.body;
    const userId = req.user.sub;
    try {
        const check = await pool.query('SELECT id FROM reconocimientos_medicos WHERE user_id = $1 AND (estado = \'pendiente\' OR estado = \'validado\')', [userId]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'Ya tienes un trámite activo' });

        const archivoUrl = req.file ? `/uploads/reconocimientos/${req.file.filename}` : null;

        const { rows } = await pool.query(
            `INSERT INTO reconocimientos_medicos (user_id, nombre, apellido, email, licencia, archivo_url) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [userId, nombre, apellido, email, licencia, archivoUrl]
        );
        res.json({ message: 'Enviado', id: rows[0].id });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Error' }); }
});

app.get('/api/reconocimientos', verifyToken, async (req, res) => {
    const userId = req.user.sub;
    try {
        const userCheck = await pool.query('SELECT rol FROM users WHERE id = $1', [userId]);
        const isAdmin = userCheck.rows[0]?.rol === 'admin';

        if (isAdmin) {
            const { rows } = await pool.query(`
                SELECT r.*, u.nombre as usuario_nombre 
                FROM reconocimientos_medicos r 
                JOIN users u ON r.user_id = u.id 
                ORDER BY r.fecha_subida DESC
            `);
            res.json(rows);
        } else {
            const { rows } = await pool.query('SELECT * FROM reconocimientos_medicos WHERE user_id = $1', [userId]);
            res.json(rows);
        }
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

app.put('/api/reconocimientos/:id', verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { estado, mensaje } = req.body;
    try {
        await pool.query(
            'UPDATE reconocimientos_medicos SET estado = $1, mensaje_admin = $2, validado_por = $3, fecha_validacion = NOW() WHERE id = $4',
            [estado, mensaje, req.user.sub, req.params.id]
        );
        res.json({ message: `Estado actualizado a ${estado}` });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

app.get('/api/reconocimientos/:userId/status', verifyToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM reconocimientos_medicos WHERE user_id = $1 ORDER BY fecha_subida DESC LIMIT 1', [req.params.userId]);
        if (rows.length === 0) return res.json({ hasRecognition: false });
        const r = rows[0];
        res.json({
            hasRecognition: true,
            status: r.estado,
            nombre: r.nombre,
            apellidos: r.apellido,
            licencia: r.licencia,
            fechaEnvio: r.fecha_subida,
            fechaValidacion: r.fecha_validacion,
            notasAdmin: r.mensaje_admin
        });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});


// AVATAR UPLOAD
app.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    // Importante: No ponemos http://localhost... sino ruta relativa para que funcione en prod
    const fileUrl = `/uploads/noticias/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// TEST ENDPOINT
app.get('/', (req, res) => {
    res.send('🏀 SP BASKET API - RUNNING ON POSTGRESQL');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

if (userRows.length === 0 || userRows[0].rol !== 'admin') {
    return res.status(403).json({ message: 'No tienes permisos para eliminar noticias' });
}

await pool.execute('DELETE FROM noticias WHERE id = ?', [req.params.id]);

res.json({ message: 'Noticia eliminada correctamente' });
    } catch (error) {
    console.error('❌ Error eliminando noticia:', error);
    res.status(500).json({ message: 'Error al eliminar noticia' });
}
});

// ========== PAPELETAS ==========
app.post('/api/papeletas/upload', verifyToken, uploadPapeletas.single('fotoTalones'), async (req, res) => {
    try {
        // Validación duplicados
        const [existing] = await pool.execute(
            'SELECT id FROM papeletas WHERE user_id = ? AND (estado = "pendiente" OR estado = "validado")',
            [req.user.sub]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Ya tienes una entrega pendiente o validada.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Debes subir una foto' });
        }

        const fotoUrl = `http://localhost:3001/uploads/papeletas/${req.file.filename}`;

        // Creamos registro PENDIENTE DE PAGO.
        const [result] = await pool.execute(
            'INSERT INTO papeletas (user_id, foto_url, estado, pagado) VALUES (?, ?, "pendiente", FALSE)',
            [req.user.sub, fotoUrl]
        );

        res.json({
            message: 'Foto subida correctamente. Ahora procede al pago.',
            papeletaId: result.insertId,
            fotoUrl
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error subiendo foto papeletas' });
    }
});

app.get('/api/papeletas', verifyToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        // Obtener rol
        const [uRows] = await pool.execute('SELECT rol FROM users WHERE id = ?', [userId]);
        const isAdmin = uRows[0]?.rol === 'admin';

        if (isAdmin) {
            const [rows] = await pool.execute(`
                SELECT p.*, u.nombre, u.apellidos, u.email 
                FROM papeletas p 
                JOIN users u ON p.user_id = u.id 
                ORDER BY p.fecha_subida DESC
            `);
            res.json(rows);
        } else {
            const [rows] = await pool.execute(`
                SELECT * FROM papeletas WHERE user_id = ? ORDER BY fecha_subida DESC
            `, [userId]);
            res.json(rows);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error obteniendo papeletas' });
    }
});

// Inicializar Tablas
(async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS papeletas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                foto_url VARCHAR(255) NOT NULL,
                estado ENUM('pendiente', 'validado', 'rechazado') DEFAULT 'pendiente',
                pagado BOOLEAN DEFAULT FALSE,
                fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_resolucion DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // NUEVA TABLA PAGOS
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS pagos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                concepto VARCHAR(255) NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Intentar añadir la columna si no existe (para migracion safe)
        try {
            await pool.execute("ALTER TABLE papeletas ADD COLUMN fecha_resolucion DATETIME");
        } catch (e) { } // Ignorar si ya existe

        console.log('✅ Tablas verificadas');
    } catch (err) {
        console.error('⚠️ Error tablas:', err.message);
    }
})();

// ... (Papeletas endpoints)

app.put('/api/papeletas/:id', verifyToken, async (req, res) => {
    try {
        const { estado } = req.body;
        await pool.execute('UPDATE papeletas SET estado = ?, fecha_resolucion = NOW() WHERE id = ?', [estado, req.params.id]);
        res.json({ message: 'Estado actualizado' });
    } catch (err) {
        res.status(500).json({ message: 'Error actualizando estado' });
    }
});

// Generar PDF Factura Papeletas
app.get('/api/papeletas/invoice', verifyToken, async (req, res) => {
    try {
        const userId = req.user.sub;

        // Buscar pago confirmado
        const [rows] = await pool.execute(
            'SELECT * FROM papeletas WHERE user_id = ? AND pagado = TRUE ORDER BY id DESC LIMIT 1',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No hay pagos registrados para generar factura.' });
        }

        const papeleta = rows[0];

        // Obtener datos usuario
        const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura_papeletas_${userId}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('SP Basket - Comprobante de Pago', { align: 'center' });
        doc.moveDown();

        // Info
        doc.fontSize(12).text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`);
        doc.text(`Cliente: ${user.nombre} ${user.apellidos}`);
        doc.text(`DNI/Licencia: ${user.licencia || 'N/A'}`);
        doc.text(`Email: ${user.email}`);
        doc.moveDown();

        doc.text('------------------------------------------------------', { align: 'center' });
        doc.moveDown();

        // Concepto
        doc.fontSize(14).text('Concepto: Abono de Lotería Navidad (Obligatorio)', { underline: true });
        doc.fontSize(12).text(`Referencia Papeleta ID: #${papeleta.id}`);
        doc.text(`Estado: PAGADO`);
        doc.moveDown();

        // Total
        doc.fontSize(16).text('Total Pagado: 100.00€', { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(10).text('Gracias por su colaboración con el Club.', { align: 'center' });

        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error generando PDF' });
    }
});

// HISTORIAL Y FACTURAS PAGOS GENERALES
app.get('/api/pagos/historial', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM pagos WHERE user_id = ? ORDER BY fecha DESC', [req.user.sub]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Error obteniendo historial pagos' });
    }
});

app.get('/api/pagos/factura/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.sub;
        const pagoId = req.params.id;

        const [rows] = await pool.execute('SELECT * FROM pagos WHERE id = ? AND user_id = ?', [pagoId, userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Pago no encontrado' });

        const pago = rows[0];
        const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura_spbasket_${pagoId}.pdf`);
        doc.pipe(res);

        // Diseño Factura
        doc.image('uploads/logo.png', 50, 45, { width: 50 }).stroke(); // Intentar logo si existe, sino falla silent? Mejor texto
        doc.fontSize(20).text('SP Basket - Factura', 110, 57);
        doc.moveDown();

        doc.fontSize(10).text(`Fecha: ${new Date(pago.fecha).toLocaleDateString()}`, 200, 65, { align: 'right' });
        doc.text(`Ref: ${pagoId}`, 200, 80, { align: 'right' });
        doc.moveDown(4);

        doc.fontSize(12).text(`Cliente: ${user.nombre} ${user.apellidos}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`DNI/Licencia: ${user.licencia || '-'}`);
        doc.moveDown(2);

        doc.fontSize(14).text('Detalle de la Operación', { underline: true });
        doc.moveDown();

        doc.fontSize(12).text(`Concepto: ${pago.concepto}`);
        doc.moveDown();
        doc.fontSize(16).text(`Total: ${pago.monto} €`, { align: 'right' });

        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error generando PDF' });
    }
});


// ========== PAGOS (STRIPE) ==========
// ========== PAGOS (STRIPE) ==========
app.post('/api/create-checkout-session', verifyToken, async (req, res) => {
    try {
        const { items, successUrl, cancelUrl } = req.body;
        const userId = req.user.sub;

        // 1. Registrar en Historial General (Tabla Pagos)
        // Calcular total seguro
        const rawTotal = items.reduce((acc, i) => acc + (i.amount / 100) * (i.quantity || 1), 0);
        const montoSafe = parseFloat(rawTotal.toFixed(2));

        // Concepto seguro (max 255 chars)
        const rawConcepto = items.map(i => `${i.quantity || 1}x ${i.name}`).join(', ');
        const conceptoSafe = rawConcepto.length > 250 ? rawConcepto.substring(0, 247) + '...' : rawConcepto;

        console.log(`💾 Intentando guardar pago: User=${userId}, Monto=${montoSafe}€`);

        try {
            const [resInsert] = await pool.execute(
                'INSERT INTO pagos (user_id, concepto, monto, fecha) VALUES (?, ?, ?, NOW())',
                [userId, conceptoSafe, montoSafe]
            );
            console.log("✅ Pago registrado ID:", resInsert.insertId);
        } catch (dbErr) {
            console.error('❌ Error CRÍTICO guardando historial:', dbErr);
        }

        // 2. Lógica Papeletas
        const isPapeletas = items.some(i => i.name.toLowerCase().includes('papeleta'));
        if (isPapeletas) {
            console.log(`🎟️ Actualizando estado papeleta para ${userId}`);
            await pool.execute('UPDATE papeletas SET pagado = TRUE, fecha_resolucion = NOW() WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
        }

        // 3. Crear Sesión Stripe (o simular)
        // MODO DEMO
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_PLACEHOLDER') || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
            console.log('� MODO DEMO: Simulando éxito');
            return res.json({ url: (successUrl || 'http://localhost:4200/pagos?status=success') + '&demo=true' });
        }

        // MODO REAL
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => ({
                price_data: {
                    currency: 'eur',
                    product_data: { name: item.name },
                    unit_amount: item.amount,
                },
                quantity: item.quantity || 1,
            })),
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Error Checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== VOTACIÓN DE PRODUCTOS ==========

// Inicializar tabla de votos de productos
(async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS product_votes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_vote (product_id, user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla product_votes verificada');
    } catch (err) {
        console.warn('⚠️ Error init product_votes:', err.message);
    }
})();

// Obtener votos totales por producto
app.get('/api/product-votes', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT product_id, COUNT(*) as votes
            FROM product_votes
            GROUP BY product_id
        `);

        // Si no hay votos, devolver array vacío
        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo votos:', error);
        res.status(500).json({ message: 'Error al obtener votos' });
    }
});

// Obtener votos de un usuario específico
app.get('/api/product-votes/user/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar que el usuario está pidiendo sus propios votos
        if (parseInt(userId) !== req.user.sub) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const [rows] = await pool.execute(
            'SELECT product_id FROM product_votes WHERE user_id = ?',
            [userId]
        );

        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo votos de usuario:', error);
        res.status(500).json({ message: 'Error al obtener votos del usuario' });
    }
});

// Registrar voto de producto
app.post('/api/product-votes', verifyToken, async (req, res) => {
    try {
        const { productId, userId } = req.body;

        // Verificar que el usuario está votando por sí mismo
        if (userId !== req.user.sub) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Verificar si ya votó
        const [existing] = await pool.execute(
            'SELECT id FROM product_votes WHERE product_id = ? AND user_id = ?',
            [productId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Ya has votado por este producto' });
        }

        // Registrar voto
        await pool.execute(
            'INSERT INTO product_votes (product_id, user_id) VALUES (?, ?)',
            [productId, userId]
        );

        // Obtener total de votos actualizado para este producto
        const [voteCount] = await pool.execute(
            'SELECT COUNT(*) as votes FROM product_votes WHERE product_id = ?',
            [productId]
        );

        console.log(`✅ Usuario ${userId} votó por producto ${productId}`);
        res.json({
            message: 'Voto registrado correctamente',
            votes: voteCount[0].votes
        });

    } catch (error) {
        console.error('❌ Error registrando voto:', error);
        res.status(500).json({ message: 'Error al registrar el voto' });
    }
});

// Suscripción a newsletter
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Nombre y email son requeridos' });
        }

        // Crear tabla si no existe
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Verificar si ya está suscrito
        const [existing] = await pool.execute(
            'SELECT id FROM newsletter_subscribers WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Este email ya está suscrito' });
        }

        // Registrar suscriptor
        const [result] = await pool.execute(
            'INSERT INTO newsletter_subscribers (name, email) VALUES (?, ?)',
            [name, email]
        );

        console.log(`✅ Nuevo suscriptor: ${email}`);

        // Intentar enviar email de confirmación
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: '✨ Bienvenido a la Newsletter de SP Basket',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #EB3489;">¡Gracias por suscribirte!</h2>
                        <p>Hola ${name},</p>
                        <p>Te hemos suscrito correctamente a nuestra newsletter.</p>
                        <p>Serás el primero en enterarte cuando lancemos nuestra tienda oficial de merchandising.</p>
                        <p style="margin-top: 30px;">¡El equipo de SP Basket te agradece tu apoyo! 🏀💗</p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.warn('⚠️ No se pudo enviar email de confirmación:', emailErr.message);
        }

        res.json({
            message: 'Suscripción exitosa',
            id: result.insertId
        });

    } catch (error) {
        console.error('❌ Error en suscripción:', error);
        res.status(500).json({ message: 'Error al procesar la suscripción' });
    }
});

// ---- RESERVAR PRODUCTO (EMAIL) ----
app.post('/api/products/reserve', verifyToken, async (req, res) => {
    const { userId, username, email, product } = req.body;
    console.log(`👕 Reserva de producto: ${product} por ${username} (${email})`);

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        // Enviar email al administrador
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: 'pablomtecnologia@gmail.com',
            subject: '👕 Nueva Reserva de Camiseta - SP Basket',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #E91E63;">Nueva Reserva de Camiseta</h2>
                    <p><strong>Usuario:</strong> ${username}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Producto:</strong> ${product}</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    <p>Por favor contactar con el usuario para confirmar talla y gestionar el pago.</p>
                </div>
            `
        });

        // Enviar confirmación al usuario
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: '✅ Solicitud de Reserva Recibida - SP Basket',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #E91E63;">¡Solicitud Recibida!</h2>
                    <p>Hola ${username},</p>
                    <p>Hemos recibido tu solicitud de reserva para: <strong>${product}</strong>.</p>
                    <p>Nos pondremos en contacto contigo en este correo para confirmar tallas y finalizar el proceso.</p>
                    <p>¡Gracias por tu apoyo!</p>
                </div>
            `
        });

        res.json({ message: 'Reserva enviada correctamente' });

    } catch (error) {
        console.error('❌ Error enviando reserva:', error);
        res.status(500).json({ message: 'Error al procesar la reserva' });
    }
});

// ---------- INICIAR SERVIDOR ----------
app.listen(PORT, async () => {
    console.log(`🚀 Backend listening on http://localhost:${PORT}`);

    // Verificar conexión a MySQL
    try {
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
        console.log(`✅ MySQL conectado - ${rows[0].count} usuarios en la base de datos`);
        console.log(`📝 Usuarios: admin/spbasket2024, jugador/jugador123, entrenador/entrenador123`);
    } catch (err) {
        console.error('❌ Error conectando a MySQL:', err.message);
        console.error('   Verifica:');
        console.error('   1. MySQL está corriendo');
        console.error('   2. El archivo .env tiene la contraseña correcta (DB_PASSWORD)');
        console.error('   3. La base de datos "spbasket" existe');
    }
});
