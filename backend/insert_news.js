const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'spbasket',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('🔌 Conectando a la base de datos...');

        // Noticia 1: Feliz 2026
        const noticia1 = {
            titulo: '¡Feliz 2026! Lo mejor está por llegar',
            contenido: '<p>Desde <strong>SP Basket</strong> os deseamos un feliz año nuevo lleno de baloncesto, compañerismo y éxitos. Gracias por formar parte de esta gran familia. 2026 será nuestro año. <strong>¡JUNTOS!</strong></p>',
            imagen_url: '/assets/images/Feliz2026.jpg', // Ruta relativa al frontend
            autor: 'Admin',
            destacada: 1,
            hashtags: '#Feliz2026 #FamiliaSP #Baloncesto',
            categoria: 'Noticias del Club',
            slug: 'feliz-2026-lo-mejor-esta-por-llegar',
            meta_descripcion: 'Felicitación de año nuevo 2026 de SP Basket.'
        };

        // Noticia 2: Pioneers Basket Cup
        const noticia2 = {
            titulo: 'Pioneers Basket Cup - 3 de Enero 2026',
            contenido: '<p>¡Llega la <strong>Pioneers Basket Cup</strong>! Este <strong>3 de enero de 2026</strong> a partir de las 10:00 en el <strong>Pab. José Escandón</strong>.</p><p>Disfruta del mejor baloncesto con los equipos participantes:</p><ul><li>Pioneers</li><li>Cantbasket</li><li>Piélagos</li><li>Fenomenoak</li><li>Grupo de Cultura Covadonga</li></ul><p>¡Os esperamos a todos!</p>',
            imagen_url: '/assets/images/pioneers-cup-2026.jpg', // Ruta relativa al frontend
            autor: 'Admin',
            destacada: 1,
            hashtags: '#PioneersCup #Torneo #Basket',
            categoria: 'Competición',
            slug: 'pioneers-basket-cup-2026',
            meta_descripcion: 'Torneo Pioneers Basket Cup el 3 de Enero de 2026.'
        };

        // Insertar Noticia 1
        console.log('📝 Insertando noticia Feliz 2026...');
        await pool.execute(
            'INSERT INTO noticias (titulo, contenido, imagen_url, autor, destacada, hashtags, categoria, slug, meta_descripcion, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [noticia1.titulo, noticia1.contenido, noticia1.imagen_url, noticia1.autor, noticia1.destacada, noticia1.hashtags, noticia1.categoria, noticia1.slug, noticia1.meta_descripcion]
        );

        // Insertar Noticia 2
        console.log('📝 Insertando noticia Pioneers Cup...');
        await pool.execute(
            'INSERT INTO noticias (titulo, contenido, imagen_url, autor, destacada, hashtags, categoria, slug, meta_descripcion, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [noticia2.titulo, noticia2.contenido, noticia2.imagen_url, noticia2.autor, noticia2.destacada, noticia2.hashtags, noticia2.categoria, noticia2.slug, noticia2.meta_descripcion]
        );

        console.log('✅ Noticias creadas correctamente.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

main();
