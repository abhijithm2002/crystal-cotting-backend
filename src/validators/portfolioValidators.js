const { body, param } = require('express-validator');

const portfolioValidator = [
  body('title').isString().trim().notEmpty().withMessage('Title is required'),
  body('category').optional().isString(),
  body('location').optional().isString(),
  body('completionDate').optional().isString(),
  body('duration').optional().isString(),
  body('description').optional().isString(),
  body('coverImage').optional().isString(),
  body('images').optional().isArray(),
  body('beforeImage').optional().isString(),
  body('afterImage').optional().isString(),
  body('materials').optional().isArray(),
  body('services').optional().isArray(),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('order').optional().isInt().toInt(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { portfolioValidator, idParamValidator };
