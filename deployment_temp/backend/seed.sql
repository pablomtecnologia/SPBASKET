-- Semilla de datos para PostgreSQL

-- Usuario Admin
INSERT INTO users (username, password, email, nombre, apellidos, rol) 
VALUES ('admin', '$2a$10$X7V.j5q.Z1.h1.x1.y1.z1.w1.v1.u1.t1.s1.r1.q1.p1', 'admin@spbasket.com', 'Administrador', 'Principal', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Noticia de Bienvenida
INSERT INTO noticias (titulo, contenido, imagen_url, autor, destacada, hashtags, categoria, slug, meta_descripcion)
VALUES (
    '¡Feliz 2026! Lo mejor está por llegar', 
    '<p>Desde <strong>SP Basket</strong> os deseamos un feliz año nuevo lleno de baloncesto. 2026 será nuestro año. <strong>¡JUNTOS!</strong></p>', 
    '/assets/images/Feliz2026.jpg', 
    'Admin', 
    TRUE, 
    '#Feliz2026 #FamiliaSP', 
    'Noticias del Club', 
    'feliz-2026', 
    'Felicitación de año nuevo'
) ON CONFLICT DO NOTHING;
