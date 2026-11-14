const Calificacion = require('../models/calificacion.model');
const Solicitud = require('../models/solicitud.model');
const { badRequest, notFound, serverError } = require('../helpers/errores');
const { validarComentario } = require('../helpers/validaciones');

// Solo se pueden calificar las solicitudes que ya terminaron (estado "finalizada").
// Esta función devuelve esa lista para armar el desplegable del formulario.
const solicitudesCalificables = async () => {
    const solicitudes = await Solicitud.getAll();
    return solicitudes.filter((sol) => sol.status === 'finalizada');
};

const index = async (req, res) => {
    try {
        const calificaciones = await Calificacion.getAll();
        res.render('calificaciones/index', { calificaciones });
    } catch (error) {
        serverError(res, error, '/calificaciones', 'Volver a calificaciones', 'Error al obtener las calificaciones');
    }
};

const show = async (req, res) => {
    try {
        const calificacion = await Calificacion.getById(req.params.id);
        if (!calificacion) {
            return notFound(res, 'Calificación no encontrada', '/calificaciones', 'Volver a calificaciones');
        }
        res.render('calificaciones/show', { calificacion });
    } catch (error) {
        serverError(res, error, '/calificaciones', 'Volver a calificaciones', 'Error al obtener el detalle de la calificación');
    }
};

const createForm = async (req, res) => {
    try {
        const solicitudes = await solicitudesCalificables();
        res.render('calificaciones/create', {
            error: null,
            calificacion: { score: 5 },
            solicitudes
        });
    } catch (error) {
        serverError(res, error, '/calificaciones', 'Volver a calificaciones', 'Error al cargar el formulario');
    }
};

const store = async (req, res) => {
    const request_id = req.body.request_id || '';
    const score = Number(req.body.score);
    const comment = (req.body.comment || '').trim();

    const problema = (!request_id || !Number.isInteger(score) || score < 1 || score > 5)
        ? 'Debés seleccionar una solicitud y una puntuación entre 1 y 5.'
        : validarComentario(comment);
    if (problema) {
        const solicitudes = await solicitudesCalificables();
        return res.status(400).render('calificaciones/create', {
            error: problema,
            calificacion: { request_id, score: req.body.score, comment },
            solicitudes
        });
    }

    try {
        // Regla: solo se califican solicitudes finalizadas
        const solicitud = await Solicitud.getById(request_id);
        if (solicitud && solicitud.status !== 'finalizada') {
            return res.status(400).render('calificaciones/create', {
                error: 'Solo se pueden calificar solicitudes finalizadas.',
                calificacion: { request_id, score, comment },
                solicitudes: await solicitudesCalificables()
            });
        }
        await Calificacion.create({ request_id, score, comment });
        res.redirect('/calificaciones');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const solicitudes = await solicitudesCalificables();
            return res.status(400).render('calificaciones/create', {
                error: 'Esa solicitud ya tiene una calificación registrada.',
                calificacion: { request_id, score, comment },
                solicitudes
            });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return badRequest(res, 'La solicitud elegida no existe.', '/calificaciones', 'Volver a calificaciones');
        }
        serverError(res, error, '/calificaciones', 'Volver a calificaciones', 'Error al guardar la calificación');
    }
};

const editForm = async (req, res) => {
    try {
        const [calificacion, solicitudes] = await Promise.all([
            Calificacion.getById(req.params.id),
            solicitudesCalificables()
        ]);

        if (!calificacion) {
            return notFound(res, 'Calificación no encontrada', '/calificaciones', 'Volver a calificaciones');
        }

        res.render('calificaciones/edit', { calificacion, solicitudes, error: null });
    } catch (error) {
        serverError(res, error, '/calificaciones', 'Volver a calificaciones', 'Error al cargar la calificación');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const request_id = req.body.request_id || '';
    const score = Number(req.body.score);
    const comment = (req.body.comment || '').trim();

    const problema = (!request_id || !Number.isInteger(score) || score < 1 || score > 5)
        ? 'Debés seleccionar una solicitud y una puntuación entre 1 y 5.'
        : validarComentario(comment);
    if (problema) {
        const solicitudes = await solicitudesCalificables();
        return res.status(400).render('calificaciones/edit', {
            calificacion: { id, request_id, score: req.body.score, comment },
            solicitudes,
            error: problema
        });
    }

    try {
        // Regla: solo se califican solicitudes finalizadas
        const solicitud = await Solicitud.getById(request_id);
        if (solicitud && solicitud.status !== 'finalizada') {
            return res.status(400).render('calificaciones/edit', {
                calificacion: { id, request_id, score, comment },
                solicitudes: await solicitudesCalificables(),
                error: 'Solo se pueden calificar solicitudes finalizadas.'
            });
        }
        const filas = await Calificacion.update(id, { request_id, score, comment });
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Calificación no encontrada', '/calificaciones', 'Volver a calificaciones');
        }
        res.redirect('/calificaciones');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const solicitudes = await solicitudesCalificables();
            return res.status(400).render('calificaciones/edit', {
                calificacion: { id, request_id, score, comment },
                solicitudes,
                error: 'Esa solicitud ya tiene otra calificación registrada.'
            });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return badRequest(res, 'La solicitud elegida no existe.', '/calificaciones', 'Volver a calificaciones');
        }
        serverError(res, error, '/calificaciones', 'Volver a calificaciones', 'Error al actualizar la calificación');
    }
};

const deleteForm = async (req, res) => {
    try {
        const calificacion = await Calificacion.getById(req.params.id);
        if (!calificacion) {
            return notFound(res, 'Calificación no encontrada', '/calificaciones', 'Volver a calificaciones');
        }
        res.render('calificaciones/delete', { calificacion });
    } catch (error) {
        serverError(res, error, '/calificaciones', 'Volver a calificaciones', 'Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        const filas = await Calificacion.remove(req.params.id);
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Calificación no encontrada', '/calificaciones', 'Volver a calificaciones');
        }
        res.redirect('/calificaciones');
    } catch (error) {
        serverError(res, error, '/calificaciones', 'Volver a calificaciones', 'Error al eliminar la calificación');
    }
};

module.exports = {
    index,
    show,
    createForm,
    store,
    editForm,
    update,
    deleteForm,
    destroy
};