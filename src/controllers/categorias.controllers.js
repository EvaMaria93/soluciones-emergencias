const Categoria = require('../models/categoria.model');
const { badRequest, notFound, serverError } = require('../helpers/errores');
const { validarCatalogo } = require('../helpers/validaciones');

const index = async (req, res) => {
    try {
        const categorias = await Categoria.getAll();
        res.render('categorias/index', { categorias });
    } catch (error) {
        serverError(res, error, '/categorias', 'Volver a categorías', 'Error al obtener las categorías');
    }
};

const show = async (req, res) => {
    try {
        const categoria = await Categoria.getById(req.params.id);
        if (!categoria) {
            return notFound(res, 'Categoría no encontrada', '/categorias', 'Volver a categorías');
        }
        res.render('categorias/show', { categoria });
    } catch (error) {
        serverError(res, error, '/categorias', 'Volver a categorías', 'Error al obtener el detalle de la categoría');
    }
};

const createForm = (req, res) => {
    res.render('categorias/create', { error: null, categoria: {} });
};

const store = async (req, res) => {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    const problema = validarCatalogo({ name, description }, 'categoría');
    if (problema) {
        return res.status(400).render('categorias/create', {
            error: problema,
            categoria: { name, description }
        });
    }

    try {
        await Categoria.create({ name, description });
        res.redirect('/categorias');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('categorias/create', {
                error: 'Ya existe la categoría con ese nombre.',
                categoria: { name, description }
            });
        }
        serverError(res, error, '/categorias', 'Volver a categorías', 'Error al guardar la categoría');
    }
};

const editForm = async (req, res) => {
    try {
        const categoria = await Categoria.getById(req.params.id);
        if (!categoria) {
            return notFound(res, 'Categoría no encontrada', '/categorias', 'Volver a categorías');
        }
        res.render('categorias/edit', { categoria, error: null });
    } catch (error) {
        serverError(res, error, '/categorias', 'Volver a categorías', 'Error al cargar la categoría');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    const problema = validarCatalogo({ name, description }, 'categoría');
    if (problema) {
        return res.status(400).render('categorias/edit', {
            categoria: { id, name, description },
            error: problema
        });
    }

    try {
        const filas = await Categoria.update(id, { name, description });
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Categoría no encontrada', '/categorias', 'Volver a categorías');
        }
        res.redirect('/categorias');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('categorias/edit', {
                categoria: { id, name, description },
                error: 'Ya existe la categoría con ese nombre.'
            });
        }
        serverError(res, error, '/categorias', 'Volver a categorías', 'Error al actualizar la categoría');
    }
};

const deleteForm = async (req, res) => {
    try {
        const categoria = await Categoria.getById(req.params.id);
        if (!categoria) {
            return notFound(res, 'Categoría no encontrada', '/categorias', 'Volver a categorías');
        }
        res.render('categorias/delete', { categoria });
    } catch (error) {
        serverError(res, error, '/categorias', 'Volver a categorías', 'Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        const filas = await Categoria.remove(req.params.id);
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Categoría no encontrada', '/categorias', 'Volver a categorías');
        }
        res.redirect('/categorias');
    } catch (error) {
        // Con el esquema nuevo la base NO deja borrar algo que está en uso (ON DELETE RESTRICT)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return badRequest(res, 'No se puede eliminar la categoría porque hay profesionales o solicitudes que la usan.', '/categorias', 'Volver a categorías');
        }
        serverError(res, error, '/categorias', 'Volver a categorías', 'Error al eliminar la categoría');
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