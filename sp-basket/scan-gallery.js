const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/assets/galeria');
const outputFile = path.join(__dirname, 'src/assets/fotos.json');

console.log(`Escanenado ${srcDir}...`);

try {
    const files = fs.readdirSync(srcDir);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

    console.log(`Encontradas ${imageFiles.length} imágenes.`);

    fs.writeFileSync(outputFile, JSON.stringify(imageFiles, null, 2));
    console.log(`Lista guardada en ${outputFile}`);

} catch (err) {
    console.error('Error al escanear:', err);
}
