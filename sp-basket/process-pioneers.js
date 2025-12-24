const fs = require('fs');
const path = require('path');

// Directorios
const srcDir = path.join(__dirname, 'src/assets/PIONEERS');
const destDir = path.join(__dirname, 'src/assets/pioneers_clean'); // Directorio limpio
const dataFile = path.join(__dirname, 'src/assets/pioneers-data.json');

// Crear directorio destino
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Función para limpiar texto (quita emojis y caracteres raros y extrae info)
function parseFileName(filename) {
    // 1. Intentar extraer NUMERO
    // Patrones: "numero 15", "nmero 15", "el 11", "LUCIENDO EL 10"
    const numMatch = filename.match(/(?:n.mero|el)\s+(\d+)/i) || filename.match(/(\d+)/);
    const numero = numMatch ? numMatch[1] : '00';

    // 2. Intentar extraer NOMBRE
    // Buscar palabra Capitalizada después del número o patrones comunes
    // Ej: "numero 4 Antonio", "el 11. ????David"
    // Eliminamos todo lo anterior al número y buscamos el nombre
    let textAfterNum = filename;
    if (numMatch) {
        textAfterNum = filename.substring(numMatch.index + numMatch[0].length);
    }

    // Limpieza agresiva de caracteres especiales al inicio
    textAfterNum = textAfterNum.replace(/^[ ,.;:\-?!\W]+/, '').trim();

    // El nombre suele ser la primera palabra o dos (si es compuesto ej: Ana Maria)
    // Pero cuidado con "risueo" etc.
    // Asumimos nombre es la primera palabra que empieza por Mayuscula (si la hay) o simplemente la primera palabra.
    const nameMatch = textAfterNum.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/) || textAfterNum.match(/^(\w+)/);
    let nombre = nameMatch ? nameMatch[1] : 'Pioneer';

    // Correcciones manuales si el regex falla en casos raros
    if (nombre.length < 2) nombre = 'Jugador';

    // 3. Descripción (Lema)
    // Es el resto del texto, limpiando el nombre
    let desc = textAfterNum.substring(nombre.length).replace(/^[ ,.;:\-?!]+/, '').trim();
    // Limpiar extensión .jpg
    desc = desc.replace(/\.(jpg|jpeg|png)$/i, '');

    // Si la descripción es muy corta o basura, poner una genérica
    if (desc.length < 10) desc = "Pasión y entrega en cada partido.";

    // Truncar descripción si es larguísima (nombre de archivo)
    if (desc.length > 100) desc = desc.substring(0, 97) + '...';

    return { nombre, numero, desc };
}

console.log('Procesando PIONEERS...');

try {
    const files = fs.readdirSync(srcDir);
    const players = [];

    files.forEach(file => {
        if (!file.match(/\.(jpg|jpeg|png)$/i)) return;

        // Parsear información del nombre infernal
        const info = parseFileName(file);

        // Crear nuevo nombre de archivo limpio
        // pioneer-{numero}-{nombre}.jpg
        // Asegurar que nombre solo tenga letras
        const safeName = info.nombre.replace(/[^a-zA-Z0-9]/g, '');
        const newFileName = `pioneer-${info.numero}-${safeName}.jpg`.toLowerCase();

        // Copiar archivo renombrado
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, newFileName);

        fs.copyFileSync(srcPath, destPath);

        console.log(`Procesado: [${info.numero}] ${info.nombre} -> ${newFileName}`);

        // Añadir a lista de datos
        players.push({
            id: info.numero,
            nombre: info.nombre,
            numero: info.numero,
            posicion: 'Jugador/a', // Default, no se puede inferir fácil
            lema: info.desc,
            foto: `/assets/pioneers_clean/${newFileName}`
        });
    });

    // Ordenar por número
    players.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));

    // Guardar JSON
    fs.writeFileSync(dataFile, JSON.stringify(players, null, 2));
    console.log(`\n¡Éxito! Procesados ${players.length} jugadores.`);
    console.log(`Datos guardados en: ${dataFile}`);
    console.log(`Imágenes limpias en: ${destDir}`);

} catch (err) {
    console.error('Error procesando archivos:', err);
}
