const Profesional = require('../models/profesional.model');
const Categoria = require('../models/categoria.model');
const Zona = require('../models/zona.model');

const index = async (req, res) => {
    try {
        const profesionales = await Profesional.getAll();
        res.render('profesionales/index', { profesionales });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los profesionales');
    }
};

const show = async (req, res) => {
    try {
        const profesional = await Profesional.getById(req.params.id);
        if (!profesional) {
            return res.status(404).send('Profesional no encontrado');
        }
        res.render('profesionales/show', { profesional });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener el detalle del profesional');
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
        console.error(error);
        res.status(500).send('Error al cargar el formulario');
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

    if (!name || !phone) {
        const [categorias, zonas] = await Promise.all([
            Categoria.getAll(),
            Zona.getAll()
        ]);
        return res.status(400).render('profesionales/create', {
            error: 'El nombre y el teléfono son obligatorios.',
            profesional: { name, phone, email, license, available, category_id, zone_id },
            categorias,
            zonas
        });
    }

    try {
        await Profesional.create({ name, phone, email, license, available, category_id, zone_id });
        res.redirect('/profesionales');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al guardar el profesional');
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
            return res.status(404).send('Profesional no encontrado');
        }

        res.render('profesionales/edit', { profesional, categorias, zonas, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el profesional');
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

    if (!name || !phone) {
        const [categorias, zonas] = await Promise.all([
            Categoria.getAll(),
            Zona.getAll()
        ]);
        return res.status(400).render('profesionales/edit', {
            profesional: { id, name, phone, email, license, available, category_id, zone_id },
            categorias,
            zonas,
            error: 'El nombre y el teléfono son obligatorios.'
        });
    }

    try {
        await Profesional.update(id, { name, phone, email, license, available, category_id, zone_id });
        res.redirect('/profesionales');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar el profesional');
    }
};

const deleteForm = async (req, res) => {
    try {
        const profesional = await Profesional.getById(req.params.id);
        if (!profesional) {
            return res.status(404).send('Profesional no encontrado');
        }
        res.render('profesionales/delete', { profesional });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        await Profesional.remove(req.params.id);
        res.redirect('/profesionales');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar el profesional');
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