const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/assets/galeria');
const destDirImages = path.join(__dirname, 'src/assets/images'); // Para uso específico (equipos, etc)
const destDirGallery = path.join(__dirname, 'src/assets/galeria_clean'); // Para la galería general

// Crear directorios si no existen
if (!fs.existsSync(destDirImages)) fs.mkdirSync(destDirImages, { recursive: true });
if (!fs.existsSync(destDirGallery)) fs.mkdirSync(destDirGallery, { recursive: true });

// Mapa de imágenes críticas a renombrar y mover a assets/images
const criticalImages = {
    '130-DSC03621.jpg': 'team-sp-negro.jpg',
    '8-DSC02347.jpg': 'team-senior-fem.jpg',
    '10-DSC02377.jpg': 'team-juv-masc.jpg',
    '15-DSC02428.jpg': 'team-cadete-fem.jpg',
    '135-DSC03652.jpg': 'comp-rosa.jpg',
    '108-DSC03445.jpg': 'comp-blanco.jpg',
    '5-DSC02214.jpg': 'comp-negro.jpg',
    '115-DSC03485.jpg': 'bg-contacto.jpg',
    '112-DSC03466.jpg': 'bg-galeria.jpg',
    '138-DSC03672.jpg': 'bg-productos.jpg',
    '24-DSC02515.jpg': 'bg-perfil.jpg',
    '136-DSC03657.jpg': 'bg-login.jpg',
    '52-DSC02821.jpg': 'bg-register.jpg',
    '1-MEDIA DAY PORTADA.jpg': 'bg-home.jpg',
    '140-1 3.jpg': 'bg-docs.jpg'
};

// 1. Procesar imágenes críticas
console.log('Procesando imágenes críticas...');
for (const [originalName, newName] of Object.entries(criticalImages)) {
    const srcPath = path.join(srcDir, originalName);
    const destPath = path.join(destDirImages, newName);

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copiado: ${originalName} -> images/${newName}`);
    } else {
        console.warn(`AVISO: No encontrada imagen crítica: ${originalName}`);
    }
}

// 2. Procesar TODA la galería para normalizar nombres
console.log('Normalizando galería completa...');
const files = fs.readdirSync(srcDir);
const galleryMap = [];

let counter = 1;
files.forEach(file => {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
        const ext = path.extname(file);
        const newName = `gallery-${counter.toString().padStart(3, '0')}${ext}`;
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDirGallery, newName); // Copiar a galeria_clean

        fs.copyFileSync(srcPath, destPath);
        galleryMap.push(newName);
        counter++;
    }
});

// Guardar manifiesto de galería para usar en galeria.ts
const manifestPath = path.join(__dirname, 'src/assets/gallery-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(galleryMap, null, 2));
console.log(`Galería normalizada: ${counter - 1} imágenes procesadas en galeria_clean.`);
console.log('Manifiesto guardado en src/assets/gallery-manifest.json');
