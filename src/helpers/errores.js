// ==========================================================
// errores.js  ->  HELPERS (funciones de ayuda) para mostrar errores
// ==========================================================
// Un helper es una función chica que se usa en muchos lugares.
// Antes, cada controlador respondía los errores a su manera:
//     res.status(404).send('Zona no encontrada');   <- texto suelto, sin diseño
// Ahora todos usan estas tres funciones, que muestran una pantalla de error
// completa (con el menú) y un botón para volver.
//
// Los códigos HTTP significan:
//   400 = el usuario mandó datos incorrectos
//   404 = lo que se buscó no existe
//   500 = falló algo del lado del servidor (base de datos caída, error de código...)

// 400: datos incorrectos (por ejemplo, un id de categoría que no existe)
const badRequest = (res, mensaje, volver = '/', textoVolver = 'Volver al inicio') => {
    res.status(400).render('errors/400', { message: mensaje, volver, textoVolver });
};

// 404: no se encontró lo pedido
const notFound = (res, mensaje, volver = '/', textoVolver = 'Volver al inicio') => {
    res.status(404).render('errors/404', { message: mensaje, volver, textoVolver });
};

// 500: error interno.
// El detalle técnico del error SOLO se guarda en la consola del servidor (console.error):
// nunca se le muestra al usuario, porque podría revelar datos internos del sistema.
const serverError = (
    res,
    error,
    volver = '/',
    textoVolver = 'Volver al inicio',
    mensaje = 'Ocurrió un error interno. Intentá de nuevo más tarde.'
) => {
    console.error(error);
    res.status(500).render('errors/500', { message: mensaje, volver, textoVolver });
};

module.exports = {
    badRequest,
    notFound,
    serverError
};
