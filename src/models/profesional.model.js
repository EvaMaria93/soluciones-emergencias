const db = require('./db');

const getAll = async () => {
    const [rows] = await db.query(`
        SELECT 
            p.id,
            p.nombre AS name,
            p.telefono AS phone,
            p.email,
            p.matricula AS license,
            p.disponible AS available,
            p.categoria_id AS category_id,
            p.zona_id AS zone_id,
            c.nombre AS category_name,
            z.nombre AS zone_name
        FROM profesionales p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN zonas z ON p.zona_id = z.id
        ORDER BY p.nombre ASC
    `);
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(`
        SELECT 
            p.id,
            p.nombre AS name,
            p.telefono AS phone,
            p.email,
            p.matricula AS license,
            p.disponible AS available,
            p.categoria_id AS category_id,
            p.zona_id AS zone_id,
            c.nombre AS category_name,
            z.nombre AS zone_name
        FROM profesionales p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN zonas z ON p.zona_id = z.id
        WHERE p.id = ?
    `, [id]);
    return rows[0];
};

const create = async ({ name, phone, email, license, available, category_id, zone_id }) => {
    const [result] = await db.query(
        `INSERT INTO profesionales (nombre, telefono, email, matricula, disponible, categoria_id, zona_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            phone,
            email || null,
            license || null,
            available,
            category_id || null,
            zone_id || null
        ]
    );
    return result.insertId;
};

const update = async (id, { name, phone, email, license, available, category_id, zone_id }) => {
    const [result] = await db.query(
        `UPDATE profesionales 
         SET nombre = ?, telefono = ?, email = ?, matricula = ?, disponible = ?, categoria_id = ?, zona_id = ?
         WHERE id = ?`,
        [
            name,
            phone,
            email || null,
            license || null,
            available,
            category_id || null,
            zone_id || null,
            id
        ]
    );
    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query('DELETE FROM profesionales WHERE id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};