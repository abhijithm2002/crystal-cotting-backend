const { body, param } = require('express-validator');

const renameValidator = [
  body('originalName').optional().isString(),
  body('category').optional().isString(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { renameValidator, idParamValidator };
