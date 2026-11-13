const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificaciones.controllers');

router.get('/', calificacionesController.index);
router.get('/create', calificacionesController.createForm);
router.post('/', calificacionesController.store);
router.get('/:id', calificacionesController.show);
router.get('/:id/edit', calificacionesController.editForm);
router.put('/:id', calificacionesController.update);
router.get('/:id/delete', calificacionesController.deleteForm);
router.delete('/:id', calificacionesController.destroy);

module.exports = router;