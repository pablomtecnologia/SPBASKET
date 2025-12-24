// backend/server.js - Versión CON MySQL
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');
const PDFDocument = require('pdfkit'); // Importar PDFKit

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER'); // Reemplazar en producción
const PORT = process.env.PORT || 3001;



// ---------- CONFIG ----------
const JWT_SECRET = process.env.JWT_SECRET || 'MI_SECRETA_SUPER_SPBASKET_2024';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Configurar multer para noticias
const storageNoticias = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/noticias/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'noticia-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configurar multer para reconocimientos médicos
const storageReconocimientos = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/reconocimientos/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'reconocimiento-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadNoticias = multer({
    storage: storageNoticias,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP) o PDF'));
        }
    }
});

const uploadReconocimientos = multer({
    storage: storageReconocimientos,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo para PDFs
    fileFilter: function (req, file, cb) {
        const allowedTypes = /pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype === 'application/pdf';

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
    }
});

const storagePapeletas = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(UPLOAD_DIR, 'papeletas');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        const ext = path.extname(file.originalname);
        const userId = req.user ? req.user.sub : 'unknown';
        cb(null, `papeleta-${userId}-${uniqueSuffix}${ext}`);
    }
});
const uploadPapeletas = multer({
    storage: storagePapeletas,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Solo imágenes válidas'));
    }
});

// Mantener upload para compatibilidad con código existente
const upload = uploadNoticias;

// ---------- MIDDLEWARE ----------
app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:4201'], // Permitir ambos puertos de desarrollo
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Servir archivos estáticos de uploads (Ruta absoluta para evitar errores)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware para debug
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ... (resto del código) ...

// ---- SUBIR AVATAR ----
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `avatar-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});
const uploadAvatar = multer({ storage: avatarStorage });

app.post('/api/upload-avatar', uploadAvatar.single('avatar'), (req, res) => {
    if (!req.file) {
        console.log('⚠️ Intento de subida sin archivo');
        return res.status(400).json({ message: 'No se subió ningún archivo' });
    }

    // Construir URL absoluta
    const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    console.log(`✅ Avatar subido correctamente: ${req.file.filename}`);
    console.log(`🔗 URL generada: ${fileUrl}`);

    res.json({ url: fileUrl });
});

// ---------- MYSQL POOL ----------
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'spbasket',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Inicializar Tabla Papeletas
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
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla papeletas verificada');
    } catch (err) {
        // En caso de error, puede ser que la BD no esté lista aun.
        console.error('⚠️ Error init Tabla Papeletas:', err.message);
    }
})();

// ---------- HELPERS ----------
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

// Middleware para verificar token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Token inválido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Error verificando token:', error.message);
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
}

// ---------- ROUTES ----------
// ---- LOGIN ----
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`🔐 Intento de login - Usuario: ${username}`);

    try {
        const [rows] = await pool.execute(
            'SELECT id, username, email, password, nombre, apellidos, rol, licencia, foto, avatar FROM users WHERE username = ?',
            [username]
        );

        console.log(`📊 Usuarios encontrados: ${rows.length}`);

        if (rows.length === 0) {
            console.log('❌ Usuario no encontrado');
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const user = rows[0];
        console.log(`👤 Usuario encontrado: ${user.username} (${user.rol})`);
        console.log(`🔑 Hash en BD: ${user.password.substring(0, 20)}...`);

        const valid = bcrypt.compareSync(password, user.password);

        if (!valid) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const token = generateToken({
            sub: user.id,
            username: user.username,
            email: user.email,
            rol: user.rol
        });

        console.log('✅ Login exitoso');
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
        console.error('Login error', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// ---- REGISTRO DE USUARIO ----
app.post('/api/register', async (req, res) => {
    const { username, password, email, nombre, apellidos } = req.body;
    console.log(`📝 Nuevo registro: ${username} (${email})`);

    try {
        // 1. Validar si ya existe usuario o email
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'El usuario o el email ya están registrados' });
        }

        // 2. Encriptar contraseña
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        // 3. Insertar usuario (Rol por defecto: 'usuario')
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, email, nombre, apellidos, rol) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hash, email, nombre, apellidos, 'usuario']
        );

        console.log(`✅ Usuario registrado ID: ${result.insertId}`);

        // 4. Enviar email de bienvenida (Opcional, pero premium)
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });

            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: '🏀 Bienvenido a SP Basket',
                html: `<h3>¡Hola ${nombre}!</h3><p>Gracias por registrarte en la plataforma oficial de SP Basket.</p>`
            });
        } catch (e) { console.warn('No se pudo enviar email bienvenida'); }

        res.json({ message: 'Usuario registrado correctamente', id: result.insertId });

    } catch (err) {
        console.error('Error registro:', err);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
});

// ---- RECUPERAR CONTRASEÑA ----
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Buscar usuario
        const [rows] = await pool.execute('SELECT id, nombre, username FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            // Por seguridad, no decimos si existe o no, pero simulamos éxito
            return res.json({ message: 'Si el email existe, se enviará una nueva contraseña.' });
        }

        const user = rows[0];

        // 2. Generar nueva contraseña aleatoria
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2); // Ej: "a7x9b2m199"

        // 3. Encriptar y guardar
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(newPassword, salt);

        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);

        // 4. Enviar email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: '🔐 Recuperación de Contraseña - SP Basket',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #CC26D5;">Recuperación de Contraseña</h2>
                    <p>Hola ${user.nombre},</p>
                    <p>Has solicitado recuperar tu contraseña. Aquí tienes una nueva contraseña temporal:</p>
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 2px;">
                        ${newPassword}
                    </div>
                    <p>Por favor, inicia sesión y cámbiala lo antes posible.</p>
                </div>
            `
        });

        console.log(`✅ Contraseña reseteada para ${user.username}`);
        res.json({ message: 'Si el email existe, se enviará una nueva contraseña.' });

    } catch (err) {
        console.error('Error password reset:', err);
        res.status(500).json({ message: 'Error al procesar solicitud' });
    }
});

// ---- ACTUALIZAR PERFIL ----
app.put('/api/users/profile', verifyToken, async (req, res) => {
    // Extraemos del body
    const { nombre, apellidos, email, telefono, avatar } = req.body;
    const userId = req.user.sub; // CORREGIDO: El token usa 'sub', no 'id'

    // Saneamiento: Si algún campo es undefined, lo convertimos a NULL (o string vacío si prefieres, pero NULL es mejor para SQL opcional)
    // Usamos (val === undefined ? null : val) para respetar strings vacíos "" si el usuario quiso borrar el dato explícitamente
    const pNombre = nombre === undefined ? null : nombre;
    const pApellidos = apellidos === undefined ? null : apellidos;
    const pEmail = email === undefined ? null : email;
    const pTelefono = telefono === undefined ? null : telefono;
    const pAvatar = avatar === undefined ? null : avatar;

    try {
        // Validar si el email ya existe en otro usuario (si se envió email)
        if (pEmail) {
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [pEmail, userId]
            );
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Ese email ya está en uso por otro usuario' });
            }
        }

        const pAvatar = avatar === undefined ? null : avatar;

        console.log('🔄 Update Profile Params:', { pNombre, pApellidos, pEmail, pTelefono, pAvatar });

        await pool.execute(
            'UPDATE users SET nombre = ?, apellidos = ?, email = ?, telefono = ?, avatar = ? WHERE id = ?',
            [pNombre, pApellidos, pEmail, pTelefono, pAvatar, userId]
        );

        // Devolver usuario actualizado para refrescar el frontend
        const [rows] = await pool.execute('SELECT id, username, email, nombre, apellidos, rol, telefono, avatar, licencia FROM users WHERE id = ?', [userId]);

        res.json({
            message: 'Información actualizada correctamente',
            user: rows[0]
        });

    } catch (err) {
        console.error('Error actualizando perfil:', err);
        res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
});

// ---- OBTENER ESTADO DEL RECONOCIMIENTO MÉDICO ----
app.get('/api/reconocimientos/:userId/status', verifyToken, async (req, res) => {
    const { userId } = req.params;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM reconocimientos_medicos WHERE user_id = ? ORDER BY fecha_subida DESC LIMIT 1',
            [userId]
        );

        if (rows.length === 0) {
            return res.json({ hasRecognition: false });
        }

        const recognition = rows[0];
        res.json({
            hasRecognition: true,
            status: recognition.estado,
            nombre: recognition.nombre,
            apellidos: recognition.apellido,
            licencia: recognition.licencia,
            fechaEnvio: recognition.fecha_subida,
            fechaValidacion: recognition.fecha_validacion,
            notasAdmin: recognition.mensaje_admin
        });
    } catch (err) {
        console.error('Error obteniendo estado de reconocimiento:', err);
        res.status(500).json({ message: 'Error al obtener el estado' });
    }
});

// ========== RECONOCIMIENTOS MÉDICOS ==========

// Subir reconocimiento médico (USUARIOS)
app.post('/api/reconocimientos', verifyToken, uploadReconocimientos.single('archivo'), async (req, res) => {
    try {
        const { nombre, apellido, email, licencia } = req.body;
        const userId = req.user.sub;

        console.log('📋 Usuario', userId, 'enviando reconocimiento médico');

        // Check duplicados
        const [existing] = await pool.execute(
            'SELECT id FROM reconocimientos_medicos WHERE user_id = ? AND (estado = "pendiente" OR estado = "validado")',
            [userId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Ya tienes un reconocimiento en proceso o validado.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Debe adjuntar un archivo PDF' });
        }

        const archivoUrl = `http://localhost:3001/uploads/reconocimientos/${req.file.filename}`;

        // Guardar en base de datos
        const [result] = await pool.execute(
            `INSERT INTO reconocimientos_medicos 
            (user_id, nombre, apellido, email, licencia, archivo_url, estado) 
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
            [userId, nombre, apellido, email, licencia, archivoUrl]
        );

        console.log('✅ Reconocimiento médico guardado:', result.insertId);

        // Intentar enviar email (si está configurado)
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER || 'pablomtecnologia@gmail.com',
                    pass: process.env.SMTP_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.SMTP_USER || 'pablomtecnologia@gmail.com',
                to: email,
                subject: '✅ Reconocimiento Médico Recibido - SP Basket',
                html: `
                    <h2>Reconocimiento Médico Recibido</h2>
                    <p>Hola ${nombre},</p>
                    <p>Hemos recibido tu reconocimiento médico correctamente.</p>
                    <p><strong>Estado:</strong> Pendiente de validación</p>
                    <p>Recibirás una notificación cuando sea revisado.</p>
                    <br>
                    <p>Gracias,<br>SP Basket</p>
                `
            });
            console.log('✅ Email enviado a', email);
        } catch (emailErr) {
            console.warn('⚠️ No se pudo enviar email:', emailErr.message);
        }

        res.json({
            message: 'Reconocimiento enviado correctamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ message: 'Error al enviar el reconocimiento' });
    }
});

// Obtener reconocimientos (ADMIN: todos, USER: solo suyos)
app.get('/api/reconocimientos', verifyToken, async (req, res) => {
    try {
        const userId = req.user.sub;

        // Verificar si es admin
        const [userRows] = await pool.execute(
            'SELECT rol FROM users WHERE id = ?',
            [userId]
        );

        const esAdmin = userRows[0]?.rol === 'admin';

        let query, params;

        if (esAdmin) {
            // Admin ve todos
            query = `
                SELECT r.*, u.nombre as usuario_nombre, u.email as usuario_email
                FROM reconocimientos_medicos r
                JOIN users u ON r.user_id = u.id
                ORDER BY r.fecha_subida DESC
            `;
            params = [];
        } else {
            // Usuario ve solo los suyos
            query = `
                SELECT * FROM reconocimientos_medicos 
                WHERE user_id = ?
                ORDER BY fecha_subida DESC
            `;
            params = [userId];
        }

        const [rows] = await pool.execute(query, params);
        res.json(rows);

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ message: 'Error al obtener reconocimientos' });
    }
});

// Contar reconocimientos pendientes (ADMIN)
app.get('/api/reconocimientos/pendientes/count', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) as count FROM reconocimientos_medicos WHERE estado = 'pendiente'`
        );
        res.json({ count: rows[0].count });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ message: 'Error' });
    }
});

// Validar o rechazar reconocimiento (ADMIN)
app.put('/api/reconocimientos/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, mensaje } = req.body;
        const adminId = req.user.sub;

        // Verificar que es admin
        const [userRows] = await pool.execute(
            'SELECT rol FROM users WHERE id = ?',
            [adminId]
        );

        if (userRows[0]?.rol !== 'admin') {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Obtener datos del reconocimiento
        const [reconRows] = await pool.execute(
            'SELECT * FROM reconocimientos_medicos WHERE id = ?',
            [id]
        );

        if (reconRows.length === 0) {
            return res.status(404).json({ message: 'Reconocimiento no encontrado' });
        }

        const recon = reconRows[0];

        // Actualizar estado
        await pool.execute(
            `UPDATE reconocimientos_medicos 
            SET estado = ?, mensaje_admin = ?, fecha_validacion = NOW(), validado_por = ?
            WHERE id = ?`,
            [estado, mensaje, adminId, id]
        );

        console.log(`✅ Reconocimiento ${id} ${estado} por admin ${adminId}`);

        // Intentar enviar email
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER || 'pablomtecnologia@gmail.com',
                    pass: process.env.SMTP_PASS
                }
            });

            const estadoTexto = estado === 'validado' ? '✅ VALIDADO' : '❌ RECHAZADO';
            const colorEstado = estado === 'validado' ? '#4caf50' : '#f44336';

            await transporter.sendMail({
                from: process.env.SMTP_USER || 'pablomtecnologia@gmail.com',
                to: recon.email,
                subject: `${estadoTexto} - Reconocimiento Médico - SP Basket`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: ${colorEstado};">Reconocimiento Médico ${estadoTexto}</h2>
                        <p>Hola ${recon.nombre},</p>
                        <p>Tu reconocimiento médico ha sido <strong>${estado}</strong>.</p>
                        ${mensaje ? `<p><strong>Mensaje del administrador:</strong><br>${mensaje}</p>` : ''}
                        <p>Gracias,<br>SP Basket</p>
                    </div>
                `
            });
            console.log('✅ Email de validación enviado');
        } catch (emailErr) {
            console.warn('⚠️ No se pudo enviar email:', emailErr.message);
        }

        res.json({ message: `Reconocimiento ${estado} correctamente` });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ message: 'Error al actualizar reconocimiento' });
    }
});

// ========== NOTICIAS ==========

// Subir imagen para noticia
app.post('/api/upload-image', verifyToken, upload.single('imagen'), async (req, res) => {
    try {
        console.log('📸 Subiendo imagen...');

        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const imageUrl = `http://localhost:3001/uploads/noticias/${req.file.filename}`;
        console.log(`✅ Imagen subida: ${imageUrl}`);

        res.json({ imageUrl });
    } catch (error) {
        console.error('❌ Error subiendo imagen:', error);
        res.status(500).json({ message: 'Error al subir la imagen' });
    }
});

// Obtener una noticia por ID (DEBE IR ANTES QUE /api/noticias)
app.get('/api/noticias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Obteniendo noticia con ID: ${id}`);

        const [rows] = await pool.execute(
            'SELECT * FROM noticias WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            console.log('❌ Noticia no encontrada');
            return res.status(404).json({ message: 'Noticia no encontrada' });
        }

        console.log(`✅ Noticia encontrada: ${rows[0].titulo}`);
        res.json(rows[0]);
    } catch (error) {
        console.error('❌ Error obteniendo noticia:', error);
        res.status(500).json({ message: 'Error al obtener la noticia' });
    }
});

// Obtener todas las noticias
app.get('/api/noticias', async (req, res) => {
    console.log('🔍 Obteniendo todas las noticias...');
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM noticias ORDER BY fecha_creacion DESC'
        );
        console.log(`✅ Noticias obtenidas: ${rows.length}`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error obteniendo noticias:', error);
        res.status(500).json({ message: 'Error al obtener noticias' });
    }
});

// Crear noticia (solo ADMIN)
app.post('/api/noticias', verifyToken, async (req, res) => {
    try {
        // Verificar que el usuario es admin
        const [userRows] = await pool.execute(
            'SELECT rol FROM users WHERE id = ?',
            [req.user.sub]
        );

        if (userRows.length === 0 || userRows[0].rol !== 'admin') {
            return res.status(403).json({ message: 'No tienes permisos para crear noticias' });
        }

        const { titulo, contenido, imagen_url, enlace, destacada, hashtags, categoria, slug, meta_descripcion } = req.body;

        const [result] = await pool.execute(
            'INSERT INTO noticias (titulo, contenido, imagen_url, enlace, autor, destacada, hashtags, categoria, slug, meta_descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [titulo, contenido, imagen_url || null, enlace || null, req.user.username, destacada || false, hashtags || '', categoria || 'General', slug || '', meta_descripcion || '']
        );

        res.json({
            message: 'Noticia creada correctamente',
            id: result.insertId
        });
    } catch (error) {
        console.error('❌ Error creando noticia:', error);
        res.status(500).json({ message: 'Error al crear noticia' });
    }
});

// Eliminar noticia (solo ADMIN)
app.delete('/api/noticias/:id', verifyToken, async (req, res) => {
    try {
        // Verificar que el usuario es admin
        const [userRows] = await pool.execute(
            'SELECT rol FROM users WHERE id = ?',
            [req.user.sub]
        );

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
