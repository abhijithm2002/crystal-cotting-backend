const express = require('express');
const router = express.Router();

const testimonialController = require('../controllers/testimonialController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { testimonialValidator, idParamValidator } = require('../validators/testimonialValidators');

router.get('/', testimonialController.listTestimonials);
router.post('/', requireAuth, testimonialValidator, validate, testimonialController.createTestimonial);
router.put('/:id', requireAuth, idParamValidator, testimonialValidator, validate, testimonialController.updateTestimonial);
router.delete('/:id', requireAuth, idParamValidator, validate, testimonialController.deleteTestimonial);

module.exports = router;
