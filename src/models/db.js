const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'soluciones_emergencias',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

// Verificación rápida al iniciar el servidor
pool.getConnection()
    .then((connection) => {
        console.log('Conectado a MySQL:', process.env.DB_NAME);
        connection.release();
    })
    .catch((err) => {
        console.error('Error al conectar con MySQL:', err.message);
    });

module.exports = pool;