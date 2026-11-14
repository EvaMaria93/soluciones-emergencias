const Profesional = require('../models/profesional.model');
const Categoria = require('../models/categoria.model');
const Zona = require('../models/zona.model');
const { badRequest, notFound, serverError } = require('../helpers/errores');
const { validarProfesional } = require('../helpers/validaciones');

const index = async (req, res) => {
    try {
        const profesionales = await Profesional.getAll();
        res.render('profesionales/index', { profesionales });
    } catch (error) {
        serverError(res, error, '/profesionales', 'Volver a profesionales', 'Error al obtener los profesionales');
    }
};

const show = async (req, res) => {
    try {
        const profesional = await Profesional.getById(req.params.id);
        if (!profesional) {
            return notFound(res, 'Profesional no encontrado', '/profesionales', 'Volver a profesionales');
        }
        res.render('profesionales/show', { profesional });
    } catch (error) {
        serverError(res, error, '/profesionales', 'Volver a profesionales', 'Error al obtener el detalle del profesional');
    }
};

const createForm = async (req, res) => {
    try {
        const [categorias, zonas] = await Promise.all([
            Categoria.getAll(),
            Zona.getAll()
        ]);
        res.render('profesionales/create', {
            error: null,
            profesional: { available: 1 },
            categorias,
            zonas
        });
    } catch (error) {
        serverError(res, error, '/profesionales', 'Volver a profesionales', 'Error al cargar el formulario');
    }
};

const store = async (req, res) => {
    const name = (req.body.name || '').trim();
    const phone = (req.body.phone || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const license = (req.body.license || '').trim();
    const available = req.body.available ? 1 : 0;
    const category_id = req.body.category_id || null;
    const zone_id = req.body.zone_id || null;

    const problema = validarProfesional({ name, phone, email, license, category_id, zone_id });
    if (problema) {
        const [categorias, zonas] = await Promise.all([
            Categoria.getAll(),
            Zona.getAll()
        ]);
        return res.status(400).render('profesionales/create', {
            error: problema,
            profesional: { name, phone, email, license, available, category_id, zone_id },
            categorias,
            zonas
        });
    }

    try {
        await Profesional.create({ name, phone, email, license, available, category_id, zone_id });
        res.redirect('/profesionales');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const [categorias, zonas] = await Promise.all([Categoria.getAll(), Zona.getAll()]);
            return res.status(400).render('profesionales/create', {
                error: 'Ya existe un profesional con ese email.',
                profesional: { name, phone, email, license, available, category_id, zone_id },
                categorias,
                zonas
            });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return badRequest(res, 'La categoría o la zona elegida no existe.', '/profesionales', 'Volver a profesionales');
        }
        serverError(res, error, '/profesionales', 'Volver a profesionales', 'Error al guardar el profesional');
    }
};

const editForm = async (req, res) => {
    try {
        const [profesional, categorias, zonas] = await Promise.all([
            Profesional.getById(req.params.id),
            Categoria.getAll(),
            Zona.getAll()
        ]);

        if (!profesional) {
            return notFound(res, 'Profesional no encontrado', '/profesionales', 'Volver a profesionales');
        }

        res.render('profesionales/edit', { profesional, categorias, zonas, error: null });
    } catch (error) {
        serverError(res, error, '/profesionales', 'Volver a profesionales', 'Error al cargar el profesional');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const name = (req.body.name || '').trim();
    const phone = (req.body.phone || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const license = (req.body.license || '').trim();
    const available = req.body.available ? 1 : 0;
    const category_id = req.body.category_id || null;
    const zone_id = req.body.zone_id || null;

    const problema = validarProfesional({ name, phone, email, license, category_id, zone_id });
    if (problema) {
        const [categorias, zonas] = await Promise.all([
            Categoria.getAll(),
            Zona.getAll()
        ]);
        return res.status(400).render('profesionales/edit', {
            profesional: { id, name, phone, email, license, available, category_id, zone_id },
            categorias,
            zonas,
            error: problema
        });
    }

    try {
        const filas = await Profesional.update(id, { name, phone, email, license, available, category_id, zone_id });
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Profesional no encontrado', '/profesionales', 'Volver a profesionales');
        }
        res.redirect('/profesionales');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const [categorias, zonas] = await Promise.all([Categoria.getAll(), Zona.getAll()]);
            return res.status(400).render('profesionales/edit', {
                error: 'Ya existe un profesional con ese email.',
                profesional: { id, name, phone, email, license, available, category_id, zone_id },
                categorias,
                zonas
            });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return badRequest(res, 'La categoría o la zona elegida no existe.', '/profesionales', 'Volver a profesionales');
        }
        serverError(res, error, '/profesionales', 'Volver a profesionales', 'Error al actualizar el profesional');
    }
};

const deleteForm = async (req, res) => {
    try {
        const profesional = await Profesional.getById(req.params.id);
        if (!profesional) {
            return notFound(res, 'Profesional no encontrado', '/profesionales', 'Volver a profesionales');
        }
        res.render('profesionales/delete', { profesional });
    } catch (error) {
        serverError(res, error, '/profesionales', 'Volver a profesionales', 'Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        const filas = await Profesional.remove(req.params.id);
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Profesional no encontrado', '/profesionales', 'Volver a profesionales');
        }
        res.redirect('/profesionales');
    } catch (error) {
        // Con el esquema nuevo la base NO deja borrar algo que está en uso (ON DELETE RESTRICT)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return badRequest(res, 'No se puede eliminar el profesional porque tiene solicitudes asignadas. Si ya no trabaja con nosotros, desmarcá "Disponible" para que deje de recibir pedidos.', '/profesionales', 'Volver a profesionales');
        }
        serverError(res, error, '/profesionales', 'Volver a profesionales', 'Error al eliminar el profesional');
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