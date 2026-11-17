const db = require('./db');

const getAll = async () => {
    const [rows] = await db.query(`
        SELECT 
            s.id,
            s.usuario_id AS user_id,
            s.categoria_id AS category_id,
            s.zona_id AS zone_id,
            s.profesional_id AS professional_id,
            s.descripcion AS description,
            s.direccion AS address,
            s.presupuesto AS budget,
            s.estado AS status,
            s.fecha_creacion AS created_at,
            u.nombre AS user_name,
            u.telefono AS user_phone,
            c.nombre AS category_name,
            z.nombre AS zone_name,
            p.nombre AS professional_name
        FROM solicitudes s
        INNER JOIN usuarios u ON s.usuario_id = u.id
        LEFT JOIN categorias c ON s.categoria_id = c.id
        LEFT JOIN zonas z ON s.zona_id = z.id
        LEFT JOIN profesionales p ON s.profesional_id = p.id
        ORDER BY s.fecha_creacion DESC, s.id DESC
    `);
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(`
        SELECT 
            s.id,
            s.usuario_id AS user_id,
            s.categoria_id AS category_id,
            s.zona_id AS zone_id,
            s.profesional_id AS professional_id,
            s.descripcion AS description,
            s.direccion AS address,
            s.presupuesto AS budget,
            s.estado AS status,
            s.fecha_creacion AS created_at,
            u.nombre AS user_name,
            u.email AS user_email,
            u.telefono AS user_phone,
            c.nombre AS category_name,
            z.nombre AS zone_name,
            p.nombre AS professional_name,
            p.telefono AS professional_phone,
            p.email AS professional_email
        FROM solicitudes s
        INNER JOIN usuarios u ON s.usuario_id = u.id
        LEFT JOIN categorias c ON s.categoria_id = c.id
        LEFT JOIN zonas z ON s.zona_id = z.id
        LEFT JOIN profesionales p ON s.profesional_id = p.id
        WHERE s.id = ?
    `, [id]);
    return rows[0];
};

const create = async ({ user_id, category_id, zone_id, professional_id, description, address, budget, status }) => {
    const [result] = await db.query(
        `INSERT INTO solicitudes 
        (usuario_id, categoria_id, zona_id, profesional_id, descripcion, direccion, presupuesto, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user_id,
            category_id || null,
            zone_id || null,
            professional_id || null,
            description,
            address,
            budget !== '' && budget !== null ? budget : null,
            status || 'pendiente'
        ]
    );
    return result.insertId;
};

const update = async (id, { user_id, category_id, zone_id, professional_id, description, address, budget, status }) => {
    const [result] = await db.query(
        `UPDATE solicitudes 
        SET usuario_id = ?, categoria_id = ?, zona_id = ?, profesional_id = ?, 
        descripcion = ?, direccion = ?, presupuesto = ?, estado = ?
        WHERE id = ?`,
        [
            user_id,
            category_id || null,
            zone_id || null,
            professional_id || null,
            description,
            address,
            budget !== '' && budget !== null ? budget : null,
            status || 'pendiente',
            id
        ]
    );
    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query('DELETE FROM solicitudes WHERE id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};