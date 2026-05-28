const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgres://spbasket:PinguinoBasket123!@localhost:5432/spbasket'
});

const sql = `
-- Informacion de la competicion
CREATE TABLE IF NOT EXISTS competition_info (
    team_id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    season VARCHAR(50),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clasificacion
CREATE TABLE IF NOT EXISTS competition_standings (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL,
    position INTEGER,
    team_name VARCHAR(255) NOT NULL,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    unique(team_id, team_name)
);

-- Partidos
CREATE TABLE IF NOT EXISTS competition_matches (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) NOT NULL,
    round INTEGER,
    match_date VARCHAR(50),
    match_time VARCHAR(50),
    home_team VARCHAR(255),
    away_team VARCHAR(255),
    location VARCHAR(255),
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(50) DEFAULT 'upcoming'
);
`;

async function setup() {
    try {
        console.log('🚀 Iniciando creación de tablas...');
        await pool.query(sql);
        console.log('✅ Tablas creadas con éxito');

        // Insertar datos iniciales si no existen
        await pool.query(`
      INSERT INTO competition_info (team_id, title, category, season) 
      VALUES ('sp-rosa', 'SP ROSA', '1ª División Femenina', '2025/2026'),
             ('sp-negro', 'SP NEGRO', '2ª División Masculina', '2025/2026')
      ON CONFLICT (team_id) DO NOTHING;
    `);
        console.log('✅ Datos iniciales insertados');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

setup();
