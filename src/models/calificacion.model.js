const db = require('./db');

const getAll = async () => {
    const [rows] = await db.query(`
        SELECT 
            cal.id,
            cal.solicitud_id AS request_id,
            cal.puntuacion AS score,
            cal.comentario AS comment,
            cal.fecha AS date,
            s.descripcion AS request_description,
            u.nombre AS user_name,
            p.nombre AS professional_name,
            c.nombre AS category_name
        FROM calificaciones cal
        INNER JOIN solicitudes s ON cal.solicitud_id = s.id
        INNER JOIN usuarios u ON s.usuario_id = u.id
        LEFT JOIN profesionales p ON s.profesional_id = p.id
        LEFT JOIN categorias c ON s.categoria_id = c.id
        ORDER BY cal.fecha DESC, cal.id DESC
    `);
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(`
        SELECT 
            cal.id,
            cal.solicitud_id AS request_id,
            cal.puntuacion AS score,
            cal.comentario AS comment,
            cal.fecha AS date,
            s.descripcion AS request_description,
            s.direccion AS request_address,
            u.nombre AS user_name,
            p.nombre AS professional_name,
            c.nombre AS category_name
        FROM calificaciones cal
        INNER JOIN solicitudes s ON cal.solicitud_id = s.id
        INNER JOIN usuarios u ON s.usuario_id = u.id
        LEFT JOIN profesionales p ON s.profesional_id = p.id
        LEFT JOIN categorias c ON s.categoria_id = c.id
        WHERE cal.id = ?
    `, [id]);
    return rows[0];
};

const create = async ({ request_id, score, comment }) => {
    const [result] = await db.query(
        'INSERT INTO calificaciones (solicitud_id, puntuacion, comentario) VALUES (?, ?, ?)',
        [request_id, score, comment || null]
    );
    return result.insertId;
};

const update = async (id, { request_id, score, comment }) => {
    const [result] = await db.query(
        'UPDATE calificaciones SET solicitud_id = ?, puntuacion = ?, comentario = ? WHERE id = ?',
        [request_id, score, comment || null, id]
    );
    return result.affectedRows;
};

const remove = async (id) => {
    const [result] = await db.query('DELETE FROM calificaciones WHERE id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};