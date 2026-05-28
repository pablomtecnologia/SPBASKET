const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('server.js', 'utf-8');
const marker = "console.log('✅ Endpoint MANUAL IMPORT configurado');";
const index = content.lastIndexOf(marker);

if (index !== -1) {
    const newContent = content.substring(0, index + marker.length) + `
    
console.log('✅ Endpoints FECAN públicos configurados');

/* ========== SERVER START ========== */
// SERVIR ASSETS (IMÁGENES) EXPLÍCITAMENTE
app.use('/assets', express.static(path.join(__dirname, '../dist/sp-basket/browser/assets')));

// SERVIR FRONTEND STATICO (ANGULAR)
const frontendPath = path.join(__dirname, '../dist/sp-basket/browser');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Usamos la variable PORT ya definida al inicio
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
`;
    fs.writeFileSync('server.js', newContent);
    console.log('Fixed server.js');
} else {
    console.log('Marker not found');
}
