-- Añadir nuevas columnas a la tabla noticias
USE spbasket;

ALTER TABLE noticias 
ADD COLUMN hashtags VARCHAR(500),
ADD COLUMN categoria VARCHAR(100) DEFAULT 'General',
ADD COLUMN slug VARCHAR(255),
ADD COLUMN meta_descripcion VARCHAR(500);

-- Ver la estructura actualizada
DESCRIBE noticias;

-- Actualizar las noticias existentes con valores por defecto
UPDATE noticias SET categoria = 'General' WHERE categoria IS NULL;
UPDATE noticias SET hashtags = '' WHERE hashtags IS NULL;

SELECT * FROM noticias;
