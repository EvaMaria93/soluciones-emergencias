// ==========================================================
// auth.js  ->  MIDDLEWARE que protege el panel
// ==========================================================
// Un middleware es una función que se ejecuta ANTES de llegar a la ruta.
// Este revisa si hay un administrador con sesión iniciada:
//   - Si lo hay, deja pasar (next()).
//   - Si no, lo manda a la pantalla de login.
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    }
    res.redirect('/login');
};

module.exports = { requireAdmin };
