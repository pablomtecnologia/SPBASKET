-- Crear base de datos spbasket
-- Ejecutar con: psql -U postgres -f create-db.sql

-- Conectar a postgres DB
\c postgres

-- Crear la base de datos si no existe
SELECT 'CREATE DATABASE spbasket'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'spbasket')\gexec

-- Mensaje de confirmación
\echo 'Base de datos spbasket creada (o ya existía)'
