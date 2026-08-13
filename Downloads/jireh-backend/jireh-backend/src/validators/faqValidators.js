const { body, param } = require('express-validator');

const faqValidator = [
  body('question').isString().trim().notEmpty().withMessage('Question is required'),
  body('answer').isString().trim().notEmpty().withMessage('Answer is required'),
  body('order').optional().isInt().toInt(),
];

const reorderValidator = [
  body('order').isArray({ min: 1 }).withMessage('order must be a non-empty array of ids'),
  body('order.*').isMongoId().withMessage('order must contain valid ids'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { faqValidator, reorderValidator, idParamValidator };
