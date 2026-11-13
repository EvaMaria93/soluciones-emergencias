const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categorias.controllers');

router.get('/', categoriasController.index);
router.get('/create', categoriasController.createForm);
router.post('/', categoriasController.store);
router.get('/:id', categoriasController.show);
router.get('/:id/edit', categoriasController.editForm);
router.put('/:id', categoriasController.update);
router.get('/:id/delete', categoriasController.deleteForm);
router.delete('/:id', categoriasController.destroy);

module.exports = router;