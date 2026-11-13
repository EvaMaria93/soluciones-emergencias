const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controllers');

router.get('/', usuariosController.index);
router.get('/create', usuariosController.createForm);
router.post('/', usuariosController.store);
router.get('/:id', usuariosController.show);
router.get('/:id/edit', usuariosController.editForm);
router.put('/:id', usuariosController.update);
router.get('/:id/delete', usuariosController.deleteForm);
router.delete('/:id', usuariosController.destroy);

module.exports = router;