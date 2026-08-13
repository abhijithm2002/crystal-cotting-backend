const { body, param } = require('express-validator');

const serviceValidator = [
  body('title').isString().trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('image').optional().isString(),
  body('banner').optional().isString(),
  body('icon').optional().isString(),
  body('accent').optional().isString(),
  body('category').optional().isIn(['main', 'secondary']).withMessage('category must be "main" or "secondary"'),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('features').optional().isArray().withMessage('features must be an array'),
  body('gallery').optional().isArray().withMessage('gallery must be an array'),
  body('order').optional().isInt().toInt(),
];

const reorderValidator = [
  body('order').isArray({ min: 1 }).withMessage('order must be a non-empty array of ids'),
  body('order.*').isMongoId().withMessage('order must contain valid ids'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { serviceValidator, reorderValidator, idParamValidator };
