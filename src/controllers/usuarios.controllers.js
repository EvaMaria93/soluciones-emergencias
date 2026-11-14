const Usuario = require('../models/usuario.model');
const { badRequest, notFound, serverError } = require('../helpers/errores');
const { validarUsuario } = require('../helpers/validaciones');

const index = async (req, res) => {
    try {
        const usuarios = await Usuario.getAll();
        res.render('usuarios/index', { usuarios });
    } catch (error) {
        serverError(res, error, '/usuarios', 'Volver a usuarios', 'Error al obtener los usuarios');
    }
};

const show = async (req, res) => {
    try {
        const usuario = await Usuario.getById(req.params.id);
        if (!usuario) {
            return notFound(res, 'Usuario no encontrado', '/usuarios', 'Volver a usuarios');
        }
        res.render('usuarios/show', { usuario });
    } catch (error) {
        serverError(res, error, '/usuarios', 'Volver a usuarios', 'Error al obtener el detalle del usuario');
    }
};

const createForm = (req, res) => {
    res.render('usuarios/create', { error: null, usuario: {} });
};

const store = async (req, res) => {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const phone = (req.body.phone || '').trim();
    const address = (req.body.address || '').trim();

    const problema = validarUsuario({ name, email, phone, address });
    if (problema) {
        return res.status(400).render('usuarios/create', {
            error: problema,
            usuario: { name, email, phone, address }
        });
    }

    try {
        await Usuario.create({ name, email, phone, address });
        res.redirect('/usuarios');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('usuarios/create', {
                error: 'Ya existe un usuario registrado con ese email.',
                usuario: { name, email, phone, address }
            });
        }
        serverError(res, error, '/usuarios', 'Volver a usuarios', 'Error al guardar el usuario');
    }
};

const editForm = async (req, res) => {
    try {
        const usuario = await Usuario.getById(req.params.id);
        if (!usuario) {
            return notFound(res, 'Usuario no encontrado', '/usuarios', 'Volver a usuarios');
        }
        res.render('usuarios/edit', { usuario, error: null });
    } catch (error) {
        serverError(res, error, '/usuarios', 'Volver a usuarios', 'Error al cargar el usuario');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const phone = (req.body.phone || '').trim();
    const address = (req.body.address || '').trim();

    const problema = validarUsuario({ name, email, phone, address });
    if (problema) {
        return res.status(400).render('usuarios/edit', {
            usuario: { id, name, email, phone, address },
            error: problema
        });
    }

    try {
        const filas = await Usuario.update(id, { name, email, phone, address });
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Usuario no encontrado', '/usuarios', 'Volver a usuarios');
        }
        res.redirect('/usuarios');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('usuarios/edit', {
                usuario: { id, name, email, phone, address },
                error: 'Ya existe otro usuario registrado con ese email.'
            });
        }
        serverError(res, error, '/usuarios', 'Volver a usuarios', 'Error al actualizar el usuario');
    }
};

const deleteForm = async (req, res) => {
    try {
        const usuario = await Usuario.getById(req.params.id);
        if (!usuario) {
            return notFound(res, 'Usuario no encontrado', '/usuarios', 'Volver a usuarios');
        }
        res.render('usuarios/delete', { usuario });
    } catch (error) {
        serverError(res, error, '/usuarios', 'Volver a usuarios', 'Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        const filas = await Usuario.remove(req.params.id);
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Usuario no encontrado', '/usuarios', 'Volver a usuarios');
        }
        res.redirect('/usuarios');
    } catch (error) {
        // Con el esquema nuevo la base NO deja borrar algo que está en uso (ON DELETE RESTRICT)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return badRequest(res, 'No se puede eliminar el cliente porque tiene solicitudes registradas.', '/usuarios', 'Volver a usuarios');
        }
        serverError(res, error, '/usuarios', 'Volver a usuarios', 'Error al eliminar el usuario');
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