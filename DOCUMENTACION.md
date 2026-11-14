# Documentación: esquema v2 y login de administrador

Este documento explica los cambios en lenguaje simple. El código también tiene comentarios en cada parte nueva.

## 1. Idea general

Este proyecto es el **panel de administración** (el "back") de una aplicación de servicios de emergencia
(plomería, electricidad, cerrajería...). Solo el **administrador** entra al panel.
Los clientes y los profesionales son **datos** que el administrador carga y consulta; por eso no tienen contraseña.
Más adelante, una aplicación para clientes y profesionales podrá reutilizar esta misma base de datos.

```

El `DROP` borra todos los datos: sirve para empezar de cero en desarrollo, nunca con datos que te importen.
3. **Crear el primer administrador** (no existe pantalla de registro a propósito):
   ```bash
   npm run crear-admin -- "Tu Nombre" tu@email.com "una-contraseña-de-8-o-más-caracteres"
   ```
4. **Arrancar:** `npm run dev` y abrir http://localhost:3000 (te va a llevar al login).

## 3. La base de datos (7 tablas)

| Tabla | Para qué sirve |
|---|---|
| `administradores` | Quienes pueden entrar al panel (con contraseña encriptada). **Nueva.** |
| `zonas` | Zonas de cobertura. El nombre no se puede repetir. |
| `categorias` | Rubros (Plomería, Electricidad...). El nombre no se puede repetir. |
| `usuarios` | Clientes que piden un servicio. |
| `profesionales` | Quienes realizan el servicio. Email, categoría y zona son obligatorios. |
| `solicitudes` | Los pedidos de emergencia, con su estado y presupuesto. |
| `calificaciones` | Puntaje de 1 a 5 que el cliente da a una solicitud terminada. |



### Flujo de estados de una solicitud
```
pendiente -> presupuestada -> asignada -> en_proceso -> finalizada(en cualquier momento) -> cancelada
```
Reglas que valida el sistema:
- Desde `presupuestada` en adelante hay que elegir un **profesional** y cargar el **presupuesto**.
- Solo se pueden **calificar** solicitudes `finalizadas`, y una sola vez cada una.

## 4. Cómo funciona el login

Navegador -> POST /login -> auth.controllers.js -> busca el admin por email (administrador.model.js)
          -> bcrypt compara la contraseña con el hash guardado
          -> si coincide: se guarda al admin en la sesión y se redirige al inicio
```

| Pieza | Archivo | Qué hace |
|---|---|---|
| Modelo | `src/models/administrador.model.js` | Busca y crea administradores |
| Controlador | `src/controllers/auth.controllers.js` | Login y logout |
| Rutas | `src/routes/auth.router.js` | `/login` y `/logout` (públicas) |
| Middleware | `src/middlewares/auth.js` | `requireAdmin`: si no hay sesión, redirige a `/login` |
| Vista | `src/views/auth/login.ejs` | Formulario de ingreso |
| Script | `scripts/crear-admin.js` | Crea administradores desde la terminal |

**El orden en `index.js` importa:** primero se registran las rutas públicas (`/login`, `/logout`),
después `app.use(requireAdmin)` y recién ahí el resto. Todo lo que está debajo de esa línea exige sesión.

### Medidas de seguridad aplicadas (y por qué)
- **Contraseñas con bcrypt:** en la base se guarda una "huella" irreversible, no la contraseña. Se usa `bcryptjs`
  (JavaScript puro) para evitar problemas de instalación en Windows y en el hosting.
- **Mensaje único de error:** "Email o contraseña incorrectos" tanto si el email no existe como si la clave está mal,
  para no darle pistas a quien intenta adivinar.
- **Cookie de sesión** con `httpOnly` (JavaScript no puede leerla), `sameSite: lax` (no viaja en POST desde otros sitios)
  y `secure` en producción (solo por HTTPS). Dura 2 horas.
- **Sesión nueva al ingresar** (`regenerate`) y cierre de sesión por POST.
- **Sin registro público:** solo se crean administradores con el script.


- **Helpers de errores** (`src/helpers/errores.js`) con pantallas 400, 404 y 500, y manejo global en `index.js`.
- **Borrados protegidos:** si algo está en uso, se muestra "No se puede eliminar ..." en vez de un error técnico.
- **Duplicados:** nombre repetido de zona o categoría, y email repetido de profesional, vuelven al formulario con el aviso.
- **Calificaciones:** el desplegable solo ofrece solicitudes finalizadas.
- **Layout:** el menú y el botón "Cerrar sesión" solo se ven con la sesión iniciada.

## 6. Para el hosting
- Poné `NODE_ENV=production` y un `SESSION_SECRET` propio en las variables de entorno del servidor.
- En el hosting la base ya existe: sacá las líneas `CREATE DATABASE` y `USE` del `schema.sql` antes de importarlo.
- Las sesiones se guardan en memoria del servidor: alcanza para este proyecto, pero se pierden si la app se reinicia.
  Para una versión real se usaría un almacén de sesiones en la base de datos.

## 7. Próximo paso: avisos por mail
Con `nodemailer` (ya instalado) y Mailtrap para las pruebas:
1. Al crear una solicitud → mail a los profesionales disponibles de esa categoría y zona.
2. Al pasar a `presupuestada` → mail al cliente con el presupuesto.
3. Al pasar a `asignada` → mail al profesional: "Te contrataron".

## 8. Validaciones de datos (`src/helpers/validaciones.js`)

Antes solo se controlaba que los campos no estuvieran vacíos. Ahora cada campo tiene reglas.
Se validan en el **servidor** (las que valen de verdad); los formularios además tienen ayudas del navegador
(`minlength`, `maxlength`, `pattern`) para avisar antes de enviar.

| Campo | Regla | Ejemplos |
|---|---|---|
| Nombre de persona | Al menos 2 letras. Solo letras, espacios, `'`, `.` y `-`. Máximo 100 |  María José, O'Connor ·  A, Ana123 |
| Nombre de zona / categoría | Entre 3 y 100 caracteres, con letras (acepta números) |  Gas, Zona 2 ·  A, 123, @@@ |
| Email | Formato `algo@dominio.ext`, sin espacios |  ana@mail.com ·  ana, ana@mail |
| Teléfono | Solo números, espacios, `+`, `-` y paréntesis, con 8 a 15 dígitos |  11 4567-8900, +54 9 11 5555-1234 ·  abc, 12345 |
| Dirección | 5 a 200 caracteres, con calle (letras) y número |  Av. Pavón 5420 ·  Pavón, 12345 |
| Matrícula (opcional) | 2 a 50 caracteres: letras, números, `.`, `-`, `/` |  MAT-45892 ·  @@ |
| Descripción de la solicitud | 10 a 2000 caracteres, con letras |  hola, .......... |
| Descripciones y comentarios (opcionales) | Mínimo 3 caracteres si se escriben, con letras |  ok |
| Presupuesto | Número entre 0 y 99.999.999,99 |  -500, 999999999999 |

