const Solicitud = require('../models/solicitud.model');
const Usuario = require('../models/usuario.model');
const Categoria = require('../models/categoria.model');
const Zona = require('../models/zona.model');
const Profesional = require('../models/profesional.model');
const { badRequest, notFound, serverError } = require('../helpers/errores');
const { validarDireccion, validarTexto } = require('../helpers/validaciones');
const Mail = require('../services/mail.service');

// Estados permitidos (los mismos que ofrece el formulario). Si llega otro valor, se rechaza.
// Flujo normal: pendiente -> presupuestada -> asignada -> en_proceso -> finalizada (o cancelada)
const ESTADOS = ['pendiente', 'presupuestada', 'asignada', 'en_proceso', 'finalizada', 'cancelada'];

// Estados que ya necesitan un profesional y un presupuesto cargados
const ESTADOS_CON_PROFESIONAL = ['presupuestada', 'asignada', 'en_proceso', 'finalizada'];

// Revisa los datos de la solicitud. Devuelve el texto del error o null si está todo bien.
const validar = ({ user_id, category_id, zone_id, professional_id, description, address, budget, status }) => {
    if (!user_id || !category_id || !zone_id || !description || !address) {
        return 'Cliente, categoría, zona, dirección y descripción de la emergencia son obligatorios.';
    }
    const problemaTexto =
        validarDireccion(address) ||
        validarTexto(description, { etiqueta: 'La descripción de la emergencia', min: 10, max: 2000, obligatorio: true });
    if (problemaTexto) {
        return problemaTexto;
    }
    // El presupuesto es opcional al principio, pero si se escribe tiene que ser un número >= 0
    // (ojo: Number('') da 0, por eso primero se revisa que no esté vacío)
    if (budget !== '' && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
        return 'El presupuesto debe ser un número mayor o igual a 0.';
    }
    // La columna de la base es DECIMAL(10,2): el valor máximo que entra es 99.999.999,99
    if (budget !== '' && Number(budget) > 99999999.99) {
        return 'El presupuesto es demasiado alto (máximo 99.999.999,99).';
    }
    if (!ESTADOS.includes(status)) {
        return 'El estado elegido no es válido.';
    }
    // Desde "presupuestada" en adelante ya tiene que haber un profesional y un presupuesto
    if (ESTADOS_CON_PROFESIONAL.includes(status)) {
        if (!professional_id) {
            return `Para que la solicitud esté "${status}" tenés que elegir el profesional.`;
        }
        if (budget === '') {
            return `Para que la solicitud esté "${status}" tenés que cargar el presupuesto.`;
        }
    }
    return null;
};

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
        serverError(res, error, '/solicitudes', 'Volver a solicitudes', 'Error al obtener las solicitudes');
    }
};

const show = async (req, res) => {
    try {
        const solicitud = await Solicitud.getById(req.params.id);
        if (!solicitud) {
            return notFound(res, 'Solicitud no encontrada', '/solicitudes', 'Volver a solicitudes');
        }
        res.render('solicitudes/show', { solicitud });
    } catch (error) {
        serverError(res, error, '/solicitudes', 'Volver a solicitudes', 'Error al obtener el detalle de la solicitud');
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
        serverError(res, error, '/solicitudes', 'Volver a solicitudes', 'Error al cargar el formulario');
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

    const problema = validar({ user_id, category_id, zone_id, professional_id, description, address, budget, status });
    if (problema) {
        const [usuarios, categorias, zonas, profesionales] = await loadFormLists();
        return res.status(400).render('solicitudes/create', {
            error: problema,
            solicitud: { user_id, category_id, zone_id, professional_id, description, address, budget, status },
            usuarios,
            categorias,
            zonas,
            profesionales
        });
    }

    try {
        const nuevoId = await Solicitud.create({
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

        // El aviso por mail se manda DESPUÉS de responder y sin "await": no demora la pantalla
        // y, si el correo falla, la solicitud igual quedó guardada.
        Mail.avisarNuevaSolicitud(nuevoId, req.session.admin.email);
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return badRequest(res, 'El cliente, la categoría, la zona o el profesional elegido no existe.', '/solicitudes', 'Volver a solicitudes');
        }
        serverError(res, error, '/solicitudes', 'Volver a solicitudes', 'Error al registrar la solicitud');
    }
};

const editForm = async (req, res) => {
    try {
        const [solicitud, [usuarios, categorias, zonas, profesionales]] = await Promise.all([
            Solicitud.getById(req.params.id),
            loadFormLists()
        ]);

        if (!solicitud) {
            return notFound(res, 'Solicitud no encontrada', '/solicitudes', 'Volver a solicitudes');
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
        serverError(res, error, '/solicitudes', 'Volver a solicitudes', 'Error al cargar la solicitud');
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

    const problema = validar({ user_id, category_id, zone_id, professional_id, description, address, budget, status });
    if (problema) {
        const [usuarios, categorias, zonas, profesionales] = await loadFormLists();
        return res.status(400).render('solicitudes/edit', {
            solicitud: { id, user_id, category_id, zone_id, professional_id, description, address, budget, status },
            usuarios,
            categorias,
            zonas,
            profesionales,
            error: problema
        });
    }

    try {
        // Guardamos cómo estaba antes para saber si el estado CAMBIÓ (y recién ahí avisar)
        const anterior = await Solicitud.getById(id);

        const filas = await Solicitud.update(id, {
            user_id,
            category_id,
            zone_id,
            professional_id,
            description,
            address,
            budget,
            status
        });
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Solicitud no encontrada', '/solicitudes', 'Volver a solicitudes');
        }
        res.redirect('/solicitudes');

        // Avisos por mail según el nuevo estado (solo si el estado cambió)
        if (anterior && anterior.status !== status) {
            if (status === 'presupuestada') {
                Mail.avisarPresupuesto(id, req.session.admin.email); // -> cliente
            } else if (status === 'asignada') {
                Mail.avisarAsignacion(id); // -> profesional
            }
        }
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return badRequest(res, 'El cliente, la categoría, la zona o el profesional elegido no existe.', '/solicitudes', 'Volver a solicitudes');
        }
        serverError(res, error, '/solicitudes', 'Volver a solicitudes', 'Error al actualizar la solicitud');
    }
};

const deleteForm = async (req, res) => {
    try {
        const solicitud = await Solicitud.getById(req.params.id);
        if (!solicitud) {
            return notFound(res, 'Solicitud no encontrada', '/solicitudes', 'Volver a solicitudes');
        }
        res.render('solicitudes/delete', { solicitud });
    } catch (error) {
        serverError(res, error, '/solicitudes', 'Volver a solicitudes', 'Error al cargar la confirmación');
    }
};

const destroy = async (req, res) => {
    try {
        const filas = await Solicitud.remove(req.params.id);
        // Si no se modificó ninguna fila, ese id no existe
        if (filas === 0) {
            return notFound(res, 'Solicitud no encontrada', '/solicitudes', 'Volver a solicitudes');
        }
        res.redirect('/solicitudes');
    } catch (error) {
        serverError(res, error, '/solicitudes', 'Volver a solicitudes', 'Error al eliminar la solicitud');
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