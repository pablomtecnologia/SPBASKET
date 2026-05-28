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
