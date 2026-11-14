const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers');

// Estas dos rutas son PÚBLICAS (no pasan por requireAdmin)
router.get('/login', authController.loginForm);
router.post('/login', authController.login);

// Cerrar sesión es POST (y no GET) para que nadie pueda cerrarte la sesión con solo un enlace
router.post('/logout', authController.logout);

module.exports = router;
