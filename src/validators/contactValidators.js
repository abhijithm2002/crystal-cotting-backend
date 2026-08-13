const { body, param } = require('express-validator');

const contactPageValidator = [
  body('phone').optional().isString(),
  body('phoneHref').optional().isString(),
  body('whatsapp').optional().isString(),
  body('whatsappHref').optional().isString(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('address').optional().isString(),
  body('hours').optional().isString(),
  body('mapQuery').optional().isString(),
  body('mapEmbedUrl').optional().isString(),
  body('banner').optional().isString(),
];

const contactMessageValidator = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('phone').optional().isString(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('service').optional().isString(),
  body('message').optional().isString(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { contactPageValidator, contactMessageValidator, idParamValidator };
