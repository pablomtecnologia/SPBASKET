-- update-database.sql - Actualizar tabla users con nuevos campos
USE spbasket;

-- Añadir nuevos campos a la tabla users
ALTER TABLE users 
ADD COLUMN nombre VARCHAR(100),
ADD COLUMN apellidos VARCHAR(100),
ADD COLUMN rol ENUM('admin', 'usuario') DEFAULT 'usuario',
ADD COLUMN licencia VARCHAR(50),
ADD COLUMN foto VARCHAR(255);

-- Actualizar usuarios existentes con datos de ejemplo
UPDATE users SET nombre = 'Admin', apellidos = 'Principal', rol = 'admin', licencia = 'ADM-001', foto = '' WHERE username = 'admin';
UPDATE users SET nombre = 'Juan', apellidos = 'García López', rol = 'usuario', licencia = 'JUG-123', foto = '' WHERE username = 'jugador';
UPDATE users SET nombre = 'Carlos', apellidos = 'Martínez Ruiz', rol = 'usuario', licencia = 'ENT-456', foto = '' WHERE username = 'entrenador';

-- Verificar que se actualizó correctamente
SELECT id, username, nombre, apellidos, rol, licencia FROM users;
