
// ========== FAKE SERVER START ==========
// SERVIR ASSETS (IMÁGENES) EXPLÍCITAMENTE
// Esto asegura que si Nginx falla, Node las entrega.
app.use('/assets', express.static(path.join(__dirname, '../dist/sp-basket/browser/assets')));

// SERVIR FRONTEND STATICO (ANGULAR)
const frontendPath = path.join(__dirname, '../dist/sp-basket/browser');
app.use(express.static(frontendPath));

// Cualquier otra ruta -> devolver index.html (Angular Routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
