-- Tabla de noticias
USE spbasket;

CREATE TABLE IF NOT EXISTS noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  imagen_url VARCHAR(500),
  enlace VARCHAR(500),
  autor VARCHAR(100),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  destacada BOOLEAN DEFAULT FALSE,
  INDEX idx_fecha (fecha_creacion),
  INDEX idx_destacada (destacada)
) ENGINE=InnoDB;

-- Insertar noticias de ejemplo
INSERT INTO noticias (titulo, contenido, imagen_url, autor, destacada) VALUES
('Victoria del SP Basket', 'El equipo SP Negro consiguió una gran victoria en el partido del pasado sábado con un marcador de 85-72. Destacó la actuación de nuestros jugadores que demostraron un gran nivel de juego.', 'https://picsum.photos/seed/news1/800/400', 'Admin', TRUE),
('Nueva temporada 2024-2025', 'Comienza la nueva temporada con grandes expectativas para todos nuestros equipos. Este año contamos con nuevos fichajes y un plantel renovado con muchas ganas de triunfar.', 'https://picsum.photos/seed/news2/800/400', 'Admin', FALSE),
('Campus de Verano', 'Ya están abiertas las inscripciones para el campus de verano de SP Basket. Plazas limitadas. Más información en nuestra sección de contacto.', 'https://picsum.photos/seed/news3/800/400', 'Admin', FALSE);

SELECT * FROM noticias ORDER BY fecha_creacion DESC;
