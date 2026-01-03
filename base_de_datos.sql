-- SIEMPRE EJECUTAR DENTRO DE LA BASE DE DATOS SELECCIONADA
-- PERO POR SI ACASO, INTENTAMOS USARLA (AUNQUE EN IONOS COMPARTIDO A VECES NO DEJA)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellidos` varchar(100) DEFAULT NULL,
  `rol` enum('admin','entrenador','jugador','usuario') DEFAULT 'usuario',
  `licencia` varchar(50) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `users` (Usuario Admin por defecto)
--

INSERT IGNORE INTO `users` (`username`, `password`, `email`, `nombre`, `apellidos`, `rol`) VALUES
('admin', '$2a$10$X7V.j5q.Z1.h1.x1.y1.z1.w1.v1.u1.t1.s1.r1.q1.p1', 'admin@spbasket.com', 'Administrador', 'Principal', 'admin');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `noticias`
--

CREATE TABLE IF NOT EXISTS `noticias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `enlace` varchar(255) DEFAULT NULL,
  `autor` varchar(100) DEFAULT 'Admin',
  `destacada` boolean DEFAULT 0,
  `hashtags` varchar(255) DEFAULT NULL,
  `categoria` varchar(50) DEFAULT 'General',
  `slug` varchar(255) DEFAULT NULL,
  `meta_descripcion` varchar(255) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `noticias`
--

INSERT INTO `noticias` (`titulo`, `contenido`, `imagen_url`, `autor`, `destacada`, `hashtags`, `categoria`, `slug`, `meta_descripcion`, `fecha_creacion`) VALUES
('¡Feliz 2026! Lo mejor está por llegar', '<p>Desde <strong>SP Basket</strong> os deseamos un feliz año nuevo lleno de baloncesto, compañerismo y éxitos. Gracias por formar parte de esta gran familia. 2026 será nuestro año. <strong>¡JUNTOS!</strong></p>', './assets/images/Feliz2026.jpg', 'Admin', 1, '#Feliz2026 #FamiliaSP #Baloncesto', 'Noticias del Club', 'feliz-2026-lo-mejor-esta-por-llegar', 'Felicitación de año nuevo 2026 de SP Basket.', NOW()),
('Pioneers Basket Cup - 3 de Enero 2026', '<p>¡Llega la <strong>Pioneers Basket Cup</strong>! Este <strong>3 de enero de 2026</strong> a partir de las 10:00 en el <strong>Pab. José Escandón</strong>.</p><p>Disfruta del mejor baloncesto con los equipos participantes:</p><ul><li>Pioneers</li><li>Cantbasket</li><li>Piélagos</li><li>Fenomenoak</li><li>Grupo de Cultura Covadonga</li></ul><p>¡Os esperamos a todos!</p>', './assets/images/pioneers-cup-2026.jpg', 'Admin', 1, '#PioneersCup #Torneo #Basket', 'Competición', 'pioneers-basket-cup-2026', 'Torneo Pioneers Basket Cup el 3 de Enero de 2026.', NOW());

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reconocimientos_medicos`
--

CREATE TABLE IF NOT EXISTS `reconocimientos_medicos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `licencia` varchar(50) NOT NULL,
  `archivo_url` varchar(255) NOT NULL,
  `estado` enum('pendiente','validado','rechazado') DEFAULT 'pendiente',
  `mensaje_admin` text DEFAULT NULL,
  `validado_por` int(11) DEFAULT NULL,
  `fecha_subida` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_validacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_reconocimientos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `papeletas`
--

CREATE TABLE IF NOT EXISTS `papeletas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `foto_url` varchar(255) NOT NULL,
  `estado` enum('pendiente','validado','rechazado') DEFAULT 'pendiente',
  `pagado` boolean DEFAULT FALSE,
  `fecha_subida` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_papeletas_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
