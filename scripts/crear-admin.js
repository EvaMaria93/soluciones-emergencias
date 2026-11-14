// ==========================================================
// crear-admin.js  ->  Crea un administrador desde la terminal
// ==========================================================
// No existe una pantalla de "registro" a propósito: solo el dueño de la aplicación
// puede crear administradores, y lo hace con este script.
//
// Uso:
//   npm run crear-admin -- "Nombre Apellido" email@dominio.com "contraseña-de-8-o-más-caracteres"
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const db = require('../src/models/db');
const Administrador = require('../src/models/administrador.model');
const { validarNombrePersona, validarEmail } = require('../src/helpers/validaciones');

const [, , name, email, password] = process.argv;

const salir = async (mensaje, codigo) => {
    console.log(mensaje);
    await db.end(); // cerramos la conexión para que el script termine
    process.exit(codigo);
};

(async () => {
    if (!name || !email || !password) {
        return salir('Uso: npm run crear-admin -- "Nombre" email@dominio.com "contraseña"', 1);
    }
    // Mismas reglas que el resto del panel: evita cargar un email o un nombre inventado por error
    const problema = validarNombrePersona(name.trim()) || validarEmail(email.trim().toLowerCase());
    if (problema) {
        return salir(problema, 1);
    }
    if (password.length < 8) {
        return salir('La contraseña debe tener al menos 8 caracteres.', 1);
    }

    try {
        // El 10 es el "costo": cuánto trabajo hace bcrypt para encriptar. 10 es un valor estándar.
        const passwordHash = await bcrypt.hash(password, 10);
        const id = await Administrador.create({ name, email: email.trim().toLowerCase(), passwordHash });
        await salir(`Administrador creado con id ${id}`, 0);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return salir('Ya existe un administrador con ese email.', 1);
        }
        await salir('No se pudo crear el administrador: ' + error.message, 1);
    }
})();
