-- Tabla para reconocimientos médicos
CREATE TABLE IF NOT EXISTS reconocimientos_medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    licencia VARCHAR(50),
    archivo_url VARCHAR(500) NOT NULL,
    estado ENUM('pendiente', 'validado', 'rechazado') DEFAULT 'pendiente',
    mensaje_admin TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_validacion TIMESTAMP NULL,
    validado_por INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (validado_por) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_estado (estado),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
