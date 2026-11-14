-- ==========================================================
-- schema.sql  ->  Estructura de la base de datos (MySQL 8.0.16 o superior)
-- ==========================================================
-- Esta es la VERSIÓN 2 del esquema (la versión 1 queda en el historial de Git).
--
-- Cómo usarlo en tu compu (borra lo que haya, ideal para empezar de cero en desarrollo):
--   1) En MySQL:   DROP DATABASE IF EXISTS soluciones_emergencias;
--   2) Terminal:   mysql -u root -p < database/schema.sql
--
-- Importante: solo el ADMINISTRADOR entra a este panel. Los clientes y profesionales
-- son datos que el administrador carga y consulta, por eso NO tienen contraseña.
--
-- En el hosting la base ya viene creada: ahí se quitan las líneas CREATE DATABASE y USE.

-- Fuerza UTF-8 al leer este archivo. Sin esta línea, según la configuración de la terminal,
-- las tildes y la ñ pueden guardarse rotas (por ejemplo "PlomerÃ­a" en lugar de "Plomería").
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS soluciones_emergencias
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE soluciones_emergencias;

-- 1. ADMINISTRADORES  (quienes pueden iniciar sesión en el panel)
-- La contraseña NUNCA se guarda tal cual: se guarda su "hash" (una huella irreversible
-- que genera bcrypt). Si alguien viera la tabla, no podría leer las contraseñas.
CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,       -- 0 = cuenta desactivada (no puede entrar)
    fecha_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. ZONAS
-- UNIQUE en nombre: no se pueden cargar dos zonas con el mismo nombre.
CREATE TABLE zonas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

-- 3. CATEGORIAS (rubros: plomería, electricidad, cerrajería...)
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

-- 4. USUARIOS (los clientes que piden un servicio)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    telefono VARCHAR(30) NOT NULL,
    direccion VARCHAR(200)
) ENGINE=InnoDB;

-- 5. PROFESIONALES
-- CAMBIO: email obligatorio y único (el sistema les avisa por mail de las solicitudes),
--         y categoría y zona obligatorias (sin ellas no se los puede buscar).
-- ON DELETE RESTRICT = "no te dejo borrar una categoría o zona que todavía se usa".
CREATE TABLE profesionales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    matricula VARCHAR(50),
    disponible TINYINT(1) NOT NULL DEFAULT 1,
    categoria_id INT NOT NULL,
    zona_id INT NOT NULL,
    CONSTRAINT fk_prof_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prof_zona      FOREIGN KEY (zona_id)      REFERENCES zonas(id)      ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. SOLICITUDES
-- CAMBIO: antes, borrar un cliente borraba en cascada TODAS sus solicitudes y calificaciones,
--         y borrar una zona dejaba la solicitud con la zona en NULL. Ahora RESTRICT protege el historial.
-- CAMBIO: estado es un ENUM (la base rechaza estados inventados). Flujo normal:
--         pendiente -> presupuestada -> asignada -> en_proceso -> finalizada   (o cancelada)
-- CAMBIO: CHECK de presupuesto >= 0, fecha_actualizacion automática e índice por estado.
CREATE TABLE solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    zona_id INT NOT NULL,
    profesional_id INT NULL,                    -- NULL mientras ningún profesional cotizó
    descripcion TEXT NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    presupuesto DECIMAL(10, 2) NULL,
    estado ENUM('pendiente', 'presupuestada', 'asignada', 'en_proceso', 'finalizada', 'cancelada')
        NOT NULL DEFAULT 'pendiente',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_presupuesto CHECK (presupuesto IS NULL OR presupuesto >= 0),
    CONSTRAINT fk_sol_usuario     FOREIGN KEY (usuario_id)     REFERENCES usuarios(id)      ON DELETE RESTRICT,
    CONSTRAINT fk_sol_categoria   FOREIGN KEY (categoria_id)   REFERENCES categorias(id)    ON DELETE RESTRICT,
    CONSTRAINT fk_sol_zona        FOREIGN KEY (zona_id)        REFERENCES zonas(id)         ON DELETE RESTRICT,
    CONSTRAINT fk_sol_profesional FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE RESTRICT,
    INDEX idx_solicitudes_estado (estado)
) ENGINE=InnoDB;

-- 7. CALIFICACIONES
-- Una solicitud tiene como máximo una calificación (solicitud_id UNIQUE).
-- El profesional calificado se obtiene a través de la solicitud (no se repite acá).
-- CHECK: la base también valida que el puntaje esté entre 1 y 5, no solo el código.
CREATE TABLE calificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL UNIQUE,
    puntuacion TINYINT NOT NULL,
    comentario VARCHAR(500),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_puntuacion CHECK (puntuacion BETWEEN 1 AND 5),
    CONSTRAINT fk_cal_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================================
-- DATOS INICIALES (opcional). INSERT IGNORE evita errores si ya existen.
-- El primer administrador NO se crea acá: se crea con el script scripts/crear-admin.js
-- (así la contraseña se guarda encriptada).
-- ==========================================================
INSERT IGNORE INTO categorias (nombre, descripcion) VALUES
    ('Plomería', 'Pérdidas de agua, caños, destapaciones'),
    ('Electricidad', 'Cortocircuitos, tableros, instalaciones'),
    ('Cerrajería', 'Apertura de puertas, cambio de cerraduras'),
    ('Gas', 'Pérdidas y revisión de instalaciones de gas');
