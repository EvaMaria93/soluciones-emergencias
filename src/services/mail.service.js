// ==========================================================
// mail.service.js  ->  AVISOS POR MAIL
// ==========================================================
// Un "servicio" agrupa una tarea que no es ni del modelo ni de la vista (acá: mandar correos).
//
// Tres avisos:
//   1) Nueva solicitud   -> le llega al ADMINISTRADOR.
//   2) Presupuesto listo -> le llega al CLIENTE (solicitud pasa a "presupuestada").
//   3) Trabajo asignado  -> le llega al PROFESIONAL (solicitud pasa a "asignada").
//
// REGLAS DE ORO de este archivo:
//   - Los mails se mandan DESPUÉS de responder en pantalla y sin esperar. Si el servidor de correo
//     tarda o falla, el administrador ni se entera: la solicitud ya quedó guardada.
//   - Ninguna función de acá lanza errores hacia afuera: si algo falla, se anota en la consola y listo.
//
// Para pruebas usamos Mailtrap: atrapa TODOS los mails en una bandeja de prueba, sin importar la
// dirección de destino. Así, con datos inventados, no se le escribe a ninguna persona real.

const nodemailer = require('nodemailer');
const Solicitud = require('../models/solicitud.model');

let transporter = null; // se crea una sola vez, la primera vez que se necesita

const smtpConfigurado = () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
    if (!transporter) {
        const port = Number(process.env.SMTP_PORT) || 2525;
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465, // el puerto 465 usa conexión segura desde el inicio
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            // Tiempos máximos de espera: si el servidor de correo no responde, se abandona
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
        });
    }
    return transporter;
};

// ---------- Funciones de ayuda ----------

const dinero = (numero) =>
    '$ ' + Number(numero).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const urlBase = () =>
    (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

const remitente = () =>
    process.env.MAIL_FROM || '"Manos a la Obra" <no-reply@manosalaobra.test>';

// Envía un mail. Devuelve true si salió bien y false si no. NUNCA lanza error.
const enviar = async ({ to, subject, text, replyTo }) => {
    if (!to) {
        console.warn(`[mail] No hay destinatario para "${subject}"`);
        return false;
    }
    if (!smtpConfigurado()) {
        console.warn(`[mail] SMTP sin configurar en el .env: no se envió "${subject}"`);
        return false;
    }
    try {
        await getTransporter().sendMail({
            from: remitente(),
            to,
            replyTo,
            subject: subject.replace(/\s+/g, ' ').trim(), // sin saltos de línea en el asunto
            text
        });
        console.log(`[mail] Enviado a ${to}: ${subject}`);
        return true;
    } catch (error) {
        console.error(`[mail] No se pudo enviar a ${to}:`, error.message);
        return false;
    }
};

// ---------- Los tres avisos ----------
// Reciben el id de la solicitud y buscan los datos en la base. El "adminEmail" es el mail del
// administrador que tiene la sesión iniciada; se usa si no se definió ADMIN_EMAIL en el .env.

// 1) Nueva solicitud -> al administrador
const avisarNuevaSolicitud = async (id, adminEmail) => {
    try {
        const s = await Solicitud.getById(id);
        if (!s) return;

        await enviar({
            to: process.env.ADMIN_EMAIL || adminEmail,
            subject: `Nueva solicitud #${s.id}: ${s.category_name} en ${s.zone_name}`,
            text: [
                `Se registró una nueva solicitud de servicio.`,
                ``,
                `Cliente:      ${s.user_name}`,
                `Teléfono:     ${s.user_phone}`,
                `Email:        ${s.user_email}`,
                `Rubro:        ${s.category_name}`,
                `Zona:         ${s.zone_name}`,
                `Dirección:    ${s.address}`,
                ``,
                `Qué pasó:`,
                `${s.description}`,
                ``,
                `Verla en el panel: ${urlBase()}/solicitudes/${s.id}`
            ].join('\n')
        });
    } catch (error) {
        console.error('[mail] Error al preparar el aviso de nueva solicitud:', error.message);
    }
};

// 2) Presupuesto listo -> al cliente
const avisarPresupuesto = async (id, adminEmail) => {
    try {
        const s = await Solicitud.getById(id);
        if (!s || !s.professional_name || s.budget === null) return;

        await enviar({
            to: s.user_email,
            replyTo: process.env.ADMIN_EMAIL || adminEmail, // si el cliente responde, le llega al administrador
            subject: `Presupuesto para tu solicitud #${s.id}`,
            text: [
                `Hola ${s.user_name},`,
                ``,
                `Ya tenemos el presupuesto para tu pedido de ${s.category_name}:`,
                ``,
                `Profesional:  ${s.professional_name}`,
                `Presupuesto:  ${dinero(s.budget)}`,
                `Dirección:    ${s.address}`,
                ``,
                `Si estás de acuerdo, respondé a este mail y coordinamos la visita.`,
                ``,
                `Soluciones de Emergencia`
            ].join('\n')
        });
    } catch (error) {
        console.error('[mail] Error al preparar el aviso de presupuesto:', error.message);
    }
};

// 3) Trabajo asignado -> al profesional
const avisarAsignacion = async (id) => {
    try {
        const s = await Solicitud.getById(id);
        if (!s || !s.professional_email) return;

        await enviar({
            to: s.professional_email,
            subject: `Trabajo asignado: solicitud #${s.id} (${s.category_name})`,
            text: [
                `Hola ${s.professional_name},`,
                ``,
                `Te asignaron un trabajo:`,
                ``,
                `Cliente:      ${s.user_name}`,
                `Teléfono:     ${s.user_phone}`,
                `Dirección:    ${s.address}`,
                `Zona:         ${s.zone_name}`,
                `Presupuesto:  ${s.budget !== null ? dinero(s.budget) : 'a definir'}`,
                ``,
                `Qué pasó:`,
                `${s.description}`,
                ``,
                `Soluciones de Emergencia`
            ].join('\n')
        });
    } catch (error) {
        console.error('[mail] Error al preparar el aviso de asignación:', error.message);
    }
};

module.exports = {
    avisarNuevaSolicitud,
    avisarPresupuesto,
    avisarAsignacion
};
