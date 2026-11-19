// ==========================================================
// main.controllers.js  ->  Pantalla de inicio ("mesa de guardia")
// ==========================================================
// Reúne los datos de todas las tablas para armar el inicio. Por ahora usamos los getAll() que ya
// existen en los modelos y contamos en JavaScript: con pocos datos es rápido y no hace falta SQL nuevo.
const Solicitud = require('../models/solicitud.model');
const Profesional = require('../models/profesional.model');
const Usuario = require('../models/usuario.model');
const Zona = require('../models/zona.model');
const Categoria = require('../models/categoria.model');
const { serverError } = require('../helpers/errores');

// Convierte una fecha en un texto tipo "hace 3 h" para la cola de espera
const haceCuanto = (fecha) => {
    const minutos = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 60000));
    if (minutos < 1) return 'recién ingresada';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
};

const index = async (req, res) => {
    try {
        // Promise.all pide todo a la base al mismo tiempo (más rápido que una consulta por vez)
        const [solicitudes, profesionales, usuarios, zonas, categorias] = await Promise.all([
            Solicitud.getAll(),
            Profesional.getAll(),
            Usuario.getAll(),
            Zona.getAll(),
            Categoria.getAll()
        ]);

        const contar = (estado) => solicitudes.filter((s) => s.status === estado).length;

        // Las que llevan más tiempo esperando van primero
        const pendientes = solicitudes
            .filter((s) => s.status === 'pendiente')
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        res.render('index', {
            // El recorrido de una solicitud, con cuántas hay en cada paso
            recorrido: [
                { clave: 'pendiente', titulo: 'Pendientes', cantidad: contar('pendiente') },
                { clave: 'presupuestada', titulo: 'Presupuestadas', cantidad: contar('presupuestada') },
                { clave: 'asignada', titulo: 'Asignadas', cantidad: contar('asignada') },
                { clave: 'en_proceso', titulo: 'En proceso', cantidad: contar('en_proceso') },
                { clave: 'finalizada', titulo: 'Finalizadas', cantidad: contar('finalizada') }
            ],
            totalSolicitudes: solicitudes.length,
            enEspera: pendientes.slice(0, 6).map((s) => ({ ...s, hace: haceCuanto(s.created_at) })),
            totalPendientes: pendientes.length,
            accesos: {
                clientes: usuarios.length,
                profesionales: profesionales.length,
                disponibles: profesionales.filter((p) => p.available).length,
                zonas: zonas.length,
                categorias: categorias.length
            }
        });
    } catch (error) {
        serverError(res, error, '/', 'Volver al inicio', 'No se pudo cargar el inicio');
    }
};

module.exports = { index };
