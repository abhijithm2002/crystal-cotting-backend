const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/serviceController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { serviceValidator, reorderValidator, idParamValidator } = require('../validators/serviceValidators');

// NOTE: /reorder must be declared before /:id so it isn't swallowed by the param route.
router.put('/reorder', requireAuth, reorderValidator, validate, serviceController.reorderServices);

router.get('/', serviceController.listServices);
router.get('/:id', idParamValidator, validate, serviceController.getService);
router.post('/', requireAuth, serviceValidator, validate, serviceController.createService);
router.put('/:id', requireAuth, idParamValidator, serviceValidator, validate, serviceController.updateService);
router.delete('/:id', requireAuth, idParamValidator, validate, serviceController.deleteService);

module.exports = router;
