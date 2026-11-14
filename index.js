// ==========================================
// index.js  ->  PUNTO DE ENTRADA DE LA APLICACIÓN
// ==========================================
require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const session = require('express-session');
const layout = require('express-ejs-layouts');
const methodOverride = require('method-override');

require('./src/models/db'); // abre la conexión con MySQL
const { requireAdmin } = require('./src/middlewares/auth');
const { notFound, serverError } = require('./src/helpers/errores');

const authRouter = require('./src/routes/auth.router');
const mainRouter = require('./src/routes/main.router');
const zonasRouter = require('./src/routes/zonas.router');
const categoriasRouter = require('./src/routes/categorias.router');
const usuariosRouter = require('./src/routes/usuarios.router');
const profesionalesRouter = require('./src/routes/profesionales.router');
const solicitudesRouter = require('./src/routes/solicitudes.router');
const calificacionesRouter = require('./src/routes/calificaciones.router');

const app = express();
const PORT = process.env.PORT || 3000;
const produccion = process.env.NODE_ENV === 'production';

// Sin esta clave no se puede firmar la cookie de sesión: mejor frenar con un aviso claro.
if (!process.env.SESSION_SECRET) {
    console.error('Falta SESSION_SECRET en el archivo .env (usá una frase larga y secreta).');
    process.exit(1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(layout);
app.set('layout', 'layouts/layouts');

// En el hosting la app queda detrás de un proxy (que maneja el HTTPS).
// Hay que avisarle a Express para que acepte la cookie "secure".
if (produccion) {
    app.set('trust proxy', 1);
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// ==========================================
// SESIONES
// ==========================================
// La sesión es la "memoria" del servidor sobre quién inició sesión.
// El navegador guarda solo una cookie con un código; los datos viven en el servidor.
app.use(session({
    name: 'sid_emergencias',
    secret: process.env.SESSION_SECRET,
    resave: false,              // no volver a guardar la sesión si no cambió
    saveUninitialized: false,   // no crear sesión para quien todavía no inició sesión
    cookie: {
        httpOnly: true,         // JavaScript del navegador no puede leer la cookie
        sameSite: 'lax',        // el navegador no la envía en pedidos POST desde otros sitios
        secure: produccion,     // en producción solo viaja por HTTPS
        maxAge: 1000 * 60 * 60 * 2 // la sesión dura 2 horas
    }
}));

// Dejamos al administrador disponible en TODAS las vistas (el layout lo usa para el menú)
app.use((req, res, next) => {
    res.locals.admin = req.session.admin || null;
    next();
});

// ==========================================
// RUTAS
// ==========================================
// 1) Públicas: login y logout
app.use('/', authRouter);

// 2) A partir de acá TODO exige haber iniciado sesión (el orden importa)
app.use(requireAdmin);

app.use('/', mainRouter);
app.use('/zonas', zonasRouter);
app.use('/categorias', categoriasRouter);
app.use('/usuarios', usuariosRouter);
app.use('/profesionales', profesionalesRouter);
app.use('/solicitudes', solicitudesRouter);
app.use('/calificaciones', calificacionesRouter);

// ==========================================
// MANEJO GLOBAL DE ERRORES (van SIEMPRE después de las rutas)
// ==========================================
// 1) Si ninguna ruta coincidió con la dirección pedida, llegamos acá: error 404.
app.use((req, res) => {
    notFound(res, `La página "${req.originalUrl}" no existe`, '/', 'Volver al inicio');
});

// 2) Red de seguridad: atrapa cualquier error que no haya sido controlado en un controlador.
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    serverError(res, error, '/', 'Volver al inicio');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
