const express = require('express');
const router = express.Router();
const profesionalesController = require('../controllers/profesionales.controllers');

router.get('/', profesionalesController.index);
router.get('/create', profesionalesController.createForm);
router.post('/', profesionalesController.store);
router.get('/:id', profesionalesController.show);
router.get('/:id/edit', profesionalesController.editForm);
router.put('/:id', profesionalesController.update);
router.get('/:id/delete', profesionalesController.deleteForm);
router.delete('/:id', profesionalesController.destroy);

module.exports = router;