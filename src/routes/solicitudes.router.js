const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudes.controllers');

router.get('/', solicitudesController.index);
router.get('/create', solicitudesController.createForm);
router.post('/', solicitudesController.store);
router.get('/:id', solicitudesController.show);
router.get('/:id/edit', solicitudesController.editForm);
router.put('/:id', solicitudesController.update);
router.get('/:id/delete', solicitudesController.deleteForm);
router.delete('/:id', solicitudesController.destroy);

module.exports = router;