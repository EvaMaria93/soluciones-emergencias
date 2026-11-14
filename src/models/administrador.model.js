// ==========================================================
// administrador.model.js  ->  MODELO de la tabla "administradores"
// ==========================================================
// Solo los administradores pueden iniciar sesión en el panel.
const db = require('./db');

// Busca un administrador por email (se usa al iniciar sesión).
// Devuelve el password_hash para poder compararlo con bcrypt. Ese dato NUNCA se muestra en pantalla.
const getByEmail = async (email) => {
    const [rows] = await db.query(
        'SELECT id, nombre AS name, email, password_hash, activo FROM administradores WHERE email = ?',
        [email]
    );
    return rows[0];
};

// Crea un administrador. Recibe la contraseña YA encriptada (passwordHash).
const create = async ({ name, email, passwordHash }) => {
    const [result] = await db.query(
        'INSERT INTO administradores (nombre, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
    );
    return result.insertId;
};

module.exports = {
    getByEmail,
    create
};
