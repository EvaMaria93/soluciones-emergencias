const Calificacion = require('../models/calificacion.model');
const Solicitud = require('../models/solicitud.model');

const index = async (req, res) => {
    try {
        const calificaciones = await Calificacion.getAll();
        res.render('calificaciones/index', { calificaciones });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener las calificaciones');
    }
};

const show = async (req, res) => {
    try {
        const calificacion = await Calificacion.getById(req.params.id);
        if (!calificacion) {
            return res.status(404).send('Calificación no encontrada');
        }
        res.render('calificaciones/show', { calificacion });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener el detalle de la calificación');
    }
};

const createForm = async (req, res) => {
    try {
        const solicitudes = await Solicitud.getAll();
        res.render('calificaciones/create', {
            error: null,
            calificacion: { score: 5 },
            solicitudes
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el formulario');
    }
};

const store = async (req, res) => {
    const request_id = req.body.request_id || '';
    const score = Number(req.body.score);
    const comment = (req.body.comment || '').trim();

    if (!request_id || !Number.isInteger(score) || score < 1 || score > 5) {
        const solicitudes = await Solicitud.getAll();
        return res.status(400).render('calificaciones/create', {
            error: 'Debés seleccionar una solicitud y una puntuación entre 1 y 5.',
            calificacion: { request_id, score: req.body.score, comment },
            solicitudes
        });
    }

    try {
        await Calificacion.create({ request_id, score, comment });
        res.redirect('/calificaciones');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const solicitudes = await Solicitud.getAll();
            return res.status(400).render('calificaciones/create', {
                error: 'Esa solicitud ya tiene una calificación registrada.',
                calificacion: { request_id, score, comment },
                solicitudes
            });
        }
        console.error(error);
        res.status(500).send('Error al guardar la calificación');
    }
};

const editForm = async (req, res) => {
    try {
        const [calificacion, solicitudes] = await Promise.all([
            Calificacion.getById(req.params.id),
            Solicitud.getAll()
        ]);

        if (!calificacion) {
            return res.status(404).send('Calificación no encontrada');
        }

        res.render('calificaciones/edit', { calificacion, solicitudes, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la calificación');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const request_id = req.body.request_id || '';
    const score = Number(req.body.score);
    const comment = (req.body.comment || '').trim();

    if (!request_id || !Number.isInteger(score) || score < 1 || score > 5) {
        const solicitudes = await Solicitud.getAll();
        return res.status(400).render('calificaciones/edit', {
            calificacion: { id, request_id, score: req.body.score, comment },
            solicitudes,
            error: 'Debés seleccionar una solicitud y una puntuación entre 1 y 5.'
        });
    }

    try {
        await Calificacion.update(id, { request_id, score, comment });
        res.redirect('/calificaciones');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const solicitudes = await Solicitud.getAll();
            return res.status(400).render('calificaciones/edit', {
                calificacion: { id, request_id, score, comment },
                solicitudes,
                error: 'Esa solicitud ya tiene otra calificación registrada.'
            });
        }
        console.error(error);
        res.status(500).send('Error al actualizar la calificación');
    }
};

const deleteForm = async (req, res) => {
    try {
        const calificacion = await Calificacion.getById(req.params.id);
        if (!calificacion) {
            return res.status(404).send('Calificación no encontrada');
        }
        res.render('calificaciones/delete', { calificacion });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        await Calificacion.remove(req.params.id);
        res.redirect('/calificaciones');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar la calificación');
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