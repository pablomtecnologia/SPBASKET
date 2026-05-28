// insert-demo-data.js - Inserta datos de ejemplo en la BD
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

// Datos de ejemplo para SP ROSA
const demoClasificacionRosa = [
    { position: 1, team: 'SASKI PENGUINS ROSA', played: 10, won: 8, lost: 2, pointsFor: 650, pointsAgainst: 580, points: 18 },
    { position: 2, team: 'CB SANTANDER', played: 10, won: 7, lost: 3, pointsFor: 620, pointsAgainst: 590, points: 17 },
    { position: 3, team: 'AUSARTA BARAKALDO', played: 10, won: 6, lost: 4, pointsFor: 610, pointsAgainst: 600, points: 16 },
    { position: 4, team: 'UNIVERSITY OVIEDO', played: 10, won: 5, lost: 5, pointsFor: 590, pointsAgainst: 595, points: 15 },
    { position: 5, team: 'ALISAS CANTABRIA', played: 10, won: 4, lost: 6, pointsFor: 580, pointsAgainst: 610, points: 14 }
];

const demoPartidosRosa = [
    { jornada: '1', fecha: '05/10/2025', hora: '18:30', equipoLocal: 'SASKI PENGUINS ROSA', equipoVisitante: 'CB SANTANDER', resultadoLocal: 68, resultadoVisitante: 62, pabellon: 'Pabellón Municipal', estado: 'played' },
    { jornada: '2', fecha: '12/10/2025', hora: '19:00', equipoLocal: 'AUSARTA BARAKALDO', equipoVisitante: 'SASKI PENGUINS ROSA', resultadoLocal: 55, resultadoVisitante: 61, pabellon: 'Polideportivo Barakaldo', estado: 'played' },
    { jornada: '3', fecha: '19/10/2025', hora: '18:30', equipoLocal: 'SASKI PENGUINS ROSA', equipoVisitante: 'UNIVERSITY OVIEDO', resultadoLocal: 72, resultadoVisitante: 68, pabellon: 'Pabellón Municipal', estado: 'played' },
    { jornada: '4', fecha: '26/10/2025', hora: '19:30', equipoLocal: 'ALISAS CANTABRIA', equipoVisitante: 'SASKI PENGUINS ROSA', resultadoLocal: 58, resultadoVisitante: 65, pabellon: 'Pabellón Alisas', estado: 'played' },
    { jornada: '5', fecha: '02/11/2025', hora: '18:30', equipoLocal: 'SASKI PENGUINS ROSA', equipoVisitante: 'CB SANTANDER', resultadoLocal: null, resultadoVisitante: null, pabellon: 'Pabellón Municipal', estado: 'upcoming' },
    { jornada: '6', fecha: '09/11/2025', hora: '19:00', equipoLocal: 'UNIVERSITY OVIEDO', equipoVisitante: 'SASKI PENGUINS ROSA', resultadoLocal: null, resultadoVisitante: null, pabellon: 'Polideportivo Oviedo', estado: 'upcoming' }
];

// Datos de ejemplo para SP NEGRO
const demoClasificacionNegro = [
    { position: 1, team: 'CANTBASKET 04', played: 10, won: 9, lost: 1, pointsFor: 680, pointsAgainst: 550, points: 19 },
    { position: 2, team: 'SASKI PENGUINS NEGRO', played: 10, won: 7, lost: 3, pointsFor: 640, pointsAgainst: 590, points: 17 },
    { position: 3, team: 'PIELAGOS BASKET', played: 10, won: 6, lost: 4, pointsFor: 620, pointsAgainst: 600, points: 16 },
    { position: 4, team: 'CB BEZANA', played: 10, won: 4, lost: 6, pointsFor: 590, pointsAgainst: 620, points: 14 },
    { position: 5, team: 'BASKET TORRELAVEGA', played: 10, won: 3, lost: 7, pointsFor: 560, pointsAgainst: 650, points: 13 }
];

const demoPartidosNegro = [
    { jornada: '1', fecha: '06/10/2025', hora: '17:00', equipoLocal: 'SASKI PENGUINS NEGRO', equipoVisitante: 'CANTBASKET 04', resultadoLocal: 62, resultadoVisitante: 68, pabellon: 'Pabellón Municipal', estado: 'played' },
    { jornada: '2', fecha: '13/10/2025', hora: '18:00', equipoLocal: 'PIELAGOS BASKET', equipoVisitante: 'SASKI PENGUINS NEGRO', resultadoLocal: 58, resultadoVisitante: 64, pabellon: 'Polideportivo Piélagos', estado: 'played' },
    { jornada: '3', fecha: '20/10/2025', hora: '17:00', equipoLocal: 'SASKI PENGUINS NEGRO', equipoVisitante: 'CB BEZANA', resultadoLocal: 70, resultadoVisitante: 55, pabellon: 'Pabellón Municipal', estado: 'played' },
    { jornada: '4', fecha: '27/10/2025', hora: '18:30', equipoLocal: 'BASKET TORRELAVEGA', equipoVisitante: 'SASKI PENGUINS NEGRO', resultadoLocal: 52, resultadoVisitante: 67, pabellon: 'Pabellón Torrelavega', estado: 'played' },
    { jornada: '5', fecha: '03/11/2025', hora: '17:00', equipoLocal: 'SASKI PENGUINS NEGRO', equipoVisitante: 'CANTBASKET 04', resultadoLocal: null, resultadoVisitante: null, pabellon: 'Pabellón Municipal', estado: 'upcoming' },
    { jornada: '6', fecha: '10/11/2025', hora: '18:00', equipoLocal: 'CB BEZANA', equipoVisitante: 'SASKI PENGUINS NEGRO', resultadoLocal: null, resultadoVisitante: null, pabellon: 'Pabellón Bezana', estado: 'upcoming' }
];

async function insertDemoData() {
    console.log('🎬 Insertando datos de DEMOSTRACIÓN en la base de datos...\n');

    try {
        // Limpiar datos anteriores
        console.log('🧹 Limpiando datos antiguos...');
        await pool.query('DELETE FROM fecan_clasificacion');
        await pool.query('DELETE FROM fecan_partidos');
        await pool.query('DELETE FROM fecan_competicion_info');
        console.log('✅ Datos antiguos eliminados\n');

        // Insertar info de competición
        console.log('ℹ️  Insertando info de competiciones...');
        await pool.query(`
            INSERT INTO fecan_competicion_info (team_id, title, season, competition_id)
            VALUES 
                ('sp-rosa', 'Liga Femenina Senior - Grupo A', '2025/2026', 1674),
                ('sp-negro', 'Liga Masculina Senior - Grupo B', '2025/2026', 1675)
            ON CONFLICT (team_id) DO UPDATE
            SET title = EXCLUDED.title, season = EXCLUDED.season, competition_id = EXCLUDED.competition_id
        `);
        console.log('✅ Info de competiciones insertada\n');

        // Insertar clasificación SP ROSA
        console.log('🏆 Insertando clasificación SP ROSA...');
        for (const team of demoClasificacionRosa) {
            await pool.query(`
                INSERT INTO fecan_clasificacion 
                (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (team_id, team_name) DO UPDATE
                SET position = EXCLUDED.position, played = EXCLUDED.played, won = EXCLUDED.won,
                    lost = EXCLUDED.lost, points_for = EXCLUDED.points_for, 
                    points_against = EXCLUDED.points_against, points_diff = EXCLUDED.points_diff,
                    points = EXCLUDED.points
            `, [
                'sp-rosa', team.position, team.team, team.played, team.won, team.lost,
                team.pointsFor, team.pointsAgainst, team.pointsFor - team.pointsAgainst, team.points
            ]);
        }
        console.log(`✅ ${demoClasificacionRosa.length} equipos insertados en clasificación SP ROSA\n`);

        // Insertar clasificación SP NEGRO
        console.log('🏆 Insertando clasificación SP NEGRO...');
        for (const team of demoClasificacionNegro) {
            await pool.query(`
                INSERT INTO fecan_clasificacion 
                (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (team_id, team_name) DO UPDATE
                SET position = EXCLUDED.position, played = EXCLUDED.played, won = EXCLUDED.won,
                    lost = EXCLUDED.lost, points_for = EXCLUDED.points_for, 
                    points_against = EXCLUDED.points_against, points_diff = EXCLUDED.points_diff,
                    points = EXCLUDED.points
            `, [
                'sp-negro', team.position, team.team, team.played, team.won, team.lost,
                team.pointsFor, team.pointsAgainst, team.pointsFor - team.pointsAgainst, team.points
            ]);
        }
        console.log(`✅ ${demoClasificacionNegro.length} equipos insertados en clasificación SP NEGRO\n`);

        // Insertar partidos SP ROSA
        console.log('⚽ Insertando partidos SP ROSA...');
        for (const match of demoPartidosRosa) {
            await pool.query(`
                INSERT INTO fecan_partidos 
                (team_id, jornada, fecha, hora, equipo_local, equipo_visitante, 
                 resultado_local, resultado_visitante, pabellon, estado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (team_id, jornada, equipo_local, equipo_visitante) DO UPDATE
                SET fecha = EXCLUDED.fecha, hora = EXCLUDED.hora,
                    resultado_local = EXCLUDED.resultado_local,
                    resultado_visitante = EXCLUDED.resultado_visitante,
                    pabellon = EXCLUDED.pabellon, estado = EXCLUDED.estado
            `, [
                'sp-rosa', match.jornada, match.fecha, match.hora,
                match.equipoLocal, match.equipoVisitante,
                match.resultadoLocal, match.resultadoVisitante,
                match.pabellon, match.estado
            ]);
        }
        console.log(`✅ ${demoPartidosRosa.length} partidos insertados para SP ROSA\n`);

        // Insertar partidos SP NEGRO
        console.log('⚽ Insertando partidos SP NEGRO...');
        for (const match of demoPartidosNegro) {
            await pool.query(`
                INSERT INTO fecan_partidos 
                (team_id, jornada, fecha, hora, equipo_local, equipo_visitante, 
                 resultado_local, resultado_visitante, pabellon, estado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (team_id, jornada, equipo_local, equipo_visitante) DO UPDATE
                SET fecha = EXCLUDED.fecha, hora = EXCLUDED.hora,
                    resultado_local = EXCLUDED.resultado_local,
                    resultado_visitante = EXCLUDED.resultado_visitante,
                    pabellon = EXCLUDED.pabellon, estado = EXCLUDED.estado
            `, [
                'sp-negro', match.jornada, match.fecha, match.hora,
                match.equipoLocal, match.equipoVisitante,
                match.resultadoLocal, match.resultadoVisitante,
                match.pabellon, match.estado
            ]);
        }
        console.log(`✅ ${demoPartidosNegro.length} partidos insertados para SP NEGRO\n`);

        console.log('═'.repeat(80));
        console.log('🎉 ¡DATOS DE DEMOSTRACIÓN INSERTADOS CORRECTAMENTE!');
        console.log('═'.repeat(80));
        console.log('\n📊 Resumen:');
        console.log(`   SP ROSA: ${demoClasificacionRosa.length} equipos, ${demoPartidosRosa.length} partidos`);
        console.log(`   SP NEGRO: ${demoClasificacionNegro.length} equipos, ${demoPartidosNegro.length} partidos`);
        console.log('\n🚀 Ahora puedes arrancar el servidor y probar los endpoints API!\n');

    } catch (error) {
        console.error('❌ Error insertando datos:', error);
    } finally {
        await pool.end();
    }
}

insertDemoData();
