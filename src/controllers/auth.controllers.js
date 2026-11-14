// ==========================================================
// auth.controllers.js  ->  Iniciar y cerrar sesión
// ==========================================================
const bcrypt = require('bcryptjs');
const Administrador = require('../models/administrador.model');
const { serverError } = require('../helpers/errores');

// Hash "de mentira". Si el email no existe igual hacemos una comparación con bcrypt,
// así el tiempo de respuesta es parecido y nadie puede descubrir qué emails están registrados.
const HASH_FALSO = bcrypt.hashSync('contraseña-que-no-existe', 10);

const MENSAJE_INVALIDO = 'Email o contraseña incorrectos.';

// Muestra el formulario de login (GET /login)
const loginForm = (req, res) => {
    if (req.session.admin) {
        return res.redirect('/'); // si ya inició sesión, no tiene sentido ver el login
    }
    res.render('auth/login', { error: null, email: '' });
};

// Procesa el formulario (POST /login)
const login = async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
        return res.status(400).render('auth/login', {
            error: 'Ingresá tu email y tu contraseña.',
            email
        });
    }

    try {
        const admin = await Administrador.getByEmail(email);

        // bcrypt.compare compara la contraseña escrita con el hash guardado en la base
        const coincide = await bcrypt.compare(password, admin ? admin.password_hash : HASH_FALSO);

        // El mismo mensaje para "no existe", "contraseña mal" y "cuenta desactivada":
        // no le damos pistas a quien intenta adivinar.
        if (!admin || !coincide || !admin.activo) {
            return res.status(401).render('auth/login', { error: MENSAJE_INVALIDO, email });
        }

        // regenerate crea una sesión NUEVA al iniciar sesión (evita el robo de sesiones "fijadas")
        req.session.regenerate((error) => {
            if (error) {
                return serverError(res, error, '/login', 'Volver al login');
            }
            // En la sesión guardamos solo lo necesario, NUNCA el hash de la contraseña
            req.session.admin = { id: admin.id, name: admin.name, email: admin.email };
            req.session.save((error) => {
                if (error) {
                    return serverError(res, error, '/login', 'Volver al login');
                }
                res.redirect('/');
            });
        });
    } catch (error) {
        serverError(res, error, '/login', 'Volver al login', 'No se pudo iniciar sesión');
    }
};

// Cierra la sesión (POST /logout)
const logout = (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('sid_emergencias'); // borra la cookie de sesión del navegador
        res.redirect('/login');
    });
};

module.exports = {
    loginForm,
    login,
    logout
};
