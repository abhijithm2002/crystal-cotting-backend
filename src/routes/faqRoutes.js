const express = require('express');
const router = express.Router();

const faqController = require('../controllers/faqController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { faqValidator, reorderValidator, idParamValidator } = require('../validators/faqValidators');

router.put('/reorder', requireAuth, reorderValidator, validate, faqController.reorderFAQs);

router.get('/', faqController.listFAQs);
router.post('/', requireAuth, faqValidator, validate, faqController.createFAQ);
router.put('/:id', requireAuth, idParamValidator, faqValidator, validate, faqController.updateFAQ);
router.delete('/:id', requireAuth, idParamValidator, validate, faqController.deleteFAQ);

module.exports = router;
