const Zona = require('../models/zona.model');

const index = async (req, res) => {
    try {
        const zonas = await Zona.getAll();
        res.render('zonas/index', { zonas });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener las zonas');
    }
};

const show = async (req, res) => {
    try {
        const zona = await Zona.getById(req.params.id);
        if (!zona) {
            return res.status(404).send('Zona no encontrada');
        }
        res.render('zonas/show', { zona });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener el detalle de la zona');
    }
};

const createForm = (req, res) => {
    res.render('zonas/create', { error: null, zona: {} });
};

const store = async (req, res) => {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    if (!name) {
        return res.status(400).render('zonas/create', {
            error: 'El nombre de la zona es obligatorio.',
            zona: { name, description }
        });
    }

    try {
        await Zona.create({ name, description });
        res.redirect('/zonas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al guardar la zona');
    }
};

const editForm = async (req, res) => {
    try {
        const zona = await Zona.getById(req.params.id);
        if (!zona) {
            return res.status(404).send('Zona no encontrada');
        }
        res.render('zonas/edit', { zona, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la zona');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();

    if (!name) {
        return res.status(400).render('zonas/edit', {
            zona: { id, name, description },
            error: 'El nombre de la zona es obligatorio.'
        });
    }

    try {
        await Zona.update(id, { name, description });
        res.redirect('/zonas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar la zona');
    }
};

const deleteForm = async (req, res) => {
    try {
        const zona = await Zona.getById(req.params.id);
        if (!zona) {
            return res.status(404).send('Zona no encontrada');
        }
        res.render('zonas/delete', { zona });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        await Zona.remove(req.params.id);
        res.redirect('/zonas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar la zona');
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