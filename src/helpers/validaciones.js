// ==========================================================
// validaciones.js  ->  HELPERS para revisar lo que escribe el usuario
// ==========================================================
// Antes solo se controlaba que los campos no estuvieran vacíos, así que se aceptaban
// teléfonos con letras, nombres de una sola letra, emails inventados, etc.
//
// Cada función recibe un texto y devuelve:
//   - un TEXTO con el motivo del error, o
//   - null si está todo bien.
// Así se pueden encadenar con "||": se queda con el primer error que aparezca.
//
// IMPORTANTE: estas validaciones se hacen en el SERVIDOR porque son las que valen.
// Los atributos del formulario (required, minlength, pattern) ayudan a quien usa la pantalla,
// pero cualquiera puede saltearlos, así que nunca alcanzan solos.
//
// Nota: \p{L} significa "cualquier letra" (incluye tildes y ñ) y la "u" final activa ese modo.

const contarLetras = (texto) => (texto.match(/\p{L}/gu) || []).length;

// ---------- Validaciones de un solo campo ----------

// Nombre de una persona: letras, espacios, apóstrofes, puntos y guiones. Mínimo 2 letras.
// Acepta "María José", "O'Connor", "Pérez-Gómez"; rechaza "A", "123" o "Juan@@".
const validarNombrePersona = (valor, etiqueta = 'El nombre') => {
    if (!valor) {
        return `${etiqueta} es obligatorio.`;
    }
    if (valor.length > 100) {
        return `${etiqueta} no puede superar los 100 caracteres.`;
    }
    if (!/^\p{L}[\p{L}\s'.-]*$/u.test(valor) || contarLetras(valor) < 2) {
        return `${etiqueta} debe tener al menos 2 letras y solo puede usar letras, espacios, apóstrofes, puntos y guiones.`;
    }
    return null;
};

// Nombre de una zona o categoría: acepta también números (por ejemplo "Zona 2"). Mínimo 3 caracteres.
const validarNombreCatalogo = (valor, etiqueta) => {
    if (!valor) {
        return `El nombre de la ${etiqueta} es obligatorio.`;
    }
    if (valor.length < 3 || valor.length > 100) {
        return `El nombre de la ${etiqueta} debe tener entre 3 y 100 caracteres.`;
    }
    if (!/^[\p{L}\p{N}][\p{L}\p{N}\s'.,/()-]*$/u.test(valor) || contarLetras(valor) < 2) {
        return `El nombre de la ${etiqueta} solo puede usar letras, números y signos simples, y debe incluir letras.`;
    }
    return null;
};

// Email: formato básico "algo@dominio.ext", sin espacios.
const validarEmail = (valor) => {
    if (!valor) {
        return 'El email es obligatorio.';
    }
    if (valor.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
        return 'El email no tiene un formato válido (ejemplo: nombre@correo.com).';
    }
    return null;
};

// Teléfono: solo dígitos, espacios, +, guiones y paréntesis, con entre 8 y 15 dígitos.
// Acepta "11 4567-8900" y "+54 9 11 5555-1234"; rechaza "abc", "12345" o "11-ab-1234".
const validarTelefono = (valor) => {
    if (!valor) {
        return 'El teléfono es obligatorio.';
    }
    const digitos = (valor.match(/\d/g) || []).length;
    if (valor.length > 30 || !/^\+?[\d\s()-]+$/.test(valor) || digitos < 8 || digitos > 15) {
        return 'El teléfono solo puede tener números, espacios, + y guiones, y entre 8 y 15 dígitos.';
    }
    return null;
};

// Dirección: entre 5 y 200 caracteres, con al menos una letra (calle) y un número (altura).
// OJO: esto NO comprueba que la calle exista ni que pertenezca a la zona elegida. Eso requeriría
// un servicio externo de mapas (geocodificación).
const validarDireccion = (valor, etiqueta = 'La dirección') => {
    if (!valor) {
        return `${etiqueta} es obligatoria.`;
    }
    if (valor.length < 5 || valor.length > 200 || !/\p{L}/u.test(valor) || !/\d/.test(valor)) {
        return `${etiqueta} debe tener entre 5 y 200 caracteres e incluir la calle y el número (ejemplo: Av. Pavón 5420).`;
    }
    return null;
};

// Matrícula profesional (opcional): letras, números, guiones, puntos y barras.
const validarMatricula = (valor) => {
    if (!valor) {
        return null; // es opcional
    }
    if (valor.length < 2 || valor.length > 50 || !/^[\p{L}\p{N}][\p{L}\p{N}\s./-]*$/u.test(valor)) {
        return 'La matrícula debe tener entre 2 y 50 caracteres y solo puede usar letras, números, espacios, puntos, guiones y barras.';
    }
    return null;
};

// Texto libre (descripciones, comentarios). Si es opcional y está vacío, no se controla.
const validarTexto = (valor, { etiqueta, min = 0, max, obligatorio = false }) => {
    if (!valor) {
        return obligatorio ? `${etiqueta} es obligatoria.` : null;
    }
    if (valor.length < min) {
        return `${etiqueta} debe tener al menos ${min} caracteres.`;
    }
    if (valor.length > max) {
        return `${etiqueta} no puede superar los ${max} caracteres.`;
    }
    // Evita textos sin letras como ".........." o "12345": tiene que haber al menos 3 letras.
    // (No puede detectar relleno con letras, como "aaaaaaaa": eso solo lo detecta una persona.)
    if (valor.length >= 3 && contarLetras(valor) < 3) {
        return `${etiqueta} tiene que ser un texto con sentido (con letras).`;
    }
    return null;
};

// ---------- Validaciones por entidad (combinan las de arriba) ----------

const validarUsuario = ({ name, email, phone, address }) =>
    validarNombrePersona(name) ||
    validarEmail(email) ||
    validarTelefono(phone) ||
    (address ? validarDireccion(address) : null); // la dirección del cliente es opcional

const validarProfesional = ({ name, phone, email, license, category_id, zone_id }) =>
    validarNombrePersona(name) ||
    validarTelefono(phone) ||
    validarEmail(email) ||
    validarMatricula(license) ||
    (!category_id || !zone_id ? 'Elegí la especialidad y la zona de cobertura.' : null);

// Sirve para zonas y categorías. "etiqueta" es la palabra que se usa en el mensaje.
const validarCatalogo = ({ name, description }, etiqueta) =>
    validarNombreCatalogo(name, etiqueta) ||
    validarTexto(description, { etiqueta: 'La descripción', min: 3, max: 255 });

const validarComentario = (comment) =>
    validarTexto(comment, { etiqueta: 'El comentario', min: 3, max: 500 });

module.exports = {
    validarNombrePersona,
    validarNombreCatalogo,
    validarEmail,
    validarTelefono,
    validarDireccion,
    validarMatricula,
    validarTexto,
    validarUsuario,
    validarProfesional,
    validarCatalogo,
    validarComentario
};
