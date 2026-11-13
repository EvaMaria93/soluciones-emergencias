const db = require('./db');

const getAll = async () => {
    const [rows] = await db.query(
        'SELECT id, nombre AS name, descripcion AS description FROM zonas ORDER BY nombre ASC'
    );
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(
        'SELECT id, nombre AS name, descripcion AS description FROM zonas WHERE id = ?',
        [id]
    );
    return rows[0];
};

const create = async ({ name, description }) => {
    const [result] = await db.query(
        'INSERT INTO zonas (nombre, descripcion) VALUES (?, ?)',
        [name, description || null]
    );
    return result.insertId;
};

const update = async (id, { name, description }) => {
    const [result] = await db.query(
        'UPDATE zonas SET nombre = ?, descripcion = ? WHERE id = ?',
        [name, description || null, id]
    );
    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query('DELETE FROM zonas WHERE id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};