-- backend/db.sql
-- Create database and users table for SP Basket
CREATE DATABASE IF NOT EXISTS spbasket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spbasket;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- Sample users (passwords hashed with bcrypt, 10 rounds)
INSERT INTO users (username, email, password) VALUES
('admin',    'admin@spbasket.com',    '$2a$10$K1V0cG9YgZ9VxXJc3B1hUe5Lz7eG/2e6K9tVh9Xg5aJf4sQz9cZyW'),
('jugador',  'jugador@spbasket.com',  '$2a$10$3hB9uKf7Yc6ZxVh2Jt9lDe1Rk8fG/5e2L9pVh9Xg6bJf5sQz8cYzU'),
('entrenador','entrenador@spbasket.com','$2a$10$7hC9vLf5Yd8ZxTh3Jt9kEe2Rk5gG/6e3L9pVh4Xg7bJf6sQz9cZzV');
