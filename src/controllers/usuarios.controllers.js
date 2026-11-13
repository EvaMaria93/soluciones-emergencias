const Usuario = require('../models/usuario.model');

const index = async (req, res) => {
    try {
        const usuarios = await Usuario.getAll();
        res.render('usuarios/index', { usuarios });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los usuarios');
    }
};

const show = async (req, res) => {
    try {
        const usuario = await Usuario.getById(req.params.id);
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.render('usuarios/show', { usuario });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener el detalle del usuario');
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

    if (!name || !email || !phone) {
        return res.status(400).render('usuarios/create', {
            error: 'Nombre, email y teléfono son obligatorios.',
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
        console.error(error);
        res.status(500).send('Error al guardar el usuario');
    }
};

const editForm = async (req, res) => {
    try {
        const usuario = await Usuario.getById(req.params.id);
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.render('usuarios/edit', { usuario, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el usuario');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const phone = (req.body.phone || '').trim();
    const address = (req.body.address || '').trim();

    if (!name || !email || !phone) {
        return res.status(400).render('usuarios/edit', {
            usuario: { id, name, email, phone, address },
            error: 'Nombre, email y teléfono son obligatorios.'
        });
    }

    try {
        await Usuario.update(id, { name, email, phone, address });
        res.redirect('/usuarios');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('usuarios/edit', {
                usuario: { id, name, email, phone, address },
                error: 'Ya existe otro usuario registrado con ese email.'
            });
        }
        console.error(error);
        res.status(500).send('Error al actualizar el usuario');
    }
};

const deleteForm = async (req, res) => {
    try {
        const usuario = await Usuario.getById(req.params.id);
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.render('usuarios/delete', { usuario });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        await Usuario.remove(req.params.id);
        res.redirect('/usuarios');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar el usuario');
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