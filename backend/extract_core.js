const fs = require('fs');

try {
    const content = fs.readFileSync('server_bak_corrupt.js', 'utf8'); // Assuming UTF-8 which Node handles well usually
    const lines = content.split('\n');

    // Inicio Rutas Generales
    const startIdx = lines.findIndex(l => l.includes('// ================= RUTAS ================='));

    // Fin (Justo antes de FECAN)
    const endIdx = lines.findIndex(l => l.includes('// ========== FECAN SCRAPING ENDPOINTS =========='));

    if (startIdx !== -1 && endIdx !== -1) {
        console.log(`Buscando bloque core entre líneas ${startIdx} y ${endIdx}`);
        const coreBlock = lines.slice(startIdx, endIdx).join('\n');
        fs.writeFileSync('core_routes.js', coreBlock, 'utf8');
        console.log('✅ core_routes.js extraído con éxito.');
    } else {
        console.error('❌ No se encontraron los marcadores de bloque core.');
        console.log('Start:', startIdx, 'End:', endIdx);
    }

} catch (e) {
    console.error('Error:', e.message);
}
