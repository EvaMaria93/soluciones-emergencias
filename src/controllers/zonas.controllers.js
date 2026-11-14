const Zona = require('../models/zona.model');
const { badRequest, notFound, serverError } = require('../helpers/errores');
const { validarCatalogo } = require('../helpers/validaciones');

const index = async (req, res) => {
    try {
        const zonas = await Zona.getAll();
        res.render('zonas/index', { zonas });
    } catch (error) {
        serverError(res, error, '/zonas', 'Volver a zonas', 'Error al obtener las zonas');
    }
};

const show = async (req, res) => {
    try {
        const zona = await Zona.getById(req.params.id);
        if (!zona) {
            return notFound(res, 'Zona no encontrada', '/zonas', 'Volver a zonas');
        }
        res.render('zonas/show', { zona });
    } catch (error) {
        serverError(res, error, '/zonas', 'Volver a zonas', 'Error al obtener el detalle de la zona');
    }
};

const createForm = (req, res) => {
    res.render('zonas/create', { error: null, zona: {} });
};

const store = async (req, res) => {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    const problema = validarCatalogo({ name, description }, 'zona');
    if (problema) {
        return res.status(400).render('zonas/create', {
            error: problema,
            zona: { name, description }
        });
    }

    try {
        await Zona.create({ name, description });
        res.redirect('/zonas');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('zonas/create', {
                error: 'Ya existe la zona con ese nombre.',
                zona: { name, description }
            });
        }
        serverError(res, error, '/zonas', 'Volver a zonas', 'Error al guardar la zona');
    }
};

const editForm = async (req, res) => {
    try {
        const zona = await Zona.getById(req.params.id);
        if (!zona) {
            return notFound(res, 'Zona no encontrada', '/zonas', 'Volver a zonas');
        }
        res.render('zonas/edit', { zona, error: null });
    } catch (error) {
        serverError(res, error, '/zonas', 'Volver a zonas', 'Error al cargar la zona');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    const problema = validarCatalogo({ name, description }, 'zona');
    if (problema) {
        return res.status(400).render('zonas/edit', {
            zona: { id, name, description },
            error: problema
        });
    }

    try {
        const filas = await Zona.update(id, { name, description });
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Zona no encontrada', '/zonas', 'Volver a zonas');
        }
        res.redirect('/zonas');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('zonas/edit', {
                zona: { id, name, description },
                error: 'Ya existe la zona con ese nombre.'
            });
        }
        serverError(res, error, '/zonas', 'Volver a zonas', 'Error al actualizar la zona');
    }
};

const deleteForm = async (req, res) => {
    try {
        const zona = await Zona.getById(req.params.id);
        if (!zona) {
            return notFound(res, 'Zona no encontrada', '/zonas', 'Volver a zonas');
        }
        res.render('zonas/delete', { zona });
    } catch (error) {
        serverError(res, error, '/zonas', 'Volver a zonas', 'Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        const filas = await Zona.remove(req.params.id);
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Zona no encontrada', '/zonas', 'Volver a zonas');
        }
        res.redirect('/zonas');
    } catch (error) {
        // Con el esquema nuevo la base NO deja borrar algo que está en uso (ON DELETE RESTRICT)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return badRequest(res, 'No se puede eliminar la zona porque hay profesionales o solicitudes que la usan.', '/zonas', 'Volver a zonas');
        }
        serverError(res, error, '/zonas', 'Volver a zonas', 'Error al eliminar la zona');
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