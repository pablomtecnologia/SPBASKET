// insert-fecan-manual.js - Inserta datos copiados manualmente de FECAN
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://spbasket_user:Basket2026!@localhost:5432/spbasket'
});

async function insertData(teamId, datos) {
    const client = await pool.connect();

    try {
        console.log(`\n🔄 Insertando datos de ${teamId}...`);

        // Limpiar datos anteriores
        await client.query('DELETE FROM fecan_clasificacion WHERE team_id = $1', [teamId]);
        await client.query('DELETE FROM fecan_partidos WHERE team_id = $1', [teamId]);
        console.log('✅ Datos anteriores eliminados');

        // Insertar clasificación
        if (datos.clasificacion && datos.clasificacion.length > 0) {
            console.log(`\n📊 Insertando ${datos.clasificacion.length} equipos en clasificación...`);

            for (const equipo of datos.clasificacion) {
                const diff = equipo.points_for - equipo.points_against;
                await client.query(`
                    INSERT INTO fecan_clasificacion 
                    (team_id, position, team_name, played, won, lost, points_for, points_against, points_diff, points, last_updated)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                `, [
                    teamId,
                    equipo.position,
                    equipo.team_name,
                    equipo.played,
                    equipo.won,
                    equipo.lost,
                    equipo.points_for,
                    equipo.points_against,
                    diff,
                    equipo.points
                ]);
            }
            console.log('✅ Clasificación insertada');
        }

        // Insertar partidos si existen
        if (datos.partidos && datos.partidos.length > 0) {
            console.log(`\n⚽ Insertando partidos...`);
            let insertados = 0;

            for (const partido of datos.partidos) {
                // Solo insertar si tiene datos válidos
                if (partido.equipo_local && partido.equipo_visitante) {
                    await client.query(`
                        INSERT INTO fecan_partidos 
                        (team_id, jornada, fecha, hora, equipo_local, equipo_visitante, 
                         resultado_local, resultado_visitante, pabellon, estado, last_updated)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                        ON CONFLICT (team_id, jornada, equipo_local, equipo_visitante) DO UPDATE
                        SET resultado_local = EXCLUDED.resultado_local,
                            resultado_visitante = EXCLUDED.resultado_visitante,
                            estado = EXCLUDED.estado
                    `, [
                        teamId,
                        partido.jornada || '0',
                        partido.fecha || '',
                        partido.hora || '',
                        partido.equipo_local,
                        partido.equipo_visitante,
                        partido.resultado_local,
                        partido.resultado_visitante,
                        partido.pabellon || '',
                        partido.estado || 'upcoming'
                    ]);
                    insertados++;
                }
            }
            console.log(`✅ ${insertados} partidos insertados`);
        }

        // Insertar info de competición
        await client.query(`
            INSERT INTO fecan_competicion_info (team_id, title, season, competition_id, last_updated)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (team_id) DO UPDATE 
            SET title = EXCLUDED.title, last_updated = CURRENT_TIMESTAMP
        `, [
            teamId,
            teamId === 'sp-negro' ? 'SP NEGRO - 2ª División' : 'SP ROSA - 1ª División',
            '2025-2026',
            teamId === 'sp-negro' ? 1675 : 1674
        ]);

        console.log(`\n✅ ${teamId.toUpperCase()} completado!`);

    } finally {
        client.release();
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     📥 INSERTANDO DATOS MANUALES DE FECAN                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
        // Intentar leer archivos JSON
        const files = ['datos-sp-negro.json', 'datos-sp-rosa.json'];

        for (const file of files) {
            if (fs.existsSync(file)) {
                console.log(`\n📂 Leyendo ${file}...`);
                const datos = JSON.parse(fs.readFileSync(file, 'utf-8'));
                await insertData(datos.teamId, datos);
            } else {
                console.log(`\n⚠️  No encontrado: ${file} (omitiendo)`);
            }
        }

        console.log('\n' + '═'.repeat(70));
        console.log('🎉 ¡INSERCIÓN COMPLETADA!');
        console.log('═'.repeat(70));
        console.log('\n💻 Ahora abre tu web en: http://localhost:4200/competiciones');
        console.log('📊 Verás los datos REALES de FECAN!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

main();
