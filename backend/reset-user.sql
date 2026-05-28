-- Script para resetear usuario PostgreSQL
-- Ejecuta esto con: psql -U postgres -f reset-user.sql

-- Eliminar usuario si existe
DROP USER IF EXISTS spbasket_user;

-- Crear nuevo usuario
CREATE USER spbasket_user WITH PASSWORD 'spbasket123';

-- Crear base de datos si no existe
DROP DATABASE IF EXISTS spbasket;
CREATE DATABASE spbasket OWNER spbasket_user;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE spbasket TO spbasket_user;

\echo 'Usuario spbasket_user creado con password: spbasket123'
