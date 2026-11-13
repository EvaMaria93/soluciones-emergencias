const express = require('express');
const router = express.Router();
const zonasController = require('../controllers/zonas.controllers');

router.get('/', zonasController.index);
router.get('/create', zonasController.createForm);
router.post('/', zonasController.store);
router.get('/:id', zonasController.show);
router.get('/:id/edit', zonasController.editForm);
router.put('/:id', zonasController.update);
router.get('/:id/delete', zonasController.deleteForm);
router.delete('/:id', zonasController.destroy);

module.exports = router;