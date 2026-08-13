const { body, param } = require('express-validator');

const testimonialValidator = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('location').optional().isString(),
  body('image').optional().isString(),
  body('initials').optional().isString(),
  body('review').optional().isString(),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5').toInt(),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('order').optional().isInt().toInt(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { testimonialValidator, idParamValidator };
