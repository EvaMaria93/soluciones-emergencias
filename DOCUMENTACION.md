# Documentación de los cambios realizados 

## 1. Introducción y objetivo del trabajo

En esta etapa del proyecto estuve trabajando en mejoras de la estructura de la base de datos y en la implementación del inicio de sesión para el administrador.

El proyecto consiste en un panel de administración para una aplicación de servicios de emergencia, como plomería, electricidad y cerrajería.

La idea es que solamente el administrador pueda ingresar al panel, ya que es quien se encarga de gestionar los clientes, los profesionales, las zonas, las categorías y las solicitudes de servicio.

Por este motivo, decidí implementar un sistema de autenticación únicamente para el administrador. Los clientes y los profesionales se registran como datos dentro del sistema, pero no necesitan tener una contraseña para esta parte del proyecto.

También trabajé en diferentes validaciones y mejoras para evitar errores al cargar información y proteger los datos que ya se encuentran relacionados dentro de la base de datos.

## 2. Preparación y puesta en marcha del proyecto

Para poder ejecutar el proyecto correctamente, primero preparé las dependencias y la configuración necesaria.

Los pasos que realicé fueron los siguientes:

1. Ejecuté `npm install` para instalar las dependencias del proyecto.
2. Configuré el archivo `.env` tomando como referencia `.env-subir`. Allí completé los datos de conexión a MySQL mediante `DB_PASSWORD` y agregué `SESSION_SECRET`, que se utiliza para proteger las sesiones.
3. Preparé la base de datos ejecutando el archivo `database/schema.sql`.

Para crear nuevamente la base de datos desde cero en el entorno de desarrollo utilicé:

```sql
DROP DATABASE IF EXISTS soluciones_emergencias;
```

Después ejecuté:

```bash
mysql -u root -p < database/schema.sql
```

**Importante:** el comando `DROP DATABASE` elimina toda la información existente. Por eso lo utilicé únicamente para reiniciar la base de datos durante el desarrollo.

4. Para crear el primer administrador utilicé un script desde la terminal:

```bash
npm run crear-admin -- "Tu Nombre" tu@email.com "una-contraseña-de-8-o-más-caracteres"
```

Decidí que los administradores se creen de esta manera porque no quería dejar habilitado un registro público desde el panel.

5. Finalmente, inicié el servidor con:

```bash
npm run dev
```

Y accedí desde el navegador a `http://localhost:3000`.

## 3. Modificaciones realizadas en la base de datos

Una de las tareas principales fue modificar el esquema de la base de datos. En esta versión trabajé con un total de 7 tablas.

Cada tabla tiene una responsabilidad dentro del sistema:

| Tabla | Función |
|---|---|
| `administradores` | Almacena los datos de las personas que pueden ingresar al panel, incluyendo su contraseña encriptada. |
| `zonas` | Almacena las zonas de cobertura disponibles. |
| `categorias` | Contiene los rubros de los servicios, como plomería y electricidad. |
| `usuarios` | Guarda la información de los clientes que solicitan un servicio. |
| `profesionales` | Almacena los datos de los profesionales que realizan los trabajos. |
| `solicitudes` | Registra los pedidos de emergencia, sus estados y presupuestos. |
| `calificaciones` | Guarda las puntuaciones que los clientes asignan a las solicitudes finalizadas. |

### 3.1. Mejoras realizadas respecto de la versión anterior

Durante la revisión de la base de datos encontré algunos puntos que necesitaban mejoras. Por eso realicé los siguientes cambios:

**Protección de los registros relacionados**

Modifiqué las restricciones de las relaciones para evitar que se eliminen datos que todavía están siendo utilizados.

Anteriormente, al eliminar un cliente también podían eliminarse sus solicitudes relacionadas. Para evitar la pérdida de información, incorporé `ON DELETE RESTRICT`.

De esta manera, si un registro está relacionado con otros datos, el sistema no permite eliminarlo.

**Validaciones directamente en la base de datos**

También agregué restricciones para controlar que los datos ingresados sean correctos:

- Utilicé `ENUM` para limitar los estados posibles de una solicitud.
- Incorporé una validación `CHECK` para evitar presupuestos negativos.
- Agregué otra validación `CHECK` para que las calificaciones solamente acepten valores entre 1 y 5.

**Evitar datos duplicados**

Agregué restricciones `UNIQUE` para evitar que se repitan:

- Los nombres de las zonas.
- Los nombres de las categorías.
- Los emails de los profesionales.

**Corrección de problemas con caracteres especiales**

También incorporé `SET NAMES utf8mb4;` al comienzo del archivo `schema.sql`.

Esto lo hice porque había detectado problemas al guardar o mostrar caracteres especiales, como las tildes y la letra ñ.

Por ejemplo, en algunos casos aparecían textos como `PlomerÃ­a` en lugar de `Plomería`.

Con esta configuración mejoré el manejo de los caracteres en la comunicación con MySQL.

### 3.2. Flujo de estados de las solicitudes

También trabajé sobre el flujo de estados que puede tener una solicitud dentro del sistema.

El recorrido normal es el siguiente:

```text
pendiente
    ↓
presupuestada
    ↓
asignada
    ↓
en_proceso
    ↓
finalizada
```

Además, una solicitud puede pasar al estado `cancelada`.

Incorporé las siguientes reglas:

- A partir del estado `presupuestada`, es obligatorio seleccionar un profesional y cargar un presupuesto.
- Solamente se pueden calificar las solicitudes que se encuentran en estado `finalizada`.
- Cada solicitud puede recibir una sola calificación.

Esto permite mantener un orden en el proceso y evita que se realicen operaciones que no corresponden al estado actual de la solicitud.

## 4. Implementación del inicio de sesión del administrador

Otra de las tareas importantes fue implementar el sistema de login.

El objetivo fue restringir el acceso al panel para que solamente puedan ingresar los administradores que tengan una cuenta creada.

Para organizar esta funcionalidad separé las responsabilidades en diferentes archivos, siguiendo la estructura que venía utilizando en el proyecto.

### 4.1. Archivos que trabajé

| Archivo | Función |
|---|---|
| `src/models/administrador.model.js` | Se encarga de buscar y crear administradores en la base de datos. |
| `src/controllers/auth.controllers.js` | Contiene la lógica para iniciar y cerrar sesión. |
| `src/routes/auth.router.js` | Define las rutas `/login` y `/logout`. |
| `src/middlewares/auth.js` | Comprueba si existe una sesión de administrador antes de permitir el acceso. |
| `src/views/auth/login.ejs` | Contiene el formulario de inicio de sesión. |
| `scripts/crear-admin.js` | Permite crear administradores desde la terminal. |

### 4.2. Funcionamiento del login

El funcionamiento es el siguiente:

1. El administrador ingresa su email y contraseña desde el formulario.
2. El navegador envía los datos mediante una solicitud `POST` a `/login`.
3. El controlador recibe la información y consulta el modelo para buscar al administrador por su email.
4. Si encuentra la cuenta, utiliza `bcrypt` para comparar la contraseña ingresada con el hash almacenado en la base de datos.
5. Si los datos coinciden, se crea la sesión del administrador.
6. Finalmente, el sistema redirige al usuario al inicio del panel.

Si los datos no coinciden, se muestra un mensaje indicando que el email o la contraseña son incorrectos.

### 4.3. Protección de las rutas

También trabajé en la protección de las rutas utilizando un middleware llamado `requireAdmin`.

Su función es comprobar si el usuario tiene una sesión iniciada.

Si no existe una sesión válida, el sistema lo redirige al login.

Un detalle importante fue respetar el orden de registro de las rutas en `index.js`.

Primero registré las rutas públicas, como `/login` y `/logout`. Después incorporé:

```javascript
app.use(requireAdmin);
```

De esta manera, las rutas que se encuentran debajo de ese middleware requieren que el administrador haya iniciado sesión.

### 4.4. Medidas de seguridad implementadas

Durante esta parte también tuve en cuenta algunas medidas de seguridad:

- **Encriptación de contraseñas:** utilicé `bcryptjs` para almacenar un hash de la contraseña en lugar de guardar la contraseña original.
- **Mensajes de error:** utilicé el mismo mensaje para cuando el email no existe o la contraseña es incorrecta. Así no se proporciona información innecesaria sobre las cuentas registradas.
- **Protección de cookies:** configuré `httpOnly` para evitar que JavaScript pueda acceder a la cookie de sesión, `sameSite: lax` y `secure` en producción para permitir su envío únicamente mediante HTTPS.
- **Duración de la sesión:** configuré una duración de 2 horas.
- **Regeneración de sesión:** al iniciar sesión se genera una sesión nueva mediante `regenerate`.
- **Cierre de sesión:** implementé el logout mediante una solicitud `POST`.
- **Sin registro público:** los administradores se crean únicamente desde el script de la terminal.

## 5. Otras mejoras realizadas en el código

Además de los cambios anteriores, realicé algunas mejoras para que el sistema pueda manejar mejor los errores y las operaciones del usuario.

**Manejo de errores**

Creé el archivo `src/helpers/errores.js`, donde organicé las respuestas para los errores 400, 404 y 500.

También incorporé un manejo global de errores en `index.js` para evitar que los errores se muestren de manera desordenada.

**Protección al eliminar registros**

Mejoré el manejo de los borrados. Cuando un registro está relacionado con otros datos y no puede eliminarse, el sistema muestra un mensaje entendible en lugar de mostrar un error técnico.

**Control de datos duplicados**

Agregué controles para evitar que se registren nombres de zonas o categorías repetidos, y emails duplicados de profesionales.

Cuando ocurre alguno de estos casos, el sistema vuelve al formulario y muestra el aviso correspondiente.

**Calificaciones**

Modifiqué el desplegable de solicitudes para que solamente muestre aquellas que se encuentran finalizadas.

**Diseño del panel**

También adapté el layout para que el menú y el botón de cerrar sesión solamente aparezcan cuando el administrador tiene una sesión iniciada.

## 6. Configuración para el hosting

También tuve en cuenta los cambios necesarios para poder ejecutar el proyecto en un entorno de producción.

Para esto hay que configurar las siguientes variables de entorno en el hosting:

```env
NODE_ENV=production
SESSION_SECRET=una-frase-segura-y-propia
```

En relación con la base de datos, como el hosting ya dispone de una base creada, es necesario quitar las instrucciones `CREATE DATABASE` y `USE` del archivo `schema.sql` antes de importarlo.

Por otro lado, actualmente las sesiones se almacenan en la memoria del servidor. Para esta etapa del proyecto es suficiente, aunque si el servidor se reinicia las sesiones se pierden.

Para una versión más avanzada se podría implementar un almacenamiento de sesiones directamente en la base de datos.

## 7. Validaciones de datos

Otra de las mejoras que realicé fue trabajar sobre las validaciones de los formularios.

Anteriormente, el sistema controlaba principalmente que los campos no estuvieran vacíos. En esta versión agregué reglas más específicas para controlar el formato y la cantidad de caracteres permitidos.

Organicé estas validaciones en:

`src/helpers/validaciones.js`

Las validaciones principales son las siguientes:

| Campo | Validación implementada |
|---|---|
| Nombre de persona | Debe tener al menos 2 letras y admite espacios, apóstrofes, puntos y guiones. Máximo 100 caracteres. |
| Nombre de zona o categoría | Debe tener entre 3 y 100 caracteres y contener letras. También admite números. |
| Email | Debe respetar un formato de correo electrónico válido y no contener espacios. |
| Teléfono | Admite números, espacios, signos +, -, paréntesis y debe tener entre 8 y 15 dígitos. |
| Dirección | Debe tener entre 5 y 200 caracteres e incluir una calle y una numeración. |
| Matrícula | Es opcional. Si se completa, debe tener entre 2 y 50 caracteres y admite letras, números, puntos, guiones y barras. |
| Descripción de la solicitud | Debe tener entre 10 y 2000 caracteres. |
| Descripciones y comentarios | Son opcionales, pero si se completan deben tener al menos 3 caracteres. |
| Presupuesto | Debe ser un número entre 0 y 99.999.999,99. |

### 7.1. Validaciones del servidor y del navegador

Decidí realizar las validaciones principalmente en el servidor, porque es donde realmente se debe controlar que los datos sean correctos.

También agregué atributos en los formularios HTML, como:

- `minlength`
- `maxlength`
- `pattern`

Estos atributos permiten que el navegador le muestre al usuario algunas advertencias antes de enviar el formulario.

De esta manera, se cuenta con una primera validación en el navegador y otra más importante en el servidor.

### 7.2. Limitaciones de las validaciones

También tuve en cuenta que no todos los datos se pueden validar automáticamente.

Por ejemplo, el sistema puede comprobar que una dirección tenga una calle y una numeración, pero no puede confirmar por sí solo que esa calle pertenezca realmente a la zona seleccionada.

Para eso sería necesario integrar un servicio externo de mapas o geolocalización, como Google Maps.

Otro caso son los textos sin sentido que contienen letras, por ejemplo `aaaaaaaa`. Aunque cumplen con algunas reglas de formato, no siempre es posible detectar automáticamente que no son una descripción válida.

## 8. Implementación de avisos automáticos por email

Otra funcionalidad que incorporé fue el envío de notificaciones automáticas por correo electrónico.

Para organizar esta parte creé el archivo:

`src/services/mail.service.js`

La idea es que las personas involucradas reciban información cuando ocurre algún cambio importante dentro de una solicitud.

### 8.1. Notificaciones implementadas

Actualmente el sistema contempla tres tipos de avisos:

| Situación | Destinatario | Información enviada |
|---|---|---|
| Se registra una nueva solicitud | Administrador | Datos del cliente, rubro, zona, dirección, descripción del problema y enlace al panel. |
| La solicitud pasa a presupuestada | Cliente | Información del profesional seleccionado y presupuesto. Si responde, se notifica al administrador. |
| La solicitud pasa a asignada | Profesional | Datos del cliente, dirección y presupuesto. |

También agregué una condición para que los avisos relacionados con los estados solamente se envíen cuando realmente cambia el estado de la solicitud.

Esto evita que se envíen correos innecesarios cuando simplemente se guarda una modificación sin cambiar el estado.

### 8.2. Decisiones tomadas para el envío de correos

Al implementar esta funcionalidad tuve en cuenta algunos detalles:

- **No bloquear el funcionamiento del sistema:** los correos se envían después de responder a la operación principal, sin hacer esperar al usuario.
- **Manejo de errores:** si ocurre un problema con el servicio de correo, la solicitud ya queda guardada y el error se registra en la consola.
- **Texto plano:** los mensajes se envían en texto plano, sin HTML, para mantener un formato sencillo y evitar posibles problemas con contenido ingresado desde los formularios.

### 8.3. Configuración del servicio de correo

Para configurar el envío de correos agregué las siguientes variables al archivo `.env`:

```env
SMTP_HOST=
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=

ADMIN_EMAIL=

APP_URL=http://localhost:3000
```

Los datos SMTP se obtienen desde Mailtrap, que utilizo como servicio de pruebas.

`ADMIN_EMAIL` es opcional. Si no se completa, el sistema utiliza el email de la cuenta con la que se inició sesión.

`APP_URL` permite generar los enlaces que se incluyen en los correos. En producción debe reemplazarse por la dirección real de la aplicación.

### 8.4. ¿Por qué utilicé Mailtrap?

Para realizar las pruebas decidí utilizar Mailtrap porque permite probar el envío de correos sin enviarlos realmente a las direcciones de destino.

Esto es importante porque los datos utilizados durante el desarrollo son ficticios y no quería que los mensajes terminaran llegando a personas reales.

El sistema genera los correos con la dirección del cliente o del profesional correspondiente, pero Mailtrap los intercepta y los muestra en una bandeja de pruebas.

Cuando el proyecto pase a producción, se deberán reemplazar los datos SMTP por los de un servicio de correo real.

### 8.5. Pasos para probar las notificaciones

Para comprobar que esta funcionalidad funciona correctamente, los pasos son:

1. Crear una cuenta gratuita en [Mailtrap](https://mailtrap.io/).
2. Ingresar a la sección `Sandboxes → My Inbox`.
3. Ir a `SMTP Settings` y copiar los datos de conexión.
4. Completar las variables correspondientes en el archivo `.env`.
5. Reiniciar el servidor.
6. Crear una nueva solicitud y verificar que llegue el aviso al administrador.
7. Cambiar el estado de la solicitud a `presupuestada` y comprobar el correo enviado al cliente.
8. Cambiar posteriormente el estado a `asignada` y verificar el aviso destinado al profesional.

---

## 9. Conclusión

En esta etapa pude avanzar con varias mejoras importantes del proyecto.

Trabajé en la organización de la base de datos, agregué restricciones para proteger la información, implementé el login del administrador y mejoré el control de acceso a las diferentes rutas.

También incorporé validaciones más completas para los formularios, mejoré el manejo de errores y agregué el envío de notificaciones automáticas por correo electrónico.

Con estos cambios busqué que el sistema sea más seguro, organizado y confiable, evitando errores en la carga de información y mejorando la comunicación entre el administrador, los clientes y los profesionales.

Además, esta versión deja una estructura preparada para continuar ampliando el proyecto e incorporar nuevas funcionalidades en futuras etapas.