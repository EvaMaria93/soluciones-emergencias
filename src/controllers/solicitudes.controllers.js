const Solicitud = require('../models/solicitud.model');
const Usuario = require('../models/usuario.model');
const Categoria = require('../models/categoria.model');
const Zona = require('../models/zona.model');
const Profesional = require('../models/profesional.model');

const loadFormLists = () => {
    return Promise.all([
        Usuario.getAll(),
        Categoria.getAll(),
        Zona.getAll(),
        Profesional.getAll()
    ]);
};

const index = async (req, res) => {
    try {
        const solicitudes = await Solicitud.getAll();
        res.render('solicitudes/index', { solicitudes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener las solicitudes');
    }
};

const show = async (req, res) => {
    try {
        const solicitud = await Solicitud.getById(req.params.id);
        if (!solicitud) {
            return res.status(404).send('Solicitud no encontrada');
        }
        res.render('solicitudes/show', { solicitud });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener el detalle de la solicitud');
    }
};

const createForm = async (req, res) => {
    try {
        const [usuarios, categorias, zonas, profesionales] = await loadFormLists();
        res.render('solicitudes/create', {
            error: null,
            solicitud: { status: 'pendiente' },
            usuarios,
            categorias,
            zonas,
            profesionales
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el formulario');
    }
};

const store = async (req, res) => {
    const user_id = req.body.user_id || '';
    const category_id = req.body.category_id || null;
    const zone_id = req.body.zone_id || null;
    const professional_id = req.body.professional_id || null;
    const description = (req.body.description || '').trim();
    const address = (req.body.address || '').trim();
    const budget = (req.body.budget || '').trim();
    const status = (req.body.status || 'pendiente').trim();

    if (!user_id || !description || !address) {
        const [usuarios, categorias, zonas, profesionales] = await loadFormLists();
        return res.status(400).render('solicitudes/create', {
            error: 'Cliente, dirección y descripción de la emergencia son obligatorios.',
            solicitud: { user_id, category_id, zone_id, professional_id, description, address, budget, status },
            usuarios,
            categorias,
            zonas,
            profesionales
        });
    }

    try {
        await Solicitud.create({
            user_id,
            category_id,
            zone_id,
            professional_id,
            description,
            address,
            budget,
            status
        });
        res.redirect('/solicitudes');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar la solicitud');
    }
};

const editForm = async (req, res) => {
    try {
        const [solicitud, [usuarios, categorias, zonas, profesionales]] = await Promise.all([
            Solicitud.getById(req.params.id),
            loadFormLists()
        ]);

        if (!solicitud) {
            return res.status(404).send('Solicitud no encontrada');
        }

        res.render('solicitudes/edit', {
            solicitud,
            usuarios,
            categorias,
            zonas,
            profesionales,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la solicitud');
    }
};

const update = async (req, res) => {
    const { id } = req.params;
    const user_id = req.body.user_id || '';
    const category_id = req.body.category_id || null;
    const zone_id = req.body.zone_id || null;
    const professional_id = req.body.professional_id || null;
    const description = (req.body.description || '').trim();
    const address = (req.body.address || '').trim();
    const budget = (req.body.budget || '').trim();
    const status = (req.body.status || 'pendiente').trim();

    if (!user_id || !description || !address) {
        const [usuarios, categorias, zonas, profesionales] = await loadFormLists();
        return res.status(400).render('solicitudes/edit', {
            solicitud: { id, user_id, category_id, zone_id, professional_id, description, address, budget, status },
            usuarios,
            categorias,
            zonas,
            profesionales,
            error: 'Cliente, dirección y descripción de la emergencia son obligatorios.'
        });
    }

    try {
        await Solicitud.update(id, {
            user_id,
            category_id,
            zone_id,
            professional_id,
            description,
            address,
            budget,
            status
        });
        res.redirect('/solicitudes');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar la solicitud');
    }
};

const deleteForm = async (req, res) => {
    try {
        const solicitud = await Solicitud.getById(req.params.id);
        if (!solicitud) {
            return res.status(404).send('Solicitud no encontrada');
        }
        res.render('solicitudes/delete', { solicitud });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        await Solicitud.remove(req.params.id);
        res.redirect('/solicitudes');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al eliminar la solicitud');
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