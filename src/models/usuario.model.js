const db = require('./db');

const getAll = async () => {
    const [rows] = await db.query(
        'SELECT id, nombre AS name, email, telefono AS phone, direccion AS address FROM usuarios ORDER BY nombre ASC'
    );
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT id, nombre AS name, email, telefono AS phone, direccion AS address FROM usuarios WHERE id = ?',
        [id]
    );
    return rows[0];
};

const create = async ({ name, email, phone, address }) => {
    const [result] = await db.query(
        'INSERT INTO usuarios (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)',
        [name, email, phone, address || null]
    );
    return result.insertId;
};

const update = async (id, { name, email, phone, address }) => {
    const [result] = await db.query(
        'UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?',
        [name, email, phone, address || null, id]
    );
    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};